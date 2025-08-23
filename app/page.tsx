'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import LoginForm from '@/components/Auth/LoginForm';
import Sidebar from '@/components/Layout/Sidebar';
import Header from '@/components/Layout/Header';
import AdminDashboard from '@/components/Dashboard/AdminDashboard';
import EmployeeDashboard from '@/components/Dashboard/EmployeeDashboard';
import RoomManagement from '@/components/Rooms/RoomManagement';
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
          <p className="text-gray-600 font-medium">กำลังโหลดระบบ...</p>
          <p className="text-sm text-gray-500 mt-1">กรุณารอสักครู่</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return user.role === 'admin' ? <AdminDashboard /> : <EmployeeDashboard />;
      case 'rooms':
        return user.role === 'admin' ? <RoomManagement /> : <div className="text-center py-12"><p className="text-gray-500">ไม่มีสิทธิ์เข้าถึงหน้านี้</p></div>;
      case 'tenants':
        return user.role === 'admin' ? <TenantManagement /> : <div className="text-center py-12"><p className="text-gray-500">ไม่มีสิทธิ์เข้าถึงหน้านี้</p></div>;
      case 'collect-payment':
        return <PaymentCollection />;
      case 'payments':
        return user.role === 'admin' ? <PaymentCollection /> : <div className="text-center py-12"><p className="text-gray-500">ไม่มีสิทธิ์เข้าถึงหน้านี้</p></div>;
      case 'receipts':
        return <ReceiptManagement />;
      case 'reports':
        return user.role === 'admin' ? <ReportsManagement /> : <div className="text-center py-12"><p className="text-gray-500">ไม่มีสิทธิ์เข้าถึงหน้านี้</p></div>;
      case 'notifications':
        return <NotificationCenter />;
      case 'users':
        return user.role === 'admin' ? <UserManagement /> : <div className="text-center py-12"><p className="text-gray-500">ไม่มีสิทธิ์เข้าถึงหน้านี้</p></div>;
      case 'settings':
        return user.role === 'admin' ? <SettingsManagement /> : <div className="text-center py-12"><p className="text-gray-500">ไม่มีสิทธิ์เข้าถึงหน้านี้</p></div>;
      case 'search':
        return <RoomSearch />;
      case 'schedule':
        return <EmployeeSchedule />;
      default:
        return user.role === 'admin' ? <AdminDashboard /> : <EmployeeDashboard />;
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