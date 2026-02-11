# Classtro AI Architecture

## 📊 System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
│  ┌─────────────────┐              ┌──────────────────┐         │
│  │  ChatBot UI     │              │  Analytics Page  │         │
│  │  Component      │              │  Component       │         │
│  └────────┬────────┘              └────────┬─────────┘         │
│           │                                 │                    │
│           │ POST /api/ai/chat              │ POST /api/ai/      │
│           │                                 │      insights      │
└───────────┼─────────────────────────────────┼───────────────────┘
            │                                 │
            ▼                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND - API LAYER                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              routes/aiRoutes.js                           │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │  │
│  │  │ POST /chat   │  │ POST /insights│  │ GET /health   │  │  │
│  │  └──────┬───────┘  └──────┬────────┘  └───────┬───────┘  │  │
│  └─────────┼──────────────────┼─────────────────────┼─────────┘  │
│            │                  │                     │            │
│            ▼                  ▼                     ▼            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │       controllers/aiController.js                        │   │
│  │  • handleChatRequest()                                   │   │
│  │  • handleInsightsRequest()                               │   │
│  │  • handleHealthCheck()                                   │   │
│  └─────────┬───────────────────────┬─────────────────────────┘   │
│            │                       │                            │
│            ▼                       ▼                            │
│  ┌─────────────────────┐  ┌──────────────────────┐            │
│  │   Prompt Builders    │  │   Prompt Builders     │            │
│  │  chatPrompt.js       │  │  insightsPrompt.js    │            │
│  │                      │  │                       │            │
│  │ buildChatPrompt()    │  │ buildInsightsPrompt() │            │
│  └──────────┬───────────┘  └──────────┬────────────┘            │
│             │                         │                         │
│             └────────┬────────────────┘                         │
│                      ▼                                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            services/ai/core.js                            │  │
│  │                                                            │  │
│  │        generateAIResponse(prompt, options)                │  │
│  │                                                            │  │
│  │  • Parameter validation                                   │  │
│  │  • Error handling                                         │  │
│  │  • Provider communication                                 │  │
│  └──────────────────────┬───────────────────────────────────┘  │
│                         │                                      │
└─────────────────────────┼──────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL AI PROVIDER                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │        Google Gemini API (gemini-3-flash-preview)         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Request Flow Examples

### Example 1: Student Asks Question via Chatbot

```
1. Student types: "How do I join a session?"

2. Frontend sends:
   POST /api/ai/chat
   {
     "message": "How do I join a session?",
     "role": "student",
     "page": "landing"
   }

3. aiController.handleChatRequest()
   - Validates input
   - Calls buildChatPrompt()

4. buildChatPrompt() generates:
   "You are Classtro AI Assistant...
    Role: Student
    Question: How do I join a session?
    [Security rules, context, etc.]"

5. generateAIResponse()
   - Calls Gemini API
   - Returns response

6. Controller formats and returns:
   {
     "success": true,
     "data": {
       "message": "To join a session, click 'Join Session'...",
       "timestamp": "2026-02-11T10:30:00Z"
     }
   }

7. Frontend displays response in chat UI
```

### Example 2: Teacher Requests Session Insights (Future)

```
1. Teacher views session analytics page

2. Frontend sends:
   POST /api/ai/insights
   {
     "sessionData": {
       "title": "Physics 101",
       "polls": [...],
       "questions": [...],
       "feedback": [...]
     }
   }

3. aiController.handleInsightsRequest()
   - Validates session data
   - Calls buildInsightsPrompt() [To be implemented]

4. buildInsightsPrompt() generates:
   "Analyze this session...
    [Poll data, Q&A data, feedback]
    Provide: engagement summary, insights, recommendations"

5. generateAIResponse()
   - Calls AI with longer context
   - Returns detailed analysis

6. Controller returns:
   {
     "success": true,
     "data": {
       "insights": "Engagement: High (87%)...",
       "recommendations": [...],
       "timestamp": "..."
     }
   }

7. Frontend displays insights cards
```

## 🏗️ Architecture Principles

### 1. Separation of Concerns
```
Routes     → "What endpoints exist?"
Controllers → "How do we handle requests?"
Prompts    → "What context does AI need?"
Core       → "How do we call AI?"
```

### 2. Single Source of Truth
- AI calls happen ONLY in `core.js`
- Easy to swap providers (Gemini → AWS)
- Consistent error handling

### 3. Provider Agnostic Design
```javascript
// Today: Google Gemini
import { GoogleGenAI } from "@google/genai";

// Tomorrow: AWS Bedrock
import { BedrockClient } from "@aws-sdk/client-bedrock";

// Routes/Controllers/Prompts → NO CHANGES NEEDED
```

## 📂 File Responsibilities

| File | Purpose | Changes When... |
|------|---------|-----------------|
| `core.js` | AI provider communication | Switching AI provider |
| `chatPrompt.js` | Build chat contexts | Adding chat features |
| `insightsPrompt.js` | Build analytics prompts | Adding analytics features |
| `aiController.js` | Handle HTTP logic | Adding new endpoints |
| `aiRoutes.js` | Define endpoints | Adding new routes |
| `index.js` | Export interface | Adding new exports |

## 🔒 Security Layers

```
┌─────────────────────────────────────┐
│  1. JWT Authentication              │  ← authenticateJWT middleware
│     (Routes layer)                  │
├─────────────────────────────────────┤
│  2. Input Validation                │  ← Controller validates body
│     (Controller layer)              │
├─────────────────────────────────────┤
│  3. Role-Based Prompts              │  ← Prompt builder adds security rules
│     (Prompt layer)                  │
├─────────────────────────────────────┤
│  4. Error Sanitization              │  ← Core.js sanitizes AI errors
│     (Core layer)                    │
└─────────────────────────────────────┘
```

## 🚀 Scalability Features

### Horizontal Scaling
```
Load Balancer
    ├── Backend Instance 1 (AI Module)
    ├── Backend Instance 2 (AI Module)
    └── Backend Instance 3 (AI Module)
          └── All share same AI core logic
```

### Future Extensions
```
/services/ai/
├── core.js
├── prompts/
│   ├── chatPrompt.js         ✅ Implemented
│   ├── insightsPrompt.js     🔄 In Progress
│   ├── emailPrompt.js        ⏳ Future
│   └── summaryPrompt.js      ⏳ Future
└── providers/                ⏳ Future (multi-provider)
    ├── gemini.js
    ├── openai.js
    └── bedrock.js
```

## 💡 Migration Path (Gemini → AWS)

### Step 1: Create AWS Provider
```javascript
// services/ai/providers/bedrock.js
export async function callBedrock(prompt, options) {
  // AWS implementation
}
```

### Step 2: Update Core
```javascript
// services/ai/core.js
import { callBedrock } from './providers/bedrock.js';

export async function generateAIResponse(prompt, options) {
  if (process.env.AI_PROVIDER === 'aws') {
    return callBedrock(prompt, options);
  }
  // Gemini fallback
}
```

### Step 3: Deploy
- ✅ Routes unchanged
- ✅ Controllers unchanged
- ✅ Prompts unchanged
- ✅ Frontend unchanged

---

Built with ❤️ for scalable AI integration
