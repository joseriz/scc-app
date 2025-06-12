import { defineStore } from 'pinia';
import { ref } from 'vue';
import { auth } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const loading = ref(true);

  const initialize = () => {
    onAuthStateChanged(auth, (firebaseUser) => {
      user.value = firebaseUser;
      loading.value = false;
    });
  };

  const isAuthenticated = () => !!user.value;

  return {
    user,
    loading,
    initialize,
    isAuthenticated
  };
});

export function useAuth() {
  return {
    user
  };
} 