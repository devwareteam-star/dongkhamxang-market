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
  Building2
} from 'lucide-react';

const ReceiptManagement: React.FC = () => {
  const { payments, spaces, tenants, paidPayments } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [spaceTypeFilter, setSpaceTypeFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [activeFrequencyTab, setActiveFrequencyTab] = useState<string>('all');

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ຈັດການໃບຮັບເງິນ</h1>
          <p className="text-gray-600 mt-1">ໃບຮັບເງິນທັງໝົດ {filteredReceipts.length} ໃບ</p>
        </div>
      </div>

      {/* Frequency Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {frequencyTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFrequencyTab(tab.id)}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors relative ${
                activeFrequencyTab === tab.id
                  ? "bg-blue-50 text-blue-700 border-b-2 border-blue-500"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
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

        {/* Filters */}
        <div className="p-4 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="ຊອກຫາເລກໃບຮັບເງິນ, ຫ້ອງ, ຫຼືຊື່..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            
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

            <div className="flex items-center justify-center text-xs text-gray-600 bg-white rounded-lg px-3 py-2 border border-gray-300">
              <Receipt className="w-3 h-3 mr-1" />
              {filteredReceipts.length} ໃບຮັບເງິນ
            </div>
          </div>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
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
                        {receipt.paymentPeriod || 'N/A'}
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
  );
};

export default ReceiptManagement;