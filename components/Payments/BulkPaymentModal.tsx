'use client';

import React, { useState, useEffect } from 'react';
import { X, CreditCard, Users, List, CheckSquare, Square, Banknote, Smartphone, Camera, Upload, Image, ChevronDown, ChevronRight } from 'lucide-react';
import { Payment, Space, SystemSettings, Tenant } from '@/types';

interface BulkPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    payments: Payment[];
    paymentMethod: 'cash' | 'transfer';
    notes?: string;
    paymentImage?: File; // File object for upload
  }) => Promise<void>;
  payments: Payment[];
  spaces: Space[];
  tenants: Tenant[];
  settings: SystemSettings;
  startAtStep?: number;
}

const BulkPaymentModal: React.FC<BulkPaymentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  payments,
  spaces,
  tenants,
  settings,
  startAtStep = 1
}) => {
  const [step, setStep] = useState(startAtStep); // 1: Payment Type, 2: Selection Method, 3: Payment Selection, 4: Payment Method
 const [selectedPaymentType, setSelectedPaymentType] = useState<'daily' | 'monthly' | 'yearly' | null>(
    startAtStep === 4 ? 'daily' : null // Pre-select daily if starting at step 4
  );
  const [selectionMethod, setSelectionMethod] = useState<'tenant' | 'manual' | null>(
    startAtStep === 4 ? 'manual' : null // Pre-select manual if starting at step 4
  );
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(
    startAtStep === 4 
      ? new Set(payments.map(p => p.id || p.paymentId).filter(Boolean))
      : new Set()
  );
  const [expandedTenants, setExpandedTenants] = useState<Set<string>>(new Set());
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [notes, setNotes] = useState('');
  const [paymentImage, setPaymentImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false); // ADD THIS
const [uploadProgress, setUploadProgress] = useState(0); // ADD THIS

 // RESET STEP WHEN MODAL OPENS
  useEffect(() => {
    if (isOpen) {
      setStep(startAtStep);
      if (startAtStep === 4) {
        setSelectedPaymentType('daily');
        setSelectionMethod('manual');
        setSelectedPayments(new Set(payments.map(p => p.id || p.paymentId).filter(Boolean)));
      }
    }
  }, [isOpen, startAtStep, payments]);

  // Filter payments by type and exclude future payments
  const filteredPayments = selectedPaymentType 
    ? payments.filter(p => {
        if (p.paymentType !== selectedPaymentType || p.status === 'paid') return false;
        
        // Only allow overdue and current payments (exclude future)
        const today = new Date();
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        const dueDate = new Date(p.dueDate);
        
        return dueDate < todayEnd; // Allow overdue and current, exclude future
      })
    : [];

  // Group payments by tenant
  const groupedPayments = React.useMemo(() => {
    const grouped = new Map<string, { tenant: Tenant; payments: Payment[]; totalAmount: number }>();
    
    filteredPayments.forEach(payment => {
      const tenant = tenants.find(t => t.tenantId === payment.tenantId);
      if (!tenant) return;

      if (!grouped.has(tenant.tenantId)) {
        grouped.set(tenant.tenantId, {
          tenant,
          payments: [],
          totalAmount: 0
        });
      }

      const group = grouped.get(tenant.tenantId)!;
      group.payments.push(payment);
      group.totalAmount += (payment.amount || 0) + (payment.lateFee || 0);
    });

    return Array.from(grouped.values());
  }, [filteredPayments, tenants]);

  const togglePaymentSelection = (paymentId: string) => {
    const newSelected = new Set(selectedPayments);
    if (newSelected.has(paymentId)) {
      newSelected.delete(paymentId);
    } else {
      newSelected.add(paymentId);
    }
    setSelectedPayments(newSelected);
  };

  const toggleTenantSelection = (tenantId: string) => {
    const group = groupedPayments.find(g => g.tenant.tenantId === tenantId);
    if (!group) return;

    const tenantPaymentIds = group.payments.map(p => p.id || p.paymentId).filter(Boolean);
    const allSelected = tenantPaymentIds.every(id => selectedPayments.has(id));
    
    const newSelected = new Set(selectedPayments);
    if (allSelected) {
      tenantPaymentIds.forEach(id => newSelected.delete(id));
    } else {
      tenantPaymentIds.forEach(id => newSelected.add(id));
    }
    setSelectedPayments(newSelected);
  };

  const toggleTenantExpansion = (tenantId: string) => {
    const newExpanded = new Set(expandedTenants);
    if (newExpanded.has(tenantId)) {
      newExpanded.delete(tenantId);
    } else {
      newExpanded.add(tenantId);
    }
    setExpandedTenants(newExpanded);
  };

  const getSelectedPaymentsData = () => {
    return filteredPayments.filter(p => selectedPayments.has(p.id || p.paymentId));
  };

  const getTotalAmount = () => {
    return getSelectedPaymentsData().reduce((total, payment) => {
      return total + (payment.amount || 0) + (payment.lateFee || 0);
    }, 0);
  };

const handleSubmit = async () => {
  const selectedPaymentsData = getSelectedPaymentsData();
  if (selectedPaymentsData.length === 0) return;

  try {
    setIsUploading(true); // START LOADING
    setUploadProgress(0);

    await onSubmit({
      payments: selectedPaymentsData,
      paymentMethod,
      notes: notes.trim() || undefined,
      paymentImage: paymentImage || undefined
    });

    // Reset state
    setStep(1);
    setSelectedPaymentType(null);
    setSelectionMethod(null);
    setSelectedPayments(new Set());
    setExpandedTenants(new Set());
    setPaymentMethod('cash');
    setNotes('');
    setPaymentImage(null);
    setImagePreview(null);
  } finally {
    setIsUploading(false); // STOP LOADING
    setUploadProgress(0);
  }
};

  const resetModal = () => {
    setStep(1);
    setSelectedPaymentType(null);
    setSelectionMethod(null);
    setSelectedPayments(new Set());
    setExpandedTenants(new Set());
    setPaymentMethod('cash');
    setNotes('');
    setPaymentImage(null);
    setImagePreview(null);
  };

   // MODIFY THE HEADER TO SHOW DIFFERENT TITLE FOR STEP 4 START
  const getModalTitle = () => {
    if (startAtStep === 4) {
      return 'ເກັບເງິນດ່ວນ (Quick Collection)';
    }
    return 'ເກັບເງິນຫຼາຍ';
  };

  const getStepText = () => {
    if (startAtStep === 4) {
      return 'ການຊຳລະ'; // Just show "Payment" instead of step numbers
    }
    return `ຂັ້ນຕອນ ${step}/4`;
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  const getPaymentTypeText = (type: string) => {
    switch (type) {
      case 'daily': return 'ລາຍວັນ';
      case 'monthly': return 'ລາຍເດືອນ';
      case 'yearly': return 'ລາຍປີ';
      default: return type;
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPaymentImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = () => {
    // Create file input for camera
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Use rear camera
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{getModalTitle()}</h2>
            <span className="text-sm text-gray-500">{getStepText()}</span>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {startAtStep < 4 && (
            <>
          {/* Step 1: Payment Type Selection */}
          {step === 1 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">ເລືອກປະເພດການຊຳລະ</h3>
              <div className="grid grid-cols-3 gap-4">
                {['daily', 'monthly', 'yearly'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedPaymentType(type as any)}
                    className={`p-3 lg:p-6 border-2 rounded-lg text-center transition-all ${
                      selectedPaymentType === type
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400 text-gray-700'
                    }`}
                  >
                    <div className="text-base lg:text-lg font-medium">{getPaymentTypeText(type)}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {payments.filter(p => {
                        if (p.paymentType !== type || p.status === 'paid') return false;
                        
                        // Only count overdue and current payments (exclude future)
                        const today = new Date();
                        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
                        const dueDate = new Date(p.dueDate);
                        
                        return dueDate < todayEnd;
                      }).length} ລາຍການ
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setStep(2)}
                  disabled={!selectedPaymentType}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ດຳເນີນການຕໍ່
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Selection Method */}
          {step === 2 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">ເລືອກວິທີການເກັບ</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setSelectionMethod('tenant')}
                  className={`p-6 border-2 rounded-lg text-center transition-all ${
                    selectionMethod === 'tenant'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 hover:border-gray-400 text-gray-700'
                  }`}
                >
                  <Users className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-lg font-medium">ຈັດກຸ່ມຕາມຜູ້ເຊົ່າ</div>
                  <div className="text-sm text-gray-500 mt-1">ເລືອກທັງໝົດຂອງຜູ້ເຊົ່າ</div>
                </button>
                <button
                  onClick={() => setSelectionMethod('manual')}
                  className={`p-6 border-2 rounded-lg text-center transition-all ${
                    selectionMethod === 'manual'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-300 hover:border-gray-400 text-gray-700'
                  }`}
                >
                  <List className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-lg font-medium">ເລືອກດ້ວຍຕົວເອງ</div>
                  <div className="text-sm text-gray-500 mt-1">ເລືອກແຕ່ລະລາຍການ</div>
                </button>
              </div>
              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  ກັບຄືນ
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!selectionMethod}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ດຳເນີນການຕໍ່
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Payment Selection */}
{step === 3 && (
  <div>
    {/* Header - Responsive */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
      <h3 className="text-base sm:text-lg font-medium text-gray-900">
        ເລືອກລາຍການຊຳລະ ({getPaymentTypeText(selectedPaymentType!)})
      </h3>
      <div className="text-sm text-gray-600 text-center sm:text-right">
        ເລືອກແລ້ວ: <span className="font-semibold text-blue-600">{selectedPayments.size}</span> ລາຍການ
      </div>
    </div>

    {/* Scrollable List Container - Responsive height */}
    <div className="max-h-80 md:max-h-96 overflow-y-auto border rounded-lg">
      {selectionMethod === 'tenant' ? (
        // Tenant grouped view - Responsive
        <div className="divide-y">
          {groupedPayments.map((group) => {
            const tenantPaymentIds = group.payments.map(p => p.id || p.paymentId).filter(Boolean);
            const selectedCount = tenantPaymentIds.filter(id => selectedPayments.has(id)).length;
            const allSelected = selectedCount === tenantPaymentIds.length && tenantPaymentIds.length > 0;
            const someSelected = selectedCount > 0 && selectedCount < tenantPaymentIds.length;

            return (
              <div key={group.tenant.tenantId}>
                {/* Tenant Header - Responsive */}
                <div className="flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50">
                  <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                    <button
                      onClick={() => toggleTenantSelection(group.tenant.tenantId)}
                      className="flex items-center flex-shrink-0"
                    >
                      {allSelected ? (
                        <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      ) : someSelected ? (
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-blue-600 bg-blue-100 rounded"></div>
                      ) : (
                        <Square className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => toggleTenantExpansion(group.tenant.tenantId)}
                      className="text-left flex-1 min-w-0 flex items-center space-x-2"
                    >
                      {expandedTenants.has(group.tenant.tenantId) ? (
                        <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 text-sm sm:text-base truncate">
                          {group.tenant.tenantName}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 break-words">
                          {(() => {
                            const today = new Date();
                            const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                            const todayEnd = new Date(todayStart);
                            todayEnd.setDate(todayEnd.getDate() + 1);
                            
                            const overdueCount = group.payments.filter(p => {
                              const dueDate = new Date(p.dueDate);
                              return dueDate < todayStart;
                            }).length;
                            
                            const currentCount = group.payments.filter(p => {
                              const dueDate = new Date(p.dueDate);
                              return dueDate >= todayStart && dueDate < todayEnd;
                            }).length;
                            
                            const totalCollectible = overdueCount + currentCount;
                            
                            return (
                              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                                <span>{totalCollectible} ລາຍການ • ₭{group.totalAmount.toLocaleString()}</span>
                               <span className="text-xs">
  <span className={overdueCount > 0 ? "text-red-500" : ""}>
    {overdueCount} ເກີນກຳນົດ
  </span>{" "}
  | {currentCount} ປັດຈຸບັນ
</span>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </button>
                  </div>
                  <div className="text-xs sm:text-sm text-blue-600 flex-shrink-0 ml-2">
                    {selectedCount}/{tenantPaymentIds.length}
                  </div>
                </div>

                {/* Expanded Tenant Payments - Responsive */}
                {expandedTenants.has(group.tenant.tenantId) && (
                  <div className="bg-gray-50 px-4 sm:px-8 py-2">
                    {group.payments.map((payment) => {
                      const space = spaces.find(s => s.id === payment.spaceId || s.id === payment.roomId);
                      const paymentId = payment.id || payment.paymentId;
                      const isSelected = selectedPayments.has(paymentId);
                      const totalAmount = (payment.amount || 0) + (payment.lateFee || 0);
                      
                      // Check if payment is overdue
                      const today = new Date();
                      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                      const dueDate = new Date(payment.dueDate);
                      const isOverdue = dueDate < todayStart;

                      return (
                        <div key={paymentId} className="flex items-center space-x-2 sm:space-x-3 py-2">
                          <button 
                            onClick={() => togglePaymentSelection(paymentId)}
                            className="flex-shrink-0"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                            ) : (
                              <Square className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                            )}
                          </button>
                          <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between min-w-0">
                            <div className="flex items-center space-x-2 min-w-0">
                              <div className="font-medium text-sm truncate">{space?.spaceCode}</div>
                              {isOverdue && (
                                <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded-full flex-shrink-0">
                                  ເກີນກຳນົດ
                                </span>
                              )}
                            </div>
                            <div className="text-right mt-1 sm:mt-0">
                              <div className="text-xs text-gray-600">
                                ₭{totalAmount.toLocaleString()}
                                {payment.lateFee && payment.lateFee > 0 && (
                                  <span className="text-red-500 ml-1">(+ຄ່າປັບ)</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        // Manual selection view - Responsive
        <div className="divide-y">
          {filteredPayments.map((payment) => {
            const space = spaces.find(s => s.id === payment.spaceId || s.id === payment.roomId);
            const tenant = tenants.find(t => t.tenantId === payment.tenantId);
            const paymentId = payment.id || payment.paymentId;
            const isSelected = selectedPayments.has(paymentId);
            const totalAmount = (payment.amount || 0) + (payment.lateFee || 0);

            return (
              <div key={paymentId} className="flex items-center space-x-3 p-3 sm:p-4 hover:bg-gray-50">
                <button 
                  onClick={() => togglePaymentSelection(paymentId)}
                  className="flex-shrink-0"
                >
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  ) : (
                    <Square className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 text-sm sm:text-base truncate">
                        {space?.spaceCode} - {tenant?.tenantName}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 truncate">
                        {space?.spaceType} • {new Date(payment.dueDate).toLocaleDateString('lo-LA')}
                      </div>
                    </div>
                    <div className="text-right mt-2 sm:mt-0 flex-shrink-0">
                      <div className="font-medium text-green-600 text-sm sm:text-base">
                        ₭{totalAmount.toLocaleString()}
                      </div>
                      {payment.lateFee && payment.lateFee > 0 && (
                        <div className="text-xs text-red-500">
                          ຄ່າປັບ: ₭{payment.lateFee.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>

    {/* Total Summary - Responsive */}
    {selectedPayments.size > 0 && (
      <div className="mt-4 p-3 sm:p-4 bg-blue-50 rounded-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-center sm:text-left">
          <span className="text-blue-800 font-medium text-sm sm:text-base">ຍອດລວມທີ່ເລືອກ:</span>
          <span className="text-lg sm:text-xl font-bold text-blue-900 mt-1 sm:mt-0">
            ₭{getTotalAmount().toLocaleString()}
          </span>
        </div>
      </div>
    )}

    {/* Navigation Buttons - Responsive */}
    <div className="flex flex-col sm:flex-row justify-between mt-6 space-y-3 sm:space-y-0">
      <button
        onClick={() => setStep(2)}
        className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
      >
        ກັບຄືນ
      </button>
      <button
        onClick={() => setStep(4)}
        disabled={selectedPayments.size === 0}
        className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        ດຳເນີນການຕໍ່ ({selectedPayments.size} ລາຍການ)
      </button>
    </div>
  </div>
)}
</>
          )}

          {/* Step 4: Payment Method */}
          {(step === 4 || startAtStep === 4) && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {startAtStep === 4 ? 'ຢືນຢັນການຊຳລະ' : 'ກຳນົດວິທີການຊຳລະ'}
              </h3>
              
              

              {/* Selected Payments List */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">
                  ລາຍການທີ່ເລືອກ ({getSelectedPaymentsData().length} ລາຍການ)
                </h4>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg bg-white">
                  {getSelectedPaymentsData().map((payment, index) => {
                    const space = spaces.find(s => s.id === payment.spaceId || s.id === payment.roomId);
                    const tenant = tenants.find(t => t.tenantId === payment.tenantId);
                    const totalAmount = (payment.amount || 0) + (payment.lateFee || 0);
                    
                    // Determine payment status
                    const today = new Date();
                    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                    const dueDate = new Date(payment.dueDate);
                    const isOverdue = dueDate < todayStart;
                    
                    return (
                      <div key={payment.id || payment.paymentId} className="flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">{space?.spaceCode || 'N/A'}</span>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-600">{tenant?.tenantName || 'N/A'}</span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              isOverdue 
                                ? 'bg-red-100 text-red-700' 
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {isOverdue ? 'ເກີນກຳນົດ' : 'ປັດຈຸບັນ'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
  {space?.spaceType} • {new Date(payment.dueDate).toLocaleDateString('lo-LA')}
  {(payment.lateFee || 0) > 0 && (
    <span className="text-red-500 ml-2">
      (ມີຄ່າປັບ: ₭{payment.lateFee.toLocaleString()})
    </span>
  )}
</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">₭{totalAmount.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">#{index + 1}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="text-base font-bold text-green-600 mt-2">
                    ຍອດລວມ: ₭{getTotalAmount().toLocaleString()}
                  </div>
              </div>
              

              {/* Payment Method Selection */}
              <div className="mb-6">
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
              
              {paymentMethod === 'transfer' && (
  <div className="bg-blue-50 rounded-lg p-6 text-center mb-6">
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
            <p className="text-xs text-gray-400 mt-1">₭{getTotalAmount().toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
    <p className="text-sm text-blue-700 mt-3">
      ກະລຸນາໂອນເງິນຈຳນວນ ₭{getTotalAmount().toLocaleString()} ແລະແຈ້ງການໂອນເງິນ
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
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ໝາຍເຫດ (ບໍ່ບັງຄັບ)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={1}
                  placeholder="ໝາຍເຫດສຳລັບການເກັບເງິນຫຼາຍ..."
                />
              </div>

              {/* Payment Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-gray-900 mb-2">ສະຫຼຸບການຊຳລະ</h4>
                <div className="text-sm text-gray-600">
                  <div>ຈຳນວນລາຍການ: {selectedPayments.size}</div>
                  <div>ປະເພດ: {getPaymentTypeText(selectedPaymentType!)}</div>
                  <div className="text-lg font-bold text-green-600 mt-2">
                    ຍອດລວມ: ₭{getTotalAmount().toLocaleString()}
                  </div>
                </div>
              </div>

 <div className="flex justify-between">
                {startAtStep === 4 ? (
                  // Quick mode - no back button, just cancel
                  <button
                    onClick={handleClose}
                    disabled={isUploading}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    ຍົກເລີກ
                  </button>
                ) : (
                  // Normal mode - back button
                  <button
                    onClick={() => setStep(3)}
                    disabled={isUploading}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    ກັບຄືນ
                  </button>
                )}
                
                <button
                  onClick={handleSubmit}
                  disabled={isUploading || selectedPayments.size === 0}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 flex items-center space-x-2"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>ກຳລັງປະມວນຜົນ...</span>
                    </>
                  ) : (
                    <span>ຢືນຢັນການເກັບເງິນ ({selectedPayments.size} ລາຍການ)</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkPaymentModal;