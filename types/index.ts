export interface User {
  id: string;
  uid?: string; // Firebase UID
  username: string;
  name: string;
  role: 'admin' | 'employee';
  email: string | null;
  phone?: string;
  createdAt: Date;
  lastLogin?: Date;
  isActive: boolean;
}

export interface Room {
  id: string;
  roomNumber: string;
  size: string;
  monthlyRate: number;
  yearlyRate: number;
  dailyRate: number;
  status: 'occupied' | 'vacant' | 'maintenance';
  location: string;
  zone: string;
  tenantId?: string;
  contractStartDate?: Date;
  contractEndDate?: Date;
  deposit?: number;
  description?: string;
}

export interface Tenant {
  id: string;
  name: string;
  phone: string;
  email?: string;
  idCard: string;
  address: string;
  roomId: string;
  startDate: Date;
  endDate?: Date;
  contractType: 'daily' | 'monthly' | 'yearly';
  deposit: number;
  isActive: boolean;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
}

export interface Payment {
  id: string;
  roomId: string;
  tenantId: string;
  amount: number;
  paymentMethod: 'cash' | 'transfer' | 'qr_code';
  paymentType: 'daily' | 'monthly' | 'yearly';
  dueDate: Date;
  paidDate?: Date;
  status: 'pending' | 'paid' | 'overdue' | 'partial';
  receiptNumber?: string;
  employeeId?: string;
  notes?: string;
  referenceNumber?: string;
  lateFee?: number;
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

export interface DashboardStats {
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  maintenanceRooms: number;
  todayRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  pendingPayments: number;
  overduePayments: number;
  todayCollections: number;
  occupancyRate: number;
  collectionRate: number;
}

export interface Notification {
  id: string;
  type: 'payment_due' | 'payment_overdue' | 'contract_expiring' | 'maintenance_required';
  title: string;
  message: string;
  roomId?: string;
  tenantId?: string;
  isRead: boolean;
  createdAt: Date;
  priority: 'low' | 'medium' | 'high';
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