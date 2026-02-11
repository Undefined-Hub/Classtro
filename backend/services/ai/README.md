# Classtro AI Service Module

> Clean, scalable AI architecture for real-time classroom engagement

## 📁 Architecture Overview

```
/services/ai/
├── core.js                    # Single source of truth for AI operations
├── index.js                   # Clean export interface
└── prompts/
    ├── chatPrompt.js          # Chatbot conversation prompts
    └── insightsPrompt.js      # Session analytics prompts
```

---

## 🎯 Design Principles

### 1. **Single Responsibility**
- `core.js` - Only handles AI provider communication
- `prompts/` - Only builds contextual prompts
- `controllers/` - Only orchestrates request/response

### 2. **Provider Agnostic**
```javascript
// To switch from Gemini to AWS Bedrock:
// Only edit core.js - routes and prompts stay unchanged
```

### 3. **Separation of Concerns**
```
User Request → Route → Controller → Prompt Builder → AI Core → Response
```

---

## 🚀 Features Implemented

### ✅ AI Chatbot Assistant
- **Role-aware responses** (teacher/student)
- **Context-aware guidance** (page, session, history)
- **Security rules** (no quiz answer leaking)
- **Feature-specific help**

### 🔄 AI Session Insights (In Progress)
- **Placeholder structure** ready for your teammate
- **Function signatures** defined
- **Clear TODO comments** for implementation

---

## 📡 API Endpoints

### Health Check
```http
GET /api/ai/health
```
**Response:**
```json
{
  "success": true,
  "service": "AI Service",
  "status": "operational",
  "timestamp": "2026-02-11T10:30:00Z"
}
```

### Chat Request
```http
POST /api/ai/chat
Authorization: Bearer <token>
```
**Body:**
```json
{
  "message": "How do I create a poll?",
  "role": "teacher",
  "page": "dashboard",
  "knowledge": {
    "sessionInfo": "Active session: Math 101",
    "userHistory": "Created 3 polls today"
  }
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "message": "To create a poll, click the 'New Poll' button...",
    "timestamp": "2026-02-11T10:30:00Z"
  }
}
```

### Feature Help
```http
POST /api/ai/feature-help
Authorization: Bearer <token>
```
**Body:**
```json
{
  "featureName": "analytics",
  "role": "teacher"
}
```

### Session Insights (Pending Implementation)
```http
POST /api/ai/insights
Authorization: Bearer <token>
```
**Body:**
```json
{
  "sessionData": {
    "title": "Introduction to Physics",
    "duration": "45 minutes",
    "participantCount": 32,
    "polls": [...],
    "questions": [...],
    "feedback": [...]
  },
  "focusArea": "engagement"
}
```
**Current Response:**
```json
{
  "success": false,
  "error": "Insights feature is under development by your teammate",
  "message": "buildInsightsPrompt implementation pending"
}
```

---

## 🛠️ Usage Examples

### In a Controller
```javascript
import { generateAIResponse, buildChatPrompt } from '../services/ai';

const prompt = buildChatPrompt({
  role: 'student',
  page: 'session',
  message: 'How do I answer a poll?',
});

const response = await generateAIResponse(prompt);
```

### Direct Import
```javascript
import { buildFeatureHelpPrompt } from '../services/ai/prompts/chatPrompt.js';
import { generateAIResponse } from '../services/ai/core.js';

const prompt = buildFeatureHelpPrompt('Q&A', 'teacher');
const help = await generateAIResponse(prompt, {
  temperature: 0.6,
  maxTokens: 512,
});
```

---

## 🔐 Security Features

### Chatbot Security Rules
- ✅ No quiz/poll answer leaking
- ✅ Role-based response filtering
- ✅ No unauthorized action suggestions
- ✅ Student cannot access teacher-only info

### API Security
- ✅ JWT authentication required
- ✅ Role validation (teacher/student)
- ✅ Input sanitization
- ✅ Error message sanitization

---

## ⚙️ Configuration

### Environment Variables
```env
GEMINI_API_KEY=your_api_key_here
```

### AI Model Settings
Default configuration in `core.js`:
```javascript
{
  model: "gemini-3-flash-preview",
  temperature: 0.7,    // Creativity (0-1)
  maxTokens: 2048,     // Response length
}
```

---

## 🧪 Testing the AI Service

### 1. Health Check
```bash
curl http://localhost:3000/api/ai/health
```

### 2. Chat Request (requires auth token)
```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is Classtro?",
    "role": "student",
    "page": "landing"
  }'
```

---

## 📝 For Your Teammate: Implementing Insights

### Step 1: Open `insightsPrompt.js`

### Step 2: Implement `buildInsightsPrompt()`
```javascript
export function buildInsightsPrompt({ sessionData, focusArea = 'overall' }) {
  // 1. Validate sessionData
  if (!sessionData || !sessionData.title) {
    throw new Error("Invalid session data");
  }

  // 2. Extract metrics
  const pollSummary = formatPollData(sessionData.polls);
  const qaSummary = formatQAData(sessionData.questions);
  
  // 3. Build prompt
  const prompt = `Analyze this Classtro session and provide insights:

Session: ${sessionData.title}
Duration: ${sessionData.duration}
Participants: ${sessionData.participantCount}

Poll Results:
${pollSummary}

Q&A Activity:
${qaSummary}

Focus Area: ${focusArea}

Please provide:
1. Engagement Summary (2-3 sentences)
2. Key Insights (3-5 bullet points)
3. Recommendations for Next Session (3 actionable items)
4. Notable Patterns or Concerns
`;

  return prompt;
}
```

### Step 3: Implement Helper Functions
```javascript
function formatPollData(polls) {
  if (!polls || polls.length === 0) return "No polls conducted";
  
  return polls.map(poll => 
    `- ${poll.question}: ${poll.responseCount} responses, avg score ${poll.avgScore}`
  ).join('\n');
}
```

### Step 4: Update Controller
In `aiController.js`, uncomment the implementation code:
```javascript
// Remove the 501 response
// Uncomment the actual implementation
```

### Step 5: Test
```bash
POST /api/ai/insights with real session data
```

---

## 🔄 Future Migration Path

### To Switch AI Provider (e.g., AWS Bedrock):

#### Option 1: Modify Core Only
```javascript
// In core.js
import { BedrockClient } from '@aws-sdk/client-bedrock-runtime';

export async function generateAIResponse(prompt, options = {}) {
  // Replace Gemini logic with AWS Bedrock
  const client = new BedrockClient({ region: 'us-east-1' });
  // ... AWS implementation
}
```

#### Option 2: Strategy Pattern
```javascript
// services/ai/providers/gemini.js
export const geminiProvider = { ... };

// services/ai/providers/bedrock.js
export const bedrockProvider = { ... };

// services/ai/core.js
const provider = process.env.AI_PROVIDER === 'aws' 
  ? bedrockProvider 
  : geminiProvider;
```

**Zero changes needed in:**
- ✅ Routes
- ✅ Controllers
- ✅ Prompt builders
- ✅ Frontend

---

## 🎓 Architecture Benefits

### Scalability
- Add new prompt types without touching core
- Add new routes without touching AI logic
- Switch providers without frontend changes

### Maintainability
- Single file to update for provider changes
- Clear separation of concerns
- Easy to test individual components

### Security
- Centralized API key management
- Consistent error handling
- No sensitive data in prompts

### Developer Experience
- Clean imports (`from '../services/ai'`)
- Self-documenting code
- Easy onboarding for new devs

---

## 📦 Dependencies

```json
{
  "@google/genai": "^latest",
  "dotenv": "^16.4.7",
  "express": "^4.21.2"
}
```

---

## 🚨 Error Handling

All AI operations include comprehensive error handling:

```javascript
try {
  const response = await generateAIResponse(prompt);
  // Success
} catch (error) {
  // User-friendly errors:
  // - "AI service temporarily unavailable"
  // - "AI service configuration error"
  // - "AI service connection failed"
}
```

---

## 📊 Monitoring & Logging

All AI requests are logged:
```
AI Core Error: Rate limit exceeded
Chat Request Error: Invalid role parameter
Insights Request Error: Missing session data
```

---

## ✅ Checklist for Production

- [x] AI core implementation
- [x] Chatbot prompts
- [x] API routes
- [x] Authentication middleware
- [ ] Insights prompt implementation (teammate)
- [ ] Rate limiting for AI endpoints
- [ ] Response caching (optional)
- [ ] Analytics tracking
- [ ] Load testing

---

## 🤝 Contributing

When extending AI features:

1. **Add new prompt builder** in `/prompts/`
2. **Add controller function** in `aiController.js`
3. **Add route** in `aiRoutes.js`
4. **Export from index** in `index.js`
5. **Update this README**

---

## 📞 Support

For questions about:
- **AI core**: Check `core.js` comments
- **Chatbot**: Check `chatPrompt.js` implementation
- **Insights**: Wait for teammate or check TODOs in `insightsPrompt.js`
- **Routes**: Check `aiRoutes.js` and `aiController.js`

---

Built with ❤️ for Classtro by Team Undefined
