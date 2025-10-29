// ============================================================================
// CLASS DASHBOARD
// Main dashboard view for a single class with curriculum integration
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  const [showCurriculumModal, setShowCurriculumModal] = useState(false);

  useEffect(() => {
    loadClassData();
  }, [classId]);

  const loadClassData = async () => {
    setIsLoading(true);
    try {
      // Load class info, students, and assignments in parallel
      const [classInfo, students, assignments] = await Promise.all([
        classApiService.getClass(classId!),
        classApiService.getClassStudents(classId!),
        classApiService.getClassAssignments(classId!),
      ]);

      // Load curriculum schedule if it exists
      const schedule = await classApiService.getClassSchedule(classId!);

      // If schedule exists, load current and upcoming units
      let currentUnit = null;
      let upcomingUnits: any[] = [];
      if (schedule) {
        [currentUnit, upcomingUnits] = await Promise.all([
          classApiService.getCurrentUnit(schedule.id),
          classApiService.getUpcomingUnits(schedule.id, 3),
        ]);
      }

      // Load progress data
      const progressData = await classApiService.getClassProgress(classId!);

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

      setClassData(classData);
    } catch (error) {
      console.error('Failed to load class data:', error);
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading class...</p>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Class not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
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
  );
};

export default ClassDashboard;
