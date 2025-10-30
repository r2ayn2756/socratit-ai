# Deployment Status & Debugging Guide

## What Was Deployed (Commit 623473c)

### ✅ Files Successfully Committed & Pushed:
1. `UnitDetailsModal.tsx` - 391 lines of code
2. `StudentCurriculumView.tsx` - 356 lines
3. `progressApi.service.ts` - 138 lines
4. `ClassDashboard.tsx` - Modified with unit modal
5. `CurriculumManagementModal.tsx` - Added publish button
6. `curriculum.types.ts` - Extended types
7. `App.tsx` - Added student route

### 🔍 Current Issue: Units Not Showing Real Titles

## Debugging Steps:

### 1. Check if Vercel Deployed Successfully

Go to: https://vercel.com/your-dashboard
- Check deployment timestamp
- Look for build errors
- Verify it deployed commit `623473c` or later

### 2. Check Backend Logs for AI Generation

The AI generation happens in:
- `socratit-backend/src/services/curriculumSchedule.service.ts` (line 374)
- Calls `analyzeCurriculumForScheduling()`

**Check Railway logs for:**
```
Starting AI schedule generation for schedule: <scheduleId>
AI generation completed: <result>
```

**Possible Issues:**
- Curriculum file not uploaded properly
- PDF text extraction failing
- AI API key missing/invalid
- AI generation timeout
- Response parsing error

### 3. Test the Flow Manually

#### Step-by-Step Test:
1. Create a new class
2. Upload a curriculum PDF (use a small, simple PDF for testing)
3. Go through AI generation wizard
4. Check browser console for:
   - "Creating class with data:" - Should show `generateWithAI: true`
   - "Class created successfully:" - Should show `scheduleId`
   - "Starting AI schedule generation for schedule:"
   - "AI generation completed:"

5. Navigate to class dashboard
6. Check console for:
   - "Schedule loaded:" - Should have `units` array
   - "Units found in schedule: X units"
   - "Current unit: <title>" - **This should show real title, not "Unit 1"**

### 4. Direct Database Check

If you have database access:

```sql
-- Check if schedule was created
SELECT id, title, status, "aiGenerated", "totalUnits"
FROM "CurriculumSchedule"
ORDER BY "createdAt" DESC
LIMIT 5;

-- Check if units were created with real titles
SELECT id, title, description, "unitNumber", "aiGenerated"
FROM "CurriculumUnit"
WHERE "scheduleId" = '<your-schedule-id>'
ORDER BY "orderIndex";
```

**Expected:** Units should have descriptive titles like:
- "Introduction to Cellular Biology"
- "Photosynthesis and Cellular Respiration"
- NOT: "Unit 1", "Unit 2"

### 5. Check Curriculum Material Upload

```sql
-- Check if curriculum was uploaded and processed
SELECT id, title, "fileName", "fileType", "extractedText"
FROM "CurriculumMaterial"
ORDER BY "createdAt" DESC
LIMIT 3;
```

**Check:**
- `extractedText` should have actual content (not empty)
- Should be > 1000 characters typically

### 6. Frontend API Call Verification

Open browser DevTools → Network tab:
1. Navigate to class dashboard
2. Look for API call: `GET /api/v1/curriculum-schedules/class/<classId>`
3. Check response body:
   ```json
   {
     "success": true,
     "data": [{
       "id": "...",
       "units": [
         {
           "title": "Should be real title here",
           "description": "Should be real description",
           "topics": [...]
         }
       ]
     }]
   }
   ```

## Common Issues & Solutions:

### Issue 1: "Unit 1", "Unit 2" showing instead of real titles

**Cause:** AI generation failed or didn't run
**Solution:**
1. Check Railway logs for errors
2. Verify Gemini API key is set: `GEMINI_API_KEY=...`
3. Check curriculum file uploaded successfully
4. Try regenerating: Use "AI Assistant" in Curriculum Management Modal

### Issue 2: No units showing at all

**Cause:** Schedule not created or units array empty
**Solution:**
1. Check if `generateWithAI: true` was sent
2. Check if `scheduleId` was returned from class creation
3. Verify schedule exists in database
4. Check if AI generation endpoint was called

### Issue 3: Frontend changes not visible

**Cause:** Vercel hasn't rebuilt or cached
**Solution:**
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Clear browser cache
3. Check Vercel dashboard for latest deployment
4. Verify commit hash matches

### Issue 4: Can't click on units

**Cause:** Modal integration missing
**Solution:**
1. Verify `ClassDashboard.tsx` has `handleUnitClick`
2. Check console for errors
3. Verify `UnitDetailsModal` component exists

## Quick Test API Endpoint

Test if backend is working:

```bash
# Get class schedule
curl -X GET \
  'https://socratit-ai-production.up.railway.app/api/v1/curriculum-schedules/class/<classId>' \
  -H 'Authorization: Bearer <your-token>'
```

Expected: JSON with units array containing real titles

## Files to Verify Are Deployed:

### Frontend (Vercel):
- [ ] `UnitDetailsModal.tsx` exists
- [ ] `StudentCurriculumView.tsx` exists
- [ ] `ClassDashboard.tsx` imports UnitDetailsModal
- [ ] `App.tsx` has student curriculum route
- [ ] Build succeeds without errors

### Backend (Railway):
- [ ] AI generation service working
- [ ] Gemini API key configured
- [ ] PDF text extraction working
- [ ] Curriculum schedule endpoints working

## Next Steps:

1. **Check Vercel Deployment**
   - Go to vercel.com dashboard
   - Verify latest deployment
   - Check build logs

2. **Test Class Creation**
   - Create a new class with simple curriculum
   - Watch browser console closely
   - Note any error messages

3. **Check Railway Logs**
   - Go to railway.app dashboard
   - Check deployment logs
   - Look for AI generation logs

4. **Report Back**
   - Share console errors
   - Share API response for schedule
   - Share Railway AI generation logs

---

## Expected Behavior After Fix:

✅ Teacher creates class with curriculum PDF
✅ AI analyzes PDF and creates units like "Introduction to Biology", "Cell Structure", etc.
✅ Teacher sees units with real titles in dashboard
✅ Teacher clicks unit → Beautiful modal opens with all details
✅ Teacher clicks "Publish to Students"
✅ Students navigate to `/student/classes/:classId/curriculum`
✅ Students see all published units
✅ Students click unlocked unit → Modal opens

---

**Deployment Time:** Oct 30, 2025 ~2:00 AM
**Commit:** 623473c
**Files Changed:** 7 files, ~1000 lines of new code
