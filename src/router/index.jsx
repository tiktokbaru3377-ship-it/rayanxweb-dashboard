import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import DashboardLayout from '../layouts/DashboardLayout';

// Pages Deferred Loading (Code Splitting Optimization)
const Login = React.lazy(() => import('../pages/Login'));
const DashboardOverview = React.lazy(() => import('../pages/DashboardOverview'));
const DeviceList = React.lazy(() => import('../pages/DeviceList'));
const DeviceEnrollmentWizard = React.lazy(() => import('../pages/DeviceEnrollmentWizard'));

export const router = createBrowserRouter([
  { path: '/login', element: <React.Suspense fallback={null}><Login /></React.Suspense> },
  {
    element: <ProtectedRoute allowedRoles={['Admin', 'Operator', 'Viewer']} />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: '/', element: <React.Suspense fallback={null}><DashboardOverview /></React.Suspense> },
          { path: '/devices', element: <React.Suspense fallback={null}><DeviceList /></React.Suspense> },
          { 
            element: <ProtectedRoute allowedRoles={['Admin', 'Operator']} />, 
            children: [
              { path: '/enrollment', element: <React.Suspense fallback={null}><DeviceEnrollmentWizard /></React.Suspense> }
            ]
          }
        ]
      }
    ]
  },
  { path: '*', element: <div className="text-center p-10">404 - Not Found</div> }
]);
