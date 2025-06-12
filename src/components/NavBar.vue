<template>
  <nav class="navbar">
    <div class="nav-auth">
      <template v-if="currentUser">
        <div class="user-info">
          <span class="user-name">{{ currentUser.displayName }}</span>
          <button @click="handleLogout" class="logout-btn">
            Logout
          </button>
        </div>
      </template>
      <LoginButton v-else />
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { auth } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import LoginButton from './LoginButton.vue';
import { useAuth } from '../firebase/auth';

const currentUser = ref(null);
const { logout } = useAuth();

const handleLogout = async () => {
  try {
    await logout();
  } catch (error) {
    console.error('Logout error:', error);
  }
};

let unsubscribe;
onMounted(() => {
  unsubscribe = onAuthStateChanged(auth, (user) => {
    currentUser.value = user;
  });
});

onUnmounted(() => {
  if (unsubscribe) unsubscribe();
});
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: flex-end;
  padding: 0.5rem 1rem;
}

.nav-auth {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-name {
  font-weight: 500;
  color: #2c3e50;
}

.logout-btn {
  padding: 0.5rem 1rem;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.2s;
}

.logout-btn:hover {
  background-color: #c82333;
}
</style> 