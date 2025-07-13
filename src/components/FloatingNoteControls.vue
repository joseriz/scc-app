<template>
  <div class="floating-note-controls" 
       ref="dragHandle"
       :class="{ 'draggable': floatingNoteControlsMode }"
       :style="{ 
         position: floatingNoteControlsMode ? 'fixed' : 'relative',
         left: floatingNoteControlsMode ? position.x + 'px' : 'auto',
         top: floatingNoteControlsMode ? position.y + 'px' : 'auto',
         zIndex: floatingNoteControlsMode ? 1000 : 'auto',
         width: floatingNoteControlsMode ? '400px' : '100%'
       }">
    <div v-if="floatingNoteControlsMode" class="drag-handle" @mousedown="handleMouseDown" @touchstart="handleTouchStart">
      <span class="drag-icon">⋮⋮</span>
      <button class="close-btn" @click="$emit('close')" @mousedown.stop title="Close floating controls">
        ×
      </button>
    </div>
    
    <h4 v-if="floatingNoteControlsMode" @mousedown="handleMouseDown" @touchstart="handleTouchStart" style="cursor: move;">Note Controls</h4>
    
    <!-- Tab Navigation -->
    <div v-if="floatingNoteControlsMode" class="tab-navigation">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="['tab-btn', { active: activeTab === tab.id }]"
        @mousedown.stop
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab Content -->
    <div class="tab-content" :class="{ 'floating-mode': floatingNoteControlsMode }">
      <!-- Duration Tab -->
      <div v-if="activeTab === 'duration' || !floatingNoteControlsMode" class="tab-pane" :class="{ active: activeTab === 'duration' }">
        <div class="control-section duration-section">
          <h4 v-if="!floatingNoteControlsMode">Duration</h4>
          <div class="duration-buttons-grid">
            <button
              v-for="duration in availableDurations"
              :key="duration.value"
              @click="$emit('update:selectedDuration', duration.value)"
              :class="['duration-btn', { active: selectedDuration === duration.value }]"
              @mousedown.stop
            >
              {{ selectedNoteType === 'note'
                ? (usesFallbackSymbols ? duration.fallbackNoteLabel : duration.noteLabel)
                : (usesFallbackSymbols ? duration.fallbackRestLabel : duration.restLabel) }}
            </button>
          </div>
          <div class="note-modifiers">
            <button @click="$emit('toggleDottedNote')" :class="['duration-btn', { active: isDottedNote }]" @mousedown.stop>
              Dotted
            </button>
            <button @click="$emit('toggleTripletNote')" :class="['duration-btn', { active: isTripletNote }]" @mousedown.stop>
              Triplet
            </button>
          </div>
        </div>
      </div>

      <!-- Type Tab -->
      <div v-if="activeTab === 'type' || !floatingNoteControlsMode" class="tab-pane" :class="{ active: activeTab === 'type' }">
        <div class="control-section type-section">
          <h4 v-if="!floatingNoteControlsMode">Type</h4>
          <div class="button-group">
            <button
              @click="$emit('update:selectedNoteType', 'note')"
              :class="['note-btn', { active: selectedNoteType === 'note' }]"
              @mousedown.stop
            >
              Note
            </button>
            <button
              @click="$emit('update:selectedNoteType', 'rest')"
              :class="['note-btn', { active: selectedNoteType === 'rest' }]"
              @mousedown.stop
            >
              Rest
            </button>
          </div>
        </div>
      </div>

      <!-- Accidental Tab -->
      <div v-if="activeTab === 'accidental' || !floatingNoteControlsMode" class="tab-pane" :class="{ active: activeTab === 'accidental' }">
        <div class="control-section accidental-section">
          <h4 v-if="!floatingNoteControlsMode">Accidental</h4>
          <div class="scrollable-buttons">
            <button
              v-for="accidental in availableAccidentals"
              :key="accidental.value"
              @click="handleAccidentalClick(accidental.value)"
              :class="['note-btn', { active: selectedAccidental === accidental.value }]"
              @mousedown.stop
            >
              {{ accidental.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- Octave Tab -->
      <div v-if="activeTab === 'octave' || !floatingNoteControlsMode" class="tab-pane" :class="{ active: activeTab === 'octave' }">
        <div class="control-section octave-section">
          <h4 v-if="!floatingNoteControlsMode">Octave</h4>
          <div class="scrollable-buttons">
            <button
              v-for="octave in [2, 3, 4, 5, 6, 7, 8]"
              :key="octave"
              @click="$emit('update:selectedOctave', octave)"
              :class="['octave-btn', { active: selectedOctave === octave }]"
              @mousedown.stop
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
import { defineProps, defineEmits, ref, onUnmounted } from 'vue';

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
  floatingNoteControlsMode: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:selectedDuration', value: string): void;
  (e: 'update:selectedNoteType', value: string): void;
  (e: 'toggleDottedNote'): void;
  (e: 'toggleTripletNote'): void;
  (e: 'update:selectedAccidental', value: string | null): void;
  (e: 'update:selectedOctave', value: number): void;
  (e: 'close'): void;
}>();

const position = ref({ x: 20, y: 80 }); // Initial position
const isDragging = ref(false);
const dragOffset = ref({ x: 0, y: 0 });
const dragHandle = ref<HTMLElement | null>(null);
const activeTab = ref('duration');

const tabs = [
  { id: 'duration', label: 'Duration' },
  { id: 'type', label: 'Type' },
  { id: 'accidental', label: 'Accidental' },
  { id: 'octave', label: 'Octave' }
];

const handleAccidentalClick = (value: string) => {
  if (props.selectedAccidental === value) {
    emit('update:selectedAccidental', null);
  } else {
    emit('update:selectedAccidental', value);
  }
};

const handleMouseDown = (event: MouseEvent) => {
  // Only allow dragging from the drag handle (but not close button) or the header
  const target = event.target as HTMLElement;
  const isDragHandle = target.closest('.drag-handle') !== null;
  const isHeader = target.tagName === 'H4';
  const isCloseButton = target.closest('.close-btn') !== null;
  const isDragIcon = target.closest('.drag-icon') !== null;
  
  // Only start dragging if:
  // 1. Clicking on the drag icon specifically, OR
  // 2. Clicking on the header (H4), OR  
  // 3. Clicking on the drag handle area but NOT the close button
  const shouldStartDrag = props.floatingNoteControlsMode && (
    isDragIcon || 
    isHeader || 
    (isDragHandle && !isCloseButton)
  );
  
  if (!shouldStartDrag) return;
  
  isDragging.value = true;
  
  dragOffset.value = {
    x: event.clientX - position.value.x,
    y: event.clientY - position.value.y
  };

  document.addEventListener('mousemove', handleDrag);
  document.addEventListener('mouseup', stopDragging);
  
  // Prevent text selection while dragging
  event.preventDefault();
};

const handleTouchStart = (event: TouchEvent) => {
  if (!props.floatingNoteControlsMode) return;
  
  // Check if touching the close button
  const target = event.target as HTMLElement;
  const isCloseButton = target.closest('.close-btn') !== null;
  
  // Don't start dragging if touching the close button
  if (isCloseButton) return;
  
  isDragging.value = true;
  
  dragOffset.value = {
    x: event.touches[0].clientX - position.value.x,
    y: event.touches[0].clientY - position.value.y
  };

  document.addEventListener('touchmove', handleDrag);
  document.addEventListener('touchend', stopDragging);
  
  // Prevent scrolling while dragging
  event.preventDefault();
};

const handleDrag = (event: MouseEvent | TouchEvent) => {
  if (!isDragging.value || !props.floatingNoteControlsMode) return;
  
  const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
  const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;
  
  position.value = {
    x: clientX - dragOffset.value.x,
    y: clientY - dragOffset.value.y
  };
  
  // Prevent text selection while dragging
  event.preventDefault();
};

const stopDragging = () => {
  isDragging.value = false;
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('touchmove', handleDrag);
  document.removeEventListener('mouseup', stopDragging);
  document.removeEventListener('touchend', stopDragging);
};

onUnmounted(() => {
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('touchmove', handleDrag);
  document.removeEventListener('mouseup', stopDragging);
  document.removeEventListener('touchend', stopDragging);
});
</script>

<style scoped>
.floating-note-controls {
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 10px;
  width: 100%;
  box-sizing: border-box;
  user-select: none;
}

.floating-note-controls.draggable {
  position: fixed;
  width: 400px;
  touch-action: none;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.drag-handle {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: move;
  background-color: #e0e0e0;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  border-bottom: 1px solid #ccc;
}

.close-btn {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  border: none;
  background: #ff4444;
  color: white;
  border-radius: 50%;
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
}

.close-btn:hover {
  background: #cc0000;
}

.drag-icon {
  color: #666;
  font-size: 14px;
  transform: rotate(90deg);
  user-select: none;
}

.floating-note-controls h4 {
  margin-top: 15px;
  margin-bottom: 10px;
  color: #333;
  font-size: 16px;
  text-align: center;
  border-bottom: 1px solid #ddd;
  padding-bottom: 5px;
}

.tab-navigation {
  display: flex;
  gap: 2px;
  margin-bottom: 10px;
  border-bottom: 1px solid #ddd;
}

.tab-btn {
  flex: 1;
  padding: 8px 12px;
  border: none;
  background: #e9e9e9;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
  border-radius: 4px 4px 0 0;
}

.tab-btn.active {
  background: #2196F3;
  color: white;
}

.tab-btn:hover:not(.active) {
  background: #d4d4d4;
}

.tab-content {
  min-height: 200px;
}

.tab-content.floating-mode {
  min-height: 180px;
}

.tab-pane {
  display: none;
}

.tab-pane.active {
  display: block;
}

/* Show all tabs in non-floating mode */
.tab-content:not(.floating-mode) .tab-pane {
  display: block;
}

.control-section {
  margin-bottom: 15px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  min-height: 140px;
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

.duration-buttons-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  width: 100%;
  margin-bottom: 12px;
}

.duration-btn {
  width: 100%;
  height: 45px;
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

.note-modifiers {
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

/* Responsive adjustments for floating mode */
@media (max-width: 480px) {
  .floating-note-controls.draggable {
    width: 320px;
  }
  
  .duration-buttons-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .tab-btn {
    font-size: 11px;
    padding: 6px 8px;
  }
}
</style> 