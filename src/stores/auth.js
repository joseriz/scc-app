import { defineStore } from 'pinia';
import { ref } from 'vue';
import { auth } from '@/firebase';
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth';
import { logger } from '@/utils/logger';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const loading = ref(true);
  const error = ref(null);

  const initialize = async () => {
    logger.info('Initializing auth store...');
    
    // Handle redirect result first
    try {
      logger.info('Checking for redirect result...');
      const result = await getRedirectResult(auth);
      
      if (result) {
        logger.info('Redirect result found', {
          email: result.user?.email,
          uid: result.user?.uid
        });
        user.value = result.user;
      } else {
        logger.info('No redirect result found');
      }
    } catch (e) {
      logger.error('Error handling redirect result', {
        code: e.code,
        message: e.message,
        stack: e.stack
      });
      
      error.value = e.message;
      
      // Check if the error is related to web storage being unavailable
      if (e.code === 'auth/web-storage-unsupported') {
        error.value = 'Please enable third-party cookies in your browser settings to use Google Sign-In.';
      }
    }

    // Set up auth state listener
    onAuthStateChanged(auth, (firebaseUser) => {
      logger.info('Auth state changed', {
        isAuthenticated: !!firebaseUser,
        email: firebaseUser?.email,
        uid: firebaseUser?.uid
      });
      user.value = firebaseUser;
      loading.value = false;
    });
  };

  const isAuthenticated = () => !!user.value;

  return {
    user,
    loading,
    error,
    initialize,
    isAuthenticated
  };
});

export function useAuth() {
  return {
    user
  };
} 