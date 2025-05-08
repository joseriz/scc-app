<template>
  <div class="voice-layers-container">
    <h3>Voice Layers</h3>
    <div class="voice-layers-options">
      <label>
        <input
          type="checkbox"
          :checked="playSelectedVoicesOnly"
          @change="$emit('update:playSelectedVoicesOnly', ($event.target as HTMLInputElement).checked)"
        />
        Play selected voices only
      </label>
    </div>
    <div class="voice-layers">
      <div
        v-for="voice in voiceLayers"
        :key="voice.id"
        class="voice-layer"
        :class="{ active: voice.active }"
        :style="{ borderColor: voice.color }"
      >
        <div class="voice-header">
          <div class="voice-controls">
            <button
              @click="$emit('switchActiveVoice', voice.id)"
              :title="voice.active ? 'This voice is active' : 'Set this voice active'"
              class="voice-action-btn"
              :class="{ 'active-voice-btn': voice.active }"
            >
              <span v-if="voice.active">Active</span>
              <span v-else>Set Active</span>
            </button>
            <button
              @click="$emit('toggleVoiceVisibility', voice.id)"
              class="voice-action-btn voice-visibility-btn"
              :class="{ visible: voice.visible }"
              :title="voice.visible ? 'Hide Voice' : 'Show Voice'"
            >
              <span v-if="voice.visible">Visible</span>
              <span v-else>Hidden</span>
            </button>
            <label class="voice-select-label" :title="voice.selected ? 'Deselect voice for multi-voice playback/export' : 'Select voice for multi-voice playback/export'">
              <input
                type="checkbox"
                :checked="voice.selected"
                @change="$emit('updateVoiceSelection', voice.id, ($event.target as HTMLInputElement).checked)"
                class="voice-select-checkbox"
              />
              <span>Select</span>
            </label>
          </div>
          <input
            type="text"
            :value="voice.name"
            @change="$emit('renameVoice', voice.id, ($event.target as HTMLInputElement).value)"
            class="voice-name-input"
            :title="`Rename ${voice.name}`"
          />
          <input
            type="color"
            :value="voice.color"
            @input="$emit('changeVoiceColor', voice.id, ($event.target as HTMLInputElement).value)"
            class="voice-color-picker"
            :title="`Change color for ${voice.name}`"
          />
        </div>
        <div class="voice-footer">
          <span class="voice-note-count">{{ voice.notes.length }} notes</span>
          <button @click="$emit('confirmDeleteVoice', voice.id)" class="delete-voice-btn" title="Delete Voice">Delete</button>
        </div>
      </div>
    </div>
    <div class="add-voice-container">
      <button @click="$emit('addVoiceLayer')" class="add-voice-btn">Add Voice</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
// Assuming VoiceLayer is imported from a shared types file or NotationEditorView
// For example: import type { VoiceLayer } from '@/types/notation';
// Or: import type { VoiceLayer } from '@/views/NotationEditorView.vue';

interface VoiceLayer { // Local definition for now if not imported
  id: string;
  name: string;
  color: string;
  visible: boolean;
  active: boolean;
  selected: boolean;
  notes: Array<{ id: string; /* other note props */ }>; // Simplified note type for count
}

defineProps<{
  voiceLayers: VoiceLayer[];
  playSelectedVoicesOnly: boolean;
}>();

defineEmits<{
  (e: 'renameVoice', voiceId: string, newName: string): void;
  (e: 'changeVoiceColor', voiceId: string, newColor: string): void;
  (e: 'switchActiveVoice', voiceId: string): void;
  (e: 'toggleVoiceVisibility', voiceId: string): void;
  (e: 'updateVoiceSelection', voiceId: string, selected: boolean): void;
  (e: 'confirmDeleteVoice', voiceId: string): void;
  (e: 'addVoiceLayer'): void;
  (e: 'update:playSelectedVoicesOnly', value: boolean): void;
}>();
</script>

<style scoped>
/* Copied from NotationEditorView.vue and global.css, then adjusted */
.voice-layers-container {
  margin: 20px auto;
  padding: 15px; /* Was 20px */
  background-color: #f7f9fc;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  max-width: 700px;
}

.voice-layers-container h3 {
  margin-top: 0;
  margin-bottom: 15px; /* Was 20px */
  color: #333;
  text-align: center;
  font-size: 1.3em; /* Was 1.5em */
}

.voice-layers-options {
  margin-bottom: 10px;
  text-align: center;
}
.voice-layers-options label {
  font-size: 0.9em;
  cursor: pointer;
}

.voice-layers {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.voice-layer {
  background-color: white;
  border-radius: 6px;
  padding: 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border-left: 5px solid; /* Color will be applied here */
  transition: box-shadow 0.2s ease;
}

.voice-layer.active {
  box-shadow: 0 3px 8px rgba(0,0,0,0.15);
}

.voice-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.voice-controls {
  display: flex;
  gap: 5px;
  align-items: center; /* Align items in controls, including the new label */
}

.voice-action-btn, .delete-voice-btn {
  padding: 5px 8px;
  font-size: 0.85em;
  border: 1px solid #ccc;
  background-color: #f9f9f9;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.voice-action-btn:hover, .delete-voice-btn:hover {
  background-color: #e0e0e0;
}

.active-voice-btn {
  background-color: #cce5ff;
  border-color: #b8daff;
  font-weight: bold;
}

.voice-visibility-btn.visible {
  background-color: #e3f2fd; /* Light blue for visible */
}
.voice-visibility-btn:not(.visible) {
  background-color: #ffebee; /* Light red for hidden */
}

/* Styles for the new select checkbox and its label */
.voice-select-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85em;
  cursor: pointer;
  padding: 5px 8px; /* Match button padding */
  border: 1px solid #ccc;
  background-color: #f9f9f9;
  border-radius: 4px;
  transition: background-color 0.2s;
}
.voice-select-label:hover {
  background-color: #e0e0e0;
}
.voice-select-checkbox {
  cursor: pointer;
  margin-right: 3px; /* Small space between checkbox and "Select" text */
}

.voice-name-input {
  flex-grow: 1;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.95em;
}
.voice-name-input:focus {
  border-color: #2196F3;
  outline: none;
}

.voice-color-picker {
  width: 30px;
  height: 30px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  padding: 2px; /* To make the color area slightly smaller than border */
  background-color: transparent; /* Ensure picker background doesn't obscure the color value */
}
/* For Webkit browsers to show the color value */
.voice-color-picker::-webkit-color-swatch {
  border-radius: 3px;
  border: none;
}
.voice-color-picker::-moz-color-swatch {
  border-radius: 3px;
  border: none;
}

.voice-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8em;
  color: #666;
  margin-top: 5px;
}

.delete-voice-btn {
  background-color: #f44336;
  color: white;
}
.delete-voice-btn:hover {
  background-color: #d32f2f;
}

.add-voice-container {
  margin-top: 15px;
  text-align: center;
}

.add-voice-btn {
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 0.95em;
  transition: background-color 0.2s;
}

.add-voice-btn:hover {
  background-color: #388e3c;
}

@media (max-width: 480px) {
  .voice-layers-container { padding: 10px; margin: 10px auto; }
  .voice-layer { padding: 10px; margin-bottom: 10px; }
  .voice-header { flex-direction: column; align-items: flex-start; gap: 8px; }
  .voice-controls { width: 100%; justify-content: space-between; }
  .voice-action-btn { flex: 1; min-width: 60px; padding: 8px 6px; font-size: 0.8em; }
  .delete-voice-btn { width: 100%; margin-top: 8px; }
  .add-voice-btn { width: 100%; max-width: 200px; padding: 10px 15px; font-size: 0.9em; }
}
</style> 