# Student Enrollment Guide - Batch 2

## ✅ Yes, Students CAN Join Classes in Batch 2!

Student enrollment is **fully functional** and integrated with the backend.

---

## 📍 Where Students Join Classes

**Page**: Student Classes Page
**Route**: `/student/classes`
**Navigation**: Sidebar → "Classes" or Dashboard → "My Classes" card

---

## 🎯 Complete Enrollment Flow

### Step 1: Teacher Creates Class
1. Teacher logs in and goes to **Teacher Classes** (`/teacher/classes`)
2. Clicks **"Create Class"** button
3. Fills in class details (name, subject, academic year, etc.)
4. Submits form
5. **Backend generates unique class code** (e.g., `ABC-1234`)
6. Teacher shares this code with students

### Step 2: Student Enrolls
1. Student logs in and goes to **Student Classes** (`/student/classes`)
2. Clicks **"Enroll in Class"** button (top right)
3. **EnrollWithCodeModal opens**
4. Student enters class code (e.g., `ABC-1234`)
   - Modal auto-formats as they type: `ABC1234` → `ABC-1234`
   - Validates format before submission
5. Student clicks **"Enroll"**
6. **Backend creates enrollment with status = PENDING**
7. Modal shows success message
8. Student sees pending enrollment count alert

### Step 3: Teacher Approves
1. Teacher goes to **Class Roster** (`/teacher/classes/:classId/roster`)
2. Clicks **"Pending"** tab
3. Sees student enrollment request with:
   - Student name
   - Student email
   - Grade level
   - Request date
4. Clicks **"Approve"** button
5. **Backend updates enrollment status to APPROVED**
6. Student now appears in "Enrolled" tab

### Step 4: Student Gets Access
1. Student refreshes **Student Classes** page
2. Pending enrollment disappears from alert
3. Class now appears in enrolled classes list
4. Student can access class materials (future batches)

---

## 🖼️ UI Components

### 1. Student Classes Page
**File**: `src/pages/student/Classes.tsx`

**Features**:
- **Header**: Shows enrolled class count + pending count
- **"Enroll in Class" button**: Opens enrollment modal
- **Pending Alert**: Yellow banner showing pending enrollment count
- **Empty State**: If no classes, shows CTA to enroll
- **Class Cards**: Displays enrolled classes with teacher info

**API Calls**:
```typescript
// Fetch approved enrollments
GET /api/v1/enrollments?status=APPROVED

// Fetch pending enrollments (for count)
GET /api/v1/enrollments?status=PENDING
```

### 2. EnrollWithCodeModal Component
**File**: `src/components/class/EnrollWithCodeModal.tsx`

**Features**:
- Modal overlay with form
- Class code input with auto-formatting
- Format validation (ABC-1234 pattern)
- Loading state during submission
- Success message with auto-close
- Error handling with specific messages

**API Call**:
```typescript
// Enroll in class
POST /api/v1/enrollments
Body: { classCode: "ABC-1234" }
```

**Code Formatting Logic**:
```typescript
const formatClassCode = (value: string) => {
  let cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleaned.length > 3) {
    cleaned = cleaned.slice(0, 3) + '-' + cleaned.slice(3, 7);
  }
  return cleaned;
};
```

### 3. Class Roster Page (Teacher Side)
**File**: `src/pages/teacher/ClassRoster.tsx`

**Features**:
- Tabs for different enrollment statuses (Pending, Approved, Rejected, Removed)
- Enrollment stats cards
- Class code display with copy button
- Approve/Reject buttons for pending enrollments
- Remove button for approved students
- "Add Students" button for manual enrollment

**API Calls**:
```typescript
// Get class details
GET /api/v1/classes/:classId

// Get enrollments by status
GET /api/v1/classes/:classId/enrollments?status=PENDING

// Approve enrollment
PATCH /api/v1/classes/:classId/enrollments/:enrollmentId
Body: { status: "APPROVED" }

// Reject enrollment
PATCH /api/v1/classes/:classId/enrollments/:enrollmentId
Body: { status: "REJECTED", rejectionReason: "..." }

// Remove student
DELETE /api/v1/classes/:classId/enrollments/:enrollmentId
```

---

## 🔄 Enrollment Statuses

### PENDING
- **Created**: When student enrolls with class code
- **Visible to**: Student (in pending alert), Teacher (in Pending tab)
- **Actions**: Teacher can approve or reject

### APPROVED
- **Created**: When teacher clicks "Approve" on pending enrollment
- **Visible to**: Student (in enrolled classes), Teacher (in Enrolled tab)
- **Actions**: Teacher can remove student

### REJECTED
- **Created**: When teacher clicks "Reject" on pending enrollment
- **Visible to**: Teacher only (in Rejected tab)
- **Actions**: None (enrollment is effectively denied)

### REMOVED
- **Created**: When teacher removes an approved student
- **Visible to**: Teacher (in Removed tab), Student (can query for removed classes)
- **Actions**: None (student was removed from class)

---

## 🧪 Testing the Flow

### Test Scenario 1: Happy Path

1. **Setup**:
   - Login as teacher: `teacher@demo.com`
   - Login as student: `student@demo.com`

2. **Teacher**:
   ```
   Navigate to /teacher/classes
   Click "Create Class"
   Name: "AP Biology"
   Academic Year: "2024-2025"
   Submit
   Copy class code (e.g., "BIO-2024")
   ```

3. **Student**:
   ```
   Navigate to /student/classes
   Click "Enroll in Class"
   Enter code: "BIO-2024"
   Click "Enroll"
   See success message
   See "1 Enrollment Request Pending" alert
   ```

4. **Teacher**:
   ```
   Navigate to /teacher/classes
   Click on "AP Biology" class card
   Goes to /teacher/classes/:id/roster
   Click "Pending" tab
   See student enrollment request
   Click "Approve"
   ```

5. **Student**:
   ```
   Refresh /student/classes page
   Pending alert disappears
   "AP Biology" class appears in enrolled classes
   ```

✅ **Success!**

### Test Scenario 2: Invalid Class Code

1. **Student**:
   ```
   Navigate to /student/classes
   Click "Enroll in Class"
   Enter code: "INVALID"
   Click "Enroll"
   See error: "Invalid class code format"
   ```

2. **Student**:
   ```
   Enter code: "XYZ-9999" (valid format, doesn't exist)
   Click "Enroll"
   See error: "Class not found or code has expired"
   ```

### Test Scenario 3: Duplicate Enrollment

1. **Student** (already enrolled in class):
   ```
   Navigate to /student/classes
   Click "Enroll in Class"
   Enter same class code again
   Click "Enroll"
   See error: "You are already enrolled in this class"
   ```

---

## 📊 Database Flow

### When Student Enrolls:
```sql
INSERT INTO "class_enrollments" (
  id,
  class_id,
  student_id,
  status,           -- 'PENDING'
  requested_at,
  created_at,
  updated_at
) VALUES (...);
```

### When Teacher Approves:
```sql
UPDATE "class_enrollments"
SET
  status = 'APPROVED',
  approved_at = NOW(),
  processed_by = :teacher_id,
  updated_at = NOW()
WHERE id = :enrollment_id;
```

### When Teacher Rejects:
```sql
UPDATE "class_enrollments"
SET
  status = 'REJECTED',
  processed_by = :teacher_id,
  rejection_reason = :reason,
  updated_at = NOW()
WHERE id = :enrollment_id;
```

### When Teacher Removes:
```sql
UPDATE "class_enrollments"
SET
  status = 'REMOVED',
  deleted_at = NOW(),
  deleted_by = :teacher_id,
  updated_at = NOW()
WHERE id = :enrollment_id;
```

---

## 🔐 Security & Permissions

### Student Permissions:
- ✅ Can enroll in any class with valid code
- ✅ Can view their own enrollments
- ❌ Cannot approve their own enrollment
- ❌ Cannot see other students' enrollments
- ❌ Cannot modify enrollment status

### Teacher Permissions:
- ✅ Can view all enrollments for their classes
- ✅ Can approve/reject pending enrollments
- ✅ Can remove approved students
- ✅ Can manually add students by email
- ❌ Cannot modify enrollments for classes they don't teach

### Multi-Tenant Security:
- All queries filtered by `schoolId`
- Students can only enroll in classes from their school
- Teachers can only manage classes from their school
- Cross-school enrollment is prevented

---

## 🎨 UX Features

### Auto-Formatting
Student types: `abc1234` → Auto-formats to: `ABC-1234`

### Real-Time Validation
- Format validation before API call
- Pattern: `^[A-Z]{3}-[0-9]{4}$`
- Shows error if invalid format

### Loading States
- Button shows spinner during enrollment
- Disabled during submission
- Prevents duplicate submissions

### Success Feedback
- Green checkmark icon
- Success message
- Auto-close after 2 seconds
- Automatic query invalidation (React Query)

### Error Handling
- Specific error messages based on failure reason
- Red alert icon
- Clear instructions on how to fix

### Empty States
- When no classes: "Get started by enrolling..."
- Shows CTA button
- Welcoming illustration

---

## 🚀 What's Working Right Now

✅ **Backend**:
- Student can enroll with class code
- Teacher can approve/reject/remove enrollments
- All enrollment statuses working
- Multi-tenant security enforced
- Audit logging active

✅ **Frontend**:
- Student Classes page with enrollment modal
- Teacher Class Roster with approval workflow
- Real-time updates via React Query
- Auto-formatting and validation
- Loading and error states
- Success confirmations

✅ **Integration**:
- Frontend calls correct API endpoints
- Type-safe request/response handling
- Automatic cache invalidation
- Optimistic UI updates

---

## 📝 Summary

**Q: Can students join classes after Batch 2?**
**A: Students can join classes IN Batch 2! It's already built and working.**

**Where**: `/student/classes` → "Enroll in Class" button
**How**: Enter teacher's class code (e.g., ABC-1234)
**Result**: Pending enrollment → Teacher approves → Student enrolled

**Status**: ✅ **100% Complete and Functional**

---

**Last Updated**: October 23, 2025
**Batch**: 2 (Class Management)
**Status**: Production-ready
