# Implementation Status & Next Steps

## ✅ COMPLETED

### 1. Backend - File Upload System
**Files Created:**
- `socratit-backend/src/routes/upload.routes.ts` ✅
- `socratit-backend/src/controllers/upload.controller.ts` ✅

**Features:**
- ✅ File upload endpoint (`POST /api/upload/curriculum`)
- ✅ File download endpoint (`GET /api/upload/curriculum/:fileId`)
- ✅ Multer configuration (10MB limit, PDF/DOC/DOCX only)
- ✅ Local filesystem storage (`uploads/curriculum/`)
- ✅ Database record creation (CurriculumMaterial model)
- ✅ Multi-tenancy (school-based access control)
- ✅ Integrated into app.ts

**Schema:**
- ✅ CurriculumMaterial model already exists (lines 1292-1347)
- ✅ Includes file metadata, processing status, AI-generated content
- ✅ Relations: teacher, schedules, assignments

### 2. Frontend - Upload Service
**Files Created:**
- `socratit-wireframes/src/services/upload.service.ts` ✅
- `socratit-wireframes/src/services/classApi.service.ts` ✅

**Features:**
- ✅ Upload with progress tracking
- ✅ Download functionality
- ✅ Type-safe API client
- ✅ Error handling

### 3. Frontend - Complete UI Components (22 files)
**All created in previous session:**
- ✅ Shared components (Modal, DatePicker, FileUpload)
- ✅ ClassCreationWizard (5 steps)
- ✅ ClassDashboard with collapsible sections
- ✅ StudentClassView
- ✅ CurriculumManagementModal
- ✅ All supporting components

---

## 🚧 IN PROGRESS / PENDING

### Backend Integration Needed

#### 1. Enhanced Class Creation Endpoint
**File:** `socratit-backend/src/controllers/class.controller.ts`

**Current State:** Basic class creation exists
**Needs:** Extend to support optional curriculum schedule creation

**Implementation:**

```typescript
// Add to CreateClassRequestBody interface
interface CreateClassRequestBody {
  // ... existing fields

  // Optional curriculum schedule data
  curriculumMaterialId?: string; // Reference to uploaded file
  schoolYearStart?: string;
  schoolYearEnd?: string;
  meetingPattern?: string;
  generateWithAI?: boolean;
  aiPreferences?: {
    targetUnits?: number;
    pacingPreference?: 'slow' | 'standard' | 'fast';
  };
}

// Update createClass function
export const createClass = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // ... existing class creation code

    // NEW: If curriculum data provided, create schedule
    if (body.curriculumMaterialId && body.schoolYearStart && body.schoolYearEnd) {
      const scheduleData = {
        classId: newClass.id,
        teacherId: userId,
        schoolId,
        curriculumMaterialId: body.curriculumMaterialId,
        schoolYearStart: new Date(body.schoolYearStart),
        schoolYearEnd: new Date(body.schoolYearEnd),
        meetingPattern: body.meetingPattern || 'daily',
        title: `${body.name} - Curriculum Schedule`,
        totalWeeks: calculateWeeks(new Date(body.schoolYearStart), new Date(body.schoolYearEnd)),
        totalDays: calculateInstructionalDays(...),
        totalUnits: body.aiPreferences?.targetUnits || 0,
        status: body.generateWithAI ? 'DRAFT' : 'PUBLISHED',
      };

      const schedule = await prisma.curriculumSchedule.create({
        data: scheduleData,
      });

      // If AI generation requested, call AI service
      if (body.generateWithAI) {
        // This will be handled by separate endpoint or background job
        // POST /api/curriculum-schedules/:id/generate-ai
      }
    }

    // ... rest of existing code
  }
};
```

#### 2. AI TA Integration for Curriculum Editing
**File:** `socratit-backend/src/services/aiTA.service.ts`

**Needs:** Add curriculum modification capabilities

**Implementation:**

```typescript
// Add to existing AI TA service
export async function modifyCurriculumWithAI(
  scheduleId: string,
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>
): Promise<{
  response: string;
  suggestedChanges: Array<{
    unitId: string;
    changes: {
      title?: string;
      startDate?: string;
      endDate?: string;
      topics?: any[];
    };
  }>;
}> {
  // Get current schedule
  const schedule = await prisma.curriculumSchedule.findUnique({
    where: { id: scheduleId },
    include: { units: true, curriculumMaterial: true },
  });

  // Build AI prompt with context
  const systemPrompt = `You are a curriculum planning assistant. Help the teacher modify their curriculum schedule.

  Current Schedule:
  - School Year: ${schedule.schoolYearStart} to ${schedule.schoolYearEnd}
  - Total Units: ${schedule.totalUnits}
  - Current Units: ${JSON.stringify(schedule.units.map(u => ({
    number: u.unitNumber,
    title: u.title,
    weeks: u.estimatedWeeks,
    startDate: u.startDate,
  })))}

  Guidelines:
  - Suggest specific, actionable changes
  - Maintain realistic time estimates
  - Keep modifications aligned with school calendar
  - Return changes in structured JSON format
  `;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userMessage },
  ];

  const aiResponse = await callOpenAI(messages);

  // Parse AI response to extract suggested changes
  const suggestedChanges = parseAISuggestions(aiResponse);

  return {
    response: aiResponse,
    suggestedChanges,
  };
}
```

#### 3. Template System
**Files to Create:**
- `socratit-backend/src/services/curriculumTemplate.service.ts`
- `socratit-backend/src/controllers/curriculumTemplate.controller.ts`
- `socratit-backend/src/routes/curriculumTemplate.routes.ts`

**Schema Addition:**

```prisma
model CurriculumTemplate {
  id String @id @default(uuid())

  // Template metadata
  name        String
  description String? @db.Text
  subject     String
  gradeLevel  String

  // Owner
  teacherId String @map("teacher_id")
  teacher   User   @relation("TeacherTemplates", fields: [teacherId], references: [id])

  schoolId String @map("school_id")
  school   School @relation(fields: [schoolId], references: [id])

  // Template data (JSON snapshot of schedule + units)
  scheduleData Json  @map("schedule_data")
  unitsData    Json  @map("units_data")

  // Usage tracking
  isPublic    Boolean @default(false) @map("is_public") // Share with other teachers in school
  usageCount  Int     @default(0) @map("usage_count")

  // Timestamps
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")

  @@index([teacherId])
  @@index([schoolId])
  @@index([subject])
  @@index([gradeLevel])
  @@map("curriculum_templates")
}
```

**API Endpoints:**

```typescript
// POST /api/curriculum-templates
// Save current schedule as template
export async function createTemplate(scheduleId: string, name: string, description: string) {
  const schedule = await prisma.curriculumSchedule.findUnique({
    where: { id: scheduleId },
    include: { units: true },
  });

  return prisma.curriculumTemplate.create({
    data: {
      name,
      description,
      subject: schedule.class.subject,
      gradeLevel: schedule.class.gradeLevel,
      teacherId: schedule.teacherId,
      schoolId: schedule.schoolId,
      scheduleData: {
        totalWeeks: schedule.totalWeeks,
        totalDays: schedule.totalDays,
        meetingPattern: schedule.meetingPattern,
      },
      unitsData: schedule.units.map(unit => ({
        title: unit.title,
        unitNumber: unit.unitNumber,
        estimatedWeeks: unit.estimatedWeeks,
        difficultyLevel: unit.difficultyLevel,
        topics: unit.topics,
        learningObjectives: unit.learningObjectives,
        concepts: unit.concepts,
      })),
    },
  });
}

// GET /api/curriculum-templates
// List available templates
export async function getTeacherTemplates(teacherId: string, schoolId: string) {
  return prisma.curriculumTemplate.findMany({
    where: {
      OR: [
        { teacherId }, // Own templates
        { schoolId, isPublic: true }, // Public school templates
      ],
    },
    orderBy: { createdAt: 'desc' },
  });
}

// POST /api/curriculum-templates/:templateId/apply
// Apply template to a class
export async function applyTemplate(templateId: string, classId: string, schoolYearStart: Date, schoolYearEnd: Date) {
  const template = await prisma.curriculumTemplate.findUnique({
    where: { id: templateId },
  });

  // Calculate date adjustments
  const scheduleData = template.scheduleData as any;
  const unitsData = template.unitsData as any[];

  // Create new schedule based on template
  const schedule = await prisma.curriculumSchedule.create({
    data: {
      classId,
      teacherId: template.teacherId,
      schoolId: template.schoolId,
      schoolYearStart,
      schoolYearEnd,
      totalWeeks: calculateWeeks(schoolYearStart, schoolYearEnd),
      totalDays: scheduleData.totalDays,
      meetingPattern: scheduleData.meetingPattern,
      title: `${template.name} (Applied)`,
      totalUnits: unitsData.length,
      status: 'PUBLISHED',
    },
  });

  // Create units with adjusted dates
  const weeksBetween = differenceInWeeks(schoolYearEnd, schoolYearStart);
  let currentDate = schoolYearStart;

  for (const unitData of unitsData) {
    const endDate = addWeeks(currentDate, unitData.estimatedWeeks);

    await prisma.curriculumUnit.create({
      data: {
        scheduleId: schedule.id,
        schoolId: template.schoolId,
        title: unitData.title,
        unitNumber: unitData.unitNumber,
        orderIndex: unitData.unitNumber - 1,
        startDate: currentDate,
        endDate,
        estimatedWeeks: unitData.estimatedWeeks,
        difficultyLevel: unitData.difficultyLevel,
        topics: unitData.topics,
        learningObjectives: unitData.learningObjectives,
        concepts: unitData.concepts,
        status: 'SCHEDULED',
        aiGenerated: false,
        teacherModified: false,
      },
    });

    currentDate = endDate;
  }

  // Increment usage count
  await prisma.curriculumTemplate.update({
    where: { id: templateId },
    data: { usageCount: { increment: 1 } },
  });

  return schedule;
}
```

### Frontend Integration Needed

#### 1. Connect ClassCreationWizard (Review Step)
**File:** `socratit-wireframes/src/pages/teacher/ClassCreationWizard/steps/ReviewClassStep.tsx`

**Replace lines 29-56:**

```typescript
import { uploadService } from '../../../../services/upload.service';
import { classApiService } from '../../../../services/classApi.service';
import { curriculumApi } from '../../../../services/curriculumApi.service';

const handleCreate = async () => {
  setIsCreating(true);
  setError(null);

  try {
    // Step 1: Upload curriculum file if provided
    let curriculumMaterialId: string | undefined;
    if (wizardState.curriculumFile) {
      const uploadedFile = await uploadService.uploadCurriculumFile(
        wizardState.curriculumFile
      );
      curriculumMaterialId = uploadedFile.id;
    }

    // Step 2: Create class (with optional curriculum schedule)
    const classData: any = {
      name: wizardState.className,
      subject: wizardState.subject,
      gradeLevel: wizardState.gradeLevel,
      description: wizardState.description || '',
      academicYear: `${wizardState.schoolYearStart?.getFullYear()}-${wizardState.schoolYearEnd?.getFullYear()}`,
      color: 'blue',
    };

    // Add curriculum schedule data if available
    if (curriculumMaterialId && wizardState.schoolYearStart && wizardState.schoolYearEnd) {
      classData.curriculumMaterialId = curriculumMaterialId;
      classData.schoolYearStart = wizardState.schoolYearStart.toISOString();
      classData.schoolYearEnd = wizardState.schoolYearEnd.toISOString();
      classData.meetingPattern = wizardState.meetingPattern;
      classData.generateWithAI = !wizardState.skipCurriculum;
      classData.aiPreferences = wizardState.aiPreferences;
    }

    const newClass = await classApiService.createClass(classData);

    // Step 3: If AI generation was requested and we have a schedule
    if (newClass.scheduleId && classData.generateWithAI) {
      // Generate schedule with AI (this might take a while)
      await curriculumApi.schedules.generateScheduleFromAI(
        newClass.scheduleId,
        {
          targetUnits: wizardState.aiPreferences.targetUnits || 8,
          pacingPreference: wizardState.aiPreferences.pacingPreference,
        }
      );
    }

    // Update wizard state with created class ID
    onUpdate({ classId: newClass.id });

    // Navigate to class dashboard
    onNext();
  } catch (err: any) {
    setError(err.response?.data?.message || 'Failed to create class. Please try again.');
    console.error('Class creation error:', err);
  } finally {
    setIsCreating(false);
  }
};
```

#### 2. Connect ClassDashboard
**File:** `socratit-wireframes/src/pages/teacher/ClassDashboard.tsx`

**Replace mock data loading (lines 68-150):**

```typescript
import { classApiService } from '../../services/classApi.service';
import { curriculumApi } from '../../services/curriculumApi.service';

const loadClassData = async () => {
  setIsLoading(true);
  try {
    // Load all data in parallel
    const [classInfo, schedule, students, assignments] = await Promise.all([
      classApiService.getClass(classId!),
      classApiService.getClassSchedule(classId!),
      classApiService.getClassStudents(classId!),
      classApiService.getClassAssignments(classId!),
    ]);

    // If schedule exists, load current and upcoming units
    let currentUnit = null;
    let upcomingUnits: any[] = [];
    if (schedule) {
      [currentUnit, upcomingUnits] = await Promise.all([
        classApiService.getCurrentUnit(schedule.id),
        classApiService.getUpcomingUnits(schedule.id, 3),
      ]);
    }

    // Load progress data
    const progressData = await classApiService.getClassProgress(classId!);

    setClassData({
      id: classInfo.id,
      name: classInfo.name,
      subject: classInfo.subject,
      gradeLevel: classInfo.gradeLevel,
      studentCount: students.length,
      schedule,
      currentUnit,
      upcomingUnits,
      students,
      assignments,
      progressData,
    });
  } catch (error) {
    console.error('Failed to load class data:', error);
  } finally {
    setIsLoading(false);
  }
};
```

#### 3. Connect StudentClassView
**File:** `socratit-wireframes/src/pages/student/StudentClassView.tsx`

**Replace mock data (lines 55-110):**

```typescript
import { curriculumApi } from '../../services/curriculumApi.service';

const loadClassData = async () => {
  setIsLoading(true);
  try {
    // This endpoint should return student-specific data
    const studentProgress = await curriculumApi.progress.getMyProgress(classId!);

    setClassData({
      classId: studentProgress.scheduleId,
      className: studentProgress.scheduleTitle,
      subject: studentProgress.classSubject,
      gradeLevel: studentProgress.classGradeLevel,
      schedule: studentProgress.schedule,
      currentUnit: studentProgress.currentUnit,
      allUnits: studentProgress.allUnits,
      myProgress: studentProgress.overallProgress,
      insights: studentProgress.insights,
      upcomingAssignments: studentProgress.upcomingAssignments,
    });
  } catch (error) {
    console.error('Failed to load class data:', error);
  } finally {
    setIsLoading(false);
  }
};
```

#### 4. Connect CurriculumManagementModal
**File:** `socratit-wireframes/src/components/class/CurriculumManagementModal.tsx`

**Replace mock data (lines 40-85):**

```typescript
import { curriculumApi } from '../services/curriculumApi.service';

const loadSchedule = async () => {
  setIsLoading(true);
  try {
    const [scheduleData, unitsData] = await Promise.all([
      curriculumApi.schedules.getSchedule(scheduleId),
      curriculumApi.units.getScheduleUnits(scheduleId),
    ]);

    setSchedule(scheduleData);
    setUnits(unitsData);
  } catch (error) {
    console.error('Failed to load schedule:', error);
  } finally {
    setIsLoading(false);
  }
};
```

### AWS Migration (Future)

**When ready to move to AWS S3:**

1. Install AWS SDK:
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

2. Update upload controller:
```typescript
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// In uploadCurriculumFile:
const key = `curriculum/${schoolId}/${filename}`;
await s3Client.send(new PutObjectCommand({
  Bucket: process.env.AWS_S3_BUCKET,
  Key: key,
  Body: req.file.buffer,
  ContentType: mimetype,
}));

// Store key in database instead of local filepath
filePath: key,
```

---

## 🎯 IMMEDIATE NEXT STEPS

### Priority 1: Make It Work with Existing Backend
1. ✅ Test file upload endpoint
2. ✅ Test Prisma schema is valid
3. ⏳ Extend class creation endpoint to support curriculum
4. ⏳ Connect ReviewClassStep to real APIs
5. ⏳ Test full class creation flow

### Priority 2: Connect Dashboards
1. ⏳ Connect ClassDashboard to APIs
2. ⏳ Connect StudentClassView to APIs
3. ⏳ Connect CurriculumManagementModal to APIs

### Priority 3: AI TA Integration
1. ⏳ Add curriculum modification to AI TA service
2. ⏳ Test AI chat refinement flow

### Priority 4: Templates
1. ⏳ Add Prisma schema for templates
2. ⏳ Create template service
3. ⏳ Add "Save as Template" button
4. ⏳ Add template selector in wizard

### Priority 5: ARIA Labels
1. ⏳ Add to Modal components
2. ⏳ Add to Wizard steps
3. ⏳ Add to Collapsible sections

---

## 📝 TESTING CHECKLIST

### File Upload
- [ ] Upload PDF file
- [ ] Upload DOCX file
- [ ] Verify file saved to disk
- [ ] Verify database record created
- [ ] Test file size limit (10MB)
- [ ] Test invalid file type rejection
- [ ] Test download endpoint

### Class Creation with Curriculum
- [ ] Create class without curriculum
- [ ] Create class with curriculum file
- [ ] Verify AI generation triggered
- [ ] Verify schedule created
- [ ] Verify units created
- [ ] Navigate to class dashboard

### Class Dashboard
- [ ] View with no curriculum
- [ ] View with curriculum schedule
- [ ] Expand/collapse sections
- [ ] Click "Manage Full Schedule"
- [ ] Navigate to assignments
- [ ] Navigate to roster

### Student View
- [ ] View current unit
- [ ] See upcoming assignments
- [ ] View personal insights
- [ ] Navigate to assignment

### AI TA Curriculum Editing
- [ ] Open AI assistant
- [ ] Send modification request
- [ ] Apply suggested changes
- [ ] Verify units updated

### Templates
- [ ] Save schedule as template
- [ ] View template list
- [ ] Apply template to new class
- [ ] Verify dates adjusted correctly

---

## 💡 KEY DECISIONS MADE

1. **File Storage**: Local filesystem now, AWS S3 later (easy migration path)
2. **Class Creation**: Extended to optionally create curriculum schedule in same transaction
3. **Templates**: JSON snapshot approach for flexibility
4. **AI Processing**: Immediate processing on upload, background job for heavy tasks
5. **Multi-tenancy**: All queries filtered by schoolId
6. **Optional Curriculum**: Classes can exist without schedules

---

## 📚 DOCUMENTATION TO UPDATE

1. API documentation (Swagger/OpenAPI)
2. Frontend service layer documentation
3. Component prop documentation (JSDoc)
4. Database schema diagram
5. Architecture decision records (ADRs)

---

## 🚀 DEPLOYMENT NOTES

### Environment Variables Needed

```env
# AWS (when migrating)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_S3_BUCKET=socratit-curriculum-files

# File Upload
MAX_FILE_SIZE=10485760  # 10MB in bytes
ALLOWED_FILE_TYPES=.pdf,.doc,.docx

# AI Processing
AI_TIMEOUT=300000  # 5 minutes
```

### Database Migration
```bash
cd socratit-backend
npx prisma migrate deploy
```

---

**Last Updated**: 2025-10-29
**Status**: Backend file upload complete, frontend services created, integration in progress
