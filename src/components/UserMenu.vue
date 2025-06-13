<template>
  <div class="user-menu" :class="{ 'is-mobile': isMobile }">
    <div class="avatar" @click="toggleMenu" ref="avatarRef">
      <img v-if="!hasImageError && userPhotoURL" :src="userPhotoURL" alt="User avatar" class="avatar-image" @error="onImageError" />
      <div v-else class="avatar-initials">
        {{ userInitials }}
      </div>
      <span class="user-name">{{ displayName }}</span>
    </div>

    <div v-if="isMenuOpen" class="menu-dropdown" :style="dropdownPosition">
      <div class="menu-items">
        <button @click="$emit('save')" class="menu-item">
          <i class="fas fa-cloud-upload-alt"></i>
          Save to Cloud
        </button>
        <button @click="$emit('load')" class="menu-item">
          <i class="fas fa-cloud-download-alt"></i>
          Load from Cloud
        </button>
        <div class="menu-divider"></div>
        <router-link 
          v-if="isAdmin"
          to="/admin" 
          class="menu-item admin"
          @click="isMenuOpen = false"
        >
          <i class="fas fa-shield-alt"></i>
          Admin Dashboard
        </router-link>
        <div v-if="isAdmin" class="menu-divider"></div>
        <button @click="handleLogout" class="menu-item logout">
          <i class="fas fa-sign-out-alt"></i>
          Logout
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { auth } from '@/firebase';
import { signOut } from 'firebase/auth';

const props = defineProps<{
  isMobile?: boolean;
}>();

const emit = defineEmits(['save', 'load', 'logout']);

const isMenuOpen = ref(false);
const avatarRef = ref<HTMLElement | null>(null);
const dropdownPosition = ref({});

// List of admin email addresses
const ADMIN_EMAILS = [
  'joserizc@gmail.com'
  // Add your admin email addresses here
];

// Check if current user is admin
const isAdmin = computed(() => {
  const user = auth.currentUser;
  return user ? ADMIN_EMAILS.includes(user.email || '') : false;
});

const userPhotoURL = computed(() => {
  const user: any = auth.currentUser;
  if (!user) return '';

  // 1. Standard field
  if (user.photoURL) return user.photoURL;

  // 2. Some Google responses may use photoUrl (lower-case L)
  if (user.photoUrl) return user.photoUrl;

  // 3. Check providerData array
  const providerPhoto = user.providerData?.find((p: any) => !!p.photoURL)?.photoURL;
  return providerPhoto || '';
});
const hasImageError = ref(false);
const displayName = computed(() => auth.currentUser?.displayName || auth.currentUser?.email || 'User');
const userInitials = computed(() => {
  const name = displayName.value;
  if (!name) return 'U';
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
});

const onImageError = () => {
  hasImageError.value = true;
};

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
  if (isMenuOpen.value) {
    updateDropdownPosition();
  }
};

const updateDropdownPosition = () => {
  if (!avatarRef.value) return;
  
  const rect = avatarRef.value.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  
  if (spaceBelow < 200 && spaceAbove > spaceBelow) {
    // Position above if there's more space above
    dropdownPosition.value = {
      bottom: `${window.innerHeight - rect.top}px`,
      left: `${rect.left}px`
    };
  } else {
    // Position below by default
    dropdownPosition.value = {
      top: `${rect.bottom}px`,
      left: `${rect.left}px`
    };
  }
};

const handleClickOutside = (event: MouseEvent) => {
  if (avatarRef.value && !avatarRef.value.contains(event.target as Node)) {
    isMenuOpen.value = false;
  }
};

const handleLogout = async () => {
  try {
    await signOut(auth);
    emit('logout');
    isMenuOpen.value = false;
  } catch (error) {
    console.error('Error signing out:', error);
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('resize', updateDropdownPosition);
  // Reset error flag when user changes (e.g., after sign-out / sign-in)
  watch(
    () => auth.currentUser?.photoURL,
    () => {
      hasImageError.value = false;
    }
  );
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('resize', updateDropdownPosition);
});
</script>

<style scoped>
.user-menu {
  position: relative;
  z-index: 1000;
}

.avatar {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.1);
  transition: background-color 0.2s;
}

.avatar:hover {
  background: rgba(255, 255, 255, 0.2);
}

.avatar-image {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-initials {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #2196F3;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
}

.user-name {
  color: #333;
  font-size: 14px;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-dropdown {
  position: fixed;
  min-width: 200px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.menu-items {
  padding: 8px 0;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 16px;
  border: none;
  background: none;
  color: #333;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s;
}

.menu-item:hover {
  background: #f5f5f5;
}

.menu-item i {
  width: 16px;
  color: #666;
}

.menu-divider {
  height: 1px;
  background: #eee;
  margin: 8px 0;
}

.logout {
  color: #dc3545;
}

.logout i {
  color: #dc3545;
}

/* Mobile styles */
.is-mobile .avatar {
  padding: 4px;
}

.is-mobile .user-name {
  display: none;
}

.is-mobile .menu-dropdown {
  position: fixed;
  top: auto !important;
  bottom: 0;
  left: 0 !important;
  right: 0;
  width: 100%;
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.is-mobile .menu-items {
  padding: 16px;
}

.is-mobile .menu-item {
  padding: 12px 16px;
  font-size: 16px;
}

@media (max-width: 768px) {
  .user-menu:not(.is-mobile) .user-name {
    display: none;
  }
}

.admin {
  color: #2196F3;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 8px;
}

.admin:hover {
  background-color: #E3F2FD;
}
</style> 