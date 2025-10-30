# Curriculum Enhancement Plan
## Enterprise-Quality Implementation with Apple Glass UI

---

## Overview
Building out complete curriculum viewing system for both teachers and students with:
- ✅ Unit details modal (expandable topics, objectives, assignments)
- 📝 Student curriculum view
- 📊 Progress tracking
- 🎨 Apple glassmorphic UI throughout

---

## Components to Build

### 1. UnitDetailsModal ✅ CREATED
**Location:** `src/components/curriculum/UnitDetailsModal.tsx`
**Features:**
- Glass UI with backdrop blur
- Expandable sections (topics, objectives, concepts, assessments)
- Difficulty visualization
- Progress tracking display
- Date range and time estimates
- Responsive design

### 2. Update ClassDashboard to Use UnitDetailsModal
**Location:** `src/pages/teacher/ClassDashboard.tsx`
**Changes Needed:**
```typescript
// Add state
const [selectedUnit, setSelectedUnit] = useState<CurriculumUnit | null>(null);
const [showUnitDetails, setShowUnitDetails] = useState(false);

// Update onUnitClick handler
const handleUnitClick = (unit: CurriculumUnit) => {
  setSelectedUnit(unit);
  setShowUnitDetails(true);
};

// Add modal
<UnitDetailsModal
  unit={selectedUnit}
  isOpen={showUnitDetails}
  onClose={() => setShowUnitDetails(false)}
  userRole="teacher"
/>
```

### 3. StudentCurriculumView Component
**Location:** `src/pages/student/StudentCurriculumView.tsx`
**Features:**
- Similar to teacher view but read-only
- Show only PUBLISHED schedules
- Display student's personal progress per unit
- Highlight current unit
- Show upcoming units
- Click to see unit details

### 4. Backend: Publish/Unpublish Schedule
**Location:** `src/controllers/curriculumSchedule.controller.ts`
**Endpoint:** Already exists at `POST /curriculum-schedules/:scheduleId/publish`
**Frontend Integration Needed:** Add button in CurriculumManagementModal

###5. Backend: Progress Tracking Endpoints
**Endpoints to verify/create:**
- `GET /curriculum-schedules/:scheduleId/progress` - Get overall schedule progress
- `GET /curriculum-units/:unitId/progress` - Get unit progress
- `POST /curriculum-units/:unitId/complete` - Mark unit as complete
- `PATCH /curriculum-units/:unitId/progress` - Update unit progress percentage

### 6. Frontend: Progress Tracking Service
**Location:** `src/services/progressApi.service.ts`
**Functions:**
```typescript
- getScheduleProgress(scheduleId): Promise<ScheduleProgress>
- getUnitProgress(unitId): Promise<UnitProgress>
- updateUnitProgress(unitId, percent): Promise<void>
- completeUnit(unitId): Promise<void>
```

### 7. Enhanced CurriculumSection Component
**Location:** `src/components/class/CurriculumSection.tsx`
**Updates:**
- Add "Publish Schedule" button for teachers
- Show publish status badge
- Pass unit click handler to open UnitDetailsModal

---

## Implementation Order

### Phase 1: Unit Details Modal ✅ DONE
- [x] Create UnitDetailsModal component
- [ ] Integrate into ClassDashboard
- [ ] Integrate into CurriculumSection
- [ ] Test with real data

### Phase 2: Student View
- [ ] Create StudentCurriculumView page
- [ ] Add route in App.tsx
- [ ] Create StudentUnitCard component
- [ ] Add to student sidebar navigation

### Phase 3: Progress Tracking Backend
- [ ] Verify existing endpoints
- [ ] Create missing endpoints
- [ ] Add progress calculation logic
- [ ] Test API responses

### Phase 4: Progress Tracking Frontend
- [ ] Create progressApi.service.ts
- [ ] Add progress hooks
- [ ] Integrate progress updates in assignment completion
- [ ] Update UI to show real-time progress

### Phase 5: Publish/Unpublish Feature
- [ ] Add publish button to CurriculumManagementModal
- [ ] Create publishSchedule API function
- [ ] Add unpublish functionality
- [ ] Show publish status badge

### Phase 6: Polish & Testing
- [ ] Test entire flow end-to-end
- [ ] Verify glass UI on all screen sizes
- [ ] Test accessibility (keyboard navigation, screen readers)
- [ ] Performance optimization

---

## UI/UX Guidelines

### Glass Effect Standards
```css
background: rgba(255, 255, 255, 0.95);
backdrop-filter: blur(12px);
border: 1px solid rgba(255, 255, 255, 0.2);
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
```

### Color Palette
- Primary: Blue-Purple gradient (`from-blue-500 to-purple-600`)
- Success: Green (`from-green-500 to-emerald-600`)
- Warning: Orange (`from-orange-500 to-amber-600`)
- Error: Red (`from-red-500 to-rose-600`)
- Info: Cyan (`from-cyan-500 to-blue-600`)

### Animation Standards
- Modal entrance: Spring animation with damping 25, stiffness 300
- Section expand/collapse: 200ms ease
- Hover effects: 150ms ease
- Progress bars: 1s cubic-bezier(0.4, 0, 0.2, 1)

---

## Database Schema Reference

### CurriculumUnit Table
```typescript
{
  id: string;
  scheduleId: string;
  title: string; // AI-generated from curriculum
  description: string;
  unitNumber: number;
  orderIndex: number;
  startDate: Date;
  endDate: Date;
  estimatedWeeks: number;
  estimatedHours: number;
  difficultyLevel: 1-5;
  difficultyReasoning: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  topics: JSON; // Array of topic objects with subtopics
  learningObjectives: string[];
  concepts: string[];
  suggestedAssessments: JSON;
  aiGenerated: boolean;
  aiConfidence: number;
  percentComplete: number;
}
```

---

## Testing Checklist

### Teacher Features
- [ ] Can view unit details in modal
- [ ] Can expand/collapse sections
- [ ] Can publish schedule
- [ ] Can see student progress
- [ ] Modal is keyboard accessible

### Student Features
- [ ] Can view published schedules only
- [ ] Can see their own progress
- [ ] Can view unit details
- [ ] Can't see unpublished content
- [ ] Progress updates when assignments completed

### UI/UX
- [ ] Glass effect renders correctly on all browsers
- [ ] Animations are smooth (60fps)
- [ ] Responsive on mobile, tablet, desktop
- [ ] Dark mode compatible (future)
- [ ] Accessible (WCAG 2.1 AA)

---

## Next Steps

1. Finish integrating UnitDetailsModal into ClassDashboard
2. Create student view page
3. Build progress tracking system
4. Add publish/unpublish feature
5. Test everything end-to-end

This document will be updated as features are completed.
