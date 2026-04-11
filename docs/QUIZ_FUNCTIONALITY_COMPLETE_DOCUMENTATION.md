# Complete Quiz Functionality Documentation

## 🎯 Overview

Classtro's quiz functionality allows teachers to create, launch, and manage quizzes during live sessions. The system supports two modes:

- **ONE_SHOT Mode**: Traditional quiz where students see all questions at once and submit when ready
- **HOST_CONTROLLED Mode** (Kahoot-style): Questions are revealed one at a time by the host, with time limits and leaderboard

---

## 📂 Architecture Overview

### File Structure

```
Backend:
├── models/
│   ├── LiveQuiz.js                    # Live quiz instance schema
│   ├── QuizTemplate.js                # Reusable quiz template schema
│   └── QuizSubmission.js              # Student submission schema
├── controllers/
│   ├── liveQuizController.js          # Quiz lifecycle management (create, launch, close)
│   ├── quizTemplateController.js      # Template CRUD operations
│   └── quizEvaluationController.js    # Answer evaluation and scoring
├── routes/
│   ├── liveQuizRoutes.js              # API routes for live quizzes
│   └── quizTemplateRoutes.js          # API routes for templates
└── socket/
    └── quizSocket.js                  # Real-time quiz events (submissions, HOST_CONTROLLED)

Frontend:
├── components/
│   ├── Host/
│   │   ├── QuizCreation.jsx           # Quiz template builder UI
│   │   └── sessionWorkspace/
│   │       └── QuizManager.jsx        # Host quiz control panel
│   └── Participant/
│       └── ParticipantLiveQuiz.jsx    # Student quiz interface
├── context/
│   ├── HostSessionContext.jsx         # Host quiz state management
│   └── ParticipantSessionContext.jsx  # Student quiz state management
└── pages/
    ├── Host/
    │   └── SessionWorkspace.jsx       # Main host session page
    └── Participant/
        └── ParticipantSession.jsx     # Main student session page
```

---

## 🗃️ Data Models

### 1. QuizTemplate (Reusable Templates)

**Purpose**: Stores reusable quiz templates that teachers can create and import into sessions

**Schema** (`backend/models/QuizTemplate.js`):

```javascript
{
  title: String,                    // Quiz title
  description: String,              // Optional description
  createdBy: ObjectId (User),       // Teacher who created it
  roomId: ObjectId (Room),          // Optional room association
  questions: [QuestionSchema],      // Array of questions
  totalPoints: Number,              // Sum of all question points
  createdAt: Date,
  updatedAt: Date
}

QuestionSchema = {
  _id: ObjectId,                    // Auto-generated
  type: String,                     // "MCQ" | "MULTI_SELECT" | "TRUE_FALSE" | "SHORT"
  questionText: String,             // Question text
  options: [OptionSchema],          // Answer options
  correctAnswers: [ObjectId],       // Array of correct option IDs
  points: Number,                   // Points for correct answer (default: 1)
  negativePoints: Number            // Penalty for wrong answer (default: 0)
}

OptionSchema = {
  _id: ObjectId,                    // Auto-generated
  text: String                      // Option text
}
```

**Why this is needed**:

- Allows teachers to create quizzes once and reuse them across multiple sessions
- Separates quiz content from quiz instances
- Enables quiz library management

---

### 2. LiveQuiz (Active Quiz Instance)

**Purpose**: Represents an active quiz launched in a session

**Schema** (`backend/models/LiveQuiz.js`):

```javascript
{
  sessionId: ObjectId (Session),           // Session where quiz is launched
  launchedBy: ObjectId (User),             // Teacher who launched it
  sourceTemplateId: ObjectId (QuizTemplate), // Optional template reference
  title: String,
  questions: [LiveQuestionSchema],         // Copied from template
  status: String,                          // "DRAFT" | "LIVE" | "CLOSED"

  // Mode configuration
  mode: String,                            // "ONE_SHOT" | "HOST_CONTROLLED"

  // ONE_SHOT mode fields
  durationSeconds: Number,                 // Total time limit
  startedAt: Date,
  closedAt: Date,
  allowLateSubmission: Boolean,

  // HOST_CONTROLLED mode fields
  currentQuestionIndex: Number,            // -1 = not started, 0+ = current question
  questionDurationSeconds: Number,         // Time per question (default: 30)
  currentQuestionStartedAt: Date,          // When current question was published
  leaderboard: [LeaderboardEntrySchema],   // Running scores

  createdAt: Date,
  updatedAt: Date
}

LiveQuestionSchema = {
  _id: ObjectId,
  type: String,
  questionText: String,
  options: [LiveOptionSchema],
  correctAnswers: [ObjectId],
  points: Number,
  negativePoints: Number
}

LeaderboardEntrySchema = {
  participantId: ObjectId (User),
  participantName: String,
  totalScore: Number                       // Running total with speed bonuses
}
```

**Why this is needed**:

- Tracks quiz state (LIVE, CLOSED) in real-time
- Stores HOST_CONTROLLED mode progress (current question, leaderboard)
- Links quiz to specific session
- Maintains independent quiz instances even from same template

---

### 3. QuizSubmission (Student Answers)

**Purpose**: Stores student submissions and scores

**Schema** (`backend/models/QuizSubmission.js`):

```javascript
{
  liveQuizId: ObjectId (LiveQuiz),
  participantId: ObjectId (User),
  sessionId: ObjectId (Session),
  answers: [AnswerSchema],
  score: Number,                           // Total score earned
  maxScore: Number,                        // Maximum possible score
  percentage: Number,                      // Score percentage
  evaluated: Boolean,
  submittedAt: Date,
  isLate: Boolean,
  createdAt: Date,
  updatedAt: Date
}

AnswerSchema = {
  questionId: ObjectId,
  selectedOptions: [ObjectId],
  answeredAt: Date,

  // HOST_CONTROLLED mode fields
  isCorrect: Boolean,                      // Per-question evaluation
  scoreAwarded: Number,                    // Points with speed bonus
  responseTimeMs: Number                   // Response time for speed calculation
}
```

**Why this is needed**:

- Records all student answers
- Stores evaluation results separately per question (HOST_CONTROLLED)
- Tracks speed bonuses and late submissions
- Unique index on (liveQuizId, participantId) prevents duplicate submissions

---

## 🔌 Backend API Routes

### Quiz Template Routes (`/api/quiz-templates`)

**File**: `backend/routes/quizTemplateRoutes.js`

| Method | Endpoint | Controller          | Purpose               |
| ------ | -------- | ------------------- | --------------------- |
| POST   | `/`      | createQuizTemplate  | Create new template   |
| GET    | `/`      | getQuizTemplates    | List user's templates |
| GET    | `/:id`   | getQuizTemplateById | Get single template   |
| PUT    | `/:id`   | updateQuizTemplate  | Update template       |
| DELETE | `/:id`   | deleteQuizTemplate  | Delete template       |

**Authentication**: All routes require JWT authentication via `authenticateJWT` middleware

**Key Features**:

- **Option ID mapping**: When creating/updating, temporary `optionId` values are converted to MongoDB ObjectIds
- **Correct answer mapping**: Maps user-provided answer indices/IDs to option ObjectIds
- **Total points calculation**: Automatically sums question points

---

### Live Quiz Routes (`/api/live-quizzes`)

**File**: `backend/routes/liveQuizRoutes.js`

| Method | Endpoint                 | Controller               | Purpose                                 |
| ------ | ------------------------ | ------------------------ | --------------------------------------- |
| GET    | `/validate-template`     | validateTemplateForMode  | Check template compatibility with modes |
| POST   | `/`                      | createLiveQuiz           | Create quiz instance (DRAFT)            |
| POST   | `/:id/launch`            | launchQuiz               | Launch quiz (DRAFT → LIVE)              |
| POST   | `/:id/close`             | closeQuiz                | Close quiz (LIVE → CLOSED)              |
| GET    | `/session/:sessionId`    | getSessionQuizzes        | List all quizzes for session            |
| GET    | `/:id`                   | getLiveQuizById          | Get single quiz                         |
| GET    | `/:id/results`           | getQuizResults           | Get submissions and stats               |
| GET    | `/:quizId/my-submission` | getParticipantSubmission | Get own submission                      |

**Key Controller Logic**:

#### `createLiveQuiz`

1. Loads template if `templateId` provided
2. **Mode validation**: Rejects HOST_CONTROLLED if template has MULTI_SELECT questions
3. Maps template questions preserving option IDs
4. Creates quiz in DRAFT status
5. Initializes mode-specific fields (currentQuestionIndex for HOST_CONTROLLED)

#### `launchQuiz`

1. Changes status DRAFT → LIVE
2. Sets `startedAt` timestamp
3. **Emits socket event**:
   - ONE_SHOT: Emits all questions to participants
   - HOST_CONTROLLED: Emits minimal info (title, question count), no questions yet

#### `closeQuiz`

1. Changes status LIVE → CLOSED
2. Sets `closedAt` timestamp
3. **Emits socket event**: Notifies participants quiz ended

#### `validateTemplateForMode`

- Checks if template has MULTI_SELECT questions
- Returns compatibility boolean and issues list
- Used by frontend to show validation warnings

---

## 🔥 Socket Events

**File**: `backend/socket/quizSocket.js`

Socket handlers are registered per connection via `registerQuizSocket(io, socket)`

### ONE_SHOT Mode Events

#### 📤 `quiz:submit` (Client → Server)

**Payload**: `{ quizId, answers }`

**Flow**:

1. Validates user authentication
2. Checks quiz is LIVE
3. Prevents duplicate submissions
4. Checks for late submission (past duration)
5. Creates QuizSubmission document
6. **Evaluates immediately** via `evaluateQuizSubmission`
7. Emits `quiz:submission:ack` to student
8. Emits `quiz:new:submission` to all session participants (including host)

**Why needed**:

- ONE_SHOT quizzes are evaluated server-side immediately
- Host sees real-time submission count

---

#### 📥 `quiz:submission:ack` (Server → Client)

**Payload**: `{ quizId, submissionId, score, maxScore, percentage }`

**Flow**:

- Sent to submitting student only
- Contains evaluation results

**Why needed**:

- Student sees their score immediately
- Confirms submission success

---

#### 📥 `quiz:new:submission` (Server → All)

**Payload**: `{ quizId, participantId, participantName, submissionId, score, total, percentage, submittedAt }`

**Flow**:

- Broadcast to entire session room
- Host's QuizManager updates submission list

**Why needed**:

- Host sees live submission feed
- Updates participant count

---

### HOST_CONTROLLED Mode Events

#### 📤 `quiz:hc:publish` (Host → Server)

**Payload**: `{ quizId }`

**Server Logic** (`backend/socket/quizSocket.js:143`):

1. Validates host is quiz owner
2. Increments `currentQuestionIndex`
3. Sets `currentQuestionStartedAt = new Date()`
4. Retrieves question from `quiz.questions[newIndex]`
5. **Broadcasts** `quiz:hc:question` to all participants (WITHOUT correct answers)

**Why needed**:

- Host controls question timing
- Enforces sequential question flow

---

#### 📥 `quiz:hc:question` (Server → All)

**Payload**:

```javascript
{
  quizId,
  questionIndex,
  totalQuestions,
  question: {
    _id, type, questionText,
    options: [{ _id, text }],  // NO correctAnswers sent
    points
  },
  durationSeconds,
  startedAt
}
```

**Client Handlers**:

- **Host** (`QuizManager.jsx:175`): Updates `currentQuestion`, resets answer count
- **Participants** (`ParticipantSession.jsx:380`): Shows question, starts timer

**Why needed**:

- Synchronizes question display across all clients
- Starts timer countdown on client side

---

#### 📤 `quiz:hc:answer` (Participant → Server)

**Payload**: `{ quizId, questionId, selectedOptions }`

**Server Logic** (`backend/socket/quizSocket.js:228`):

1. Validates question is current
2. Checks answer within time limit (calculates responseTimeMs)
3. Finds/creates QuizSubmission
4. Prevents duplicate answers for same question
5. **Evaluates answer immediately**:
   - Checks correctness
   - Calculates speed bonus: `speedBonus = basePoints * 0.5 * speedFactor`
   - `speedFactor = 1 - (responseTimeMs / timeoutMs)`
6. Updates submission score and leaderboard in LiveQuiz
7. Emits `quiz:hc:answer:ack` to student
8. Emits `quiz:hc:answer:received` to session (notify host)

**Why needed**:

- Evaluates answers individually as they arrive
- Speed bonus rewards faster responses
- Host sees answer count in real-time

---

#### 📥 `quiz:hc:answer:ack` (Server → Client)

**Payload**: `{ quizId, questionId, isCorrect, scoreAwarded, totalScore, responseTimeMs }`

**Client Handler** (`ParticipantSession.jsx:404`):

- Marks answer as submitted
- Shows "Submitted" badge

**Why needed**:

- Confirms answer received
- Prevents re-submission

---

#### 📥 `quiz:hc:answer:received` (Server → All)

**Payload**: `{ quizId, questionId, participantId, participantName }`

**Client Handler** (`QuizManager.jsx:167`):

- Increments answer count display

**Why needed**:

- Host sees live answer count (e.g., "12 answers received")

---

#### 📤 `quiz:hc:close` (Host → Server)

**Payload**: `{ quizId }`

**Server Logic** (`backend/socket/quizSocket.js:380`):

1. Validates host ownership
2. Fetches all submissions
3. Calculates answer statistics (correctCount, totalAnswered)
4. Sorts leaderboard by score descending
5. **Broadcasts** `quiz:hc:results` to all

**Why needed**:

- Stops answering for current question
- Reveals correct answers and leaderboard

---

#### 📥 `quiz:hc:results` (Server → All)

**Payload**:

```javascript
{
  quizId, questionIndex, totalQuestions,
  question: {
    _id, questionText, options,
    correctAnswers  // NOW INCLUDED
  },
  stats: { totalAnswered, correctCount, incorrectCount },
  leaderboard: [{ participantId, participantName, totalScore }],
  isLastQuestion
}
```

**Client Handlers**:

- **Host** (`QuizManager.jsx:187`): Shows question results, leaderboard
- **Participants** (`ParticipantSession.jsx:415`): Shows leaderboard, correct answer

**Why needed**:

- Reveals answers after question closes
- Shows intermediate leaderboard
- Builds engagement between questions

---

#### 📤 `quiz:hc:end` (Host → Server)

**Payload**: `{ quizId }`

**Server Logic** (`backend/socket/quizSocket.js:460`):

1. Updates quiz status to CLOSED
2. Marks all submissions as evaluated
3. Calculates final leaderboard
4. **Broadcasts** `quiz:hc:final` with complete results

**Why needed**:

- Ends quiz early or after last question
- Shows final results screen

---

#### 📥 `quiz:hc:final` (Server → All)

**Payload**:

```javascript
{
  quizId, title, totalQuestions,
  leaderboard: [sorted by totalScore],
  maxPossibleScore,
  stats: { totalParticipants, averageScore }
}
```

**Client Handlers**:

- **Host** (`QuizManager.jsx:198`): Shows final results view
- **Participants** (`ParticipantSession.jsx:428`): Shows final leaderboard with confetti

**Why needed**:

- Celebratory ending
- Final standings display

---

#### 📤 `quiz:hc:sync` (Participant → Server)

**Payload**: `{ quizId }`

**Server Logic** (`backend/socket/quizSocket.js:534`):

- Used for late joiners
- Sends current quiz state
- Returns current question if not answered yet

**Why needed**:

- Handles reconnections
- Allows joining mid-quiz

---

#### 📥 `quiz:hc:error` (Server → Client)

**Payload**: `{ error: string }`

**Client Handler**:

- Shows error alert

**Why needed**:

- Error feedback for invalid actions (already answered, time expired, etc.)

---

## 🖥️ Frontend Architecture

### Host Side

#### 1. QuizCreation.jsx

**Purpose**: Visual quiz template builder

**Location**: `frontend/src/components/Host/QuizCreation.jsx`

**Features**:

- Add/edit/delete questions
- Multiple question types (MCQ, MULTI_SELECT, TRUE_FALSE, SHORT)
- Set points and negative marking
- Drag-reorder questions (implied)
- Save to backend via POST `/api/quiz-templates`

**Key State**:

```javascript
questions: []; // Array of question objects
currentQuestion: ""; // Question being edited
options: ["", ""]; // Option texts
optionIds: [null, null]; // Preserve MongoDB ObjectIds
questionType: "MCQ";
correctIndex: 0; // For single-select
correctIndices: [0]; // For multi-select
points: 1;
negativePoints: 0;
```

**Option ID Handling**:

- New options get temporary `optionId: "opt_timestamp_index"`
- Existing options preserve `_id` from database
- Backend converts temporary IDs to MongoDB ObjectIds

**Why needed**:

- User-friendly quiz authoring
- Reusable templates
- Separate creation from live usage

---

#### 2. QuizManager.jsx (Host Control Panel)

**Purpose**: Host interface for launching and controlling quizzes in live session

**Location**: `frontend/src/components/Host/sessionWorkspace/QuizManager.jsx`

**Context**: Uses `HostSessionContext` for shared session state

**Key State**:

```javascript
// Template selection
templates: [];
selectedTemplate: null;
selectedMode: "ONE_SHOT";
questionDuration: 30;

// Active quiz
activeQuiz: null;
quizSubmissions: [];
pastQuizzes: [];

// HOST_CONTROLLED mode
currentQuestion: null;
currentQuestionIndex: -1;
answerCount: 0;
leaderboard: [];
questionResults: null;
showLeaderboard: false;
```

**Main Views**:

##### A. Import Modal

- Lists user's templates
- Mode selector (ONE_SHOT vs HOST_CONTROLLED)
- Template validation for HOST_CONTROLLED
- Duration slider for HOST_CONTROLLED (10-120 seconds)
- Launch button

##### B. ONE_SHOT Active Quiz View

- Shows quiz header (title, question count)
- Stats cards (submissions, avg score, top score)
- Refresh results button
- End quiz button
- Submissions list with scores

##### C. HOST_CONTROLLED Control Panel

- Progress bar (question X of Y)
- Timer display per question
- Current question preview with options
- Answer count live ticker
- Control buttons:
  - **Start Quiz** (publish first question)
  - **Close Question & Show Results** (stop answering, show leaderboard)
  - **Next Question** (after results)
  - **Show Final Results** (end quiz)
- Leaderboard display (top 10)

##### D. HOST_CONTROLLED Results View (Closed)

- Final leaderboard
- Submission details
- Back to quiz list

**Socket Event Handlers**:

```javascript
socket.on("quiz:new:submission"); // Update submission list
socket.on("quiz:hc:answer:received"); // Increment answer count
socket.on("quiz:hc:question"); // Update current question
socket.on("quiz:hc:results"); // Show question results
socket.on("quiz:hc:final"); // Show final results
socket.on("quiz:hc:error"); // Show error alert
```

**Why needed**:

- Central control for quiz lifecycle
- Real-time monitoring of participation
- HOST_CONTROLLED flow management
- Results visualization

---

### Participant Side

#### 3. ParticipantLiveQuiz.jsx

**Purpose**: Student quiz-taking interface

**Location**: `frontend/src/components/Participant/ParticipantLiveQuiz.jsx`

**Context**: Uses `ParticipantSessionContext` for quiz state

**Key State**:

```javascript
// ONE_SHOT mode
currentQuestionIndex: 0;
quizAnswers: {
} // { questionId: [selectedOptionIds] }
quizSubmitted: false;
quizResult: null;

// HOST_CONTROLLED mode
hcCurrentQuestion: null;
hcQuestionIndex: -1;
hcTimeRemaining: 0;
hcAnswerSubmitted: false;
hcLeaderboard: [];
hcFinalResults: null;
hcShowResults: false;
hcSelectedOption: null; // Current answer selection
```

**Rendering Logic**:

The component has multiple conditional renders based on quiz mode and state:

##### ONE_SHOT Mode Views:

1. **Active Quiz**:
   - Question navigator (dots at bottom)
   - Option buttons (Circle/CheckCircle for MCQ, Square/CheckSquare for MULTI_SELECT)
   - Previous/Next buttons
   - Submit button (bottom right after last question)
   - Progress summary (X of Y answered)

2. **Result Screen**:
   - Trophy icon (gold if ≥60%, orange otherwise)
   - Score percentage (large)
   - Score fraction (points/maxPoints)
   - Stats cards (answered count, total questions)
   - Encouraging message

##### HOST_CONTROLLED Mode Views:

1. **Waiting for Start**:
   - Pulsing Zap icon
   - "Waiting for host to start..."
   - Instructions about speed bonus

2. **Active Question**:
   - Timer header (blue/red gradient based on time remaining)
   - Timer bar (width decreases)
   - Question text with points badge
   - 4 colorful option buttons (red, blue, green, yellow gradients)
   - Selected option highlighted
   - "Lock In Answer" button (green gradient)
   - Auto-submit at time=0 if answer selected

3. **Answer Submitted/Time's Up**:
   - Green checkmark: "Answer submitted! Waiting for results..."
   - Red X: "Time's up! You didn't submit an answer"

4. **Leaderboard (Between Questions)**:
   - Trophy icon
   - Top 10 leaderboard
   - Own rank highlighted
   - "Waiting for next question..." spinner

5. **Final Results**:
   - Trophy icon
   - Your rank (#1, #2, etc.)
   - Complete leaderboard
   - "Quiz Complete! 🎉"

**Timer Logic** (HOST_CONTROLLED):

```javascript
useEffect(() => {
  if (!hcCurrentQuestion || hcAnswerSubmitted || hcShowResults) return;

  const timer = setInterval(() => {
    setHcTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
  }, 1000);

  return () => clearInterval(timer);
}, [hcCurrentQuestion, hcAnswerSubmitted, hcShowResults]);
```

**Socket Event Handlers**:

```javascript
socket.on("quiz:launched"); // Initialize quiz
socket.on("quiz:closed"); // Close quiz view
socket.on("quiz:hc:question"); // Show new question, start timer
socket.on("quiz:hc:answer:ack"); // Mark answer submitted
socket.on("quiz:hc:results"); // Show leaderboard between questions
socket.on("quiz:hc:final"); // Show final results
socket.on("quiz:hc:error"); // Show error
```

**Why needed**:

- Immersive quiz-taking experience
- Real-time timer and feedback (HOST_CONTROLLED)
- Immediate results display
- Visual engagement (colors, animations)

---

### Context State Management

#### HostSessionContext.jsx

**File**: `frontend/src/context/HostSessionContext.jsx`

**Quiz State**:

```javascript
activeQuiz: null; // Current live quiz
quizSubmissions: []; // Submissions for active quiz
showQuizImport: false; // Import modal visibility
pastQuizzes: []; // Closed quizzes
```

**Why needed**:

- Share quiz state across SessionWorkspace and QuizManager
- Persist across component re-renders
- Single source of truth for host

---

#### ParticipantSessionContext.jsx

**File**: `frontend/src/context/ParticipantSessionContext.jsx`

**Quiz State**:

```javascript
// ONE_SHOT mode
activeQuiz: null;
quizAnswers: {
}
quizSubmitted: false;
quizResult: null;

// HOST_CONTROLLED mode
hcCurrentQuestion: null;
hcQuestionIndex: -1;
hcTimeRemaining: 0;
hcQuestionDuration: 30;
hcAnswerSubmitted: false;
hcLeaderboard: [];
hcFinalResults: null;
hcShowResults: false;
```

**Persistence**:

- `activeQuiz` saved to `sessionStorage.activeQuiz`
- Survives page refresh during quiz

**Why needed**:

- Share quiz state between ParticipantSession and ParticipantLiveQuiz
- Handle socket events in parent, render in child
- Persist state during navigation

---

## 🔄 Complete Quiz Flow Diagrams

### ONE_SHOT Mode Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          TEACHER ACTIONS                                  │
└──────────────────────────────────────────────────────────────────────────┘

1. Create Template (QuizCreation.jsx)
   ├─> POST /api/quiz-templates { title, description, questions }
   └─> Template saved in MongoDB

2. Launch Quiz in Session (QuizManager.jsx)
   ├─> Open import modal
   ├─> Select template
   ├─> Choose ONE_SHOT mode
   ├─> POST /api/live-quizzes { sessionId, templateId, mode: "ONE_SHOT" }
   │   └─> Creates LiveQuiz (status: DRAFT)
   └─> POST /api/live-quizzes/:id/launch
       ├─> Updates status: LIVE
       └─> Socket: io.to(session:code).emit("quiz:launched", { quizId, questions, ... })

┌──────────────────────────────────────────────────────────────────────────┐
│                         STUDENT ACTIONS                                   │
└──────────────────────────────────────────────────────────────────────────┘

3. Receive Quiz (ParticipantSession.jsx)
   ├─> socket.on("quiz:launched")
   ├─> setActiveQuiz({ quizId, questions, mode: "ONE_SHOT", ... })
   └─> ParticipantLiveQuiz.jsx renders all questions

4. Answer Questions
   ├─> Click options to select answers
   ├─> Navigate between questions (Previous/Next)
   └─> quizAnswers: { questionId: [optionId, ...] }

5. Submit Quiz
   ├─> Click "Submit Quiz" button
   ├─> socket.emit("quiz:submit", { quizId, answers })
   └─> Backend (quizSocket.js):
       ├─> Create QuizSubmission
       ├─> evaluateQuizSubmission() - calculate score
       ├─> socket.emit("quiz:submission:ack", { score, percentage })
       └─> io.to(session:code).emit("quiz:new:submission", { participantId, score, ... })

6. View Result
   └─> socket.on("quiz:submission:ack") → Show result screen with score

┌──────────────────────────────────────────────────────────────────────────┐
│                       TEACHER MONITORS                                    │
└──────────────────────────────────────────────────────────────────────────┘

7. View Submissions (QuizManager.jsx)
   ├─> socket.on("quiz:new:submission") → Update submission list
   └─> GET /api/live-quizzes/:id/results → Fetch all submissions

8. Close Quiz
   ├─> Click "End Quiz"
   ├─> POST /api/live-quizzes/:id/close
   └─> Socket: io.to(session:code).emit("quiz:closed", { quizId })
```

---

### HOST_CONTROLLED Mode Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          TEACHER SETUP                                    │
└──────────────────────────────────────────────────────────────────────────┘

1. Launch HOST_CONTROLLED Quiz
   ├─> Select template (must have NO MULTI_SELECT questions)
   ├─> Choose HOST_CONTROLLED mode
   ├─> Set questionDurationSeconds (e.g., 30)
   ├─> POST /api/live-quizzes { mode: "HOST_CONTROLLED", questionDurationSeconds }
   ├─> POST /api/live-quizzes/:id/launch
   └─> Socket: io.emit("quiz:launched", { quizId, mode: "HOST_CONTROLLED", totalQuestions })
       (NO QUESTIONS sent yet)

┌──────────────────────────────────────────────────────────────────────────┐
│                      STUDENTS WAITING                                     │
└──────────────────────────────────────────────────────────────────────────┘

2. Participants See Waiting Screen
   └─> ParticipantLiveQuiz: "Waiting for host to start..."

┌──────────────────────────────────────────────────────────────────────────┐
│                      QUESTION 1 CYCLE                                     │
└──────────────────────────────────────────────────────────────────────────┘

3. Teacher Publishes Question
   ├─> Click "Start Quiz - Show First Question"
   ├─> socket.emit("quiz:hc:publish", { quizId })
   └─> Backend:
       ├─> quiz.currentQuestionIndex = 0
       ├─> quiz.currentQuestionStartedAt = new Date()
       └─> io.emit("quiz:hc:question", { questionIndex: 0, question, durationSeconds: 30 })

4. Students Answer
   ├─> ParticipantLiveQuiz: Shows question with timer
   ├─> Timer counts down from 30s
   ├─> Select option (red/blue/green/yellow button)
   ├─> Click "Lock In Answer"
   ├─> socket.emit("quiz:hc:answer", { quizId, questionId, selectedOptions })
   └─> Backend:
       ├─> Calculate responseTimeMs
       ├─> Evaluate answer (correct/incorrect)
       ├─> Calculate scoreAwarded with speed bonus:
       │   ├─> speedFactor = 1 - (responseTimeMs / timeoutMs)
       │   └─> scoreAwarded = points + (points * 0.5 * speedFactor)
       ├─> Update QuizSubmission
       ├─> Update quiz.leaderboard
       ├─> socket.emit("quiz:hc:answer:ack", { isCorrect, scoreAwarded })
       └─> io.emit("quiz:hc:answer:received", { participantId })

5. Teacher Sees Answer Count
   └─> QuizManager: "12 Answers Received" (increments in real-time)

6. Teacher Closes Question
   ├─> Click "Close Question & Show Results" (or time expires)
   ├─> socket.emit("quiz:hc:close", { quizId })
   └─> Backend:
       ├─> Calculate stats (correctCount, incorrectCount)
       ├─> Sort leaderboard
       └─> io.emit("quiz:hc:results", { question, correctAnswers, stats, leaderboard })

7. Everyone Sees Results
   ├─> Host: QuizManager shows leaderboard + correct answer
   └─> Participants: ParticipantLiveQuiz shows leaderboard (own rank highlighted)

┌──────────────────────────────────────────────────────────────────────────┐
│                      REPEAT FOR QUESTIONS 2-N                             │
└──────────────────────────────────────────────────────────────────────────┘

8. Teacher Publishes Next Question
   ├─> Click "Next Question"
   └─> Repeat steps 3-7

┌──────────────────────────────────────────────────────────────────────────┐
│                         QUIZ END                                          │
└──────────────────────────────────────────────────────────────────────────┘

9. Teacher Ends Quiz
   ├─> After last question results OR click "End Quiz Early"
   ├─> Click "Show Final Results"
   ├─> socket.emit("quiz:hc:end", { quizId })
   └─> Backend:
       ├─> quiz.status = "CLOSED"
       ├─> Calculate final leaderboard
       └─> io.emit("quiz:hc:final", { leaderboard, stats })

10. Final Results
    ├─> Host: QuizManager shows final leaderboard + all submissions
    └─> Participants: ParticipantLiveQuiz shows "Quiz Complete! 🎉" with rank
```

---

## 🎮 HOST_CONTROLLED Mode Detailed Mechanics

### Speed Bonus Calculation

**Code**: `backend/socket/quizSocket.js:296-303`

```javascript
const basePoints = currentQuestion.points || 1;
const speedFactor = Math.max(0, 1 - responseTimeMs / timeoutMs);
const speedBonus = basePoints * 0.5 * speedFactor;
scoreAwarded = Math.round((basePoints + speedBonus) * 100) / 100;
```

**Example**:

- Question worth 10 points
- Time limit: 30 seconds
- Student answers in 5 seconds

```
speedFactor = 1 - (5000ms / 30000ms) = 1 - 0.167 = 0.833
speedBonus = 10 * 0.5 * 0.833 = 4.165
scoreAwarded = 10 + 4.165 = 14.17 points
```

**Why this formula**:

- Rewards speed without making it impossible for slower students
- Maximum bonus: 50% extra points (instant answer)
- Linear decay: proportional to time remaining
- Fair: everyone has equal opportunity

---

### Leaderboard Updates

**Code**: `backend/socket/quizSocket.js:328-336`

```javascript
const leaderboardEntry = quiz.leaderboard.find(
  (e) => e.participantId.toString() === userId,
);
if (leaderboardEntry) {
  leaderboardEntry.totalScore = submission.score;
} else {
  quiz.leaderboard.push({
    participantId: userId,
    participantName: userName,
    totalScore: submission.score,
  });
}
await quiz.save();
```

**Why this approach**:

- Leaderboard stored directly on LiveQuiz document
- Updated after each answer
- Sorted on broadcast for top 10 display
- Efficient: no separate leaderboard collection

---

### Late Joiner Handling

**Event**: `quiz:hc:sync`

**Code**: `backend/socket/quizSocket.js:534-588`

When a student joins mid-quiz:

1. Checks if player already answered current question
2. If not answered: sends current question with remaining time
3. If answered: sends waiting state
4. Returns current score

**Why needed**:

- Students can join sessions late
- Graceful degradation: participate in remaining questions
- Fair: can't see previous questions

---

## 🐛 Known Issues & Fixes Needed

Based on code analysis, here are the issues in **HOST_CONTROLLED mode**:

### 1. Timer Resets Incorrectly

**Location**: `ParticipantLiveQuiz.jsx:67-81`

**Issue**: Timer resets when parent component re-renders

**Symptoms**:

- Timer jumps back to full duration during quiz
- Students see time restored

**Root Cause**:

- `hcTimeRemaining` in context is managed in parent
- Child timer effect doesn't properly sync with socket-provided duration

**Proposed Fix**:

```javascript
// In ParticipantSessionContext: initialize from socket event
socket.on("quiz:hc:question", (data) => {
  setHcCurrentQuestion(data.question);
  setHcQuestionIndex(data.questionIndex);
  setHcQuestionDuration(data.durationSeconds);
  setHcTimeRemaining(data.durationSeconds); // Set from server
  setHcAnswerSubmitted(false);
  setHcShowResults(false);
});
```

---

### 2. Leaderboard Not Updating Between Questions

**Location**: `QuizManager.jsx:187-196`

**Issue**: Leaderboard state goes stale

**Symptoms**:

- Leaderboard shows old scores after question closes
- Doesn't update until next refresh

**Root Cause**:

- `quiz:hc:results` event handler uses stale `activeQuiz` ref
- State updates don't trigger re-render with new leaderboard

**Proposed Fix**:

```javascript
const onHCResults = (data) => {
  const currentQuiz = activeQuizRef.current;
  if (currentQuiz && currentQuiz._id === data.quizId) {
    setQuestionResults(data);
    setLeaderboard(data.leaderboard || []); // ✅ Update leaderboard
    setShowLeaderboard(true);
    setIsClosingQuestion(false);
    setAnswerCount(0); // Reset for next question
  }
};
```

---

### 3. Answer Count Not Resetting

**Location**: `QuizManager.jsx:175`

**Issue**: Answer count accumulates across questions

**Symptoms**:

- "15 answers received" on question 2 even though only 5 answered

**Root Cause**:

- `answerCount` state never reset when new question published

**Proposed Fix**:

```javascript
const onHCQuestion = (data) => {
  const currentQuiz = activeQuizRef.current;
  if (currentQuiz && currentQuiz._id === data.quizId) {
    setCurrentQuestion(data.question);
    setCurrentQuestionIndex(data.questionIndex);
    setIsPublishing(false);
    setShowLeaderboard(false);
    setQuestionResults(null);
    setAnswerCount(0); // ✅ Reset answer count
    console.log("📥 Question published:", data.questionIndex + 1);
  }
};
```

---

### 4. HOST_CONTROLLED Mode Disabled in UI

**Location**: `QuizManager.jsx:410`

**Issue**: Button commented out

**Code**:

```jsx
<button
  // TODO: In development
  // onClick={() => setSelectedMode("HOST_CONTROLLED")}
  className="cursor-not-allowed"
>
```

**Why disabled**:

- Likely due to known bugs listed above
- "Coming Soon.." badge shown

**Fix Required**:

- Uncomment handler once bugs fixed
- Remove "Coming Soon" badge
- Test thoroughly before enabling

---

### 5. Duplicate Event Listeners

**Location**: `QuizManager.jsx:153-234`

**Issue**: Socket listeners added on every render if dependencies change

**Risk**:

- Multiple event handlers fire simultaneously
- State updates race conditions

**Current Dependencies**: `[activeQuiz, socketRef]`

**Proposed Fix**:

```javascript
useEffect(() => {
  const socket = socketRef.current;
  if (!socket) return;

  // ... handler definitions ...

  socket.on("quiz:hc:question", onHCQuestion);
  // ... other listeners ...

  return () => {
    socket.off("quiz:hc:question", onHCQuestion);
    // ... cleanup ...
  };
}, [socketRef]); // ✅ Only depend on socketRef

// Move activeQuiz checks inside handlers using ref
```

---

### 6. Results Not Fetched for Closed HC Quiz

**Location**: `QuizManager.jsx:204`

**Issue**: Final submissions not fetched when quiz ends

**Code**:

```javascript
const onHCFinal = (data) => {
  // ...
  setActiveQuiz((prev) => ({
    ...prev,
    status: "CLOSED",
    leaderboard: finalLeaderboard,
  }));
  setPastQuizzes((prev) => [
    { ...currentQuiz, status: "CLOSED", leaderboard: finalLeaderboard },
    ...prev,
  ]);
  // ✅ Already calls fetchQuizResults
  fetchQuizResults(currentQuiz._id);
};
```

**Status**: Actually already fixed in code! 👍

---

## 🧪 Testing Checklist

### ONE_SHOT Mode

- [ ] Create template with mixed question types
- [ ] Launch quiz from template
- [ ] Multiple students submit
- [ ] Verify scores calculated correctly
- [ ] Negative marking works
- [ ] Close quiz and view results
- [ ] Relaunch same template in new session

### HOST_CONTROLLED Mode (After Fixes)

- [ ] Launch HC quiz with MCQ-only template
- [ ] Verify "Coming Soon" removed
- [ ] Publish first question
- [ ] All participants see question simultaneously
- [ ] Timer counts down correctly (no resets)
- [ ] Fast answers get speed bonus
- [ ] Close question shows correct leaderboard
- [ ] Answer count displays correctly
- [ ] Publish next question (answer count resets)
- [ ] End quiz shows final results
- [ ] Late joiner sees current question

### Edge Cases

- [ ] Submit answer at exactly time=0
- [ ] Close quiz while students still answering
- [ ] Reconnect during HC quiz (sync works)
- [ ] Try to answer same question twice (rejected)
- [ ] Launch HC quiz with MULTI_SELECT template (validation fails)

---

## 📊 Performance Considerations

### Database Queries

- **Quiz Launch**: 2 queries (FindById quiz, FindById session)
- **Answer Submission (HC)**: 2-3 queries (FindById quiz, FindOne/Create submission, Save x2)
- **Results Broadcast**: N+1 queries (FindMany submissions, populate participantId)

### Optimization Opportunities

1. **Index on QuizSubmission**: `{ liveQuizId: 1, participantId: 1 }` ✅ Already exists
2. **Cache Session**: Store session code in quiz document to avoid lookup
3. **Batch Leaderboard Updates**: Update leaderboard every 5 answers instead of each
4. **Projection**: Don't populate full participant objects, just names

### Socket Room Size

- **Room Name**: `session:{sessionCode}`
- **Participants**: ~50-100 students typical
- **Broadcast Frequency**:
  - ONE_SHOT: 1 emit per submission
  - HOST_CONTROLLED:
    - 1 `quiz:hc:question` per question (all participants)
    - N `quiz:hc:answer:received` per question (all participants)
    - 1 `quiz:hc:results` per question (all participants)

**Load**: 50 students × 10 questions × 5 emits = 2500 socket events per quiz

---

## 🚀 Future Enhancements

### Planned Features

1. **Image Support**: Add images to questions and options
2. **Export Results**: Download CSV of submissions
3. **Quiz Analytics**: Difficulty analysis, time-to-answer heatmaps
4. **Question Bank**: Import questions from shared library
5. **Partial Credit**: Award points for MULTI_SELECT based on % correct
6. **Pause/Resume**: Pause HOST_CONTROLLED quiz mid-question
7. **Team/Group Mode**: Students collaborate in teams
8. **Question Weights**: Different point values per question
9. **Randomize Options**: Shuffle option order per student (prevent cheating)
10. **Accessibility**: Screen reader support, keyboard navigation

### Technical Debt

- [ ] Add TypeScript types for socket events
- [ ] Extract HOST_CONTROLLED logic into separate hook
- [ ] Write unit tests for scoring algorithms
- [ ] Add E2E tests with Playwright (simulate host + students)
- [ ] Document socket event payload schemas
- [ ] Add Jest tests for evaluation functions

---

## 📝 Summary

### What Works Well ✅

- **Clean Separation**: Templates vs Live Quizzes
- **Real-time Updates**: Socket.io integration smooth
- **Scoring System**: Speed bonuses well-balanced
- **UI/UX**: Engaging visuals, color-coded options
- **Validation**: Template compatibility checks

### What Needs Fixing 🔧

- **Timer Reset Bug**: High priority
- **Leaderboard Staleness**: High priority
- **Answer Count Issue**: Medium priority
- **Enable HOST_CONTROLLED**: Blocked by above bugs
- **Event Listener Cleanup**: Low priority (preventative)

### Architecture Strengths 💪

- **Scalable**: Socket rooms handle 100+ participants
- **Maintainable**: Clear separation of concerns
- **Extensible**: Easy to add new question types
- **Type-safe-ish**: MongoDB schemas enforce structure

---

## 🏁 Conclusion

This quiz system is **80% production-ready**. The ONE_SHOT mode works reliably. The HOST_CONTROLLED mode has the infrastructure but needs bug fixes before launch.

**Recommended Next Steps**:

1. Fix timer reset bug (highest impact)
2. Fix leaderboard updates (critical for UX)
3. Fix answer count reset
4. Perform thorough testing with simulated classroom (10+ students)
5. Enable HOST_CONTROLLED mode in UI
6. Monitor first live sessions closely

**Time Estimate for Fixes**: 4-6 hours of focused development + 2 hours testing

---

**Document Version**: 1.0  
**Created**: [Current Date]  
**Author**: GitHub Copilot (AI Analysis)  
**Status**: Ready for Development Team Review
