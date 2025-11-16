import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ConfirmationModal } from '../../components/shared/Modal';
import {
  BookOpen,
  Users,
  FileText,
  Clock,
  TrendingUp,
  TrendingDown,
  MapPin,
  AlertCircle,
  BarChart3,
  PlusCircle,
  Brain,
  Target,
  CheckCircle,
  Loader2,
  Trash2,
  MoreVertical,
  Settings,
} from 'lucide-react';
import { classService, ClassWithStats } from '../../services/class.service';
import { ClassCreationWizard } from './ClassCreationWizard';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const TeacherClasses: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showWizard, setShowWizard] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState<ClassWithStats | null>(null);
  const [socratitMessage, setSocratitMessage] = useState('');

  // Fetch classes from backend
  const { data: classes, isLoading, error } = useQuery({
    queryKey: ['teacher-classes'],
    queryFn: () => classService.getTeacherClasses(),
  });

  // Delete class mutation
  const deleteClassMutation = useMutation({
    mutationFn: (classId: string) => classService.deleteClass(classId),
    onSuccess: () => {
      // Invalidate and refetch classes
      queryClient.invalidateQueries({ queryKey: ['teacher-classes'] });
      setDeleteConfirmOpen(false);
      setClassToDelete(null);
    },
    onError: (error: any) => {
      console.error('Failed to delete class:', error);
      alert(error.response?.data?.message || 'Failed to delete class. Please try again.');
    },
  });

  const handleWizardComplete = (classId: string) => {
    setShowWizard(false);
    // Navigate to the new class dashboard
    navigate(`/teacher/classes/${classId}`);
  };

  const handleDeleteClick = (classItem: ClassWithStats, e: React.MouseEvent) => {
    e.stopPropagation();
    setClassToDelete(classItem);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (classToDelete) {
      deleteClassMutation.mutate(classToDelete.id);
    }
  };

  const handleSocratitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (socratitMessage.trim()) {
      navigate(`/teacher/ai-tutor?message=${encodeURIComponent(socratitMessage)}`);
    }
  };

  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        gradient: 'from-blue-500 to-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-600',
      },
      purple: {
        gradient: 'from-purple-500 to-purple-600',
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-600',
      },
      orange: {
        gradient: 'from-orange-500 to-orange-600',
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-600',
      },
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  // Calculate totals
  const totalStudents = classes?.reduce((sum, cls) => sum + cls.enrollmentCounts.approved, 0) || 0;
  const totalNeedingHelp = 0; // Will come from analytics in future batch
  const totalActiveAssignments = 0; // Will come from assignments batch

  if (isLoading) {
    return (
      <DashboardLayout userRole="teacher">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-brand-purple" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout userRole="teacher">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Error loading classes</h2>
          <p className="text-slate-600">Please try again later</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
    <DashboardLayout userRole="teacher">
      <motion.div
        initial="initial"
        animate="animate"
        variants={staggerContainer}
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={fadeInUp} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Classes</h1>
            <p className="text-slate-600 mt-1">
              Manage your classes and track student progress
            </p>
          </div>
          <Button variant="primary" size="md" onClick={() => setShowWizard(true)}>
            <PlusCircle className="w-5 h-5 mr-2" />
            Create Class
          </Button>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Class Cards */}
          <div className="lg:col-span-2 space-y-6">
            {!classes || classes.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No classes yet</h3>
                  <p className="text-slate-600 mb-4">Create your first class to get started</p>
                  <Button variant="primary" onClick={() => setShowWizard(true)}>
                    <PlusCircle className="w-5 h-5 mr-2" />
                    Create Class
                  </Button>
                </div>
              </Card>
            ) : (
              classes.map((classItem: ClassWithStats) => {
                const colors = getColorClasses(classItem.color);
                const primaryTeacher = classItem.teachers.find(t => t.isPrimary);

                return (
                  <motion.div
                    key={classItem.id}
                    variants={fadeInUp}
                    whileHover={{ scale: 1.01 }}
                    className="cursor-pointer"
                    onClick={() => navigate(`/teacher/classes/${classItem.id}`)}
                  >
                    <Card padding="none" className="overflow-hidden">
                      {/* Header */}
                      <div className={`p-6 bg-gradient-to-r ${colors.gradient} text-white`}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <BookOpen className="w-6 h-6" />
                              <h2 className="text-2xl font-bold">{classItem.name}</h2>
                              {classItem.period && (
                                <Badge variant="success" size="sm" className="bg-white/20 text-white border-white/30">
                                  {classItem.period}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm opacity-90">
                              {classItem.scheduleTime && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{classItem.scheduleTime}</span>
                                </div>
                              )}
                              {classItem.room && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  <span>{classItem.room}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                <span>{classItem.enrollmentCounts.approved} students</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-sm opacity-90">Class Code</div>
                              <div className="text-2xl font-bold tracking-wider">{classItem.classCode}</div>
                            </div>
                            <button
                              onClick={(e) => handleDeleteClick(classItem, e)}
                              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm"
                              aria-label="Delete class"
                              title="Delete class"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-4 gap-4 p-6 bg-slate-50 border-b border-slate-200">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-slate-900">{totalActiveAssignments}</div>
                          <div className="text-xs text-slate-600 mt-1">Active Assignments</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-slate-900">{classItem.enrollmentCounts.pending}</div>
                          <div className="text-xs text-slate-600 mt-1">Pending Requests</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${classItem.enrollmentCounts.pending > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                            {classItem.enrollmentCounts.approved}
                          </div>
                          <div className="text-xs text-slate-600 mt-1">Enrolled</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-slate-900">
                            {classItem.enrollmentCounts.approved > 0 ? '100%' : '0%'}
                          </div>
                          <div className="text-xs text-slate-600 mt-1">On Track</div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        <div className="grid grid-cols-2 gap-6">
                          {/* Class Info */}
                          <div>
                            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-slate-600" />
                              Class Information
                            </h3>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="text-slate-600">Academic Year:</span>
                                <span className="ml-2 font-medium text-slate-900">{classItem.academicYear}</span>
                              </div>
                              {classItem.subject && (
                                <div>
                                  <span className="text-slate-600">Subject:</span>
                                  <span className="ml-2 font-medium text-slate-900">{classItem.subject}</span>
                                </div>
                              )}
                              {classItem.gradeLevel && (
                                <div>
                                  <span className="text-slate-600">Grade:</span>
                                  <span className="ml-2 font-medium text-slate-900">{classItem.gradeLevel}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Enrollment Status */}
                          <div>
                            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                              <Users className="w-4 h-4 text-slate-600" />
                              Enrollment Status
                            </h3>
                            <div className="space-y-2">
                              {classItem.enrollmentCounts.pending > 0 && (
                                <div className={`p-3 rounded-lg ${colors.bg} border ${colors.border}`}>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-slate-900">
                                      {classItem.enrollmentCounts.pending} Pending Request{classItem.enrollmentCounts.pending !== 1 ? 's' : ''}
                                    </span>
                                    <Badge variant="warning" size="sm">Action Needed</Badge>
                                  </div>
                                </div>
                              )}
                              {classItem.enrollmentCounts.pending === 0 && (
                                <div className="text-sm text-slate-600">
                                  No pending enrollment requests
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="mt-6 pt-6 border-t border-slate-200">
                          <div className="flex items-center gap-3">
                            <Button variant="primary" size="sm" onClick={(e) => { e?.stopPropagation(); navigate(`/teacher/assignments/new?classId=${classItem.id}`); }}>
                              <PlusCircle className="w-4 h-4 mr-2" />
                              Create Assignment
                            </Button>
                            <Button variant="secondary" size="sm" onClick={(e) => { e?.stopPropagation(); navigate(`/teacher/classes/${classItem.id}/roster`); }}>
                              <Users className="w-4 h-4 mr-2" />
                              View Roster
                            </Button>
                            <Button variant="secondary" size="sm" onClick={(e) => { e?.stopPropagation(); navigate(`/teacher/classes/${classItem.id}/analytics`); }}>
                              <BarChart3 className="w-4 h-4 mr-2" />
                              Analytics
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Right Column - SocratIt */}
          <div className="space-y-6">
            <motion.div variants={fadeInUp}>
              <Card padding="none" className="overflow-hidden sticky top-6">
                <div className="p-6 bg-white">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-brand-purple to-purple-600 rounded-full flex items-center justify-center">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-brand-purple">SocratIt</h3>
                      <p className="text-sm text-slate-600">AI-powered teaching assistant</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <form onSubmit={handleSocratitSubmit}>
                      <div className="relative">
                        <input
                          type="text"
                          value={socratitMessage}
                          onChange={(e) => setSocratitMessage(e.target.value)}
                          placeholder="Hi! I can help you create assignments, generate quizzes, plan lessons, and more. What would you like to work on today?"
                          className="w-full bg-purple-50 border border-purple-200 rounded-lg p-4 text-sm text-slate-900 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                        />
                        {socratitMessage && (
                          <button
                            type="submit"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-purple hover:text-purple-700"
                          >
                            <Brain className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </form>
                  </div>

                  <div className="space-y-2 mb-6">
                    <h4 className="font-semibold text-sm text-slate-900 mb-3">Quick Actions</h4>

                    {classes && classes.length > 0 && (
                      <div className="space-y-2">
                        {classes.slice(0, 3).map((classItem) => (
                          <button
                            key={classItem.id}
                            onClick={() => {
                              // TODO: Open SocratIt chat modal with assignment creation context
                              navigate(`/teacher/ai-assistant?action=create-assignment&classId=${classItem.id}`);
                            }}
                            className="w-full text-left bg-white border border-purple-200 hover:border-purple-400 hover:bg-purple-50 rounded-lg p-3 transition-all group"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-brand-purple" />
                              <span className="text-sm font-medium text-slate-900 group-hover:text-brand-purple">
                                Create assignment for {classItem.name}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => {
                        // TODO: Open SocratIt chat modal
                        navigate('/teacher/ai-assistant');
                      }}
                      className="w-full text-left bg-white border border-purple-200 hover:border-purple-400 hover:bg-purple-50 rounded-lg p-3 transition-all group"
                    >
                      <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4 text-brand-purple" />
                        <span className="text-sm font-medium text-slate-900 group-hover:text-brand-purple">
                          Open SocratIt Chat
                        </span>
                      </div>
                    </button>
                  </div>

                  {classes && classes.some(c => c.enrollmentCounts.pending > 0) && (
                    <div className="pt-6 border-t border-slate-200">
                      <div className="bg-orange-50 border border-orange-300 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle className="w-4 h-4 text-orange-600" />
                          <p className="text-sm font-semibold text-orange-900">Needs Attention</p>
                        </div>
                        <p className="text-sm text-orange-700">
                          {classes.reduce((sum, c) => sum + c.enrollmentCounts.pending, 0)} pending enrollment request{classes.reduce((sum, c) => sum + c.enrollmentCounts.pending, 0) !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>

      {/* Class Creation Wizard */}
      <ClassCreationWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onComplete={handleWizardComplete}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setClassToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Class"
        message={`Are you sure you want to delete "${classToDelete?.name}"? This will permanently remove the class and all associated data including assignments, grades, and enrollments. This action cannot be undone.`}
        confirmText="Delete Class"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteClassMutation.isPending}
      />
    </>
  );
};
