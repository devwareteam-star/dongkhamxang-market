import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  DocumentData,
  QueryConstraint
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './config';

// Storage Service Class for handling file uploads
export class StorageService {
  // Image compression utility
  static compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        // Set canvas size
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file); // Fallback to original
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  // Upload payment image with compression and progress
  static async uploadPaymentImage(
    file: File, 
    paymentId: string,
    onProgress?: (progress: number) => void
  ): Promise<{ downloadURL: string; path: string }> {
    try {
      console.log('Original file size:', (file.size / 1024).toFixed(1), 'KB');
      
      // Compress image if it's larger than 500KB
      let fileToUpload = file;
      if (file.size > 500 * 1024) {
        console.log('Compressing image...');
        fileToUpload = await this.compressImage(file, 1200, 0.8);
        console.log('Compressed file size:', (fileToUpload.size / 1024).toFixed(1), 'KB');
      }
      
      // Create unique filename
      const timestamp = Date.now();
      const fileExtension = fileToUpload.type.split('/')[1] || 'jpg';
      const fileName = `payment-${paymentId}-${timestamp}.${fileExtension}`;
      const path = `bulk-payments/${fileName}`;
      
      // Create storage reference
      const storageRef = ref(storage, path);
      
      // Upload with progress monitoring
      console.log('Starting upload...');
      const uploadTask = uploadBytes(storageRef, fileToUpload);
      
      // Monitor progress if callback provided
      if (onProgress) {
        // Simulate progress since uploadBytes doesn't provide real progress
        let progress = 0;
        const progressInterval = setInterval(() => {
          progress += 10;
          onProgress(progress);
          if (progress >= 90) {
            clearInterval(progressInterval);
          }
        }, 200);
        
        uploadTask.finally(() => {
          clearInterval(progressInterval);
          onProgress(100);
        });
      }
      
      const snapshot = await uploadTask;
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      console.log('Upload completed successfully');
      return { downloadURL, path };
    } catch (error) {
      console.error('Error uploading payment image:', error);
      throw new Error('Failed to upload payment image');
    }
  }

  // Upload bulk payment image with compression
  static async uploadBulkPaymentImage(
    file: File, 
    bulkId: string,
    onProgress?: (progress: number) => void
  ): Promise<{ downloadURL: string; path: string }> {
    try {
      console.log('Original bulk file size:', (file.size / 1024).toFixed(1), 'KB');
      
      // Compress image if it's larger than 500KB
      let fileToUpload = file;
      if (file.size > 500 * 1024) {
        console.log('Compressing bulk image...');
        fileToUpload = await this.compressImage(file, 1200, 0.8);
        console.log('Compressed bulk file size:', (fileToUpload.size / 1024).toFixed(1), 'KB');
      }
      
      const timestamp = Date.now();
      const fileExtension = fileToUpload.type.split('/')[1] || 'jpg';
      const fileName = `bulk-payment-${bulkId}-${timestamp}.${fileExtension}`;
      const path = `bulk-payments/${fileName}`;
      
      const storageRef = ref(storage, path);
      
      console.log('Starting bulk upload...');
      const uploadTask = uploadBytes(storageRef, fileToUpload);
      
      // Monitor progress
      if (onProgress) {
        let progress = 0;
        const progressInterval = setInterval(() => {
          progress += 10;
          onProgress(progress);
          if (progress >= 90) {
            clearInterval(progressInterval);
          }
        }, 200);
        
        uploadTask.finally(() => {
          clearInterval(progressInterval);
          onProgress(100);
        });
      }
      
      const snapshot = await uploadTask;
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      console.log('Bulk upload completed successfully');
      return { downloadURL, path };
    } catch (error) {
      console.error('Error uploading bulk payment image:', error);
      throw new Error('Failed to upload bulk payment image');
    }
  }

  // Delete payment image (unchanged)
  static async deletePaymentImage(imagePath: string): Promise<void> {
    try {
      const storageRef = ref(storage, imagePath);
      await deleteObject(storageRef);
      console.log('Payment image deleted successfully:', imagePath);
    } catch (error) {
      console.error('Error deleting payment image:', error);
      // Don't throw error here - image might already be deleted
    }
  }

  // Add this method to your StorageService class
static async uploadQRCodeImage(
  file: File, 
  qrId: string,
  onProgress?: (progress: number) => void
): Promise<{ downloadURL: string; path: string }> {
  try {
    console.log('Original QR file size:', (file.size / 1024).toFixed(1), 'KB');
    
    // Compress image if it's larger than 500KB
    let fileToUpload = file;
    if (file.size > 500 * 1024) {
      console.log('Compressing QR image...');
      fileToUpload = await this.compressImage(file, 800, 0.9); // Smaller size for QR, higher quality
      console.log('Compressed QR file size:', (fileToUpload.size / 1024).toFixed(1), 'KB');
    }
    
    const timestamp = Date.now();
    const fileExtension = fileToUpload.type.split('/')[1] || 'jpg';
    const fileName = `qr-code-${qrId}-${timestamp}.${fileExtension}`;
    const path = `qr-codes/${fileName}`; // Different folder for QR codes
    
    const storageRef = ref(storage, path);
    
    console.log('Starting QR upload...');
    const uploadTask = uploadBytes(storageRef, fileToUpload);
    
    // Monitor progress
    if (onProgress) {
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 10;
        onProgress(progress);
        if (progress >= 90) {
          clearInterval(progressInterval);
        }
      }, 200);
      
      uploadTask.finally(() => {
        clearInterval(progressInterval);
        onProgress(100);
      });
    }
    
    const snapshot = await uploadTask;
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('QR upload completed successfully');
    return { downloadURL, path };
  } catch (error) {
    console.error('Error uploading QR code image:', error);
    throw new Error('Failed to upload QR code image');
  }
}
}

// Generic CRUD operations for Firestore
export class FirestoreService {
  private collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  // Create a new document
  async create(data: any, customId?: string) {
    try {
      const cleanedData = this.cleanData(data);
      console.log(`Creating document in ${this.collectionName} with cleaned data:`, cleanedData);
      
      let docRef;
      let docId;
      
      if (customId) {
        docRef = doc(db, this.collectionName, customId);
        await setDoc(docRef, {
          ...cleanedData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        docId = customId;
      } else {
        docRef = await addDoc(collection(db, this.collectionName), {
          ...cleanedData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        docId = docRef.id;
      }
      
      // Preserve original data, don't overwrite custom IDs
      const newDoc = { 
        ...cleanedData,  // Keep original tenantId, spaceId, etc.
        id: docId        // Add Firebase document ID
      };
      console.log(`Created document in ${this.collectionName}:`, newDoc);
      return newDoc;
    } catch (error) {
      console.error(`Error creating document in ${this.collectionName}:`, error);
      throw error;
    }
  }

  // Clean data by removing undefined values (Firestore doesn't accept undefined)
  private cleanData(data: any): any {
    if (data === null || data === undefined) {
      return null;
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.cleanData(item));
    }
    
    if (typeof data === 'object' && data.constructor === Object) {
      const cleaned: any = {};
      
      Object.keys(data).forEach(key => {
        const value = data[key];
        if (value !== undefined) {
          cleaned[key] = this.cleanData(value);
        }
      });
      
      return cleaned;
    }
    
    return data;
  }

  // Read all documents
  async getAll(constraints: QueryConstraint[] = []) {
    try {
      const q = query(collection(db, this.collectionName), ...constraints);
      const querySnapshot = await getDocs(q);
      
      const docs = querySnapshot.docs.map(doc => ({
        ...doc.data(),  // Keep original data first
        id: doc.id      // Add Firebase document ID without overwriting
      }));
      console.log(`Retrieved ${docs.length} documents from ${this.collectionName}`);
      return docs;
    } catch (error) {
      console.error(`Error getting documents from ${this.collectionName}:`, error);
      throw error;
    }
  }

  // Read a single document by ID
  async getById(id: string) {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const docData = { 
          ...docSnap.data(),  // Keep original data first
          id: docSnap.id      // Add Firebase document ID
        };
        console.log(`Retrieved document from ${this.collectionName}:`, docData);
        return docData;
      } else {
        console.log(`Document not found in ${this.collectionName}:`, id);
        return null;
      }
    } catch (error) {
      console.error(`Error getting document from ${this.collectionName}:`, error);
      throw error;
    }
  }

  // Update a document
  async update(id: string, data: any) {
    try {
      const docRef = doc(db, this.collectionName, id);
      
      // Remove ID fields from update data to avoid conflicts
      const updateData = { ...data };
      delete updateData.id;
      delete updateData.tenantId;
      delete updateData.spaceId;
      delete updateData.contractId;
      delete updateData.paymentId;
      delete updateData.billId;
      delete updateData.userId;
      delete updateData.notificationId;
      
      // CLEAN DATA: Remove undefined values before sending to Firestore
      const cleanedData = this.cleanData(updateData);
      console.log(`Updating document in ${this.collectionName} with cleaned data:`, cleanedData);
      
      await updateDoc(docRef, {
        ...cleanedData,
        updatedAt: serverTimestamp()
      });
      
      const idField = this.getIdFieldName();
      const updatedDoc = { 
        [idField]: id, 
        ...cleanedData,
        id: id // Keep legacy id field
      };
      console.log(`Updated document in ${this.collectionName}:`, updatedDoc);
      return updatedDoc;
    } catch (error) {
      console.error(`Error updating document in ${this.collectionName}:`, error);
      throw error;
    }
  }

  // Delete a document
  async delete(id: string) {
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
      console.log(`Deleted document from ${this.collectionName}:`, id);
      return id;
    } catch (error) {
      console.error(`Error deleting document from ${this.collectionName}:`, error);
      throw error;
    }
  }

  // Query documents with conditions
  async query(constraints: QueryConstraint[]) {
    return this.getAll(constraints);
  }

  // Get the appropriate ID field name for each collection
  private getIdFieldName(): string {
    switch (this.collectionName) {
      case 'spaces':
        return 'spaceId';
      case 'tenants':
        return 'tenantId';
      case 'contracts':
        return 'contractId';
      case 'payments':
      case 'dailyPayments':
      case 'monthlyPayments':
      case 'yearlyPayments':
      case 'paidCollection':
        return 'paymentId';
      case 'bills':
        return 'billId';
      case 'users':
        return 'userId';
      case 'notifications':
        return 'notificationId';
      default:
        return 'id'; // Fallback for legacy collections
    }
  }

  // Helper method to get documents by tenant ID
  async getByTenantId(tenantId: string) {
    try {
      const q = query(
        collection(db, this.collectionName), 
        where('tenantId', '==', tenantId),
        orderBy('createdAt', 'desc')
      );
      return this.getAll([where('tenantId', '==', tenantId), orderBy('createdAt', 'desc')]);
    } catch (error) {
      console.error(`Error getting documents by tenantId from ${this.collectionName}:`, error);
      throw error;
    }
  }

  // Helper method to get documents by space ID
  async getBySpaceId(spaceId: string) {
    try {
      return this.getAll([where('spaceId', '==', spaceId), orderBy('createdAt', 'desc')]);
    } catch (error) {
      console.error(`Error getting documents by spaceId from ${this.collectionName}:`, error);
      throw error;
    }
  }

  // Helper method to get active contracts
  async getActiveContracts() {
    try {
      if (this.collectionName !== 'contracts') {
        throw new Error('getActiveContracts can only be called on contracts service');
      }
      return this.getAll([where('contractStatus', '==', 'ມີຜົນ'), orderBy('createdAt', 'desc')]);
    } catch (error) {
      console.error('Error getting active contracts:', error);
      throw error;
    }
  }

  // Helper method to get vacant spaces
  async getVacantSpaces() {
    try {
      if (this.collectionName !== 'spaces') {
        throw new Error('getVacantSpaces can only be called on spaces service');
      }
      return this.getAll([where('status', '==', 'ວ່າງ'), orderBy('createdAt', 'desc')]);
    } catch (error) {
      console.error('Error getting vacant spaces:', error);
      throw error;
    }
  }

  // Helper method to get pending payments (updated for all payment collections)
  async getPendingPayments() {
    try {
      const validCollections = ['payments', 'dailyPayments', 'monthlyPayments', 'yearlyPayments'];
      if (!validCollections.includes(this.collectionName)) {
        throw new Error('getPendingPayments can only be called on payment collections');
      }
      return this.getAll([where('paymentStatus', '==', 'ລໍຖ້າ'), orderBy('dueDate', 'asc')]);
    } catch (error) {
      console.error('Error getting pending payments:', error);
      throw error;
    }
  }

  // Helper method to get overdue payments (updated for all payment collections)
  async getOverduePayments() {
    try {
      const validCollections = ['payments', 'dailyPayments', 'monthlyPayments', 'yearlyPayments'];
      if (!validCollections.includes(this.collectionName)) {
        throw new Error('getOverduePayments can only be called on payment collections');
      }
      return this.getAll([where('paymentStatus', '==', 'ເກີນກຳນົດ'), orderBy('dueDate', 'asc')]);
    } catch (error) {
      console.error('Error getting overdue payments:', error);
      throw error;
    }
  }

  // Helper method to get payments by period (for payment collections)
  async getPaymentsByPeriod(period: string) {
    try {
      const validCollections = ['payments', 'dailyPayments', 'monthlyPayments', 'yearlyPayments'];
      if (!validCollections.includes(this.collectionName)) {
        throw new Error('getPaymentsByPeriod can only be called on payment collections');
      }
      return this.getAll([where('paymentPeriod', '==', period), orderBy('dueDate', 'asc')]);
    } catch (error) {
      console.error('Error getting payments by period:', error);
      throw error;
    }
  }

  // Helper method to get payments by frequency (for payment collections)
  async getPaymentsByFrequency(frequency: 'daily' | 'monthly' | 'yearly') {
    try {
      const validCollections = ['payments', 'dailyPayments', 'monthlyPayments', 'yearlyPayments'];
      if (!validCollections.includes(this.collectionName)) {
        throw new Error('getPaymentsByFrequency can only be called on payment collections');
      }
      return this.getAll([where('paymentFrequency', '==', frequency), orderBy('dueDate', 'asc')]);
    } catch (error) {
      console.error('Error getting payments by frequency:', error);
      throw error;
    }
  }
}

// Updated services for the new Firestore schema
export const spacesService = new FirestoreService('spaces');           // Changed from roomsService
export const tenantsService = new FirestoreService('tenants');
export const contractsService = new FirestoreService('contracts');     // NEW
export const paymentsService = new FirestoreService('payments');       // Original payments collection

// NEW: Three separate payment collections based on frequency
export const dailyPaymentsService = new FirestoreService('dailyPayments');
export const monthlyPaymentsService = new FirestoreService('monthlyPayments');
export const yearlyPaymentsService = new FirestoreService('yearlyPayments');
export const paidCollectionService = new FirestoreService('paidCollection');

export const billsService = new FirestoreService('bills');             // NEW - Changed from receiptsService
export const usersService = new FirestoreService('users');
export const notificationsService = new FirestoreService('notifications');

// Legacy services for backward compatibility (can be removed once migration is complete)
export const roomsService = spacesService;  // Alias for backward compatibility
export const receiptsService = billsService; // Alias for backward compatibility