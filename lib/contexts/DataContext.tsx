"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  Space,
  Tenant,
  Payment,
  Bill,
  User,
  Notification,
  SystemSettings,
  DashboardStats,
  calculateLateFee, // ADD
  calculateDaysOverdue, // ADD
} from "@/types";
import {
  spacesService,
  tenantsService,
  paymentsService,
  billsService,
  usersService,
  notificationsService,
} from "@/lib/firebase/firestore";

interface DataContextType {
  // Collections
  spaces: Space[];
  tenants: Tenant[];
  payments: Payment[];
  bills: Bill[];
  users: User[];
  notifications: Notification[];
  settings: SystemSettings;
  loading: boolean;
  // ADD: Late fee processing
  processLateFees: () => Promise<void>;

  // Space operations
  addSpace: (
    space: Omit<
      Space,
      "id" | "spaceId" | "createdAt" | "updatedAt" | "createdBy"
    >
  ) => Promise<void>;
  updateSpace: (id: string, space: Partial<Space>) => Promise<void>;
  deleteSpace: (id: string) => Promise<void>;

  // Tenant operations
  addTenant: (
    tenant: Omit<Tenant, "tenantId" | "createdAt" | "updatedAt" | "createdBy">
  ) => Promise<void>;
  updateTenant: (id: string, tenant: Partial<Tenant>) => Promise<void>;
  deleteTenant: (id: string) => Promise<void>;

  // Payment operations
  addPayment: (
    payment: Omit<Payment, "paymentId" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  updatePayment: (id: string, payment: Partial<Payment>) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;

  // Bill operations
  addBill: (
    bill: Omit<Bill, "billId" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  updateBill: (id: string, bill: Partial<Bill>) => Promise<void>;
  deleteBill: (id: string) => Promise<void>;

  // User operations
  addUser: (
    user: Omit<User, "userId" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  updateUser: (id: string, user: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

  // Notification operations
  addNotification: (
    notification: Omit<Notification, "notificationId" | "createdAt">
  ) => Promise<void>;
  updateNotification: (
    id: string,
    notification: Partial<Notification>
  ) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;

  // Payment generation functions
  generatePaymentsForTenant: (
    tenantBusinessId: string,
    paymentFrequency: "daily" | "monthly" | "yearly",
    dueDate?: Date
  ) => Promise<void>;

  // Delete
  cleanupDuplicatePayments: () => Promise<void>;

  generatePaymentsForAllTenants: (
    paymentFrequency: "daily" | "monthly" | "yearly",
    dueDate?: Date
  ) => Promise<void>;

  // Utility functions
  getDashboardStats: () => DashboardStats;
  generateReceiptNumber: () => string;
  updateSettings: (settings: Partial<SystemSettings>) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const defaultSettings: SystemSettings = {
  marketInfo: {
    name: "ຕະຫຼາດສົດເວຍງຈັນ",
    address: "123 ຖະໜົນ ສະຫະມິດໄມ, ເມືອງຈັນທະບູລີ, ນະຄອນຫຼວງວຽງຈັນ",
    phone: "+856 21 234567",
    email: "info@vientiane-market.la",
    taxId: "1234567890",
  },
  defaultRates: {
    dailyRate: 50000,
    monthlyRate: 1200000,
    yearlyRate: 12000000,
  },

  // Add late fee defaults
  lateFees: {
    tier1: { days: 1, rate: 0.01 }, // 1% after 1 day
    tier2: { days: 3, rate: 0.02 }, // 2% after 3 days
    tier3: { days: 7, rate: 0.05 }, // 5% after 7 days
    tier4: { days: 30, rate: 0.1 }, // 10% after 30 days
    tier5: { days: 90, rate: 0.25 }, // 25% after 90 days
    enableLateFees: true,
    gracePeriodDays: 0,
  },
  notifications: {
    enableEmail: true,
    enableSMS: false,
    reminderDays: 3,
    overdueReminderDays: 7,
  },
  receipt: {
    prefix: "VTM",
    includeQR: true,
    footer: "ຂອບໃຈທີ່ໃຊ້ບໍລິການ - ຕະຫຼາດສົດເວຍງຈັນ",
    template: "standard",
  },
  system: {
    autoBackup: true,
    backupFrequency: "daily",
    sessionTimeout: 60,
    maxLoginAttempts: 5,
  },
  security: {
    requirePasswordChange: false,
    passwordMinLength: 8,
    enableTwoFactor: false,
    ipRestriction: false,
    allowedIPs: [],
  },
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // State variables
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  // Load data from Firebase on mount
  useEffect(() => {
    loadData();
  }, []);

  // Utility function to convert Firebase Timestamps
  const convertTimestamps = (obj: any) => {
    const converted = { ...obj };
    Object.keys(converted).forEach((key) => {
      if (
        converted[key] &&
        typeof converted[key] === "object" &&
        converted[key].toDate
      ) {
        converted[key] = converted[key].toDate();
      }
    });
    return converted;
  };

  // Helper functions for payment processing
  // const mapPaymentStatusToEnglish = (
  //   laoStatus: string
  // ): "pending" | "paid" | "overdue" | "partial" => {
  //   const mapping: Record<string, "pending" | "paid" | "overdue" | "partial"> =
  //     {
  //       ລໍຖ້າ: "pending",
  //       ຈ່າຍແລ້ວ: "paid",
  //       ເກີນກຳນົດ: "overdue",
  //       ຈ່າຍບາງສ່ວນ: "partial",
  //     };
  //   return mapping[laoStatus] || "pending";
  // };

  const inferPaymentType = (
    payment: any,
    tenantsList: Tenant[],
    spacesList: Space[]
  ): "daily" | "monthly" | "yearly" => {
    // Find the tenant
    const tenant = tenantsList.find(
      (t) => t.tenantId === payment.tenantId || t.id === payment.tenantId
    );
    if (!tenant) return "monthly";

    // Get tenant's spaces
    const tenantSpaces = spacesList.filter((s) =>
      tenant.allSpace?.includes(s.id)
    );
    if (tenantSpaces.length === 0) return "monthly";

    // Calculate monthly rent total
    const monthlyTotal = tenantSpaces.reduce(
      (sum, space) => sum + space.baseRentMonthly,
      0
    );

    // Infer frequency from amount ratio
    const ratio = payment.amountDue / monthlyTotal;

    if (ratio >= 12) return "yearly"; // 12x monthly = yearly
    if (ratio <= 0.5) return "daily"; // Less than half monthly = daily
    return "monthly"; // Default to monthly
  };

  const enhancePaymentWithLegacyFields = (
    payment: any,
    tenantsList: Tenant[],
    spacesList: Space[]
  ): Payment => {
    return {
      ...payment,
      // Legacy compatibility computed fields
      id: payment.paymentId || payment.id,
      roomId: payment.spaceId || "",
      amount: payment.amountDue || 0,
      status: payment.paymentStatus || "pending", // Direct mapping since we're using English now
      paidDate: payment.paymentDate,
      paymentType:
        payment.paymentFrequency ||
        payment.paymentType ||
        inferPaymentType(payment, tenantsList, spacesList),
    };
  };

  // Load data function
  const loadData = async () => {
    try {
      setLoading(true);
      console.log("Loading data from Firebase...");

      const [
        spacesData,
        tenantsData,
        paymentsData,
        billsData,
        usersData,
        notificationsData,
      ] = await Promise.all([
        spacesService.getAll(),
        tenantsService.getAll(),
        paymentsService.getAll(),
        billsService.getAll(),
        usersService.getAll(),
        notificationsService.getAll(),
      ]);

      // Convert timestamps first
      const processedSpaces = spacesData.map(convertTimestamps) as Space[];
      const processedTenants = tenantsData.map(convertTimestamps) as Tenant[];

      // Set spaces and tenants first
      setSpaces(processedSpaces);
      setTenants(processedTenants);

      // Now enhance payments with the loaded data
      const enhancedPayments = paymentsData
        .map(convertTimestamps)
        .map((payment) =>
          enhancePaymentWithLegacyFields(
            payment,
            processedTenants,
            processedSpaces
          )
        );
      setPayments(enhancedPayments as Payment[]);

      setBills(billsData.map(convertTimestamps) as Bill[]);
      setUsers(usersData.map(convertTimestamps) as User[]);
      setNotifications(
        notificationsData.map(convertTimestamps) as Notification[]
      );

      // Process late fees after data loads with a small delay
      setTimeout(async () => {
        try {
          await processLateFees();
          console.log("Late fees processed successfully");
        } catch (error) {
          console.error("Failed to process late fees:", error);
        }
      }, 2000);

      console.log("Data loaded successfully from Firebase");
    } catch (error) {
      console.error("Firebase loading failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // Payment generation functions
  // Enhanced Payment Generation Functions - Hybrid Approach
  // Combines frequency-specific periods, smarter duplicate detection, and due date-based logic

  const generatePaymentsForTenant = async (
    tenantBusinessId: string,
    paymentFrequency?: "daily" | "monthly" | "yearly",
    dueDate: Date = new Date(),
    providedTenant?: Tenant
  ) => {
    try {
      const tenant =
        providedTenant || tenants.find((t) => t.tenantId === tenantBusinessId);
      if (!tenant) throw new Error(`Tenant ${tenantBusinessId} not found`);

      const tenantSpaces = spaces.filter((s) =>
        tenant.allSpace?.includes(s.id)
      );
      if (tenantSpaces.length === 0)
        throw new Error(`No spaces found for tenant ${tenantBusinessId}`);

      // SOLUTION 1: Frequency-Specific Period Calculation
      const now = new Date();
      const currentYear = now.getFullYear().toString();
      const currentMonth = `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}`;
      const currentDay = `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

      let paymentsGenerated = 0;
      console.log(
        `🔄 Generating payments for tenant ${tenantBusinessId} - ${tenantSpaces.length} spaces found`
      );

      // Generate individual payment for each space
      for (const space of tenantSpaces) {
        const frequency = space.paymentFrequency || "monthly";

        // Skip if specific frequency requested and doesn't match
        if (paymentFrequency && frequency !== paymentFrequency) {
          console.log(
            `⏭️  Skipping space ${space.spaceCode} - frequency mismatch (${frequency} vs ${paymentFrequency})`
          );
          continue;
        }

        // SOLUTION 2: Smarter Duplicate Detection - Frequency-Aware Checking
        const hasExistingUnpaidPayment = payments.some((p) => {
          if (
            p.spaceId !== space.id ||
            p.tenantId !== tenantBusinessId ||
            p.paymentStatus === "paid"
          ) {
            return false;
          }

          // Frequency-specific duplicate detection
          switch (frequency) {
            case "yearly":
              // Check if any unpaid yearly payment exists for current year
              return (
                p.paymentPeriod?.startsWith(currentYear) &&
                p.paymentFrequency === "yearly"
              );
            case "monthly":
              // Check if any unpaid monthly payment exists for current month
              return (
                p.paymentPeriod === currentMonth &&
                p.paymentFrequency === "monthly"
              );
            case "daily":
              // Check if any unpaid daily payment exists for current day
              return (
                p.paymentPeriod === currentDay && p.paymentFrequency === "daily"
              );
            default:
              return false;
          }
        });

        if (hasExistingUnpaidPayment) {
          console.log(
            `⏭️  Skipping space ${space.spaceCode} - unpaid ${frequency} payment already exists`
          );
          continue;
        }

        // SOLUTION 3: Due Date-Based Logic - Enhanced Calculation
        const lastPaidPayment = payments
          .filter(
            (p) =>
              p.spaceId === space.id &&
              p.tenantId === tenantBusinessId &&
              p.paymentStatus === "paid" &&
              p.paymentFrequency === frequency // Only consider payments of same frequency
          )
          .sort(
            (a, b) => 
              new Date(b.dueDate || b.paymentDate).getTime() -
              new Date(a.dueDate || a.paymentDate).getTime()
          )[0];

        // Calculate next due date based on frequency and last payment
        let nextDueDate = new Date(dueDate);
        let calculatedPeriod = "";

if (lastPaidPayment) {
  // Calculate from last paid payment's due date
  const lastDueDate = new Date(
    lastPaidPayment.dueDate || lastPaidPayment.paymentDate
  );

  switch (frequency) {
    case "daily":
      nextDueDate = new Date(lastDueDate);
      nextDueDate.setDate(nextDueDate.getDate() + 1);
      calculatedPeriod = `${nextDueDate.getFullYear()}-${String(
        nextDueDate.getMonth() + 1
      ).padStart(2, "0")}-${String(nextDueDate.getDate()).padStart(
        2,
        "0"
      )}`;
      break;
      
    case "monthly":
      // Add exactly 30 days instead of 1 month
      nextDueDate = new Date(lastDueDate);
      nextDueDate.setDate(nextDueDate.getDate() + 30);
      calculatedPeriod = `${nextDueDate.getFullYear()}-${String(
        nextDueDate.getMonth() + 1
      ).padStart(2, "0")}`;
      break;
      
    case "yearly":
      // Add exactly 365 days instead of 1 year
      nextDueDate = new Date(lastDueDate);
      nextDueDate.setDate(nextDueDate.getDate() + 365);
      calculatedPeriod = nextDueDate.getFullYear().toString();
      break;
  }
} else {
  // First payment - use today's date for all frequencies
  const today = new Date();

  switch (frequency) {
    case "daily":
      // Use today's date for first daily payment
      nextDueDate = new Date(today);
      calculatedPeriod = `${nextDueDate.getFullYear()}-${String(
        nextDueDate.getMonth() + 1
      ).padStart(2, "0")}-${String(nextDueDate.getDate()).padStart(
        2,
        "0"
      )}`;
      break;

    case "monthly":
      // Use today's date for first monthly payment
      nextDueDate = new Date(today);
      calculatedPeriod = `${nextDueDate.getFullYear()}-${String(
        nextDueDate.getMonth() + 1
      ).padStart(2, "0")}`;
      break;

    case "yearly":
      // Use current year for first yearly payment
      const currentYear = today.getFullYear();
      calculatedPeriod = currentYear.toString();
      
      // Use today's date for first yearly payment
      nextDueDate = new Date(today);
      break;
  }
}

        // Validate that the calculated due date makes sense
        const todayTime = new Date().getTime();
        const calculatedTime = nextDueDate.getTime();

        // Skip if due date is in the past (shouldn't happen with proper logic)
        if (calculatedTime < todayTime - 24 * 60 * 60 * 1000) {
          // Allow 1 day buffer
          console.log(
            `⚠️  Skipping space ${
              space.spaceCode
            } - calculated due date is too far in the past: ${nextDueDate.toLocaleDateString()}`
          );
          continue;
        }

        // Calculate amount based on frequency
        let amountDue = 0;
        switch (frequency) {
          case "yearly":
            amountDue = space.baseRentMonthly * 12;
            break;
          case "daily":
            amountDue = Math.round(space.baseRentMonthly / 30);
            break;
          case "monthly":
          default:
            amountDue = space.baseRentMonthly;
            break;
        }

        // Validate amount
        if (amountDue <= 0) {
          console.warn(
            `⚠️  Skipping space ${space.spaceCode} - invalid amount: ${amountDue}`
          );
          continue;
        }

        // Double-check: ensure no duplicate exists with the calculated period
        const finalDuplicateCheck = payments.some(
          (p) =>
            p.spaceId === space.id &&
            p.tenantId === tenantBusinessId &&
            p.paymentStatus !== "paid" &&
            p.paymentPeriod === calculatedPeriod &&
            p.paymentFrequency === frequency
        );

        if (finalDuplicateCheck) {
          console.log(
            `⏭️  Final check: Skipping space ${space.spaceCode} - duplicate found for period ${calculatedPeriod}`
          );
          continue;
        }

        const paymentData = {
          spaceId: space.id,
          spaceCode: space.spaceCode,
          tenantId: tenantBusinessId,
          paymentPeriod: calculatedPeriod, // Use frequency-specific period format
          dueDate: nextDueDate,
          originalDueDate: nextDueDate,
          amountDue,
          originalAmount: amountDue,
          lateFee: 0,
          lateFeeRate: null,
          lateFeeApplied: false,
          daysOverdue: 0,
          paymentStatus: "pending" as const,
          paymentFrequency: frequency as "daily" | "monthly" | "yearly",
          notes: `${
            frequency.charAt(0).toUpperCase() + frequency.slice(1)
          } payment for space ${space.spaceCode} (${
            space.spaceType || "Unknown type"
          }) - Period: ${calculatedPeriod}`,

          // Legacy fields for compatibility
          id: "",
          roomId: space.id,
          amount: amountDue,
          status: "pending" as const,
          paymentType: frequency as "daily" | "monthly" | "yearly",
        };

        try {
          await addPayment(paymentData);
          paymentsGenerated++;
          console.log(
            `✅ Generated ${frequency} payment for space ${
              space.spaceCode
            }: ₭${amountDue.toLocaleString()} - Due: ${nextDueDate.toLocaleDateString()} - Period: ${calculatedPeriod}`
          );

          // Update space payment status
          await updateSpace(space.id, {
            paymentStatus: {
              currentStatus: "pending",
              currentPeriodPaid: false,
              nextDueDate: nextDueDate,
              lateFee: 0,
              lateFeeApplied: false,
              daysOverdue: 0,
              lastUpdated: new Date(),
            },
          });
        } catch (paymentError) {
          console.error(
            `❌ Failed to generate payment for space ${space.spaceCode}:`,
            paymentError
          );
          continue;
        }
      }

      if (paymentsGenerated > 0) {
        console.log(
          `🎉 Successfully generated ${paymentsGenerated} payments for tenant ${tenantBusinessId}`
        );
      } else {
        console.log(
          `ℹ️  No new payments generated for tenant ${tenantBusinessId} - all applicable periods already covered`
        );
      }
    } catch (error) {
      console.error(
        `❌ Error generating payments for tenant ${tenantBusinessId}:`,
        error
      );
      throw error;
    }
  };

  // Enhanced utility function to clean up duplicate payments (run once to fix existing data)
  const cleanupDuplicatePayments = async () => {
    console.log("Starting duplicate payment cleanup...");

    // Group payments by tenant, space, frequency, and period
    const paymentGroups = new Map<string, Payment[]>();

    payments.forEach((payment) => {
      const key = `${payment.tenantId}-${payment.spaceId}-${payment.paymentFrequency}-${payment.paymentPeriod}`;

      if (!paymentGroups.has(key)) {
        paymentGroups.set(key, []);
      }
      paymentGroups.get(key)!.push(payment);
    });

    // Find and remove duplicates (keep the oldest one)
    let duplicatesRemoved = 0;

    // Use Array.from to iterate over Map entries for TypeScript compatibility
    for (const [key, groupPayments] of Array.from(paymentGroups.entries())) {
      if (groupPayments.length > 1) {
        // Sort by creation date, keep the first one
        groupPayments.sort(
          (a: Payment, b: Payment) =>
            new Date(a.createdAt || 0).getTime() -
            new Date(b.createdAt || 0).getTime()
        );

        // Remove duplicates (skip the first one)
        for (let i = 1; i < groupPayments.length; i++) {
          try {
            await deletePayment(
              groupPayments[i].paymentId || groupPayments[i].id
            );
            duplicatesRemoved++;
            console.log(`Removed duplicate payment: ${key}`);
          } catch (error) {
            console.error(`Failed to remove duplicate payment:`, error);
          }
        }
      }
    }

    console.log(
      `Cleanup complete: Removed ${duplicatesRemoved} duplicate payments`
    );
  };

  // NEW: Daily late fee processing function
  // Debug version of processLateFees function - CORRECTED
  const processLateFees = async () => {
    console.log("🔍 DEBUG: Starting late fee processing...");

    try {
      // Check if late fees are enabled
      if (!settings.lateFees.enableLateFees) {
        console.log("❌ DEBUG: Late fees are disabled in settings");
        return;
      }
      console.log("✅ DEBUG: Late fees are enabled");
      console.log("📊 DEBUG: Settings:", {
        enableLateFees: settings.lateFees.enableLateFees,
        gracePeriodDays: settings.lateFees.gracePeriodDays,
        tier1: settings.lateFees.tier1,
        tier2: settings.lateFees.tier2,
        tier3: settings.lateFees.tier3,
        tier4: settings.lateFees.tier4,
        tier5: settings.lateFees.tier5,
      });

      // Filter unpaid payments
      const unpaidPayments = payments.filter(
        (p) => p.paymentStatus === "pending" || p.paymentStatus  === "overdue" // Use English values
      );

      console.log(`🔍 DEBUG: Found ${unpaidPayments.length} unpaid payments`);
      console.log(
        "📋 DEBUG: Unpaid payments details:",
        unpaidPayments.map((p) => ({
          id: p.paymentId || p.id,
          spaceId: p.spaceId, // FIXED: removed spaceCode reference
          tenantId: p.tenantId,
          status: p.paymentStatus,
          originalDueDate: p.originalDueDate,
          currentLateFee: p.lateFee,
          originalAmount: p.originalAmount,
        }))
      );

      if (unpaidPayments.length === 0) {
        console.log("ℹ️ DEBUG: No unpaid payments found, exiting");
        return;
      }

      // Process each payment
      for (const payment of unpaidPayments) {
        console.log(
          `\n🔄 DEBUG: Processing payment ${payment.paymentId || payment.id}`
        );
        console.log("📅 DEBUG: Payment details:", {
          spaceId: payment.spaceId, // FIXED: removed spaceCode reference
          originalDueDate: payment.originalDueDate,
          paymentStatus: payment.paymentStatus,
          originalAmount: payment.originalAmount,
          currentLateFee: payment.lateFee,
        });

        // Test the calculateDaysOverdue function
        const today = new Date();
        console.log("📅 DEBUG: Date comparison:", {
          today: today.toISOString(),
          originalDueDate: payment.originalDueDate,
          originalDueDateISO: new Date(payment.originalDueDate).toISOString(),
        });

        const daysOverdue = calculateDaysOverdue(payment.originalDueDate);
        console.log(`📊 DEBUG: Days overdue calculated: ${daysOverdue}`);

        if (daysOverdue <= settings.lateFees.gracePeriodDays) {
          console.log(
            `⏭️ DEBUG: Skipping payment - ${daysOverdue} days is within grace period of ${settings.lateFees.gracePeriodDays} days`
          );
          continue;
        }

        console.log(
          `⚠️ DEBUG: Payment is ${daysOverdue} days overdue (beyond grace period)`
        );

        // Test the calculateLateFee function
        const lateFeeResult = calculateLateFee(
          payment.originalAmount,
          daysOverdue,
          settings
        );

        console.log("💰 DEBUG: Late fee calculation result:", lateFeeResult);

        // Check if late fee changed
        const hasChanged =
          lateFeeResult.lateFee !== payment.lateFee ||
          lateFeeResult.rate !== payment.lateFeeRate;
        console.log(`🔄 DEBUG: Late fee changed? ${hasChanged}`);
        console.log("📊 DEBUG: Comparison:", {
          newLateFee: lateFeeResult.lateFee,
          oldLateFee: payment.lateFee,
          newRate: lateFeeResult.rate,
          oldRate: payment.lateFeeRate,
        });

        if (!hasChanged) {
          console.log("⏭️ DEBUG: No changes needed, skipping update");
          continue;
        }

        // FIXED: Prepare update data with proper types
        const updateData: Partial<Payment> = {
          lateFee: lateFeeResult.lateFee,
          lateFeeRate: lateFeeResult.rate,
          lateFeeApplied: lateFeeResult.lateFee > 0,
          amountDue: payment.originalAmount + lateFeeResult.lateFee,
          daysOverdue,
          paymentStatus: (daysOverdue > 0 ? "overdue" : "pending") as
            | "pending"
            | "paid"
            | "overdue"
            | "partial",
        };

        console.log("📝 DEBUG: Update data prepared:", updateData);

        try {
          console.log(
            `🔄 DEBUG: Attempting to update payment ${
              payment.paymentId || payment.id
            }...`
          );

          await updatePayment(payment.paymentId || payment.id, updateData);

          console.log(
            `✅ DEBUG: Successfully updated payment ${
              payment.paymentId || payment.id
            }`
          );

          // FIXED: Update corresponding space status with proper types
          const space = spaces.find((s) => payment.spaceId.includes(s.id));
          if (space) {
            console.log(`🏢 DEBUG: Updating space ${space.spaceId} status...`); // FIXED: use spaceId

            const spaceUpdateData: Partial<Space> = {
              paymentStatus: {
                currentStatus: "overdue" as
                  | "no_tenant"
                  | "pending"
                  | "paid"
                  | "overdue", // FIXED: proper type
                currentPeriodPaid:
                  space.paymentStatus?.currentPeriodPaid ?? false,
                nextDueDate: space.paymentStatus?.nextDueDate,
                lateFee: lateFeeResult.lateFee,
                lateFeeApplied: lateFeeResult.lateFee > 0,
                daysOverdue,
                lastUpdated: new Date(),
              },
            };

            console.log("🏢 DEBUG: Space update data:", spaceUpdateData);

            await updateSpace(space.id, spaceUpdateData);
            console.log(
              `✅ DEBUG: Successfully updated space ${space.spaceId}`
            ); // FIXED: use spaceId
          } else {
            console.log(
              `⚠️ DEBUG: Space not found for payment ${payment.spaceId}`
            );
          }
        } catch (updateError: any) {
          // FIXED: proper error typing
          console.error(
            `❌ DEBUG: Failed to update payment ${
              payment.paymentId || payment.id
            }:`,
            updateError
          );
          console.error("❌ DEBUG: Update error details:", {
            message: updateError?.message || "Unknown error",
            stack: updateError?.stack || "No stack trace",
          });
        }
      }

      console.log("🎉 DEBUG: Late fee processing completed");
    } catch (error: any) {
      // FIXED: proper error typing
      console.error("❌ DEBUG: Error in processLateFees:", error);
      console.error("❌ DEBUG: Error details:", {
        message: error?.message || "Unknown error",
        stack: error?.stack || "No stack trace",
      });
    }
  };

  

  const generatePaymentsForAllTenants = async (
    paymentFrequency: "daily" | "monthly" | "yearly",
    dueDate: Date = new Date()
  ) => {
    try {
      const activeTenants = tenants.filter(
        (t) => t.allSpace && t.allSpace.length > 0
      );

      for (const tenant of activeTenants) {
        await generatePaymentsForTenant(
          tenant.tenantId,
          paymentFrequency,
          dueDate
        );
      }

      console.log(
        `Generated ${paymentFrequency} payments for all active tenants`
      );
    } catch (error) {
      console.error("Error generating bulk payments:", error);
      throw error;
    }
  };

  // Space operations
  const addSpace = async (
    spaceData: Omit<
      Space,
      "id" | "spaceId" | "createdAt" | "updatedAt" | "createdBy"
    >
  ) => {
    try {
      // Check for duplicate space code
      const isDuplicate = spaces.some(
        (space) => space.spaceCode === spaceData.spaceCode
      );
      if (isDuplicate) {
        throw new Error(`ລະຫັດພື້ນທີ່ ${spaceData.spaceCode} ຖືກໃຊ້ແລ້ວ`);
      }

      const newSpace = await spacesService.create({
        ...spaceData,
        createdBy: "current-user",
      });
      setSpaces((prev) => [...prev, convertTimestamps(newSpace) as Space]);
      console.log("Space added:", newSpace);
    } catch (error) {
      console.error("Error adding space:", error);
      throw error;
    }
  };

  const updateSpace = async (id: string, spaceUpdate: Partial<Space>) => {
    try {
      const existingSpace = spaces.find((s) => s.id === id);
      if (!existingSpace) {
        throw new Error("Space not found");
      }

      // Update in database first
      await spacesService.update(id, spaceUpdate);

      // Then update local state synchronously
      setSpaces((prev) =>
        prev.map((space) =>
          space.id === id ? { ...space, ...spaceUpdate } : space
        )
      );

      console.log("Space updated:", id);
    } catch (error) {
      console.error("Error updating space:", error);
      throw error;
    }
  };

  const deleteSpace = async (id: string) => {
    try {
      await spacesService.delete(id);
      setSpaces((prev) => prev.filter((space) => space.id !== id));
      console.log("Space deleted:", id);
    } catch (error) {
      console.error("Error deleting space:", error);
      setSpaces((prev) => prev.filter((space) => space.id !== id));
    }
  };

  // Tenant operations
  const addTenant = async (
    tenantData: Omit<Tenant, "tenantId" | "createdAt" | "createdBy">
  ) => {
    try {
      // Check if any assigned spaces are already occupied
      if (tenantData.allSpace && tenantData.allSpace.length > 0) {
        const conflictingSpaces = spaces.filter(
          (space) =>
            tenantData.allSpace.includes(space.id) &&
            space.status === "rented" &&
            space.currentTenantId
        );

        if (conflictingSpaces.length > 0) {
          const conflictCodes = conflictingSpaces
            .map((s) => s.spaceCode)
            .join(", ");
          throw new Error(
            `ພື້ນທີ່ ${conflictCodes} ຖືກເຊົ່າແລ້ວໂດຍຜູ້ເຊົ່າອື່ນ`
          );
        }
      }

      // Create the tenant record
      const newTenant = await tenantsService.create({
        ...tenantData,
        createdBy: 1,
      });

      console.log("Created tenant:", newTenant);

      // Convert and prepare for local state
      const newTenantConverted = convertTimestamps(newTenant) as Tenant;

      // Add to local state immediately
      setTenants((prev) => [...prev, newTenantConverted]);

      // Update all assigned spaces to mark them as occupied
      if (tenantData.allSpace && tenantData.allSpace.length > 0) {
        const spaceUpdatePromises = tenantData.allSpace.map(async (spaceId) => {
          try {
            const spaceUpdate = {
              status: "rented" as const,
              currentTenantId: newTenant.tenantId,
              currentTenantName: newTenant.tenantName,

              updatedAt: new Date(),
            };

            await spacesService.update(spaceId, spaceUpdate);

            // Update local state
            setSpaces((prev) =>
              prev.map((space) =>
                space.id === spaceId ? { ...space, ...spaceUpdate } : space
              )
            );
          } catch (error) {
            console.error(`Failed to update space ${spaceId}:`, error);
            throw new Error(`ບໍ່ສາມາດອັບເດດພື້ນທີ່ ${spaceId} ໄດ້`);
          }
        });

        await Promise.all(spaceUpdatePromises);
        console.log("Updated spaces for tenant");
      }

      // Generate initial payments for the new tenant (pass tenant directly to avoid state timing issues)
      // if (tenantData.allSpace && tenantData.allSpace.length > 0) {
      //   try {
      //     // Determine payment frequency based on assigned spaces
      //     const assignedSpaces = spaces.filter(s => tenantData.allSpace.includes(s.id));

      //     // Check if any space has a specific payment frequency
      //     const hasYearlySpace = assignedSpaces.some(space => space.paymentFrequency === 'yearly');
      //     const hasDailySpace = assignedSpaces.some(space => space.paymentFrequency === 'daily');

      //     // Determine payment frequency priority: yearly > monthly > daily
      //     let paymentFrequency: 'daily' | 'monthly' | 'yearly' = 'monthly'; // default

      //     if (hasYearlySpace) {
      //       paymentFrequency = 'yearly';
      //     } else if (hasDailySpace) {
      //       paymentFrequency = 'daily';
      //     }

      //     await generatePaymentsForTenant(
      //   newTenant.tenantId,
      //   undefined, // Generate for all frequencies
      //   new Date(),
      //   newTenantConverted
      //     );

      //     console.log(`Generated ${paymentFrequency} payment for new tenant`);
      //   } catch (error) {
      //     console.error(
      //       "Failed to generate initial payment for new tenant:",
      //       error
      //     );
      //     // Don't throw here - tenant creation was successful
      //   }
      // }

      console.log("Tenant and spaces updated successfully:", newTenant);
      return newTenant;
    } catch (error) {
      console.error("Error adding tenant:", error);
      throw error;
    }
  };

  const updateTenant = async (id: string, tenantUpdate: Partial<Tenant>) => {
    try {
      const existingTenant = tenants.find((t) => t.id === id);
      if (!existingTenant) {
        throw new Error("Tenant not found");
      }

      // Handle space assignment changes
      if (tenantUpdate.allSpace !== undefined) {
        const oldSpaces = existingTenant.allSpace || [];
        const newSpaces = tenantUpdate.allSpace || [];

        const spacesToRemove = oldSpaces.filter(
          (spaceId) => !newSpaces.includes(spaceId)
        );
        const spacesToAdd = newSpaces.filter(
          (spaceId) => !oldSpaces.includes(spaceId)
        );

        // Check if new spaces are available
        if (spacesToAdd.length > 0) {
          const conflictingSpaces = spaces.filter(
            (space) =>
              spacesToAdd.includes(space.id) &&
              space.status === "rented" &&
              space.currentTenantId &&
              space.currentTenantId !== existingTenant.tenantId
          );

          if (conflictingSpaces.length > 0) {
            const conflictCodes = conflictingSpaces
              .map((s) => s.spaceCode)
              .join(", ");
            throw new Error(
              `ພື້ນທີ່ ${conflictCodes} ຖືກເຊົ່າແລ້ວໂດຍຜູ້ເຊົ່າອື່ນ`
            );
          }
        }

        // Remove tenant from old spaces - SYNC VERSION
        for (const spaceId of spacesToRemove) {
          const spaceUpdate = {
            status: "vacant" as const,
            currentTenantId: null, // Explicitly set to null
            currentTenantName: null, // Clear tenant name
            updatedAt: new Date(),
          };

          // Update database first
          await spacesService.update(spaceId, spaceUpdate);

          // Update local state immediately
          setSpaces((prev) =>
            prev.map((space) =>
              space.id === spaceId
                ? {
                    ...space,
                    ...spaceUpdate,
                    currentTenantId: undefined, // Set to undefined for local state
                    currentTenantName: undefined,
                  }
                : space
            )
          );
          console.log(`✅ Removed tenant from space ${spaceId}`);
        }

        // Add tenant to new spaces - SYNC VERSION
        for (const spaceId of spacesToAdd) {
          const spaceUpdate = {
            status: "rented" as const,
            currentTenantId: existingTenant.tenantId,
            currentTenantName: existingTenant.tenantName,
            updatedAt: new Date(),
          };

          // Update database first
          await spacesService.update(spaceId, spaceUpdate);

          // Update local state immediately
          setSpaces((prev) =>
            prev.map((space) =>
              space.id === spaceId ? { ...space, ...spaceUpdate } : space
            )
          );
          console.log(`✅ Added tenant to space ${spaceId}`);
        }

        // Handle payment generation for newly assigned spaces
        // if (spacesToAdd.length > 0) {
        //   try {
        //     const currentPeriod = `${new Date().getFullYear()}-${String(
        //       new Date().getMonth() + 1
        //     ).padStart(2, "0")}`;
        //     const existingPayment = payments.find(
        //       (p) =>
        //         p.tenantId === existingTenant.tenantId &&
        //         p.paymentPeriod === currentPeriod
        //     );

        //     if (!existingPayment) {
        //       await generatePaymentsForTenant(
        //         existingTenant.tenantId,
        //         "monthly"
        //       );
        //     }
        //   } catch (error) {
        //     console.error(
        //       "Failed to generate payment for updated tenant spaces:",
        //       error
        //     );
        //   }
        // }
      }

      // Update tenant record in database
      await tenantsService.update(id, tenantUpdate);

      // Update local tenant state
      setTenants((prev) =>
        prev.map((tenant) =>
          tenant.id === id ? { ...tenant, ...tenantUpdate } : tenant
        )
      );

      console.log("✅ Tenant updated successfully:", id);
    } catch (error) {
      console.error("❌ Error updating tenant:", error);
      throw error;
    }
  };

  const deleteTenant = async (tenantId: string) => {
    try {
      console.log("🔍 Looking for tenant with ID:", tenantId);

      // Find the tenant by tenantId to get the Firebase document ID
      const tenant = tenants.find((t) => t.tenantId === tenantId);
      if (!tenant) {
        console.error("❌ Tenant not found. Search ID:", tenantId);
        throw new Error("Tenant not found");
      }

      console.log("✅ Found tenant:", tenant);

      // Free up all assigned spaces - SYNC VERSION
      if (tenant.allSpace && tenant.allSpace.length > 0) {
        for (const spaceId of tenant.allSpace) {
          const spaceUpdate = {
            status: "vacant" as const,
            currentTenantId: null, // Explicitly set to null for database
            currentTenantName: null, // Clear tenant name
            updatedAt: new Date(),
          };

          try {
            // Update database first
            await spacesService.update(spaceId, spaceUpdate);

            // Update local state immediately
            setSpaces((prev) =>
              prev.map((space) =>
                space.id === spaceId
                  ? {
                      ...space,
                      status: "vacant" as const,
                      currentTenantId: undefined, // undefined for local state
                      currentTenantName: undefined,
                      updatedAt: new Date(),
                    }
                  : space
              )
            );
            console.log(`✅ Freed space ${spaceId} from tenant ${tenantId}`);
          } catch (spaceError) {
            console.error(`❌ Failed to free space ${spaceId}:`, spaceError);
            // Continue with other spaces even if one fails
          }
        }
      }

      // Use the Firebase document ID for deletion
      const firebaseDocId = tenant.id;
      if (!firebaseDocId) {
        throw new Error("Firebase document ID missing");
      }

      // Delete tenant record using Firebase document ID
      await tenantsService.delete(firebaseDocId);

      // Update local state using tenantId for consistency
      setTenants((prev) => prev.filter((t) => t.tenantId !== tenantId));

      console.log("✅ Tenant deleted and all spaces freed:", tenantId);
    } catch (error) {
      console.error("❌ Error deleting tenant:", error);
      throw error;
    }
  };

  // Payment operations nice nice
  const addPayment = async (
    paymentData: Omit<Payment, "paymentId" | "createdAt" | "updatedAt">
  ) => {
    try {
      // Strip legacy fields before sending to Firebase
      const {
        id,
        roomId,
        amount,
        status,
        paidDate,
        paymentType,
        ...firebasePaymentData
      } = paymentData;

      const newPayment = await paymentsService.create(firebasePaymentData);
      const enhancedPayment = enhancePaymentWithLegacyFields(
        convertTimestamps(newPayment),
        tenants,
        spaces
      );

      setPayments((prev) => [...prev, enhancedPayment as Payment]);
      console.log("Payment added:", enhancedPayment);
    } catch (error) {
      console.error("Error adding payment:", error);
      throw error;
    }
  };

  const updatePayment = async (id: string, paymentUpdate: Partial<Payment>) => {
    try {
      // Strip legacy fields before sending to Firebase
      const {
        roomId,
        amount,
        status,
        paidDate,
        paymentType,
        ...firebaseUpdate
      } = paymentUpdate;

      // Map English status back to Lao if provided
      if (status) {
        const statusMapping: Record<
          string,
          "pending" | "paid" | "overdue" | "partial"
        > = {
          pending: "pending",
          paid: "paid",
          overdue: "overdue",
          partial: "partial",
        };
        firebaseUpdate.paymentStatus = statusMapping[status];
      }

      // Map other legacy fields
      if (amount !== undefined) firebaseUpdate.amountDue = amount;
      if (paidDate !== undefined) firebaseUpdate.paymentDate = paidDate;

      await paymentsService.update(id, firebaseUpdate);

      // Update local state with enhanced data
      setPayments((prev) =>
        prev.map((payment) => {
          if (payment.paymentId === id || payment.id === id) {
            const updatedPayment = { ...payment, ...paymentUpdate };
            return enhancePaymentWithLegacyFields(
              updatedPayment,
              tenants,
              spaces
            );
          }
          return payment;
        })
      );

      console.log("Payment updated:", id);
    } catch (error) {
      console.error("Error updating payment:", error);
      throw error;
    }
  };

  const deletePayment = async (id: string) => {
    try {
      await paymentsService.delete(id);
      setPayments((prev) =>
        prev.filter((payment) => payment.paymentId !== id && payment.id !== id)
      );
      console.log("Payment deleted:", id);
    } catch (error) {
      console.error("Error deleting payment:", error);
      throw error;
    }
  };

  // Bill operations
  const addBill = async (
    billData: Omit<Bill, "billId" | "createdAt" | "updatedAt">
  ) => {
    try {
      const newBill = await billsService.create(billData);
      setBills((prev) => [...prev, convertTimestamps(newBill) as Bill]);
      console.log("Bill added:", newBill);
    } catch (error) {
      console.error("Error adding bill:", error);
      const fallbackBill = {
        ...billData,
        billId: `bill-${Date.now()}`,
        id: `bill-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setBills((prev) => [...prev, fallbackBill]);
    }
  };

  const updateBill = async (id: string, billUpdate: Partial<Bill>) => {
    try {
      await billsService.update(id, billUpdate);
      setBills((prev) =>
        prev.map((bill) =>
          bill.billId === id || bill.id === id
            ? { ...bill, ...billUpdate }
            : bill
        )
      );
      console.log("Bill updated:", id);
    } catch (error) {
      console.error("Error updating bill:", error);
      setBills((prev) =>
        prev.map((bill) =>
          bill.billId === id || bill.id === id
            ? { ...bill, ...billUpdate }
            : bill
        )
      );
    }
  };

  const deleteBill = async (id: string) => {
    try {
      await billsService.delete(id);
      setBills((prev) =>
        prev.filter((bill) => bill.billId !== id && bill.id !== id)
      );
      console.log("Bill deleted:", id);
    } catch (error) {
      console.error("Error deleting bill:", error);
      setBills((prev) =>
        prev.filter((bill) => bill.billId !== id && bill.id !== id)
      );
    }
  };

  // User operations
  const addUser = async (
    userData: Omit<User, "userId" | "createdAt" | "updatedAt">
  ) => {
    try {
      const newUser = await usersService.create(userData);
      setUsers((prev) => [...prev, convertTimestamps(newUser) as User]);
      console.log("User added:", newUser);
    } catch (error) {
      console.error("Error adding user:", error);
      const fallbackUser = {
        ...userData,
        userId: `user-${Date.now()}`,
        id: `user-${Date.now()}`,
        username: userData.displayName,
        name: userData.displayName,
        phone: userData.phoneNumber,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setUsers((prev) => [...prev, fallbackUser]);
    }
  };

  const updateUser = async (id: string, userUpdate: Partial<User>) => {
    try {
      await usersService.update(id, userUpdate);
      setUsers((prev) =>
        prev.map((user) =>
          user.userId === id || user.id === id
            ? { ...user, ...userUpdate }
            : user
        )
      );
      console.log("User updated:", id);
    } catch (error) {
      console.error("Error updating user:", error);
      setUsers((prev) =>
        prev.map((user) =>
          user.userId === id || user.id === id
            ? { ...user, ...userUpdate }
            : user
        )
      );
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await usersService.delete(id);
      setUsers((prev) =>
        prev.filter((user) => user.userId !== id && user.id !== id)
      );
      console.log("User deleted:", id);
    } catch (error) {
      console.error("Error deleting user:", error);
      setUsers((prev) =>
        prev.filter((user) => user.userId !== id && user.id !== id)
      );
    }
  };

  // Notification operations
  const addNotification = async (
    notificationData: Omit<Notification, "notificationId" | "createdAt">
  ) => {
    try {
      const newNotification = await notificationsService.create(
        notificationData
      );
      setNotifications((prev) => [
        convertTimestamps(newNotification) as Notification,
        ...prev,
      ]);
      console.log("Notification added:", newNotification);
    } catch (error) {
      console.error("Error adding notification:", error);
      const fallbackNotification = {
        ...notificationData,
        notificationId: `notification-${Date.now()}`,
        id: `notification-${Date.now()}`,
        roomId: notificationData.relatedSpaceId,
        tenantId:
          notificationData.recipientType === "tenant"
            ? notificationData.recipientId
            : undefined,
        isRead: false,
        priority: "medium" as const,
        createdAt: new Date(),
      };
      setNotifications((prev) => [fallbackNotification, ...prev]);
    }
  };

  const updateNotification = async (
    id: string,
    notificationUpdate: Partial<Notification>
  ) => {
    try {
      await notificationsService.update(id, notificationUpdate);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.notificationId === id || notification.id === id
            ? { ...notification, ...notificationUpdate }
            : notification
        )
      );
      console.log("Notification updated:", id);
    } catch (error) {
      console.error("Error updating notification:", error);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.notificationId === id || notification.id === id
            ? { ...notification, ...notificationUpdate }
            : notification
        )
      );
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await notificationsService.delete(id);
      setNotifications((prev) =>
        prev.filter(
          (notification) =>
            notification.notificationId !== id && notification.id !== id
        )
      );
      console.log("Notification deleted:", id);
    } catch (error) {
      console.error("Error deleting notification:", error);
      setNotifications((prev) =>
        prev.filter(
          (notification) =>
            notification.notificationId !== id && notification.id !== id
        )
      );
    }
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      await notificationsService.update(id, {
        deliveryStatus: {
          email: { sent: true, delivered: true, timestamp: new Date() },
        },
      });
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.notificationId === id || notif.id === id
            ? { ...notif, isRead: true }
            : notif
        )
      );
      console.log("Notification marked as read:", id);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.notificationId === id || notif.id === id
            ? { ...notif, isRead: true }
            : notif
        )
      );
    }
  };

  // Utility functions
  const generateReceiptNumber = (): string => {
    const prefix = settings.receipt.prefix;
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 100)
      .toString()
      .padStart(2, "0");
    return `${prefix}${timestamp}${random}`;
  };

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const getDashboardStats = (): DashboardStats => {
    try {
      // Basic space statistics with null safety
      const totalSpaces = spaces?.length || 0;
      const occupiedSpaces =
        spaces?.filter((s) => s.status === "rented").length || 0;
      const vacantSpaces =
        spaces?.filter((s) => s.status === "vacant").length || 0;
      const maintenanceSpaces =
        spaces?.filter((s) => s.status === "maintainance").length || 0;

      // Space type breakdown
      const tableSpaces =
        spaces?.filter((s) => s.spaceType === "table").length || 0;
      const roomSpaces =
        spaces?.filter((s) => s.spaceType === "room").length || 0;
      const signageSpaces =
        spaces?.filter((s) => s.spaceType === "signage").length || 0;
      const boothSpaces =
        spaces?.filter((s) => s.spaceType === "booth").length || 0;

      // Tenant statistics
      const activeTenants = tenants?.length || 0;

      // Date calculations for revenue
      const today = new Date();
      const startOfToday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      const endOfToday = new Date(startOfToday);
      endOfToday.setDate(endOfToday.getDate() + 1);

      const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const thisYear = new Date(today.getFullYear(), 0, 1);

      // Payment filtering with null safety
      const safePayments = payments || [];
      const paidPayments = safePayments.filter(
        (p) => p.paymentStatus === "paid" && p.paymentDate
      );

      // Revenue calculations
      const todayRevenue = paidPayments
        .filter((p) => {
          if (!p.paymentDate) return false;
          const paymentDate = new Date(p.paymentDate);
          return paymentDate >= startOfToday && paymentDate < endOfToday;
        })
        .reduce((sum, p) => sum + (p.amountPaid || p.amountDue || 0), 0);

      const monthlyRevenue = paidPayments
        .filter((p) => {
          if (!p.paymentDate) return false;
          return new Date(p.paymentDate) >= thisMonth;
        })
        .reduce((sum, p) => sum + (p.amountPaid || p.amountDue || 0), 0);

      const yearlyRevenue = paidPayments
        .filter((p) => {
          if (!p.paymentDate) return false;
          return new Date(p.paymentDate) >= thisYear;
        })
        .reduce((sum, p) => sum + (p.amountPaid || p.amountDue || 0), 0);

      // Payment status counts
      const pendingPayments = safePayments.filter(
        (p) => p.paymentStatus === "pending"
      ).length;
      const overduePayments = safePayments.filter(
        (p) => p.paymentStatus === "overdue"
      ).length;

      // Collection statistics
      const todayCollections = paidPayments.filter((p) => {
        if (!p.paymentDate) return false;
        const paymentDate = new Date(p.paymentDate);
        return paymentDate >= startOfToday && paymentDate < endOfToday;
      }).length;

      // Rate calculations with safety checks
      const occupancyRate =
        totalSpaces > 0 ? (occupiedSpaces / totalSpaces) * 100 : 0;

      const totalPaymentsCount = safePayments.length;
      const paidPaymentsCount = paidPayments.length;
      const collectionRate =
        totalPaymentsCount > 0
          ? (paidPaymentsCount / totalPaymentsCount) * 100
          : 0;

      return {
        // New schema fields
        totalSpaces,
        occupiedSpaces,
        vacantSpaces,
        maintenanceSpaces,
        activeContracts: 0, // No contracts in simplified version
        activeTenants,

        // Legacy compatibility fields
        totalRooms: totalSpaces,
        occupiedRooms: occupiedSpaces,
        vacantRooms: vacantSpaces,
        maintenanceRooms: maintenanceSpaces,

        // Revenue fields
        todayRevenue,
        monthlyRevenue,
        yearlyRevenue,

        // Payment status fields
        pendingPayments,
        overduePayments,
        todayCollections,

        // Rate calculations
        occupancyRate: Math.round(occupancyRate * 100) / 100,
        collectionRate: Math.round(collectionRate * 100) / 100,

        // New fields for enhanced dashboard
        tableSpaces,
        roomSpaces,
        signageSpaces,
        boothSpaces,
        expiringContracts: 0, // No contracts in simplified version
      };
    } catch (error) {
      console.error("Error calculating dashboard stats:", error);

      // Return safe default values in case of error
      return {
        totalSpaces: 0,
        occupiedSpaces: 0,
        vacantSpaces: 0,
        maintenanceSpaces: 0,
        activeContracts: 0,
        activeTenants: 0,
        totalRooms: 0,
        occupiedRooms: 0,
        vacantRooms: 0,
        maintenanceRooms: 0,
        todayRevenue: 0,
        monthlyRevenue: 0,
        yearlyRevenue: 0,
        pendingPayments: 0,
        overduePayments: 0,
        todayCollections: 0,
        occupancyRate: 0,
        collectionRate: 0,
        tableSpaces: 0,
        roomSpaces: 0,
        signageSpaces: 0,
        boothSpaces: 0,
        expiringContracts: 0,
      };
    }
  };

  return (
    <DataContext.Provider
      value={{
        // Collections
        spaces,
        tenants,
        payments,
        bills,
        users,
        notifications,
        settings,
        loading,

        // Space operations
        addSpace,
        updateSpace,
        deleteSpace,

        // Tenant operations
        addTenant,
        updateTenant,
        deleteTenant,

        // Payment operations
        addPayment,
        updatePayment,
        deletePayment,

        // ADD:
        processLateFees,

        // Bill operations
        addBill,
        updateBill,
        deleteBill,

        // User operations
        addUser,
        updateUser,
        deleteUser,

        // Notification operations
        addNotification,
        updateNotification,
        deleteNotification,
        markNotificationAsRead,

        // Payment generation functions
        generatePaymentsForTenant,
        generatePaymentsForAllTenants,
        cleanupDuplicatePayments,

        // Utility functions
        getDashboardStats,
        generateReceiptNumber,
        updateSettings,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
