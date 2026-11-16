import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { DashboardLayout } from './components/DashboardLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ToastContainer } from './components/ToastContainer';
import { AdminPanelPage } from './pages/AdminPanelPage';
import { AIPlannerPage } from './pages/AIPlannerPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AuthPage } from './pages/AuthPage';
import { BookingsPage } from './pages/BookingsPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { EventsPage } from './pages/EventsPage';
import { LandingPage } from './pages/LandingPage';
import { OrganizerDashboard } from './pages/OrganizerDashboard';
import { VendorMarketplacePage } from './pages/VendorMarketplacePage';
import { VendorPortalPage } from './pages/VendorPortalPage';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <ToastContainer />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />

          {/* Organizer Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <DashboardLayout>
                  <OrganizerDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/events"
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <DashboardLayout>
                  <EventsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/:eventId"
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <DashboardLayout>
                  <EventDetailPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-planner"
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <DashboardLayout>
                  <AIPlannerPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Shared Organizer + Admin */}
          <Route
            path="/vendors"
            element={
              <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                <DashboardLayout>
                  <VendorMarketplacePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                <DashboardLayout>
                  <AnalyticsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Shared Organizer + Vendor */}
          <Route
            path="/bookings"
            element={
              <ProtectedRoute allowedRoles={['organizer', 'vendor']}>
                <DashboardLayout>
                  <BookingsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Vendor Studio */}
          <Route
            path="/vendor-portal"
            element={
              <ProtectedRoute allowedRoles={['vendor']}>
                <DashboardLayout>
                  <VendorPortalPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin Console */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <AdminPanelPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
