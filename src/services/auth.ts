import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  User
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { UserProfile, UserRole } from '../types';

const ADMIN_EMAILS = [
  'jameswalter695@gmail.com',
  'contact@mrsb.com',
  'admin@mrsb.com'
];

export class AuthService {
  static async syncUserProfile(firebaseUser: User, desiredRole?: UserRole, desiredName?: string): Promise<UserProfile> {
    const userRef = doc(db, 'users', firebaseUser.uid);
    let role: UserRole = 'caisse';
    let nom = desiredName || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Utilisateur';

    const email = firebaseUser.email || '';
    const isExplicitAdmin = ADMIN_EMAILS.includes(email.toLowerCase());

    try {
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        role = isExplicitAdmin ? 'admin' : (data.role || desiredRole || 'caisse');
        nom = data.nom || nom;
      } else {
        role = isExplicitAdmin ? 'admin' : (desiredRole || 'caisse');
        await setDoc(userRef, {
          uid: firebaseUser.uid,
          nom,
          email,
          role,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        });
      }
    } catch (err) {
      console.warn('Firestore user sync fallback:', err);
      if (isExplicitAdmin) role = 'admin';
      else if (desiredRole) role = desiredRole;
    }

    return {
      uid: firebaseUser.uid,
      nom,
      email,
      role,
      createdAt: new Date().toISOString()
    };
  }

  static async loginWithEmail(email: string, pass: string): Promise<UserProfile> {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
    return await AuthService.syncUserProfile(cred.user);
  }

  static async registerWithEmail(email: string, pass: string, nom: string, role: UserRole): Promise<UserProfile> {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    return await AuthService.syncUserProfile(cred.user, role, nom);
  }

  static async loginWithGoogle(): Promise<UserProfile> {
    const cred = await signInWithPopup(auth, googleProvider);
    return await AuthService.syncUserProfile(cred.user);
  }

  static async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('SignOut warning:', e);
    }
  }

  static async sendResetEmail(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email.trim());
  }

  static subscribeToAuth(callback: (user: UserProfile | null) => void): () => void {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await AuthService.syncUserProfile(firebaseUser);
          callback(profile);
        } catch (e) {
          console.warn('Error resolving profile on auth change:', e);
          callback(null);
        }
      } else {
        callback(null);
      }
    });

    return unsubscribe;
  }
}
