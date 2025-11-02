# Class Page Visual Consistency Audit

**Date:** November 1, 2025  
**Issue:** Visual inconsistency across class dashboard sections

---

## COMPONENTS ON CLASS PAGE

Based on ClassDashboard.tsx, the following components render on the class page:

### ✅ MIGRATED (Using Design System)
1. **ClassHeader** - Stat cards, colors updated
2. **ClassAnalyticsSection** - Fully migrated in Phase 3
3. **CurriculumSection** - Migrated in Phase 2
4. **RosterSection** - Migrated in Phase 2
5. **AssignmentsSection** - Migrated in Phase 2
6. **ProgressSection** - Migrated in Phase 2
7. **LessonsSection** - Migrated in Phase 2

### ⚠️ NOT VISIBLE (Modals - Lower Priority)
8. **CurriculumManagementModal** - Opens on click (old colors: gray-, blue-)
9. **UnitDetailsModal** - Opens on click (needs audit)
10. **AddStudentsModal** - Opens on click (old colors: gray-, blue-, Mail)
11. **AudioRecorder** - Special feature (old colors: gray-, blue-)

### ✅ JUST FIXED
12. **ClassDashboard loading state** - Now uses LoadingSpinner
13. **ClassDashboard error state** - Now uses EmptyState

---

## ROOT CAUSE OF VISUAL INCONSISTENCY

The issue is that **modal/utility components** that weren't in the initial scope still use:
- `gray-*` instead of `neutral-*`
- `blue-*` instead of `primary-*`
- Inline button styles instead of Button component

However, these modals are **NOT visible by default** on the class page. The user is seeing inconsistency in the **main dashboard sections**.

---

## HYPOTHESIS: What's Actually Causing the Visual Issue?

1. **ClassDashboard.tsx loading/error states** - ✅ JUST FIXED
2. **Different sections using different Card variants**
3. **Spacing/padding differences between sections**
4. **Typography inconsistency** (some sections might not use typography config)

---

## NEXT STEPS

### Option 1: Quick Fix (Recommended)
Check if sections are using inconsistent:
- Card variants (elevated vs default vs ghost)
- Spacing between sections
- Header typography

### Option 2: Complete Fix
Migrate all modals to design system (4-6 hours of work)

---

## QUESTIONS FOR USER

1. Which specific sections look visually different?
2. Is it the spacing, colors, or card styles?
3. Are you opening any modals that look different?

