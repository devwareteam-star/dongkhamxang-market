'use client';

import React, { useState } from 'react';
import { X, CreditCard, Banknote, Smartphone } from 'lucide-react';
import { Payment , Space, Tenant} from '@/types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { paymentMethod: 'cash' | 'transfer' | undefined; notes?: string; }) => Promise<void>;
  payment: Payment | null;
  spaces: Space[]; // Add this
  tenants: Tenant[]; // Add this for future use
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onSubmit, payment, spaces, tenants }) => {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | undefined>('cash');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ paymentMethod, notes: notes.trim() || undefined });
    setNotes('');
    setPaymentMethod('cash');
  };

  if (!isOpen || !payment) return null;

  const room = spaces.find(s => s.id === payment.roomId);
const tenant = tenants.find(t => t.tenantId === payment.tenantId);

  const getPaymentTypeText = (type: Payment['paymentType']) => {
    switch (type) {
      case 'daily': return 'ລາຍວັນ';
      case 'monthly': return 'ລາຍເດືອນ';
      case 'yearly': return 'ລາຍປີ';
      default: return type;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <CreditCard className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">ເກັບເງິນຄ່າເຊົ່າ</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {/* Payment Details */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-900 mb-2">ລາຍລະອຽດການຈ່າຍ</h3>
            <div className="space-y-1 text-sm">
              <p><span className="text-blue-700">ຫ້ອງ:</span> {room?.spaceCode || 'ບໍ່ລະບຸ'}</p>
              <p><span className="text-blue-700">ຈຳນວນເງິນ:</span> ₭{payment.amount.toLocaleString()}</p>
              <p><span className="text-blue-700">ຮອບຈ່າຍ:</span> {getPaymentTypeText(payment.paymentType)}</p>
              <p><span className="text-blue-700">ກຳນົດຈ່າຍ:</span> {new Date(payment.dueDate).toLocaleDateString('lo-LA')}</p>
              {payment.lateFee && payment.lateFee > 0 && (
                <p><span className="text-red-700">ຄ່າປັບ:</span> ₭{payment.lateFee.toLocaleString()}</p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                ວິທີການຈ່າຍເງິນ
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex items-center justify-center space-x-2 p-4 border-2 rounded-lg transition-all ${
                    paymentMethod === 'cash'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 hover:border-gray-400 text-gray-700'
                  }`}
                >
                  <Banknote className="w-5 h-5" />
                  <span className="font-medium">ເງິນສົດ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('transfer')}
                  className={`flex items-center justify-center space-x-2 p-4 border-2 rounded-lg transition-all ${
                    paymentMethod === 'transfer'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400 text-gray-700'
                  }`}
                >
                  <Smartphone className="w-5 h-5" />
                  <span className="font-medium">ໂອນເງິນ</span>
                </button>
              </div>
            </div>

            {/* QR Code for Transfer */}
            {paymentMethod === 'transfer' && (
              <div className="bg-blue-50 rounded-lg p-6 text-center">
                <h3 className="font-medium text-blue-900 mb-4">ສະແກນ QR Code ເພື່ອໂອນເງິນ</h3>
                <div className="bg-white p-4 rounded-lg inline-block shadow-sm">
                  <div className="w-48 h-48 mx-auto bg-gray-200 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Smartphone className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">QR Code ສຳລັບໂອນເງິນ</p>
                      <p className="text-xs text-gray-400 mt-1">₭{payment.amount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-blue-700 mt-3">
                  ກະລຸນາໂອນເງິນຈຳນວນ ₭{payment.amount.toLocaleString()} ແລະແຈ້ງການໂອນເງິນ
                </p>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ໝາຍເຫດ (ບໍ່ບັງຄັບ)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="ໝາຍເຫດເພີ່ມເຕີມ..."
              />
            </div>

            {/* Total Amount Display */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">ຍອດລວມທີ່ຕ້ອງຈ່າຍ:</span>
                <span className="text-2xl font-bold text-green-600">
                  ₭{(payment.amount + (payment.lateFee || 0)).toLocaleString()}
                </span>
              </div>
              {payment.lateFee && payment.lateFee > 0 && (
                <div className="text-sm text-gray-600 mt-1">
                  (ຄ່າເຊົ່າ ₭{payment.amount.toLocaleString()} + ຄ່າປັບ ₭{payment.lateFee.toLocaleString()})
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ຍົກເລີກ
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
              >
                ຢືນຢັນການຈ່າຍ
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;