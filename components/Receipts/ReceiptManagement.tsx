'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/contexts/DataContext';
import { 
  Receipt, 
  Search, 
  Filter,
  Printer,
  Download,
  Calendar
} from 'lucide-react';

const ReceiptManagement: React.FC = () => {
  const { payments, rooms, tenants } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Get paid payments with receipt numbers
  const receipts = payments.filter(p => p.status === 'paid' && p.receiptNumber);

  const filteredReceipts = receipts.filter(receipt => {
    const room = rooms.find(r => r.id === receipt.roomId);
    const tenant = tenants.find(t => t.id === receipt.tenantId);
    
    const matchesSearch = receipt.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room?.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = !dateFilter || 
                       (receipt.paidDate && new Date(receipt.paidDate).toISOString().split('T')[0] === dateFilter);
    
    return matchesSearch && matchesDate;
  });

  const handlePrintReceipt = (receipt: any) => {
    const room = rooms.find(r => r.id === receipt.roomId);
    const tenant = tenants.find(t => t.id === receipt.tenantId);
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>ใบเสร็จ ${receipt.receiptNumber}</title>
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
              <div class="title">ตลาดสดเจริญกรุง</div>
              <div class="subtitle">ใบเสร็จรับเงิน</div>
              <div class="subtitle">เลขที่: ${receipt.receiptNumber}</div>
            </div>
            
            <div class="content">
              <div class="row">
                <span>วันที่:</span>
                <span>${receipt.paidDate ? new Date(receipt.paidDate).toLocaleDateString('th-TH') : ''}</span>
              </div>
              <div class="row">
                <span>ห้องเลขที่:</span>
                <span>${room?.roomNumber}</span>
              </div>
              <div class="row">
                <span>ผู้เช่า:</span>
                <span>${tenant?.name}</span>
              </div>
              <div class="row">
                <span>ประเภท:</span>
                <span>${receipt.paymentType === 'monthly' ? 'รายเดือน' : 'รายปี'}</span>
              </div>
              <div class="row">
                <span>วิธีชำระ:</span>
                <span>${receipt.paymentMethod === 'cash' ? 'เงินสด' : 'โอนเงิน'}</span>
              </div>
            </div>
            
            <div class="amount">
              จำนวนเงิน: ฿${receipt.amount.toLocaleString()}
            </div>
            
            <div class="footer">
              <div>ขอบคุณที่ใช้บริการ</div>
            </div>
            
            <div class="signature">
              <div>ผู้รับเงิน: พนักงานเก็บเงิน</div>
              <div style="margin-top: 20px;">ลายเซ็น: ________________</div>
            </div>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">จัดการใบเสร็จ</h1>
          <p className="text-gray-600 mt-1">ใบเสร็จทั้งหมด {filteredReceipts.length} ใบ</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาเลขใบเสร็จ, ห้อง, หรือชื่อผู้เช่า..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center justify-center text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-3">
            <Receipt className="w-4 h-4 mr-2" />
            แสดง {filteredReceipts.length} ใบเสร็จ
          </div>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 font-medium text-gray-700">เลขใบเสร็จ</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">ห้อง / ผู้เช่า</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">จำนวนเงิน</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">วันที่ออกใบเสร็จ</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">วิธีชำระ</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredReceipts.map((receipt) => {
                const room = rooms.find(r => r.id === receipt.roomId);
                const tenant = tenants.find(t => t.id === receipt.tenantId);

                return (
                  <tr key={receipt.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">{receipt.receiptNumber}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-medium text-gray-900">ห้อง {room?.roomNumber}</div>
                        <div className="text-sm text-gray-600">{tenant?.name}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-green-600">฿{receipt.amount.toLocaleString()}</div>
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {receipt.paidDate ? new Date(receipt.paidDate).toLocaleDateString('th-TH') : ''}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        receipt.paymentMethod === 'cash' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {receipt.paymentMethod === 'cash' ? 'เงินสด' : 'โอนเงิน'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handlePrintReceipt(receipt)}
                          className="flex items-center space-x-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-sm"
                        >
                          <Printer className="w-4 h-4" />
                          <span>พิมพ์</span>
                        </button>
                      </div>
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบใบเสร็จ</h3>
          <p className="text-gray-600">ไม่มีใบเสร็จที่ตรงกับเงื่อนไขการค้นหา</p>
        </div>
      )}
    </div>
  );
};

export default ReceiptManagement;