// ============================================================================
// CLASS HEADER COMPONENT
// Header section for class dashboard with stats
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { Users, BookOpen, TrendingUp, Edit } from 'lucide-react';
import { Button } from '../curriculum/Button';

interface ClassHeaderProps {
  className: string;
  subject: string;
  gradeLevel: string;
  studentCount: number;
  unitCount: number;
  progressPercentage: number;
  onEdit?: () => void;
}

export const ClassHeader: React.FC<ClassHeaderProps> = ({
  className,
  subject,
  gradeLevel,
  studentCount,
  unitCount,
  progressPercentage,
  onEdit,
}) => {
  return (
    <div className="bg-white/90 backdrop-blur-2xl border border-gray-200/50 rounded-2xl p-6 shadow-lg">
      <div className="flex items-start justify-between mb-6">
        {/* Class Info */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {className}
          </h1>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span className="px-3 py-1 rounded-lg bg-blue-100 text-blue-700 font-medium">
              {subject}
            </span>
            <span className="px-3 py-1 rounded-lg bg-purple-100 text-purple-700 font-medium">
              {gradeLevel}
            </span>
          </div>
        </div>

        {/* Edit Button */}
        {onEdit && (
          <Button
            variant="secondary"
            onClick={onEdit}
            icon={<Edit className="w-4 h-4" />}
          >
            Edit Class
          </Button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        {/* Students */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{studentCount}</p>
              <p className="text-sm text-gray-600">Students</p>
            </div>
          </div>
        </motion.div>

        {/* Units */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200/50"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{unitCount}</p>
              <p className="text-sm text-gray-600">Units</p>
            </div>
          </div>
        </motion.div>

        {/* Progress */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200/50"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{progressPercentage}%</p>
              <p className="text-sm text-gray-600">Progress</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ClassHeader;
