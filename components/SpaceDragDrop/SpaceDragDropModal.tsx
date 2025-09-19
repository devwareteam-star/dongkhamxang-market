import React, { useState } from 'react';
import { X, Building2, User, Calendar, MapPin, Phone, Mail, Edit3, UserX } from 'lucide-react';
import { Space } from '@/types';

interface SpaceDragDropModalProps {
  isOpen: boolean;
  onClose: () => void;
  space: Space | null;
  onEdit?: (space: Space) => void;
  onStatusChange?: (spaceId: string, status: Space['status']) => void;
  onRemoveTenant?: (spaceId: string) => void;
}

const SpaceDragDropModal: React.FC<SpaceDragDropModalProps> = ({
  isOpen,
  onClose,
  space,
  onEdit,
  onStatusChange,
  onRemoveTenant
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'tenant' | 'history'>('details');

  if (!isOpen || !space) return null;

  const getStatusColor = (status: Space['status']): string => {
    switch (status) {
      case 'vacant': return 'bg-green-100 text-green-800 border-green-200';
      case 'rented': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'maintainance': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: Space['status']): string => {
    switch (status) {
      case 'vacant': return 'ວ່າງ (Vacant)';
      case 'rented': return 'ເຊົ່າແລ້ວ (Rented)';
      case 'maintainance': return 'ຊ່ອມແຊມ (Maintenance)';
      default: return status;
    }
  };

  const getSpaceTypeLabel = (type: Space['spaceType']): string => {
    switch (type) {
      case 'table': return 'ໂຕະ (Table)';
      case 'room': return 'ຫ້ອງເຊົ່າ (Room)';
      case 'signage': return 'ປ້າຍ (Signage)';
      case 'booth': return 'ບູດ (Booth)';
      default: return type;
    }
  };

  const formatCurrency = (amount: number): string => {
    return `₭${amount.toLocaleString()}`;
  };

  const tabs = [
    { id: 'details', label: 'ລາຍລະອຽດ', icon: Building2 },
    { id: 'tenant', label: 'ຜູ້ເຊົ່າ', icon: User },
    { id: 'history', label: 'ປະຫວັດ', icon: Calendar }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'details':
        return (
          <div className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">ລະຫັດພື້ນທີ່</label>
                <p className="text-lg font-semibold text-gray-900">{space.spaceCode}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">ປະເພດ</label>
                <p className="text-lg font-semibold text-gray-900">{getSpaceTypeLabel(space.spaceType)}</p>
              </div>
              {space.zone && (
                <div>
                  <label className="text-sm font-medium text-gray-500">ໂຊນ</label>
                  <p className="text-lg font-semibold text-gray-900">Zone {space.zone}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">ສະຖານະ</label>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(space.status)}`}>
                  {getStatusLabel(space.status)}
                </span>
              </div>
            </div>

            {/* Rent Information */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-3">ຂໍ້ມູນຄ່າເຊົ່າ</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">ຄ່າເຊົ່າຕໍ່ເດືອນ</label>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(space.baseRentMonthly)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">ຮູບແບບການຈ່າຍ</label>
                  <p className="text-lg font-semibold text-gray-900">
                    {space.paymentFrequency === 'daily' ? 'ລາຍວັນ' : 
                     space.paymentFrequency === 'monthly' ? 'ລາຍເດືອນ' : 
                     space.paymentFrequency === 'yearly' ? 'ລາຍປີ' : 'ລາຍເດືອນ'}
                  </p>
                </div>
              </div>
            </div>

            {/* Position Information */}
            {space.position && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3">ຕຳແໜ່ງ</h4>
                <div className="flex items-center space-x-4">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    X: {space.position.x}, Y: {space.position.y}, Floor: {space.position.floor}
                  </span>
                </div>
              </div>
            )}

            {/* Product Category */}
            {space.productCategory && (
              <div className="border-t pt-4">
                <label className="text-sm font-medium text-gray-500">ປະເພດສິນຄ້າ</label>
                <p className="text-lg font-semibold text-gray-900">{space.productCategory}</p>
              </div>
            )}
          </div>
        );

      case 'tenant':
        return (
          <div className="space-y-4">
            {space.status === 'rented' && space.currentTenantId ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">ຂໍ້ມູນຼູ້ເຊົ່າ</h4>
                  {onRemoveTenant && (
                    <button
                      onClick={() => onRemoveTenant(space.id)}
                      className="flex items-center space-x-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <UserX className="w-4 h-4" />
                      <span>ລຶບຜູ້ເຊົ່າ</span>
                    </button>
                  )}
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <User className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">{space.currentTenantName}</p>
                      <p className="text-sm text-gray-600">ID: {space.currentTenantId}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">+856 20 1234 5678</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">tenant@example.com</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        ເລີ່ມເຊົ່າ: {space.createdAt.toLocaleDateString('lo-LA')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">ບໍ່ມີຜູ້ເຊົ່າ</p>
                <p className="text-sm text-gray-400">ພື້ນທີ່ນີ້ຍັງຫວ່າງຢູ່</p>
              </div>
            )}
          </div>
        );

      case 'history':
        return (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">ປະຫວັດການອັພເດດ</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">ສ້າງພື້ນທີ່</p>
                  <p className="text-xs text-gray-500">
                    {space.createdAt.toLocaleDateString('lo-LA')} ໂດຍ {space.createdBy}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">ອັພເດດຄັ້ງຫຼ້າສຸດ</p>
                  <p className="text-xs text-gray-500">
                    {space.updatedAt.toLocaleDateString('lo-LA')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{space.spaceCode}</h2>
              <p className="text-sm text-gray-600">{getSpaceTypeLabel(space.spaceType)}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {onEdit && (
              <button
                onClick={() => onEdit(space)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                <span>ແກ້ໄຂ</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {renderTabContent()}
        </div>

        {/* Footer Actions */}
        {onStatusChange && (
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">ປ່ຽນສະຖານະ:</label>
                <select
                  value={space.status}
                  onChange={(e) => onStatusChange(space.id, e.target.value as Space['status'])}
                  className="ml-3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="vacant">ວ່າງ (Vacant)</option>
                  <option value="rented">ເຊົ່າແລ້ວ (Rented)</option>
                  <option value="maintainance">ຊ່ອມແຊມ (Maintenance)</option>
                </select>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  ປິດ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpaceDragDropModal;