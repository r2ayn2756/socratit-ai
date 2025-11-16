// ============================================================================
// RUBRIC BUILDER COMPONENT
// Teacher interface for creating and managing essay rubrics
// ============================================================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../common';
import { Button } from '../common/Button';
import { Plus, Trash2, GripVertical, Save, Download, Upload } from 'lucide-react';
import { RubricCriterion, ProficiencyLevel } from '../../services/assignment.service';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface RubricBuilderProps {
  rubric: RubricCriterion[];
  onChange: (rubric: RubricCriterion[]) => void;
}

// Sortable Criterion Item
const SortableCriterion: React.FC<{
  criterion: RubricCriterion;
  index: number;
  onUpdate: (id: string, field: keyof RubricCriterion, value: any) => void;
  onDelete: (id: string) => void;
  onAddLevel: (id: string) => void;
  onUpdateLevel: (criterionId: string, levelId: string, field: keyof ProficiencyLevel, value: any) => void;
  onDeleteLevel: (criterionId: string, levelId: string) => void;
}> = ({ criterion, index, onUpdate, onDelete, onAddLevel, onUpdateLevel, onDeleteLevel }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: criterion.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="p-5 bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-xl shadow-sm mb-4"
      >
        <div className="flex items-start gap-3 mb-4">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mt-2">
            <GripVertical className="w-5 h-5 text-slate-400" />
          </div>
          <div className="flex-1 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 mr-4">
                <input
                  type="text"
                  placeholder="Criterion name (e.g., Thesis Statement)"
                  value={criterion.name}
                  onChange={(e) => onUpdate(criterion.id, 'name', e.target.value)}
                  className="w-full px-3 py-2 text-lg font-semibold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-slate-600">Max Points:</label>
                  <input
                    type="number"
                    min="1"
                    value={criterion.maxPoints}
                    onChange={(e) => onUpdate(criterion.id, 'maxPoints', parseInt(e.target.value))}
                    className="w-20 px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => onDelete(criterion.id)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>

            <textarea
              placeholder="Description (e.g., Clear, focused thesis that states the main argument)"
              value={criterion.description}
              onChange={(e) => onUpdate(criterion.id, 'description', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-500/20"
            />

            {/* Proficiency Levels */}
            {criterion.proficiencyLevels && criterion.proficiencyLevels.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Proficiency Levels</h4>
                <div className="space-y-2">
                  {criterion.proficiencyLevels.map((level) => (
                    <div key={level.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200">
                      <input
                        type="text"
                        placeholder="Level name"
                        value={level.name}
                        onChange={(e) => onUpdateLevel(criterion.id, level.id, 'name', e.target.value)}
                        className="w-32 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Description"
                        value={level.description}
                        onChange={(e) => onUpdateLevel(criterion.id, level.id, 'description', e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:border-blue-500"
                      />
                      <input
                        type="number"
                        min="0"
                        max={criterion.maxPoints}
                        value={level.points}
                        onChange={(e) => onUpdateLevel(criterion.id, level.id, 'points', parseInt(e.target.value))}
                        className="w-16 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:border-blue-500"
                      />
                      <span className="text-xs text-slate-500">pts</span>
                      <button
                        type="button"
                        onClick={() => onDeleteLevel(criterion.id, level.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button type="button" variant="ghost" size="sm" onClick={() => onAddLevel(criterion.id)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Proficiency Level
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const RubricBuilder: React.FC<RubricBuilderProps> = ({ rubric, onChange }) => {
  const [showTemplates, setShowTemplates] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addCriterion = () => {
    const newCriterion: RubricCriterion = {
      id: `criterion-${Date.now()}`,
      name: '',
      description: '',
      maxPoints: 10,
      order: rubric.length,
      proficiencyLevels: [],
    };
    onChange([...rubric, newCriterion]);
  };

  const updateCriterion = (id: string, field: keyof RubricCriterion, value: any) => {
    onChange(
      rubric.map((c) =>
        c.id === id ? { ...c, [field]: value } : c
      )
    );
  };

  const deleteCriterion = (id: string) => {
    onChange(rubric.filter((c) => c.id !== id));
  };

  const addProficiencyLevel = (criterionId: string) => {
    onChange(
      rubric.map((c) => {
        if (c.id === criterionId) {
          const newLevel: ProficiencyLevel = {
            id: `level-${Date.now()}`,
            name: '',
            description: '',
            points: c.maxPoints,
          };
          return {
            ...c,
            proficiencyLevels: [...(c.proficiencyLevels || []), newLevel],
          };
        }
        return c;
      })
    );
  };

  const updateProficiencyLevel = (criterionId: string, levelId: string, field: keyof ProficiencyLevel, value: any) => {
    onChange(
      rubric.map((c) => {
        if (c.id === criterionId && c.proficiencyLevels) {
          return {
            ...c,
            proficiencyLevels: c.proficiencyLevels.map((l) =>
              l.id === levelId ? { ...l, [field]: value } : l
            ),
          };
        }
        return c;
      })
    );
  };

  const deleteProficiencyLevel = (criterionId: string, levelId: string) => {
    onChange(
      rubric.map((c) => {
        if (c.id === criterionId && c.proficiencyLevels) {
          return {
            ...c,
            proficiencyLevels: c.proficiencyLevels.filter((l) => l.id !== levelId),
          };
        }
        return c;
      })
    );
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = rubric.findIndex((c) => c.id === active.id);
      const newIndex = rubric.findIndex((c) => c.id === over.id);

      const reordered = arrayMove(rubric, oldIndex, newIndex).map((c, index) => ({
        ...c,
        order: index,
      }));
      onChange(reordered);
    }
  };

  const loadTemplate = (templateName: string) => {
    let template: RubricCriterion[] = [];

    if (templateName === 'essay-standard') {
      template = [
        {
          id: `criterion-${Date.now()}-1`,
          name: 'Thesis Statement',
          description: 'Clear, focused thesis that states the main argument',
          maxPoints: 20,
          order: 0,
          proficiencyLevels: [
            { id: `level-${Date.now()}-1`, name: 'Excellent', description: 'Strong, clear thesis', points: 20 },
            { id: `level-${Date.now()}-2`, name: 'Good', description: 'Clear thesis with minor issues', points: 15 },
            { id: `level-${Date.now()}-3`, name: 'Needs Work', description: 'Weak or unclear thesis', points: 10 },
          ],
        },
        {
          id: `criterion-${Date.now()}-2`,
          name: 'Evidence & Support',
          description: 'Use of relevant evidence to support claims',
          maxPoints: 30,
          order: 1,
          proficiencyLevels: [
            { id: `level-${Date.now()}-4`, name: 'Excellent', description: 'Strong, relevant evidence', points: 30 },
            { id: `level-${Date.now()}-5`, name: 'Good', description: 'Adequate evidence', points: 20 },
            { id: `level-${Date.now()}-6`, name: 'Needs Work', description: 'Limited or weak evidence', points: 10 },
          ],
        },
        {
          id: `criterion-${Date.now()}-3`,
          name: 'Organization',
          description: 'Logical structure and flow of ideas',
          maxPoints: 20,
          order: 2,
          proficiencyLevels: [],
        },
        {
          id: `criterion-${Date.now()}-4`,
          name: 'Writing Quality',
          description: 'Grammar, mechanics, and style',
          maxPoints: 20,
          order: 3,
          proficiencyLevels: [],
        },
        {
          id: `criterion-${Date.now()}-5`,
          name: 'Conclusion',
          description: 'Effective conclusion that synthesizes ideas',
          maxPoints: 10,
          order: 4,
          proficiencyLevels: [],
        },
      ];
    } else if (templateName === 'argumentative') {
      template = [
        {
          id: `criterion-${Date.now()}-1`,
          name: 'Claim',
          description: 'Clear, arguable claim',
          maxPoints: 25,
          order: 0,
          proficiencyLevels: [],
        },
        {
          id: `criterion-${Date.now()}-2`,
          name: 'Reasoning',
          description: 'Logical reasoning connecting evidence to claim',
          maxPoints: 25,
          order: 1,
          proficiencyLevels: [],
        },
        {
          id: `criterion-${Date.now()}-3`,
          name: 'Counterarguments',
          description: 'Addresses opposing viewpoints',
          maxPoints: 25,
          order: 2,
          proficiencyLevels: [],
        },
        {
          id: `criterion-${Date.now()}-4`,
          name: 'Writing Quality',
          description: 'Grammar, style, and organization',
          maxPoints: 25,
          order: 3,
          proficiencyLevels: [],
        },
      ];
    }

    onChange(template);
    setShowTemplates(false);
  };

  const saveAsTemplate = () => {
    const templateName = prompt('Enter a name for this rubric template:');
    if (templateName) {
      const templateData = JSON.stringify(rubric, null, 2);
      const blob = new Blob([templateData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rubric-${templateName.toLowerCase().replace(/\s+/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const totalPoints = rubric.reduce((sum, c) => sum + c.maxPoints, 0);

  return (
    <Card variant="glassElevated">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Rubric Builder</h2>
          <p className="text-sm text-slate-600 mt-1">
            Define grading criteria for this essay assignment (Total: {totalPoints} points)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => setShowTemplates(!showTemplates)}>
            <Upload className="w-4 h-4 mr-2" />
            Load Template
          </Button>
          {rubric.length > 0 && (
            <Button type="button" variant="ghost" size="sm" onClick={saveAsTemplate}>
              <Download className="w-4 h-4 mr-2" />
              Save Template
            </Button>
          )}
        </div>
      </div>

      {/* Template Selection */}
      <AnimatePresence>
        {showTemplates && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg"
          >
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Select a Template</h3>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => loadTemplate('essay-standard')}>
                Standard Essay (5 criteria)
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => loadTemplate('argumentative')}>
                Argumentative Essay (4 criteria)
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rubric Criteria */}
      {rubric.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={rubric.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-0">
              {rubric.map((criterion, index) => (
                <SortableCriterion
                  key={criterion.id}
                  criterion={criterion}
                  index={index}
                  onUpdate={updateCriterion}
                  onDelete={deleteCriterion}
                  onAddLevel={addProficiencyLevel}
                  onUpdateLevel={updateProficiencyLevel}
                  onDeleteLevel={deleteProficiencyLevel}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="text-center py-12 px-4 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
          <Save className="w-12 h-12 mx-auto mb-3 text-slate-400" />
          <p className="text-slate-600 font-medium">No criteria added yet</p>
          <p className="text-sm text-slate-500 mt-1">Click "Add Criterion" below or load a template to get started</p>
        </div>
      )}

      {/* Add Criterion Button */}
      <div className="mt-4 pt-4 border-t border-slate-200">
        <Button type="button" variant="gradient" size="md" onClick={addCriterion}>
          <Plus className="w-4 h-4 mr-2" />
          Add Criterion
        </Button>
      </div>
    </Card>
  );
};
