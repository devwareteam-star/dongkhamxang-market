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
  async create(data: any, customId?: string) {
    try {
      let docRef;
      let docId;
      
      if (customId) {
        // Use custom ID (for users with Firebase UID)
        docRef = doc(db, this.collectionName, customId);
        await setDoc(docRef, {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        docId = customId;
      } else {
        // Auto-generate ID
        docRef = await addDoc(collection(db, this.collectionName), {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        docId = docRef.id;
      }
      
      const newDoc = { id: docId, ...data };
      console.log(`Created document in ${this.collectionName}:`, newDoc);
      return newDoc;
    } catch (error) {
      console.error(`Error creating document in ${this.collectionName}:`, error);
      throw error;
    }
  }

  // Read all documents
  async getAll(constraints: QueryConstraint[] = []) {
    try {
      const q = query(collection(db, this.collectionName), ...constraints);
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
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
        const docData = { id: docSnap.id, ...docSnap.data() };
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
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      const updatedDoc = { id, ...data };
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
}

// Specific services for each collection
export const roomsService = new FirestoreService('rooms');
export const tenantsService = new FirestoreService('tenants');
export const paymentsService = new FirestoreService('payments');
export const receiptsService = new FirestoreService('receipts');
export const usersService = new FirestoreService('users');
export const notificationsService = new FirestoreService('notifications');