# Curriculum Schedule Creation - Debug Guide

## What I Found

Based on your console logs showing "Schedule loaded: null" after creating a class with a curriculum PDF, I've identified that the backend is **not creating the CurriculumSchedule record** even though:

1. ✅ The curriculum file uploads successfully
2. ✅ The class is created successfully
3. ❌ But the schedule is NOT being created

## Changes Made

I've added extensive debug logging to the backend (commit `9c803c6`) to diagnose exactly why the schedule isn't being created. The logging will show:

- Whether all required fields (`curriculumMaterialId`, `schoolYearStart`, `schoolYearEnd`) are received by the backend
- Whether the schedule creation is attempted
- Whether it succeeds or fails with an error
- The scheduleId being returned in the response

## How To Test

### Step 1: Wait for Railway Deployment (2-3 minutes)

Railway should auto-deploy the latest commit. Check:
- https://railway.app → Your project → Deployments
- Wait for "Active" status

### Step 2: Create a Test Class

1. Navigate to: https://socratit-ai.vercel.app/teacher/classes
2. Click "Create New Class"
3. Fill in details:
   - Name: "Debug Test Biology"
   - Subject: Biology
   - Grade: 10th
4. **Upload a curriculum PDF** (this is critical!)
5. Set school year: Aug 2024 - May 2025
6. Choose "Generate with AI" → 8 units → Standard pacing
7. Click through to create the class
8. **Watch the browser console closely**

### Step 3: Check Railway Logs

As soon as you create the class, immediately go to:
1. https://railway.app
2. Your socratit-backend project
3. Click "Deployments" → Latest deployment
4. Click "View Logs"
5. Look for `[DEBUG]` entries

### What You Should See in Railway Logs

**If everything works:**
```
[DEBUG] Checking curriculum data: {
  hasCurriculumMaterialId: true,
  hasSchoolYearStart: true,
  hasSchoolYearEnd: true,
  curriculumMaterialId: 'abc-123-...',
  schoolYearStart: '2024-08-01T00:00:00.000Z',
  schoolYearEnd: '2025-05-31T00:00:00.000Z',
  generateWithAI: true
}
[DEBUG] Creating curriculum schedule...
[DEBUG] Curriculum schedule created successfully: xyz-789-...
[DEBUG] Sending response with scheduleId: xyz-789-...
```

**If a field is missing:**
```
[DEBUG] Checking curriculum data: {
  hasCurriculumMaterialId: true,
  hasSchoolYearStart: false,  ← PROBLEM!
  hasSchoolYearEnd: true,
  ...
}
[DEBUG] Skipping curriculum schedule creation - missing required fields
```

**If database error:**
```
[DEBUG] Creating curriculum schedule...
[ERROR] Failed to create curriculum schedule: {
  error details here...
}
```

## Common Issues & Solutions

### Issue 1: Missing schoolYearStart or schoolYearEnd

**Symptoms:** Logs show `hasSchoolYearStart: false` or `hasSchoolYearEnd: false`

**Cause:** Frontend not sending the dates, or they're null

**Fix:** Check ClassCreationWizard state - are dates being saved correctly in SchoolYearStep?

### Issue 2: Database Constraint Error

**Symptoms:** Logs show `[ERROR] Failed to create curriculum schedule: Prisma error...`

**Possible Causes:**
- Foreign key violation (curriculumMaterialId doesn't exist in CurriculumMaterial table)
- Missing required field in Prisma schema
- Invalid date format

**Fix:** Will depend on the specific error message

### Issue 3: Permission/Auth Error

**Symptoms:** 401 or 403 error when creating class

**Fix:** Check if auth token is valid, user has TEACHER role

## What To Send Me

After testing, please share:

1. **Railway Logs** (copy all `[DEBUG]` and `[ERROR]` lines)
2. **Browser Console Output** (everything from "Creating class with data..." onwards)
3. **Network Tab Response**
   - Open DevTools → Network tab
   - Find the POST request to `/api/v1/classes`
   - Right-click → Copy → Copy Response
   - Paste in a text file and share

This will tell us EXACTLY where it's failing!

## Expected Flow (If Working)

1. Frontend uploads curriculum file → Gets `curriculumMaterialId`
2. Frontend sends POST `/api/v1/classes` with:
   ```json
   {
     "name": "Biology 101",
     "curriculumMaterialId": "abc-123",
     "schoolYearStart": "2024-08-01T00:00:00.000Z",
     "schoolYearEnd": "2025-05-31T00:00:00.000Z",
     "generateWithAI": true,
     "aiPreferences": { "targetUnits": 8 }
   }
   ```
3. Backend receives request → Logs show all fields present
4. Backend creates Class record
5. Backend creates CurriculumSchedule record
6. Backend returns response with `scheduleId`
7. Frontend checks for `scheduleId` → Calls AI generation endpoint
8. AI generates units → Units appear in dashboard

## Current Status

- ✅ Debug logging deployed to Railway (commit 9c803c6)
- ⏳ Waiting for you to test and share logs
- 🔍 Will diagnose based on what logs reveal

---

**Next:** Test creating a class with curriculum and share the Railway logs with me!
