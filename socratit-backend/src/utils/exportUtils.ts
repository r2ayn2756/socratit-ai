// ============================================================================
// EXPORT UTILITIES
// Functions for exporting analytics data to CSV and JSON
// ============================================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Convert array of objects to CSV string
 */
function arrayToCSV(data: any[], headers: string[]): string {
  const csvRows = [];

  // Add header row
  csvRows.push(headers.join(','));

  // Add data rows
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];
      // Escape commas and quotes
      if (value === null || value === undefined) return '';
      const escaped = String(value).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

/**
 * Export class grades to CSV
 */
export async function exportClassGradesCSV(
  classId: string,
  schoolId: string
): Promise<string> {
  // Get all submissions with assignment data
  const submissions = await prisma.submission.findMany({
    where: {
      assignment: {
        classId,
        schoolId,
        status: 'ACTIVE',
        deletedAt: null,
      },
      status: 'GRADED',
    },
    include: {
      assignment: {
        select: {
          title: true,
        },
      },
      student: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  // Build export data
  const exportData: any[] = [];

  for (const sub of submissions) {
    // Calculate letter grade from percentage
    let letterGrade = 'F';
    if (sub.percentage && sub.percentage >= 90) letterGrade = 'A';
    else if (sub.percentage && sub.percentage >= 80) letterGrade = 'B';
    else if (sub.percentage && sub.percentage >= 70) letterGrade = 'C';
    else if (sub.percentage && sub.percentage >= 60) letterGrade = 'D';

    exportData.push({
      'Student Name': `${sub.student.firstName} ${sub.student.lastName}`,
      'Email': sub.student.email,
      'Assignment': sub.assignment?.title || 'Unknown',
      'Score': sub.percentage || 0,
      'Letter Grade': letterGrade,
      'Submitted At': sub.submittedAt?.toISOString() || '',
      'Time Spent (minutes)': Math.round((sub.timeSpent || 0) / 60),
    });
  }

  const headers = [
    'Student Name',
    'Email',
    'Assignment',
    'Score',
    'Letter Grade',
    'Submitted At',
    'Time Spent (minutes)',
  ];

  return arrayToCSV(exportData, headers);
}

/**
 * Export student report to JSON
 */
export async function exportStudentReportJSON(
  studentId: string,
  classId: string,
  schoolId: string
): Promise<any> {
  // Get student info
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  });

  // Get student insight
  const insight = await prisma.studentInsight.findFirst({
    where: {
      studentId,
      classId,
      schoolId,
    },
  });

  // Get concept masteries
  const concepts = await prisma.conceptMastery.findMany({
    where: {
      studentId,
      classId,
      schoolId,
    },
    orderBy: {
      masteryPercent: 'desc',
    },
  });

  // Get submissions with assignments
  const submissions = await prisma.submission.findMany({
    where: {
      studentId,
      assignment: {
        classId,
        schoolId,
      },
    },
    include: {
      assignment: {
        select: {
          title: true,
          type: true,
        },
      },
    },
    orderBy: {
      submittedAt: 'desc',
    },
  });

  return {
    student: {
      id: student?.id,
      name: `${student?.firstName} ${student?.lastName}`,
      email: student?.email,
    },
    performance: {
      overallGrade: insight?.averageScore || 0,
      completionRate: insight?.completionRate || 0,
      classRank: insight?.classRank || 0,
      percentile: insight?.percentile || 0,
      totalTimeSpent: insight?.totalTimeSpent || 0,
      avgTimeOnTask: insight?.avgTimeOnTask || 0,
    },
    indicators: {
      isStruggling: insight?.isStruggling || false,
      hasMissedAssignments: insight?.hasMissedAssignments || false,
      hasDecliningGrade: insight?.hasDecliningGrade || false,
      hasLowEngagement: insight?.hasLowEngagement || false,
      hasConceptGaps: insight?.hasConceptGaps || false,
      interventionLevel: insight?.interventionLevel || 'LOW',
    },
    conceptMastery: concepts.map((c) => ({
      concept: c.concept,
      subject: c.subject,
      masteryLevel: c.masteryLevel,
      masteryPercent: c.masteryPercent,
      totalAttempts: c.totalAttempts,
      correctAttempts: c.correctAttempts,
      trend: c.trend,
    })),
    submissions: submissions.map((s) => ({
      assignmentTitle: s.assignment?.title,
      assignmentType: s.assignment?.type,
      status: s.status,
      percentage: s.percentage,
      submittedAt: s.submittedAt,
      timeSpent: s.timeSpent,
    })),
    recommendations: insight?.recommendations || null,
    lastCalculated: insight?.lastCalculated,
    generatedAt: new Date().toISOString(),
  };
}
