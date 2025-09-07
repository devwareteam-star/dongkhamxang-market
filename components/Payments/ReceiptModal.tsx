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
  const { spaces, tenants, settings } = useData();
  const { user } = useAuth();

  if (!isOpen || !payment) return null;

  // Find space and tenant using proper field mapping
  const space = spaces.find(r => r.id === payment.roomId);
const tenant = tenants.find(t => t.tenantId === payment.tenantId);
  

  // Get employee name from processed by or current user
  const employeeName = payment.processedBy ? 
  tenants.find(u => u.id === payment.processedBy)?.tenantName ||
    user?.displayName || 'ພະນັກງານເກັບເງິນ' : 
    user?.displayName || 'ພະນັກງານເກັບເງິນ';

  // Map payment method to display text
  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'ເງິນສົດ': return 'ເງິນສົດ';
      case 'ໂອນເງິນ': return 'ໂອນເງິນ';
      case 'BCEL': return 'BCEL Bank';
      case 'JDB': return 'JDB Bank';
      default: return method;
    }
  };

  // Map payment period to display text
  const getPaymentPeriodText = (method: string) => {
    switch (method) {
      case 'ເດືອນ': return 'ລາຍເດືອນ';
      case 'ປີ': return 'ລາຍປີ';
      default: return method;
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generateReceiptHTML());
      printWindow.document.close();
      printWindow.print();
    }
  };

  const generateReceiptHTML = () => {
    const amount = payment.amountPaid || payment.amountDue || payment.amount || 0;
    const paymentDate = payment.paymentDate || payment.paidDate;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>ໃບເສັດ ${payment.receiptNumber || 'N/A'}</title>
        <meta charset="UTF-8">
        <style>
          body { 
            font-family: 'Noto Sans Lao', sans-serif; 
            margin: 20px; 
            font-size: 14px;
          }
          .receipt { 
            max-width: 400px; 
            margin: 0 auto; 
            border: 2px solid #000; 
            padding: 20px; 
          }
          .header { 
            text-align: center; 
            margin-bottom: 20px; 
            border-bottom: 1px solid #ccc;
            padding-bottom: 15px;
          }
          .title { 
            font-size: 18px; 
            font-weight: bold; 
            margin-bottom: 5px;
          }
          .subtitle { 
            font-size: 14px; 
            margin: 3px 0; 
            color: #666;
          }
          .receipt-number {
            font-size: 16px;
            font-weight: bold;
            margin-top: 10px;
          }
          .content { 
            margin: 20px 0; 
          }
          .row { 
            display: flex; 
            justify-content: space-between; 
            margin: 12px 0; 
            padding: 5px 0;
          }
          .row-label {
            font-weight: 500;
          }
          .amount { 
            font-size: 22px; 
            font-weight: bold; 
            text-align: center; 
            margin: 25px 0; 
            padding: 15px;
            border: 2px solid #000;
            background-color: #f9f9f9;
          }
          .footer { 
            margin-top: 30px; 
            text-align: center; 
            border-top: 1px solid #ccc;
            padding-top: 15px;
          }
          .signature { 
            margin-top: 40px; 
            text-align: right; 
          }
          .company-info {
            font-size: 12px;
            color: #666;
          }
          @media print {
            body { margin: 0; }
            .receipt { border: 1px solid #000; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="title">${settings.marketInfo.name}</div>
            <div class="company-info">${settings.marketInfo.address}</div>
            <div class="company-info">ໂທ: ${settings.marketInfo.phone}</div>
            ${settings.marketInfo.taxId ? `<div class="company-info">ເລກກຳນົດພາສີ: ${settings.marketInfo.taxId}</div>` : ''}
            <div class="subtitle">ໃບເສັດຮັບເງິນ</div>
            <div class="receipt-number">ເລກທີ່: ${payment.receiptNumber || 'N/A'}</div>
          </div>
          
          <div class="content">
            <div class="row">
              <span class="row-label">ວັນທີ່:</span>
              <span>${paymentDate ? new Date(paymentDate).toLocaleDateString('lo-LA') : 'N/A'}</span>
            </div>
            <div class="row">
              <span class="row-label">ລະຫັດພື້ນທີ່:</span>
              <span>${space?.spaceCode || 'N/A'}</span>
            </div>
            <div class="row">
              <span class="row-label">ປະເພດພື້ນທີ່:</span>
              <span>${space?.spaceType || 'N/A'}</span>
            </div>
            <div class="row">
              <span class="row-label">ໂຊນ:</span>
              <span>${space?.zone || 'N/A'}</span>
            </div>
            <div class="row">
              <span class="row-label">ຜູ້ເຊົ່າ:</span>
              <span>${tenant?.tenantName || 'N/A'}</span>
            </div>
            <div class="row">
              <span class="row-label">ໂທລະສັບ:</span>
              <span>${tenant?.contact || 'N/A'}</span>
            </div>
            <div class="row">
              <span class="row-label">ງວດຊຳລະ:</span>
              <span>${payment.paymentPeriod || 'N/A'}</span>
            </div>
            <div class="row">
              <span class="row-label">ວິທີຊຳລະ:</span>
              <span>${getPaymentMethodText(payment.paymentMethod || '')}</span>
            </div>
            ${payment.lateFee && payment.lateFee > 0 ? `
            <div class="row">
              <span class="row-label">ຄ່າປັບລ້າຊ້າ:</span>
              <span>₭${payment.lateFee.toLocaleString()}</span>
            </div>
            ` : ''}
          </div>
          
          <div class="amount">
            ລວມເງິນທັງໝົດ: ₭${amount.toLocaleString()}
            ${payment.lateFee && payment.lateFee > 0 ? `<br><small>(ຄ່າເຊົ່າ: ₭${payment.amountDue.toLocaleString()} + ຄ່າປັບ: ₭${payment.lateFee.toLocaleString()})</small>` : ''}
          </div>
          
          <div class="footer">
            <div>${settings.receipt.footer}</div>
          </div>
          
          <div class="signature">
            <div>ຜູ້ຮັບເງິນ: ${employeeName}</div>
            <div style="margin-top: 25px;">ລາຍເຊັນ: ________________</div>
            <div style="margin-top: 10px; font-size: 12px;">ວັນທີ່: ${new Date().toLocaleDateString('lo-LA')}</div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const amount = payment.amountPaid || payment.amountDue || payment.amount || 0;
  const paymentDate = payment.paymentDate || payment.paidDate;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md max-h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">ຕົວຢ່າງໃບເສັດ</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="border-2 border-gray-300 p-6 bg-white">
            <div className="text-center mb-6 border-b pb-4">
              <h2 className="text-xl font-bold">{settings.marketInfo.name}</h2>
              <p className="text-xs text-gray-600 mt-1">{settings.marketInfo.address}</p>
              <p className="text-xs text-gray-600">ໂທ: {settings.marketInfo.phone}</p>
              {settings.marketInfo.taxId && (
                <p className="text-xs text-gray-600">ເລກກຳນົດພາສີ: {settings.marketInfo.taxId}</p>
              )}
              <p className="text-sm font-medium mt-2">ໃບເສັດຮັບເງິນ</p>
              <p className="text-sm font-bold">ເລກທີ່: {payment.receiptNumber || 'N/A'}</p>
            </div>
            
            <div className="space-y-3 mb-6 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">ວັນທີ່:</span>
                <span>{paymentDate ? new Date(paymentDate).toLocaleDateString('lo-LA') : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">ລະຫັດພື້ນທີ່:</span>
                <span>{space?.spaceCode || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">ປະເພດພື້ນທີ່:</span>
                <span>{space?.spaceType || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">ໂຊນ:</span>
                <span>{space?.zone || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">ຜູ້ເຊົ່າ:</span>
                <span>{tenant?.tenantName || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">ໂທລະສັບ:</span>
                <span>{tenant?.contact || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">ງວດຊຳລະ:</span>
                <span>{payment.paymentPeriod || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">ວິທີຊຳລະ:</span>
                <span>{getPaymentMethodText(payment.paymentMethod || '')}</span>
              </div>
              {payment.lateFee && payment.lateFee > 0 && (
                <div className="flex justify-between text-red-600">
                  <span className="font-medium">ຄ່າປັບລ້າຊ້າ:</span>
                  <span>₭{payment.lateFee.toLocaleString()}</span>
                </div>
              )}
            </div>
            
            <div className="text-center text-lg font-bold mb-6 p-4 bg-gray-50 rounded border-2 border-gray-300">
              <div>ລວມເງິນທັງໝົດ: ₭{amount.toLocaleString()}</div>
              {payment.lateFee && payment.lateFee > 0 && (
                <div className="text-sm text-gray-600 mt-1">
                  (ຄ່າເຊົ່າ: ₭{payment.amountDue.toLocaleString()} + ຄ່າປັບ: ₭{payment.lateFee.toLocaleString()})
                </div>
              )}
            </div>
            
            <div className="text-center mb-4 border-t pt-4">
              <p className="text-sm">{settings.receipt.footer}</p>
            </div>
            
            <div className="text-right text-sm">
              <p className="font-medium">ຜູ້ຮັບເງິນ: {employeeName}</p>
              <p className="mt-4">ລາຍເຊັນ: ________________</p>
              <p className="mt-2 text-xs text-gray-500">ວັນທີ່: {new Date().toLocaleDateString('lo-LA')}</p>
            </div>
          </div>
          
          <div className="flex space-x-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ປິດ
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>ພິມ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;