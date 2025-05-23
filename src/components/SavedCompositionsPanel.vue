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
          <div class="composition-selection">
            <input 
              type="checkbox" 
              :value="comp.id" 
              v-model="selectedCompositions"
              :disabled="combineMode && selectedCompositions.length >= 1 && !selectedCompositions.includes(comp.id)"
            />
          </div>
          <div class="composition-info">
            <template v-if="editingCompId === comp.id">
              <div class="edit-name-form">
                <input
                  type="text"
                  v-model="internalEditName"
                  class="rename-input"
                  @keyup.enter="handleSaveRename(comp.id, internalEditName)"
                />
                <button @click="handleSaveRename(comp.id, internalEditName)" class="save-rename-btn">Save</button>
                <button @click="cancelRenameLocal" class="cancel-rename-btn">Cancel</button>
              </div>
            </template>
            <template v-else>
              <span class="composition-name">{{ comp.name }}</span>
              <span class="composition-date">{{ formatDate(comp.dateCreated) }}</span>
            </template>
          </div>
          <div class="composition-actions">
            <button @click="handleLoadClick(comp.id)" class="load-btn">Load</button>
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
      
      <div class="combine-controls">
        <button 
          @click="toggleCombineMode" 
          class="combine-btn"
          :class="{ active: combineMode }"
        >
          {{ combineMode ? 'Cancel Combine' : 'Combine Compositions' }}
        </button>
        
        <button 
          v-if="combineMode && selectedCompositions.length >= 2" 
          @click="combineSelectedCompositions" 
          class="confirm-combine-btn"
        >
          Combine {{ selectedCompositions.length }} Compositions
        </button>
        
        <p v-if="combineMode" class="combine-instructions">
          Select 2 or more compositions to combine their voice layers into a new composition.
        </p>
      </div>
    </div>

    <div class="import-export-controls">
      <button @click="$emit('exportCurrentComposition')" class="export-btn" :disabled="!currentCompositionId">Export Current</button>
      <button @click="$emit('exportAllCompositions')" class="export-btn">Export All</button>
      <label class="import-btn">
        Import
        <input type="file" @change="handleFileImport" accept=".json,.txt" style="display: none;" multiple />
      </label>
    </div>
    <div class="export-options" v-if="currentCompositionId">
      <label>
        <input 
          type="checkbox" 
          :checked="exportOnlySelectedVoices" 
          @change="$emit('update:exportOnlySelectedVoices', ($event.target as HTMLInputElement).checked)" 
        />
        Export selected voices only
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import type { CompositionData, Note } from '@/types/types'; // Import from types file instead of vue component
import type { CompositionData as CompositionDataTypes } from '@/types/types';

// It's better if CompositionData is defined in a shared types file
// For now, assuming it's exported from NotationEditorView or a types.ts file

const props = defineProps<{
  savedCompositions: CompositionDataTypes[];
  compositionName: string;
  currentCompositionId: string | null;
  exportOnlySelectedVoices: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:compositionName', value: string): void;
  (e: 'saveComposition'): void;
  (e: 'loadComposition', id: string, readOnly: boolean): void;
  (e: 'updateComposition', id: string): void;
  (e: 'saveRename', id: string, newName: string): void;
  (e: 'deleteComposition', id: string): void;
  (e: 'exportAllCompositions'): void;
  (e: 'exportCurrentComposition'): void;
  (e: 'importCompositions', event: { target: { files: File[] }, dataTransfer: null | unknown }): void;
  (e: 'update:exportOnlySelectedVoices', value: boolean): void;
  (e: 'combineCompositions', compositionIds: string[], newName: string): void;
}>();

const editingCompId = ref<string | null>(null);
const internalEditName = ref('');

// Add new refs for combining functionality
const selectedCompositions = ref<string[]>([]);
const combineMode = ref(false);
const combinedName = ref('');

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

const handleFileImport = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target && target.files) {
    const fileArray = Array.from(target.files);
    emit('importCompositions', { 
      target: { 
        files: fileArray 
      }, 
      dataTransfer: null 
    });
  }
};

// Add functions for combining compositions
const toggleCombineMode = () => {
  combineMode.value = !combineMode.value;
  if (!combineMode.value) {
    // Clear selections when exiting combine mode
    selectedCompositions.value = [];
  }
};

const combineSelectedCompositions = () => {
  if (selectedCompositions.value.length < 2) {
    alert("Please select at least 2 compositions to combine.");
    return;
  }
  
  // Generate a default name based on the first two compositions
  const comp1 = props.savedCompositions.find(c => c.id === selectedCompositions.value[0]);
  const comp2 = props.savedCompositions.find(c => c.id === selectedCompositions.value[1]);
  
  let suggestedName = "Combined Composition";
  if (comp1 && comp2) {
    suggestedName = `${comp1.name} + ${comp2.name}`;
    if (selectedCompositions.value.length > 2) {
      suggestedName += ` + ${selectedCompositions.value.length - 2} more`;
    }
  }
  
  // Ask for a name for the combined composition
  const newName = prompt("Enter a name for the combined composition:", suggestedName);
  
  if (!newName || !newName.trim()) {
    alert("Please enter a valid name for the combined composition.");
    return;
  }
  
  // Emit event to parent component to handle the actual combination
  emit('combineCompositions', selectedCompositions.value, newName.trim());
  
  // Reset selection and mode
  selectedCompositions.value = [];
  combineMode.value = false;
};

// Clean up selections if a composition is deleted
watch(() => props.savedCompositions, () => {
  // Remove any deleted compositions from the selection
  selectedCompositions.value = selectedCompositions.value.filter(
    id => props.savedCompositions.some(comp => comp.id === id)
  );
}, { deep: true });

// Add this method to handle the load click with read-only mode
const handleLoadClick = (compositionId) => {
  // Emit load composition event with a flag to enable read-only mode
  emit('loadComposition', compositionId, true); // true = enable read-only mode
};

// Add method to handle exiting edit mode
const exitEditMode = () => {
  editingCompId.value = null;
  internalEditName.value = '';
};

// Add event listener in onMounted
onMounted(() => {
  // Listen for exitEditMode event
  document.addEventListener('exitEditMode', exitEditMode);
});

// Clean up in onBeforeUnmount
onBeforeUnmount(() => {
  document.removeEventListener('exitEditMode', exitEditMode);
});

// Add this new method to handle the save rename action
const handleSaveRename = (id: string, newName: string) => {
  // First clear the editing state
  editingCompId.value = null;
  internalEditName.value = '';
  // Then emit the event
  emit('saveRename', id, newName);
};

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

.export-options {
  margin-top: 10px;
  padding: 10px;
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 4px;
}

/* Add styles for combine functionality */
.composition-selection {
  margin-right: 10px;
  display: flex;
  align-items: center;
}

.composition-selection input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.combine-controls {
  margin-top: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-top: 1px dashed #ccc;
}

.combine-btn {
  background-color: #673AB7;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 15px;
  cursor: pointer;
  font-weight: bold;
}
.combine-btn:hover {
  background-color: #5E35B1;
}
.combine-btn.active {
  background-color: #F44336;
}

.confirm-combine-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 15px;
  cursor: pointer;
  font-weight: bold;
}
.confirm-combine-btn:hover {
  background-color: #43A047;
}

.combine-instructions {
  font-size: 12px;
  color: #666;
  text-align: center;
  margin: 5px 0;
}
</style> 