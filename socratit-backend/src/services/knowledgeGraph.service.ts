import { PrismaClient, MasteryLevel, TrendDirection } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Knowledge Graph Service
 * Handles multi-year student knowledge tracking and concept relationships
 */
export class KnowledgeGraphService {
  /**
   * Get student's complete knowledge graph with all concepts, relationships, and mastery data
   * @param studentId - Student UUID
   * @param schoolId - School UUID for multi-tenancy
   * @param options - Optional filters and settings
   * @returns Graph data with nodes and edges
   */
  async getStudentKnowledgeGraph(
    studentId: string,
    schoolId: string,
    options?: {
      includeHistory?: boolean;
      filterSubject?: string;
      filterMasteryLevel?: MasteryLevel;
    }
  ) {
    try {
      // Fetch all student concept masteries with related data
      const masteries = await prisma.studentConceptMastery.findMany({
        where: {
          studentId,
          schoolId,
          ...(options?.filterMasteryLevel && {
            overallMasteryLevel: options.filterMasteryLevel,
          }),
          ...(options?.filterSubject && {
            concept: {
              subject: options.filterSubject,
            },
          }),
        },
        include: {
          concept: {
            include: {
              sourceRelationships: {
                include: { targetConcept: true },
              },
              targetRelationships: {
                include: { sourceConcept: true },
              },
            },
          },
          classMasteries: {
            include: { class: true },
            orderBy: { lastAssessedInClass: 'asc' },
          },
        },
      });

      // Transform to graph format (nodes)
      const nodes = masteries.map((m) => ({
        id: m.conceptId,
        label: m.concept.conceptName,
        subject: m.concept.subject,
        mastery: m.overallMasteryPercent,
        masteryLevel: m.overallMasteryLevel,
        trend: m.trend,
        firstLearned: m.firstAssessed,
        lastPracticed: m.lastAssessed,
        position: {
          x: m.graphPositionX,
          y: m.graphPositionY,
        },
        classHistory: m.classMasteries.map((cm) => ({
          className: cm.class.name,
          gradeLevel: cm.class.gradeLevel,
          schoolYear: cm.class.academicYear,
          masteryInClass: cm.masteryPercent,
          lastAssessed: cm.lastAssessedInClass,
        })),
        attemptStats: {
          total: m.totalAttempts,
          correct: m.correctAttempts,
          incorrect: m.incorrectAttempts,
        },
        ...(options?.includeHistory && {
          history: m.masteryHistory,
        }),
      }));

      // Build edges from relationships
      const edges: any[] = [];
      const nodeIds = new Set(nodes.map((n) => n.id));

      masteries.forEach((m) => {
        m.concept.sourceRelationships.forEach((rel) => {
          // Only include edge if both nodes are in filtered set
          if (nodeIds.has(rel.sourceConceptId) && nodeIds.has(rel.targetConceptId)) {
            edges.push({
              id: rel.id,
              source: rel.sourceConceptId,
              target: rel.targetConceptId,
              type: rel.relationshipType,
              strength: rel.strength,
              label: this.formatRelationshipLabel(rel.relationshipType),
              aiGenerated: rel.aiGenerated,
              confidence: rel.confidence,
            });
          }
        });
      });

      // Calculate metadata
      const metadata = {
        totalConcepts: nodes.length,
        masteredConcepts: nodes.filter((n) => n.masteryLevel === 'MASTERED').length,
        inProgressConcepts: nodes.filter((n) =>
          ['DEVELOPING', 'PROFICIENT'].includes(n.masteryLevel)
        ).length,
        notStartedConcepts: nodes.filter((n) => n.masteryLevel === 'NOT_STARTED').length,
        overallProgress:
          nodes.length > 0 ? nodes.reduce((sum, n) => sum + n.mastery, 0) / nodes.length : 0,
      };

      return { nodes, edges, metadata };
    } catch (error) {
      console.error('Error fetching student knowledge graph:', error);
      throw new Error('Failed to fetch knowledge graph');
    }
  }

  /**
   * Get the complete prerequisite chain for a concept (recursive)
   * @param conceptId - Concept UUID
   * @returns Array of prerequisite concepts with depth
   */
  async getPrerequisiteChain(conceptId: string) {
    try {
      const chain: any[] = [];

      const traverse = async (id: string, depth: number = 0) => {
        const concept = await prisma.conceptTaxonomy.findUnique({
          where: { id },
          include: {
            targetRelationships: {
              where: { relationshipType: 'prerequisite' },
              include: { sourceConcept: true },
            },
          },
        });

        if (!concept) return;

        chain.push({
          id: concept.id,
          name: concept.conceptName,
          subject: concept.subject,
          depth,
        });

        // Recursively traverse prerequisites
        for (const rel of concept.targetRelationships) {
          await traverse(rel.sourceConcept.id, depth + 1);
        }
      };

      await traverse(conceptId);
      return chain;
    } catch (error) {
      console.error('Error fetching prerequisite chain:', error);
      throw new Error('Failed to fetch prerequisite chain');
    }
  }

  /**
   * Identify knowledge gaps for a student in a specific class
   * Detects missing or weak prerequisites from previous years
   * @param studentId - Student UUID
   * @param classId - Class UUID
   * @returns Array of identified gaps with severity
   */
  async identifyKnowledgeGaps(studentId: string, classId: string) {
    try {
      // Get all concepts required for this class
      const classAssignments = await prisma.assignment.findMany({
        where: { classId },
        include: {
          questions: {
            include: {
              curriculumSubUnit: {
                select: { concepts: true },
              },
            },
          },
        },
      });

      // Extract unique concepts
      const requiredConcepts = new Set<string>();
      classAssignments.forEach((a) => {
        a.questions.forEach((q) => {
          if (q.concept) requiredConcepts.add(q.concept);
          q.curriculumSubUnit?.concepts.forEach((c) => requiredConcepts.add(c));
        });
      });

      // Check student mastery for each concept
      const gaps = [];
      for (const conceptName of requiredConcepts) {
        // Find concept in taxonomy (with fuzzy matching via aliases)
        const concept = await prisma.conceptTaxonomy.findFirst({
          where: {
            OR: [{ conceptName }, { aliases: { has: conceptName.toLowerCase() } }],
          },
        });

        if (!concept) continue;

        // Check student mastery
        const mastery = await prisma.studentConceptMastery.findUnique({
          where: {
            studentId_conceptId: {
              studentId,
              conceptId: concept.id,
            },
          },
        });

        // Gap detected if mastery < 70% or never studied
        if (!mastery || mastery.overallMasteryPercent < 70) {
          gaps.push({
            conceptId: concept.id,
            conceptName: concept.conceptName,
            currentMastery: mastery?.overallMasteryPercent || 0,
            lastStudied: mastery?.lastAssessed || null,
            yearsAgo: this.calculateYearsAgo(mastery?.lastAssessed),
            severity: this.calculateGapSeverity(mastery?.overallMasteryPercent || 0),
            recommendation: this.generateRecommendation(concept, mastery),
          });
        }
      }

      return {
        gaps,
        totalGaps: gaps.length,
        criticalGaps: gaps.filter((g) => g.severity === 'HIGH').length,
        moderateGaps: gaps.filter((g) => g.severity === 'MEDIUM').length,
      };
    } catch (error) {
      console.error('Error identifying knowledge gaps:', error);
      throw new Error('Failed to identify knowledge gaps');
    }
  }

  /**
   * Update node position in graph for custom layouts
   * @param studentId - Student UUID
   * @param conceptId - Concept UUID
   * @param x - X coordinate
   * @param y - Y coordinate
   */
  async updateNodePosition(studentId: string, conceptId: string, x: number, y: number) {
    try {
      await prisma.studentConceptMastery.update({
        where: {
          studentId_conceptId: {
            studentId,
            conceptId,
          },
        },
        data: {
          graphPositionX: x,
          graphPositionY: y,
        },
      });

      return { success: true, message: 'Position updated' };
    } catch (error) {
      console.error('Error updating node position:', error);
      throw new Error('Failed to update node position');
    }
  }

  /**
   * Get mastery timeline for a specific concept
   * @param studentId - Student UUID
   * @param conceptId - Concept UUID
   * @returns Timeline with historical mastery data
   */
  async getConceptMasteryTimeline(studentId: string, conceptId: string) {
    try {
      const mastery = await prisma.studentConceptMastery.findUnique({
        where: {
          studentId_conceptId: {
            studentId,
            conceptId,
          },
        },
        include: {
          concept: true,
          classMasteries: {
            include: { class: true },
            orderBy: { lastAssessedInClass: 'asc' },
          },
        },
      });

      if (!mastery) {
        return null;
      }

      return {
        conceptName: mastery.concept.conceptName,
        firstIntroduced: mastery.firstAssessed,
        currentMastery: mastery.overallMasteryPercent,
        trend: mastery.trend,
        history: mastery.masteryHistory,
        classProgression: mastery.classMasteries.map((cm) => ({
          className: cm.class.name,
          gradeLevel: cm.class.gradeLevel,
          schoolYear: cm.class.academicYear,
          masteryAtEnd: cm.masteryPercent,
          attemptsInClass: cm.attemptsInClass,
          correctInClass: cm.correctInClass,
        })),
      };
    } catch (error) {
      console.error('Error fetching concept timeline:', error);
      throw new Error('Failed to fetch concept timeline');
    }
  }

  /**
   * Update student concept mastery when assignment is graded
   * @param studentId - Student UUID
   * @param classId - Class UUID
   * @param conceptName - Concept name
   * @param isCorrect - Whether the answer was correct
   * @param assignmentId - Assignment UUID
   * @param grade - Grade received
   */
  async updateConceptMastery(
    studentId: string,
    classId: string,
    schoolId: string,
    conceptName: string,
    isCorrect: boolean,
    assignmentId: string,
    grade?: string
  ) {
    try {
      // Find or create concept in taxonomy
      let concept = await prisma.conceptTaxonomy.findFirst({
        where: {
          OR: [{ conceptName }, { aliases: { has: conceptName.toLowerCase() } }],
        },
      });

      if (!concept) {
        // Create new concept if it doesn't exist
        concept = await prisma.conceptTaxonomy.create({
          data: {
            conceptName,
            subject: 'Unknown', // Should be inferred from class
            aliases: [conceptName.toLowerCase()],
          },
        });
      }

      // Update or create student concept mastery
      const existingMastery = await prisma.studentConceptMastery.findUnique({
        where: {
          studentId_conceptId: {
            studentId,
            conceptId: concept.id,
          },
        },
      });

      const newTotalAttempts = (existingMastery?.totalAttempts || 0) + 1;
      const newCorrectAttempts = (existingMastery?.correctAttempts || 0) + (isCorrect ? 1 : 0);
      const newIncorrectAttempts = (existingMastery?.incorrectAttempts || 0) + (isCorrect ? 0 : 1);
      const newMasteryPercent = (newCorrectAttempts / newTotalAttempts) * 100;

      // Determine mastery level
      const newMasteryLevel = this.calculateMasteryLevel(newMasteryPercent);

      // Determine trend
      const trend = this.calculateTrend(
        existingMastery?.overallMasteryPercent || 0,
        newMasteryPercent
      );

      // Build history entry
      const historyEntry = {
        date: new Date().toISOString(),
        percent: newMasteryPercent,
        classId,
        assignmentId,
        grade,
        event: 'ASSIGNMENT_GRADED',
      };

      const updatedMastery = await prisma.studentConceptMastery.upsert({
        where: {
          studentId_conceptId: {
            studentId,
            conceptId: concept.id,
          },
        },
        update: {
          totalAttempts: newTotalAttempts,
          correctAttempts: newCorrectAttempts,
          incorrectAttempts: newIncorrectAttempts,
          overallMasteryPercent: newMasteryPercent,
          overallMasteryLevel: newMasteryLevel,
          trend,
          previousPercent: existingMastery?.overallMasteryPercent,
          lastAssessed: new Date(),
          masteryHistory: existingMastery?.masteryHistory
            ? [...(existingMastery.masteryHistory as any[]), historyEntry]
            : [historyEntry],
        },
        create: {
          studentId,
          schoolId,
          conceptId: concept.id,
          totalAttempts: 1,
          correctAttempts: isCorrect ? 1 : 0,
          incorrectAttempts: isCorrect ? 0 : 1,
          overallMasteryPercent: newMasteryPercent,
          overallMasteryLevel: newMasteryLevel,
          trend: 'STABLE',
          firstAssessed: new Date(),
          lastAssessed: new Date(),
          masteryHistory: [historyEntry],
        },
      });

      // Update or create class-specific mastery
      await prisma.classConceptMastery.upsert({
        where: {
          studentConceptMasteryId_classId: {
            studentConceptMasteryId: updatedMastery.id,
            classId,
          },
        },
        update: {
          attemptsInClass: { increment: 1 },
          correctInClass: { increment: isCorrect ? 1 : 0 },
          incorrectInClass: { increment: isCorrect ? 0 : 1 },
          masteryPercent: newMasteryPercent, // Update to current
          lastAssessedInClass: new Date(),
        },
        create: {
          studentConceptMasteryId: updatedMastery.id,
          classId,
          attemptsInClass: 1,
          correctInClass: isCorrect ? 1 : 0,
          incorrectInClass: isCorrect ? 0 : 1,
          masteryPercent: newMasteryPercent,
          firstAssessedInClass: new Date(),
          lastAssessedInClass: new Date(),
        },
      });

      // Check for milestone achievements
      await this.checkAndCreateMilestone(
        studentId,
        concept.id,
        existingMastery?.overallMasteryPercent || 0,
        newMasteryPercent,
        classId,
        assignmentId
      );

      // ========================================================================
      // REAL-TIME UPDATES: Emit WebSocket events to student's Atlas room
      // ========================================================================
      try {
        const {
          emitAtlasMasteryUpdate,
          emitAtlasConceptDiscovered,
        } = await import('./websocket.service');

        // If this is the first time encountering this concept
        if (!existingMastery) {
          emitAtlasConceptDiscovered(studentId, concept.id, concept.conceptName, concept.subject);
        }

        // Emit mastery update
        emitAtlasMasteryUpdate(
          studentId,
          concept.id,
          concept.conceptName,
          newMasteryPercent,
          newMasteryLevel,
          trend
        );
      } catch (wsError: any) {
        // Non-blocking: Log but don't fail mastery update
        console.error('⚠️ WebSocket emit failed (non-blocking):', wsError.message);
      }
      // ========================================================================

      return updatedMastery;
    } catch (error) {
      console.error('Error updating concept mastery:', error);
      throw new Error('Failed to update concept mastery');
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Format relationship type for display
   */
  private formatRelationshipLabel(type: string): string {
    const labels: Record<string, string> = {
      prerequisite: 'Prerequisite',
      builds_upon: 'Builds Upon',
      applied_in: 'Applied In',
      related: 'Related',
    };
    return labels[type] || type;
  }

  /**
   * Calculate years since last assessment
   */
  private calculateYearsAgo(date: Date | null): number | null {
    if (!date) return null;
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    return Math.floor(diff / (365 * 24 * 60 * 60 * 1000));
  }

  /**
   * Calculate gap severity based on mastery percentage
   */
  private calculateGapSeverity(masteryPercent: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (masteryPercent < 40) return 'HIGH';
    if (masteryPercent < 70) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Generate recommendation for gap remediation
   */
  private generateRecommendation(concept: any, mastery: any): string {
    if (!mastery) {
      return `Introduce ${concept.conceptName} before proceeding with advanced topics`;
    }
    if (mastery.overallMasteryPercent < 40) {
      return `Extensive review of ${concept.conceptName} needed - consider remediation assignments`;
    }
    if (mastery.overallMasteryPercent < 70) {
      return `Quick review of ${concept.conceptName} recommended before new material`;
    }
    return `Monitor ${concept.conceptName} performance`;
  }

  /**
   * Calculate mastery level from percentage
   */
  private calculateMasteryLevel(percent: number): MasteryLevel {
    if (percent >= 90) return 'MASTERED';
    if (percent >= 70) return 'PROFICIENT';
    if (percent >= 40) return 'DEVELOPING';
    if (percent > 0) return 'BEGINNING';
    return 'NOT_STARTED';
  }

  /**
   * Calculate trend direction
   */
  private calculateTrend(previousPercent: number, newPercent: number): TrendDirection {
    const diff = newPercent - previousPercent;
    if (diff > 5) return 'IMPROVING';
    if (diff < -5) return 'DECLINING';
    return 'STABLE';
  }

  /**
   * Check and create milestone if threshold crossed
   */
  private async checkAndCreateMilestone(
    studentId: string,
    conceptId: string,
    previousPercent: number,
    newPercent: number,
    classId: string,
    assignmentId: string
  ) {
    try {
      // Find or create learning journey
      const journey = await prisma.studentLearningJourney.upsert({
        where: { studentId },
        update: {},
        create: {
          studentId,
          schoolId: (await prisma.user.findUnique({ where: { id: studentId } }))!.schoolId,
        },
      });

      // Check for mastery milestone (crossed 90% threshold)
      if (previousPercent < 90 && newPercent >= 90) {
        await prisma.conceptMilestone.create({
          data: {
            journeyId: journey.id,
            conceptId,
            milestoneType: 'MASTERED',
            achievedDate: new Date(),
            achievedInClassId: classId,
            assignmentId,
            contextData: {
              previousMastery: previousPercent,
              newMastery: newPercent,
            },
          },
        });

        // Emit milestone achievement event
        try {
          const { emitAtlasMilestoneAchieved } = await import('./websocket.service');
          const concept = await prisma.conceptTaxonomy.findUnique({ where: { id: conceptId } });
          if (concept) {
            emitAtlasMilestoneAchieved(studentId, conceptId, concept.conceptName, 'MASTERED', classId);
          }
        } catch (wsError: any) {
          console.error('⚠️ WebSocket milestone emit failed:', wsError.message);
        }
      }

      // Check for first introduction (first time attempting)
      if (previousPercent === 0 && newPercent > 0) {
        await prisma.conceptMilestone.create({
          data: {
            journeyId: journey.id,
            conceptId,
            milestoneType: 'FIRST_INTRODUCED',
            achievedDate: new Date(),
            achievedInClassId: classId,
            assignmentId,
            contextData: {
              initialMastery: newPercent,
            },
          },
        });

        // Emit milestone achievement event
        try {
          const { emitAtlasMilestoneAchieved } = await import('./websocket.service');
          const concept = await prisma.conceptTaxonomy.findUnique({ where: { id: conceptId } });
          if (concept) {
            emitAtlasMilestoneAchieved(studentId, conceptId, concept.conceptName, 'FIRST_INTRODUCED', classId);
          }
        } catch (wsError: any) {
          console.error('⚠️ WebSocket milestone emit failed:', wsError.message);
        }
      }
    } catch (error) {
      console.error('Error creating milestone:', error);
      // Don't throw - milestone creation is non-critical
    }
  }
}

export default new KnowledgeGraphService();
