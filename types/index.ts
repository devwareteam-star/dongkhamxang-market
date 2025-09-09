// =============================================================================
// NEW FIRESTORE SCHEMA TYPES
// =============================================================================

export interface Space {
  id: string;
  spaceId: string;
  spaceCode: string; // T001, S001, A001, etc.
  spaceType: 'ໂຕະ' | 'ຫ້ອງເຊົ່າ' | 'ປ້າຍ' | 'ບູດ'; // Table | Room | Signage | Booth
  zone: "G" |'A' | 'B' | 'C' | 'D' | undefined;
  status: 'ວ່າງ' | 'ເຊົ່າແລ້ວ' | 'ຊ່ອມແຊມ'; // Vacant | Rented | Maintenance
  currentTenantId?: string;
  currentContractId?: string;
  baseRentMonthly: number; // Amount in KIP
  productCategory?: string;
  position?: {
    x: number;
    y: number;
    floor: number;
  };
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  paymentFrequency?: 'daily' | 'monthly' | 'yearly';
  originalRentAmount?: number;
  

}

export interface Tenant {
   tenantId: string;
  tenantName: string;
  id?: string; // Add this - the Firebase document ID
  allSpace: string[]; // Remove the ? to make it required
  contact: string;
  createdBy: number;
  createdAt: Date;
}

export type TenantFormData = Omit<Tenant, 'createdAt' | 'createdBy'>;

export interface Contract {
  contractId: string;
  tenantId: string;
  contractStartDate: Date;
  contractEndDate: Date;
  paymentMethod: 'ເດືອນ' | 'ປີ'; // Monthly | Yearly
  paymentDueDay: number; // 1-31
  gracePeriodDays: number;
  lateFeeRate: number; // 0.00-1.00
  contractStatus: 'ມີຜົນ' | 'ໝົດອາຍຸ' | 'ຍົກເລີກ'; // Active | Expired | Cancelled
  spaces: ContractSpace[];
  totalSpaces: number;
  totalMonthlyRent: number;
  totalDepositAmount: number;
  paymentHistory?: string[]; // Array of payment IDs
  lastPaymentDate?: Date;
  nextPaymentDue?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastModifiedBy?: string;
  // Legacy compatibility fields
  id: string; // Alias for contractId
}

export interface ContractSpace {
  spaceId: string;
  spaceCode: string;
  monthlyRent: number;
  addedDate: Date;
}

export interface Payment {
paymentId: string;
  tenantId: string; // Business ID like "bay001" 
  spaceIds: string[]; // Firebase document IDs
  paymentPeriod: string; // YYYY-MM format
  paymentFrequency: 'daily' | 'monthly' | 'yearly';
  dueDate: Date;
  amountDue: number;
  
  // Payment details
  amountPaid?: number;
  paymentDate?: Date;
  paymentMethod?: 'ເງິນສົດ' | 'ໂອນເງິນ' | 'BCEL' | 'JDB';
  paymentStatus: 'ລໍຖ້າ' | 'ຈ່າຍແລ້ວ' | 'ເກີນກຳນົດ' | 'ຈ່າຍບາງສ່ວນ' | undefined;
  
  // Optional fields
  lateFee?: number;
  daysOverdue?: number;
  receiptNumber?: string;
  processedBy?: string;
  notes?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Legacy compatibility fields (computed)
  id: string; // Alias for paymentId
  roomId: string; // First spaceId for compatibility
  amount: number; // Alias for amountDue
  status: 'pending' | 'paid' | 'overdue' | 'partial';
  paidDate?: Date; // Alias for paymentDate
  paymentType: 'daily' | 'monthly' | 'yearly'; // Alias for paymentFrequency
}

export interface Bill {
  billId: string;
  paymentId: string;
  contractId: string;
  tenantId: string;
  billNumber: string;
  billDate: Date;
  dueDate: Date;
  subtotal: number;
  lateFee?: number;
  totalAmount: number;
  billStatus: 'ລໍຖ້າ' | 'ສົ່ງແລ້ວ' | 'ຈ່າຍແລ້ວ' | 'ເກີນກຳນົດ'; // Pending | Sent | Paid | Overdue
  paymentMethodPreferred: 'ເງິນສົດ' | 'ໂອນເງິນ'; // Cash | Transfer
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  // Legacy compatibility fields
  id: string; // Alias for billId
}

export interface User {
  userId: string;
  displayName: string;
  email: string;
  phoneNumber?: string;
  role: 'manager' | 'employee'; // Super Admin | General Manager | Market Manager
  permissions: UserPermissions;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Legacy compatibility fields
  id: string; // Alias for userId
  uid?: string; // Firebase UID
  username: string; // Alias for displayName
  name: string; // Alias for displayName
  phone?: string; // Alias for phoneNumber
  isActive: boolean; // Computed field
}

export interface UserPermissions {
  spaces: CRUDPermissions;
  tenants: CRUDPermissions;
  payments: CRUDPermissions;
  reports: CRUDPermissions;
  users: CRUDPermissions;
}

export interface CRUDPermissions {
  read: boolean;
  write: boolean;
  delete: boolean;
}

export interface Notification {
  notificationId: string;
  recipientType: 'tenant' | 'admin' | 'system';
  recipientId: string;
  type: 'payment_reminder' | 'contract_expiry' | 'maintenance_notice' | 'maintenance_required';
  title: string;
  message: string;
  relatedSpaceId?: string;
  relatedContractId?: string;
  relatedPaymentId?: string;
  channels: ('whatsapp' | 'email')[];
  deliveryStatus?: {
    whatsapp?: {
      sent: boolean;
      delivered: boolean;
      timestamp?: Date;
    };
    email?: {
      sent: boolean;
      delivered: boolean;
      timestamp?: Date;
    };
  };
  createdAt: Date;
  scheduledAt?: Date;
  sentAt?: Date;
  // Legacy compatibility fields
  id: string; // Alias for notificationId
  roomId?: string; // Alias for relatedSpaceId
  tenantId?: string; // Alias for recipientId (when recipientType is tenant)
  isRead: boolean; // Computed from deliveryStatus
  priority: 'low' | 'medium' | 'high'; // Computed from type
}

// =============================================================================
// LEGACY TYPES (for backward compatibility)
// =============================================================================

export interface Room {
  id: string;
  roomNumber: string;
  size: string;
  monthlyRate: number;
  yearlyRate: number;
  dailyRate: number;
  status: 'occupied' | 'vacant' | 'maintenance';
  location: string;
  zone?: string; // Make this optional
  tenantId?: string;
  contractStartDate?: Date;
  contractEndDate?: Date;
  deposit?: number;
  description?: string;
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  paymentId: string;
  roomNumber: string;
  tenantName: string;
  amount: number;
  paymentMethod: string;
  paymentType: string;
  issuedDate: Date;
  employeeName: string;
  marketInfo: {
    name: string;
    address: string;
    phone: string;
    taxId?: string;
  };
}

// =============================================================================
// FORM DATA TYPES
// =============================================================================



export type ContractFormData = Omit<Contract, 'contractId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'paymentHistory' | 'lastPaymentDate' | 'nextPaymentDue' | 'lastModifiedBy' | 'id'>;

export type SpaceFormData = Omit<Space, 'id' | 'spaceId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'currentTenantId' | 'currentContractId'>;

// =============================================================================
// UTILITY INTERFACES
// =============================================================================

export interface DashboardStats {
  totalRooms: number; // Legacy - maps to totalSpaces
  totalSpaces: number;
  occupiedRooms: number; // Legacy - maps to occupiedSpaces
  occupiedSpaces: number;
  vacantRooms: number; // Legacy - maps to vacantSpaces
  vacantSpaces: number;
  maintenanceRooms: number; // Legacy - maps to maintenanceSpaces
  maintenanceSpaces: number;
  todayRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  pendingPayments: number;
  overduePayments: number;
  todayCollections: number;
  occupancyRate: number;
  collectionRate: number;
  activeContracts: number;
  activeTenants: number;
  tableSpaces: number;
  roomSpaces: number;
  signageSpaces: number; 
  boothSpaces: number;
  expiringContracts: number;
}

export interface SystemSettings {
  marketInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
    taxId?: string;
    logo?: string;
  };
  defaultRates: {
    monthlyRate: number;
    yearlyRate: number;
    dailyRate: number;
  };
  notifications: {
    enableEmail: boolean;
    enableSMS: boolean;
    reminderDays: number;
    overdueReminderDays: number;
  };
  receipt: {
    prefix: string;
    includeQR: boolean;
    footer: string;
    template: string;
  };
  system: {
    autoBackup: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
    sessionTimeout: number;
    maxLoginAttempts: number;
  };
  security: {
    requirePasswordChange: boolean;
    passwordMinLength: number;
    enableTwoFactor: boolean;
    ipRestriction: boolean;
    allowedIPs: string[];
  };
}

// =============================================================================
// TRANSLATION MAPPINGS
// =============================================================================

export const SpaceTypeLabels: Record<string, string> = {
  'ໂຕະ': 'Table',
  'ຫ້ອງເຊົ່າ': 'Room', 
  'ປ້າຍ': 'Signage',
  'ບູດ': 'Booth'
};

export const SpaceStatusLabels: Record<string, string> = {
  'ວ່າງ': 'Vacant',
  'ເຊົ່າແລ້ວ': 'Rented',
  'ຊ່ອມແຊມ': 'Maintenance'
};

export const PaymentFrequencyStatusLabels: Record<string, string> = {
  'daily': 'ລາຍວັນ',
  'monthly': 'ລາຍເດືອນ',
  'yearly': 'ລາຍປີ'
};

export const TenantStatusLabels: Record<string, string> = {
  'ເຮັດວຽກ': 'Working',
  'ບໍ່ເຮັດວຽກ': 'Not Working', 
  'ດຳລາຍການ': 'Blacklisted'
};

export const ContractStatusLabels: Record<string, string> = {
  'ມີຜົນ': 'Active',
  'ໝົດອາຍຸ': 'Expired',
  'ຍົກເລີກ': 'Cancelled'
};

export const PaymentStatusLabels: Record<string, string> = {
  'ລໍຖ້າ': 'Pending',
  'ຈ່າຍແລ້ວ': 'Paid',
  'ເກີນກຳນົດ': 'Overdue',
  'ຈ່າຍບາງສ່ວນ': 'Partial Payment'
};

export const PaymentMethodLabels: Record<string, string> = {
  'ເດືອນ': 'Monthly',
  'ປີ': 'Yearly',
  'ເງິນສົດ': 'Cash',
  'ໂອນເງິນ': 'Transfer',
  'BCEL': 'BCEL Bank',
  'JDB': 'JDB Bank'
};

export const BillStatusLabels: Record<string, string> = {
  'ລໍຖ້າ': 'Pending',
  'ສົ່ງແລ້ວ': 'Sent', 
  'ຈ່າຍແລ້ວ': 'Paid',
  'ເກີນກຳນົດ': 'Overdue'
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

// Convert Space to Room for backward compatibility
export const spaceToRoom = (space: Space): Room => ({
  id: space.spaceId,
  roomNumber: space.spaceCode,
  size: space.spaceType === 'ໂຕະ' ? '2x2m' : '3x3m', // Default sizes
  monthlyRate: space.baseRentMonthly,
  yearlyRate: space.baseRentMonthly * 12,
  dailyRate: Math.round(space.baseRentMonthly / 30),
  status: space.status === 'ວ່າງ' ? 'vacant' : space.status === 'ເຊົ່າແລ້ວ' ? 'occupied' : 'maintenance',
  location: `Zone ${space.zone}`,
  zone: space.zone,
  tenantId: space.currentTenantId,
  description: `${SpaceTypeLabels[space.spaceType]} in ${space.zone}`
});

// Convert Room to Space for new schema
export const roomToSpace = (room: Room): Space => ({
  id: room.id,           // Add this line - use room.id as the Firebase document ID
  spaceId: room.id,      // Keep this for backward compatibility
  spaceCode: room.roomNumber,
  spaceType: 'ຫ້ອງເຊົ່າ', // Default to Room
  zone: room.zone as any || 'A',  // Changed 'SHOP_MAIN' to 'A' to match your zone type
  status: room.status === 'vacant' ? 'ວ່າງ' : room.status === 'occupied' ? 'ເຊົ່າແລ້ວ' : 'ຊ່ອມແຊມ',
  currentTenantId: room.tenantId,
  baseRentMonthly: room.monthlyRate,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'migration'
});