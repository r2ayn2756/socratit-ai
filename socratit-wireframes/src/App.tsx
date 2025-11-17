// ============================================================================
// APP.TSX - MAIN APPLICATION ROUTER
// Production-ready routing with authentication
// ============================================================================

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { queryClient } from './config/queryClient';
import { ErrorBoundary } from './components/shared/ErrorBoundary';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { SignupPage } from './pages/public/SignupPage';

// Teacher Pages
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { TeacherClasses } from './pages/teacher/TeacherClasses';
import { ClassDashboard } from './pages/teacher/ClassDashboard';
import { ClassRoster } from './pages/teacher/ClassRoster';
import { TeacherAssignments } from './pages/teacher/TeacherAssignments';
import { CreateAssignment } from './pages/teacher/CreateAssignment';
import { ViewSubmissions } from './pages/teacher/ViewSubmissions';
import { TeacherMessages } from './pages/teacher/TeacherMessages';
import { TeacherAnalytics } from './pages/teacher/TeacherAnalytics';
import { AIInsightsPage } from './pages/teacher/AIInsightsPage';
import { TeacherChatPage } from './pages/teacher/TeacherChatPage';

// Student Pages
import { StudentDashboard, Classes, Assignments, Grades, Messages } from './pages/student';
import { ChatPage } from './pages/student/ChatPage';
import { TakeAssignment } from './pages/student/TakeAssignment';
import { StudentClassView } from './pages/student/StudentClassView';
import { StudentCurriculumView } from './pages/student/StudentCurriculumView';
import Atlas from './pages/student/Atlas';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>

            {/* PUBLIC ROUTES */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* TEACHER ROUTES */}
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
            <Route path="/teacher/classes" element={<TeacherClasses />} />
            <Route path="/teacher/classes/:classId" element={<ClassDashboard />} />
            <Route path="/teacher/classes/:classId/roster" element={<ClassRoster />} />
            <Route path="/teacher/assignments" element={<TeacherAssignments />} />
            <Route path="/teacher/assignments/new" element={<CreateAssignment />} />
            <Route path="/teacher/assignments/:assignmentId/edit" element={<CreateAssignment />} />
            <Route path="/teacher/assignments/:assignmentId/submissions" element={<ViewSubmissions />} />
            <Route path="/teacher/ai-tutor" element={<TeacherChatPage />} />
            <Route path="/teacher/messages" element={<TeacherMessages />} />

            {/* DEPRECATED ROUTES - Analytics and AI Insights removed from sidebar */}
            {/* These routes are kept for backwards compatibility but are no longer linked from navigation */}
            {/* TODO: Integrate these features into ClassDashboard as tabs/sections */}
            <Route path="/teacher/analytics" element={<TeacherAnalytics />} />
            <Route path="/teacher/classes/:classId/analytics" element={<TeacherAnalytics />} />
            <Route path="/teacher/ai-insights" element={<AIInsightsPage />} />
            <Route path="/teacher/classes/:classId/ai-insights" element={<AIInsightsPage />} />

            {/* STUDENT ROUTES */}
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/classes" element={<Classes />} />
            <Route path="/student/classes/:classId" element={<StudentClassView />} />
            <Route path="/student/classes/:classId/curriculum" element={<StudentCurriculumView />} />
            <Route path="/student/assignments" element={<Assignments />} />
            <Route path="/student/assignments/:assignmentId" element={<TakeAssignment />} />
            <Route path="/student/grades" element={<Grades />} />
            <Route path="/student/atlas" element={<Atlas />} />
            <Route path="/student/messages" element={<Messages />} />
            <Route path="/student/ai-tutor" element={<ChatPage />} />

            {/* ADMIN ROUTES */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />

            {/* 404 Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
