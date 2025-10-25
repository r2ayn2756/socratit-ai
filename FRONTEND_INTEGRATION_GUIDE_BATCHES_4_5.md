# Frontend Integration Guide - Batches 4 & 5
## Grading System & Analytics

This guide shows you how to integrate the new **Grading System** (Batch 4) and **Analytics & Insights** (Batch 5) features into the React frontend.

---

## Overview

### What's New in Backend

**Batch 4 - Grading System:**
- Weighted category grading
- Drop lowest N scores
- Letter grade conversion (A+ to F)
- Grade distribution analytics
- 8 new API endpoints

**Batch 5 - Analytics & Insights:**
- Concept mastery tracking
- Student performance metrics
- Struggling student identification
- Class analytics overview
- 5 new API endpoints

---

## API Endpoints Reference

### Grade Endpoints

```typescript
// Get student's grades for a class
GET /api/v1/grades/student/:studentId/class/:classId

// Get all students' grades in class (teacher)
GET /api/v1/grades/class/:classId

// Get student's grades across all classes
GET /api/v1/grades/student/:studentId

// Get grade history
GET /api/v1/grades/student/:studentId/history?classId=&gradeType=

// Create/update grade categories
POST /api/v1/grades/categories
Body: { classId, categories: [...] }

// Get grade categories for class
GET /api/v1/grades/categories/:classId

// Get grade distribution
GET /api/v1/grades/class/:classId/distribution

// Apply curve to class
POST /api/v1/grades/class/:classId/curve
Body: { curveAmount: number }
```

### Analytics Endpoints

```typescript
// Get student concept mastery
GET /api/v1/analytics/student/:studentId/concepts?classId=

// Get student insights
GET /api/v1/analytics/student/:studentId/insights?classId=

// Get struggling students (teacher)
GET /api/v1/analytics/class/:classId/struggling-students

// Get class overview (teacher)
GET /api/v1/analytics/class/:classId/overview

// Recalculate analytics (teacher)
POST /api/v1/analytics/class/:classId/recalculate
```

---

## Frontend File Structure

```
socratit-wireframes/
├── src/
│   ├── services/
│   │   ├── grade.service.ts          # NEW
│   │   └── analytics.service.ts      # NEW
│   ├── components/
│   │   ├── grades/
│   │   │   ├── GradeCard.tsx         # NEW
│   │   │   ├── GradeDistribution.tsx # NEW
│   │   │   ├── CategoryGrades.tsx    # NEW
│   │   │   └── LetterGradeBadge.tsx  # NEW
│   │   └── analytics/
│   │       ├── ConceptMastery.tsx    # NEW
│   │       ├── PerformanceChart.tsx  # NEW
│   │       ├── StrugglingStudents.tsx # NEW
│   │       └── ClassOverview.tsx     # NEW
│   ├── pages/
│   │   ├── teacher/
│   │   │   ├── TeacherAnalytics.tsx  # NEW
│   │   │   └── GradeManagement.tsx   # NEW
│   │   └── student/
│   │       └── StudentProgress.tsx    # NEW
│   └── types/
│       ├── grade.types.ts            # NEW
│       └── analytics.types.ts        # NEW
```

---

## Implementation Steps

### Step 1: Create Type Definitions
### Step 2: Create API Service Files
### Step 3: Create UI Components
### Step 4: Create Pages
### Step 5: Update Routing
### Step 6: Test Integration

---

## Quick Start Checklist

- [ ] Backend running on http://localhost:3001
- [ ] Frontend running on http://localhost:3000
- [ ] Database migrated with Batch 4 & 5 schemas
- [ ] Test data seeded (teachers, students, classes)
- [ ] JWT authentication working
- [ ] CORS configured correctly

---

## Testing the Integration

### 1. Login as Teacher
- Navigate to `/teacher/analytics`
- View class overview
- See struggling students
- Check grade distribution

### 2. Configure Grade Categories
- Navigate to `/teacher/grades/:classId`
- Set up weighted categories
- Save configuration

### 3. Login as Student
- Navigate to `/student/progress`
- View overall grades
- See concept mastery
- Check performance trends

---

## Common Issues & Solutions

### CORS Errors
```typescript
// In backend .env file:
FRONTEND_URL=http://localhost:3000
```

### 401 Unauthorized
- Ensure JWT token is being sent in Authorization header
- Check token hasn't expired
- Verify user has correct role

### Empty Data
- Run analytics recalculation: POST /api/v1/analytics/class/:classId/recalculate
- Ensure students have submitted assignments
- Check grade categories are configured

---

## Next Steps After Integration

1. **Add Real-time Updates** - Batch 6 (Notifications)
2. **Add Charts Library** - Install recharts or chart.js
3. **Add Export Functionality** - CSV/PDF grade exports
4. **Add Filtering** - Filter by date, category, student
5. **Add Sorting** - Sort tables by different columns

---

**Integration Complete!** 🎉

The frontend is now fully connected to the Grading System and Analytics features.
