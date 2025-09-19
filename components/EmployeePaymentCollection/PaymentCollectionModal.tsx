"use client";

import React, { useState, useEffect } from 'react';
import { 
  X, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  CheckCircle, 
  AlertTriangle,
  User,
  MapPin,
  Calendar,
  Receipt,
  DollarSign
} from 'lucide-react';
import { Payment } from '@/types';
import { useData } from '@/lib/contexts/DataContext';

interface PaymentCollectionModalProps {
  isOpen: boolean;
  payment: Payment | null;
  paymentMethod: string;
  onClose: () => void;
  onSubmit: (data: {
    paymentMethod: 'cash' | 'transfer';
    notes?: string;
    amountPaid?: number;
  }) => Promise<void>;
}

const PaymentCollectionModal: React.FC<PaymentCollectionModalProps> = ({
  isOpen,
  payment,
  paymentMethod,
  onClose,
  onSubmit
}) => {
  const { spaces, tenants } = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState('');
  const [customAmount, setCustomAmount] = useState<number | null>(null);
  const [useCustomAmount, setUseCustomAmount] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setNotes('');
      setCustomAmount(null);
      setUseCustomAmount(false);
    }
  }, [isOpen, payment]);

  if (!isOpen || !payment) return null;

  // Get related data
  const space = spaces.find(s => s.id === payment.spaceId);
  const tenant = tenants.find(t => t.tenantId === payment.tenantId);

  const spaceCode = space?.spaceCode || 'N/A';
  const tenantName = tenant?.tenantName || 'ບໍ່ທຼາບຊື່';
  
  const baseAmount = payment.amountDue || 0;
  const lateFee = payment.lateFee || 0;
  const totalDue = baseAmount + lateFee;
  const amountToPay = useCustomAmount && customAmount ? customAmount : totalDue;

  const formatCurrency = (amount: number): string => {
    return `₭${amount.toLocaleString()}`;
  };

  const getPaymentMethodInfo = () => {
    switch (paymentMethod) {
      case 'cash':
        return {
          name: 'ເງິນສົດ (Cash)',
          icon: <Banknote className="w-6 h-6 text-green-500" />,
          color: 'text-green-600',
          bgColor: 'bg-green-50 border-green-200'
        };
      case 'transfer':
        return {
          name: 'ໂອນເງິນ (Transfer)',
          icon: <Smartphone className="w-6 h-6 text-blue-500" />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 border-blue-200'
        };
      default:
        return {
          name: 'ບໍ່ທຼາບ',
          icon: <CreditCard className="w-6 h-6 text-gray-500" />,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50 border-gray-200'
        };
    }
  };

  const handleSubmit = async () => {
    if (!paymentMethod) return;
    
    setIsSubmitting(true);
    
    try {
      await onSubmit({
        paymentMethod: paymentMethod as 'cash' | 'transfer',
        notes: notes.trim() || undefined,
        amountPaid: amountToPay
      });
    } catch (error) {
      console.error('Payment submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const methodInfo = getPaymentMethodInfo();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Receipt className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">ເກັບເງິນຄ່າເຊົ່າ</h2>
              <p className="text-sm text-gray-500">ຢືນຢັນການຊຳລະເງິນ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Space & Tenant Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">ຂໍ້ມູນການຊຳລະ</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">ລະຫັດພື້ນທີ່</p>
                  <p className="font-medium text-gray-900">{spaceCode}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">ຜູ້ເຊົ່າ</p>
                  <p className="font-medium text-gray-900">{tenantName}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">ກຳນົດຊຳລະ</p>
                  <p className="font-medium text-gray-900">
                    {payment.dueDate ? new Date(payment.dueDate).toLocaleDateString('lo-LA') : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Receipt className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">ໄລຍະ</p>
                  <p className="font-medium text-gray-900">{payment.paymentPeriod || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className={`rounded-lg p-4 border-2 ${methodInfo.bgColor}`}>
            <h3 className="font-medium text-gray-900 mb-3">ວິທີການຊຳລະ</h3>
            <div className="flex items-center space-x-3">
              {methodInfo.icon}
              <div>
                <p className={`font-medium ${methodInfo.color}`}>{methodInfo.name}</p>
                <p className="text-sm text-gray-500">ເລືອກແລ້ວ</p>
              </div>
            </div>
          </div>

          {/* Amount Details */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-4">ລາຍລະອຽດຈຳນວນເງິນ</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">ຄ່າເຊົ່າພື້ນຖານ:</span>
                <span className="font-medium text-gray-900">{formatCurrency(baseAmount)}</span>
              </div>
              
              {lateFee > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-red-600">ຄ່າປັບຊ້າ:</span>
                  <span className="font-medium text-red-600">{formatCurrency(lateFee)}</span>
                </div>
              )}
              
              {(payment.daysOverdue || 0) > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-red-500">ເກີນກຳນົດ:</span>
                  <span className="text-red-500">{payment.daysOverdue} ວັນ</span>
                </div>
              )}
              
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">ລວມທັງໝົດ:</span>
                  <span className="text-xl font-bold text-blue-600">{formatCurrency(totalDue)}</span>
                </div>
              </div>
            </div>

            {/* Custom Amount Option */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={useCustomAmount}
                  onChange={(e) => {
                    setUseCustomAmount(e.target.checked);
                    if (!e.target.checked) {
                      setCustomAmount(null);
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">ກຳນົດຈຳນວນເງິນເອງ</span>
              </label>
              
              {useCustomAmount && (
                <div className="mt-2">
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={customAmount || ''}
                      onChange={(e) => setCustomAmount(Number(e.target.value) || null)}
                      placeholder="ໃສ່ຈຳນວນເງິນ"
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      max={totalDue}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    ສູງສຸດ: {formatCurrency(totalDue)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ບັນທຶກເພີ່ມເຕີມ (ທາງເລືອກ)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="ເພີ່ມບັນທຶກກ່ຽວກັບການຊຳລະນີ້..."
            />
          </div>

          {/* Payment Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900">ການຢືນຢັນການຊຳລະ</h4>
                <div className="mt-2 space-y-1 text-sm text-blue-800">
                  <p>• ພື້ນທີ່: {spaceCode}</p>
                  <p>• ຜູ້ເຊົ່າ: {tenantName}</p>
                  <p>• ຈຳນວນເງິນ: {formatCurrency(amountToPay)}</p>
                  <p>• ວິທີຊຳລະ: {methodInfo.name}</p>
                  <p>• ວັນທີ: {new Date().toLocaleDateString('lo-LA')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Warning for partial payment */}
          {useCustomAmount && customAmount && customAmount < totalDue && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">ການຊຳລະບໍ່ຄົບ</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    ຈຳນວນເງິນທີ່ຊຳລະ ({formatCurrency(customAmount)}) ນ້ອຍກວ່າຈຳນວນທີ່ຄ້າງຊຳລະ ({formatCurrency(totalDue)})
                    <br />
                    ຍອດຄົງເຫຼືອ: {formatCurrency(totalDue - customAmount)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            ຍົກເລີກ
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !paymentMethod || (useCustomAmount && (!customAmount || customAmount <= 0))}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>ກຳລັງດຳເນີນການ...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>ຢືນຢັນການຊຳລະ</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCollectionModal;