// ============================================================================
// ADMIN DASHBOARD
// Main dashboard for administrators with school-wide KPIs and analytics
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Card, Button } from '../../components/common';
import { StatCard } from '../../components/common/StatCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Users,
  GraduationCap,
  TrendingUp,
  Clock,
  AlertCircle,
  BarChart3,
  ArrowRight,
  FileText,
} from 'lucide-react';
import classService from '../../services/class.service';
import { assignmentService } from '../../services/assignment.service';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  // Fetch all classes in the school
  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ['all-classes'],
    queryFn: () => classService.getTeacherClasses(), // Admins can see all classes
  });

  // Fetch all assignments
  const { data: assignmentsResponse } = useQuery({
    queryKey: ['all-assignments'],
    queryFn: () => assignmentService.getAssignments(),
  });

  const assignments = assignmentsResponse?.data || [];

  // Calculate school-wide metrics
  const totalTeachers = new Set(classes.map((c: any) => c.teacherId)).size;
  const totalStudents = classes.reduce((sum: number, cls: any) => sum + (cls.studentCount || 0), 0);
  const totalClasses = classes.length;
  const totalAssignments = assignments.length;

  // Calculate average performance across all classes
  const avgSchoolPerformance = classes.length > 0
    ? Math.round(
        classes.reduce((sum: number, cls: any) => sum + (cls.averageGrade || 0), 0) / classes.length
      )
    : 0;

  // Get active assignments count
  const activeAssignments = assignments.filter((a: any) => a.status === 'PUBLISHED').length;

  // Sort classes by performance
  const topPerformingClasses = [...classes]
    .sort((a: any, b: any) => (b.averageGrade || 0) - (a.averageGrade || 0))
    .slice(0, 5);

  const lowPerformingClasses = [...classes]
    .filter((c: any) => (c.averageGrade || 0) < 70)
    .slice(0, 3);

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

  if (classesLoading) {
    return (
      <DashboardLayout userRole="admin">
        <div className="flex items-center justify-center h-screen">
          <LoadingSpinner size="xl" message="Loading dashboard..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="admin">
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
              {t('admin.dashboard.title')}
            </h1>
            <p className="text-neutral-600">
              Overview of school performance and metrics
            </p>
          </div>

          <Button
            variant="primary"
            size="lg"
            icon={<ArrowRight className="w-5 h-5" />}
            iconPosition="right"
          >
            View Full Reports
          </Button>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <motion.div variants={fadeInUp}>
            <StatCard
              icon={Users}
              label="Total Students"
              value={totalStudents}
              color="primary"
            />
          </motion.div>

          <motion.div variants={fadeInUp}>
            <StatCard
              icon={GraduationCap}
              label="Total Teachers"
              value={totalTeachers}
              color="secondary"
            />
          </motion.div>

          <motion.div variants={fadeInUp}>
            <StatCard
              icon={TrendingUp}
              label="School Avg Performance"
              value={`${avgSchoolPerformance}%`}
              color="success"
              trend={avgSchoolPerformance > 75 ? { direction: 'up', value: '+5%' } : undefined}
            />
          </motion.div>

          <motion.div variants={fadeInUp}>
            <StatCard
              icon={FileText}
              label={t('admin.dashboard.activeAssignments')}
              value={activeAssignments}
              color="warning"
            />
          </motion.div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performing Classes */}
          <motion.div variants={fadeInUp}>
            <Card>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-1">
                    {t('admin.dashboard.topPerformingClasses')}
                  </h2>
                  <p className="text-sm text-slate-600">Highest average grades</p>
                </div>
                <BarChart3 className="w-6 h-6 text-green-500" />
              </div>

              {topPerformingClasses.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-500">{t('admin.dashboard.noClassesData')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {topPerformingClasses.map((cls: any, index: number) => (
                    <div
                      key={cls.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
                          #{index + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{cls.name}</div>
                          <div className="text-sm text-slate-600">
                            {cls.subject} • {cls.studentCount || 0} students
                          </div>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round(cls.averageGrade || 0)}%
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>

          {/* Classes Needing Attention */}
          <motion.div variants={fadeInUp}>
            <Card>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-1">
                    {t('admin.dashboard.classesNeedingAttention')}
                  </h2>
                  <p className="text-sm text-slate-600">Below 70% average</p>
                </div>
                <AlertCircle className="w-6 h-6 text-orange-500" />
              </div>

              {lowPerformingClasses.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="font-semibold text-slate-900 mb-2">All classes performing well!</p>
                  <p className="text-sm text-slate-600">{t('admin.dashboard.noClassesBelowThreshold')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {lowPerformingClasses.map((cls: any) => (
                    <div
                      key={cls.id}
                      className="p-4 rounded-lg bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-slate-900">{cls.name}</div>
                        <div className="text-2xl font-bold text-orange-600">
                          {Math.round(cls.averageGrade || 0)}%
                        </div>
                      </div>
                      <div className="text-sm text-slate-600 mb-2">
                        {cls.subject} • Grade {cls.gradeLevel || 'Mixed'}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <AlertCircle className="w-4 h-4 text-orange-600" />
                        <span className="text-orange-700">
                          Consider additional support or intervention
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        </div>

        {/* School Statistics */}
        <motion.div variants={fadeInUp}>
          <Card>
            <h2 className="text-xl font-bold text-slate-900 mb-6">School Statistics</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-500 text-white flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-2">{totalClasses}</div>
                <div className="text-sm text-slate-600">{t('admin.dashboard.activeClasses')}</div>
                <div className="mt-3 text-sm text-blue-700">
                  {totalTeachers} teachers • {totalStudents} students
                </div>
              </div>

              <div className="p-6 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-500 text-white flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                  </div>
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-2">{totalAssignments}</div>
                <div className="text-sm text-slate-600">{t('admin.dashboard.totalAssignments')}</div>
                <div className="mt-3 text-sm text-purple-700">
                  {t('admin.dashboard.currentlyActive').replace('{count}', activeAssignments.toString())}
                </div>
              </div>

              <div className="p-6 rounded-lg bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-green-500 text-white flex items-center justify-center">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-2">{avgSchoolPerformance}%</div>
                <div className="text-sm text-slate-600">School Average</div>
                <div className="mt-3 text-sm text-green-700">
                  {avgSchoolPerformance >= 80 ? 'Excellent' : avgSchoolPerformance >= 70 ? 'Good' : 'Needs improvement'}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={fadeInUp}>
          <Card>
            <h2 className="text-xl font-bold text-slate-900 mb-4">{t('admin.dashboard.quickActions')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button
                variant="ghost"
                className="p-6 h-auto justify-start"
                onClick={() => alert('User management coming soon')}
              >
                <div className="text-left">
                  <div className="font-semibold mb-1">Manage Users</div>
                  <div className="text-sm text-slate-600">
                    Add teachers and students
                  </div>
                </div>
              </Button>

              <Button
                variant="ghost"
                className="p-6 h-auto justify-start"
                onClick={() => alert('Reports coming soon')}
              >
                <div className="text-left">
                  <div className="font-semibold mb-1">Generate Reports</div>
                  <div className="text-sm text-slate-600">
                    Export school data
                  </div>
                </div>
              </Button>

              <Button
                variant="ghost"
                className="p-6 h-auto justify-start"
                onClick={() => alert('Settings coming soon')}
              >
                <div className="text-left">
                  <div className="font-semibold mb-1">School Settings</div>
                  <div className="text-sm text-slate-600">
                    Configure school info
                  </div>
                </div>
              </Button>

              <Button
                variant="ghost"
                className="p-6 h-auto justify-start"
                onClick={() => alert('Analytics coming soon')}
              >
                <div className="text-left">
                  <div className="font-semibold mb-1">View Analytics</div>
                  <div className="text-sm text-slate-600">
                    Detailed insights
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
