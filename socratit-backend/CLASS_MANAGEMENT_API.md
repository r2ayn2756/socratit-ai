# Class Management API Documentation

## Base URL
```
http://localhost:3001/api/v1
```

## Authentication
All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

---

## Teacher Endpoints

### 1. Create Class
**POST** `/classes`

**Auth**: Teacher only

**Body**:
```json
{
  "name": "Geometry",
  "subject": "Mathematics",
  "gradeLevel": "9th Grade",
  "academicYear": "2024-2025",
  "period": "Period 3",
  "room": "Room 305",
  "scheduleTime": "Mon, Wed, Fri 9:00-10:15 AM",
  "color": "blue",
  "codeExpiresAt": "2025-01-31T23:59:59Z"  // Optional
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Geometry",
    "classCode": "GEO-1234",
    "teachers": [
      {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe",
        "email": "teacher@school.com",
        "isPrimary": true
      }
    ],
    ...
  },
  "message": "Class created successfully"
}
```

---

### 2. Get All My Classes
**GET** `/classes`

**Auth**: Teacher only

**Query Params**:
- `academicYear` (optional): Filter by academic year (e.g., "2024-2025")
- `isActive` (optional): Filter by active status (true/false)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Geometry",
      "classCode": "GEO-1234",
      "teachers": [...],
      "enrollmentCounts": {
        "total": 25,
        "pending": 3,
        "approved": 20,
        "rejected": 1,
        "removed": 1
      },
      ...
    }
  ]
}
```

---

### 3. Get Class Details
**GET** `/classes/:classId`

**Auth**: Teacher (must teach class) OR Student (must be enrolled)

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Geometry",
    "teachers": [...],
    "enrollments": [
      {
        "id": "uuid",
        "status": "APPROVED",
        "student": {
          "id": "uuid",
          "firstName": "Jane",
          "lastName": "Smith",
          "email": "student@school.com",
          "gradeLevel": "9th Grade"
        },
        ...
      }
    ],
    ...
  }
}
```

---

### 4. Update Class
**PATCH** `/classes/:classId`

**Auth**: Teacher (must teach class)

**Body**: (all fields optional)
```json
{
  "name": "Advanced Geometry",
  "isActive": false,
  "codeExpiresAt": null
}
```

**Response**:
```json
{
  "success": true,
  "data": { /* updated class */ },
  "message": "Class updated successfully"
}
```

---

### 5. Delete Class (Soft Delete)
**DELETE** `/classes/:classId`

**Auth**: Teacher (must teach class)

**Response**:
```json
{
  "success": true,
  "message": "Class deleted successfully"
}
```

---

### 6. Regenerate Class Code
**POST** `/classes/:classId/regenerate-code`

**Auth**: Teacher (must teach class)

**Response**:
```json
{
  "success": true,
  "data": {
    "classCode": "NEW-5678"
  },
  "message": "Class code regenerated successfully"
}
```

---

## Enrollment Management (Teacher)

### 7. Get Class Roster
**GET** `/classes/:classId/enrollments`

**Auth**: Teacher (must teach class)

**Query Params**:
- `status` (optional): Filter by status (PENDING, APPROVED, REJECTED, REMOVED)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "status": "PENDING",
      "requestedAt": "2024-10-23T10:00:00Z",
      "student": {
        "id": "uuid",
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "student@school.com",
        "gradeLevel": "9th Grade"
      },
      ...
    }
  ]
}
```

---

### 8. Manually Add Students
**POST** `/classes/:classId/enrollments`

**Auth**: Teacher (must teach class)

**Body**:
```json
{
  "studentEmails": [
    "student1@school.com",
    "student2@school.com"
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "created": [ /* enrollment objects */ ],
    "alreadyEnrolled": ["student3@school.com"]
  },
  "message": "Successfully added 2 student(s) to Geometry"
}
```

---

### 9. Approve/Reject/Remove Enrollment
**PATCH** `/classes/:classId/enrollments/:enrollmentId`

**Auth**: Teacher (must teach class)

**Body**:
```json
{
  "status": "APPROVED",  // or "REJECTED" or "REMOVED"
  "rejectionReason": "Class is full"  // Required if status = REJECTED
}
```

**Response**:
```json
{
  "success": true,
  "data": { /* updated enrollment */ },
  "message": "Student enrollment approved"
}
```

---

### 10. Remove Student (Alternative Method)
**DELETE** `/classes/:classId/enrollments/:enrollmentId`

**Auth**: Teacher (must teach class)

**Response**:
```json
{
  "success": true,
  "message": "Student removed from class"
}
```

---

## Student Endpoints

### 11. Enroll with Class Code
**POST** `/enrollments`

**Auth**: Student only

**Body**:
```json
{
  "classCode": "GEO-1234"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "classId": "uuid",
    "studentId": "uuid",
    "status": "PENDING",
    "requestedAt": "2024-10-23T10:00:00Z",
    "class": { /* class details */ },
    ...
  },
  "message": "Enrollment request submitted. Awaiting teacher approval."
}
```

**Errors**:
- `400`: Invalid class code format
- `404`: Class code not found
- `409`: Already enrolled or already requested
- `403`: Class code expired

---

### 12. Get My Enrollments
**GET** `/enrollments`

**Auth**: Student only

**Query Params**:
- `status` (optional): Filter by status (PENDING, APPROVED, REJECTED, REMOVED)
- `academicYear` (optional): Filter by academic year

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "status": "APPROVED",
      "class": {
        "id": "uuid",
        "name": "Geometry",
        "teachers": [...],
        ...
      },
      ...
    }
  ]
}
```

---

### 13. Get Enrollment Details
**GET** `/enrollments/:enrollmentId`

**Auth**: Student (own enrollment) OR Teacher (teaches class)

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "APPROVED",
    "class": { /* class details */ },
    "student": { /* student details */ },
    "processor": {  // If processed
      "id": "uuid",
      "firstName": "Teacher",
      "lastName": "Name"
    },
    "processedAt": "2024-10-23T10:30:00Z",
    ...
  }
}
```

---

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "message": "Error message here",
  "errors": [  // Optional, for validation errors
    {
      "field": "classCode",
      "message": "Class code must be in format XXX-1234"
    }
  ]
}
```

**Common HTTP Status Codes**:
- `200`: Success
- `201`: Created
- `400`: Bad request / validation error
- `401`: Unauthorized (no token or invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Resource not found
- `409`: Conflict (e.g., duplicate enrollment)
- `500`: Internal server error

---

## Rate Limits

- **General API**: 100 requests per 15 minutes
- **Class creation**: 20 classes per hour
- **Class code operations**: 10 requests per minute
- **Enrollment requests**: 5 per minute per student

When rate limit is exceeded:
```json
{
  "success": false,
  "message": "Too many requests, please try again later"
}
```

---

## Notifications (Console Logging)

In Batch 2, notifications are logged to console. In Batch 6, they will be sent via WebSocket.

**Notification Events**:
- `ENROLLMENT_REQUEST`: Sent to all teachers when student requests to enroll
- `ENROLLMENT_APPROVED`: Sent to student when approved
- `ENROLLMENT_REJECTED`: Sent to student when rejected
- `ADDED_TO_CLASS`: Sent to student when manually added
- `REMOVED_FROM_CLASS`: Sent to student when removed

---

## Examples

### Example: Teacher Creates Class and Student Enrolls

1. **Teacher creates class**:
   ```bash
   POST /api/v1/classes
   Authorization: Bearer <teacher_token>

   {
     "name": "Geometry",
     "academicYear": "2024-2025"
   }
   ```
   Response includes `classCode: "GEO-1234"`

2. **Student enrolls with code**:
   ```bash
   POST /api/v1/enrollments
   Authorization: Bearer <student_token>

   {
     "classCode": "GEO-1234"
   }
   ```
   Enrollment created with `status: "PENDING"`

3. **Teacher views pending requests**:
   ```bash
   GET /api/v1/classes/<classId>/enrollments?status=PENDING
   Authorization: Bearer <teacher_token>
   ```

4. **Teacher approves enrollment**:
   ```bash
   PATCH /api/v1/classes/<classId>/enrollments/<enrollmentId>
   Authorization: Bearer <teacher_token>

   {
     "status": "APPROVED"
   }
   ```

5. **Student views enrolled classes**:
   ```bash
   GET /api/v1/enrollments?status=APPROVED
   Authorization: Bearer <student_token>
   ```

---

## Testing with cURL

### Create Class
```bash
curl -X POST http://localhost:3001/api/v1/classes \
  -H "Authorization: Bearer YOUR_TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Geometry",
    "academicYear": "2024-2025"
  }'
```

### Enroll Student
```bash
curl -X POST http://localhost:3001/api/v1/enrollments \
  -H "Authorization: Bearer YOUR_STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "classCode": "GEO-1234"
  }'
```

### Get Class Roster
```bash
curl -X GET http://localhost:3001/api/v1/classes/CLASS_ID/enrollments \
  -H "Authorization: Bearer YOUR_TEACHER_TOKEN"
```

---

For more details, see [BATCH_2_IMPLEMENTATION_SUMMARY.md](./BATCH_2_IMPLEMENTATION_SUMMARY.md)
