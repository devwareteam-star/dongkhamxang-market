"use client";

import React, { useState, useEffect } from "react";
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
  DollarSign,
  Calendar,
  Filter,
  User,
  ChevronDown,
  ChevronUp,
  Building2,
} from "lucide-react";
import PaymentModal from "./PaymentModal";
import ReceiptModal from "./ReceiptModal";

const PaymentCollection: React.FC = () => {
  const { payments, spaces, tenants, updatePayment, generateReceiptNumber, loading } = useData();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("today");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [expandedTenants, setExpandedTenants] = useState<Set<string>>(new Set());

  // Get today's date for filtering
  const today = new Date();
  const todayString = today.toDateString();

  // Helper function - moved up before usage
  const getPaymentAmount = (payment: Payment) => {
    return payment.amountDue || payment.amount || 0;
  };

  // Filter payments based on active tab
  const getFilteredPayments = () => {
    let filtered = payments;

    // Apply tab filter
    switch (activeTab) {
      case "today":
        filtered = payments.filter(payment => {
          const dueDate = new Date(payment.dueDate);
          return dueDate.toDateString() === todayString;
        });
        break;
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

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((payment) => {
        const space = spaces.find(s => 
          payment.spaceIds?.includes(s.id) || 
          s.id === payment.roomId
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

  // Get all tenant spaces regardless of current filter to show complete tenant info
  const getAllTenantSpaces = (tenantId: string) => {
    // First, find the tenant
    const tenant = tenants.find(t => t.tenantId === tenantId);
    if (!tenant?.allSpace) {
      console.log(`No tenant found or no spaces for tenantId: ${tenantId}`);
      return [];
    }
    
    console.log(`Found tenant ${tenant.tenantName} with spaces:`, tenant.allSpace);
    
    // Get spaces directly from tenant's allSpace array
    const tenantSpaces: any[] = [];
    
    tenant.allSpace.forEach(spaceId => {
      // Look for space by both id and spaceId fields
      const space = spaces.find(s => s.id === spaceId || s.spaceId === spaceId);
      if (space) {
        console.log(`Found space ${space.spaceCode} for tenant ${tenant.tenantName}`);
        if (!tenantSpaces.find(ts => ts.id === space.id)) {
          tenantSpaces.push(space);
        }
      } else {
        console.log(`Space not found for ID: ${spaceId}`);
      }
    });
    
    console.log(`Returning ${tenantSpaces.length} spaces for tenant ${tenant.tenantName}`);
    return tenantSpaces;
  };

  // Group payments by tenant with totals calculation
  const groupedPayments = filteredPayments.reduce((acc, payment) => {
    const tenant = tenants.find(t => t.tenantId === payment.tenantId);
    const tenantKey = tenant?.tenantId || 'unknown';
    
    if (!acc[tenantKey]) {
      acc[tenantKey] = {
        tenant,
        payments: [],
        totals: {
          daily: 0,
          monthly: 0,
          yearly: 0,
          all: 0
        }
      };
    }
    
    const amount = getPaymentAmount(payment);
    acc[tenantKey].payments.push(payment);
    
    // Calculate totals by payment type
    if (payment.paymentType === 'daily') {
      acc[tenantKey].totals.daily += amount;
    } else if (payment.paymentType === 'monthly') {
      acc[tenantKey].totals.monthly += amount;
    } else if (payment.paymentType === 'yearly') {
      acc[tenantKey].totals.yearly += amount;
    }
    
    acc[tenantKey].totals.all += amount;
    
    return acc;
  }, {} as Record<string, { 
    tenant: any; 
    payments: Payment[]; 
    totals: { daily: number; monthly: number; yearly: number; all: number }
  }>);

  const toggleTenantExpansion = (tenantId: string) => {
    const newExpanded = new Set(expandedTenants);
    if (newExpanded.has(tenantId)) {
      newExpanded.delete(tenantId);
    } else {
      newExpanded.add(tenantId);
    }
    setExpandedTenants(newExpanded);
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

  const getPeriodText = (period: Payment["paymentType"]) => {
    switch (period) {
      case "daily":
        return "ລາຍວັນ";
      case "monthly":
        return "ລາຍເດືອນ";
      case "yearly":
        return "ລາຍປີ";
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

  const tabs = [
    { id: "today", label: "Today", count: payments.filter(p => new Date(p.dueDate).toDateString() === todayString).length },
    { id: "all", label: "ALL", count: payments.length },
    { id: "daily", label: "Daily", count: payments.filter(p => p.paymentType === "daily").length },
    { id: "monthly", label: "Monthly", count: payments.filter(p => p.paymentType === "monthly").length },
    { id: "yearly", label: "Yearly", count: payments.filter(p => p.paymentType === "yearly").length },
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

      {/* Tab Navigation */}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      {/* Payment Lists Grouped by Tenant */}
      <div className="space-y-4">
        {Object.entries(groupedPayments).map(([tenantKey, group]) => {
          return (
            <div key={tenantKey} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Tenant Header with Totals */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>

              {/* All Tenant Spaces Display - organized by payment type */}
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">ພື້ນທີ່ທັງໝົດຂອງຜູ້ເຊົ່າ</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Daily Spaces */}
                  <div className="bg-orange-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-sm font-medium text-orange-700">ລາຍວັນ</span>
                    </div>
                    <div className="space-y-1">
                      {getAllTenantSpaces(tenantKey)
                        .filter(space => {
                          const spacePayments = payments.filter(p => 
                            (p.spaceIds?.includes(space.id) || p.roomId === space.id) && 
                            p.tenantId === tenantKey &&
                            p.paymentType === 'daily'
                          );
                          return spacePayments.length > 0;
                        })
                        .map((space, index) => (
                          <div key={`daily-${space.id}-${index}`} className="text-xs text-orange-600">
                            {space.spaceCode} ({space.spaceType})
                          </div>
                        ))}
                      {getAllTenantSpaces(tenantKey).filter(space => {
                        const spacePayments = payments.filter(p => 
                          (p.spaceIds?.includes(space.id) || p.roomId === space.id) && 
                          p.tenantId === tenantKey &&
                          p.paymentType === 'daily'
                        );
                        return spacePayments.length > 0;
                      }).length === 0 && (
                        <div className="text-xs text-gray-400">ບໍ່ມີ</div>
                      )}
                    </div>
                  </div>

                  {/* Monthly Spaces */}
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-700">ລາຍເດືອນ</span>
                    </div>
                    <div className="space-y-1">
                      {getAllTenantSpaces(tenantKey)
                        .filter(space => {
                          const spacePayments = payments.filter(p => 
                            (p.spaceIds?.includes(space.id) || p.roomId === space.id) && 
                            p.tenantId === tenantKey &&
                            p.paymentType === 'monthly'
                          );
                          return spacePayments.length > 0;
                        })
                        .map((space, index) => (
                          <div key={`monthly-${space.id}-${index}`} className="text-xs text-green-600">
                            {space.spaceCode} ({space.spaceType})
                          </div>
                        ))}
                      {getAllTenantSpaces(tenantKey).filter(space => {
                        const spacePayments = payments.filter(p => 
                          (p.spaceIds?.includes(space.id) || p.roomId === space.id) && 
                          p.tenantId === tenantKey &&
                          p.paymentType === 'monthly'
                        );
                        return spacePayments.length > 0;
                      }).length === 0 && (
                        <div className="text-xs text-gray-400">ບໍ່ມີ</div>
                      )}
                    </div>
                  </div>

                  {/* Yearly Spaces */}
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-blue-700">ລາຍປີ</span>
                    </div>
                    <div className="space-y-1">
                      {getAllTenantSpaces(tenantKey)
                        .filter(space => {
                          const spacePayments = payments.filter(p => 
                            (p.spaceIds?.includes(space.id) || p.roomId === space.id) && 
                            p.tenantId === tenantKey &&
                            p.paymentType === 'yearly'
                          );
                          return spacePayments.length > 0;
                        })
                        .map((space, index) => (
                          <div key={`yearly-${space.id}-${index}`} className="text-xs text-blue-600">
                            {space.spaceCode} ({space.spaceType})
                          </div>
                        ))}
                      {getAllTenantSpaces(tenantKey).filter(space => {
                        const spacePayments = payments.filter(p => 
                          (p.spaceIds?.includes(space.id) || p.roomId === space.id) && 
                          p.tenantId === tenantKey &&
                          p.paymentType === 'yearly'
                        );
                        return spacePayments.length > 0;
                      }).length === 0 && (
                        <div className="text-xs text-gray-400">ບໍ່ມີ</div>
                      )}
                    </div>
                  </div>

                  {/* All Spaces Summary */}
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="text-sm font-medium text-purple-700">ທັງໝົດ</span>
                    </div>
                    <div className="space-y-1">
                      {getAllTenantSpaces(tenantKey).map((space: any, index: number) => (
                        <div key={`all-${space.id}-${index}`} className="text-xs text-purple-600">
                          {space.spaceCode} ({space.spaceType})
                        </div>
                      ))}
                      {getAllTenantSpaces(tenantKey).length === 0 && (
                        <div className="text-xs text-gray-400">ບໍ່ມີ</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {group.tenant?.tenantName || "ບໍ່ລະບຸ"}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {group.tenant?.contact && `📞 ${group.tenant.contact}`} • {group.payments.length} ລາຍການ
                      </p>
                    </div>
                  </div>
                  
                  {/* Totals Summary */}
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div className="bg-orange-50 px-3 py-2 rounded-lg text-center">
                      <div className="text-orange-600 font-medium">ລາຍວັນ</div>
                      <div className="text-orange-800 font-bold">₭{group.totals.daily.toLocaleString()}</div>
                    </div>
                    <div className="bg-green-50 px-3 py-2 rounded-lg text-center">
                      <div className="text-green-600 font-medium">ລາຍເດືອນ</div>
                      <div className="text-green-800 font-bold">₭{group.totals.monthly.toLocaleString()}</div>
                    </div>
                    <div className="bg-blue-50 px-3 py-2 rounded-lg text-center">
                      <div className="text-blue-600 font-medium">ລາຍປີ</div>
                      <div className="text-blue-800 font-bold">₭{group.totals.yearly.toLocaleString()}</div>
                    </div>
                    <div className="bg-purple-50 px-3 py-2 rounded-lg text-center">
                      <div className="text-purple-600 font-medium">ລວມທັງໝົດ</div>
                      <div className="text-purple-800 font-bold">₭{group.totals.all.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payments Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">ສະຖານະ</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">ພື້ນທີ່</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">ຮອບຊຳລະ</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">ຈຳນວນເງິນ</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">ກຳນົດຊຳລະ</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">ການດຳເນີນການ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {group.payments.map((payment) => {
                      const space = spaces.find(s => 
                        payment.spaceIds?.includes(s.id) || 
                        s.id === payment.roomId
                      );
                      
                      const isOverdue = payment.status === "overdue";
                      const dueDate = new Date(payment.dueDate);
                      const now = new Date();
                      const daysUntilDue = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                      const daysPastDue = isOverdue ? Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

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
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              payment.paymentType === 'daily' ? 'bg-orange-100 text-orange-700' :
                              payment.paymentType === 'monthly' ? 'bg-green-100 text-green-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {getPeriodText(payment.paymentType)}
                            </span>
                          </td>
                          
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">
                              ₭{getPaymentAmount(payment).toLocaleString()}
                            </div>
                            {payment.lateFee && payment.lateFee > 0 && (
                              <div className="text-xs text-red-600">
                                + ຄ່າປັບ ₭{payment.lateFee.toLocaleString()}
                              </div>
                            )}
                          </td>
                          
                          <td className="py-3 px-4">
                            <div className="text-sm text-gray-900">
                              {dueDate.toLocaleDateString("lo-LA")}
                            </div>
                            {isOverdue && (
                              <div className="text-xs text-red-600 font-medium">
                                ເກີນ {daysPastDue} ວັນ
                              </div>
                            )}
                            {!isOverdue && payment.status === "pending" && daysUntilDue <= 7 && daysUntilDue >= 0 && (
                              <div className="text-xs text-yellow-600 font-medium">
                                ອີກ {daysUntilDue} ວັນ
                              </div>
                            )}
                          </td>
                          
                          <td className="py-3 px-4">
                            {payment.status !== "paid" ? (
                              <button
                                onClick={() => handleCollectPayment(payment)}
                                className={`flex items-center space-x-1 px-3 py-1 rounded-lg transition-colors text-xs font-medium ${
                                  isOverdue
                                    ? "bg-red-50 hover:bg-red-100 text-red-700"
                                    : daysUntilDue <= 3 && daysUntilDue >= 0
                                    ? "bg-yellow-50 hover:bg-yellow-100 text-yellow-700"
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
          );
        })}
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

      {/* Payment Modal */}
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