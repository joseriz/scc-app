<template>
  <div class="saved-compositions-container">
    <div class="control-section">
      <h4>Save Current Composition</h4>
      <div class="save-composition-form">
        <input
          type="text"
          :value="compositionName"
          @input="$emit('update:compositionName', ($event.target as HTMLInputElement).value)"
          placeholder="Enter a name for your composition"
          class="composition-name-input"
        />
        <button @click="$emit('saveComposition')" class="save-btn">Save</button>
      </div>
    </div>

    <div class="control-section">
      <h4>Your Saved Compositions</h4>
      <div v-if="!savedCompositions || savedCompositions.length === 0" class="no-saved-compositions">
        No saved compositions yet.
      </div>
      <div v-else class="saved-composition-list">
        <div v-for="comp in savedCompositions" :key="comp.id" class="saved-composition-item">
          <div class="composition-info">
            <template v-if="editingCompId === comp.id">
              <div class="edit-name-form">
                <input
                  type="text"
                  v-model="internalEditName"
                  class="rename-input"
                  @keyup.enter="$emit('saveRename', comp.id, internalEditName)"
                />
                <button @click="$emit('saveRename', comp.id, internalEditName)" class="save-rename-btn">Save</button>
                <button @click="cancelRenameLocal" class="cancel-rename-btn">Cancel</button>
              </div>
            </template>
            <template v-else>
              <span class="composition-name">{{ comp.name }}</span>
              <span class="composition-date">{{ formatDate(comp.dateCreated) }}</span>
            </template>
          </div>
          <div class="composition-actions">
            <button @click="$emit('loadComposition', comp.id)" class="load-btn">Load</button>
            <button
              v-if="currentCompositionId === comp.id"
              @click="$emit('updateComposition', comp.id)"
              class="update-btn"
              title="Update this composition with current changes"
            >
              Update
            </button>
            <button @click="startRenameLocal(comp.id, comp.name)" class="load-btn" style="background-color: #9C27B0;">Rename</button>
            <button @click="$emit('deleteComposition', comp.id)" class="delete-btn">Delete</button>
          </div>
        </div>
      </div>
    </div>

    <div class="import-export-controls">
      <button @click="$emit('exportAllCompositions')" class="export-btn">Export All</button>
      <button @click="$emit('exportCurrentComposition')" class="export-btn" :disabled="!currentCompositionId">Export Current</button>
      <label for="import-file-input" class="import-btn">Import</label>
      <input
        type="file"
        id="import-file-input"
        accept=".txt,.json"
        @change="$emit('importCompositions', $event)"
        style="display: none;"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref, watch } from 'vue';
import type { CompositionData, Note } from '@/views/NotationEditorView.vue'; // Adjust path if needed

// It's better if CompositionData is defined in a shared types file
// For now, assuming it's exported from NotationEditorView or a types.ts file

const props = defineProps<{
  savedCompositions: CompositionData[];
  compositionName: string;
  currentCompositionId: string | null;
  // editingComposition: string | null; // Handled internally now
  // editCompositionName: string; // Handled internally now
}>();

const emit = defineEmits<{
  (e: 'update:compositionName', value: string): void;
  (e: 'saveComposition'): void;
  (e: 'loadComposition', id: string): void;
  (e: 'updateComposition', id: string): void;
  (e: 'saveRename', id: string, newName: string): void;
  (e: 'deleteComposition', id: string): void;
  (e: 'exportAllCompositions'): void;
  (e: 'exportCurrentComposition'): void;
  (e: 'importCompositions', event: Event): void;
}>();

const editingCompId = ref<string | null>(null);
const internalEditName = ref('');

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString();
};

const startRenameLocal = (id: string, currentName: string) => {
  editingCompId.value = id;
  internalEditName.value = currentName;
};

const cancelRenameLocal = () => {
  editingCompId.value = null;
  internalEditName.value = '';
};

// Watch for external changes that might stop editing (e.g., parent cancels)
// This part is tricky if parent also controls editing state.
// For now, this component manages its own rename UI state.
// If parent needs to cancel rename, it would typically re-render this component
// with props that lead to editingCompId being null.

</script>

<style scoped>
.saved-compositions-container {
  padding: 15px;
  background: #f5f5f5; /* From global.css */
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-top: 20px;
}

.control-section {
  margin-bottom: 15px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.control-section h4 {
  margin-top: 0;
  margin-bottom: 8px;
  color: #333;
  font-size: 14px;
  text-align: center;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
}

.save-composition-form {
  display: flex;
  gap: 10px;
  margin-bottom: 10px; /* Was 15px in global */
}

.composition-name-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

.save-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 15px; /* Was 6px 12px */
  cursor: pointer;
  font-weight: bold;
}
.save-btn:hover {
  background-color: #45a049;
}

.no-saved-compositions {
  text-align: center;
  padding: 20px; /* From global.css */
  color: #666;
  font-style: italic;
}

.saved-composition-list {
  max-height: 300px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 5px; /* Was 10px in global */
}

.saved-composition-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px; /* Was 5px in global */
  background: white; /* Was #f9f9f9 */
  border: 1px solid #ddd;
  border-radius: 4px;
  /* margin-bottom: 5px; */ /* Replaced by gap */
}

.composition-info {
  display: flex;
  flex-direction: column;
}

.composition-name {
  font-weight: bold;
  color: #333;
}

.composition-date {
  font-size: 12px;
  color: #777; /* Was #666 */
}

.composition-actions {
  display: flex;
  gap: 5px;
}

.load-btn, .delete-btn, .update-btn {
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 13px; /* Ensure text fits */
}
.load-btn { background-color: #2196F3; }
.delete-btn { background-color: #f44336; }
.update-btn { background-color: #FF9800; /* margin-left: 5px; */ }


.edit-name-form {
  display: flex;
  gap: 5px;
  align-items: center;
  /* margin-top: 5px; */ /* Removed, handled by parent item padding */
}

.rename-input {
  flex-grow: 1;
  padding: 6px 10px; /* Slightly larger */
  border: 1px solid #2196F3;
  border-radius: 4px;
  font-size: 14px;
}

.save-rename-btn, .cancel-rename-btn {
  padding: 6px 10px; /* Slightly larger */
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  color: white;
}

.save-rename-btn { background-color: #4CAF50; }
.cancel-rename-btn { background-color: #f44336; }


.import-export-controls {
  display: flex;
  gap: 10px;
  margin-top: 15px;
  margin-bottom: 15px; /* Added for spacing */
  justify-content: center;
  flex-wrap: wrap; /* Allow wrapping on small screens */
}

.export-btn, .import-btn {
  background-color: #3F51B5;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 15px;
  cursor: pointer;
  font-size: 14px;
  display: inline-block;
  text-align: center;
}
.export-btn:hover, .import-btn:hover {
  background-color: #303F9F;
}
.export-btn:disabled {
  background-color: #9E9E9E;
  cursor: not-allowed;
}
</style> 