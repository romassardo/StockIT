import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import Loading from '../components/common/Loading';
import ErrorBoundary from '../components/common/ErrorBoundary';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Inventory from '../pages/Inventory';
import Assignments from '../pages/Assignments';
import Stock from '../pages/Stock';
import StockMovementsPage from '../pages/StockMovementsPage';
import ProductManagement from '../pages/ProductManagement';
import { Navigate } from "react-router-dom";
import RepairsPage from '../pages/RepairsPage';
import Admin from '../pages/Admin';
import Vault from '../pages/Vault';
import ReportsPage from '../pages/Reports';
import StockAlertsReport from '../pages/reports/StockAlertsReport';
import StockDisponibleReport from '../pages/reports/FullInventoryReport';
import AssignmentsByEmployeeReport from '../pages/reports/AssignmentsByEmployeeReport';
import AssignmentsBySectorReport from '../pages/reports/AssignmentsBySectorReport';
import AssignmentsByBranchReport from '../pages/reports/AssignmentsByBranchReport';
import RepairHistoryReport from '../pages/reports/RepairHistoryReport';
import NotFound from '../pages/NotFound';
import AccessDenied from '../pages/AccessDenied';
import MainLayout from '../components/layout/MainLayout';

const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/acceso-denegado" element={<AccessDenied />} />
        
        <Route element={<MainLayout />}>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/inventory" element={
              <ErrorBoundary>
                <Inventory />
              </ErrorBoundary>
            } />
            <Route path="/assignments" element={<Assignments />} />
            <Route path="/repairs" element={<RepairsPage />} />
            <Route path="/stock" element={<Stock />} />
            <Route path="/movements" element={<StockMovementsPage />} />
            <Route path="/product-management" element={<ProductManagement />} />
            <Route path="/vault" element={<Vault />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/reports/stock-alerts" element={<StockAlertsReport />} />
            <Route path="/reports/inventory/full" element={<StockDisponibleReport />} />
            <Route path="/reports/assignments-employee" element={<AssignmentsByEmployeeReport />} />
            <Route path="/reports/assignments-sector" element={<AssignmentsBySectorReport />} />
            <Route path="/reports/assignments-branch" element={<AssignmentsByBranchReport />} />
            <Route path="/reports/repair-history" element={<RepairHistoryReport />} />
            <Route path="/reports/repairs" element={<NotFound />} />
          </Route>
          
          <Route element={<ProtectedRoute requiredRoles={['admin']} />}>
            <Route path="/admin" element={<Admin />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;


