"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '@/lib/contexts/DataContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Space, Payment, Tenant } from '@/types';
import { 
  CreditCard, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Package,
  CheckSquare,
  Square,
  DollarSign,
  Calendar,
  Users,
  Banknote,
  Smartphone
} from 'lucide-react';
import PaymentModal from './PaymentModal';
import BulkPaymentModal from './BulkPaymentModal'; 

// Fixed canvas size - no responsive scaling
const useFixedCanvas = () => {
  return {
    width: 1200,  // Fixed width
    height: 800,  // Fixed height
    isMobile: window.innerWidth < 768 // Still detect mobile for other UI adjustments
  };
};

// Fixed space size
const SPACE_SIZE = 60;

interface SpacePaymentInfo {
  space: Space;
  todayPayments: Payment[];
  totalAmount: number;
  hasOverdue: boolean;
  isCollected: boolean;
}

interface FloorPlanCanvasProps {
  spacesWithPayments: SpacePaymentInfo[];
  onSpaceClick: (spacePayment: SpacePaymentInfo) => void;
  canvasWidth: number;
  canvasHeight: number;
  spaceSize: number;
  bulkMode: boolean;
  selectedSpaces: Set<string>;
  onSpaceSelect: (spaceId: string) => void;
}

interface PaymentSpaceItemProps {
  spacePayment: SpacePaymentInfo;
  onClick: (spacePayment: SpacePaymentInfo) => void;
  spaceSize: number;
  bulkMode: boolean;
  isSelected: boolean;
  onSelect: (spaceId: string) => void;
}

const FloorPlanPaymentDashboard: React.FC = () => {
  const { 
    spaces, 
    payments, 
    tenants, 
    settings,
    updatePayment, 
    generateReceiptNumber,
    loading 
  } = useData();
  const { user } = useAuth();

  const [bulkMode, setBulkMode] = useState(false);
  const [selectedSpaces, setSelectedSpaces] = useState<Set<string>>(new Set());
  const [selectedSpacePayment, setSelectedSpacePayment] = useState<SpacePaymentInfo | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isBulkPaymentModalOpen, setIsBulkPaymentModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Space['spaceType']>('table');

  // Fixed canvas size - no responsive scaling
  const { width: CANVAS_WIDTH, height: CANVAS_HEIGHT, isMobile } = useFixedCanvas();

  // Get today's date range
  const today = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    return { startOfDay, endOfDay };
  }, []);

  // Get today's payments only
  const todayPayments = useMemo(() => {
    return payments.filter(payment => {
      if (payment.status === 'paid' || payment.paymentStatus === 'paid') return false;
      
      const dueDate = new Date(payment.dueDate);
      return dueDate >= today.startOfDay && dueDate < today.endOfDay;
    });
  }, [payments, today]);

  // Map spaces with today's payment information
  const spacesWithPayments = useMemo(() => {
    const spacesOfType = spaces.filter(space => 
      space.spaceType === activeTab && space.position?.x !== undefined
    );

    return spacesOfType.map(space => {
      const spacePayments = todayPayments.filter(payment => 
        payment.spaceId === space.id || payment.roomId === space.id
      );

      const totalAmount = spacePayments.reduce((sum, payment) => 
        sum + (payment.amountDue || 0) + (payment.lateFee || 0), 0
      );

      const hasOverdue = spacePayments.some(payment => {
        const dueDate = new Date(payment.dueDate);
        return dueDate < today.startOfDay && payment.status !== 'paid';
      });

      const isCollected = spacePayments.length > 0 && spacePayments.every(payment => 
        payment.status === 'paid' || payment.paymentStatus === 'paid'
      );

      return {
        space,
        todayPayments: spacePayments,
        totalAmount,
        hasOverdue,
        isCollected
      };
    });
  }, [spaces, todayPayments, activeTab, today]);

  // Add this calculation before the spacesWithPayments useMemo
const allSpacesWithPayments = useMemo(() => {
  // Get ALL spaces regardless of activeTab, with their payment info
  const allSpaces = spaces.filter(space => space.position?.x !== undefined);

  return allSpaces.map(space => {
    const spacePayments = todayPayments.filter(payment => 
      payment.spaceId === space.id || payment.roomId === space.id
    );

    const totalAmount = spacePayments.reduce((sum, payment) => 
      sum + (payment.amountDue || 0) + (payment.lateFee || 0), 0
    );

    const hasOverdue = spacePayments.some(payment => {
      const dueDate = new Date(payment.dueDate);
      return dueDate < today.startOfDay && payment.status !== 'paid';
    });

    const isCollected = spacePayments.length > 0 && spacePayments.every(payment => 
      payment.status === 'paid' || payment.paymentStatus === 'paid'
    );

    return {
      space,
      todayPayments: spacePayments,
      totalAmount,
      hasOverdue,
      isCollected
    };
  });
}, [spaces, todayPayments, today]);

  // Statistics
  const stats = useMemo(() => {
    const spacesWithTodayPayments = spacesWithPayments.filter(sp => sp.todayPayments.length > 0);
    const collectedSpaces = spacesWithPayments.filter(sp => sp.isCollected);
    const pendingSpaces = spacesWithPayments.filter(sp => sp.todayPayments.length > 0 && !sp.isCollected);
    const overdueSpaces = spacesWithPayments.filter(sp => sp.hasOverdue);

    const totalDue = spacesWithPayments.reduce((sum, sp) => sum + sp.totalAmount, 0);
    const totalCollected = collectedSpaces.reduce((sum, sp) => sum + sp.totalAmount, 0);

    return {
      totalSpaces: spacesWithTodayPayments.length,
      collected: collectedSpaces.length,
      pending: pendingSpaces.length,
      overdue: overdueSpaces.length,
      totalDue,
      totalCollected
    };
  }, [spacesWithPayments]);

  // Space type tabs
  const spaceTypes = [
    { key: 'table' as const, label: 'ໂຕະ (Tables)', shortLabel: 'ໂຕະ', icon: Package },
    { key: 'room' as const, label: 'ຫ້ອງເຊົ່າ (Rooms)', shortLabel: 'ຫ້ອງ', icon: Package },
    { key: 'signage' as const, label: 'ປ້າຍ (Signage)', shortLabel: 'ປ້າຍ', icon: Package },
    { key: 'booth' as const, label: 'ບູດ (Booths)', shortLabel: 'ບູດ', icon: Package }
  ];

  // Event handlers
  const handleSpaceClick = (spacePayment: SpacePaymentInfo) => {
    if (bulkMode) {
      handleSpaceSelect(spacePayment.space.id);
    } else if (spacePayment.todayPayments.length > 0) {
      setSelectedSpacePayment(spacePayment);
      setIsPaymentModalOpen(true);
    }
  };

  const handleSpaceSelect = (spaceId: string) => {
    const newSelected = new Set(selectedSpaces);
    if (newSelected.has(spaceId)) {
      newSelected.delete(spaceId);
    } else {
      newSelected.add(spaceId);
    }
    setSelectedSpaces(newSelected);
  };

const handleBulkCollection = async () => {
    if (selectedSpaces.size === 0) return;
    
    // Open the bulk payment modal instead of direct collection
    setIsBulkPaymentModalOpen(true);
  };

  const handlePaymentCollected = async (data: { 
    paymentMethod: 'cash' | 'transfer' | undefined; 
    notes?: string | undefined;
    paymentImage?: File;
  }) => {
    if (!selectedSpacePayment) return;

    try {
      for (const payment of selectedSpacePayment.todayPayments) {
        const receiptNumber = generateReceiptNumber();
        await updatePayment(
          payment.id, 
          {
            paymentStatus: 'paid',
            paymentDate: new Date(),
            paymentMethod: data.paymentMethod,
            receiptNumber,
            processedBy: user?.id,
            notes: data.notes || undefined
          },
          payment,
          data.paymentImage
        );
      }

      setIsPaymentModalOpen(false);
      setSelectedSpacePayment(null);
      alert("ການຊຳລະເງິນຖືກບັນທຶກແລ້ວ");
    } catch (error) {
      console.error("Error collecting payment:", error);
      alert("ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກການຊຳລະເງິນ");
    }
  };

  const handleBulkPaymentSubmit = async (data: {
    payments: Payment[];
    paymentMethod: 'cash' | 'transfer';
    notes?: string;
    paymentImage?: File;
  }) => {
    try {
      // Process each payment from the modal
      for (const payment of data.payments) {
        const receiptNumber = generateReceiptNumber();
        await updatePayment(
          payment.id, 
          {
            paymentStatus: 'paid',
            paymentDate: new Date(),
            paymentMethod: data.paymentMethod,
            receiptNumber,
            processedBy: user?.id,
            notes: data.notes || 'Bulk collection from floor plan'
          },
          payment,
          data.paymentImage
        );
      }

      alert(`ເກັບເງິນສຳເລັດແລ້ວ ${data.payments.length} ລາຍການ`);
      
      // Reset floor plan bulk mode
      setSelectedSpaces(new Set());
      setBulkMode(false);
      setIsBulkPaymentModalOpen(false);
    } catch (error) {
      console.error('Bulk collection failed:', error);
      alert('ເກີດຂໍ້ຜິດພາດໃນການເກັບເງິນຫຼາຍ');
    }
  };

const getPaymentsForSelectedSpaces = (): Payment[] => {
  const selectedPayments: Payment[] = [];
  
  spacesWithPayments.forEach(spacePayment => {
    if (selectedSpaces.has(spacePayment.space.id) && spacePayment.todayPayments.length > 0) {
      selectedPayments.push(...spacePayment.todayPayments);
    }
  });
  
  return selectedPayments;
};

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium text-sm sm:text-base">ກຳລັງໂຫຼດຂໍ້ມູນການຊຳລະ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
              ເກັບເງິນຕາມແຜນຜັງ (Floor Plan Collection)
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              ວັນທີ {new Date().toLocaleDateString('lo-LA')} - ຄລິກທີ່ພື້ນທີ່ເພື່ອເກັບເງິນ
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setBulkMode(!bulkMode);
                setSelectedSpaces(new Set());
              }}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg transition-colors font-medium text-sm ${
                bulkMode 
                  ? 'bg-orange-600 text-white hover:bg-orange-700' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {bulkMode ? <CheckSquare className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
              <span className="hidden sm:inline">{bulkMode ? 'ຍົກເລີກເລືອກຫຼາຍ' : 'ເກັບເງິນຫຼາຍ'}</span>
              <span className="sm:hidden">{bulkMode ? 'ຍົກເລີກ' : 'ຫຼາຍ'}</span>
            </button>

            {bulkMode && selectedSpaces.size > 0 && (
              <button
                onClick={handleBulkCollection}
                className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
              >
                <CreditCard className="w-4 h-4" />
                <span>ເກັບ ({selectedSpaces.size})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-2 sm:py-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-lg sm:text-xl font-bold text-green-700">{stats.collected}</div>
            <div className="text-xs sm:text-sm text-green-600">ເກັບແລ້ວ</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3">
            <div className="text-lg sm:text-xl font-bold text-yellow-700">{stats.pending}</div>
            <div className="text-xs sm:text-sm text-yellow-600">ລໍຖ້າ</div>
          </div>
          <div className="bg-red-50 rounded-lg p-3">
            <div className="text-lg sm:text-xl font-bold text-red-700">{stats.overdue}</div>
            <div className="text-xs sm:text-sm text-red-600">ເກີນ</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-lg sm:text-xl font-bold text-blue-700">₭{stats.totalDue.toLocaleString()}</div>
            <div className="text-xs sm:text-sm text-blue-600">ລວມ</div>
          </div>
        </div>
      </div>

      {/* Bulk Mode Indicator */}
      {bulkMode && (
        <div className="bg-orange-50 border-b border-orange-200 px-3 sm:px-6 py-2">
          <div className="flex items-center space-x-2 text-orange-800">
            <CheckSquare className="w-4 h-4" />
            <span className="text-xs sm:text-sm font-medium">
              ໂໝດເລືອກຫຼາຍ - ຄລິກທີ່ພື້ນທີ່ເພື່ອເລືອກ ({selectedSpaces.size} ເລືອກແລ້ວ)
            </span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-3 sm:px-6">
          <nav className="flex space-x-2 sm:space-x-8 overflow-x-auto">
  {spaceTypes.map(type => {
    const Icon = type.icon;
    const isActive = activeTab === type.key;
    
    // Get count from ALL spaces, not just filtered ones
    const spacesOfThisType = allSpacesWithPayments.filter(sp => sp.space.spaceType === type.key);
    const countWithPayments = spacesOfThisType.filter(sp => sp.todayPayments.length > 0).length;
    
    return (
      <button
        key={type.key}
        onClick={() => setActiveTab(type.key)}
        className={`flex items-center space-x-2 py-3 sm:py-4 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
          isActive
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
        }`}
      >
        <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
        <span className="hidden sm:inline">{type.label}</span>
        <span className="sm:hidden">{type.shortLabel}</span>
        <span className="bg-gray-100 text-gray-600 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs">
          {countWithPayments}
        </span>
      </button>
    );
  })}
</nav>
        </div>
      </div>

      {/* Main Content - Fixed canvas with scrolling */}
      <div className="flex-1 overflow-auto">
        <div className="p-4">
          <FloorPlanCanvas 
            spacesWithPayments={spacesWithPayments}
            onSpaceClick={handleSpaceClick}
            canvasWidth={CANVAS_WIDTH}
            canvasHeight={CANVAS_HEIGHT}
            spaceSize={SPACE_SIZE}
            bulkMode={bulkMode}
            selectedSpaces={selectedSpaces}
            onSpaceSelect={handleSpaceSelect}
          />
        </div>
      </div>

      {/* Payment Modal */}
      {selectedSpacePayment && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          payment={selectedSpacePayment.todayPayments[0]}
          spaces={spaces}
          tenants={tenants}
          settings={settings}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedSpacePayment(null);
          }}
          onSubmit={handlePaymentCollected}
        />
      )}

      <BulkPaymentModal
  isOpen={isBulkPaymentModalOpen}
  onClose={() => {
    setIsBulkPaymentModalOpen(false);
  }}
  onSubmit={handleBulkPaymentSubmit}
  payments={getPaymentsForSelectedSpaces()}
  spaces={spaces}
  tenants={tenants}
  settings={settings}
  startAtStep={4} // ADD THIS TO JUMP TO STEP 4
/>
    </div>
  );
};

// Floor Plan Canvas Component with Fixed Size
const FloorPlanCanvas: React.FC<FloorPlanCanvasProps> = ({ 
  spacesWithPayments, 
  onSpaceClick, 
  canvasWidth, 
  canvasHeight, 
  spaceSize,
  bulkMode,
  selectedSpaces,
  onSpaceSelect
}) => {
  const gridSize = spaceSize;

  return (
    <div
      className="relative border-2 border-dashed border-gray-300 bg-white rounded-lg"
      style={{ 
        width: `${canvasWidth}px`, 
        height: `${canvasHeight}px`,
        minWidth: `${canvasWidth}px`, // Prevent shrinking
        minHeight: `${canvasHeight}px` // Prevent shrinking
      }}
    >
      {/* Grid Background */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 opacity-20 sm:opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(to right, #6b7280 1px, transparent 1px),
              linear-gradient(to bottom, #6b7280 1px, transparent 1px)
            `,
            backgroundSize: `${gridSize * 5}px ${gridSize * 5}px`
          }}
        />
        
        <div 
          className="absolute inset-0 opacity-10 sm:opacity-15"
          style={{
            backgroundImage: `
              linear-gradient(to right, #9ca3af 1px, transparent 1px),
              linear-gradient(to bottom, #9ca3af 1px, transparent 1px)
            `,
            backgroundSize: `${gridSize}px ${gridSize}px`
          }}
        />
      </div>
      
      {/* Empty State */}
      {spacesWithPayments.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <Package className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2" />
            <p className="text-sm sm:text-lg font-medium">No Spaces</p>
            <p className="text-xs sm:text-sm">No positioned spaces found</p>
          </div>
        </div>
      )}

      {/* Positioned Spaces - Using original positions, no scaling */}
      {spacesWithPayments.map((spacePayment) => (
        <div
          key={spacePayment.space.id}
          style={{
            position: 'absolute',
            left: spacePayment.space.position!.x, // Use original position
            top: spacePayment.space.position!.y   // Use original position
          }}
        >
          <PaymentSpaceItem 
            spacePayment={spacePayment}
            onClick={onSpaceClick}
            spaceSize={spaceSize}
            bulkMode={bulkMode}
            isSelected={selectedSpaces.has(spacePayment.space.id)}
            onSelect={onSpaceSelect}
          />
        </div>
      ))}
    </div>
  );
};

// Payment Space Item Component (unchanged)
const PaymentSpaceItem: React.FC<PaymentSpaceItemProps> = ({ 
  spacePayment,
  onClick,
  spaceSize,
  bulkMode,
  isSelected,
  onSelect
}) => {
  const { space, todayPayments, totalAmount, hasOverdue, isCollected } = spacePayment;

  const getStatusColor = (): string => {
    if (isCollected) return 'bg-green-500';
    if (hasOverdue) return 'bg-red-500';
    if (todayPayments.length > 0) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  const getStatusIcon = () => {
    if (isCollected) return <CheckCircle className="w-2 h-2 sm:w-3 sm:h-3 text-green-600" />;
    if (hasOverdue) return <AlertTriangle className="w-2 h-2 sm:w-3 sm:h-3 text-red-600" />;
    if (todayPayments.length > 0) return <Clock className="w-2 h-2 sm:w-3 sm:h-3 text-yellow-600" />;
    return null;
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick(spacePayment);
  };

  const statusColor = getStatusColor();
  const textSize = spaceSize < 50 ? 'text-[7px]' : spaceSize < 60 ? 'text-[8px]' : 'text-[9px]';
  const indicatorSize = spaceSize < 50 ? 'w-2 h-2' : 'w-3 h-3';

  return (
    <div 
      className={`
        space-item rounded-md sm:rounded-lg shadow-md border-2 border-white relative
        transition-all duration-200 hover:shadow-lg select-none cursor-pointer
        hover:scale-105 hover:ring-2 hover:ring-blue-300
        ${statusColor}
        ${isSelected ? 'ring-4 ring-blue-500' : ''}
        ${todayPayments.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      style={{
        width: `${spaceSize}px`,
        height: `${spaceSize}px`
      }}
      onClick={handleClick}
    >
      {/* Space Information */}
      <div className="absolute inset-1 sm:inset-2 flex flex-col justify-between pointer-events-none text-white font-medium overflow-hidden">
        {/* Top Row - Tenant or Amount */}
        <div className="flex justify-between items-start">
          <span className={`truncate ${textSize} leading-tight`}>
            {todayPayments.length > 0 ? `₭${totalAmount.toLocaleString()}` : space.currentTenantName || "ບໍ່ມີ"}
          </span>
        </div>
        
        {/* Bottom Row */}
        <div className="flex justify-between items-end">

          <span className={`${textSize} leading-tight`}>{space.spaceCode}</span>
        </div>
      </div>
      
      {/* Status Indicator */}
      <div className={`absolute -top-0.5 -left-0.5 ${indicatorSize} rounded-full bg-white shadow-sm flex items-center justify-center pointer-events-none`}>
        {getStatusIcon()}
      </div>

      {/* Bulk Mode Checkbox */}
      {bulkMode && todayPayments.length > 0 && (
        <div className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-sm">
          {isSelected ? (
            <CheckSquare className="w-3 h-3 text-blue-600" />
          ) : (
            <Square className="w-3 h-3 text-gray-400" />
          )}
        </div>
      )}

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
        {space.spaceCode} - {todayPayments.length} payments
        <br />
        {todayPayments.length > 0 && `₭${totalAmount.toLocaleString()} - Click to collect`}
      </div>
    </div>
  );
};

export default FloorPlanPaymentDashboard;