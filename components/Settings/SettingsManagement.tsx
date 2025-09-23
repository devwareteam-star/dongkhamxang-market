'use client';

import React, { useState, useEffect } from 'react';
import { useData } from '@/lib/contexts/DataContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { StorageService } from '@/lib/firebase/firestore';
import { 
  Settings, 
  Building2, 
  DollarSign, 
  Bell, 
  Receipt,
  Shield,
  Save,
  Upload,
  Eye,
  X
} from 'lucide-react';

const SettingsManagement: React.FC = () => {
  const { settings, updateSettings, addNotification } = useData();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('market');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(settings);

  useEffect(() => {
  setFormData(settings);
}, [settings]);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      updateSettings(formData);
      
      // Add notification about settings change
      // await addNotification({
      //   recipientType: 'admin',
      //   recipientId: user?.userId || '1',
      //   type: 'maintenance_notice',
      //   title: 'ການຕັ້ງຄ່າລະບົບຖືກອັບເດດ',
      //   message: `ການຕັ້ງຄ່າລະບົບຖືກອັບເດດໂດຍ ${user?.displayName}`,
      //   channels: ['email']
      // });
      
      alert('ການຕັ້ງຄ່າຖືກບັນທຶກແລ້ວ');
    } catch (error) {
      alert('ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກການຕັ້ງຄ່າ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }));
  };
  const handleQRImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (file) {
    try {
      // Upload to Firebase Storage
      const { downloadURL, path } = await StorageService.uploadQRCodeImage(file, 'qr-code');
      
      // Update form data
      setFormData(prev => ({
        ...prev,
        defaultRates: {
          ...prev.defaultRates,
          qrCodeImageUrl: downloadURL,
          qrCodeImagePath: path
        }
      }));
    } catch (error) {
      alert('ອັບໂຫຼດ QR Code ລົ້ມເຫຼວ');
    }
  }
};



const removeQRImage = async () => {
  if (formData.defaultRates.qrCodeImagePath) {
    await StorageService.deletePaymentImage(formData.defaultRates.qrCodeImagePath);
  }
  
  setFormData(prev => ({
    ...prev,
    defaultRates: {
      ...prev.defaultRates,
      qrCodeImageUrl: undefined,
      qrCodeImagePath: undefined
    }
  }));
};

  const tabs = [
    { id: 'market', label: 'ຂໍ້ມູນຕະຫຼາດ', icon: Building2 },
    { id: 'rates', label: 'ອັດຕາຄ່າເຊົ່າ', icon: DollarSign },
    // { id: 'notifications', label: 'ການແຈ້ງເຕືອນ', icon: Bell },
    { id: 'receipt', label: 'ໃບເສັດ', icon: Receipt },
    // { id: 'security', label: 'ຄວາມປອດໄພ', icon: Shield }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'market':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">ຂໍ້ມູນຕະຫຼາດ</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ຊື່ຕະຫຼາດ</label>
                <input
                  type="text"
                  value={formData.marketInfo.name}
                  onChange={(e) => handleInputChange('marketInfo', 'name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ເບີໂທລະສັບ</label>
                <input
                  type="text"
                  value={formData.marketInfo.phone}
                  onChange={(e) => handleInputChange('marketInfo', 'phone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">ທີ່ຢູ່</label>
                <textarea
                  value={formData.marketInfo.address}
                  onChange={(e) => handleInputChange('marketInfo', 'address', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ອີເມລ</label>
                <input
                  type="email"
                  value={formData.marketInfo.email}
                  onChange={(e) => handleInputChange('marketInfo', 'email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ເລກປະຈຳຕົວຜູ້ເສັຽພາສີ</label>
                <input
                  type="text"
                  value={formData.marketInfo.taxId || ''}
                  onChange={(e) => handleInputChange('marketInfo', 'taxId', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        );

      case 'rates':
        return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">ອັດຕາຄ່າເຊົ່າເລີ່ມຕົ້ນ</h3>
      
      {/* Existing rate inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ຄ່າເຊົ່າລາຍວັນ (KIP)</label>
                <input
                  type="number"
                  value={formData.defaultRates.dailyRate}
                  onChange={(e) => handleInputChange('defaultRates', 'dailyRate', parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ຄ່າເຊົ່າລາຍເດືອນ (KIP)</label>
                <input
                  type="number"
                  value={formData.defaultRates.monthlyRate}
                  onChange={(e) => handleInputChange('defaultRates', 'monthlyRate', parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ຄ່າເຊົ່າລາຍປີ (KIP)</label>
                <input
                  type="number"
                  value={formData.defaultRates.yearlyRate}
                  onChange={(e) => handleInputChange('defaultRates', 'yearlyRate', parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
      </div>

      {/* QR Code Section */}
      <div className="border-t pt-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">QR Code ສຳລັບການຊຳລະ</h4>
        
{!formData.defaultRates.qrCodeImageUrl ? (
  <div className="max-w-md">
    <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors cursor-pointer">
      <Upload className="w-8 h-8 text-gray-400 mb-2" />
      <span className="text-sm font-medium text-gray-600">ອັບໂຫຼດ QR Code</span>
      <input
        type="file"
        accept="image/*"
        onChange={handleQRImageUpload}
        className="hidden"
      />
    </label>
  </div>
) : (
  <div className="flex items-start space-x-4 max-w-md">
    <img
      src={formData.defaultRates.qrCodeImageUrl}
      alt="QR Code"
      className="w-24 h-24 object-cover rounded-lg border border-gray-300 cursor-pointer hover:opacity-80 transition-opacity"
    />
    <div className="flex-1">
      <p className="text-sm font-medium text-gray-900">QR Code ສຳລັບການຊຳລະ</p>
      <p className="text-xs text-gray-500 mt-1">ໃຊ້ສຳລັບສະແດງໃນ Payment Modal</p>
      <div className="flex space-x-2 mt-3">
        <label className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded cursor-pointer flex items-center space-x-1">
          <Upload className="w-3 h-3" />
          <span>ເລືອກໃໝ່</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleQRImageUpload}
            className="hidden"
          />
        </label>
        <button
          type="button"
          onClick={removeQRImage}
          className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded flex items-center space-x-1"
        >
          <X className="w-3 h-3" />
          <span>ລຶບ</span>
        </button>
      </div>
    </div>
  </div>
)}
        
        <p className="text-xs text-gray-500 mt-3">
          QR Code ນີ້ຈະສະແດງໃນ Payment Modal ເມື່ອຜູ້ໃຊ້ເລືອກການຊຳລະແບບໂອນເງິນ
        </p>
      </div>
    </div>
  );

      case 'notifications':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">ການແຈ້ງເຕືອນ</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">ແຈ້ງເຕືອນທາງອີເມລ</p>
                  <p className="text-sm text-gray-600">ສົ່ງການແຈ້ງເຕືອນຜ່ານອີເມລ</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.notifications.enableEmail}
                  onChange={(e) => handleInputChange('notifications', 'enableEmail', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">ແຈ້ງເຕືອນທາງ SMS</p>
                  <p className="text-sm text-gray-600">ສົ່ງການແຈ້ງເຕືອນຜ່ານ SMS</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.notifications.enableSMS}
                  onChange={(e) => handleInputChange('notifications', 'enableSMS', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ແຈ້ງເຕືອນກ່ອນຄົບກຳນົດ (ວັນ)</label>
                  <input
                    type="number"
                    value={formData.notifications.reminderDays}
                    onChange={(e) => handleInputChange('notifications', 'reminderDays', parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ແຈ້ງເຕືອນເກີນກຳນົດ (ວັນ)</label>
                  <input
                    type="number"
                    value={formData.notifications.overdueReminderDays}
                    onChange={(e) => handleInputChange('notifications', 'overdueReminderDays', parseInt(e.target.value))}
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
            <h3 className="text-lg font-semibold text-gray-900">ການຕັ້ງຄ່າໃບເສັດ</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ຄຳນຳໜ້າເລກໃບເສັດ</label>
                <input
                  type="text"
                  value={formData.receipt.prefix}
                  onChange={(e) => handleInputChange('receipt', 'prefix', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">ລວມ QR Code ໃນໃບເສັດ</p>
                  <p className="text-sm text-gray-600">ສະແດງ QR Code ສຳລັບການຊຳລະເງິນ</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.receipt.includeQR}
                  onChange={(e) => handleInputChange('receipt', 'includeQR', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ຂໍ້ຄວາມທ້າຍໃບເສັດ</label>
                <textarea
                  value={formData.receipt.footer}
                  onChange={(e) => handleInputChange('receipt', 'footer', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ແມ່ແບບໃບເສັດ</label>
                <select
                  value={formData.receipt.template}
                  onChange={(e) => handleInputChange('receipt', 'template', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="standard">ມາດຕະຖານ</option>
                  <option value="modern">ທັນສະໄໝ</option>
                  <option value="minimal">ງ່າຍ</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">ຄວາມປອດໄພ</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">ບັງຄັບປ່ຽນລະຫັດຜ່ານ</p>
                  <p className="text-sm text-gray-600">ບັງຄັບໃຫ້ຜູ້ໃຊ້ປ່ຽນລະຫັດຜ່ານເປັນລະຍະ</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.security.requirePasswordChange}
                  onChange={(e) => handleInputChange('security', 'requirePasswordChange', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ຄວາມຍາວລະຫັດຜ່ານຂັ້ນຕ່ຳ</label>
                <input
                  type="number"
                  value={formData.security.passwordMinLength}
                  onChange={(e) => handleInputChange('security', 'passwordMinLength', parseInt(e.target.value))}
                  min="4"
                  max="50"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">ການຢັ້ງຢືນຕົວຕົນສອງຂັ້ນຕອນ</p>
                  <p className="text-sm text-gray-600">ເພີ່ມຄວາມປອດໄພດ້ວຍ 2FA</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.security.enableTwoFactor}
                  onChange={(e) => handleInputChange('security', 'enableTwoFactor', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">ຈຳກັດ IP Address</p>
                  <p className="text-sm text-gray-600">ຈຳກັດການເຂົ້າເຖິງຈາກ IP ສະເພາະ</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.security.ipRestriction}
                  onChange={(e) => handleInputChange('security', 'ipRestriction', e.target.checked)}
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
          <h1 className="text-3xl font-bold text-gray-900">ຕັ້ງຄ່າລະບົບ</h1>
          <p className="text-gray-600 mt-1">ຈັດການການຕັ້ງຄ່າລະບົບແລະການກຳນົດຄ່າຕ່າງໆ</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSubmitting}
          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>ກຳລັງບັນທຶກ...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>ບັນທຶກການຕັ້ງຄ່າ</span>
            </>
          )}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
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