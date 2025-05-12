<template>
  <div class="voice-layers-panel-container">
    <h4>Voice Layers</h4>
    <div class="voice-layers-list">
      <div v-for="voice in voiceLayers" :key="voice.id" 
           class="voice-layer-item" 
           :class="{ 'active-voice': voice.active, 'selected-for-playback': voice.selected }"
           :style="{ borderLeftColor: voice.color }">
        
        <div class="voice-info">
          <input 
            type="text" 
            :value="voice.name" 
            @change="emitRenameVoice(voice.id, $event)" 
            class="voice-name-input"
            title="Edit voice name" 
          />
          <input 
            type="color" 
            :value="voice.color" 
            @input="emitChangeVoiceColor(voice.id, $event)" 
            class="voice-color-picker"
            title="Change voice color"
          />
        </div>

        <div class="voice-controls">
          <button 
            @click="emitSwitchActiveVoice(voice.id)" 
            :disabled="voice.active" 
            :title="voice.active ? 'This voice is active' : 'Set as active voice'"
            class="control-btn icon-btn"
            :class="{ 'is-active-btn': voice.active }">
            {{ voice.active ? '★' : '☆' }}
          </button>
          <button 
            @click="emitToggleVoiceVisibility(voice.id)" 
            :title="voice.visible ? 'Visible | Click to Hide' : 'Hidden | Click to Show'"
            class="control-btn icon-btn">
            {{ voice.visible ? '👁️' : '🙈' }}
          </button>
          <button 
            @click="emitUpdateVoiceSelection(voice.id)" 
            :title="voice.selected ? 'Selected for Playback | Click to Exclude' : 'Not Selected for Playback | Click to Include'"
            class="control-btn icon-btn">
            {{ voice.selected ? '🔊' : '🔇' }}
          </button>
        </div>

        <div class="voice-staff-assignment">
          <label :for="`voice-staff-select-${voice.id}`" class="staff-assignment-label">Staff:</label>
          <select
            :id="`voice-staff-select-${voice.id}`"
            :value="voice.staffId"
            @change="handleStaffAssignmentChange(voice.id, $event)"
            class="staff-select"
            title="Assign voice to a different staff"
          >
            <option v-if="!staves || staves.length === 0" disabled value="">No staves available</option>
            <option v-for="(stave, index) in staves" :key="stave.id" :value="stave.id">
              {{ stave.name || `Staff ${index + 1}` }}
            </option>
          </select>
        </div>
        
        <div class="voice-volume-control">
          <label :for="`voice-volume-${voice.id}`" class="volume-label">Volume:</label>
          <input
            type="range"
            :id="`voice-volume-${voice.id}`"
            :value="voice.volume"
            min="0"
            max="100"
            step="1"
            @input="emitChangeVolume(voice.id, $event)"
            class="volume-slider"
            title="Adjust voice volume"
          />
          <span class="volume-value">{{ voice.volume }} %</span>
        </div>

        <div class="voice-actions">
          <button @click="emitConfirmDeleteVoice(voice.id)" class="control-btn icon-btn delete-voice-btn" title="Delete voice">
            🗑️
          </button>
        </div>
      </div>
      <div v-if="!voiceLayers || voiceLayers.length === 0" class="no-voices-message">
        No voice layers yet. Add one below.
      </div>
    </div>

    <div class="add-voice-section">
      <h5>Add New Voice</h5>
      <div class="add-voice-controls">
        <select v-model="selectedStaffForNewVoice" class="staff-select-for-new-voice" title="Select staff for new voice">
           <option disabled value="">Select staff</option>
           <option v-for="(stave, index) in staves" :key="stave.id" :value="stave.id">
             {{ stave.name || `Staff ${index + 1}` }}
           </option>
        </select>
        <button @click="triggerAddVoiceLayer" class="add-voice-btn-main" :disabled="!selectedStaffForNewVoice && staves.length > 0">
          Add Voice Layer
        </button>
         <p v-if="staves.length === 0" class="no-staves-warning">
            Please add a staff in the main editor before adding a voice.
        </p>
      </div>
    </div>

    <div class="playback-options-voices">
        <label>
            <input type="checkbox" :checked="playSelectedVoicesOnly" @change="togglePlaySelectedVoicesOnly" />
            Play only selected voices
        </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, type PropType, onMounted } from 'vue';
import type { VoiceLayer, Stave } from '@/types/types'; // Adjust path as needed

const props = defineProps({
  voiceLayers: {
    type: Array as PropType<VoiceLayer[]>,
    required: true,
  },
  staves: {
    type: Array as PropType<Stave[]>,
    required: true,
  },
  activeStaffId: {
    type: String,
    default: null,
  },
  playSelectedVoicesOnly: {
    type: Boolean,
    default: false,
  }
});

const emit = defineEmits([
  'renameVoice',
  'changeVoiceColor',
  'switchActiveVoice',
  'toggleVoiceVisibility',
  'updateVoiceSelection',
  'confirmDeleteVoice',
  'addVoiceLayer',
  'assignVoiceToStaff',
  'update:playSelectedVoicesOnly',
  'changeVolume'
]);

const selectedStaffForNewVoice = ref('');

// Initialize selectedStaffForNewVoice based on activeStaffId or first available staff
const initializeSelectedStaff = () => {
  if (props.activeStaffId && props.staves.some(s => s.id === props.activeStaffId)) {
    selectedStaffForNewVoice.value = props.activeStaffId;
  } else if (props.staves.length > 0) {
    selectedStaffForNewVoice.value = props.staves[0].id;
  } else {
    selectedStaffForNewVoice.value = '';
  }
};

onMounted(() => {
  initializeSelectedStaff();
});

watch(() => [props.staves, props.activeStaffId], () => {
  // If the current selection is no longer valid or if it's empty and staves are available
  if (!props.staves.some(s => s.id === selectedStaffForNewVoice.value) || 
      (selectedStaffForNewVoice.value === '' && props.staves.length > 0)) {
    initializeSelectedStaff();
  }
}, { deep: true, immediate: true });


const emitRenameVoice = (voiceId: string, event: Event) => {
  const newName = (event.target as HTMLInputElement).value;
  emit('renameVoice', voiceId, newName);
};

const emitChangeVoiceColor = (voiceId: string, event: Event) => {
  const newColor = (event.target as HTMLInputElement).value;
  emit('changeVoiceColor', voiceId, newColor);
};

const emitChangeVolume = (voiceId: string, event: Event) => {
  const newVolume = parseFloat((event.target as HTMLInputElement).value);
  emit('changeVolume', voiceId, newVolume);
};

const emitSwitchActiveVoice = (voiceId: string) => {
  emit('switchActiveVoice', voiceId);
};

const emitToggleVoiceVisibility = (voiceId: string) => {
  emit('toggleVoiceVisibility', voiceId);
};

const emitUpdateVoiceSelection = (voiceId: string) => {
  // Find the voice and emit its current 'selected' state toggled
  const voice = props.voiceLayers.find(v => v.id === voiceId);
  if (voice) {
    emit('updateVoiceSelection', voiceId, !voice.selected);
  }
};

const emitConfirmDeleteVoice = (voiceId: string) => {
  emit('confirmDeleteVoice', voiceId);
};

const triggerAddVoiceLayer = () => {
  if (!selectedStaffForNewVoice.value && props.staves.length > 0) {
    alert("Please select a staff for the new voice.");
    return;
  }
  if (props.staves.length === 0) {
    alert("Please add a staff in the main editor first.");
    return;
  }
  emit('addVoiceLayer', selectedStaffForNewVoice.value);
  // Optionally reset selection or set to active staff after adding
   if (props.activeStaffId && props.staves.some(s => s.id === props.activeStaffId)) {
    selectedStaffForNewVoice.value = props.activeStaffId;
  } else if (props.staves.length > 0) {
    selectedStaffForNewVoice.value = props.staves[0].id;
  }

};

const handleStaffAssignmentChange = (voiceId: string, event: Event) => {
  const newStaffId = (event.target as HTMLSelectElement).value;
  if (newStaffId) {
    emit('assignVoiceToStaff', voiceId, newStaffId);
  }
};

const togglePlaySelectedVoicesOnly = (event: Event) => {
  emit('update:playSelectedVoicesOnly', (event.target as HTMLInputElement).checked);
};

</script>

<style scoped>
.voice-layers-panel-container {
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.voice-layers-panel-container h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #333;
  text-align: center;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
}

.voice-layers-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 15px;
}

.voice-layer-item {
  background-color: #fff;
  border-radius: 6px;
  padding: 10px;
  border-left: 5px solid transparent; /* Color will be set by :style */
  display: grid;
  grid-template-columns: auto 1fr auto; /* Info, Controls, Actions */
  /* Updated grid-template-areas for better layout control if needed, or stick to columns */
  /* grid-template-areas: 
    "info controls actions"
    "staff-assignment staff-assignment staff-assignment"; */
  gap: 10px;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  transition: box-shadow 0.2s ease;
}
.voice-layer-item:hover {
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

.voice-layer-item.active-voice {
  /* background-color: #e3f2fd; */
  box-shadow: 0 0 8px rgba(33, 150, 243, 0.5);
}
/* .voice-layer-item.selected-for-playback {
  outline: 2px solid #4CAF50; 
} */


.voice-info {
  display: flex;
  align-items: center;
  gap: 8px;
  grid-column: 1 / 2; 
}

.voice-name-input {
  flex-grow: 1;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}
.voice-name-input:focus {
  border-color: #2196F3;
  box-shadow: 0 0 0 2px rgba(33,150,243,0.2);
  outline: none;
}

.voice-color-picker {
  width: 30px;
  height: 30px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  padding: 2px;
}

.voice-controls {
  display: flex;
  flex-wrap: nowrap; /* Keep icons in a row */
  gap: 5px; /* Space between icon buttons */
  align-items: center;
  grid-column: 2 / 3; 
  justify-self: start; /* Align to the start of the grid cell */
}

/* New styles for icon buttons */
.control-btn.icon-btn {
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  color: #333;
  padding: 6px 8px; /* Adjust for compactness */
  font-size: 1.1em; /* Adjust icon size */
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
  line-height: 1; /* Ensure icon is centered vertically */
  min-width: 36px; /* Ensure buttons have a decent tap target */
  text-align: center;
}

.control-btn.icon-btn:hover {
  background-color: #e0e0e0;
  border-color: #bbb;
}

.control-btn.icon-btn:disabled {
  background-color: #e9e9e9;
  color: #999;
  cursor: not-allowed;
  border-color: #ddd;
}

.control-btn.icon-btn.is-active-btn:disabled { /* Style for the active voice star button */
  color: #FFC107; /* Gold color for active star */
  background-color: #f0f0f0; /* Keep background consistent or slightly different */
  border-color: #FFC107;
}

.voice-staff-assignment {
  grid-column: 1 / -1; /* Span all columns, effectively creating a new row */
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #eee;
}
.staff-assignment-label {
  font-size: 13px;
  color: #555;
  white-space: nowrap;
}
.staff-select {
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  background-color: white;
  flex-grow: 1;
  min-width: 120px; /* Ensure it has some base width */
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.voice-volume-control {
  grid-column: 1 / -1; /* Span all columns */
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #eee;
}
.volume-label {
  font-size: 13px;
  color: #555;
  white-space: nowrap;
}
.volume-slider {
  flex-grow: 1;
  cursor: pointer;
}
.volume-value {
  font-size: 12px;
  color: #333;
  min-width: 40px; /* Ensure space for "xx dB" */
  text-align: right;
}

.voice-actions {
  grid-column: 3 / 4; 
  justify-self: end;
  align-self: center; /* Vertically align delete button with voice-info */
}

.delete-voice-btn {
  background: none; /* Make delete button transparent */
  border: none;
  color: #f44336;
  font-size: 1.3em; /* Slightly larger delete icon */
  padding: 5px;
}
.delete-voice-btn:hover {
  color: #c62828;
  background-color: #f0f0f0; /* Slight background on hover */
}

.no-voices-message {
  text-align: center;
  color: #777;
  padding: 10px;
  font-style: italic;
}

.add-voice-section {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #ddd;
}
.add-voice-section h5 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #333;
}
.add-voice-controls {
  display: flex;
  gap: 10px;
  align-items: center;
}
.staff-select-for-new-voice {
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  flex-grow: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.add-voice-btn-main {
  padding: 8px 15px;
  font-size: 14px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.add-voice-btn-main:hover {
  background-color: #45a049;
}
.add-voice-btn-main:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
.no-staves-warning {
    font-size: 0.9em;
    color: #c0392b;
    margin-top: 5px;
}


.playback-options-voices {
    margin-top: 15px;
    padding-top: 10px;
    border-top: 1px solid #eee;
    font-size: 14px;
}
.playback-options-voices label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
}

/* Responsive adjustments */
@media (max-width: 700px) { /* Adjusted breakpoint for better layout */
  .voice-layer-item {
    grid-template-columns: 1fr auto; /* Info and controls side-by-side, actions below */
    /* grid-template-areas: 
      "info actions"
      "controls controls"
      "staff-assignment staff-assignment"; */
     row-gap: 8px;
  }
  .voice-info {
    grid-column: 1 / 2;
  }
  .voice-controls {
    grid-column: 1 / 2; /* Move controls below info on smaller screens */
    grid-row: 2 / 3;
    justify-self: stretch; /* Make controls take full width */
    flex-wrap: nowrap; /* Prevent wrapping to keep them in one line if possible */
  }
   .voice-controls button {
    flex-grow: 1; /* Allow buttons to grow */
    text-align: center;
  }
  .voice-actions {
    grid-column: 2 / 3; /* Actions to the right of info */
    grid-row: 1 / 2;
    align-self: center; /* Vertically align delete button */
  }
  .voice-staff-assignment {
    grid-column: 1 / -1; /* Staff assignment takes full width below */
    grid-row: 3 / 4;
  }
  .voice-volume-control {
    grid-column: 1 / -1;
    grid-row: 4 / 5; /* Volume control below staff assignment */
  }
}


@media (max-width: 480px) {
  .voice-layers-panel-container { padding: 10px; margin: 10px auto; }
  
  .voice-layer-item {
    grid-template-columns: 1fr; /* Stack everything */
    /* grid-template-areas: 
      "info"
      "controls"
      "staff-assignment"
      "actions"; */
  }
  .voice-info, .voice-controls, .voice-staff-assignment, .voice-actions, .voice-volume-control {
    grid-column: 1 / -1;
    justify-self: stretch;
  }
   .voice-controls {
    flex-direction: column; /* Stack buttons in controls */
    align-items: stretch;
  }
  .voice-controls button {
    width: 100%;
  }
  .voice-actions {
    text-align: center; /* Center delete button */
    margin-top: 8px;
  }
  .add-voice-controls {
    flex-direction: column;
    align-items: stretch;
  }
}
</style> 