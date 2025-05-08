<template>
  <div class="settings-container">
    <!-- Chord controls -->
    <div class="control-section">
      <h4>Chords</h4>
      <div class="button-group">
        <button @click="$emit('showChordInput')" class="chord-btn">Add Chord</button>
        <button @click="$emit('addExampleChords')" class="chord-btn">Example Chords</button>
      </div>
    </div>

    <!-- Debug toggle -->
    <!-- <div class="control-section">
      <h4>Debug</h4>
      <button @click="$emit('toggleDebugMode')" :class="['note-btn', { active: debugMode }]">
        Debug Mode
      </button>
    </div> -->
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

defineProps<{
  debugMode: boolean;
}>();

defineEmits<{
  (e: 'showChordInput'): void;
  (e: 'addExampleChords'): void;
  (e: 'toggleDebugMode'): void;
}>();
</script>

<style scoped>
.settings-container {
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 10px;
  width: 100%;
  box-sizing: border-box;
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

.button-group {
  display: flex;
  gap: 10px; /* Increased gap for better separation */
  width: 100%;
}

.button-group button {
  flex: 1;
}

.chord-btn, .note-btn { /* Combined for similar base styling */
  padding: 8px 12px; /* Consistent padding */
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  color: #333;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.chord-btn:hover, .note-btn:hover {
  border-color: #2196F3;
  background-color: #f0f8ff; /* Light blue tint on hover */
}

.note-btn.active { /* Specific to debug toggle button */
  background: #2196F3;
  color: white;
  border-color: #0d8aee;
  box-shadow: 0 0 5px rgba(33, 150, 243, 0.5);
}
</style> 