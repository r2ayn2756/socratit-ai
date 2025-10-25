// ============================================================================
// CLASS ROSTER PAGE
// Teacher view to manage student enrollments
// ============================================================================

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  UserPlus,
  Check,
  X,
  Trash2,
  Mail,
  Clock,
  Users,
  AlertCircle,
  Copy,
  CheckCircle
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { classService, Enrollment, EnrollmentStatus } from '../../services/class.service';
import { AddStudentsModal } from '../../components/class/AddStudentsModal';

type TabType = 'pending' | 'approved' | 'rejected' | 'removed';

export const ClassRoster: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabType>('approved');
  const [showAddStudentsModal, setShowAddStudentsModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Fetch class details
  const { data: classData, isLoading: classLoading } = useQuery({
    queryKey: ['class', classId],
    queryFn: () => classService.getClassById(classId!),
    enabled: !!classId,
  });

  // Fetch enrollments based on active tab
  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ['class-enrollments', classId, activeTab],
    queryFn: () => classService.getClassEnrollments(classId!, activeTab.toUpperCase()),
    enabled: !!classId,
  });

  // Process enrollment mutation (approve/reject/remove)
  const processEnrollmentMutation = useMutation({
    mutationFn: ({ enrollmentId, status }: { enrollmentId: string; status: EnrollmentStatus }) =>
      classService.processEnrollment(classId!, enrollmentId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-enrollments', classId] });
      queryClient.invalidateQueries({ queryKey: ['class', classId] });
    },
  });

  // Remove student mutation
  const removeStudentMutation = useMutation({
    mutationFn: (enrollmentId: string) => classService.removeStudent(classId!, enrollmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-enrollments', classId] });
      queryClient.invalidateQueries({ queryKey: ['class', classId] });
    },
  });

  const handleApprove = (enrollmentId: string) => {
    processEnrollmentMutation.mutate({ enrollmentId, status: { status: 'APPROVED' } });
  };

  const handleReject = (enrollmentId: string, reason?: string) => {
    processEnrollmentMutation.mutate({
      enrollmentId,
      status: { status: 'REJECTED', rejectionReason: reason }
    });
  };

  const handleRemove = (enrollmentId: string) => {
    if (window.confirm('Are you sure you want to remove this student from the class?')) {
      removeStudentMutation.mutate(enrollmentId);
    }
  };

  const handleCopyCode = () => {
    if (classData?.classCode) {
      navigator.clipboard.writeText(classData.classCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'approved', label: 'Enrolled', icon: <Users size={16} /> },
    { key: 'pending', label: 'Pending', icon: <Clock size={16} /> },
    { key: 'rejected', label: 'Rejected', icon: <X size={16} /> },
    { key: 'removed', label: 'Removed', icon: <Trash2 size={16} /> },
  ];

  const getStatusBadgeClasses = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'REMOVED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (classLoading) {
    return (
      <DashboardLayout userRole="teacher">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!classData) {
    return (
      <DashboardLayout userRole="teacher">
        <div className="text-center py-12">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Class Not Found</h2>
          <p className="text-gray-600 mb-6">The class you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/teacher/classes')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Classes
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const enrollmentCount = classData.enrollmentCounts || { total: 0, pending: 0, approved: 0, rejected: 0, removed: 0 };

  return (
    <DashboardLayout userRole="teacher">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/teacher/classes')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Classes</span>
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{classData.name}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                {classData.subject && <span>{classData.subject}</span>}
                {classData.period && <span>Period {classData.period}</span>}
                {classData.room && <span>Room {classData.room}</span>}
              </div>
            </div>

            <button
              onClick={() => setShowAddStudentsModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UserPlus size={20} />
              <span>Add Students</span>
            </button>
          </div>
        </div>

        {/* Class Code Display */}
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Class Code</p>
              <p className="text-3xl font-bold text-gray-900 tracking-wider">{classData.classCode}</p>
              <p className="text-sm text-gray-600 mt-1">Share this code with students to join the class</p>
            </div>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {copiedCode ? (
                <>
                  <CheckCircle size={20} className="text-green-600" />
                  <span className="text-green-600 font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={20} />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Enrolled</p>
            <p className="text-2xl font-bold text-gray-900">{enrollmentCount.approved}</p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{enrollmentCount.pending}</p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Rejected</p>
            <p className="text-2xl font-bold text-red-600">{enrollmentCount.rejected}</p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Removed</p>
            <p className="text-2xl font-bold text-gray-600">{enrollmentCount.removed}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors border-b-2 ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.key ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {enrollmentCount[tab.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Enrollments List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {enrollmentsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : enrollments && enrollments.length > 0 ? (
            <div className="divide-y divide-gray-200">
              <AnimatePresence mode="wait">
                {enrollments.map((enrollment: Enrollment) => (
                  <motion.div
                    key={enrollment.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                          {enrollment.student.firstName[0]}{enrollment.student.lastName[0]}
                        </div>

                        {/* Student Info */}
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {enrollment.student.firstName} {enrollment.student.lastName}
                          </h3>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <Mail size={14} />
                              {enrollment.student.email}
                            </p>
                            {enrollment.student.gradeLevel && (
                              <span className="text-sm text-gray-600">
                                Grade {enrollment.student.gradeLevel}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClasses(enrollment.status)}`}>
                              {enrollment.status}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(enrollment.requestedAt).toLocaleDateString()}
                            </span>
                          </div>
                          {enrollment.rejectionReason && (
                            <p className="text-sm text-red-600 mt-1">
                              Reason: {enrollment.rejectionReason}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {activeTab === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(enrollment.id)}
                              disabled={processEnrollmentMutation.isPending}
                              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                              <Check size={16} />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleReject(enrollment.id)}
                              disabled={processEnrollmentMutation.isPending}
                              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                              <X size={16} />
                              <span>Reject</span>
                            </button>
                          </>
                        )}
                        {activeTab === 'approved' && (
                          <button
                            onClick={() => handleRemove(enrollment.id)}
                            disabled={removeStudentMutation.isPending}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            <Trash2 size={16} />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500">
              <Users className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-lg font-medium">No {activeTab} students</p>
              <p className="text-sm mt-1">
                {activeTab === 'approved' && 'Students will appear here once they enroll and you approve them.'}
                {activeTab === 'pending' && 'New enrollment requests will appear here.'}
                {activeTab === 'rejected' && 'Rejected enrollment requests will appear here.'}
                {activeTab === 'removed' && 'Removed students will appear here.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Students Modal */}
      <AddStudentsModal
        isOpen={showAddStudentsModal}
        onClose={() => setShowAddStudentsModal(false)}
        classId={classId!}
        className={classData.name}
      />
    </DashboardLayout>
  );
};
