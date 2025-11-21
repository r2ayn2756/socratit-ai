// ============================================================================
// CREATE ASSIGNMENT PAGE
// Teacher interface for creating assignments manually or with AI
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, Input } from '../../components/common';
import { ArrowLeft, Save, Sparkles, Plus, Trash2, BookOpen, Calendar, Award, Settings, Calculator, Target, FileText } from 'lucide-react';
import { assignmentService, CreateAssignmentDTO, Question, EssayConfig, RubricCriterion } from '../../services/assignment.service';
import { classService } from '../../services/class.service';
import { AIAssignmentModal } from '../../components/teacher/AIAssignmentModal';
import { MathQuestionEditor } from '../../components/teacher/MathQuestionEditor';
import { RubricBuilder } from '../../components/teacher/RubricBuilder';

export const CreateAssignment: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const isEditMode = !!assignmentId;
  const [showAIModal, setShowAIModal] = useState(false);

  // Get classId from URL params if navigating from a class page
  const classIdFromUrl = searchParams.get('classId');

  // Extract curriculum subunit context from navigation state
  const subUnitContext = location.state as {
    classId?: string;
    curriculumSubUnitId?: string;
    subUnitName?: string;
    subUnitDescription?: string;
    concepts?: string[];
    learningObjectives?: string[];
  } | null;

  // Form state
  const [formData, setFormData] = useState<CreateAssignmentDTO>({
    classId: classIdFromUrl || '',
    title: '',
    description: '',
    instructions: '',
    type: 'PRACTICE',
    totalPoints: 100,
    dueDate: '',
    allowLateSubmission: false,
    showCorrectAnswers: true,
    shuffleQuestions: false,
    maxAttempts: 1,
    questions: [],
  });

  // Interactive Math specific settings
  const [mathSettings, setMathSettings] = useState({
    enableGraphingCalculator: true,
    enableStepByStepHints: true,
    enableBasicCalculator: true,
  });


  // Essay-specific settings
  const [essayConfig, setEssayConfig] = useState<EssayConfig>({
    minWords: undefined,
    maxWords: undefined,
    rubric: [],
    showRubricToStudent: true,
    allowAIAssistant: true,
  });

  // Fetch teacher's classes
  const { data: classesData } = useQuery({
    queryKey: ['teacher-classes'],
    queryFn: () => classService.getTeacherClasses(),
  });


  // Fetch existing assignment if in edit mode
  const { data: existingAssignment, isLoading: isLoadingAssignment } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: () => assignmentService.getAssignment(assignmentId!),
    enabled: isEditMode,
  });


  // Populate form when assignment data loads OR when coming from curriculum
  useEffect(() => {
    if (existingAssignment && isEditMode) {
      // Convert ISO date to datetime-local format
      const formatDateForInput = (isoDate?: string) => {
        if (!isoDate) return '';
        const date = new Date(isoDate);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      setFormData({
        classId: existingAssignment.classId,
        title: existingAssignment.title,
        description: existingAssignment.description || '',
        instructions: existingAssignment.instructions || '',
        type: existingAssignment.type,
        totalPoints: existingAssignment.totalPoints,
        dueDate: formatDateForInput(existingAssignment.dueDate),
        allowLateSubmission: existingAssignment.allowLateSubmission,
        showCorrectAnswers: existingAssignment.showCorrectAnswers,
        shuffleQuestions: existingAssignment.shuffleQuestions,
        maxAttempts: existingAssignment.maxAttempts,
        questions: existingAssignment.questions || [],
      });
    } else if (subUnitContext && !isEditMode) {
      // Pre-populate form with subunit context when coming from curriculum
      setFormData((prev) => ({
        ...prev,
        classId: subUnitContext.classId || prev.classId,
        title: subUnitContext.subUnitName || prev.title,
        description: subUnitContext.subUnitDescription || prev.description,
        instructions: subUnitContext.learningObjectives?.length
          ? `Learning Objectives:\n${subUnitContext.learningObjectives.map((obj, idx) => `${idx + 1}. ${obj}`).join('\n')}`
          : prev.instructions,
      }));

      // Automatically open AI modal if coming from curriculum with topic context
      if (subUnitContext.curriculumSubUnitId) {
        setShowAIModal(true);
      }
    }
  }, [existingAssignment, isEditMode, subUnitContext]);

  // Create assignment mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateAssignmentDTO) => {
      console.log('Creating assignment with data:', data);
      const result = await assignmentService.createAssignment(data);
      console.log('Assignment created:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('Create mutation onSuccess called with:', data);
      // Invalidate assignments query to refetch the list
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      navigate('/teacher/assignments');
    },
    onError: (error: any) => {
      console.error('Create mutation failed:', error);
      console.error('Error response:', error.response?.data);
      console.error('Validation errors:', error.response?.data?.errors);
      console.error('Error status:', error.response?.status);
    },
  });

  // Update assignment mutation
  const updateMutation = useMutation({
    mutationFn: async (data: CreateAssignmentDTO) => {
      console.log('Updating assignment with data:', data);
      // Extract only the fields that can be updated via UpdateAssignmentDTO
      const updateData = {
        title: data.title,
        description: data.description,
        instructions: data.instructions,
        type: data.type,
        totalPoints: data.totalPoints,
        dueDate: data.dueDate,
        allowLateSubmission: data.allowLateSubmission,
        showCorrectAnswers: data.showCorrectAnswers,
        shuffleQuestions: data.shuffleQuestions,
        maxAttempts: data.maxAttempts,
      };
      const result = await assignmentService.updateAssignment(assignmentId!, updateData);
      console.log('Assignment updated:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('Update mutation onSuccess called with:', data);
      // Invalidate both the assignments list and the specific assignment
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId] });
      navigate('/teacher/assignments');
    },
    onError: (error: any) => {
      console.error('Update mutation failed:', error);
      console.error('Error response:', error.response?.data);
      console.error('Validation errors:', error.response?.data?.errors);
      console.error('Error status:', error.response?.status);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);

    // Prepare data for submission
    const submitData: CreateAssignmentDTO = {
      ...formData,
      // Convert datetime-local to ISO string if present
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
      // Remove questions array if empty (backend validation requires min 1) - but allow empty for ESSAY type
      questions: formData.questions && formData.questions.length > 0 ? formData.questions : undefined,
      // Include essay config if type is ESSAY
      essayConfig: formData.type === 'ESSAY' ? essayConfig : undefined,
    };

    console.log('Processed submit data:', submitData);

    // Use update mutation if in edit mode, otherwise create
    if (isEditMode) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const addQuestion = () => {
    const newQuestion = {
      type: 'MULTIPLE_CHOICE' as const,
      questionText: '',
      questionOrder: (formData.questions?.length || 0) + 1,
      points: 10,
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctOption: 'A' as const,
    };
    setFormData({
      ...formData,
      questions: [...(formData.questions || []), newQuestion],
    });
  };

  const removeQuestion = (index: number) => {
    const updatedQuestions = formData.questions?.filter((_, i) => i !== index);
    setFormData({ ...formData, questions: updatedQuestions });
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updatedQuestions = [...(formData.questions || [])];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setFormData({ ...formData, questions: updatedQuestions });
  };

  // Show loading state while fetching assignment in edit mode
  if (isEditMode && isLoadingAssignment) {
    return (
      <DashboardLayout userRole="teacher">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">Loading assignment...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="teacher">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Curriculum Context Banner */}
        {subUnitContext && subUnitContext.curriculumSubUnitId && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500 p-4 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  Creating assignment from curriculum topic
                </h3>
                <p className="text-sm text-gray-700 mt-1">
                  <span className="font-medium">{subUnitContext.subUnitName}</span>
                  {subUnitContext.concepts && subUnitContext.concepts.length > 0 && (
                    <span className="text-gray-600">
                      {' • '}Covers: {subUnitContext.concepts.join(', ')}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/teacher/assignments')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {isEditMode ? 'Edit Assignment' : 'Create Assignment'}
              </h1>
              <p className="text-slate-600 mt-1">
                {isEditMode
                  ? 'Update assignment details and change due date'
                  : 'Create a new assignment for your students'}
              </p>
            </div>
          </div>
          {!isEditMode && (
            <Button
              variant="gradient"
              size="md"
              onClick={() => setShowAIModal(true)}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Generate with AI
            </Button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card variant="glassElevated">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Basic Information</h2>

            <div className="space-y-6">
              {/* Class Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Class <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.classId}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                  disabled={isEditMode}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-500/20 disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select a class</option>
                  {classesData?.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} - {cls.period || cls.gradeLevel}
                    </option>
                  ))}
                </select>
                {isEditMode ? (
                  <p className="mt-1.5 text-sm text-slate-500">
                    Class cannot be changed after assignment creation
                  </p>
                ) : classIdFromUrl && (
                  <p className="mt-1.5 text-sm text-blue-600">
                    Class pre-selected from navigation
                  </p>
                )}
              </div>

              {/* Title */}
              <Input
                label="Title"
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Triangle Properties Quiz"
              />

              {/* Type - Interactive Button Group */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Assignment Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'PRACTICE', label: 'Practice', activeClass: 'border-blue-500 bg-blue-50 text-blue-700' },
                    { value: 'ESSAY', label: 'Essay', activeClass: 'border-pink-500 bg-pink-50 text-pink-700' },
                  ].map((type) => (
                    <motion.button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: type.value as any })}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`px-4 py-2.5 rounded-lg border-2 transition-all duration-200 font-medium text-sm ${
                        formData.type === type.value
                          ? type.activeClass
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {type.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this assignment..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Instructions
                </label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="Detailed instructions for students..."
                  rows={4}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>

              {/* Points and Due Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Award className="w-4 h-4 inline mr-1.5 text-slate-500" />
                    Total Points <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.totalPoints}
                    onChange={(e) => setFormData({ ...formData, totalPoints: parseInt(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1.5 text-slate-500" />
                    Due Date
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Settings */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <Settings className="w-4 h-4 text-slate-700" />
                  <label className="text-sm font-medium text-slate-700">Assignment Settings</label>
                </div>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allowLateSubmission}
                      onChange={(e) => setFormData({ ...formData, allowLateSubmission: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700 font-medium">Allow late submissions</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.showCorrectAnswers}
                      onChange={(e) => setFormData({ ...formData, showCorrectAnswers: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700 font-medium">Show correct answers after submission</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.shuffleQuestions}
                      onChange={(e) => setFormData({ ...formData, shuffleQuestions: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700 font-medium">Shuffle question order</span>
                  </label>
                </div>
              </div>

              {/* Interactive Math removed - only PRACTICE and ESSAY types supported */}

              {/* Essay Settings - Only show when type is ESSAY */}
              {formData.type === 'ESSAY' && (
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-pink-600" />
                    <label className="text-sm font-medium text-pink-700">Essay Settings</label>
                  </div>
                  <div className="space-y-4">
                    {/* Word Count Requirements */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Minimum Words</label>
                        <input
                          type="number"
                          min="0"
                          value={essayConfig.minWords || ''}
                          onChange={(e) => setEssayConfig({ ...essayConfig, minWords: e.target.value ? parseInt(e.target.value) : undefined })}
                          placeholder="e.g., 500"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:border-pink-500 focus:ring-pink-500/20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Maximum Words</label>
                        <input
                          type="number"
                          min="0"
                          value={essayConfig.maxWords || ''}
                          onChange={(e) => setEssayConfig({ ...essayConfig, maxWords: e.target.value ? parseInt(e.target.value) : undefined })}
                          placeholder="e.g., 1000"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:border-pink-500 focus:ring-pink-500/20"
                        />
                      </div>
                    </div>

                    {/* Essay Checkboxes */}
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-pink-200 bg-pink-50/50 hover:bg-pink-50 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={essayConfig.showRubricToStudent}
                        onChange={(e) => setEssayConfig({ ...essayConfig, showRubricToStudent: e.target.checked })}
                        className="w-4 h-4 text-pink-600 border-slate-300 rounded focus:ring-2 focus:ring-pink-500"
                      />
                      <div className="flex-1">
                        <span className="text-sm text-slate-900 font-medium">Show Rubric to Students</span>
                        <p className="text-xs text-slate-600 mt-0.5">Display grading criteria while students write</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-pink-200 bg-pink-50/50 hover:bg-pink-50 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={essayConfig.allowAIAssistant}
                        onChange={(e) => setEssayConfig({ ...essayConfig, allowAIAssistant: e.target.checked })}
                        className="w-4 h-4 text-pink-600 border-slate-300 rounded focus:ring-2 focus:ring-pink-500"
                      />
                      <div className="flex-1">
                        <span className="text-sm text-slate-900 font-medium">Allow AI Writing Assistant</span>
                        <p className="text-xs text-slate-600 mt-0.5">Students can use AI to brainstorm and develop ideas</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Essay Rubric Builder - Only show when type is ESSAY */}
          {formData.type === 'ESSAY' && (
            <RubricBuilder
              rubric={essayConfig.rubric || []}
              onChange={(rubric) => setEssayConfig({ ...essayConfig, rubric })}
            />
          )}

          {/* Questions - Hide for ESSAY type */}
          {formData.type !== 'ESSAY' && (
            <Card variant="glassElevated">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Questions</h2>
                  {isEditMode && existingAssignment?.status !== 'DRAFT' && (
                    <p className="text-sm text-amber-600 mt-1">
                      Note: Questions cannot be edited after assignment is published. Only due date and settings can be changed.
                    </p>
                  )}
                </div>
                {(!isEditMode || existingAssignment?.status === 'DRAFT') && (
                  <Button
                    type="button"
                    variant="gradient"
                    size="sm"
                    onClick={addQuestion}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Question
                  </Button>
                )}
              </div>

            {formData.questions && formData.questions.length > 0 ? (
              <div className="space-y-4">
                {formData.questions.map((question, index) => {
                  const isReadOnly = isEditMode && existingAssignment?.status !== 'DRAFT';
                  return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-xl shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600">
                            {index + 1}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-slate-900">
                          Question {index + 1}
                        </span>
                      </div>
                      {!isReadOnly && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeQuestion(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-4">
                      {/* Question Type */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Type</label>
                        <select
                          value={question.type}
                          onChange={(e) => updateQuestion(index, 'type', e.target.value)}
                          disabled={isReadOnly}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-500/20 disabled:bg-slate-100 disabled:cursor-not-allowed"
                        >
                          <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                          <option value="FREE_RESPONSE">Free Response</option>
                        </select>
                      </div>

                      {/* Question Text */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Question Text</label>
                        <textarea
                          value={question.questionText}
                          onChange={(e) => updateQuestion(index, 'questionText', e.target.value)}
                          placeholder="Enter question text..."
                          rows={2}
                          disabled={isReadOnly}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-500/20 disabled:bg-slate-100 disabled:cursor-not-allowed"
                        />
                      </div>

                      {/* Points */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Points</label>
                        <input
                          type="number"
                          min="1"
                          value={question.points}
                          onChange={(e) => updateQuestion(index, 'points', parseInt(e.target.value))}
                          placeholder="Points"
                          disabled={isReadOnly}
                          className="w-32 px-3 py-2 bg-white border border-slate-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-500/20 disabled:bg-slate-100 disabled:cursor-not-allowed"
                        />
                      </div>

                      {/* Multiple Choice Options */}
                      {question.type === 'MULTIPLE_CHOICE' && (
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-2">Answer Options</label>
                          <div className="space-y-2">
                            {['A', 'B', 'C', 'D'].map((option) => (
                              <div key={option} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/50 transition-colors">
                                <input
                                  type="radio"
                                  name={`correct-${index}`}
                                  checked={question.correctOption === option}
                                  onChange={() => updateQuestion(index, 'correctOption', option)}
                                  disabled={isReadOnly}
                                  className="w-4 h-4 text-green-600 border-slate-300 focus:ring-2 focus:ring-green-500"
                                />
                                <div className="flex items-center gap-2 flex-1">
                                  <span className="text-sm font-semibold text-slate-600 w-6">{option}.</span>
                                  <input
                                    type="text"
                                    value={(question as any)[`option${option}`] || ''}
                                    onChange={(e) => updateQuestion(index, `option${option}`, e.target.value)}
                                    placeholder={`Option ${option}`}
                                    disabled={isReadOnly}
                                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-500/20 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-slate-500 mt-2">Select the correct answer</p>
                        </div>
                      )}

                      {/* Free Response Answer */}
                      {question.type === 'FREE_RESPONSE' && (
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1.5">Sample Correct Answer (for AI grading)</label>
                          <textarea
                            value={question.correctAnswer || ''}
                            onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
                            placeholder="Provide a sample correct answer to help the AI grade student responses..."
                            rows={3}
                            disabled={isReadOnly}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-500/20 disabled:bg-slate-100 disabled:cursor-not-allowed"
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 px-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                  <Plus className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-600 font-medium">No questions added yet</p>
                <p className="text-sm text-slate-500 mt-1">Click "Add Question" above or use "Generate with AI" to get started</p>
              </div>
            )}
            </Card>
          )}


          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="glass"
              onClick={() => navigate('/teacher/assignments')}
              glow={false}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gradient"
              disabled={
                (isEditMode ? updateMutation.isPending : createMutation.isPending) ||
                !formData.classId ||
                !formData.title
              }
            >
              <Save className="w-4 h-4 mr-2" />
              {isEditMode
                ? updateMutation.isPending
                  ? 'Updating...'
                  : 'Update Assignment'
                : createMutation.isPending
                ? 'Creating...'
                : 'Create Assignment'}
            </Button>
          </div>

          {(createMutation.isError || updateMutation.isError) && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">
                Error {isEditMode ? 'updating' : 'creating'} assignment. Please try again.
              </p>
            </div>
          )}
        </form>
      </div>

      {/* AI Assignment Generation Modal */}
      <AIAssignmentModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onAssignmentGenerated={(assignmentId) => {
          // Navigate to the generated assignment for review/editing
          navigate(`/teacher/assignments/${assignmentId}/edit`);
        }}
        preSelectedClassId={formData.classId}
        subUnitContext={subUnitContext || undefined}
      />
    </DashboardLayout>
  );
};
