// ============================================================================
// SORTABLE UNIT GRID COMPONENT
// Drag-and-drop grid for reordering curriculum units
// ============================================================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus } from 'lucide-react';
import { UnitCard } from './UnitCard';
import { Button } from './Button';
import { GlassPanel } from './GlassCard';
import type { CurriculumUnit } from '../../types/curriculum.types';
import curriculumApi from '../../services/curriculumApi.service';

interface SortableUnitGridProps {
  scheduleId: string;
  units: CurriculumUnit[];
  onUnitsReorder?: (units: CurriculumUnit[]) => void;
  onUnitClick?: (unit: CurriculumUnit) => void;
  onAddUnit?: () => void;
  editable?: boolean;
}

// ============================================================================
// SORTABLE ITEM WRAPPER
// ============================================================================

interface SortableItemProps {
  unit: CurriculumUnit;
  onUnitClick?: (unit: CurriculumUnit) => void;
  isDragging?: boolean;
}

const SortableItem: React.FC<SortableItemProps> = ({
  unit,
  onUnitClick,
  isDragging = false,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: unit.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 cursor-grab active:cursor-grabbing"
      >
        <div className="w-8 h-8 bg-white/90 backdrop-blur-xl rounded-lg shadow-md flex items-center justify-center hover:bg-blue-50 transition-colors">
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Unit Card */}
      <UnitCard
        unit={unit}
        onClick={() => onUnitClick?.(unit)}
        isDragging={isSortableDragging}
        showProgress
      />
    </div>
  );
};

// ============================================================================
// MAIN SORTABLE GRID COMPONENT
// ============================================================================

export const SortableUnitGrid: React.FC<SortableUnitGridProps> = ({
  scheduleId,
  units: initialUnits,
  onUnitsReorder,
  onUnitClick,
  onAddUnit,
  editable = true,
}) => {
  const [units, setUnits] = useState(initialUnits);
  const [activeUnit, setActiveUnit] = useState<CurriculumUnit | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeUnit = units.find((unit) => unit.id === active.id);
    setActiveUnit(activeUnit || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = units.findIndex((unit) => unit.id === active.id);
      const newIndex = units.findIndex((unit) => unit.id === over.id);

      const reorderedUnits = arrayMove(units, oldIndex, newIndex);

      // Update local state immediately for smooth UX
      setUnits(reorderedUnits);
      onUnitsReorder?.(reorderedUnits);

      // Save to backend
      if (editable) {
        setIsSaving(true);
        try {
          await curriculumApi.units.reorderUnits({
            scheduleId,
            unitOrders: reorderedUnits.map((unit, index) => ({
              unitId: unit.id,
              orderIndex: index,
            })),
          });
        } catch (error) {
          console.error('Failed to save unit order:', error);
          // Revert on error
          setUnits(initialUnits);
        } finally {
          setIsSaving(false);
        }
      }
    }

    setActiveUnit(null);
  };

  const handleDragCancel = () => {
    setActiveUnit(null);
  };

  return (
    <GlassPanel
      title="Curriculum Units"
      subtitle={`${units.length} units planned for the year`}
      action={
        editable && onAddUnit && (
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={onAddUnit}
          >
            Add Unit
          </Button>
        )
      }
    >
      {isSaving && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mb-4 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700"
        >
          Saving changes...
        </motion.div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext
          items={units.map((u) => u.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4 pl-4">
            <AnimatePresence>
              {units.map((unit) => (
                <SortableItem
                  key={unit.id}
                  unit={unit}
                  onUnitClick={onUnitClick}
                />
              ))}
            </AnimatePresence>
          </div>
        </SortableContext>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeUnit && (
            <div className="rotate-3 scale-105">
              <UnitCard unit={activeUnit} showProgress />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {units.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Plus className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium mb-2">No units yet</p>
          <p className="text-sm text-gray-500 mb-4">
            Create your first unit or generate a schedule with AI
          </p>
          {editable && onAddUnit && (
            <Button variant="primary" onClick={onAddUnit} icon={<Plus className="w-4 h-4" />}>
              Create First Unit
            </Button>
          )}
        </div>
      )}
    </GlassPanel>
  );
};

export default SortableUnitGrid;
