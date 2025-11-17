# Atlas Phase 2: Backend Services & API - COMPLETE ✅

## Summary

Phase 2 of the Atlas multi-year knowledge tracking system has been successfully implemented. All backend services, AI integration, and API endpoints have been created and registered.

---

## What Was Implemented

### 1. Knowledge Graph Service

**File**: `socratit-backend/src/services/knowledgeGraph.service.ts`

**Purpose**: Core service for managing student knowledge graphs and concept relationships

**Key Methods**:

- **`getStudentKnowledgeGraph(studentId, schoolId, options)`**
  - Returns complete knowledge graph with nodes (concepts) and edges (relationships)
  - Supports filtering by subject and mastery level
  - Optional history timeline inclusion
  - Aggregates data across all classes student has taken

- **`getPrerequisiteChain(conceptId)`**
  - Recursively builds prerequisite dependency tree
  - Returns chain from fundamental concepts to advanced
  - Useful for identifying learning paths

- **`identifyKnowledgeGaps(studentId, classId)`**
  - Analyzes required concepts for a class
  - Detects missing or weak prerequisites from previous years
  - Returns gaps with severity ratings (HIGH, MEDIUM, LOW)
  - Includes recommendations for remediation

- **`updateNodePosition(studentId, conceptId, x, y)`**
  - Saves custom graph layout positions
  - Enables personalized visualizations

- **`getConceptMasteryTimeline(studentId, conceptId)`**
  - Returns historical progression for a single concept
  - Shows mastery evolution across multiple years/classes
  - Includes JSON timeline with all assessment events

- **`updateConceptMastery(studentId, classId, schoolId, conceptName, isCorrect, assignmentId, grade)`**
  - Called when assignments are graded
  - Updates both StudentConceptMastery (aggregate) and ClassConceptMastery (class-specific)
  - Automatically detects and creates milestones
  - Maintains JSON history timeline

**Private Helper Methods**:
- `calculateMasteryLevel()` - Converts percentage to enum (MASTERED, PROFICIENT, etc.)
- `calculateTrend()` - Determines IMPROVING/DECLINING/STABLE
- `calculateGapSeverity()` - Evaluates prerequisite gap importance
- `checkAndCreateMilestone()` - Auto-creates achievement records

---

### 2. AI Knowledge Graph Service

**File**: `socratit-backend/src/services/aiKnowledgeGraph.service.ts`

**Purpose**: Uses LLM to analyze curriculum and build semantic concept relationships

**Key Methods**:

- **`generateConceptGraphFromCurriculum(curriculumText, subject, gradeLevel)`**
  - Sends curriculum text to AI for analysis
  - AI extracts concepts with descriptions, aliases, difficulty ratings
  - AI identifies relationships: prerequisite, builds_upon, applied_in, related
  - Creates ConceptTaxonomy and ConceptRelationship records in database
  - Returns preview with generated concepts and relationships

- **`findCrossSubjectConnections(conceptName)`**
  - Uses AI to discover interdisciplinary links
  - Example: "Quadratic Equations" (Math) → "Projectile Motion" (Physics)
  - Creates cross-subject ConceptRelationship records
  - Enables curriculum integration

- **`predictFutureStruggles(studentId)`**
  - Analyzes student's struggling concepts
  - Uses AI to predict future difficulties based on prerequisite gaps
  - Includes probability scores and recommendations
  - Stores predictions in StudentLearningJourney

- **`extractConceptsFromConversation(conversationText, subject?)`**
  - Parses AI tutor chat logs
  - Identifies concepts discussed
  - Enables linking conversations to knowledge graph

- **`buildPrerequisiteGraph(conceptNames)`**
  - Takes array of concept names
  - Uses AI to determine learning sequence
  - Creates prerequisite relationships automatically

**AI Prompt Engineering**:
- Temperature: 0.2-0.5 for consistency
- Response format: JSON objects
- Detailed instructions with examples
- Validation and error handling

---

### 3. API Routes

**File**: `socratit-backend/src/routes/knowledgeGraph.routes.ts`

**Base URL**: `/api/v1/knowledge-graph`

**Endpoints Implemented**:

#### Student Knowledge Graph Endpoints

**GET `/:studentId`**
- Get student's complete knowledge graph
- Auth: Student (own data), Teacher, Admin
- Query params: `filterSubject`, `filterMasteryLevel`, `includeHistory`
- Returns: `{ nodes[], edges[], metadata }`

**GET `/timeline/:studentId/:conceptId`**
- Get mastery timeline for specific concept
- Auth: Student (own), Teacher, Admin
- Returns: Historical progression with class-by-class breakdown

**PATCH `/node-position`**
- Update node position for custom layouts
- Auth: Student (own graph), Teacher
- Body: `{ studentId, conceptId, x, y }`

#### Concept Analysis Endpoints

**GET `/concept/:conceptId/prerequisites`**
- Get complete prerequisite chain (recursive)
- Auth: Any authenticated user
- Returns: Dependency tree with depth levels

**GET `/gaps/:studentId/:classId`**
- Identify knowledge gaps for student in class
- Auth: Teacher, Admin
- Returns: Array of gaps with severity and recommendations

#### AI-Powered Endpoints

**POST `/generate`**
- AI-generate concept graph from curriculum text
- Auth: Teacher, Admin
- Body: `{ curriculumText, subject, gradeLevel, classId? }`
- Returns: Generated concepts and relationships

**POST `/cross-subject-connections`**
- Find cross-subject connections using AI
- Auth: Teacher, Admin
- Body: `{ conceptName }`
- Returns: Interdisciplinary connections

**POST `/predict-struggles`**
- Predict future struggles using AI
- Auth: Teacher, Admin
- Body: `{ studentId }`
- Returns: Predictions with probabilities

**POST `/extract-concepts`**
- Extract concepts from conversation text
- Auth: Any authenticated user
- Body: `{ conversationText, subject? }`
- Returns: Array of concept names

**POST `/build-prerequisites`**
- Build prerequisite graph using AI
- Auth: Teacher, Admin
- Body: `{ conceptNames[] }`
- Returns: Dependency structure

**Authorization Patterns**:
- Students: Can only view own data
- Teachers: Can view students in their classes, manage concepts
- Admins: Full access

---

### 4. Route Registration

**File**: `socratit-backend/src/app.ts`

**Changes**:
```typescript
// Line 31: Import
import knowledgeGraphRoutes from './routes/knowledgeGraph.routes';

// Line 184: Register
app.use(`${API_PREFIX}/knowledge-graph`, knowledgeGraphRoutes);
```

All knowledge graph endpoints are now accessible at:
- Local: `http://localhost:3000/api/v1/knowledge-graph/*`
- Production: `https://api.socratit.com/api/v1/knowledge-graph/*`

---

## Integration with Existing Systems

### Assignment Grading Integration

When an assignment is graded, update concept mastery:

```typescript
// In submission grading service
import knowledgeGraphService from './services/knowledgeGraph.service';

// After calculating correctness
await knowledgeGraphService.updateConceptMastery(
  studentId,
  classId,
  schoolId,
  question.concept,  // e.g., "Quadratic Equations"
  isCorrect,
  assignmentId,
  submission.grade
);
```

This automatically:
1. Updates StudentConceptMastery (overall, lifelong)
2. Updates ClassConceptMastery (this class only)
3. Creates milestone if threshold crossed (e.g., reached 90% = MASTERED)
4. Maintains JSON history timeline

### AI Tutor Integration

Link AI conversations to knowledge graph:

```typescript
// In AI tutor service
import aiKnowledgeGraphService from './services/aiKnowledgeGraph.service';

// After conversation completes
const concepts = await aiKnowledgeGraphService.extractConceptsFromConversation(
  conversationText,
  subject
);

// Store concepts in AIConversation.conceptTags
await prisma.aIConversation.update({
  where: { id: conversationId },
  data: {
    conceptTags: concepts
  }
});

// Emit WebSocket event to highlight concepts in Atlas
io.to(`knowledge-graph-${studentId}`).emit('concept-discussed', {
  conceptIds: concepts
});
```

### Curriculum Upload Integration

When teacher uploads curriculum:

```typescript
// In curriculum upload handler
import aiKnowledgeGraphService from './services/aiKnowledgeGraph.service';

// After curriculum is parsed
const result = await aiKnowledgeGraphService.generateConceptGraphFromCurriculum(
  curriculumText,
  class.subject,
  class.gradeLevel
);

// Show teacher the generated graph for review/editing
```

---

## API Usage Examples

### Example 1: Get Student's Knowledge Graph

```bash
curl -X GET \
  http://localhost:3000/api/v1/knowledge-graph/student-uuid-123 \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "nodes": [
      {
        "id": "concept-uuid-1",
        "label": "Quadratic Equations",
        "subject": "Mathematics",
        "mastery": 87.5,
        "masteryLevel": "PROFICIENT",
        "trend": "IMPROVING",
        "firstLearned": "2022-09-15T10:00:00Z",
        "lastPracticed": "2024-11-16T14:30:00Z",
        "position": { "x": 250, "y": 100 },
        "classHistory": [
          {
            "className": "Algebra I",
            "gradeLevel": "9th Grade",
            "schoolYear": "2022-2023",
            "masteryInClass": 75
          }
        ],
        "attemptStats": {
          "total": 45,
          "correct": 39,
          "incorrect": 6
        }
      }
    ],
    "edges": [
      {
        "id": "edge-uuid-1",
        "source": "linear-equations-uuid",
        "target": "quadratic-equations-uuid",
        "type": "prerequisite",
        "strength": 0.95,
        "label": "Prerequisite"
      }
    ],
    "metadata": {
      "totalConcepts": 127,
      "masteredConcepts": 89,
      "inProgressConcepts": 28,
      "notStartedConcepts": 10,
      "overallProgress": 70.1
    }
  }
}
```

### Example 2: Generate Concept Graph from Curriculum

```bash
curl -X POST \
  http://localhost:3000/api/v1/knowledge-graph/generate \
  -H 'Authorization: Bearer <teacher-token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "curriculumText": "Unit 3: Quadratic Functions\n\nStudents will learn to solve quadratic equations using factoring, completing the square, and the quadratic formula. Prerequisites include understanding of linear equations.",
    "subject": "Mathematics",
    "gradeLevel": "9-10"
  }'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "conceptsGenerated": 5,
    "relationshipsGenerated": 8,
    "concepts": [
      {
        "id": "concept-uuid-1",
        "name": "Quadratic Equations",
        "confidence": 0.8
      },
      {
        "id": "concept-uuid-2",
        "name": "Factoring",
        "confidence": 0.8
      }
    ],
    "preview": {
      "nodes": ["Quadratic Equations", "Factoring", "Completing the Square", "Quadratic Formula", "Linear Equations"],
      "edges": [
        { "from": "Linear Equations", "to": "Quadratic Equations", "type": "prerequisite" }
      ]
    }
  },
  "message": "Generated 5 concepts and 8 relationships"
}
```

### Example 3: Identify Knowledge Gaps

```bash
curl -X GET \
  http://localhost:3000/api/v1/knowledge-graph/gaps/student-uuid/class-uuid \
  -H 'Authorization: Bearer <teacher-token>'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "studentName": "John Doe",
    "className": "Algebra II",
    "gaps": [
      {
        "conceptId": "factoring-uuid",
        "conceptName": "Factoring Polynomials",
        "currentMastery": 45,
        "lastStudied": "2022-05-15T10:00:00Z",
        "yearsAgo": 2,
        "severity": "HIGH",
        "recommendation": "Extensive review of Factoring Polynomials needed - consider remediation assignments"
      }
    ],
    "totalGaps": 1,
    "criticalGaps": 1,
    "moderateGaps": 0
  }
}
```

---

## Testing the API

### Manual Testing with Prisma Studio

1. **Run migration** (if not done yet):
   ```bash
   cd socratit-backend
   npx prisma migrate dev --name add_atlas_knowledge_graph
   ```

2. **Start Prisma Studio**:
   ```bash
   npx prisma studio
   ```

3. **Create test data**:
   - Create a ConceptTaxonomy record: "Quadratic Equations"
   - Create a StudentConceptMastery record linking student to concept
   - Create ConceptRelationship: Linear Equations → Quadratic Equations

4. **Test endpoints** using Postman or curl

### Integration Tests

Create `socratit-backend/tests/knowledgeGraph.test.ts`:

```typescript
import request from 'supertest';
import app from '../src/app';

describe('Knowledge Graph API', () => {
  let authToken: string;
  let studentId: string;

  beforeAll(async () => {
    // Login and get token
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student@test.com', password: 'password' });
    authToken = res.body.token;
    studentId = res.body.user.id;
  });

  test('GET /knowledge-graph/:studentId should return graph', async () => {
    const res = await request(app)
      .get(`/api/v1/knowledge-graph/${studentId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('nodes');
    expect(res.body.data).toHaveProperty('edges');
    expect(res.body.data).toHaveProperty('metadata');
  });

  test('POST /knowledge-graph/generate should create concepts', async () => {
    const res = await request(app)
      .post('/api/v1/knowledge-graph/generate')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        curriculumText: 'Test curriculum',
        subject: 'Mathematics',
        gradeLevel: '9-10'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.conceptsGenerated).toBeGreaterThan(0);
  });
});
```

---

## Next Steps: Phase 3 - Frontend Implementation

### Install Dependencies

```bash
cd socratit-wireframes
npm install reactflow dagre
```

### Create Frontend Files

1. **`src/pages/student/Atlas.tsx`** - Main Atlas page
2. **`src/components/atlas/KnowledgeGraphCanvas.tsx`** - React Flow container
3. **`src/components/atlas/ConceptNode.tsx`** - Custom node component
4. **`src/components/atlas/ConceptDetailPanel.tsx`** - Sidebar panel
5. **`src/components/atlas/AtlasControls.tsx`** - Filters and controls
6. **`src/components/atlas/KnowledgeStats.tsx`** - Progress statistics
7. **`src/services/knowledgeGraph.service.ts`** - API client

### Add Navigation

**`src/components/layout/Sidebar.tsx`**:
```typescript
import { Map } from 'lucide-react';

student: [
  // ... existing items
  { label: 'Atlas', icon: Map, path: '/student/atlas' },
  // ... more items
]
```

**`src/App.tsx`**:
```typescript
import Atlas from './pages/student/Atlas';

<Route path="/student/atlas" element={<Atlas />} />
```

---

## Environment Variables

Ensure these are set in `.env`:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/socratit_dev

# AI Provider (OpenAI, Gemini, or Claude)
OPENAI_API_KEY=your-key
GOOGLE_GEMINI_API_KEY=your-key
ANTHROPIC_API_KEY=your-key

# Frontend URL for CORS
FRONTEND_URL=http://localhost:5173
```

---

## Summary

✅ **Knowledge Graph Service** - Complete with mastery tracking, gap detection, timeline
✅ **AI Knowledge Graph Service** - LLM-powered concept extraction and relationship building
✅ **API Routes** - 10 endpoints for student graphs, AI generation, predictions
✅ **Route Registration** - Integrated into Express app
✅ **Documentation** - API examples and integration patterns

**Backend is 100% complete and ready for frontend integration!**

**Next Action**: Begin Phase 3 - Frontend Components

---

*Atlas Phase 2 completed on 2024-11-16*
