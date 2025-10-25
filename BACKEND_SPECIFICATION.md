# Socratit.ai Backend Specification Document

## Table of Contents
1. [Project Overview](#project-overview)
2. [Frontend Context](#frontend-context)
3. [Core Features & Requirements](#core-features--requirements)
4. [Data Models & Schemas](#data-models--schemas)
5. [API Endpoints](#api-endpoints)
6. [Business Logic & Workflows](#business-logic--workflows)
7. [Security & Data Protection](#security--data-protection)
8. [AI Integration Requirements](#ai-integration-requirements)
9. [Real-time Features](#real-time-features)
10. [File Upload & Processing](#file-upload--processing)
11. [Tech Stack Recommendations](#tech-stack-recommendations)
12. [Deployment & Scaling](#deployment--scaling)
13. [Future Plans](#future-plans)

---

## 1. Project Overview

### What is Socratit.ai?
Socratit.ai is an AI-powered educational platform that revolutionizes how teachers create, distribute, and grade assignments. The platform uses AI to automatically generate assignments based on teacher-uploaded materials and provides instant feedback to students.

### Key Differentiators
- **AI-Driven Assignment Creation**: Teachers upload curriculum materials; AI generates interactive quizzes and assignments
- **Automatic Grading & Feedback**: Instant feedback on student responses with explanations
- **Real-time Analytics**: Track student performance, identify struggling concepts, and provide intervention insights
- **Multi-Role Platform**: Separate experiences for Teachers, Students, and Admins (future: Parents)

### Target Users
- **Teachers**: Create classes, upload materials, manage students, view analytics
- **Students**: Complete assignments, track progress, communicate with teachers
- **Admins**: Manage teachers and students within their district/school (future phase)
- **Parents**: View student progress (future phase)

---

## 2. Frontend Context

### How the Frontend Was Built
The frontend is a **React 19.2.0 + TypeScript** application built as a complete wireframe/mockup with:
- **Framer Motion** for animations
- **React Router** for navigation
- **Tailwind CSS 3.0.24** for styling
- **Component-based architecture** with reusable UI components (Card, Button, Badge)

### Important Note for Backend Developer
**Every visual element, button, feature, and data point shown in the frontend wireframes needs to be implemented in the backend.** The frontend is fully designed with mock data - your job is to replace all mock data with real, functional backend APIs.

### Frontend Structure
```
src/
├── pages/
│   ├── student/
│   │   ├── StudentDashboard.tsx    # Dashboard with stats, active challenges, trivia
│   │   ├── Classes.tsx             # All student classes with grades & assignments
│   │   ├── Assignments.tsx         # Assignments by due date (tonight, tomorrow, upcoming)
│   │   ├── Grades.tsx              # Grade breakdown by class
│   │   └── Messages.tsx            # Messaging interface
│   ├── teacher/
│   │   ├── TeacherDashboard.tsx    # Overview of all classes
│   │   ├── TeacherClasses.tsx      # Class management with analytics
│   │   ├── TeacherAssignments.tsx  # Assignment creation & management
│   │   ├── TeacherMessages.tsx     # Communication hub
│   │   └── TeacherAnalytics.tsx    # Performance analytics & insights
│   ├── public/
│   │   ├── LandingPage.tsx         # Marketing page
│   │   ├── LoginPage.tsx           # OAuth login
│   │   └── SignupPage.tsx          # Account creation
│   └── admin/
│       └── AdminDashboard.tsx       # Basic admin view (future enhancement)
└── components/
    ├── common/                      # Reusable UI components
    └── layout/                      # Layout components (Sidebar, TopNav, etc.)
```

### Key Frontend Features to Implement

#### For Every Page Listed Above, Build APIs That Provide:
1. **Real data** for all statistics, charts, and metrics shown
2. **CRUD operations** for all interactive elements (create, read, update, delete)
3. **Real-time updates** where indicated (messages, notifications, presence)
4. **Filtering and search** capabilities where shown
5. **Sorting and pagination** for lists and tables

---

## 3. Core Features & Requirements

### 3.1 Authentication & Authorization

#### OAuth Integration
- **Provider**: Implement OAuth 2.0 (recommend Google OAuth for education sector)
- **Flow**: Authorization Code Flow with PKCE for security
- **Token Management**:
  - Issue JWT tokens with role-based claims
  - Access token expiry: 1 hour
  - Refresh token expiry: 30 days
  - Store refresh tokens securely in database

#### User Roles & Permissions
```
TEACHER:
  - Create and manage classes
  - Create, edit, delete assignments
  - View and approve student enrollment requests
  - Message students and other teachers
  - View analytics for their classes only
  - Upload curriculum materials

STUDENT:
  - Enroll in classes (pending teacher approval)
  - View and complete assignments
  - View own grades and progress
  - Message teachers
  - Access own analytics

ADMIN:
  - Manage teachers within their district
  - View aggregated analytics for their district
  - Cannot access other districts' data
  - (Full admin features in future phase)
```

#### Account Creation & Verification
1. **Signup Flow**:
   - User signs up with OAuth (Google)
   - System captures: name, email, role (teacher/student)
   - If student: also capture grade level
   - Send verification email with token
   - User clicks verification link
   - Account activated

2. **Email Verification**:
   - Generate unique verification token (UUID)
   - Store token with expiry (24 hours)
   - Send email with verification link: `https://yourdomain.com/verify?token={token}`
   - Mark account as verified in database

3. **Password Reset** (for users with password-based auth):
   - User requests password reset
   - Generate reset token (UUID) with 1-hour expiry
   - Send reset email with link
   - User sets new password
   - Invalidate all existing sessions

#### Role Restrictions
- **Hard Constraint**: A user can ONLY have ONE role (teacher OR student OR admin)
- **Database Enforcement**: Use a check constraint or enum field
- **API Validation**: Reject any request attempting to assign multiple roles

---

### 3.2 Class Management

#### Teacher Class Management

**Frontend Reference**: `TeacherClasses.tsx`

**Features to Implement**:
1. **Create Class**:
   - Class name (e.g., "Geometry - Period 3")
   - Period/section identifier
   - Room number
   - Schedule time (display only - not enforced)
   - Color theme (blue, purple, orange)

2. **Class Details**:
   - Student roster with enrollment status
   - Class average grade (calculated)
   - Active assignments count
   - Pending submissions count
   - Students needing help (grade < 70% or struggling on concepts)
   - Recent activity feed (student submissions, completion events)
   - Upcoming deadlines with submission rates

3. **Student Enrollment Management**:
   - View pending enrollment requests
   - Approve/deny student enrollment
   - Manually add students by email
   - Remove students from class
   - Send class invitation codes

#### Student Class View

**Frontend Reference**: `Classes.tsx` (student)

**Features to Implement**:
1. **Enroll in Class**:
   - Self-enrollment with class code
   - Request sent to teacher for approval
   - Status: pending, approved, denied

2. **View Enrolled Classes**:
   - Class name, teacher, room, schedule
   - Current grade in class (calculated from assignments)
   - Grade trend (up/down from last week)
   - Active assignments count
   - Concept mastery progress
   - Recent assignments with status (completed, in-progress, not-started)

---

### 3.3 Assignment System

#### Overview
**Critical**: Assignments are AI-generated interactive quizzes/tests, NOT static text documents.

**Frontend Reference**:
- Teacher: `TeacherAssignments.tsx`
- Student: `Assignments.tsx`

#### Assignment Creation Workflow

**Step 1: Teacher Uploads Materials**
```
POST /api/classes/{classId}/upload-materials
Content-Type: multipart/form-data

Files: PDFs, Word docs, images, etc.
```

**What Happens**:
1. Extract text from uploaded files
2. Parse and understand curriculum content
3. Identify key concepts and learning objectives
4. Store processed content linked to class

**Step 2: Teacher Requests Assignment Generation**
```
POST /api/classes/{classId}/assignments/generate
{
  "type": "quiz" | "practice" | "test" | "homework",
  "topic": "Triangle Properties",
  "difficulty": "medium",
  "questionCount": 10,
  "questionTypes": ["multiple_choice", "free_response"],
  "dueDate": "2025-11-01T23:59:59Z",
  "concepts": ["Pythagorean Theorem", "Triangle Inequality"]
}
```

**What Happens**:
1. AI analyzes uploaded materials
2. Generates questions with:
   - Question text
   - Options (for multiple choice)
   - Correct answer
   - Explanation for correct answer
   - Explanation for common wrong answers
   - Difficulty level
   - Associated concept
3. Returns assignment draft to teacher

**Step 3: Teacher Reviews & Publishes**
```
PATCH /api/assignments/{assignmentId}
{
  "status": "published",
  "questions": [
    {
      "id": "q1",
      "text": "What is the Pythagorean theorem?",
      "type": "multiple_choice",
      "options": ["a² + b² = c²", "a + b = c", "a² = b² + c²", "a = b + c"],
      "correctAnswer": 0,
      "explanation": "The Pythagorean theorem states...",
      "points": 10
    }
  ]
}
```

#### Assignment Types & States

**Assignment Status**:
- `draft`: Teacher is editing, not visible to students
- `scheduled`: Will be published at future date
- `active`: Published, students can work on it
- `closed`: Past due date, no new submissions accepted
- `archived`: Hidden from active view

**Assignment Types**:
- `quiz`: Short assessment (5-15 questions)
- `practice`: Practice problems with unlimited attempts
- `test`: Formal assessment with time limit
- `homework`: Longer assignments, multiple sessions allowed

#### Student Assignment Interaction

**Frontend Reference**: `Assignments.tsx` (student)

**Student Views Assignments Grouped By**:
1. **Due Tonight**: Due date is today
2. **Due Tomorrow**: Due date is tomorrow
3. **Upcoming**: Due date is 2+ days away

**Each Assignment Shows**:
- Title
- Class name and teacher
- Type (quiz, homework, etc.)
- Points possible
- Due date and time
- Progress (% complete)
- Status (not-started, in-progress, completed)
- Grade (if completed and graded)

**Assignment Attempt Flow**:
```
POST /api/assignments/{assignmentId}/start
Response: {
  "attemptId": "uuid",
  "questions": [...],
  "startedAt": "timestamp"
}

PUT /api/attempts/{attemptId}/answers
{
  "questionId": "q1",
  "answer": 0,  // Index of selected option
  "timeSpent": 45  // seconds
}

Response: {
  "isCorrect": true,
  "correctAnswer": 0,
  "explanation": "That's correct! The Pythagorean theorem...",
  "points": 10
}

POST /api/attempts/{attemptId}/submit
Response: {
  "totalPoints": 85,
  "maxPoints": 100,
  "grade": 85,
  "feedback": "Great work! Focus on..."
}
```

#### Key Requirements for Assignment System:

1. **Instant Feedback**:
   - As soon as student submits an answer, return:
     - Whether it's correct
     - The correct answer (if wrong)
     - Explanation
     - Points earned
   - Store each answer attempt with timestamp

2. **Progress Tracking**:
   - Track which questions answered
   - Track time spent per question
   - Track number of attempts per question (if allowed)
   - Calculate overall assignment progress (%)

3. **Grading**:
   - Multiple choice: Auto-graded instantly
   - Free response:
     - Use AI to grade by comparing to expected answer
     - Give partial credit
     - Provide feedback
   - Calculate final grade: (points earned / total points) × 100

4. **Assignment Analytics** (for teachers):
   - Submission rate (X out of Y students submitted)
   - Average grade
   - Question-level analytics (which questions most missed)
   - Time spent statistics
   - Concept mastery by question

---

### 3.4 Grading System

**Frontend Reference**: `Grades.tsx` (student), `TeacherAnalytics.tsx` (teacher)

#### Student Grades View

**For Each Class, Show**:
1. **Overall Grade**: Weighted average of all assignments
2. **Grade Breakdown by Category**:
   ```
   {
     "homework": { "average": 92, "weight": 20 },
     "quizzes": { "average": 88, "weight": 30 },
     "tests": { "average": 85, "weight": 40 },
     "participation": { "average": 95, "weight": 10 }
   }
   ```
3. **Recent Assignments**:
   - Assignment name
   - Grade received
   - Points earned / points possible
   - Date submitted
   - Feedback from teacher or AI

4. **Grade Trends**:
   - Week-over-week change
   - Concept mastery over time

#### Grade Calculation Logic

```javascript
// Pseudocode for grade calculation
function calculateClassGrade(studentId, classId) {
  const assignments = getCompletedAssignments(studentId, classId);

  const categories = {
    homework: { total: 0, earned: 0, weight: 0.20 },
    quiz: { total: 0, earned: 0, weight: 0.30 },
    test: { total: 0, earned: 0, weight: 0.40 },
    practice: { total: 0, earned: 0, weight: 0.10 }
  };

  assignments.forEach(assignment => {
    const category = categories[assignment.type];
    category.total += assignment.totalPoints;
    category.earned += assignment.earnedPoints;
  });

  let finalGrade = 0;
  for (const [type, data] of Object.entries(categories)) {
    if (data.total > 0) {
      const categoryGrade = (data.earned / data.total) * 100;
      finalGrade += categoryGrade * data.weight;
    }
  }

  return Math.round(finalGrade);
}
```

---

### 3.5 Messaging System

**Frontend Reference**:
- Student: `Messages.tsx` (student)
- Teacher: `TeacherMessages.tsx` (teacher)

#### Real-time Messaging Requirements

**Technology**: Use WebSockets (Socket.io recommended)

**Conversation Types**:
1. **Direct Messages**:
   - Student ↔ Teacher
   - Teacher ↔ Teacher
   - Teacher ↔ Parent (future)
   - Student ↔ AI TA (future)

2. **Group Messages**:
   - Teacher → Entire Class (broadcast)
   - Study groups (future)

#### Message Data Model

```typescript
interface Conversation {
  id: string;
  type: 'direct' | 'group';
  participants: string[];  // user IDs
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: { [userId: string]: number };
  metadata: {
    className?: string;      // For class-related conversations
    subject?: string;
    isPriority?: boolean;    // For parent messages
  };
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'student' | 'teacher' | 'parent' | 'ai';
  content: string;
  timestamp: Date;
  readBy: string[];        // user IDs who have read
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
}
```

#### WebSocket Events

**Client → Server**:
```javascript
// Connect
socket.emit('authenticate', { token: 'jwt-token' });

// Send message
socket.emit('send_message', {
  conversationId: 'conv-123',
  content: 'Hello!',
  attachments: []
});

// Mark as read
socket.emit('mark_read', {
  conversationId: 'conv-123',
  messageId: 'msg-456'
});

// Typing indicator
socket.emit('typing', { conversationId: 'conv-123' });
socket.emit('stop_typing', { conversationId: 'conv-123' });
```

**Server → Client**:
```javascript
// New message
socket.on('new_message', (message) => { ... });

// Message read receipt
socket.on('message_read', { messageId, readBy } => { ... });

// User online/offline
socket.on('user_status', { userId, status: 'online' | 'offline' } => { ... });

// Typing indicator
socket.on('user_typing', { userId, conversationId } => { ... });
```

#### REST API Endpoints (for message history)

```
GET /api/conversations
  - Returns list of user's conversations
  - Include: last message, unread count, participants

GET /api/conversations/{conversationId}/messages
  - Query params: limit, offset (for pagination)
  - Returns: message history

POST /api/conversations
  - Create new conversation
  - Body: { participantIds, type, metadata }

POST /api/conversations/{conversationId}/messages
  - Send message via REST (fallback if WebSocket unavailable)
  - Body: { content, attachments }

PUT /api/messages/{messageId}/read
  - Mark message as read
```

#### Teacher-Specific Features

**"Send to Class" Functionality**:
```
POST /api/classes/{classId}/broadcast
{
  "message": "Reminder: Quiz tomorrow!",
  "priority": "normal"
}

// Creates individual conversations with each student
// Or creates group conversation with all students
```

**Message Templates**:
```
GET /api/message-templates
Response: [
  {
    "id": "1",
    "name": "Missing Assignment Reminder",
    "content": "Hi {studentName}, I noticed you haven't submitted {assignmentName}..."
  },
  {
    "id": "2",
    "name": "Great Work Recognition",
    "content": "Excellent work on {assignmentName}! Keep it up!"
  }
]
```

---

### 3.6 Analytics & Insights

**Frontend Reference**: `TeacherAnalytics.tsx`

#### Overall Statistics (Dashboard Level)

**Teacher Dashboard Stats**:
```
GET /api/teachers/{teacherId}/analytics/overview
Response: {
  "totalStudents": 70,
  "totalStudentsTrend": { "value": 2, "isPositive": true },
  "avgPerformance": 86,
  "avgPerformanceTrend": { "value": 3, "isPositive": true },
  "assignmentsThisWeek": 9,
  "assignmentsTrend": { "value": 2, "isPositive": true },
  "studentsNeedingAttention": 8,
  "attentionTrend": { "value": 3, "isPositive": false }
}
```

**Student Dashboard Stats**:
```
GET /api/students/{studentId}/analytics/overview
Response: {
  "currentGPA": 3.7,
  "gpaTrend": { "value": 0.2, "isPositive": true },
  "activeChallenges": 3,
  "assignmentsDueThisWeek": 5,
  "conceptsMastered": 28,
  "conceptsInProgress": 5
}
```

#### Class Performance Analytics

```
GET /api/classes/{classId}/analytics
Response: {
  "classAverage": 87,
  "studentCount": 28,
  "assignmentCompletion": {
    "week1": 85,
    "week2": 88,
    "week3": 82,
    "week4": 90
  },
  "conceptMastery": [
    {
      "concept": "Triangle Properties",
      "masteryLevel": 85,
      "studentsStruggling": 3,
      "studentsStruggling_ids": ["student-1", "student-2", "student-3"]
    },
    {
      "concept": "Quadratic Functions",
      "masteryLevel": 72,
      "studentsStruggling": 5
    }
  ],
  "strugglingStudents": [
    {
      "studentId": "student-1",
      "name": "Alex Rodriguez",
      "avgGrade": 68,
      "strugglingConcepts": ["Quadratic Functions"]
    }
  ],
  "topPerformers": [
    {
      "studentId": "student-10",
      "name": "David Kim",
      "avgGrade": 98,
      "improvement": 5
    }
  ]
}
```

#### Assignment Analytics

```
GET /api/assignments/{assignmentId}/analytics
Response: {
  "submissionRate": 75,  // percentage
  "submitted": 21,
  "total": 28,
  "avgGrade": 84,
  "avgTimeSpent": 1800,  // seconds
  "questionAnalytics": [
    {
      "questionId": "q1",
      "questionText": "What is the Pythagorean theorem?",
      "correctRate": 0.92,
      "avgTimeSpent": 45,
      "commonWrongAnswers": [
        { "answer": "a + b = c", "count": 2 }
      ]
    }
  ],
  "gradeDistribution": {
    "A": 12,
    "B": 6,
    "C": 2,
    "D": 1,
    "F": 0
  }
}
```

#### Historical Data Requirements

**Time-Series Data to Store**:
1. Daily/weekly grade averages per student per class
2. Assignment completion rates over time
3. Concept mastery progression
4. Login/engagement metrics
5. Message volume and response times

**Retention**: Store ALL historical data indefinitely
- Implement data archiving strategy for performance
- Use time-series optimizations in database
- Consider separate analytics database

---

### 3.7 Notifications System

**Frontend Reference**: TopNav component shows notification bell

#### Notification Types

**Student Notifications**:
- New assignment published
- Assignment due soon (24h, 1h warnings)
- Grade posted
- New message from teacher
- Class announcement
- Achievement unlocked (future)

**Teacher Notifications**:
- Student enrollment request
- Assignment submission
- Student needs help (low performance alert)
- New message from student or parent
- All students completed assignment

#### Notification Delivery

**Real-time** (WebSocket):
```javascript
socket.on('notification', {
  id: 'notif-123',
  type: 'assignment_due_soon',
  title: 'Assignment Due Soon',
  message: 'Triangle Properties quiz is due in 1 hour',
  actionUrl: '/student/assignments/assign-123',
  timestamp: '2025-11-01T10:30:00Z',
  read: false
});
```

**REST API**:
```
GET /api/notifications
  - Returns unread notifications
  - Query params: limit, offset

PUT /api/notifications/{notificationId}/read
  - Mark as read

PUT /api/notifications/read-all
  - Mark all as read

DELETE /api/notifications/{notificationId}
  - Dismiss notification
```

**Email Notifications** (optional but recommended):
- Daily digest of upcoming assignments
- Weekly progress report
- Important announcements

---

### 3.8 Student Progress Tracking

**Frontend Reference**: Multiple pages show progress indicators

#### Concept Mastery Tracking

**How It Works**:
1. Each question is tagged with one or more concepts
2. Track student performance per concept
3. Calculate mastery level based on:
   - Correct answer rate
   - Time to answer
   - Number of attempts needed
   - Recency of practice

```
GET /api/students/{studentId}/concepts/mastery
Response: {
  "concepts": [
    {
      "conceptId": "concept-1",
      "name": "Pythagorean Theorem",
      "masteryLevel": 85,  // 0-100
      "questionsAttempted": 12,
      "questionsCorrect": 10,
      "lastPracticed": "2025-11-01T10:00:00Z",
      "trend": "improving"
    }
  ]
}
```

#### Learning Path Progression

**Frontend Reference**: Classes page shows "concept path"

```
GET /api/classes/{classId}/learning-path
Response: {
  "concepts": [
    {
      "id": "concept-1",
      "name": "Basic Triangles",
      "order": 1,
      "status": "mastered",
      "prerequisites": []
    },
    {
      "id": "concept-2",
      "name": "Pythagorean Theorem",
      "order": 2,
      "status": "in_progress",
      "prerequisites": ["concept-1"]
    },
    {
      "id": "concept-3",
      "name": "Trigonometry",
      "order": 3,
      "status": "locked",
      "prerequisites": ["concept-2"]
    }
  ]
}
```

#### Activity Tracking

**Store ALL Student Interactions**:
```typescript
interface ActivityLog {
  id: string;
  studentId: string;
  activityType: 'assignment_start' | 'question_answer' | 'assignment_submit' |
                'concept_review' | 'ai_interaction' | 'login' | 'logout';
  timestamp: Date;
  metadata: {
    assignmentId?: string;
    questionId?: string;
    answer?: any;
    isCorrect?: boolean;
    timeSpent?: number;
    aiConversationId?: string;
    aiQuery?: string;
    aiResponse?: string;
  };
}
```

**Why Track Everything**:
- Analytics and insights
- Identify learning patterns
- Improve AI recommendations
- Audit trail for grading disputes
- Research and improvement

---

## 4. Data Models & Schemas

### 4.1 User Models

#### User (Base)
```typescript
interface User {
  id: string;                    // UUID
  email: string;                 // Unique, indexed
  name: string;
  role: 'teacher' | 'student' | 'admin';  // ENUM, single value only
  oauthProvider: 'google';
  oauthId: string;               // Provider's user ID
  isVerified: boolean;
  verificationToken?: string;
  verificationTokenExpiry?: Date;
  passwordResetToken?: string;
  passwordResetExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;             // For soft delete
}
```

#### Teacher (extends User)
```typescript
interface Teacher extends User {
  role: 'teacher';
  schoolId?: string;             // Optional: for district organization
  subjects: string[];            // ["Mathematics", "Science"]
  classIds: string[];            // Classes they teach
}
```

#### Student (extends User)
```typescript
interface Student extends User {
  role: 'student';
  gradeLevel: number;            // 1-12
  schoolId?: string;
  enrolledClassIds: string[];
  pendingClassIds: string[];     // Classes pending approval
}
```

#### Admin (extends User)
```typescript
interface Admin extends User {
  role: 'admin';
  districtId: string;            // Required: scope their access
  permissions: string[];
}
```

---

### 4.2 Class Models

#### Class
```typescript
interface Class {
  id: string;
  teacherId: string;             // Foreign key to User
  name: string;                  // "Geometry - Period 3"
  period: string;                // "Period 3"
  room: string;                  // "Room 204"
  scheduleTime: string;          // "10:30 AM - 11:45 AM" (display only)
  color: 'blue' | 'purple' | 'orange';
  schoolId?: string;
  districtId?: string;           // For data isolation

  // Enrollment
  studentIds: string[];          // Enrolled students
  pendingStudentIds: string[];   // Pending approval
  maxStudents?: number;

  // Settings
  inviteCode: string;            // Unique code for self-enrollment
  isActive: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;

  // Materials
  uploadedMaterialIds: string[];
}
```

#### ClassEnrollment
```typescript
interface ClassEnrollment {
  id: string;
  classId: string;
  studentId: string;
  status: 'pending' | 'approved' | 'denied' | 'removed';
  requestedAt: Date;
  approvedAt?: Date;
  approvedBy?: string;           // Teacher ID
  deniedReason?: string;
}
```

---

### 4.3 Assignment Models

#### Assignment
```typescript
interface Assignment {
  id: string;
  classId: string;
  teacherId: string;

  // Basic Info
  title: string;
  type: 'quiz' | 'practice' | 'test' | 'homework';
  description?: string;

  // Status & Scheduling
  status: 'draft' | 'scheduled' | 'active' | 'closed' | 'archived';
  publishedAt?: Date;
  dueDate?: Date;
  closedAt?: Date;

  // Configuration
  totalPoints: number;
  passingGrade: number;          // Percentage (e.g., 70)
  allowMultipleAttempts: boolean;
  maxAttempts?: number;
  timeLimit?: number;            // Minutes
  showCorrectAnswers: boolean;   // After submission

  // Content
  questions: Question[];

  // AI Generation
  generatedFromMaterialIds?: string[];
  aiGeneratedAt?: Date;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}
```

#### Question
```typescript
interface Question {
  id: string;
  assignmentId: string;

  // Content
  text: string;                  // Question text
  type: 'multiple_choice' | 'free_response';
  order: number;                 // Display order
  points: number;

  // Multiple Choice Specific
  options?: string[];            // ["Option A", "Option B", ...]
  correctAnswer?: number;        // Index of correct option

  // Free Response Specific
  expectedAnswer?: string;       // For AI grading
  rubric?: string;               // Grading criteria

  // Feedback
  explanation: string;           // Explanation of correct answer
  incorrectFeedback?: {          // Feedback for common wrong answers
    [answerIndex: number]: string;
  };

  // Metadata
  conceptIds: string[];          // Related concepts
  difficulty: 'easy' | 'medium' | 'hard';
}
```

#### AssignmentAttempt
```typescript
interface AssignmentAttempt {
  id: string;
  assignmentId: string;
  studentId: string;
  attemptNumber: number;         // 1, 2, 3...

  // Progress
  status: 'in_progress' | 'submitted' | 'graded';
  startedAt: Date;
  submittedAt?: Date;

  // Answers
  answers: QuestionAnswer[];

  // Grading
  totalPoints: number;
  earnedPoints: number;
  grade: number;                 // Percentage
  feedback?: string;             // Overall feedback

  // Timing
  timeSpent: number;             // Total seconds
}
```

#### QuestionAnswer
```typescript
interface QuestionAnswer {
  id: string;
  attemptId: string;
  questionId: string;

  // Answer
  answer: number | string;       // Index for MC, text for free response
  submittedAt: Date;
  timeSpent: number;             // Seconds on this question

  // Grading
  isCorrect: boolean;
  pointsEarned: number;
  feedback: string;              // Explanation or feedback

  // AI Grading (for free response)
  aiGradedAt?: Date;
  aiConfidence?: number;         // 0-1
  requiresManualReview?: boolean;
}
```

---

### 4.4 Grade Models

#### Grade
```typescript
interface Grade {
  id: string;
  studentId: string;
  classId: string;
  assignmentId: string;

  // Grade Info
  grade: number;                 // Percentage (0-100)
  pointsEarned: number;
  totalPoints: number;
  letterGrade?: string;          // "A", "B+", etc.

  // Metadata
  submittedAt: Date;
  gradedAt: Date;
  feedback?: string;

  // Category for weighted grades
  category: 'homework' | 'quiz' | 'test' | 'practice' | 'participation';
}
```

#### ClassGradeSummary
```typescript
interface ClassGradeSummary {
  id: string;
  studentId: string;
  classId: string;

  // Overall Grade
  currentGrade: number;          // Weighted percentage
  letterGrade: string;

  // Category Breakdown
  categories: {
    [category: string]: {
      average: number;
      weight: number;              // 0-1
    };
  };

  // Trends
  trend: {
    direction: 'up' | 'down' | 'stable';
    changePercent: number;
  };

  // Calculation
  lastCalculatedAt: Date;
}
```

---

### 4.5 Messaging Models

#### Conversation
```typescript
interface Conversation {
  id: string;
  type: 'direct' | 'group';

  // Participants
  participantIds: string[];
  participantRoles: {            // For quick filtering
    students: string[];
    teachers: string[];
    parents?: string[];
  };

  // Last Message
  lastMessage: string;
  lastMessageAt: Date;
  lastMessageBy: string;

  // Unread Counts (per user)
  unreadCounts: {
    [userId: string]: number;
  };

  // Metadata
  metadata: {
    classId?: string;
    className?: string;
    subject?: string;
    isPriority?: boolean;
  };

  // Settings
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}
```

#### Message
```typescript
interface Message {
  id: string;
  conversationId: string;

  // Sender
  senderId: string;
  senderType: 'student' | 'teacher' | 'parent' | 'ai';
  senderName: string;            // Denormalized for quick display

  // Content
  content: string;
  attachments?: Attachment[];

  // Status
  readBy: string[];              // User IDs
  readAt: {                      // Timestamp per user
    [userId: string]: Date;
  };

  // Metadata
  createdAt: Date;
  editedAt?: Date;
  deletedAt?: Date;              // Soft delete
}
```

#### Attachment
```typescript
interface Attachment {
  id: string;
  messageId: string;
  name: string;
  url: string;                   // S3 or CDN URL
  type: string;                  // MIME type
  size: number;                  // Bytes
  uploadedAt: Date;
}
```

---

### 4.6 Analytics Models

#### ConceptMastery
```typescript
interface ConceptMastery {
  id: string;
  studentId: string;
  classId: string;
  conceptId: string;

  // Mastery Metrics
  masteryLevel: number;          // 0-100
  questionsAttempted: number;
  questionsCorrect: number;
  avgTimePerQuestion: number;    // Seconds

  // Progression
  firstAttemptAt: Date;
  lastAttemptAt: Date;
  trend: 'improving' | 'declining' | 'stable';

  // Metadata
  updatedAt: Date;
}
```

#### Concept
```typescript
interface Concept {
  id: string;
  name: string;                  // "Pythagorean Theorem"
  description?: string;
  subject: string;               // "Mathematics"
  gradeLevel?: number;

  // Hierarchy (future)
  parentConceptId?: string;
  prerequisiteIds?: string[];

  createdAt: Date;
}
```

#### ActivityLog
```typescript
interface ActivityLog {
  id: string;
  userId: string;
  userType: 'student' | 'teacher' | 'admin';

  // Activity
  activityType: 'login' | 'logout' | 'assignment_start' | 'assignment_submit' |
                'question_answer' | 'concept_review' | 'message_send' |
                'class_join' | 'ai_interaction';

  // Context
  metadata: {
    classId?: string;
    assignmentId?: string;
    questionId?: string;
    answer?: any;
    isCorrect?: boolean;
    timeSpent?: number;
    conversationId?: string;
    aiQuery?: string;
    aiResponse?: string;
    // ... any other relevant data
  };

  timestamp: Date;

  // Tracking
  ipAddress?: string;
  userAgent?: string;
}
```

---

### 4.7 Curriculum Models

#### UploadedMaterial
```typescript
interface UploadedMaterial {
  id: string;
  classId: string;
  teacherId: string;

  // File Info
  fileName: string;
  fileType: string;              // MIME type
  fileSize: number;              // Bytes
  fileUrl: string;               // Temporary storage URL

  // Processing
  status: 'uploaded' | 'processing' | 'processed' | 'failed';
  extractedText?: string;        // Extracted content
  processedAt?: Date;
  processingError?: string;

  // AI Analysis
  identifiedConcepts?: string[];
  learningObjectives?: string[];
  suggestedQuestions?: any[];

  uploadedAt: Date;
}
```

---

### 4.8 Notification Models

#### Notification
```typescript
interface Notification {
  id: string;
  userId: string;

  // Content
  type: 'assignment_published' | 'assignment_due_soon' | 'grade_posted' |
        'message_received' | 'enrollment_request' | 'submission_received' |
        'help_needed' | 'class_announcement';
  title: string;
  message: string;

  // Action
  actionUrl?: string;            // Deep link to relevant page
  actionLabel?: string;          // "View Assignment"

  // Status
  isRead: boolean;
  readAt?: Date;

  // Priority
  priority: 'low' | 'normal' | 'high' | 'urgent';

  // Metadata
  metadata: {
    classId?: string;
    assignmentId?: string;
    senderId?: string;
    // ... any other relevant data
  };

  createdAt: Date;
  expiresAt?: Date;              // Auto-delete after X days
}
```

---

## 5. API Endpoints

### 5.1 Authentication & User Management

#### OAuth Flow
```
GET /api/auth/google
  - Redirects to Google OAuth consent screen

GET /api/auth/google/callback?code={authCode}
  - Handles OAuth callback
  - Exchanges code for user info
  - Creates or updates user
  - Returns JWT token
  Response: {
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token",
    "user": { ... }
  }

POST /api/auth/refresh
  Body: { "refreshToken": "..." }
  Response: { "accessToken": "new-jwt-token" }

POST /api/auth/logout
  - Invalidates refresh token

POST /api/auth/verify-email
  Body: { "token": "verification-token" }
  Response: { "success": true, "message": "Email verified" }

POST /api/auth/forgot-password
  Body: { "email": "user@example.com" }
  Response: { "message": "Reset email sent" }

POST /api/auth/reset-password
  Body: { "token": "reset-token", "newPassword": "..." }
  Response: { "success": true }
```

#### User Profile
```
GET /api/users/me
  - Returns current user's profile

PUT /api/users/me
  - Update profile
  Body: { "name": "...", "gradeLevel": 10 (students only) }

GET /api/users/{userId}
  - Get user profile (role-based access control)
  - Teachers can view their students
  - Students can view their teachers
```

---

### 5.2 Class Management

#### Class CRUD
```
POST /api/classes
  Auth: Teacher only
  Body: {
    "name": "Geometry - Period 3",
    "period": "Period 3",
    "room": "Room 204",
    "scheduleTime": "10:30 AM - 11:45 AM",
    "color": "blue",
    "maxStudents": 30
  }
  Response: { "class": { ... }, "inviteCode": "ABC123" }

GET /api/classes
  Auth: Teacher (their classes), Student (enrolled classes)
  Response: { "classes": [ ... ] }

GET /api/classes/{classId}
  Auth: Teacher (if owner), Student (if enrolled)
  Response: { "class": { ... } }

PUT /api/classes/{classId}
  Auth: Teacher (owner only)
  Body: { "name": "...", "room": "...", ... }

DELETE /api/classes/{classId}
  Auth: Teacher (owner only)
  - Soft delete (archives class)
```

#### Enrollment
```
POST /api/classes/enroll
  Auth: Student
  Body: { "inviteCode": "ABC123" }
  Response: { "enrollment": { "status": "pending", ... } }

GET /api/classes/{classId}/enrollment-requests
  Auth: Teacher (owner only)
  Response: { "requests": [ ... ] }

PUT /api/classes/{classId}/enrollment-requests/{enrollmentId}
  Auth: Teacher (owner only)
  Body: { "status": "approved" | "denied", "deniedReason": "..." }

POST /api/classes/{classId}/students
  Auth: Teacher (owner only)
  Body: { "studentEmail": "student@example.com" }
  - Manually add student

DELETE /api/classes/{classId}/students/{studentId}
  Auth: Teacher (owner only)
  - Remove student from class
```

#### Class Roster & Analytics
```
GET /api/classes/{classId}/students
  Auth: Teacher (owner only)
  Response: { "students": [ { "id", "name", "email", "avgGrade", ... } ] }

GET /api/classes/{classId}/analytics
  Auth: Teacher (owner only)
  Response: { "classAverage", "conceptMastery", "strugglingStudents", ... }
  (See Analytics section for full response)
```

---

### 5.3 Assignment Management

#### Assignment CRUD
```
POST /api/classes/{classId}/assignments
  Auth: Teacher (owner only)
  Body: {
    "title": "Triangle Properties Quiz",
    "type": "quiz",
    "dueDate": "2025-11-01T23:59:59Z",
    "totalPoints": 100,
    "questions": [ ... ],
    "status": "draft"
  }
  Response: { "assignment": { ... } }

GET /api/classes/{classId}/assignments
  Auth: Teacher (owner), Student (enrolled)
  Query: status, type
  Response: { "assignments": [ ... ] }

GET /api/assignments/{assignmentId}
  Auth: Teacher (owner), Student (enrolled in class)
  Response: { "assignment": { ... } }

PUT /api/assignments/{assignmentId}
  Auth: Teacher (owner only)
  Body: { "title": "...", "questions": [ ... ], "status": "published" }

DELETE /api/assignments/{assignmentId}
  Auth: Teacher (owner only)
  - Soft delete
```

#### AI Generation
```
POST /api/classes/{classId}/upload-materials
  Auth: Teacher (owner only)
  Content-Type: multipart/form-data
  Body: files[]
  Response: { "materialIds": [ ... ], "status": "processing" }

GET /api/classes/{classId}/materials/{materialId}/status
  Auth: Teacher (owner only)
  Response: { "status": "processing" | "processed", "extractedText": "..." }

POST /api/classes/{classId}/assignments/generate
  Auth: Teacher (owner only)
  Body: {
    "materialIds": [ ... ],
    "type": "quiz",
    "topic": "Triangle Properties",
    "difficulty": "medium",
    "questionCount": 10,
    "questionTypes": ["multiple_choice", "free_response"]
  }
  Response: { "assignment": { ... } }
  - Returns draft assignment for teacher review
```

#### Student Assignment Views
```
GET /api/students/me/assignments
  Auth: Student
  Query: status (due_tonight, due_tomorrow, upcoming, completed)
  Response: {
    "dueTonight": [ ... ],
    "dueTomorrow": [ ... ],
    "upcoming": [ ... ]
  }

GET /api/students/me/assignments/{assignmentId}
  Auth: Student
  Response: {
    "assignment": { ... },
    "myAttempts": [ ... ],
    "canAttempt": true,
    "attemptsRemaining": 2
  }
```

---

### 5.4 Assignment Attempts & Grading

#### Start & Submit Assignment
```
POST /api/assignments/{assignmentId}/attempts
  Auth: Student (enrolled in class)
  Response: {
    "attempt": {
      "id": "attempt-123",
      "assignmentId": "...",
      "attemptNumber": 1,
      "startedAt": "...",
      "questions": [ ... ]  // Without correct answers
    }
  }

PUT /api/attempts/{attemptId}/answers/{questionId}
  Auth: Student (owner of attempt)
  Body: { "answer": 0, "timeSpent": 45 }
  Response: {
    "questionAnswer": {
      "isCorrect": true,
      "pointsEarned": 10,
      "feedback": "Correct! The Pythagorean theorem...",
      "correctAnswer": 0  // Show if wrong
    }
  }
  - Instant feedback after each question

GET /api/attempts/{attemptId}
  Auth: Student (owner), Teacher (class owner)
  Response: {
    "attempt": { ... },
    "answers": [ ... ],
    "progress": 0.6  // 60% complete
  }

POST /api/attempts/{attemptId}/submit
  Auth: Student (owner of attempt)
  Response: {
    "grade": {
      "totalPoints": 100,
      "earnedPoints": 85,
      "grade": 85,
      "feedback": "Great work! Focus on...",
      "answers": [ ... ]  // With all correct answers and explanations
    }
  }
```

#### Teacher Grading View
```
GET /api/assignments/{assignmentId}/submissions
  Auth: Teacher (class owner)
  Response: {
    "submissions": [
      {
        "studentId": "...",
        "studentName": "...",
        "attemptId": "...",
        "grade": 85,
        "submittedAt": "...",
        "status": "graded"
      }
    ],
    "stats": {
      "submitted": 21,
      "total": 28,
      "avgGrade": 84
    }
  }

GET /api/attempts/{attemptId}/details
  Auth: Teacher (class owner)
  Response: {
    "attempt": { ... },
    "answers": [ ... ],  // With all student answers and correctness
    "student": { "id", "name", "email" }
  }
```

---

### 5.5 Grades & Analytics

#### Student Grades
```
GET /api/students/me/grades
  Auth: Student
  Response: {
    "classes": [
      {
        "classId": "...",
        "className": "Geometry",
        "currentGrade": 87,
        "letterGrade": "B+",
        "trend": { "direction": "up", "changePercent": 3 },
        "breakdown": {
          "homework": { "average": 92, "weight": 0.20 },
          "quizzes": { "average": 88, "weight": 0.30 },
          "tests": { "average": 85, "weight": 0.40 },
          "practice": { "average": 95, "weight": 0.10 }
        },
        "recentAssignments": [ ... ]
      }
    ],
    "overallGPA": 3.7
  }

GET /api/classes/{classId}/grades
  Auth: Student (enrolled)
  Response: {
    "currentGrade": 87,
    "breakdown": { ... },
    "assignments": [
      {
        "assignmentId": "...",
        "title": "...",
        "grade": 85,
        "pointsEarned": 85,
        "totalPoints": 100,
        "submittedAt": "...",
        "feedback": "..."
      }
    ]
  }
```

#### Teacher Grade Management
```
GET /api/classes/{classId}/gradebook
  Auth: Teacher (owner)
  Response: {
    "students": [
      {
        "studentId": "...",
        "name": "...",
        "currentGrade": 87,
        "assignments": [
          { "assignmentId": "...", "grade": 85 },
          { "assignmentId": "...", "grade": 90 }
        ],
        "trend": { "direction": "up", "changePercent": 3 }
      }
    ]
  }

PUT /api/grades/{gradeId}
  Auth: Teacher (class owner)
  Body: { "grade": 88, "feedback": "..." }
  - Manual grade adjustment (rare, for free response)
```

---

### 5.6 Messaging

#### Conversations
```
GET /api/conversations
  Auth: Authenticated
  Query: filter (all, students, teachers, parents, unread)
  Response: {
    "conversations": [
      {
        "id": "...",
        "type": "direct",
        "participants": [ { "id", "name", "role" } ],
        "lastMessage": "...",
        "lastMessageAt": "...",
        "unreadCount": 2,
        "metadata": { ... }
      }
    ]
  }

POST /api/conversations
  Auth: Authenticated
  Body: {
    "participantIds": ["user-2"],
    "type": "direct",
    "metadata": { "classId": "..." }
  }
  Response: { "conversation": { ... } }

GET /api/conversations/{conversationId}
  Auth: Participant
  Response: { "conversation": { ... } }

GET /api/conversations/{conversationId}/messages
  Auth: Participant
  Query: limit, offset (pagination)
  Response: {
    "messages": [ ... ],
    "hasMore": true
  }
```

#### Messaging
```
POST /api/conversations/{conversationId}/messages
  Auth: Participant
  Body: {
    "content": "Hello!",
    "attachments": [ { "name", "url", "type" } ]
  }
  Response: { "message": { ... } }

PUT /api/messages/{messageId}/read
  Auth: Participant
  Response: { "success": true }

POST /api/classes/{classId}/broadcast
  Auth: Teacher (owner)
  Body: {
    "message": "Reminder: Quiz tomorrow!",
    "priority": "normal"
  }
  Response: { "conversationIds": [ ... ] }
  - Creates/updates conversation with each student
```

#### WebSocket Events
```
// See Section 3.5 for WebSocket event specifications
```

---

### 5.7 Analytics

#### Teacher Analytics
```
GET /api/teachers/me/analytics/overview
  Auth: Teacher
  Response: {
    "totalStudents": 70,
    "avgPerformance": 86,
    "assignmentsThisWeek": 9,
    "studentsNeedingAttention": 8,
    // ... with trends
  }

GET /api/classes/{classId}/analytics
  Auth: Teacher (owner)
  Response: {
    "classAverage": 87,
    "assignmentCompletion": { ... },
    "conceptMastery": [ ... ],
    "strugglingStudents": [ ... ],
    "topPerformers": [ ... ]
  }

GET /api/assignments/{assignmentId}/analytics
  Auth: Teacher (class owner)
  Response: {
    "submissionRate": 75,
    "avgGrade": 84,
    "questionAnalytics": [ ... ],
    "gradeDistribution": { ... }
  }
```

#### Student Analytics
```
GET /api/students/me/analytics/overview
  Auth: Student
  Response: {
    "currentGPA": 3.7,
    "activeChallenges": 3,
    "assignmentsDueThisWeek": 5,
    "conceptsMastered": 28
  }

GET /api/students/me/concepts/mastery
  Auth: Student
  Response: {
    "concepts": [
      {
        "conceptId": "...",
        "name": "Pythagorean Theorem",
        "masteryLevel": 85,
        "questionsAttempted": 12,
        "questionsCorrect": 10,
        "trend": "improving"
      }
    ]
  }

GET /api/classes/{classId}/learning-path
  Auth: Student (enrolled), Teacher (owner)
  Response: {
    "concepts": [
      {
        "id": "...",
        "name": "Basic Triangles",
        "order": 1,
        "status": "mastered",
        "prerequisites": []
      }
    ]
  }
```

---

### 5.8 Notifications

```
GET /api/notifications
  Auth: Authenticated
  Query: unread (boolean), limit, offset
  Response: {
    "notifications": [ ... ],
    "unreadCount": 5
  }

PUT /api/notifications/{notificationId}/read
  Auth: Owner
  Response: { "success": true }

PUT /api/notifications/read-all
  Auth: Authenticated
  Response: { "success": true }

DELETE /api/notifications/{notificationId}
  Auth: Owner
  Response: { "success": true }

// WebSocket for real-time notifications
socket.on('notification', (notification) => { ... });
```

---

### 5.9 Search & Discovery

```
GET /api/search/users
  Auth: Authenticated
  Query: q (query string), role (filter), limit
  Response: {
    "users": [
      { "id", "name", "email", "role" }
    ]
  }
  - Teachers can search students
  - Students can search teachers

GET /api/search/classes
  Auth: Student
  Query: q, subject, teacher
  Response: { "classes": [ ... ] }
  - For self-enrollment discovery
```

---

### 5.10 Activity Tracking

```
POST /api/activity-log
  Auth: Authenticated
  Body: {
    "activityType": "question_answer",
    "metadata": {
      "questionId": "...",
      "answer": 0,
      "isCorrect": true,
      "timeSpent": 45
    }
  }
  Response: { "success": true }
  - Log all user interactions

GET /api/students/{studentId}/activity-log
  Auth: Student (self), Teacher (their students), Admin
  Query: activityType, startDate, endDate, limit, offset
  Response: {
    "activities": [ ... ]
  }
```

---

## 6. Business Logic & Workflows

### 6.1 Class Creation & Enrollment Workflow

```
1. Teacher creates class
   POST /api/classes
   ↓
2. System generates unique invite code
   inviteCode = generateUniqueCode()
   ↓
3. Teacher shares invite code with students
   (Display on frontend)
   ↓
4. Student enters invite code
   POST /api/classes/enroll { "inviteCode": "ABC123" }
   ↓
5. System creates enrollment request
   status = "pending"
   ↓
6. System sends notification to teacher
   WebSocket: 'notification' event
   ↓
7. Teacher reviews and approves
   PUT /api/classes/{classId}/enrollment-requests/{enrollmentId}
   { "status": "approved" }
   ↓
8. System updates enrollment and notifies student
   status = "approved"
   studentIds.push(studentId)
   WebSocket: notification to student
   ↓
9. Student gains access to class
   Can view assignments, grades, etc.
```

---

### 6.2 Assignment Creation & Grading Workflow

```
TEACHER SIDE:

1. Teacher uploads curriculum materials
   POST /api/classes/{classId}/upload-materials
   ↓
2. System processes files asynchronously
   - Extract text from PDFs, Word docs
   - Store extracted content
   - Analyze for concepts and topics
   ↓
3. Teacher requests AI assignment generation
   POST /api/classes/{classId}/assignments/generate
   {
     "materialIds": ["mat-1", "mat-2"],
     "type": "quiz",
     "questionCount": 10
   }
   ↓
4. AI generates questions
   - Analyze curriculum content
   - Generate 10 questions with:
     * Question text
     * Options (for MC)
     * Correct answer
     * Explanation
     * Concept tags
   ↓
5. System returns draft assignment
   status = "draft"
   Teacher reviews questions on frontend
   ↓
6. Teacher edits (optional) and publishes
   PUT /api/assignments/{assignmentId}
   { "status": "published", "questions": [...] }
   ↓
7. System notifies all enrolled students
   For each student in class:
     - Create notification
     - Send WebSocket event
     - (Optional) Send email

STUDENT SIDE:

8. Student starts assignment
   POST /api/assignments/{assignmentId}/attempts
   ↓
9. System creates attempt record
   attemptNumber = 1
   startedAt = now()
   ↓
10. Student answers each question
    PUT /api/attempts/{attemptId}/answers/{questionId}
    { "answer": 0, "timeSpent": 45 }
    ↓
11. System immediately grades and returns feedback
    - Multiple Choice: Check if answer === correctAnswer
    - Free Response: Use AI to compare with expectedAnswer
    ↓
    Return to student:
    {
      "isCorrect": true,
      "pointsEarned": 10,
      "feedback": "Correct! The Pythagorean theorem states...",
      "correctAnswer": 0  // If wrong
    }
    ↓
12. Repeat for all questions
    Track time spent, answers, correctness
    ↓
13. Student submits assignment
    POST /api/attempts/{attemptId}/submit
    ↓
14. System calculates final grade
    totalPoints = sum(question.points)
    earnedPoints = sum(answer.pointsEarned)
    grade = (earnedPoints / totalPoints) * 100
    ↓
15. System stores grade and notifies teacher
    - Create Grade record
    - Update ClassGradeSummary
    - Send notification to teacher
    - Update ConceptMastery records
    ↓
16. Student views grade immediately
    GET /api/students/me/grades
```

---

### 6.3 Real-time Messaging Workflow

```
USER A SENDS MESSAGE:

1. User A types message and clicks send
   ↓
2. Frontend emits WebSocket event
   socket.emit('send_message', {
     conversationId: 'conv-123',
     content: 'Hello!'
   })
   ↓
3. Backend receives event
   - Authenticate user via JWT in socket connection
   - Validate user is participant in conversation
   ↓
4. Backend saves message to database
   Message.create({
     conversationId: 'conv-123',
     senderId: userA.id,
     content: 'Hello!',
     timestamp: now()
   })
   ↓
5. Backend updates conversation
   Conversation.update({
     lastMessage: 'Hello!',
     lastMessageAt: now(),
     unreadCounts: { userB: unreadCounts.userB + 1 }
   })
   ↓
6. Backend broadcasts to all participants
   For each participant:
     socket.to(participant.id).emit('new_message', {
       conversationId: 'conv-123',
       message: { ... }
     })
   ↓
7. User B receives message in real-time
   Frontend updates UI immediately
   ↓
8. User B opens conversation
   socket.emit('mark_read', {
     conversationId: 'conv-123',
     messageId: 'msg-456'
   })
   ↓
9. Backend updates read status
   Message.update({ readBy: [...readBy, userB.id] })
   Conversation.update({ unreadCounts: { userB: 0 } })
   ↓
10. Backend notifies User A
    socket.to(userA.id).emit('message_read', {
      messageId: 'msg-456',
      readBy: 'userB'
    })
    ↓
11. User A sees read receipt
    Frontend shows double check mark
```

---

### 6.4 Grade Calculation Workflow

```
TRIGGERED BY: Student submits assignment

1. Calculate assignment grade
   earnedPoints = sum(answer.pointsEarned)
   totalPoints = sum(question.points)
   assignmentGrade = (earnedPoints / totalPoints) * 100
   ↓
2. Store grade record
   Grade.create({
     studentId,
     classId,
     assignmentId,
     grade: assignmentGrade,
     category: assignment.type
   })
   ↓
3. Update concept mastery
   For each question in assignment:
     - Get associated concepts
     - Update ConceptMastery records
     - Calculate new mastery level based on:
       * Correctness
       * Time spent
       * Historical performance
   ↓
4. Recalculate class grade
   - Get all grades for student in class
   - Group by category (homework, quiz, test, practice)
   - Calculate weighted average:
     finalGrade = sum(categoryAvg * categoryWeight)
   ↓
5. Update ClassGradeSummary
   ClassGradeSummary.update({
     studentId,
     classId,
     currentGrade: finalGrade,
     categories: { ... },
     lastCalculatedAt: now()
   })
   ↓
6. Calculate trend
   - Compare with grade from 1 week ago
   - Calculate percent change
   - Set trend direction (up/down/stable)
   ↓
7. Check for alerts
   If finalGrade < 70:
     - Create notification for teacher
     - Flag student as "needs help"
   ↓
8. Send notifications
   - Notify student (grade posted)
   - Notify teacher (if student needs help)
```

---

### 6.5 AI Assignment Generation Workflow

```
DETAILED AI INTEGRATION:

1. Teacher uploads materials
   Files: lecture.pdf, textbook_chapter.docx, notes.txt
   ↓
2. Extract text from files
   Use libraries:
   - PDF: pdf-parse, pdfjs-dist
   - Word: mammoth, docx
   - Images: OCR with Tesseract
   ↓
3. Clean and structure content
   - Remove headers, footers, page numbers
   - Identify sections, headings
   - Extract key terms and definitions
   ↓
4. Store in UploadedMaterial
   extractedText = "... full content ..."
   status = "processed"
   ↓
5. Teacher requests assignment generation
   materialIds = ["mat-1", "mat-2"]
   type = "quiz"
   questionCount = 10
   ↓
6. Prepare prompt for AI
   Combine all material texts
   Build structured prompt:

   "You are an expert educator creating a quiz for high school students.

   Content to base questions on:
   {extractedText}

   Create {questionCount} {type} questions about {topic}.
   Difficulty: {difficulty}
   Question types: {questionTypes}

   For each question, provide:
   1. Question text
   2. 4 multiple choice options (if applicable)
   3. Correct answer (index or text)
   4. Detailed explanation of correct answer
   5. Common misconceptions to address
   6. Related concept tags

   Return in JSON format:
   {
     questions: [
       {
         text: '...',
         type: 'multiple_choice',
         options: ['...', '...', '...', '...'],
         correctAnswer: 0,
         explanation: '...',
         conceptTags: ['...']
       }
     ]
   }"
   ↓
7. Call AI API (e.g., OpenAI GPT-4)
   POST https://api.openai.com/v1/chat/completions
   {
     model: "gpt-4",
     messages: [
       { role: "system", content: systemPrompt },
       { role: "user", content: userPrompt }
     ],
     temperature: 0.7,
     response_format: { type: "json_object" }
   }
   ↓
8. Parse AI response
   questions = JSON.parse(response.choices[0].message.content)
   ↓
9. Validate and enhance questions
   For each question:
     - Ensure all required fields present
     - Validate correct answer format
     - Add points (default: 10 per question)
     - Generate unique IDs
     - Order questions
   ↓
10. Create draft assignment
    Assignment.create({
      status: 'draft',
      questions: enhancedQuestions,
      generatedFromMaterialIds: materialIds,
      aiGeneratedAt: now()
    })
    ↓
11. Return to teacher for review
    Response: { assignment: { ... } }
```

---

### 6.6 Free Response Grading Workflow

```
WHEN STUDENT SUBMITS FREE RESPONSE:

1. Student types answer
   "The Pythagorean theorem states that in a right triangle,
    the square of the hypotenuse equals the sum of squares
    of the other two sides."
   ↓
2. Submit to grading endpoint
   PUT /api/attempts/{attemptId}/answers/{questionId}
   { "answer": "..." }
   ↓
3. Prepare AI grading prompt
   expectedAnswer = question.expectedAnswer
   rubric = question.rubric
   studentAnswer = answer

   Prompt:
   "Grade this student's answer to the following question:

   Question: {question.text}

   Expected Answer: {expectedAnswer}

   Rubric: {rubric}

   Student's Answer: {studentAnswer}

   Provide:
   1. Score (0-10)
   2. Is the answer correct? (yes/no)
   3. Detailed feedback
   4. What the student got right
   5. What needs improvement

   Return JSON:
   {
     score: 8,
     isCorrect: true,
     feedback: '...',
     strengths: ['...'],
     improvements: ['...']
   }"
   ↓
4. Call AI API
   POST https://api.openai.com/v1/chat/completions
   ↓
5. Parse grading response
   result = JSON.parse(response)
   ↓
6. Store answer and feedback
   QuestionAnswer.create({
     questionId,
     answer: studentAnswer,
     isCorrect: result.isCorrect,
     pointsEarned: result.score,
     feedback: result.feedback,
     aiGradedAt: now(),
     aiConfidence: 0.95
   })
   ↓
7. Return to student immediately
   Response: {
     isCorrect: result.isCorrect,
     pointsEarned: result.score,
     feedback: result.feedback
   }
```

---

## 7. Security & Data Protection

### 7.1 Data Isolation & Access Control

**CRITICAL REQUIREMENT**: Districts/schools MUST be completely isolated.

#### Implementation:

1. **Database-Level Isolation**:
   ```sql
   -- All queries MUST include district/school filter
   SELECT * FROM users
   WHERE districtId = :currentUserDistrictId
   AND role = 'teacher';

   -- Use database views with built-in filters
   CREATE VIEW teachers_in_district AS
   SELECT * FROM users
   WHERE districtId = CURRENT_DISTRICT_ID()
   AND role = 'teacher';
   ```

2. **API-Level Checks**:
   ```javascript
   // Middleware to enforce data isolation
   function enforceDataIsolation(req, res, next) {
     const userDistrictId = req.user.districtId;
     const requestedResourceDistrictId = getResourceDistrictId(req);

     if (userDistrictId !== requestedResourceDistrictId) {
       return res.status(403).json({
         error: 'Access denied: cross-district access not allowed'
       });
     }

     next();
   }
   ```

3. **Role-Based Access Control (RBAC)**:
   ```javascript
   const permissions = {
     teacher: {
       'class:read': (user, class) => class.teacherId === user.id,
       'class:write': (user, class) => class.teacherId === user.id,
       'student:read': (user, student) => userTeachesStudent(user, student),
       'grade:read': (user, grade) => userTeachesStudent(user, grade.studentId),
       'assignment:create': (user, class) => class.teacherId === user.id,
     },
     student: {
       'class:read': (user, class) => class.studentIds.includes(user.id),
       'assignment:read': (user, assignment) => isEnrolledInClass(user, assignment.classId),
       'grade:read': (user, grade) => grade.studentId === user.id,
       'own_data:write': (user, resource) => resource.userId === user.id,
     },
     admin: {
       'teacher:read': (user, teacher) => teacher.districtId === user.districtId,
       'student:read': (user, student) => student.districtId === user.districtId,
       'analytics:read': (user, resource) => resource.districtId === user.districtId,
     }
   };

   function checkPermission(user, action, resource) {
     const userPermissions = permissions[user.role];
     const check = userPermissions[action];
     return check ? check(user, resource) : false;
   }
   ```

---

### 7.2 Authentication Security

1. **OAuth Token Management**:
   - Store refresh tokens encrypted in database
   - Use short-lived access tokens (1 hour)
   - Implement token rotation on refresh
   - Invalidate tokens on logout

2. **JWT Security**:
   ```javascript
   // JWT payload structure
   {
     sub: userId,
     role: 'teacher',
     districtId: 'district-123',  // CRITICAL for isolation
     schoolId: 'school-456',
     iat: 1635724800,
     exp: 1635728400  // 1 hour
   }

   // Sign with strong secret
   const token = jwt.sign(payload, process.env.JWT_SECRET, {
     algorithm: 'HS256',
     issuer: 'socratit.ai',
     audience: 'socratit-api'
   });
   ```

3. **Password Reset Security**:
   - Generate cryptographically secure tokens (crypto.randomBytes)
   - Set short expiry (1 hour)
   - Invalidate on use
   - Rate limit reset requests (max 3 per hour per email)

---

### 7.3 API Security

1. **Rate Limiting**:
   ```javascript
   // Per endpoint
   /api/auth/login: 5 requests per 15 minutes per IP
   /api/assignments/*/generate: 10 requests per hour per teacher
   /api/messages: 100 requests per minute per user
   /api/*: 1000 requests per hour per user
   ```

2. **Input Validation**:
   - Validate all inputs with schemas (Joi, Yup, Zod)
   - Sanitize user-generated content (XSS prevention)
   - Validate file uploads (type, size, content)
   - Prevent SQL injection (use parameterized queries/ORMs)

3. **CORS Configuration**:
   ```javascript
   cors({
     origin: process.env.FRONTEND_URL,
     credentials: true,
     methods: ['GET', 'POST', 'PUT', 'DELETE'],
     allowedHeaders: ['Content-Type', 'Authorization']
   })
   ```

4. **HTTPS Only**:
   - Enforce HTTPS in production
   - Set secure cookie flags
   - HSTS headers

---

### 7.4 Data Privacy

1. **PII Protection**:
   - Encrypt sensitive data at rest (email, name)
   - Never log sensitive data
   - Implement data retention policies
   - GDPR/COPPA compliance

2. **Activity Logging**:
   - Log all data access (who, what, when)
   - Store logs separately from main database
   - Implement audit trails for grade changes

3. **File Upload Security**:
   - Virus scan all uploads
   - Store in isolated storage (S3 with strict permissions)
   - Generate signed URLs for access
   - Set appropriate content-type headers

---

### 7.5 WebSocket Security

```javascript
// Authenticate WebSocket connection
io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.sub;
    socket.userRole = decoded.role;
    socket.districtId = decoded.districtId;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// Validate message permissions
socket.on('send_message', async (data) => {
  const conversation = await getConversation(data.conversationId);

  // Check user is participant
  if (!conversation.participantIds.includes(socket.userId)) {
    return socket.emit('error', { message: 'Access denied' });
  }

  // Check data isolation
  if (conversation.districtId !== socket.districtId) {
    return socket.emit('error', { message: 'Access denied' });
  }

  // Process message...
});
```

---

## 8. AI Integration Requirements

### 8.1 AI Service Selection

**Recommended**: OpenAI GPT-4 or GPT-4-Turbo

**Why**:
- Best performance for educational content
- JSON mode for structured outputs
- Large context window (128k tokens)
- Reliable and well-documented

**Alternative**: Anthropic Claude, Google Gemini

---

### 8.2 AI Prompt Engineering

#### Assignment Generation Prompts

**System Prompt**:
```
You are an expert educator with deep knowledge in [SUBJECT].
You create engaging, pedagogically sound assessments that:
- Align with learning objectives
- Test conceptual understanding, not just memorization
- Include appropriate difficulty progression
- Provide clear, helpful explanations
- Address common student misconceptions

Always return responses in valid JSON format.
```

**User Prompt Template**:
```
Create a {type} with {questionCount} questions for {gradeLevel} students.

CONTENT TO BASE QUESTIONS ON:
{extractedText}

REQUIREMENTS:
- Topic: {topic}
- Difficulty: {difficulty}
- Question types: {questionTypes}
- Concepts to cover: {concepts}

For each question, provide:
1. question_text: Clear, concise question
2. type: 'multiple_choice' or 'free_response'
3. options: Array of 4 plausible answers (for MC)
4. correct_answer: Index (MC) or model answer (FR)
5. explanation: Why the answer is correct (2-3 sentences)
6. common_misconceptions: Array of wrong answers and why students choose them
7. concept_tags: Array of related concepts
8. difficulty: 'easy', 'medium', or 'hard'

Return JSON:
{
  "questions": [
    {
      "question_text": "...",
      "type": "multiple_choice",
      "options": ["A", "B", "C", "D"],
      "correct_answer": 0,
      "explanation": "...",
      "common_misconceptions": [
        {"wrong_answer": 1, "reason": "..."}
      ],
      "concept_tags": ["Pythagorean Theorem"],
      "difficulty": "medium"
    }
  ]
}
```

#### Free Response Grading Prompts

**System Prompt**:
```
You are an experienced teacher grading student work fairly and constructively.
Provide specific, actionable feedback that helps students improve.
Be encouraging while maintaining academic rigor.
```

**User Prompt Template**:
```
Grade this student's answer:

QUESTION: {question_text}

EXPECTED ANSWER: {expected_answer}

GRADING RUBRIC:
{rubric}

STUDENT'S ANSWER: {student_answer}

Evaluate based on:
1. Accuracy of content
2. Completeness of response
3. Clarity of explanation
4. Use of proper terminology

Return JSON:
{
  "score": 0-10,
  "is_correct": true/false,
  "feedback": "Detailed feedback (3-5 sentences)",
  "strengths": ["What the student did well"],
  "improvements": ["What could be better"],
  "partial_credit_reasoning": "Why this score was given"
}
```

---

### 8.3 AI API Integration

```javascript
async function generateAssignment(params) {
  const prompt = buildAssignmentPrompt(params);

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 4000
  });

  const result = JSON.parse(response.choices[0].message.content);

  // Validate and enhance
  const questions = result.questions.map((q, index) => ({
    ...q,
    id: generateId(),
    order: index + 1,
    points: 10
  }));

  return questions;
}

async function gradeFreeResponse(question, answer) {
  const prompt = buildGradingPrompt(question, answer);

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: GRADING_SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,  // Lower for consistency
    max_tokens: 1000
  });

  const result = JSON.parse(response.choices[0].message.content);
  return result;
}
```

---

### 8.4 AI Cost & Performance Optimization

1. **Caching**:
   - Cache generated questions for similar topics
   - Cache common free response answers

2. **Batching**:
   - Generate multiple questions in one API call
   - Grade multiple answers together

3. **Token Management**:
   - Limit extracted text length (first 10,000 words)
   - Use embeddings for long documents
   - Implement token counting

4. **Error Handling**:
   - Retry with exponential backoff
   - Fallback to simpler prompts on failure
   - Human review for low-confidence grades

---

### 8.5 Content Moderation

**All AI-generated content MUST be filtered for**:
- Inappropriate content
- Bias
- Factual accuracy
- Age-appropriateness

```javascript
async function moderateContent(text) {
  const moderation = await openai.moderations.create({
    input: text
  });

  if (moderation.results[0].flagged) {
    throw new Error('Content flagged by moderation');
  }

  return true;
}
```

---

## 9. Real-time Features

### 9.1 WebSocket Implementation

**Recommended**: Socket.io

#### Server Setup
```javascript
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Authentication middleware
io.use(authenticateSocket);

// Connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.userId}`);

  // Join user's personal room
  socket.join(socket.userId);

  // Join class rooms if teacher/student
  joinClassRooms(socket);

  // Set online status
  setUserOnline(socket.userId);
  broadcastPresence(socket.userId, 'online');

  // Message handlers
  socket.on('send_message', handleSendMessage);
  socket.on('typing', handleTyping);
  socket.on('mark_read', handleMarkRead);

  // Disconnect
  socket.on('disconnect', () => {
    setUserOffline(socket.userId);
    broadcastPresence(socket.userId, 'offline');
  });
});
```

#### Events to Implement

**Client → Server**:
- `send_message`: Send new message
- `typing`: User is typing
- `stop_typing`: User stopped typing
- `mark_read`: Mark message as read
- `join_conversation`: Join conversation room

**Server → Client**:
- `new_message`: New message received
- `message_read`: Message read by recipient
- `user_typing`: User is typing
- `user_presence`: User online/offline status
- `notification`: New notification
- `assignment_published`: New assignment available
- `grade_posted`: Grade available

---

### 9.2 Presence System

```javascript
// Store online users in Redis for scalability
const redis = require('redis');
const redisClient = redis.createClient();

async function setUserOnline(userId) {
  await redisClient.setEx(`presence:${userId}`, 3600, 'online');
  await redisClient.sAdd('online_users', userId);
}

async function setUserOffline(userId) {
  await redisClient.del(`presence:${userId}`);
  await redisClient.sRem('online_users', userId);
}

async function getUserPresence(userId) {
  const status = await redisClient.get(`presence:${userId}`);
  return status || 'offline';
}

async function getOnlineUsers() {
  return await redisClient.sMembers('online_users');
}

// Broadcast presence to relevant users
function broadcastPresence(userId, status) {
  // Get user's contacts (classmates, teachers)
  const contacts = getUserContacts(userId);

  contacts.forEach(contactId => {
    io.to(contactId).emit('user_presence', {
      userId,
      status
    });
  });
}
```

---

### 9.3 Notification Broadcasting

```javascript
async function sendNotification(userId, notification) {
  // Save to database
  await Notification.create({
    userId,
    ...notification
  });

  // Send via WebSocket if user online
  io.to(userId).emit('notification', notification);

  // Optional: Send email for important notifications
  if (notification.priority === 'high') {
    await sendEmailNotification(userId, notification);
  }
}

// Bulk notifications (e.g., assignment published to class)
async function sendBulkNotification(userIds, notification) {
  // Save to database in batch
  await Notification.bulkCreate(
    userIds.map(userId => ({ userId, ...notification }))
  );

  // Broadcast via WebSocket
  userIds.forEach(userId => {
    io.to(userId).emit('notification', notification);
  });
}
```

---

### 9.4 Real-time Assignment Updates

```javascript
// When teacher publishes assignment
async function publishAssignment(assignmentId) {
  const assignment = await Assignment.findById(assignmentId);
  const classData = await Class.findById(assignment.classId);

  // Update status
  assignment.status = 'active';
  assignment.publishedAt = new Date();
  await assignment.save();

  // Notify all students in class
  classData.studentIds.forEach(studentId => {
    io.to(studentId).emit('assignment_published', {
      assignmentId: assignment.id,
      title: assignment.title,
      dueDate: assignment.dueDate,
      classId: assignment.classId,
      className: classData.name
    });
  });
}

// When student submits assignment
async function submitAssignment(attemptId) {
  const attempt = await AssignmentAttempt.findById(attemptId);
  const assignment = await Assignment.findById(attempt.assignmentId);

  // Grade and store
  const grade = calculateGrade(attempt);
  await storeGrade(grade);

  // Notify teacher
  io.to(assignment.teacherId).emit('submission_received', {
    studentId: attempt.studentId,
    studentName: getStudentName(attempt.studentId),
    assignmentId: assignment.id,
    grade: grade.grade
  });
}
```

---

## 10. File Upload & Processing

### 10.1 File Upload Handling

```javascript
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,  // 50MB limit
    files: 10  // Max 10 files per upload
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Upload endpoint
router.post('/api/classes/:classId/upload-materials',
  authenticate,
  authorizeTeacher,
  upload.array('files'),
  async (req, res) => {
    const files = req.files;
    const classId = req.params.classId;

    // Process each file asynchronously
    const materialPromises = files.map(file =>
      processUploadedMaterial(file, classId, req.user.id)
    );

    const materials = await Promise.all(materialPromises);

    res.json({ materials });
  }
);
```

---

### 10.2 Text Extraction

```javascript
async function extractText(file) {
  const { buffer, mimetype } = file;

  switch (mimetype) {
    case 'application/pdf':
      return await extractPdfText(buffer);

    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return await extractDocxText(buffer);

    case 'text/plain':
      return buffer.toString('utf-8');

    case 'image/jpeg':
    case 'image/png':
      return await extractTextFromImage(buffer);  // OCR

    default:
      throw new Error('Unsupported file type');
  }
}

async function extractPdfText(buffer) {
  const pdfParse = require('pdf-parse');
  const data = await pdfParse(buffer);
  return data.text;
}

async function extractDocxText(buffer) {
  const mammoth = require('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

async function extractTextFromImage(buffer) {
  const Tesseract = require('tesseract.js');
  const { data: { text } } = await Tesseract.recognize(buffer, 'eng');
  return text;
}
```

---

### 10.3 Content Processing Pipeline

```javascript
async function processUploadedMaterial(file, classId, teacherId) {
  // 1. Save basic file info
  const material = await UploadedMaterial.create({
    classId,
    teacherId,
    fileName: file.originalname,
    fileType: file.mimetype,
    fileSize: file.size,
    status: 'processing'
  });

  try {
    // 2. Extract text (asynchronously)
    const extractedText = await extractText(file);

    // 3. Clean and structure text
    const cleanedText = cleanText(extractedText);

    // 4. Identify concepts (optional, using AI)
    const concepts = await identifyConcepts(cleanedText);

    // 5. Update material
    await material.update({
      extractedText: cleanedText,
      identifiedConcepts: concepts,
      status: 'processed',
      processedAt: new Date()
    });

    return material;

  } catch (error) {
    await material.update({
      status: 'failed',
      processingError: error.message
    });
    throw error;
  }
}

function cleanText(text) {
  return text
    .replace(/\s+/g, ' ')  // Normalize whitespace
    .replace(/\n{3,}/g, '\n\n')  // Limit consecutive newlines
    .trim();
}
```

---

## 11. Tech Stack Recommendations

### 11.1 Backend Framework

**Option 1: Node.js + Express (Recommended)**
- **Pros**:
  - JavaScript everywhere (same language as frontend)
  - Excellent WebSocket support (Socket.io)
  - Large ecosystem (npm packages)
  - Good for real-time features
  - Easy to deploy
- **Cons**:
  - Single-threaded (use worker threads for heavy tasks)
  - Callback hell (mitigate with async/await)

**Option 2: Python + FastAPI**
- **Pros**:
  - Great for AI/ML integrations
  - Strong typing with Pydantic
  - Automatic API docs (Swagger)
  - Good for data processing
- **Cons**:
  - WebSocket support not as mature
  - Slower for high-concurrency I/O

**Option 3: Go + Gin/Echo**
- **Pros**:
  - High performance
  - Excellent concurrency
  - Small memory footprint
- **Cons**:
  - Less AI library support
  - Smaller ecosystem

**Recommendation**: **Node.js + Express** for rapid development and real-time features.

---

### 11.2 Database

**Option 1: PostgreSQL (Recommended)**
- **Pros**:
  - ACID compliance (critical for grades)
  - JSON support (flexible schema)
  - Full-text search
  - Excellent for relational data
  - Mature, reliable
- **Cons**:
  - Requires more setup than NoSQL

**Option 2: MongoDB**
- **Pros**:
  - Flexible schema
  - Good for rapid prototyping
  - Horizontal scaling
- **Cons**:
  - No ACID for multi-document transactions (in some versions)
  - Can lead to data inconsistency
  - Not ideal for complex queries

**Option 3: MySQL/MariaDB**
- **Pros**:
  - Widely supported
  - Good performance
  - Easy to find hosting
- **Cons**:
  - Limited JSON support (compared to PostgreSQL)

**Recommendation**: **PostgreSQL** for data integrity and rich querying.

---

### 11.3 ORM/Query Builder

**Node.js**:
- **Prisma** (Recommended): Modern, type-safe, great DX
- **TypeORM**: Feature-rich, supports multiple DBs
- **Sequelize**: Mature, widely used

**Python**:
- **SQLAlchemy**: Most popular, powerful
- **Tortoise ORM**: Async, similar to Django ORM

---

### 11.4 Real-time Communication

**Recommendation**: **Socket.io**
- Easy to use
- Automatic fallback (WebSocket → polling)
- Built-in rooms and namespaces
- Good browser support

**Alternative**: Raw WebSockets (more control, more complexity)

---

### 11.5 Caching

**Recommendation**: **Redis**
- Fast in-memory storage
- Pub/sub for real-time features
- Session storage
- Rate limiting
- Presence system

---

### 11.6 File Storage

**Options**:
1. **AWS S3** (Recommended)
   - Scalable, reliable
   - Cheap storage
   - CDN integration (CloudFront)
   - Signed URLs for security

2. **Google Cloud Storage**
   - Similar to S3
   - Good Google integration

3. **Azure Blob Storage**
   - Good for Microsoft ecosystems

**Recommendation**: **AWS S3** (most popular, best docs)

---

### 11.7 Background Jobs

**For**:
- Processing uploaded files
- Sending emails
- Calculating analytics
- Cleaning up old data

**Options**:
- **Bull** (Node.js, Redis-based) - Recommended
- **Celery** (Python, Redis/RabbitMQ)
- **Sidekiq** (Ruby)

---

### 11.8 Email Service

**For**:
- Verification emails
- Password resets
- Notifications
- Weekly digests

**Options**:
- **SendGrid** - Easy to use, generous free tier
- **Mailgun** - Developer-friendly
- **AWS SES** - Cheapest at scale

---

### 11.9 Monitoring & Logging

**Application Monitoring**:
- **Sentry** - Error tracking
- **DataDog** - Full observability
- **New Relic** - APM

**Logging**:
- **Winston** (Node.js)
- **Pino** (Node.js, faster)
- **Python logging** (built-in)

---

### 11.10 API Documentation

**Recommendation**: **Swagger/OpenAPI**
- Auto-generate from code
- Interactive API docs
- Client SDK generation

**Tools**:
- **swagger-jsdoc** + **swagger-ui-express** (Node.js)
- **FastAPI** (Python, built-in)

---

## 12. Deployment & Scaling

### 12.1 Cloud Provider Comparison

**AWS (Amazon Web Services)**
- **Pros**: Most mature, widest service selection, best docs
- **Services**: EC2, RDS, S3, Lambda, ElastiCache, SQS
- **Cost**: Pay-as-you-go, can be expensive
- **Best for**: Enterprises, complex architectures

**Google Cloud Platform (GCP)**
- **Pros**: Good for AI/ML, competitive pricing
- **Services**: Compute Engine, Cloud SQL, Cloud Storage, Cloud Functions
- **Cost**: Slightly cheaper than AWS
- **Best for**: AI-heavy applications, startups

**Azure**
- **Pros**: Best for Microsoft ecosystems, enterprise integration
- **Services**: Virtual Machines, Azure Database, Blob Storage
- **Cost**: Similar to AWS
- **Best for**: Enterprises using Microsoft stack

**Vercel/Netlify (Serverless)**
- **Pros**: Easy deployment, free tier, great DX
- **Cons**: Limited backend capabilities, vendor lock-in
- **Best for**: Frontend + serverless functions

**DigitalOcean/Linode**
- **Pros**: Simple, cheap, good docs for beginners
- **Cons**: Fewer managed services
- **Best for**: Startups, simple architectures

**Recommendation**:
- **Development**: DigitalOcean (simple, cheap)
- **Production**: AWS or GCP (scalable, reliable)

---

### 12.2 Infrastructure Architecture

**For ~1000 users**:

```
┌─────────────────┐
│   Load Balancer │  (AWS ALB, NGINX)
└────────┬────────┘
         │
    ┌────┴─────┐
    │          │
┌───▼────┐ ┌──▼─────┐
│  API   │ │  API   │  (2-3 instances)
│ Server │ │ Server │
└───┬────┘ └──┬─────┘
    │         │
    └────┬────┘
         │
    ┌────▼──────────┐
    │   PostgreSQL  │  (RDS, managed)
    │   (Primary +  │
    │   Read Replica)│
    └───────────────┘
         │
    ┌────▼──────┐
    │   Redis   │  (ElastiCache)
    │ (Sessions,│
    │  Cache,   │
    │ Presence) │
    └───────────┘
         │
    ┌────▼──────┐
    │    S3     │  (File storage)
    └───────────┘
```

**Components**:

1. **Load Balancer**:
   - Distribute traffic across API servers
   - SSL termination
   - Health checks

2. **API Servers** (2-3 instances):
   - Node.js/Express applications
   - Stateless (store sessions in Redis)
   - Auto-scaling based on CPU/memory

3. **Database**:
   - PostgreSQL (managed service like AWS RDS)
   - Primary for writes
   - Read replica for analytics queries
   - Automated backups

4. **Redis**:
   - Session storage
   - Caching (user data, frequently accessed content)
   - Rate limiting
   - Presence system (online users)
   - Message queue

5. **File Storage**:
   - S3 for uploaded materials
   - CloudFront CDN for fast delivery

6. **Background Workers** (1-2 instances):
   - Process file uploads
   - Send emails
   - Calculate analytics
   - Clean up old data

---

### 12.3 Scaling Considerations

**At 1,000 users**:
- 2 API servers (t3.medium on AWS)
- 1 PostgreSQL (db.t3.medium with read replica)
- 1 Redis (cache.t3.micro)
- Background jobs can run on API servers

**At 10,000 users**:
- 5-10 API servers (auto-scaling)
- PostgreSQL (db.t3.large with 2 read replicas)
- Redis (cache.t3.medium with clustering)
- Dedicated worker servers (2-3 instances)
- Database query optimization
- Implement caching strategy

**At 100,000+ users**:
- 20-50+ API servers (auto-scaling groups)
- PostgreSQL sharding by district/school
- Redis cluster (3-5 nodes)
- Separate WebSocket servers
- CDN for static assets
- Database connection pooling
- Implement microservices architecture

---

### 12.4 Performance Optimization

1. **Database**:
   - Index frequently queried fields (userId, classId, etc.)
   - Use database connection pooling
   - Implement query caching
   - Use read replicas for analytics

2. **API**:
   - Cache frequently accessed data (Redis)
   - Implement pagination for large lists
   - Use compression (gzip)
   - Optimize serialization (use streams)

3. **Real-time**:
   - Use Redis adapter for Socket.io (multi-server support)
   - Implement rooms strategically
   - Limit broadcast frequency

4. **File Processing**:
   - Process asynchronously (background jobs)
   - Stream large files (don't load into memory)
   - Use signed URLs (avoid proxying through API)

---

### 12.5 Deployment Strategy

**Development**:
```
1. Local development
2. Push to Git (GitHub, GitLab)
3. CI runs tests
4. Manual deploy to staging
5. QA testing
6. Manual deploy to production
```

**Production** (CI/CD):
```
1. Push to main branch
2. GitHub Actions / GitLab CI triggers
3. Run tests (unit, integration, e2e)
4. Build Docker image
5. Push to container registry
6. Deploy to staging (Kubernetes/ECS)
7. Run smoke tests
8. Manual approval gate
9. Deploy to production (blue-green deployment)
10. Monitor for errors
11. Rollback if issues detected
```

**Tools**:
- **CI/CD**: GitHub Actions, GitLab CI, CircleCI
- **Containers**: Docker
- **Orchestration**: Kubernetes (complex), AWS ECS (simpler), Docker Compose (simplest)
- **Monitoring**: Sentry, DataDog, CloudWatch

---

### 12.6 Backup & Disaster Recovery

1. **Database Backups**:
   - Automated daily backups (7-day retention)
   - Weekly backups (30-day retention)
   - Monthly backups (1-year retention)
   - Test restore process monthly

2. **File Backups**:
   - S3 versioning enabled
   - Cross-region replication (for critical data)

3. **Disaster Recovery**:
   - Document recovery procedures
   - Test failover processes
   - RTO (Recovery Time Objective): 4 hours
   - RPO (Recovery Point Objective): 1 hour (max data loss)

---

## 13. Future Plans

### 13.1 AI Teaching Assistant (Phase 2)

**Note**: Implement AFTER all core features are complete.

**Capabilities**:
1. **Conversational Help**:
   - Students ask questions in natural language
   - AI provides explanations, hints (not answers)
   - Tracks conversation history
   - Escalates to teacher if stuck

2. **Personalized Recommendations**:
   - Suggest assignments based on struggle areas
   - Recommend study materials
   - Adaptive difficulty

3. **Teacher Assistant**:
   - Draft assignment questions
   - Suggest intervention strategies
   - Generate lesson plans

**Implementation**:
- Dedicated AI conversation model
- Store all interactions for analysis
- Implement context awareness (user's progress, class content)
- Add "escalate to teacher" functionality

---

### 13.2 Classroom Automation (Phase 2)

**Features**:
1. **Auto-Assignment Publishing**:
   - Teacher sets up assignment pipeline
   - AI automatically generates and publishes based on schedule
   - Adapts to class performance

2. **Smart Scheduling**:
   - AI suggests optimal assignment timing
   - Avoids overloading students
   - Balances difficulty over time

3. **Intervention Triggers**:
   - Automatically create review assignments for struggling concepts
   - Send notifications to teacher when patterns detected
   - Suggest peer tutoring pairs

---

### 13.3 Parent Portal (Phase 3)

**Features**:
1. **Parent Accounts**:
   - Linked to student accounts
   - View-only access to grades and progress
   - Cannot modify student data

2. **Parent-Teacher Communication**:
   - Messaging between parents and teachers
   - Priority notifications
   - Schedule conferences

3. **Progress Reports**:
   - Weekly email digests
   - Monthly performance summaries
   - Custom report generation

**Data Model**:
```typescript
interface Parent extends User {
  role: 'parent';
  childrenIds: string[];  // Student IDs
}

interface ParentStudentLink {
  id: string;
  parentId: string;
  studentId: string;
  relationship: 'parent' | 'guardian';
  canViewGrades: boolean;
  canMessage: boolean;
  verifiedAt?: Date;
}
```

---

### 13.4 Admin Dashboard Enhancement (Phase 3)

**Features**:
1. **District Management**:
   - Add/remove schools
   - Manage teachers and students
   - View district-wide analytics

2. **Teacher Management**:
   - Approve teacher accounts
   - Assign teachers to schools
   - View teacher performance metrics

3. **Compliance & Reporting**:
   - Generate compliance reports
   - Audit logs
   - Data export for state reporting

4. **Settings & Configuration**:
   - District-wide settings
   - Grading scales customization
   - Academic calendar

---

### 13.5 Third-Party Integrations (Phase 4)

**Google Classroom**:
- Import classes and rosters
- Sync assignments
- Export grades back to GC

**Canvas/Blackboard/Moodle**:
- LTI (Learning Tools Interoperability) integration
- SSO (Single Sign-On)
- Grade passback

**SIS (Student Information Systems)**:
- OneRoster API integration
- Automatic roster updates
- Sync student demographics

**Calendar Integration**:
- Google Calendar
- Outlook Calendar
- Sync assignment due dates

---

### 13.6 Mobile App (Phase 5)

**Platform**: React Native (code reuse with web)

**Features**:
- Push notifications
- Offline mode (download assignments, work offline)
- Camera integration (scan homework, take notes)
- Simplified UI for mobile

---

### 13.7 Advanced Analytics (Phase 5)

**Predictive Analytics**:
- Predict student performance
- Early warning system for at-risk students
- Recommend interventions

**Learning Analytics**:
- Time-on-task analysis
- Engagement metrics
- Learning style detection

**Data Visualization**:
- Interactive dashboards
- Custom reports
- Data export (CSV, PDF)

---

## Appendix A: Sample API Responses

### Sample: Get Student Dashboard
```json
GET /api/students/me/dashboard

Response:
{
  "student": {
    "id": "student-123",
    "name": "John Doe",
    "gradeLevel": 10
  },
  "stats": {
    "currentGPA": 3.7,
    "gpaTrend": { "value": 0.2, "isPositive": true },
    "activeChallenges": 3,
    "assignmentsDueThisWeek": 5,
    "conceptsMastered": 28,
    "conceptsInProgress": 5
  },
  "classes": [
    {
      "classId": "class-1",
      "name": "Geometry - Period 3",
      "teacher": "Mrs. Johnson",
      "currentGrade": 87,
      "color": "blue",
      "activeAssignments": 2,
      "upcomingDeadline": {
        "assignmentTitle": "Triangle Properties",
        "dueDate": "2025-11-01T23:59:59Z"
      }
    }
  ],
  "upcomingAssignments": [
    {
      "assignmentId": "assign-1",
      "title": "Triangle Properties Quiz",
      "className": "Geometry",
      "dueDate": "2025-11-01T23:59:59Z",
      "dueDateLabel": "Due tonight",
      "progress": 60,
      "status": "in_progress"
    }
  ],
  "recentGrades": [
    {
      "assignmentId": "assign-2",
      "title": "Pythagorean Theorem",
      "className": "Geometry",
      "grade": 92,
      "submittedAt": "2025-10-30T14:30:00Z"
    }
  ]
}
```

---

### Sample: Get Teacher Analytics
```json
GET /api/classes/class-1/analytics

Response:
{
  "class": {
    "id": "class-1",
    "name": "Geometry - Period 3",
    "studentCount": 28
  },
  "performance": {
    "classAverage": 87,
    "trend": { "direction": "up", "changePercent": 3 }
  },
  "assignmentCompletion": {
    "week1": 85,
    "week2": 88,
    "week3": 82,
    "week4": 90
  },
  "conceptMastery": [
    {
      "conceptId": "concept-1",
      "name": "Triangle Properties",
      "masteryLevel": 85,
      "studentsStruggling": 3,
      "strugglingStudentIds": ["student-1", "student-2", "student-3"]
    },
    {
      "conceptId": "concept-2",
      "name": "Quadratic Functions",
      "masteryLevel": 72,
      "studentsStruggling": 5,
      "strugglingStudentIds": ["student-4", "student-5", ...]
    }
  ],
  "strugglingStudents": [
    {
      "studentId": "student-1",
      "name": "Alex Rodriguez",
      "avgGrade": 68,
      "strugglingConcepts": ["Quadratic Functions", "Polynomials"],
      "lastAssignmentGrade": 65,
      "trend": "declining"
    }
  ],
  "topPerformers": [
    {
      "studentId": "student-10",
      "name": "David Kim",
      "avgGrade": 98,
      "improvement": 5,
      "consistentlyHigh": true
    }
  ]
}
```

---

## Appendix B: Error Handling Standards

### Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ],
    "timestamp": "2025-11-01T10:30:00Z",
    "requestId": "req-123456"
  }
}
```

### Error Codes
```
400 BAD_REQUEST: Invalid input
401 UNAUTHORIZED: Not authenticated
403 FORBIDDEN: Insufficient permissions / Cross-district access
404 NOT_FOUND: Resource not found
409 CONFLICT: Resource already exists
422 UNPROCESSABLE_ENTITY: Validation failed
429 TOO_MANY_REQUESTS: Rate limit exceeded
500 INTERNAL_SERVER_ERROR: Server error
503 SERVICE_UNAVAILABLE: Temporary unavailability
```

---

## Appendix C: Testing Requirements

### Unit Tests
- Test all business logic functions
- Test data validation
- Test permission checks
- Mock external services (AI API, email)

### Integration Tests
- Test API endpoints
- Test database operations
- Test WebSocket events
- Test file upload and processing

### End-to-End Tests
- Test complete workflows:
  - User signup → email verification → login
  - Class creation → student enrollment → assignment flow
  - Assignment creation → student completion → grading

### Performance Tests
- Load testing (1000 concurrent users)
- Database query performance
- WebSocket connection limits
- File processing speed

### Security Tests
- SQL injection prevention
- XSS prevention
- CSRF protection
- Authentication bypass attempts
- Authorization checks

---

## Conclusion

This specification provides a comprehensive blueprint for building the Socratit.ai backend. Every feature shown in the frontend wireframes must be implemented as described in this document.

### Development Priority:
1. ✅ Authentication & user management
2. ✅ Class management & enrollment
3. ✅ Assignment creation & AI generation
4. ✅ Assignment attempts & auto-grading
5. ✅ Grading & analytics
6. ✅ Real-time messaging
7. ✅ Notifications
8. ✅ Progress tracking
9. ⏳ AI Teaching Assistant (future)
10. ⏳ Classroom automation (future)
11. ⏳ Parent portal (future)
12. ⏳ Admin enhancements (future)
13. ⏳ Third-party integrations (future)

### Key Principles:
- **Security First**: Data isolation is critical
- **Real-time**: Use WebSockets for live updates
- **AI-Powered**: Leverage AI for generation and grading
- **Scalable**: Design for growth from day one
- **User Experience**: Fast, responsive, intuitive

### Questions?
If anything is unclear or you need more detail on any section, refer back to the frontend code in the wireframes for visual context.

**Good luck building the backend! 🚀**
