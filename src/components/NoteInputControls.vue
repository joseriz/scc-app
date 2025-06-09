<template>
  <div class="note-controls-container">
    <div class="note-controls">
      <div class="note-controls-grid">
        <!-- Duration Section -->
        <div class="control-section duration-section">
          <h4>Duration</h4>
          <div class="duration-buttons-grid">
            <button
              v-for="duration in availableDurations"
              :key="duration.value"
              @click="$emit('update:selectedDuration', duration.value)"
              :class="['duration-btn', { active: selectedDuration === duration.value }]"
            >
              {{ selectedNoteType === 'note'
                ? (usesFallbackSymbols ? duration.fallbackNoteLabel : duration.noteLabel)
                : (usesFallbackSymbols ? duration.fallbackRestLabel : duration.restLabel) }}
            </button>
          </div>
          <div class="note-modifiers">
            <button @click="$emit('toggleDottedNote')" :class="['duration-btn', { active: isDottedNote }]">
              Dotted
            </button>
            <button @click="$emit('toggleTripletNote')" :class="['duration-btn', { active: isTripletNote }]">
              Triplet
            </button>
          </div>
        </div>

        <!-- Type Section -->
        <div class="control-section type-section">
          <h4>Type</h4>
          <div class="button-group">
            <button
              @click="$emit('update:selectedNoteType', 'note')"
              :class="['note-btn', { active: selectedNoteType === 'note' }]"
            >
              Note
            </button>
            <button
              @click="$emit('update:selectedNoteType', 'rest')"
              :class="['note-btn', { active: selectedNoteType === 'rest' }]"
            >
              Rest
            </button>
          </div>
        </div>

        <!-- Accidental Section -->
        <div class="control-section accidental-section">
          <h4>Accidental</h4>
          <div class="scrollable-buttons">
            <button
              v-for="accidental in availableAccidentals"
              :key="accidental.value"
              @click="handleAccidentalClick(accidental.value)"
              :class="['note-btn', { active: selectedAccidental === accidental.value }]"
            >
              {{ accidental.label }}
            </button>
          </div>
        </div>

        <!-- Octave Section -->
        <div class="control-section octave-section">
          <h4>Octave</h4>
          <div class="scrollable-buttons">
            <button
              v-for="octave in [2, 3, 4, 5, 6, 7, 8]"
              :key="octave"
              @click="$emit('update:selectedOctave', octave)"
              :class="['octave-btn', { active: selectedOctave === octave }]"
            >
              {{ octave }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

interface DurationOption {
  value: string;
  noteLabel: string;
  restLabel: string;
  fallbackNoteLabel: string;
  fallbackRestLabel: string;
}

interface AccidentalOption {
  value: string;
  label: string;
}

const props = defineProps<{
  selectedDuration: string;
  selectedNoteType: string;
  isDottedNote: boolean;
  isTripletNote: boolean;
  availableDurations: DurationOption[];
  usesFallbackSymbols: boolean;
  selectedAccidental: string | null;
  availableAccidentals: AccidentalOption[];
  selectedOctave: number;
}>();

const emit = defineEmits<{
  (e: 'update:selectedDuration', value: string): void;
  (e: 'update:selectedNoteType', value: string): void;
  (e: 'toggleDottedNote'): void;
  (e: 'toggleTripletNote'): void;
  (e: 'update:selectedAccidental', value: string | null): void;
  (e: 'update:selectedOctave', value: number): void;
}>();

const handleAccidentalClick = (value: string) => {
  if (props.selectedAccidental === value) {
    emit('update:selectedAccidental', null);
  } else {
    emit('update:selectedAccidental', value);
  }
};
</script>

<style scoped>
.note-controls-container {
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 10px;
  width: 100%;
  box-sizing: border-box;
}

.note-controls {
  /* display: flex; From global.css, might not be needed if grid is used directly */
  /* gap: 5px; From global.css */
}

.note-controls-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 12px;
  width: 100%;
  height: 100%;
  grid-template-areas: 
    "duration type"
    "accidental octave";
}

.control-section {
  margin-bottom: 0;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 140px;
}

/* Grid area assignments */
.duration-section {
  grid-area: duration;
}

.type-section {
  grid-area: type;
}

.accidental-section {
  grid-area: accidental;
}

.octave-section {
  grid-area: octave;
}

.control-section h4 {
  margin-top: 0;
  margin-bottom: 12px;
  color: #333;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  border-bottom: 1px solid #ddd;
  padding-bottom: 8px;
}

.scrollable-buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  width: 100%;
  flex: 1;
  align-content: flex-start;
}

.note-btn, .octave-btn {
  flex: 0 0 auto;
  min-width: 48px;
  height: 48px;
  border: 2px solid #ddd;
  border-radius: 8px;
  background: white;
  font-size: 18px;
  line-height: 1;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #333;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.note-btn:not(.active), .octave-btn:not(.active) {
    color: #333;
    background: #f7f7f7;
    border-color: #ddd;
}


.note-btn.active, .octave-btn.active {
  background: #2196F3;
  color: white;
  border-color: #1976D2;
  box-shadow: 0 4px 8px rgba(33, 150, 243, 0.3);
  font-weight: 600;
  transform: translateY(-1px);
}

.note-modifiers {
  margin-top: 12px;
  display: flex;
  justify-content: center;
  gap: 12px;
  width: 100%;
}

.note-modifiers button {
  font-size: 14px;
  flex: 1;
  max-width: 80px;
  height: 36px;
  padding: 8px 12px;
  border: 2px solid #ddd;
  border-radius: 6px;
  background: white;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.note-modifiers button.active {
  background: #2196F3;
  color: white;
  border-color: #1976D2;
  transform: translateY(-1px);
}


.button-group {
  display: flex;
  gap: 12px;
  width: 100%;
  justify-content: center;
  flex: 1;
  align-items: center;
}

.button-group button {
  flex: 1;
  height: 50px;
  font-size: 16px;
  font-weight: 600;
  border: 2px solid #ddd;
  border-radius: 8px;
  background: white;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  cursor: pointer;
  color: #333;
}

.button-group button.active {
  background: #2196F3;
  color: white;
  border-color: #1976D2;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(33, 150, 243, 0.3);
}

/* Duration Section Specific Styling */
.duration-buttons-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  width: 100%;
  margin-bottom: 12px;
}

.duration-btn {
  flex: 0 0 auto;
  width: 100%;
  height: 50px;
  border: 2px solid #ddd;
  border-radius: 8px;
  background: white;
  font-size: 16px;
  line-height: 1;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #333;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.duration-btn.active {
  background: #2196F3;
  color: white;
  border-color: #1976D2;
  box-shadow: 0 4px 8px rgba(33, 150, 243, 0.3);
  font-weight: 600;
  transform: translateY(-1px);
}

.duration-section .note-btn {
  font-family: 'Times New Roman', serif;
  font-size: 20px;
  font-weight: normal;
}

.accidental-section .note-btn {
  font-size: 18px;
  font-weight: normal;
}

.octave-section .octave-btn {
  font-weight: bold;
  font-size: 16px;
}
/* Responsive grid layout */
@media (min-width: 768px) {
  .note-controls-grid {
    grid-template-columns: 2fr 1fr;
    gap: 20px;
  }
  
  .control-section {
    min-height: 160px;
  }
  
  .duration-buttons-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

@media (min-width: 1024px) {
  .note-controls-container {
    padding: 20px;
  }
  
  .note-controls-grid {
    gap: 25px;
  }
  
  .control-section {
    padding: 20px;
    min-height: 180px;
  }
}

@media (max-width: 767px) {
  .note-controls-grid {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto auto;
    gap: 15px;
    grid-template-areas: 
      "duration"
      "type"
      "accidental"
      "octave";
  }
  
  .control-section {
    min-height: 130px;
  }
  
  .duration-buttons-grid {
    grid-template-columns: repeat(5, 1fr);
    gap: 6px;
  }
  
  .duration-btn {
    height: 45px;
    font-size: 20px;
  }
}

@media (max-width: 480px) {
  .note-controls-container {
    padding: 8px;
  }
  
  .note-controls-grid {
    gap: 12px;
  }
  
  .control-section {
    padding: 12px;
    min-height: 120px;
  }
  
  .control-section h4 {
    font-size: 13px;
    margin-bottom: 10px;
  }
  
  .duration-buttons-grid {
    grid-template-columns: repeat(5, 1fr);
    gap: 4px;
  }
  
  .duration-btn {
    height: 40px;
    font-size: 20px;
    padding: 4px;
  }
  
  .note-btn, .octave-btn {
    min-width: 38px;
    height: 40px;
    font-size: 14px;
    padding: 6px;
  }
  
  .button-group button {
    height: 45px;
    font-size: 14px;
  }
  
  .note-modifiers button {
    height: 32px;
    font-size: 12px;
    padding: 6px 10px;
  }
}
</style> 