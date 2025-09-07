'use client';

import React from 'react';
import { useData } from '@/lib/contexts/DataContext';
import { 
  Building2, 
  Users, 
  CreditCard, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { getDashboardStats } = useData();
  const stats = getDashboardStats();

  const statCards = [
    {
      title: 'ຫ້ອງທັງໝົດ',
      value: stats.totalRooms,
      icon: Building2,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      title: 'ຫ້ອງທີ່ໃຫ້ເຊົ່າແລ້ວ',
      value: stats.occupiedRooms,
      icon: Users,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    {
      title: 'ຫ້ອງວ່າງ',
      value: stats.vacantRooms,
      icon: Building2,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700'
    },
    {
      title: 'ລາຍໄດ້ມື້ນີ້',
      value: `₭${stats.todayRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ແດັຊບອດຜູ້ດູແລລະບົບ</h1>
          <p className="text-gray-600 mt-1">ພາບລວມການດຳເນີນງານຕະຫລາດ</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className={`${card.bgColor} rounded-xl p-6 border border-gray-200`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className={`text-2xl font-bold ${card.textColor} mt-1`}>
                    {card.value}
                  </p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">ສະຖານະການຊຳລະເງິນ</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="text-red-800 font-medium">ເກີນກຳນົດຊຳລະ</span>
              </div>
              <span className="text-red-600 font-bold">{stats.overduePayments} ຫ້ອງ</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-yellow-600" />
                <span className="text-yellow-800 font-medium">ລໍຊຳລະ</span>
              </div>
              <span className="text-yellow-600 font-bold">{stats.pendingPayments} ຫ້ອງ</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800 font-medium">ເກັບເງິນມື້ນີ້</span>
              </div>
              <span className="text-green-600 font-bold">{stats.todayCollections} ລາຍການ</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">ສະຖິຕິການດຳເນີນງານ</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">ອັດຕາການເຊົ່າ</span>
              <span className="font-bold text-blue-600">{stats.occupancyRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">ອັດຕາການເກັບເງິນ</span>
              <span className="font-bold text-green-600">{stats.collectionRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">ລາຍໄດ້ເດືອນນີ້</span>
              <span className="font-bold text-purple-600">₭{stats.monthlyRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">ລາຍໄດ້ປີນີ້</span>
              <span className="font-bold text-indigo-600">₭{stats.yearlyRevenue.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;