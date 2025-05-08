<template>
  <div class="lyrics-control-section">
    <h4>Lyrics</h4>
    <div class="lyrics-input-container">
      <input
        type="text"
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        placeholder="Enter lyric for selected note"
        :disabled="!selectedNoteId"
        @keypress="handleKeypress"
        class="lyric-input"
      />
      <button
        @click="addLyric"
        :disabled="!selectedNoteId"
        class="add-lyric-btn"
      >
        Add Lyric
      </button>
    </div>
    <p class="lyrics-help-text">
      Select a note first, then enter a lyric and press Enter or click "Add Lyric".
    </p>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

const props = defineProps<{
  modelValue: string; // for v-model on currentLyric
  selectedNoteId: string | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'setLyric', noteId: string, lyric: string): void;
}>();

const addLyric = () => {
  if (props.selectedNoteId) {
    emit('setLyric', props.selectedNoteId, props.modelValue);
  }
};

const handleKeypress = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && props.selectedNoteId) {
    event.preventDefault(); // Prevent form submission if wrapped in a form
    addLyric();
  }
};
</script>

<style scoped>
.lyrics-control-section {
  margin-top: 15px;
  padding: 10px;
  background-color: #f0f7ff;
  border: 1px solid #cce5ff;
  border-radius: 6px;
}

.lyrics-control-section h4 {
  margin-top: 0;
  margin-bottom: 8px;
  color: #333;
  font-size: 14px;
  text-align: center;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
}

.lyrics-input-container {
  display: flex;
  gap: 10px;
  margin-bottom: 8px;
}

.lyric-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}
.lyric-input:disabled {
  background-color: #f0f0f0;
}

.add-lyric-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  font-weight: bold;
  font-size: 14px;
}

.add-lyric-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
.add-lyric-btn:hover:not(:disabled) {
  background-color: #45a049;
}

.lyrics-help-text {
  font-size: 12px;
  color: #666;
  font-style: italic;
  margin-top: 5px;
  text-align: center;
}
</style> 