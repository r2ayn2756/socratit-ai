// ============================================================================
// CLASS DASHBOARD
// Main dashboard view for a single class with curriculum integration
//
// IMPORTANT: This is the central hub for ALL class-specific features, including:
// - ANALYTICS: Performance tracking, concept mastery, engagement metrics
// - AI INSIGHTS: Student AI usage monitoring, common questions, struggling concepts
//
// Analytics and AI Insights have been REMOVED from the global sidebar navigation
// and should be implemented as sections/tabs within this ClassDashboard component
// to provide better class-specific context and user experience.
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import {
  ClassHeader,
  CurriculumSection,
  RosterSection,
  AssignmentsSection,
  ClassAnalyticsSection,
} from '../../components/class';
import { LessonsSection } from '../../components/class/LessonsSection';
import { CurriculumManagementModal } from '../../components/class/CurriculumManagementModal';
import { UnitDetailsModal } from '../../components/curriculum/UnitDetailsModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Button } from '../../components/common/Button';
import { classCurriculumService } from '../../services/classCurriculum.service';
import { curriculumApi } from '../../services/curriculumApi.service';
import { classService } from '../../services/class.service';
import type { CurriculumUnit, CurriculumSubUnit } from '../../types/curriculum.types';

interface ClassData {
  id: string;
  name: string;
  subject: string;
  gradeLevel: string;
  studentCount: number;
  classCode?: string;
  schedule: any;
  currentUnit: any;
  upcomingUnits: any[];
  students: any[];
  pendingEnrollments: any[];
  assignments: any[];
  progressData: any;
}

export const ClassDashboard: React.FC = () => {
  const { t } = useLanguage();
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();

  const [classData, setClassData] = useState<ClassData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCurriculumModal, setShowCurriculumModal] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<CurriculumUnit | null>(null);
  const [showUnitDetails, setShowUnitDetails] = useState(false);

  useEffect(() => {
    loadClassData();
  }, [classId]);

  const loadClassData = async () => {
    if (!classId) {
      setError(t('common.error.noId'));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Load class info with retry logic for newly created classes
      let classInfo: any = null;
      let retries = 0;
      const maxRetries = 3;

      while (retries < maxRetries) {
        try {
          classInfo = await classCurriculumService.getClass(classId!);
          break; // Success, exit retry loop
        } catch (err: any) {
          if (err.response?.status === 500 && retries < maxRetries - 1) {
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1)));
            retries++;
          } else {
            throw err; // Re-throw if not a 500 or max retries reached
          }
        }
      }

      // Also get class info from classService to get classCode and enrollment counts
      let classWithStats: any = null;
      try {
        classWithStats = await classService.getClassById(classId!);
      } catch (statsError: any) {
        console.warn('Class stats not available:', statsError);
      }

      // Load students (gracefully handle if endpoint doesn't exist yet)
      let students: any[] = [];
      try {
        students = await classCurriculumService.getClassStudents(classId!);
      } catch (studentError: any) {
        console.warn('Students not available:', studentError);
        // Students endpoint may not exist yet, continue without it
      }

      // Load pending enrollments
      let pendingEnrollments: any[] = [];
      try {
        pendingEnrollments = await classService.getClassEnrollments(classId!, 'PENDING');
      } catch (enrollmentError: any) {
        console.warn('Pending enrollments not available:', enrollmentError);
      }

      // Load assignments (gracefully handle if endpoint doesn't exist yet)
      let assignments: any[] = [];
      try {
        assignments = await classCurriculumService.getClassAssignments(classId!);
      } catch (assignmentError: any) {
        console.warn('Assignments not available:', assignmentError);
        // Assignments endpoint may not exist yet, continue without it
      }

      // Load curriculum schedule if it exists
      const schedule = await classCurriculumService.getClassSchedule(classId!);

      // Extract units from schedule response
      let currentUnit: any = null;
      let upcomingUnits: any[] = [];
      if (schedule?.units && schedule.units.length > 0) {
        const units = schedule.units;
        console.log('Units found in schedule:', units.length, 'units');

        // Find current unit (first IN_PROGRESS or SCHEDULED unit)
        currentUnit = units.find((u) =>
          u.status === 'IN_PROGRESS' || u.status === 'SCHEDULED'
        ) || units[0];

        // Get upcoming units (next 3 units after current)
        if (currentUnit) {
          const currentIndex = units.findIndex((u) => u.id === currentUnit!.id);
          upcomingUnits = units.slice(currentIndex + 1, currentIndex + 4);
        }

        console.log('Current unit:', currentUnit?.title);
        console.log('Upcoming units:', upcomingUnits.length);
      } else {
        console.log('No units found in schedule');
      }

      // Load progress data (gracefully handle if not available)
      let progressData = null;
      try {
        progressData = await classCurriculumService.getClassProgress(classId!);
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
        classCode: classWithStats?.classCode,
        schedule,
        currentUnit,
        upcomingUnits,
        students,
        pendingEnrollments,
        assignments,
        progressData,
      };

      console.log('Class data loaded successfully:', classData);
      setClassData(classData);
    } catch (error: any) {
      console.error('Failed to load class data:', error);
      const errorMessage = error.response?.data?.message || error.message || t('class.error');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageCurriculum = () => {
    setShowCurriculumModal(true);
  };

  const handleUnitClick = (unit: CurriculumUnit) => {
    setSelectedUnit(unit);
    setShowUnitDetails(true);
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

  const handleGenerateAssignment = (subUnit: CurriculumSubUnit) => {
    // Navigate to assignment creation with sub-unit context
    navigate('/teacher/assignments/new', {
      state: {
        classId,
        curriculumSubUnitId: subUnit.id,
        subUnitName: subUnit.name,
        subUnitDescription: subUnit.description,
        concepts: subUnit.concepts,
        learningObjectives: subUnit.learningObjectives,
      },
    });
  };

  const handleSendAnnouncement = () => {
    // TODO: Implement send announcement
    console.log('Send announcement');
  };

  if (isLoading) {
    return (
      <DashboardLayout userRole="teacher">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="xl" message={t('class.loading')} />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !classData) {
    return (
      <DashboardLayout userRole="teacher">
        <div className="flex items-center justify-center h-64">
          <div className="max-w-md">
            <EmptyState
              icon={AlertTriangle}
              title={t('common.error.notFound')}
              message={error || t('class.error')}
              action={{
                label: t('common.buttons.back'),
                onClick: () => navigate('/teacher/classes'),
              }}
            />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="teacher">
      <div className="space-y-6">
        {/* Header - Full Width */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ClassHeader
            className={classData.name}
            subject={classData.subject}
            gradeLevel={classData.gradeLevel}
            studentCount={classData.studentCount}
            classCode={classData.classCode}
            onSendAnnouncement={handleSendAnnouncement}
          />
        </motion.div>

        {/* Main Content Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Analytics & Schedule (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Analytics Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <ClassAnalyticsSection
                classId={classId!}
                onContactStudent={(studentId) => console.log('Contact student:', studentId)}
              />
            </motion.div>

            {/* Schedule Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <CurriculumSection
                schedule={classData.schedule}
                currentUnit={classData.currentUnit}
                upcomingUnits={classData.upcomingUnits}
                onManageClick={handleManageCurriculum}
                onUnitClick={handleUnitClick}
                onGenerateAssignment={handleGenerateAssignment}
              />
            </motion.div>
          </div>

          {/* Right Column - Assignments, Roster & Lessons (1/3) */}
          <div className="space-y-6">
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

            {/* Roster Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <RosterSection
                students={classData.students}
                pendingEnrollments={classData.pendingEnrollments}
                onViewFull={() => navigate(`/teacher/classes/${classId}/roster`)}
                onAddStudent={handleAddStudent}
                onStudentClick={(student) => console.log('Student clicked:', student)}
              />
            </motion.div>

            {/* Lessons Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <LessonsSection
                classId={classId!}
                userRole="teacher"
                showRecorder={true}
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Curriculum Management Modal */}
      {classData.schedule && (
        <CurriculumManagementModal
          isOpen={showCurriculumModal}
          onClose={() => setShowCurriculumModal(false)}
          scheduleId={classData.schedule.id}
        />
      )}

      {/* Unit Details Modal */}
      <UnitDetailsModal
        unit={selectedUnit}
        isOpen={showUnitDetails}
        onClose={() => {
          setShowUnitDetails(false);
          setSelectedUnit(null);
        }}
        userRole="teacher"
        onGenerateAssignment={handleGenerateAssignment}
      />
    </DashboardLayout>
  );
};

export default ClassDashboard;
