// ============================================================================
// STUDENT DASHBOARD
// Main dashboard for students with assignments, grades, and upcoming deadlines
// ============================================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, Badge } from '../../components/common';
import { StatCard } from '../../components/common/StatCard';
import {
  FileText,
  Clock,
  TrendingUp,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Brain,
  Target,
  HelpCircle,
  Lightbulb,
  Calculator,
  BookMarked,
  GraduationCap,
  Zap,
  Play,
  Send,
  Sparkles,
} from 'lucide-react';
import { assignmentService } from '../../services/assignment.service';
import { aiTAService } from '../../services/aiTA.service';

export const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [chatMessage, setChatMessage] = useState('');

  // Fetch assignments from backend
  const { data: assignmentsData } = useQuery({
    queryKey: ['student-assignments'],
    queryFn: () =>
      assignmentService.getAssignments({
        sortBy: 'dueDate',
        sortOrder: 'asc',
      }),
  });

  const assignments = assignmentsData?.data || [];

  // Calculate stats from real data
  const now = new Date();
  const tonight = new Date(now);
  tonight.setHours(23, 59, 59, 999);

  const dueToday = assignments.filter((a) => {
    if (!a.dueDate) return false;
    const dueDate = new Date(a.dueDate);
    return dueDate <= tonight && dueDate >= now;
  });

  const inProgress = assignments.filter(
    (a) => a.studentSubmission?.status === 'IN_PROGRESS'
  );
  const completed = assignments.filter(
    (a) =>
      a.studentSubmission?.status === 'SUBMITTED' ||
      a.studentSubmission?.status === 'GRADED'
  );
  const notStarted = assignments.filter((a) => !a.studentSubmission);

  // Calculate average grade from completed assignments
  const gradedAssignments = assignments.filter(
    (a) => a.studentSubmission?.percentage !== null
  );
  const avgGrade = gradedAssignments.length
    ? Math.round(
        gradedAssignments.reduce(
          (sum, a) => sum + (a.studentSubmission?.percentage || 0),
          0
        ) / gradedAssignments.length
      )
    : 0;

  // Teaching Assistant quick actions
  const taQuickActions = [
    {
      text: 'Help me prepare for my test',
      icon: <GraduationCap className="w-4 h-4" />,
      color: 'blue',
    },
    {
      text: "I don't know how to do my homework",
      icon: <HelpCircle className="w-4 h-4" />,
      color: 'purple',
    },
    {
      text: 'I forgot the quadratic formula',
      icon: <Calculator className="w-4 h-4" />,
      color: 'orange',
    },
    {
      text: 'Explain this concept simply',
      icon: <Lightbulb className="w-4 h-4" />,
      color: 'green',
    },
    {
      text: 'Walk me through this problem',
      icon: <BookMarked className="w-4 h-4" />,
      color: 'cyan',
    },
    {
      text: 'What should I study next?',
      icon: <Target className="w-4 h-4" />,
      color: 'pink',
    },
    {
      text: 'Quiz me on this topic',
      icon: <Zap className="w-4 h-4" />,
      color: 'purple',
    },
    {
      text: 'Teach me something new',
      icon: <Brain className="w-4 h-4" />,
      color: 'blue',
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

  const formatDueDate = (dateString?: string) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 0) return 'Overdue';

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Handle starting a conversation
  const handleStartConversation = async (initialMessage: string) => {
    if (!initialMessage.trim()) return;

    try {
      const conversation = await aiTAService.createConversation({
        conversationType: 'GENERAL_HELP',
        title: initialMessage.substring(0, 50) + (initialMessage.length > 50 ? '...' : ''),
      });

      // Navigate to chat page with the conversation ID and initial message
      navigate('/student/ai-tutor', {
        state: {
          conversationId: conversation.id,
          autoOpen: true,
          initialMessage: initialMessage
        }
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Failed to start conversation. Please try again.');
    }
  };

  const handleQuickAction = (text: string) => {
    handleStartConversation(text);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatMessage.trim()) {
      handleStartConversation(chatMessage);
      setChatMessage('');
    }
  };

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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome back! 👋
          </h1>
          <p className="text-slate-600">
            You have {dueToday.length} assignment{dueToday.length !== 1 ? 's' : ''}{' '}
            due today
          </p>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          variants={fadeInUp}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <StatCard
            icon={FileText}
            label="Total Assignments"
            value={assignments.length}
            color="primary"
          />
          <StatCard
            icon={Clock}
            label="In Progress"
            value={inProgress.length}
            color="warning"
          />
          <StatCard
            icon={CheckCircle}
            label="Completed"
            value={completed.length}
            color="success"
          />
          <StatCard
            icon={TrendingUp}
            label="Average Grade"
            value={avgGrade ? `${avgGrade}%` : 'N/A'}
            color="secondary"
          />
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Assignments */}
          <div className="lg:col-span-2 space-y-6">
            {/* Due Today */}
            {dueToday.length > 0 && (
              <motion.div variants={fadeInUp}>
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                  <h2 className="text-xl font-bold text-slate-900">Due Today</h2>
                  <Badge variant="error" size="sm">
                    {dueToday.length}
                  </Badge>
                </div>
                <div className="space-y-4">
                  {dueToday.map((assignment) => {
                    const colors = getColorClasses(assignment.class?.color || 'blue');
                    const progress =
                      assignment.studentSubmission?.percentage || 0;

                    return (
                      <motion.div
                        key={assignment.id}
                        whileHover={{ scale: 1.01 }}
                        className="cursor-pointer"
                        onClick={() =>
                          navigate(`/student/assignments/${assignment.id}`)
                        }
                      >
                        <Card padding="none" className="overflow-hidden">
                          <div className="p-4 bg-white">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-slate-900 mb-1">
                                  {assignment.title}
                                </h3>
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                  <div className="flex items-center gap-1">
                                    <BookOpen className="w-4 h-4" />
                                    <span className={`font-medium ${colors.text}`}>
                                      {assignment.class?.name}
                                    </span>
                                  </div>
                                  <span>•</span>
                                  <span>{assignment.totalPoints} points</span>
                                </div>
                              </div>
                              <Badge variant="neutral" size="sm">
                                {assignment.type}
                              </Badge>
                            </div>

                            {progress > 0 && progress < 100 && (
                              <div className="mb-3">
                                <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                                  <span>Progress</span>
                                  <span className="font-semibold">{progress}%</span>
                                </div>
                                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full bg-gradient-to-r ${colors.gradient}`}
                                    style={{ width: `${progress}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}

                            <Button variant="primary" size="sm" className="w-full">
                              <Play className="w-4 h-4 mr-2" />
                              {progress > 0 ? 'Continue' : 'Start Assignment'}
                            </Button>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* In Progress */}
            {inProgress.length > 0 && (
              <motion.div variants={fadeInUp}>
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="w-6 h-6 text-orange-500" />
                  <h2 className="text-xl font-bold text-slate-900">
                    In Progress
                  </h2>
                  <Badge variant="warning" size="sm">
                    {inProgress.length}
                  </Badge>
                </div>
                <div className="space-y-4">
                  {inProgress.slice(0, 3).map((assignment) => {
                    const colors = getColorClasses(assignment.class?.color || 'blue');
                    const progress =
                      assignment.studentSubmission?.percentage || 0;

                    return (
                      <Card
                        key={assignment.id}
                        padding="sm"
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() =>
                          navigate(`/student/assignments/${assignment.id}`)
                        }
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-900 mb-1">
                              {assignment.title}
                            </h4>
                            <p className={`text-sm ${colors.text}`}>
                              {assignment.class?.name} • {formatDueDate(assignment.dueDate)}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-slate-900">
                              {progress}%
                            </div>
                            <div className="text-xs text-slate-600">complete</div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Pending Assignments (Not Started) */}
            {notStarted.length > 0 && (
              <motion.div variants={fadeInUp}>
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-6 h-6 text-blue-500" />
                  <h2 className="text-xl font-bold text-slate-900">
                    Pending Assignments
                  </h2>
                  <Badge variant="primary" size="sm">
                    {notStarted.length}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {notStarted.slice(0, 5).map((assignment) => {
                    const colors = getColorClasses(assignment.class?.color || 'blue');
                    const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < now;

                    return (
                      <Card
                        key={assignment.id}
                        padding="sm"
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() =>
                          navigate(`/student/assignments/${assignment.id}`)
                        }
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-900 mb-1">
                              {assignment.title}
                            </h4>
                            <div className="flex items-center gap-2">
                              <p className={`text-sm ${colors.text}`}>
                                {assignment.class?.name}
                              </p>
                              <span className="text-slate-400">•</span>
                              <p className={`text-sm ${isOverdue ? 'text-red-600 font-semibold' : 'text-slate-600'}`}>
                                {isOverdue ? 'OVERDUE' : formatDueDate(assignment.dueDate)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="neutral" size="sm">
                              {assignment.totalPoints} pts
                            </Badge>
                            <Button variant="primary" size="sm">
                              <Play className="w-4 h-4 mr-1" />
                              Start
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* All Completed Message */}
            {notStarted.length === 0 && inProgress.length === 0 && dueToday.length === 0 && assignments.length > 0 && (
              <motion.div variants={fadeInUp}>
                <Card className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-green-500/30">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    All Caught Up! 🎉
                  </h3>
                  <p className="text-slate-600 mb-4">
                    You've completed all your assignments. Great job!
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-semibold">Keep up the excellent work!</span>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* No Assignments Message */}
            {assignments.length === 0 && (
              <motion.div variants={fadeInUp}>
                <Card className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-blue-500/30">
                    <FileText className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    No Assignments Yet
                  </h3>
                  <p className="text-slate-600">
                    Check back later for new assignments from your teachers.
                  </p>
                </Card>
              </motion.div>
            )}

            {/* View All Assignments Link */}
            {assignments.length > 0 && (
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => navigate('/student/assignments')}
              >
                View All Assignments
              </Button>
            )}
          </div>

          {/* Right Column - Teaching Assistant */}
          <motion.div variants={fadeInUp} className="space-y-6">
            {/* TA Card - Redesigned with transparent purple and neomorphism */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="relative overflow-hidden rounded-2xl"
            >
              {/* Neomorphic card */}
              <div className="relative backdrop-blur-md bg-white/40 border border-white/50 shadow-2xl rounded-2xl p-6">
                {/* Apple-style neomorphic inner shadow */}
                <div className="absolute inset-0 rounded-2xl shadow-inner opacity-30 pointer-events-none"></div>

                {/* Header with icon */}
                <div className="relative flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg">
                    <Brain className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-xl text-slate-800">SocratIt!</h3>
                      <Sparkles className="w-4 h-4 text-purple-600" />
                    </div>
                    <p className="text-sm text-purple-700 font-medium">24/7 Support • Always Ready</p>
                  </div>
                </div>

                <p className="text-sm text-slate-700 mb-4 leading-relaxed">
                  Ask me anything! I can help with homework, explain concepts, or guide you through problems.
                </p>

                {/* Text input form - neomorphic style */}
                <form onSubmit={handleSendMessage} className="mb-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder="Type your question here..."
                      className="w-full pl-4 pr-12 py-3 rounded-xl bg-white/60 backdrop-blur-sm border border-purple-200/50
                               shadow-inner focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400
                               text-slate-800 placeholder-slate-500 transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!chatMessage.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700
                               rounded-lg flex items-center justify-center hover:shadow-lg hover:shadow-purple-500/50
                               transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
                    >
                      <Send className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </form>

                {/* Quick Actions */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-purple-700/80">
                    Quick Actions
                  </p>
                  {taQuickActions.slice(0, 4).map((action, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleQuickAction(action.text)}
                      className="w-full text-left px-4 py-2.5 rounded-xl bg-white/50 backdrop-blur-sm border border-white/60
                               hover:bg-white/70 hover:shadow-md hover:shadow-purple-200/50 transition-all text-sm
                               flex items-center gap-3 text-slate-700 font-medium"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-sm">
                        {action.icon}
                      </div>
                      <span>{action.text}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Recent Grades */}
            {gradedAssignments.length > 0 && (
              <Card>
                <h3 className="font-bold text-slate-900 mb-4">Recent Grades</h3>
                <div className="space-y-3">
                  {gradedAssignments.slice(0, 3).map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 text-sm">
                          {assignment.title}
                        </p>
                        <p className="text-xs text-slate-600">
                          {assignment.class?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-lg font-bold ${
                            (assignment.studentSubmission?.percentage || 0) >= 90
                              ? 'text-green-600'
                              : (assignment.studentSubmission?.percentage || 0) >= 80
                              ? 'text-blue-600'
                              : (assignment.studentSubmission?.percentage || 0) >= 70
                              ? 'text-orange-600'
                              : 'text-red-600'
                          }`}
                        >
                          {assignment.studentSubmission?.percentage || 0}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-3"
                  onClick={() => navigate('/student/grades')}
                >
                  View All Grades
                </Button>
              </Card>
            )}
          </motion.div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};
