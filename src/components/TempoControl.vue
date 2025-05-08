<template>
  <div class="tempo-container">
    <label>Tempo: {{ modelValue }}</label>
    <input
      type="range"
      :value="modelValue"
      @input="updateTempo(($event.target as HTMLInputElement).value)"
      min="40"
      max="240"
      class="tempo-slider"
    />
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

defineProps<{
  modelValue: number;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void;
}>();

const updateTempo = (value: string) => {
  emit('update:modelValue', parseInt(value, 10));
};
</script>

<style scoped>
.tempo-container {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  padding: 8px;
  background-color: #f8f8f8;
  border-radius: 8px;
}

.tempo-container label {
  white-space: nowrap;
  font-size: 14px;
}

.tempo-slider {
  flex: 1;
  min-width: 120px;
}

@media (max-width: 600px) {
  .tempo-container {
    flex-direction: column;
    align-items: stretch;
  }
  .tempo-container label {
    text-align: center;
    margin-bottom: 5px;
  }
}
</style> 