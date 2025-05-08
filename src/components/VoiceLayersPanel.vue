<template>
  <div class="voice-layers-container">
    <h3>Voice Layers</h3>
    <div v-for="voice in voiceLayers" :key="voice.id" class="voice-layer-item" :style="{ borderColor: voice.color }">
      <div class="voice-info">
        <input
          type="text"
          :value="voice.name"
          @change="$emit('renameVoice', voice.id, ($event.target as HTMLInputElement).value)"
          class="voice-name-input"
          :style="{ color: voice.color }"
        />
        <input
          type="color"
          :value="voice.color"
          @input="$emit('changeVoiceColor', voice.id, ($event.target as HTMLInputElement).value)"
          class="voice-color-picker"
          title="Change voice color"
        />
        <span class="voice-note-count">({{ voice.notes.length }} notes)</span>
      </div>

      <div class="voice-actions">
        <button
          @click="$emit('switchActiveVoice', voice.id)"
          :class="{ 'active-voice-btn': voice.active, 'inactive-voice-btn': !voice.active }"
          class="voice-action-btn"
        >
          {{ voice.active ? 'Active' : 'Set Active' }}
        </button>
        <button @click="$emit('toggleVoiceVisibility', voice.id)" class="voice-action-btn visibility-btn">
          {{ voice.visible ? 'Hide' : 'Show' }}
        </button>
        <label class="voice-playback-selection">
          <input
            type="checkbox"
            :checked="voice.selected"
            @change="$emit('updateVoiceSelection', voice.id, ($event.target as HTMLInputElement).checked)"
          /> Play
        </label>
        <button
          @click="$emit('confirmDeleteVoice', voice.id)"
          v-if="voiceLayers.length > 1"
          class="voice-action-btn delete-voice-btn"
          title="Delete voice"
        >
          🗑️ Delete
        </button>
      </div>
    </div>
    <div class="add-voice-container">
      <button @click="$emit('addVoiceLayer')" class="add-voice-btn">Add Voice</button>
    </div>
    <div class="voice-playback-options">
      <label class="playback-option">
        <input
          type="checkbox"
          :checked="playSelectedVoicesOnly"
          @change="$emit('update:playSelectedVoicesOnly', ($event.target as HTMLInputElement).checked)"
        />
        Play only selected voices
      </label>
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

.voice-layer-item {
  display: flex;
  flex-direction: column;
  gap: 10px; /* Was 12px */
  padding: 12px; /* Was 15px */
  margin-bottom: 12px; /* Was 15px */
  background-color: #fff;
  border-left: 5px solid; /* Was 6px */
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.07);
  transition: box-shadow 0.2s ease-in-out;
}
.voice-layer-item:hover {
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

.voice-info {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.voice-name-input {
  flex-grow: 1;
  min-width: 120px;
  padding: 8px 10px; /* Was 10px 12px */
  border: 1px solid #dde1e6;
  border-radius: 6px;
  font-size: 0.95em; /* Was 1em */
  transition: border-color 0.2s, box-shadow 0.2s;
}
.voice-name-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0,123,255,.15);
}

.voice-color-picker {
  width: 32px; /* Was 36px */
  height: 32px; /* Was 36px */
  border: 1px solid #fff; /* Was 2px */
  outline: 1px solid #dde1e6;
  padding: 0;
  border-radius: 6px;
  cursor: pointer;
  background-color: transparent;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  transition: transform 0.1s ease;
}
.voice-color-picker:hover {
  transform: scale(1.1);
}
.voice-color-picker::-webkit-color-swatch-wrapper { padding: 0; }
.voice-color-picker::-webkit-color-swatch { border: none; border-radius: 4px; }

.voice-note-count {
  font-size: 0.8em; /* Was 0.85em */
  color: #555;
  white-space: nowrap;
  background-color: #f0f0f0;
  padding: 3px 6px; /* Was 4px 8px */
  border-radius: 4px;
}

.voice-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding-top: 5px; /* Was 8px */
}

.voice-action-btn {
  padding: 6px 10px; /* Was 8px 12px */
  border: 1px solid #ced4da;
  border-radius: 6px;
  background-color: #f8f9fa;
  color: #343a40;
  cursor: pointer;
  font-size: 0.85em; /* Was 0.9em */
  transition: background-color 0.2s, border-color 0.2s, transform 0.1s;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}
.voice-action-btn:hover:not(:disabled) {
  background-color: #e9ecef;
  border-color: #adb5bd;
  transform: translateY(-1px);
}
.voice-action-btn:disabled {
  background-color: #e9ecef;
  color: #6c757d;
  cursor: not-allowed;
  border-color: #ced4da;
  transform: none;
}

.active-voice-btn {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}
.active-voice-btn:hover:not(:disabled) {
  background-color: #0056b3;
}

.delete-voice-btn {
  background-color: #dc3545;
  color: white;
  border-color: #dc3545;
}
.delete-voice-btn:hover:not(:disabled) {
  background-color: #c82333;
  border-color: #bd2130;
}

.voice-playback-selection {
  display: flex;
  align-items: center;
  gap: 5px; /* Was 6px */
  font-size: 0.85em; /* Was 0.9em */
  color: #333;
  padding: 6px 0; /* Was 8px 0 */
}
.voice-playback-selection input[type="checkbox"] {
  margin-right: 3px; /* Was 4px */
  width: 14px; /* Was 16px */
  height: 14px; /* Was 16px */
  accent-color: #007bff;
}

.add-voice-container {
  margin-top: 20px; /* Was 25px */
  text-align: center;
}

.add-voice-btn {
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 20px; /* Was 12px 24px */
  cursor: pointer;
  font-size: 0.95em; /* Was 1em */
  transition: background-color 0.2s, transform 0.1s;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.add-voice-btn:hover {
  background-color: #218838;
  transform: translateY(-1px);
}

.voice-playback-options {
  margin-top: 15px; /* Was 20px */
  padding-top: 12px; /* Was 15px */
  border-top: 1px solid #e0e0e0;
  font-size: 0.9em; /* Was 0.95em */
}
.playback-option {
  display: flex;
  align-items: center;
  gap: 8px;
}
.playback-option input[type="checkbox"] {
  width: 15px; /* Was 16px */
  height: 15px; /* Was 16px */
  accent-color: #007bff;
}

@media (max-width: 480px) {
  .voice-layers-container { padding: 10px; margin: 10px auto; }
  .voice-layer-item { padding: 10px; margin-bottom: 10px; }
  .voice-info { gap: 8px; }
  .voice-name-input { width: 100%; margin-bottom: 8px; font-size: 0.9em; }
  .voice-actions { width: 100%; justify-content: space-between; gap: 6px; }
  .voice-action-btn { flex: 1; min-width: 60px; padding: 8px 6px; font-size: 0.8em; }
  .delete-voice-btn { width: 100%; margin-top: 8px; }
  .add-voice-btn { width: 100%; max-width: 200px; padding: 10px 15px; font-size: 0.9em; }
}
</style> 