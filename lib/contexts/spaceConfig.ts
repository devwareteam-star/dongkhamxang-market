// lib/data/spaceConfig.ts

export interface SpaceConfig {
  code: string;
  type: 'table' | 'room' | 'booth' | 'signage';
  zone?: 'G' | 'A' | 'B' | 'C' | 'D';
  isAvailable: boolean;
}

// Generate space codes based on your data
const generateSpaceCodes = (): SpaceConfig[] => {
  const spaces: SpaceConfig[] = [];

  // Tables (130 total) - T001 to T130
  for (let i = 1; i <= 130; i++) {
    spaces.push({
      code: `T${i.toString().padStart(3, '0')}`,
      type: 'table',
      isAvailable: true
    });
  }

  // Rooms (250 total) distributed by zones with zone-specific codes
  const roomZones = {
    'G': 145,
    'A': 30,
    'B': 15,
    'C': 50,
    'D': 10
  };

  Object.entries(roomZones).forEach(([zone, count]) => {
    for (let i = 1; i <= count; i++) {
      spaces.push({
        code: `R${zone}${i.toString().padStart(3, '0')}`,
        type: 'room',
        zone: zone as 'G' | 'A' | 'B' | 'C' | 'D',
        isAvailable: true
      });
    }
  });

  // Booths (3 total) - B001 to B003
  for (let i = 1; i <= 3; i++) {
    spaces.push({
      code: `B${i.toString().padStart(3, '0')}`,
      type: 'booth',
      isAvailable: true
    });
  }

  // Signage (10 total) - S001 to S010
  for (let i = 1; i <= 10; i++) {
    spaces.push({
      code: `S${i.toString().padStart(3, '0')}`,
      type: 'signage',
      isAvailable: true
    });
  }

  return spaces;
};

// Export the generated space configurations
export const SPACE_CONFIGS = generateSpaceCodes();

// Helper functions
export const getAvailableSpaceCodes = (spaceType?: string, zone?: string): string[] => {
  return SPACE_CONFIGS
    .filter(space => {
      if (spaceType && space.type !== spaceType) return false;
      if (zone && space.zone !== zone) return false;
      return space.isAvailable;
    })
    .map(space => space.code)
    .sort();
};

export const getSpaceCodesByType = (spaceType: 'table' | 'room' | 'booth' | 'signage'): string[] => {
  return SPACE_CONFIGS
    .filter(space => space.type === spaceType)
    .map(space => space.code)
    .sort();
};

export const getSpaceCodesByZone = (zone: 'G' | 'A' | 'B' | 'C' | 'D'): string[] => {
  return SPACE_CONFIGS
    .filter(space => space.zone === zone)
    .map(space => space.code)
    .sort();
};

export const getRoomCodesByZone = (zone: 'G' | 'A' | 'B' | 'C' | 'D'): string[] => {
  return SPACE_CONFIGS
    .filter(space => space.type === 'room' && space.zone === zone)
    .map(space => space.code)
    .sort();
};

export const getNextAvailableSpaceCode = (spaceType: 'table' | 'room' | 'booth' | 'signage', zone?: 'G' | 'A' | 'B' | 'C' | 'D'): string | null => {
  const availableCodes = getAvailableSpaceCodes(spaceType, zone);
  return availableCodes.length > 0 ? availableCodes[0] : null;
};

export const validateSpaceCode = (code: string, spaceType: string, zone?: string): { isValid: boolean; message?: string } => {
  const space = SPACE_CONFIGS.find(s => s.code === code);
  
  if (!space) {
    return { isValid: false, message: 'ລະຫັດພື້ນທີ່ບໍ່ມີໃນລະບົບ' };
  }

  if (space.type !== spaceType) {
    return { isValid: false, message: `ລະຫັດນີ້ເປັນ${space.type} ບໍ່ແມ່ນ${spaceType}` };
  }

  if (zone && space.zone !== zone) {
    return { isValid: false, message: `ລະຫັດນີ້ເປັນໂຊນ ${space.zone} ບໍ່ແມ່ນ ${zone}` };
  }

  if (!space.isAvailable) {
    return { isValid: false, message: 'ລະຫັດພື້ນທີ່ນີ້ຖືກໃຊ້ແລ້ວ' };
  }

  return { isValid: true };
};

// Space statistics
export const getSpaceStatistics = () => {
  const stats = {
    total: SPACE_CONFIGS.length,
    byType: {} as Record<string, number>,
    byZone: {} as Record<string, number>,
    available: SPACE_CONFIGS.filter(s => s.isAvailable).length
  };

  SPACE_CONFIGS.forEach(space => {
    // Count by type
    stats.byType[space.type] = (stats.byType[space.type] || 0) + 1;
    
    // Count by zone (for rooms)
    if (space.zone) {
      stats.byZone[space.zone] = (stats.byZone[space.zone] || 0) + 1;
    }
  });

  return stats;
};

// Mark space as used/available
export const markSpaceAsUsed = (spaceCode: string): void => {
  const space = SPACE_CONFIGS.find(s => s.code === spaceCode);
  if (space) {
    space.isAvailable = false;
  }
};

export const markSpaceAsAvailable = (spaceCode: string): void => {
  const space = SPACE_CONFIGS.find(s => s.code === spaceCode);
  if (space) {
    space.isAvailable = true;
  }
};