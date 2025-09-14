"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '@/lib/contexts/DataContext';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';
import { Space } from '@/types';
import { CSS } from '@dnd-kit/utilities';
import { Building2, Home, Clipboard, Package, CheckCircle, Clock, AlertTriangle, AlertCircle, LucideIcon, Edit3 } from 'lucide-react';
import SpaceDragDropModal from './SpaceDragDropModal';

// Constants
const SPACE_SIZE = 48;
const SPACE_MARGIN = 4;

// Interface definitions
interface SpaceTypeConfig {
  key: Space['spaceType'];
  label: string;
  icon: LucideIcon;
}

interface SpaceItemProps {
  space: Space;
  isDragging?: boolean;
  style?: React.CSSProperties;
  onClick?: (space: Space) => void;
  isEditMode?: boolean;
}

interface DraggableSpaceProps {
  space: Space;
  style?: React.CSSProperties;
  onClick?: (space: Space) => void;
  isEditMode?: boolean;
}

interface CanvasDropZoneProps {
  positionedSpaces: Space[];
  onSpaceClick?: (space: Space) => void;
  isEditMode?: boolean;
  canvasWidth: number;
  canvasHeight: number;
}

interface SidebarDropZoneProps {
  unpositionedSpaces: Space[];
  onSpaceClick?: (space: Space) => void;
  isEditMode?: boolean;
}

const spaceTypes: SpaceTypeConfig[] = [
  { key: 'ໂຕະ', label: 'ໂຕະ (Tables)', icon: Package },
  { key: 'ຫ້ອງເຊົ່າ', label: 'ຫ້ອງເຊົ່າ (Rooms)', icon: Home },
  { key: 'ປ້າຍ', label: 'ປ້າຍ (Signage)', icon: Clipboard },
  { key: 'ບູດ', label: 'ບູດ (Booths)', icon: Building2 }
];

// Helper functions
const snapToGrid = (value: number, gridSize: number): number => {
  return Math.round(value / gridSize) * gridSize;
};

const getInitialPosition = (): { x: number; y: number; floor: number } => {
  return {
    x: SPACE_SIZE * 1,
    y: SPACE_SIZE * 1,
    floor: 1
  };
};

const useResponsiveCanvas = () => {
  const [canvasSize, setCanvasSize] = useState({ width: 1000, height: 600 });
  
  useEffect(() => {
    const updateCanvasSize = () => {
      const availableWidth = window.innerWidth - 320 - 48;
      const availableHeight = window.innerHeight - 200;
      
      const maxWidth = Math.min(availableWidth, 1200);
      const maxHeight = Math.min(availableHeight, 800);
      
      setCanvasSize({
        width: Math.max(600, maxWidth),
        height: Math.max(400, maxHeight)
      });
    };
    
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);
  
  return canvasSize;
};

const SpaceLayoutDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Space['spaceType']>('ໂຕະ');
  const [draggedSpace, setDraggedSpace] = useState<Space | null>(null);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const { spaces, updateSpace, loading } = useData();
  const { width: CANVAS_WIDTH, height: CANVAS_HEIGHT } = useResponsiveCanvas();

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
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">ກຳລັງໂຫຼດຂໍ້ມູນພື້ນທີ່...</p>
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
            snapToGrid(rawX, SPACE_SIZE)
          )),
          y: Math.max(SPACE_MARGIN, Math.min(
            CANVAS_HEIGHT - SPACE_SIZE - SPACE_MARGIN, 
            snapToGrid(rawY, SPACE_SIZE)
          )),
          floor: 1
        };
      } else {
        newPosition = getInitialPosition();
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
    <div className="flex-1 flex overflow-hidden">
      {/* Canvas Area */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="min-w-fit">
          <CanvasDropZone 
            positionedSpaces={positionedSpaces} 
            onSpaceClick={handleSpaceClick}
            isEditMode={isEditMode}
            canvasWidth={CANVAS_WIDTH}
            canvasHeight={CANVAS_HEIGHT}
          />
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-25 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-medium text-gray-900">Unpositioned Spaces</h3>
          <p className="text-sm text-gray-500 mt-1">
            {unpositionedSpaces.length} spaces need positioning
          </p>
        </div>
        <SidebarDropZone 
          unpositionedSpaces={unpositionedSpaces} 
          onSpaceClick={handleSpaceClick}
          isEditMode={isEditMode}
        />
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ຜັງຕະຫຼາດ (Market Layout)</h1>
            <p className="text-gray-600 mt-1">
              {isEditMode ? 'Drag spaces to arrange your market layout' : 'Click on spaces to view details'}
            </p>
          </div>
          
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors font-medium ${
              isEditMode 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>{isEditMode ? 'ປິດການແກ້ໄຂ' : 'ເປີດການແກ້ໄຂ'}</span>
          </button>
        </div>
      </div>

      {/* Edit Mode Indicator */}
      {isEditMode && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-2">
          <div className="flex items-center space-x-2 text-yellow-800">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">Edit Mode Active - Drag spaces to reposition them</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6">
          <nav className="flex space-x-8">
            {spaceTypes.map(type => {
              const Icon = type.icon;
              const isActive = activeTab === type.key;
              const count = spaces.filter(s => s.spaceType === type.key).length;
              
              return (
                <button
                  key={type.key}
                  onClick={() => setActiveTab(type.key)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{type.label}</span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content - Conditionally wrapped with DndContext */}
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
        onStatusChange={handleStatusChange}
      />
    </div>
  );
};

// Canvas Drop Zone Component
const CanvasDropZone: React.FC<CanvasDropZoneProps> = ({ 
  positionedSpaces, 
  onSpaceClick, 
  isEditMode,
  canvasWidth,
  canvasHeight 
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas'
  });

  return (
    <div
      ref={isEditMode ? setNodeRef : undefined}
      className={`relative border-2 border-dashed rounded-lg transition-colors ${
        isEditMode && isOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'
      } ${isEditMode ? 'cursor-copy' : 'cursor-default'}`}
      style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}
    >
      {/* Grid Background */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(to right, #6b7280 1px, transparent 1px),
              linear-gradient(to bottom, #6b7280 1px, transparent 1px)
            `,
            backgroundSize: `${SPACE_SIZE * 5}px ${SPACE_SIZE * 5}px`
          }}
        />
        
        <div 
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `
              linear-gradient(to right, #9ca3af 1px, transparent 1px),
              linear-gradient(to bottom, #9ca3af 1px, transparent 1px)
            `,
            backgroundSize: `${SPACE_SIZE}px ${SPACE_SIZE}px`
          }}
        />
        
        {Array.from({ length: Math.floor(canvasWidth / (SPACE_SIZE * 5)) + 1 }, (_, i) => (
          <div
            key={`v-${i}`}
            className="absolute top-2 text-xs text-gray-400 font-mono pointer-events-none"
            style={{ left: i * SPACE_SIZE * 5 + 4 }}
          >
            {i * 5}
          </div>
        ))}
        
        {Array.from({ length: Math.floor(canvasHeight / (SPACE_SIZE * 5)) + 1 }, (_, i) => (
          <div
            key={`h-${i}`}
            className="absolute left-2 text-xs text-gray-400 font-mono pointer-events-none"
            style={{ top: i * SPACE_SIZE * 5 + 4 }}
          >
            {i * 5}
          </div>
        ))}
      </div>
      
      {/* Canvas Label */}
      {positionedSpaces.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-2" />
            <p className="text-lg font-medium">Empty Canvas</p>
            <p className="text-sm">
              {isEditMode ? 'Drag spaces from the sidebar to position them' : 'No spaces positioned yet'}
            </p>
          </div>
        </div>
      )}

      {/* Positioned Spaces */}
      {positionedSpaces.map((space: Space) => (
        isEditMode ? (
          <DraggableSpace 
            key={space.id} 
            space={space}
            onClick={onSpaceClick}
            isEditMode={isEditMode}
            style={{
              position: 'absolute',
              left: space.position!.x,
              top: space.position!.y
            }}
          />
        ) : (
          <div
            key={space.id}
            style={{
              position: 'absolute',
              left: space.position!.x,
              top: space.position!.y
            }}
          >
            <SpaceItem 
              space={space} 
              onClick={onSpaceClick}
              isEditMode={isEditMode}
            />
          </div>
        )
      ))}
    </div>
  );
};

// Sidebar Drop Zone Component  
const SidebarDropZone: React.FC<SidebarDropZoneProps> = ({ unpositionedSpaces, onSpaceClick, isEditMode }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'sidebar'
  });

  return (
    <div
      ref={isEditMode ? setNodeRef : undefined}
      className={`flex-1 overflow-y-auto p-4 transition-colors ${
        isEditMode && isOver ? 'bg-red-50' : ''
      }`}
    >
      {unpositionedSpaces.length === 0 ? (
        <div className="text-center text-gray-400 py-8">
          <CheckCircle className="w-8 h-8 mx-auto mb-2" />
          <p className="font-medium">All Positioned</p>
          <p className="text-sm">All spaces have been positioned</p>
        </div>
      ) : (
        <div className="space-y-3">
          {unpositionedSpaces.map((space: Space) => (
            isEditMode ? (
              <DraggableSpace 
                key={space.id} 
                space={space} 
                onClick={onSpaceClick}
                isEditMode={isEditMode}
              />
            ) : (
              <SpaceItem 
                key={space.id}
                space={space} 
                onClick={onSpaceClick}
                isEditMode={isEditMode}
              />
            )
          ))}
        </div>
      )}
    </div>
  );
};

// Draggable Space Component
const DraggableSpace: React.FC<DraggableSpaceProps> = ({ space, style, onClick, isEditMode }) => {
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
      />
    </div>
  );
};

// Space Item Component
const SpaceItem: React.FC<SpaceItemProps> = ({ space, isDragging = false, style, onClick, isEditMode = false }) => {
  const statusColor = space.status === 'ວ່າງ' ? 'bg-green-500' 
    : space.status === 'ເຊົ່າແລ້ວ' ? 'bg-blue-500'
    : space.status === 'ຊ່ອມແຊມ' ? 'bg-orange-500' : 'bg-gray-500';

  const getPaymentIcon = (): React.ReactNode => {
    const status = space.paymentStatus?.currentStatus;
    switch (status) {
      case 'paid': return <CheckCircle className="w-3 h-3 text-green-600" />;
      case 'pending': return <AlertTriangle className="w-3 h-3 text-yellow-600" />;
      case 'overdue': return <AlertCircle className="w-3 h-3 text-red-600" />;
      default: return <Clock className="w-3 h-3 text-gray-500" />;
    }
  };

  const getDisplayCode = (): string => {
    if (space.spaceType === 'ໂຕະ' && space.spaceCode.length > 3) {
      return space.spaceCode.slice(-3);
    }
    return space.spaceCode.length > 4 ? space.spaceCode.slice(-4) : space.spaceCode;
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!isEditMode && onClick) {
      e.preventDefault();
      e.stopPropagation();
      onClick(space);
    }
  };

  return (
    <div 
      className={`
        rounded-lg shadow-md border-2 border-white relative
        transition-all duration-200 hover:shadow-lg select-none
        ${statusColor}
        ${isDragging ? 'shadow-xl scale-110' : ''}
        ${!isEditMode ? 'cursor-pointer hover:scale-105 hover:ring-2 hover:ring-blue-300' : ''}
        ${isEditMode ? 'cursor-move' : ''}
      `}
      style={{
        width: `${SPACE_SIZE}px`,
        height: `${SPACE_SIZE}px`,
        ...style
      }}
      onClick={handleClick}
    >
      {/* Space Code */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-white text-xs font-bold leading-none text-center">
          {getDisplayCode()}
        </span>
      </div>
      
      {/* Payment Status Icon */}
      <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm pointer-events-none">
        {getPaymentIcon()}
      </div>

      {/* Status Indicator */}
      <div className="absolute -top-1 -left-1 w-3 h-3 rounded-full bg-white shadow-sm flex items-center justify-center pointer-events-none">
        <div className={`w-2 h-2 rounded-full ${statusColor}`}></div>
      </div>

      {/* Edit Mode Indicator */}
      {isEditMode && (
        <div className="absolute top-0 left-0 w-full h-full bg-yellow-200 bg-opacity-20 border-2 border-yellow-400 border-dashed rounded-lg pointer-events-none">
          <div className="absolute bottom-0 right-0 bg-yellow-400 text-yellow-900 text-xs px-1 rounded-tl">
            EDIT
          </div>
        </div>
      )}

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
        {space.spaceCode} - {space.status}
        <br />
        {!isEditMode && <span className="text-blue-200">Click to view details</span>}
        {isEditMode && <span className="text-yellow-200">Drag to reposition</span>}
      </div>
    </div>
  );
};

export default SpaceLayoutDashboard;