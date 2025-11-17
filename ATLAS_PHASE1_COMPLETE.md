# Atlas Phase 1: Database Schema - COMPLETE ✅

## Summary

Phase 1 of the Atlas multi-year knowledge tracking system has been successfully implemented. All database models have been added to the Prisma schema and are ready for migration.

---

## What Was Implemented

### New Database Models Added

All models have been added to `socratit-backend/prisma/schema.prisma` starting at line 2284:

1. **ConceptTaxonomy** (lines 2294-2327)
   - Canonical concept definitions across all subjects and grades
   - Hierarchical structure (parent-child relationships)
   - Fuzzy matching aliases for concept name variations
   - Example: "Quadratic Equations" with aliases ["quadratics", "quadratic functions"]

2. **ConceptRelationship** (lines 2334-2356)
   - Semantic connections between concepts
   - Types: prerequisite, builds_upon, applied_in, related
   - Strength ratings (0-1) and AI confidence scores
   - Example: "Linear Equations" → (prerequisite) → "Quadratic Equations"

3. **StudentConceptMastery** (lines 2363-2410)
   - **Student-scoped** mastery tracking (NOT class-scoped)
   - Persists across all classes and years
   - Aggregate statistics: overall mastery %, attempts, correct/incorrect
   - JSON mastery history timeline
   - Graph visualization positions (x, y coordinates)
   - Example: Student's "Quadratic Equations" mastery tracked from 9th grade through 12th grade

4. **ClassConceptMastery** (lines 2417-2446)
   - Class-specific historical context
   - Links to StudentConceptMastery for multi-year view
   - Preserves: mastery at end of class, attempts in class, teacher notes
   - Example: "John's mastery of quadratics in Algebra I vs Algebra II"

5. **StudentLearningJourney** (lines 2453-2485)
   - Aggregate view of student's complete learning path
   - AI-identified knowledge gaps
   - Predicted future struggles
   - Graph visualization preferences
   - Example: "Student's 4-year journey through math curriculum"

6. **ConceptMilestone** (lines 2492-2516)
   - Tracks significant achievements
   - Types: FIRST_INTRODUCED, MASTERED, REMEDIATED, APPLIED_IN_NEW_CONTEXT
   - Links to specific assignments and classes
   - Example: "Mastered quadratic equations on 2023-11-15 in Algebra II"

7. **StudentGradeHistory** (lines 2523-2546)
   - Grade-to-grade progression tracking
   - Advancement status: PROMOTED, RETAINED, SKIPPED
   - Academic performance summary (GPA, attendance)
   - Example: "9th Grade (2022-2023) → 10th Grade (2023-2024)"

### Updated Existing Models

#### User Model (lines 249-252)
Added relations:
```prisma
studentConceptMasteries StudentConceptMastery[] @relation("StudentConceptMasteries")
learningJourney         StudentLearningJourney?
gradeHistory            StudentGradeHistory[]
```

#### School Model (lines 165-167)
Added relations:
```prisma
studentConceptMasteries StudentConceptMastery[]
learningJourneys        StudentLearningJourney[]
```

#### Class Model (lines 378-379)
Added relation:
```prisma
classConceptMasteries ClassConceptMastery[]
```

#### ClassEnrollment Model (lines 431-456)
Added history tracking fields:
```prisma
// Atlas - Enrollment History Tracking
enrollmentStartDate DateTime  @default(now())
enrollmentEndDate   DateTime?
isActive            Boolean   @default(true)
exitReason          String?   // "COMPLETED_COURSE", "TRANSFERRED", "DROPPED", "PROMOTED"

// Performance summary at end of enrollment
finalGrade        String?
finalGradePercent Float?

// New indexes for history queries
@@index([studentId, isActive])
@@index([studentId, enrollmentStartDate])
```

---

## How to Run the Migration

### Step 1: Install Dependencies

```bash
cd socratit-backend
npm install
```

This will install Prisma and all other backend dependencies.

### Step 2: Format the Schema

```bash
npx prisma format
```

This ensures consistent formatting across the schema file.

### Step 3: Validate the Schema

```bash
npx prisma validate
```

This checks for any syntax errors or relationship issues.

### Step 4: Create the Migration

```bash
npx prisma migrate dev --name add_atlas_knowledge_graph
```

This will:
- Generate SQL migration files
- Create all new tables in the database
- Add new columns to existing tables (ClassEnrollment)
- Add all foreign key relationships
- Create all indexes

**Expected output:**
```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "socratit_dev" at "localhost:5432"

Applying migration `20241116_add_atlas_knowledge_graph`

The following migration(s) have been created and applied:

migrations/
  └─ 20241116_add_atlas_knowledge_graph/
      └─ migration.sql

Your database is now in sync with your schema.

✔ Generated Prisma Client (v5.x.x) to ./node_modules/@prisma/client
```

### Step 5: Verify the Migration

```bash
npx prisma studio
```

Open Prisma Studio and verify all new tables exist:
- concept_taxonomy
- concept_relationships
- student_concept_mastery
- class_concept_mastery
- student_learning_journeys
- concept_milestones
- student_grade_history

Also verify that `class_enrollments` table has new columns:
- enrollment_start_date
- enrollment_end_date
- is_active
- exit_reason
- final_grade
- final_grade_percent

---

## Database Schema Overview

### Key Architectural Decisions

1. **Student-Scoped Mastery (Not Class-Scoped)**
   - Traditional: ConceptMastery tied to one class → data lost when student advances
   - Atlas: StudentConceptMastery follows student forever → lifelong knowledge tracking

2. **Canonical Concept Taxonomy**
   - Prevents duplicates ("quadratic equations" vs "quadratics")
   - Enables cross-class and cross-subject linking
   - Fuzzy matching via aliases

3. **Soft-Delete Enrollment History**
   - `isActive` flag instead of hard delete
   - Preserves learning context when students change classes
   - Can query: "Which classes did student take in 9th grade?"

4. **Optional Graph Positions**
   - Allow auto-layout initially
   - Save custom positions if teacher/student edits
   - Flexible for different visualization algorithms

5. **AI Confidence Scores**
   - Track reliability of AI-generated relationships
   - Teachers can review low-confidence connections
   - Continuous improvement of knowledge graph

### Data Model Diagram

```
┌─────────────────────┐
│  ConceptTaxonomy    │  (Canonical concepts)
│  - Quadratic Eq.    │
│  - Linear Eq.       │
│  - Fractions        │
└──────────┬──────────┘
           │
           │ 1:N (relationships)
           ↓
┌─────────────────────┐
│ ConceptRelationship │  (Semantic connections)
│  Linear → Quadratic │  (prerequisite)
│  Quadratic → Physics│  (applied_in)
└─────────────────────┘

┌─────────────────────┐
│        User         │  (Students)
│  - John Doe         │
│  - 10th Grade       │
└──────────┬──────────┘
           │
           │ 1:N (mastery per concept)
           ↓
┌─────────────────────┐
│StudentConceptMastery│  (Lifelong tracking)
│  - Quadratics: 87%  │
│  - First: 2022      │
│  - Last: 2024       │
└──────────┬──────────┘
           │
           │ 1:N (class contexts)
           ↓
┌─────────────────────┐
│ClassConceptMastery  │  (Historical per class)
│  - Algebra I: 75%   │
│  - Algebra II: 87%  │
└─────────────────────┘

┌─────────────────────┐
│StudentLearningJourney│ (Aggregate view)
│  - Gaps detected    │
│  - Predicted issues │
│  - Milestones       │
└──────────┬──────────┘
           │
           │ 1:N (achievements)
           ↓
┌─────────────────────┐
│  ConceptMilestone   │  (Key moments)
│  - Mastered 2023    │
│  - Remediated 2024  │
└─────────────────────┘
```

---

## Example Data Flow

### When Student Completes Assignment

```javascript
// 1. Student submits assignment with questions about "Quadratic Equations"
const submission = { /* ... */ };

// 2. Grading determines correctness
const results = gradeAssignment(submission);

// 3. Find or create ConceptTaxonomy entry
const concept = await prisma.conceptTaxonomy.upsert({
  where: { conceptName: "Quadratic Equations" },
  create: { conceptName: "Quadratic Equations", subject: "Mathematics", /* ... */ }
});

// 4. Update StudentConceptMastery (aggregate across ALL classes)
const studentMastery = await prisma.studentConceptMastery.upsert({
  where: {
    studentId_conceptId: {
      studentId: student.id,
      conceptId: concept.id
    }
  },
  update: {
    totalAttempts: { increment: results.totalQuestions },
    correctAttempts: { increment: results.correctQuestions },
    overallMasteryPercent: newMasteryPercent,
    masteryHistory: {
      push: [{
        date: new Date(),
        percent: newMasteryPercent,
        classId: currentClass.id,
        assignmentId: assignment.id,
        grade: submission.grade,
        event: 'ASSIGNMENT_GRADED'
      }]
    }
  }
});

// 5. Update ClassConceptMastery (this class only)
await prisma.classConceptMastery.upsert({
  where: {
    studentConceptMasteryId_classId: {
      studentConceptMasteryId: studentMastery.id,
      classId: currentClass.id
    }
  },
  update: {
    attemptsInClass: { increment: results.totalQuestions },
    correctInClass: { increment: results.correctQuestions },
    masteryPercent: classSpecificMastery
  }
});

// 6. Check for milestone achievements
if (newMasteryPercent >= 90 && previousMastery < 90) {
  await prisma.conceptMilestone.create({
    data: {
      journeyId: studentJourney.id,
      conceptId: concept.id,
      milestoneType: 'MASTERED',
      achievedDate: new Date(),
      achievedInClassId: currentClass.id,
      assignmentId: assignment.id
    }
  });
}

// 7. Emit WebSocket event for real-time Atlas update
io.to(`knowledge-graph-${student.id}`).emit('mastery-updated', {
  conceptId: concept.id,
  newMastery: newMasteryPercent
});
```

---

## Next Steps After Migration

### Phase 2: Backend Services & API (Weeks 3-4)

Create these files:

1. **`socratit-backend/src/services/knowledgeGraph.service.ts`**
   - `getStudentKnowledgeGraph(studentId, schoolId)` → Returns graph JSON
   - `getPrerequisiteChain(conceptId)` → Returns dependency tree
   - `identifyKnowledgeGaps(studentId, classId)` → Finds missing prerequisites
   - `updateNodePosition(studentId, conceptId, x, y)` → Saves graph layout

2. **`socratit-backend/src/services/aiKnowledgeGraph.service.ts`**
   - `generateConceptGraphFromCurriculum(text, subject, gradeLevel)` → AI extracts concepts
   - `findCrossSubjectConnections(conceptName)` → AI finds interdisciplinary links
   - `buildPrerequisiteGraph(concepts)` → AI determines dependencies

3. **`socratit-backend/src/routes/knowledgeGraph.routes.ts`**
   - `GET /api/v1/knowledge-graph/:studentId` → Get student graph
   - `GET /api/v1/knowledge-graph/concept/:conceptId/prerequisites` → Get chain
   - `GET /api/v1/knowledge-graph/gaps/:studentId/:classId` → Identify gaps
   - `POST /api/v1/knowledge-graph/generate` → AI-generate from curriculum
   - `PATCH /api/v1/knowledge-graph/node-position` → Update position

4. **Register routes in `app.ts`:**
   ```typescript
   import knowledgeGraphRoutes from './routes/knowledgeGraph.routes';
   app.use('/api/v1/knowledge-graph', knowledgeGraphRoutes);
   ```

### Phase 3: Frontend Components (Weeks 5-7)

1. **Install React Flow:**
   ```bash
   cd socratit-wireframes
   npm install reactflow
   npm install dagre  # For hierarchical layout
   ```

2. **Create Atlas page:**
   - `src/pages/student/Atlas.tsx`
   - Add to router: `<Route path="/student/atlas" element={<Atlas />} />`

3. **Create components:**
   - `src/components/atlas/KnowledgeGraphCanvas.tsx` (React Flow)
   - `src/components/atlas/ConceptNode.tsx` (Custom node)
   - `src/components/atlas/ConceptDetailPanel.tsx` (Sidebar)
   - `src/components/atlas/AtlasControls.tsx` (Filters)
   - `src/components/atlas/KnowledgeStats.tsx` (Progress cards)

4. **Add navigation:**
   - Update `Sidebar.tsx` to add Atlas link with Map icon
   - Position between "Grades" and "AI Tutor"

---

## Testing the Migration

### Manual Tests

1. **Create a concept:**
   ```sql
   INSERT INTO concept_taxonomy (id, concept_name, subject, grade_level, aliases)
   VALUES (
     gen_random_uuid(),
     'Quadratic Equations',
     'Mathematics',
     '9-10',
     ARRAY['quadratics', 'quadratic functions']
   );
   ```

2. **Create a relationship:**
   ```sql
   INSERT INTO concept_relationships (
     id, source_concept_id, target_concept_id, relationship_type, strength
   )
   VALUES (
     gen_random_uuid(),
     (SELECT id FROM concept_taxonomy WHERE concept_name = 'Linear Equations'),
     (SELECT id FROM concept_taxonomy WHERE concept_name = 'Quadratic Equations'),
     'prerequisite',
     0.95
   );
   ```

3. **Create student mastery:**
   ```sql
   INSERT INTO student_concept_mastery (
     id, student_id, school_id, concept_id,
     overall_mastery_percent, overall_mastery_level
   )
   VALUES (
     gen_random_uuid(),
     '<student-uuid>',
     '<school-uuid>',
     (SELECT id FROM concept_taxonomy WHERE concept_name = 'Quadratic Equations'),
     75.0,
     'PROFICIENT'
   );
   ```

### Query Tests

1. **Get student's all-time mastery:**
   ```sql
   SELECT
     ct.concept_name,
     scm.overall_mastery_percent,
     scm.overall_mastery_level,
     scm.first_assessed,
     scm.last_assessed
   FROM student_concept_mastery scm
   JOIN concept_taxonomy ct ON scm.concept_id = ct.id
   WHERE scm.student_id = '<student-uuid>'
   ORDER BY scm.last_assessed DESC;
   ```

2. **Get concept with prerequisites:**
   ```sql
   SELECT
     ct.concept_name,
     cr.relationship_type,
     prereq.concept_name as prerequisite_name
   FROM concept_taxonomy ct
   LEFT JOIN concept_relationships cr ON ct.id = cr.target_concept_id
   LEFT JOIN concept_taxonomy prereq ON cr.source_concept_id = prereq.id
   WHERE ct.concept_name = 'Quadratic Equations';
   ```

3. **Get student's learning journey:**
   ```sql
   SELECT
     cm.milestone_type,
     cm.achieved_date,
     ct.concept_name,
     c.name as class_name
   FROM concept_milestones cm
   JOIN concept_taxonomy ct ON cm.concept_id = ct.id
   JOIN student_learning_journeys slj ON cm.journey_id = slj.id
   LEFT JOIN classes c ON cm.achieved_in_class_id = c.id
   WHERE slj.student_id = '<student-uuid>'
   ORDER BY cm.achieved_date DESC;
   ```

---

## Troubleshooting

### Issue: Migration fails with "relation already exists"

**Solution:** Drop and recreate the database (DEVELOPMENT ONLY):
```bash
npx prisma migrate reset
```

### Issue: Foreign key constraint errors

**Solution:** Check that User, School, and Class records exist before creating Atlas records.

### Issue: "Column already exists" error

**Solution:** The migration may have partially run. Check existing tables:
```sql
\d+ class_enrollments
```

If new columns exist, skip to validating with Prisma Studio.

---

## Summary

✅ **All Atlas database models implemented**
✅ **Existing models updated with relations**
✅ **ClassEnrollment enhanced with history tracking**
✅ **Schema ready for migration**

**Next Action:** Run `npm install && npx prisma migrate dev --name add_atlas_knowledge_graph`

**Documentation:** See [mindmap_plans.md](./mindmap_plans.md) for comprehensive reference

---

*Atlas Phase 1 completed on 2024-11-16*
