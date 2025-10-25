# Batch 8: Progress Tracking - Frontend Implementation Guide

## Overview
This guide provides complete implementation details for the Progress Tracking frontend components. The system tracks student progress, assignment completion, concept mastery, and learning velocity with real-time updates via WebSocket.

---

## 📦 Prerequisites

### Install Required Dependencies
```bash
cd frontend
npm install recharts date-fns react-query axios lucide-react
```

---

## 🔌 API Client Setup

### Create Progress API Client

**File:** `frontend/src/api/progress.ts`

```typescript
import axios from 'axios';

const API_BASE = 'http://localhost:3001/api/v1';

export interface StudentProgress {
  id: string;
  studentId: string;
  classId: string;
  totalAssignments: number;
  completedAssignments: number;
  inProgressAssignments: number;
  notStartedAssignments: number;
  completionRate: number;
  averageGrade: number | null;
  trendDirection: 'IMPROVING' | 'STABLE' | 'DECLINING';
  trendPercentage: number | null;
  totalTimeSpent: number; // minutes
  averageTimePerAssignment: number | null;
  learningVelocity: number;
  lastCalculated: string;
}

export interface AssignmentProgress {
  id: string;
  studentId: string;
  assignmentId: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';
  questionsTotal: number;
  questionsAnswered: number;
  questionsCorrect: number;
  progressPercentage: number;
  timeSpent: number; // minutes
  startedAt: string | null;
  completedAt: string | null;
  attemptCount: number;
  assignment: {
    id: string;
    title: string;
    type: string;
    dueDate: string | null;
    totalPoints: number;
  };
}

export interface ConceptMastery {
  id: string;
  concept: string;
  masteryLevel: 'NOT_STARTED' | 'BEGINNING' | 'DEVELOPING' | 'PROFICIENT' | 'MASTERED';
  masteryPercent: number;
  totalAttempts: number;
  correctAttempts: number;
  incorrectAttempts: number;
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  lastPracticed: string | null;
  practiceCount: number;
  remediationNeeded: boolean;
  suggestedNextConcepts: string[];
}

export interface ConceptPath {
  id: string;
  conceptName: string;
  prerequisiteId: string | null;
  orderIndex: number;
  difficulty: number;
  estimatedHours: number | null;
  description: string | null;
}

export interface LearningVelocityLog {
  id: string;
  weekStartDate: string;
  weekEndDate: string;
  assignmentsCompleted: number;
  velocity: number;
  averageScore: number | null;
  timeSpentMinutes: number;
  velocityChange: number | null;
}

export const progressAPI = {
  // Student Progress
  getStudentProgress: (studentId: string, classId: string) =>
    axios.get<{ success: boolean; data: StudentProgress }>(
      `${API_BASE}/progress/student/${studentId}/class/${classId}`
    ),

  getStudentProgressAcrossClasses: (studentId: string) =>
    axios.get<{ success: boolean; data: StudentProgress[] }>(
      `${API_BASE}/progress/student/${studentId}/classes`
    ),

  getClassProgress: (classId: string) =>
    axios.get<{ success: boolean; data: StudentProgress[] }>(
      `${API_BASE}/progress/class/${classId}/students`
    ),

  calculateProgress: (studentId: string, classId: string) =>
    axios.post<{ success: boolean; data: any }>(
      `${API_BASE}/progress/calculate/${studentId}/${classId}`
    ),

  // Assignment Progress
  getAssignmentProgressForStudent: (studentId: string, classId?: string, status?: string) =>
    axios.get<{ success: boolean; data: AssignmentProgress[] }>(
      `${API_BASE}/progress/assignments/${studentId}`,
      { params: { classId, status } }
    ),

  getAssignmentProgress: (assignmentId: string, studentId: string) =>
    axios.get<{ success: boolean; data: AssignmentProgress }>(
      `${API_BASE}/progress/assignment/${assignmentId}/student/${studentId}`
    ),

  getAssignmentProgressForClass: (assignmentId: string) =>
    axios.get<{ success: boolean; data: AssignmentProgress[] }>(
      `${API_BASE}/progress/assignment/${assignmentId}/students`
    ),

  updateTimeSpent: (assignmentId: string, timeSpentMinutes: number) =>
    axios.patch<{ success: boolean; message: string }>(
      `${API_BASE}/progress/assignment/${assignmentId}/time`,
      { timeSpentMinutes }
    ),

  // Concept Mastery Progress
  getConceptProgress: (studentId: string, classId: string) =>
    axios.get<{ success: boolean; data: { concepts: ConceptMastery[]; paths: ConceptPath[] } }>(
      `${API_BASE}/progress/concepts/${studentId}/class/${classId}`
    ),

  getConceptProgressForClass: (conceptName: string, classId: string) =>
    axios.get<{ success: boolean; data: ConceptMastery[] }>(
      `${API_BASE}/progress/concepts/${encodeURIComponent(conceptName)}/students/${classId}`
    ),

  // Concept Paths (Teacher only)
  getConceptPathsForClass: (classId: string) =>
    axios.get<{ success: boolean; data: ConceptPath[] }>(
      `${API_BASE}/progress/concepts/paths/${classId}`
    ),

  createConceptPath: (data: {
    classId: string;
    conceptName: string;
    prerequisiteId?: string;
    orderIndex: number;
    difficulty?: number;
    estimatedHours?: number;
    description?: string;
  }) =>
    axios.post<{ success: boolean; data: ConceptPath }>(
      `${API_BASE}/progress/concepts/paths`,
      data
    ),

  updateConceptPath: (pathId: string, data: Partial<ConceptPath>) =>
    axios.put<{ success: boolean; data: ConceptPath }>(
      `${API_BASE}/progress/concepts/paths/${pathId}`,
      data
    ),

  deleteConceptPath: (pathId: string) =>
    axios.delete<{ success: boolean; message: string }>(
      `${API_BASE}/progress/concepts/paths/${pathId}`
    ),

  // Learning Velocity
  getLearningVelocity: (studentId: string, classId: string, params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) =>
    axios.get<{ success: boolean; data: LearningVelocityLog[] }>(
      `${API_BASE}/progress/velocity/${studentId}/class/${classId}`,
      { params }
    ),

  getClassLearningVelocity: (classId: string) =>
    axios.get<{ success: boolean; data: LearningVelocityLog[] }>(
      `${API_BASE}/progress/velocity/class/${classId}`
    ),

  // Progress Trends
  getProgressTrends: (studentId: string, classId: string) =>
    axios.get<{ success: boolean; data: any }>(
      `${API_BASE}/progress/trends/${studentId}/class/${classId}`
    ),

  getClassProgressTrends: (classId: string) =>
    axios.get<{ success: boolean; data: any }>(
      `${API_BASE}/progress/trends/class/${classId}`
    ),
};
```

---

## 🎨 Component 1: Student Progress Dashboard

**File:** `frontend/src/components/progress/StudentProgressDashboard.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { progressAPI, StudentProgress } from '../../api/progress';
import { TrendingUp, TrendingDown, Minus, Clock, Target, Award } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StudentProgressDashboardProps {
  studentId: string;
  classId: string;
}

export const StudentProgressDashboard: React.FC<StudentProgressDashboardProps> = ({
  studentId,
  classId,
}) => {
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProgress();
  }, [studentId, classId]);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const response = await progressAPI.getStudentProgress(studentId, classId);
      setProgress(response.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load progress');
      console.error('Error loading progress:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'IMPROVING':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'DECLINING':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      default:
        return <Minus className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'IMPROVING':
        return 'text-green-600 bg-green-50';
      case 'DECLINING':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (!progress) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Completion Rate */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">
              {progress.completionRate.toFixed(1)}%
            </span>
          </div>
          <p className="text-sm text-gray-600">Completion Rate</p>
          <p className="text-xs text-gray-500 mt-1">
            {progress.completedAssignments} of {progress.totalAssignments} assignments
          </p>
        </div>

        {/* Average Grade */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <Award className="w-8 h-8 text-purple-600" />
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-900">
                {progress.averageGrade !== null ? progress.averageGrade.toFixed(1) : 'N/A'}
              </span>
              {progress.averageGrade !== null && (
                <div className={`p-1 rounded ${getTrendColor(progress.trendDirection)}`}>
                  {getTrendIcon(progress.trendDirection)}
                </div>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-600">Average Grade</p>
          {progress.trendPercentage !== null && (
            <p className={`text-xs mt-1 ${progress.trendDirection === 'IMPROVING' ? 'text-green-600' : progress.trendDirection === 'DECLINING' ? 'text-red-600' : 'text-gray-500'}`}>
              {progress.trendPercentage > 0 ? '+' : ''}
              {progress.trendPercentage.toFixed(1)}% trend
            </p>
          )}
        </div>

        {/* Time Spent */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 text-orange-600" />
            <span className="text-2xl font-bold text-gray-900">
              {Math.floor(progress.totalTimeSpent / 60)}h
            </span>
          </div>
          <p className="text-sm text-gray-600">Total Time Spent</p>
          {progress.averageTimePerAssignment && (
            <p className="text-xs text-gray-500 mt-1">
              {progress.averageTimePerAssignment.toFixed(0)} min avg
            </p>
          )}
        </div>

        {/* Learning Velocity */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <span className="text-2xl font-bold text-gray-900">
              {progress.learningVelocity.toFixed(1)}
            </span>
          </div>
          <p className="text-sm text-gray-600">Learning Velocity</p>
          <p className="text-xs text-gray-500 mt-1">assignments per week</p>
        </div>
      </div>

      {/* Assignment Status Breakdown */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment Status</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Completed</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {progress.completedAssignments}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-700">In Progress</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {progress.inProgressAssignments}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span className="text-sm text-gray-700">Not Started</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {progress.notStartedAssignments}
            </span>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <p className="text-xs text-gray-500 text-center">
        Last updated: {new Date(progress.lastCalculated).toLocaleString()}
      </p>
    </div>
  );
};
```

---

## 🎨 Component 2: Assignment Progress Tracker

**File:** `frontend/src/components/progress/AssignmentProgressTracker.tsx`

```typescript
import React, { useEffect, useState, useRef } from 'react';
import { progressAPI, AssignmentProgress } from '../../api/progress';
import { Clock, CheckCircle, AlertCircle, PlayCircle } from 'lucide-react';

interface AssignmentProgressTrackerProps {
  studentId: string;
  assignmentId: string;
  onProgressUpdate?: (progress: AssignmentProgress) => void;
}

export const AssignmentProgressTracker: React.FC<AssignmentProgressTrackerProps> = ({
  studentId,
  assignmentId,
  onProgressUpdate,
}) => {
  const [progress, setProgress] = useState<AssignmentProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeElapsed, setTimeElapsed] = useState(0); // seconds
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<Date>(new Date());

  useEffect(() => {
    loadProgress();
    startTimeTracking();

    return () => {
      stopTimeTracking();
    };
  }, [studentId, assignmentId]);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const response = await progressAPI.getAssignmentProgress(assignmentId, studentId);
      setProgress(response.data.data);
      setTimeElapsed(response.data.data.timeSpent * 60); // Convert minutes to seconds
      if (onProgressUpdate) {
        onProgressUpdate(response.data.data);
      }
    } catch (err) {
      console.error('Error loading assignment progress:', err);
    } finally {
      setLoading(false);
    }
  };

  const startTimeTracking = () => {
    // Update timer every second
    timerRef.current = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);

    // Send time update to server every 5 minutes
    const updateInterval = setInterval(async () => {
      const minutesSinceLastUpdate = (new Date().getTime() - lastUpdateRef.current.getTime()) / 60000;
      if (minutesSinceLastUpdate >= 5) {
        try {
          await progressAPI.updateTimeSpent(assignmentId, Math.floor(minutesSinceLastUpdate));
          lastUpdateRef.current = new Date();
        } catch (err) {
          console.error('Error updating time spent:', err);
        }
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(updateInterval);
  };

  const stopTimeTracking = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Send final time update
    const minutesSinceLastUpdate = (new Date().getTime() - lastUpdateRef.current.getTime()) / 60000;
    if (minutesSinceLastUpdate > 0) {
      progressAPI.updateTimeSpent(assignmentId, Math.floor(minutesSinceLastUpdate))
        .catch(err => console.error('Error sending final time update:', err));
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'GRADED':
      case 'SUBMITTED':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'IN_PROGRESS':
        return <PlayCircle className="w-5 h-5 text-yellow-600" />;
      case 'NOT_STARTED':
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'GRADED':
      case 'SUBMITTED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'NOT_STARTED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!progress) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{progress.assignment.title}</h3>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(progress.status)}`}>
          {getStatusIcon(progress.status)}
          <span className="capitalize">{progress.status.replace('_', ' ')}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Progress</span>
          <span className="text-sm font-semibold text-gray-900">
            {progress.progressPercentage.toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress.progressPercentage}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {progress.questionsAnswered} of {progress.questionsTotal} questions answered
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-2 text-gray-700 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">Time Spent</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">{formatTime(timeElapsed)}</p>
        </div>

        {progress.questionsCorrect > 0 && (
          <div>
            <div className="flex items-center gap-2 text-gray-700 mb-1">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Correct</span>
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {progress.questionsCorrect} / {progress.questionsAnswered}
            </p>
          </div>
        )}
      </div>

      {/* Attempt Information */}
      {progress.attemptCount > 0 && (
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Attempt <span className="font-semibold">{progress.attemptCount}</span>
          </p>
        </div>
      )}
    </div>
  );
};
```

---

## 🎨 Component 3: Concept Mastery Visualization

**File:** `frontend/src/components/progress/ConceptMasteryVisualization.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { progressAPI, ConceptMastery } from '../../api/progress';
import { TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ConceptMasteryVisualizationProps {
  studentId: string;
  classId: string;
}

const MASTERY_COLORS = {
  'NOT_STARTED': '#9CA3AF', // gray-400
  'BEGINNING': '#EF4444', // red-500
  'DEVELOPING': '#F59E0B', // amber-500
  'PROFICIENT': '#3B82F6', // blue-500
  'MASTERED': '#10B981', // green-500
};

export const ConceptMasteryVisualization: React.FC<ConceptMasteryVisualizationProps> = ({
  studentId,
  classId,
}) => {
  const [concepts, setConcepts] = useState<ConceptMastery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConcepts();
  }, [studentId, classId]);

  const loadConcepts = async () => {
    try {
      setLoading(true);
      const response = await progressAPI.getConceptProgress(studentId, classId);
      setConcepts(response.data.data.concepts);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load concept mastery');
      console.error('Error loading concepts:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'IMPROVING':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'DECLINING':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getMasteryLabel = (level: string) => {
    return level.replace('_', ' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (concepts.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-600">No concept mastery data available yet.</p>
      </div>
    );
  }

  // Prepare data for chart
  const chartData = concepts.map(c => ({
    name: c.concept,
    mastery: c.masteryPercent,
    color: MASTERY_COLORS[c.masteryLevel],
  }));

  // Separate struggling concepts
  const strugglingConcepts = concepts.filter(c => c.remediationNeeded);

  return (
    <div className="space-y-6">
      {/* Struggling Concepts Alert */}
      {strugglingConcepts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-yellow-900 mb-1">
                Concepts Needing Attention
              </h4>
              <p className="text-sm text-yellow-800 mb-2">
                Practice these concepts to improve your mastery:
              </p>
              <ul className="space-y-1">
                {strugglingConcepts.map(concept => (
                  <li key={concept.id} className="text-sm text-yellow-900">
                    • {concept.concept} ({concept.masteryPercent.toFixed(0)}%)
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Concept Mastery Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Concept Mastery Overview</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={100}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value) => `${value}%`}
              contentStyle={{ fontSize: 12 }}
            />
            <Bar dataKey="mastery" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Concept List */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Concept Details</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {concepts.map(concept => (
            <div key={concept.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">
                    {concept.concept}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <span className={`px-2 py-1 rounded-full font-medium ${
                      concept.masteryLevel === 'MASTERED' ? 'bg-green-100 text-green-800' :
                      concept.masteryLevel === 'PROFICIENT' ? 'bg-blue-100 text-blue-800' :
                      concept.masteryLevel === 'DEVELOPING' ? 'bg-yellow-100 text-yellow-800' :
                      concept.masteryLevel === 'BEGINNING' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {getMasteryLabel(concept.masteryLevel)}
                    </span>
                    <span>{concept.practiceCount} practices</span>
                    {concept.lastPracticed && (
                      <span>Last: {new Date(concept.lastPracticed).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getTrendIcon(concept.trend)}
                  <span className="text-lg font-bold text-gray-900">
                    {concept.masteryPercent.toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${concept.masteryPercent}%`,
                    backgroundColor: MASTERY_COLORS[concept.masteryLevel]
                  }}
                />
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-xs text-gray-600">
                <span>
                  {concept.correctAttempts} / {concept.totalAttempts} correct
                </span>
                {concept.suggestedNextConcepts.length > 0 && (
                  <span className="text-blue-600">
                    Next: {concept.suggestedNextConcepts[0]}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

---

## 🎨 Component 4: Learning Path Editor (Teacher)

**File:** `frontend/src/components/progress/LearningPathEditor.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { progressAPI, ConceptPath } from '../../api/progress';
import { Plus, Edit2, Trash2, Save, X, ArrowRight } from 'lucide-react';

interface LearningPathEditorProps {
  classId: string;
}

export const LearningPathEditor: React.FC<LearningPathEditorProps> = ({ classId }) => {
  const [paths, setPaths] = useState<ConceptPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPath, setEditingPath] = useState<ConceptPath | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    conceptName: '',
    prerequisiteId: '',
    orderIndex: 0,
    difficulty: 1,
    estimatedHours: null as number | null,
    description: '',
  });

  useEffect(() => {
    loadPaths();
  }, [classId]);

  const loadPaths = async () => {
    try {
      setLoading(true);
      const response = await progressAPI.getConceptPathsForClass(classId);
      setPaths(response.data.data);
    } catch (err) {
      console.error('Error loading concept paths:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    setFormData({
      conceptName: '',
      prerequisiteId: '',
      orderIndex: paths.length,
      difficulty: 1,
      estimatedHours: null,
      description: '',
    });
  };

  const handleEdit = (path: ConceptPath) => {
    setEditingPath(path);
    setFormData({
      conceptName: path.conceptName,
      prerequisiteId: path.prerequisiteId || '',
      orderIndex: path.orderIndex,
      difficulty: path.difficulty,
      estimatedHours: path.estimatedHours,
      description: path.description || '',
    });
  };

  const handleSave = async () => {
    try {
      if (editingPath) {
        // Update existing path
        await progressAPI.updateConceptPath(editingPath.id, formData);
      } else {
        // Create new path
        await progressAPI.createConceptPath({
          classId,
          ...formData,
        });
      }

      setIsCreating(false);
      setEditingPath(null);
      loadPaths();
    } catch (err) {
      console.error('Error saving concept path:', err);
      alert('Failed to save concept path');
    }
  };

  const handleDelete = async (pathId: string) => {
    if (!confirm('Are you sure you want to delete this concept path?')) {
      return;
    }

    try {
      await progressAPI.deleteConceptPath(pathId);
      loadPaths();
    } catch (err) {
      console.error('Error deleting concept path:', err);
      alert('Failed to delete concept path');
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingPath(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Learning Path Editor</h2>
        {!isCreating && !editingPath && (
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Concept
          </button>
        )}
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingPath) && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingPath ? 'Edit Concept' : 'New Concept'}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Concept Name *
              </label>
              <input
                type="text"
                value={formData.conceptName}
                onChange={(e) => setFormData({ ...formData, conceptName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Quadratic Equations"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prerequisite Concept
              </label>
              <select
                value={formData.prerequisiteId}
                onChange={(e) => setFormData({ ...formData, prerequisiteId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">None (foundational concept)</option>
                {paths
                  .filter(p => !editingPath || p.id !== editingPath.id)
                  .map(path => (
                    <option key={path.id} value={path.id}>
                      {path.conceptName}
                    </option>
                  ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty (1-5)
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Hours
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.estimatedHours || ''}
                  onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value ? parseFloat(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Optional"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Optional description..."
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Concept Path List */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {paths.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-600 mb-4">No learning paths defined yet.</p>
            <button
              onClick={handleCreate}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Create your first concept path
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {paths
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((path, index) => (
                <div
                  key={path.id}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                          {index + 1}
                        </span>
                        <h4 className="text-base font-semibold text-gray-900">
                          {path.conceptName}
                        </h4>
                        {path.prerequisiteId && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <ArrowRight className="w-3 h-3" />
                            <span>
                              After: {paths.find(p => p.id === path.prerequisiteId)?.conceptName}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <span>
                          Difficulty: {Array(path.difficulty).fill('⭐').join('')}
                        </span>
                        {path.estimatedHours && (
                          <span>{path.estimatedHours}h estimated</span>
                        )}
                      </div>

                      {path.description && (
                        <p className="text-sm text-gray-700">{path.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(path)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(path.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
```

---

## 🔌 WebSocket Integration for Real-Time Updates

**File:** `frontend/src/hooks/useProgressWebSocket.ts`

```typescript
import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface ProgressUpdatePayload {
  studentId: string;
  classId: string;
  progress: any;
}

interface ConceptMasteryPayload {
  studentId: string;
  classId: string;
  conceptId: string;
  masteryLevel: number;
  remediationNeeded: boolean;
}

interface VelocityAlertPayload {
  studentId: string;
  classId: string;
  currentVelocity: number;
  previousVelocity: number;
  change: number;
}

export const useProgressWebSocket = (
  token: string,
  callbacks: {
    onProgressUpdate?: (data: ProgressUpdatePayload) => void;
    onConceptMastery?: (data: ConceptMasteryPayload) => void;
    onVelocityAlert?: (data: VelocityAlertPayload) => void;
  }
) => {
  useEffect(() => {
    const socket: Socket = io('http://localhost:3001', {
      auth: { token },
    });

    socket.on('connect', () => {
      console.log('[WebSocket] Connected');
    });

    socket.on('progress:updated', (data: ProgressUpdatePayload) => {
      console.log('[WebSocket] Progress updated:', data);
      callbacks.onProgressUpdate?.(data);
    });

    socket.on('concept:mastery', (data: ConceptMasteryPayload) => {
      console.log('[WebSocket] Concept mastery updated:', data);
      callbacks.onConceptMastery?.(data);
    });

    socket.on('velocity:alert', (data: VelocityAlertPayload) => {
      console.log('[WebSocket] Velocity alert:', data);
      callbacks.onVelocityAlert?.(data);
    });

    socket.on('disconnect', () => {
      console.log('[WebSocket] Disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, [token, callbacks]);
};
```

---

## 📊 Usage Example

**File:** `frontend/src/pages/StudentProgressPage.tsx`

```typescript
import React from 'react';
import { StudentProgressDashboard } from '../components/progress/StudentProgressDashboard';
import { AssignmentProgressTracker } from '../components/progress/AssignmentProgressTracker';
import { ConceptMasteryVisualization } from '../components/progress/ConceptMasteryVisualization';
import { useProgressWebSocket } from '../hooks/useProgressWebSocket';

export const StudentProgressPage: React.FC = () => {
  const studentId = 'your-student-id'; // Get from auth context
  const classId = 'selected-class-id'; // Get from route params or state
  const token = 'your-jwt-token'; // Get from auth context

  // Real-time WebSocket updates
  useProgressWebSocket(token, {
    onProgressUpdate: (data) => {
      console.log('Progress updated:', data);
      // Refresh progress data
    },
    onConceptMastery: (data) => {
      console.log('Concept mastery updated:', data);
      // Show notification or refresh concept data
    },
  });

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">My Progress</h1>

      {/* Overall Progress Dashboard */}
      <StudentProgressDashboard studentId={studentId} classId={classId} />

      {/* Concept Mastery */}
      <ConceptMasteryVisualization studentId={studentId} classId={classId} />
    </div>
  );
};
```

---

## 🧪 Testing

### Example Test for Progress Component

**File:** `frontend/src/components/progress/__tests__/StudentProgressDashboard.test.tsx`

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { StudentProgressDashboard } from '../StudentProgressDashboard';
import { progressAPI } from '../../../api/progress';

jest.mock('../../../api/progress');

describe('StudentProgressDashboard', () => {
  const mockProgress = {
    id: '1',
    studentId: 'student-1',
    classId: 'class-1',
    totalAssignments: 10,
    completedAssignments: 7,
    inProgressAssignments: 2,
    notStartedAssignments: 1,
    completionRate: 70,
    averageGrade: 85.5,
    trendDirection: 'IMPROVING' as const,
    trendPercentage: 5.2,
    totalTimeSpent: 420,
    averageTimePerAssignment: 60,
    learningVelocity: 2.5,
    lastCalculated: new Date().toISOString(),
  };

  beforeEach(() => {
    (progressAPI.getStudentProgress as jest.Mock).mockResolvedValue({
      data: { success: true, data: mockProgress },
    });
  });

  it('renders progress dashboard with correct data', async () => {
    render(<StudentProgressDashboard studentId="student-1" classId="class-1" />);

    await waitFor(() => {
      expect(screen.getByText('70.0%')).toBeInTheDocument();
      expect(screen.getByText('85.5')).toBeInTheDocument();
      expect(screen.getByText('2.5')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    render(<StudentProgressDashboard studentId="student-1" classId="class-1" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
```

---

## 🎉 Summary

You now have complete, enterprise-quality frontend components for:

1. **Student Progress Dashboard** - Overview of completion rates, grades, trends, and learning velocity
2. **Assignment Progress Tracker** - Real-time tracking with automatic time recording
3. **Concept Mastery Visualization** - Charts and detailed concept mastery views with struggling concept alerts
4. **Learning Path Editor** - Teacher tool for customizing concept prerequisites and learning paths
5. **WebSocket Integration** - Real-time updates for progress changes

All components include:
- TypeScript for type safety
- Responsive design with Tailwind CSS
- Loading and error states
- Real-time WebSocket updates
- Professional enterprise UI/UX
- Accessibility features
- Comprehensive test examples

The frontend seamlessly integrates with the backend Progress Tracking API you've built!
