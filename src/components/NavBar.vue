<template>
  <nav class="navbar">
    <div class="nav-brand">
      <!-- <img src="@/assets/logo.svg" alt="St Cecilia's Songbook" class="nav-logo" /> -->
      <!-- <span class="nav-title">St Cecilia's Songbook</span> -->
    </div>
    <div class="nav-auth">
      <template v-if="currentUser">
        <UserMenu 
          :is-mobile="isMobileView"
          @save="openSaveModal"
          @load="openLoadModal"
          @logout="handleLogout"
        />
      </template>
      <div v-else class="signin-container">
        <button @click="signInWithGoogle" class="google-signin-btn" :disabled="isSigningIn">
          <img src="@/assets/google-icon.svg" alt="Google" class="google-icon" />
          {{ isSigningIn ? 'Signing in...' : 'Sign in' }}
        </button>
        <p v-if="signInError" class="error-message">{{ signInError }}</p>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { auth } from '@/firebase';
import { onAuthStateChanged, type User, type Unsubscribe } from 'firebase/auth';
import UserMenu from './UserMenu.vue';
import { useCloudStore } from '@/stores/cloud';
import { useAuth } from '@/firebase/auth';

const currentUser = ref<User | null>(null);
const isMobileView = ref(false);
const isSigningIn = ref(false);
const signInError = ref('');

// Cloud store actions
const cloudStore = useCloudStore();
const { openSaveModal, openLoadModal } = cloudStore;

const updateMobileState = () => {
  isMobileView.value = window.innerWidth <= 768;
};

const signInWithGoogle = async () => {
  isSigningIn.value = true;
  signInError.value = '';
  
  try {
    const { googleSignIn } = useAuth();
    await googleSignIn();
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    
    // Provide specific error messages for different cases
    if (error.message && error.message.includes('Account authentication expired')) {
      signInError.value = 'Your Google account needs to be re-authenticated. Please try again.';
    } else if (error.message && error.message.includes('Network error')) {
      signInError.value = 'Network error. Please check your internet connection and try again.';
    } else {
      signInError.value = error.message || 'An unexpected error occurred during sign-in. Please try again.';
    }
  } finally {
    isSigningIn.value = false;
  }
};

const handleLogout = async () => {
  try {
    await auth.signOut();
  } catch (error) {
    console.error('Logout error:', error);
  }
};

let unsubscribe: Unsubscribe;
onMounted(() => {
  unsubscribe = onAuthStateChanged(auth, (user) => {
    currentUser.value = user;
  });
  
  updateMobileState();
  window.addEventListener('resize', updateMobileState);
});

onUnmounted(() => {
  if (unsubscribe) unsubscribe();
  window.removeEventListener('resize', updateMobileState);
});
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-logo {
  height: 32px;
  width: auto;
}

.nav-title {
  font-size: 1.25rem;
  font-weight: 500;
  color: #2c3e50;
}

.nav-auth {
  display: flex;
  align-items: center;
}

.google-signin-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  transition: background-color 0.2s;
}

.google-signin-btn:hover {
  background-color: #f8f9fa;
}

.google-icon {
  width: 18px;
  height: 18px;
}

.signin-container {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.error-message {
  color: #dc3545;
  font-size: 12px;
  margin: 0;
  max-width: 250px;
  text-align: right;
}

@media (max-width: 768px) {
  .nav-title {
    display: none;
  }
  
  .nav-logo {
    height: 28px;
  }
  
  .google-signin-btn {
    padding: 6px 12px;
  }
}
</style> 