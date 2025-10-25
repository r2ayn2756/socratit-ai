// ============================================================================
// CURRICULUM MANAGEMENT PAGE
// Teacher interface for managing uploaded curriculum materials
// ============================================================================

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, Badge, FileUpload } from '../../components/common';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Sparkles,
  Eye,
  Archive,
  CheckCircle,
  Loader,
  AlertCircle,
  X,
} from 'lucide-react';
import { curriculumService, CurriculumMaterial } from '../../services/curriculum.service';
import { useNavigate } from 'react-router-dom';

export const CurriculumManagement: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedCurriculum, setSelectedCurriculum] = useState<CurriculumMaterial | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Fetch curriculum materials
  const { data: curriculumData, isLoading } = useQuery({
    queryKey: ['curriculum-list'],
    queryFn: () => curriculumService.listCurriculum({ isArchived: false }),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => curriculumService.deleteCurriculum(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculum-list'] });
    },
  });

  // Archive mutation
  const archiveMutation = useMutation({
    mutationFn: (id: string) => curriculumService.updateCurriculum(id, { isArchived: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculum-list'] });
    },
  });

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this curriculum material? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleArchive = (id: string) => {
    if (window.confirm('Archive this curriculum material?')) {
      archiveMutation.mutate(id);
    }
  };

  const handleDownload = async (id: string, fileName: string) => {
    try {
      await curriculumService.downloadCurriculum(id, fileName);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download file');
    }
  };

  const handleViewDetails = (curriculum: CurriculumMaterial) => {
    setSelectedCurriculum(curriculum);
    setShowDetailsModal(true);
  };

  const handleGenerateAssignment = (curriculumId: string) => {
    // Navigate to create assignment page and open modal
    navigate(`/teacher/assignments/new`, { state: { curriculumId, openAIModal: true } });
  };

  // ============================================================================
  // RENDER STATUS BADGE
  // ============================================================================

  const renderStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      pending: { color: 'yellow', label: 'Processing...' },
      processing: { color: 'blue', label: 'Processing...' },
      completed: { color: 'green', label: 'Ready' },
      failed: { color: 'red', label: 'Failed' },
    };

    const variant = variants[status] || variants.pending;

    return (
      <Badge color={variant.color as any}>
        {variant.label}
      </Badge>
    );
  };

  // ============================================================================
  // RENDER FILE TYPE ICON
  // ============================================================================

  const getFileTypeColor = (fileType: string) => {
    const colors: Record<string, string> = {
      pdf: 'text-red-500',
      docx: 'text-blue-500',
      doc: 'text-blue-500',
      txt: 'text-gray-500',
      image: 'text-green-500',
    };
    return colors[fileType] || 'text-gray-400';
  };

  // ============================================================================
  // FORMAT FILE SIZE
  // ============================================================================

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // ============================================================================
  // FORMAT DATE
  // ============================================================================

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // ============================================================================
  // DETAILS MODAL
  // ============================================================================

  const DetailsModal = () => {
    if (!selectedCurriculum || !showDetailsModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-3">
              <FileText className={`w-6 h-6 ${getFileTypeColor(selectedCurriculum.fileType)}`} />
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedCurriculum.title}</h2>
                <p className="text-sm text-gray-600">
                  {selectedCurriculum.originalFileName} • {formatFileSize(selectedCurriculum.fileSize)}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowDetailsModal(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] space-y-6">
            {/* Description */}
            {selectedCurriculum.description && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700">{selectedCurriculum.description}</p>
              </div>
            )}

            {/* AI Summary */}
            {selectedCurriculum.aiSummary && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">AI Summary</h3>
                <p className="text-gray-700">{selectedCurriculum.aiSummary}</p>
              </div>
            )}

            {/* AI Outline */}
            {selectedCurriculum.aiOutline && selectedCurriculum.aiOutline.topics.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Content Outline</h3>
                <div className="space-y-3">
                  {selectedCurriculum.aiOutline.topics.map((topic, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4">
                      <p className="font-medium text-gray-900">{topic.name}</p>
                      {topic.subtopics.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {topic.subtopics.map((subtopic, subIndex) => (
                            <li key={subIndex} className="text-sm text-gray-600">• {subtopic}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Topics */}
            {selectedCurriculum.suggestedTopics.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Key Concepts</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedCurriculum.suggestedTopics.map((topic, index) => (
                    <Badge key={index} color="blue">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Learning Objectives */}
            {selectedCurriculum.learningObjectives.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Learning Objectives</h3>
                <ul className="space-y-2">
                  {selectedCurriculum.learningObjectives.map((objective, index) => (
                    <li key={index} className="flex items-start text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      {objective}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Usage Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-gray-600">Uploaded</p>
                <p className="font-medium text-gray-900">{formatDate(selectedCurriculum.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Used</p>
                <p className="font-medium text-gray-900">{selectedCurriculum.usageCount} times</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <div className="mt-1">{renderStatusBadge(selectedCurriculum.processingStatus)}</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
            <Button
              variant="ghost"
              onClick={() => handleDownload(selectedCurriculum.id, selectedCurriculum.originalFileName)}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Download
            </Button>
            {selectedCurriculum.processingStatus === 'completed' && (
              <Button
                onClick={() => {
                  setShowDetailsModal(false);
                  handleGenerateAssignment(selectedCurriculum.id);
                }}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Generate Assignment
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <DashboardLayout userRole="teacher">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Curriculum Materials</h1>
            <p className="text-slate-600 mt-1">
              Upload and manage your curriculum files for AI-powered assignment generation
            </p>
          </div>
          <Button onClick={() => navigate('/teacher/assignments/new')} leftIcon={<Upload className="w-4 h-4" />}>
            Upload New
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : curriculumData?.materials && curriculumData.materials.length > 0 ? (
          <div className="grid gap-4">
            {curriculumData.materials.map((curriculum) => (
              <motion.div
                key={curriculum.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01 }}
              >
                <Card className="p-6">
                  <div className="flex items-start justify-between">
                    {/* Left: File info */}
                    <div className="flex items-start space-x-4 flex-1 min-w-0">
                      <FileText className={`w-10 h-10 ${getFileTypeColor(curriculum.fileType)} flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-lg truncate">
                          {curriculum.title}
                        </h3>
                        {curriculum.description && (
                          <p className="text-gray-600 text-sm line-clamp-2 mt-1">
                            {curriculum.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                          <span>{curriculum.originalFileName}</span>
                          <span>•</span>
                          <span>{formatFileSize(curriculum.fileSize)}</span>
                          <span>•</span>
                          <span>Used {curriculum.usageCount} times</span>
                          <span>•</span>
                          <span>{formatDate(curriculum.createdAt)}</span>
                        </div>
                        {curriculum.processingStatus === 'completed' && curriculum.suggestedTopics.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {curriculum.suggestedTopics.slice(0, 5).map((topic, index) => (
                              <Badge key={index} color="blue" size="sm">
                                {topic}
                              </Badge>
                            ))}
                            {curriculum.suggestedTopics.length > 5 && (
                              <Badge color="gray" size="sm">
                                +{curriculum.suggestedTopics.length - 5} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Status and actions */}
                    <div className="flex items-start gap-3 ml-4 flex-shrink-0">
                      {renderStatusBadge(curriculum.processingStatus)}
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(curriculum)}
                          leftIcon={<Eye className="w-4 h-4" />}
                        >
                          View
                        </Button>
                        {curriculum.processingStatus === 'completed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleGenerateAssignment(curriculum.id)}
                            leftIcon={<Sparkles className="w-4 h-4" />}
                          >
                            Generate
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(curriculum.id, curriculum.originalFileName)}
                          leftIcon={<Download className="w-4 h-4" />}
                        >
                          <span className="sr-only">Download</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleArchive(curriculum.id)}
                          leftIcon={<Archive className="w-4 h-4" />}
                        >
                          <span className="sr-only">Archive</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(curriculum.id)}
                          leftIcon={<Trash2 className="w-4 h-4" />}
                          disabled={deleteMutation.isPending}
                        >
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="p-12">
            <div className="text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No curriculum materials yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Upload curriculum files (PDF, DOCX, TXT) to generate AI-powered assignments automatically
              </p>
              <Button onClick={() => navigate('/teacher/assignments/new')} leftIcon={<Upload className="w-4 h-4" />}>
                Upload Your First File
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Details Modal */}
      <DetailsModal />
    </DashboardLayout>
  );
};
