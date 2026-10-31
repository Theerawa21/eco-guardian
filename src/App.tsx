import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { PreAssessmentPage } from './pages/student/PreAssessmentPage';
import { HomeEcoBaselinePage } from './pages/student/HomeEcoBaselinePage';
import { MissionMapPage } from './pages/student/MissionMapPage';
import { BehaviorCommitmentPage } from './pages/student/BehaviorCommitmentPage';
import { EcoActionPage } from './pages/student/EcoActionPage';
import { HomeEcoReportPage } from './pages/student/HomeEcoReportPage';
import { PostAssessmentPage } from './pages/student/PostAssessmentPage';
import { FollowUpPage } from './pages/student/FollowUpPage';
import { MyEcoJourneyPage } from './pages/student/MyEcoJourneyPage';
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { TeacherVerificationPage } from './pages/teacher/TeacherVerificationPage';
import { TeacherStudentManagementPage } from './pages/teacher/TeacherStudentManagementPage';
import { TeacherObservationPage } from './pages/teacher/TeacherObservationPage';
import { ClassroomReportPage } from './pages/teacher/ClassroomReportPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Student Protected Routes */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={['student', 'admin']}>
                <AppLayout>
                  <StudentDashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/pre-assessment"
            element={
              <ProtectedRoute allowedRoles={['student', 'admin']}>
                <AppLayout>
                  <PreAssessmentPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/baseline"
            element={
              <ProtectedRoute allowedRoles={['student', 'admin']}>
                <AppLayout>
                  <HomeEcoBaselinePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/missions"
            element={
              <ProtectedRoute allowedRoles={['student', 'admin']}>
                <AppLayout>
                  <MissionMapPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/commitment"
            element={
              <ProtectedRoute allowedRoles={['student', 'admin']}>
                <AppLayout>
                  <BehaviorCommitmentPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/actions"
            element={
              <ProtectedRoute allowedRoles={['student', 'admin']}>
                <AppLayout>
                  <EcoActionPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/home-eco"
            element={
              <ProtectedRoute allowedRoles={['student', 'admin']}>
                <AppLayout>
                  <HomeEcoReportPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/post-assessment"
            element={
              <ProtectedRoute allowedRoles={['student', 'admin']}>
                <AppLayout>
                  <PostAssessmentPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/follow-up"
            element={
              <ProtectedRoute allowedRoles={['student', 'admin']}>
                <AppLayout>
                  <FollowUpPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/journey"
            element={
              <ProtectedRoute allowedRoles={['student', 'admin']}>
                <AppLayout>
                  <MyEcoJourneyPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Teacher Protected Routes */}
          <Route
            path="/teacher/dashboard"
            element={
              <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                <AppLayout>
                  <TeacherDashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/verification"
            element={
              <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                <AppLayout>
                  <TeacherVerificationPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/students"
            element={
              <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                <AppLayout>
                  <TeacherStudentManagementPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/observations"
            element={
              <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                <AppLayout>
                  <TeacherObservationPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/reports"
            element={
              <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                <AppLayout>
                  <ClassroomReportPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout>
                  <AdminDashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

