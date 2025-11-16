// ============================================================================
// CREATE ASSIGNMENT PAGE
// Teacher interface for creating assignments manually or with AI
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '../../components/layout';
import { Card, Button } from '../../components/common';
import { ArrowLeft, Save, Sparkles, Plus, Trash2 } from 'lucide-react';
import { assignmentService, CreateAssignmentDTO, Question } from '../../services/assignment.service';
import { classService } from '../../services/class.service';
import { AIAssignmentModal } from '../../components/teacher/AIAssignmentModal';

export const CreateAssignment: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const isEditMode = !!assignmentId;
  const [showAIModal, setShowAIModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateAssignmentDTO>({
    classId: '',
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

  // Populate form when assignment data loads
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
    }
  }, [existingAssignment, isEditMode]);

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
      // Remove questions array if empty (backend validation requires min 1)
      questions: formData.questions && formData.questions.length > 0 ? formData.questions : undefined,
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
            <h2 className="text-xl font-bold text-slate-900 mb-4">Basic Information</h2>

            <div className="space-y-4">
              {/* Class Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Class *
                </label>
                <select
                  required
                  value={formData.classId}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                  disabled={isEditMode}
                  className="w-full px-3 py-2 bg-white/90 backdrop-blur-md border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select a class</option>
                  {classesData?.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} - {cls.period || cls.gradeLevel}
                    </option>
                  ))}
                </select>
                {isEditMode && (
                  <p className="text-xs text-slate-500 mt-1">
                    Class cannot be changed after assignment creation
                  </p>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Triangle Properties Quiz"
                  className="w-full px-3 py-2 bg-white/90 backdrop-blur-md border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Type *
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 bg-white/90 backdrop-blur-md border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="PRACTICE">Practice</option>
                  <option value="QUIZ">Quiz</option>
                  <option value="TEST">Test</option>
                  <option value="HOMEWORK">Homework</option>
                  <option value="CHALLENGE">Challenge</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this assignment..."
                  rows={3}
                  className="w-full px-3 py-2 bg-white/90 backdrop-blur-md border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Instructions
                </label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="Detailed instructions for students..."
                  rows={4}
                  className="w-full px-3 py-2 bg-white/90 backdrop-blur-md border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Points and Due Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Total Points *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.totalPoints}
                    onChange={(e) => setFormData({ ...formData, totalPoints: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-white/90 backdrop-blur-md border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white/90 backdrop-blur-md border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.allowLateSubmission}
                    onChange={(e) => setFormData({ ...formData, allowLateSubmission: e.target.checked })}
                    className="rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-700">Allow late submissions</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.showCorrectAnswers}
                    onChange={(e) => setFormData({ ...formData, showCorrectAnswers: e.target.checked })}
                    className="rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-700">Show correct answers after submission</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.shuffleQuestions}
                    onChange={(e) => setFormData({ ...formData, shuffleQuestions: e.target.checked })}
                    className="rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-700">Shuffle question order</span>
                </label>
              </div>
            </div>
          </Card>

          {/* Questions */}
          <Card variant="glassElevated">
            <div className="flex items-center justify-between mb-4">
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
                  <div key={index} className="p-4 bg-white/50 backdrop-blur-md border border-white/30 rounded-xl">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-sm font-medium text-slate-700">
                        Question {index + 1}
                      </span>
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

                    <div className="space-y-3">
                      {/* Question Type */}
                      <select
                        value={question.type}
                        onChange={(e) => updateQuestion(index, 'type', e.target.value)}
                        disabled={isReadOnly}
                        className="w-full px-3 py-2 bg-white/90 backdrop-blur-md border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                      >
                        <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                        <option value="FREE_RESPONSE">Free Response</option>
                      </select>

                      {/* Question Text */}
                      <textarea
                        value={question.questionText}
                        onChange={(e) => updateQuestion(index, 'questionText', e.target.value)}
                        placeholder="Enter question text..."
                        rows={2}
                        disabled={isReadOnly}
                        className="w-full px-3 py-2 bg-white/90 backdrop-blur-md border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                      />

                      {/* Points */}
                      <input
                        type="number"
                        min="1"
                        value={question.points}
                        onChange={(e) => updateQuestion(index, 'points', parseInt(e.target.value))}
                        placeholder="Points"
                        disabled={isReadOnly}
                        className="w-24 px-3 py-2 bg-white/90 backdrop-blur-md border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                      />

                      {/* Multiple Choice Options */}
                      {question.type === 'MULTIPLE_CHOICE' && (
                        <div className="space-y-2 mt-3">
                          {['A', 'B', 'C', 'D'].map((option) => (
                            <div key={option} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`correct-${index}`}
                                checked={question.correctOption === option}
                                onChange={() => updateQuestion(index, 'correctOption', option)}
                                disabled={isReadOnly}
                                className="text-blue-600"
                              />
                              <input
                                type="text"
                                value={(question as any)[`option${option}`] || ''}
                                onChange={(e) => updateQuestion(index, `option${option}`, e.target.value)}
                                placeholder={`Option ${option}`}
                                disabled={isReadOnly}
                                className="flex-1 px-3 py-2 bg-white/90 backdrop-blur-md border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Free Response Answer */}
                      {question.type === 'FREE_RESPONSE' && (
                        <textarea
                          value={question.correctAnswer || ''}
                          onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
                          placeholder="Sample correct answer (for AI grading)..."
                          rows={3}
                          disabled={isReadOnly}
                          className="w-full px-3 py-2 bg-white/90 backdrop-blur-md border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                        />
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <p>No questions added yet.</p>
                <p className="text-sm mt-1">Click "Add Question" or use "Generate with AI" to get started.</p>
              </div>
            )}
          </Card>

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
      />
    </DashboardLayout>
  );
};
