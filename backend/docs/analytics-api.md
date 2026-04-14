# Analytics API Documentation

## Overview

The Analytics API provides comprehensive analytics data for Classtro sessions, including participant statistics, timeline data, polls, questions, and feedback.

## Endpoints

### 1. Generate Analytics

**POST** `/api/analytics/generate/:sessionId`

Generates and stores analytics data for a session.

**Request Body:**

```json
{
  "sections": {
    "participants": true,
    "timeline": true,
    "polls": true,
    "qna": true,
    "attendance": true,
    "feedback": true,
    "ai": false
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Analytics generated successfully",
  "generated": true
}
```

### 2. Get Raw Analytics Data

**GET** `/api/analytics/:sessionId`

Retrieves the raw analytics data stored in the database.

**Response:**

```json
{
  "success": true,
  "data": {
    "sessionId": "...",
    "roomId": "...",
    "generatedAt": "2024-...",
    "sections": {
      "participants": { ... },
      "timeline": [ ... ],
      "polls": [ ... ]
    }
  }
}
```

### 3. Get Frontend-Compatible Analytics

**GET** `/api/analytics/frontend/:sessionId`

Retrieves analytics data formatted specifically for the frontend React components.

**Response:**

```json
{
  "success": true,
  "data": {
    "sessionInfo": {
      "title": "Session Title",
      "roomName": "Room Name",
      "startAt": "2024-...",
      "endAt": "2024-...",
      "totalParticipants": 45,
      "peakParticipants": 42,
      "pollsConducted": 5,
      "questionsAsked": 17
    },
    "participants": [
      {
        "id": "participant_id",
        "name": "John Doe",
        "joinAt": "2024-...",
        "leaveAt": "2024-...",
        "duration": 55
      }
    ],
    "participantsTimeline": [
      {
        "time": "10:00",
        "activeCount": 5
      }
    ],
    "polls": [
      {
        "id": "poll_id",
        "question": "Poll question?",
        "options": [
          {
            "text": "Option A",
            "votes": 18
          }
        ],
        "totalResponses": 45
      }
    ],
    "questions": [
      {
        "id": "question_id",
        "askedBy": "Alice Johnson",
        "text": "Question text?",
        "upvotes": 8,
        "answered": true,
        "createdAt": "2024-..."
      }
    ],
    "feedback": {
      "averageRating": 4.3,
      "comments": ["Great session!", "..."],
      "sentiment": "positive"
    }
  }
}
```

### 4. Delete Analytics

**DELETE** `/api/analytics/:sessionId`

Deletes stored analytics data (useful for regeneration).

**Response:**

```json
{
  "success": true,
  "message": "Analytics deleted successfully"
}
```

### 5. Test Participant Stats

**GET** `/api/analytics/test/participants/:sessionId`

Development endpoint to test participant statistics generation.

**Response:**

```json
{
  "success": true,
  "data": {
    "totalParticipants": 15,
    "peakConcurrentUsers": 12,
    "averageConcurrentUsers": 8.5,
    "averageSessionDuration": 45.6,
    "totalSessionTime": 684,
    "engagementRate": 76.5,
    "participantBreakdown": {
      "activeParticipants": 10,
      "leftParticipants": 5,
      "kickedParticipants": 0
    },
    "durationDistribution": {
      "0-5min": 2,
      "5-15min": 3,
      "15-30min": 4,
      "30-60min": 5,
      "60min+": 1
    },
    "topParticipantsByDuration": [...]
  }
}
```

## Frontend Usage

The frontend should use the `/api/analytics/frontend/:sessionId` endpoint as it provides data in the exact format expected by the React components:

```javascript
// Replace the mock data in AnalyticsContext.jsx
const loadData = async () => {
  try {
    setLoading(true);

    const response = await fetch(`/api/analytics/frontend/${sessionId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const result = await response.json();
      setAnalyticsData(result.data);
    } else {
      throw new Error("Failed to load analytics");
    }
  } catch (err) {
    setError("Failed to load analytics data");
  } finally {
    setLoading(false);
  }
};
```

## Data Flow

1. **Session End**: Generate analytics using POST `/generate/:sessionId`
2. **Display Analytics**: Fetch formatted data using GET `/frontend/:sessionId`
3. **Regenerate**: Delete old data using DELETE `/:sessionId` then regenerate

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

Common error codes:

- **400**: Validation failed (invalid sessionId format)
- **404**: Session not found
- **500**: Server error during analytics generation
