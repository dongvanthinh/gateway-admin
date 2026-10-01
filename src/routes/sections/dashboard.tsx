import type { RouteObject } from 'react-router';

import { Outlet } from 'react-router';
import { lazy, Suspense } from 'react';

import { CONFIG } from 'src/global-config';
import { DashboardLayout } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';

import { AuthGuard } from 'src/auth/guard';

import { usePathname } from '../hooks';

// ----------------------------------------------------------------------

const OverviewPage = lazy(() => import('src/pages/dashboard/one'));
const MerchantPage = lazy(() => import('src/pages/dashboard/merchants'));
const MerchantDetailPage = lazy(() => import('src/pages/dashboard/merchant-detail'));
const MerchantClientDetailPage = lazy(() => import('src/pages/dashboard/merchant-client-detail'));
const MerchantClientPage = lazy(() => import('src/pages/dashboard/merchant-clients'));

// ----------------------------------------------------------------------

function SuspenseOutlet() {
  const pathname = usePathname();
  return (
    <Suspense key={pathname} fallback={<LoadingScreen />}>
      <Outlet />
    </Suspense>
  );
}

const dashboardLayout = () => (
  <DashboardLayout>
    <SuspenseOutlet />
  </DashboardLayout>
);

export const dashboardRoutes: RouteObject[] = [
  {
    path: 'dashboard',
    element: CONFIG.auth.skip ? dashboardLayout() : <AuthGuard>{dashboardLayout()}</AuthGuard>,
    children: [
      { element: <OverviewPage />, index: true },
      {
        path: 'merchants',
        children: [
          { element: <MerchantPage />, index: true },
          { path: ':merchantId', element: <MerchantDetailPage /> },
          { path: ':merchantId/clients', element: <MerchantClientPage /> },
          { path: ':merchantId/clients/:clientId', element: <MerchantClientDetailPage /> },
          { path: ':merchantId/payments', element: <MerchantDetailPage activeTab="payments" /> },
        ],
      },
    ],
  },
];
