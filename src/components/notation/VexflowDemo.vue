<template>
  <div class="vexflow-demo">
    <h3>Vexflow Notation Renderer Demo</h3>
    
    <div class="demo-controls">
      <button @click="loadSampleData" class="demo-btn">Load Sample Melody</button>
      <button @click="addSampleChords" class="demo-btn">Add Sample Chords</button>
      <button @click="clearAll" class="demo-btn">Clear All</button>
      
      <div class="settings-row">
        <label>Key Signature:</label>
        <select v-model="keySignature">
          <option value="C">C Major</option>
          <option value="G">G Major</option>
          <option value="D">D Major</option>
          <option value="F">F Major</option>
          <option value="Bb">Bb Major</option>
        </select>
        
        <label>Time Signature:</label>
        <select v-model="timeSignature">
          <option value="4/4">4/4</option>
          <option value="3/4">3/4</option>
          <option value="2/4">2/4</option>
          <option value="6/8">6/8</option>
        </select>
      </div>
    </div>

    <VexflowRenderer 
      :staves="demoStaves"
      :voiceLayers="demoVoiceLayers"
      :keySignature="keySignature"
      :timeSignature="timeSignature"
      :width="900"
      :height="400"
    />
    
    <div class="info-panel">
      <h4>Current Notes:</h4>
      <pre>{{ JSON.stringify(demoVoiceLayers[0]?.notes || [], null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import VexflowRenderer from './VexflowRenderer.vue';
import type { Stave, VoiceLayer, Note } from '@/types/types';
import { generateId } from '@/utils/idGenerator';

const keySignature = ref('C');
const timeSignature = ref('4/4');

// Demo staves
const demoStaves = ref<Stave[]>([
  {
    id: 'staff-1',
    clef: 'treble',
    order: 0,
    name: 'Melody',
    isCollapsed: false
  }
]);

// Demo voice layers
const demoVoiceLayers = ref<VoiceLayer[]>([
  {
    id: 'voice-1',
    name: 'Main Voice',
    color: '#2196F3',
    visible: true,
    active: true,
    selected: true,
    volume: 80,
    notes: [],
    staffId: 'staff-1'
  }
]);

function loadSampleData() {
  const sampleNotes: Note[] = [
    // Simple melody with varied durations: C-D-E-F-G-A-B-C
    {
      id: generateId(),
      type: 'note',
      pitch: 'C4',
      duration: 'half',  // Changed to half note
      position: 0,
      verticalPosition: 100,
      dotted: false,
      triplet: false
    },
    {
      id: generateId(),
      type: 'note',
      pitch: 'D4',
      duration: 'quarter',
      position: 2,
      verticalPosition: 92.5,
      dotted: false,
      triplet: false
    },
    {
      id: generateId(),
      type: 'note',
      pitch: 'E4',
      duration: 'eighth',  // Changed to eighth note
      position: 3,
      verticalPosition: 85,
      dotted: false,
      triplet: false
    },
    {
      id: generateId(),
      type: 'note',
      pitch: 'F4',
      duration: 'eighth',  // Changed to eighth note
      position: 3.5,
      verticalPosition: 77.5,
      dotted: false,
      triplet: false
    },
    {
      id: generateId(),
      type: 'note',
      pitch: 'G4',
      duration: 'whole',  // Changed to whole note
      position: 4,
      verticalPosition: 70,
      dotted: false,
      triplet: false
    },
    {
      id: generateId(),
      type: 'rest',
      duration: 'quarter',
      position: 8,
      verticalPosition: 100,
      dotted: false,
      triplet: false
    },
    {
      id: generateId(),
      type: 'note',
      pitch: 'A4',
      duration: 'sixteenth',  // Changed to sixteenth note
      position: 9,
      verticalPosition: 62.5,
      dotted: false,
      triplet: false
    },
    {
      id: generateId(),
      type: 'note',
      pitch: 'B4',
      duration: 'sixteenth',  // Changed to sixteenth note
      position: 9.25,
      verticalPosition: 55,
      dotted: false,
      triplet: false
    }
  ];

  demoVoiceLayers.value[0].notes = sampleNotes;
}

function addSampleChords() {
  // Add a bass staff for chords
  if (demoStaves.value.length === 1) {
    demoStaves.value.push({
      id: 'staff-2',
      clef: 'bass',
      order: 1,
      name: 'Bass',
      isCollapsed: false
    });

    demoVoiceLayers.value.push({
      id: 'voice-2',
      name: 'Bass Voice',
      color: '#FF5722',
      visible: true,
      active: false,
      selected: false,
      volume: 70,
      notes: [
        {
          id: generateId(),
          type: 'note',
          pitch: 'C3',
          duration: 'whole',
          position: 0,
          verticalPosition: 100,
          dotted: false,
          triplet: false
        },
        {
          id: generateId(),
          type: 'note',
          pitch: 'F3',
          duration: 'whole',
          position: 4,
          verticalPosition: 85,
          dotted: false,
          triplet: false
        }
      ],
      staffId: 'staff-2'
    });
  }
}

function clearAll() {
  demoVoiceLayers.value.forEach(voice => {
    voice.notes = [];
  });
  
  // Remove bass staff if it exists
  if (demoStaves.value.length > 1) {
    demoStaves.value = [demoStaves.value[0]];
    demoVoiceLayers.value = [demoVoiceLayers.value[0]];
  }
}
</script>

<style scoped>
.vexflow-demo {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.demo-controls {
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
}

.demo-btn {
  margin: 5px;
  padding: 8px 16px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.demo-btn:hover {
  background: #1976D2;
}

.settings-row {
  margin-top: 15px;
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.settings-row label {
  font-weight: bold;
  margin-right: 5px;
}

.settings-row select {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.info-panel {
  margin-top: 20px;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.info-panel h4 {
  margin-top: 0;
  color: #333;
}

.info-panel pre {
  font-size: 12px;
  line-height: 1.4;
  color: #666;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style> 