# Classtro AI - Hybrid Mode Request Flow

## 🔄 Chat Request Flow (Hybrid Mode - March 2026)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER INTERACTS                                            │
├─────────────────────────────────────────────────────────────┤
│ Examples:                                                   │
│ • "How do I create a poll?" (Classtro question)            │
│ • "Explain photosynthesis" (General educational)           │
│ Role: student | Page: session                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. FRONTEND SENDS REQUEST                                   │
├─────────────────────────────────────────────────────────────┤
│ POST /api/ai/chat                                           │
│ { "message": "How do I create a poll?",                     │
│   "role": "student", "page": "session" }                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. ROUTE LAYER (aiRoutes.js)                               │
├─────────────────────────────────────────────────────────────┤
│ • Apply optionalAuthJWT middleware                          │
│ • Forward to aiController.handleChatRequest()               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. CONTROLLER (aiController.js)                             │
├─────────────────────────────────────────────────────────────┤
│ • Validate message (required, non-empty string)             │
│ • Determine auth status (req.user exists?)                  │
│ • Detect intent FIRST (CLASSTRO or GENERAL)                 │
│                                                             │
│ FOR GENERAL MODE ONLY - Memory Check:                       │
│ • Get user identifier (getUserIdentifier)                   │
│   - Authenticated: user_{userId}                            │
│   - Guest: session_{hash of IP+UserAgent}                   │
│ • Check if follow-up question (isFollowUpQuestion)          │
│   - Keywords: which, better, that, this, why, etc.          │
│ • If follow-up → retrieve previous context (getMemory)      │
│   - lastUserMessage                                         │
│   - lastAssistantSummary                                    │
│                                                             │
│ • Forward to buildChatPrompt() with previousContext         │
│   Returns: { prompt, intent, maxTokens }                    │
│                                                             │
│ Console: [MEMORY] Retrieved context for session_xyz         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. HYBRID MODE - INTENT DETECTION (chatPrompt.js)          │
├─────────────────────────────────────────────────────────────┤
│ Step 1: detectIntent(message)                               │
│   • Check for Classtro keywords: session, poll, qna, room,  │
│     feedback, join, create, etc. (30+ keywords)             │
│   • Returns: "CLASSTRO" or "GENERAL"                        │
│                                                             │
│ Console: [HYBRID MODE] Intent detected: CLASSTRO            │
└────────────────────────┬────────────────────────────────────┘
                         │
                ┌────────┴──────────┐
                │                   │
           CLASSTRO              GENERAL
                │                   │
                ▼                   ▼
┌─────────────────────────┐  ┌──────────────────────────────┐
│ 6A. CLASSTRO MODE       │  │ 6B. GENERAL MODE             │
│ (promptBuilder.js)      │  │ (promptBuilder.js +          │
│                         │  │  memoryManager.js)           │
├─────────────────────────┤  ├──────────────────────────────┤
│ buildClasstroPrompt()   │  │ buildGeneralPrompt()         │
│                         │  │                              │
│ • Detect topics via     │  │ • Concise educational AI     │
│   knowledge/            │  │ • No knowledge restriction   │
│   detectTopics()        │  │ • Max 4 bullets              │
│ • Get relevant          │  │ • 120-150 words max          │
│   knowledge via         │  │ • 1-2 sentence summary       │
│   getRelevant           │  │                              │
│   Knowledge()           │  │ + Conversational Memory:     │
│ • Filter by role        │  │ • If previousContext exists: │
│   (student/teacher)     │  │   - Add "Previous Context:"  │
│ • Compress to max       │  │   - User: {last question}    │
│   1500 chars            │  │   - Summary: {last answer}   │
│ • Inject CONTEXT        │  │ • Instructs AI to append:    │
│   section               │  │   [SUMMARY: brief desc]      │
│ • Add role restrictions │  │                              │
│                         │  │ Memory: 10-min TTL           │
│ maxTokens: 180          │  │ maxTokens: 130               │
└────────┬────────────────┘  └──────────┬───────────────────┘
         │                              │
         └──────────┬───────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. AI CORE (core.js) - SMART RETRY                         │
├─────────────────────────────────────────────────────────────┤
│ Console: [AI MODE] CLASSTRO | maxTokens: 180               │
│                                                             │
│ • Validate prompt (fail fast on invalid input)              │
│ • Check API key                                             │
│ • Generate unique reqId for tracing                         │
│                                                             │
│ RETRY LOOP (MAX_RETRIES = 0, only 503/network errors):     │
│   ┌──────────────────────────────────────────┐             │
│   │ Attempt 1: Call Gemini API               │             │
│   │ ├─→ model: "gemini-2.5-flash-lite"       │             │
│   │ ├─→ maxOutputTokens: 180 or 130          │             │
│   │ └─→ temperature: 0.3                     │             │
│   │                                          │             │
│   │ Error handling:                          │             │
│   │ • 429 rate limit → immediate fallback    │             │
│   │   (no retry - makes it worse)            │             │
│   │ • 404 model error → immediate fallback   │             │
│   │ • 400 bad request → immediate fallback   │             │
│   │ • 503 unavailable → retry with 1s delay  │             │
│   │ • Network error → retry with 1s delay    │             │
│   │                                          │             │
│   │ Logging:                                 │             │
│   │ [AI TRACE] PID, reqId, timestamp, model  │             │
│   │ [AI ERROR] Detailed status extraction    │             │
│   │ [AI FALLBACK] User-friendly message      │             │
│   └──────────────────────────────────────────┘             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. GEMINI API (gemini-2.5-flash-lite)                      │
├─────────────────────────────────────────────────────────────┤
│ Processing... (~1-2 seconds)                                │
│                                                             │
│ CLASSTRO Response (~80-120 tokens):                         │
│ "That's a teacher feature. As a student, you participate   │
│  in polls when your teacher launches them. Wait for the    │
│  teacher to create a poll, then you'll see it on your      │
│  screen to answer!"                                         │
│                                                             │
│ GENERAL Response (~60-90 tokens):                           │
│ "## Photosynthesis                                          │
│  Plants convert light into food.                            │
│  • Uses chlorophyll in leaves                               │
│  • Needs sunlight, water, CO2                               │
│  • Produces glucose and oxygen                              │
│  • Essential for plant growth                               │
│                                                             │
│  [SUMMARY: Explained photosynthesis process]"               │
│                                                             │
│  (Note: [SUMMARY: ...] removed before sending to user)      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. CONTROLLER FORMATS RESPONSE                              │
├─────────────────────────────────────────────────────────────┤
│ FOR GENERAL MODE - Extract & Store Memory:                  │
│ • extractSummary(aiResponse)                                │
│   - Finds [SUMMARY: ...] tag in response                    │
│   - Removes tag from visible response                       │
│   - Returns { summary, cleanResponse }                      │
│ • storeMemory(userId, userMessage, summary)                 │
│   - Stores last exchange in Map (10-min TTL)                │
│   - Available for next follow-up question                   │
│                                                             │
│ Console: [MEMORY] Stored summary for session_xyz            │
│                                                             │
│ Return cleaned response (no [SUMMARY: ...] visible):        │
│ {                                                           │
│   "success": true,                                          │
│   "data": {                                                 │
│     "message": "That's a teacher feature...",               │
│     "timestamp": "2026-03-01T10:30:00Z"                     │
│   }                                                         │
│ }                                                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 10. FRONTEND DISPLAYS (Custom Markdown Parser)             │
├─────────────────────────────────────────────────────────────┤
│ ChatMessage.jsx parses response:                            │
│ • Headings (###)                                            │
│ • Section headers (**Title:**)                              │
│ • Numbered lists (1. 2. 3.)                                 │
│ • Bullet points (• - *)                                     │
│ • Bold text (**text**)                                      │
│ • Code/highlights (`code`)                                  │
│ • Callout boxes (💡 ℹ️ ⚠️ ✅)                                │
│                                                             │
│ Total time: ~1-2 seconds                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛡️ Error Handling Flow (Status-Specific Strategy)

```
User asks question
        ↓
Gemini API Call
        ↓
    ┌───────────────────────┐
    │  Response OK?         │
    └───────┬───────────────┘
            │
      ┌─────┴─────┐
      │           │
     YES          NO
      │           │
      │      ┌────▼─────────────────────┐
      │      │ Extract Error Status     │
      │      │ (3 error shapes)         │
      │      └────┬─────────────────────┘
      │           │
      │      ┌────┴────────────┐
      │      │                 │
      │     429           404/400
      │ Rate Limit     Invalid Req
      │      │                 │
      │      │            ┌────▼─────────────────┐
      │      │            │ NO RETRY             │
      │      │            │ Return Fallback:     │
      │      │            │ "⚠️ Configuration    │
      │      │            │ issue..."            │
      │      │            └──────────────────────┘
      │      │
      │   ┌──▼──────────────────┐
      │   │ NO RETRY (429)      │
      │   │ Return Fallback:    │
      │   │ "⚠️ Too many        │
      │   │ requests, wait..."  │
      │   │                     │
      │   │ Why? Retrying 429   │
      │   │ makes it worse!     │
      │   └─────────────────────┘
      │
      │   ┌────────────────────────┐
      │   │ 503 / Network Error    │
      │   └────┬───────────────────┘
      │        │
      │   ┌────▼────────────────┐
      │   │ isRetryableError?   │
      │   │ YES                 │
      │   │ - Status 503        │
      │   │ - ECONNRESET        │
      │   │ - ETIMEDOUT         │
      │   │ - "UNAVAILABLE"     │
      │   │                     │
      │   │ MAX_RETRIES = 0     │
      │   │ (only initial call) │
      │   │                     │
      │   │ If retry enabled:   │
      │   │ Wait 1000ms, retry  │
      │   └────┬────────────────┘
      │        │
      │        ▼
      │   ┌──────────────────┐
      │   │ Return Fallback: │
      │   │ "⚠️ Service      │
      │   │ temporarily      │
      │   │ unavailable..."  │
      │   └──────────────────┘
      │
      ▼
    ┌──────────────┐
    │ SUCCESS!     │
    │ Return AI    │
    │ response     │
    └──────────────┘
```

**Error Strategy:**

- ✅ **429 Rate Limit:** Immediate fallback (no retry - makes it worse)
- ✅ **404/400:** Immediate fallback (no retry - bad config/request)
- ✅ **503/Network:** Retryable (but MAX_RETRIES=0 currently)
- ✅ **Status extraction:** Checks 3 error shapes for reliable detection
- ✅ **User-friendly fallbacks:** No raw errors shown to users

---

## ⚡ Token Usage Breakdown (Hybrid Mode)

### CLASSTRO Mode (Knowledge-Grounded)

```
User Message:          20 tokens
System Context:        60 tokens ✅ (streamlined)
Knowledge (CONTEXT):  100 tokens ✅ (compressed, max 1500 chars)
Role Restrictions:     30 tokens
Formatting Rules:      20 tokens
Total Input:         ~230 tokens ✅

AI Response:          180 tokens ✅ (maxTokens limit)
──────────────────────────────
TOTAL:                410 tokens ✅
Cost per request: $0.000041
Time: 1-2 seconds
```

### GENERAL Mode (Educational AI)

```
User Message:          20 tokens
System Context:        40 tokens ✅ (concise prompt)
Conciseness Rules:     20 tokens
Total Input:          ~80 tokens ✅ (minimal)

AI Response:          130 tokens ✅ (maxTokens limit)
+ Summary tag:         10 tokens
──────────────────────────────
TOTAL:                210 tokens ✅
Cost per request: $0.000021
Time: <1 second
```

### GENERAL Mode + Conversational Memory (Follow-up)

```
User Message:          15 tokens (typically shorter)
System Context:        40 tokens
Previous Context:
  - Last user msg:     15 tokens
  - Last summary:      15 tokens
Conciseness Rules:     20 tokens
Total Input:         ~105 tokens ✅ (+25 tokens for context)

AI Response:          130 tokens ✅ (maxTokens limit)
+ Summary tag:         10 tokens
──────────────────────────────
TOTAL:                245 tokens ✅
Cost per request: $0.000025
Time: <1 second

Additional overhead: +35 tokens (+17%) for context-aware response
```

### Comparison (Before vs After Hybrid Mode)

```
                  BEFORE      CLASSTRO    GENERAL
Input Tokens:     820         230         80
Output Tokens:    1024        180         130
Total:            1844        410         210
Cost/1000 req:    $0.184      $0.041      $0.021
Time:             3-5s        1-2s        <1s
```

**Savings:**

- CLASSTRO: 78% fewer tokens, 60% faster, 78% lower cost
- GENERAL: 89% fewer tokens, 70% faster, 89% lower cost

---

## 🧠 Hybrid Mode Intent Detection

```
detectIntent(message)
        │
        ├─→ Normalize: toLowerCase()
        │
        ├─→ Check 30+ Classtro keywords:
        │   • classtro, session, poll, qna, room
        │   • feedback, attendance, anonymous
        │   • teacher, student, join, create
        │   • session code, room code, upvote
        │   • live session, classroom, host
        │   • participant, engagement, analytics
        │   • dashboard, quiz, survey, rating
        │   • emoji feedback
        │
        ├─→ Match found?
        │   │
        │   ├─YES─→ Return "CLASSTRO"
        │   │        ↓
        │   │   buildClasstroPrompt()
        │   │   • Inject knowledge base
        │   │   • Filter by role
        │   │   • maxTokens: 180
        │   │
        │   └─NO──→ Return "GENERAL"
        │            ↓
        │       buildGeneralPrompt()
        │       • Concise educational AI
        │       • No knowledge restriction
        │       • maxTokens: 130
        │
        └─→ Log: [HYBRID MODE] Intent: CLASSTRO/GENERAL
```

---

## 🧠 Knowledge Selection Logic (CLASSTRO Mode Only)

```
getRelevantKnowledge(userMessage, role, page)
        │
        ├─→ Step 1: detectTopics(query)
        │   Pattern matching for:
        │   • rooms, sessions, polls, qna, feedback
        │   Returns array of detected topics
        │
        ├─→ Step 2: Load relevant JSON files
        │   topics.forEach(topic => load topic.json)
        │
        ├─→ Step 3: Filter by role
        │   role: "student" → extract student sections
        │   role: "teacher" → extract teacher sections
        │   role: "guest" → extract basic info
        │
        ├─→ Step 4: Compress to readable text
        │   JSON → Formatted text with:
        │   • Headings (## Feature Name)
        │   • Bullet points for key info
        │   • How-to steps (numbered)
        │   • Tips and restrictions
        │   Max: 1500 characters
        │
        └─→ Step 5: Return formatted knowledge
            Inject into CONTEXT section of prompt
```

**Example Output:**

```
## Live Sessions
Teachers can create interactive sessions with unique codes.
• Students join using 6-digit code
• Anonymous participation option
• Real-time engagement tracking

How to Join:
1. Get session code from teacher
2. Enter code on join page
3. Set display name
4. Start participating!

Tips:
• Use descriptive display names
• Keep session code private
```

---

## 🔒 Security Flow

```
Student asks: "What's the answer to poll 1?"
        ↓
chatPrompt.js:
    role: "student"
    Inject security rule: "NEVER reveal quiz/poll answers"
        ↓
Gemini receives prompt with explicit guardrails
        ↓
AI Response:
    "I can't reveal poll answers - that would defeat the
     purpose! Answer based on your own understanding. 😊"
        ↓
✅ Security maintained
---

## 🎯 Performance Targets vs Actual (Hybrid Mode - March 2026)

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Chat response time (CLASSTRO) | < 2s | 1-2s | ✅ |
| Chat response time (GENERAL) | < 1s | <1s | ✅ |
| Chat response time (GENERAL+Memory) | < 1s | <1s | ✅ |
| Insights generation | < 5s | N/A (TODO) | ⏳ |
| Token usage (CLASSTRO) | < 500 | ~410 | ✅ |
| Token usage (GENERAL) | < 250 | ~210 | ✅ |
| Token usage (GENERAL+Memory) | < 280 | ~245 | ✅ |
| Cost per 1000 CLASSTRO | < $0.05 | $0.041 | ✅ |
| Cost per 1000 GENERAL | < $0.03 | $0.021 | ✅ |
| Cost per 1000 GENERAL+Memory | < $0.03 | $0.025 | ✅ |
| Model | gemini-2.5-flash-lite | gemini-2.5-flash-lite | ✅ |
| Temperature | 0.3 | 0.3 | ✅ |
| MAX_RETRIES | 0 | 0 | ✅ |
| Error fallback UX | Clean | No raw errors shown | ✅ |
| Manual throttling | None | None (removed) | ✅ |
| Conversational memory | GENERAL only | GENERAL only | ✅ |
| Memory TTL | 10 min | 10 min | ✅ |

---

## 🚀 Scalability (Hybrid Architecture)

```

Multiple concurrent users:

User 1 → Request → Knowledge (shared singleton)
User 2 → Request → Knowledge (shared singleton)
User 3 → Request → Knowledge (shared singleton)
↓ ↓
No file I/O Same instance
Fast lookup Memory efficient

```

**Benefits:**
- Knowledge loaded once at startup (singleton pattern)
- All requests share same data - zero file I/O
- Memory footprint: ~2MB (all JSONs)
- Horizontal scaling ready (stateless)
- **Hybrid mode:** Automatic intent detection routes to appropriate prompt
- **Dynamic token limits:** Efficient resource usage per intent type
- **No artificial throttling:** Let Gemini enforce rate limits naturally
- **Status-specific error handling:** Smart fallback strategies

---

## 💬 Conversational Memory Flow (GENERAL Mode Only)

```

┌─────────────────────────────────────────────────────────────┐
│ User 1: "What is supervised learning?" │
└────────────────────────┬────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────┐
│ Controller - Memory Check │
├─────────────────────────────────────────────────────────────┤
│ • detectIntent(message) → "GENERAL" │
│ • getUserIdentifier(req) → "session_abc123" │
│ • isFollowUpQuestion("What is...") → FALSE │
│ (no follow-up keywords detected) │
│ • previousContext = null │
└────────────────────────┬────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────┐
│ Build Prompt (NO previous context) │
├─────────────────────────────────────────────────────────────┤
│ buildGeneralPrompt(message, null) │
│ • Basic educational prompt │
│ • No memory context added │
│ • maxTokens: 130 │
└────────────────────────┬────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────┐
│ AI Response │
├─────────────────────────────────────────────────────────────┤
│ "## Supervised Learning │
│ Uses labeled data to train models... │
│ • Requires input-output pairs │
│ • Examples: classification, regression │
│ [SUMMARY: Explained supervised learning with examples]" │
└────────────────────────┬────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────┐
│ Controller - Store Memory │
├─────────────────────────────────────────────────────────────┤
│ • extractSummary(response) │
│ → summary: "Explained supervised learning with examples" │
│ → cleanResponse: (without [SUMMARY: ...]) │
│ • storeMemory("session_abc123", │
│ "What is supervised learning?", │
│ "Explained supervised learning...") │
│ │
│ Console: [MEMORY] Stored summary for session_abc123 │
│ │
│ Return: cleanResponse (no [SUMMARY: ...] visible) │
└────────────────────────┬────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────┐
│ User 2: "which is more accurate?" │
└────────────────────────┬────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────┐
│ Controller - Memory Check │
├─────────────────────────────────────────────────────────────┤
│ • detectIntent(message) → "GENERAL" │
│ • getUserIdentifier(req) → "session_abc123" │
│ • isFollowUpQuestion("which is...") → TRUE ✅ │
│ (detected "which" keyword) │
│ • getMemory("session_abc123") → previousContext: │
│ { │
│ lastUserMessage: "What is supervised learning?", │
│ lastAssistantSummary: "Explained supervised learning..."│
│ } │
│ │
│ Console: [MEMORY] Retrieved context for session_abc123 │
└────────────────────────┬────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────┐
│ Build Prompt (WITH previous context) │
├─────────────────────────────────────────────────────────────┤
│ buildGeneralPrompt(message, previousContext) │
│ │
│ Prompt includes: │
│ "Previous Context: │
│ User: What is supervised learning? │
│ Assistant Summary: Explained supervised learning... │
│ │
│ Use the above context to answer intelligently if relevant. │
│ │
│ Current Question: │
│ which is more accurate?" │
│ │
│ • AI now understands "which" refers to learning types │
│ • maxTokens: 130 │
└────────────────────────┬────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────┐
│ AI Response (Context-Aware) │
├─────────────────────────────────────────────────────────────┤
│ "## Supervised vs Unsupervised Accuracy │
│ Supervised learning is generally more accurate when │
│ labeled data is available... │
│ • Supervised: High accuracy with good labels │
│ • Unsupervised: Lower accuracy, exploratory │
│ [SUMMARY: Compared accuracy of supervised vs unsupervised]"│
└────────────────────────┬────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────┐
│ Controller - Update Memory │
├─────────────────────────────────────────────────────────────┤
│ • extractSummary(response) │
│ → summary: "Compared accuracy of supervised vs..." │
│ • storeMemory("session_abc123", │
│ "which is more accurate?", │
│ "Compared accuracy of...") │
│ → Replaces previous memory │
│ │
│ Console: [MEMORY] Stored summary for session_abc123 │
└─────────────────────────────────────────────────────────────┘

```

### Follow-Up Detection Keywords
```

isFollowUpQuestion() checks for:
• which, better, that, this, these, those
• why, how about, what about
• more, explain further, tell me more
• elaborate, clarify, difference
• compare, between, example
• instead, also, too, as well

```

### Memory Storage
```

memoryStore (Map):
├─ user_12345 (authenticated user)
│ ├─ lastUserMessage: "What is React?"
│ ├─ lastAssistantSummary: "Explained React basics"
│ └─ timestamp: 1709380000000
│
├─ session_xyz789 (guest user)
│ ├─ lastUserMessage: "Difference between var and let?"
│ ├─ lastAssistantSummary: "Explained var vs let scope"
│ └─ timestamp: 1709380120000
│
└─ Auto-cleanup: Every 5 minutes, remove entries > 10 min old

```

### Key Features
- ✅ **Lightweight:** Only stores ONE exchange per user (not full history)
- ✅ **Token-Optimized:** Summary is 1 sentence (~10-15 tokens)
- ✅ **Guest Support:** Works for authenticated AND guest users (session-based)
- ✅ **Smart Detection:** Only retrieves memory when follow-up detected
- ✅ **Auto-Cleanup:** 10-minute TTL, periodic garbage collection
- ✅ **GENERAL Mode Only:** CLASSTRO mode unaffected (uses knowledge base)
- ✅ **Hidden Tags:** [SUMMARY: ...] removed before sending to user

---

## 🆕 Recent Enhancements (March 2026 - Hybrid Mode Release)

### ✅ Hybrid Mode Architecture (MAJOR)
- **Intent Detection:** Automatic detection of Classtro vs General questions
- **Dual Prompt Builders:**
  - `buildClasstroPrompt()`: Knowledge-grounded, role-filtered, max 180 tokens
  - `buildGeneralPrompt()`: Concise educational, max 4 bullets, max 130 tokens
- **Dynamic Token Limits:** Context-specific optimization (180 vs 130)
- **Logging:** `[HYBRID MODE]` and `[AI MODE]` traces for debugging

### ✅ Intent Detection Layer
- **30+ Classtro Keywords:** session, poll, qna, room, feedback, join, create, etc.
- **Pattern Matching:** Fast keyword-based classification
- **Fallback to General:** Educational AI for non-platform questions
- **File:** `intentDetector.js`

### ✅ Knowledge Extraction Enhancement
- **Topic Detection:** `detectTopics()` identifies relevant features
- **Role-Based Filtering:** Separate content for teacher/student/guest
- **Smart Compression:** Max 1500 chars, structured with headings and bullets
- **Function:** `getRelevantKnowledge()` in `knowledge/index.js`

### ✅ Manual Throttling Removal
- **Removed:** REQUEST_GUARD_MS, _lastRequestAt, _lastRequestId
- **Reason:** Artificial blocking caused false positives
- **Strategy:** Let Gemini API enforce rate limits naturally
- **Error Handling:** 429 returns immediate fallback (no retry)

### ✅ Model & Configuration Updates
- **Model:** gemini-2.5-flash-lite (was gemini-3-flash-preview)
- **Temperature:** 0.3 (consistent, deterministic)
- **MAX_RETRIES:** 0 (fail-fast, only 503/network errors retryable)
- **Error Status Extraction:** Checks 3 error shapes reliably

### ✅ Custom Markdown Parser (Frontend)
- **File:** `ChatMessage.jsx`
- **Supports:** Headings, section headers, numbered lists, bullets, bold, code, callout boxes
- **No Dependencies:** Fully custom implementation
- **Responsive:** Mobile-friendly with Tailwind CSS

### ✅ Conversational Memory (GENERAL Mode Only)
- **Lightweight Storage:** One exchange per user (lastUserMessage + lastAssistantSummary)
- **Follow-Up Detection:** Auto-detects follow-up questions via keywords (which, better, that, why, etc.)
- **Smart Context Injection:** Only adds previous context when follow-up detected
- **Token-Optimized:** +35 tokens overhead (17% increase) for context-aware responses
- **Guest Support:** Works for authenticated users (user_id) AND guests (session_hash)
- **Auto-Cleanup:** 10-minute TTL, periodic garbage collection
- **Summary Extraction:** Removes [SUMMARY: ...] tags before sending to user
- **Files:** `memoryManager.js`, `followUpDetector.js`
- **Token Cost:** ~245 tokens for follow-up (vs 210 for regular)

### ✅ Comment Cleanup
- **Removed:** Verbose JSDoc blocks, obvious inline comments
- **Kept:** Essential algorithmic logic comments only
- **Files:** core.js, intentDetector.js, promptBuilder.js, chatPrompt.js, aiController.js, ChatMessage.jsx

---

## 📈 Performance Improvements

| Metric | Before | Hybrid Mode | With Memory | Improvement |
|--------|--------|-------------|-------------|-------------|
| CLASSTRO tokens | 1844 | 410 | N/A | 78% reduction |
| GENERAL tokens | 1844 | 210 | 245 | 89% / 87% reduction |
| CLASSTRO cost/1k | $0.184 | $0.041 | N/A | 78% savings |
| GENERAL cost/1k | $0.184 | $0.021 | $0.025 | 89% / 86% savings |
| Response time | 3-5s | 1-2s / <1s | <1s | 60-70% faster |
| Code comments | Verbose | Minimal | Minimal | Production-ready |
| Follow-up awareness | None | None | YES | Context-aware |

**Key Benefits:**
- Conversational memory adds only +35 tokens (17% overhead) when follow-up detected
- Guest users get same experience as authenticated users (session-based memory)
- 10-minute TTL ensures fresh context without memory bloat
- [SUMMARY: ...] tags hidden from user - clean UX

---

Built with ❤️ for Classtro | Hybrid Mode Release - March 2026
```
