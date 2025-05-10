<template>
  <div class="note-controls-container">
    <div class="note-controls">
      <div class="note-controls-grid">
        <!-- Duration Section -->
        <div class="control-section duration-section">
          <h4>Duration</h4>
          <div class="scrollable-buttons">
            <button
              v-for="duration in availableDurations"
              :key="duration.value"
              @click="$emit('update:selectedDuration', duration.value)"
              :class="['note-btn', { active: selectedDuration === duration.value }]"
            >
              {{ selectedNoteType === 'note'
                ? (usesFallbackSymbols ? duration.fallbackNoteLabel : duration.noteLabel)
                : (usesFallbackSymbols ? duration.fallbackRestLabel : duration.restLabel) }}
            </button>
          </div>
          <div class="dotted-note-toggle">
            <button @click="$emit('toggleDottedNote')" :class="['note-btn', { active: isDottedNote }]">
              Dotted
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
              v-for="octave in [2, 3, 4, 5, 6]"
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
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.control-section {
  margin-bottom: 10px; /* Was 15px */
  padding: 8px; /* Was 10px */
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.control-section h4 {
  margin-top: 0;
  margin-bottom: 5px; /* Was 8px */
  color: #333;
  font-size: 12px; /* Was 14px */
  text-align: center;
  border-bottom: 1px solid #eee;
  padding-bottom: 3px; /* Was 5px */
}

.scrollable-buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 5px;
}

.note-btn, .octave-btn {
  flex: 0 0 auto;
  min-width: 36px; /* Was 40px */
  height: 36px; /* Was 40px */
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  font-size: 16px; /* Was 18px, then 16px */
  line-height: 1;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: #333;
  font-weight: bold;
  text-shadow: none;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.note-btn:not(.active), .octave-btn:not(.active) {
    color: #333;
    background: #f7f7f7;
    border-color: #ddd;
}


.note-btn.active, .octave-btn.active {
  background: #2196F3;
  color: white;
  border-color: #0d8aee;
  box-shadow: 0 0 5px rgba(33, 150, 243, 0.5);
  font-weight: bold;
}

.dotted-note-toggle {
  margin-top: 8px; /* Was 8px */
  display: flex;
  justify-content: center;
}

.dotted-note-toggle button {
  /* width: 100%; */ /* Removed for flexibility with note-btn class */
  /* max-width: 120px; */ /* Removed */
  /* height: 36px; */ /* Handled by note-btn */
  /* background: #4CAF50; */ /* Handled by note-btn */
  /* color: white; */ /* Handled by note-btn */
  /* border: none; */ /* Handled by note-btn */
  /* border-radius: 4px; */ /* Handled by note-btn */
  font-size: 14px;
  /* font-weight: bold; */ /* Handled by note-btn */
  /* cursor: pointer; */ /* Handled by note-btn */
  /* transition: all 0.2s; */ /* Handled by note-btn */
}

.dotted-note-toggle button.active {
  /* background: #2196F3; */ /* Handled by note-btn.active */
  /* box-shadow: 0 0 5px rgba(33, 150, 243, 0.5); */ /* Handled by note-btn.active */
}


.button-group {
  display: flex;
  gap: 5px;
  width: 100%;
}

.button-group button {
  flex: 1;
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
@media (max-width: 480px) {
    .note-controls-grid {
      grid-template-columns: 1fr 1fr;
    }
    .note-btn, .octave-btn {
      min-width: 32px;
      height: 32px;
      font-size: 14px;
    }
    .octave-btn {
      min-width: 25px; /* Ensure this is enough for the number */
    }
  }
</style> 