// ============================================================================
// APP.TSX - MAIN APPLICATION ROUTER
// Production-ready routing with authentication
// ============================================================================

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { queryClient } from './config/queryClient';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { SignupPage } from './pages/public/SignupPage';

// Teacher Pages
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { TeacherClasses } from './pages/teacher/TeacherClasses';
import { CreateClass } from './pages/teacher/CreateClass';
import { ClassRoster } from './pages/teacher/ClassRoster';
import { TeacherAssignments } from './pages/teacher/TeacherAssignments';
import { CreateAssignment } from './pages/teacher/CreateAssignment';
import { ViewSubmissions } from './pages/teacher/ViewSubmissions';
import { TeacherMessages } from './pages/teacher/TeacherMessages';
import { TeacherAnalytics } from './pages/teacher/TeacherAnalytics';
import { CurriculumManagement } from './pages/teacher/CurriculumManagement';

// Student Pages
import { StudentDashboard, Classes, Assignments, Grades, Messages } from './pages/student';
import { TakeAssignment } from './pages/student/TakeAssignment';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
            <Route path="/teacher/classes/new" element={<CreateClass />} />
            <Route path="/teacher/classes/:classId/roster" element={<ClassRoster />} />
            <Route path="/teacher/assignments" element={<TeacherAssignments />} />
            <Route path="/teacher/assignments/new" element={<CreateAssignment />} />
            <Route path="/teacher/assignments/:assignmentId/edit" element={<CreateAssignment />} />
            <Route path="/teacher/assignments/:assignmentId/submissions" element={<ViewSubmissions />} />
            <Route path="/teacher/curriculum" element={<CurriculumManagement />} />
            <Route path="/teacher/messages" element={<TeacherMessages />} />
            <Route path="/teacher/analytics" element={<TeacherAnalytics />} />

            {/* STUDENT ROUTES */}
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/classes" element={<Classes />} />
            <Route path="/student/assignments" element={<Assignments />} />
            <Route path="/student/assignments/:assignmentId" element={<TakeAssignment />} />
            <Route path="/student/grades" element={<Grades />} />
            <Route path="/student/messages" element={<Messages />} />

            {/* ADMIN ROUTES */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />

            {/* 404 Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
