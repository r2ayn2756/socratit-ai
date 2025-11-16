// ============================================================================
// TEACHER DASHBOARD
// Main dashboard for teachers with stats, classes, and quick actions
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, Badge } from '../../components/common';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Users,
  MessageSquare,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { getSubjectIcon } from '../../utils/subjectIconMap';
import classService from '../../services/class.service';
import { assignmentService } from '../../services/assignment.service';
import messageService from '../../services/message.service';
import analyticsService from '../../services/analytics.service';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

export const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  // Fetch teacher's classes
  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ['teacher-classes'],
    queryFn: () => classService.getTeacherClasses(),
  });

  // Fetch pending assignments to grade
  const { data: assignmentsResponse } = useQuery({
    queryKey: ['teacher-assignments'],
    queryFn: () => assignmentService.getAssignments(),
  });

  const assignments = assignmentsResponse?.data || [];

  // Fetch unread message count
  const { data: unreadMessageCount = 0 } = useQuery({
    queryKey: ['unreadMessageCount'],
    queryFn: messageService.getUnreadCount,
  });

  // Fetch struggling students across all classes
  const { data: strugglingStudentsData = [] } = useQuery({
    queryKey: ['all-struggling-students'],
    queryFn: async () => {
      if (classes.length === 0) return [];
      const results = await Promise.all(
        classes.map((cls: any) =>
          analyticsService.getStrugglingStudents(cls.id).catch(() => [])
        )
      );
      return results.flat();
    },
    enabled: classes.length > 0,
  });

  // Calculate stats
  const totalStudents = classes.reduce((sum: number, cls: any) => sum + (cls.studentCount || 0), 0);
  const pendingReviews = assignments.filter((a: any) => a.status === 'PUBLISHED').length;
  const avgPerformance = classes.length > 0
    ? Math.round(
        classes.reduce((sum: number, cls: any) => sum + (cls.averageGrade || 0), 0) / classes.length
      )
    : 0;

  // Sort classes by time (upcoming first)
  const upcomingClasses = [...classes]
    .sort((a: any, b: any) => {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    })
    .slice(0, 4);

  // Action items based on real data
  const actionItems = [
    {
      id: 1,
      title: t('teacher.dashboard.studentsNeedAttention').replace('{count}', strugglingStudentsData.length.toString()),
      subtitle: strugglingStudentsData.length > 0
        ? t('teacher.dashboard.studentsStruggling')
        : t('teacher.dashboard.allStudentsOnTrack'),
      priority: strugglingStudentsData.length > 5 ? 'high' : 'medium',
      icon: <AlertCircle className="w-5 h-5" />,
      action: () => navigate('/teacher/analytics'),
    },
    {
      id: 3,
      title: unreadMessageCount === 1
        ? t('teacher.dashboard.unreadMessage')
        : t('teacher.dashboard.unreadMessages').replace('{count}', unreadMessageCount.toString()),
      subtitle: unreadMessageCount > 0 ? t('teacher.dashboard.awaitingResponse') : t('teacher.dashboard.inboxClear'),
      priority: unreadMessageCount > 5 ? 'high' : 'low',
      icon: <MessageSquare className="w-5 h-5" />,
      action: () => navigate('/teacher/messages'),
    },
  ];

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

  const getClassColor = (index: number) => {
    const colors = ['blue', 'purple', 'green', 'orange', 'pink', 'cyan'];
    return colors[index % colors.length] as 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'cyan';
  };

  if (classesLoading) {
    return (
      <DashboardLayout userRole="teacher">
        <div className="flex items-center justify-center h-screen">
          <LoadingSpinner size="xl" message="Loading dashboard..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="teacher">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={fadeInUp} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              {t('teacher.dashboard.greeting').replace('{name}', user?.firstName || 'Teacher')}
            </h1>
            <p className="text-neutral-600">
              {t('teacher.dashboard.summary')
                .replace('{classCount}', classes.length.toString())
                .replace('{assignmentCount}', pendingReviews.toString())}
            </p>
          </div>

          <Button
            variant="gradient"
            size="lg"
            icon={<Plus className="w-5 h-5" />}
            iconPosition="left"
            onClick={() => navigate('/teacher/assignments/new')}
          >
            {t('teacher.dashboard.createAssignment')}
          </Button>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* My Classes - Takes 2 columns */}
          <motion.div variants={fadeInUp} className="lg:col-span-2">
            <Card variant="glassElevated" padding="none" className="overflow-hidden h-full">
              <div className="p-6 border-b border-neutral-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-neutral-900 mb-1">
                      {t('teacher.dashboard.myClasses')}
                    </h2>
                    <p className="text-sm text-neutral-600">{t('teacher.dashboard.activeClasses')}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Plus className="w-4 h-4" />}
                    iconPosition="right"
                    onClick={() => navigate('/teacher/classes/new')}
                  >
                    {t('teacher.dashboard.addClass')}
                  </Button>
                </div>
              </div>

              <div className="p-6">
                {upcomingClasses.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-neutral-500 mb-4">{t('teacher.dashboard.noClasses')}</p>
                    <Button onClick={() => navigate('/teacher/classes/new')}>
                      {t('teacher.dashboard.createFirstClass')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingClasses.map((cls: any, index: number) => {
                      const SubjectIcon = getSubjectIcon(cls.subject);
                      return (
                      <motion.div
                        key={cls.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        className="flex items-center gap-4 p-4 rounded-xl bg-white/70 backdrop-blur-md border border-white/20 hover:bg-white/90 hover:shadow-xl transition-all cursor-pointer"
                        onClick={() => navigate(`/teacher/classes/${cls.id}`)}
                      >
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white shadow-lg`}>
                          <SubjectIcon className="w-6 h-6" />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-neutral-900">{cls.name}</h3>
                            <Badge variant="primary">{cls.subject || 'General'}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-neutral-600">
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {cls.studentCount || 0} {t('teacher.dashboard.students')}
                            </span>
                            <span>{t('teacher.dashboard.grade').replace('{grade}', cls.gradeLevel || 'Mixed')}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-2xl font-bold text-slate-900">
                            {Math.round(cls.averageGrade || 0)}%
                          </div>
                          <div className="text-xs text-slate-500">{t('teacher.dashboard.classAvg')}</div>
                        </div>
                      </motion.div>
                    );
                    })}
                  </div>
                )}

                {classes.length > 4 && (
                  <div className="mt-4 text-center">
                    <Button
                      variant="ghost"
                      onClick={() => navigate('/teacher/classes')}
                    >
                      {t('teacher.dashboard.viewAllClasses')}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Action Items - Takes 1 column */}
          <motion.div variants={fadeInUp}>
            <Card variant="glassElevated" padding="none" className="h-full">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-900 mb-1">
                  {t('teacher.dashboard.actionItems')}
                </h2>
                <p className="text-sm text-slate-600">{t('teacher.dashboard.actionItemsDesc')}</p>
              </div>

              <div className="p-6 space-y-4">
                {actionItems.map((item) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className={`p-4 rounded-xl cursor-pointer transition-all ${
                      item.priority === 'high'
                        ? 'bg-red-50/70 backdrop-blur-md border border-red-200/50 hover:bg-red-50/90 hover:shadow-lg hover:shadow-red-500/10'
                        : item.priority === 'medium'
                        ? 'bg-orange-50/70 backdrop-blur-md border border-orange-200/50 hover:bg-orange-50/90 hover:shadow-lg hover:shadow-orange-500/10'
                        : 'bg-blue-50/70 backdrop-blur-md border border-blue-200/50 hover:bg-blue-50/90 hover:shadow-lg hover:shadow-blue-500/10'
                    }`}
                    onClick={item.action}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          item.priority === 'high'
                            ? 'bg-red-100 text-red-600'
                            : item.priority === 'medium'
                            ? 'bg-orange-100 text-orange-600'
                            : 'bg-blue-100 text-blue-600'
                        }`}
                      >
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 mb-1">
                          {item.title}
                        </h3>
                        <p className="text-sm text-slate-600">{item.subtitle}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div variants={fadeInUp}>
          <Card variant="glassElevated" padding="lg">
            <h2 className="text-xl font-bold text-slate-900 mb-4">{t('teacher.dashboard.quickActions')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="glass"
                glow={false}
                className="p-6 h-auto justify-start hover:scale-105"
                onClick={() => navigate('/teacher/assignments/new')}
              >
                <div className="text-left">
                  <div className="font-semibold mb-1">{t('teacher.dashboard.createAssignment')}</div>
                  <div className="text-sm text-slate-600">
                    {t('teacher.dashboard.generateQuizzes')}
                  </div>
                </div>
              </Button>

              <Button
                variant="glass"
                glow={false}
                className="p-6 h-auto justify-start hover:scale-105"
                onClick={() => navigate('/teacher/analytics')}
              >
                <div className="text-left">
                  <div className="font-semibold mb-1">{t('sidebar.analytics')}</div>
                  <div className="text-sm text-slate-600">
                    {t('teacher.dashboard.trackPerformance')}
                  </div>
                </div>
              </Button>

              <Button
                variant="glass"
                glow={false}
                className="p-6 h-auto justify-start hover:scale-105"
                onClick={() => navigate('/teacher/curriculum')}
              >
                <div className="text-left">
                  <div className="font-semibold mb-1">{t('common.buttons.upload')} Curriculum</div>
                  <div className="text-sm text-slate-600">
                    {t('teacher.dashboard.generateFromDocs')}
                  </div>
                </div>
              </Button>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
};
