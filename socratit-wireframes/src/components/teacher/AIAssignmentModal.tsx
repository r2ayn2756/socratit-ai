// ============================================================================
// AI ASSIGNMENT MODAL
// Modal for generating assignments from curriculum files
// ============================================================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Sparkles, Upload, FileText, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import { Button, FileUpload } from '../common';
import { curriculumService, CurriculumMaterial, UploadCurriculumRequest } from '../../services/curriculum.service';
import { classService } from '../../services/class.service';

// ============================================================================
// TYPES
// ============================================================================

interface AIAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssignmentGenerated: (assignmentId: string) => void;
  preSelectedClassId?: string;
  subUnitContext?: {
    curriculumSubUnitId?: string;
    subUnitName?: string;
    subUnitDescription?: string;
    concepts?: string[];
    learningObjectives?: string[];
  };
}

type Step = 'upload' | 'select-existing' | 'configure' | 'generating';

// ============================================================================
// COMPONENT
// ============================================================================

export const AIAssignmentModal: React.FC<AIAssignmentModalProps> = ({
  isOpen,
  onClose,
  onAssignmentGenerated,
  preSelectedClassId,
  subUnitContext,
}) => {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('select-existing');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedCurriculumId, setUploadedCurriculumId] = useState<string | null>(null);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState<string | null>(null);

  // Form state for curriculum upload
  const [curriculumTitle, setCurriculumTitle] = useState('');
  const [curriculumDescription, setCurriculumDescription] = useState('');

  // Form state for assignment generation
  const [assignmentConfig, setAssignmentConfig] = useState({
    title: '',
    description: '',
    classId: preSelectedClassId || '',
    numQuestions: 10,
    difficulty: 'mixed' as 'easy' | 'medium' | 'hard' | 'mixed',
    questionTypes: ['multiple_choice'] as Array<'multiple_choice' | 'free_response'>,
    type: 'PRACTICE' as 'PRACTICE' | 'TEST',
    totalPoints: 100,
    dueDate: '',
    timeLimit: 30,
  });

  // ============================================================================
  // QUERIES
  // ============================================================================

  // Fetch teacher's classes
  const { data: classesData } = useQuery({
    queryKey: ['teacher-classes'],
    queryFn: () => classService.getTeacherClasses(),
    enabled: isOpen,
  });

  // Fetch existing curriculum materials
  const { data: curriculumData, isLoading: isLoadingCurriculum } = useQuery({
    queryKey: ['curriculum-list'],
    queryFn: () => curriculumService.listCurriculum({ processingStatus: 'completed', isArchived: false }),
    enabled: isOpen && step === 'select-existing',
  });

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  // Upload curriculum mutation
  const uploadMutation = useMutation({
    mutationFn: (data: UploadCurriculumRequest) => curriculumService.uploadCurriculum(data),
    onSuccess: (data) => {
      setUploadedCurriculumId(data.id);
      setSelectedCurriculumId(data.id);
      queryClient.invalidateQueries({ queryKey: ['curriculum-list'] });

      // Poll for processing completion
      const checkInterval = setInterval(async () => {
        const status = await curriculumService.getCurriculumStatus(data.id);
        if (status.status === 'completed') {
          clearInterval(checkInterval);
          setStep('configure');
        } else if (status.status === 'failed') {
          clearInterval(checkInterval);
          alert('Processing failed: ' + status.error);
        }
      }, 2000);
    },
    onError: (error: any) => {
      console.error('Upload failed:', error);
      alert(error.response?.data?.message || 'Failed to upload curriculum');
    },
  });

  // Generate assignment mutation (from curriculum material)
  const generateMutation = useMutation({
    mutationFn: ({ curriculumId, config }: { curriculumId: string; config: any }) =>
      curriculumService.generateAssignment(curriculumId, config),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['curriculum-list'] });
      onAssignmentGenerated(data.assignment.id);
      handleClose();
    },
    onError: (error: any) => {
      console.error('Generation failed:', error);
      alert(error.response?.data?.message || 'Failed to generate assignment');
    },
  });

  // Direct generation mutation (from sub-unit context - no curriculum material needed)
  const generateDirectMutation = useMutation({
    mutationFn: async (data: {
      classId: string;
      curriculumText: string;
      assignmentType?: 'PRACTICE' | 'TEST';
      numQuestions?: number;
      difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
      questionTypes?: Array<'MULTIPLE_CHOICE' | 'FREE_RESPONSE'>;
    }) => {
      // Import the assignment service
      const { assignmentService } = await import('../../services/assignment.service');
      return assignmentService.generateQuiz(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      onAssignmentGenerated(data.id);
      handleClose();
    },
    onError: (error: any) => {
      console.error('Direct generation failed:', error);
      alert(error.response?.data?.message || 'Failed to generate assignment');
    },
  });

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Auto-configure from subUnitContext if provided
  useEffect(() => {
    if (subUnitContext && isOpen) {
      // Pre-fill assignment config from sub-unit context
      setAssignmentConfig((prev) => ({
        ...prev,
        title: subUnitContext.subUnitName || prev.title,
        description: subUnitContext.subUnitDescription || prev.description,
        classId: preSelectedClassId || prev.classId,
      }));

      // Skip directly to configure step
      setStep('configure');
    }
  }, [subUnitContext, isOpen, preSelectedClassId]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    // Auto-populate title from filename
    const titleFromFile = file.name.replace(/\.[^/.]+$/, '');
    setCurriculumTitle(titleFromFile);
  };

  const handleUpload = () => {
    if (!selectedFile || !curriculumTitle) return;

    uploadMutation.mutate({
      file: selectedFile,
      title: curriculumTitle,
      description: curriculumDescription,
    });

    setStep('generating');
  };

  const handleSelectExisting = (curriculumId: string) => {
    setSelectedCurriculumId(curriculumId);
    setStep('configure');
  };

  const handleGenerate = () => {
    if (!assignmentConfig.title || !assignmentConfig.classId) {
      alert('Please fill in all required fields');
      return;
    }

    // If we have subUnitContext, generate directly from it
    if (subUnitContext) {
      // Build curriculum text from concepts and learning objectives
      const curriculumText = [
        `Topic: ${subUnitContext.subUnitName || assignmentConfig.title}`,
        subUnitContext.subUnitDescription ? `Description: ${subUnitContext.subUnitDescription}` : '',
        subUnitContext.concepts && subUnitContext.concepts.length > 0
          ? `\nConcepts:\n${subUnitContext.concepts.map((c) => `- ${c}`).join('\n')}`
          : '',
        subUnitContext.learningObjectives && subUnitContext.learningObjectives.length > 0
          ? `\nLearning Objectives:\n${subUnitContext.learningObjectives.map((obj) => `- ${obj}`).join('\n')}`
          : '',
      ].filter(Boolean).join('\n');

      // Use direct generation endpoint instead of curriculum-based generation
      generateDirectMutation.mutate({
        classId: assignmentConfig.classId,
        curriculumText,
        assignmentType: assignmentConfig.type,
        numQuestions: assignmentConfig.numQuestions,
        difficulty: assignmentConfig.difficulty,
        questionTypes: assignmentConfig.questionTypes.map(qt =>
          qt === 'multiple_choice' ? 'MULTIPLE_CHOICE' : 'FREE_RESPONSE'
        ) as Array<'MULTIPLE_CHOICE' | 'FREE_RESPONSE'>,
      });
      setStep('generating');
      return;
    }

    // Otherwise use curriculum-based generation
    if (!selectedCurriculumId) {
      alert('Please select a curriculum material');
      return;
    }

    // Convert datetime-local format to ISO 8601
    const configToSend = {
      ...assignmentConfig,
      dueDate: assignmentConfig.dueDate
        ? new Date(assignmentConfig.dueDate).toISOString()
        : undefined,
    };

    setStep('generating');
    generateMutation.mutate({ curriculumId: selectedCurriculumId, config: configToSend });
  };

  const handleClose = () => {
    // Reset state
    setStep('select-existing');
    setSelectedFile(null);
    setUploadedCurriculumId(null);
    setSelectedCurriculumId(null);
    setCurriculumTitle('');
    setCurriculumDescription('');
    setAssignmentConfig({
      title: '',
      description: '',
      classId: preSelectedClassId || '',
      numQuestions: 10,
      difficulty: 'mixed',
      questionTypes: ['multiple_choice'],
      type: 'PRACTICE',
      totalPoints: 100,
      dueDate: '',
      timeLimit: 30,
    });
    onClose();
  };

  // ============================================================================
  // RENDER STEPS
  // ============================================================================

  const renderSelectExisting = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Choose Curriculum
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setStep('upload')}
          icon={<Upload className="w-4 h-4" />}
        >
          Upload New
        </Button>
      </div>

      {isLoadingCurriculum ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : curriculumData?.materials && curriculumData.materials.length > 0 ? (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {curriculumData.materials.map((curriculum) => (
            <motion.button
              key={curriculum.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => handleSelectExisting(curriculum.id)}
              className="w-full p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <FileText className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{curriculum.title}</p>
                    {curriculum.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mt-1">{curriculum.description}</p>
                    )}
                    {curriculum.aiSummary && (
                      <p className="text-xs text-gray-500 line-clamp-2 mt-2">{curriculum.aiSummary}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-500">{curriculum.fileType.toUpperCase()}</span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">Used {curriculum.usageCount} times</span>
                    </div>
                  </div>
                </div>
                <CheckCircle className="w-5 h-5 text-blue-500 opacity-0 group-hover:opacity-100" />
              </div>
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">No curriculum materials yet</p>
          <Button onClick={() => setStep('upload')} icon={<Upload className="w-4 h-4" />}>
            Upload Your First File
          </Button>
        </div>
      )}
    </div>
  );

  const renderUpload = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Upload Curriculum
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setStep('select-existing')}
        >
          Back
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            type="text"
            value={curriculumTitle}
            onChange={(e) => setCurriculumTitle(e.target.value)}
            placeholder="e.g., Algebra 1 - Quadratic Equations"
            className="w-full px-4 py-2 bg-white/90 backdrop-blur-md border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            value={curriculumDescription}
            onChange={(e) => setCurriculumDescription(e.target.value)}
            placeholder="Brief description of the curriculum content..."
            rows={3}
            className="w-full px-4 py-2 bg-white/90 backdrop-blur-md border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        <FileUpload
          onFileSelect={handleFileSelect}
          onFileRemove={() => setSelectedFile(null)}
          currentFileName={selectedFile?.name}
          label="Curriculum File *"
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={() => setStep('select-existing')}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || !curriculumTitle || uploadMutation.isPending}
            icon={uploadMutation.isPending ? <Loader className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          >
            {uploadMutation.isPending ? 'Uploading...' : 'Upload & Process'}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderConfigure = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Configure Assignment
      </h3>

      {/* Show context info when generating from sub-unit */}
      {subUnitContext && (
        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 text-sm mb-1">
                Generating from Topic: {subUnitContext.subUnitName}
              </h4>
              {subUnitContext.concepts && subUnitContext.concepts.length > 0 && (
                <p className="text-sm text-blue-700">
                  Concepts: {subUnitContext.concepts.slice(0, 3).join(', ')}
                  {subUnitContext.concepts.length > 3 && ` +${subUnitContext.concepts.length - 3} more`}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assignment Title *
          </label>
          <input
            type="text"
            value={assignmentConfig.title}
            onChange={(e) => setAssignmentConfig({ ...assignmentConfig, title: e.target.value })}
            placeholder="e.g., Quadratic Equations Quiz"
            className="w-full px-4 py-2 bg-white/90 backdrop-blur-md border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            value={assignmentConfig.description}
            onChange={(e) => setAssignmentConfig({ ...assignmentConfig, description: e.target.value })}
            placeholder="Brief description..."
            rows={2}
            className="w-full px-4 py-2 bg-white/90 backdrop-blur-md border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Class *
          </label>
          <select
            value={assignmentConfig.classId}
            onChange={(e) => setAssignmentConfig({ ...assignmentConfig, classId: e.target.value })}
            className="w-full px-4 py-2 bg-white/90 backdrop-blur-md border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Select a class</option>
            {classesData?.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} {cls.subject ? `- ${cls.subject}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Questions
          </label>
          <input
            type="number"
            min="1"
            max="50"
            value={assignmentConfig.numQuestions}
            onChange={(e) =>
              setAssignmentConfig({ ...assignmentConfig, numQuestions: parseInt(e.target.value) || 10 })
            }
            className="w-full px-4 py-2 bg-white/90 backdrop-blur-md border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Difficulty
          </label>
          <select
            value={assignmentConfig.difficulty}
            onChange={(e) =>
              setAssignmentConfig({ ...assignmentConfig, difficulty: e.target.value as any })
            }
            className="w-full px-4 py-2 bg-white/90 backdrop-blur-md border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assignment Type
          </label>
          <select
            value={assignmentConfig.type}
            onChange={(e) => setAssignmentConfig({ ...assignmentConfig, type: e.target.value as any })}
            className="w-full px-4 py-2 bg-white/90 backdrop-blur-md border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="PRACTICE">Practice</option>
            <option value="TEST">Test</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Total Points
          </label>
          <input
            type="number"
            min="1"
            value={assignmentConfig.totalPoints}
            onChange={(e) =>
              setAssignmentConfig({ ...assignmentConfig, totalPoints: parseInt(e.target.value) || 100 })
            }
            className="w-full px-4 py-2 bg-white/90 backdrop-blur-md border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Due Date (Optional)
          </label>
          <input
            type="datetime-local"
            value={assignmentConfig.dueDate}
            onChange={(e) => setAssignmentConfig({ ...assignmentConfig, dueDate: e.target.value })}
            className="w-full px-4 py-2 bg-white/90 backdrop-blur-md border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="ghost" onClick={() => setStep('select-existing')}>
          Back
        </Button>
        <Button
          onClick={handleGenerate}
          disabled={!assignmentConfig.title || !assignmentConfig.classId || generateMutation.isPending}
          icon={<Sparkles className="w-4 h-4" />}
        >
          Generate Assignment
        </Button>
      </div>
    </div>
  );

  const renderGenerating = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader className="w-16 h-16 animate-spin text-blue-500 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {uploadMutation.isPending ? 'Processing curriculum...' : 'Generating assignment...'}
      </h3>
      <p className="text-gray-600 text-center max-w-md">
        {uploadMutation.isPending
          ? 'We\'re extracting text and analyzing your curriculum content with AI. This may take a minute.'
          : 'AI is creating questions based on your curriculum. This won\'t take long!'}
      </p>
    </div>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Sparkles className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Generate with AI
                </h2>
                <p className="text-sm text-gray-600">
                  Create an assignment from curriculum materials
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {step === 'select-existing' && renderSelectExisting()}
            {step === 'upload' && renderUpload()}
            {step === 'configure' && renderConfigure()}
            {step === 'generating' && renderGenerating()}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
