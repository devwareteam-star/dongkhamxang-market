'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/contexts/DataContext';
import { 
  Settings, 
  Building2, 
  DollarSign, 
  Bell, 
  Receipt,
  Shield,
  Save
} from 'lucide-react';

const SettingsManagement: React.FC = () => {
  const { settings, updateSettings, addNotification } = useData();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('market');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(settings);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      updateSettings(formData);
      
      // Add notification about settings change
      await addNotification({
        type: 'maintenance_required',
        title: 'การตั้งค่าระบบถูกอัปเดต',
        message: `การตั้งค่าระบบถูกอัปเดตโดย ${user?.name}`,
        isRead: false,
        createdAt: new Date(),
        priority: 'low'
      });
      
      alert('การตั้งค่าถูกบันทึกแล้ว');
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { id: 'market', label: 'ข้อมูลตลาด', icon: Building2 },
    { id: 'rates', label: 'อัตราค่าเช่า', icon: DollarSign },
    { id: 'notifications', label: 'การแจ้งเตือน', icon: Bell },
    { id: 'receipt', label: 'ใบเสร็จ', icon: Receipt },
    { id: 'security', label: 'ความปลอดภัย', icon: Shield }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'market':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">ข้อมูลตลาด</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อตลาด</label>
                <input
                  type="text"
                  defaultValue={settings.marketInfo.name}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">เบอร์โทรศัพท์</label>
                <input
                  type="text"
                  defaultValue={settings.marketInfo.phone}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">ที่อยู่</label>
                <textarea
                  defaultValue={settings.marketInfo.address}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">อีเมล</label>
                <input
                  type="email"
                  defaultValue={settings.marketInfo.email}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">เลขประจำตัวผู้เสียภาษี</label>
                <input
                  type="text"
                  defaultValue={settings.marketInfo.taxId}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        );

      case 'rates':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">อัตราค่าเช่าเริ่มต้น</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ค่าเช่ารายเดือน (บาท)</label>
                <input
                  type="number"
                  defaultValue={settings.defaultRates.monthlyRate}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ค่าเช่ารายปี (บาท)</label>
                <input
                  type="number"
                  defaultValue={settings.defaultRates.yearlyRate}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">การแจ้งเตือน</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">แจ้งเตือนทางอีเมล</p>
                  <p className="text-sm text-gray-600">ส่งการแจ้งเตือนผ่านอีเมล</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked={settings.notifications.enableEmail}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">แจ้งเตือนทาง SMS</p>
                  <p className="text-sm text-gray-600">ส่งการแจ้งเตือนผ่าน SMS</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked={settings.notifications.enableSMS}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">แจ้งเตือนก่อนครบกำหนด (วัน)</label>
                  <input
                    type="number"
                    defaultValue={settings.notifications.reminderDays}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">แจ้งเตือนเกินกำหนด (วัน)</label>
                  <input
                    type="number"
                    defaultValue={settings.notifications.overdueReminderDays}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'receipt':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">การตั้งค่าใบเสร็จ</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">คำนำหน้าเลขใบเสร็จ</label>
                <input
                  type="text"
                  defaultValue={settings.receipt.prefix}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">รวม QR Code ในใบเสร็จ</p>
                  <p className="text-sm text-gray-600">แสดง QR Code สำหรับการชำระเงิน</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked={settings.receipt.includeQR}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ข้อความท้ายใบเสร็จ</label>
                <textarea
                  defaultValue={settings.receipt.footer}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">ความปลอดภัย</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">บังคับเปลี่ยนรหัสผ่าน</p>
                  <p className="text-sm text-gray-600">บังคับให้ผู้ใช้เปลี่ยนรหัสผ่านเป็นระยะ</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked={settings.security.requirePasswordChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ความยาวรหัสผ่านขั้นต่ำ</label>
                <input
                  type="number"
                  defaultValue={settings.security.passwordMinLength}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">การยืนยันตัวตนสองขั้นตอน</p>
                  <p className="text-sm text-gray-600">เพิ่มความปลอดภัยด้วย 2FA</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked={settings.security.enableTwoFactor}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ตั้งค่าระบบ</h1>
          <p className="text-gray-600 mt-1">จัดการการตั้งค่าระบบและการกำหนดค่าต่างๆ</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSubmitting}
          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Save className="w-5 h-5" />
          <span>บันทึกการตั้งค่า</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default SettingsManagement;