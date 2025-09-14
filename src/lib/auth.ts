import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

const provider = new GoogleAuthProvider();

export interface UserProfile {
  id: string;
  nickname: string;
  email: string;
  profileImage?: string;
  youtubeChannelUrl?: string;
  preferences: {
    genres: string[];
    notifications: {
      newWaves: boolean;
      comments: boolean;
      challenges: boolean;
    };
  };
  followers: number;
  following: number;
  createdAt: string;
  updatedAt: string;
}

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Check if user profile exists
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      // Create new user profile
      const newUser: UserProfile = {
        id: user.uid,
        nickname: user.displayName || '사용자',
        email: user.email || '',
        profileImage: user.photoURL || undefined,
        preferences: {
          genres: [],
          notifications: {
            newWaves: true,
            comments: true,
            challenges: true,
          },
        },
        followers: 0,
        following: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await setDoc(doc(db, 'users', user.uid), newUser);
    }
    
    return user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export const onAuthStateChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
  try {
    await setDoc(doc(db, 'users', userId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};
