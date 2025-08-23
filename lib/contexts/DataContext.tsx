'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Room, Tenant, Payment, Receipt, DashboardStats, Notification, SystemSettings } from '@/types';
import { 
  roomsService, 
  tenantsService, 
  paymentsService, 
  receiptsService, 
  notificationsService 
} from '@/lib/firebase/firestore';

interface DataContextType {
  rooms: Room[];
  tenants: Tenant[];
  payments: Payment[];
  receipts: Receipt[];
  notifications: Notification[];
  settings: SystemSettings;
  addRoom: (room: Omit<Room, 'id'>) => Promise<void>;
  updateRoom: (id: string, room: Partial<Room>) => Promise<void>;
  deleteRoom: (id: string) => Promise<void>;
  addTenant: (tenant: Omit<Tenant, 'id'>) => Promise<void>;
  updateTenant: (id: string, tenant: Partial<Tenant>) => Promise<void>;
  deleteTenant: (id: string) => Promise<void>;
  addPayment: (payment: Omit<Payment, 'id'>) => Promise<void>;
  updatePayment: (id: string, payment: Partial<Payment>) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  addReceipt: (receipt: Omit<Receipt, 'id'>) => Promise<void>;
  updateReceipt: (id: string, receipt: Partial<Receipt>) => Promise<void>;
  deleteReceipt: (id: string) => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id'>) => Promise<void>;
  updateNotification: (id: string, notification: Partial<Notification>) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  getDashboardStats: () => DashboardStats;
  generateReceiptNumber: () => string;
  markNotificationAsRead: (id: string) => Promise<void>;
  updateSettings: (settings: Partial<SystemSettings>) => void;
  loading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const defaultSettings: SystemSettings = {
  marketInfo: {
    name: 'ตลาดสดเจริญกรุง',
    address: '123 ถนนเจริญกรุง แขวงบางรัก เขตบางรัก กรุงเทพฯ 10500',
    phone: '02-234-5678',
    email: 'info@charoengrung-market.com',
    taxId: '0123456789012'
  },
  defaultRates: {
    dailyRate: 100,
    monthlyRate: 3000,
    yearlyRate: 30000
  },
  notifications: {
    enableEmail: true,
    enableSMS: false,
    reminderDays: 3,
    overdueReminderDays: 7
  },
  receipt: {
    prefix: 'MKT',
    includeQR: true,
    footer: 'ขอบคุณที่ใช้บริการ - ตลาดสดเจริญกรุง',
    template: 'standard'
  },
  system: {
    autoBackup: true,
    backupFrequency: 'daily',
    sessionTimeout: 60,
    maxLoginAttempts: 5
  },
  security: {
    requirePasswordChange: false,
    passwordMinLength: 8,
    enableTwoFactor: false,
    ipRestriction: false,
    allowedIPs: []
  }
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  // Load data from Firebase
  useEffect(() => {
    loadData();
  }, []);

  // Generate payments for existing tenants who don't have payment records
  useEffect(() => {
    const generateMissingPayments = async () => {
      if (tenants.length > 0 && rooms.length > 0 && !loading) {
        console.log('Checking for missing payment records...');
        
        for (const tenant of tenants) {
          const existingPayments = payments.filter(p => p.tenantId === tenant.id);
          
          if (existingPayments.length === 0) {
            console.log('No payments found for tenant:', tenant.name, 'Creating payments...');
            const room = rooms.find(r => r.id === tenant.roomId);
            if (room) {
              await createInitialPayments(tenant, room);
            }
          }
        }
      }
    };

    generateMissingPayments();
  }, [tenants.length, rooms.length, loading]);
  const loadData = async () => {
    try {
      setLoading(true);
      
      try {
        // Load data from Firebase
        console.log('Loading data from Firebase...');
        const [roomsData, tenantsData, paymentsData, receiptsData, notificationsData] = await Promise.all([
          roomsService.getAll(),
          tenantsService.getAll(),
          paymentsService.getAll(),
          receiptsService.getAll(),
          notificationsService.getAll()
        ]);
        
        console.log('Loaded rooms from Firebase:', roomsData);
        console.log('Loaded tenants from Firebase:', tenantsData);
        
        // Convert Firebase Timestamps to JavaScript Dates
        const convertedRooms = roomsData.map(room => ({
          ...room,
          contractStartDate: room.contractStartDate?.toDate ? room.contractStartDate.toDate() : room.contractStartDate,
          contractEndDate: room.contractEndDate?.toDate ? room.contractEndDate.toDate() : room.contractEndDate
        })) as Room[];
        
        const convertedTenants = tenantsData.map(tenant => ({
          ...tenant,
          startDate: tenant.startDate?.toDate ? tenant.startDate.toDate() : tenant.startDate,
          endDate: tenant.endDate?.toDate ? tenant.endDate.toDate() : tenant.endDate,
          createdAt: tenant.createdAt?.toDate ? tenant.createdAt.toDate() : tenant.createdAt
        })) as Tenant[];
        
        const convertedPayments = paymentsData.map(payment => ({
          ...payment,
          dueDate: payment.dueDate?.toDate ? payment.dueDate.toDate() : payment.dueDate,
          paidDate: payment.paidDate?.toDate ? payment.paidDate.toDate() : payment.paidDate,
          createdAt: payment.createdAt?.toDate ? payment.createdAt.toDate() : payment.createdAt
        })) as Payment[];
        
        const convertedReceipts = receiptsData.map(receipt => ({
          ...receipt,
          issuedDate: receipt.issuedDate?.toDate ? receipt.issuedDate.toDate() : receipt.issuedDate,
          createdAt: receipt.createdAt?.toDate ? receipt.createdAt.toDate() : receipt.createdAt
        })) as Receipt[];
        
        const convertedNotifications = notificationsData.map(notification => ({
          ...notification,
          createdAt: notification.createdAt?.toDate ? notification.createdAt.toDate() : notification.createdAt
        })) as Notification[];
        
        setRooms(convertedRooms);
        setTenants(convertedTenants);
        setPayments(convertedPayments);
        setReceipts(convertedReceipts);
        setNotifications(convertedNotifications);
        
        console.log('Data loaded from Firebase successfully');
      } catch (firebaseError) {
        console.warn('Firebase data loading failed, using mock data:', firebaseError);
        
        // Fallback to mock data if Firebase fails
        const mockRooms = generateMockRooms();
        const mockTenants = generateMockTenants(mockRooms);
        const mockPayments = generateMockPayments(mockRooms, mockTenants);
        const mockNotifications = generateMockNotifications(mockPayments, mockRooms);
        
        console.log('Using mock rooms:', mockRooms);
        
        setRooms(mockRooms);
        setTenants(mockTenants);
        setPayments(mockPayments);
        setNotifications(mockNotifications);
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Firebase CRUD operations
  const addRoom = async (room: Omit<Room, 'id'>) => {
    try {
      const newRoom = await roomsService.create(room);
      setRooms(prev => [...prev, newRoom as Room]);
      console.log('Room added to Firebase:', newRoom);
    } catch (error) {
      console.error('Error adding room to Firebase:', error);
      // Fallback to local state
      const newRoom = { ...room, id: `room-${Date.now()}` };
      setRooms(prev => [...prev, newRoom]);
    }
  };

  const updateRoom = async (id: string, roomUpdate: Partial<Room>) => {
    try {
      console.log('Updating room in Firebase:', id, roomUpdate);
      await roomsService.update(id, roomUpdate);
      setRooms(prev => prev.map(room => 
        room.id === id ? { ...room, ...roomUpdate } : room
      ));
      console.log('Room updated in Firebase:', id);
    } catch (error) {
      console.error('Error updating room in Firebase:', error);
      // Fallback to local state
      setRooms(prev => prev.map(room => 
        room.id === id ? { ...room, ...roomUpdate } : room
      ));
    }
  };

  const deleteRoom = async (id: string) => {
    try {
      await roomsService.delete(id);
      setRooms(prev => prev.filter(room => room.id !== id));
      console.log('Room deleted from Firebase:', id);
    } catch (error) {
      console.error('Error deleting room from Firebase:', error);
      // Fallback to local state
      setRooms(prev => prev.filter(room => room.id !== id));
    }
  };

  const addTenant = async (tenant: Omit<Tenant, 'id'>) => {
    try {
      const newTenant = await tenantsService.create(tenant);
      setTenants(prev => [...prev, newTenant as Tenant]);
      
      // Update room status to occupied
      try {
        console.log('Updating room status for room:', tenant.roomId);
        await roomsService.update(tenant.roomId, { 
          status: 'occupied',
          tenantId: newTenant.id,
          contractStartDate: tenant.startDate,
          contractEndDate: tenant.contractType === 'yearly' 
            ? new Date(tenant.startDate.getFullYear() + 1, tenant.startDate.getMonth(), tenant.startDate.getDate())
            : null,
          deposit: tenant.deposit
        });
        
        // Update local state immediately
        setRooms(prev => prev.map(room => 
          room.id === tenant.roomId 
            ? { 
                ...room, 
                status: 'occupied' as const,
                tenantId: newTenant.id,
                contractStartDate: tenant.startDate,
                contractEndDate: tenant.contractType === 'yearly' 
                  ? new Date(tenant.startDate.getFullYear() + 1, tenant.startDate.getMonth(), tenant.startDate.getDate())
                  : null,
                deposit: tenant.deposit
              }
            : room
        ));
        
        // Create initial payment records for the tenant
        const room = rooms.find(r => r.id === tenant.roomId);
        if (room) {
          console.log('Creating initial payments for tenant:', newTenant.id, 'in room:', room.id);
          await createInitialPayments(newTenant as Tenant, room);
        } else {
          console.error('Room not found for creating payments:', tenant.roomId);
        }
        
        console.log('Room status updated successfully');
      } catch (roomUpdateError) {
        console.error('Error updating room status:', roomUpdateError);
        // Update local state as fallback
        setRooms(prev => prev.map(room => 
          room.id === tenant.roomId 
            ? { 
                ...room, 
                status: 'occupied' as const,
                tenantId: newTenant.id,
                contractStartDate: tenant.startDate,
                contractEndDate: null,
                deposit: tenant.deposit
              }
            : room
        ));
        
        // Still try to create payments even if room update fails
        const room = rooms.find(r => r.id === tenant.roomId);
        if (room) {
          console.log('Creating initial payments (fallback) for tenant:', newTenant.id);
          await createInitialPayments(newTenant as Tenant, room);
        }
      }
      
      console.log('Tenant added to Firebase:', newTenant);
    } catch (error) {
      console.error('Error adding tenant to Firebase:', error);
      const newTenant = { ...tenant, id: `tenant-${Date.now()}` };
      setTenants(prev => [...prev, newTenant]);
      
      // Update room status locally as fallback
      setRooms(prev => prev.map(room => 
        room.id === tenant.roomId 
          ? { 
              ...room, 
              status: 'occupied' as const,
              tenantId: newTenant.id,
              contractStartDate: tenant.startDate,
              deposit: tenant.deposit
            }
          : room
      ));
      
      // Create payments locally as fallback
      const room = rooms.find(r => r.id === tenant.roomId);
      if (room) {
        console.log('Creating initial payments (local fallback) for tenant:', newTenant.id);
        await createInitialPayments(newTenant, room);
      }
    }
  };

  const updateTenant = async (id: string, tenantUpdate: Partial<Tenant>) => {
    try {
      const oldTenant = tenants.find(t => t.id === id);
      await tenantsService.update(id, tenantUpdate);
      setTenants(prev => prev.map(tenant => 
        tenant.id === id ? { ...tenant, ...tenantUpdate } : tenant
      ));
      
      // If room changed, update room statuses
      if (oldTenant && tenantUpdate.roomId && oldTenant.roomId !== tenantUpdate.roomId) {
        // Set old room to vacant
        await updateRoom(oldTenant.roomId, { 
          status: 'vacant',
          tenantId: null,
          contractStartDate: null,
          contractEndDate: null,
          deposit: null
        });
        
        // Set new room to occupied
        await updateRoom(tenantUpdate.roomId, { 
          status: 'occupied',
          tenantId: id,
          contractStartDate: tenantUpdate.startDate || oldTenant.startDate,
          deposit: tenantUpdate.deposit || oldTenant.deposit
        });
      }
      
      console.log('Tenant updated in Firebase:', id);
    } catch (error) {
      console.error('Error updating tenant in Firebase:', error);
      setTenants(prev => prev.map(tenant => 
        tenant.id === id ? { ...tenant, ...tenantUpdate } : tenant
      ));
    }
  };

  const deleteTenant = async (id: string) => {
    try {
      const tenant = tenants.find(t => t.id === id);
      await tenantsService.delete(id);
      setTenants(prev => prev.filter(tenant => tenant.id !== id));
      
      // Set room back to vacant when tenant is deleted
      if (tenant) {
        await updateRoom(tenant.roomId, { 
          status: 'vacant',
          tenantId: null,
          contractStartDate: null,
          contractEndDate: null,
          deposit: null
        });
      }
      
      console.log('Tenant deleted from Firebase:', id);
    } catch (error) {
      console.error('Error deleting tenant from Firebase:', error);
      setTenants(prev => prev.filter(tenant => tenant.id !== id));
      
      // Update room status locally as fallback
      const tenant = tenants.find(t => t.id === id);
      if (tenant) {
        setRooms(prev => prev.map(room => 
          room.id === tenant.roomId 
            ? { 
                ...room, 
                status: 'vacant',
                tenantId: null,
                contractStartDate: null,
                contractEndDate: null,
                deposit: null
              }
            : room
        ));
      }
    }
  };

  const addPayment = async (payment: Omit<Payment, 'id'>) => {
    try {
      const newPayment = await paymentsService.create(payment);
      setPayments(prev => [...prev, newPayment as Payment]);
      console.log('Payment added to Firebase:', newPayment);
    } catch (error) {
      console.error('Error adding payment to Firebase:', error);
      const newPayment = { ...payment, id: `payment-${Date.now()}` };
      setPayments(prev => [...prev, newPayment]);
    }
  };

  const updatePayment = async (id: string, paymentUpdate: Partial<Payment>) => {
    try {
      await paymentsService.update(id, paymentUpdate);
      setPayments(prev => prev.map(payment => 
        payment.id === id ? { ...payment, ...paymentUpdate } : payment
      ));
      console.log('Payment updated in Firebase:', id);
    } catch (error) {
      console.error('Error updating payment in Firebase:', error);
      setPayments(prev => prev.map(payment => 
        payment.id === id ? { ...payment, ...paymentUpdate } : payment
      ));
    }
  };

  const deletePayment = async (id: string) => {
    try {
      await paymentsService.delete(id);
      setPayments(prev => prev.filter(payment => payment.id !== id));
      console.log('Payment deleted from Firebase:', id);
    } catch (error) {
      console.error('Error deleting payment from Firebase:', error);
      setPayments(prev => prev.filter(payment => payment.id !== id));
    }
  };

  const addReceipt = async (receipt: Omit<Receipt, 'id'>) => {
    try {
      const newReceipt = await receiptsService.create(receipt);
      setReceipts(prev => [...prev, newReceipt as Receipt]);
      console.log('Receipt added to Firebase:', newReceipt);
    } catch (error) {
      console.error('Error adding receipt to Firebase:', error);
      const newReceipt = { ...receipt, id: `receipt-${Date.now()}` };
      setReceipts(prev => [...prev, newReceipt]);
    }
  };

  const updateReceipt = async (id: string, receiptUpdate: Partial<Receipt>) => {
    try {
      await receiptsService.update(id, receiptUpdate);
      setReceipts(prev => prev.map(receipt => 
        receipt.id === id ? { ...receipt, ...receiptUpdate } : receipt
      ));
      console.log('Receipt updated in Firebase:', id);
    } catch (error) {
      console.error('Error updating receipt in Firebase:', error);
      setReceipts(prev => prev.map(receipt => 
        receipt.id === id ? { ...receipt, ...receiptUpdate } : receipt
      ));
    }
  };

  const deleteReceipt = async (id: string) => {
    try {
      await receiptsService.delete(id);
      setReceipts(prev => prev.filter(receipt => receipt.id !== id));
      console.log('Receipt deleted from Firebase:', id);
    } catch (error) {
      console.error('Error deleting receipt from Firebase:', error);
      setReceipts(prev => prev.filter(receipt => receipt.id !== id));
    }
  };

  const addNotification = async (notification: Omit<Notification, 'id'>) => {
    try {
      const newNotification = await notificationsService.create(notification);
      setNotifications(prev => [newNotification as Notification, ...prev]);
      console.log('Notification added to Firebase:', newNotification);
    } catch (error) {
      console.error('Error adding notification to Firebase:', error);
      const newNotification = { ...notification, id: `notification-${Date.now()}` };
      setNotifications(prev => [newNotification, ...prev]);
    }
  };

  const updateNotification = async (id: string, notificationUpdate: Partial<Notification>) => {
    try {
      await notificationsService.update(id, notificationUpdate);
      setNotifications(prev => prev.map(notification => 
        notification.id === id ? { ...notification, ...notificationUpdate } : notification
      ));
      console.log('Notification updated in Firebase:', id);
    } catch (error) {
      console.error('Error updating notification in Firebase:', error);
      setNotifications(prev => prev.map(notification => 
        notification.id === id ? { ...notification, ...notificationUpdate } : notification
      ));
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await notificationsService.delete(id);
      setNotifications(prev => prev.filter(notification => notification.id !== id));
      console.log('Notification deleted from Firebase:', id);
    } catch (error) {
      console.error('Error deleting notification from Firebase:', error);
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    }
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      await notificationsService.update(id, { isRead: true });
      setNotifications(prev => prev.map(notif => 
        notif.id === id ? { ...notif, isRead: true } : notif
      ));
      console.log('Notification marked as read in Firebase:', id);
    } catch (error) {
      console.error('Error marking notification as read in Firebase:', error);
      setNotifications(prev => prev.map(notif => 
        notif.id === id ? { ...notif, isRead: true } : notif
      ));
    }
  };

  const generateReceiptNumber = (): string => {
    const prefix = settings.receipt.prefix;
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `${prefix}${timestamp}${random}`;
  };

  // Create initial payment records for new tenant
  const createInitialPayments = async (tenant: Tenant, room: Room) => {
    try {
      const now = new Date();
      const paymentsToCreate = [];
      
      if (tenant.contractType === 'daily') {
        // Create 30 days of payment records
        for (let i = 0; i < 30; i++) {
          const dueDate = new Date(tenant.startDate);
          dueDate.setDate(dueDate.getDate() + i);
          
          const payment: Omit<Payment, 'id'> = {
            roomId: room.id,
            tenantId: tenant.id,
            amount: room.dailyRate || 100,
            paymentMethod: 'cash',
            paymentType: 'daily',
            dueDate,
            status: dueDate <= now ? (dueDate < new Date(now.getTime() - 24 * 60 * 60 * 1000) ? 'overdue' : 'pending') : 'pending',
            lateFee: 0
          };
          
          paymentsToCreate.push(payment);
        }
      } else if (tenant.contractType === 'monthly') {
        // Create 12 months of payment records
        for (let i = 0; i < 12; i++) {
          const dueDate = new Date(tenant.startDate);
          dueDate.setMonth(dueDate.getMonth() + i);
          
          const payment: Omit<Payment, 'id'> = {
            roomId: room.id,
            tenantId: tenant.id,
            amount: room.monthlyRate,
            paymentMethod: 'cash',
            paymentType: 'monthly',
            dueDate,
            status: dueDate <= now ? (dueDate < new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) ? 'overdue' : 'pending') : 'pending',
            lateFee: 0
          };
          
          paymentsToCreate.push(payment);
        }
      } else {
        // Create yearly payment
        const payment: Omit<Payment, 'id'> = {
          roomId: room.id,
          tenantId: tenant.id,
          amount: room.yearlyRate,
          paymentMethod: 'cash',
          paymentType: 'yearly',
          dueDate: tenant.startDate,
          status: tenant.startDate <= now ? (tenant.startDate < new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) ? 'overdue' : 'pending') : 'pending',
          lateFee: 0
        };
        
        paymentsToCreate.push(payment);
      }
      
      // Create all payments
      for (const paymentData of paymentsToCreate) {
        await addPayment(paymentData);
      }
      
      console.log(`Created ${paymentsToCreate.length} payment records for tenant ${tenant.name}`);
    } catch (error) {
      console.error('Error creating initial payments:', error);
    }
  };

  // Generate overdue notifications
  const generateOverdueNotifications = async () => {
    const now = new Date();
    const overduePayments = payments.filter(p => 
      p.status === 'pending' && 
      new Date(p.dueDate) < now
    );
    
    for (const payment of overduePayments) {
      // Update payment status to overdue
      await updatePayment(payment.id, { 
        status: 'overdue',
        lateFee: calculateLateFee(payment.dueDate, payment.amount)
      });
      
      // Create notification
      const room = rooms.find(r => r.id === payment.roomId);
      const tenant = tenants.find(t => t.id === payment.tenantId);
      
      if (room && tenant) {
        await addNotification({
          type: 'payment_overdue',
          title: 'การชำระเงินเกินกำหนด',
          message: `ห้อง ${room.roomNumber} - ${tenant.name} ค้างชำระเงินเป็นเวลา ${Math.floor((now.getTime() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24))} วัน`,
          roomId: payment.roomId,
          tenantId: payment.tenantId,
          isRead: false,
          createdAt: now,
          priority: 'high'
        });
      }
    }
  };

  // Calculate late fee
  const calculateLateFee = (dueDate: Date, amount: number): number => {
    const now = new Date();
    const daysLate = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLate <= 0) return 0;
    if (daysLate <= 7) return Math.floor(amount * 0.05); // 5% for first week
    if (daysLate <= 30) return Math.floor(amount * 0.1); // 10% for first month
    return Math.floor(amount * 0.15); // 15% after first month
  };

  // Check and update payment statuses
  useEffect(() => {
    if (payments.length > 0) {
      const checkPaymentStatuses = async () => {
        await generateOverdueNotifications();
      };
      
      // Check payment statuses every hour
      const interval = setInterval(checkPaymentStatuses, 60 * 60 * 1000);
      
      // Initial check
      checkPaymentStatuses();
      
      return () => clearInterval(interval);
    }
  }, [payments.length]);
  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const getDashboardStats = (): DashboardStats => {
    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
    const vacantRooms = rooms.filter(r => r.status === 'vacant').length;
    const maintenanceRooms = rooms.filter(r => r.status === 'maintenance').length;
    
    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisYear = new Date(today.getFullYear(), 0, 1);
    
    const todayRevenue = payments
      .filter(p => p.paidDate && new Date(p.paidDate).toDateString() === today.toDateString())
      .reduce((sum, p) => sum + p.amount, 0);
    
    const monthlyRevenue = payments
      .filter(p => p.paidDate && new Date(p.paidDate) >= thisMonth)
      .reduce((sum, p) => sum + p.amount, 0);
    
    const yearlyRevenue = payments
      .filter(p => p.paidDate && new Date(p.paidDate) >= thisYear)
      .reduce((sum, p) => sum + p.amount, 0);
    
    const pendingPayments = payments.filter(p => p.status === 'pending').length;
    const overduePayments = payments.filter(p => p.status === 'overdue').length;
    
    const todayCollections = payments
      .filter(p => p.paidDate && new Date(p.paidDate).toDateString() === today.toDateString())
      .length;
    
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
    const totalPayments = payments.length;
    const paidPayments = payments.filter(p => p.status === 'paid').length;
    const collectionRate = totalPayments > 0 ? (paidPayments / totalPayments) * 100 : 0;
    
    return {
      totalRooms,
      occupiedRooms,
      vacantRooms,
      maintenanceRooms,
      todayRevenue,
      monthlyRevenue,
      yearlyRevenue,
      pendingPayments,
      overduePayments,
      todayCollections,
      occupancyRate,
      collectionRate
    };
  };

  return (
    <DataContext.Provider value={{
      rooms,
      tenants,
      payments,
      receipts,
      notifications,
      settings,
      addRoom,
      updateRoom,
      deleteRoom,
      addTenant,
      updateTenant,
      deleteTenant,
      addPayment,
      updatePayment,
      deletePayment,
      addReceipt,
      updateReceipt,
      deleteReceipt,
      addNotification,
      updateNotification,
      deleteNotification,
      getDashboardStats,
      generateReceiptNumber,
      markNotificationAsRead,
      updateSettings,
      loading
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

// Mock data generation functions (same as before)
const generateMockRooms = (): Room[] => {
  const rooms: Room[] = [];
  const zones = ['A', 'B', 'C', 'D', 'E', 'F'];
  const statuses: Room['status'][] = ['occupied', 'vacant', 'maintenance'];
  const sizes = ['2x3 เมตร', '3x4 เมตร', '4x5 เมตร', '2x4 เมตร', '3x3 เมตร'];
  
  for (let i = 1; i <= 420; i++) {
    const zone = zones[Math.floor(Math.random() * zones.length)];
    const roomNumber = `${zone}${i.toString().padStart(3, '0')}`;
    const size = sizes[Math.floor(Math.random() * sizes.length)];
    const baseRate = Math.floor(Math.random() * 300) + 150;
    
    rooms.push({
      id: `room-${i}`,
      roomNumber,
      size,
      monthlyRate: baseRate * 25,
      yearlyRate: baseRate * 280,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      location: `โซน ${zone} แถว ${Math.ceil(i / 20)}`,
      zone,
      description: `ห้องเช่า ${size} ตำแหน่งดี เหมาะสำหรับขายของ`
    });
  }
  
  return rooms;
};

const generateMockTenants = (rooms: Room[]): Tenant[] => {
  const tenants: Tenant[] = [];
  const occupiedRooms = rooms.filter(r => r.status === 'occupied');
  
  const firstNames = ['สมใจ', 'สมชาย', 'มาลี', 'สมศรี', 'วิชัย', 'นิรันดร์', 'ประยุทธ', 'สุภาพ'];
  const lastNames = ['ใจดี', 'รักงาน', 'ขยัน', 'มั่นคง', 'เจริญ', 'สุขใส', 'มีสุข', 'ร่วมใจ'];
  
  occupiedRooms.forEach((room, index) => {
    if (Math.random() > 0.1) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      
      tenants.push({
        id: `tenant-${index + 1}`,
        name: `${firstName} ${lastName}`,
        phone: `08${Math.floor(Math.random() * 9) + 1}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
        email: `${firstName.toLowerCase()}@email.com`,
        idCard: `1${Math.floor(Math.random() * 9000000000000) + 1000000000000}`,
        address: `${Math.floor(Math.random() * 999) + 1} หมู่ ${Math.floor(Math.random() * 20) + 1} ตำบลสมเด็จ อำเภอเมือง จังหวัดกรุงเทพฯ`,
        roomId: room.id,
        startDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        contractType: 'monthly',
        deposit: room.monthlyRate * 2,
        isActive: true,
        emergencyContact: {
          name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
          phone: `08${Math.floor(Math.random() * 9) + 1}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
          relation: Math.random() > 0.5 ? 'พี่น้อง' : 'เพื่อน'
        }
      });
    }
  });
  
  return tenants;
};

const generateMockPayments = (rooms: Room[], tenants: Tenant[]): Payment[] => {
  const payments: Payment[] = [];
  const now = new Date();
  
  tenants.forEach((tenant, index) => {
    const room = rooms.find(r => r.id === tenant.roomId);
    if (!room) return;
    
    const monthsBack = Math.floor(Math.random() * 4) + 3;
    
    for (let i = monthsBack; i >= 0; i--) {
      const dueDate = new Date(now.getFullYear(), now.getMonth() - i, Math.floor(Math.random() * 5) + 1);
      const isPaid = i > 0 ? Math.random() > 0.15 : Math.random() > 0.3;
      const isOverdue = dueDate < now && !isPaid;
      
      payments.push({
        id: `payment-${index + 1}-${i}`,
        roomId: room.id,
        tenantId: tenant.id,
        amount: room.monthlyRate,
        paymentMethod: isPaid ? (Math.random() > 0.6 ? 'cash' : Math.random() > 0.5 ? 'transfer' : 'qr_code') : 'cash',
        paymentType: 'monthly',
        dueDate,
        paidDate: isPaid ? new Date(dueDate.getTime() + Math.random() * 10 * 24 * 60 * 60 * 1000) : undefined,
        status: isPaid ? 'paid' : (isOverdue ? 'overdue' : 'pending'),
        receiptNumber: isPaid ? `MKT${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}` : undefined,
        employeeId: isPaid ? (Math.random() > 0.5 ? '2' : '3') : undefined,
        lateFee: isOverdue ? Math.floor(Math.random() * 200) + 50 : 0
      });
    }
  });
  
  return payments;
};

const generateMockNotifications = (payments: Payment[], rooms: Room[]): Notification[] => {
  const notifications: Notification[] = [];
  const now = new Date();
  
  const overduePayments = payments.filter(p => p.status === 'overdue');
  overduePayments.slice(0, 10).forEach((payment, index) => {
    const room = rooms.find(r => r.id === payment.roomId);
    notifications.push({
      id: `notif-overdue-${index}`,
      type: 'payment_overdue',
      title: 'การชำระเงินเกินกำหนด',
      message: `ห้อง ${room?.roomNumber} ค้างชำระเงินเป็นเวลา ${Math.floor((now.getTime() - payment.dueDate.getTime()) / (1000 * 60 * 60 * 24))} วัน`,
      roomId: payment.roomId,
      isRead: Math.random() > 0.7,
      createdAt: payment.dueDate,
      priority: 'high'
    });
  });
  
  return notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};