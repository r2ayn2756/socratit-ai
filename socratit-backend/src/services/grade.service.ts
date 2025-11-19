// ============================================================================
// GRADE CALCULATION SERVICE
// Handles grade calculations, weighted categories, and letter grade conversion
// ============================================================================

import { PrismaClient, LetterGrade } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// INTERFACES
// ============================================================================

interface CategoryGrade {
  categoryName: string;
  weight: number;
  scores: number[]; // Array of percentages
  dropLowest: number;
  averagePercentage: number;
  weightedScore: number;
}

interface GradeCalculationResult {
  overallPercentage: number;
  letterGrade: LetterGrade;
  categoryGrades: CategoryGrade[];
  totalPointsEarned: number;
  totalPointsPossible: number;
}

// ============================================================================
// LETTER GRADE CONVERSION
// ============================================================================

export function percentageToLetterGrade(percentage: number): LetterGrade {
  if (percentage >= 97) return LetterGrade.A_PLUS;
  if (percentage >= 93) return LetterGrade.A;
  if (percentage >= 90) return LetterGrade.A_MINUS;
  if (percentage >= 87) return LetterGrade.B_PLUS;
  if (percentage >= 83) return LetterGrade.B;
  if (percentage >= 80) return LetterGrade.B_MINUS;
  if (percentage >= 77) return LetterGrade.C_PLUS;
  if (percentage >= 73) return LetterGrade.C;
  if (percentage >= 70) return LetterGrade.C_MINUS;
  if (percentage >= 67) return LetterGrade.D_PLUS;
  if (percentage >= 63) return LetterGrade.D;
  if (percentage >= 60) return LetterGrade.D_MINUS;
  return LetterGrade.F;
}

// ============================================================================
// CALCULATE STUDENT'S OVERALL GRADE FOR A CLASS
// Uses weighted categories and handles dropped scores
// ============================================================================

export async function calculateStudentGrade(
  studentId: string,
  classId: string,
  schoolId: string
): Promise<GradeCalculationResult> {
  // Get all grade categories for this class
  const gradeCategories = await prisma.gradeCategory.findMany({
    where: {
      classId,
      schoolId,
      deletedAt: null,
    },
    orderBy: {
      sortOrder: 'asc',
    },
  });

  // Get all graded submissions for this student in this class
  const submissions = await prisma.submission.findMany({
    where: {
      studentId,
      assignment: {
        classId,
        schoolId,
        deletedAt: null,
      },
      status: 'GRADED',
    },
    include: {
      assignment: {
        select: {
          type: true,
          totalPoints: true,
        },
      },
    },
  });

  // If no submissions, return zeros
  if (submissions.length === 0) {
    return {
      overallPercentage: 0,
      letterGrade: LetterGrade.F,
      categoryGrades: [],
      totalPointsEarned: 0,
      totalPointsPossible: 0,
    };
  }

  // Map assignment types to category names
  const typeToCategory: Record<string, string> = {
    PRACTICE: 'Practice',
    ESSAY: 'Essays',
  };

  // Group submissions by category
  const submissionsByCategory: Record<string, typeof submissions> = {};
  submissions.forEach((submission) => {
    const categoryName =
      typeToCategory[submission.assignment.type] || submission.assignment.type;
    if (!submissionsByCategory[categoryName]) {
      submissionsByCategory[categoryName] = [];
    }
    submissionsByCategory[categoryName].push(submission);
  });

  const categoryGrades: CategoryGrade[] = [];
  let totalWeightedScore = 0;
  let totalWeight = 0;

  // Calculate grade for each category
  for (const category of gradeCategories) {
    const categorySubmissions = submissionsByCategory[category.name] || [];

    if (categorySubmissions.length === 0) {
      // Skip empty categories
      continue;
    }

    // Get all percentages for this category
    let percentages = categorySubmissions
      .map((s) => s.percentage || 0)
      .sort((a, b) => a - b); // Sort ascending

    // Drop lowest N scores
    if (category.dropLowest > 0 && percentages.length > category.dropLowest) {
      percentages = percentages.slice(category.dropLowest);
    }

    // Calculate average percentage
    const averagePercentage =
      percentages.length > 0
        ? percentages.reduce((sum, p) => sum + p, 0) / percentages.length
        : 0;

    // Calculate weighted score
    const weightedScore = (averagePercentage * category.weight) / 100;

    categoryGrades.push({
      categoryName: category.name,
      weight: category.weight,
      scores: percentages,
      dropLowest: category.dropLowest,
      averagePercentage,
      weightedScore,
    });

    totalWeightedScore += weightedScore;
    totalWeight += category.weight;
  }

  // Calculate overall percentage
  // If weights don't add up to 100, normalize them
  const overallPercentage =
    totalWeight > 0 ? (totalWeightedScore / totalWeight) * 100 : 0;

  // Calculate total points earned and possible
  const totalPointsEarned = submissions.reduce(
    (sum, s) => sum + (s.earnedPoints || 0),
    0
  );
  const totalPointsPossible = submissions.reduce(
    (sum, s) => sum + (s.possiblePoints || 0),
    0
  );

  return {
    overallPercentage: Math.round(overallPercentage * 100) / 100,
    letterGrade: percentageToLetterGrade(overallPercentage),
    categoryGrades,
    totalPointsEarned,
    totalPointsPossible,
  };
}

// ============================================================================
// SAVE GRADE RECORDS TO DATABASE
// Creates/updates Grade records for assignment, category, and overall grades
// ============================================================================

export async function saveStudentGrades(
  studentId: string,
  classId: string,
  schoolId: string
): Promise<void> {
  // Calculate grades
  const gradeResult = await calculateStudentGrade(studentId, classId, schoolId);

  // Save category grades
  for (const categoryGrade of gradeResult.categoryGrades) {
    const pointsEarned = (categoryGrade.averagePercentage / 100) * 100; // Normalized
    const pointsPossible = 100;

    // Find existing category grade
    const existingGrade = await prisma.grade.findFirst({
      where: {
        studentId,
        classId,
        gradeType: 'category',
        categoryName: categoryGrade.categoryName,
      },
    });

    if (existingGrade) {
      // Update existing
      await prisma.grade.update({
        where: { id: existingGrade.id },
        data: {
          pointsEarned,
          pointsPossible,
          percentage: categoryGrade.averagePercentage,
          letterGrade: percentageToLetterGrade(categoryGrade.averagePercentage),
          weightedScore: categoryGrade.weightedScore,
          gradeDate: new Date(),
        },
      });
    } else {
      // Create new
      await prisma.grade.create({
        data: {
          studentId,
          classId,
          schoolId,
          gradeType: 'category',
          categoryName: categoryGrade.categoryName,
          pointsEarned,
          pointsPossible,
          percentage: categoryGrade.averagePercentage,
          letterGrade: percentageToLetterGrade(categoryGrade.averagePercentage),
          weightedScore: categoryGrade.weightedScore,
          gradeDate: new Date(),
        },
      });
    }
  }

  // Save overall grade
  const existingOverallGrade = await prisma.grade.findFirst({
    where: {
      studentId,
      classId,
      gradeType: 'overall',
    },
  });

  if (existingOverallGrade) {
    await prisma.grade.update({
      where: { id: existingOverallGrade.id },
      data: {
        pointsEarned: gradeResult.totalPointsEarned,
        pointsPossible: gradeResult.totalPointsPossible,
        percentage: gradeResult.overallPercentage,
        letterGrade: gradeResult.letterGrade,
        gradeDate: new Date(),
      },
    });
  } else {
    await prisma.grade.create({
      data: {
        studentId,
        classId,
        schoolId,
        gradeType: 'overall',
        pointsEarned: gradeResult.totalPointsEarned,
        pointsPossible: gradeResult.totalPointsPossible,
        percentage: gradeResult.overallPercentage,
        letterGrade: gradeResult.letterGrade,
        gradeDate: new Date(),
      },
    });
  }
}

// ============================================================================
// SAVE ASSIGNMENT GRADE
// Creates a Grade record for a single assignment submission
// ============================================================================

export async function saveAssignmentGrade(
  submissionId: string
): Promise<void> {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      assignment: {
        select: {
          id: true,
          classId: true,
          schoolId: true,
          type: true,
          totalPoints: true,
        },
      },
    },
  });

  if (!submission || submission.status !== 'GRADED') {
    return;
  }

  // Map assignment type to category name
  const typeToCategory: Record<string, string> = {
    PRACTICE: 'Practice',
    ESSAY: 'Essays',
  };

  const categoryName =
    typeToCategory[submission.assignment.type] || submission.assignment.type;

  // Create or update assignment grade
  const existingAssignmentGrade = await prisma.grade.findFirst({
    where: {
      studentId: submission.studentId,
      assignmentId: submission.assignment.id,
    },
  });

  if (existingAssignmentGrade) {
    await prisma.grade.update({
      where: { id: existingAssignmentGrade.id },
      data: {
        pointsEarned: submission.earnedPoints || 0,
        pointsPossible: submission.possiblePoints || 0,
        percentage: submission.percentage || 0,
        letterGrade: percentageToLetterGrade(submission.percentage || 0),
        latePenalty: submission.isLate ? 10 : 0, // Example: 10% late penalty
        gradeDate: new Date(),
      },
    });
  } else {
    await prisma.grade.create({
      data: {
        studentId: submission.studentId,
        classId: submission.assignment.classId,
        schoolId: submission.assignment.schoolId,
        assignmentId: submission.assignment.id,
        gradeType: 'assignment',
        categoryName,
        pointsEarned: submission.earnedPoints || 0,
        pointsPossible: submission.possiblePoints || 0,
        percentage: submission.percentage || 0,
        letterGrade: percentageToLetterGrade(submission.percentage || 0),
        latePenalty: submission.isLate ? 10 : 0,
        gradeDate: new Date(),
      },
    });
  }

  // Recalculate category and overall grades for this student
  await saveStudentGrades(
    submission.studentId,
    submission.assignment.classId,
    submission.assignment.schoolId
  );
}

// ============================================================================
// APPLY CURVE TO CLASS GRADES
// Applies a curve (add/subtract percentage) to all student grades in a class
// ============================================================================

export async function applyCurveToClass(
  classId: string,
  _schoolId: string,
  curveAmount: number // Percentage to add (positive) or subtract (negative)
): Promise<void> {
  // Get all students enrolled in the class
  const enrollments = await prisma.classEnrollment.findMany({
    where: {
      classId,
      status: 'APPROVED',
    },
    select: {
      studentId: true,
    },
  });

  // Apply curve to each student's overall grade
  for (const enrollment of enrollments) {
    const overallGrade = await prisma.grade.findFirst({
      where: {
        studentId: enrollment.studentId,
        classId,
        gradeType: 'overall',
      },
    });

    if (overallGrade) {
      const newPercentage = Math.min(
        100,
        Math.max(0, overallGrade.percentage + curveAmount)
      );

      await prisma.grade.update({
        where: { id: overallGrade.id },
        data: {
          curve: curveAmount,
          percentage: newPercentage,
          letterGrade: percentageToLetterGrade(newPercentage),
          gradeDate: new Date(),
        },
      });
    }
  }
}

// ============================================================================
// GET GRADE DISTRIBUTION
// Returns distribution of letter grades in a class
// ============================================================================

export async function getGradeDistribution(
  classId: string,
  schoolId: string
): Promise<Record<string, number>> {
  const overallGrades = await prisma.grade.findMany({
    where: {
      classId,
      schoolId,
      gradeType: 'overall',
    },
    select: {
      letterGrade: true,
    },
  });

  const distribution: Record<string, number> = {
    A_PLUS: 0,
    A: 0,
    A_MINUS: 0,
    B_PLUS: 0,
    B: 0,
    B_MINUS: 0,
    C_PLUS: 0,
    C: 0,
    C_MINUS: 0,
    D_PLUS: 0,
    D: 0,
    D_MINUS: 0,
    F: 0,
  };

  overallGrades.forEach((grade) => {
    if (grade.letterGrade) {
      distribution[grade.letterGrade]++;
    }
  });

  return distribution;
}
