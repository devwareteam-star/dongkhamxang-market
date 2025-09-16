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
  ChevronDown,
  ChevronRight,
  Users,
  List,
} from "lucide-react";
import PaymentModal from "./PaymentModal";
import ReceiptModal from "./ReceiptModal";

const PaymentCollection: React.FC = () => {
  const { 
    payments, 
    paidPayments,
    spaces, 
    tenants, 
    updatePayment, 
    generateReceiptNumber,
    generatePaymentsForAllTenants,
    loading 
  } = useData();
  const { user } = useAuth();

  // Clean up duplicate data
   const { cleanupDuplicatePayments } = useData();
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  
  // New state for enhanced UI
  const [activeTimeTab, setActiveTimeTab] = useState<string>("overdue");
  const [activeFrequencyTab, setActiveFrequencyTab] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "tenant">("list");
  const [expandedTenants, setExpandedTenants] = useState<Set<string>>(new Set());
  
  // Existing state
  const [searchTerm, setSearchTerm] = useState("");
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

  const handleCleanup = async () => {
    setIsCleaningUp(true);
    try {
      await cleanupDuplicatePayments();
      alert('Duplicate payments cleaned up successfully!');
    } catch (error) {
      console.error('Cleanup failed:', error);
      alert('Cleanup failed. Check console for details.');
    } finally {
      setIsCleaningUp(false);
    }
  };

const getDaysOverdue = (payment: Payment) => {
  // Calculate status based on due date instead of stored status
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dueDate = new Date(payment.originalDueDate || payment.dueDate);
  
  if (dueDate >= todayStart) return 0; // Not overdue
  
  const now = new Date();
  return Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
};

  // Time-based filtering
  const getTimeFilteredPayments = () => {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const futureStart = new Date(todayStart);
  futureStart.setDate(futureStart.getDate() + 1);

  switch (activeTimeTab) {
    case "overdue":
      return payments.filter(payment => {
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const dueDate = new Date(payment.dueDate);
        return payment.status !== 'paid' && dueDate < todayStart;
      });
    case "current":
      return payments.filter(payment => {
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayEnd = new Date(todayStart);
        todayEnd.setDate(todayEnd.getDate() + 1);
        const dueDate = new Date(payment.dueDate);
        return payment.status !== 'paid' && dueDate >= todayStart && dueDate < todayEnd;
      });
    case "future":
      return payments.filter(payment => {
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayEnd = new Date(todayStart);
        todayEnd.setDate(todayEnd.getDate() + 1);
        const dueDate = new Date(payment.dueDate);
        return payment.status !== 'paid' && dueDate >= todayEnd;
      });
    case "history":
      return paidPayments; // CHANGED: Use paidPayments instead of filtering payments
    default:
      return payments;
  }
};

  // Filter payments based on all filters
  const getFilteredPayments = () => {
    let filtered = getTimeFilteredPayments();

    // Apply frequency filter
    if (activeFrequencyTab !== "all") {
      filtered = filtered.filter(payment => payment.paymentType === activeFrequencyTab);
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

    return filtered;
  };

  // Group payments by tenant
  const getGroupedByTenant = () => {
    const filtered = getFilteredPayments();
    const grouped = new Map<string, { tenant: any; payments: Payment[]; totalDue: number; overdueCount: number }>();

    filtered.forEach(payment => {
      const tenant = tenants.find(t => t.tenantId === payment.tenantId);
      if (!tenant) return;

      if (!grouped.has(tenant.tenantId)) {
        grouped.set(tenant.tenantId, {
          tenant,
          payments: [],
          totalDue: 0,
          overdueCount: 0
        });
      }

      const group = grouped.get(tenant.tenantId)!;
      group.payments.push(payment);
      
      if (payment.status !== 'paid') {
        const originalAmount = payment.originalAmount || getPaymentAmount(payment);
        group.totalDue += originalAmount + (payment.lateFee || 0);
      }
      
      const today = new Date();
const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
const dueDate = new Date(payment.dueDate);
if (payment.status !== 'paid' && dueDate < todayStart) {
        group.overdueCount++;
      }
    });

    return Array.from(grouped.values());
  };

  const filteredPayments = getFilteredPayments();
  const groupedPayments = getGroupedByTenant();

  // Toggle tenant expansion
  const toggleTenantExpansion = (tenantId: string) => {
    const newExpanded = new Set(expandedTenants);
    if (newExpanded.has(tenantId)) {
      newExpanded.delete(tenantId);
    } else {
      newExpanded.add(tenantId);
    }
    setExpandedTenants(newExpanded);
  };

  // Event handlers (existing ones)
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
  paymentMethod: 'cash' | 'transfer' | undefined; 
  notes?: string | undefined 
  }) => {
    if (!selectedPayment) return;

    try {
      const receiptNumber = generateReceiptNumber();
      await updatePayment(selectedPayment.id, {
        paymentStatus: 'paid',
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

  // Status helpers (existing ones)
const getStatusIcon = (payment: Payment) => {
  if (payment.status === 'paid') {
    return <CheckCircle className="w-4 h-4 text-green-600" />;
  }
  
  // Check if overdue based on due date
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dueDate = new Date(payment.dueDate);
  
  if (dueDate < todayStart) {
    return <AlertTriangle className="w-4 h-4 text-red-600" />;
  } else {
    return <Clock className="w-4 h-4 text-yellow-600" />;
  }
};

const getStatusColor = (payment: Payment) => {
  if (payment.status === 'paid') {
    return "bg-green-100 text-green-800";
  }
  
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dueDate = new Date(payment.dueDate);
  
  if (dueDate < todayStart) {
    return "bg-red-100 text-red-800";
  } else {
    return "bg-yellow-100 text-yellow-800";
  }
};

const getStatusText = (payment: Payment) => {
  if (payment.status === 'paid') {
    return "ຈ່າຍແລ້ວ";
  }
  
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dueDate = new Date(payment.dueDate);
  
  if (dueDate < todayStart) {
    return "ເກີນກຳນົດ";
  } else {
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
  };

  // Time-based tabs
  const timeTabs = [
     { 
    id: "overdue", 
    label: "ກາຍມື້", 
    count: payments.filter(p => {
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const dueDate = new Date(p.dueDate);
      return p.status !== 'paid' && dueDate < todayStart;
    }).length 
  },
   { 
    id: "current", 
    label: "ປັດຈຸບັນ", 
    count: payments.filter(p => {
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);
      const dueDate = new Date(p.dueDate);
      return p.status !== 'paid' && dueDate >= todayStart && dueDate < todayEnd;
    }).length 
  },
  { 
    id: "future", 
    label: "ອະນາຄົດ", 
    count: payments.filter(p => {
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);
      const dueDate = new Date(p.dueDate);
      return p.status !== 'paid' && dueDate >= todayEnd;
    }).length 
  },
    { 
    id: "history", 
    label: "ປະຫວັດ", 
    count: paidPayments.length // CHANGED: Use paidPayments.length instead of filtering
  },
  ];

  // Frequency tabs
  const frequencyTabs = [
    { 
      id: "all", 
      label: "ທັງໝົດ", 
      count: getTimeFilteredPayments().length 
    },
    { 
      id: "daily", 
      label: "ລາຍວັນ", 
      count: getTimeFilteredPayments().filter(p => p.paymentType === 'daily').length 
    },
    { 
      id: "monthly", 
      label: "ລາຍເດືອນ", 
      count: getTimeFilteredPayments().filter(p => p.paymentType === 'monthly').length 
    },
    { 
      id: "yearly", 
      label: "ລາຍປີ", 
      count: getTimeFilteredPayments().filter(p => p.paymentType === 'yearly').length 
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

      {/* Time-based Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {timeTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTimeTab(tab.id)}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors relative ${
                activeTimeTab === tab.id
                  ? "bg-blue-50 text-blue-700 border-b-2 border-blue-500"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  activeTimeTab === tab.id
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-600"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Frequency Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          {frequencyTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFrequencyTab(tab.id)}
              className={`flex-1 px-4 py-3 text-center text-sm font-medium transition-colors ${
                activeFrequencyTab === tab.id
                  ? "bg-red-50 text-red-700 border-b-2 border-red-500"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                  activeFrequencyTab === tab.id
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-600"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filters and View Toggle */}
        <div className="p-4 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="ຄົ້ນຫາ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={spaceTypeFilter}
                onChange={(e) => setSpaceTypeFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none text-sm"
              >
                <option value="all">ປະເພດທັງໝົດ</option>
                <option value="ໂຕະ">ໂຕະ</option>
                <option value="ຫ້ອງເຊົ່າ">ຫ້ອງເຊົ່າ</option>
                <option value="ປ້າຍ">ປ້າຍ</option>
                <option value="ບູດ">ບູດ</option>
              </select>
            </div>

            <div className="flex bg-white rounded-lg border border-gray-300 p-1">
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center space-x-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
                  viewMode === "list"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <List className="w-3 h-3" />
                <span>ລາຍການ</span>
              </button>
              <button
                onClick={() => setViewMode("tenant")}
                className={`flex items-center space-x-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
                  viewMode === "tenant"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Users className="w-3 h-3" />
                <span>ຜູ້ເຊົ່າ</span>
              </button>
            </div>

            <div className="flex items-center justify-center text-xs text-gray-600 bg-white rounded-lg px-3 py-2 border border-gray-300">
              <CreditCard className="w-3 h-3 mr-1" />
              {viewMode === "list" ? filteredPayments.length : groupedPayments.length} ລາຍການ
            </div>

            {/* Payment Generation - Only show for current period */}
            {(activeTimeTab === "overdue" || activeTimeTab === "current") && (
              <div className="flex space-x-1">
                <button
                  onClick={() => handleGeneratePayments('daily')}
                  disabled={isGeneratingPayments}
                  className="flex-1 flex items-center justify-center px-2 py-2 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded text-xs font-medium text-orange-700 transition-colors disabled:opacity-50"
                >
                  <Calendar className="w-3 h-3 mr-1" />
                  ວັນ
                </button>
                <button
                  onClick={() => handleGeneratePayments('monthly')}
                  disabled={isGeneratingPayments}
                  className="flex-1 flex items-center justify-center px-2 py-2 bg-green-50 hover:bg-green-100 border border-green-200 rounded text-xs font-medium text-green-700 transition-colors disabled:opacity-50"
                >
                  <Calendar className="w-3 h-3 mr-1" />
                  ເດືອນ
                </button>
                <button
                  onClick={() => handleGeneratePayments('yearly')}
                  disabled={isGeneratingPayments}
                  className="flex-1 flex items-center justify-center px-2 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-xs font-medium text-blue-700 transition-colors disabled:opacity-50"
                >
                  <Calendar className="w-3 h-3 mr-1" />
                  ປີ
                </button>
                 <button 
                 className="text-xs border-2 border-red-500"
      onClick={handleCleanup} 
      disabled={isCleaningUp}
    >
      {isCleaningUp ? 'Cleaning...' : 'Cleanup Duplicate Payments'}
    </button>
  
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {viewMode === "list" ? (
          /* List View */
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">ສະຖານະ</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">ພື້ນທີ່</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">ຜູ້ເຊົ່າ</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">ຮອບ</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700 text-sm">ເງິນຕົ້ນ</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700 text-sm">ຄ່າປັບ</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700 text-sm">ລວມ</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">ກຳນົດ</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700 text-sm">ການດຳເນີນການ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPayments.map((payment) => {
                  const space = spaces.find(s => 
                     s.id === payment.spaceId || s.id === payment.roomId
                  );
                  const tenant = tenants.find(t => t.tenantId === payment.tenantId);
                  const originalAmount = payment.originalAmount || getPaymentAmount(payment);
                  const totalAmount = originalAmount + (payment.lateFee || 0);

                  return (
                    <tr key={payment.id || payment.paymentId} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(payment)}
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment)}`}>
                            {getStatusText(payment)}
                          </span>
                        </div>
                      </td>
                      
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{space?.spaceCode || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{space?.spaceType || 'N/A'}</div>
                      </td>
                      
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{tenant?.tenantName || 'N/A'}</div>
                      </td>
                      
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getFrequencyColor(payment.paymentType)}`}>
                          {getFrequencyText(payment.paymentType)}
                        </span>
                      </td>
                      
                      <td className="py-3 px-4 text-right">
                        <div className="font-medium text-gray-900">₭{originalAmount.toLocaleString()}</div>
                      </td>
                      
                      <td className="py-3 px-4 text-right">
                        {getLateFeeDisplay(payment)}
                      </td>
                      
                      <td className="py-3 px-4 text-right">
                        <div className="font-bold text-gray-900">₭{totalAmount.toLocaleString()}</div>
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
                            <span>ເກັບ</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePrintReceipt(payment)}
                            className="flex items-center space-x-1 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-xs font-medium"
                          >
                            <Printer className="w-3 h-3" />
                            <span>ພິມ</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Tenant View */
          <div className="divide-y divide-gray-200">
            {groupedPayments.map((group) => (
              <div key={group.tenant.tenantId}>
                <div 
                  className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleTenantExpansion(group.tenant.tenantId)}
                >
                  <div className="flex items-center space-x-3">
                    {expandedTenants.has(group.tenant.tenantId) ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                    <div>
                      <div className="font-medium text-gray-900">{group.tenant.tenantName}</div>
                      <div className="text-sm text-gray-500">
                        {group.payments.length} ພື້ນທີ່
                        {group.overdueCount > 0 && (
                          <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                            {group.overdueCount} ເກີນກຳນົດ
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">₭{group.totalDue.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">ລວມທັງໝົດ</div>
                  </div>
                </div>

                {expandedTenants.has(group.tenant.tenantId) && (
                  <div className="bg-gray-50 px-4">
                    {group.payments.map((payment) => {
                      const space = spaces.find(s => 
                         s.id === payment.spaceId || s.id === payment.roomId
                      );
                      const originalAmount = payment.originalAmount || getPaymentAmount(payment);
                      const totalAmount = originalAmount + (payment.lateFee || 0);

                      return (
                        <div key={payment.id || payment.paymentId} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(payment)}
                            <div>
                              <div className="font-medium text-gray-900">{space?.spaceCode}</div>
                              <div className="text-xs text-gray-500">
                                <span className={`px-2 py-1 rounded-full ${getFrequencyColor(payment.paymentType)}`}>
                                  {getFrequencyText(payment.paymentType)}
                                </span>
                                <span className="ml-2">{space?.spaceType}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="font-medium text-gray-900">₭{totalAmount.toLocaleString()}</div>
                              <div className="text-xs text-gray-500">
                                {new Date(payment.dueDate).toLocaleDateString("lo-LA")}
                              </div>
                            </div>
                            
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
                                <span>ເກັບ</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handlePrintReceipt(payment)}
                                className="flex items-center space-x-1 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-xs font-medium"
                              >
                                <Printer className="w-3 h-3" />
                                <span>ພິມ</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {(viewMode === "list" ? filteredPayments : groupedPayments).length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              ບໍ່ພົບລາຍການຊຳລະເງິນ
            </h3>
            <p className="text-gray-600">ບໍ່ມີລາຍການທີ່ຕົງກັບເງື່ອນໄຂການຄົ້ນຫາ</p>
          </div>
        )}
      </div>

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