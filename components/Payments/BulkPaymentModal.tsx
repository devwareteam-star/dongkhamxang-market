'use client';

import React, { useState, useEffect } from 'react';
import { X, CreditCard, Users, List, CheckSquare, Square, Banknote, Smartphone } from 'lucide-react';
import { Payment, Space, Tenant } from '@/types';

interface BulkPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    payments: Payment[];
    paymentMethod: 'cash' | 'transfer';
    notes?: string;
  }) => Promise<void>;
  payments: Payment[];
  spaces: Space[];
  tenants: Tenant[];
}

const BulkPaymentModal: React.FC<BulkPaymentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  payments,
  spaces,
  tenants
}) => {
  const [step, setStep] = useState(1); // 1: Payment Type, 2: Selection Method, 3: Payment Selection, 4: Payment Method
  const [selectedPaymentType, setSelectedPaymentType] = useState<'daily' | 'monthly' | 'yearly' | null>(null);
  const [selectionMethod, setSelectionMethod] = useState<'tenant' | 'manual' | null>(null);
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set());
  const [expandedTenants, setExpandedTenants] = useState<Set<string>>(new Set());
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [notes, setNotes] = useState('');

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

    await onSubmit({
      payments: selectedPaymentsData,
      paymentMethod,
      notes: notes.trim() || undefined
    });

    // Reset state
    setStep(1);
    setSelectedPaymentType(null);
    setSelectionMethod(null);
    setSelectedPayments(new Set());
    setExpandedTenants(new Set());
    setPaymentMethod('cash');
    setNotes('');
  };

  const resetModal = () => {
    setStep(1);
    setSelectedPaymentType(null);
    setSelectionMethod(null);
    setSelectedPayments(new Set());
    setExpandedTenants(new Set());
    setPaymentMethod('cash');
    setNotes('');
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">ເກັບເງິນຫຼາຍ</h2>
            <span className="text-sm text-gray-500">ຂັ້ນຕອນ {step}/4</span>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {/* Step 1: Payment Type Selection */}
          {step === 1 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">ເລືອກປະເພດການຊຳລະ</h3>
              <div className="grid grid-cols-3 gap-4">
                {['daily', 'monthly', 'yearly'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedPaymentType(type as any)}
                    className={`p-6 border-2 rounded-lg text-center transition-all ${
                      selectedPaymentType === type
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400 text-gray-700'
                    }`}
                  >
                    <div className="text-lg font-medium">{getPaymentTypeText(type)}</div>
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
                  <div className="text-lg font-medium">ເລືອກດ້ວຍມື</div>
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
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  ເລືອກລາຍການຊຳລະ ({getPaymentTypeText(selectedPaymentType!)})
                </h3>
                <div className="text-sm text-gray-600">
                  ເລືອກແລ້ວ: {selectedPayments.size} ລາຍການ
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto border rounded-lg">
                {selectionMethod === 'tenant' ? (
                  // Tenant grouped view
                 <div className="divide-y">
                    {groupedPayments.map((group) => {
                      const tenantPaymentIds = group.payments.map(p => p.id || p.paymentId).filter(Boolean);
                      const selectedCount = tenantPaymentIds.filter(id => selectedPayments.has(id)).length;
                      const allSelected = selectedCount === tenantPaymentIds.length && tenantPaymentIds.length > 0;
                      const someSelected = selectedCount > 0 && selectedCount < tenantPaymentIds.length;

                      return (
                        <div key={group.tenant.tenantId}>
                          <div className="flex items-center justify-between p-4 hover:bg-gray-50">
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => toggleTenantSelection(group.tenant.tenantId)}
                                className="flex items-center"
                              >
                                {allSelected ? (
                                  <CheckSquare className="w-5 h-5 text-blue-600" />
                                ) : someSelected ? (
                                  <div className="w-5 h-5 border-2 border-blue-600 bg-blue-100 rounded"></div>
                                ) : (
                                  <Square className="w-5 h-5 text-gray-400" />
                                )}
                              </button>
                              <button
                                onClick={() => toggleTenantExpansion(group.tenant.tenantId)}
                                className="text-left"
                              >
                                <div className="font-medium text-gray-900">{group.tenant.tenantName}</div>
                                <div className="text-sm text-gray-500">
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
      <>
        {`${totalCollectible} ລາຍການ • ₭${group.totalAmount.toLocaleString()}`}
        {overdueCount > 0 && (
          <span className="text-red-500"> • {overdueCount} ເກີນກຳນົດ</span>
        )}
      </>
    );
  })()}
</div>
                              </button>
                            </div>
                            <div className="text-sm text-blue-600">
                              {selectedCount}/{tenantPaymentIds.length} ເລືອກແລ້ວ
                            </div>
                          </div>

                          {expandedTenants.has(group.tenant.tenantId) && (
                            <div className="bg-gray-50 px-8 py-2">
                              {group.payments.map((payment) => {
                                const space = spaces.find(s => s.id === payment.spaceId || s.id === payment.roomId);
                                const paymentId = payment.id || payment.paymentId;
                                const isSelected = selectedPayments.has(paymentId);
                                const totalAmount = (payment.amount || 0) + (payment.lateFee || 0);

                                return (
                                  <div key={paymentId} className="flex items-center space-x-3 py-2">
                                    <button onClick={() => togglePaymentSelection(paymentId)}>
                                      {isSelected ? (
                                        <CheckSquare className="w-4 h-4 text-blue-600" />
                                      ) : (
                                        <Square className="w-4 h-4 text-gray-400" />
                                      )}
                                    </button>
                                    <div className="flex-1">
                                      <div className="font-medium text-sm">{space?.spaceCode}</div>
                                      <div className="text-xs text-gray-500">
                                        ₭{totalAmount.toLocaleString()}
                                        {payment.lateFee && payment.lateFee > 0 && (
                                          <span className="text-red-500 ml-1">(+ຄ່າປັບ)</span>
                                        )}
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
                  // Manual selection view
                  <div className="divide-y">
                    {filteredPayments.map((payment) => {
                      const space = spaces.find(s => s.id === payment.spaceId || s.id === payment.roomId);
                      const tenant = tenants.find(t => t.tenantId === payment.tenantId);
                      const paymentId = payment.id || payment.paymentId;
                      const isSelected = selectedPayments.has(paymentId);
                      const totalAmount = (payment.amount || 0) + (payment.lateFee || 0);

                      return (
                        <div key={paymentId} className="flex items-center space-x-3 p-4 hover:bg-gray-50">
                          <button onClick={() => togglePaymentSelection(paymentId)}>
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-blue-600" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900">
                                  {space?.spaceCode} - {tenant?.tenantName} -  {payment.lateFeeApplied && (
  <span style={{ color: "red", fontWeight: "bold" }}>
    ກາຍມື້
  </span>
)}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {space?.spaceType} • {new Date(payment.dueDate).toLocaleDateString('lo-LA')}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-green-600">₭{totalAmount.toLocaleString()}</div>
                                {payment.lateFee && payment.lateFee > 0 && (
                                  <div className="text-xs text-red-500">ຄ່າປັບ: ₭{payment.lateFee.toLocaleString()}</div>
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

              {selectedPayments.size > 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-800 font-medium">ຍອດລວມທີ່ເລືອກ:</span>
                    <span className="text-xl font-bold text-blue-900">₭{getTotalAmount().toLocaleString()}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  ກັບຄືນ
                </button>
                <button
                  onClick={() => setStep(4)}
                  disabled={selectedPayments.size === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ດຳເນີນການຕໍ່
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Payment Method */}
          {step === 4 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">ກຳນົດວິທີການຊຳລະ</h3>
              
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

              {/* Selected Payments List */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">ລາຍການທີ່ເລືອກ</h4>
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
                            {payment.lateFee && payment.lateFee > 0 && (
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

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ໝາຍເຫດ (ບໍ່ບັງຄັບ)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="ໝາຍເຫດສຳລັບການເກັບເງິນຫຼາຍ..."
                />
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  ກັບຄືນ
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  ຢືນຢັນການເກັບເງິນ ({selectedPayments.size} ລາຍການ)
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