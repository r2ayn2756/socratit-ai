import express, { Request, Response } from 'express';
import knowledgeGraphService from '../services/knowledgeGraph.service';
import aiKnowledgeGraphService from '../services/aiKnowledgeGraph.service';
import { authenticate } from '../middleware/auth';
import { MasteryLevel } from '@prisma/client';

const router = express.Router();

/**
 * GET /api/v1/knowledge-graph/:studentId
 * Get student's complete knowledge graph
 * Auth: Student (own data), Teacher (students in their class), Admin
 */
router.get('/:studentId', authenticate, async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { filterSubject, filterMasteryLevel, includeHistory } = req.query;

    // Authorization check
    const user = (req as any).user;
    if (user.role === 'STUDENT' && user.id !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Students can only view their own knowledge graph',
      });
    }

    const graph = await knowledgeGraphService.getStudentKnowledgeGraph(
      studentId,
      user.schoolId,
      {
        filterSubject: filterSubject as string | undefined,
        filterMasteryLevel: filterMasteryLevel as MasteryLevel | undefined,
        includeHistory: includeHistory === 'true',
      }
    );

    res.json({
      success: true,
      data: graph,
    });
  } catch (error: any) {
    console.error('Error fetching knowledge graph:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch knowledge graph',
    });
  }
});

/**
 * GET /api/v1/knowledge-graph/concept/:conceptId/prerequisites
 * Get prerequisite chain for a concept (recursive)
 * Auth: Any authenticated user
 */
router.get(
  '/concept/:conceptId/prerequisites',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { conceptId } = req.params;

      const chain = await knowledgeGraphService.getPrerequisiteChain(conceptId);

      res.json({
        success: true,
        data: {
          concept: chain[0] || null,
          prerequisiteChain: chain.slice(1),
          totalPrerequisites: chain.length - 1,
        },
      });
    } catch (error: any) {
      console.error('Error fetching prerequisite chain:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch prerequisite chain',
      });
    }
  }
);

/**
 * GET /api/v1/knowledge-graph/gaps/:studentId/:classId
 * Identify knowledge gaps for a student in a specific class
 * Auth: Teacher only
 */
router.get('/gaps/:studentId/:classId', authenticate, async (req: Request, res: Response) => {
  try {
    const { studentId, classId } = req.params;
    const user = (req as any).user;

    // Authorization check - only teachers
    if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Only teachers can view knowledge gaps',
      });
    }

    const gaps = await knowledgeGraphService.identifyKnowledgeGaps(studentId, classId);

    // Get student and class info for context
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { firstName: true, lastName: true },
    });

    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
      select: { name: true },
    });

    res.json({
      success: true,
      data: {
        studentName: `${student?.firstName} ${student?.lastName}`,
        className: classInfo?.name,
        ...gaps,
      },
    });
  } catch (error: any) {
    console.error('Error identifying knowledge gaps:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to identify knowledge gaps',
    });
  }
});

/**
 * GET /api/v1/knowledge-graph/timeline/:studentId/:conceptId
 * Get mastery timeline for a specific concept
 * Auth: Student (own data), Teacher, Admin
 */
router.get('/timeline/:studentId/:conceptId', authenticate, async (req: Request, res: Response) => {
  try {
    const { studentId, conceptId } = req.params;
    const user = (req as any).user;

    // Authorization check
    if (user.role === 'STUDENT' && user.id !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Students can only view their own timeline',
      });
    }

    const timeline = await knowledgeGraphService.getConceptMasteryTimeline(studentId, conceptId);

    if (!timeline) {
      return res.status(404).json({
        success: false,
        message: 'Concept mastery not found',
      });
    }

    res.json({
      success: true,
      data: timeline,
    });
  } catch (error: any) {
    console.error('Error fetching concept timeline:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch concept timeline',
    });
  }
});

/**
 * PATCH /api/v1/knowledge-graph/node-position
 * Update node position in graph for custom layouts
 * Auth: Student (own graph), Teacher
 */
router.patch('/node-position', authenticate, async (req: Request, res: Response) => {
  try {
    const { studentId, conceptId, x, y } = req.body;
    const user = (req as any).user;

    // Validation
    if (!studentId || !conceptId || x === undefined || y === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: studentId, conceptId, x, y',
      });
    }

    // Authorization check
    if (user.role === 'STUDENT' && user.id !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Students can only modify their own graph',
      });
    }

    const result = await knowledgeGraphService.updateNodePosition(studentId, conceptId, x, y);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Error updating node position:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update node position',
    });
  }
});

/**
 * POST /api/v1/knowledge-graph/generate
 * AI-generate concept graph from curriculum text
 * Auth: Teacher only
 */
router.post('/generate', authenticate, async (req: Request, res: Response) => {
  try {
    const { curriculumText, subject, gradeLevel, classId } = req.body;
    const user = (req as any).user;

    // Authorization check - only teachers
    if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Only teachers can generate concept graphs',
      });
    }

    // Validation
    if (!curriculumText || !subject || !gradeLevel) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: curriculumText, subject, gradeLevel',
      });
    }

    const result = await aiKnowledgeGraphService.generateConceptGraphFromCurriculum(
      curriculumText,
      subject,
      gradeLevel
    );

    res.json({
      success: true,
      data: result,
      message: `Generated ${result.conceptsGenerated} concepts and ${result.relationshipsGenerated} relationships`,
    });
  } catch (error: any) {
    console.error('Error generating concept graph:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate concept graph',
    });
  }
});

/**
 * POST /api/v1/knowledge-graph/cross-subject-connections
 * Find cross-subject connections for a concept using AI
 * Auth: Teacher only
 */
router.post('/cross-subject-connections', authenticate, async (req: Request, res: Response) => {
  try {
    const { conceptName } = req.body;
    const user = (req as any).user;

    // Authorization check - only teachers
    if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Only teachers can find cross-subject connections',
      });
    }

    // Validation
    if (!conceptName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: conceptName',
      });
    }

    const result = await aiKnowledgeGraphService.findCrossSubjectConnections(conceptName);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error finding cross-subject connections:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to find cross-subject connections',
    });
  }
});

/**
 * POST /api/v1/knowledge-graph/predict-struggles
 * Predict future struggles for a student using AI
 * Auth: Teacher, Admin
 */
router.post('/predict-struggles', authenticate, async (req: Request, res: Response) => {
  try {
    const { studentId } = req.body;
    const user = (req as any).user;

    // Authorization check - only teachers and admins
    if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Only teachers can predict student struggles',
      });
    }

    // Validation
    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: studentId',
      });
    }

    const predictions = await aiKnowledgeGraphService.predictFutureStruggles(studentId);

    res.json({
      success: true,
      data: predictions,
    });
  } catch (error: any) {
    console.error('Error predicting struggles:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to predict struggles',
    });
  }
});

/**
 * POST /api/v1/knowledge-graph/extract-concepts
 * Extract concepts from AI conversation text
 * Auth: Any authenticated user
 */
router.post('/extract-concepts', authenticate, async (req: Request, res: Response) => {
  try {
    const { conversationText, subject } = req.body;

    // Validation
    if (!conversationText) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: conversationText',
      });
    }

    const concepts = await aiKnowledgeGraphService.extractConceptsFromConversation(
      conversationText,
      subject
    );

    res.json({
      success: true,
      data: {
        concepts,
        count: concepts.length,
      },
    });
  } catch (error: any) {
    console.error('Error extracting concepts:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to extract concepts',
    });
  }
});

/**
 * POST /api/v1/knowledge-graph/build-prerequisites
 * Build prerequisite graph for a set of concepts using AI
 * Auth: Teacher only
 */
router.post('/build-prerequisites', authenticate, async (req: Request, res: Response) => {
  try {
    const { conceptNames } = req.body;
    const user = (req as any).user;

    // Authorization check - only teachers
    if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Only teachers can build prerequisite graphs',
      });
    }

    // Validation
    if (!conceptNames || !Array.isArray(conceptNames)) {
      return res.status(400).json({
        success: false,
        message: 'Missing or invalid field: conceptNames (must be array)',
      });
    }

    const dependencies = await aiKnowledgeGraphService.buildPrerequisiteGraph(conceptNames);

    res.json({
      success: true,
      data: {
        dependencies,
        conceptCount: conceptNames.length,
      },
    });
  } catch (error: any) {
    console.error('Error building prerequisite graph:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to build prerequisite graph',
    });
  }
});

export default router;
