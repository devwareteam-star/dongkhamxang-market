'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/contexts/DataContext';
import { Room } from '@/types';
import RoomModal from './RoomModal';
import { 
  Building2, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Users,
  MapPin
} from 'lucide-react';

const RoomManagement: React.FC = () => {
  const { rooms, addRoom, updateRoom, deleteRoom, tenants } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || room.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddRoom = () => {
    setEditingRoom(null);
    setIsRoomModalOpen(true);
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    setIsRoomModalOpen(true);
  };

  const handleDeleteRoom = async (roomId: string) => {
    // Check if room has active tenant
    const roomTenant = tenants.find(t => t.roomId === roomId && t.isActive);
    if (roomTenant) {
      alert('ไม่สามารถลบห้องได้ เนื่องจากมีผู้เช่าอยู่');
      return;
    }

    if (confirm('คุณแน่ใจหรือไม่ที่จะลบห้องนี้? การดำเนินการนี้ไม่สามารถยกเลิกได้')) {
      setIsSubmitting(true);
      try {
        await deleteRoom(roomId);
        alert('ลบห้องเรียบร้อยแล้ว');
      } catch (error) {
        alert('เกิดข้อผิดพลาดในการลบห้อง');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSubmitRoom = async (roomData: Omit<Room, 'id'>) => {
    setIsSubmitting(true);
    try {
      if (editingRoom) {
        await updateRoom(editingRoom.id, roomData);
      } else {
        await addRoom(roomData);
      }
      setIsRoomModalOpen(false);
      setEditingRoom(null);
    } catch (error) {
      console.error('Error submitting room:', error);
      throw error; // Re-throw to let modal handle the error
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: Room['status']) => {
    switch (status) {
      case 'occupied':
        return 'bg-green-100 text-green-800';
      case 'vacant':
        return 'bg-yellow-100 text-yellow-800';
      case 'maintenance':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Room['status']) => {
    switch (status) {
      case 'occupied':
        return 'ให้เช่าแล้ว';
      case 'vacant':
        return 'ว่าง';
      case 'maintenance':
        return 'ซ่อมแซม';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">จัดการห้องเช่า</h1>
          <p className="text-gray-600 mt-1">จัดการข้อมูลห้องเช่าทั้งหมด {rooms.length} ห้อง</p>
        </div>
        <button
          onClick={handleAddRoom}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>เพิ่มห้องใหม่</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาหมายเลขห้องหรือตำแหน่ง..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="all">สถานะทั้งหมด</option>
              <option value="vacant">ว่าง</option>
              <option value="occupied">ให้เช่าแล้ว</option>
              <option value="maintenance">ซ่อมแซม</option>
            </select>
          </div>

          <div className="flex items-center justify-center text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-3">
            <Building2 className="w-4 h-4 mr-2" />
            แสดง {filteredRooms.length} ห้อง
          </div>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredRooms.map((room) => {
          const tenant = tenants.find(t => t.roomId === room.id && t.isActive);
          
          return (
            <div key={room.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">ห้อง {room.roomNumber}</h3>
                  <p className="text-sm text-gray-600 flex items-center mt-1">
                    <MapPin className="w-3 h-3 mr-1" />
                    {room.location}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(room.status)}`}>
                  {getStatusText(room.status)}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ขนาด:</span>
                  <span className="font-medium">{room.size}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">รายวัน:</span>
                  <span className="font-medium text-orange-600">฿{room.dailyRate?.toLocaleString() || '0'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">รายเดือน:</span>
                  <span className="font-medium text-green-600">฿{room.monthlyRate.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">รายปี:</span>
                  <span className="font-medium text-blue-600">฿{room.yearlyRate.toLocaleString()}</span>
                </div>
                {tenant && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">ผู้เช่า:</span>
                    <span className="font-medium text-purple-600">
                      {tenant.name}
                    </span>
                  </div>
                )}
                {tenant && tenant.startDate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">เริ่มเช่า:</span>
                    <span className="font-medium text-gray-700">
                      {new Date(tenant.startDate).toLocaleDateString('th-TH')}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditRoom(room)}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-sm"
                >
                  <Edit className="w-4 h-4" />
                  <span>แก้ไข</span>
                </button>
                <button
                  onClick={() => handleDeleteRoom(room.id)}
                  disabled={isSubmitting}
                  className="flex items-center justify-center px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredRooms.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบห้องเช่า</h3>
          <p className="text-gray-600">ไม่มีห้องที่ตรงกับเงื่อนไขการค้นหา</p>
        </div>
      )}

      {/* Room Modal */}
      <RoomModal
        isOpen={isRoomModalOpen}
        onClose={() => {
          setIsRoomModalOpen(false);
          setEditingRoom(null);
        }}
        onSubmit={handleSubmitRoom}
        editingRoom={editingRoom}
      />
    </div>
  );
};

export default RoomManagement;