'use client';

import React, { useState, useEffect } from 'react';
import { X, UserCheck, Phone, Mail, MapPin, CreditCard, Calendar, User } from 'lucide-react';
import { Tenant, Room } from '@/types';
import { useData } from '@/lib/contexts/DataContext';

interface TenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (tenantData: Omit<Tenant, 'id'>) => Promise<void>;
  editingTenant?: Tenant | null;
}

const TenantModal: React.FC<TenantModalProps> = ({ isOpen, onClose, onSubmit, editingTenant }) => {
  const { rooms, loading } = useData();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    idCard: '',
    address: '',
    roomId: '',
    contractType: 'monthly' as 'daily' | 'monthly' | 'yearly',
    deposit: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get available rooms (vacant only)
  const availableRooms = rooms.filter(room => room.status === 'vacant' || room.status === 'maintenance');
  
  console.log('Available rooms:', availableRooms); // Debug log

  useEffect(() => {
    if (editingTenant) {
      setFormData({
        name: editingTenant.name,
        phone: editingTenant.phone,
        email: editingTenant.email || '',
        idCard: editingTenant.idCard,
        address: editingTenant.address,
        roomId: editingTenant.roomId,
        contractType: editingTenant.contractType,
        deposit: editingTenant.deposit.toString(),
        emergencyContactName: editingTenant.emergencyContact?.name || '',
        emergencyContactPhone: editingTenant.emergencyContact?.phone || '',
        emergencyContactRelation: editingTenant.emergencyContact?.relation || ''
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        idCard: '',
        address: '',
        roomId: '',
        contractType: 'monthly',
        deposit: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        emergencyContactRelation: ''
      });
    }
    setErrors({});
  }, [editingTenant, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'กรุณากรอกชื่อผู้เช่า';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'กรุณากรอกเบอร์โทรศัพท์';
    } else if (!/^[0-9-]+$/.test(formData.phone)) {
      newErrors.phone = 'เบอร์โทรศัพท์ไม่ถูกต้อง';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'อีเมลไม่ถูกต้อง';
    }
    if (!formData.idCard.trim()) {
      newErrors.idCard = 'กรุณากรอกเลขบัตรประชาชน';
    } else if (!/^[0-9]{13}$/.test(formData.idCard.replace(/[^0-9]/g, ''))) {
      newErrors.idCard = 'เลขบัตรประชาชนต้องมี 13 หลัก';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'กรุณากรอกที่อยู่';
    }
    if (!formData.roomId) {
      newErrors.roomId = 'กรุณาเลือกห้องเช่า';
    }
    if (!formData.deposit || parseFloat(formData.deposit) <= 0) {
      newErrors.deposit = 'กรุณากรอกจำนวนเงินมัดจำที่ถูกต้อง';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const tenantData: Omit<Tenant, 'id'> = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        idCard: formData.idCard.trim(),
        address: formData.address.trim(),
        roomId: formData.roomId,
        startDate: new Date(),
        contractType: formData.contractType,
        deposit: parseFloat(formData.deposit),
        isActive: true,
        emergencyContact: formData.emergencyContactName ? {
          name: formData.emergencyContactName.trim(),
          phone: formData.emergencyContactPhone.trim(),
          relation: formData.emergencyContactRelation.trim()
        } : undefined
      };

      await onSubmit(tenantData);
      onClose();
    } catch (error) {
      console.error('Error submitting tenant:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Auto-suggest deposit when room is selected
    if (field === 'roomId' && value) {
      const room = rooms.find(r => r.id === value);
      console.log('Selected room:', room); // Debug log
      if (room && !formData.deposit) {
        const suggestedDeposit = room.monthlyRate ? (room.monthlyRate * 2).toString() : '';
        console.log('Suggested deposit:', suggestedDeposit); // Debug log
        setFormData(prev => ({
          ...prev, 
          [field]: value,
          deposit: suggestedDeposit // Suggest 2 months deposit
        }));
      } else {
        setFormData(prev => ({ ...prev, [field]: value }));
      }
    }
  };

  const getSelectedRoom = () => {
    return rooms.find(room => room.id === formData.roomId);
  };

  const selectedRoom = getSelectedRoom();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <UserCheck className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {editingTenant ? 'แก้ไขข้อมูลผู้เช่า' : 'เพิ่มผู้เช่าใหม่'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Personal Information */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-600" />
              ข้อมูลส่วนตัว
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อ-นามสกุล <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="กรอกชื่อ-นามสกุล"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="081-234-5678"
                  />
                </div>
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  อีเมล
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="example@email.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เลขบัตรประชาชน <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.idCard}
                  onChange={(e) => handleInputChange('idCard', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.idCard ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="1-2345-67890-12-3"
                  maxLength={17}
                />
                {errors.idCard && (
                  <p className="text-red-500 text-sm mt-1">{errors.idCard}</p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ที่อยู่ <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <textarea
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.address ? 'border-red-500' : 'border-gray-300'
                  }`}
                  rows={3}
                  placeholder="กรอกที่อยู่ปัจจุบัน"
                />
              </div>
              {errors.address && (
                <p className="text-red-500 text-sm mt-1">{errors.address}</p>
              )}
            </div>
          </div>

          {/* Rental Information */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-green-600" />
              ข้อมูลการเช่า
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เลือกห้องเช่า <span className="text-red-500">*</span>
                </label>
                {loading && (
                  <div className="text-sm text-gray-500 mb-2">กำลังโหลดข้อมูลห้อง...</div>
                )}
                {!loading && availableRooms.length === 0 && (
                  <div className="text-sm text-red-500 mb-2">ไม่มีห้องว่างให้เลือก</div>
                )}
                <select
                  value={formData.roomId}
                  onChange={(e) => handleInputChange('roomId', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.roomId ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={loading || availableRooms.length === 0}
                >
                  <option value="">
                    {loading ? 'กำลังโหลด...' : 
                     availableRooms.length === 0 ? 'ไม่มีห้องว่าง' : 'เลือกห้องเช่า'}
                  </option>
                  {availableRooms.map(room => (
                    <option key={room.id} value={room.id}>
                      ห้อง {room.roomNumber} - โซน {room.zone} - {room.size} - ฿{room.monthlyRate?.toLocaleString() || '0'}/เดือน
                    </option>
                  ))}
                </select>
                {errors.roomId && (
                  <p className="text-red-500 text-sm mt-1">{errors.roomId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ประเภทสัญญา
                </label>
                <select
                  value={formData.contractType}
                  onChange={(e) => handleInputChange('contractType', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="daily">รายวัน</option>
                  <option value="monthly">รายเดือน</option>
                  <option value="yearly">รายปี</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เงินมัดจำ (บาท) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={formData.deposit}
                    onChange={(e) => handleInputChange('deposit', e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.deposit ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={selectedRoom ? `แนะนำ: ${(selectedRoom.monthlyRate * 2).toLocaleString()}` : "0"}
                    min="0"
                    step="100"
                  />
                </div>
                {errors.deposit && (
                  <p className="text-red-500 text-sm mt-1">{errors.deposit}</p>
                )}
                {selectedRoom && selectedRoom.monthlyRate && (
                  <p className="text-sm text-gray-500 mt-1">
                    แนะนำเงินมัดจำ: ฿{(selectedRoom.monthlyRate * 2).toLocaleString()} (2 เดือน)
                  </p>
                )}
              </div>
            </div>

            {/* Room Details Display */}
            {selectedRoom && (
              <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200 shadow-sm">
                <h4 className="font-medium text-blue-900 mb-2">รายละเอียดห้องที่เลือก</h4>
                <div className="text-sm text-green-600 mb-4">
                  ✓ ข้อมูลห้องถูกโหลดจากระบบจัดการห้องเช่า
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <span className="text-blue-600 text-xs font-medium">หมายเลขห้อง</span>
                      <p className="font-bold text-lg text-gray-900">{selectedRoom.roomNumber || 'ไม่ระบุ'}</p>
                    </div>
                  </div>
                  <div>
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <span className="text-blue-600 text-xs font-medium">โซน</span>
                      <p className="font-bold text-lg text-gray-900">โซน {selectedRoom.zone || 'ไม่ระบุ'}</p>
                    </div>
                  </div>
                  <div>
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <span className="text-blue-600 text-xs font-medium">ขนาดห้อง</span>
                      <p className="font-bold text-lg text-gray-900">{selectedRoom.size || 'ไม่ระบุ'}</p>
                    </div>
                  </div>
                  <div>
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <span className="text-blue-600 text-xs font-medium">ตำแหน่ง</span>
                      <p className="font-bold text-lg text-gray-900">{selectedRoom.location || 'ไม่ระบุ'}</p>
                    </div>
                  </div>
                </div>
                
                {/* Pricing Information */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-orange-700 font-medium">ค่าเช่ารายวัน</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-800 mt-1">฿{selectedRoom.dailyRate?.toLocaleString() || '0'}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-green-700 font-medium">ค่าเช่ารายเดือน</span>
                    </div>
                    <p className="text-2xl font-bold text-green-800 mt-1">฿{selectedRoom.monthlyRate?.toLocaleString() || '0'}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-blue-700 font-medium">ค่าเช่ารายปี</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-800 mt-1">฿{selectedRoom.yearlyRate?.toLocaleString() || '0'}</p>
                    {selectedRoom.monthlyRate && selectedRoom.yearlyRate && (
                      <p className="text-sm text-blue-600 mt-1">
                        ประหยัด ฿{((selectedRoom.monthlyRate * 12) - selectedRoom.yearlyRate).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Room Description */}
                {selectedRoom.description && (
                  <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                    <span className="text-gray-600 text-sm font-medium">รายละเอียดห้อง:</span>
                    <p className="text-gray-800 mt-1">{selectedRoom.description}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Emergency Contact */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Phone className="w-5 h-5 mr-2 text-orange-600" />
              ผู้ติดต่อฉุกเฉิน
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อผู้ติดต่อ
                </label>
                <input
                  type="text"
                  value={formData.emergencyContactName}
                  onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ชื่อผู้ติดต่อฉุกเฉิน"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เบอร์โทรศัพท์
                </label>
                <input
                  type="tel"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="081-234-5678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ความสัมพันธ์
                </label>
                <select
                  value={formData.emergencyContactRelation}
                  onChange={(e) => handleInputChange('emergencyContactRelation', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">เลือกความสัมพันธ์</option>
                  <option value="พ่อ">พ่อ</option>
                  <option value="แม่">แม่</option>
                  <option value="พี่">พี่</option>
                  <option value="น้อง">น้อง</option>
                  <option value="สามี">สามี</option>
                  <option value="ภรรยา">ภรรยา</option>
                  <option value="เพื่อน">เพื่อน</option>
                  <option value="อื่นๆ">อื่นๆ</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>กำลังบันทึก...</span>
                </div>
              ) : (
                editingTenant ? 'อัปเดตข้อมูลผู้เช่า' : 'เพิ่มผู้เช่าใหม่'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TenantModal;