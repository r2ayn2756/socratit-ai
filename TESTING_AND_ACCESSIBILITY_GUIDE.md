# Testing and Accessibility Guide

## Overview
This document outlines the testing approach and accessibility features implemented in the Socratit.ai application.

## Completed Features

### 1. Error Boundaries ✅
**Location**: [ErrorBoundary.tsx](socratit-wireframes/src/components/shared/ErrorBoundary.tsx)

**Features**:
- Class-based error boundary for catching React render errors
- Async error boundary for handling async operation failures
- Custom fallback UI with error details (development mode only)
- Retry functionality
- Error logging callback support

**Usage**:
```tsx
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

**Integrated In**:
- [App.tsx](socratit-wireframes/src/App.tsx:39-82) - Wraps entire application

### 2. Loading States ✅
**Location**: [LoadingState.tsx](socratit-wireframes/src/components/shared/LoadingState.tsx)

**Components**:
- `FullPageLoading` - Full-page loading screen
- `Spinner` - Inline loading spinner (sm/md/lg sizes)
- `Skeleton` - Skeleton loading placeholders
- `CardSkeleton` - Skeleton for card components
- `TableSkeleton` - Skeleton for table components
- `DashboardSkeleton` - Complete dashboard skeleton
- `LoadingButton` - Button with loading state

**Accessibility Features**:
- All loading components include `role="status"` and `aria-live="polite"`
- Skeleton elements include `aria-hidden="true"`
- Loading buttons have `aria-busy` attribute

**Usage**:
```tsx
import { LoadingButton, Spinner, Skeleton } from './components/shared/LoadingState';

<LoadingButton isLoading={isSubmitting} loadingText="Saving...">
  Save
</LoadingButton>

<Spinner size="md" color="blue" />
<Skeleton variant="text" lines={3} />
```

### 3. Accessibility (ARIA) Labels ✅

#### Modal Component
**Location**: [Modal.tsx](socratit-wireframes/src/components/shared/Modal.tsx)

**ARIA Attributes**:
- `role="dialog"` - Identifies modal dialog
- `aria-modal="true"` - Indicates modal behavior
- `aria-labelledby="modal-title"` - Links to modal title
- `aria-describedby="modal-subtitle"` - Links to modal description
- `aria-hidden="true"` on backdrop - Hides decorative backdrop from screen readers
- `aria-label="Close modal"` on close button

**Screen Reader Experience**:
1. Focus trap keeps keyboard navigation within modal
2. Escape key closes modal
3. Title and subtitle are announced
4. Close button clearly labeled

#### Collapsible Section
**Location**: [CollapsibleSection.tsx](socratit-wireframes/src/components/class/CollapsibleSection.tsx)

**ARIA Attributes**:
- `aria-expanded={isExpanded}` - Announces expand/collapse state
- `aria-controls={contentId}` - Links button to content region
- `aria-label` - Dynamic label describing action
- `role="region"` on content - Identifies collapsible region
- `aria-labelledby={sectionId}` - Links content to header

**Screen Reader Experience**:
1. Button announces "Expand [Title]" or "Collapse [Title]"
2. Expanded/collapsed state is announced
3. Content region properly identified

#### DatePicker Component
**Location**: [DatePicker.tsx](socratit-wireframes/src/components/shared/DatePicker.tsx)

**ARIA Attributes**:
- `aria-label={label}` - Announces picker purpose
- `aria-expanded={isOpen}` - Announces calendar visibility
- `aria-haspopup="dialog"` - Indicates calendar popup
- `aria-required={required}` - Announces required fields
- `aria-hidden="true"` on icon - Hides decorative calendar icon
- `aria-label="Previous month"` / `"Next month"` on navigation buttons

**Screen Reader Experience**:
1. Input announces label and current value
2. Calendar popup announced
3. Month navigation clearly labeled
4. Required fields announced

#### FileUpload Component
**Location**: [FileUpload.tsx](socratit-wireframes/src/components/shared/FileUpload.tsx)

**ARIA Attributes**:
- `aria-label` on hidden file input
- `aria-required={required}` - Announces required uploads
- `role="button"` on drop zone
- `tabIndex={0}` - Makes drop zone keyboard accessible
- `aria-label="Upload file"` - Describes drop zone purpose
- `aria-disabled={disabled}` - Announces disabled state

**Keyboard Support**:
- Enter or Space key activates file picker
- Tab navigation supported
- Disabled state properly communicated

**Screen Reader Experience**:
1. Drop zone identified as button
2. File upload purpose announced
3. Required uploads announced
4. Keyboard activation supported

## API Integration Status

### Completed Integrations ✅

#### 1. ReviewClassStep (Class Creation Wizard)
**Location**: [ReviewClassStep.tsx](socratit-wireframes/src/pages/teacher/ClassCreationWizard/steps/ReviewClassStep.tsx:32-107)

**Flow**:
1. Upload curriculum file → `uploadService.uploadCurriculumFile()`
2. Create class with curriculum data → `classApiService.createClass()`
3. Trigger AI schedule generation → `curriculumApi.schedules.generateScheduleFromAI()`

**Error Handling**:
- File upload failures caught and reported
- Class creation failures display user-friendly messages
- AI generation failures logged but don't block class creation

#### 2. ClassDashboard (Teacher View)
**Location**: [ClassDashboard.tsx](socratit-wireframes/src/pages/teacher/ClassDashboard.tsx:46-93)

**Data Loading**:
- Parallel loading of class info, students, assignments
- Conditional loading of schedule and units
- Progress data aggregation

**APIs Used**:
- `classApiService.getClass(classId)`
- `classApiService.getClassStudents(classId)`
- `classApiService.getClassAssignments(classId)`
- `classApiService.getClassSchedule(classId)`
- `classApiService.getCurrentUnit(scheduleId)`
- `classApiService.getUpcomingUnits(scheduleId)`
- `classApiService.getClassProgress(classId)`

#### 3. StudentClassView (Student View)
**Location**: [StudentClassView.tsx](socratit-wireframes/src/pages/student/StudentClassView.tsx:61-157)

**Data Loading**:
- Class and schedule information
- Student progress and insights
- Upcoming assignments
- Current unit details

**APIs Used**:
- `classApiService.getClass(classId)`
- `classApiService.getClassSchedule(classId)`
- `curriculumApi.progress.getMyProgress(scheduleId)`
- `curriculumApi.progress.getMyStrengths(scheduleId)`
- `curriculumApi.progress.getMyStruggles(scheduleId)`
- `curriculumApi.progress.getMyReviewRecommendations(scheduleId)`
- `curriculumApi.units.getUnit(unitId)`
- `assignmentService.getAssignments({ classId, limit: 5 })`

#### 4. CurriculumManagementModal
**Location**: [CurriculumManagementModal.tsx](socratit-wireframes/src/components/class/CurriculumManagementModal.tsx:40-76)

**Features**:
- Loads schedule and units
- Reorders units with backend persistence
- Optimistic UI updates with error recovery

**APIs Used**:
- `curriculumApi.schedules.getSchedule(scheduleId)`
- `curriculumApi.units.getScheduleUnits(scheduleId)`
- `curriculumApi.units.reorderUnits({ scheduleId, unitOrders })`

## Testing Checklist

### Manual Testing

#### File Upload Flow
- [ ] Upload PDF curriculum file
- [ ] Upload DOC/DOCX curriculum file
- [ ] Test file size limit (10MB)
- [ ] Test invalid file types
- [ ] Verify file progress indicator
- [ ] Verify uploaded file in database

#### Class Creation Flow
- [ ] Create class without curriculum
- [ ] Create class with curriculum file
- [ ] Create class with AI generation enabled
- [ ] Create class with AI generation disabled
- [ ] Verify curriculum schedule created
- [ ] Verify schedule status (DRAFT vs PUBLISHED)

#### Dashboard Loading
- [ ] Teacher dashboard loads all data
- [ ] Student dashboard loads correctly
- [ ] Loading skeletons display during fetch
- [ ] Error states display on API failures
- [ ] Empty states display when no data

#### Curriculum Management
- [ ] Modal opens and loads data
- [ ] Unit reordering persists to backend
- [ ] Timeline view displays correctly
- [ ] AI Assistant tab loads

#### Error Boundaries
- [ ] Application-level errors caught
- [ ] Component-level errors caught
- [ ] Error details shown in development
- [ ] Production error UI is user-friendly
- [ ] Retry functionality works

### Accessibility Testing

#### Screen Reader Testing
**Recommended Tools**: NVDA (Windows), JAWS (Windows), VoiceOver (Mac)

**Test Cases**:
1. **Modal Navigation**
   - [ ] Modal title announced
   - [ ] Modal description announced
   - [ ] Focus trapped in modal
   - [ ] Escape closes modal
   - [ ] Close button labeled

2. **Collapsible Sections**
   - [ ] Expand/collapse state announced
   - [ ] Button purpose clear
   - [ ] Content region identified

3. **Date Picker**
   - [ ] Label announced
   - [ ] Current value announced
   - [ ] Calendar popup announced
   - [ ] Month navigation labeled
   - [ ] Date selection works

4. **File Upload**
   - [ ] Upload purpose announced
   - [ ] Keyboard activation works
   - [ ] Required state announced
   - [ ] File selected announced

#### Keyboard Navigation
- [ ] Tab key navigates through interactive elements
- [ ] Enter/Space activates buttons
- [ ] Escape closes modals and dropdowns
- [ ] Arrow keys navigate lists
- [ ] Focus indicators visible

#### Color Contrast
- [ ] Text meets WCAG AA standards (4.5:1)
- [ ] Interactive elements meet WCAG AA (3:1)
- [ ] Error states clearly visible
- [ ] Success states clearly visible

### Integration Testing

#### Backend API Tests
```bash
# Start backend
cd socratit-backend
npm run dev

# Test file upload endpoint
curl -X POST http://localhost:3001/api/v1/upload/curriculum \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@path/to/curriculum.pdf"

# Test class creation endpoint
curl -X POST http://localhost:3001/api/v1/classes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Class",
    "subject": "Math",
    "gradeLevel": "9th Grade",
    "academicYear": "2024-2025",
    "curriculumMaterialId": "file-id",
    "schoolYearStart": "2024-09-01",
    "schoolYearEnd": "2025-06-15",
    "meetingPattern": "daily",
    "generateWithAI": true
  }'
```

#### Frontend Integration Tests
- [ ] File upload to class creation workflow
- [ ] AI generation triggers correctly
- [ ] Schedule loads in dashboard
- [ ] Student progress displays correctly
- [ ] Unit reordering works end-to-end

## Known Issues and Type Fixes Needed

### TypeScript Compilation Errors
The following type mismatches need resolution:

1. **CurriculumManagementModal.tsx:49**
   - Issue: `ScheduleResponse` vs `CurriculumSchedule` type mismatch
   - Fix: Update type mapping or state interface

2. **StudentClassView.tsx:111**
   - Issue: `UnitResponse` vs `CurriculumUnit` type mismatch
   - Fix: Add type transformation or update interface

3. **ReviewClassStep.tsx:84**
   - Issue: `focusAreas` not in API preferences type
   - Fix: Update API type definition or remove field

4. **classApi.service.ts:88**
   - Issue: `CreateClassResponse.data` missing fields
   - Fix: Update response type to include `scheduleId`, `studentCount`, `updatedAt`

### Recommended Fixes

```typescript
// Fix 1: CurriculumManagementModal type
interface ScheduleResponse extends Pick<CurriculumSchedule, 'id' | 'status' | '...'> {
  // Add missing fields
}

// Fix 2: StudentClassView unit type
const currentUnit = await curriculumApi.units.getUnit(currentUnitProgress.unitId) as CurriculumUnit;

// Fix 3: ReviewClassStep preferences
// Remove focusAreas or update API type

// Fix 4: ClassApi response
export interface CreateClassResponse {
  success: boolean;
  data: ClassDetailsResponse; // Use full type instead of partial
}
```

## Performance Optimization

### Implemented
- Parallel API calls with `Promise.all()`
- Optimistic UI updates for unit reordering
- Skeleton screens for perceived performance
- Error recovery without full page reload

### Recommended
- Implement React Query for automatic caching
- Add pagination for large datasets
- Debounce search inputs
- Lazy load large components

## Security Considerations

### Implemented
- Multi-tenancy via `schoolId`
- JWT authentication on all endpoints
- File type and size validation
- CSRF protection via tokens

### Recommended
- Rate limiting on file uploads
- Virus scanning for uploaded files
- Content Security Policy headers
- XSS protection in user inputs

## Deployment Checklist

- [ ] Fix all TypeScript compilation errors
- [ ] Run full test suite
- [ ] Verify accessibility with screen readers
- [ ] Test on mobile devices
- [ ] Test on different browsers (Chrome, Firefox, Safari, Edge)
- [ ] Check console for errors/warnings
- [ ] Verify API endpoints in production
- [ ] Test with production data
- [ ] Monitor error tracking (Sentry, etc.)
- [ ] Performance testing with Lighthouse

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Accessible Rich Internet Applications (WAI-ARIA) 1.2](https://www.w3.org/TR/wai-aria-1.2/)
