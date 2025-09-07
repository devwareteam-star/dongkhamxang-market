import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { auth } from './config';
import { usersService } from './firestore';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role?: 'manager' | 'employee';
}

// Sign in with email and password
export const signIn = async (email: string, password: string) => {
  try {
    console.log('Attempting Firebase sign in for:', email);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('Firebase sign in successful:', userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    // Silently fail for demo fallback - only log unexpected errors
    if (error instanceof Error && !error.message.includes('auth/invalid-credential')) {
      console.error('Firebase sign in error:', error);
    }
    throw error;
  }
};

// Create new user account
export const signUp = async (email: string, password: string, displayName: string, role: 'manager' | 'employee' = 'employee') => {
  try {
    console.log('Creating new Firebase user:', email);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update profile
    await updateProfile(user, { displayName });
    
    // Save user data to Firestore
    await usersService.create({
      uid: user.uid,
      email: user.email,
      displayName,
      role,
      isActive: true
    }, user.uid); // Use Firebase UID as document ID
    
    console.log('Firebase user created successfully:', user.uid);
    return user;
  } catch (error) {
    console.error('Firebase user creation error:', error);
    throw error;
  }
};

// Sign out
export const signOutUser = async () => {
  try {
    console.log('Signing out from Firebase');
    await signOut(auth);
    console.log('Firebase sign out successful');
  } catch (error) {
    console.error('Firebase sign out error:', error);
    throw error;
  }
};

// Listen to auth state changes
export const onAuthStateChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Get current user
export const getCurrentUser = () => {
  return auth.currentUser;
};