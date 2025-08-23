'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/contexts/DataContext';
import { 
  Search, 
  Filter, 
  MapPin,
  DollarSign,
  Building2,
  Users
} from 'lucide-react';

const RoomSearch: React.FC = () => {
  const { rooms, tenants } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('all');

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || room.status === statusFilter;
    const matchesZone = zoneFilter === 'all' || room.zone === zoneFilter;
    return matchesSearch && matchesStatus && matchesZone;
  });

  const zones = [...new Set(rooms.map(room => room.zone))].sort();

  const getStatusColor = (status: string) => {
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

  const getStatusText = (status: string) => {
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">ค้นหาห้องเช่า</h1>
        <p className="text-gray-600 mt-1">ค้นหาและดูข้อมูลห้องเช่าในตลาด</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="all">โซนทั้งหมด</option>
              {zones.map(zone => (
                <option key={zone} value={zone}>โซน {zone}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-center text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-3">
            <Building2 className="w-4 h-4 mr-2" />
            พบ {filteredRooms.length} ห้อง
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredRooms.map((room) => {
          const tenant = tenants.find(t => t.roomId === room.id);
          
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

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ขนาด:</span>
                  <span className="font-medium">{room.size}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-orange-50 p-2 rounded">
                    <p className="text-orange-600 text-xs">รายวัน</p>
                    <p className="font-bold text-orange-700">฿{room.dailyRate?.toLocaleString() || '0'}</p>
                  </div>
                  <div className="bg-green-50 p-2 rounded">
                    <p className="text-green-600 text-xs">รายเดือน</p>
                    <p className="font-bold text-green-700">฿{room.monthlyRate.toLocaleString()}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="bg-blue-50 p-2 rounded">
                    <p className="text-blue-600 text-xs">รายปี</p>
                    <p className="font-bold text-blue-700">฿{room.yearlyRate.toLocaleString()}</p>
                  </div>
                </div>

                {tenant && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">ผู้เช่าปัจจุบัน</span>
                    </div>
                    <p className="text-sm text-gray-900">{tenant.name}</p>
                    <p className="text-xs text-gray-600">{tenant.phone}</p>
                  </div>
                )}
              </div>

              {room.description && (
                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  {room.description}
                </div>
              )}
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
    </div>
  );
};

export default RoomSearch;