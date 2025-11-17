export type MasteryLevel =
  | 'NOT_STARTED'
  | 'INTRODUCED'
  | 'DEVELOPING'
  | 'PROFICIENT'
  | 'MASTERED'
  | 'EXPERT';

export type TrendDirection =
  | 'IMPROVING'
  | 'DECLINING'
  | 'STABLE';

export type RelationshipType =
  | 'prerequisite'
  | 'builds_upon'
  | 'applied_in'
  | 'related';

export interface ConceptNode {
  id: string;
  label: string;
  subject: string;
  mastery: number;
  masteryLevel: MasteryLevel;
  trend: TrendDirection;
  firstLearned: string;
  lastPracticed: string;
  position?: { x: number; y: number };
  classHistory: ClassMasteryRecord[];
  attemptStats: {
    total: number;
    correct: number;
    incorrect: number;
  };
}

export interface ClassMasteryRecord {
  className: string;
  gradeLevel: string;
  schoolYear: string;
  masteryInClass: number;
}

export interface ConceptEdge {
  id: string;
  source: string;
  target: string;
  type: RelationshipType;
  strength: number;
  label: string;
}

export interface GraphMetadata {
  totalConcepts: number;
  masteredConcepts: number;
  inProgressConcepts: number;
  notStartedConcepts: number;
  overallProgress: number;
}

export interface AtlasFilters {
  subject?: string;
  masteryLevel?: MasteryLevel;
  showHistory?: boolean;
}

export interface AtlasViewOptions {
  layout: 'hierarchical' | 'force' | 'circular' | 'radial';
  zoom: number;
  centerOnNode?: string;
}
