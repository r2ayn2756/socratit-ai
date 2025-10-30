// ============================================================================
// STUDENT CLASS VIEW
// Curriculum-focused view for students
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Calendar,
  CheckCircle,
  TrendingUp,
  Award,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import { GlassCard, GlassPanel } from '../../components/curriculum/GlassCard';
import { ProgressBar, CircularProgress } from '../../components/curriculum/ProgressBar';
import { Timeline } from '../../components/curriculum/Timeline';
import { Button } from '../../components/curriculum/Button';
import type { CurriculumUnit } from '../../types/curriculum.types';
import { format } from 'date-fns';
import { classCurriculumService } from '../../services/classCurriculum.service';
import { curriculumApi } from '../../services/curriculumApi.service';
import { assignmentService } from '../../services/assignment.service';

interface StudentClassData {
  classId: string;
  className: string;
  subject: string;
  gradeLevel: string;
  schedule: any;
  currentUnit: CurriculumUnit | null;
  allUnits: CurriculumUnit[];
  myProgress: {
    totalUnits: number;
    unitsCompleted: number;
    percentComplete: number;
    averageScore: number;
  };
  insights: {
    strengths: string[];
    struggles: string[];
    recommendedReview: string[];
  };
  upcomingAssignments: any[];
}

export const StudentClassView: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();

  const [classData, setClassData] = useState<StudentClassData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadClassData();
  }, [classId]);

  const loadClassData = async () => {
    setIsLoading(true);
    try {
      // Load class info and schedule
      const classInfo = await classCurriculumService.getClass(classId!);
      const schedule = await classCurriculumService.getClassSchedule(classId!);

      // If no schedule exists, show a simpler view
      if (!schedule) {
        setClassData({
          classId: classInfo.id,
          className: classInfo.name,
          subject: classInfo.subject || '',
          gradeLevel: classInfo.gradeLevel || '',
          schedule: null,
          currentUnit: null,
          allUnits: [],
          myProgress: {
            totalUnits: 0,
            unitsCompleted: 0,
            percentComplete: 0,
            averageScore: 0,
          },
          insights: {
            strengths: [],
            struggles: [],
            recommendedReview: [],
          },
          upcomingAssignments: [],
        });
        return;
      }

      // Load student progress, insights, and assignments in parallel
      const [progressData, strengthsData, strugglesData, reviewData, assignmentsResponse] =
        await Promise.all([
          curriculumApi.progress.getMyProgress(schedule.id),
          curriculumApi.progress.getMyStrengths(schedule.id).catch(() => ({ strengths: [] })),
          curriculumApi.progress.getMyStruggles(schedule.id).catch(() => ({ struggles: [] })),
          curriculumApi.progress.getMyReviewRecommendations(schedule.id).catch(() => ({ reviewTopics: [] })),
          assignmentService.getAssignments({ classId: classId!, limit: 5 }).catch(() => ({ data: [], pagination: {} })),
        ]);

      // Find current unit
      const currentUnitProgress = progressData.unitProgress.find(
        (up) => up.status === 'IN_PROGRESS' || up.unitId === progressData.overallProgress.currentUnitId
      );

      let currentUnit: CurriculumUnit | null = null;
      if (currentUnitProgress) {
        currentUnit = await curriculumApi.units.getUnit(currentUnitProgress.unitId) as unknown as CurriculumUnit;
      }

      // Filter upcoming assignments (not submitted yet, due in future)
      const now = new Date();
      const upcomingAssignments = assignmentsResponse.data
        .filter((a: any) => !a.studentSubmission && new Date(a.dueDate) > now)
        .slice(0, 3)
        .map((a: any) => ({
          id: a.id,
          title: a.title,
          dueDate: a.dueDate,
          unitTitle: a.curriculumUnit?.title || 'General',
        }));

      const classData: StudentClassData = {
        classId: classInfo.id,
        className: classInfo.name,
        subject: classInfo.subject || '',
        gradeLevel: classInfo.gradeLevel || '',
        schedule,
        currentUnit,
        allUnits: progressData.unitProgress.map((up) => ({
          ...up,
          // Map unit progress fields to CurriculumUnit fields for display
        })) as any,
        myProgress: {
          totalUnits: progressData.overallProgress.totalUnits,
          unitsCompleted: progressData.overallProgress.unitsCompleted,
          percentComplete: progressData.overallProgress.percentComplete,
          averageScore: progressData.overallProgress.averageScore,
        },
        insights: {
          strengths: strengthsData.strengths || [],
          struggles: strugglesData.struggles || [],
          recommendedReview: reviewData.reviewTopics || [],
        },
        upcomingAssignments,
      };

      setClassData(classData);
    } catch (error) {
      console.error('Failed to load class data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout userRole="student">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading class...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!classData) {
    return (
      <DashboardLayout userRole="student">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-gray-600">Class not found</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="student">
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-2xl border border-gray-200/50 rounded-2xl p-6"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {classData.className}
          </h1>
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 rounded-lg bg-blue-100 text-blue-700 font-medium text-sm">
              {classData.subject}
            </span>
            <span className="px-3 py-1 rounded-lg bg-purple-100 text-purple-700 font-medium text-sm">
              {classData.gradeLevel}
            </span>
          </div>

          {/* Progress Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <p className="text-sm text-gray-600 mb-1">Your Progress</p>
              <p className="text-2xl font-bold text-gray-900">
                {classData.myProgress.percentComplete}%
              </p>
            </div>
            <div className="p-3 rounded-xl bg-green-50">
              <p className="text-sm text-gray-600 mb-1">Average Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {classData.myProgress.averageScore}%
              </p>
            </div>
            <div className="p-3 rounded-xl bg-purple-50">
              <p className="text-sm text-gray-600 mb-1">Units Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {classData.myProgress.unitsCompleted}/{classData.myProgress.totalUnits}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Current Unit Hero Section */}
        {classData.currentUnit && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard variant="elevated" className="p-8 bg-gradient-to-br from-blue-50 to-purple-50">
              <div className="flex items-start gap-6">
                {/* Progress Circle */}
                <div className="flex-shrink-0">
                  <CircularProgress
                    progress={classData.currentUnit.percentComplete || 0}
                    size={120}
                    color="blue"
                    showPercentage
                  />
                </div>

                {/* Unit Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 rounded-lg bg-blue-500 text-white text-xs font-bold">
                      CURRENT UNIT
                    </span>
                    <span className="text-sm text-gray-600">
                      Unit {classData.currentUnit.unitNumber}
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {classData.currentUnit.title}
                  </h2>

                  <p className="text-gray-700 mb-4">
                    {classData.currentUnit.description}
                  </p>

                  {/* Duration */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {format(new Date(classData.currentUnit.startDate), 'MMM d')} -{' '}
                        {format(new Date(classData.currentUnit.endDate), 'MMM d')}
                      </span>
                    </div>
                    <span>•</span>
                    <span>{classData.currentUnit.estimatedWeeks} weeks</span>
                  </div>

                  {/* Learning Objectives */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">What You'll Learn:</h4>
                    <ul className="space-y-1">
                      {classData.currentUnit.learningObjectives.slice(0, 3).map((objective, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{objective}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Upcoming Assignments */}
        {classData.upcomingAssignments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassPanel title="Upcoming Assignments">
              <div className="space-y-2">
                {classData.upcomingAssignments.map((assignment) => (
                  <motion.div
                    key={assignment.id}
                    whileHover={{ x: 4 }}
                    onClick={() => navigate(`/student/assignments/${assignment.id}`)}
                    className="p-4 rounded-xl bg-white/70 border border-gray-200 hover:border-blue-300 cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{assignment.title}</p>
                      <p className="text-sm text-gray-600">{assignment.unitTitle}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Due</p>
                        <p className="font-semibold text-gray-900">
                          {format(new Date(assignment.dueDate), 'MMM d')}
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassPanel>
          </motion.div>
        )}

        {/* Personal Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="grid grid-cols-3 gap-4">
            {/* Strengths */}
            <GlassCard className="p-5 bg-gradient-to-br from-green-50 to-emerald-50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">Your Strengths</h3>
              </div>
              <ul className="space-y-2">
                {classData.insights.strengths.map((strength, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>

            {/* Struggles */}
            <GlassCard className="p-5 bg-gradient-to-br from-orange-50 to-amber-50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">Areas to Improve</h3>
              </div>
              <ul className="space-y-2">
                {classData.insights.struggles.map((struggle, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <span>{struggle}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>

            {/* Recommended Review */}
            <GlassCard className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">Recommended Review</h3>
              </div>
              <ul className="space-y-2">
                {classData.insights.recommendedReview.map((review, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>{review}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default StudentClassView;
