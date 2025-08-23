'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/contexts/DataContext';
import { 
  BarChart3, 
  Download, 
  Calendar,
  TrendingUp,
  DollarSign,
  Building2,
  Users
} from 'lucide-react';

const ReportsManagement: React.FC = () => {
  const { getDashboardStats, payments, rooms, tenants } = useData();
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const stats = getDashboardStats();

  const generateReport = () => {
    const reportData = {
      period: `${dateRange.start} ถึง ${dateRange.end}`,
      totalRooms: stats.totalRooms,
      occupiedRooms: stats.occupiedRooms,
      vacantRooms: stats.vacantRooms,
      monthlyRevenue: stats.monthlyRevenue,
      yearlyRevenue: stats.yearlyRevenue,
      occupancyRate: stats.occupancyRate,
      collectionRate: stats.collectionRate
    };

    console.log('Generated Report:', reportData);
    alert('รายงานถูกสร้างแล้ว (ดูใน Console)');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">รายงานและสถิติ</h1>
          <p className="text-gray-600 mt-1">ดูรายงานและสถิติการดำเนินงาน</p>
        </div>
        <button
          onClick={generateReport}
          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Download className="w-5 h-5" />
          <span>ส่งออกรายงาน</span>
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">ช่วงเวลารายงาน</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">วันที่เริ่มต้น</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">วันที่สิ้นสุด</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">ห้องทั้งหมด</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">{stats.totalRooms}</p>
            </div>
            <Building2 className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-green-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">อัตราการเช่า</p>
              <p className="text-2xl font-bold text-green-700 mt-1">{stats.occupancyRate.toFixed(1)}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">รายได้เดือนนี้</p>
              <p className="text-2xl font-bold text-purple-700 mt-1">฿{stats.monthlyRevenue.toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">อัตราการเก็บเงิน</p>
              <p className="text-2xl font-bold text-orange-700 mt-1">{stats.collectionRate.toFixed(1)}%</p>
            </div>
            <BarChart3 className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Detailed Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">สถานะห้องเช่า</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">ห้องที่ให้เช่าแล้ว</span>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="font-bold">{stats.occupiedRooms} ห้อง</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">ห้องว่าง</span>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span className="font-bold">{stats.vacantRooms} ห้อง</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">ห้องซ่อมแซม</span>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="font-bold">{stats.maintenanceRooms} ห้อง</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">สถิติการชำระเงิน</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">รอชำระ</span>
              <span className="font-bold text-yellow-600">{stats.pendingPayments} รายการ</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">เกินกำหนด</span>
              <span className="font-bold text-red-600">{stats.overduePayments} รายการ</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">เก็บเงินวันนี้</span>
              <span className="font-bold text-green-600">{stats.todayCollections} รายการ</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">รายได้วันนี้</span>
              <span className="font-bold text-blue-600">฿{stats.todayRevenue.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsManagement;