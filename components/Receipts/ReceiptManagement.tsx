'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/contexts/DataContext';
import { 
  Receipt, 
  Search, 
  Filter,
  Printer,
  Download,
  Calendar,
  Building2,
  List,
  Users,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Image as ImageIcon,
  Eye,
  X
} from 'lucide-react';

const ReceiptManagement: React.FC = () => {
  const { payments, spaces, tenants, paidPayments} = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [spaceTypeFilter, setSpaceTypeFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [activeFrequencyTab, setActiveFrequencyTab] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'tenant'>('list');
  const [expandedTenants, setExpandedTenants] = useState<Set<string>>(new Set());
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);


  // Handle get image
  const handleViewImage = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  const handleDownloadImage = (imageUrl: string, receiptNumber: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `payment-proof-${receiptNumber}.jpg`;
    link.click();
  };

  // Get paid payments with receipt numbers
  const receipts = paidPayments.filter(p => p.receiptNumber);

  // Filter by frequency tab first
  const getFrequencyFilteredReceipts = () => {
    if (activeFrequencyTab === 'all') {
      return receipts;
    }
    return receipts.filter(receipt => 
      receipt.paymentFrequency === activeFrequencyTab || 
      receipt.paymentType === activeFrequencyTab
    );
  };

  // Apply all filters
  const filteredReceipts = getFrequencyFilteredReceipts().filter(receipt => {
    const space = spaces.find(s => 
      s.id === receipt.spaceId || s.id === receipt.roomId
    );
    const tenant = tenants.find(t => 
      t.tenantId === receipt.tenantId
    );
    
    // Search filter
    const matchesSearch = !searchTerm || (
      receipt.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      space?.spaceCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant?.tenantName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Date filter
    const matchesDate = !dateFilter || 
                       (receipt.paymentDate && new Date(receipt.paymentDate).toISOString().split('T')[0] === dateFilter);
    
    // Space type filter
    const matchesSpaceType = spaceTypeFilter === 'all' || space?.spaceType === spaceTypeFilter;
    
    // Payment method filter
    const matchesPaymentMethod = paymentMethodFilter === 'all' || receipt.paymentMethod === paymentMethodFilter;
    
    return matchesSearch && matchesDate && matchesSpaceType && matchesPaymentMethod;
  });

  // Group receipts by tenant
  const getGroupedByTenant = () => {
    const grouped = new Map<string, { 
      tenant: any; 
      receipts: any[]; 
      totalAmount: number; 
      receiptCount: number;
      latestPayment: Date | null;
    }>();

    filteredReceipts.forEach(receipt => {
      const tenant = tenants.find(t => t.tenantId === receipt.tenantId);
      if (!tenant) return;

      if (!grouped.has(tenant.tenantId)) {
        grouped.set(tenant.tenantId, {
          tenant,
          receipts: [],
          totalAmount: 0,
          receiptCount: 0,
          latestPayment: null
        });
      }

      const group = grouped.get(tenant.tenantId)!;
      group.receipts.push(receipt);
      group.receiptCount++;
      
      const originalAmount = receipt.originalAmount || receipt.amountDue || receipt.amount || 0;
      const lateFee = receipt.lateFee || 0;
      group.totalAmount += originalAmount + lateFee;

      const paymentDate = receipt.paymentDate ? new Date(receipt.paymentDate) : null;
      if (paymentDate && (!group.latestPayment || paymentDate > group.latestPayment)) {
        group.latestPayment = paymentDate;
      }
    });

    return Array.from(grouped.values()).sort((a, b) => 
      (b.latestPayment?.getTime() || 0) - (a.latestPayment?.getTime() || 0)
    );
  };

  const groupedReceipts = getGroupedByTenant();

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

  // Calculate tab counts
  const getTabCounts = () => {
    const baseCounts = {
      all: receipts.length,
      daily: receipts.filter(r => r.paymentFrequency === 'daily' || r.paymentType === 'daily').length,
      monthly: receipts.filter(r => r.paymentFrequency === 'monthly' || r.paymentType === 'monthly').length,
      yearly: receipts.filter(r => r.paymentFrequency === 'yearly' || r.paymentType === 'yearly').length,
    };
    return baseCounts;
  };

  const tabCounts = getTabCounts();

  const frequencyTabs = [
    { id: 'all', label: 'ທັງໝົດ', count: tabCounts.all },
    { id: 'daily', label: 'ລາຍວັນ', count: tabCounts.daily },
    { id: 'monthly', label: 'ລາຍເດືອນ', count: tabCounts.monthly },
    { id: 'yearly', label: 'ລາຍປີ', count: tabCounts.yearly },
  ];

  const handlePrintReceipt = (receipt: any) => {
    const space = spaces.find(s => 
      s.id === receipt.spaceId || s.id === receipt.roomId
    );
    const tenant = tenants.find(t => 
      t.tenantId === receipt.tenantId
    );
      
    const getFrequencyText = (type: string) => {
      switch (type) {
        case 'daily': return 'ລາຍວັນ';
        case 'monthly': return 'ລາຍເດືອນ';
        case 'yearly': return 'ລາຍປີ';
        default: return type;
      }
    };

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>ໃບຮັບເງິນ ${receipt.receiptNumber}</title>
          <style>
            body { font-family: 'Sarabun', sans-serif; margin: 20px; }
            .receipt { max-width: 400px; margin: 0 auto; border: 1px solid #000; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .title { font-size: 18px; font-weight: bold; }
            .subtitle { font-size: 14px; margin-top: 5px; }
            .content { margin: 20px 0; }
            .row { display: flex; justify-content: space-between; margin: 10px 0; }
            .amount { font-size: 20px; font-weight: bold; text-align: center; margin: 20px 0; }
            .footer { margin-top: 30px; text-align: center; }
            .signature { margin-top: 40px; text-align: right; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <div class="title">ຕະຫຼາດສົດເຈີນກຸງ</div>
              <div class="subtitle">ໃບຮັບເງິນ</div>
              <div class="subtitle">ເລກທີ່: ${receipt.receiptNumber}</div>
            </div>
            
            <div class="content">
              <div class="row">
                <span>ວັນທີ່:</span>
                <span>${receipt.paymentDate ? new Date(receipt.paymentDate).toLocaleDateString('lo-LA') : ''}</span>
              </div>
              <div class="row">
                <span>ຫ້ອງເລກທີ່:</span>
                <span>${space?.spaceCode || 'N/A'}</span>
              </div>
              <div class="row">
                <span>ຜູ້ເຊົ່າ:</span>
                <span>${tenant?.tenantName || 'N/A'}</span>
              </div>
              <div class="row">
                <span>ປະເພດ:</span>
                <span>${getFrequencyText(receipt.paymentFrequency || receipt.paymentType)}</span>
              </div>
              <div class="row">
                <span>ວິທີຈ່າຍ:</span>
                <span>${receipt.paymentMethod === 'cash' ? 'ເງິນສົດ' : 'ໂອນເງິນ'}</span>
              </div>
              ${receipt.lateFee && receipt.lateFee > 0 ? `
              <div class="row">
                <span>ຄ່າປັບ:</span>
                <span>₭${receipt.lateFee.toLocaleString()}</span>
              </div>
              ` : ''}
            </div>
            
            <div class="amount">
              ຈຳນວນເງິນ: ₭${(receipt.amountDue || receipt.amount || 0).toLocaleString()}
            </div>
            
            <div class="footer">
              <div>ຂອບໃຈທີ່ໃຊ້ບໍລິການ</div>
            </div>
            
            <div class="signature">
              <div>ຜູ້ຮັບເງິນ: ພະນັກງານເກັບເງິນ</div>
              <div style="margin-top: 20px;">ລາຍເຊັນ: ________________</div>
            </div>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const getFrequencyColor = (type: string) => {
    switch (type) {
      case 'daily': return 'bg-orange-100 text-orange-700';
      case 'monthly': return 'bg-green-100 text-green-700';
      case 'yearly': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getFrequencyText = (type: string) => {
    switch (type) {
      case 'daily': return 'ລາຍວັນ';
      case 'monthly': return 'ລາຍເດືອນ';
      case 'yearly': return 'ລາຍປີ';
      default: return type;
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">ຈັດການໃບຮັບເງິນ</h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">
            ໃບຮັບເງິນທັງໝົດ {viewMode === 'list' ? filteredReceipts.length : groupedReceipts.length} {viewMode === 'list' ? 'ໃບ' : 'ຜູ້ເຊົ່າ'}
          </p>
        </div>
      </div>

      {/* Frequency Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {frequencyTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFrequencyTab(tab.id)}
              className={`flex-1 px-3 md:px-6 py-3 md:py-4 text-center font-medium transition-colors relative ${
                activeFrequencyTab === tab.id
                  ? "bg-blue-50 text-blue-700 border-b-2 border-blue-500"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <div className="text-xs md:text-sm">{tab.label}</div>
              {tab.count > 0 && (
                <span className={`ml-1 md:ml-2 px-1.5 md:px-2 py-0.5 md:py-1 text-xs rounded-full ${
                  activeFrequencyTab === tab.id
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-600"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search and Filter Toggle */}
        <div className="p-4 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="ຊອກຫາເລກໃບຮັບເງິນ, ຫ້ອງ, ຫຼືຊື່..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">ຟິວເຕີ</span>
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* Collapsible Filters */}
          {showFilters && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
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
                  <option value="table">ໂຕະ</option>
                  <option value="room">ຫ້ອງເຊົ່າ</option>
                  <option value="signage">ປ້າຍ</option>
                  <option value="booth">ບູດ</option>
                </select>
              </div>

              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={paymentMethodFilter}
                  onChange={(e) => setPaymentMethodFilter(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none text-sm"
                >
                  <option value="all">ວິທີທັງໝົດ</option>
                  <option value="cash">ເງິນສົດ</option>
                  <option value="transfer">ໂອນເງິນ</option>
                </select>
              </div>

              {/* View Mode Toggle */}
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

              {/* Receipt Count */}
              <div className="flex items-center justify-center text-xs text-gray-600 bg-white rounded-lg px-3 py-2 border border-gray-300">
                <Receipt className="w-3 h-3 mr-1" />
                {viewMode === 'list' ? filteredReceipts.length : groupedReceipts.length} {viewMode === 'list' ? 'ໃບຮັບເງິນ' : 'ຜູ້ເຊົ່າ'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {viewMode === 'list' ? (
          /* Mobile Card View / Desktop Table View */
          <>
            {/* Mobile Card View (hidden on desktop) */}
            <div className="block md:hidden">
              {filteredReceipts.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">ບໍ່ພົບໃບຮັບເງິນ</h3>
                  <p className="text-gray-600">ບໍ່ມີໃບຮັບເງິນທີ່ຕົງກັບເງື່ອນໄຂການຊອກຫາ</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                  {filteredReceipts.map((receipt) => {
                    const space = spaces.find(s => 
                      s.id === receipt.spaceId || s.id === receipt.roomId
                    );
                    const tenant = tenants.find(t => 
                      t.tenantId === receipt.tenantId
                    );
                    
                    const originalAmount = receipt.originalAmount || receipt.amountDue || receipt.amount || 0;
                    const lateFee = receipt.lateFee || 0;
                    const totalAmount = originalAmount + lateFee;

                    return (
                      <div key={receipt.id || receipt.paymentId} className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex flex-col space-y-2">
                            <div className="font-bold text-lg text-gray-900">{receipt.receiptNumber}</div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full self-start ${getFrequencyColor(receipt.paymentFrequency || receipt.paymentType)}`}>
                              {getFrequencyText(receipt.paymentFrequency || receipt.paymentType)}
                            </span>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handlePrintReceipt(receipt)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="ພິມ"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            {receipt.paymentImageUrl && (
                          <button
                                 onClick={() => {
                                     if (receipt.paymentImageUrl) {
                                    handleViewImage(receipt.paymentImageUrl);
                                     }
                                     }}
                                    className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                    title="ເບິ່ງຮູບ"
                                                  >
                                     <Eye className="w-4 h-4" />
                                    </button>
                                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                          <div>
                            <span className="text-gray-500">ຫ້ອງ:</span>
                            <div className="mt-1 font-medium text-gray-900">{space?.spaceCode || 'N/A'}</div>
                          </div>
                          
                          <div>
                            <span className="text-gray-500">ຜູ້ເຊົ່າ:</span>
                            <div className="mt-1 font-medium text-gray-900">{tenant?.tenantName || 'N/A'}</div>
                          </div>

                          <div>
                            <span className="text-gray-500">ເງິນຕົ້ນ:</span>
                            <div className="mt-1 font-medium text-blue-600">₭{originalAmount.toLocaleString()}</div>
                          </div>

                          {lateFee > 0 && (
                            <div>
                              <span className="text-gray-500">ຄ່າປັບ:</span>
                              <div className="mt-1 font-medium text-red-600">₭{lateFee.toLocaleString()}</div>
                            </div>
                          )}

                          <div>
                            <span className="text-gray-500">ວິທີຈ່າຍ:</span>
                            <div className="mt-1">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                receipt.paymentMethod === 'cash' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {receipt.paymentMethod === 'cash' ? 'ເງິນສົດ' : 'ໂອນເງິນ'}
                              </span>
                            </div>
                          </div>

                          <div>
                            <span className="text-gray-500">ວັນທີ່:</span>
                            <div className="mt-1 text-gray-700">
                              {receipt.paymentDate ? new Date(receipt.paymentDate).toLocaleDateString('lo-LA') : 'N/A'}
                            </div>
                          </div>

                          <div className="col-span-2">
                            <span className="text-gray-500">ລວມທັງໝົດ:</span>
                            <div className="mt-1 font-bold text-xl text-green-600">₭{totalAmount.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Desktop Table View (hidden on mobile) */}
            <div className="hidden md:block">
              <div className="overflow-x-auto">
                <div className="max-h-[650px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">ເລກໃບຮັບເງິນ</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">ຫ້ອງ / ຜູ້ເຊົ່າ</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">ປະເພດ</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700 text-sm">ເງິນຕົ້ນ</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700 text-sm">ຄ່າປັບ</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700 text-sm">ລວມ</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">ວັນທີ່</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">ວິທີຈ່າຍ</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-700 text-sm">ການດຳເນີນການ</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-700 text-sm">ຮູບພາບ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredReceipts.map((receipt) => {
                        const space = spaces.find(s => 
                          s.id === receipt.spaceId || s.id === receipt.roomId
                        );
                        const tenant = tenants.find(t => 
                          t.tenantId === receipt.tenantId
                        );
                        
                        const originalAmount = receipt.originalAmount || receipt.amountDue || receipt.amount || 0;
                        const lateFee = receipt.lateFee || 0;
                        const totalAmount = originalAmount + lateFee;

                        return (
                          <tr key={receipt.id || receipt.paymentId} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-medium text-gray-900">{receipt.receiptNumber}</div>
                              <div className="text-xs text-gray-500">
                                {receipt.paymentDate ? new Date(receipt.paymentDate).toLocaleDateString('lo-LA') : 'N/A'}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div>
                                <div className="font-medium text-gray-900">{space?.spaceCode || 'N/A'}</div>
                                <div className="text-sm text-gray-600">{tenant?.tenantName || 'N/A'}</div>
                                <div className="text-xs text-gray-500">{space?.spaceType || 'N/A'}</div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getFrequencyColor(receipt.paymentFrequency || receipt.paymentType)}`}>
                                {getFrequencyText(receipt.paymentFrequency || receipt.paymentType)}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="font-medium text-gray-900">₭{originalAmount.toLocaleString()}</div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              {lateFee > 0 ? (
                                <div className="font-medium text-red-600">₭{lateFee.toLocaleString()}</div>
                              ) : (
                                <span className="text-gray-400 text-xs">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="font-bold text-green-600">₭{totalAmount.toLocaleString()}</div>
                            </td>
                            <td className="py-3 px-4 text-gray-600 text-sm">
                              {receipt.paymentDate ? new Date(receipt.paymentDate).toLocaleDateString('lo-LA') : 'N/A'}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                receipt.paymentMethod === 'cash' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {receipt.paymentMethod === 'cash' ? 'ເງິນສົດ' : 'ໂອນເງິນ'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => handlePrintReceipt(receipt)}
                                className="flex items-center space-x-1 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-xs font-medium"
                              >
                                <Printer className="w-3 h-3" />
                                <span>ພິມ</span>
                              </button>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {receipt.paymentImageUrl ? (
                                <div className="flex items-center justify-center space-x-1">
                                  <button
                                    onClick={() => receipt.paymentImageUrl && handleViewImage(receipt.paymentImageUrl)}
                                    className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-xs"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>ເບິ່ງ</span>
                                  </button>
                                  <button
                                    onClick={() => receipt.paymentImageUrl && receipt.receiptNumber && handleDownloadImage(receipt.paymentImageUrl, receipt.receiptNumber)}
                                    className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs"
                                  >
                                    <Download className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-gray-400 text-xs">ບໍ່ມີ</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {filteredReceipts.length === 0 && (
                <div className="text-center py-12">
                  <Receipt className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">ບໍ່ພົບໃບຮັບເງິນ</h3>
                  <p className="text-gray-600">ບໍ່ມີໃບຮັບເງິນທີ່ຕົງກັບເງື່ອນໄຂການຊອກຫາ</p>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Tenant View */
          <div className="divide-y divide-gray-200 max-h-[650px] overflow-y-auto">
            {groupedReceipts.map((group) => (
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
                        {group.receiptCount} ໃບຮັບເງິນ
                        {group.latestPayment && (
                          <span className="ml-2 text-xs text-gray-400">
                            ຄັ້ງຫຼ້າສຸດ: {group.latestPayment.toLocaleDateString('lo-LA')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">₭{group.totalAmount.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">ລວມທັງໝົດ</div>
                  </div>
                </div>

                {expandedTenants.has(group.tenant.tenantId) && (
                  <div className="bg-gray-50 px-4">
                    {group.receipts.map((receipt) => {
                      const space = spaces.find(s => 
                        s.id === receipt.spaceId || s.id === receipt.roomId
                      );
                      const originalAmount = receipt.originalAmount || receipt.amountDue || receipt.amount || 0;
                      const lateFee = receipt.lateFee || 0;
                      const totalAmount = originalAmount + lateFee;

                      return (
                        <div key={receipt.id || receipt.paymentId} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
                          <div className="flex items-center space-x-3">
                            <Receipt className="w-4 h-4 text-green-600" />
                            <div>
                              <div className="font-medium text-gray-900">
                                {receipt.receiptNumber}
                                <span className="ml-2 text-sm text-gray-600">({space?.spaceCode})</span>
                              </div>
                              <div className="text-xs text-gray-500 flex items-center space-x-2">
                                <span className={`px-2 py-1 rounded-full ${getFrequencyColor(receipt.paymentFrequency || receipt.paymentType)}`}>
                                  {getFrequencyText(receipt.paymentFrequency || receipt.paymentType)}
                                </span>
                                <span>{space?.spaceType}</span>
                                <span className={`px-2 py-1 rounded-full ${
                                  receipt.paymentMethod === 'cash' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {receipt.paymentMethod === 'cash' ? 'ເງິນສົດ' : 'ໂອນເງິນ'}
                                </span>
                                {receipt.paymentImageUrl && (
                                  <button
                                    onClick={() => receipt.paymentImageUrl && handleViewImage(receipt.paymentImageUrl)}
                                    className="flex items-center space-x-1 px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                                  >
                                    <ImageIcon className="w-3 h-3" />
                                    <span>ມີຮູບ</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="font-medium text-green-600">₭{totalAmount.toLocaleString()}</div>
                              <div className="text-xs text-gray-500">
                                {receipt.paymentDate ? new Date(receipt.paymentDate).toLocaleDateString("lo-LA") : 'N/A'}
                              </div>
                            </div>
                            
                            <button
                              onClick={() => handlePrintReceipt(receipt)}
                              className="flex items-center space-x-1 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-xs font-medium"
                            >
                              <Printer className="w-3 h-3" />
                              <span>ພິມ</span>
                            </button>
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

        {(viewMode === "list" ? filteredReceipts : groupedReceipts).length === 0 && (
          <div className="text-center py-12">
            <Receipt className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">ບໍ່ພົບໃບຮັບເງິນ</h3>
            <p className="text-gray-600">ບໍ່ມີໃບຮັບເງິນທີ່ຕົງກັບເງື່ອນໄຂການຊອກຫາ</p>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedImage}
              alt="Payment proof"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <div className="absolute bottom-4 left-4 right-4 flex justify-center space-x-4">
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = selectedImage;
                  link.download = 'payment-proof.jpg';
                  link.click();
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100"
              >
                <Download className="w-4 h-4" />
                <span>ດາວໂຫຼດ</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptManagement;