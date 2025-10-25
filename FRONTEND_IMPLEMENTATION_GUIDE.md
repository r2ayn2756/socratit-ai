# Frontend Implementation Guide - Analytics Dashboard

## 🎯 Quick Start

### 1. Install Dependencies
```bash
cd frontend
npm install recharts date-fns react-query axios
```

### 2. Create Analytics API Client

**File:** `frontend/src/api/analytics.ts`

```typescript
import axios from 'axios';

const API_BASE = 'http://localhost:3001/api/v1';

export const analyticsAPI = {
  // Student Analytics
  getPerformanceTimeline: (studentId: string, params: {
    classId: string;
    startDate?: Date;
    endDate?: Date;
    granularity?: 'daily' | 'weekly' | 'monthly';
  }) =>
    axios.get(`${API_BASE}/analytics/student/${studentId}/performance-timeline`, { params }),

  getConceptComparison: (studentId: string, classId: string) =>
    axios.get(`${API_BASE}/analytics/student/${studentId}/concept-comparison`, {
      params: { classId },
    }),

  getAssignmentBreakdown: (studentId: string, classId: string) =>
    axios.get(`${API_BASE}/analytics/student/${studentId}/assignment-breakdown`, {
      params: { classId },
    }),

  getConceptMastery: (studentId: string, classId?: string) =>
    axios.get(`${API_BASE}/analytics/student/${studentId}/concepts`, {
      params: classId ? { classId } : {},
    }),

  getStudentInsights: (studentId: string, classId?: string) =>
    axios.get(`${API_BASE}/analytics/student/${studentId}/insights`, {
      params: classId ? { classId } : {},
    }),

  // Class Analytics
  getClassOverview: (classId: string) =>
    axios.get(`${API_BASE}/analytics/class/${classId}/overview`),

  getPerformanceDistribution: (classId: string) =>
    axios.get(`${API_BASE}/analytics/class/${classId}/performance-distribution`),

  getConceptHeatmap: (classId: string) =>
    axios.get(`${API_BASE}/analytics/class/${classId}/concept-mastery-heatmap`),

  getEngagementMetrics: (classId: string) =>
    axios.get(`${API_BASE}/analytics/class/${classId}/engagement-metrics`),

  getAssignmentPerformance: (classId: string) =>
    axios.get(`${API_BASE}/analytics/class/${classId}/assignment-performance`),

  getStrugglingStudents: (classId: string) =>
    axios.get(`${API_BASE}/analytics/class/${classId}/struggling-students`),

  compareClasses: (classId: string) =>
    axios.get(`${API_BASE}/analytics/class/${classId}/compare-classes`),

  // AI Recommendations
  generateRecommendations: (studentId: string, data: {
    classId: string;
    focus?: 'concepts' | 'engagement' | 'overall';
  }) =>
    axios.post(`${API_BASE}/analytics/student/${studentId}/generate-recommendations`, data),

  updateTeacherNotes: (insightId: string, data: {
    teacherNotes?: string;
    dismissAlert?: boolean;
  }) =>
    axios.patch(`${API_BASE}/analytics/insights/${insightId}/teacher-notes`, data),

  // Event Tracking
  trackEvent: (data: {
    eventType: string;
    eventData?: any;
    assignmentId?: string;
    submissionId?: string;
    questionId?: string;
  }) =>
    axios.post(`${API_BASE}/analytics/events`, data),

  // Export
  exportClassGrades: (classId: string) =>
    axios.get(`${API_BASE}/analytics/export/class/${classId}/grades?format=csv`, {
      responseType: 'blob',
    }),

  exportStudentReport: (studentId: string, classId: string) =>
    axios.get(`${API_BASE}/analytics/export/student/${studentId}/report`, {
      params: { classId },
    }),
};
```

---

## 📊 Dashboard Components

### 1. Teacher Analytics Dashboard

**File:** `frontend/src/pages/analytics/TeacherDashboard.tsx`

```tsx
import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { analyticsAPI } from '../../api/analytics';
import { ClassOverviewCard } from '../../components/analytics/ClassOverviewCard';
import { PerformanceDistribution } from '../../components/analytics/PerformanceDistribution';
import { ConceptHeatmap } from '../../components/analytics/ConceptHeatmap';
import { StrugglingStudentsAlert } from '../../components/analytics/StrugglingStudentsAlert';
import { EngagementMetrics } from '../../components/analytics/EngagementMetrics';

export const TeacherDashboard = ({ classId }: { classId: string }) => {
  const [selectedView, setSelectedView] = useState<'overview' | 'concepts' | 'engagement'>('overview');

  const { data: overview, isLoading: overviewLoading } = useQuery(
    ['class-overview', classId],
    () => analyticsAPI.getClassOverview(classId)
  );

  const { data: strugglingStudents } = useQuery(
    ['struggling-students', classId],
    () => analyticsAPI.getStrugglingStudents(classId)
  );

  const handleExportGrades = async () => {
    const response = await analyticsAPI.exportClassGrades(classId);
    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `class_grades_${classId}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (overviewLoading) return <div className="animate-pulse">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Class Analytics</h1>
          <button
            onClick={handleExportGrades}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Export Grades (CSV)
          </button>
        </div>

        {/* Struggling Students Alert */}
        {strugglingStudents?.data?.data?.length > 0 && (
          <StrugglingStudentsAlert students={strugglingStudents.data.data} classId={classId} />
        )}

        {/* Overview Cards */}
        <ClassOverviewCard data={overview?.data?.data} />

        {/* Tabs */}
        <div className="mt-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setSelectedView('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                selectedView === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setSelectedView('concepts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                selectedView === 'concepts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Concept Mastery
            </button>
            <button
              onClick={() => setSelectedView('engagement')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                selectedView === 'engagement'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Engagement
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {selectedView === 'overview' && <PerformanceDistribution classId={classId} />}
          {selectedView === 'concepts' && <ConceptHeatmap classId={classId} />}
          {selectedView === 'engagement' && <EngagementMetrics classId={classId} />}
        </div>
      </div>
    </div>
  );
};
```

---

### 2. Class Overview Card

**File:** `frontend/src/components/analytics/ClassOverviewCard.tsx`

```tsx
import React from 'react';

interface ClassOverviewData {
  totalStudents: number;
  strugglingCount: number;
  avgCompletionRate: number;
  avgScore: number;
  interventionLevels: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    CRITICAL: number;
  };
}

export const ClassOverviewCard = ({ data }: { data?: ClassOverviewData }) => {
  if (!data) return null;

  const metrics = [
    {
      label: 'Average Score',
      value: `${data.avgScore.toFixed(1)}%`,
      color: data.avgScore >= 80 ? 'green' : data.avgScore >= 70 ? 'yellow' : 'red',
    },
    {
      label: 'Completion Rate',
      value: `${data.avgCompletionRate.toFixed(1)}%`,
      color: data.avgCompletionRate >= 90 ? 'green' : data.avgCompletionRate >= 75 ? 'yellow' : 'red',
    },
    {
      label: 'Struggling Students',
      value: data.strugglingCount,
      color: data.strugglingCount === 0 ? 'green' : data.strugglingCount > 5 ? 'red' : 'yellow',
    },
    {
      label: 'Total Students',
      value: data.totalStudents,
      color: 'blue',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {metrics.map((metric, index) => (
        <div key={index} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{metric.label}</p>
              <p className={`text-3xl font-bold mt-2 text-${metric.color}-600`}>
                {metric.value}
              </p>
            </div>
            <div className={`p-3 rounded-full bg-${metric.color}-100`}>
              <svg className={`w-8 h-8 text-${metric.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
```

---

### 3. Performance Timeline Chart

**File:** `frontend/src/components/analytics/PerformanceTimeline.tsx`

```tsx
import React from 'react';
import { useQuery } from 'react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { analyticsAPI } from '../../api/analytics';

export const PerformanceTimeline = ({ studentId, classId }: { studentId: string; classId: string }) => {
  const { data, isLoading } = useQuery(['performance-timeline', studentId, classId], () =>
    analyticsAPI.getPerformanceTimeline(studentId, {
      classId,
      granularity: 'weekly',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      endDate: new Date(),
    })
  );

  if (isLoading) return <div className="animate-pulse h-96 bg-gray-200 rounded"></div>;

  const chartData = data?.data?.data || [];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Performance Over Time</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => format(new Date(value), 'MMM d')}
          />
          <YAxis domain={[0, 100]} />
          <Tooltip
            labelFormatter={(value) => format(new Date(value as string), 'MMM d, yyyy')}
            formatter={(value: number) => [`${value.toFixed(1)}%`, 'Score']}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="averageScore"
            stroke="#3B82F6"
            strokeWidth={2}
            name="Average Score"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
```

---

### 4. Concept Mastery Heatmap

**File:** `frontend/src/components/analytics/ConceptHeatmap.tsx`

```tsx
import React from 'react';
import { useQuery } from 'react-query';
import { analyticsAPI } from '../../api/analytics';

const getMasteryColor = (percent: number) => {
  if (percent >= 90) return 'bg-green-500';
  if (percent >= 70) return 'bg-blue-500';
  if (percent >= 40) return 'bg-yellow-500';
  if (percent >= 20) return 'bg-orange-500';
  return 'bg-red-500';
};

export const ConceptHeatmap = ({ classId }: { classId: string }) => {
  const { data, isLoading } = useQuery(['concept-heatmap', classId], () =>
    analyticsAPI.getConceptHeatmap(classId)
  );

  if (isLoading) return <div className="animate-pulse h-96 bg-gray-200 rounded"></div>;

  const heatmapData = data?.data?.data || [];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Concept Mastery Heatmap</h3>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Concept
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Class Average
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Students
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {heatmapData.map((concept: any, idx: number) => (
              <tr key={idx}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {concept.concept}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-3 py-1 rounded-full text-white ${getMasteryColor(concept.classAverage)}`}>
                    {concept.classAverage.toFixed(1)}%
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <div className="flex flex-wrap gap-1">
                    {concept.studentMasteryLevels.slice(0, 10).map((student: any) => (
                      <div
                        key={student.studentId}
                        className={`w-8 h-8 rounded ${getMasteryColor(student.masteryPercent)}`}
                        title={`${student.studentName}: ${student.masteryPercent.toFixed(1)}%`}
                      />
                    ))}
                    {concept.studentMasteryLevels.length > 10 && (
                      <span className="text-xs text-gray-400">
                        +{concept.studentMasteryLevels.length - 10} more
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-sm">
        <span className="font-medium">Legend:</span>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Mastered (90-100%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>Proficient (70-89%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span>Developing (40-69%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>Struggling (<40%)</span>
        </div>
      </div>
    </div>
  );
};
```

---

### 5. Struggling Students Alert

**File:** `frontend/src/components/analytics/StrugglingStudentsAlert.tsx`

```tsx
import React from 'react';
import { analyticsAPI } from '../../api/analytics';

const getSeverityColor = (level: string) => {
  switch (level) {
    case 'CRITICAL': return 'bg-red-100 border-red-500 text-red-900';
    case 'HIGH': return 'bg-orange-100 border-orange-500 text-orange-900';
    case 'MEDIUM': return 'bg-yellow-100 border-yellow-500 text-yellow-900';
    default: return 'bg-blue-100 border-blue-500 text-blue-900';
  }
};

export const StrugglingStudentsAlert = ({ students, classId }: { students: any[]; classId: string }) => {
  const generateRecommendations = async (studentId: string) => {
    try {
      const response = await analyticsAPI.generateRecommendations(studentId, {
        classId,
        focus: 'overall',
      });
      alert(JSON.stringify(response.data.data.recommendations, null, 2));
    } catch (error) {
      console.error('Error generating recommendations:', error);
    }
  };

  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            {students.length} Struggling {students.length === 1 ? 'Student' : 'Students'} Detected
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <ul className="list-disc pl-5 space-y-2">
              {students.map((student: any) => (
                <li key={student.id}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold">
                        {student.student.firstName} {student.student.lastName}
                      </span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${getSeverityColor(student.interventionLevel)}`}>
                        {student.interventionLevel}
                      </span>
                      <div className="text-xs mt-1">
                        Avg Score: {student.averageScore?.toFixed(1)}% |
                        Completion: {student.completionRate?.toFixed(1)}%
                      </div>
                    </div>
                    <button
                      onClick={() => generateRecommendations(student.studentId)}
                      className="ml-4 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                    >
                      Get AI Recommendations
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
```

---

## 🔌 WebSocket Integration

**File:** `frontend/src/hooks/useAnalyticsWebSocket.ts`

```typescript
import { useEffect } from 'react';
import { useQueryClient } from 'react-query';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const useAnalyticsWebSocket = (classId: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Connect to WebSocket
    socket = io('http://localhost:3001', {
      auth: {
        token: localStorage.getItem('accessToken'),
      },
    });

    // Join analytics room for this class
    socket.emit('join_analytics_room', { classId });

    // Listen for analytics updates
    socket.on('analytics_updated', (data) => {
      console.log('Analytics updated:', data);

      // Invalidate relevant queries to trigger refetch
      if (data.type === 'class_overview') {
        queryClient.invalidateQueries(['class-overview', classId]);
      } else if (data.type === 'concept_heatmap') {
        queryClient.invalidateQueries(['concept-heatmap', classId]);
      } else if (data.type === 'student_insight') {
        queryClient.invalidateQueries(['struggling-students', classId]);
      }
    });

    // Listen for insight alerts
    socket.on('insight_alert', (data) => {
      console.log('New insight alert:', data);
      // Show notification to teacher
      alert(`Student ${data.studentName} needs attention: ${data.message}`);
    });

    // Cleanup
    return () => {
      socket?.emit('leave_analytics_room', { classId });
      socket?.disconnect();
    };
  }, [classId, queryClient]);

  return socket;
};
```

---

## 📱 Complete Dashboard Example

**File:** `frontend/src/App.tsx` (Add route)

```tsx
import { TeacherDashboard } from './pages/analytics/TeacherDashboard';

// In your router:
<Route path="/analytics/:classId" element={<TeacherDashboard />} />
```

---

## 🎨 Tailwind Configuration

Make sure your `tailwind.config.js` includes necessary colors:

```javascript
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        green: {
          100: '#D1FAE5',
          500: '#10B981',
          600: '#059669',
        },
        blue: {
          100: '#DBEAFE',
          500: '#3B82F6',
          600: '#2563EB',
        },
        yellow: {
          100: '#FEF3C7',
          500: '#F59E0B',
          600: '#D97706',
        },
        red: {
          100: '#FEE2E2',
          500: '#EF4444',
          600: '#DC2626',
        },
      },
    },
  },
  plugins: [],
};
```

---

## ✅ Testing Your Frontend

1. **Start the backend:**
   ```bash
   cd socratit-backend
   npm run dev
   ```

2. **Start the frontend:**
   ```bash
   cd frontend
   npm start
   ```

3. **Navigate to:**
   ```
   http://localhost:3000/analytics/{classId}
   ```

4. **Verify:**
   - Overview cards display
   - Charts render correctly
   - Export button downloads CSV
   - Struggling students alert shows
   - Real-time updates work (if WebSocket implemented)

---

## 📊 Sample Data for Testing

Use this to create test data in your database:

```sql
-- Create concept masteries
INSERT INTO concept_masteries (student_id, class_id, school_id, concept, mastery_percent, mastery_level)
VALUES
  ('student-uuid', 'class-uuid', 'school-uuid', 'Quadratic Equations', 45.5, 'DEVELOPING'),
  ('student-uuid', 'class-uuid', 'school-uuid', 'Linear Functions', 92.0, 'MASTERED');

-- Create student insights
INSERT INTO student_insights (
  student_id, class_id, school_id,
  is_struggling, average_score, completion_rate,
  intervention_level
)
VALUES (
  'student-uuid', 'class-uuid', 'school-uuid',
  true, 65.5, 78.0,
  'HIGH'
);
```

---

**That's it!** You now have everything you need to build a production-ready analytics dashboard. Focus on these components first, then add more advanced features like drill-downs, filters, and interactive charts.

Happy coding! 🚀
