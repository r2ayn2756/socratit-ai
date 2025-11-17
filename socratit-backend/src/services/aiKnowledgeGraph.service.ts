import { PrismaClient } from '@prisma/client';
import aiService from './ai.service';

const prisma = new PrismaClient();

interface ExtractedConcept {
  name: string;
  description: string;
  aliases: string[];
  difficulty?: number;
  estimatedHours?: number;
}

interface ExtractedRelationship {
  source: string;
  target: string;
  type: 'prerequisite' | 'builds_upon' | 'applied_in' | 'related';
  strength: number;
  reasoning?: string;
}

interface ConceptGraph {
  concepts: ExtractedConcept[];
  relationships: ExtractedRelationship[];
}

/**
 * AI Knowledge Graph Service
 * Uses LLM to analyze curriculum and build semantic concept relationships
 */
export class AIKnowledgeGraphService {
  /**
   * Use AI to extract concepts and relationships from curriculum text
   * @param curriculumText - Raw curriculum text or syllabus
   * @param subject - Subject area (Mathematics, Science, etc.)
   * @param gradeLevel - Grade level (e.g., "9-10", "K-5")
   * @returns Number of concepts and relationships generated
   */
  async generateConceptGraphFromCurriculum(
    curriculumText: string,
    subject: string,
    gradeLevel: string
  ) {
    try {
      const prompt = `You are an educational curriculum expert. Analyze the following ${subject} curriculum for ${gradeLevel} and extract a knowledge graph of concepts and their prerequisites.

Curriculum:
${curriculumText}

Return a JSON object with:
{
  "concepts": [
    {
      "name": "Quadratic Equations",
      "description": "Equations of the form ax² + bx + c = 0",
      "aliases": ["quadratics", "quadratic functions", "second-degree equations"],
      "difficulty": 7,
      "estimatedHours": 12
    },
    ...
  ],
  "relationships": [
    {
      "source": "Linear Equations",
      "target": "Quadratic Equations",
      "type": "prerequisite",
      "strength": 0.95,
      "reasoning": "Linear equations are fundamental for understanding quadratic solving methods"
    },
    ...
  ]
}

Guidelines:
- Extract ALL major concepts from the curriculum
- Identify prerequisite relationships (what must be learned first)
- Identify "builds_upon" relationships (extends/enhances concept)
- Identify "applied_in" relationships (concept used in another context)
- Identify "related" relationships (conceptually similar)
- Strength: 1.0 = essential, 0.7 = helpful, 0.3 = loosely related
- Difficulty: 1-10 scale
- estimatedHours: Hours to learn/master the concept

Return ONLY valid JSON, no additional text.`;

      const response = await aiService.chatCompletion(
        [
          { role: 'system', content: 'You are an educational AI that analyzes curriculum.' },
          { role: 'user', content: prompt },
        ],
        {
          temperature: 0.3,
          responseFormat: { type: 'json_object' },
        }
      );

      const graph: ConceptGraph = JSON.parse(response.content);

      // Save concepts and relationships to database
      const conceptMap = new Map<string, string>(); // name -> id

      // Create concepts
      for (const c of graph.concepts) {
        const concept = await prisma.conceptTaxonomy.upsert({
          where: { conceptName: c.name },
          update: {
            description: c.description,
            aliases: c.aliases || [c.name.toLowerCase()],
            teacherModified: false, // Will be set to true if teacher edits
          },
          create: {
            conceptName: c.name,
            subject,
            gradeLevel,
            description: c.description,
            aliases: c.aliases || [c.name.toLowerCase()],
            aiGenerated: true,
          },
        });
        conceptMap.set(c.name, concept.id);
      }

      // Create relationships
      let relationshipCount = 0;
      for (const r of graph.relationships) {
        const sourceId = conceptMap.get(r.source);
        const targetId = conceptMap.get(r.target);

        if (sourceId && targetId) {
          await prisma.conceptRelationship.upsert({
            where: {
              sourceConceptId_targetConceptId_relationshipType: {
                sourceConceptId: sourceId,
                targetConceptId: targetId,
                relationshipType: r.type,
              },
            },
            update: {
              strength: r.strength,
              reasoning: r.reasoning,
              confidence: 0.8, // AI-generated confidence
            },
            create: {
              sourceConceptId: sourceId,
              targetConceptId: targetId,
              relationshipType: r.type,
              strength: r.strength,
              aiGenerated: true,
              confidence: 0.8,
              reasoning: r.reasoning,
            },
          });
          relationshipCount++;
        }
      }

      return {
        conceptsGenerated: graph.concepts.length,
        relationshipsGenerated: relationshipCount,
        concepts: graph.concepts.map((c) => ({
          id: conceptMap.get(c.name),
          name: c.name,
          confidence: 0.8,
        })),
        preview: {
          nodes: graph.concepts.map((c) => c.name),
          edges: graph.relationships.map((r) => ({
            from: r.source,
            to: r.target,
            type: r.type,
          })),
        },
      };
    } catch (error) {
      console.error('Error generating concept graph from curriculum:', error);
      throw new Error('Failed to generate concept graph');
    }
  }

  /**
   * Find semantic connections between a concept and concepts in other subjects
   * @param conceptName - Concept to find connections for
   * @returns Cross-subject connections
   */
  async findCrossSubjectConnections(conceptName: string) {
    try {
      // Get the concept and its subject
      const concept = await prisma.conceptTaxonomy.findFirst({
        where: {
          OR: [{ conceptName }, { aliases: { has: conceptName.toLowerCase() } }],
        },
      });

      if (!concept) {
        throw new Error('Concept not found');
      }

      const prompt = `Find concepts in OTHER subjects that are related to "${conceptName}" (${concept.subject}).

For example, "Quadratic Equations" (Math) relates to:
- "Projectile Motion" (Physics) - parabolic trajectories use quadratic models
- "Supply and Demand Curves" (Economics) - quadratic functions model market equilibrium

Return JSON:
{
  "connections": [
    {
      "concept": "Projectile Motion",
      "subject": "Physics",
      "relationship": "applied_in",
      "strength": 0.9,
      "explanation": "Quadratic equations model parabolic trajectories in projectile motion"
    },
    ...
  ]
}

Focus on meaningful, pedagogically valuable connections. Return ONLY valid JSON.`;

      const response = await aiService.chatCompletion(
        [
          {
            role: 'system',
            content: 'You are an educational AI that finds interdisciplinary connections.',
          },
          { role: 'user', content: prompt },
        ],
        {
          temperature: 0.5,
          responseFormat: { type: 'json_object' },
        }
      );

      const result = JSON.parse(response.content);

      // Create concepts and relationships for connections
      const createdConnections = [];
      for (const conn of result.connections) {
        // Find or create target concept
        let targetConcept = await prisma.conceptTaxonomy.findFirst({
          where: {
            OR: [{ conceptName: conn.concept }, { aliases: { has: conn.concept.toLowerCase() } }],
          },
        });

        if (!targetConcept) {
          targetConcept = await prisma.conceptTaxonomy.create({
            data: {
              conceptName: conn.concept,
              subject: conn.subject,
              aliases: [conn.concept.toLowerCase()],
              aiGenerated: true,
            },
          });
        }

        // Create relationship
        const relationship = await prisma.conceptRelationship.upsert({
          where: {
            sourceConceptId_targetConceptId_relationshipType: {
              sourceConceptId: concept.id,
              targetConceptId: targetConcept.id,
              relationshipType: conn.relationship,
            },
          },
          update: {
            strength: conn.strength,
            reasoning: conn.explanation,
            confidence: 0.7, // Cross-subject connections have slightly lower confidence
          },
          create: {
            sourceConceptId: concept.id,
            targetConceptId: targetConcept.id,
            relationshipType: conn.relationship,
            strength: conn.strength,
            aiGenerated: true,
            confidence: 0.7,
            reasoning: conn.explanation,
          },
        });

        createdConnections.push({
          targetConcept: conn.concept,
          subject: conn.subject,
          relationship: conn.relationship,
          relationshipId: relationship.id,
        });
      }

      return {
        sourceConcept: conceptName,
        sourceSubject: concept.subject,
        connections: createdConnections,
      };
    } catch (error) {
      console.error('Error finding cross-subject connections:', error);
      throw new Error('Failed to find cross-subject connections');
    }
  }

  /**
   * Analyze student struggles and predict future difficulties
   * @param studentId - Student UUID
   * @returns Predicted struggles with reasoning
   */
  async predictFutureStruggles(studentId: string) {
    try {
      // Get student's current concept masteries
      const masteries = await prisma.studentConceptMastery.findMany({
        where: { studentId },
        include: {
          concept: {
            include: {
              sourceRelationships: {
                where: { relationshipType: 'prerequisite' },
                include: { targetConcept: true },
              },
            },
          },
        },
        orderBy: { overallMasteryPercent: 'asc' },
        take: 20, // Focus on struggling concepts
      });

      // Build context for AI
      const strugglingConcepts = masteries
        .filter((m) => m.overallMasteryPercent < 70)
        .map((m) => ({
          concept: m.concept.conceptName,
          mastery: m.overallMasteryPercent,
          dependents: m.concept.sourceRelationships.map((r) => r.targetConcept.conceptName),
        }));

      const prompt = `Analyze this student's struggling concepts and predict future difficulties.

Current struggles:
${JSON.stringify(strugglingConcepts, null, 2)}

Return JSON:
{
  "predictions": [
    {
      "conceptName": "Rational Expressions",
      "probability": 0.85,
      "reason": "Student struggling with prerequisite 'Factoring Polynomials' (45% mastery)",
      "recommendedAction": "Review factoring before teaching rational expressions"
    },
    ...
  ]
}

Focus on actionable predictions based on prerequisite gaps. Return ONLY valid JSON.`;

      const response = await aiService.chatCompletion(
        [
          {
            role: 'system',
            content: 'You are an educational AI that predicts student learning difficulties.',
          },
          { role: 'user', content: prompt },
        ],
        {
          temperature: 0.4,
          responseFormat: { type: 'json_object' },
        }
      );

      const predictions = JSON.parse(response.content);

      // Update student learning journey with predictions
      await prisma.studentLearningJourney.upsert({
        where: { studentId },
        update: {
          predictedStruggles: predictions.predictions,
        },
        create: {
          studentId,
          schoolId: (await prisma.user.findUnique({ where: { id: studentId } }))!.schoolId,
          predictedStruggles: predictions.predictions,
        },
      });

      return predictions;
    } catch (error) {
      console.error('Error predicting future struggles:', error);
      throw new Error('Failed to predict future struggles');
    }
  }

  /**
   * Extract concepts mentioned in AI conversation
   * Used to link AI tutor conversations to knowledge graph
   * @param conversationText - AI conversation text
   * @param subject - Subject context
   * @returns Array of concept names mentioned
   */
  async extractConceptsFromConversation(conversationText: string, subject?: string) {
    try {
      const prompt = `Extract all educational concepts mentioned in this conversation.

Conversation:
${conversationText}

${subject ? `Subject context: ${subject}` : ''}

Return JSON:
{
  "concepts": ["Quadratic Equations", "Factoring", "Parabolas"]
}

Extract only genuine educational concepts, not casual mentions. Return ONLY valid JSON.`;

      const response = await aiService.chatCompletion(
        [
          { role: 'system', content: 'You are an educational AI that identifies concepts.' },
          { role: 'user', content: prompt },
        ],
        {
          temperature: 0.2,
          responseFormat: { type: 'json_object' },
        }
      );

      const result = JSON.parse(response.content);
      return result.concepts || [];
    } catch (error) {
      console.error('Error extracting concepts from conversation:', error);
      return [];
    }
  }

  /**
   * Build prerequisite graph for a set of concepts
   * @param conceptNames - Array of concept names
   * @returns Graph structure with dependencies
   */
  async buildPrerequisiteGraph(conceptNames: string[]) {
    try {
      const prompt = `Determine the prerequisite relationships between these concepts:

Concepts:
${JSON.stringify(conceptNames, null, 2)}

Return JSON showing which concepts are prerequisites for others:
{
  "dependencies": [
    {
      "concept": "Quadratic Equations",
      "prerequisites": ["Linear Equations", "Algebraic Expressions"],
      "difficulty": 7
    },
    ...
  ]
}

Order concepts from fundamental to advanced. Return ONLY valid JSON.`;

      const response = await aiService.chatCompletion(
        [
          {
            role: 'system',
            content: 'You are an educational AI that determines learning sequences.',
          },
          { role: 'user', content: prompt },
        ],
        {
          temperature: 0.3,
          responseFormat: { type: 'json_object' },
        }
      );

      const result = JSON.parse(response.content);

      // Create concepts and relationships
      const conceptMap = new Map<string, string>();

      // First pass: create all concepts
      for (const dep of result.dependencies) {
        const concept = await prisma.conceptTaxonomy.upsert({
          where: { conceptName: dep.concept },
          update: {},
          create: {
            conceptName: dep.concept,
            subject: 'Unknown', // Should be provided
            aliases: [dep.concept.toLowerCase()],
            aiGenerated: true,
          },
        });
        conceptMap.set(dep.concept, concept.id);
      }

      // Second pass: create relationships
      for (const dep of result.dependencies) {
        const targetId = conceptMap.get(dep.concept);
        if (!targetId) continue;

        for (const prereqName of dep.prerequisites || []) {
          const sourceId = conceptMap.get(prereqName);
          if (!sourceId) continue;

          await prisma.conceptRelationship.upsert({
            where: {
              sourceConceptId_targetConceptId_relationshipType: {
                sourceConceptId: sourceId,
                targetConceptId: targetId,
                relationshipType: 'prerequisite',
              },
            },
            update: {
              strength: 0.8,
            },
            create: {
              sourceConceptId: sourceId,
              targetConceptId: targetId,
              relationshipType: 'prerequisite',
              strength: 0.8,
              aiGenerated: true,
              confidence: 0.75,
            },
          });
        }
      }

      return result.dependencies;
    } catch (error) {
      console.error('Error building prerequisite graph:', error);
      throw new Error('Failed to build prerequisite graph');
    }
  }
}

export default new AIKnowledgeGraphService();
