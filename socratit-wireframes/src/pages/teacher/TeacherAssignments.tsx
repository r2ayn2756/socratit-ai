import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import {
  FileText,
  PlusCircle,
  Users,
  Clock,
  BookOpen,
  CheckCircle,
  Edit3,
  Trash2,
  Calendar,
  Eye,
  Play,
} from 'lucide-react';
import { assignmentService, Assignment } from '../../services/assignment.service';

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

export const TeacherAssignments: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Fetch assignments from backend
  const { data: assignmentsData, isLoading, error } = useQuery({
    queryKey: ['assignments', filterClass, filterStatus],
    queryFn: async () => {
      const result = await assignmentService.getAssignments({
        classId: filterClass !== 'all' ? filterClass : undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        includeQuestions: false,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      console.log('Fetched assignments:', result);
      return result;
    },
  });

  // Delete assignment mutation
  const deleteMutation = useMutation({
    mutationFn: (assignmentId: string) => assignmentService.deleteAssignment(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });

  // Publish assignment mutation
  const publishMutation = useMutation({
    mutationFn: (assignmentId: string) =>
      assignmentService.publishAssignment(assignmentId, { publishNow: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 'Failed to publish assignment';
      alert(errorMessage);
      console.error('Error publishing assignment:', error);
    },
  });

  const assignments = assignmentsData?.data || [];

  console.log('Assignments data:', assignmentsData);
  console.log('Assignments array:', assignments);
  console.log('Draft assignments:', assignments.filter((a) => a.status === 'DRAFT'));
  console.log('Active assignments:', assignments.filter((a) => a.status === 'ACTIVE'));
  console.log('Scheduled assignments:', assignments.filter((a) => a.status === 'SCHEDULED'));

  // Group assignments by status
  const activeAssignments = assignments.filter((a) => a.status === 'ACTIVE');
  const draftAssignments = assignments.filter((a) => a.status === 'DRAFT');
  const scheduledAssignments = assignments.filter((a) => a.status === 'SCHEDULED');

  // Format date helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    if (diffDays < 7) return `In ${diffDays} days`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatCreatedDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

  const renderAssignment = (assignment: Assignment) => {
    const colors = getColorClasses(assignment.class?.color || 'blue');
    // For now, we'll use _count.submissions as a proxy for submitted count
    // In a real implementation, we'd need to fetch actual submission status
    const totalSubmissions = assignment._count?.submissions || 0;
    const submissionRate = 0; // TODO: Need to fetch actual submitted vs in-progress submissions
    const hasNoQuestions = (assignment._count?.questions || 0) === 0;

    return (
      <motion.div key={assignment.id} variants={fadeInUp} whileHover={{ scale: 1.01, y: -2 }}>
        <Card variant="glassElevated" padding="none" className="overflow-hidden">
          <div className="p-5 bg-white/70 backdrop-blur-md">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-slate-900">{assignment.title}</h3>
                  <Badge variant="neutral" size="sm">{assignment.type}</Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    <span className={`font-medium ${colors.text}`}>{assignment.class?.name || 'Unknown Class'}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatDate(assignment.dueDate)}</span>
                  </div>
                </div>
              </div>
            </div>

            {assignment.status === 'ACTIVE' && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Submissions</span>
                  </div>
                  <span className="font-semibold">
                    {totalSubmissions} started
                  </span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${colors.gradient}`}
                    style={{ width: `${submissionRate}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <div className="text-xs text-slate-500">
                Created {formatCreatedDate(assignment.createdAt)}
              </div>
              <div className="flex items-center gap-2">
                {assignment.status === 'ACTIVE' && (
                  <>
                    {assignment.type === 'PRACTICE' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/student/assignments/${assignment.id}/take`)}
                        title="Take this practice assignment yourself"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Take Practice
                      </Button>
                    )}
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/teacher/assignments/${assignment.id}/submissions`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Submissions
                    </Button>
                  </>
                )}
                {assignment.status === 'DRAFT' && (
                  <>
                    <div className="flex flex-col items-end gap-1">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => publishMutation.mutate(assignment.id)}
                        disabled={publishMutation.isPending || hasNoQuestions}
                        title={hasNoQuestions ? 'Cannot publish assignment with no questions' : ''}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {publishMutation.isPending ? 'Publishing...' : 'Publish'}
                      </Button>
                      {hasNoQuestions && (
                        <span className="text-xs text-red-600">No questions</span>
                      )}
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/teacher/assignments/${assignment.id}/edit`)}
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </>
                )}
                {assignment.status === 'SCHEDULED' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/teacher/assignments/${assignment.id}/edit`)}
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Reschedule
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(assignment.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  };

  return (
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
            <h1 className="text-3xl font-bold text-slate-900">Assignments</h1>
            <p className="text-slate-600 mt-1">
              Create and manage assignments across all your classes
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/teacher/assignments/new')}
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Create New Assignment
          </Button>
        </motion.div>

        {/* Filter Bar */}
        <motion.div variants={fadeInUp}>
          <Card variant="glassElevated">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">Filter by class:</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={filterClass === 'all' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setFilterClass('all')}
                >
                  All Classes
                </Button>
                <Button
                  variant={filterClass === 'geometry' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setFilterClass('geometry')}
                >
                  Geometry
                </Button>
                <Button
                  variant={filterClass === 'algebra' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setFilterClass('algebra')}
                >
                  Algebra II
                </Button>
                <Button
                  variant={filterClass === 'calculus' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setFilterClass('calculus')}
                >
                  Calculus
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Main Content Grid */}
        <div className="space-y-6">
            {/* Active Assignments */}
            <motion.div variants={fadeInUp}>
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <h2 className="text-xl font-bold text-slate-900">Active Assignments</h2>
                <Badge variant="primary" size="sm">{activeAssignments.length}</Badge>
              </div>
              <div className="space-y-4">
                {activeAssignments.map(assignment => renderAssignment(assignment))}
              </div>
            </motion.div>

            {/* Drafts & Scheduled */}
            <motion.div variants={fadeInUp}>
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-slate-500" />
                <h2 className="text-xl font-bold text-slate-900">Drafts</h2>
                <Badge variant="neutral" size="sm">{draftAssignments.length}</Badge>
              </div>
              <div className="space-y-4">
                {draftAssignments.map(assignment => renderAssignment(assignment))}
              </div>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-6 h-6 text-blue-500" />
                <h2 className="text-xl font-bold text-slate-900">Scheduled</h2>
                <Badge variant="info" size="sm">{scheduledAssignments.length}</Badge>
              </div>
              <div className="space-y-4">
                {scheduledAssignments.map(assignment => renderAssignment(assignment))}
              </div>
            </motion.div>
        </div>

        {/* AI Assistant removed */}
      </motion.div>
    </DashboardLayout>
  );
};
