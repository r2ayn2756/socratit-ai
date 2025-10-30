# Quick Start Guide - Testing Curriculum Features

## 🎯 What You Saw in Console

```javascript
schedule: null  // ← No curriculum was created for this class
currentUnit: null
upcomingUnits: []
```

This is **EXPECTED** for your existing "Introduction to Calc 3" class because:
- It was created WITHOUT a curriculum
- No AI generation was run
- No units exist

## ✅ To See The New Features, You Must:

### Create a NEW Class WITH Curriculum

Follow these steps exactly:

---

## Step-by-Step Instructions

### 1. Navigate to Create Class
Go to: https://socratit-ai.vercel.app/teacher/classes

Click: **"+ Create New Class"** button

### 2. Fill Out Class Details
- **Class Name:** "Biology 101 Test"
- **Subject:** Biology
- **Grade Level:** 10th Grade
- **Description:** (optional)
- Click **"Next"**

### 3. **IMPORTANT: Upload a Curriculum PDF**

This is the critical step:

- Click **"Upload Curriculum"** or drag/drop a PDF
- Use ANY educational PDF (textbook, syllabus, course outline)
- **Don't skip this step!** Without a PDF, no units will be generated
- Wait for upload to complete (green checkmark)
- Click **"Next"**

### 4. Configure School Year
- **Start Date:** August 2024
- **End Date:** May 2025
- **Meeting Pattern:** Daily (Monday-Friday)
- Click **"Next"**

### 5. AI Schedule Generation

**OPTION A: Use AI Generation (Recommended)**
- Select: **"Generate with AI"**
- **Target Units:** 8
- **Pacing:** Standard
- Click **"Generate Schedule"**
- Wait 10-30 seconds for AI to process
- You should see unit preview (might still say "Unit 1", "Unit 2" as placeholders)
- Click **"Next"**

**OPTION B: Skip AI (Manual)**
- Select: **"I'll create it manually"**
- Units won't be auto-generated
- Click **"Next"**

### 6. Review and Create
- Review all settings
- Click **"Create Class"**
- **Watch the browser console!**

### 7. Check Console Logs

You should see:
```javascript
Creating class with data: {
  name: "Biology 101 Test",
  generateWithAI: true,  // ← Should be true if you chose AI
  curriculumMaterialId: "abc-123",  // ← Should have ID
  schoolYearStart: "2024-08-01",
  aiPreferences: { targetUnits: 8 }
}

Class created successfully: {
  id: "xyz-789",
  scheduleId: "schedule-456"  // ← Should have ID!
}

Starting AI schedule generation for schedule: schedule-456
// Wait 10-30 seconds...

AI generation completed: {
  scheduleId: "schedule-456",
  units: [{
    title: "Unit 1: Introduction to Biology",  // ← Check this title!
    description: "...",
    topics: [...]
  }]
}

Navigating to class dashboard: xyz-789

// Then on dashboard:
Loading class data for ID: xyz-789
Schedule loaded: {
  id: "schedule-456",
  units: [...]  // ← Should have units array with 8 units!
}

Units found in schedule: 8 units  // ← Success!
Current unit: Unit 1: Introduction to Biology  // ← Real title!
```

---

## 🎉 What You Should See After Success

### On Class Dashboard:

**Curriculum Section** (not empty):
- Overall Progress: "0 of 8 units completed (0%)"
- **CURRENT UNIT Card** (highlighted blue):
  - Title: "Unit 1: Introduction to Biology" (or similar)
  - Description
  - Date range
  - "4 weeks" estimate
- **Upcoming Units** preview:
  - Unit 2, Unit 3, Unit 4

### Test the Modal:
1. **Click on the current unit card**
2. Beautiful glass modal should open
3. Should show:
   - Difficulty level with gradient bar
   - Topics section (expandable)
   - Learning objectives
   - Key concepts as badges
   - Suggested assessments

### Test Publishing:
1. Click **"Manage Full Schedule"** button
2. Modal opens with all units
3. Top right: **"Publish to Students"** button (green)
4. Click it → Badge changes to "Published"

### Test Student View:
1. Login as a student (or use student account)
2. Navigate to your class
3. You should see **"Curriculum"** tab/link
4. Click it
5. Should show all published units
6. Current unit highlighted
7. Future units with lock icon
8. Click unlocked unit → Modal opens

---

## 🐛 Troubleshooting

### Issue: "No curriculum schedule created"

**Cause:** You skipped uploading a PDF

**Fix:**
- Delete the test class
- Create a new one
- **Must upload PDF in step 3**

### Issue: Console shows "AI generation failed"

**Possible causes:**
1. **No Gemini API key** in Railway backend
2. **PDF text extraction failed**
3. **AI timeout**

**What to check:**
- Railway logs for error messages
- Console error details
- Try with a different, simpler PDF

### Issue: Units still show "Unit 1", "Unit 2" generic titles

**Cause:** AI generation failed silently OR AI is returning generic titles

**Debug:**
1. Check the "AI generation completed" console log
2. Expand it and look at `units[0].title`
3. If it's generic, AI generation isn't working properly
4. Check Railway logs for AI errors

### Issue: Can't click units / modal doesn't open

**Cause:** JavaScript error or modal not rendering

**Fix:**
1. Hard refresh (Ctrl+Shift+R)
2. Check console for errors
3. Verify you're on latest deployment

---

## 📊 Expected vs Actual

### ❌ Your Current Class ("Introduction to Calc 3"):
```javascript
schedule: null  // No curriculum
currentUnit: null
upcomingUnits: []
```
**Reason:** Created without curriculum

### ✅ New Class With Curriculum:
```javascript
schedule: {
  id: "...",
  totalUnits: 8,
  units: [
    { title: "Unit 1: Intro to Biology", ... },
    { title: "Unit 2: Cell Structure", ... },
    ...
  ]
}
currentUnit: { title: "Unit 1: Intro to Biology" }
upcomingUnits: [Unit 2, Unit 3, Unit 4]
```

---

## 🚀 Quick Test Checklist

- [ ] Create new class
- [ ] Upload curriculum PDF
- [ ] Choose "Generate with AI"
- [ ] Wait for generation to complete
- [ ] Check console for "AI generation completed"
- [ ] Verify schedule is not null on dashboard
- [ ] See curriculum section with units
- [ ] Click a unit → Modal opens
- [ ] Publish schedule
- [ ] Test as student

---

## 💡 Pro Tips

1. **Use a small PDF first** - 5-10 pages works best for testing
2. **Watch the console closely** - It tells you exactly what's happening
3. **Be patient** - AI generation can take 10-30 seconds
4. **Hard refresh** - If you don't see changes: Ctrl+Shift+R

---

## 📞 Still Not Working?

Share with me:

1. **Full console log** from class creation (copy/paste the text)
2. **Screenshot** of what you see on the dashboard
3. **Network tab** → Find the POST to `/api/v1/classes` → Copy response
4. **Network tab** → Find GET to `/api/v1/curriculum-schedules/class/:classId` → Copy response

This will tell us exactly where it's failing!

---

**Bottom Line:** Your existing class has no curriculum. Create a NEW class WITH a curriculum PDF to see all the features work!
