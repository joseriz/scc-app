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
      <button v-else @click="signInWithGoogle" class="google-signin-btn">
        <img src="@/assets/google-icon.svg" alt="Google" class="google-icon" />
        Sign in
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { auth } from '@/firebase';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import UserMenu from './UserMenu.vue';
import { useCloudStore } from '@/stores/cloud';

const currentUser = ref(null);
const isMobileView = ref(false);

// Cloud store actions
const cloudStore = useCloudStore();
const { openSaveModal, openLoadModal } = cloudStore;

const updateMobileState = () => {
  isMobileView.value = window.innerWidth <= 768;
};

const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error('Error signing in with Google:', error);
  }
};

const handleLogout = async () => {
  try {
    await auth.signOut();
  } catch (error) {
    console.error('Logout error:', error);
  }
};

let unsubscribe;
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