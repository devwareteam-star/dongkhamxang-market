'use client';

import React from 'react';
import { useData } from '@/lib/contexts/DataContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { 
  CreditCard, 
  Receipt, 
  Clock, 
  CheckCircle,
  TrendingUp,
  Calendar
} from 'lucide-react';

const EmployeeDashboard: React.FC = () => {
  const { getDashboardStats, payments } = useData();
  const { user } = useAuth();
  const stats = getDashboardStats();

  // Get today's collections by this employee
  const today = new Date();
  const todayCollections = payments.filter(p => 
    p.paymentId === user?.id && 
    p.paidDate && 
    new Date(p.paidDate).toDateString() === today.toDateString()
  );

  const todayAmount = todayCollections.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">แดชบอร์ดพนักงาน</h1>
          <p className="text-gray-600 mt-1">สวัสดี คุณ{user?.name}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">วันที่</p>
          <p className="text-lg font-semibold text-gray-900">
            {today.toLocaleDateString('th-TH')}
          </p>
        </div>
      </div>

      {/* Today's Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-green-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">เก็บเงินวันนี้</p>
              <p className="text-2xl font-bold text-green-700 mt-1">
                {todayCollections.length} รายการ
              </p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">ยอดเงินวันนี้</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">
                ฿{todayAmount.toLocaleString()}
              </p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">ใบเสร็จออก</p>
              <p className="text-2xl font-bold text-purple-700 mt-1">
                {todayCollections.length}
              </p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <Receipt className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">งานที่ต้องทำวันนี้</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">รอเก็บเงิน</p>
                <p className="text-sm text-yellow-600">{stats.pendingPayments} ห้อง</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">เกินกำหนด</p>
                <p className="text-sm text-red-600">{stats.overduePayments} ห้อง</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Collections */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">การเก็บเงินล่าสุด</h3>
        <div className="space-y-3">
          {todayCollections.slice(0, 5).map((payment, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">ห้อง {payment.roomId}</p>
                  <p className="text-sm text-gray-600">
                    {payment.paidDate ? new Date(payment.paidDate).toLocaleTimeString('th-TH') : ''}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">฿{payment.amount.toLocaleString()}</p>
                <p className="text-xs text-gray-500">{payment.receiptNumber}</p>
              </div>
            </div>
          ))}
          {todayCollections.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>ยังไม่มีการเก็บเงินวันนี้</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;