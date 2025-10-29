# Year-Long Curriculum Mapping & Scheduling System
## Implementation Plan for SocratIt.ai

**Version:** 1.0
**Created:** January 2025
**Status:** In Development

---

## 🎯 Executive Summary

This document outlines the complete implementation plan for adding professional year-long curriculum mapping and scheduling capabilities to the SocratIt.ai platform. This feature transforms curriculum management from simple file analysis into an intelligent, visual, year-long planning system.

### Core Value Proposition
Teachers upload curriculum materials during class creation, and the AI:
1. Analyzes content and extracts units/topics
2. Estimates time requirements based on content difficulty
3. Generates a beautiful year-long schedule
4. Allows intuitive drag-and-drop adjustments
5. Provides AI-assisted schedule refinement
6. Tracks student progress per curriculum unit
7. Auto-suggests assignment dates aligned with curriculum

### Design Philosophy
- **Apple-style UI:** Clean, modern, professional aesthetic matching existing platform
- **Teacher Agency:** AI suggests, teacher decides with flexible controls
- **Visual Excellence:** Multiple view modes (weekly, monthly, unit cards) for different planning needs
- **Student Transparency:** Full year visibility with motivating progress indicators
- **Intelligent Assistance:** AI partner throughout the planning process

---

## 📋 Feature Requirements

### 1. Class Creation Enhancement

#### Current State
- Teachers create class with basic metadata (name, subject, grade level)
- Curriculum upload is separate, optional, and not integrated into planning

#### New State
Teachers experience a guided curriculum mapping wizard:

**Step 1: Basic Class Info**
- Class name, subject, grade level, academic year

**Step 2: School Year Configuration**
- Start date (e.g., August 28, 2024)
- End date (e.g., June 12, 2025)
- Meeting frequency (Daily, MWF, TTh, etc.)
- Visual preview: "36 weeks, 180 instructional days"

**Step 3: Curriculum Upload**
- Upload curriculum files (PDF, DOCX, images)
- Add title and description
- AI processes immediately with loading states
- Display extracted: Units, topics, learning objectives

**Step 4: AI Schedule Generation**
- AI analyzes content difficulty and suggests pacing
- Displays proposed schedule in beautiful timeline
- Shows: Unit names, date ranges, topic count, difficulty indicators

**Step 5: Teacher Adjustment**
- Three view modes: Weekly Timeline / Monthly Calendar / Unit Cards
- Drag-and-drop to adjust dates
- AI chat assistant for refinements
- Edit unit details (name, topics, notes)
- Add custom units not in original curriculum
- Mark units as "Core" vs "Optional"

**Step 6: Review & Finalize**
- Summary view of entire year
- Statistics: Total units, average weeks per unit, difficulty distribution
- Confirm and create class

### 2. AI-Enhanced Curriculum Analysis

#### Current AI Capabilities
```typescript
interface CurrentAIAnalysis {
  summary: string;              // 3-5 sentence overview
  outline: {                    // Basic hierarchy
    topics: { name: string; subtopics: string[] }[]
  };
  suggestedTopics: string[];    // Array of concepts
  learningObjectives: string[]; // Learning outcomes
}
```

#### Enhanced AI Capabilities
```typescript
interface EnhancedAIAnalysis {
  // Existing fields
  summary: string;
  learningObjectives: string[];

  // NEW: Structured units with scheduling metadata
  units: Array<{
    title: string;                    // "Unit 1: Introduction to Algebra"
    description: string;               // 2-3 sentence overview
    topics: Array<{
      name: string;                    // "Linear Equations"
      subtopics: string[];             // ["One-step equations", "Two-step equations"]
      concepts: string[];              // ["variables", "solving for x", "inverse operations"]
      learningObjectives: string[];    // Specific to this topic
    }>;

    // Time estimation
    estimatedWeeks: number;            // AI-estimated: 2-4 weeks
    estimatedHours: number;            // Total instructional time
    confidenceScore: number;           // 0-1, how confident AI is

    // Difficulty analysis
    difficultyLevel: 1 | 2 | 3 | 4 | 5; // 1=Intro, 5=Advanced
    difficultyReasoning: string;       // Why this difficulty?

    // Sequencing
    prerequisiteTopics: string[];      // Topics needed before this unit
    buildUponTopics: string[];         // Topics this leads into
    orderInSequence: number;           // Suggested order (1, 2, 3...)

    // Assessment recommendations
    suggestedAssessments: Array<{
      type: "quiz" | "test" | "project" | "homework";
      timing: "beginning" | "middle" | "end";
      estimatedQuestions: number;
    }>;

    // Standards alignment (future)
    standardsCovered?: string[];       // Common Core, state standards
  }>;

  // Overall curriculum metadata
  metadata: {
    totalUnits: number;
    estimatedTotalWeeks: number;
    difficultyProgression: "linear" | "stepped" | "spiral";
    recommendedPacing: "standard" | "accelerated" | "extended";
    gradeLevel: string;                // Detected from content
    subject: string;                   // Detected from content
  };
}
```

#### AI Prompt Engineering

**New Prompt Template:** `analyzeCurriculumForScheduling`

```
You are an expert curriculum designer analyzing educational content to create a year-long teaching schedule.

CONTEXT:
- Grade Level: {gradeLevel}
- Subject: {subject}
- School Year: {startDate} to {endDate} ({totalWeeks} weeks)
- Curriculum Content: {extractedText}

TASK:
Analyze this curriculum and break it into logical teaching units with precise scheduling recommendations.

REQUIREMENTS:
1. **Unit Structure**: Identify 6-12 major units that follow a logical progression
2. **Time Estimation**: Estimate weeks needed for each unit based on:
   - Content depth and complexity
   - Number of subtopics
   - Skill-building requirements
   - Typical grade-level pacing
3. **Difficulty Analysis**: Rate each unit 1-5 considering:
   - Prerequisite knowledge required
   - Concept abstraction level
   - Skill complexity
   - Common student struggles (if known)
4. **Sequencing**: Identify prerequisites and optimal teaching order
5. **Assessment Points**: Suggest where to assess understanding

OUTPUT FORMAT:
Return a JSON object matching the EnhancedAIAnalysis interface above.

PACING GUIDELINES:
- Introductory units: 1-2 weeks
- Core concept units: 2-4 weeks
- Complex/cumulative units: 3-6 weeks
- Review/assessment: 1 week
- Total should roughly match {totalWeeks} weeks

EXAMPLE OUTPUT:
{
  "units": [
    {
      "title": "Unit 1: Foundations of Algebra",
      "description": "Introduction to variables, expressions, and the order of operations",
      "estimatedWeeks": 2,
      "difficultyLevel": 1,
      "orderInSequence": 1,
      "topics": [...]
    }
  ],
  "metadata": {
    "totalUnits": 8,
    "estimatedTotalWeeks": 32,
    "difficultyProgression": "stepped"
  }
}
```

### 3. Database Schema Design

#### New Models

##### CurriculumSchedule
Represents a class-specific curriculum plan for the entire school year.

```prisma
model CurriculumSchedule {
  id                String   @id @default(cuid())

  // Relationships
  classId           String
  class             Class    @relation(fields: [classId], references: [id])
  curriculumMaterialId String?
  curriculumMaterial CurriculumMaterial? @relation(fields: [curriculumMaterialId], references: [id])
  teacherId         String
  teacher           User     @relation(fields: [teacherId], references: [id])
  schoolId          String
  school            School   @relation(fields: [schoolId], references: [id])

  // School year configuration
  schoolYearStart   DateTime
  schoolYearEnd     DateTime
  totalWeeks        Int
  totalDays         Int      // Instructional days
  meetingPattern    String?  // "Daily", "MWF", "TTh", etc.

  // Schedule metadata
  title             String   // "2024-2025 Algebra 1 Curriculum"
  description       String?
  status            ScheduleStatus @default(DRAFT) // DRAFT, PUBLISHED, ARCHIVED

  // AI generation data
  aiGenerated       Boolean  @default(false)
  aiPromptUsed      String?  @db.Text
  aiConfidence      Float?   // 0-1 confidence score
  lastAiRefinement  DateTime?

  // Progress tracking
  currentUnitId     String?
  currentUnit       CurriculumUnit? @relation("CurrentUnit", fields: [currentUnitId], references: [id])
  completedUnits    Int      @default(0)
  totalUnits        Int
  percentComplete   Float    @default(0) // 0-100

  // Relationships
  units             CurriculumUnit[]

  // Timestamps
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  publishedAt       DateTime?
  deletedAt         DateTime?

  @@index([classId])
  @@index([teacherId])
  @@index([schoolId])
  @@index([status])
}

enum ScheduleStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}
```

##### CurriculumUnit
Individual teaching units within a curriculum schedule.

```prisma
model CurriculumUnit {
  id                String   @id @default(cuid())

  // Relationships
  scheduleId        String
  schedule          CurriculumSchedule @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
  schoolId          String
  school            School   @relation(fields: [schoolId], references: [id])

  // Unit identification
  title             String   // "Unit 1: Introduction to Algebra"
  description       String?  @db.Text
  unitNumber        Int      // 1, 2, 3... for ordering
  orderIndex        Int      // For custom reordering

  // Content structure
  topics            Json     // Array of topics with subtopics
  // Structure: [{ name, subtopics: [], concepts: [], learningObjectives: [] }]
  learningObjectives String[]
  concepts          String[] // Key concepts covered

  // Scheduling
  startDate         DateTime
  endDate           DateTime
  estimatedWeeks    Float    // Can be fractional: 2.5 weeks
  estimatedHours    Float?   // Total instructional hours
  actualStartDate   DateTime? // When actually started teaching
  actualEndDate     DateTime? // When actually completed

  // Difficulty & pacing
  difficultyLevel   Int      // 1-5 scale
  difficultyReasoning String? @db.Text
  pacingNotes       String?  @db.Text

  // Unit type & importance
  unitType          UnitType @default(CORE)
  isOptional        Boolean  @default(false)

  // Prerequisites & sequencing
  prerequisiteUnits String[] // Array of unit IDs that must come first
  buildUponTopics   String[] // Topics this unit builds upon

  // Assessment recommendations
  suggestedAssessments Json? // Array of assessment recommendations

  // AI metadata
  aiGenerated       Boolean  @default(false)
  aiConfidence      Float?   // 0-1
  teacherModified   Boolean  @default(false)

  // Status & progress
  status            UnitStatus @default(SCHEDULED)
  percentComplete   Float    @default(0) // 0-100

  // Relationships
  assignments       Assignment[] @relation("UnitAssignments")
  studentProgress   UnitProgress[]
  currentSchedule   CurriculumSchedule[] @relation("CurrentUnit")

  // Timestamps
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  deletedAt         DateTime?

  @@unique([scheduleId, unitNumber])
  @@index([scheduleId])
  @@index([schoolId])
  @@index([status])
  @@index([startDate])
  @@index([orderIndex])
}

enum UnitType {
  CORE
  ENRICHMENT
  REVIEW
  ASSESSMENT
  PROJECT
  OPTIONAL
}

enum UnitStatus {
  SCHEDULED     // Not started yet
  IN_PROGRESS   // Currently teaching
  COMPLETED     // Finished teaching
  SKIPPED       // Intentionally skipped
  POSTPONED     // Moved to later date
}
```

##### UnitProgress
Tracks individual student progress through curriculum units.

```prisma
model UnitProgress {
  id                String   @id @default(cuid())

  // Relationships
  unitId            String
  unit              CurriculumUnit @relation(fields: [unitId], references: [id], onDelete: Cascade)
  studentId         String
  student           User     @relation(fields: [studentId], references: [id], onDelete: Cascade)
  classId           String
  class             Class    @relation(fields: [classId], references: [id])
  schoolId          String
  school            School   @relation(fields: [schoolId], references: [id])

  // Progress metrics
  status            UnitProgressStatus @default(NOT_STARTED)
  percentComplete   Float    @default(0) // 0-100

  // Assignment-based progress
  assignmentsTotal      Int      @default(0)
  assignmentsCompleted  Int      @default(0)
  assignmentsScore      Float?   // Average score on unit assignments

  // Concept mastery (links to existing ConceptMastery)
  conceptsMastered      Int      @default(0)
  conceptsTotal         Int      @default(0)
  masteryPercentage     Float    @default(0)

  // Time tracking
  timeSpentMinutes      Int      @default(0)
  firstAccessedAt       DateTime?
  lastAccessedAt        DateTime?
  completedAt           DateTime?

  // Performance indicators
  strengths             String[] // Concepts student excels at
  struggles             String[] // Concepts student struggles with
  recommendedReview     String[] // Topics needing review

  // Engagement metrics
  engagementScore       Float?   // 0-100
  participationCount    Int      @default(0)

  // Timestamps
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([unitId, studentId])
  @@index([studentId])
  @@index([classId])
  @@index([schoolId])
  @@index([status])
}

enum UnitProgressStatus {
  NOT_STARTED
  IN_PROGRESS
  REVIEW_NEEDED
  COMPLETED
  MASTERED
}
```

##### CurriculumMilestone
AI-suggested checkpoints for assessment and review.

```prisma
model CurriculumMilestone {
  id                String   @id @default(cuid())

  // Relationships
  scheduleId        String
  schedule          CurriculumSchedule @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
  unitId            String?
  unit              CurriculumUnit? @relation(fields: [unitId], references: [id])
  schoolId          String
  school            School   @relation(fields: [schoolId], references: [id])

  // Milestone details
  title             String   // "Mid-Unit Check-in", "Quarter 1 Assessment"
  description       String?  @db.Text
  milestoneType     MilestoneType
  suggestedDate     DateTime
  actualDate        DateTime?

  // Assessment recommendations
  recommendedAssessmentType String? // "quiz", "test", "project"
  topicsCovered     String[] // Which topics should be assessed

  // Status
  status            MilestoneStatus @default(PLANNED)
  completed         Boolean  @default(false)

  // AI metadata
  aiGenerated       Boolean  @default(false)
  teacherModified   Boolean  @default(false)

  // Timestamps
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([scheduleId])
  @@index([schoolId])
  @@index([suggestedDate])
}

enum MilestoneType {
  UNIT_START
  UNIT_MIDPOINT
  UNIT_END
  QUARTER_REVIEW
  SEMESTER_EXAM
  YEAR_END_REVIEW
  CUSTOM
}

enum MilestoneStatus {
  PLANNED
  UPCOMING
  IN_PROGRESS
  COMPLETED
  SKIPPED
}
```

#### Schema Relationships Update

**Existing models that need new relationships:**

```prisma
// Add to Class model
model Class {
  // ... existing fields ...
  curriculumSchedule CurriculumSchedule[]
  unitProgress       UnitProgress[]
}

// Add to Assignment model
model Assignment {
  // ... existing fields ...
  curriculumUnitId   String?
  curriculumUnit     CurriculumUnit? @relation("UnitAssignments", fields: [curriculumUnitId], references: [id])
}

// Add to User model (students)
model User {
  // ... existing fields ...
  unitProgress       UnitProgress[]
}

// Add to CurriculumMaterial model
model CurriculumMaterial {
  // ... existing fields ...
  schedules          CurriculumSchedule[]
}
```

### 4. Backend API Endpoints

#### 4.1 Curriculum Schedule Management

##### POST `/api/v1/curriculum-schedules`
Create a new curriculum schedule for a class.

**Request Body:**
```typescript
{
  classId: string;
  schoolYearStart: string; // ISO date
  schoolYearEnd: string;   // ISO date
  meetingPattern?: string;
  title: string;
  description?: string;
  curriculumMaterialId?: string; // Optional: link to uploaded curriculum
}
```

**Response:**
```typescript
{
  success: true;
  data: {
    id: string;
    classId: string;
    schoolYearStart: string;
    schoolYearEnd: string;
    totalWeeks: number;
    totalDays: number;
    status: "DRAFT";
    units: [];
    createdAt: string;
  };
}
```

##### POST `/api/v1/curriculum-schedules/:id/generate-from-ai`
Generate AI-powered unit schedule from uploaded curriculum.

**Request Body:**
```typescript
{
  curriculumMaterialId: string;
  preferences?: {
    targetUnits?: number;        // Preferred number of units (6-12)
    pacingPreference?: "standard" | "accelerated" | "extended";
    includeReviewUnits?: boolean;
    breakDates?: string[];       // Dates to avoid scheduling
  };
}
```

**Response:**
```typescript
{
  success: true;
  data: {
    scheduleId: string;
    units: Array<{
      title: string;
      description: string;
      startDate: string;
      endDate: string;
      estimatedWeeks: number;
      difficultyLevel: number;
      topics: Array<{ name: string; subtopics: string[] }>;
      aiConfidence: number;
    }>;
    metadata: {
      totalUnits: number;
      estimatedTotalWeeks: number;
      difficultyProgression: string;
    };
  };
}
```

##### GET `/api/v1/curriculum-schedules/:id`
Get curriculum schedule with all units.

**Query Parameters:**
- `includeProgress=true` - Include student progress data
- `includeAssignments=true` - Include assignments per unit

**Response:**
```typescript
{
  success: true;
  data: {
    id: string;
    class: { id, name, subject };
    schoolYearStart: string;
    schoolYearEnd: string;
    totalWeeks: number;
    status: string;
    currentUnit: { id, title, unitNumber };
    completedUnits: number;
    totalUnits: number;
    percentComplete: number;
    units: Array<{
      id: string;
      title: string;
      unitNumber: number;
      startDate: string;
      endDate: string;
      status: string;
      difficultyLevel: number;
      topics: object;
      assignments?: Assignment[];
      progress?: {
        studentsStarted: number;
        studentsCompleted: number;
        averageProgress: number;
      };
    }>;
  };
}
```

##### PATCH `/api/v1/curriculum-schedules/:id`
Update schedule metadata.

**Request Body:**
```typescript
{
  title?: string;
  description?: string;
  schoolYearStart?: string;
  schoolYearEnd?: string;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}
```

##### POST `/api/v1/curriculum-schedules/:id/publish`
Publish schedule to make visible to students.

**Response:**
```typescript
{
  success: true;
  data: {
    id: string;
    status: "PUBLISHED";
    publishedAt: string;
  };
  message: "Curriculum schedule published successfully. Students can now view the year-long plan.";
}
```

##### DELETE `/api/v1/curriculum-schedules/:id`
Soft delete curriculum schedule.

#### 4.2 Curriculum Unit Management

##### POST `/api/v1/curriculum-units`
Create a custom unit manually.

**Request Body:**
```typescript
{
  scheduleId: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  topics: Array<{
    name: string;
    subtopics: string[];
    concepts: string[];
  }>;
  difficultyLevel: 1 | 2 | 3 | 4 | 5;
  unitType: "CORE" | "ENRICHMENT" | "REVIEW" | "ASSESSMENT" | "PROJECT" | "OPTIONAL";
  isOptional?: boolean;
}
```

##### GET `/api/v1/curriculum-units/:id`
Get detailed unit information.

**Query Parameters:**
- `includeProgress=true` - Include all student progress for this unit
- `includeAssignments=true` - Include assignments

##### PATCH `/api/v1/curriculum-units/:id`
Update unit details.

**Request Body:**
```typescript
{
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  topics?: object;
  difficultyLevel?: number;
  unitType?: string;
  status?: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED" | "POSTPONED";
  teacherModified?: boolean;
}
```

##### POST `/api/v1/curriculum-units/:id/reorder`
Change unit order in sequence.

**Request Body:**
```typescript
{
  newOrderIndex: number;
}
```

##### POST `/api/v1/curriculum-units/bulk-reorder`
Reorder multiple units at once (for drag-and-drop).

**Request Body:**
```typescript
{
  scheduleId: string;
  unitOrders: Array<{
    unitId: string;
    orderIndex: number;
    startDate?: string; // Optional: update dates during reorder
    endDate?: string;
  }>;
}
```

##### DELETE `/api/v1/curriculum-units/:id`
Soft delete a unit.

#### 4.3 Unit Progress Tracking

##### GET `/api/v1/curriculum-units/:unitId/progress`
Get progress for all students in a unit (teacher view).

**Response:**
```typescript
{
  success: true;
  data: {
    unit: { id, title, unitNumber };
    statistics: {
      totalStudents: number;
      studentsStarted: number;
      studentsCompleted: number;
      averageProgress: number;
      averageScore: number;
    };
    studentProgress: Array<{
      studentId: string;
      studentName: string;
      status: string;
      percentComplete: number;
      assignmentsCompleted: number;
      assignmentsTotal: number;
      assignmentsScore: number;
      timeSpentMinutes: number;
      strengths: string[];
      struggles: string[];
    }>;
  };
}
```

##### GET `/api/v1/students/:studentId/unit-progress`
Get a student's progress across all units in a class (student view).

**Query Parameters:**
- `classId=required` - Class ID

**Response:**
```typescript
{
  success: true;
  data: {
    class: { id, name };
    overallProgress: {
      unitsTotal: number;
      unitsCompleted: number;
      percentComplete: number;
      currentUnit: { id, title, unitNumber };
    };
    units: Array<{
      id: string;
      title: string;
      unitNumber: number;
      startDate: string;
      endDate: string;
      status: string;
      progress: {
        percentComplete: number;
        assignmentsCompleted: number;
        assignmentsTotal: number;
        averageScore: number;
        masteryPercentage: number;
      };
    }>;
  };
}
```

##### POST `/api/v1/unit-progress/calculate`
Recalculate progress for a student in a unit (triggered by assignment submission).

**Request Body:**
```typescript
{
  unitId: string;
  studentId: string;
}
```

#### 4.4 AI-Assisted Schedule Refinement

##### POST `/api/v1/curriculum-schedules/:id/ai-refine`
Chat with AI to refine schedule.

**Request Body:**
```typescript
{
  message: string; // e.g., "Make Unit 3 longer because it's more complex"
  conversationHistory?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}
```

**Response:**
```typescript
{
  success: true;
  data: {
    response: string; // AI's natural language response
    suggestedChanges: Array<{
      unitId: string;
      field: string; // "startDate", "endDate", "estimatedWeeks", etc.
      currentValue: any;
      suggestedValue: any;
      reasoning: string;
    }>;
    previewSchedule?: {
      // Updated schedule preview if changes applied
      units: Array<{ id, title, startDate, endDate }>;
    };
  };
}
```

##### POST `/api/v1/curriculum-schedules/:id/ai-suggestions`
Get AI suggestions for improving current schedule.

**Response:**
```typescript
{
  success: true;
  data: {
    suggestions: Array<{
      type: "PACING" | "DIFFICULTY" | "SEQUENCING" | "ASSESSMENT" | "REVIEW";
      title: string;
      description: string;
      affectedUnits: string[];
      suggestedAction: string;
      priority: "HIGH" | "MEDIUM" | "LOW";
    }>;
  };
}
```

#### 4.5 Assignment-Unit Integration

##### POST `/api/v1/assignments` (Enhanced)
Enhanced assignment creation with unit linkage.

**New fields in request:**
```typescript
{
  // ... existing fields ...
  curriculumUnitId?: string; // Link to curriculum unit
  autoSchedule?: boolean;    // Auto-suggest due date based on unit
}
```

**Enhanced response:**
```typescript
{
  success: true;
  data: {
    // ... existing assignment fields ...
    curriculumUnit?: {
      id: string;
      title: string;
      startDate: string;
      endDate: string;
    };
    suggestedDueDate?: string; // If autoSchedule=true
  };
}
```

##### GET `/api/v1/curriculum-units/:unitId/suggested-assignments`
Get AI suggestions for assignments to create for a unit.

**Response:**
```typescript
{
  success: true;
  data: {
    suggestions: Array<{
      type: "QUIZ" | "HOMEWORK" | "TEST" | "PROJECT";
      title: string;
      description: string;
      suggestedTiming: "beginning" | "middle" | "end";
      suggestedDate: string;
      topicsCovered: string[];
      estimatedQuestions: number;
    }>;
  };
}
```

### 5. Frontend Component Architecture

#### 5.1 Class Creation Wizard Enhancement

**Component Structure:**
```
<CreateClassWizard>
  <WizardStep1_BasicInfo />
  <WizardStep2_SchoolYear />         ← NEW
  <WizardStep3_CurriculumUpload />   ← NEW
  <WizardStep4_AIScheduleGeneration /> ← NEW
  <WizardStep5_ScheduleAdjustment />  ← NEW
  <WizardStep6_ReviewFinalize />      ← NEW
</CreateClassWizard>
```

**File:** `socratit-wireframes/src/pages/teacher/CreateClass.tsx` (major enhancement)

##### WizardStep2_SchoolYear

**Purpose:** Configure school year parameters

**UI Elements:**
- Date range picker (start/end dates)
- Visual calendar preview with instructional days highlighted
- Meeting pattern selector (Daily, MWF, TTh, Custom)
- Statistics display:
  - Total weeks: 36
  - Instructional days: 180
  - Suggested pacing: "6-12 units recommended"

**State:**
```typescript
const [schoolYear, setSchoolYear] = useState({
  startDate: Date | null,
  endDate: Date | null,
  meetingPattern: "Daily" | "MWF" | "TTh" | "Custom",
  customDays?: boolean[], // [Mon, Tue, Wed, Thu, Fri]
});
```

##### WizardStep3_CurriculumUpload

**Purpose:** Upload and process curriculum files

**UI Elements:**
- Drag-and-drop file upload zone
- File preview cards (name, size, type)
- Title and description inputs
- "Analyze with AI" button
- Processing status with animated loader
- Results preview:
  - Extracted units count
  - Key topics identified
  - AI confidence score

**State:**
```typescript
const [curriculum, setCurriculum] = useState({
  files: File[],
  title: string,
  description: string,
  processingStatus: "idle" | "uploading" | "processing" | "completed" | "error",
  analysisResults: EnhancedAIAnalysis | null,
});
```

##### WizardStep4_AIScheduleGeneration

**Purpose:** AI generates initial schedule, teacher reviews

**UI Elements:**
- Loading animation: "AI is analyzing your curriculum..."
- Progress indicator: "Extracting units... Estimating pacing... Creating schedule..."
- Generated schedule preview (simplified timeline)
- Unit cards with:
  - Unit title
  - Date range
  - Estimated weeks
  - Difficulty indicator (colored dots 1-5)
  - Topic count
- Statistics panel:
  - Total units: 8
  - Total weeks: 32
  - Average weeks/unit: 4
  - Difficulty distribution chart
- Regeneration options:
  - "More units" / "Fewer units"
  - "Faster pace" / "Slower pace"
  - "Regenerate" button

**State:**
```typescript
const [aiSchedule, setAiSchedule] = useState({
  status: "generating" | "completed" | "error",
  schedule: {
    units: CurriculumUnit[],
    metadata: { totalUnits, estimatedTotalWeeks, difficultyProgression },
  },
  regenerationCount: number,
});
```

##### WizardStep5_ScheduleAdjustment

**Purpose:** Interactive drag-and-drop adjustment interface

**Component:** `<CurriculumScheduleEditor />` (new reusable component)

**Three View Modes:**

1. **Weekly Timeline View** (default)
   - Horizontal gantt-style chart
   - Weeks as columns (Week 1, Week 2, ...)
   - Units as colored bars spanning multiple weeks
   - Drag to adjust start/end dates
   - Visual difficulty indicators (color intensity)

2. **Monthly Calendar View**
   - Traditional calendar layout
   - Units overlay on date ranges
   - Color-coded by difficulty
   - Click to edit unit details

3. **Unit Cards View**
   - Vertical list of unit cards
   - Drag to reorder sequence
   - Expand cards to edit details
   - Add new custom units

**UI Elements (common across views):**
- View mode toggle (buttons: Timeline / Calendar / Cards)
- AI chat assistant sidebar:
  - Chat input: "Make Unit 3 longer"
  - Conversation history
  - Apply suggestions buttons
- Unit editor modal:
  - Edit title, description
  - Adjust dates (date pickers)
  - Edit topics/subtopics
  - Set difficulty level
  - Mark as core/optional
- Toolbar:
  - "Add Custom Unit" button
  - "AI Suggestions" button
  - "Reset to AI Schedule" button
  - Zoom controls (for timeline view)

**State:**
```typescript
const [scheduleEditor, setScheduleEditor] = useState({
  viewMode: "timeline" | "calendar" | "cards",
  units: CurriculumUnit[],
  selectedUnit: string | null,
  aiChatOpen: boolean,
  aiConversation: Array<{ role, content }>,
  hasUnsavedChanges: boolean,
});
```

##### WizardStep6_ReviewFinalize

**Purpose:** Final review before creating class

**UI Elements:**
- Class summary card:
  - Class name, subject, grade
  - School year dates
  - Curriculum title
- Schedule overview:
  - Vertical timeline of all units
  - Dates, titles, weeks
  - Total units, total weeks
- Statistics:
  - Units by type (Core, Review, Assessment, etc.)
  - Difficulty distribution
  - Average weeks per unit
- Action buttons:
  - "Go Back" to make changes
  - "Create Class & Publish Schedule" (primary button)
  - Checkbox: "Make schedule visible to students immediately"

#### 5.2 Curriculum Schedule Display Components

##### CurriculumTimelineView

**File:** `socratit-wireframes/src/components/curriculum/CurriculumTimelineView.tsx`

**Purpose:** Horizontal gantt-style timeline visualization

**Props:**
```typescript
interface CurriculumTimelineViewProps {
  schedule: CurriculumSchedule;
  units: CurriculumUnit[];
  editable?: boolean;
  onUnitClick?: (unit: CurriculumUnit) => void;
  onUnitDrag?: (unitId: string, newDates: { start: Date, end: Date }) => void;
  showProgress?: boolean;
  currentDate?: Date;
}
```

**UI Structure:**
```
<div className="timeline-container">
  <div className="timeline-header">
    <!-- Week labels: Week 1, Week 2, ... -->
  </div>
  <div className="timeline-body">
    {units.map(unit => (
      <DraggableUnitBar
        unit={unit}
        startWeek={calculateWeek(unit.startDate)}
        endWeek={calculateWeek(unit.endDate)}
        difficulty={unit.difficultyLevel}
        progress={unit.percentComplete}
      />
    ))}
  </div>
  <div className="timeline-current-marker" style={{ left: currentWeekPosition }}>
    <!-- "You are here" indicator -->
  </div>
</div>
```

**Visual Design:**
- Week columns: 40px wide each, light gray borders
- Unit bars: Rounded rectangles, height 60px, margin 10px
- Colors by difficulty:
  - Level 1 (Intro): Light green (#E8F5E9)
  - Level 2 (Basic): Green (#C8E6C9)
  - Level 3 (Intermediate): Yellow (#FFF9C4)
  - Level 4 (Advanced): Orange (#FFE0B2)
  - Level 5 (Expert): Red (#FFCDD2)
- Progress indicator: Semi-transparent overlay showing % complete
- Hover effects: Lift shadow, show tooltip with details
- Drag handles: Visible on hover at bar edges

##### CurriculumCalendarView

**File:** `socratit-wireframes/src/components/curriculum/CurriculumCalendarView.tsx`

**Purpose:** Traditional monthly calendar with curriculum overlay

**Library:** `react-big-calendar`

**Props:**
```typescript
interface CurriculumCalendarViewProps {
  schedule: CurriculumSchedule;
  units: CurriculumUnit[];
  editable?: boolean;
  onDateClick?: (date: Date) => void;
  onEventClick?: (unit: CurriculumUnit) => void;
  onEventDrop?: (unitId: string, newDates: { start: Date, end: Date }) => void;
  showAssignments?: boolean;
  assignments?: Assignment[];
}
```

**Features:**
- Month view (default), week view, day view
- Units displayed as multi-day events
- Color-coded by difficulty
- Assignment markers (dots on due dates)
- Current date indicator
- Drag to reschedule units
- Click unit to view/edit details

##### CurriculumUnitCardsList

**File:** `socratit-wireframes/src/components/curriculum/CurriculumUnitCardsList.tsx`

**Purpose:** Vertical list of expandable unit cards

**Props:**
```typescript
interface CurriculumUnitCardsListProps {
  units: CurriculumUnit[];
  editable?: boolean;
  onReorder?: (sourceIndex: number, destIndex: number) => void;
  onUnitEdit?: (unitId: string, changes: Partial<CurriculumUnit>) => void;
  onUnitDelete?: (unitId: string) => void;
  showProgress?: boolean;
  currentUnitId?: string;
}
```

**UI Structure:**
```
<DndContext onDragEnd={handleReorder}>
  <SortableContext items={units}>
    {units.map(unit => (
      <SortableUnitCard
        key={unit.id}
        unit={unit}
        isExpanded={expandedUnits.includes(unit.id)}
        onToggle={() => toggleExpand(unit.id)}
      >
        <!-- Collapsed view -->
        <div className="unit-card-header">
          <DragHandle />
          <UnitNumber>{unit.unitNumber}</UnitNumber>
          <UnitTitle>{unit.title}</UnitTitle>
          <DateRange>{formatDateRange(unit.startDate, unit.endDate)}</DateRange>
          <DifficultyBadge level={unit.difficultyLevel} />
          <ExpandButton />
        </div>

        <!-- Expanded view -->
        {isExpanded && (
          <div className="unit-card-body">
            <Description>{unit.description}</Description>
            <TopicsList topics={unit.topics} />
            <MetadataGrid>
              <Stat label="Estimated Weeks" value={unit.estimatedWeeks} />
              <Stat label="Difficulty" value={`Level ${unit.difficultyLevel}`} />
              <Stat label="Topics" value={unit.topics.length} />
            </MetadataGrid>
            {showProgress && (
              <ProgressBar value={unit.percentComplete} />
            )}
            <Assignments assignments={unit.assignments} />
            {editable && (
              <ActionButtons>
                <Button onClick={() => onUnitEdit(unit.id)}>Edit</Button>
                <Button variant="danger" onClick={() => onUnitDelete(unit.id)}>Delete</Button>
              </ActionButtons>
            )}
          </div>
        )}
      </SortableUnitCard>
    ))}
  </SortableContext>
</DndContext>
```

**Visual Design:**
- Card: White background, rounded corners, subtle shadow
- Drag handle: 6 dots icon, gray, visible on hover
- Unit number: Circle badge, colored by difficulty
- Title: Bold, 18px
- Date range: Gray text, with calendar icon
- Difficulty badge: Colored pill matching timeline colors
- Progress bar: Green gradient, shows % complete
- Animations: Smooth expand/collapse, drag ghost

##### AIScheduleAssistant

**File:** `socratit-wireframes/src/components/curriculum/AIScheduleAssistant.tsx`

**Purpose:** Chat interface for AI-assisted schedule refinement

**Props:**
```typescript
interface AIScheduleAssistantProps {
  scheduleId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuggestionApply: (changes: ScheduleChange[]) => void;
}
```

**UI Structure:**
```
<SlideOverPanel isOpen={isOpen} onClose={onClose}>
  <PanelHeader>
    <Title>AI Schedule Assistant</Title>
    <CloseButton />
  </PanelHeader>

  <ConversationArea>
    {messages.map(msg => (
      <ChatMessage role={msg.role} key={msg.id}>
        {msg.role === "assistant" && (
          <AIAvatar /> <!-- Friendly AI icon -->
        )}
        <MessageContent>{msg.content}</MessageContent>
        {msg.suggestedChanges && (
          <SuggestionsPanel>
            <SuggestionTitle>Suggested Changes:</SuggestionTitle>
            {msg.suggestedChanges.map(change => (
              <ChangeCard key={change.unitId}>
                <UnitName>{change.unitTitle}</UnitName>
                <ChangeDescription>
                  {change.field}: {change.currentValue} → {change.suggestedValue}
                </ChangeDescription>
                <Reasoning>{change.reasoning}</Reasoning>
                <ApplyButton onClick={() => applyChange(change)}>
                  Apply Change
                </ApplyButton>
              </ChangeCard>
            ))}
            <ApplyAllButton onClick={() => applyAllChanges(msg.suggestedChanges)}>
              Apply All Changes
            </ApplyAllButton>
          </SuggestionsPanel>
        )}
      </ChatMessage>
    ))}
    {isLoading && <TypingIndicator />}
  </ConversationArea>

  <InputArea>
    <TextInput
      placeholder="Ask AI to adjust your schedule... (e.g., 'Make Unit 3 two weeks longer')"
      value={inputValue}
      onChange={setInputValue}
      onKeyPress={handleKeyPress}
    />
    <SendButton onClick={sendMessage} disabled={isLoading}>
      <SendIcon />
    </SendButton>
  </InputArea>

  <QuickActions>
    <QuickActionButton onClick={() => askAI("Suggest ways to improve pacing")}>
      Improve Pacing
    </QuickActionButton>
    <QuickActionButton onClick={() => askAI("Balance difficulty progression")}>
      Balance Difficulty
    </QuickActionButton>
    <QuickActionButton onClick={() => askAI("Add review units")}>
      Add Review Units
    </QuickActionButton>
  </QuickActions>
</SlideOverPanel>
```

**Features:**
- Real-time chat with AI
- Suggested changes preview before applying
- Apply individual changes or all at once
- Quick action buttons for common requests
- Conversation history persists during session
- Undo functionality for applied changes

#### 5.3 Class Dashboard Integration

##### ClassDashboard Enhancement

**File:** `socratit-wireframes/src/pages/teacher/ClassDashboard.tsx` (enhancement)

**New Section:** Curriculum Schedule Panel

**Location:** Top of dashboard, prominently displayed

**UI Structure:**
```
<CurriculumSchedulePanel>
  <PanelHeader>
    <Title>Year-Long Curriculum</Title>
    <ViewToggle>
      <ToggleButton active={view === "timeline"}>Timeline</ToggleButton>
      <ToggleButton active={view === "progress"}>Progress</ToggleButton>
    </ViewToggle>
    <EditButton onClick={openScheduleEditor}>
      <EditIcon /> Edit Schedule
    </EditButton>
  </PanelHeader>

  {view === "timeline" && (
    <CompactTimelineView>
      <CurrentUnitHighlight>
        <Badge>Current Unit</Badge>
        <UnitTitle>{currentUnit.title}</UnitTitle>
        <DateRange>{formatDateRange(currentUnit.startDate, currentUnit.endDate)}</DateRange>
        <ProgressBar value={currentUnit.percentComplete} />
      </CurrentUnitHighlight>

      <MiniTimeline units={allUnits} currentUnitId={currentUnit.id} />

      <UpcomingUnits>
        <Label>Coming Next:</Label>
        {nextThreeUnits.map(unit => (
          <UpcomingUnitChip key={unit.id}>
            {unit.title} • {format(unit.startDate, 'MMM d')}
          </UpcomingUnitChip>
        ))}
      </UpcomingUnits>
    </CompactTimelineView>
  )}

  {view === "progress" && (
    <ProgressOverview>
      <StatCard>
        <StatValue>{completedUnits}/{totalUnits}</StatValue>
        <StatLabel>Units Completed</StatLabel>
      </StatCard>
      <StatCard>
        <StatValue>{Math.round(overallProgress)}%</StatValue>
        <StatLabel>Overall Progress</StatLabel>
        <ProgressRing value={overallProgress} />
      </StatCard>
      <StatCard>
        <StatValue>{calculateWeeksRemaining()}</StatValue>
        <StatLabel>Weeks Remaining</StatLabel>
      </StatCard>
      <StatCard>
        <StatusBadge status={pacingStatus}>
          {pacingStatus === "on-track" ? "On Track" :
           pacingStatus === "ahead" ? "Ahead of Schedule" :
           "Behind Schedule"}
        </StatusBadge>
      </StatCard>

      <UnitProgressChart>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={unitsProgressData}>
            <XAxis dataKey="unitNumber" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="classAverage" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </UnitProgressChart>
    </ProgressOverview>
  )}

  <PanelFooter>
    <ViewFullScheduleButton onClick={openFullSchedule}>
      View Full Schedule <ArrowRightIcon />
    </ViewFullScheduleButton>
  </PanelFooter>
</CurriculumSchedulePanel>
```

##### FullScheduleView (Modal/Page)

**File:** `socratit-wireframes/src/pages/teacher/CurriculumScheduleFull.tsx`

**Purpose:** Full-screen curriculum schedule view with all controls

**Layout:**
```
<PageLayout>
  <PageHeader>
    <Breadcrumb>
      <Link to="/classes">Classes</Link> /
      <Link to={`/classes/${classId}`}>{className}</Link> /
      Curriculum Schedule
    </Breadcrumb>
    <Title>{schedule.title}</Title>
    <ActionButtons>
      <Button onClick={openAIAssistant}>
        <SparklesIcon /> AI Assistant
      </Button>
      <Button onClick={exportSchedule}>
        <DownloadIcon /> Export
      </Button>
      <Button variant="primary" onClick={publishSchedule}>
        <CheckIcon /> Publish Changes
      </Button>
    </ActionButtons>
  </PageHeader>

  <ViewControls>
    <ViewModeSelector>
      <RadioGroup value={viewMode} onChange={setViewMode}>
        <RadioButton value="timeline">Weekly Timeline</RadioButton>
        <RadioButton value="calendar">Monthly Calendar</RadioButton>
        <RadioButton value="cards">Unit Cards</RadioButton>
      </RadioGroup>
    </ViewModeSelector>

    <FilterControls>
      <Select value={filterDifficulty} onChange={setFilterDifficulty}>
        <option value="all">All Difficulties</option>
        <option value="1">Level 1 - Introductory</option>
        <option value="2">Level 2 - Basic</option>
        <option value="3">Level 3 - Intermediate</option>
        <option value="4">Level 4 - Advanced</option>
        <option value="5">Level 5 - Expert</option>
      </Select>

      <Select value={filterType} onChange={setFilterType}>
        <option value="all">All Types</option>
        <option value="CORE">Core Units</option>
        <option value="ENRICHMENT">Enrichment</option>
        <option value="REVIEW">Review</option>
        <option value="ASSESSMENT">Assessment</option>
      </Select>
    </FilterControls>

    <ZoomControls> <!-- For timeline view -->
      <Button onClick={zoomOut}>-</Button>
      <ZoomLevel>{zoomLevel}%</ZoomLevel>
      <Button onClick={zoomIn}>+</Button>
    </ZoomControls>
  </ViewControls>

  <MainContent>
    {viewMode === "timeline" && (
      <CurriculumTimelineView
        schedule={schedule}
        units={filteredUnits}
        editable={true}
        onUnitClick={openUnitEditor}
        onUnitDrag={handleUnitDrag}
        showProgress={true}
      />
    )}

    {viewMode === "calendar" && (
      <CurriculumCalendarView
        schedule={schedule}
        units={filteredUnits}
        editable={true}
        onEventClick={openUnitEditor}
        onEventDrop={handleUnitDrop}
        showAssignments={true}
        assignments={classAssignments}
      />
    )}

    {viewMode === "cards" && (
      <CurriculumUnitCardsList
        units={filteredUnits}
        editable={true}
        onReorder={handleReorder}
        onUnitEdit={openUnitEditor}
        onUnitDelete={handleUnitDelete}
        showProgress={true}
        currentUnitId={currentUnit.id}
      />
    )}
  </MainContent>

  <Sidebar>
    <ScheduleStats>
      <StatItem label="Total Units" value={totalUnits} />
      <StatItem label="Completed" value={completedUnits} />
      <StatItem label="In Progress" value={inProgressUnits} />
      <StatItem label="Scheduled" value={scheduledUnits} />
      <ProgressBar value={(completedUnits / totalUnits) * 100} />
    </ScheduleStats>

    <QuickActions>
      <ActionButton onClick={addCustomUnit}>
        <PlusIcon /> Add Custom Unit
      </ActionButton>
      <ActionButton onClick={showAISuggestions}>
        <LightbulbIcon /> AI Suggestions
      </ActionButton>
      <ActionButton onClick={resetToAI}>
        <RefreshIcon /> Reset to AI Schedule
      </ActionButton>
    </QuickActions>

    <CurrentUnitCard>
      <Badge>Current Unit</Badge>
      <Title>{currentUnit.title}</Title>
      <DateRange>{formatDateRange(currentUnit.startDate, currentUnit.endDate)}</DateRange>
      <ProgressBar value={currentUnit.percentComplete} />
      <ViewButton onClick={() => navigateTo(`/units/${currentUnit.id}`)}>
        View Details
      </ViewButton>
    </CurrentUnitCard>
  </Sidebar>
</PageLayout>

{/* Modals */}
<UnitEditorModal
  isOpen={unitEditorOpen}
  unit={selectedUnit}
  onSave={handleUnitSave}
  onClose={closeUnitEditor}
/>

<AIScheduleAssistant
  scheduleId={schedule.id}
  isOpen={aiAssistantOpen}
  onClose={closeAIAssistant}
  onSuggestionApply={handleSuggestionApply}
/>
```

#### 5.4 Student View Components

##### StudentClassDashboard Enhancement

**File:** `socratit-wireframes/src/pages/student/ClassDashboard.tsx`

**New Section:** Curriculum Progress Panel

**UI Structure:**
```
<CurriculumProgressPanel>
  <PanelHeader>
    <Title>Your Progress</Title>
    <OverallProgress>
      <CircularProgress value={overallProgress} size="lg" />
      <ProgressLabel>{Math.round(overallProgress)}% Complete</ProgressLabel>
    </OverallProgress>
  </PanelHeader>

  <CurrentUnitCard highlighted>
    <Badge color="blue">Current Unit</Badge>
    <UnitTitle>{currentUnit.title}</UnitTitle>
    <UnitDescription>{currentUnit.description}</UnitDescription>
    <ProgressBar value={currentUnit.progress.percentComplete} />
    <MetadataRow>
      <Stat icon={<CheckIcon />} label="Assignments" value={`${currentUnit.progress.assignmentsCompleted}/${currentUnit.progress.assignmentsTotal}`} />
      <Stat icon={<TrophyIcon />} label="Score" value={`${Math.round(currentUnit.progress.averageScore)}%`} />
      <Stat icon={<BrainIcon />} label="Mastery" value={`${Math.round(currentUnit.progress.masteryPercentage)}%`} />
    </MetadataRow>
    <ViewAssignmentsButton onClick={() => scrollToAssignments()}>
      View Unit Assignments <ArrowDownIcon />
    </ViewAssignmentsButton>
  </CurrentUnitCard>

  <SectionTitle>Your Year-Long Journey</SectionTitle>

  <TimelineView>
    {allUnits.map(unit => {
      const progress = unitProgress[unit.id];
      const isPast = new Date() > new Date(unit.endDate);
      const isCurrent = unit.id === currentUnit.id;
      const isFuture = new Date() < new Date(unit.startDate);

      return (
        <TimelineUnit
          key={unit.id}
          unit={unit}
          progress={progress}
          status={
            isCurrent ? "current" :
            isPast ? "completed" :
            "upcoming"
          }
          onClick={() => openUnitDetails(unit)}
        >
          <UnitNumber>{unit.unitNumber}</UnitNumber>
          <UnitContent>
            <UnitTitleSmall>{unit.title}</UnitTitleSmall>
            <UnitDates>{formatDateRange(unit.startDate, unit.endDate)}</UnitDates>
            {!isFuture && (
              <UnitProgress>
                <ProgressBarSmall value={progress.percentComplete} />
                <ProgressText>{Math.round(progress.percentComplete)}%</ProgressText>
              </UnitProgress>
            )}
            {isFuture && (
              <ComingSoonBadge>Coming Soon</ComingSoonBadge>
            )}
            {progress.status === "MASTERED" && (
              <MasteryBadge>
                <StarIcon /> Mastered!
              </MasteryBadge>
            )}
          </UnitContent>
          <Connector /> <!-- Visual line connecting units -->
        </TimelineUnit>
      );
    })}
  </TimelineView>

  <ViewFullScheduleButton onClick={openFullSchedule}>
    View Full Year Schedule <ArrowRightIcon />
  </ViewFullScheduleButton>
</CurriculumProgressPanel>
```

##### StudentFullScheduleView

**File:** `socratit-wireframes/src/pages/student/CurriculumSchedule.tsx`

**Purpose:** Student's view of complete year-long curriculum

**UI Structure:**
```
<PageLayout>
  <PageHeader>
    <Breadcrumb>
      <Link to="/classes">My Classes</Link> /
      <Link to={`/classes/${classId}`}>{className}</Link> /
      Curriculum
    </Breadcrumb>
    <Title>Year-Long Curriculum</Title>
    <Subtitle>{schedule.title}</Subtitle>
  </PageHeader>

  <ProgressSummary>
    <SummaryCard>
      <Icon><CalendarIcon /></Icon>
      <Value>{completedUnits}/{totalUnits}</Value>
      <Label>Units Completed</Label>
    </SummaryCard>
    <SummaryCard>
      <Icon><TrendingUpIcon /></Icon>
      <Value>{Math.round(overallProgress)}%</Value>
      <Label>Overall Progress</Label>
    </SummaryCard>
    <SummaryCard>
      <Icon><AwardIcon /></Icon>
      <Value>{masteredUnits}</Value>
      <Label>Units Mastered</Label>
    </SummaryCard>
    <SummaryCard>
      <Icon><ClockIcon /></Icon>
      <Value>{weeksRemaining}</Value>
      <Label>Weeks Remaining</Label>
    </SummaryCard>
  </ProgressSummary>

  <ViewToggle>
    <ToggleButton active={view === "timeline"} onClick={() => setView("timeline")}>
      Timeline View
    </ToggleButton>
    <ToggleButton active={view === "grid"} onClick={() => setView("grid")}>
      Grid View
    </ToggleButton>
  </ViewToggle>

  {view === "timeline" && (
    <VerticalTimeline>
      {allUnits.map((unit, index) => {
        const progress = unitProgress[unit.id];
        const isPast = new Date() > new Date(unit.endDate);
        const isCurrent = unit.id === currentUnit.id;

        return (
          <TimelineItem key={unit.id} status={getStatus(unit)}>
            <TimelineMarker status={getStatus(unit)}>
              {progress.status === "MASTERED" ? <StarIcon /> :
               progress.status === "COMPLETED" ? <CheckIcon /> :
               isCurrent ? <CurrentIcon /> :
               <CircleIcon />}
            </TimelineMarker>

            <TimelineContent>
              <UnitCard elevated={isCurrent}>
                <UnitHeader>
                  <UnitNumberBadge>{unit.unitNumber}</UnitNumberBadge>
                  <UnitTitleLarge>{unit.title}</UnitTitleLarge>
                  {isCurrent && <CurrentBadge>Current Unit</CurrentBadge>}
                  {progress.status === "MASTERED" && <MasteryBadge>Mastered</MasteryBadge>}
                </UnitHeader>

                <UnitMeta>
                  <MetaItem>
                    <CalendarIcon /> {formatDateRange(unit.startDate, unit.endDate)}
                  </MetaItem>
                  <MetaItem>
                    <ClockIcon /> {unit.estimatedWeeks} weeks
                  </MetaItem>
                  <MetaItem>
                    <DifficultyIndicator level={unit.difficultyLevel} />
                  </MetaItem>
                </UnitMeta>

                <UnitDescription>{unit.description}</UnitDescription>

                {!isPast && !isCurrent && (
                  <ComingSoonPanel>
                    <LockIcon />
                    <Text>This unit will unlock on {format(unit.startDate, 'MMMM d, yyyy')}</Text>
                  </ComingSoonPanel>
                )}

                {(isCurrent || isPast) && (
                  <>
                    <ProgressSection>
                      <ProgressLabel>Your Progress</ProgressLabel>
                      <ProgressBar value={progress.percentComplete} size="lg" />
                      <ProgressStats>
                        <Stat label="Assignments" value={`${progress.assignmentsCompleted}/${progress.assignmentsTotal}`} />
                        <Stat label="Average Score" value={`${Math.round(progress.averageScore)}%`} />
                        <Stat label="Mastery" value={`${Math.round(progress.masteryPercentage)}%`} />
                      </ProgressStats>
                    </ProgressSection>

                    <TopicsSection>
                      <SectionTitle>Topics Covered</SectionTitle>
                      <TopicsList>
                        {unit.topics.map(topic => (
                          <TopicItem key={topic.name}>
                            <TopicName>{topic.name}</TopicName>
                            <SubtopicsList>
                              {topic.subtopics.map(subtopic => (
                                <Subtopic key={subtopic}>• {subtopic}</Subtopic>
                              ))}
                            </SubtopicsList>
                          </TopicItem>
                        ))}
                      </TopicsList>
                    </TopicsSection>

                    {progress.struggles.length > 0 && (
                      <StruggleAlert>
                        <AlertIcon />
                        <AlertText>
                          Need extra practice: {progress.struggles.join(", ")}
                        </AlertText>
                        <AskAIButton onClick={() => openAITA(unit, progress.struggles)}>
                          Get Help from AI Tutor
                        </AskAIButton>
                      </StruggleAlert>
                    )}

                    {progress.strengths.length > 0 && (
                      <StrengthPanel>
                        <CelebrationIcon />
                        <Text>You're excelling at: {progress.strengths.join(", ")}</Text>
                      </StrengthPanel>
                    )}

                    <AssignmentsSection>
                      <SectionTitle>Unit Assignments</SectionTitle>
                      <AssignmentsList>
                        {unit.assignments.map(assignment => (
                          <AssignmentCard key={assignment.id} assignment={assignment} />
                        ))}
                      </AssignmentsList>
                    </AssignmentsSection>
                  </>
                )}
              </UnitCard>
            </TimelineContent>
          </TimelineItem>
        );
      })}
    </VerticalTimeline>
  )}

  {view === "grid" && (
    <UnitsGrid>
      {allUnits.map(unit => {
        const progress = unitProgress[unit.id];
        return (
          <UnitGridCard
            key={unit.id}
            unit={unit}
            progress={progress}
            onClick={() => scrollToUnit(unit.id)}
          />
        );
      })}
    </UnitsGrid>
  )}
</PageLayout>
```

#### 5.5 Assignment Creation Enhancement

##### CreateAssignment Enhancement

**File:** `socratit-wireframes/src/pages/teacher/CreateAssignment.tsx`

**New Fields:**

```
<FormSection>
  <SectionTitle>Curriculum Linkage</SectionTitle>

  <FormField>
    <Label>Link to Curriculum Unit</Label>
    <Select
      value={selectedUnitId}
      onChange={handleUnitSelect}
      placeholder="Select a curriculum unit (optional)"
    >
      <option value="">None - Independent Assignment</option>
      {curriculumUnits.map(unit => (
        <option key={unit.id} value={unit.id}>
          Unit {unit.unitNumber}: {unit.title} ({formatDateRange(unit.startDate, unit.endDate)})
        </option>
      ))}
    </Select>
    <HelpText>
      Linking assignments to units helps track student progress and enables unit-based analytics.
    </HelpText>
  </FormField>

  {selectedUnitId && (
    <>
      <UnitInfoCard>
        <UnitTitle>{selectedUnit.title}</UnitTitle>
        <UnitDates>{formatDateRange(selectedUnit.startDate, selectedUnit.endDate)}</UnitDates>
        <TopicsList topics={selectedUnit.topics} />
      </UnitInfoCard>

      <FormField>
        <Label>Due Date</Label>
        <DatePicker
          value={dueDate}
          onChange={setDueDate}
          minDate={selectedUnit.startDate}
          maxDate={selectedUnit.endDate}
        />
        <SuggestionPanel>
          <LightbulbIcon />
          <Text>
            AI suggests: {format(suggestedDueDate, 'MMMM d, yyyy')}
            (near end of unit for assessment)
          </Text>
          <UseButton onClick={() => setDueDate(suggestedDueDate)}>
            Use Suggestion
          </UseButton>
        </SuggestionPanel>
      </FormField>

      <AIGenerationPanel>
        <PanelTitle>Generate from Unit Content</PanelTitle>
        <Text>
          AI can generate quiz questions based on this unit's topics and learning objectives.
        </Text>
        <GenerateButton onClick={handleAIGenerate} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <Spinner /> Generating Questions...
            </>
          ) : (
            <>
              <SparklesIcon /> Generate Quiz from Unit
            </>
          )}
        </GenerateButton>
      </AIGenerationPanel>
    </>
  )}
</FormSection>
```

### 6. UI/UX Design Specifications

#### Design System Adherence

All curriculum mapping components must match the existing SocratIt.ai design language:

**Color Palette:**
```css
/* Primary Colors */
--primary-blue: #3b82f6;
--primary-blue-dark: #2563eb;
--primary-blue-light: #60a5fa;

/* Difficulty Level Colors */
--difficulty-1: #10b981; /* Green - Introductory */
--difficulty-2: #84cc16; /* Lime - Basic */
--difficulty-3: #f59e0b; /* Amber - Intermediate */
--difficulty-4: #f97316; /* Orange - Advanced */
--difficulty-5: #ef4444; /* Red - Expert */

/* Status Colors */
--status-scheduled: #94a3b8;  /* Slate */
--status-current: #3b82f6;    /* Blue */
--status-completed: #10b981;  /* Green */
--status-mastered: #8b5cf6;   /* Purple */

/* Neutrals */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-300: #d1d5db;
--gray-700: #374151;
--gray-900: #111827;

/* Semantic */
--success: #10b981;
--warning: #f59e0b;
--error: #ef4444;
--info: #3b82f6;
```

**Typography:**
```css
/* Font Family */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

**Spacing:**
```css
/* Based on 4px scale */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
```

**Border Radius:**
```css
--radius-sm: 0.375rem;  /* 6px */
--radius-md: 0.5rem;    /* 8px */
--radius-lg: 0.75rem;   /* 12px */
--radius-xl: 1rem;      /* 16px */
--radius-full: 9999px;  /* Fully rounded */
```

**Shadows:**
```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

**Animations:**
```css
/* Transitions */
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);

/* Common animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

#### Component-Specific Designs

##### Unit Cards
```css
.unit-card {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
  border-left: 4px solid var(--difficulty-color); /* Dynamic based on difficulty */
}

.unit-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.unit-card.current {
  border-left-width: 6px;
  border-left-color: var(--status-current);
  background: linear-gradient(to right, #eff6ff, white);
}
```

##### Timeline Bars
```css
.timeline-bar {
  height: 60px;
  background: linear-gradient(135deg, var(--difficulty-color-light), var(--difficulty-color));
  border-radius: var(--radius-md);
  position: relative;
  overflow: hidden;
  cursor: grab;
  transition: all var(--transition-base);
}

.timeline-bar:hover {
  filter: brightness(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.timeline-bar.dragging {
  cursor: grabbing;
  opacity: 0.8;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.timeline-bar-progress {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: rgba(255, 255, 255, 0.3);
  border-right: 2px solid rgba(255, 255, 255, 0.5);
  transition: width var(--transition-slow);
}
```

##### Progress Indicators
```css
.progress-ring {
  transform: rotate(-90deg);
}

.progress-ring-circle {
  transition: stroke-dashoffset var(--transition-slow);
}

/* Circular progress for overall completion */
.circular-progress {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.circular-progress svg {
  transform: rotate(-90deg);
}

.circular-progress-text {
  position: absolute;
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--gray-900);
}
```

##### Drag-and-Drop States
```css
.draggable-item {
  cursor: grab;
  transition: all var(--transition-base);
}

.draggable-item:active {
  cursor: grabbing;
}

.draggable-item.dragging {
  opacity: 0.5;
  box-shadow: var(--shadow-xl);
  transform: scale(1.05);
}

.drop-zone {
  border: 2px dashed var(--gray-300);
  background: var(--gray-50);
  border-radius: var(--radius-lg);
  transition: all var(--transition-fast);
}

.drop-zone.active {
  border-color: var(--primary-blue);
  background: #eff6ff;
}
```

##### AI Assistant Chat
```css
.chat-message {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-4);
  animation: slideUp var(--transition-base);
}

.chat-message.user {
  flex-direction: row-reverse;
}

.chat-message.assistant {
  background: var(--gray-50);
  border-radius: var(--radius-lg);
}

.chat-bubble {
  background: white;
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  max-width: 80%;
}

.chat-bubble.user {
  background: var(--primary-blue);
  color: white;
}

.typing-indicator {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-4);
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: var(--gray-400);
  border-radius: var(--radius-full);
  animation: pulse 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}
```

### 7. Implementation Phases & Timeline

#### Phase 1: Foundation (Week 1-2)
**Database & Backend Core**

**Tasks:**
1. Create Prisma migration for new models (CurriculumSchedule, CurriculumUnit, UnitProgress, CurriculumMilestone)
2. Update existing models with new relationships
3. Run migration and test database schema
4. Enhance AI service with new prompt templates for schedule generation
5. Build core backend endpoints (schedule CRUD, unit CRUD)
6. Add unit tests for new services and controllers

**Deliverables:**
- ✅ Database schema fully migrated
- ✅ AI can analyze curriculum and extract unit structure with time estimates
- ✅ Basic API endpoints functional
- ✅ Unit tests passing

#### Phase 2: AI Enhancement (Week 2-3)
**Intelligent Schedule Generation**

**Tasks:**
1. Build `analyzeCurriculumForScheduling` AI service method
2. Implement difficulty analysis algorithm
3. Build prerequisite detection logic
4. Create schedule generation endpoint with AI integration
5. Build AI chat refinement endpoint
6. Add comprehensive error handling and retry logic

**Deliverables:**
- ✅ AI generates structured units with time estimates
- ✅ AI analyzes difficulty and suggests pacing
- ✅ AI chat can refine schedules based on teacher input
- ✅ Confidence scores provided for AI suggestions

#### Phase 3: Frontend Foundation (Week 3-4)
**UI Component Library & Basic Views**

**Tasks:**
1. Install frontend dependencies (dnd-kit, react-big-calendar, date-fns, react-calendar-timeline)
2. Create base curriculum components (UnitCard, TimelineBar, ProgressIndicator)
3. Build CurriculumTimelineView component
4. Build CurriculumCalendarView component
5. Build CurriculumUnitCardsList component
6. Create shared hooks (useCurriculumSchedule, useUnitProgress)
7. Add TypeScript interfaces for all new data types

**Deliverables:**
- ✅ All UI libraries integrated
- ✅ Three view modes implemented (timeline, calendar, cards)
- ✅ Components match Apple-style design system
- ✅ Responsive layouts working

#### Phase 4: Class Creation Wizard (Week 4-5)
**Interactive Curriculum Mapping**

**Tasks:**
1. Enhance CreateClass wizard with new steps
2. Build WizardStep2_SchoolYear component
3. Build WizardStep3_CurriculumUpload component
4. Build WizardStep4_AIScheduleGeneration component
5. Build WizardStep5_ScheduleAdjustment component
6. Build WizardStep6_ReviewFinalize component
7. Integrate with backend APIs
8. Add form validation and error handling
9. Implement wizard state management

**Deliverables:**
- ✅ Seamless 6-step wizard experience
- ✅ AI generates schedule during class creation
- ✅ Teachers can adjust schedule before finalizing
- ✅ Beautiful loading states and animations

#### Phase 5: Drag-and-Drop & Interactivity (Week 5-6)
**Interactive Schedule Editing**

**Tasks:**
1. Implement drag-and-drop for timeline view (dnd-kit)
2. Implement drag-and-drop for unit cards (reordering)
3. Build unit editor modal
4. Add date range adjustment handles
5. Build custom unit creation form
6. Implement undo/redo functionality
7. Add real-time validation (prevent overlaps, gaps)
8. Add keyboard shortcuts for power users

**Deliverables:**
- ✅ Intuitive drag-and-drop rescheduling
- ✅ Visual feedback during drag operations
- ✅ Inline editing of unit details
- ✅ Smooth animations and transitions

#### Phase 6: AI Assistant Integration (Week 6-7)
**Conversational Schedule Refinement**

**Tasks:**
1. Build AIScheduleAssistant component
2. Implement chat interface with streaming responses
3. Build suggestion cards with apply/reject actions
4. Integrate with backend AI refinement endpoint
5. Add quick action buttons (common requests)
6. Implement conversation history
7. Add undo for applied AI suggestions
8. Build AI suggestions panel (proactive recommendations)

**Deliverables:**
- ✅ Teachers can chat with AI to refine schedule
- ✅ AI provides actionable suggestions
- ✅ Suggestions can be applied with one click
- ✅ Natural language interface feels intuitive

#### Phase 7: Class Dashboard Integration (Week 7-8)
**Curriculum Visibility in Main Dashboard**

**Tasks:**
1. Enhance ClassDashboard with CurriculumSchedulePanel
2. Build compact timeline view for dashboard
3. Build progress overview section
4. Add "current unit" highlight card
5. Create navigation to full schedule view
6. Build FullScheduleView page/modal
7. Add export functionality (PDF, CSV)
8. Integrate with existing analytics

**Deliverables:**
- ✅ Curriculum prominently displayed on class dashboard
- ✅ Teachers see at-a-glance progress
- ✅ One click to full schedule view
- ✅ Export options for sharing/printing

#### Phase 8: Progress Tracking System (Week 8-9)
**Unit-Based Student Progress**

**Tasks:**
1. Build backend logic to calculate unit progress
2. Create UnitProgress calculation service
3. Implement progress update triggers (on assignment submission)
4. Build teacher unit progress view
5. Build student progress display components
6. Create progress analytics endpoints
7. Integrate with existing analytics system
8. Add pacing alerts (ahead/behind schedule)

**Deliverables:**
- ✅ Student progress tracked per unit automatically
- ✅ Teachers see class-level unit progress
- ✅ Students see their own progress clearly
- ✅ Pacing alerts notify if class is off-track

#### Phase 9: Student View (Week 9-10)
**Student-Facing Curriculum Display**

**Tasks:**
1. Build StudentClassDashboard curriculum section
2. Create CurriculumProgressPanel for students
3. Build StudentFullScheduleView page
4. Implement vertical timeline for student view
5. Add progress indicators and status badges
6. Build unit detail expandable cards
7. Add "unlock" logic for future units
8. Integrate with AI Teaching Assistant (link from struggles)

**Deliverables:**
- ✅ Students see beautiful year-long roadmap
- ✅ Progress indicators motivate students
- ✅ Current unit prominently highlighted
- ✅ Seamless navigation to assignments

#### Phase 10: Assignment Integration (Week 10-11)
**Link Assignments to Units**

**Tasks:**
1. Enhance CreateAssignment form with unit selection
2. Add due date auto-suggestion based on unit
3. Build "generate from unit" AI feature
4. Update assignment display to show unit linkage
5. Build unit-filtered assignment views
6. Update grading to affect unit progress
7. Add unit completion triggers
8. Build suggested assignments endpoint

**Deliverables:**
- ✅ Assignments linked to curriculum units
- ✅ AI suggests assignment due dates
- ✅ Assignment completion updates unit progress
- ✅ Teachers get suggestions for unit assessments

#### Phase 11: Polish & Optimization (Week 11-12)
**Performance, UX, and Edge Cases**

**Tasks:**
1. Performance optimization (lazy loading, memoization)
2. Add loading skeletons for async operations
3. Implement error boundaries
4. Add comprehensive error messages
5. Build empty states (no curriculum uploaded yet)
6. Add onboarding tooltips for first-time users
7. Mobile responsive testing and fixes
8. Cross-browser testing (Chrome, Safari, Firefox, Edge)
9. Accessibility audit (WCAG 2.1 AA compliance)
10. Add analytics tracking for feature usage

**Deliverables:**
- ✅ Buttery smooth performance
- ✅ Graceful error handling
- ✅ Mobile-friendly responsive design
- ✅ Accessible to all users
- ✅ Production-ready code

#### Phase 12: Testing & Documentation (Week 12)
**Quality Assurance**

**Tasks:**
1. Write integration tests for curriculum workflows
2. Write E2E tests for class creation with curriculum
3. Test AI generation with various curriculum types
4. User acceptance testing with sample teachers
5. Create user documentation (help guides, videos)
6. Update API documentation
7. Create admin documentation for deployment
8. Performance testing under load
9. Security audit of new endpoints
10. Final bug fixes and polish

**Deliverables:**
- ✅ Comprehensive test coverage
- ✅ User documentation complete
- ✅ API docs updated
- ✅ Ready for production deployment

### 8. Success Metrics

#### Quantitative Metrics

**Adoption Metrics:**
- % of classes with curriculum schedules created
- Average time to create curriculum schedule
- % of teachers using AI schedule generation vs manual creation
- % of AI-generated schedules accepted without modifications
- Number of schedule refinements per class

**Engagement Metrics:**
- Daily active users viewing curriculum schedules
- Average time spent in curriculum views
- Number of drag-and-drop adjustments per schedule
- Number of AI chat interactions per teacher
- Number of custom units added per class

**Progress Metrics:**
- % of students viewing their progress regularly
- Average student engagement with curriculum view
- Correlation between curriculum visibility and assignment completion
- Unit completion rates vs scheduled dates (pacing accuracy)

**Technical Metrics:**
- Page load time for curriculum views (target: <2s)
- AI schedule generation time (target: <10s)
- API response time for schedule endpoints (target: <500ms)
- Error rate for curriculum operations (target: <0.1%)

#### Qualitative Metrics

**Teacher Satisfaction:**
- Net Promoter Score (NPS) for curriculum feature
- Ease of use ratings (1-5 scale)
- User feedback surveys
- Support ticket volume related to curriculum

**Student Experience:**
- Student engagement survey responses
- Clarity of learning path ratings
- Motivation impact (self-reported)

**Educational Impact:**
- Teacher-reported time savings on planning
- Improved pacing (staying on schedule)
- Better alignment between curriculum and assessments
- Increased student awareness of learning goals

### 9. Risk Mitigation

#### Technical Risks

**Risk:** AI-generated schedules are inaccurate or unhelpful
- **Mitigation:** Extensive testing with diverse curriculum types; Allow easy manual override; Collect feedback to improve prompts; Provide confidence scores

**Risk:** Drag-and-drop performance issues with many units
- **Mitigation:** Virtualization for long lists; Optimize re-renders; Debounce drag events; Lazy load unit details

**Risk:** Date calculation bugs (timezones, school breaks, etc.)
- **Mitigation:** Use date-fns for reliable date math; Comprehensive unit tests; Support multiple timezone scenarios; Clear documentation

**Risk:** Complex state management in wizard
- **Mitigation:** Use React Query for server state; Use form library (React Hook Form); Careful state normalization; Extensive integration tests

#### User Experience Risks

**Risk:** Teachers find curriculum mapping too time-consuming
- **Mitigation:** AI does heavy lifting; Provide quick-start templates; Allow skipping steps; Offer tutorial videos

**Risk:** Students confused by future content
- **Mitigation:** Clear "Coming Soon" states; Progressive disclosure; Contextual help; Visual differentiation of past/present/future

**Risk:** Mobile experience is cramped
- **Mitigation:** Prioritize mobile views; Simplify for small screens; Responsive breakpoints; Touch-friendly interactions

#### Business Risks

**Risk:** Feature complexity delays launch
- **Mitigation:** Phased rollout; MVP first (basic timeline, no AI); Iterate based on feedback; Parallel development

**Risk:** Low adoption due to change management
- **Mitigation:** In-app onboarding; Tutorial videos; Webinars for teachers; Email campaigns; Showcase benefits clearly

### 10. Future Enhancements (Post-MVP)

**Phase 2+ Features:**

1. **Standards Alignment:**
   - Map curriculum units to Common Core, state standards
   - Automatic standards identification via AI
   - Standards-based reporting

2. **Curriculum Templates:**
   - Pre-built curriculum maps for common subjects
   - Template marketplace (teacher-created, shared)
   - Clone and customize templates

3. **Collaborative Planning:**
   - Multiple teachers co-plan curriculum
   - Department-wide curriculum alignment
   - Comments and annotations on units

4. **Advanced Analytics:**
   - Predictive pacing (ML-based, learns from historical data)
   - Comparative analytics (how other classes paced same curriculum)
   - Intervention recommendations (slow down, add review unit, etc.)

5. **Calendar Integrations:**
   - Sync with Google Calendar, Outlook
   - Import school district calendars automatically
   - Handle breaks, holidays, early dismissals

6. **Parent Portal:**
   - Parents view curriculum roadmap
   - Notifications for unit transitions
   - Progress reports per unit

7. **Advanced Assignment Scheduling:**
   - Auto-create assignments for entire year
   - Smart spacing (formative vs summative)
   - Dependency chains (Assignment B unlocks after Assignment A)

8. **Differentiation Support:**
   - Multiple pacing tracks (honors, standard, support)
   - Student-specific curriculum adjustments
   - Personalized learning paths

9. **Curriculum Versioning:**
   - Save multiple versions of schedule
   - Compare versions
   - Rollback to previous version
   - Year-over-year improvements

10. **Mobile App:**
    - Native iOS/Android curriculum views
    - Offline access to schedule
    - Push notifications for unit transitions

---

## 🎨 Visual Design Mockup Descriptions

Since this is a text document, I'll describe key screens in detail:

### Mockup 1: Class Creation Wizard - Step 4 (AI Schedule Generation)

**Layout:**
- Full-screen modal/page
- Progress indicator at top (Step 4 of 6)
- Center content area with AI animation

**Content:**
- **Header:** "AI is Creating Your Curriculum Schedule"
- **Animation:** Animated brain icon or abstract shapes showing "thinking"
- **Progress Steps (animated checkmarks):**
  - ✅ Analyzing curriculum content
  - ✅ Identifying key units and topics
  - ✅ Estimating time requirements
  - ⏳ Assessing difficulty levels
  - ⏳ Creating optimal sequence
  - ⏳ Mapping to school year dates
- **Estimated time:** "This usually takes 8-10 seconds..."
- **Bottom:** "Cancel" button (left), disabled "Continue" (right)

**Once Complete:**
- Success checkmark animation
- "Schedule Generated!" message
- Preview cards for first 3 units
- Button: "Review Schedule" (primary CTA)

### Mockup 2: Class Creation Wizard - Step 5 (Schedule Adjustment - Timeline View)

**Layout:**
- Split screen: 70% timeline, 30% sidebar

**Left Side (Timeline):**
- Header: View toggle buttons (Timeline • Calendar • Cards)
- Horizontal scrollable timeline
- Week labels at top (Week 1, Week 2, ... Week 36)
- Colored unit bars spanning weeks
- Current week marker (vertical line, "Today")
- Zoom controls (bottom right)

**Right Side (Sidebar):**
- AI Chat Assistant button (prominent, top)
- Selected Unit details:
  - Unit title
  - Date range (editable)
  - Difficulty indicator
  - Topics list (collapsible)
  - Edit button
- Quick Actions:
  - Add Custom Unit
  - AI Suggestions
  - Reset Schedule

**Timeline Unit Bar Example:**
```
┌────────────────────────────────────────┐
│ Unit 1: Intro to Algebra               │ [Difficulty: ●●○○○]
│ Aug 28 - Sep 15 (3 weeks)              │ [5 topics]
└────────────────────────────────────────┘
```

### Mockup 3: Student View - Curriculum Progress Timeline

**Layout:**
- Vertical timeline (mobile-friendly)
- Hero section at top
- Scrollable timeline below

**Hero Section:**
```
┌─────────────────────────────────────────────────────┐
│  Your Progress                              62% ●   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │   Currently Learning:                       │   │
│  │   Unit 4: Quadratic Equations               │   │
│  │   Progress: ████████░░░░ 65%                │   │
│  │                                             │   │
│  │   📚 3/5 Assignments Complete               │   │
│  │   ⭐ 87% Average Score                       │   │
│  │   🧠 78% Mastery                            │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

**Timeline Section:**
```
  ●══════════════════════════════════════●
  │                                      │
  │  [✓] Unit 1: Introduction           │  ← Completed (grayed out)
  │  Aug 28 - Sep 15 • Mastered ⭐      │
  │  Progress: ████████████ 100%         │
  │                                      │
  ●══════════════════════════════════════●
  │                                      │
  │  [✓] Unit 2: Linear Equations       │  ← Completed
  │  Sep 18 - Oct 6 • Mastered ⭐       │
  │  Progress: ████████████ 100%         │
  │                                      │
  ●══════════════════════════════════════●
  │                                      │
  │  [✓] Unit 3: Systems of Equations   │  ← Completed
  │  Oct 9 - Oct 27                     │
  │  Progress: ████████████ 100%         │
  │                                      │
  ●══════════════════════════════════════●
  │                                      │
  │  [▶] Unit 4: Quadratic Equations    │  ← Current (highlighted)
  │  Oct 30 - Nov 17                    │
  │  Progress: ████████░░░░ 65%          │
  │                                      │
  │  📚 Assignments:                     │
  │  ✓ Intro Quiz (95%)                 │
  │  ✓ Factoring Practice (82%)         │
  │  ✓ Quadratic Formula (85%)          │
  │  ⏳ Graphing Parabolas (Due Nov 10) │
  │  ⏳ Unit Test (Due Nov 17)          │
  │                                      │
  │  💪 You're doing great at:          │
  │  • Factoring quadratics             │
  │  • Using the quadratic formula      │
  │                                      │
  │  📖 Need extra practice:             │
  │  • Completing the square            │
  │  [Get Help from AI Tutor →]         │
  │                                      │
  ●══════════════════════════════════════●
  │                                      │
  │  [🔒] Unit 5: Polynomial Functions  │  ← Future (locked)
  │  Nov 20 - Dec 15                    │
  │  Unlocks on November 20, 2024       │
  │                                      │
  ●══════════════════════════════════════●
```

### Mockup 4: Teacher Class Dashboard - Curriculum Panel

**Layout:**
- Full-width panel at top of dashboard
- Collapsible/expandable

**Collapsed State:**
```
┌────────────────────────────────────────────────────────────────┐
│  📚 Year-Long Curriculum                        [Expand ▼]     │
│                                                                 │
│  Current Unit: Unit 4 - Quadratic Equations (Week 12 of 36)   │
│  Progress: ████████░░░░░░░░░░░░░░░░░░░░ 33% Complete          │
│  Next: Unit 5 - Polynomial Functions (Nov 20)                  │
└────────────────────────────────────────────────────────────────┘
```

**Expanded State:**
```
┌────────────────────────────────────────────────────────────────┐
│  📚 Year-Long Curriculum        [Timeline] [Progress]  [Edit]  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  🎯 Current Unit                                         │ │
│  │  Unit 4: Quadratic Equations                            │ │
│  │  Oct 30 - Nov 17 (3 weeks)                              │ │
│  │  Class Progress: ████████░░░░ 67%                        │ │
│  │                                                          │ │
│  │  📊 Student Progress:                                    │ │
│  │  • 18 students started (100%)                           │ │
│  │  • 12 students completed (67%)                          │ │
│  │  • Class avg score: 84%                                 │ │
│  │                                                          │ │
│  │  [View Unit Details →]                                   │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Mini Timeline (Year Overview):                                │
│  ┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬───┐│
│  │ U1 │ U2 │ U3 │ U4 │ U5 │ U6 │ U7 │ U8 │ U9 │U10 │U11 │U12││
│  │ ✓  │ ✓  │ ✓  │▶   │    │    │    │    │    │    │    │   ││
│  └────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴───┘│
│   Aug  Sep  Oct  Nov  Dec  Jan  Feb  Mar  Apr  May  Jun      │
│                          ↑ You are here                        │
│                                                                 │
│  Coming Next:                                                   │
│  • Unit 5: Polynomial Functions • Nov 20                       │
│  • Unit 6: Exponential Functions • Dec 18                      │
│                                                                 │
│  [View Full Schedule →]                                         │
└────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] All database migrations tested in staging
- [ ] API endpoints documented (Swagger/OpenAPI)
- [ ] Frontend builds without errors
- [ ] All tests passing (unit, integration, E2E)
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Mobile responsiveness verified
- [ ] Cross-browser testing completed
- [ ] Error tracking configured (Sentry)
- [ ] Analytics tracking implemented

### Feature Flags (Recommended)

```typescript
// Enable gradual rollout
const CURRICULUM_FEATURES = {
  AI_SCHEDULE_GENERATION: process.env.ENABLE_AI_SCHEDULING === 'true',
  DRAG_AND_DROP_EDITING: process.env.ENABLE_DRAG_DROP === 'true',
  AI_CHAT_ASSISTANT: process.env.ENABLE_AI_CHAT === 'true',
  STUDENT_PROGRESS_VIEW: process.env.ENABLE_STUDENT_PROGRESS === 'true',
};
```

### Rollout Plan

**Phase 1: Alpha (Internal Testing)**
- Deploy to staging environment
- Internal team testing (1 week)
- Fix critical bugs

**Phase 2: Beta (Limited Release)**
- Enable for 5-10 pilot teachers
- Collect feedback
- Iterate on UX issues
- Monitor performance and errors

**Phase 3: General Availability**
- Enable for all new classes
- Gradual migration of existing classes
- Announcement and training materials
- Ongoing monitoring and support

### Monitoring

**Key Metrics to Watch:**
- AI generation success rate
- API error rates
- Page load times
- User engagement (DAU/MAU)
- Feature adoption rate
- Support ticket volume

**Alerts:**
- AI service downtime
- Database performance degradation
- Error rate spike (>1%)
- API response time >2s

---

## 📚 Developer Documentation

### Getting Started (For New Developers)

**Prerequisites:**
```bash
Node.js 18+
PostgreSQL 14+
Redis 6+ (optional)
```

**Setup:**
```bash
# Backend
cd socratit-backend
npm install
npx prisma migrate dev
npm run dev

# Frontend
cd socratit-wireframes
npm install
npm run dev
```

**Environment Variables:**
```env
# Add to .env
AI_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql://...
```

### Code Structure

**Backend:**
```
src/
├── controllers/     # Route handlers
├── services/        # Business logic
├── middleware/      # Auth, validation, etc.
├── validators/      # Request validation schemas
├── routes/          # Express routes
└── types/           # TypeScript types
```

**Frontend:**
```
src/
├── pages/           # Route components
├── components/      # Reusable UI components
├── services/        # API client
├── hooks/           # Custom React hooks
└── types/           # TypeScript interfaces
```

### Key Files to Review

**Backend:**
- `src/services/ai.service.ts` - AI integration
- `src/controllers/curriculum.controller.ts` - Curriculum endpoints
- `prisma/schema.prisma` - Database schema

**Frontend:**
- `src/pages/teacher/CreateClass.tsx` - Class creation wizard
- `src/components/curriculum/*` - Curriculum components
- `src/services/curriculum.service.ts` - Curriculum API client

### Testing

**Run Tests:**
```bash
# Backend
npm test
npm run test:coverage

# Frontend
npm test
npm run test:e2e
```

### API Examples

**Generate AI Schedule:**
```bash
POST /api/v1/curriculum-schedules/generate-from-ai
{
  "curriculumMaterialId": "cm123abc",
  "schoolYearStart": "2024-08-28",
  "schoolYearEnd": "2025-06-12",
  "preferences": {
    "targetUnits": 10,
    "pacingPreference": "standard"
  }
}
```

**Update Unit Dates:**
```bash
PATCH /api/v1/curriculum-units/{unitId}
{
  "startDate": "2024-09-05",
  "endDate": "2024-09-26",
  "teacherModified": true
}
```

---

## 📖 User Documentation (Teacher Guide)

### Creating Your First Curriculum Schedule

**Step 1: Start Class Creation**
1. Navigate to "Classes" in sidebar
2. Click "Create New Class" button
3. Fill in class name, subject, grade level

**Step 2: Define School Year**
1. Select your school year start date (e.g., August 28, 2024)
2. Select end date (e.g., June 12, 2025)
3. Review: 36 weeks, 180 instructional days
4. Click "Continue"

**Step 3: Upload Curriculum**
1. Drag-and-drop your curriculum PDF/Word file
2. Add a title (e.g., "Algebra 1 Curriculum")
3. Click "Analyze with AI"
4. Wait 8-10 seconds for AI to process

**Step 4: Review AI-Generated Schedule**
1. AI shows suggested units mapped to entire year
2. Review unit titles, date ranges, difficulty levels
3. If happy, click "Continue"
4. If not, click "Regenerate" and adjust preferences

**Step 5: Customize Your Schedule**
1. **Timeline View:** Drag unit bars to adjust dates
2. **Calendar View:** See units on traditional calendar
3. **Cards View:** Reorder units by dragging cards
4. Click any unit to edit details
5. Use AI Chat Assistant for quick adjustments:
   - "Make Unit 3 longer by one week"
   - "Add a review unit before Unit 5"
6. Click "Continue" when satisfied

**Step 6: Finalize**
1. Review your complete schedule
2. Check "Make visible to students" if ready
3. Click "Create Class & Publish Schedule"
4. Done! Your class is created with a beautiful year-long plan

### Tips & Best Practices

**Curriculum Mapping:**
- Upload comprehensive curriculum files for best AI results
- Include syllabi, textbook TOCs, learning standards
- More detail = better AI analysis

**Schedule Adjustments:**
- Review AI suggestions but trust your expertise
- Allow buffer time for assessments and review
- Consider school events (testing weeks, assemblies)
- Build in flexibility for challenging units

**Student Engagement:**
- Publish schedule early so students see the roadmap
- Update progress regularly to keep students motivated
- Celebrate unit completions as milestones

**Assignment Alignment:**
- Link all assignments to curriculum units
- Use AI to generate unit-based quizzes
- Schedule assessments near end of units

---

## 🎓 Conclusion

This curriculum mapping system transforms SocratIt.ai from an assignment management platform into a comprehensive year-long planning and progress tracking solution. By leveraging AI to automate the tedious work of schedule creation while giving teachers full control to customize, we create a best-of-both-worlds experience.

The beautiful, Apple-style UI makes complex curriculum planning feel simple and intuitive. Students gain unprecedented visibility into their learning journey, fostering motivation and agency. Teachers save hours of planning time while gaining powerful insights into pacing and student progress.

This feature positions SocratIt.ai as a truly end-to-end classroom management solution, differentiating from competitors and providing immense value to educators.

**Total Estimated Development Time:** 12 weeks

**Team Recommendation:**
- 2 Backend Engineers
- 2 Frontend Engineers
- 1 UX Designer
- 1 QA Engineer
- 1 Product Manager

**Priority:** High - This is a flagship feature that significantly elevates the platform's value proposition.

---

*End of Implementation Plan*
