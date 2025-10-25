# Batch 8: Progress Tracking - Complete Testing Guide

## 🎯 Overview

This guide provides step-by-step instructions for testing all Progress Tracking features end-to-end.

---

## ✅ Pre-Testing Checklist

### Backend Requirements
- [x] Database migration applied successfully
- [x] Backend compiles without progress-related errors
- [x] All progress routes registered in app.ts
- [x] Cron job initialized in index.ts
- [x] WebSocket events added

### Frontend Requirements
- [x] progress.types.ts created
- [x] progress.service.ts created
- [x] StudentProgressDashboard component created
- [ ] Remaining components created (see frontend guide)
- [ ] Progress routes added to router

### Test Data Requirements
- At least 1 teacher account
- At least 2 student accounts
- At least 1 class with students enrolled
- At least 5 assignments (mix of types)
- Some assignments completed, some in progress
- Some questions tagged with concepts

---

## 🧪 Test Scenario 1: Student Progress Dashboard

### Setup
1. **Start Backend**
   ```bash
   cd socratit-backend
   npm run dev
   ```

2. **Start Frontend**
   ```bash
   cd socratit-wireframes
   npm start
   ```

### Test Steps

#### 1.1: Login as Student
- Email: `student@demo.com`
- Password: `Password123`
- Expected: Successful login, redirected to dashboard

#### 1.2: Navigate to Progress
- Click on a class from dashboard
- Navigate to `/student/class/{classId}/progress`
- Expected: Progress dashboard loads

#### 1.3: Verify Progress Cards
Check that all 4 cards display:
- **Completion Rate**: Shows percentage with correct count
- **Average Grade**: Shows grade with trend indicator (arrow)
- **Total Time Spent**: Shows hours/minutes
- **Learning Velocity**: Shows assignments per week

Expected values should match database records.

#### 1.4: Verify Assignment Status Breakdown
Check the status breakdown section shows:
- Green bar for completed assignments
- Yellow bar for in-progress assignments
- Gray bar for not-started assignments
- Correct counts for each status

#### 1.5: Test Refresh Button
- Click "Refresh" button in top-right
- Expected: Data reloads, button shows spinner, no errors

#### 1.6: Verify Last Updated Timestamp
- Check bottom of page shows "Last updated: [timestamp]"
- Expected: Timestamp matches last calculation time

### API Verification
Open Browser DevTools > Network tab:
- Look for: `GET /api/v1/progress/student/{studentId}/class/{classId}`
- Status: 200
- Response: Valid JSON with StudentProgress data

---

## 🧪 Test Scenario 2: Assignment Progress & Time Tracking

### Test Steps

#### 2.1: Open an Assignment
- Navigate to class assignments list
- Click on an active assignment
- Expected: Assignment page loads

#### 2.2: Verify Progress Record Created
Check Network tab for:
- `GET /api/v1/progress/assignment/{assignmentId}/student/{studentId}`
- Response should show status: "NOT_STARTED" or "IN_PROGRESS"

#### 2.3: Start Working on Assignment
- Answer 1-2 questions
- Expected: Progress updates automatically

#### 2.4: Monitor Time Tracking
Keep the assignment open for 6+ minutes and watch Network tab:
- After 5 minutes: `PATCH /api/v1/progress/assignment/{assignmentId}/time`
- Payload: `{ "timeSpentMinutes": 5 }`
- Status: 200

#### 2.5: Complete Assignment
- Answer all questions
- Submit assignment
- Expected: Status changes to "SUBMITTED"

#### 2.6: Verify Progress Update
Return to progress dashboard:
- Completion rate should increase
- Time spent should reflect new time
- Assignment should move from "in progress" to "completed"

### Database Verification
```sql
-- Check assignment progress
SELECT * FROM assignment_progress
WHERE "studentId" = 'student-id'
AND "assignmentId" = 'assignment-id';

-- Should show:
-- status: GRADED or SUBMITTED
-- timeSpent: > 0
-- questionsAnswered: = questionsTotal
```

---

## 🧪 Test Scenario 3: Concept Mastery

### Prerequisites
- Assignments with questions tagged with concepts
- Student has completed some of these assignments

### Test Steps

#### 3.1: Trigger Concept Mastery Calculation
Complete an assignment with concept-tagged questions:
- Expected: Backend automatically updates ConceptMastery records

#### 3.2: View Concept Progress
Navigate to concept mastery page (when implemented):
- Expected: List of concepts with mastery percentages
- Color coding: Red (<40%), Yellow (40-70%), Blue (70-90%), Green (>90%)

#### 3.3: Verify Struggling Concepts
If any concept mastery < 60%:
- Expected: Alert banner showing "Concepts Needing Attention"
- List includes struggling concepts

#### 3.4: Check Suggested Next Concepts
For mastered concepts (>70%):
- Expected: "Suggested next concepts" field populated
- Based on learning path prerequisites

### API Verification
```
GET /api/v1/progress/concepts/{studentId}/class/{classId}
```
Response should include:
- Array of concepts with mastery data
- Array of concept paths

### Database Verification
```sql
-- Check concept mastery
SELECT
  concept,
  "masteryPercent",
  "masteryLevel",
  "remediationNeeded",
  "suggestedNextConcepts"
FROM concept_masteries
WHERE "studentId" = 'student-id'
  AND "classId" = 'class-id';
```

---

## 🧪 Test Scenario 4: Learning Velocity (Teacher View)

### Prerequisites
- At least 1 week of student activity data
- Weekly cron job has run at least once

### Test Steps

#### 4.1: Trigger Manual Velocity Calculation (Optional)
```bash
cd socratit-backend
node -e "require('./dist/services/progress.service').calculateWeeklyVelocity().then(() => console.log('Done'))"
```

#### 4.2: Login as Teacher
- Email: `teacher@demo.com`
- Password: `Password123`

#### 4.3: View Class Velocity
Navigate to class analytics:
- Expected: Learning velocity chart shows assignments/week
- Historical data displayed (up to 12 weeks)

#### 4.4: Check Velocity Alerts
If any student velocity dropped >25%:
- Expected: Alert in teacher dashboard
- WebSocket event: `velocity:alert` received

### API Verification
```
GET /api/v1/progress/velocity/class/{classId}
```
Response should include array of velocity logs with:
- weekStartDate
- weekEndDate
- velocity
- velocityChange

### Database Verification
```sql
-- Check velocity logs
SELECT
  "weekStartDate",
  "weekEndDate",
  "assignmentsCompleted",
  velocity,
  "velocityChange"
FROM learning_velocity_logs
WHERE "classId" = 'class-id'
ORDER BY "weekStartDate" DESC
LIMIT 10;
```

---

## 🧪 Test Scenario 5: Concept Paths (Teacher Customization)

### Test Steps

#### 5.1: Login as Teacher
Navigate to class settings or learning paths page

#### 5.2: Create New Concept Path
- Click "Add Concept" button
- Fill in:
  - Concept Name: "Algebra Basics"
  - Prerequisite: None (foundational)
  - Difficulty: 1
  - Estimated Hours: 3
  - Description: "Basic algebraic operations"
- Click "Save"

Expected:
- Success message
- Concept appears in list

#### 5.3: Create Dependent Concept
- Click "Add Concept"
- Fill in:
  - Concept Name: "Linear Equations"
  - Prerequisite: "Algebra Basics"
  - Difficulty: 2
  - Estimated Hours: 4
- Click "Save"

Expected:
- Concept shows "After: Algebra Basics"
- orderIndex increments automatically

#### 5.4: Edit Concept Path
- Click edit icon on a concept
- Change difficulty to 3
- Click "Save"

Expected:
- Updates successfully
- Changes reflected immediately

#### 5.5: Delete Concept Path
- Click delete icon
- Confirm deletion

Expected:
- Concept removed from list
- Dependent concepts still exist (prerequisite set to null)

### API Verification
```
GET /api/v1/progress/concepts/paths/{classId}
POST /api/v1/progress/concepts/paths
PUT /api/v1/progress/concepts/paths/{pathId}
DELETE /api/v1/progress/concepts/paths/{pathId}
```

### Database Verification
```sql
-- Check concept paths
SELECT
  "conceptName",
  "prerequisiteId",
  "orderIndex",
  difficulty,
  "estimatedHours"
FROM concept_mastery_paths
WHERE "classId" = 'class-id'
ORDER BY "orderIndex";
```

---

## 🧪 Test Scenario 6: Real-Time Updates (WebSocket)

### Prerequisites
- WebSocket hook implemented
- Backend WebSocket server running

### Test Steps

#### 6.1: Open Two Browser Windows
Window 1: Student view (progress dashboard)
Window 2: Teacher view (or another student submission view)

#### 6.2: Complete Assignment in Window 2
- Answer and submit assignment
- Expected in Window 1:
  - Progress dashboard updates automatically
  - No page refresh needed
  - WebSocket event: `progress:updated` received

#### 6.3: Monitor Browser Console
Check for WebSocket messages:
```
[WebSocket] Progress updated: { studentId, classId, progress }
```

#### 6.4: Test Concept Mastery Update
Complete assignment with concepts:
- Expected: `concept:mastery` event emitted
- Teacher dashboard shows updated mastery if viewing that student

#### 6.5: Test Velocity Alert
If velocity drops >25%:
- Expected: Teacher receives `velocity:alert` event
- Notification appears in real-time

---

## 🧪 Test Scenario 7: Progress Calculation Accuracy

### Validation Tests

#### 7.1: Completion Rate Calculation
Given:
- Total assignments: 10
- Completed: 7
- In Progress: 2
- Not Started: 1

Expected:
- completionRate: 70%
- completedAssignments: 7
- inProgressAssignments: 2
- notStartedAssignments: 1
- Total: 10

#### 7.2: Grade Trend Calculation
Given last 10 grades (most recent first):
- [85, 87, 88, 75, 76, 77, 70, 72, 65, 68]

Recent average (last 3): (85 + 87 + 88) / 3 = 86.67
Earlier average (next 7): (75 + 76 + 77 + 70 + 72 + 65 + 68) / 7 = 71.86

Change: 86.67 - 71.86 = 14.81
Percentage: (14.81 / 71.86) * 100 = 20.6%

Expected:
- trendDirection: "IMPROVING"
- trendPercentage: ~20.6

#### 7.3: Learning Velocity Calculation
Given last 7 days:
- Monday: 1 assignment completed
- Tuesday: 0
- Wednesday: 2 assignments completed
- Thursday: 1 assignment completed
- Friday-Sunday: 0

Expected:
- assignmentsCompleted: 4
- velocity: 4 (assignments per week)

If previous week was 6:
- velocityChange: ((4 - 6) / 6) * 100 = -33.33%
- Alert triggered (>25% drop)

---

## 🔍 Common Issues & Solutions

### Issue 1: Progress Not Calculating
**Symptoms:** Dashboard shows 0% completion rate despite completed assignments

**Solutions:**
1. Check assignment status in database (should be GRADED or SUBMITTED)
2. Verify AssignmentProgress records exist
3. Trigger manual calculation:
   ```
   POST /api/v1/progress/calculate/{studentId}/{classId}
   ```
4. Check backend logs for errors

### Issue 2: Time Tracking Not Working
**Symptoms:** timeSpent remains 0 after working on assignment

**Solutions:**
1. Check browser console for PATCH requests
2. Verify rate limiting isn't blocking (max 1 req/minute)
3. Check backend logs for validation errors
4. Ensure assignment page stays open for 5+ minutes

### Issue 3: Concept Mastery Empty
**Symptoms:** No concepts showing despite completed assignments

**Solutions:**
1. Verify questions have `concept` field populated
2. Check if assignments are graded (concepts update on grading)
3. Look for concept_masteries records in database
4. Trigger manual answer grading if needed

### Issue 4: Velocity Not Updating
**Symptoms:** learningVelocity shows 0 or old data

**Solutions:**
1. Check if cron job ran (logs: "Weekly velocity calculation")
2. Verify LearningVelocityLog records exist
3. Check if at least 7 days of data exists
4. Run manual velocity calculation (see Scenario 4.1)

### Issue 5: WebSocket Not Connecting
**Symptoms:** No real-time updates, console shows connection errors

**Solutions:**
1. Verify backend WebSocket server initialized
2. Check JWT token is valid
3. Look for CORS issues in browser console
4. Ensure socket.io client is imported correctly
5. Check firewall/proxy settings

---

## ✅ Test Completion Checklist

### Backend Tests
- [ ] All progress API endpoints return 200
- [ ] StudentProgress records created correctly
- [ ] AssignmentProgress tracks status accurately
- [ ] Time tracking updates every 5 minutes
- [ ] Concept mastery calculates correctly
- [ ] Learning velocity cron job runs weekly
- [ ] Velocity alerts trigger at 25% drop
- [ ] Concept paths can be created/edited/deleted
- [ ] WebSocket events emit correctly
- [ ] Multi-tenancy filtering works (schoolId)
- [ ] Authorization prevents unauthorized access

### Frontend Tests
- [ ] Progress dashboard renders without errors
- [ ] All cards show correct data
- [ ] Refresh button works
- [ ] Loading states display
- [ ] Error handling shows user-friendly messages
- [ ] Responsive design works on mobile
- [ ] Assignment progress tracker shows real-time progress
- [ ] Concept mastery visualization displays correctly
- [ ] Learning path editor (teacher) functions properly
- [ ] WebSocket updates work (if implemented)

### Integration Tests
- [ ] Complete assignment → Progress updates
- [ ] Time tracking → Total time increases
- [ ] Concept mastery → Remediation flags set
- [ ] Velocity drop → Teacher alert sent
- [ ] Path customization → Students see updated paths
- [ ] Grade published → Trend recalculated

### Performance Tests
- [ ] Dashboard loads < 2 seconds
- [ ] API responses < 500ms
- [ ] No memory leaks during time tracking
- [ ] WebSocket reconnects automatically
- [ ] Cron job completes < 1 minute for 100 students

---

## 📊 Test Results Template

```markdown
## Test Results - [Date]

### Environment
- Backend Version: [commit hash]
- Frontend Version: [commit hash]
- Database: PostgreSQL [version]
- Node.js: [version]

### Test Summary
- Total Tests: X
- Passed: Y
- Failed: Z
- Skipped: W

### Failed Tests
1. [Test Name]
   - Error: [description]
   - Steps to Reproduce: [steps]
   - Expected: [expected result]
   - Actual: [actual result]

### Performance Metrics
- Average API Response Time: Xms
- Dashboard Load Time: Xms
- Time Tracking Accuracy: X%
- WebSocket Latency: Xms

### Notes
- [Any observations]
- [Issues discovered]
- [Recommendations]
```

---

## 🎉 Success Criteria

All tests pass when:
- ✅ Progress dashboard displays accurate data
- ✅ Time tracking works automatically
- ✅ Concept mastery updates after assignments
- ✅ Learning velocity calculates weekly
- ✅ Teacher can customize learning paths
- ✅ No console errors
- ✅ No database errors
- ✅ API performance < 500ms
- ✅ WebSocket updates work (if implemented)
- ✅ Mobile responsive
- ✅ User feedback is clear and helpful

**When all tests pass, Batch 8 is complete and ready for production!** 🚀
