// ============================================================================
// CLASS HEADER COMPONENT
// Header section for class dashboard with stats
// ============================================================================

import React from 'react';
import { Users, Megaphone } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';

interface ClassHeaderProps {
  className: string;
  subject: string;
  gradeLevel: string;
  studentCount: number;
  classCode?: string;
  onSendAnnouncement?: () => void;
}

export const ClassHeader: React.FC<ClassHeaderProps> = ({
  className,
  subject,
  gradeLevel,
  studentCount,
  classCode,
  onSendAnnouncement,
}) => {
  return (
    <Card variant="ghost" padding="sm" className="shadow-lg">
      <div className="flex items-center justify-between">
        {/* Class Info */}
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-baseline gap-3">
              <h1 className="text-3xl font-bold text-neutral-900">
                {className}
              </h1>
              <span className="flex items-center gap-1.5 text-sm text-neutral-600">
                <Users className="w-4 h-4" />
                <span>{studentCount} {studentCount === 1 ? 'Student' : 'Students'}</span>
              </span>
            </div>
            <div className="flex items-center gap-3 mt-2 text-sm text-neutral-600">
              <span className="px-3 py-1 rounded-lg bg-primary-100 text-primary-700 font-medium">
                {subject}
              </span>
              <span className="px-3 py-1 rounded-lg bg-secondary-100 text-secondary-700 font-medium">
                {gradeLevel}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side - Actions & Class Code */}
        <div className="flex items-center gap-4">
          {/* Send Announcement Button */}
          {onSendAnnouncement && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onSendAnnouncement}
              icon={<Megaphone />}
            >
              Send Announcement
            </Button>
          )}

          {/* Class Code Display */}
          {classCode && (
            <div className="text-right px-4 py-2 rounded-lg bg-gradient-to-r from-primary-50 to-secondary-50 border border-primary-200">
              <p className="text-xs text-neutral-600 mb-0.5">Class Code</p>
              <p className="text-2xl font-bold text-neutral-900 tracking-wider">{classCode}</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ClassHeader;
