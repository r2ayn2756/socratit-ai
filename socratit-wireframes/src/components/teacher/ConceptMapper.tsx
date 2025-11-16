// ============================================================================
// CONCEPT MAPPER COMPONENT
// Maps practice assignment questions to curriculum concepts for mastery tracking
// ============================================================================

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, Check, AlertCircle, BookOpen, Lightbulb } from 'lucide-react';
import { Badge } from '../common';

// ============================================================================
// TYPES
// ============================================================================

export interface ConceptMapping {
  questionId: string;
  conceptId?: string;
  conceptName?: string;
  subtopicName?: string;
}

export interface CurriculumConcept {
  id: string;
  name: string;
  subtopicName: string;
  learningObjectives: string[];
  unitTitle?: string;
}

interface ConceptMapperProps {
  questions: Array<{
    id: string;
    questionText: string;
    questionOrder: number;
  }>;
  availableConcepts: CurriculumConcept[];
  initialMappings?: ConceptMapping[];
  onChange: (mappings: ConceptMapping[]) => void;
  showCoverage?: boolean;
}

// ============================================================================
// CONCEPT MAPPER COMPONENT
// ============================================================================

export const ConceptMapper: React.FC<ConceptMapperProps> = ({
  questions,
  availableConcepts,
  initialMappings = [],
  onChange,
  showCoverage = true,
}) => {
  const [mappings, setMappings] = useState<ConceptMapping[]>(initialMappings);

  // Group concepts by subtopic for better organization
  const conceptsBySubtopic = availableConcepts.reduce((acc, concept) => {
    if (!acc[concept.subtopicName]) {
      acc[concept.subtopicName] = [];
    }
    acc[concept.subtopicName].push(concept);
    return acc;
  }, {} as Record<string, CurriculumConcept[]>);

  // Update mapping for a specific question
  const updateMapping = (questionId: string, conceptId: string) => {
    const concept = availableConcepts.find(c => c.id === conceptId);
    const newMappings = mappings.filter(m => m.questionId !== questionId);

    if (conceptId && concept) {
      newMappings.push({
        questionId,
        conceptId,
        conceptName: concept.name,
        subtopicName: concept.subtopicName,
      });
    }

    setMappings(newMappings);
    onChange(newMappings);
  };

  // Get mapping for a specific question
  const getMapping = (questionId: string): ConceptMapping | undefined => {
    return mappings.find(m => m.questionId === questionId);
  };

  // Calculate concept coverage
  const getMappedConcepts = (): Set<string> => {
    return new Set(mappings.map(m => m.conceptId).filter(Boolean) as string[]);
  };

  const mappedConcepts = getMappedConcepts();
  const coveragePercentage = availableConcepts.length > 0
    ? Math.round((mappedConcepts.size / availableConcepts.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header with Coverage Stats */}
      {showCoverage && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-purple-900">Concept Coverage</h3>
                <p className="text-sm text-purple-700">
                  {mappedConcepts.size} of {availableConcepts.length} concepts covered
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-purple-600">{coveragePercentage}%</div>
              <div className="text-xs text-purple-600">Coverage</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3 h-2 bg-purple-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
              style={{ width: `${coveragePercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Concept Coverage Indicators */}
      {showCoverage && availableConcepts.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Available Concepts
          </h4>
          <div className="flex flex-wrap gap-2">
            {availableConcepts.map(concept => (
              <Badge
                key={concept.id}
                variant={mappedConcepts.has(concept.id) ? 'success' : 'neutral'}
                size="sm"
              >
                {mappedConcepts.has(concept.id) && (
                  <Check className="w-3 h-3 mr-1" />
                )}
                {concept.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Question Mapping Interface */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Lightbulb className="w-4 h-4" />
          Map Questions to Concepts
        </h4>

        {questions.map((question, index) => {
          const mapping = getMapping(question.id);
          const isMapped = !!mapping;

          return (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="border-2 border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Question Number Badge */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isMapped
                    ? 'bg-green-100 text-green-600'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {isMapped ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>

                {/* Question Content */}
                <div className="flex-1 min-w-0">
                  <div className="mb-3">
                    <div className="text-xs font-medium text-slate-500 mb-1">
                      Question {question.questionOrder}
                    </div>
                    <p className="text-sm text-slate-700 line-clamp-2">
                      {question.questionText}
                    </p>
                  </div>

                  {/* Concept Selector */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Associated Concept
                    </label>
                    <select
                      value={mapping?.conceptId || ''}
                      onChange={(e) => updateMapping(question.id, e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-500/20"
                    >
                      <option value="">Select a concept...</option>
                      {Object.entries(conceptsBySubtopic).map(([subtopic, concepts]) => (
                        <optgroup key={subtopic} label={subtopic}>
                          {concepts.map(concept => (
                            <option key={concept.id} value={concept.id}>
                              {concept.name}
                              {concept.unitTitle && ` (${concept.unitTitle})`}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  {/* Selected Concept Info */}
                  {mapping && mapping.conceptId && (
                    <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-2">
                      <div className="flex items-start gap-2">
                        <Target className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-blue-900">
                            {mapping.conceptName}
                          </p>
                          <p className="text-xs text-blue-700">
                            {mapping.subtopicName}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Unmapped Questions Warning */}
      {questions.length > mappings.length && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-900">
              {questions.length - mappings.length} question{questions.length - mappings.length !== 1 ? 's' : ''} not mapped
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Mapping questions to concepts enables better tracking of student mastery and personalized recommendations.
            </p>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
        <p className="text-xs text-slate-600">
          <strong>How concept mapping works:</strong> When students complete practice assignments,
          their performance on each question will contribute to their mastery score for the mapped
          concept. This enables personalized learning insights and adaptive recommendations.
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// CONCEPT COVERAGE SUMMARY
// Compact view for showing concept coverage
// ============================================================================

interface ConceptCoverageSummaryProps {
  mappings: ConceptMapping[];
  totalConcepts: number;
}

export const ConceptCoverageSummary: React.FC<ConceptCoverageSummaryProps> = ({
  mappings,
  totalConcepts,
}) => {
  const uniqueConcepts = new Set(mappings.map(m => m.conceptId).filter(Boolean));
  const coveragePercentage = totalConcepts > 0
    ? Math.round((uniqueConcepts.size / totalConcepts) * 100)
    : 0;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg">
      <Target className="w-4 h-4 text-purple-600" />
      <div className="flex-1">
        <div className="text-xs font-medium text-purple-900">
          Concept Coverage: {uniqueConcepts.size} / {totalConcepts}
        </div>
        <div className="mt-1 h-1.5 bg-purple-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-600 transition-all duration-300"
            style={{ width: `${coveragePercentage}%` }}
          />
        </div>
      </div>
      <div className="text-sm font-bold text-purple-600">{coveragePercentage}%</div>
    </div>
  );
};
