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
          <div v-for="comp in filteredCompositions" :key="comp.docId" class="composition-item">
            <!-- Display mode -->
            <template v-if="editingCompositionId !== comp.docId">
              <div class="composition-info">
                <h3 class="comp-title">{{ comp.name }}</h3>
                <p class="author">By {{ comp.submittedByName || comp.submittedByEmail }}</p>
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
                <button @click="loadComposition(comp)" class="load-btn">
                  <i class="fas fa-cloud-download-alt"></i>
                  Load
                </button>
                <button v-if="canDelete(comp)" @click="startEdit(comp)" class="edit-btn">
                  <i class="fas fa-edit"></i>
                  Edit
                </button>
                <button 
                  v-if="canDelete(comp)" 
                  @click="deleteComposition(comp.docId)" 
                  class="delete-btn"
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
                  <button @click="saveEdit(comp.docId)" class="save-edit-btn">Save</button>
                  <button @click="cancelEdit" class="cancel-edit-btn">Cancel</button>
                </div>
              </div>
            </template>
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
import { ref, computed, watch } from 'vue';
import { auth, db } from '@/firebase';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';

const props = defineProps<{ currentComposition?: any }>();

const emit = defineEmits(['close', 'load', 'saveCurrent']);

const activeTab = ref('my');
const compositions = ref<any[]>([]);

// Inline editing state
const editingCompositionId = ref<string | null>(null);
const editForm = ref<{ title: string; author?: string; arrangedBy?: string; visibility: 'public' | 'private' | 'shared'; }>({
  title: '',
  author: '',
  arrangedBy: '',
  visibility: 'private'
});

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
    await updateDoc(doc(db, 'compositions', compId), {
      name: editForm.value.title,
      author: editForm.value.author,
      arrangedBy: editForm.value.arrangedBy,
      visibility: editForm.value.visibility,
      sharedWithEmails: sharedEmails,
      lastModified: Date.now(),
      modifiedBy: auth.currentUser?.uid || null,
      modifiedByEmail: auth.currentUser?.email || null,
      modifiedByName: auth.currentUser?.displayName || null
    });
    // Refresh list
    await loadCompositions();
    editingCompositionId.value = null;
  } catch (err: any) {
    alert('Failed to update composition: ' + err.message);
    console.error('Update error:', err);
  }
};

const filteredCompositions = computed(() => {
  if (activeTab.value === 'my') {
    return compositions.value;
  }
  const userEmail = auth.currentUser?.email;
  if (activeTab.value === 'shared') {
    // only keep those where sharedWith contains the user email
    return compositions.value.filter(comp => Array.isArray(comp.sharedWith) && comp.sharedWith.some((entry: any) => entry.email === userEmail));
  }
  // public tab – compositions list already limited to public ones
  return compositions.value;
});

const loadCompositions = async () => {
  const user = auth.currentUser;
  if (!user && activeTab.value !== 'public') return;

  compositions.value = [];

  try {
    let q;
    switch (activeTab.value) {
      case 'my':
        q = query(collection(db, 'compositions'), where('submittedBy', '==', user!.uid));
        break;
      case 'shared':
        q = query(collection(db, 'compositions'), where('sharedWithEmails', 'array-contains', user.email));
        break;
      case 'public':
        q = query(collection(db, 'compositions'), where('visibility', '==', 'public'));
        break;
    }

    if (q) {
      const snap = await getDocs(q);
      compositions.value = snap.docs.map(d => ({ docId: d.id, ...(d.data() as any) }));
    }
  } catch (error) {
    console.error('Error loading compositions:', error);
  }
};

const loadComposition = (composition: any) => {
  emit('load', composition);
};

const canDelete = (composition: any) => {
  return composition.submittedBy === auth.currentUser?.uid;
};

const deleteComposition = async (compositionId: string) => {
  if (!auth.currentUser) return;

  // Confirm intent
  if (!confirm('Are you sure you want to delete this composition?')) return;

  try {
    await deleteDoc(doc(db, 'compositions', compositionId));
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