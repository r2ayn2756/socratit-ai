// ============================================================================
// GRADES PAGE
// Shows overview of grades by class with detailed assignment breakdown
// ============================================================================

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, Badge } from '../../components/common';
import { GradeCard } from '../../components/grades/GradeCard';
import { CategoryGrades } from '../../components/grades/CategoryGrades';
import { ConceptMastery } from '../../components/analytics/ConceptMastery';
import { PerformanceChart } from '../../components/analytics/PerformanceChart';
import { LetterGradeBadge } from '../../components/grades/LetterGradeBadge';
import {
  getStudentAllGrades,
  getStudentClassGrades,
} from '../../services/grade.service';
import { getStudentConceptMastery, getStudentInsights } from '../../services/analytics.service';
import { Grade, StudentClassGrades } from '../../types/grade.types';
import { ConceptMastery as ConceptMasteryType, StudentInsight } from '../../types/analytics.types';
import { useAuth } from '../../contexts/AuthContext';
import {
  Award,
  TrendingUp,
  TrendingDown,
  BookOpen,
  FileText,
  Brain,
  Target,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

interface GradesProps {}

interface ClassGradeDisplay {
  id: string;
  name: string;
  teacher: string;
  currentGrade: number;
  trend: { value: number; isPositive: boolean };
  color: string;
  assignments: Array<{
    name: string;
    grade: number;
    points: number;
    feedback: string;
    date: string;
    type: string;
  }>;
  breakdown: Record<string, { weight: number; average: number }>;
}

interface PerformanceDataPoint {
  date: string;
  score: number;
  assignmentTitle?: string;
  categoryName?: string;
}

export const Grades: React.FC<GradesProps> = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [allGrades, setAllGrades] = useState<Grade[]>([]);
  const [classGrades, setClassGrades] = useState<ClassGradeDisplay[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceDataPoint[]>([]);
  const [conceptMastery, setConceptMastery] = useState<ConceptMasteryType[]>([]);
  const [insights, setInsights] = useState<StudentInsight[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  // Helper function to format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return '1 week ago';
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  // Helper function to map assignment type to display name
  const formatAssignmentType = (type: string): string => {
    const typeMap: Record<string, string> = {
      'HOMEWORK': 'Homework',
      'QUIZ': 'Quiz',
      'TEST': 'Test',
      'PRACTICE': 'Practice',
      'CHALLENGE': 'Challenge',
    };
    return typeMap[type] || type;
  };

  // Fetch all student data
  const fetchStudentData = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch overall grades for all classes
      const [gradesData, conceptData, insightsData] = await Promise.all([
        getStudentAllGrades(user.id),
        getStudentConceptMastery(user.id),
        getStudentInsights(user.id),
      ]);

      setAllGrades(gradesData);
      setConceptMastery(conceptData);
      setInsights(insightsData);

      // Transform grades data into display format and collect performance data
      const allAssignmentGrades: Grade[] = [];

      const classGradesPromises = gradesData.map(async (grade) => {
        if (!grade.class) return null;

        // Fetch detailed grades for this class
        const classGradeData: StudentClassGrades = await getStudentClassGrades(
          user.id,
          grade.classId
        );

        // Get assignment grades (type: 'assignment')
        const assignmentGrades = classGradeData.grades.filter(
          (g) => g.gradeType === 'assignment'
        );

        // Collect all assignment grades for performance chart
        allAssignmentGrades.push(...assignmentGrades);

        // Sort by date (most recent first) and take top 3
        const recentAssignments = assignmentGrades
          .sort((a, b) => new Date(b.gradeDate).getTime() - new Date(a.gradeDate).getTime())
          .slice(0, 3)
          .map((ag) => ({
            name: ag.assignment?.title || 'Untitled Assignment',
            grade: Math.round(ag.percentage),
            points: ag.pointsPossible,
            feedback: ag.teacherComments || 'Good work!',
            date: formatDate(ag.gradeDate),
            type: formatAssignmentType(ag.assignment?.type || 'Assignment'),
          }));

        // Create breakdown from category grades
        const breakdown: Record<string, { weight: number; average: number }> = {};
        classGradeData.current.categoryGrades.forEach((cat) => {
          breakdown[cat.categoryName.toLowerCase()] = {
            weight: cat.weight,
            average: Math.round(cat.averagePercentage),
          };
        });

        // Calculate trend (mock for now - would need historical data)
        const trend = {
          value: Math.floor(Math.random() * 5),
          isPositive: Math.random() > 0.5,
        };

        return {
          id: grade.classId,
          name: grade.class.name,
          teacher: 'Teacher', // TODO: Add teacher info to backend response
          currentGrade: Math.round(classGradeData.current.overallPercentage),
          trend,
          color: grade.class.color || 'blue',
          assignments: recentAssignments,
          breakdown,
        };
      });

      const transformedClassGrades = (await Promise.all(classGradesPromises)).filter(
        (cg): cg is ClassGradeDisplay => cg !== null
      );

      setClassGrades(transformedClassGrades);

      // Transform assignment grades into performance chart data
      const performanceChartData: PerformanceDataPoint[] = allAssignmentGrades
        .map((ag) => ({
          date: ag.gradeDate,
          score: ag.percentage,
          assignmentTitle: ag.assignment?.title || 'Untitled Assignment',
          categoryName: ag.categoryName || formatAssignmentType(ag.assignment?.type || ''),
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort chronologically

      setPerformanceData(performanceChartData);
    } catch (err: any) {
      console.error('Failed to fetch student data:', err);
      setError(err.message || 'Failed to load grades');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [user?.id]);

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        gradient: 'from-blue-500 to-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-600'
      },
      purple: {
        gradient: 'from-purple-500 to-purple-600',
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-600'
      },
      orange: {
        gradient: 'from-orange-500 to-orange-600',
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-600'
      },
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'text-green-600';
    if (grade >= 80) return 'text-blue-600';
    if (grade >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  const overallGPA = (classGrades.reduce((sum, c) => sum + c.currentGrade, 0) / classGrades.length).toFixed(1);

  return (
    <DashboardLayout userRole="student">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={fadeInUp}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                My Grades
              </h1>
              <p className="text-slate-600">
                Current GPA: {overallGPA}%
              </p>
            </div>
          </div>
        </motion.div>

        {/* Main Content and TA Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Grades List - Takes up 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            {classGrades.map((classItem) => {
              const colors = getColorClasses(classItem.color);

              return (
                <motion.div key={classItem.id} variants={fadeInUp}>
                  <Card padding="none" className="overflow-hidden">
                    {/* Class Header with Gradient */}
                    <div className={`p-6 bg-gradient-to-r ${colors.gradient} text-white`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <BookOpen className="w-6 h-6" />
                            <h2 className="text-2xl font-bold">{classItem.name}</h2>
                          </div>
                          <div className="text-sm opacity-90">
                            {classItem.teacher}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-4xl font-bold mb-1">{classItem.currentGrade}%</div>
                          <div className="flex items-center gap-1 text-sm justify-end">
                            {classItem.trend.isPositive ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : (
                              <TrendingDown className="w-4 h-4" />
                            )}
                            <span>{classItem.trend.value}% from last week</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Grade Breakdown */}
                    <div className="p-6 bg-white">
                      <div className="mb-6">
                        <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-4">
                          Grade Breakdown
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(classItem.breakdown).map(([category, data]: [string, any]) => (
                            <div key={category} className={`p-4 rounded-lg ${colors.bg} border ${colors.border}`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-slate-700 capitalize">
                                  {category}
                                </span>
                                <span className="text-xs text-slate-600">{data.weight}%</span>
                              </div>
                              <div className="text-2xl font-bold text-slate-900">
                                {data.average}%
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recent Assignments */}
                      <div>
                        <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-4">
                          Recent Assignments
                        </div>
                        <div className="space-y-3">
                          {classItem.assignments.map((assignment, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition-all border border-slate-200"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <FileText className="w-4 h-4 text-slate-400" />
                                  <span className="font-semibold text-sm text-slate-900">
                                    {assignment.name}
                                  </span>
                                  <Badge variant="neutral" size="sm">{assignment.type}</Badge>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-600">
                                  <span>{assignment.date}</span>
                                  <span>•</span>
                                  <span className="text-green-600">{assignment.feedback}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`text-3xl font-bold ${getGradeColor(assignment.grade)}`}>
                                  {assignment.grade}
                                </div>
                                <div className="text-xs text-slate-600">
                                  {assignment.grade}/{assignment.points}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* View All Button */}
                      <div className="mt-6 pt-6 border-t border-slate-200">
                        <Button variant="ghost" className="w-full">
                          View All Assignments
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Teaching Assistant - Takes up 1/3 */}
          <motion.div variants={fadeInUp}>
            <div className="space-y-6 sticky top-6">
              {/* TA Card */}
              <Card padding="none" className="overflow-hidden">
                <div className="p-6 bg-gradient-to-br from-brand-purple to-purple-600 text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <Brain className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">Teaching Assistant</h3>
                      <p className="text-sm opacity-90">24/7 Support</p>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full bg-white text-brand-purple hover:bg-white/90"
                  >
                    Ask a Question
                  </Button>

                  <div className="mt-6 pt-6 border-t border-white/20">
                    <p className="text-sm opacity-90 mb-4">
                      Want to improve your grades? I can help with:
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="opacity-70">•</span>
                        <span>Understanding mistakes</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="opacity-70">•</span>
                        <span>Test preparation strategies</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="opacity-70">•</span>
                        <span>Study tips for each subject</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="opacity-70">•</span>
                        <span>Extra practice problems</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>

              {/* GPA Overview Card */}
              <Card padding="none" className="overflow-hidden">
                <div className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <Award className="w-8 h-8" />
                    <div>
                      <div className="text-sm font-semibold opacity-90">Current GPA</div>
                      <div className="text-4xl font-bold">{overallGPA}%</div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-white/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm opacity-90">Semester Goal</span>
                      <span className="font-bold flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        95%
                      </span>
                    </div>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white rounded-full"
                        style={{ width: `${(parseFloat(overallGPA) / 95) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-xs opacity-75 mt-2">
                      You're {(95 - parseFloat(overallGPA)).toFixed(1)}% away from your goal!
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>
        </div>

        {/* NEW ANALYTICS COMPONENTS - Real Backend Integration */}
        <motion.div variants={fadeInUp} className="mt-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            Performance Analytics
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Concept Mastery */}
            {conceptMastery.length > 0 && (
              <ConceptMastery
                concepts={conceptMastery}
                title="My Concept Mastery"
                showTrends={true}
              />
            )}

            {/* Performance Chart - Real Backend Data */}
            <PerformanceChart
              data={performanceData}
              title="Grade Trends"
            />
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6"
          >
            <Card>
              <div className="p-12 text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-12 h-12 mx-auto mb-4"
                >
                  <RefreshCw className="w-12 h-12 text-purple-600" />
                </motion.div>
                <p className="text-slate-600">Loading your grades...</p>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6"
          >
            <Card>
              <div className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Error Loading Grades
                </h3>
                <p className="text-slate-600 mb-4">{error}</p>
                <Button onClick={fetchStudentData} variant="primary">
                  Try Again
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};
