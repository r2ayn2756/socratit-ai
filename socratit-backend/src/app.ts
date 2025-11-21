// ============================================================================
// APP CONFIGURATION
// Express application setup with middleware
// ============================================================================

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { apiLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import classRoutes from './routes/class.routes';
import enrollmentRoutes from './routes/enrollment.routes';
import assignmentRoutes from './routes/assignment.routes';
import submissionRoutes from './routes/submission.routes';
import gradeRoutes from './routes/grade.routes';
import analyticsRoutes from './routes/analytics.routes';
import messageRoutes from './routes/message.routes';
import notificationRoutes from './routes/notification.routes';
import progressRoutes from './routes/progress.routes';
import curriculumRoutes from './routes/curriculum.routes';
import curriculumScheduleRoutes from './routes/curriculumSchedule.routes';
import curriculumUnitRoutes from './routes/curriculumUnit.routes';
import uploadRoutes from './routes/upload.routes';
import aiTARoutes from './routes/aiTA.routes';
import lessonRoutes from './routes/lesson.routes';
import seedRoutes from './routes/seed.routes';
import knowledgeGraphRoutes from './routes/knowledgeGraph.routes';

// Create Express application
const app: Application = express();

// Trust proxy - Required for Railway/Heroku and rate limiting to work correctly
// This allows Express to trust the X-Forwarded-For header from the proxy
app.set('trust proxy', true);

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Security middleware
app.use(helmet());

// CORS configuration - support custom domain + Vercel URLs (production + preview)
const allowedOrigins = [
  env.FRONTEND_URL,
  'https://socratit.com',              // Custom domain (production)
  'https://www.socratit.com',          // www subdomain
  'https://dydactyc.com',              // Alternative custom domain
  'https://www.dydactyc.com',          // www subdomain
  'https://socratit-ai.vercel.app',    // Original Vercel domain
  'https://socratit-ai-git-main-r2ayn2756s-projects.vercel.app',
  'http://localhost:3000',             // Local development
  'http://localhost:5173',             // Vite dev server
];

// Also allow any Vercel preview URLs for testing
const isVercelPreview = (origin: string) => {
  return origin.endsWith('.vercel.app') && origin.includes('r2ayn2756');
};

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, or same-origin)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is in allowed list or is a Vercel preview URL
    if (allowedOrigins.includes(origin) || isVercelPreview(origin)) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Body parsing middleware
app.use(express.json({
  limit: '10mb',
  strict: false,  // Allow any JSON value
  type: 'application/json'
}));
app.use(express.urlencoded({
  extended: true,
  limit: '10mb',
  parameterLimit: 50000  // Increase from default 1000
}));

// Logging middleware (only in development)
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting middleware (applied globally)
app.use(apiLimiter);

// Request logging for debugging
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// ROUTES
// ============================================================================

// Health check endpoint (basic liveness probe)
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// Readiness check endpoint (includes database connectivity)
app.get('/ready', async (_req, res) => {
  try {
    const { prisma } = await import('./config/database');
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      success: true,
      message: 'Server is ready',
      timestamp: new Date().toISOString(),
      database: 'connected',
      environment: env.NODE_ENV,
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Server is not ready',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// API version prefix
const API_PREFIX = `/api/${env.API_VERSION}`;

// Mount routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/classes`, classRoutes);
app.use(`${API_PREFIX}/enrollments`, enrollmentRoutes);
app.use(`${API_PREFIX}/assignments`, assignmentRoutes);
app.use(`${API_PREFIX}/submissions`, submissionRoutes);
app.use(`${API_PREFIX}/grades`, gradeRoutes);
app.use(`${API_PREFIX}/analytics`, analyticsRoutes);
app.use(`${API_PREFIX}/messages`, messageRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/progress`, progressRoutes);
app.use(`${API_PREFIX}/curriculum`, curriculumRoutes);
app.use(`${API_PREFIX}/curriculum-schedules`, curriculumScheduleRoutes);
app.use(`${API_PREFIX}/curriculum-units`, curriculumUnitRoutes);
app.use(`${API_PREFIX}/upload`, uploadRoutes);
app.use(`${API_PREFIX}/ai-ta`, aiTARoutes);
app.use(`${API_PREFIX}/knowledge-graph`, knowledgeGraphRoutes); // Atlas - Multi-year knowledge tracking
app.use(`${API_PREFIX}`, lessonRoutes); // Lesson routes (includes /classes/:classId/lessons and /lessons/:lessonId)
app.use(`${API_PREFIX}/seed`, seedRoutes); // One-time database seed endpoint

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
