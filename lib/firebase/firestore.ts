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
import { db } from './config';

// Generic CRUD operations for Firestore
export class FirestoreService {
  private collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  // Create a new document
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
    
    // ✅ FIXED: Preserve original data, don't overwrite custom IDs
    const newDoc = { 
      ...cleanedData,  // Keep original tenantId, spaceId, etc.
      id: docId        // Add Firebase document ID
    };
    console.log(`✅ Created document in ${this.collectionName}:`, newDoc);
    return newDoc;
  } catch (error) {
    console.error(`❌ Error creating document in ${this.collectionName}:`, error);
    throw error;
  }
}

// ADD THIS NEW HELPER METHOD:
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
      ...doc.data(),  // ✅ FIXED: Keep original data first
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
        ...docSnap.data(),  // ✅ FIXED: Keep original data first
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
    console.log(`✅ Updated document in ${this.collectionName}:`, updatedDoc);
    return updatedDoc;
  } catch (error) {
    console.error(`❌ Error updating document in ${this.collectionName}:`, error);
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

  // Helper method to get pending payments
  async getPendingPayments() {
    try {
      if (this.collectionName !== 'payments') {
        throw new Error('getPendingPayments can only be called on payments service');
      }
      return this.getAll([where('paymentStatus', '==', 'ລໍຖ້າ'), orderBy('dueDate', 'asc')]);
    } catch (error) {
      console.error('Error getting pending payments:', error);
      throw error;
    }
  }

  // Helper method to get overdue payments
  async getOverduePayments() {
    try {
      if (this.collectionName !== 'payments') {
        throw new Error('getOverduePayments can only be called on payments service');
      }
      return this.getAll([where('paymentStatus', '==', 'ເກີນກຳນົດ'), orderBy('dueDate', 'asc')]);
    } catch (error) {
      console.error('Error getting overdue payments:', error);
      throw error;
    }
  }
}

// Updated services for the new Firestore schema
export const spacesService = new FirestoreService('spaces');           // Changed from roomsService
export const tenantsService = new FirestoreService('tenants');
export const contractsService = new FirestoreService('contracts');     // NEW
export const paymentsService = new FirestoreService('payments');
export const billsService = new FirestoreService('bills');             // NEW - Changed from receiptsService
export const usersService = new FirestoreService('users');
export const notificationsService = new FirestoreService('notifications');

// Legacy services for backward compatibility (can be removed once migration is complete)
export const roomsService = spacesService;  // Alias for backward compatibility
export const receiptsService = billsService; // Alias for backward compatibility