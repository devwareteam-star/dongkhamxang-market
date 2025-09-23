"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '@/lib/contexts/DataContext';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';
import { Space } from '@/types';
import { CSS } from '@dnd-kit/utilities';
import { Building2, Home, Clipboard, Package, Edit3, Menu, X, Grid3X3, Eye } from 'lucide-react';
import SpaceDragDropModal from './SpaceDragDropModal';

// Fixed canvas size - no responsive scaling
const useFixedCanvas = () => {
  return {
    width: 1200,  // Fixed width
    height: 800,  // Fixed height
    isMobile: typeof window !== 'undefined' ? window.innerWidth < 768 : false // Still detect mobile for other UI adjustments
  };
};

// Fixed space size
const FIXED_SPACE_SIZE = 60;
const SPACE_MARGIN = 4;

// Interface definitions
interface SpaceTypeConfig {
  key: Space['spaceType'];
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SpaceItemProps {
  space: Space;
  isDragging?: boolean;
  style?: React.CSSProperties;
  onClick?: (space: Space) => void;
  isEditMode?: boolean;
  spaceSize: number;
}

interface DraggableSpaceProps {
  space: Space;
  style?: React.CSSProperties;
  onClick?: (space: Space) => void;
  isEditMode?: boolean;
  spaceSize: number;
}

interface CanvasDropZoneProps {
  positionedSpaces: Space[];
  onSpaceClick?: (space: Space) => void;
  isEditMode?: boolean;
  canvasWidth: number;
  canvasHeight: number;
  spaceSize: number;
}

interface SidebarDropZoneProps {
  unpositionedSpaces: Space[];
  onSpaceClick?: (space: Space) => void;
  isEditMode?: boolean;
  spaceSize: number;
}

const spaceTypes: SpaceTypeConfig[] = [
  { key: 'table', label: 'ໂຕະ (Tables)', shortLabel: 'ໂຕະ', icon: Package },
  { key: 'room', label: 'ຫ້ອງເຊົ່າ (Rooms)', shortLabel: 'ຫ້ອງ', icon: Home },
  { key: 'signage', label: 'ປ້າຍ (Signage)', shortLabel: 'ປ້າຍ', icon: Clipboard },
  { key: 'booth', label: 'ບູດ (Booths)', shortLabel: 'ບູດ', icon: Building2 }
];

// Helper functions
const snapToGrid = (value: number, gridSize: number): number => {
  return Math.round(value / gridSize) * gridSize;
};

const getInitialPosition = (spaceSize: number): { x: number; y: number; floor: number } => {
  return {
    x: spaceSize * 2,
    y: spaceSize * 2,
    floor: 1
  };
};

const SpaceLayoutDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Space['spaceType']>('table');
  const [draggedSpace, setDraggedSpace] = useState<Space | null>(null);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { spaces, updateSpace, loading } = useData();
  
  // Use fixed canvas instead of responsive
  const { width: CANVAS_WIDTH, height: CANVAS_HEIGHT, isMobile } = useFixedCanvas();
  const SPACE_SIZE = FIXED_SPACE_SIZE; // Fixed size instead of responsive
  const GRID_SIZE = SPACE_SIZE;

  // Modal handlers
  const handleSpaceClick = (space: Space) => {
    if (!isEditMode) {
      setSelectedSpace(space);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSpace(null);
  };

  const handleEditSpace = async (space: Space) => {
    try {
      console.log('Edit space:', space);
    } catch (error) {
      console.error('Failed to edit space:', error);
    }
  };

  const handleStatusChange = async (spaceId: string, status: Space['status']) => {
    try {
      await updateSpace(spaceId, { status });
      console.log(`Updated space ${spaceId} status to ${status}`);
    } catch (error) {
      console.error('Failed to update space status:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium text-sm sm:text-base">ກຳລັງໂຫຼດຂໍ້ມູນພື້ນທີ່...</p>
        </div>
      </div>
    );
  }

  // Filter spaces by current tab
  const { positionedSpaces, unpositionedSpaces } = useMemo(() => {
    const filtered = spaces.filter(space => space.spaceType === activeTab);
    return {
      positionedSpaces: filtered.filter(space => space.position?.x !== undefined),
      unpositionedSpaces: filtered.filter(space => !space.position?.x)
    };
  }, [spaces, activeTab]);

  // Drag handlers
  const handleDragStart = (event: DragStartEvent): void => {
    const { active } = event;
    const space = spaces.find(s => s.id === active.id);
    setDraggedSpace(space || null);
  };

  const handleDragEnd = async (event: DragEndEvent): Promise<void> => {
    const { active, over, delta } = event;
    setDraggedSpace(null);

    if (!over) return;

    const spaceId = active.id as string;
    const space = spaces.find(s => s.id === spaceId);
    
    if (!space) return;

    let newPosition: Space['position'];
    
    if (over.id === 'canvas') {
      if (space.position?.x !== undefined) {
        const rawX = space.position.x + delta.x;
        const rawY = space.position.y + delta.y;
        
        newPosition = {
          x: Math.max(SPACE_MARGIN, Math.min(
            CANVAS_WIDTH - SPACE_SIZE - SPACE_MARGIN, 
            snapToGrid(rawX, GRID_SIZE)
          )),
          y: Math.max(SPACE_MARGIN, Math.min(
            CANVAS_HEIGHT - SPACE_SIZE - SPACE_MARGIN, 
            snapToGrid(rawY, GRID_SIZE)
          )),
          floor: 1
        };
      } else {
        newPosition = getInitialPosition(SPACE_SIZE);
      }
    } else if (over.id === 'sidebar') {
      newPosition = undefined;
    } else {
      return;
    }

    try {
      await updateSpace(spaceId, { position: newPosition });
      console.log(`Updated space ${space.spaceCode} position:`, newPosition);
    } catch (error) {
      console.error('Failed to update space position:', error);
    }
  };

  // Main content without DndContext
  const mainContent = (
    <div className={`flex-1 flex ${isMobile ? 'flex-col' : ''} overflow-hidden`}>
      {/* Canvas Area - Make it scrollable with fixed canvas inside */}
      <div className="flex-1 overflow-auto">
        <div className="p-4">
          <CanvasDropZone 
            positionedSpaces={positionedSpaces} 
            onSpaceClick={handleSpaceClick}
            isEditMode={isEditMode}
            canvasWidth={CANVAS_WIDTH}
            canvasHeight={CANVAS_HEIGHT}
            spaceSize={SPACE_SIZE}
          />
        </div>
      </div>

      {/* Mobile Sidebar Toggle */}
      {isMobile && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg z-40"
        >
          <Grid3X3 className="w-6 h-6" />
        </button>
      )}

      {/* Sidebar - Keep existing responsive behavior */}
      <div className={`
        ${isMobile ? 'fixed inset-y-0 right-0 z-50 transform transition-transform duration-300 ease-in-out' : 'relative'}
        ${isMobile && !sidebarOpen ? 'translate-x-full' : 'translate-x-0'}
        ${isMobile ? 'w-35 max-w-[35vw]' : 'w-20 lg:w-60 max-w-sm'}
        bg-white border-l border-gray-200 flex flex-col overflow-hidden
      `}>
        {/* Mobile Sidebar Header */}
        {isMobile && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-900">Unpositioned Spaces</h3>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        
        {/* Desktop Sidebar Header */}
        {!isMobile && (
          <div className="p-3 lg:p-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-900 text-sm lg:text-base">Unpositioned Spaces</h3>
            <p className="text-xs lg:text-sm text-gray-500 mt-1">
              {unpositionedSpaces.length} spaces need positioning
            </p>
          </div>
        )}
        
        <SidebarDropZone 
          unpositionedSpaces={unpositionedSpaces} 
          onSpaceClick={handleSpaceClick}
          isEditMode={isEditMode}
          spaceSize={SPACE_SIZE}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header - Responsive */}
      <div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
              ຜັງຕະຫຼາດ (Market Layout)
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              {isEditMode ? 'Drag spaces to arrange layout' : 'Click spaces to view details'}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Mobile Menu Toggle */}
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm"
              >
                <Menu className="w-4 h-4" />
                <span>Spaces</span>
              </button>
            )}
            
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg transition-colors font-medium text-sm ${
                isEditMode 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              <span className="hidden sm:inline">{isEditMode ? 'ປິດການແກ້ໄຂ' : 'ເປີດການແກ້ໄຂ'}</span>
              <span className="sm:hidden">{isEditMode ? 'ປິດ' : 'ແກ້'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Space Status Legend - Responsive */}
      <div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-2 sm:py-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-6 text-xs sm:text-sm">
          <span className="text-gray-600 font-medium">Status:</span>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-700">ເຊົ່າແລ້ວ</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-400 rounded-full"></div>
            <span className="text-gray-700">ວ່າງ</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-orange-500 rounded-full"></div>
            <span className="text-gray-700">ຊ່ອມແຊມ</span>
          </div>
        </div>
      </div>

      {/* Edit Mode Indicator */}
      {isEditMode && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-3 sm:px-6 py-2">
          <div className="flex items-center space-x-2 text-yellow-800">
            <Edit3 className="w-4 h-4" />
            <span className="text-xs sm:text-sm font-medium">
              Edit Mode - {isMobile ? 'Tap & drag spaces' : 'Drag spaces to reposition'}
            </span>
          </div>
        </div>
      )}

      {/* Tabs - Responsive */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-3 sm:px-6">
          <nav className="flex space-x-2 sm:space-x-8 overflow-x-auto">
            {spaceTypes.map(type => {
              const Icon = type.icon;
              const isActive = activeTab === type.key;
              const count = spaces.filter(s => s.spaceType === type.key).length;
              
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
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      {isEditMode ? (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          {mainContent}
          <DragOverlay>
            {draggedSpace && (
              <div style={{ transform: 'rotate(2deg)' }}>
                <SpaceItem 
                  space={draggedSpace} 
                  isDragging={true}
                  isEditMode={isEditMode}
                  spaceSize={SPACE_SIZE}
                />
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                  Snap to grid
                </div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      ) : (
        mainContent
      )}

      {/* Modal */}
      <SpaceDragDropModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        space={selectedSpace}
        onEdit={handleEditSpace}
      />
    </div>
  );
};

// Canvas Drop Zone Component - Updated with Fixed Size
const CanvasDropZone: React.FC<CanvasDropZoneProps> = ({ 
  positionedSpaces, 
  onSpaceClick, 
  isEditMode,
  canvasWidth,
  canvasHeight,
  spaceSize
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas'
  });

  const gridSize = spaceSize;

  return (
    <div
      ref={isEditMode ? setNodeRef : undefined}
      className={`relative border-2 border-dashed rounded-lg transition-colors ${
        isEditMode && isOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'
      } ${isEditMode ? 'cursor-copy' : 'cursor-default'}`}
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
      
      {/* Canvas Label */}
      {positionedSpaces.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <Package className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2" />
            <p className="text-sm sm:text-lg font-medium">Empty Canvas</p>
            <p className="text-xs sm:text-sm">
              {isEditMode ? 'Drag spaces here to position them' : 'No spaces positioned yet'}
            </p>
          </div>
        </div>
      )}

      {/* Positioned Spaces - Using original positions, no scaling */}
      {positionedSpaces.map((space: Space) => (
        isEditMode ? (
          <DraggableSpace 
            key={space.id} 
            space={space}
            onClick={onSpaceClick}
            isEditMode={isEditMode}
            spaceSize={spaceSize}
            style={{
              position: 'absolute',
              left: space.position!.x, // Use original position
              top: space.position!.y   // Use original position
            }}
          />
        ) : (
          <div
            key={space.id}
            style={{
              position: 'absolute',
              left: space.position!.x, // Use original position
              top: space.position!.y   // Use original position
            }}
          >
            <SpaceItem 
              space={space} 
              onClick={onSpaceClick}
              isEditMode={isEditMode}
              spaceSize={spaceSize}
            />
          </div>
        )
      ))}
    </div>
  );
};

// Sidebar Drop Zone Component - Updated with sorting
const SidebarDropZone: React.FC<SidebarDropZoneProps> = ({ 
  unpositionedSpaces, 
  onSpaceClick, 
  isEditMode,
  spaceSize
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'sidebar'
  });

  // Sort spaces in ascending order by spaceCode
  const sortedSpaces = [...unpositionedSpaces].sort((a, b) => {
    // Sort by spaceCode (ascending) - handles both string and number codes
    return a.spaceCode.localeCompare(b.spaceCode, undefined, { 
      numeric: true, 
      sensitivity: 'base' 
    });
  });

  return (
    <div
      ref={isEditMode ? setNodeRef : undefined}
      className={`flex-1 overflow-y-auto p-2 sm:p-4 transition-colors max-w-sm ${
        isEditMode && isOver ? 'bg-red-50' : ''
      }`}
    >
      {unpositionedSpaces.length === 0 ? (
        <div className="text-center text-gray-400 py-6 sm:py-8">
          <Package className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2" />
          <p className="font-medium text-sm">All Positioned</p>
          <p className="text-xs sm:text-sm">All spaces have been positioned</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3 max-h-[650px] overflow-y-auto">
          {sortedSpaces.map((space: Space) => (
            isEditMode ? (
              <DraggableSpace 
                key={space.id} 
                space={space} 
                onClick={onSpaceClick}
                isEditMode={isEditMode}
                spaceSize={spaceSize}
              />
            ) : (
              <SpaceItem 
                key={space.id}
                space={space} 
                onClick={onSpaceClick}
                isEditMode={isEditMode}
                spaceSize={spaceSize}
              />
            )
          ))}
        </div>
      )}
    </div>
  );
};

// Draggable Space Component - Updated with spaceSize prop
const DraggableSpace: React.FC<DraggableSpaceProps> = ({ space, style, onClick, isEditMode, spaceSize }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging
  } = useDraggable({
    id: space.id
  });

  const draggableStyle: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    ...style
  };

  return (
    <div
      ref={setNodeRef}
      style={draggableStyle}
      {...(isEditMode ? listeners : {})}
      {...(isEditMode ? attributes : {})}
      className={`${isEditMode ? 'cursor-move' : 'cursor-pointer'} ${isDragging ? 'opacity-50 z-50' : ''}`}
    >
      <SpaceItem 
        space={space} 
        isDragging={isDragging} 
        onClick={onClick}
        isEditMode={isEditMode}
        spaceSize={spaceSize}
      />
    </div>
  );
};

// Space Item Component - Fully responsive
const SpaceItem: React.FC<SpaceItemProps> = ({ 
  space, 
  isDragging = false, 
  style, 
  onClick, 
  isEditMode = false,
  spaceSize
}) => {
  const getStatusColor = (space: Space): string => {
    switch (space.status) {
      case 'vacant': return 'bg-gray-400';
      case 'rented': return 'bg-blue-500';
      case 'maintainance': return 'bg-orange-500';
      default: return 'bg-gray-400';
    }
  };

  const statusColor = getStatusColor(space);

  const getPaymentFrequencyDisplay = (): string => {
    switch (space.paymentFrequency) {
      case 'daily': return 'ມື້';
      case 'monthly': return 'ດ'; 
      case 'yearly': return 'ປີ';
      default: return 'ດ';
    }
  };

  const getDisplayCode = (): string => {
    const maxLength = spaceSize < 50 ? 3 : 4;
    if (space.spaceType === 'table' && space.spaceCode.length > maxLength) {
      return space.spaceCode.slice(-maxLength);
    }
    return space.spaceCode.length > maxLength ? space.spaceCode.slice(-maxLength) : space.spaceCode;
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!isEditMode && onClick) {
      e.preventDefault();
      e.stopPropagation();
      onClick(space);
    }
  };

  // Text sizes based on fixed space size
  const textSize = spaceSize < 50 ? 'text-[7px]' : spaceSize < 60 ? 'text-[8px]' : 'text-[9px]';
  const indicatorSize = spaceSize < 50 ? 'w-2 h-2' : 'w-3 h-3';

  return (
    <div 
      className={`
        space-item rounded-md sm:rounded-lg shadow-md border-2 border-white relative
        transition-all duration-200 hover:shadow-lg select-none
        ${statusColor}
        ${isDragging ? 'shadow-xl scale-110' : ''}
        ${!isEditMode ? 'cursor-pointer hover:scale-105 hover:ring-2 hover:ring-blue-300' : ''}
        ${isEditMode ? 'cursor-move' : ''}
      `}
      style={{
        width: `${spaceSize}px`,
        height: `${spaceSize}px`,
        ...style
      }}
      onClick={handleClick}
    >
      {/* Space Information */}
      <div className="absolute inset-1 sm:inset-2 flex flex-col justify-between pointer-events-none text-white font-medium overflow-hidden">
        {/* Top Row */}
        <div className="flex justify-between items-start">
          <span className={`truncate ${textSize} leading-tight`}>
            {space?.currentTenantName?.trim() || "ບໍ່ມີຜູ້ເຊົ່າ"}
          </span>
        </div>
        
        {/* Bottom Row */}
        <div className="flex justify-between items-end">
          <span className={`leading-tight ${textSize}`}>{getPaymentFrequencyDisplay()} | </span>
          <span className={`${textSize} leading-tight`}>{getDisplayCode()}</span>
        </div>
      </div>
      
      {/* Status Indicator */}
      <div className={`absolute -top-0.5 -left-0.5 ${indicatorSize} rounded-full bg-white shadow-sm flex items-center justify-center pointer-events-none`}>
        <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${statusColor}`}></div>
      </div>

      {/* Edit Mode Indicator */}
      {isEditMode && (
        <div className="absolute top-0 left-0 w-full h-full bg-yellow-200 bg-opacity-20 border-2 border-yellow-400 border-dashed rounded-md sm:rounded-lg pointer-events-none">
          <div className={`absolute top-0.5 left-0.5 bg-yellow-400 text-yellow-900 ${textSize} px-1 rounded`}>
            {spaceSize}x{spaceSize}
          </div>
        </div>
      )}

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
        {space.spaceCode} - {space.status} ({spaceSize}x{spaceSize})
        <br />
        {!isEditMode && <span className="text-blue-200">Click to view details</span>}
        {isEditMode && <span className="text-yellow-200">Drag to move</span>}
      </div>
    </div>
  );
};

export default SpaceLayoutDashboard;