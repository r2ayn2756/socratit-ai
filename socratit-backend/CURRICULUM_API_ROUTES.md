# Curriculum Mapping API Routes

Complete API documentation for the curriculum scheduling and planning system.

## Table of Contents
- [Overview](#overview)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Curriculum Schedule Routes](#curriculum-schedule-routes)
- [Curriculum Unit Routes](#curriculum-unit-routes)
- [Error Responses](#error-responses)
- [Usage Examples](#usage-examples)

---

## Overview

The curriculum mapping system provides year-long scheduling and planning capabilities for teachers and progress tracking for students. All routes require authentication and follow RESTful conventions.

**Base URL:** `/api/v1`

---

## Authentication

All routes require a valid JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### Role-Based Access Control

- **TEACHER**: Can create, read, update, delete schedules and units
- **STUDENT**: Can view schedules/units and track their own progress
- **ADMIN**: Full access to all operations

---

## Rate Limiting

Different rate limits apply based on operation type:

| Operation Type | Limit | Window |
|---------------|-------|--------|
| Standard CRUD | 100 requests | 15 minutes |
| AI Operations | 20 requests | 15 minutes |
| Progress Tracking | 100 requests | 5 minutes |
| Time Tracking | 60 requests | 1 minute |

---

## Curriculum Schedule Routes

### Create Schedule

**POST** `/api/v1/curriculum-schedules`

Create a new curriculum schedule for a class.

**Auth:** Teacher only

**Request Body:**
```json
{
  "classId": "uuid",
  "schoolYearStart": "2024-09-01T00:00:00.000Z",
  "schoolYearEnd": "2025-06-15T00:00:00.000Z",
  "title": "8th Grade Math - Year Plan",
  "description": "Year-long curriculum for Algebra I",
  "meetingPattern": "Daily (M-F)",
  "curriculumMaterialId": "uuid" // Optional
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Curriculum schedule created successfully",
  "data": {
    "id": "uuid",
    "classId": "uuid",
    "teacherId": "uuid",
    "schoolId": "uuid",
    "title": "8th Grade Math - Year Plan",
    "description": "Year-long curriculum for Algebra I",
    "schoolYearStart": "2024-09-01T00:00:00.000Z",
    "schoolYearEnd": "2025-06-15T00:00:00.000Z",
    "totalWeeks": 40,
    "totalDays": 180,
    "status": "DRAFT",
    "createdAt": "2024-08-15T10:30:00.000Z"
  }
}
```

---

### Get Schedule by ID

**GET** `/api/v1/curriculum-schedules/:scheduleId`

Get a specific curriculum schedule with optional inclusions.

**Auth:** Teachers (creator + class teachers) and Students (enrolled)

**Query Parameters:**
- `includeProgress` (boolean): Include progress statistics
- `includeAssignments` (boolean): Include unit assignments

**Example:** `/api/v1/curriculum-schedules/abc-123?includeProgress=true`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "class": {
      "id": "uuid",
      "name": "8th Grade Math - Period 2",
      "subject": "Mathematics"
    },
    "schoolYearStart": "2024-09-01T00:00:00.000Z",
    "schoolYearEnd": "2025-06-15T00:00:00.000Z",
    "totalWeeks": 40,
    "totalDays": 180,
    "status": "PUBLISHED",
    "currentUnit": {
      "id": "uuid",
      "title": "Linear Equations",
      "unitNumber": 3
    },
    "completedUnits": 2,
    "totalUnits": 8,
    "percentComplete": 25,
    "units": [
      {
        "id": "uuid",
        "title": "Introduction to Algebra",
        "unitNumber": 1,
        "startDate": "2024-09-01T00:00:00.000Z",
        "endDate": "2024-10-15T00:00:00.000Z",
        "estimatedWeeks": 6,
        "status": "COMPLETED",
        "difficultyLevel": 2,
        "unitType": "CORE",
        "percentComplete": 100
      }
    ],
    "createdAt": "2024-08-15T10:30:00.000Z",
    "publishedAt": "2024-08-20T14:00:00.000Z"
  }
}
```

---

### Get Schedules for Class

**GET** `/api/v1/curriculum-schedules/class/:classId`

Get all schedules for a specific class.

**Auth:** Teachers (class teachers) and Students (enrolled)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "8th Grade Math - Year Plan",
      "status": "PUBLISHED",
      "totalUnits": 8,
      "completedUnits": 2,
      "percentComplete": 25,
      "createdAt": "2024-08-15T10:30:00.000Z"
    }
  ]
}
```

---

### Update Schedule

**PATCH** `/api/v1/curriculum-schedules/:scheduleId`

Update a curriculum schedule.

**Auth:** Teacher (creator or class teacher) only

**Request Body (all fields optional):**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "schoolYearStart": "2024-09-05T00:00:00.000Z",
  "schoolYearEnd": "2025-06-20T00:00:00.000Z",
  "status": "PUBLISHED"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Schedule updated successfully",
  "data": {
    "id": "uuid",
    "title": "Updated Title",
    // ... full schedule object
  }
}
```

---

### Publish Schedule

**POST** `/api/v1/curriculum-schedules/:scheduleId/publish`

Publish a schedule to make it visible to students.

**Auth:** Teacher (creator or class teacher) only

**Response (200):**
```json
{
  "success": true,
  "message": "Schedule published successfully",
  "data": {
    "id": "uuid",
    "status": "PUBLISHED",
    "publishedAt": "2024-08-20T14:00:00.000Z"
  }
}
```

---

### Delete Schedule

**DELETE** `/api/v1/curriculum-schedules/:scheduleId`

Soft delete a curriculum schedule.

**Auth:** Teacher (creator only)

**Response (200):**
```json
{
  "success": true,
  "message": "Schedule deleted successfully"
}
```

---

### Generate Schedule from AI

**POST** `/api/v1/curriculum-schedules/:scheduleId/generate-ai`

Generate a year-long curriculum schedule using AI based on uploaded curriculum materials.

**Auth:** Teacher (creator or class teacher) only

**Rate Limit:** 20 requests per 15 minutes

**Request Body:**
```json
{
  "curriculumMaterialId": "uuid",
  "preferences": {
    "targetUnits": 8,
    "pacingPreference": "standard",
    "includeReviewUnits": true,
    "breakDates": ["2024-12-20", "2025-03-15"]
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Schedule generated successfully from AI",
  "data": {
    "scheduleId": "uuid",
    "units": [
      {
        "title": "Introduction to Algebra",
        "description": "Foundational algebraic concepts...",
        "startDate": "2024-09-01T00:00:00.000Z",
        "endDate": "2024-10-15T00:00:00.000Z",
        "estimatedWeeks": 6,
        "difficultyLevel": 2,
        "topics": [
          {
            "name": "Variables and Expressions",
            "subtopics": ["Variable notation", "Algebraic expressions"],
            "concepts": ["Variables", "Constants", "Coefficients"],
            "learningObjectives": ["Define and identify variables in expressions"]
          }
        ],
        "aiConfidence": 0.92
      }
    ],
    "metadata": {
      "totalUnits": 8,
      "estimatedTotalWeeks": 40,
      "difficultyProgression": "gradual"
    }
  }
}
```

---

### Refine Schedule with AI

**POST** `/api/v1/curriculum-schedules/:scheduleId/refine-ai`

Chat with AI to refine and adjust the schedule.

**Auth:** Teacher (creator or class teacher) only

**Rate Limit:** 20 requests per 15 minutes

**Request Body:**
```json
{
  "message": "I want to spend more time on quadratic equations",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Can you make the first unit shorter?"
    },
    {
      "role": "assistant",
      "content": "I can reduce Unit 1 from 6 weeks to 4 weeks..."
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "response": "I've adjusted the schedule to allocate 8 weeks for quadratic equations...",
    "suggestedChanges": [
      {
        "unitId": "uuid",
        "unitTitle": "Quadratic Equations",
        "field": "estimatedWeeks",
        "currentValue": 5,
        "suggestedValue": 8,
        "reasoning": "More time needed for complex concept mastery"
      }
    ],
    "previewSchedule": {
      "units": [
        // Preview of adjusted schedule
      ]
    }
  }
}
```

---

### Get Schedule Suggestions

**GET** `/api/v1/curriculum-schedules/:scheduleId/suggestions`

Get AI-powered improvement suggestions for the schedule.

**Auth:** Teacher (creator or class teacher) only

**Rate Limit:** 20 requests per 15 minutes

**Response (200):**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "type": "PACING",
        "title": "Adjust pacing for Unit 3",
        "description": "Current pacing may be too fast for complex topics",
        "affectedUnits": ["uuid-unit3"],
        "suggestedAction": "Extend Unit 3 by 1-2 weeks",
        "priority": "HIGH"
      },
      {
        "type": "REVIEW",
        "title": "Add review unit before finals",
        "description": "Students would benefit from comprehensive review",
        "affectedUnits": ["uuid-unit7", "uuid-unit8"],
        "suggestedAction": "Insert 2-week review unit in May",
        "priority": "MEDIUM"
      }
    ]
  }
}
```

---

### Calculate Schedule Progress

**POST** `/api/v1/curriculum-schedules/:scheduleId/calculate-progress`

Calculate and update overall schedule progress.

**Auth:** Teacher (creator or class teacher) only

**Rate Limit:** 50 requests per 5 minutes

**Response (200):**
```json
{
  "success": true,
  "message": "Schedule progress calculated successfully"
}
```

---

## Curriculum Unit Routes

### Create Unit

**POST** `/api/v1/curriculum-units`

Create a new curriculum unit manually.

**Auth:** Teacher only

**Request Body:**
```json
{
  "scheduleId": "uuid",
  "title": "Linear Equations",
  "description": "Solving and graphing linear equations",
  "startDate": "2024-10-16T00:00:00.000Z",
  "endDate": "2024-11-20T00:00:00.000Z",
  "topics": [
    {
      "name": "One-Variable Equations",
      "subtopics": ["Solving simple equations", "Multi-step equations"],
      "concepts": ["Inverse operations", "Balancing equations"],
      "learningObjectives": ["Solve one-variable linear equations"]
    }
  ],
  "difficultyLevel": 3,
  "unitType": "CORE",
  "isOptional": false
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Curriculum unit created successfully",
  "data": {
    "id": "uuid",
    "scheduleId": "uuid",
    "title": "Linear Equations",
    "unitNumber": 3,
    "orderIndex": 2,
    "status": "SCHEDULED",
    // ... full unit object
  }
}
```

---

### Get Unit by ID

**GET** `/api/v1/curriculum-units/:unitId`

Get a specific curriculum unit.

**Auth:** Teachers (creator + class teachers) and Students (enrolled)

**Query Parameters:**
- `includeProgress` (boolean): Include progress statistics
- `includeAssignments` (boolean): Include assignments

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Linear Equations",
    "description": "Solving and graphing linear equations",
    "unitNumber": 3,
    "startDate": "2024-10-16T00:00:00.000Z",
    "endDate": "2024-11-20T00:00:00.000Z",
    "estimatedWeeks": 5,
    "status": "IN_PROGRESS",
    "difficultyLevel": 3,
    "unitType": "CORE",
    "topics": [...],
    "learningObjectives": [...],
    "concepts": [...],
    "percentComplete": 45,
    "progress": {
      "studentsStarted": 28,
      "studentsCompleted": 12,
      "averageProgress": 45
    }
  }
}
```

---

### Get Units for Schedule

**GET** `/api/v1/curriculum-units/schedule/:scheduleId`

Get all units for a schedule.

**Auth:** Teachers (class teachers) and Students (enrolled)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Introduction to Algebra",
      "unitNumber": 1,
      "status": "COMPLETED",
      "percentComplete": 100
    },
    {
      "id": "uuid",
      "title": "Linear Equations",
      "unitNumber": 3,
      "status": "IN_PROGRESS",
      "percentComplete": 45
    }
  ]
}
```

---

### Update Unit

**PATCH** `/api/v1/curriculum-units/:unitId`

Update a curriculum unit.

**Auth:** Teacher (creator or class teacher) only

**Request Body (all fields optional):**
```json
{
  "title": "Updated Unit Title",
  "description": "Updated description",
  "startDate": "2024-10-20T00:00:00.000Z",
  "endDate": "2024-11-25T00:00:00.000Z",
  "topics": [...],
  "difficultyLevel": 4,
  "status": "IN_PROGRESS"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Unit updated successfully",
  "data": {
    // ... full updated unit object
  }
}
```

---

### Delete Unit

**DELETE** `/api/v1/curriculum-units/:unitId`

Soft delete a curriculum unit.

**Auth:** Teacher (creator or class teacher) only

**Response (200):**
```json
{
  "success": true,
  "message": "Unit deleted successfully"
}
```

---

### Reorder Units

**POST** `/api/v1/curriculum-units/schedule/:scheduleId/reorder`

Reorder units (for drag-and-drop functionality).

**Auth:** Teacher (creator or class teacher) only

**Request Body:**
```json
{
  "scheduleId": "uuid",
  "unitOrders": [
    {
      "unitId": "uuid-unit1",
      "orderIndex": 0,
      "startDate": "2024-09-01T00:00:00.000Z",
      "endDate": "2024-10-15T00:00:00.000Z"
    },
    {
      "unitId": "uuid-unit2",
      "orderIndex": 1,
      "startDate": "2024-10-16T00:00:00.000Z",
      "endDate": "2024-11-20T00:00:00.000Z"
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Units reordered successfully"
}
```

---

### Get Unit Progress (Teacher View)

**GET** `/api/v1/curriculum-units/:unitId/progress`

Get progress for all students in a unit (teacher dashboard).

**Auth:** Teacher (creator or class teacher) only

**Response (200):**
```json
{
  "success": true,
  "data": {
    "unit": {
      "id": "uuid",
      "title": "Linear Equations",
      "unitNumber": 3
    },
    "statistics": {
      "totalStudents": 30,
      "studentsStarted": 28,
      "studentsCompleted": 12,
      "averageProgress": 45,
      "averageScore": 78.5
    },
    "studentProgress": [
      {
        "studentId": "uuid",
        "studentName": "John Doe",
        "status": "IN_PROGRESS",
        "percentComplete": 60,
        "assignmentsCompleted": 3,
        "assignmentsTotal": 5,
        "assignmentsScore": 85,
        "timeSpentMinutes": 120,
        "strengths": ["Solving equations", "Graphing"],
        "struggles": ["Word problems"]
      }
    ]
  }
}
```

---

### Get Suggested Assignments

**GET** `/api/v1/curriculum-units/:unitId/suggested-assignments`

Get AI-suggested assignments for a unit.

**Auth:** Teacher (creator or class teacher) only

**Rate Limit:** 30 requests per 15 minutes

**Response (200):**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "type": "QUIZ",
        "title": "Linear Equations - Mid-Unit Quiz",
        "description": "Assessment covering solving one-variable equations",
        "suggestedTiming": "middle",
        "suggestedDate": "2024-11-01T00:00:00.000Z",
        "topicsCovered": ["One-variable equations", "Multi-step equations"],
        "estimatedQuestions": 15
      },
      {
        "type": "HOMEWORK",
        "title": "Practice: Graphing Linear Equations",
        "description": "Practice problems for graphing on coordinate plane",
        "suggestedTiming": "end",
        "suggestedDate": "2024-11-15T00:00:00.000Z",
        "topicsCovered": ["Graphing", "Slope-intercept form"],
        "estimatedQuestions": 20
      }
    ]
  }
}
```

---

### Get My Progress (Student View)

**GET** `/api/v1/curriculum-units/schedule/:scheduleId/my-progress`

Get student's own progress across all units in a schedule.

**Auth:** Student (enrolled in class)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "scheduleId": "uuid",
    "scheduleTitle": "8th Grade Math - Year Plan",
    "studentId": "uuid",
    "overallProgress": {
      "totalUnits": 8,
      "unitsStarted": 3,
      "unitsCompleted": 1,
      "unitsMastered": 1,
      "percentComplete": 25,
      "averageScore": 82.5,
      "currentUnitId": "uuid",
      "currentUnitTitle": "Linear Equations"
    },
    "unitProgress": [
      {
        "unitId": "uuid",
        "unitNumber": 1,
        "title": "Introduction to Algebra",
        "startDate": "2024-09-01T00:00:00.000Z",
        "endDate": "2024-10-15T00:00:00.000Z",
        "status": "MASTERED",
        "percentComplete": 100,
        "assignmentsCompleted": 5,
        "assignmentsTotal": 5,
        "assignmentsScore": 95,
        "conceptsMastered": 8,
        "conceptsTotal": 8,
        "masteryPercentage": 100,
        "timeSpentMinutes": 240,
        "lastAccessedAt": "2024-10-14T15:30:00.000Z"
      }
    ],
    "insights": {
      "strengths": ["Variables", "Expressions", "Order of operations"],
      "struggles": ["Word problems"],
      "recommendedReview": ["Complex word problems", "Multi-step equations"]
    }
  }
}
```

---

### Get My Unit Progress

**GET** `/api/v1/curriculum-units/:unitId/my-progress`

Get student's detailed progress for a specific unit.

**Auth:** Student (enrolled in class)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "unitId": "uuid",
    "unitNumber": 3,
    "title": "Linear Equations",
    "description": "Solving and graphing linear equations",
    "startDate": "2024-10-16T00:00:00.000Z",
    "endDate": "2024-11-20T00:00:00.000Z",
    "topics": [...],
    "learningObjectives": [...],
    "concepts": [...],
    "difficultyLevel": 3,
    "progress": {
      "status": "IN_PROGRESS",
      "percentComplete": 60,
      "assignmentsCompleted": 3,
      "assignmentsTotal": 5,
      "assignmentsScore": 85,
      "conceptsMastered": 4,
      "conceptsTotal": 6,
      "masteryPercentage": 67,
      "timeSpentMinutes": 120,
      "firstAccessedAt": "2024-10-16T08:00:00.000Z",
      "lastAccessedAt": "2024-11-05T14:30:00.000Z",
      "strengths": ["Solving equations", "Graphing"],
      "struggles": ["Word problems"],
      "recommendedReview": ["Application problems", "Real-world scenarios"],
      "engagementScore": 78,
      "participationCount": 5
    },
    "assignments": [
      {
        "id": "uuid",
        "title": "Linear Equations Practice",
        "type": "HOMEWORK",
        "dueDate": "2024-10-25T23:59:59.000Z",
        "completed": true,
        "score": 90,
        "submittedAt": "2024-10-24T18:30:00.000Z"
      }
    ]
  }
}
```

---

### Calculate Unit Progress

**POST** `/api/v1/curriculum-units/:unitId/calculate-progress`

Calculate/update progress for a unit (typically triggered by assignment submission).

**Auth:** Student (for own progress) or Teacher (for any student)

**Rate Limit:** 100 requests per 5 minutes

**Request Body (optional for students):**
```json
{
  "studentId": "uuid" // Only for teachers
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Unit progress calculated successfully",
  "data": {
    "unitId": "uuid",
    "studentId": "uuid",
    "status": "IN_PROGRESS",
    "percentComplete": 65,
    "assignmentsCompleted": 4,
    "assignmentsTotal": 5,
    "assignmentsScore": 87,
    "conceptsMastered": 5,
    "conceptsTotal": 6,
    "masteryPercentage": 83,
    "strengths": ["Solving equations", "Graphing", "Slope"],
    "struggles": [],
    "recommendedReview": ["Complex word problems"]
  }
}
```

---

### Record Time Spent

**POST** `/api/v1/curriculum-units/:unitId/record-time`

Record time spent in a unit for engagement tracking.

**Auth:** Student (enrolled in class)

**Rate Limit:** 60 requests per minute

**Request Body:**
```json
{
  "minutes": 15
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Time recorded successfully"
}
```

---

### Record Participation

**POST** `/api/v1/curriculum-units/:unitId/record-participation`

Record student participation in a unit (discussion, activity, etc.).

**Auth:** Student (enrolled in class) or Teacher

**Rate Limit:** 100 requests per 5 minutes

**Response (200):**
```json
{
  "success": true,
  "message": "Participation recorded successfully"
}
```

---

### Get My Strengths

**GET** `/api/v1/curriculum-units/schedule/:scheduleId/my-strengths`

Get concepts student excels at across the schedule.

**Auth:** Student (enrolled in class)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "strengths": [
      "Variables",
      "Expressions",
      "Solving equations",
      "Graphing",
      "Slope"
    ]
  }
}
```

---

### Get My Struggles

**GET** `/api/v1/curriculum-units/schedule/:scheduleId/my-struggles`

Get concepts student struggles with across the schedule.

**Auth:** Student (enrolled in class)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "struggles": [
      "Word problems",
      "Complex applications",
      "Multi-step equations"
    ]
  }
}
```

---

### Get My Review Recommendations

**GET** `/api/v1/curriculum-units/schedule/:scheduleId/my-review`

Get recommended review topics for student.

**Auth:** Student (enrolled in class)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "reviewTopics": [
      "Word problems",
      "Application problems",
      "Real-world scenarios",
      "Complex multi-step equations"
    ]
  }
}
```

---

## Error Responses

All error responses follow this format:

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    "Title must be at least 3 characters",
    "School year end must be after school year start"
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "No authentication token provided"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "You do not have permission to access this schedule"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Curriculum schedule not found: <scheduleId>"
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "message": "Too many AI requests. Please try again in a few minutes."
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Error details (in development mode)"
}
```

---

## Usage Examples

### Teacher Workflow: Create Year-Long Schedule

```javascript
// Step 1: Create schedule
const scheduleResponse = await fetch('/api/v1/curriculum-schedules', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    classId: 'class-uuid',
    schoolYearStart: '2024-09-01T00:00:00.000Z',
    schoolYearEnd: '2025-06-15T00:00:00.000Z',
    title: '8th Grade Math - Year Plan',
    curriculumMaterialId: 'curriculum-uuid'
  })
});

const { data: schedule } = await scheduleResponse.json();

// Step 2: Generate units from AI
const aiResponse = await fetch(`/api/v1/curriculum-schedules/${schedule.id}/generate-ai`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    curriculumMaterialId: 'curriculum-uuid',
    preferences: {
      targetUnits: 8,
      pacingPreference: 'standard',
      includeReviewUnits: true
    }
  })
});

const { data: aiSchedule } = await aiResponse.json();

// Step 3: Refine with AI
const refineResponse = await fetch(`/api/v1/curriculum-schedules/${schedule.id}/refine-ai`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: 'Spend more time on quadratic equations'
  })
});

// Step 4: Publish schedule
await fetch(`/api/v1/curriculum-schedules/${schedule.id}/publish`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Student Workflow: Track Progress

```javascript
// Get my overall progress
const progressResponse = await fetch('/api/v1/curriculum-units/schedule/schedule-uuid/my-progress', {
  headers: {
    'Authorization': `Bearer ${studentToken}`
  }
});

const { data: progress } = await progressResponse.json();

// Get detailed unit progress
const unitProgressResponse = await fetch('/api/v1/curriculum-units/unit-uuid/my-progress', {
  headers: {
    'Authorization': `Bearer ${studentToken}`
  }
});

const { data: unitProgress } = await unitProgressResponse.json();

// Record time spent
await fetch('/api/v1/curriculum-units/unit-uuid/record-time', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${studentToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ minutes: 30 })
});

// Get personalized insights
const strengthsResponse = await fetch('/api/v1/curriculum-units/schedule/schedule-uuid/my-strengths', {
  headers: {
    'Authorization': `Bearer ${studentToken}`
  }
});

const { data: { strengths } } = await strengthsResponse.json();
```

---

## Notes

- All dates use ISO 8601 format
- All IDs are UUIDs
- Soft deletes are used - deleted items have a `deletedAt` timestamp
- AI operations are rate-limited more strictly to manage API costs
- Progress calculations are triggered automatically on assignment submission
- Time tracking is optional but recommended for engagement analytics
