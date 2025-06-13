import { defineStore } from 'pinia';
import { ref } from 'vue';

// This store centralizes UI state for the cloud-save / cloud-load flow so that
// components such as NavBar.vue and NotationEditorView.vue can coordinate
// without having to emit events up and down the component tree.
export const useCloudStore = defineStore('cloud', () => {
  // Visibility flags for the two modals
  const isSaveToCloudModalVisible = ref(false);
  const isLoadFromCloudVisible = ref(false);

  // ----- helpers -----
  function openSaveModal() {
    isSaveToCloudModalVisible.value = true;
  }

  function closeSaveModal() {
    isSaveToCloudModalVisible.value = false;
  }

  function openLoadModal() {
    isLoadFromCloudVisible.value = true;
  }

  function closeLoadModal() {
    isLoadFromCloudVisible.value = false;
  }

  return {
    // state
    isSaveToCloudModalVisible,
    isLoadFromCloudVisible,
    // actions
    openSaveModal,
    closeSaveModal,
    openLoadModal,
    closeLoadModal,
  };
}); 