# Test Curriculum Flow - Step by Step

## ✅ All Code is Deployed

Verified commits contain:
- `f6b8b62`: UnitDetailsModal.tsx created
- `1790a35`: StudentCurriculumView, progressApi.service, and all integrations
- `623473c`: Final polish on UnitDetailsModal
- All pushed to GitHub ✅
- Vercel should auto-deploy ✅

## 🐛 The Real Issue: AI Not Generating Proper Titles

### What Should Happen:
1. Teacher uploads curriculum PDF
2. AI extracts text from PDF
3. AI analyzes content and generates units like:
   - "Unit 1: Introduction to Cellular Biology"
   - "Unit 2: Photosynthesis and Energy Transfer"
   - "Unit 3: Cellular Respiration and Metabolism"

### What's Probably Happening:
AI generation might be:
- ❌ Failing silently
- ❌ Not being called at all
- ❌ Returning generic "Unit 1", "Unit 2" fallback

## 🔍 Diagnostic Steps

### Step 1: Check Vercel Deployment
1. Go to https://vercel.com
2. Find your project
3. Check latest deployment
4. Should show commit `62edaf2` or later
5. Verify build succeeded

### Step 2: Test Class Creation Flow

Open browser DevTools → Console, then:

1. **Navigate to** `/teacher/classes`
2. **Click** "Create Class" button
3. **Upload** a curriculum PDF (any educational PDF)
4. **Go through** the wizard
5. **Watch console** for these logs:

```
Creating class with data: {
  name: "...",
  generateWithAI: true,  ← Should be true
  curriculumMaterialId: "...",  ← Should have value
  aiPreferences: { targetUnits: 8 }
}

Class created successfully: {
  id: "...",
  scheduleId: "..."  ← Should have value
}

Starting AI schedule generation for schedule: abc-123
AI generation completed: { ... }  ← Check this!
```

### Step 3: Check What AI Returned

If you see "AI generation completed", expand that object in console:
```javascript
{
  scheduleId: "...",
  units: [
    {
      title: "???"  ← What is this?
      description: "..."
    }
  ]
}
```

**IF title is "Unit 1":** AI failed or didn't run
**IF title is "Introduction to...":** AI worked!

### Step 4: Navigate to Class Dashboard

After class creation:
1. Should auto-navigate to `/teacher/classes/:classId`
2. **Check console** for:

```
Loading class data for ID: abc-123
Class info loaded: { ... }
Schedule loaded: {
  id: "...",
  units: [...]  ← Should have units array
}
Units found in schedule: 8 units  ← Should show count
Current unit: ???  ← Should show REAL title, not "Unit 1"
```

### Step 5: Try Clicking a Unit

1. In the Curriculum Section, click on a unit card
2. Should open the UnitDetailsModal
3. **IF modal doesn't open:** Check console for errors
4. **IF modal opens:** Success! Check if it shows real data

## 🔧 Common Fixes

### Issue: Vercel Not Deploying

```bash
# Force redeploy
git commit --allow-empty -m "trigger redeploy"
git push
```

### Issue: AI Generation Failing

**Check Railway logs:**
1. Go to https://railway.app
2. Select your backend project
3. Click "Deployments" → "Logs"
4. Search for "AI generation" or "analyzeCurriculum"
5. Look for error messages

**Common causes:**
- Gemini API key not set: `GEMINI_API_KEY=...`
- PDF text extraction failing
- AI timeout (increase timeout)
- Malformed response from AI

### Issue: Frontend Not Showing Changes

**Hard refresh:**
- Windows: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

**Or clear cache:**
1. DevTools → Network tab
2. Check "Disable cache"
3. Refresh page

## 🧪 Quick Backend Test

Test if backend AI generation works:

```bash
# Replace with your auth token and schedule ID
curl -X POST \
  'https://socratit-ai-production.up.railway.app/api/v1/curriculum-schedules/SCHEDULE_ID/generate-ai' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "curriculumMaterialId": "MATERIAL_ID",
    "preferences": {
      "targetUnits": 8,
      "pacingPreference": "standard"
    }
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "scheduleId": "...",
    "units": [
      {
        "title": "Unit 1: Introduction to Biology",  ← Real title!
        "description": "...",
        "topics": [...]
      }
    ]
  }
}
```

## ✅ Success Checklist

After fixes, you should see:

- [ ] Vercel deployed latest code (commit 62edaf2+)
- [ ] Class creation uploads curriculum successfully
- [ ] AI generation runs without errors
- [ ] Console shows "AI generation completed"
- [ ] Units have real titles (not "Unit 1", "Unit 2")
- [ ] Click unit → Modal opens with full details
- [ ] Publish button appears in Curriculum Management Modal
- [ ] Students can view published curriculum at `/student/classes/:classId/curriculum`

## 📊 What You Should See

### Teacher View:
![Teacher should see curriculum with real unit titles]

### Student View:
- Published schedules only
- Current unit highlighted
- Future units locked
- Progress bars on each unit

### Unit Details Modal:
- Difficulty level with gradient bar
- Topics with subtopics
- Learning objectives
- Key concepts as badges
- Suggested assessments
- Time estimates

## 🆘 If Still Not Working

Share these with me:

1. **Console logs** from class creation
2. **Network tab** response from `/api/v1/classes` POST
3. **Network tab** response from `/api/v1/curriculum-schedules/class/:classId` GET
4. **Railway logs** for AI generation
5. **Screenshot** of what you're seeing

---

**Bottom Line:** The code IS deployed. The issue is likely AI generation on the backend not running or failing. Follow the diagnostic steps above to identify where it's breaking.
