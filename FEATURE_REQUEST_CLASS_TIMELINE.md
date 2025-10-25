# Feature Request: Class Timeline with Lesson Plans & File Uploads

## Overview
Teachers should be able to build a timeline for their class by dragging in past lesson plans and files when creating or managing a class.

## User Story
**As a teacher**, I want to upload and organize lesson plans chronologically when creating a class, so that I can structure my curriculum and reuse materials from previous years.

## Proposed Features

### 1. File Upload During Class Creation
- Drag-and-drop interface for uploading files
- Support for multiple file types:
  - PDFs (lesson plans, handouts)
  - Documents (DOCX, PPTX, etc.)
  - Images (diagrams, worksheets)
  - Videos (recorded lessons)
- Bulk upload capability

### 2. Timeline/Calendar View
- Visual timeline showing when each lesson/resource is scheduled
- Drag-and-drop to reorder lessons
- Date assignment for each resource
- Week/month view options

### 3. File Organization
- Folder structure (Units → Weeks → Lessons)
- Tags/categories (Homework, Lecture, Lab, Quiz, etc.)
- Search and filter capabilities
- Duplicate detection for reused materials

### 4. Integration Points
- Link files to specific assignments (Batch 3)
- Attach files to announcements
- Share files with students
- Version control for updated materials

## Technical Implementation

### Database Changes Needed

#### New Models:
```prisma
model ClassResource {
  id              String    @id @default(uuid())
  classId         String    @map("class_id")
  class           Class     @relation(fields: [classId], references: [id])

  fileName        String    @map("file_name")
  fileType        String    @map("file_type")
  fileSize        Int       @map("file_size")
  fileUrl         String    @map("file_url")

  title           String?
  description     String?
  category        ResourceCategory?

  scheduledDate   DateTime? @map("scheduled_date")
  sortOrder       Int       @default(0) @map("sort_order")

  uploadedBy      String    @map("uploaded_by")
  uploader        User      @relation(fields: [uploadedBy], references: [id])

  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  deletedAt       DateTime? @map("deleted_at")

  @@index([classId])
  @@index([scheduledDate])
  @@map("class_resources")
}

enum ResourceCategory {
  LESSON_PLAN
  HANDOUT
  HOMEWORK
  LAB
  QUIZ
  EXAM
  REFERENCE
  VIDEO
  OTHER
}
```

### Backend API Endpoints

```typescript
// Upload file
POST /api/v1/classes/:classId/resources
- Multipart/form-data with file upload
- File storage (S3, Azure Blob, or local for dev)
- Virus scanning
- File size limits (e.g., 50MB per file)

// List resources
GET /api/v1/classes/:classId/resources
- Filter by category, date range
- Pagination
- Sort by date, name, etc.

// Update resource metadata
PATCH /api/v1/classes/:classId/resources/:resourceId
- Update title, description, scheduledDate
- Reorder timeline

// Delete resource
DELETE /api/v1/classes/:classId/resources/:resourceId
- Soft delete from database
- Mark file for deletion (keep for 30 days)

// Download/view resource
GET /api/v1/classes/:classId/resources/:resourceId/download
- Signed URL for secure access
- Access control (only teachers and enrolled students)
```

### Frontend Components

#### 1. File Upload Component
```typescript
<FileUploadZone
  onFilesSelected={(files) => handleUpload(files)}
  acceptedTypes={['pdf', 'docx', 'pptx', 'jpg', 'png', 'mp4']}
  maxSize={50 * 1024 * 1024} // 50MB
  multiple={true}
/>
```

#### 2. Timeline View Component
```typescript
<ClassTimeline
  resources={resources}
  onReorder={(newOrder) => handleReorder(newOrder)}
  onDateChange={(resourceId, newDate) => handleDateChange(resourceId, newDate)}
  view="calendar" // or "list"
/>
```

#### 3. Resource Card Component
```typescript
<ResourceCard
  resource={resource}
  onEdit={() => handleEdit(resource.id)}
  onDelete={() => handleDelete(resource.id)}
  onDownload={() => handleDownload(resource.id)}
/>
```

### File Storage Strategy

#### Development:
- Local filesystem storage in `uploads/` directory
- Simple file paths stored in database

#### Production:
- Cloud storage (AWS S3, Azure Blob, or Cloudflare R2)
- CDN for fast delivery
- Signed URLs for secure access
- Automatic backups

### Security Considerations

1. **File Upload Validation**:
   - Verify file types (check magic numbers, not just extension)
   - Scan for viruses (ClamAV or cloud service)
   - Size limits per file and per class
   - Rate limiting on uploads

2. **Access Control**:
   - Only class teachers can upload/delete
   - Only enrolled students can view/download
   - Audit log for all file operations

3. **Storage Security**:
   - Files stored with UUID names (not original filenames)
   - Private buckets (no public access)
   - Signed URLs with expiration
   - Encryption at rest and in transit

## UI/UX Design

### Create Class Flow (Updated)
1. Enter class details (name, subject, etc.) ← **Current**
2. **NEW**: Upload lesson plans and resources
3. **NEW**: Arrange in timeline order
4. Review and create

### Class Management Page (New Tab)
- **Resources Tab** alongside Roster tab
- Drag-and-drop file upload zone
- Calendar/timeline view of scheduled resources
- Quick actions: Upload, Reorder, Edit, Delete

## Suggested Batch Assignment

This feature spans multiple batches:

- **Batch 3 (Assignments)**: Basic file attachment to assignments
- **Batch 5 or 6**: Full resource library with timeline
  - File upload infrastructure
  - Timeline UI component
  - Resource management endpoints
  - File storage setup

## Dependencies

- File storage service (S3 or equivalent)
- Frontend: File upload library (react-dropzone)
- Backend: Multer for multipart/form-data
- Optional: PDF preview library (react-pdf)
- Optional: Video player (video.js or Plyr)

## Estimated Effort

- **Backend**: 2-3 days
  - File upload endpoints
  - Storage integration
  - Database models and migrations

- **Frontend**: 3-4 days
  - File upload component
  - Timeline/calendar view
  - Resource management UI

- **Testing & Polish**: 1-2 days

**Total**: ~6-9 days

## Open Questions

1. **File Size Limits**: What's the max per file? Per class total?
2. **Storage Budget**: What's the expected storage cost?
3. **File Types**: Any specific formats to prioritize/restrict?
4. **Retention Policy**: How long to keep deleted files?
5. **Student Uploads**: Can students upload files or only teachers?
6. **Sharing**: Can teachers share resources across classes?

## Status

- [x] Feature documented
- [ ] Design mockups created
- [ ] Backend implementation
- [ ] Frontend implementation
- [ ] Testing
- [ ] Deployment

---

**Priority**: Medium (nice-to-have for MVP, essential for full product)

**Batch Suggestion**: Batch 5 or 6 (after core features like Assignments and Grading)
