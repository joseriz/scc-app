<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Load Composition</h2>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>
      
      <!-- Currently loaded composition info -->
      <div v-if="currentComposition" class="current-composition-card">
        <h3>Currently Loaded Composition</h3>
        <p class="title">{{ currentComposition.name }}</p>
        <p class="meta">
          <span>Last modified: {{ formatDate(currentComposition.lastModified) }}</span>
          <span>Visibility: {{ currentComposition.visibility }}</span>
        </p>
        <button class="quick-save-btn" @click="$emit('saveCurrent')">
          <i class="fas fa-save"></i>
          Save Changes
        </button>
      </div>

      <div class="search-bar">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by title, author, arranged by, or posted by..."
        />
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

        <div class="compositions-list" v-if="filteredCompositions.length > 0">
          <div v-if="isLoadingCompositions" class="loading-overlay">
            <div class="loading-spinner"></div>
            <p>Loading compositions...</p>
          </div>
          <div v-for="comp in filteredCompositions" :key="comp.docId" class="composition-item">
            <!-- Display mode -->
            <template v-if="editingCompositionId !== comp.docId">
              <div class="composition-info">
                <h3 class="comp-title">{{ comp.name }}</h3>
                <p class="author">Posted By {{ comp.submittedByName || comp.submittedByEmail }}</p>
                <p v-if="comp.author" class="author">Author: {{ comp.author }}</p>
                <p v-if="comp.arrangedBy" class="author">Arranged By: {{ comp.arrangedBy }}</p>
                <p class="details">
                  <span>Created: {{ formatDate(comp.dateCreated) }}</span>
                  <span>Modified: {{ formatDate(comp.lastModified) }}</span>
                </p>
                <!-- <p class="details">
                  <span>Key: {{ comp.keySignature || 'N/A' }}</span>
                  <span>Time: {{ comp.timeSignature || 'N/A' }}</span>
                  <span>Tempo: {{ comp.tempo || 'N/A' }} BPM</span>
                </p> -->
                <p class="visibility">Visibility: {{ comp.visibility }}</p>
              </div>
              <div class="composition-actions">
                <button @click="loadComposition(comp)" class="load-btn" :disabled="isLoadingComposition">
                  <div v-if="isLoadingComposition" class="button-spinner"></div>
                  <i class="fas fa-cloud-download-alt"></i>
                  {{ isLoadingComposition ? 'Loading...' : 'Load' }}
                </button>
                <button v-if="canDelete(comp)" @click="startEdit(comp)" class="edit-btn" :disabled="isLoadingComposition">
                  <i class="fas fa-edit"></i>
                  Edit
                </button>
                <button 
                  v-if="canDelete(comp)" 
                  @click="deleteComposition(comp.docId)" 
                  class="delete-btn"
                  :disabled="isLoadingComposition"
                >
                  <i class="fas fa-trash-alt"></i>
                  Delete
                </button>
              </div>
            </template>

            <!-- Edit mode -->
            <template v-else>
              <div class="edit-form">
                <div class="form-group">
                  <label>Title</label>
                  <input type="text" v-model="editForm.title" />
                </div>
                <div class="form-group">
                  <label>Author</label>
                  <input type="text" v-model="editForm.author" />
                </div>
                <div class="form-group">
                  <label>Arranged By</label>
                  <input type="text" v-model="editForm.arrangedBy" />
                </div>
                <div class="form-group">
                  <label>Visibility</label>
                  <select v-model="editForm.visibility">
                    <option value="private">Private</option>
                    <option value="public">Public</option>
                    <option value="shared">Shared</option>
                  </select>
                </div>
                <div class="edit-actions">
                  <button @click="saveEdit(comp.docId)" class="save-edit-btn" :disabled="isLoadingComposition">Save</button>
                  <button @click="cancelEdit" class="cancel-edit-btn">Cancel</button>
                </div>
              </div>
            </template>
          </div>
        </div>
        <div v-else-if="!isLoadingCompositions" class="no-compositions">
          No compositions found
        </div>
        <div v-else class="loading-compositions">
          <div class="loading-spinner"></div>
          <p>Loading compositions...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { auth, db, nativeFirestore } from '@/firebase';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';

const props = defineProps<{ currentComposition?: any }>();

const emit = defineEmits(['close', 'load', 'saveCurrent']);

const activeTab = ref('my');
const compositions = ref<any[]>([]);
const isLoadingCompositions = ref(false);
const isLoadingComposition = ref(false);

// Inline editing state
const editingCompositionId = ref<string | null>(null);
const editForm = ref<{ title: string; author?: string; arrangedBy?: string; visibility: 'public' | 'private' | 'shared'; }>({
  title: '',
  author: '',
  arrangedBy: '',
  visibility: 'private'
});

const searchQuery = ref('');

const startEdit = (comp: any) => {
  editingCompositionId.value = comp.docId;
  editForm.value = {
    title: comp.name,
    author: comp.author || '',
    arrangedBy: comp.arrangedBy || '',
    visibility: comp.visibility || 'private'
  };
};

const cancelEdit = () => {
  editingCompositionId.value = null;
};

const saveEdit = async (compId: string) => {
  try {
    const target = compositions.value.find(c => c.docId === compId);
    const sharedEmails = Array.isArray(target?.sharedWith)
      ? (target!.sharedWith as any[]).map((s: any) => s.email)
      : target?.sharedWithEmails || [];
    
    const updateData = {
      name: editForm.value.title,
      author: editForm.value.author,
      arrangedBy: editForm.value.arrangedBy,
      visibility: editForm.value.visibility,
      sharedWithEmails: sharedEmails,
      lastModified: Date.now(),
      modifiedBy: auth.currentUser?.uid || null,
      modifiedByEmail: auth.currentUser?.email || null,
      modifiedByName: auth.currentUser?.displayName || null
    };
    
    if (nativeFirestore) {
      await nativeFirestore.updateComposition('compositions', compId, updateData);
    } else {
      await updateDoc(doc(db, 'compositions', compId), updateData);
    }
    // Refresh list
    await loadCompositions();
    editingCompositionId.value = null;
  } catch (err: any) {
    alert('Failed to update composition: ' + err.message);
    console.error('Update error:', err);
  }
};

const filteredCompositions = computed(() => {
  let comps = [];
  if (activeTab.value === 'my') {
    comps = compositions.value.slice();
  } else if (activeTab.value === 'shared') {
    const userEmail = auth.currentUser?.email;
    comps = compositions.value.filter(comp => Array.isArray(comp.sharedWith) && comp.sharedWith.some((entry: any) => entry.email === userEmail));
  } else {
    comps = compositions.value.slice();
  }
  // Always sort alphabetically by title (name)
  comps.sort((a, b) => {
    const nameA = (a.name || '').toLowerCase();
    const nameB = (b.name || '').toLowerCase();
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return 0;
  });
  if (!searchQuery.value.trim()) return comps;
  const q = searchQuery.value.trim().toLowerCase();
  return comps
    .filter(comp => {
      return (
        (comp.name && comp.name.toLowerCase().includes(q)) ||
        (comp.author && comp.author.toLowerCase().includes(q)) ||
        (comp.arrangedBy && comp.arrangedBy.toLowerCase().includes(q)) ||
        (comp.submittedByName && comp.submittedByName.toLowerCase().includes(q)) ||
        (comp.submittedByEmail && comp.submittedByEmail.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      return 0;
    });
});

const loadCompositions = async () => {
  const user = auth.currentUser;
  if (!user && activeTab.value !== 'public') return;

  compositions.value = [];
  isLoadingCompositions.value = true;

  try {
    // Use native wrapper if available (Android/iOS), otherwise use regular Firestore
    if (nativeFirestore) {
      console.log('[LoadCompositions] Using native Firestore wrapper');
      let filters: any[] = [];
      
      switch (activeTab.value) {
        case 'my':
          filters = [{ field: 'submittedBy', value: user!.uid }];
          break;
        case 'shared':
          filters = [{ field: 'sharedWithEmails', value: user!.email }];
          break;
        case 'public':
          filters = [{ field: 'visibility', value: 'public' }];
          break;
      }
      
      compositions.value = await nativeFirestore.getCompositions('compositions', filters);
    } else {
      // Web platform - use regular Firestore
      console.log('[LoadCompositions] Using web Firestore');
      let q;
      switch (activeTab.value) {
        case 'my':
          q = query(collection(db, 'compositions'), where('submittedBy', '==', user!.uid));
          break;
        case 'shared':
          q = query(collection(db, 'compositions'), where('sharedWithEmails', 'array-contains', user!.email));
          break;
        case 'public':
          q = query(collection(db, 'compositions'), where('visibility', '==', 'public'));
          break;
      }

      if (q) {
        const snap = await getDocs(q);
        compositions.value = snap.docs.map(d => ({ docId: d.id, ...(d.data() as any) }));
      }
    }
  } catch (error) {
    console.error('Error loading compositions:', error);
  } finally {
    isLoadingCompositions.value = false;
  }
};

const loadComposition = (composition: any) => {
  isLoadingComposition.value = true;
  // Add a small delay to show the loading state
  setTimeout(() => {
    isLoadingComposition.value = false;
    emit('load', composition);
  }, 100);
};

const canDelete = (composition: any) => {
  return composition.submittedBy === auth.currentUser?.uid;
};

const deleteComposition = async (compositionId: string) => {
  if (!auth.currentUser) return;

  // Confirm intent
  if (!confirm('Are you sure you want to delete this composition?')) return;

  try {
    if (nativeFirestore) {
      await nativeFirestore.deleteComposition('compositions', compositionId);
    } else {
      await deleteDoc(doc(db, 'compositions', compositionId));
    }
    compositions.value = compositions.value.filter(comp => comp.docId !== compositionId);
  } catch (error: any) {
    // Provide clearer feedback when security rules block the action
    if (error.code === 'permission-denied') {
      alert('You do not have permission to delete this composition (only the owner can).');
    }
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

// ---- watch activeTab to reload ----
watch(activeTab, () => {
  loadCompositions();
});
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
  align-items: flex-start;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 6px;
  background: #f8f9fa;
}

.composition-info {
  flex: 1;
}

.comp-title {
  margin: 0 0 4px 0;
  font-size: 1.1rem;
  color: #333;
}

.author {
  margin: 0 0 2px 0;
  font-size: 0.9rem;
  color: #666;
}

.details {
  font-size: 0.85rem;
  color: #666;
  display: flex;
  gap: 15px;
  margin: 4px 0;
}

.visibility {
  font-size: 0.85rem;
  color: #888;
}

.composition-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.load-btn, .delete-btn, .edit-btn {
  background: #2196F3;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
}

.delete-btn {
  background: #E53935;
}

.edit-btn {
  background: #FF9800;
}

/* Edit mode styles */
.edit-form {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.form-group {
  flex: 1 1 45%;
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-size: 0.8rem;
  margin-bottom: 4px;
}

.form-group input, .form-group select {
  padding: 6px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.edit-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.save-edit-btn {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-edit-btn {
  background: #9E9E9E;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.current-composition-card {
  background: #f9f9f9;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.current-composition-card .title {
  font-weight: bold;
  font-size: 1.1rem;
  margin: 4px 0;
}

.current-composition-card .meta {
  font-size: 0.9rem;
  color: #666;
  display: flex;
  gap: 15px;
}

.quick-save-btn {
  margin-top: 10px;
  background: #4CAF50;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.no-compositions {
  text-align: center;
  padding: 24px;
  color: #666;
}

.loading-compositions {
  text-align: center;
  padding: 40px;
  color: #666;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #2196F3;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

.button-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  display: inline-block;
  margin-right: 6px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.load-btn:disabled,
.edit-btn:disabled,
.delete-btn:disabled,
.save-edit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.load-btn:disabled .fas,
.edit-btn:disabled .fas,
.delete-btn:disabled .fas {
  opacity: 0.5;
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

.search-bar {
  margin: 12px 0 8px 0;
  display: flex;
  justify-content: center;
}

.search-bar input {
  width: 100%;
  max-width: 350px;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}
</style> 