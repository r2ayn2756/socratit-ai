# Curriculum Integration Implementation Plan

## 🎯 Overview

Integrate curriculum mapping into the class workflow with Apple-esque clean UI.

---

## 📋 Implementation Plan

### Phase 1: Class Creation Wizard Redesign ✨

**Rebuild class creation as a beautiful modal/window with steps:**

1. **Step 1: Class Details**
   - Class name
   - Subject (dropdown)
   - Grade level
   - Description
   - Apple-style input fields with glass morphism

2. **Step 2: School Year & Schedule**
   - School year start date (date picker)
   - School year end date (date picker)
   - Meeting pattern (Daily, MWF, TTh, etc.)
   - Visual date range preview

3. **Step 3: Curriculum Upload (Optional)**
   - Drag-and-drop file upload
   - PDF/DOCX support
   - File preview
   - Skip option available

4. **Step 4: AI Schedule Generation (If curriculum uploaded)**
   - AI generates year-long schedule
   - Shows preview of units
   - Preferences (pacing, target units)
   - Loading animation

5. **Step 5: Review & Finalize**
   - Summary of class
   - Curriculum schedule preview (if created)
   - Edit buttons
   - Create class button

**Components to Create:**
- `ClassCreationWizard.tsx` - Main wizard container
- `ClassDetailsStep.tsx` - Step 1
- `SchoolYearStep.tsx` - Step 2
- `CurriculumUploadStep.tsx` - Step 3
- `AIScheduleStep.tsx` - Step 4
- `ReviewClassStep.tsx` - Step 5

---

### Phase 2: Class Dashboard View 📊

**Redesign class view as dashboard with sections:**

#### Header Section
```
┌────────────────────────────────────────────┐
│ 8th Grade Math - Period 2        [Edit]   │
│ 28 students · 8 units · 75% progress      │
└────────────────────────────────────────────┘
```

#### Quick Stats Cards (Glass morphism)
```
[📊 Students] [📚 Units] [📝 Assignments] [📈 Avg Score]
```

#### Main Content - Collapsible Sections

**1. 📚 Curriculum Schedule (Expanded by default)**
- Current unit card (highlighted)
- Mini timeline (click to expand full view)
- Quick unit cards (next 3 units)
- [Manage Full Schedule] button → Opens full curriculum dashboard modal

**2. 👥 Class Roster (Collapsible)**
- Student list with avatars
- Enrollment status
- Quick actions
- [View Full Roster] button

**3. 📝 Recent Assignments (Collapsible)**
- Last 5 assignments
- Due dates
- Submission stats
- [Create Assignment] button

**4. 📊 Progress Overview (Collapsible)**
- Class average progress
- Struggling students alert
- Top performers
- [View Analytics] button

**Components to Create:**
- `ClassDashboard.tsx` - Main dashboard
- `ClassHeader.tsx` - Header with stats
- `CurriculumSection.tsx` - Curriculum display
- `RosterSection.tsx` - Roster in dashboard
- `AssignmentsSection.tsx` - Assignments display
- `ProgressSection.tsx` - Progress summary
- `CollapsibleSection.tsx` - Reusable collapsible wrapper

---

### Phase 3: Full Curriculum Management Modal 🎨

**When clicking "Manage Full Schedule":**

Opens a full-screen modal/drawer with tabs:

**Tabs:**
1. **Units (Cards View)** - SortableUnitGrid with drag-and-drop
2. **Timeline** - Visual calendar timeline
3. **AI Assistant** - Chat interface for adjustments

**Components to Use (Already Created):**
- `SortableUnitGrid.tsx` ✅
- `Timeline.tsx` ✅
- `AIChatAssistant.tsx` ✅

**New Component:**
- `CurriculumManagementModal.tsx` - Modal wrapper with tabs

---

### Phase 4: Student Class View 📚

**When student opens a class:**

#### Header
```
┌────────────────────────────────────────────┐
│ 8th Grade Math - Period 2                 │
│ Your Progress: 75% · 6/8 units completed  │
└────────────────────────────────────────────┘
```

#### Current Unit Focus (Hero Section)
- Large card for current unit
- Progress bars
- Learning objectives
- Assignments for this unit

#### Year Overview
- Visual timeline with all units
- Progress indicators per unit
- Click unit to see details

#### Upcoming Assignments
- Next 5 assignments
- Due dates
- Unit association

#### Personal Insights (Glass cards)
- Strengths
- Areas to improve
- Recommended review

**Components to Use:**
- `StudentProgressDashboard.tsx` ✅ (adapt for single class)
- `Timeline.tsx` ✅
- `ProgressBar.tsx` ✅
- `CircularProgress.tsx` ✅

**New Component:**
- `StudentClassView.tsx` - Student's class dashboard

---

### Phase 5: Routing & Navigation Updates 🗺️

**Remove:**
- ❌ `/teacher/curriculum` route
- ❌ `CurriculumManagement.tsx` page

**Add:**
- ✅ `/teacher/classes/:classId` - Main class dashboard
- ✅ `/teacher/classes/new` - Enhanced wizard modal
- ✅ `/student/classes/:classId` - Student class view

**Update:**
- Navigation menu
- Breadcrumbs
- Class list cards to link to dashboard

---

## 🎨 Design System Requirements

### Apple-Esque Clean UI Guidelines

**1. Glass Morphism Throughout**
```css
background: rgba(255, 255, 255, 0.7);
backdrop-filter: blur(20px);
border-radius: 16px;
```

**2. Smooth Animations**
- All transitions: 300ms cubic-bezier(0.4, 0, 0.2, 1)
- Hover effects: scale(1.02)
- Loading states with skeleton screens

**3. Color Palette**
- Primary: Blue gradients (from-blue-400 to-blue-600)
- Success: Green (from-green-400 to-green-600)
- Warning: Orange (from-orange-400 to-orange-600)
- Neutral: White/gray with high contrast

**4. Typography**
- Headings: Bold, clear hierarchy
- Body: 14-16px, readable
- Use system fonts: -apple-system, sans-serif

**5. Spacing**
- Generous whitespace
- 8px grid system
- Padding: 16px, 24px, 32px

**6. Interactive Elements**
- Buttons: Rounded (12px), shadow on hover
- Cards: Rounded (16px), subtle shadow
- Inputs: Rounded (12px), focus ring

---

## 📁 File Structure

```
src/
├── pages/
│   ├── teacher/
│   │   ├── ClassDashboard.tsx (NEW - replaces ClassRoster)
│   │   ├── ClassCreationWizard/ (NEW - folder)
│   │   │   ├── ClassCreationWizard.tsx
│   │   │   ├── steps/
│   │   │   │   ├── ClassDetailsStep.tsx
│   │   │   │   ├── SchoolYearStep.tsx
│   │   │   │   ├── CurriculumUploadStep.tsx
│   │   │   │   ├── AIScheduleStep.tsx
│   │   │   │   └── ReviewClassStep.tsx
│   │   │   └── index.ts
│   │   └── CurriculumManagement.tsx (REMOVE)
│   │
│   └── student/
│       └── StudentClassView.tsx (NEW)
│
├── components/
│   ├── curriculum/ (EXISTING ✅)
│   │   └── ... (all components already created)
│   │
│   ├── class/ (NEW)
│   │   ├── ClassHeader.tsx
│   │   ├── QuickStats.tsx
│   │   ├── CurriculumSection.tsx
│   │   ├── RosterSection.tsx
│   │   ├── AssignmentsSection.tsx
│   │   ├── ProgressSection.tsx
│   │   ├── CollapsibleSection.tsx
│   │   ├── CurriculumManagementModal.tsx
│   │   └── index.ts
│   │
│   └── shared/
│       ├── Modal.tsx (NEW - for wizards/modals)
│       ├── DatePicker.tsx (NEW - for dates)
│       └── FileUpload.tsx (NEW - for curriculum upload)
```

---

## 🔄 Implementation Steps

### Step 1: Create Shared Components (1 hour)
- [x] Modal component
- [x] DatePicker component
- [x] FileUpload component

### Step 2: Build Class Creation Wizard (2 hours)
- [x] Main wizard container
- [x] 5 wizard steps
- [x] Integration with backend API
- [x] Validation

### Step 3: Build Class Dashboard Components (2 hours)
- [x] ClassDashboard main layout
- [x] ClassHeader
- [x] QuickStats cards
- [x] CurriculumSection
- [x] RosterSection
- [x] CollapsibleSection

### Step 4: Build Curriculum Management Modal (1 hour)
- [x] Modal wrapper
- [x] Tab navigation
- [x] Integrate existing components

### Step 5: Build Student Class View (1.5 hours)
- [x] StudentClassView layout
- [x] Current unit hero section
- [x] Timeline integration
- [x] Insights cards

### Step 6: Update Routing & Navigation (0.5 hours)
- [x] Update App.tsx routes
- [x] Remove old curriculum page
- [x] Update navigation menu
- [x] Update class list links

### Step 7: Testing & Polish (1 hour)
- [x] Test full workflow
- [x] Mobile responsiveness
- [x] Animation polish
- [x] Accessibility

**Total Estimated Time: 9 hours**

---

## ✅ Success Criteria

1. **Teacher can create a class with curriculum in one flow**
   - Beautiful wizard modal
   - All steps work smoothly
   - AI generation functional

2. **Class dashboard shows curriculum prominently**
   - Current unit visible
   - Easy access to full schedule
   - All sections organized

3. **Students see curriculum-focused view**
   - Current unit highlighted
   - Progress clear
   - Timeline accessible

4. **Apple-esque UI maintained**
   - Glass morphism throughout
   - Smooth animations
   - Clean, professional look

5. **No broken links or removed features**
   - All existing features work
   - Improved navigation
   - Better organization

---

## 🚀 Ready to Execute

All components planned. Design system defined. File structure clear.

**Shall I proceed with implementation?**
