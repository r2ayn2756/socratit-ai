// ============================================================================
// CLASS DASHBOARD
// Main dashboard view for a single class with curriculum integration
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import {
  ClassHeader,
  CurriculumSection,
  RosterSection,
  AssignmentsSection,
  ProgressSection,
} from '../../components/class';
import { CurriculumManagementModal } from '../../components/class/CurriculumManagementModal';
import { classApiService } from '../../services/classApi.service';
import { curriculumApi } from '../../services/curriculumApi.service';

interface ClassData {
  id: string;
  name: string;
  subject: string;
  gradeLevel: string;
  studentCount: number;
  schedule: any;
  currentUnit: any;
  upcomingUnits: any[];
  students: any[];
  assignments: any[];
  progressData: any;
}

export const ClassDashboard: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();

  const [classData, setClassData] = useState<ClassData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCurriculumModal, setShowCurriculumModal] = useState(false);

  useEffect(() => {
    loadClassData();
  }, [classId]);

  const loadClassData = async () => {
    if (!classId) {
      setError('No class ID provided');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      console.log('Loading class data for ID:', classId);

      // Load class info
      const classInfo = await classApiService.getClass(classId!);
      console.log('Class info loaded:', classInfo);

      // Load students (gracefully handle if endpoint doesn't exist yet)
      let students: any[] = [];
      try {
        students = await classApiService.getClassStudents(classId!);
      } catch (studentError: any) {
        console.warn('Students not available:', studentError);
        // Students endpoint may not exist yet, continue without it
      }

      // Load assignments (gracefully handle if endpoint doesn't exist yet)
      let assignments: any[] = [];
      try {
        assignments = await classApiService.getClassAssignments(classId!);
      } catch (assignmentError: any) {
        console.warn('Assignments not available:', assignmentError);
        // Assignments endpoint may not exist yet, continue without it
      }

      // Load curriculum schedule if it exists
      const schedule = await classApiService.getClassSchedule(classId!);
      console.log('Schedule loaded:', schedule);

      // If schedule exists, load current and upcoming units
      let currentUnit = null;
      let upcomingUnits: any[] = [];
      if (schedule) {
        [currentUnit, upcomingUnits] = await Promise.all([
          classApiService.getCurrentUnit(schedule.id),
          classApiService.getUpcomingUnits(schedule.id, 3),
        ]);
      }

      // Load progress data (gracefully handle if not available)
      let progressData = null;
      try {
        progressData = await classApiService.getClassProgress(classId!);
      } catch (progressError) {
        console.warn('Progress data not available:', progressError);
        // Set default progress data
        progressData = {
          classAverage: 0,
          averageTrend: 'stable' as const,
          strugglingStudents: [],
          topPerformers: [],
        };
      }

      // Combine all data
      const classData: ClassData = {
        id: classInfo.id,
        name: classInfo.name,
        subject: classInfo.subject || '',
        gradeLevel: classInfo.gradeLevel || '',
        studentCount: students.length,
        schedule,
        currentUnit,
        upcomingUnits,
        students,
        assignments,
        progressData,
      };

      console.log('Class data loaded successfully:', classData);
      setClassData(classData);
    } catch (error: any) {
      console.error('Failed to load class data:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load class data';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClass = () => {
    // TODO: Implement edit class
    console.log('Edit class');
  };

  const handleManageCurriculum = () => {
    setShowCurriculumModal(true);
  };

  const handleViewAnalytics = () => {
    navigate(`/teacher/classes/${classId}/analytics`);
  };

  const handleCreateAssignment = () => {
    navigate('/teacher/assignments/new', { state: { classId } });
  };

  const handleAddStudent = () => {
    // TODO: Implement add student
    console.log('Add student');
  };

  if (isLoading) {
    return (
      <DashboardLayout userRole="teacher">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading class...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !classData) {
    return (
      <DashboardLayout userRole="teacher">
        <div className="flex items-center justify-center h-64">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Class Not Found</h2>
            <p className="text-gray-600 mb-6">
              {error || 'The class you\'re looking for could not be loaded. It may have been deleted or you may not have permission to access it.'}
            </p>
            <button
              onClick={() => navigate('/teacher/classes')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to My Classes
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="teacher">
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ClassHeader
            className={classData.name}
            subject={classData.subject}
            gradeLevel={classData.gradeLevel}
            studentCount={classData.studentCount}
            unitCount={classData.schedule?.totalUnits || 0}
            progressPercentage={classData.schedule?.percentComplete || 0}
            onEdit={handleEditClass}
          />
        </motion.div>

        {/* Curriculum Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <CurriculumSection
            schedule={classData.schedule}
            currentUnit={classData.currentUnit}
            upcomingUnits={classData.upcomingUnits}
            onManageClick={handleManageCurriculum}
            onUnitClick={(unit) => console.log('Unit clicked:', unit)}
          />
        </motion.div>

        {/* Roster Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <RosterSection
            students={classData.students}
            onViewFull={() => navigate(`/teacher/classes/${classId}/roster`)}
            onAddStudent={handleAddStudent}
            onStudentClick={(student) => console.log('Student clicked:', student)}
          />
        </motion.div>

        {/* Assignments Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <AssignmentsSection
            assignments={classData.assignments}
            onViewAll={() => navigate('/teacher/assignments', { state: { classId } })}
            onCreateAssignment={handleCreateAssignment}
            onAssignmentClick={(assignment) =>
              navigate(`/teacher/assignments/${assignment.id}/submissions`)
            }
          />
        </motion.div>

        {/* Progress Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <ProgressSection
            progressData={classData.progressData}
            onViewAnalytics={handleViewAnalytics}
            onStudentClick={(studentId) => console.log('Student clicked:', studentId)}
          />
        </motion.div>
      </div>

      {/* Curriculum Management Modal */}
      {classData.schedule && (
        <CurriculumManagementModal
          isOpen={showCurriculumModal}
          onClose={() => setShowCurriculumModal(false)}
          scheduleId={classData.schedule.id}
        />
      )}
      </div>
    </DashboardLayout>
  );
};

export default ClassDashboard;
