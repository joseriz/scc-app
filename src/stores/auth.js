import { defineStore } from 'pinia';
import { ref } from 'vue';
import { auth } from '@/firebase';
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const loading = ref(true);
  const error = ref(null);

  const initialize = async () => {
    // Initializing auth store
    
    // Handle redirect result first
    try {
      // Checking for redirect result
      const result = await getRedirectResult(auth);
      
      if (result) {
        // Redirect result found
        user.value = result.user;
      } else {
        // No redirect result found
      }
    } catch (e) {
      // Error handling redirect result
      
      error.value = e.message;
      
      // Check if the error is related to web storage being unavailable
      if (e.code === 'auth/web-storage-unsupported') {
        error.value = 'Please enable third-party cookies in your browser settings to use Google Sign-In.';
      }
    }

    // Set up auth state listener
    onAuthStateChanged(auth, (firebaseUser) => {
      // Auth state changed
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