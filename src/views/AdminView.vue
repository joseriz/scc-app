<template>
  <div class="admin-view">
    <h1>Admin Dashboard</h1>
    
    <div v-if="!isAdmin" class="unauthorized">
      <p>You must be an administrator to access this page.</p>
    </div>
    
    <div v-else>
      <section class="admin-section">
        <h2>Legacy Data Migration</h2>
        <LegacyDataMigration />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { auth } from '@/firebase';
import LegacyDataMigration from '@/components/LegacyDataMigration.vue';

// List of admin email addresses
const ADMIN_EMAILS = [
  'joserizc@gmail.com'
  // Add your admin email addresses here
];

const isAdmin = ref(false);

onMounted(() => {
  // Check if current user is an admin
  const unsubscribe = auth.onAuthStateChanged((user) => {
    isAdmin.value = user ? ADMIN_EMAILS.includes(user.email || '') : false;
  });

  // Cleanup on unmount
  return () => unsubscribe();
});
</script>

<style scoped>
.admin-view {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.unauthorized {
  text-align: center;
  padding: 40px;
  background: #f5f5f5;
  border-radius: 4px;
}

.admin-section {
  margin: 20px 0;
  padding: 20px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style> 