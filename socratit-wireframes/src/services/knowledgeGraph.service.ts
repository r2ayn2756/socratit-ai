import api from './api';
import { MasteryLevel } from '../types/knowledgeGraph';

export interface KnowledgeGraphNode {
  id: string;
  label: string;
  subject: string;
  mastery: number;
  masteryLevel: MasteryLevel;
  trend: 'IMPROVING' | 'DECLINING' | 'STABLE';
  firstLearned: string;
  lastPracticed: string;
  position?: { x: number; y: number };
  classHistory: {
    className: string;
    gradeLevel: string;
    schoolYear: string;
    masteryInClass: number;
  }[];
  attemptStats: {
    total: number;
    correct: number;
    incorrect: number;
  };
}

export interface KnowledgeGraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'prerequisite' | 'builds_upon' | 'applied_in' | 'related';
  strength: number;
  label: string;
}

export interface KnowledgeGraphMetadata {
  totalConcepts: number;
  masteredConcepts: number;
  inProgressConcepts: number;
  notStartedConcepts: number;
  overallProgress: number;
}

export interface KnowledgeGraph {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
  metadata: KnowledgeGraphMetadata;
}

export interface ConceptTimeline {
  conceptId: string;
  conceptName: string;
  subject: string;
  overallMastery: number;
  masteryLevel: MasteryLevel;
  timeline: {
    date: string;
    percent: number;
    classId: string;
    className: string;
    assignmentId?: string;
    assignmentTitle?: string;
    grade?: number;
    event: string;
  }[];
  classSummaries: {
    classId: string;
    className: string;
    gradeLevel: string;
    schoolYear: string;
    masteryInClass: number;
    firstAssessed: string;
    lastAssessed: string;
  }[];
}

export interface KnowledgeGap {
  conceptId: string;
  conceptName: string;
  currentMastery: number;
  lastStudied: string;
  yearsAgo: number;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendation: string;
}

export interface KnowledgeGapsResponse {
  studentName: string;
  className: string;
  gaps: KnowledgeGap[];
  totalGaps: number;
  criticalGaps: number;
  moderateGaps: number;
}

/**
 * Knowledge Graph Service
 * API client for Atlas multi-year knowledge tracking
 */
class KnowledgeGraphService {
  /**
   * Get student's complete knowledge graph
   */
  async getStudentKnowledgeGraph(
    studentId: string,
    options?: {
      filterSubject?: string;
      filterMasteryLevel?: MasteryLevel;
      includeHistory?: boolean;
    }
  ): Promise<KnowledgeGraph> {
    const params = new URLSearchParams();
    if (options?.filterSubject) {
      params.append('filterSubject', options.filterSubject);
    }
    if (options?.filterMasteryLevel) {
      params.append('filterMasteryLevel', options.filterMasteryLevel);
    }
    if (options?.includeHistory) {
      params.append('includeHistory', 'true');
    }

    const response = await api.get(`/knowledge-graph/${studentId}?${params.toString()}`);
    return response.data.data;
  }

  /**
   * Get mastery timeline for a specific concept
   */
  async getConceptTimeline(studentId: string, conceptId: string): Promise<ConceptTimeline> {
    const response = await api.get(`/knowledge-graph/timeline/${studentId}/${conceptId}`);
    return response.data.data;
  }

  /**
   * Update node position in graph (for custom layouts)
   */
  async updateNodePosition(
    studentId: string,
    conceptId: string,
    x: number,
    y: number
  ): Promise<void> {
    await api.patch('/knowledge-graph/node-position', {
      studentId,
      conceptId,
      x,
      y,
    });
  }

  /**
   * Get prerequisite chain for a concept
   */
  async getPrerequisiteChain(conceptId: string): Promise<any> {
    const response = await api.get(`/knowledge-graph/concept/${conceptId}/prerequisites`);
    return response.data.data;
  }

  /**
   * Identify knowledge gaps for a student in a class
   */
  async getKnowledgeGaps(studentId: string, classId: string): Promise<KnowledgeGapsResponse> {
    const response = await api.get(`/knowledge-graph/gaps/${studentId}/${classId}`);
    return response.data.data;
  }

  /**
   * Generate concept graph from curriculum text (AI-powered)
   */
  async generateConceptGraph(
    curriculumText: string,
    subject: string,
    gradeLevel: string,
    classId?: string
  ): Promise<any> {
    const response = await api.post('/knowledge-graph/generate', {
      curriculumText,
      subject,
      gradeLevel,
      classId,
    });
    return response.data.data;
  }

  /**
   * Find cross-subject connections (AI-powered)
   */
  async findCrossSubjectConnections(conceptName: string): Promise<any> {
    const response = await api.post('/knowledge-graph/cross-subject-connections', {
      conceptName,
    });
    return response.data.data;
  }

  /**
   * Predict future struggles (AI-powered)
   */
  async predictFutureStruggles(studentId: string): Promise<any> {
    const response = await api.post('/knowledge-graph/predict-struggles', {
      studentId,
    });
    return response.data.data;
  }

  /**
   * Extract concepts from conversation text
   */
  async extractConcepts(conversationText: string, subject?: string): Promise<string[]> {
    const response = await api.post('/knowledge-graph/extract-concepts', {
      conversationText,
      subject,
    });
    return response.data.data.concepts;
  }

  /**
   * Build prerequisite graph for concept list (AI-powered)
   */
  async buildPrerequisiteGraph(conceptNames: string[]): Promise<any> {
    const response = await api.post('/knowledge-graph/build-prerequisites', {
      conceptNames,
    });
    return response.data.data;
  }
}

export default new KnowledgeGraphService();
