'use client';

import React, { useState, useEffect } from 'react';
import { X, Building2, MapPin, DollarSign } from 'lucide-react';
import { Room } from '@/types';

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (roomData: Omit<Room, 'id'>) => Promise<void>;
  editingRoom?: Room | null;
}

const RoomModal: React.FC<RoomModalProps> = ({ isOpen, onClose, onSubmit, editingRoom }) => {
  const [formData, setFormData] = useState({
    roomNumber: '',
    size: '',
    dailyRate: '',
    monthlyRate: '',
    yearlyRate: '',
    status: 'vacant' as Room['status'],
    location: '',
    zone: 'A',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingRoom) {
      setFormData({
        roomNumber: editingRoom.roomNumber,
        size: editingRoom.size,
        dailyRate: editingRoom.dailyRate?.toString() || '',
        monthlyRate: editingRoom.monthlyRate.toString(),
        yearlyRate: editingRoom.yearlyRate.toString(),
        status: editingRoom.status,
        location: editingRoom.location,
        zone: editingRoom.zone,
        description: editingRoom.description || ''
      });
    } else {
      setFormData({
        roomNumber: '',
        size: '',
        dailyRate: '',
        monthlyRate: '',
        yearlyRate: '',
        status: 'vacant',
        location: '',
        zone: 'A',
        description: ''
      });
    }
    setErrors({});
  }, [editingRoom, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.roomNumber.trim()) {
      newErrors.roomNumber = 'กรุณากรอกหมายเลขห้อง';
    }
    if (!formData.size.trim()) {
      newErrors.size = 'กรุณากรอกขนาดห้อง';
    }
    if (!formData.dailyRate || parseFloat(formData.dailyRate) <= 0) {
      newErrors.dailyRate = 'กรุณากรอกค่าเช่ารายวันที่ถูกต้อง';
    }
    if (!formData.monthlyRate || parseFloat(formData.monthlyRate) <= 0) {
      newErrors.monthlyRate = 'กรุณากรอกค่าเช่ารายเดือนที่ถูกต้อง';
    }
    if (!formData.yearlyRate || parseFloat(formData.yearlyRate) <= 0) {
      newErrors.yearlyRate = 'กรุณากรอกค่าเช่ารายปีที่ถูกต้อง';
    }
    if (!formData.location.trim()) {
      newErrors.location = 'กรุณากรอกตำแหน่งห้อง';
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
      const roomData: Omit<Room, 'id'> = {
        roomNumber: formData.roomNumber.trim(),
        size: formData.size.trim(),
        dailyRate: parseFloat(formData.dailyRate),
        monthlyRate: parseFloat(formData.monthlyRate),
        yearlyRate: parseFloat(formData.yearlyRate),
        status: formData.status,
        location: formData.location.trim(),
        zone: formData.zone,
        description: formData.description.trim()
      };

      await onSubmit(roomData);
      onClose();
    } catch (error) {
      console.error('Error submitting room:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {editingRoom ? 'แก้ไขข้อมูลห้อง' : 'เพิ่มห้องเช่าใหม่'}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Room Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                หมายเลขห้อง <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.roomNumber}
                onChange={(e) => handleInputChange('roomNumber', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.roomNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="เช่น A001, B002"
              />
              {errors.roomNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.roomNumber}</p>
              )}
            </div>

            {/* Zone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                โซน <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.zone}
                onChange={(e) => handleInputChange('zone', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="A">โซน A</option>
                <option value="B">โซน B</option>
                <option value="C">โซน C</option>
                <option value="D">โซน D</option>
                <option value="E">โซน E</option>
                <option value="F">โซน F</option>
              </select>
            </div>

            {/* Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ขนาดห้อง <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.size}
                onChange={(e) => handleInputChange('size', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.size ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="เช่น 3x4 เมตร"
              />
              {errors.size && (
                <p className="text-red-500 text-sm mt-1">{errors.size}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                สถานะห้อง
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="vacant">ว่าง</option>
                <option value="occupied">ให้เช่าแล้ว</option>
                <option value="maintenance">ซ่อมแซม</option>
              </select>
            </div>

            {/* Daily Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ค่าเช่ารายวัน (บาท) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  value={formData.dailyRate}
                  onChange={(e) => handleInputChange('dailyRate', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.dailyRate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="100"
                  min="0"
                  step="10"
                />
              </div>
              {errors.dailyRate && (
                <p className="text-red-500 text-sm mt-1">{errors.dailyRate}</p>
              )}
            </div>

            {/* Monthly Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ค่าเช่ารายเดือน (บาท) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  value={formData.monthlyRate}
                  onChange={(e) => handleInputChange('monthlyRate', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.monthlyRate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="3000"
                  min="0"
                  step="100"
                />
              </div>
              {errors.monthlyRate && (
                <p className="text-red-500 text-sm mt-1">{errors.monthlyRate}</p>
              )}
            </div>

            {/* Yearly Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ค่าเช่ารายปี (บาท) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  value={formData.yearlyRate}
                  onChange={(e) => handleInputChange('yearlyRate', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.yearlyRate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="30000"
                  min="0"
                  step="1000"
                />
              </div>
              {errors.yearlyRate && (
                <p className="text-red-500 text-sm mt-1">{errors.yearlyRate}</p>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ตำแหน่ง/ที่อยู่ <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.location ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="เช่น โซน A แถว 1"
              />
            </div>
            {errors.location && (
              <p className="text-red-500 text-sm mt-1">{errors.location}</p>
            )}
          </div>

          {/* Description */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              รายละเอียดเพิ่มเติม
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับห้อง..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-6 border-t border-gray-200 mt-6">
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
                editingRoom ? 'อัปเดตห้อง' : 'เพิ่มห้องใหม่'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomModal;