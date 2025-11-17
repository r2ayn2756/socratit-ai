import React from 'react';
import { Filter, Layout, History } from 'lucide-react';
import { MasteryLevel, AtlasFilters } from '../../types/knowledgeGraph';

interface AtlasControlsProps {
  filters: AtlasFilters;
  onFiltersChange: (filters: AtlasFilters) => void;
  availableSubjects: string[];
  layout: 'hierarchical' | 'force';
  onLayoutChange: (layout: 'hierarchical' | 'force') => void;
}

/**
 * Atlas Controls Component
 * Filters and view controls for the knowledge graph
 */
const AtlasControls: React.FC<AtlasControlsProps> = ({
  filters,
  onFiltersChange,
  availableSubjects,
  layout,
  onLayoutChange,
}) => {
  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({
      ...filters,
      subject: e.target.value || undefined,
    });
  };

  const handleMasteryLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({
      ...filters,
      masteryLevel: (e.target.value as MasteryLevel) || undefined,
    });
  };

  const handleHistoryToggle = () => {
    onFiltersChange({
      ...filters,
      showHistory: !filters.showHistory,
    });
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Subject Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <label htmlFor="subject-filter" className="text-sm font-medium text-gray-700">
            Subject:
          </label>
          <select
            id="subject-filter"
            value={filters.subject || ''}
            onChange={handleSubjectChange}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Subjects</option>
            {availableSubjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </div>

        {/* Mastery Level Filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="mastery-filter" className="text-sm font-medium text-gray-700">
            Mastery Level:
          </label>
          <select
            id="mastery-filter"
            value={filters.masteryLevel || ''}
            onChange={handleMasteryLevelChange}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Levels</option>
            <option value="EXPERT">Expert</option>
            <option value="MASTERED">Mastered</option>
            <option value="PROFICIENT">Proficient</option>
            <option value="DEVELOPING">Developing</option>
            <option value="INTRODUCED">Introduced</option>
            <option value="NOT_STARTED">Not Started</option>
          </select>
        </div>

        {/* Layout Toggle */}
        <div className="flex items-center gap-2 ml-auto">
          <Layout className="w-4 h-4 text-gray-500" />
          <label htmlFor="layout-toggle" className="text-sm font-medium text-gray-700">
            Layout:
          </label>
          <select
            id="layout-toggle"
            value={layout}
            onChange={(e) => onLayoutChange(e.target.value as 'hierarchical' | 'force')}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="hierarchical">Hierarchical</option>
            <option value="force">Force-Directed</option>
          </select>
        </div>

        {/* History Toggle */}
        <button
          onClick={handleHistoryToggle}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filters.showHistory
              ? 'bg-blue-100 text-blue-700 border border-blue-300'
              : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
          }`}
        >
          <History className="w-4 h-4" />
          Show History
        </button>
      </div>

      {/* Active Filters Display */}
      {(filters.subject || filters.masteryLevel) && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
          <span className="text-xs font-medium text-gray-600">Active Filters:</span>
          <div className="flex flex-wrap gap-2">
            {filters.subject && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                {filters.subject}
                <button
                  onClick={() => onFiltersChange({ ...filters, subject: undefined })}
                  className="hover:bg-blue-200 rounded-full p-0.5"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
            {filters.masteryLevel && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                {filters.masteryLevel.replace('_', ' ')}
                <button
                  onClick={() => onFiltersChange({ ...filters, masteryLevel: undefined })}
                  className="hover:bg-purple-200 rounded-full p-0.5"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
            <button
              onClick={() => onFiltersChange({})}
              className="text-xs text-gray-600 hover:text-gray-900 font-medium underline"
            >
              Clear all
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AtlasControls;
