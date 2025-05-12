<template>
  <div class="sections-panel">
    <div v-if="readOnlyMode" class="read-only-banner">
      <div class="read-only-message">
        <i class="lock-icon">🔒</i> Section editing is locked in read-only mode.
        <div class="read-only-detail">You can still play sections and sequences, but can't modify them.</div>
      </div>
    </div>
    
    <h4>Music Sections</h4>
    
    <div v-if="!readOnlyMode" class="section-form">
      <input 
        type="text" 
        v-model="sectionName" 
        placeholder="Section name (e.g., Chorus, Verse)" 
        class="section-name-input"
      />
      <div class="measure-range">
        <div class="measure-input">
          <label>Start:</label>
          <input type="number" v-model.number="startMeasure" min="1" :max="maxMeasures" />
        </div>
        <div class="measure-input">
          <label>End:</label>
          <input type="number" v-model.number="endMeasure" min="1" :max="maxMeasures" />
        </div>
      </div>
      <button @click="addSection" class="add-section-btn">Add Section</button>
    </div>
    
    <div v-if="sections.length === 0" class="no-sections">
      No sections defined yet.
    </div>
    
    <div v-else class="sections-list">
      <div v-for="section in sections" :key="section.id" class="section-item">
        <div class="section-info">
          <span class="section-name">{{ section.name }}</span>
          <span class="section-range">Measures {{ section.startMeasure }} - {{ section.endMeasure }}</span>
        </div>
        <div class="section-actions">
          <button @click="$emit('playSection', section)" class="play-section-btn" title="Play this section">
            ▶
          </button>
          <button @click="$emit('jumpToSection', section)" class="jump-section-btn" title="Jump to this section">
            ↪
          </button>
          <template v-if="!readOnlyMode">
            <button 
              @click="addToSequence(section)"
              class="add-to-sequence-btn" 
              title="Add to playback sequence">
              +
            </button>
            <button @click="$emit('deleteSection', section.id)" class="delete-section-btn" title="Delete this section">
              ✕
            </button>
          </template>
        </div>
      </div>
    </div>
    
    <div class="playback-sequence">
      <h4>Playback Sequence</h4>
      
      <button v-if="debugMode" @click="logSequence" class="debug-btn">Log Sequence</button>
      
      <div v-if="playbackSequence.length === 0" class="no-sequences">
        No playback sequence defined. Add sections to create a sequence.
      </div>
      
      <div v-else class="sequence-list">
        <div v-for="(item, index) in playbackSequence" :key="`seq-${index}`" class="sequence-item">
          <div class="sequence-number">{{ index + 1 }}.</div>
          <div class="sequence-section-name">{{ getSectionName(item.sectionId) }}</div>
          <button v-if="!readOnlyMode" @click="removeFromSequence(index)" class="remove-from-sequence-btn" title="Remove from sequence">
            ✕
          </button>
        </div>
        
        <div class="sequence-controls">
          <button @click="$emit('playSequence', playbackSequence)" class="play-sequence-btn" title="Play entire sequence">
            ▶ Play Sequence
          </button>
          <button v-if="!readOnlyMode" @click="clearSequence" class="clear-sequence-btn" title="Clear sequence">
            Clear
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits, computed, watch, onMounted } from 'vue';

// Define the Section interface
export interface Section {
  id: string;
  name: string;
  startMeasure: number;
  endMeasure: number;
  color?: string;
}

// Define the Sequence Item interface
export interface SequenceItem {
  sectionId: string;
}

const props = defineProps<{
  sections: Section[];
  maxMeasures: number;
  sequenceItems: SequenceItem[];
  readOnlyMode: boolean;
}>();

const emit = defineEmits<{
  (e: 'addSection', section: Omit<Section, 'id'>): void;
  (e: 'deleteSection', sectionId: string): void;
  (e: 'playSection', section: Section): void;
  (e: 'jumpToSection', section: Section): void;
  (e: 'playSequence', sequence: SequenceItem[]): void;
  (e: 'updateSequence', sequence: SequenceItem[]): void;
}>();

// Form state
const sectionName = ref('');
const startMeasure = ref(1);
const endMeasure = ref(2);

// Playback sequence
const playbackSequence = ref<SequenceItem[]>([]);

// Helper function to get section name by ID
const getSectionName = (sectionId: string): string => {
  const section = props.sections.find(s => s.id === sectionId);
  return section ? section.name : 'Unknown Section';
};

// Add new section
const addSection = () => {
  if (!sectionName.value.trim()) {
    alert('Please enter a section name');
    return;
  }
  
  if (startMeasure.value > endMeasure.value) {
    alert('Start measure must be less than or equal to end measure');
    return;
  }
  
  emit('addSection', {
    name: sectionName.value.trim(),
    startMeasure: startMeasure.value,
    endMeasure: endMeasure.value
  });
  
  // Reset form
  sectionName.value = '';
  startMeasure.value = Math.max(1, endMeasure.value);
  endMeasure.value = Math.min(props.maxMeasures, endMeasure.value + 1);
};

// Add section to playback sequence with additional debugging
const addToSequence = (section: Section) => {
  console.log(`Adding section to sequence: ${section.name} (id: ${section.id})`);
  
  // Create a new sequence item
  const newItem: SequenceItem = {
    sectionId: section.id
  };
  
  // Create a new array to ensure Vue's reactivity triggers
  const newSequence = [...playbackSequence.value, newItem];
  playbackSequence.value = newSequence;
  
  // Emit the updated sequence to parent
  emit('updateSequence', newSequence);
  
  console.log(`Sequence now has ${playbackSequence.value.length} sections:`, 
    playbackSequence.value.map(item => {
      const s = props.sections.find(sec => sec.id === item.sectionId);
      return s ? s.name : 'Unknown';
    }).join(', '));
};

// Update the removeFromSequence to also create a new array
const removeFromSequence = (index: number) => {
  // Create a new array to ensure Vue's reactivity triggers
  const newSequence = playbackSequence.value.filter((_, i) => i !== index);
  playbackSequence.value = newSequence;
  
  // Emit the updated sequence to parent
  emit('updateSequence', newSequence);
};

// Update the clearSequence method to also log
const clearSequence = () => {
  console.log('Clearing sequence');
  playbackSequence.value = [];
  
  // Emit the empty sequence to parent
  emit('updateSequence', []);
};

// Add a computed property to check if sequence is empty
const hasSequence = computed(() => playbackSequence.value.length > 0);

// Add a method to log the current sequence to the console
const logSequence = () => {
  console.log('Current sequence:', playbackSequence.value);
  console.log('hasSequence computed value:', hasSequence.value);
};

// Add a watch effect to initialize the playbackSequence from props
onMounted(() => {
  // Initialize playbackSequence from props if provided
  if (props.sequenceItems && props.sequenceItems.length > 0) {
    playbackSequence.value = [...props.sequenceItems];
  }
});

// Watch for changes in the props.sequenceItems
watch(() => props.sequenceItems, (newItems) => {
  if (newItems && JSON.stringify(newItems) !== JSON.stringify(playbackSequence.value)) {
    playbackSequence.value = [...newItems];
  }
}, { deep: true });
</script>

<style scoped>
.sections-panel {
  padding: 15px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-top: 20px;
}

h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #333;
  font-size: 14px;
  text-align: center;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
}

.section-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 15px;
  padding: 10px;
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.section-name-input {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  width: 100%;
}

.measure-range {
  display: flex;
  gap: 10px;
}

.measure-input {
  display: flex;
  align-items: center;
  gap: 5px;
  flex: 1;
}

.measure-input input {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  width: 60px;
}

.add-section-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 15px;
  cursor: pointer;
  font-weight: bold;
}

.add-section-btn:hover {
  background-color: #45a049;
}

.no-sections {
  text-align: center;
  padding: 20px;
  color: #666;
  font-style: italic;
}

.sections-list {
  max-height: 200px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.section-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.section-info {
  display: flex;
  flex-direction: column;
}

.section-name {
  font-weight: bold;
  color: #333;
}

.section-range {
  font-size: 12px;
  color: #777;
}

.section-actions {
  display: flex;
  gap: 5px;
}

.play-section-btn, .jump-section-btn, .delete-section-btn {
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 16px;
}

.play-section-btn {
  background-color: #2196F3;
}

.jump-section-btn {
  background-color: #9C27B0;
}

.delete-section-btn {
  background-color: #f44336;
}

.playback-sequence {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px dashed #ccc;
}

.no-sequences {
  text-align: center;
  padding: 15px;
  color: #666;
  font-style: italic;
  font-size: 14px;
}

.sequence-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 10px;
}

.sequence-item {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.sequence-number {
  font-weight: bold;
  margin-right: 10px;
  color: #555;
  width: 25px;
}

.sequence-section-name {
  flex: 1;
  font-weight: 500;
}

.remove-from-sequence-btn {
  color: white;
  background-color: #f44336;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 14px;
}

.sequence-controls {
  display: flex;
  gap: 10px;
  margin-top: 10px;
  justify-content: center;
}

.play-sequence-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 15px;
  cursor: pointer;
  font-weight: bold;
}

.clear-sequence-btn {
  background-color: #757575;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 15px;
  cursor: pointer;
}

.add-to-sequence-btn {
  color: white;
  background-color: #FF9800;
  border: none;
  border-radius: 4px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
}

.debug-btn {
  background-color: #757575;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 15px;
  cursor: pointer;
  margin-top: 10px;
}

.read-only-banner {
  background-color: rgba(244, 67, 54, 0.1);
  border: 1px solid rgba(244, 67, 54, 0.3);
  border-radius: 4px;
  padding: 8px 12px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}

.read-only-message {
  color: #d32f2f;
  font-size: 14px;
  font-weight: 500;
}

.lock-icon {
  margin-right: 6px;
  font-size: 16px;
}

.read-only-detail {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}
</style> 