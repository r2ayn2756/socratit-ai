// ============================================================================
// CONCEPT MASTERY HEATMAP COMPONENT
// Batch 7: Heatmap showing concept mastery across all students in class
// ============================================================================

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Grid, Brain, Users, Filter, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../common/Card';
import { Badge } from '../common/Badge';
import { ConceptHeatmapData, getMasteryPercentColor } from '../../types/analytics.types';

interface ConceptMasteryHeatmapProps {
  data: ConceptHeatmapData[];
  title?: string;
}

export const ConceptMasteryHeatmap: React.FC<ConceptMasteryHeatmapProps> = ({
  data,
  title = 'Class Concept Mastery Heatmap',
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ concept: string; student: string } | null>(null);

  // Get unique subjects
  const subjects = Array.from(new Set(data.map(d => d.subject).filter(Boolean)));

  // Filter data by subject if selected
  const filteredData = selectedSubject
    ? data.filter(d => d.subject === selectedSubject)
    : data;

  // Get all unique students from the data
  const allStudents = Array.from(
    new Set(
      filteredData.flatMap(concept =>
        concept.studentMasteryLevels.map(s => s.studentId)
      )
    )
  );

  // Create student lookup for names
  const studentLookup = new Map<string, string>();
  filteredData.forEach(concept => {
    concept.studentMasteryLevels.forEach(student => {
      if (!studentLookup.has(student.studentId)) {
        studentLookup.set(student.studentId, student.studentName);
      }
    });
  });

  // Calculate stats
  const totalConcepts = filteredData.length;
  const totalStudents = allStudents.length;
  const avgMastery = filteredData.length > 0
    ? filteredData.reduce((sum, c) => sum + c.classAverage, 0) / filteredData.length
    : 0;

  // Find struggling concepts (class average < 70%)
  const strugglingConcepts = filteredData.filter(c => c.classAverage < 70).length;

  // Get mastery level for specific student and concept
  const getMasteryForStudent = (conceptData: ConceptHeatmapData, studentId: string) => {
    const studentData = conceptData.studentMasteryLevels.find(s => s.studentId === studentId);
    return studentData ? studentData.masteryPercent : null;
  };

  // Get cell color based on mastery percent
  const getCellColor = (percent: number | null) => {
    if (percent === null) return 'bg-slate-100';
    if (percent >= 90) return 'bg-green-500';
    if (percent >= 70) return 'bg-blue-500';
    if (percent >= 40) return 'bg-yellow-500';
    if (percent >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getCellTextColor = (percent: number | null) => {
    if (percent === null) return 'text-slate-400';
    return 'text-white';
  };

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-cyan-500/30">
              <Grid className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              <p className="text-sm text-slate-600">
                {totalConcepts} concepts × {totalStudents} students
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Subject filter */}
            {subjects.length > 0 && (
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-600" />
                <select
                  value={selectedSubject || ''}
                  onChange={(e) => setSelectedSubject(e.target.value || null)}
                  className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                >
                  <option value="">All Subjects</option>
                  {subjects.map(subject => (
                    <option key={subject} value={subject || ''}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {strugglingConcepts > 0 && (
              <Badge variant="warning" size="sm">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {strugglingConcepts} concept{strugglingConcepts !== 1 ? 's' : ''} below 70%
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {/* Summary Statistics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-4 border border-cyan-200">
              <div className="text-xs text-cyan-700 font-medium mb-1 flex items-center gap-1">
                <Brain className="w-3 h-3" />
                Concepts Tracked
              </div>
              <div className="text-2xl font-bold text-cyan-900">
                {totalConcepts}
              </div>
              <div className="text-xs text-cyan-600 mt-1">
                {selectedSubject ? `in ${selectedSubject}` : 'across all subjects'}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="text-xs text-blue-700 font-medium mb-1 flex items-center gap-1">
                <Users className="w-3 h-3" />
                Students
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {totalStudents}
              </div>
              <div className="text-xs text-blue-600 mt-1">
                In this class
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
              <div className="text-xs text-purple-700 font-medium mb-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Average Mastery
              </div>
              <div className="text-2xl font-bold text-purple-900">
                {avgMastery.toFixed(1)}%
              </div>
              <div className="text-xs text-purple-600 mt-1">
                Class-wide
              </div>
            </div>
          </div>

          {/* Heatmap */}
          {filteredData.length > 0 && allStudents.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-700">
                  Mastery Heatmap
                </h4>
                <div className="text-xs text-slate-600">
                  Hover over cells for details
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 overflow-x-auto">
                <div className="min-w-[800px]">
                  {/* Heatmap table */}
                  <div className="space-y-0.5">
                    {/* Header row with student names */}
                    <div className="flex gap-0.5">
                      <div className="w-48 flex-shrink-0" /> {/* Empty corner */}
                      {allStudents.slice(0, 20).map((studentId) => ( // Limit to 20 students for display
                        <div
                          key={studentId}
                          className="flex-1 min-w-[60px] text-[10px] font-medium text-slate-700 px-1 py-2 truncate"
                          title={studentLookup.get(studentId)}
                        >
                          <div className="transform -rotate-45 origin-bottom-left whitespace-nowrap">
                            {studentLookup.get(studentId)?.split(' ')[0] || 'Unknown'}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Data rows */}
                    {filteredData.map((concept, conceptIndex) => (
                      <motion.div
                        key={concept.concept}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: conceptIndex * 0.02 }}
                        className="flex gap-0.5"
                      >
                        {/* Concept label */}
                        <div className="w-48 flex-shrink-0 text-xs font-medium text-slate-900 px-2 py-3 bg-white rounded flex items-center justify-between border border-slate-200">
                          <span className="truncate" title={concept.concept}>
                            {concept.concept}
                          </span>
                          <span className="text-[10px] text-slate-600 ml-2">
                            {concept.classAverage.toFixed(0)}%
                          </span>
                        </div>

                        {/* Mastery cells */}
                        {allStudents.slice(0, 20).map((studentId) => {
                          const masteryPercent = getMasteryForStudent(concept, studentId);
                          const cellColor = getCellColor(masteryPercent);
                          const textColor = getCellTextColor(masteryPercent);
                          const isHovered = hoveredCell?.concept === concept.concept && hoveredCell?.student === studentId;

                          return (
                            <motion.div
                              key={`${concept.concept}-${studentId}`}
                              className={`flex-1 min-w-[60px] h-12 ${cellColor} rounded flex items-center justify-center text-[10px] font-bold ${textColor} cursor-pointer border-2 ${
                                isHovered ? 'border-slate-900 z-10' : 'border-transparent'
                              } transition-all`}
                              whileHover={{ scale: 1.1, zIndex: 20 }}
                              onHoverStart={() => setHoveredCell({ concept: concept.concept, student: studentId })}
                              onHoverEnd={() => setHoveredCell(null)}
                              title={`${studentLookup.get(studentId)}\n${concept.concept}\nMastery: ${masteryPercent !== null ? `${masteryPercent.toFixed(1)}%` : 'No data'}`}
                            >
                              {masteryPercent !== null ? `${masteryPercent.toFixed(0)}%` : '-'}
                            </motion.div>
                          );
                        })}
                      </motion.div>
                    ))}
                  </div>

                  {allStudents.length > 20 && (
                    <div className="mt-3 text-center text-xs text-slate-600">
                      Showing first 20 students. Total students: {allStudents.length}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
              <Grid className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">No heatmap data available</p>
              <p className="text-sm text-slate-500 mt-1">
                Students need to complete assignments to generate concept mastery data
              </p>
            </div>
          )}

          {/* Legend */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-700">Mastery Level Legend</h4>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-500 rounded border border-green-600" />
                <span className="text-xs text-slate-700">90-100% (Mastered)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-500 rounded border border-blue-600" />
                <span className="text-xs text-slate-700">70-89% (Proficient)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-yellow-500 rounded border border-yellow-600" />
                <span className="text-xs text-slate-700">40-69% (Developing)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-orange-500 rounded border border-orange-600" />
                <span className="text-xs text-slate-700">20-39% (Emerging)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-500 rounded border border-red-600" />
                <span className="text-xs text-slate-700">0-19% (Not Mastered)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-slate-100 rounded border border-slate-300" />
                <span className="text-xs text-slate-700">No Data</span>
              </div>
            </div>
          </div>

          {/* Concept Performance List */}
          {filteredData.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-700">
                Concept Performance Summary
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {[...filteredData]
                  .sort((a, b) => a.classAverage - b.classAverage)
                  .map((concept, index) => {
                    const color = getMasteryPercentColor(concept.classAverage) as 'green' | 'blue' | 'yellow' | 'orange' | 'red';
                    const colorClasses: Record<'green' | 'blue' | 'yellow' | 'orange' | 'red', string> = {
                      green: 'bg-green-50 border-green-200 text-green-700',
                      blue: 'bg-blue-50 border-blue-200 text-blue-700',
                      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
                      orange: 'bg-orange-50 border-orange-200 text-orange-700',
                      red: 'bg-red-50 border-red-200 text-red-700',
                    };

                    return (
                      <motion.div
                        key={concept.concept}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={`flex items-center justify-between rounded-lg p-3 border ${colorClasses[color]}`}
                      >
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            {concept.concept}
                          </div>
                          {concept.subject && (
                            <div className="text-xs opacity-75 mt-0.5">
                              {concept.subject}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full bg-gradient-to-r ${
                                color === 'green' ? 'from-green-500 to-green-600' :
                                color === 'blue' ? 'from-blue-500 to-blue-600' :
                                color === 'yellow' ? 'from-yellow-500 to-yellow-600' :
                                color === 'orange' ? 'from-orange-500 to-orange-600' :
                                'from-red-500 to-red-600'
                              }`}
                              initial={{ width: 0 }}
                              animate={{ width: `${concept.classAverage}%` }}
                              transition={{ duration: 0.8, delay: index * 0.03 }}
                            />
                          </div>
                          <div className="text-lg font-bold w-16 text-right">
                            {concept.classAverage.toFixed(0)}%
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
