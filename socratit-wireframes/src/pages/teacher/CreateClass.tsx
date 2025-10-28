// ============================================================================
// CREATE CLASS PAGE
// Teacher form to create a new class
// ============================================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, AlertCircle, CheckCircle, Upload } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { classService, CreateClassDTO } from '../../services/class.service';
import { FileUpload } from '../../components/common/FileUpload';
import { curriculumService } from '../../services/curriculum.service';

interface FormData {
  name: string;
  academicYear: string;
  subject: string;
  gradeLevel: string;
  period: string;
  room: string;
  scheduleTime: string;
  color: 'blue' | 'purple' | 'orange';
  curriculumFile?: File;
  curriculumTitle?: string;
  curriculumDescription?: string;
}

export const CreateClass: React.FC = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  const defaultAcademicYear = `${currentYear}-${nextYear}`;

  const [formData, setFormData] = useState<FormData>({
    name: '',
    academicYear: defaultAcademicYear,
    subject: '',
    gradeLevel: '',
    period: '',
    room: '',
    scheduleTime: '',
    color: 'blue',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploadingCurriculum, setUploadingCurriculum] = useState(false);

  const createClassMutation = useMutation({
    mutationFn: async (data: CreateClassDTO & { classId?: string }) => {
      // First create the class
      const classResponse = await classService.createClass(data);

      // If there's a curriculum file, upload it
      if (formData.curriculumFile && formData.curriculumTitle) {
        try {
          setUploadingCurriculum(true);
          await curriculumService.uploadCurriculum({
            title: formData.curriculumTitle,
            description: formData.curriculumDescription,
            file: formData.curriculumFile,
          });
        } catch (error) {
          console.error('Failed to upload curriculum:', error);
          // Don't fail the class creation if curriculum upload fails
        } finally {
          setUploadingCurriculum(false);
        }
      }

      return classResponse;
    },
    onSuccess: (response) => {
      setShowSuccess(true);
      setTimeout(() => {
        navigate('/teacher/classes');
      }, 2000);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to create class';
      setErrors({ name: errorMessage });
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    // Required: Class name
    if (!formData.name.trim()) {
      newErrors.name = 'Class name is required';
    }

    // Required: Academic year
    if (!formData.academicYear.trim()) {
      newErrors.academicYear = 'Academic year is required';
    } else {
      // Validate format: YYYY-YYYY
      const yearPattern = /^\d{4}-\d{4}$/;
      if (!yearPattern.test(formData.academicYear)) {
        newErrors.academicYear = 'Format must be YYYY-YYYY (e.g., 2024-2025)';
      } else {
        const [startYear, endYear] = formData.academicYear.split('-').map(Number);
        if (endYear !== startYear + 1) {
          newErrors.academicYear = 'End year must be start year + 1';
        }
      }
    }

    // If curriculum file is selected, title is required
    if (formData.curriculumFile && !formData.curriculumTitle?.trim()) {
      newErrors.curriculumTitle = 'Curriculum title is required when uploading a file';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Prepare data for API
    const classData: CreateClassDTO = {
      name: formData.name.trim(),
      academicYear: formData.academicYear.trim(),
      subject: formData.subject.trim() || undefined,
      gradeLevel: formData.gradeLevel.trim() || undefined,
      period: formData.period.trim() || undefined,
      room: formData.room.trim() || undefined,
      scheduleTime: formData.scheduleTime.trim() || undefined,
      color: formData.color,
    };

    createClassMutation.mutate(classData);
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFileSelect = (file: File) => {
    setFormData((prev) => ({
      ...prev,
      curriculumFile: file,
      curriculumTitle: prev.curriculumTitle || file.name.replace(/\.[^/.]+$/, ''), // Auto-fill title from filename
    }));
  };

  const handleFileRemove = () => {
    setFormData((prev) => ({
      ...prev,
      curriculumFile: undefined,
      curriculumTitle: '',
      curriculumDescription: '',
    }));
  };

  const colorOptions = [
    { value: 'blue', label: 'Blue', bgClass: 'bg-blue-500' },
    { value: 'purple', label: 'Purple', bgClass: 'bg-purple-500' },
    { value: 'orange', label: 'Orange', bgClass: 'bg-orange-500' },
  ];

  return (
    <DashboardLayout userRole="teacher">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/teacher/classes')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Classes</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Create New Class</h1>
          <p className="text-gray-600 mt-2">
            Set up a new class for the academic year. Students will join using a unique class code.
          </p>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3"
          >
            <CheckCircle className="text-green-600" size={24} />
            <div>
              <p className="font-medium text-green-900">Class created successfully!</p>
              <p className="text-sm text-green-700">
                {uploadingCurriculum ? 'Uploading curriculum...' : 'Redirecting to your classes...'}
              </p>
            </div>
          </motion.div>
        )}

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-8"
        >
          {/* Required Fields Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Required Information
            </h2>

            {/* Class Name */}
            <div className="mb-6">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Class Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., AP Biology Period 3"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle size={16} />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Academic Year */}
            <div className="mb-6">
              <label htmlFor="academicYear" className="block text-sm font-medium text-gray-700 mb-2">
                Academic Year <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="academicYear"
                value={formData.academicYear}
                onChange={(e) => handleChange('academicYear', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.academicYear ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="YYYY-YYYY (e.g., 2024-2025)"
              />
              {errors.academicYear && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle size={16} />
                  {errors.academicYear}
                </p>
              )}
              <p className="mt-1 text-sm text-gray-500">Format: YYYY-YYYY (e.g., 2024-2025)</p>
            </div>
          </div>

          {/* Optional Fields Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Optional Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Subject */}
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => handleChange('subject', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Biology, Mathematics"
                />
              </div>

              {/* Grade Level */}
              <div>
                <label htmlFor="gradeLevel" className="block text-sm font-medium text-gray-700 mb-2">
                  Grade Level
                </label>
                <input
                  type="text"
                  id="gradeLevel"
                  value={formData.gradeLevel}
                  onChange={(e) => handleChange('gradeLevel', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 9th Grade, 10-12"
                />
              </div>

              {/* Period */}
              <div>
                <label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-2">
                  Period
                </label>
                <input
                  type="text"
                  id="period"
                  value={formData.period}
                  onChange={(e) => handleChange('period', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Period 3, Block A"
                />
              </div>

              {/* Room */}
              <div>
                <label htmlFor="room" className="block text-sm font-medium text-gray-700 mb-2">
                  Room
                </label>
                <input
                  type="text"
                  id="room"
                  value={formData.room}
                  onChange={(e) => handleChange('room', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Room 201, Science Lab B"
                />
              </div>

              {/* Schedule Time */}
              <div>
                <label htmlFor="scheduleTime" className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule Time
                </label>
                <input
                  type="text"
                  id="scheduleTime"
                  value={formData.scheduleTime}
                  onChange={(e) => handleChange('scheduleTime', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., MWF 9:00-10:30, Daily 2pm"
                />
              </div>

              {/* Color */}
              <div>
                <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-2">
                  Color Theme
                </label>
                <div className="flex gap-3">
                  {colorOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleChange('color', option.value)}
                      className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-all ${
                        formData.color === option.value
                          ? 'border-gray-900 bg-gray-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full ${option.bgClass}`} />
                      <span className="text-sm font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Curriculum Upload Section */}
          <div className="mb-8 border-t border-gray-200 pt-8">
            <div className="flex items-center gap-2 mb-4">
              <Upload className="text-gray-700" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">
                Curriculum Materials (Optional)
              </h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Upload a curriculum file now to quickly generate AI-powered assignments later. You can also add curriculum materials later from the class page.
            </p>

            {/* File Upload */}
            <div className="mb-4">
              <FileUpload
                onFileSelect={handleFileSelect}
                onFileRemove={handleFileRemove}
                label="Curriculum File"
                acceptedTypes={['.pdf', '.docx', '.doc', '.txt']}
                maxSizeMB={10}
                error={errors.curriculumFile}
              />
            </div>

            {/* Curriculum Title - Only show if file is selected */}
            {formData.curriculumFile && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="curriculumTitle" className="block text-sm font-medium text-gray-700 mb-2">
                    Curriculum Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="curriculumTitle"
                    value={formData.curriculumTitle || ''}
                    onChange={(e) => handleChange('curriculumTitle', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.curriculumTitle ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Unit 1: Cell Biology"
                  />
                  {errors.curriculumTitle && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={16} />
                      {errors.curriculumTitle}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="curriculumDescription" className="block text-sm font-medium text-gray-700 mb-2">
                    Curriculum Description
                  </label>
                  <textarea
                    id="curriculumDescription"
                    value={formData.curriculumDescription || ''}
                    onChange={(e) => handleChange('curriculumDescription', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Brief description of the curriculum content..."
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/teacher/classes')}
              className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={createClassMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createClassMutation.isPending}
              className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createClassMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus size={20} />
                  <span>Create Class</span>
                </>
              )}
            </button>
          </div>
        </motion.form>
      </div>
    </DashboardLayout>
  );
};
