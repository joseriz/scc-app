<template>
  <div class="cloud-compositions-browser">
    <div class="tabs">
      <button 
        :class="{ active: activeTab === 'my' }" 
        @click="activeTab = 'my'"
      >
        My Compositions
      </button>
      <button 
        :class="{ active: activeTab === 'shared' }" 
        @click="activeTab = 'shared'"
      >
        Shared with Me
      </button>
      <button 
        :class="{ active: activeTab === 'public' }" 
        @click="activeTab = 'public'"
      >
        Public Compositions
      </button>
    </div>

    <div class="compositions-list">
      <div v-if="loading" class="loading">
        Loading compositions...
      </div>
      <div v-else-if="error" class="error">
        {{ error }}
      </div>
      <div v-else-if="compositions.length === 0" class="no-compositions">
        No compositions found in this category.
      </div>
      <div v-else class="compositions-grid">
        <div v-for="comp in compositions" :key="comp.id" class="composition-card">
          <div class="composition-info">
            <h3>{{ comp.name }}</h3>
            <p class="author">By {{ comp.author || 'Anonymous' }}</p>
            <p class="details">
              <span>Created: {{ formatDate(comp.dateCreated) }}</span>
              <span>Modified: {{ formatDate(comp.lastModified) }}</span>
            </p>
            <p v-if="comp.arrangedBy" class="arranged-by">
              Arranged by: {{ comp.arrangedBy }}
            </p>
          </div>
          <div class="composition-actions">
            <button @click="loadComposition(comp)" class="load-btn">Load</button>
            <button 
              v-if="canEdit(comp)" 
              @click="deleteComposition(comp.id)" 
              class="delete-btn"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { db, auth } from '@/firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';

const activeTab = ref('my');
const compositions = ref([]);
const loading = ref(false);
const error = ref('');

// Format date helper
const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString();
};

// Check if user can edit a composition
const canEdit = (composition: any) => {
  const currentUser = auth.currentUser;
  if (!currentUser) return false;
  
  // User can edit if they are the owner
  if (composition.submittedBy === currentUser.uid) return true;
  
  // User can edit if they have write permission in sharedWith
  if (composition.sharedWith) {
    return composition.sharedWith.some(
      (share: any) => share.email === currentUser.email && share.permission === 'write'
    );
  }
  
  return false;
};

// Load compositions based on active tab
const loadCompositions = async () => {
  loading.value = true;
  error.value = '';
  compositions.value = [];
  
  try {
    const currentUser = auth.currentUser;
    if (!currentUser && activeTab.value !== 'public') {
      throw new Error('Please log in to view compositions');
    }

    let q;
    switch (activeTab.value) {
      case 'my':
        q = query(
          collection(db, 'compositions'),
          where('submittedBy', '==', currentUser?.uid)
        );
        break;
      case 'shared':
        q = query(
          collection(db, 'compositions'),
          where('sharedWith', 'array-contains', { 
            email: currentUser?.email, 
            permission: ['read', 'write'] 
          })
        );
        break;
      case 'public':
        q = query(
          collection(db, 'compositions'),
          where('visibility', '==', 'public')
        );
        break;
    }

    const querySnapshot = await getDocs(q);
    compositions.value = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (err: any) {
    error.value = err.message;
    console.error('Error loading compositions:', err);
  } finally {
    loading.value = false;
  }
};

// Delete a composition
const deleteComposition = async (compositionId: string) => {
  if (!confirm('Are you sure you want to delete this composition?')) return;
  
  try {
    await deleteDoc(doc(db, 'compositions', compositionId));
    await loadCompositions(); // Reload the list
  } catch (err: any) {
    error.value = 'Failed to delete composition: ' + err.message;
    console.error('Error deleting composition:', err);
  }
};

// Emit the loaded composition to parent
const emit = defineEmits(['load-composition']);

const loadComposition = (composition: any) => {
  emit('load-composition', composition);
};

// Watch for tab changes
watch(activeTab, () => {
  loadCompositions();
});

// Initial load
onMounted(() => {
  loadCompositions();
});
</script>

<style scoped>
.cloud-compositions-browser {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.tabs button {
  padding: 10px 20px;
  border: none;
  background: #f0f0f0;
  cursor: pointer;
  border-radius: 4px;
  font-size: 1rem;
}

.tabs button.active {
  background: #007bff;
  color: white;
}

.compositions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.composition-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.composition-info h3 {
  margin: 0 0 10px 0;
  font-size: 1.2rem;
}

.author {
  color: #666;
  margin: 5px 0;
}

.details {
  font-size: 0.9rem;
  color: #888;
  display: flex;
  gap: 15px;
}

.composition-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.load-btn, .delete-btn {
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.load-btn {
  background: #28a745;
  color: white;
}

.delete-btn {
  background: #dc3545;
  color: white;
}

.loading, .error, .no-compositions {
  text-align: center;
  padding: 20px;
  color: #666;
}

.error {
  color: #dc3545;
}
</style> 