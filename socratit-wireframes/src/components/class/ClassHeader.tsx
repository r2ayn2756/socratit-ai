// ============================================================================
// CLASS HEADER COMPONENT
// Header section for class dashboard with stats
// ============================================================================

import React from 'react';
import { Users } from 'lucide-react';
import { Card } from '../common/Card';

interface ClassHeaderProps {
  className: string;
  subject: string;
  gradeLevel: string;
  studentCount: number;
  unitCount: number;
  progressPercentage: number;
  classCode?: string;
}

export const ClassHeader: React.FC<ClassHeaderProps> = ({
  className,
  subject,
  gradeLevel,
  studentCount,
  unitCount,
  progressPercentage,
  classCode,
}) => {
  return (
    <Card variant="ghost" padding="md" className="shadow-lg">
      <div className="flex items-start justify-between mb-6">
        {/* Class Info */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            {className}
          </h1>
          <div className="flex items-center gap-3 text-sm text-neutral-600">
            <span className="px-3 py-1 rounded-lg bg-primary-100 text-primary-700 font-medium">
              {subject}
            </span>
            <span className="px-3 py-1 rounded-lg bg-secondary-100 text-secondary-700 font-medium">
              {gradeLevel}
            </span>
          </div>
        </div>

        {/* Class Code Display */}
        {classCode && (
          <div className="text-right px-4 py-2 rounded-lg bg-gradient-to-r from-primary-50 to-secondary-50 border border-primary-200">
            <p className="text-xs text-neutral-600 mb-0.5">Class Code</p>
            <p className="text-2xl font-bold text-neutral-900 tracking-wider">{classCode}</p>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          label="Students"
          value={studentCount}
          color="primary"
        />
        <StatCard
          icon={BookOpen}
          label="Units"
          value={unitCount}
          color="secondary"
        />
        <StatCard
          icon={TrendingUp}
          label="Progress"
          value={`${progressPercentage}%`}
          color="success"
        />
      </div>
    </Card>
  );
};

export default ClassHeader;
