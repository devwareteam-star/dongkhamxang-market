"use client";
import React, { useState, useMemo } from 'react';
import { 
  CreditCard, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  AlertCircle,
  Banknote,
  Smartphone,
  User,
  Calendar,
  Search,
  Filter,
  Package,
  Edit3
} from 'lucide-react';
import { useData } from '@/lib/contexts/DataContext';
import { Payment, Space, Tenant } from '@/types';
import PaymentCollectionModal from './PaymentCollectionModal';

// Constants - same as space layout
const PAYMENT_WIDTH = 80;
const PAYMENT_HEIGHT = 80;
const GRID_SIZE = Math.min(PAYMENT_WIDTH, PAYMENT_HEIGHT);
const PAYMENT_MARGIN = 4;

interface PaymentItemProps {
  payment: Payment;
  onClick: (payment: Payment) => void;
  style?: React.CSSProperties;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: 'cash',
    name: 'ເງິນສົດ (Cash)',
    icon: <Banknote className="w-6 h-6" />,
    color: 'bg-green-500'
  },
  {
    id: 'transfer',
    name: 'ໂອນເງິນ (Transfer)', 
    icon: <Smartphone className="w-6 h-6" />,
    color: 'bg-blue-500'
  }
];

const useResponsiveCanvas = () => {
  const [canvasSize, setCanvasSize] = React.useState({ width: 1200, height: 600 });
  
  React.useEffect(() => {
    const updateCanvasSize = () => {
      const availableWidth = window.innerWidth - 320 - 48;
      const availableHeight = window.innerHeight - 200;
      
      const maxWidth = Math.min(availableWidth, 1400);
      const maxHeight = Math.min(availableHeight, 800);
      
      setCanvasSize({
        width: Math.max(800, maxWidth),
        height: Math.max(500, maxHeight)
      });
    };
    
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);
  
  return canvasSize;
};

const PaymentCollectionDashboard: React.FC = () => {
  const { 
    payments, 
    paidPayments, 
    spaces, 
    tenants, 
    updatePayment, 
    loading,
    generateReceiptNumber 
  } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'overdue'>('all');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string>('cash');
  const { width: CANVAS_WIDTH, height: CANVAS_HEIGHT } = useResponsiveCanvas();

  // Get unpaid payments only
  const unpaidPayments = useMemo(() => {
    return payments.filter(payment => 
      payment.paymentStatus !== 'paid' && 
      payment.status !== 'paid'
    );
  }, [payments]);

  // Statistics - same as original
  const stats = useMemo(() => {
    const pendingPayments = unpaidPayments.filter(p => p.paymentStatus === 'pending');
    const overduePayments = unpaidPayments.filter(p => p.paymentStatus === 'overdue');
    
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    const todayCollected = paidPayments.filter(p => {
      if (!p.paymentDate && !p.updatedAt) return false;
      const paymentDate = new Date(p.paymentDate || p.updatedAt);
      return paymentDate >= startOfToday && paymentDate < endOfToday;
    });

    const totalCollected = todayCollected.reduce((sum, p) => 
      sum + (p.amountPaid || p.amountDue || 0), 0
    );

    return {
      pending: pendingPayments.length,
      overdue: overduePayments.length,
      collected: todayCollected.length,
      totalAmount: totalCollected
    };
  }, [unpaidPayments, paidPayments]);

  // Filtered payments
  const filteredPayments = useMemo(() => {
    return unpaidPayments.filter(payment => {
      const tenant = tenants.find(t => t.tenantId === payment.tenantId);
      const tenantName = tenant?.tenantName || '';
      
      const space = spaces.find(s => s.id === payment.spaceId);
      const spaceCode = space?.spaceCode || 'N/A';

      const matchesSearch = tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           spaceCode.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || payment.paymentStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [unpaidPayments, searchTerm, statusFilter, tenants, spaces]);

  // Position payments in grid layout
  const positionedPayments = useMemo(() => {
    const paymentsPerRow = Math.floor((CANVAS_WIDTH - PAYMENT_MARGIN * 2) / (PAYMENT_WIDTH + PAYMENT_MARGIN));
    
    return filteredPayments.map((payment, index) => {
      const row = Math.floor(index / paymentsPerRow);
      const col = index % paymentsPerRow;
      
      return {
        ...payment,
        position: {
          x: PAYMENT_MARGIN + col * (PAYMENT_WIDTH + PAYMENT_MARGIN),
          y: PAYMENT_MARGIN + row * (PAYMENT_HEIGHT + PAYMENT_MARGIN)
        }
      };
    });
  }, [filteredPayments, CANVAS_WIDTH]);

  const handlePaymentClick = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPayment(null);
  };

  const handlePaymentSubmit = async (paymentData: {
    paymentMethod: 'cash' | 'transfer';
    notes?: string;
    amountPaid?: number;
  }) => {
    if (!selectedPayment) return;

    try {
      const receiptNumber = generateReceiptNumber();
      const now = new Date();

      await updatePayment(selectedPayment.paymentId || selectedPayment.id, {
        paymentStatus: 'paid',
        status: 'paid',
        paymentDate: now,
        paidDate: now,
        amountPaid: paymentData.amountPaid || (selectedPayment.amountDue + (selectedPayment.lateFee || 0)),
        paymentMethod: paymentData.paymentMethod,
        receiptNumber,
        notes: paymentData.notes || `Payment collected via ${paymentData.paymentMethod}`,
        processedBy: 'current-user',
      });

      setIsModalOpen(false);
      setSelectedPayment(null);
    } catch (error) {
      console.error('Failed to process payment:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₭${amount.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">ກຳລັງໂຫຼດຂໍ້ມູນການຊຳລະ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header - same as space layout */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ເກັບເງິນຄ່າເຊົ່າ (Payment Collection)</h1>
            <p className="text-gray-600 mt-1">ກົດທີ່ການຊຳລະເພື່ອເກັບເງິນ - ວັນທີ {new Date().toLocaleDateString('lo-LA')}</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">ເກັບໄດ້ວັນນີ້</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(stats.totalAmount)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Status Legend - same style as space layout */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6 text-sm">
            <span className="text-gray-600 font-medium">Payment Status:</span>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-700">Collected Today ({stats.collected})</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-700">Pending ({stats.pending})</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-700">Overdue ({stats.overdue})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="ຄົ້ນຫາຊື່ຼູ້ເຊົ່າ ຫຼື ລະຫັດພື້ນທີ່..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">ທັງໝົດ</option>
              <option value="pending">ລໍຖ້າຊຳລະ</option>
              <option value="overdue">ເກີນກຳນົດ</option>
            </select>
          </div>

          {/* Payment Method Selection */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">ວິທີຊຳລະ:</span>
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                  selectedMethod === method.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {method.icon}
                <span className="text-sm font-medium">{method.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content - Canvas Style Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Payment Canvas */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="min-w-fit">
            <PaymentCanvas 
              positionedPayments={positionedPayments}
              onPaymentClick={handlePaymentClick}
              canvasWidth={CANVAS_WIDTH}
              canvasHeight={CANVAS_HEIGHT}
            />
          </div>
        </div>

        {/* Sidebar - Collection Summary */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-900">Collection Summary</h3>
            <p className="text-sm text-gray-500 mt-1">Today's collection progress</p>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Today's Stats */}
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600">Collected Today</p>
                  <p className="text-2xl font-bold text-green-700">{stats.collected}</p>
                  <p className="text-sm text-green-600">{formatCurrency(stats.totalAmount)}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>

            {/* Pending */}
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600">Pending</p>
                  <p className="text-xl font-bold text-yellow-700">{stats.pending}</p>
                </div>
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
            </div>

            {/* Overdue */}
            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600">Overdue</p>
                  <p className="text-xl font-bold text-red-700">{stats.overdue}</p>
                </div>
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <CreditCard className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">How to collect:</p>
                  <ul className="text-sm text-blue-700 mt-1 space-y-1">
                    <li>• Select payment method above</li>
                    <li>• Click on payment cards</li>
                    <li>• Confirm collection in modal</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Collection Modal */}
      <PaymentCollectionModal
        isOpen={isModalOpen}
        payment={selectedPayment}
        paymentMethod={selectedMethod}
        onClose={handleCloseModal}
        onSubmit={handlePaymentSubmit}
      />
    </div>
  );
};

// Payment Canvas Component - similar to space canvas
const PaymentCanvas: React.FC<{
  positionedPayments: (Payment & { position: { x: number; y: number } })[];
  onPaymentClick: (payment: Payment) => void;
  canvasWidth: number;
  canvasHeight: number;
}> = ({ positionedPayments, onPaymentClick, canvasWidth, canvasHeight }) => {
  return (
    <div
      className="relative border-2 border-dashed border-gray-300 bg-white rounded-lg transition-colors"
      style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}
    >
      {/* Grid Background - same as space layout */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(to right, #6b7280 1px, transparent 1px),
              linear-gradient(to bottom, #6b7280 1px, transparent 1px)
            `,
            backgroundSize: `${GRID_SIZE * 5}px ${GRID_SIZE * 5}px`
          }}
        />
        
        <div 
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `
              linear-gradient(to right, #9ca3af 1px, transparent 1px),
              linear-gradient(to bottom, #9ca3af 1px, transparent 1px)
            `,
            backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`
          }}
        />
      </div>
      
      {/* Empty State */}
      {positionedPayments.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <CreditCard className="w-12 h-12 mx-auto mb-2" />
            <p className="text-lg font-medium">No Payments Due</p>
            <p className="text-sm">All payments are up to date</p>
          </div>
        </div>
      )}

      {/* Positioned Payments */}
      {positionedPayments.map((payment) => (
        <div
          key={payment.paymentId || payment.id}
          style={{
            position: 'absolute',
            left: payment.position.x,
            top: payment.position.y
          }}
        >
          <PaymentItem 
            payment={payment} 
            onClick={onPaymentClick}
          />
        </div>
      ))}
    </div>
  );
};

// Payment Item Component - similar to space item
const PaymentItem: React.FC<PaymentItemProps> = ({ payment, onClick, style }) => {
  const { tenants, spaces } = useData();
  
  const formatCurrency = (amount: number) => `₭${amount.toLocaleString()}`;
  
  const tenant = tenants.find(t => t.tenantId === payment.tenantId);
  const space = spaces.find(s => s.id === payment.spaceId);
  
  const tenantName = tenant?.tenantName || 'Unknown';
  const spaceCode = space?.spaceCode || 'N/A';
  
  const totalAmount = (payment.amountDue || 0) + (payment.lateFee || 0);
  
  const getPaymentStatusColor = (): string => {
    switch (payment.paymentStatus) {
      case 'overdue': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      case 'paid': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPaymentIcon = () => {
    switch (payment.paymentStatus) {
      case 'overdue': return <AlertCircle className="w-3 h-3 text-red-600" />;
      case 'pending': return <Clock className="w-3 h-3 text-yellow-600" />;
      case 'paid': return <CheckCircle className="w-3 h-3 text-green-600" />;
      default: return <AlertTriangle className="w-3 h-3 text-gray-600" />;
    }
  };

  const statusColor = getPaymentStatusColor();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick(payment);
  };

  return (
    <div 
      className={`
        payment-item rounded-lg shadow-md border-2 border-white relative
        transition-all duration-200 hover:shadow-lg select-none cursor-pointer
        hover:scale-105 hover:ring-2 hover:ring-blue-300
        ${statusColor}
      `}
      style={{
        width: `${PAYMENT_WIDTH}px`,
        height: `${PAYMENT_HEIGHT}px`,
        ...style
      }}
      onClick={handleClick}
    >
      {/* Payment Information */}
      <div className="absolute inset-2 flex flex-col justify-between pointer-events-none text-white text-xs font-medium overflow-hidden">
        {/* Top Row - Tenant Name */}
        <div className="flex justify-between items-start">
          <span className="truncate text-[10px] leading-tight">
            {tenantName.length > 12 ? tenantName.substring(0, 12) + '...' : tenantName}
          </span>
        </div>
        
        {/* Middle - Amount */}
        <div className="text-center">
          <div className="text-[11px] font-bold leading-tight">
            {formatCurrency(totalAmount)}
          </div>
          {(payment.lateFee || 0) > 0 && (
            <div className="text-[8px] text-red-200">
              +{formatCurrency(payment.lateFee || 0)}
            </div>
          )}
        </div>
        
        {/* Bottom Row - Space Code */}
        <div className="flex justify-between items-end">
          <span className="text-[9px] leading-tight">{spaceCode}</span>
          {(payment.daysOverdue || 0) > 0 && (
            <span className="text-[8px] leading-tight">{payment.daysOverdue}d</span>
          )}
        </div>
      </div>
      
      {/* Status Icon */}
      <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm pointer-events-none">
        {getPaymentIcon()}
      </div>

      {/* Hover Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
        {spaceCode} - {tenantName}
        <br />
        {formatCurrency(totalAmount)} - Click to collect
      </div>
    </div>
  );
};

export default PaymentCollectionDashboard;