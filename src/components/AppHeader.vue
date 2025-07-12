<template>
  <div class="app-header">
    <div class="header-main">
      <img src="@/assets/st-cecilia-logo.png" alt="St Cecilia's Songbook" class="app-logo">
      <NavBar />
    </div>

    <div class="composition-title">
      {{ compositionName || 'Untitled' }}
      <button 
        v-if="hasUnsavedChanges && !readOnlyMode"
        @click="$emit('quickSave')"
        class="quick-save-btn"
        :disabled="isSaving"
        :title="isSaving ? 'Saving...' : 'Save changes'"
      >
        <div v-if="isSaving" class="save-spinner"></div>
        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <polyline points="17,21 17,13 7,13 7,21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <polyline points="7,3 7,8 15,8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <button 
        v-if="canShare"
        @click="$emit('share')"
        class="share-btn"
        title="Share composition"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="18" cy="5" r="3" stroke="currentColor" stroke-width="2"/>
          <circle cx="6" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
          <circle cx="18" cy="19" r="3" stroke="currentColor" stroke-width="2"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke="currentColor" stroke-width="2"/>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke="currentColor" stroke-width="2"/>
        </svg>
      </button>
    </div>

    <!-- Musical settings in a compact row -->
    <div class="musical-settings">
      <!-- <div class="setting-item">
        <label for="clef-select">Clef:</label>
        <div class="custom-select compact">
          <select id="clef-select" :value="selectedClef" @change="onClefChange">
            <option value="treble">𝄞 Treble</option>
            <option value="bass">𝄢 Bass</option>
          </select>
          <div class="select-icon">▼</div>
        </div>
      </div> -->

      <div class="setting-item">
        <label for="key-signature">Key:</label>
        <div class="custom-select compact">
          <select :disabled="readOnlyMode" id="key-signature" :value="keySignature" @change="onKeySignatureChange">
            <option value="C">C Maj (0)</option>
            <option value="G">G Maj (1♯)</option>
            <option value="D">D Maj (2♯)</option>
            <option value="A">A Maj (3♯)</option>
            <option value="E">E Maj (4♯)</option>
            <option value="B">B Maj (5♯)</option>
            <option value="F#">F♯ Maj (6♯)</option>
            <option value="C#">C♯ Maj (7♯)</option>
            <option value="F">F Maj (1♭)</option>
            <option value="Bb">B♭ Maj (2♭)</option>
            <option value="Eb">E♭ Maj (3♭)</option>
            <option value="Ab">A♭ Maj (4♭)</option>
            <option value="Db">D♭ Maj (5♭)</option>
            <option value="Gb">G♭ Maj (6♭)</option>
            <option value="Cb">C♭ Maj (7♭)</option>
          </select>
          <div class="select-icon">▼</div>
        </div>
      </div>

      <div class="setting-item">
        <label for="time-signature">Time:</label>
        <div class="custom-select compact">
          <select :disabled="readOnlyMode" id="time-signature" :value="timeSignature" @change="onTimeSignatureChange">
            <option value="4/4">4/4 (Common Time)</option>
            <option value="2/2">2/2 (Cut Time)</option>
            <option value="2/4">2/4</option>
            <option value="3/4">3/4</option>
            <option value="3/8">3/8</option>
            <option value="5/4">5/4</option>
            <option value="5/8">5/8</option>
            <option value="6/8">6/8</option>
            <option value="7/4">7/4</option>
            <option value="7/8">7/8</option>
            <option value="9/8">9/8</option>
            <option value="12/8">12/8</option>
          </select>
          <div class="select-icon">▼</div>
        </div>
      </div>

      <div class="setting-item">
        <label for="tempo">Tempo:</label>
        <div class="tempo-input">
          <input
            type="number"
            id="tempo"
            v-model.number="localTempo"
            min="40"
            max="208"
            step="1"
            @input="updateTempo"
          />
          <span class="tempo-unit">BPM</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref, watch } from 'vue';
import NavBar from './NavBar.vue';

const props = defineProps<{
  readOnlyMode: boolean;
  selectedClef: string;
  keySignature: string;
  timeSignature: string;
  tempo: number;
  compositionName?: string;
  hasUnsavedChanges?: boolean;
  isSaving?: boolean;
  canShare?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:selectedClef', value: string): void;
  (e: 'update:keySignature', value: string): void;
  (e: 'update:timeSignature', value: string): void;
  (e: 'update:tempo', value: number): void;
  (e: 'clefChange', value: string): void; // For immediate handling if needed
  (e: 'keySignatureChange', value: string): void; // For immediate handling
  (e: 'timeSignatureChange', value: string): void; // For immediate handling
  (e: 'quickSave'): void; // For quick save functionality
  (e: 'share'): void; // For sharing functionality
}>();

const localTempo = ref(props.tempo);

watch(() => props.tempo, (newValue) => {
  localTempo.value = newValue;
});

const updateTempo = () => {
  emit('update:tempo', localTempo.value);
};

const onClefChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  emit('update:selectedClef', target.value);
  emit('clefChange', target.value);
};

const onKeySignatureChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  emit('update:keySignature', target.value);
  emit('keySignatureChange', target.value);
};

const onTimeSignatureChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  emit('update:timeSignature', target.value);
  emit('timeSignatureChange', target.value);
};
</script>

<style scoped>
/* Styles specific to AppHeader, can be copied from global.css or NotationEditorView.vue <style> block */
.app-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 8px;
  background: linear-gradient(135deg, rgba(255,240,245,0.2), rgba(240,248,255,0.2));
  border-radius: 8px;
  margin-bottom: 10px;
}

.header-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.composition-title {
  text-align: center;
  font-size: 1.2em;
  font-weight: bold;
  color: #333;
  margin: 8px 0;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.quick-save-btn, .share-btn {
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.quick-save-btn:hover, .share-btn:hover {
  background: #45a049;
}

.share-btn {
  background: #2196F3;
}

.share-btn:hover {
  background: #1976D2;
}

.quick-save-btn {
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.quick-save-btn:hover {
  background: #45a049;
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
}

.quick-save-btn:active {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.quick-save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.quick-save-btn:disabled:hover {
  background: #4CAF50;
  transform: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.save-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.app-logo {
  height: 100px; /* As per global.css */
  width: auto;
}

.musical-settings {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.setting-item label {
  font-size: 14px; /* From global.css .tempo-control label */
  white-space: nowrap;
}

.custom-select {
  position: relative;
  min-width: 120px; /* From global.css */
}

.custom-select.compact select {
   /* Assuming compact means smaller, adjust if needed */
  padding: 6px 25px 6px 8px; /* From global.css mobile */
  font-size: 14px; /* From global.css mobile */
}


.custom-select select {
  appearance: none;
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 8px 30px 8px 10px; /* From global.css */
  width: 100%;
  font-size: 15px; /* From global.css */
  cursor: pointer;
  outline: none;
  transition: all 0.2s ease;
}

.custom-select select:hover {
  border-color: #2196F3; /* From global.css */
}

.custom-select select:focus {
  border-color: #2196F3; /* From global.css */
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2); /* From global.css */
}

.custom-select .select-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  font-size: 10px; /* From global.css */
  color: #666; /* From global.css */
}

.tempo-input {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tempo-input input {
  width: 60px;
  padding: 6px 8px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: all 0.2s ease;
}

.tempo-input input:hover {
  border-color: #2196F3;
}

.tempo-input input:focus {
  border-color: #2196F3;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
}

.tempo-unit {
  font-size: 14px;
  color: #666;
}

@media (max-width: 600px) {
  .header-main {
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
  
  .app-logo {
    margin-bottom: 0;
  }
  
  .composition-title {
    font-size: 1.1em;
    margin: 4px 0;
  }
  
  .musical-settings {
    justify-content: center;
    width: 100%;
  }
  
  .setting-item {
    min-width: 45%;
    justify-content: center;
  }
   .custom-select {
      min-width: 100px;
    }
}
</style> 