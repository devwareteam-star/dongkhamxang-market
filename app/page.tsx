'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import LoginForm from '@/components/Auth/LoginForm';
import Sidebar from '@/components/Layout/Sidebar';
import Header from '@/components/Layout/Header';
import AdminDashboard from '@/components/Dashboard/AdminDashboard';
import EmployeeDashboard from '@/components/Dashboard/EmployeeDashboard';
import SpaceManagement from '@/components/Rooms/RoomManagement';
import PaymentCollection from '@/components/Payments/PaymentCollection';
import ReceiptManagement from '@/components/Receipts/ReceiptManagement';
import ReportsManagement from '@/components/Reports/ReportsManagement';
import UserManagement from '@/components/Users/UserManagement';
import SettingsManagement from '@/components/Settings/SettingsManagement';
import RoomSearch from '@/components/Search/RoomSearch';
import TenantManagement from '@/components/Tenants/TenantManagement';
import NotificationCenter from '@/components/Notifications/NotificationCenter';
import EmployeeSchedule from '@/components/Schedule/EmployeeSchedule';

export default function Home() {
  const { user, isLoading } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">ກຳລັງໂຫຼດລະບົບ...</p>
          <p className="text-sm text-gray-500 mt-1">ກະລຸນາລໍຖ້າສັກຄູ່</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  // Helper function to check permissions
  const hasPermission = (resource: keyof typeof user.permissions, action: 'read' | 'write' | 'delete') => {
    return user.permissions?.[resource]?.[action] || false;
  };

  // Helper function to check if user is admin or manager
  const isAdminOrManager = () => {
    return user.role === 'manager';
  };

  // Access denied component
  const AccessDenied = () => (
    <div className="text-center py-12">
      <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-8V7" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">ບໍ່ມີສິດເຂົ້າເຖິງ</h3>
      <p className="text-gray-500">ທ່ານບໍ່ມີສິດເຂົ້າເຖິງໜ້ານີ້</p>
    </div>
  );

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return isAdminOrManager() ? <AdminDashboard /> : <EmployeeDashboard />;
      
      case 'spaces':
      case 'rooms':
        return hasPermission('spaces', 'read') ? <SpaceManagement /> : <AccessDenied />;
      
      case 'tenants':
        return hasPermission('tenants', 'read') ? <TenantManagement /> : <AccessDenied />;
      
      case 'collect-payment':
      case 'payments':
        return hasPermission('payments', 'read') ? <PaymentCollection /> : <AccessDenied />;
      
      case 'receipts':
        return hasPermission('payments', 'read') ? <ReceiptManagement /> : <AccessDenied />;
      
      case 'reports':
        return hasPermission('reports', 'read') ? <ReportsManagement /> : <AccessDenied />;
      
      case 'notifications':
        return <NotificationCenter />; // All users can see notifications
      
      case 'users':
        return hasPermission('users', 'read') ? <UserManagement /> : <AccessDenied />;
      
      case 'settings':
        return isAdminOrManager() ? <SettingsManagement /> : <AccessDenied />;
      
      case 'search':
        return hasPermission('spaces', 'read') ? <RoomSearch /> : <AccessDenied />;
      
      case 'schedule':
        return <EmployeeSchedule />; // All users can see their schedule
      
      default:
        return isAdminOrManager() ? <AdminDashboard /> : <EmployeeDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar activeView={activeView} onViewChange={setActiveView} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black opacity-50" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="relative">
            <Sidebar activeView={activeView} onViewChange={(view) => {
              setActiveView(view);
              setIsMobileMenuOpen(false);
            }} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isMobileMenuOpen={isMobileMenuOpen}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}