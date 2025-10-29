# Curriculum Mapping - Remaining Implementation Steps

## Current Status: Phase 2 Complete ✅
- ✅ Database schema (4 models, 6 enums)
- ✅ AI service enhancements (3 new methods)
- ✅ TypeScript types (340+ lines)
- ✅ Schedule service (640+ lines)

---

## Remaining Steps - Detailed Breakdown

### **PHASE 3: Backend API Completion** (4-6 hours)

#### Step 1: Curriculum Unit Service ⏳
**File:** `src/services/curriculumUnit.service.ts`
**Estimate:** 1.5 hours

Methods to implement:
- [  ] `createUnit()` - Create custom unit manually
- [  ] `updateUnit()` - Update unit details (dates, topics, difficulty)
- [  ] `deleteUnit()` - Soft delete unit
- [  ] `getUnitById()` - Retrieve single unit with details
- [  ] `getUnitsBySchedule()` - Get all units for a schedule
- [  ] `reorderUnits()` - Bulk reorder for drag-and-drop
- [  ] `getUnitProgress()` - Teacher view of all student progress
- [  ] `getSuggestedAssignments()` - AI suggestions for unit assessments

#### Step 2: Unit Progress Service ⏳
**File:** `src/services/unitProgress.service.ts`
**Estimate:** 1 hour

Methods to implement:
- [  ] `getStudentProgress()` - Student's progress across all units
- [  ] `calculateUnitProgress()` - Calculate progress for one unit/student
- [  ] `updateProgressOnSubmission()` - Triggered by assignment submission
- [  ] `identifyStrengths()` - Concepts student excels at
- [  ] `identifyStruggles()` - Concepts student struggles with
- [  ] `recommendReview()` - Topics needing additional practice

#### Step 3: Validation Schemas ⏳
**File:** `src/validators/curriculumSchedule.validator.ts`
**Estimate:** 45 minutes

Validators to create:
- [  ] `createScheduleSchema` - Validate schedule creation
- [  ] `updateScheduleSchema` - Validate schedule updates
- [  ] `generateScheduleSchema` - Validate AI generation request
- [  ] `refineScheduleSchema` - Validate AI refinement request
- [  ] `createUnitSchema` - Validate unit creation
- [  ] `updateUnitSchema` - Validate unit updates
- [  ] `reorderUnitsSchema` - Validate bulk reorder request

#### Step 4: Schedule Controller ⏳
**File:** `src/controllers/curriculumSchedule.controller.ts`
**Estimate:** 1 hour

Endpoints to implement:
- [  ] `POST /api/v1/curriculum-schedules` - Create schedule
- [  ] `GET /api/v1/curriculum-schedules/:id` - Get schedule
- [  ] `PATCH /api/v1/curriculum-schedules/:id` - Update schedule
- [  ] `DELETE /api/v1/curriculum-schedules/:id` - Delete schedule
- [  ] `POST /api/v1/curriculum-schedules/:id/generate-from-ai` - AI generate
- [  ] `POST /api/v1/curriculum-schedules/:id/ai-refine` - AI refine
- [  ] `GET /api/v1/curriculum-schedules/:id/ai-suggestions` - AI suggestions
- [  ] `POST /api/v1/curriculum-schedules/:id/publish` - Publish schedule

#### Step 5: Unit Controller ⏳
**File:** `src/controllers/curriculumUnit.controller.ts`
**Estimate:** 1 hour

Endpoints to implement:
- [  ] `POST /api/v1/curriculum-units` - Create unit
- [  ] `GET /api/v1/curriculum-units/:id` - Get unit
- [  ] `PATCH /api/v1/curriculum-units/:id` - Update unit
- [  ] `DELETE /api/v1/curriculum-units/:id` - Delete unit
- [  ] `POST /api/v1/curriculum-units/reorder` - Bulk reorder
- [  ] `GET /api/v1/curriculum-units/:id/progress` - Get unit progress
- [  ] `GET /api/v1/curriculum-units/:id/suggested-assignments` - AI suggestions

#### Step 6: API Routes ⏳
**Files:** `src/routes/curriculumSchedule.routes.ts`, `src/routes/curriculumUnit.routes.ts`
**Estimate:** 30 minutes

Tasks:
- [  ] Define all schedule routes with middleware
- [  ] Define all unit routes with middleware
- [  ] Apply authentication middleware
- [  ] Apply validation middleware
- [  ] Apply rate limiting
- [  ] Add to main app.ts router

#### Step 7: Assignment Enhancement ⏳
**File:** `src/controllers/assignment.controller.ts` (enhancement)
**Estimate:** 30 minutes

Tasks:
- [  ] Add `curriculumUnitId` field to create assignment endpoint
- [  ] Auto-suggest due date based on unit schedule
- [  ] Link assignment to unit on creation
- [  ] Update progress calculation to include unit progress

---

### **PHASE 4: Frontend Foundation** (3-4 hours)

#### Step 8: Install Frontend Dependencies ⏳
**Estimate:** 15 minutes

Packages to install:
- [  ] `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
- [  ] `npm install react-big-calendar`
- [  ] `npm install date-fns`
- [  ] `npm install react-calendar-timeline`

#### Step 9: Frontend TypeScript Types ⏳
**File:** `socratit-wireframes/src/types/curriculum.types.ts`
**Estimate:** 30 minutes

Types to create:
- [  ] Match all backend request/response types
- [  ] Add UI-specific types (view modes, drag state, etc.)
- [  ] Component prop types
- [  ] Hook return types

#### Step 10: Frontend API Service ⏳
**File:** `socratit-wireframes/src/services/curriculumSchedule.service.ts`
**Estimate:** 1 hour

API methods to implement:
- [  ] `createSchedule()` - POST schedule
- [  ] `getSchedule()` - GET schedule
- [  ] `updateSchedule()` - PATCH schedule
- [  ] `deleteSchedule()` - DELETE schedule
- [  ] `generateScheduleFromAI()` - POST AI generation
- [  ] `refineScheduleWithAI()` - POST AI refinement
- [  ] `publishSchedule()` - POST publish
- [  ] `createUnit()` - POST unit
- [  ] `updateUnit()` - PATCH unit
- [  ] `deleteUnit()` - DELETE unit
- [  ] `reorderUnits()` - POST bulk reorder
- [  ] `getUnitProgress()` - GET progress

#### Step 11: Base UI Components ⏳
**Estimate:** 2 hours

Components to create:
- [  ] `UnitCard.tsx` - Display unit information
- [  ] `DifficultyBadge.tsx` - Show difficulty level (1-5)
- [  ] `ProgressBar.tsx` - Visual progress indicator
- [  ] `ProgressRing.tsx` - Circular progress (percentage)
- [  ] `StatusBadge.tsx` - Unit status indicator
- [  ] `DateRangePicker.tsx` - Select start/end dates
- [  ] `TopicsList.tsx` - Display topics and subtopics
- [  ] `ConceptBadges.tsx` - Display concept tags

---

### **PHASE 5: Class Creation Wizard** (6-8 hours)

#### Step 12: Wizard State Management ⏳
**File:** `socratit-wireframes/src/hooks/useCreateClassWizard.ts`
**Estimate:** 1 hour

Hook to manage:
- [  ] Multi-step form state
- [  ] Validation per step
- [  ] Navigation (next, back, jump to step)
- [  ] File upload state
- [  ] AI generation state
- [  ] Schedule adjustment state

#### Step 13: Wizard Step 1 - Basic Info ⏳
**File:** `socratit-wireframes/src/components/class/wizard/Step1BasicInfo.tsx`
**Estimate:** 30 minutes

Fields:
- [  ] Class name
- [  ] Subject
- [  ] Grade level
- [  ] Academic year

#### Step 14: Wizard Step 2 - School Year ⏳
**File:** `socratit-wireframes/src/components/class/wizard/Step2SchoolYear.tsx`
**Estimate:** 1 hour

Features:
- [  ] Start date picker
- [  ] End date picker
- [  ] Meeting pattern selector
- [  ] Visual preview (weeks, days calculated)
- [  ] Validation (start < end)

#### Step 15: Wizard Step 3 - Curriculum Upload ⏳
**File:** `socratit-wireframes/src/components/class/wizard/Step3CurriculumUpload.tsx`
**Estimate:** 1.5 hours

Features:
- [  ] Drag-and-drop file upload zone
- [  ] File preview (name, size, type)
- [  ] Title and description inputs
- [  ] "Analyze with AI" button
- [  ] Loading animation during processing
- [  ] Results preview (units count, topics)

#### Step 16: Wizard Step 4 - AI Generation ⏳
**File:** `socratit-wireframes/src/components/class/wizard/Step4AIGeneration.tsx`
**Estimate:** 1 hour

Features:
- [  ] Loading animation ("AI is creating your schedule...")
- [  ] Progress steps (analyzing, extracting, estimating...)
- [  ] Success state with preview
- [  ] Unit cards preview (first 3 units)
- [  ] Statistics (total units, weeks, difficulty)
- [  ] "Regenerate" option

#### Step 17: Wizard Step 5 - Schedule Adjustment ⏳
**File:** `socratit-wireframes/src/components/class/wizard/Step5ScheduleAdjustment.tsx`
**Estimate:** 2 hours

Features:
- [  ] Three view mode toggle (Timeline/Calendar/Cards)
- [  ] Timeline view implementation (basic)
- [  ] Calendar view implementation (basic)
- [  ] Unit cards view implementation (basic)
- [  ] Edit unit modal
- [  ] Add custom unit button
- [  ] "Continue" button

#### Step 18: Wizard Step 6 - Review ⏳
**File:** `socratit-wireframes/src/components/class/wizard/Step6Review.tsx`
**Estimate:** 30 minutes

Features:
- [  ] Summary of all details
- [  ] Schedule overview
- [  ] Statistics
- [  ] "Go Back" button
- [  ] "Create Class & Publish Schedule" button

---

### **PHASE 6: Advanced Schedule Views** (8-10 hours)

#### Step 19: Timeline View Component ⏳
**File:** `socratit-wireframes/src/components/curriculum/CurriculumTimelineView.tsx`
**Estimate:** 3 hours

Features:
- [  ] Horizontal gantt-style layout
- [  ] Week labels header
- [  ] Unit bars with colors by difficulty
- [  ] Drag to adjust dates
- [  ] Current week indicator
- [  ] Zoom controls
- [  ] Progress overlays

#### Step 20: Calendar View Component ⏳
**File:** `socratit-wireframes/src/components/curriculum/CurriculumCalendarView.tsx`
**Estimate:** 2 hours

Features:
- [  ] Integrate react-big-calendar
- [  ] Display units as events
- [  ] Color-code by difficulty
- [  ] Click to edit
- [  ] Drag to reschedule
- [  ] Show assignments on due dates

#### Step 21: Unit Cards View Component ⏳
**File:** `socratit-wireframes/src/components/curriculum/CurriculumUnitCardsList.tsx`
**Estimate:** 2 hours

Features:
- [  ] Vertical list of expandable cards
- [  ] Drag handles for reordering
- [  ] Expand/collapse animations
- [  ] Edit inline
- [  ] Delete with confirmation
- [  ] Add unit button

#### Step 22: Drag-and-Drop Implementation ⏳
**File:** Multiple components
**Estimate:** 3 hours

Tasks:
- [  ] Setup @dnd-kit contexts
- [  ] Implement drag for timeline bars
- [  ] Implement drag for unit cards
- [  ] Visual feedback during drag
- [  ] Drop zones and validation
- [  ] Optimistic UI updates
- [  ] API sync on drop

---

### **PHASE 7: AI Chat Assistant** (4-5 hours)

#### Step 23: AI Chat Component ⏳
**File:** `socratit-wireframes/src/components/curriculum/AIScheduleAssistant.tsx`
**Estimate:** 3 hours

Features:
- [  ] Slide-over panel
- [  ] Chat message list
- [  ] Message input
- [  ] Send button
- [  ] Typing indicator
- [  ] Suggestion cards
- [  ] "Apply Change" buttons
- [  ] "Apply All" button
- [  ] Quick action buttons

#### Step 24: Streaming AI Responses ⏳
**File:** `socratit-wireframes/src/hooks/useAIChat.ts`
**Estimate:** 2 hours

Features:
- [  ] WebSocket or SSE connection
- [  ] Token-by-token rendering
- [  ] Message history management
- [  ] Error handling
- [  ] Retry logic

---

### **PHASE 8: Class Dashboard Integration** (3-4 hours)

#### Step 25: Dashboard Curriculum Panel ⏳
**File:** `socratit-wireframes/src/pages/teacher/ClassDashboard.tsx` (enhancement)
**Estimate:** 2 hours

Features:
- [  ] Compact curriculum panel at top
- [  ] Current unit highlight
- [  ] Progress bar
- [  ] Mini timeline
- [  ] "Upcoming" preview
- [  ] "Edit Schedule" button

#### Step 26: Full Schedule View Page ⏳
**File:** `socratit-wireframes/src/pages/teacher/CurriculumScheduleFull.tsx`
**Estimate:** 2 hours

Features:
- [  ] Full-screen schedule view
- [  ] View mode selector
- [  ] Filter controls
- [  ] Zoom controls
- [  ] Sidebar with stats
- [  ] Quick actions
- [  ] Export button

---

### **PHASE 9: Student View** (4-5 hours)

#### Step 27: Student Dashboard Enhancement ⏳
**File:** `socratit-wireframes/src/pages/student/ClassDashboard.tsx` (enhancement)
**Estimate:** 2 hours

Features:
- [  ] Curriculum progress panel
- [  ] Current unit card
- [  ] Overall progress ring
- [  ] Vertical timeline preview
- [  ] "View Full Schedule" link

#### Step 28: Student Full Schedule View ⏳
**File:** `socratit-wireframes/src/pages/student/CurriculumSchedule.tsx`
**Estimate:** 2 hours

Features:
- [  ] Complete year roadmap
- [  ] Vertical timeline (mobile-friendly)
- [  ] Progress indicators per unit
- [  ] Locked future units
- [  ] Completed units (grayed)
- [  ] Current unit (highlighted)
- [  ] Strengths and struggles display

#### Step 29: Unit Detail View ⏳
**File:** `socratit-wireframes/src/pages/student/UnitDetail.tsx`
**Estimate:** 1 hour

Features:
- [  ] Unit overview
- [  ] Topics and subtopics
- [  ] Learning objectives
- [  ] Progress breakdown
- [  ] Associated assignments
- [  ] Recommended review areas

---

### **PHASE 10: Assignment Enhancement** (2-3 hours)

#### Step 30: Assignment Creation Enhancement ⏳
**File:** `socratit-wireframes/src/pages/teacher/CreateAssignment.tsx` (enhancement)
**Estimate:** 1.5 hours

Features:
- [  ] Unit selector dropdown
- [  ] Auto-suggest due date
- [  ] "Generate from Unit" button
- [  ] AI generation with unit context
- [  ] Unit info preview

#### Step 31: Assignment List Filtering ⏳
**File:** `socratit-wireframes/src/pages/teacher/Assignments.tsx` (enhancement)
**Estimate:** 30 minutes

Features:
- [  ] Filter by unit
- [  ] Group by unit
- [  ] Show unit name on cards
- [  ] Unit progress indicator

#### Step 32: Grading Enhancement ⏳
**File:** Multiple files
**Estimate:** 1 hour

Features:
- [  ] Update unit progress on grade submission
- [  ] Trigger progress recalculation
- [  ] Show unit progress in gradebook

---

### **PHASE 11: Polish & Optimization** (4-5 hours)

#### Step 33: Loading States ⏳
**Estimate:** 1 hour

Tasks:
- [  ] Skeleton loaders for schedule views
- [  ] Loading spinners for AI generation
- [  ] Shimmer effects for data loading
- [  ] Progress bars for file uploads

#### Step 34: Error Handling ⏳
**Estimate:** 1 hour

Tasks:
- [  ] Error boundaries
- [  ] User-friendly error messages
- [  ] Retry mechanisms
- [  ] Fallback UI states

#### Step 35: Empty States ⏳
**Estimate:** 30 minutes

Tasks:
- [  ] "No curriculum yet" state
- [  ] "No units" state
- [  ] "AI generation failed" state
- [  ] Helpful CTAs and guidance

#### Step 36: Responsive Design ⏳
**Estimate:** 1.5 hours

Tasks:
- [  ] Mobile breakpoints
- [  ] Tablet layouts
- [  ] Touch-friendly interactions
- [  ] Collapsible sidebars

#### Step 37: Accessibility ⏳
**Estimate:** 1 hour

Tasks:
- [  ] Keyboard navigation
- [  ] ARIA labels
- [  ] Focus management
- [  ] Screen reader support
- [  ] Color contrast validation

---

### **PHASE 12: Testing & Documentation** (3-4 hours)

#### Step 38: Backend Unit Tests ⏳
**Estimate:** 2 hours

Tests to write:
- [  ] Schedule service tests
- [  ] Unit service tests
- [  ] Progress calculation tests
- [  ] Date utility tests
- [  ] AI service mocks

#### Step 39: Integration Tests ⏳
**Estimate:** 1 hour

Tests to write:
- [  ] Schedule creation flow
- [  ] AI generation flow
- [  ] Unit CRUD operations
- [  ] Progress tracking

#### Step 40: E2E Test ⏳
**Estimate:** 1 hour

Test to write:
- [  ] Complete class creation with curriculum
- [  ] Schedule adjustment workflow
- [  ] Student progress tracking

---

## Summary Statistics

### Total Remaining Steps: 40
### Total Estimated Time: 50-65 hours

### Breakdown by Phase:
- **Phase 3 - Backend API:** 4-6 hours (7 steps)
- **Phase 4 - Frontend Foundation:** 3-4 hours (4 steps)
- **Phase 5 - Class Creation Wizard:** 6-8 hours (7 steps)
- **Phase 6 - Advanced Views:** 8-10 hours (4 steps)
- **Phase 7 - AI Chat:** 4-5 hours (2 steps)
- **Phase 8 - Dashboard Integration:** 3-4 hours (2 steps)
- **Phase 9 - Student View:** 4-5 hours (3 steps)
- **Phase 10 - Assignment Enhancement:** 2-3 hours (3 steps)
- **Phase 11 - Polish:** 4-5 hours (5 steps)
- **Phase 12 - Testing:** 3-4 hours (3 steps)

### Priority Order:
1. **Phase 3** - Complete backend API (required for everything else)
2. **Phase 4** - Frontend foundation (types, services)
3. **Phase 5** - Basic wizard (minimal viable workflow)
4. **Phase 6** - Advanced views (drag-and-drop, beautiful UI)
5. **Phase 7-12** - Enhanced features and polish

---

## Next Session Plan

### Immediate Focus (Next 4-6 hours):
1. ✅ Complete Phase 3 (Backend API)
2. ✅ Complete Phase 4 (Frontend Foundation)
3. ✅ Start Phase 5 (Basic wizard steps 1-3)

### Goal for Session:
- Working end-to-end flow: Create class → Upload curriculum → AI generates schedule
- Basic schedule viewing
- Edit capability

After this session, 60% of functionality will be complete! 🚀
