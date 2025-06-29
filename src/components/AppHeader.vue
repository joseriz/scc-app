<template>
  <div class="app-header">
    <div class="header-main">
      <img src="@/assets/st-cecilia-logo.png" alt="St Cecilia's Songbook" class="app-logo">
      <NavBar />
    </div>

    <div class="composition-title">
      {{ compositionName || 'Untitled' }}
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
}>();

const emit = defineEmits<{
  (e: 'update:selectedClef', value: string): void;
  (e: 'update:keySignature', value: string): void;
  (e: 'update:timeSignature', value: string): void;
  (e: 'update:tempo', value: number): void;
  (e: 'clefChange', value: string): void; // For immediate handling if needed
  (e: 'keySignatureChange', value: string): void; // For immediate handling
  (e: 'timeSignatureChange', value: string): void; // For immediate handling
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