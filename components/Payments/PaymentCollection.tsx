'use client';

import React, { useState, useEffect } from 'react';
import { useData } from '@/lib/contexts/DataContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Payment } from '@/types';
import { 
  Search, 
  CreditCard, 
  Printer, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  DollarSign,
  Calendar,
  Filter,
  User
} from 'lucide-react';
import PaymentModal from './PaymentModal';
import ReceiptModal from './ReceiptModal';

const PaymentCollection: React.FC = () => {
  const { payments, rooms, tenants, updatePayment, generateReceiptNumber, loading } = useData();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>('all');
  const [dueDateFilter, setDueDateFilter] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Filter payments based on search and status
  const filteredPayments = payments.filter(payment => {
    const room = rooms.find(r => r.id === payment.roomId);
    const tenant = tenants.find(t => t.id === payment.tenantId);
    
    const matchesSearch = room?.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesPaymentType = paymentTypeFilter === 'all' || payment.paymentType === paymentTypeFilter;
    
    const now = new Date();
    const dueDate = new Date(payment.dueDate);
    const matchesDueDate = dueDateFilter === 'all' || 
                          (dueDateFilter === 'today' && dueDate.toDateString() === now.toDateString()) ||
                          (dueDateFilter === 'thisweek' && dueDate <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)) ||
                          (dueDateFilter === 'overdue' && dueDate < now && payment.status !== 'paid');
    
    return matchesSearch && matchesStatus && matchesPaymentType && matchesDueDate;
  });

  // Get pending and overdue payments for collection
  const collectablePayments = filteredPayments.filter(p => 
    p.status === 'pending' || p.status === 'overdue'
  );

  const handleCollectPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentCollectedFromModal = async (data: { paymentMethod: 'cash' | 'transfer'; notes?: string }) => {
    if (!selectedPayment) return;

    try {
      const receiptNumber = generateReceiptNumber();
      await updatePayment(selectedPayment.id, {
        status: 'paid',
        paidDate: new Date(),
        paymentMethod: data.paymentMethod,
        receiptNumber,
        employeeId: user?.id,
        notes: data.notes
      });

      setIsPaymentModalOpen(false);
      
      // Show receipt modal
      const updatedPayment = {
        ...selectedPayment,
        status: 'paid' as const,
        paidDate: new Date(),
        paymentMethod: data.paymentMethod,
        receiptNumber,
        employeeId: user?.id,
        notes: data.notes
      };
      
      setSelectedPayment(updatedPayment);
      setIsReceiptModalOpen(true);
    } catch (error) {
      console.error('Error collecting payment:', error);
    }
  };

  const handlePrintReceipt = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsReceiptModalOpen(true);
  };

  const getStatusIcon = (status: Payment['status']) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'overdue':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: Payment['status']) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusText = (status: Payment['status']) => {
    switch (status) {
      case 'paid':
        return 'จ่ายแล้ว';
      case 'overdue':
        return 'เกินกำหนด';
      default:
        return 'รอชำระ';
    }
  };

  const getPeriodText = (period: Payment['paymentType']) => {
    switch (period) {
      case 'daily':
        return 'รายวัน';
      case 'monthly':
        return 'รายเดือน';
      case 'yearly':
        return 'รายปี';
      default:
        return period;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">การชำระเงิน</h1>
          <p className="text-gray-600 mt-1">จัดการการเก็บเงินค่าเช่า - รายการทั้งหมด {filteredPayments.length} รายการ</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <div className="flex items-center space-x-2 bg-orange-50 px-3 py-2 rounded-lg">
            <Clock className="w-4 h-4 text-orange-600" />
            <span className="text-orange-800">รายวัน: {payments.filter(p => p.paymentType === 'daily').length}</span>
          </div>
          <div className="flex items-center space-x-2 bg-yellow-50 px-3 py-2 rounded-lg">
            <Calendar className="w-4 h-4 text-yellow-600" />
            <span className="text-yellow-800">รายเดือน: {payments.filter(p => p.paymentType === 'monthly').length}</span>
          </div>
          <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-blue-800">รายปี: {payments.filter(p => p.paymentType === 'yearly').length}</span>
          </div>
          <div className="flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-lg">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-green-800">รอเก็บ: {collectablePayments.length}</span>
          </div>
        </div>
      </div>

      {/* Payment Type Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setPaymentTypeFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              paymentTypeFilter === 'all'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            ทั้งหมด ({payments.length})
          </button>
          <button
            onClick={() => setPaymentTypeFilter('daily')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              paymentTypeFilter === 'daily'
                ? 'bg-orange-100 text-orange-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            รายวัน ({payments.filter(p => p.paymentType === 'daily').length})
          </button>
          <button
            onClick={() => setPaymentTypeFilter('monthly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              paymentTypeFilter === 'monthly'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            รายเดือน ({payments.filter(p => p.paymentType === 'monthly').length})
          </button>
          <button
            onClick={() => setPaymentTypeFilter('yearly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              paymentTypeFilter === 'yearly'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            รายปี ({payments.filter(p => p.paymentType === 'yearly').length})
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาหมายเลขห้องหรือชื่อผู้เช่า..."
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
              <option value="pending">รอชำระ</option>
              <option value="overdue">เกินกำหนด</option>
              <option value="paid">จ่ายแล้ว</option>
            </select>
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={dueDateFilter}
              onChange={(e) => setDueDateFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="all">กำหนดชำระทั้งหมด</option>
              <option value="today">ครบกำหนดวันนี้</option>
              <option value="thisweek">ครบกำหนดสัปดาห์นี้</option>
              <option value="overdue">เกินกำหนดแล้ว</option>
            </select>
          </div>
          <div className="flex items-center justify-center text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-3">
            <CreditCard className="w-4 h-4 mr-2" />
            แสดง {filteredPayments.length} รายการ
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">สถิติการเก็บเงิน</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{payments.filter(p => p.status === 'overdue').length}</div>
            <div className="text-sm text-red-700">เกินกำหนด</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{payments.filter(p => p.status === 'pending').length}</div>
            <div className="text-sm text-yellow-700">รอชำระ</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{payments.filter(p => 
              p.paidDate && new Date(p.paidDate).toDateString() === new Date().toDateString()
            ).length}</div>
            <div className="text-sm text-green-700">เก็บแล้ววันนี้</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">฿{payments.filter(p => 
              p.paidDate && new Date(p.paidDate).toDateString() === new Date().toDateString()
            ).reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</div>
            <div className="text-sm text-blue-700">ยอดเก็บวันนี้</div>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 font-medium text-gray-700">ห้อง / ผู้เช่า</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">จำนวนเงิน</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">รอบชำระ</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">กำหนดชำระ</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">สถานะ</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => {
                const room = rooms.find(r => r.id === payment.roomId);
                const tenant = tenants.find(t => t.id === payment.tenantId);
                const isOverdue = payment.status === 'overdue';
                const daysPastDue = isOverdue ? Math.floor((new Date().getTime() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;
                const daysUntilDue = Math.floor((new Date(payment.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                
                // Color coding based on payment type
                const getPaymentTypeColor = (type: string) => {
                  switch (type) {
                    case 'daily': return 'text-orange-600 bg-orange-50';
                    case 'monthly': return 'text-green-600 bg-green-50';
                    case 'yearly': return 'text-blue-600 bg-blue-50';
                    default: return 'text-gray-600 bg-gray-50';
                  }
                };

                return (
                  <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(payment.status)}
                        <div>
                          <div className="font-medium text-gray-900">
                            ห้อง {room?.roomNumber}
                          </div>
                          <div className="text-sm text-gray-600 flex items-center">
                            <User className="w-3 h-3 mr-1" />
                            {tenant?.name || 'ไม่ระบุ'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {room?.location}
                          </div>
                          {tenant?.phone && (
                            <div className="text-xs text-blue-600">
                              📞 {tenant.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">
                        ฿{payment.amount.toLocaleString()}
                      </div>
                      {payment.lateFee && payment.lateFee > 0 && (
                        <div className="text-xs text-red-600">
                          + ค่าปรับ ฿{payment.lateFee.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {getPeriodText(payment.paymentType)}
                    </td>
                    <td className="py-4 px-6">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentTypeColor(payment.paymentType)}`}>
                        {new Date(payment.dueDate).toLocaleDateString('th-TH')}
                      </div>
                      {isOverdue && (
                        <div className="text-xs text-red-600 font-medium">
                          เกิน {daysPastDue} วัน
                        </div>
                      )}
                      {!isOverdue && payment.status === 'pending' && daysUntilDue <= 7 && daysUntilDue >= 0 && (
                        <div className="text-xs text-yellow-600 font-medium">
                          อีก {daysUntilDue} วัน
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                        {getStatusText(payment.status)}
                      </span>
                      {payment.paidDate && (
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(payment.paidDate).toLocaleDateString('th-TH')}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex space-x-2">
                        {payment.status !== 'paid' ? (
                          <button
                            onClick={() => handleCollectPayment(payment)}
                            className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                              isOverdue 
                                ? 'bg-red-50 hover:bg-red-100 text-red-700' 
                                : daysUntilDue <= 3 && daysUntilDue >= 0
                                  ? 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700'
                                  : 'bg-green-50 hover:bg-green-100 text-green-700'
                            }`}
                          >
                            <CreditCard className="w-4 h-4" />
                            <span>{isOverdue ? 'เก็บเงิน (เกิน)' : daysUntilDue <= 3 && daysUntilDue >= 0 ? 'เก็บเงิน (ใกล้)' : 'เก็บเงิน'}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePrintReceipt(payment)}
                            className="flex items-center space-x-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-sm font-medium"
                          >
                            <Printer className="w-4 h-4" />
                            <span>พิมพ์ใบเสร็จ</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredPayments.length === 0 && (
        <div className="text-center py-12">
          <CreditCard className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบรายการชำระเงิน</h3>
          <p className="text-gray-600">ไม่มีรายการที่ตรงกับเงื่อนไขการค้นหา</p>
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        payment={selectedPayment}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedPayment(null);
        }}
        onSubmit={handlePaymentCollectedFromModal}
      />

      {/* Receipt Modal */}
      {isReceiptModalOpen && selectedPayment && (
        <ReceiptModal
          isOpen={isReceiptModalOpen}
          payment={selectedPayment}
          onClose={() => {
            setIsReceiptModalOpen(false);
            setSelectedPayment(null);
          }}
        />
      )}
    </div>
  );
};

export default PaymentCollection;