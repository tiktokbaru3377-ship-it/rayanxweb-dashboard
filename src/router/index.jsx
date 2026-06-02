import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import DashboardLayout from '../layouts/DashboardLayout';

// Pemuatan komponen secara asinkron untuk optimasi performa kompilasi Vite
const Login = React.lazy(() => import('../pages/Login'));
const DashboardOverview = React.lazy(() => import('../pages/DashboardOverview'));
const DeviceList = React.lazy(() => import('../pages/DeviceList'));
const DeviceEnrollmentWizard = React.lazy(() => import('../pages/DeviceEnrollmentWizard'));
const UserManagement = React.lazy(() => import('../pages/UserManagement'));
const NotificationCenter = React.lazy(() => import('../pages/NotificationCenter'));
const SettingsConsole = React.lazy(() => import('../pages/SettingsConsole'));

export const router = createBrowserRouter([
  { 
    path: '/login', 
    element: (
      <React.Suspense fallback={<div className="h-screen w-screen bg-slate-950" />}>
        <Login />
      </React.Suspense>
    ) 
  },
  {
    element: <ProtectedRoute allowedRoles={['Admin', 'Operator', 'Viewer']} />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { 
            path: '/', 
            element: (
              <React.Suspense fallback={<SkeletonDashboardOverview />}>
                <DashboardOverview />
              </React.Suspense>
            ) 
          },
          { 
            path: '/devices', 
            element: (
              <React.Suspense fallback={<SkeletonDeviceList />}>
                <DeviceList />
              </React.Suspense>
            ) 
          },
          {
            element: <ProtectedRoute allowedRoles={['Admin', 'Operator']} />,
            children: [
              { 
                path: '/enrollment', 
                element: (
                  <React.Suspense fallback={<SkeletonEnrollment />}>
                    <DeviceEnrollmentWizard />
                  </React.Suspense>
                ) 
              },
              { 
                path: '/notifications', 
                element: (
                  <React.Suspense fallback={<div className="p-8 text-slate-400">Loading Node...</div>}>
                    <NotificationCenter />
                  </React.Suspense>
                ) 
              }
            ]
          },
          {
            element: <ProtectedRoute allowedRoles={['Admin']} />,
            children: [
              { 
                path: '/users', 
                element: (
                  <React.Suspense fallback={<div className="p-8 text-slate-400">Loading Node...</div>}>
                    <UserManagement />
                  </React.Suspense>
                ) 
              },
              { 
                path: '/settings', 
                element: (
                  <React.Suspense fallback={<div className="p-8 text-slate-400">Loading Node...</div>}>
                    <SettingsConsole />
                  </React.Suspense>
                ) 
              }
            ]
          }
        ]
      }
    ]
  },
  { path: '/unauthorized', element: <div className="p-10 text-center text-white bg-slate-950 h-screen">403 - Unauthorized Access Link</div> },
  { path: '*', element: <Navigate to="/" replace /> }
]);

// ==========================================
// INFRASTRUCTURE VISUAL SKELETON LOADERS
// ==========================================
function SkeletonDashboardOverview() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />)}
      </div>
      <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-xl" />
    </div>
  );
}

function SkeletonDeviceList() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded" />
      <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg" />
      <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
    </div>
  );
}

function SkeletonEnrollment() {
  return (
    <div className="max-w-xl mx-auto h-96 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse mt-12" />
  );
}
