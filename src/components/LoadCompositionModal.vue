<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Load Composition</h2>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>
      
      <div class="modal-body">
        <div class="tabs">
          <button 
            :class="{ active: activeTab === 'my' }" 
            @click="activeTab = 'my'"
          >My Compositions</button>
          <button 
            :class="{ active: activeTab === 'shared' }" 
            @click="activeTab = 'shared'"
          >Shared with Me</button>
          <button 
            :class="{ active: activeTab === 'public' }" 
            @click="activeTab = 'public'"
          >Public Compositions</button>
        </div>

        <div class="compositions-list" v-if="compositions.length > 0">
          <div v-for="comp in filteredCompositions" :key="comp.id" class="composition-item">
            <div class="composition-info">
              <h3>{{ comp.title }}</h3>
              <p class="author">By {{ comp.submittedByName || comp.submittedByEmail }}</p>
              <p class="date">{{ formatDate(comp.dateCreated) }}</p>
            </div>
            <div class="composition-actions">
              <button @click="loadComposition(comp)" class="load-btn">
                <i class="fas fa-cloud-download-alt"></i>
                Load
              </button>
              <button 
                v-if="canDelete(comp)" 
                @click="deleteComposition(comp.id)" 
                class="delete-btn"
              >
                <i class="fas fa-trash-alt"></i>
                Delete
              </button>
            </div>
          </div>
        </div>
        <div v-else class="no-compositions">
          No compositions found
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { auth, db } from '@/firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';

const emit = defineEmits(['close', 'load']);

const activeTab = ref('my');
const compositions = ref<any[]>([]);

const filteredCompositions = computed(() => {
  if (!auth.currentUser) return [];
  
  switch (activeTab.value) {
    case 'my':
      return compositions.value.filter(comp => comp.submittedByEmail === auth.currentUser?.email);
    case 'shared':
      return compositions.value.filter(comp => 
        comp.sharedWith?.includes(auth.currentUser?.email) && 
        comp.submittedByEmail !== auth.currentUser?.email
      );
    case 'public':
      return compositions.value.filter(comp => 
        comp.visibility === 'public' && 
        comp.submittedByEmail !== auth.currentUser?.email
      );
    default:
      return [];
  }
});

const loadCompositions = async () => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    // 1. Public compositions (readable by anyone)
    const publicQuery = query(
      collection(db, 'compositions'),
      where('visibility', '==', 'public')
    );

    // 2. Private compositions that belong to the current user
    const myPrivateQuery = query(
      collection(db, 'compositions'),
      where('visibility', '==', 'private'),
      where('submittedBy', '==', user.uid)
    );

    // 3. Compositions explicitly shared with the user (optional-best-effort)
    //    Requires a simple array of user emails in sharedWith. If you use a different
    //    structure, adjust accordingly or remove this block.
    let sharedDocs = [];
    try {
      const sharedQuery = query(
        collection(db, 'compositions'),
        where('visibility', '==', 'shared'),
        where('sharedWith', 'array-contains', user.email)
      );
      const sharedSnap = await getDocs(sharedQuery);
      sharedDocs = sharedSnap.docs;
    } catch (err) {
      // If the index for this query does not exist or rules don't allow it, just skip.
    }

    const [pubSnap, mySnap] = await Promise.all([
      getDocs(publicQuery),
      getDocs(myPrivateQuery)
    ]);

    const allDocs = [
      ...pubSnap.docs,
      ...mySnap.docs,
      ...sharedDocs
    ];

    compositions.value = allDocs.map(d => ({
      id: d.id,
      ...d.data()
    }));
  } catch (error) {
    console.error('Error loading compositions:', error);
  }
};

const loadComposition = (composition: any) => {
  emit('load', composition);
};

const canDelete = (composition: any) => {
  return composition.submittedByEmail === auth.currentUser?.email;
};

const deleteComposition = async (compositionId: string) => {
  if (!confirm('Are you sure you want to delete this composition?')) return;
  
  try {
    await deleteDoc(doc(db, 'compositions', compositionId));
    compositions.value = compositions.value.filter(comp => comp.id !== compositionId);
  } catch (error) {
    console.error('Error deleting composition:', error);
  }
};

const formatDate = (timestamp: any) => {
  if (!timestamp) return '';

  let date: Date | null = null;

  // Firestore Timestamp (has toDate())
  if (typeof timestamp === 'object' && typeof (timestamp as any).toDate === 'function') {
    date = (timestamp as any).toDate();
  }
  // Milliseconds since epoch (number) – what we save with Date.now()
  else if (typeof timestamp === 'number') {
    date = new Date(timestamp);
  }
  // Plain JS Date instance
  else if (timestamp instanceof Date) {
    date = timestamp;
  }
  // Firestore Timestamp-like object (seconds + nanoseconds) when coming from
  // JSON-serialised data
  else if (typeof timestamp === 'object' && 'seconds' in timestamp) {
    date = new Date((timestamp.seconds as number) * 1000);
  }

  if (!date) return '';

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

// Load compositions when component mounts
loadCompositions();
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 16px;
  overflow-y: auto;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
}

.tabs button {
  padding: 8px 16px;
  border: none;
  background: none;
  cursor: pointer;
  color: #666;
  font-weight: 500;
  border-radius: 4px;
}

.tabs button.active {
  background: #2196F3;
  color: white;
}

.compositions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.composition-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 6px;
  background: #f8f9fa;
}

.composition-info h3 {
  margin: 0 0 4px 0;
  font-size: 1.1rem;
  color: #333;
}

.author {
  margin: 0 0 2px 0;
  font-size: 0.9rem;
  color: #666;
}

.date {
  margin: 0;
  font-size: 0.8rem;
  color: #888;
}

.composition-actions {
  display: flex;
  gap: 8px;
}

.load-btn, .delete-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.load-btn {
  background: #2196F3;
  color: white;
}

.delete-btn {
  background: #dc3545;
  color: white;
}

.no-compositions {
  text-align: center;
  padding: 24px;
  color: #666;
}

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    max-height: 90vh;
  }
  
  .composition-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .composition-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style> 