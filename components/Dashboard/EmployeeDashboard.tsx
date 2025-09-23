'use client';

import React, { useMemo } from 'react';
import { useData } from '@/lib/contexts/DataContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { 
  CreditCard, 
  Receipt, 
  Clock, 
  CheckCircle,
  TrendingUp,
  Calendar,
  AlertTriangle,
  Package
} from 'lucide-react';

const EmployeeDashboard: React.FC = () => {
  const { payments, spaces, tenants, loading } = useData();
  const { user } = useAuth();

  // Get today's date range
  const today = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    return { startOfDay, endOfDay, now };
  }, []);

  // Get today's collections by this employee
  const todayCollections = useMemo(() => {
    return payments.filter(payment => {
      if (!payment.paymentDate && !payment.paidDate) return false;
      
      const paymentDateValue = payment.paymentDate || payment.paidDate;
      if (!paymentDateValue) return false;
      
      const paymentDate = new Date(paymentDateValue);
      return (
        payment.processedBy === user?.id &&
        (payment.status === 'paid' || payment.paymentStatus === 'paid') &&
        paymentDate >= today.startOfDay && 
        paymentDate < today.endOfDay
      );
    });
  }, [payments, user?.id, today]);

  // Calculate statistics
  const stats = useMemo(() => {
    // Pending payments (due today or overdue, not paid)
    const pendingPayments = payments.filter(payment => {
      if (payment.status === 'paid' || payment.paymentStatus === 'paid') return false;
      if (!payment.dueDate) return false;
      
      const dueDate = new Date(payment.dueDate);
      return dueDate <= today.now;
    });

    // Overdue payments (due before today, not paid)
    const overduePayments = payments.filter(payment => {
      if (payment.status === 'paid' || payment.paymentStatus === 'paid') return false;
      if (!payment.dueDate) return false;
      
      const dueDate = new Date(payment.dueDate);
      return dueDate < today.startOfDay;
    });

    // Today's total amount collected by this employee
    const todayAmount = todayCollections.reduce((sum, payment) => {
      return sum + (payment.amountPaid || payment.amountDue || payment.amount || 0);
    }, 0);

    return {
      pendingPayments: pendingPayments.length,
      overduePayments: overduePayments.length,
      todayCollections: todayCollections.length,
      todayAmount
    };
  }, [payments, todayCollections, today]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">ກຳລັງໂຫຼດຂໍ້ມູນ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">ແດັຊບອດພະນັກງານ</h1>
          <p className="text-gray-600 mt-1">ສະບາຍດີ {user?.name || 'ພະນັກງານ'}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">ວັນທີ</p>
          <p className="text-lg font-semibold text-gray-900">
            {today.now.toLocaleDateString('lo-LA')}
          </p>
        </div>
      </div>

      {/* Today's Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-green-50 rounded-xl p-4 md:p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">ເກັບເງິນວັນນີ້</p>
              <p className="text-xl md:text-2xl font-bold text-green-700 mt-1">
                {stats.todayCollections} ລາຍການ
              </p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <CreditCard className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-xl p-4 md:p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">ຍອດເງິນວັນນີ້</p>
              <p className="text-xl md:text-2xl font-bold text-blue-700 mt-1">
                ₭{stats.todayAmount.toLocaleString()}
              </p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-xl p-4 md:p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">ໃບເສັດອອກ</p>
              <p className="text-xl md:text-2xl font-bold text-purple-700 mt-1">
                {stats.todayCollections}
              </p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <Receipt className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">ວຽກທີ່ຕ້ອງເຮັດວັນນີ້</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">ລໍຖ້າເກັບເງິນ</p>
                <p className="text-sm text-yellow-600">{stats.pendingPayments} ລາຍການ</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">ເກີນກຳນົດ</p>
                <p className="text-sm text-red-600">{stats.overduePayments} ລາຍການ</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Collections */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">ການເກັບເງິນລ່າສຸດ</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {todayCollections.slice(0, 10).map((payment) => {
            const space = spaces.find(s => s.id === payment.spaceId || s.id === payment.roomId);
            const tenant = tenants.find(t => t.tenantId === payment.tenantId);
            const amount = payment.amountPaid || payment.amountDue || payment.amount || 0;
            const paymentTime = payment.paymentDate || payment.paidDate;

            return (
              <div key={payment.id || payment.paymentId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {space?.spaceCode || 'N/A'} - {tenant?.tenantName || 'ບໍ່ມີຊື່'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {paymentTime ? new Date(paymentTime).toLocaleTimeString('lo-LA', {
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'ບໍ່ມີເວລາ'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">₭{amount.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{payment.receiptNumber || 'ບໍ່ມີໃບເສັດ'}</p>
                </div>
              </div>
            );
          })}
          {todayCollections.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>ຍັງບໍ່ມີການເກັບເງິນວັນນີ້</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;