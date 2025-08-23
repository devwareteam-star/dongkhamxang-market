'use client';

import React from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useData } from '@/lib/contexts/DataContext';
import { 
  Home, 
  Building2, 
  CreditCard, 
  Receipt, 
  BarChart3, 
  Settings,
  LogOut,
  Users,
  Search,
  Bell,
  UserCheck,
  Calendar,
  FileText
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange }) => {
  const { user, logout } = useAuth();
  const { notifications } = useData();

  const unreadNotifications = notifications.filter(n => !n.isRead).length;

  const adminMenuItems = [
    { id: 'dashboard', label: 'แดชบอร์ด', icon: Home },
    { id: 'rooms', label: 'จัดการห้องเช่า', icon: Building2 },
    { id: 'tenants', label: 'จัดการผู้เช่า', icon: UserCheck },
    { id: 'payments', label: 'การชำระเงิน', icon: CreditCard },
    { id: 'receipts', label: 'ใบเสร็จ', icon: Receipt },
    { id: 'reports', label: 'รายงาน', icon: BarChart3 },
    { id: 'notifications', label: 'การแจ้งเตือน', icon: Bell, badge: unreadNotifications },
    { id: 'users', label: 'จัดการผู้ใช้', icon: Users },
    { id: 'settings', label: 'ตั้งค่าระบบ', icon: Settings },
  ];

  const employeeMenuItems = [
    { id: 'dashboard', label: 'แดชบอร์ด', icon: Home },
    { id: 'collect-payment', label: 'เก็บเงินค่าเช่า', icon: CreditCard },
    { id: 'receipts', label: 'ใบเสร็จ', icon: Receipt },
    { id: 'search', label: 'ค้นหาห้อง', icon: Search },
    { id: 'schedule', label: 'ตารางงาน', icon: Calendar },
    { id: 'notifications', label: 'การแจ้งเตือน', icon: Bell, badge: unreadNotifications },
  ];

  const menuItems = user?.role === 'admin' ? adminMenuItems : employeeMenuItems;

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">ตลาดสดเจริญกรุง</h1>
            <p className="text-xs text-blue-100">Market Management</p>
          </div>
        </div>
        <div className="bg-blue-500 bg-opacity-30 rounded-lg p-3">
          <p className="text-sm font-medium text-white">{user?.name}</p>
          <p className="text-xs text-blue-100">{user?.email}</p>
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${
            user?.role === 'admin' 
              ? 'bg-yellow-400 text-yellow-900' 
              : 'bg-green-400 text-green-900'
          }`}>
            {user?.role === 'admin' ? 'ผู้ดูแลระบบ' : 'พนักงานเก็บเงิน'}
          </span>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                    activeView === item.id
                      ? 'bg-blue-50 text-blue-700 font-medium shadow-sm border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center">
                    <Icon className="w-5 h-5 mr-3" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && item.badge > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="mb-3 text-xs text-gray-500 text-center">
          <p>เข้าสู่ระบบล่าสุด</p>
          <p className="font-medium">{user?.lastLogin?.toLocaleString('th-TH')}</p>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors font-medium"
        >
          <LogOut className="w-5 h-5 mr-2" />
          ออกจากระบบ
        </button>
      </div>
    </div>
  );
};

export default Sidebar;