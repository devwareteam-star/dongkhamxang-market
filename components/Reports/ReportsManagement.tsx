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
  const { getDashboardStats, payments, paidPayments, spaces, tenants } = useData();
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const stats = getDashboardStats();

  // Helper function to convert data to CSV
  const convertToCSV = (data: any[], headers: string[]) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',')
      )
    ].join('\n');
    return csvContent;
  };

  // Function to download CSV
  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateReport = () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    
    // Summary Report
    const summaryData = [{
      'ຊ່ວງເວລາ': `${dateRange.start} ຫາ ${dateRange.end}`,
      'ຫ້ອງທັງໝົດ': stats.totalRooms,
      'ຫ້ອງໃຫ້ເຊົ່າແລ້ວ': stats.occupiedRooms,
      'ຫ້ອງວ່າງ': stats.vacantRooms,
      'ຫ້ອງຊ່ອມແຊມ': stats.maintenanceRooms || 0,
      'ອັດຕາການເຊົ່າ (%)': stats.occupancyRate.toFixed(1),
      'ລາຍຮັບເດືອນນີ້ (₭)': stats.monthlyRevenue,
      'ລາຍຮັບປີນີ້ (₭)': stats.yearlyRevenue,
      'ອັດຕາການເກັບເງິນ (%)': stats.collectionRate.toFixed(1),
      'ລໍຖ້າຊຳລະ': stats.pendingPayments,
      'ເກີນກຳນົດ': stats.overduePayments,
      'ເກັບເງິນມື້ນີ້': stats.todayCollections,
      'ລາຍຮັບມື້ນີ້ (₭)': stats.todayRevenue
    }];

    // Export CSV
    const summaryHeaders = Object.keys(summaryData[0]);
    const summaryCSV = convertToCSV(summaryData, summaryHeaders);
    downloadCSV(summaryCSV, `ລາຍງານສະຫຼຸບ_${timestamp}.csv`);

    alert('ລາຍງານ CSV ຖືກສົ່ງອອກແລ້ວ!');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ລາຍງານ ແລະ ສະຖິຕິ</h1>
          <p className="text-gray-600 mt-1">ເບິ່ງລາຍງານ ແລະ ສະຖິຕິການດຳເນີນງານ</p>
        </div>
        <button
          onClick={generateReport}
          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Download className="w-5 h-5" />
          <span>ສົ່ງອອກລາຍງານ</span>
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">ຊ່ວງເວລາລາຍງານ</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ວັນທີ່ເລີ່ມຕົ້ນ</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ວັນທີ່ສິ້ນສຸດ</label>
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
              <p className="text-sm font-medium text-blue-600">ຫ້ອງທັງໝົດ</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">{stats.totalRooms}</p>
            </div>
            <Building2 className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-green-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">ອັດຕາການເຊົ່າ</p>
              <p className="text-2xl font-bold text-green-700 mt-1">{stats.occupancyRate.toFixed(1)}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">ລາຍຮັບເດືອນນີ້</p>
              <p className="text-2xl font-bold text-purple-700 mt-1">₭{stats.monthlyRevenue.toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">ອັດຕາການເກັບເງິນ</p>
              <p className="text-2xl font-bold text-orange-700 mt-1">{stats.collectionRate.toFixed(1)}%</p>
            </div>
            <BarChart3 className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Detailed Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">ສະຖານະຫ້ອງເຊົ່າ</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">ຫ້ອງທີ່ໃຫ້ເຊົ່າແລ້ວ</span>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="font-bold">{stats.occupiedRooms} ຫ້ອງ</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">ຫ້ອງວ່າງ</span>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span className="font-bold">{stats.vacantRooms} ຫ້ອງ</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">ຫ້ອງຊ່ອມແຊມ</span>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="font-bold">{stats.maintenanceRooms} ຫ້ອງ</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">ສະຖິຕິການຊຳລະເງິນ</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">ລໍຖ້າຊຳລະ</span>
              <span className="font-bold text-yellow-600">{stats.pendingPayments} ລາຍການ</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">ເກີນກຳນົດ</span>
              <span className="font-bold text-red-600">{stats.overduePayments} ລາຍການ</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">ເກັບເງິນມື້ນີ້</span>
              <span className="font-bold text-green-600">{stats.todayCollections} ລາຍການ</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">ລາຍຮັບມື້ນີ້</span>
              <span className="font-bold text-blue-600">₭{stats.todayRevenue.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsManagement;