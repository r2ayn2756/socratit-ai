# Quick Start Guide - UI Components
## How to Use the New Grading & Analytics Components

---

## Import Statements

```typescript
// Grade Components
import { LetterGradeBadge } from '../../components/grades/LetterGradeBadge';
import { GradeCard } from '../../components/grades/GradeCard';
import { CategoryGrades } from '../../components/grades/CategoryGrades';
import { GradeDistribution } from '../../components/grades/GradeDistribution';

// Analytics Components
import { ConceptMastery } from '../../components/analytics/ConceptMastery';
import { PerformanceChart } from '../../components/analytics/PerformanceChart';
import { StrugglingStudents } from '../../components/analytics/StrugglingStudents';
import { ClassOverview } from '../../components/analytics/ClassOverview';

// API Services
import { getStudentClassGrades, getGradeDistribution } from '../../services/grade.service';
import { getStudentConceptMastery, getClassOverview } from '../../services/analytics.service';

// Types
import { Grade, GradeDistribution as GradeDistType } from '../../types/grade.types';
import { ConceptMastery as ConceptType, ClassOverview as OverviewType } from '../../types/analytics.types';
```

---

## Basic Usage Examples

### 1. Letter Grade Badge

```tsx
// Simple usage
<LetterGradeBadge grade="A_PLUS" />

// With options
<LetterGradeBadge
  grade="B_MINUS"
  size="lg"
  animated={true}
/>
```

**Props:**
- `grade`: LetterGrade (required) - 'A_PLUS' | 'A' | 'A_MINUS' | ... | 'F'
- `size`: 'sm' | 'md' | 'lg' (optional, default: 'md')
- `animated`: boolean (optional, default: true)

---

### 2. Grade Card

```tsx
// Display a single assignment grade
<GradeCard
  grade={gradeObject}
  showDetails={true}
  onClick={() => navigateToGradeDetails(gradeId)}
/>
```

**Props:**
- `grade`: Grade (required) - Complete grade object
- `showDetails`: boolean (optional, default: true)
- `onClick`: () => void (optional)

**Grade Object Structure:**
```typescript
{
  id: "uuid",
  pointsEarned: 85,
  pointsPossible: 100,
  percentage: 85,
  letterGrade: "B",
  weightedScore: 34,
  extraCredit: 5,
  latePenalty: 0,
  curve: 2,
  isDropped: false,
  teacherComments: "Great work!",
  assignment: {
    title: "Midterm Exam",
    type: "Test"
  }
}
```

---

### 3. Category Grades

```tsx
// Show grade breakdown by category
<CategoryGrades
  categoryGrades={[
    {
      categoryName: "Tests",
      weight: 40,
      scores: [85, 90, 88],
      dropLowest: 0,
      averagePercentage: 87.7,
      weightedScore: 35.08
    },
    // ... more categories
  ]}
  overallPercentage={91.5}
/>
```

**Props:**
- `categoryGrades`: CategoryGrade[] (required)
- `overallPercentage`: number (required)
- `showWeights`: boolean (optional, default: true)

---

### 4. Grade Distribution

```tsx
// Show class grade distribution
<GradeDistribution
  distribution={{
    A_PLUS: 3,
    A: 5,
    A_MINUS: 4,
    B_PLUS: 6,
    B: 5,
    B_MINUS: 3,
    C_PLUS: 2,
    C: 0,
    C_MINUS: 0,
    D_PLUS: 0,
    D: 0,
    D_MINUS: 0,
    F: 0
  }}
  totalStudents={28}
  showPercentages={true}
/>
```

**Props:**
- `distribution`: GradeDistribution (required) - Count for each letter grade
- `totalStudents`: number (required)
- `title`: string (optional, default: 'Grade Distribution')
- `showPercentages`: boolean (optional, default: true)

---

### 5. Concept Mastery

```tsx
// Track student concept proficiency
<ConceptMastery
  concepts={[
    {
      id: "1",
      concept: "quadratic equations",
      masteryLevel: "PROFICIENT",
      masteryPercent: 85,
      totalAttempts: 20,
      correctAttempts: 17,
      trend: "IMPROVING",
      subject: "Algebra",
      lastAssessed: "2025-10-20"
    },
    // ... more concepts
  ]}
  title="Concept Mastery"
  showTrends={true}
/>
```

**Props:**
- `concepts`: ConceptMastery[] (required)
- `title`: string (optional, default: 'Concept Mastery')
- `showTrends`: boolean (optional, default: true)

**Mastery Levels:**
- `NOT_STARTED` (0%) - Gray
- `BEGINNING` (<40%) - Red
- `DEVELOPING` (40-69%) - Orange
- `PROFICIENT` (70-89%) - Blue
- `MASTERED` (90%+) - Green

---

### 6. Performance Chart

```tsx
// Line chart showing performance over time
<PerformanceChart
  data={[
    {
      date: "2025-10-01",
      score: 85,
      assignmentTitle: "Chapter 1 Quiz",
      categoryName: "Quizzes"
    },
    {
      date: "2025-10-08",
      score: 92,
      assignmentTitle: "Homework Set 3",
      categoryName: "Homework"
    },
    // ... more data points
  ]}
  title="Performance Over Time"
  showTrend={true}
  showAverage={true}
/>
```

**Props:**
- `data`: PerformanceDataPoint[] (required)
- `title`: string (optional, default: 'Performance Over Time')
- `showTrend`: boolean (optional, default: true)
- `showAverage`: boolean (optional, default: true)

---

### 7. Struggling Students

```tsx
// Teacher view: Students needing intervention
<StrugglingStudents
  students={[
    {
      studentId: "uuid",
      firstName: "Alex",
      lastName: "Rodriguez",
      interventionLevel: "HIGH",
      averageScore: 68,
      completionRate: 75,
      hasMissedAssignments: true,
      hasDecliningGrade: true,
      hasConceptGaps: true,
      hasLowEngagement: false,
      strugglingConcepts: ["quadratic equations", "polynomials"],
      recommendations: [
        "Schedule one-on-one tutoring",
        "Review missed assignments"
      ],
      lastActivityDate: "2025-10-20"
    },
    // ... more students
  ]}
  onContactStudent={(studentId) => handleContact(studentId)}
  showDetails={true}
/>
```

**Props:**
- `students`: StrugglingStudent[] (required)
- `title`: string (optional, default: 'Students Needing Support')
- `onContactStudent`: (studentId: string) => void (optional)
- `showDetails`: boolean (optional, default: true)

**Alert Severity Levels:**
- `LOW` - Blue
- `MEDIUM` - Yellow
- `HIGH` - Orange
- `CRITICAL` - Red

---

### 8. Class Overview

```tsx
// Comprehensive class analytics dashboard
<ClassOverview
  overview={{
    totalStudents: 28,
    averageGrade: 87.5,
    passingRate: 92.8,
    strugglingCount: 3,
    improvingCount: 12,
    decliningCount: 2,
    averageCompletionRate: 88.5,
    topConcepts: [
      { concept: "derivatives", averageMastery: 92 },
      { concept: "integration", averageMastery: 88 }
    ],
    strugglingConcepts: [
      { concept: "limits", averageMastery: 65 },
      { concept: "series", averageMastery: 58 }
    ]
  }}
  title="Class Overview"
/>
```

**Props:**
- `overview`: ClassOverview (required)
- `title`: string (optional, default: 'Class Overview')

---

## Complete Page Example

```tsx
import React, { useState, useEffect } from 'react';
import { ClassOverview } from '../../components/analytics/ClassOverview';
import { GradeDistribution } from '../../components/grades/GradeDistribution';
import { getClassOverview, getGradeDistribution } from '../../services/analytics.service';

export const TeacherClassView: React.FC<{ classId: string }> = ({ classId }) => {
  const [overview, setOverview] = useState(null);
  const [distribution, setDistribution] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewData, distData] = await Promise.all([
          getClassOverview(classId),
          getGradeDistribution(classId)
        ]);
        setOverview(overviewData);
        setDistribution(distData);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [classId]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {overview && <ClassOverview overview={overview} />}

      <div className="grid grid-cols-2 gap-6">
        {distribution && overview && (
          <GradeDistribution
            distribution={distribution}
            totalStudents={overview.totalStudents}
          />
        )}
      </div>
    </div>
  );
};
```

---

## Color Palette Reference

```typescript
// Use these Tailwind classes for consistency

// Gradients
'from-green-500 to-green-600'    // A grades, excellent
'from-blue-500 to-blue-600'      // B grades, proficient
'from-yellow-500 to-yellow-600'  // C grades, developing
'from-orange-500 to-orange-600'  // D grades, needs help
'from-red-500 to-red-600'        // F grades, critical
'from-purple-500 to-purple-600'  // Brand, analytics
'from-indigo-500 to-indigo-600'  // Primary actions
'from-cyan-500 to-cyan-600'      // Info, special

// Backgrounds
'bg-{color}-50'   // Light backgrounds
'bg-{color}-100'  // Medium backgrounds

// Text
'text-{color}-600'  // Normal emphasis
'text-{color}-700'  // Strong emphasis
'text-{color}-900'  // Highest emphasis

// Borders
'border-{color}-200'  // Light borders
'border-{color}-300'  // Medium borders
```

---

## Animation Patterns

```tsx
// Standard fade-in animation
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}
>
  {/* content */}
</motion.div>

// Staggered children
<motion.div
  initial="hidden"
  animate="visible"
  variants={{
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }}
>
  {items.map((item, index) => (
    <motion.div
      key={index}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
    >
      {item}
    </motion.div>
  ))}
</motion.div>

// Hover effect
<motion.div whileHover={{ scale: 1.05 }}>
  {/* content */}
</motion.div>

// Loading spinner
<motion.div
  animate={{ rotate: 360 }}
  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
>
  <RefreshCw className="w-8 h-8" />
</motion.div>
```

---

## Common Pitfalls

### ❌ Don't:
```tsx
// Missing type imports
<GradeCard grade={gradeData} /> // TypeScript error

// Incorrect letter grade format
<LetterGradeBadge grade="A+" /> // Should be "A_PLUS"

// Missing required props
<GradeDistribution distribution={data} /> // Missing totalStudents
```

### ✅ Do:
```tsx
// Import types
import { Grade } from '../../types/grade.types';

// Use correct enum format
<LetterGradeBadge grade="A_PLUS" />

// Provide all required props
<GradeDistribution
  distribution={data}
  totalStudents={28}
/>
```

---

## Troubleshooting

**Component not displaying:**
1. Check that all required props are provided
2. Verify data matches expected TypeScript types
3. Check console for errors

**Animations not working:**
1. Ensure framer-motion is installed: `npm install framer-motion`
2. Check that parent has enough height/width

**Colors not matching:**
1. Use exact Tailwind classes from design system
2. Don't mix custom CSS with Tailwind

**API errors:**
1. Check backend is running on correct port
2. Verify CORS is configured
3. Check JWT token is valid

---

## Support

For questions or issues:
1. Check `UI_COMPONENTS_COMPLETE_SUMMARY.md` for detailed documentation
2. Review `FRONTEND_INTEGRATION_GUIDE_BATCHES_4_5.md` for API details
3. See backend controller files for API specifications
4. Check component source code for inline comments

---

**Quick Start Complete!** 🚀

You now have everything you need to use the new grading and analytics components in your application.
