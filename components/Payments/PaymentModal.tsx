'use client';

import React, { useState, useMemo } from 'react';
import { X, CreditCard, Banknote, Smartphone, Users, Receipt, Camera, Upload, Image } from 'lucide-react';
import { Payment , Space, SystemSettings, Tenant } from '@/types';


interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { 
    paymentMethod: 'cash' | 'transfer' | undefined; 
    notes?: string; 
    paymentImage?: File; // ADD THIS
  }) => Promise<void>;
  payment: Payment | null;
  payments?: Payment[]; // For bulk payments
  spaces: Space[];
  tenants: Tenant[];
  settings: SystemSettings;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  payment, 
  payments = [], 
  spaces, 
  tenants,
  settings,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | undefined>('cash');
  const [notes, setNotes] = useState('');
  // ADD IMAGE STATE:
  const [paymentImage, setPaymentImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Determine if this is bulk mode
  const isBulkMode = payments.length > 0;
  const paymentsToProcess = isBulkMode ? payments : (payment ? [payment] : []);

  // Calculate totals and summary
  const paymentSummary = useMemo(() => {
    const summary = {
      totalCount: paymentsToProcess.length,
      totalAmount: 0,
      totalLateFee: 0,
      totalDue: 0,
      tenantGroups: new Map<string, { tenant: Tenant; payments: Payment[]; amount: number }>()
    };

    paymentsToProcess.forEach(p => {
      const amount = p.amount || p.amountDue || 0;
      const lateFee = p.lateFee || 0;
      
      summary.totalAmount += amount;
      summary.totalLateFee += lateFee;
      summary.totalDue += amount + lateFee;

      // Group by tenant
      const tenant = tenants.find(t => t.tenantId === p.tenantId);
      if (tenant) {
        if (!summary.tenantGroups.has(tenant.tenantId)) {
          summary.tenantGroups.set(tenant.tenantId, {
            tenant,
            payments: [],
            amount: 0
          });
        }
        const group = summary.tenantGroups.get(tenant.tenantId)!;
        group.payments.push(p);
        group.amount += amount + lateFee;
      }
    });

    return summary;
  }, [paymentsToProcess, tenants]);

  // ADD IMAGE HANDLERS:
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('ຮູບພາບໃຫຍ່ເກີນໄປ. ກະລຸນາເລືອກຮູບພາບທີ່ນ້ອຍກວ່າ 5MB');
        return;
      }
      setPaymentImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          alert('ຮູບພາບໃຫຍ່ເກີນໄປ. ກະລຸນາເລືອກຮູບພາບທີ່ນ້ອຍກວ່າ 5MB');
          return;
        }
        setPaymentImage(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const removeImage = () => {
    setPaymentImage(null);
    setImagePreview(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ 
      paymentMethod, 
      notes: notes.trim() || undefined,
      paymentImage: paymentImage || undefined // ADD THIS
    });
    // Reset form
    setNotes('');
    setPaymentMethod('cash');
    setPaymentImage(null);
    setImagePreview(null);
  };

  if (!isOpen || paymentsToProcess.length === 0) return null;

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
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${isBulkMode ? 'bg-purple-100' : 'bg-green-100'}`}>
              {isBulkMode ? (
                <Users className={`w-6 h-6 ${isBulkMode ? 'text-purple-600' : 'text-green-600'}`} />
              ) : (
                <CreditCard className="w-6 h-6 text-green-600" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isBulkMode ? `ເກັບເງິນຫຼາຍລາຍການ` : 'ເກັບເງິນຄ່າເຊົ່າ'}
              </h2>
              {isBulkMode && (
                <p className="text-sm text-gray-500">
                  {paymentSummary.totalCount} ລາຍການ • {Array.from(paymentSummary.tenantGroups.values()).length} ຜູ້ເຊົ່າ
                </p>
              )}
            </div>
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
          <div className={`rounded-lg p-4 mb-6 ${isBulkMode ? 'bg-purple-50' : 'bg-blue-50'}`}>
            <div className="flex items-center space-x-2 mb-3">
              <Receipt className={`w-5 h-5 ${isBulkMode ? 'text-purple-600' : 'text-blue-600'}`} />
              <h3 className={`font-medium ${isBulkMode ? 'text-purple-900' : 'text-blue-900'}`}>
                ລາຍລະອຽດການຊຳລະ
              </h3>
            </div>

            {isBulkMode ? (
              // Bulk payment summary
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-purple-700 font-medium">ຈຳນວນລາຍການ:</span>
                    <span className="ml-2 font-semibold">{paymentSummary.totalCount}</span>
                  </div>
                  <div>
                    <span className="text-purple-700 font-medium">ຈຳນວນຜູ້ເຊົ່າ:</span>
                    <span className="ml-2 font-semibold">{Array.from(paymentSummary.tenantGroups.values()).length}</span>
                  </div>
                </div>

                {/* Tenant breakdown */}
                <div className="max-h-32 overflow-y-auto border-t border-purple-200 pt-3">
                  {Array.from(paymentSummary.tenantGroups.values()).map(group => (
                    <div key={group.tenant.tenantId} className="flex justify-between items-center py-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">{group.tenant.tenantName}</span>
                        <span className="text-xs text-gray-500">({group.payments.length} ລາຍການ)</span>
                      </div>
                      <span className="text-sm font-semibold text-purple-700">
                        ₭{group.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Single payment details
              <div className="space-y-1 text-sm">
                {(() => {
                  const singlePayment = paymentsToProcess[0];
                  const room = spaces.find(s => s.id === singlePayment.roomId || s.id === singlePayment.spaceId);
                  const tenant = tenants.find(t => t.tenantId === singlePayment.tenantId);
                  
                  return (
                    <>
                      <p><span className="text-blue-700">ຫ້ອງ:</span> {room?.spaceCode || 'ບໍ່ລະບຸ'}</p>
                      <p><span className="text-blue-700">ຜູ້ເຊົ່າ:</span> {tenant?.tenantName || 'ບໍ່ລະບຸ'}</p>
                      <p><span className="text-blue-700">ຈຳນວນເງິນ:</span> ₭{(singlePayment.amount || singlePayment.amountDue || 0).toLocaleString()}</p>
                      <p><span className="text-blue-700">ຮອບຈ່າຍ:</span> {getPaymentTypeText(singlePayment.paymentType)}</p>
                      <p><span className="text-blue-700">ກຳນົດຈ່າຍ:</span> {new Date(singlePayment.dueDate).toLocaleDateString('lo-LA')}</p>
                      {singlePayment.lateFee && singlePayment.lateFee > 0 && (
                        <p><span className="text-red-700">ຄ່າປັບ:</span> ₭{singlePayment.lateFee.toLocaleString()}</p>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                ວິທີການຊຳລະ
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
      {settings.defaultRates.qrCodeImageUrl ? (
        <img
          src={settings.defaultRates.qrCodeImageUrl}
          alt="QR Code for payment"
          className="w-48 h-48 mx-auto object-contain rounded-lg"
        />
      ) : (
        <div className="w-48 h-48 mx-auto bg-gray-200 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Smartphone className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">QR Code ສຳລັບໂອນເງິນ</p>
            <p className="text-xs text-gray-400 mt-1">₭{paymentSummary.totalDue.toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
    <p className="text-sm text-blue-700 mt-3">
      ກະລຸນາໂອນເງິນຈຳນວນ ₭{paymentSummary.totalDue.toLocaleString()} ແລະແຈ້ງການໂອນເງິນ
    </p>
  </div>
)}

            {/* Payment Image Upload */}
                          <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                ຮູບພາບການຊຳລະ (required)
              </label>
              
              {!imagePreview ? (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleCameraCapture}
                    className="flex flex-col items-center justify-center p-4 sm:p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                  >
                    <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mb-2" />
                    <span className="text-xs sm:text-sm font-medium text-gray-600">ຖ່າຍຮູບ</span>
                    <span className="text-xs text-gray-500 mt-1 text-center">ເປີດກ້ອງຖ່າຍຮູບ</span>
                  </button>
                  
                  <label className="flex flex-col items-center justify-center p-4 sm:p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors cursor-pointer">
                    <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mb-2" />
                    <span className="text-xs sm:text-sm font-medium text-gray-600">ອັບໂຫຼດ</span>
                    <span className="text-xs text-gray-500 mt-1 text-center">ເລືອກຈາກອຸປະກອນ</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      required
                    />
                  </label>
                </div>
              ) : (
                <div className="relative">
                  <div className="border-2 border-gray-200 rounded-lg p-3 sm:p-4 bg-gray-50">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                      <div className="flex-shrink-0 self-center sm:self-auto">
                        <img
                          src={imagePreview}
                          alt="Payment proof"
                          className="w-20 h-20 sm:w-16 sm:h-16 object-cover rounded-lg border border-gray-300"
                        />
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start space-x-2">
                          <Image className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-gray-900 break-all">
                            {paymentImage?.name || 'ຮູບພາບການຊຳລະ'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {paymentImage && `${(paymentImage.size / 1024).toFixed(1)} KB`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={removeImage}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors self-center sm:self-auto"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Replace image options */}
                  <div className="mt-3 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <button
                      type="button"
                      onClick={handleCameraCapture}
                      className="flex items-center justify-center sm:justify-start space-x-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      <span>ຖ່າຍໃໝ່</span>
                    </button>
                    <label className="flex items-center justify-center sm:justify-start space-x-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <span>ເລືອກໃໝ່</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-2 text-center sm:text-left">
                ອັບໂຫຼດຮູບພາບເພື່ອຢືນຢັນການຊຳລະ (ເຊັ່ນ: ໃບເສັດໂອນເງິນ, ເງິນສົດ)
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ໝາຍເຫດ (ບໍ່ບັງຄັບ)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={1}
                placeholder={isBulkMode ? "ໝາຍເຫດສຳລັບການເກັບເງິນຫຼາຍ..." : "ໝາຍເຫດເພີ່ມເຕີມ..."}
              />
            </div>

            {/* Total Amount Display */}
            <div className={`rounded-lg p-4 ${isBulkMode ? 'bg-purple-50' : 'bg-gray-50'}`}>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">ຍອດລວມທີ່ຕ້ອງຊຳລະ:</span>
                <span className={`text-2xl font-bold ${isBulkMode ? 'text-purple-600' : 'text-green-600'}`}>
                  ₭{paymentSummary.totalDue.toLocaleString()}
                </span>
              </div>
              {paymentSummary.totalLateFee > 0 && (
                <div className="text-sm text-gray-600 mt-2 flex justify-between">
                  <span>ຄ່າເຊົ່າ: ₭{paymentSummary.totalAmount.toLocaleString()}</span>
                  <span className="text-red-600">ຄ່າປັບ: ₭{paymentSummary.totalLateFee.toLocaleString()}</span>
                </div>
              )}
              {isBulkMode && (
                <div className="text-xs text-gray-500 mt-2 text-center">
                  {paymentSummary.totalCount} ລາຍການຈາກ {Array.from(paymentSummary.tenantGroups.values()).length} ຜູ້ເຊົ່າ
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
                className={`flex-1 px-6 py-3 text-white rounded-lg transition-colors font-medium ${
                  isBulkMode 
                    ? 'bg-purple-600 hover:bg-purple-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isBulkMode 
                  ? `ຢືນຢັນການຊຳລະ (${paymentSummary.totalCount} ລາຍການ)` 
                  : 'ຢືນຢັນການຊຳລະ'
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;