"use client";

import React, { useState } from "react";
import { useData } from "@/lib/contexts/DataContext";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Payment } from "@/types";
import {
  Search,
  CreditCard,
  Printer,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  Filter,
  Building2,
} from "lucide-react";
import PaymentModal from "./PaymentModal";
import ReceiptModal from "./ReceiptModal";

const PaymentCollection: React.FC = () => {
  const { 
    payments, 
    spaces, 
    tenants, 
    updatePayment, 
    generateReceiptNumber,
    generatePaymentsForAllTenants,
    loading 
  } = useData();
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [spaceTypeFilter, setSpaceTypeFilter] = useState<string>("all");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isGeneratingPayments, setIsGeneratingPayments] = useState(false);

  // Helper functions
  const getPaymentAmount = (payment: Payment) => {
    return payment.amountDue || payment.amount || 0;
  };

  const getLateFeeDisplay = (payment: Payment) => {
    if (!payment.lateFee || payment.lateFee === 0) {
      return <span className="text-gray-400 text-xs">No late fee</span>;
    }
    
    const percentage = payment.lateFeeRate ? (payment.lateFeeRate * 100).toFixed(0) : '0';
    return (
      <div className="text-right">
        <div className="font-medium text-red-600 text-sm">
          ₭{payment.lateFee.toLocaleString()}
        </div>
        <div className="text-xs text-red-500">
          ({percentage}%)
        </div>
      </div>
    );
  };

  const getDaysOverdue = (payment: Payment) => {
    if (payment.status !== 'overdue') return 0;
    const now = new Date();
    const dueDate = new Date(payment.originalDueDate || payment.dueDate);
    return Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Filter payments based on payment frequency tabs and filters
  const getFilteredPayments = () => {
    let filtered = payments;

    // Apply payment frequency tab filter
    switch (activeTab) {
      case "daily":
        filtered = payments.filter(payment => payment.paymentType === "daily");
        break;
      case "monthly":
        filtered = payments.filter(payment => payment.paymentType === "monthly");
        break;
      case "yearly":
        filtered = payments.filter(payment => payment.paymentType === "yearly");
        break;
      default: // "all"
        filtered = payments;
    }

    // Apply space type filter
    if (spaceTypeFilter !== "all") {
      filtered = filtered.filter((payment) => {
        const space = spaces.find(s => 
          s.id === payment.spaceId || s.id === payment.roomId
        );
        return space?.spaceType === spaceTypeFilter;
      });
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((payment) => {
        const space = spaces.find(s => 
          s.id === payment.spaceId || s.id === payment.roomId
        );
        const tenant = tenants.find(t => t.tenantId === payment.tenantId);

        return space?.spaceCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
               tenant?.tenantName.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }

    return filtered;
  };

  const filteredPayments = getFilteredPayments();

  // Event handlers
  const handleGeneratePayments = async (frequency: 'daily' | 'monthly' | 'yearly') => {
    try {
      setIsGeneratingPayments(true);
      await generatePaymentsForAllTenants(frequency);
      alert(`ສ້າງການຊຳລະເງິນ${frequency === 'daily' ? 'ລາຍວັນ' : frequency === 'monthly' ? 'ລາຍເດືອນ' : 'ລາຍປີ'}ສຳເລັດແລ້ວ`);
    } catch (error) {
      console.error('Error generating payments:', error);
      alert('ເກີດຂໍ້ຜິດພາດໃນການສ້າງການຊຳລະເງິນ');
    } finally {
      setIsGeneratingPayments(false);
    }
  };

  const handleCollectPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentCollectedFromModal = async (data: { 
    paymentMethod: 'ເງິນສົດ' | 'ໂອນເງິນ' | 'BCEL' | 'JDB'; 
    notes?: string | null | undefined 
  }) => {
    if (!selectedPayment) return;

    try {
      const receiptNumber = generateReceiptNumber();
      await updatePayment(selectedPayment.id, {
        paymentStatus: 'ຈ່າຍແລ້ວ',
        paymentDate: new Date(),
        paymentMethod: data.paymentMethod,
        receiptNumber,
        processedBy: user?.id,
        notes: data.notes || undefined
      });

      setIsPaymentModalOpen(false);
      setSelectedPayment(null);
      alert("ການຊຳລະເງິນຖືກບັນທຶກແລ້ວ");
    } catch (error) {
      console.error("Error collecting payment:", error);
      alert("ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກການຊຳລະເງິນ");
    }
  };

  const handlePrintReceipt = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsReceiptModalOpen(true);
  };

  // Status helpers
  const getStatusIcon = (status: Payment["status"]) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "overdue":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: Payment["status"]) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getStatusText = (status: Payment["status"]) => {
    switch (status) {
      case "paid":
        return "ຈ່າຍແລ້ວ";
      case "overdue":
        return "ເກີນກຳນົດ";
      default:
        return "ລໍຖ້າຊຳລະ";
    }
  };

  const getFrequencyColor = (type: Payment["paymentType"]) => {
    switch (type) {
      case "daily":
        return "bg-orange-100 text-orange-700";
      case "monthly":
        return "bg-green-100 text-green-700";
      case "yearly":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getFrequencyText = (type: Payment["paymentType"]) => {
    switch (type) {
      case "daily":
        return "ລາຍວັນ";
      case "monthly":
        return "ລາຍເດືອນ";
      case "yearly":
        return "ລາຍປີ";
      default:
        return type;
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

  // Payment Frequency Tabs - THIS IS THE CORRECT VERSION
  const tabs = [
    { 
      id: "all", 
      label: "ທັງໝົດ", 
      count: payments.length 
    },
    { 
      id: "daily", 
      label: "ລາຍວັນ", 
      count: payments.filter(p => p.paymentType === 'daily').length 
    },
    { 
      id: "monthly", 
      label: "ລາຍເດືອນ", 
      count: payments.filter(p => p.paymentType === 'monthly').length 
    },
    { 
      id: "yearly", 
      label: "ລາຍປີ", 
      count: payments.filter(p => p.paymentType === 'yearly').length 
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">ການຊຳລະເງິນ</h1>
        <p className="text-gray-600 mt-1">
          ຈັດການການເກັບເງິນຄ່າເຊົ່າ - ລາຍການທັງໝົດ {filteredPayments.length} ລາຍການ
        </p>
      </div>

      {/* Payment Frequency Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors relative ${
                activeTab === tab.id
                  ? "bg-red-50 text-red-700 border-b-2 border-red-500"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  activeTab === tab.id
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-600"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="p-6 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="ຄົ້ນຫາລະຫັດພື້ນທີ່ຫຼືຊື່ຜູ້ເຊົ່າ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={spaceTypeFilter}
                onChange={(e) => setSpaceTypeFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="all">ປະເພດພື້ນທີ່ທັງໝົດ</option>
                <option value="ໂຕະ">ໂຕະ</option>
                <option value="ຫ້ອງເຊົ່າ">ຫ້ອງເຊົ່າ</option>
                <option value="ປ້າຍ">ປ້າຍ</option>
                <option value="ບູດ">ບູດ</option>
              </select>
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="all">ສະຖານະທັງໝົດ</option>
                <option value="pending">ລໍຖ້າຊຳລະ</option>
                <option value="overdue">ເກີນກຳນົດ</option>
                <option value="paid">ຈ່າຍແລ້ວ</option>
              </select>
            </div>

            <div className="flex items-center justify-center text-sm text-gray-600 bg-white rounded-lg px-4 py-3 border border-gray-300">
              <CreditCard className="w-4 h-4 mr-2" />
              ສະແດງ {filteredPayments.length} ລາຍການ
            </div>
          </div>
        </div>
      </div>

      {/* Payment Generation Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">ສ້າງການຊຳລະເງິນ</h3>
            <p className="text-sm text-gray-600">ສ້າງການຊຳລະເງິນໃໝ່ສຳລັບຜູ້ເຊົ່າທັງໝົດ</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => handleGeneratePayments('daily')}
            disabled={isGeneratingPayments}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Calendar className="w-5 h-5 text-orange-600" />
            <span className="font-medium text-orange-700">
              {isGeneratingPayments ? 'ກຳລັງສ້າງ...' : 'ສ້າງການຊຳລະລາຍວັນ'}
            </span>
          </button>
          
          <button
            onClick={() => handleGeneratePayments('monthly')}
            disabled={isGeneratingPayments}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Calendar className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-700">
              {isGeneratingPayments ? 'ກຳລັງສ້າງ...' : 'ສ້າງການຊຳລະລາຍເດືອນ'}
            </span>
          </button>
          
          <button
            onClick={() => handleGeneratePayments('yearly')}
            disabled={isGeneratingPayments}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Calendar className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-700">
              {isGeneratingPayments ? 'ກຳລັງສ້າງ...' : 'ສ້າງການຊຳລະລາຍປີ'}
            </span>
          </button>
        </div>
        
        <div className="mt-4 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
          <strong>ໝາຍເຫດ:</strong> ການສ້າງການຊຳລະຈະສ້າງພຽງສຳລັບພື້ນທີ່ທີ່ບໍ່ມີການຊຳລະທີ່ຍັງບໍ່ໄດ້ຈ່າຍ
        </div>
      </div>

      {/* Payment Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">ສະຖານະ</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">ພື້ນທີ່</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">ຜູ້ເຊົ່າ</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">ຮອບຊຳລະ</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700 text-sm">ເງິນຕົ້ນ</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700 text-sm">ຄ່າປັບ</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700 text-sm">ລວມທັງໝົດ</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700 text-sm">ເກີນ (ວັນ)</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">ກຳນົດຊຳລະ</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700 text-sm">ການດຳເນີນການ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPayments.map((payment) => {
                const space = spaces.find(s => 
                  s.id === payment.spaceId || s.id === payment.roomId
                );
                const tenant = tenants.find(t => t.tenantId === payment.tenantId);
                const daysOverdue = getDaysOverdue(payment);
                const originalAmount = payment.originalAmount || getPaymentAmount(payment);
                const totalAmount = originalAmount + (payment.lateFee || 0);

                return (
                  <tr key={payment.id || payment.paymentId} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(payment.status)}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                          {getStatusText(payment.status)}
                        </span>
                      </div>
                    </td>
                    
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{space?.spaceCode || 'N/A'}</div>
                        <div className="text-xs text-gray-500 flex items-center">
                          <Building2 className="w-3 h-3 mr-1" />
                          {space?.spaceType || 'N/A'}
                        </div>
                      </div>
                    </td>
                    
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">
                        {tenant?.tenantName || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {tenant?.contact}
                      </div>
                    </td>
                    
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getFrequencyColor(payment.paymentType)}`}>
                        {getFrequencyText(payment.paymentType)}
                      </span>
                    </td>
                    
                    <td className="py-3 px-4 text-right">
                      <div className="font-medium text-gray-900">
                        ₭{originalAmount.toLocaleString()}
                      </div>
                    </td>
                    
                    <td className="py-3 px-4 text-right">
                      {getLateFeeDisplay(payment)}
                    </td>
                    
                    <td className="py-3 px-4 text-right">
                      <div className="font-bold text-gray-900">
                        ₭{totalAmount.toLocaleString()}
                      </div>
                    </td>
                    
                    <td className="py-3 px-4 text-center">
                      {daysOverdue > 0 ? (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                          {daysOverdue}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-900">
                        {new Date(payment.dueDate).toLocaleDateString("lo-LA")}
                      </div>
                    </td>
                    
                    <td className="py-3 px-4 text-center">
                      {payment.status !== "paid" ? (
                        <button
                          onClick={() => handleCollectPayment(payment)}
                          className={`flex items-center space-x-1 px-3 py-1 rounded-lg transition-colors text-xs font-medium ${
                            payment.status === 'overdue'
                              ? "bg-red-50 hover:bg-red-100 text-red-700"
                              : "bg-green-50 hover:bg-green-100 text-green-700"
                          }`}
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>ເກັບເງິນ</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePrintReceipt(payment)}
                          className="flex items-center space-x-1 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-xs font-medium"
                        >
                          <Printer className="w-3 h-3" />
                          <span>ພິມໃບເສັດ</span>
                        </button>
                      )}
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            ບໍ່ພົບລາຍການຊຳລະເງິນ
          </h3>
          <p className="text-gray-600">ບໍ່ມີລາຍການທີ່ຕົງກັບເງື່ອນໄຂການຄົ້ນຫາ</p>
        </div>
      )}

      {/* Modals */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        payment={selectedPayment}
        spaces={spaces}
        tenants={tenants}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedPayment(null);
        }}
        onSubmit={handlePaymentCollectedFromModal}
      />

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