import { auth } from './config';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

export const useAuth = () => {
  const googleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return {
        user: result.user,
        error: null
      };
    } catch (error) {
      return {
        user: null,
        error: error.message
      };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  };

  return {
    googleSignIn,
    logout
  };
}; 