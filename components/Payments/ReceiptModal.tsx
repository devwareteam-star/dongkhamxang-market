'use client';

import React from 'react';
import { X, Printer } from 'lucide-react';
import { useData } from '@/lib/contexts/DataContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Payment } from '@/types';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, payment }) => {
  const { rooms, tenants } = useData();
  const { user } = useAuth();

  if (!isOpen || !payment) return null;

  const room = rooms.find(r => r.id === payment.roomId);
  const tenant = tenants.find(t => t.id === payment.tenantId);
  const employeeName = payment.employeeId === '2' ? 'พนักงานเก็บเงิน 1' : 'พนักงานเก็บเงิน 2';

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generateReceiptHTML());
      printWindow.document.close();
      printWindow.print();
    }
  };

  const generateReceiptHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>ใบเสร็จ ${payment.receiptNumber}</title>
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
            <div class="subtitle">เลขที่: ${payment.receiptNumber}</div>
          </div>
          
          <div class="content">
            <div class="row">
              <span>วันที่:</span>
              <span>${payment.paidDate ? new Date(payment.paidDate).toLocaleDateString('th-TH') : ''}</span>
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
              <span>${payment.paymentType === 'monthly' ? 'รายเดือน' : 'รายปี'}</span>
            </div>
            <div class="row">
              <span>วิธีชำระ:</span>
              <span>${payment.paymentMethod === 'cash' ? 'เงินสด' : 'โอนเงิน'}</span>
            </div>
          </div>
          
          <div class="amount">
            จำนวนเงิน: ฿${payment.amount.toLocaleString()}
          </div>
          
          <div class="footer">
            <div>ขอบคุณที่ใช้บริการ</div>
          </div>
          
          <div class="signature">
            <div>ผู้รับเงิน: ${employeeName}</div>
            <div style="margin-top: 20px;">ลายเซ็น: ________________</div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md max-h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">ตัวอย่างใบเสร็จ</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="border border-gray-300 p-6 bg-white">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold">ตลาดสดเจริญกรุง</h2>
              <p className="text-sm text-gray-600">ใบเสร็จรับเงิน</p>
              <p className="text-sm">เลขที่: {payment.receiptNumber}</p>
            </div>
            
            <div className="space-y-2 mb-6">
              <div className="flex justify-between">
                <span>วันที่:</span>
                <span>{payment.paidDate ? new Date(payment.paidDate).toLocaleDateString('th-TH') : ''}</span>
              </div>
              <div className="flex justify-between">
                <span>ห้องเลขที่:</span>
                <span>{room?.roomNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>ผู้เช่า:</span>
                <span>{tenant?.name}</span>
              </div>
              <div className="flex justify-between">
                <span>ประเภท:</span>
                <span>
                  {payment.paymentType === 'monthly' ? 'รายเดือน' : 'รายปี'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>วิธีชำระ:</span>
                <span>{payment.paymentMethod === 'cash' ? 'เงินสด' : 'โอนเงิน'}</span>
              </div>
            </div>
            
            <div className="text-center text-xl font-bold mb-6 p-4 bg-gray-50 rounded">
              จำนวนเงิน: ฿{payment.amount.toLocaleString()}
            </div>
            
            <div className="text-center mb-4">
              <p>ขอบคุณที่ใช้บริการ</p>
            </div>
            
            <div className="text-right">
              <p>ผู้รับเงิน: {employeeName}</p>
              <p className="mt-4">ลายเซ็น: ________________</p>
            </div>
          </div>
          
          <div className="flex space-x-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              ปิด
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;