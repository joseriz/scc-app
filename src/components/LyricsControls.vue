<template>
  <div class="lyrics-control-section" 
       ref="dragHandle"
       :class="{ 'draggable': lyricsEditMode }"
       :style="{ 
         position: lyricsEditMode ? 'fixed' : 'relative',
         left: lyricsEditMode ? position.x + 'px' : 'auto',
         top: lyricsEditMode ? position.y + 'px' : 'auto',
         zIndex: lyricsEditMode ? 1000 : 'auto',
         width: lyricsEditMode ? '300px' : '100%'
       }">
    <div v-if="lyricsEditMode" class="drag-handle" @mousedown="handleMouseDown" @touchstart="handleTouchStart">
      <span class="drag-icon">⋮⋮</span>
      <button class="close-btn" @click="$emit('close')" @mousedown.stop title="Close lyrics edit mode">
        ×
      </button>
    </div>
    <h4 @mousedown="lyricsEditMode ? handleMouseDown($event) : null" @touchstart="lyricsEditMode ? handleTouchStart($event) : null" :style="{ cursor: lyricsEditMode ? 'move' : 'default' }">Lyrics</h4>
    <div class="lyrics-input-container">
      <input
        ref="lyricInput"
        type="text"
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        placeholder="Enter lyric for selected note"
        :disabled="!selectedNoteId"
        @keypress="handleKeypress"
        class="lyric-input"
        @mousedown.stop
      />
      <button
        @click="addLyric"
        :disabled="!selectedNoteId"
        class="add-lyric-btn"
      >
        Add Lyric
      </button>
    </div>
    <p class="lyrics-help-text">
      Select a note first, then enter a lyric and press Enter or click "Add Lyric".
    </p>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref, onMounted, onUnmounted, watch, nextTick } from 'vue';

const props = defineProps<{
  modelValue: string;
  selectedNoteId: string | null;
  lyricsEditMode: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'setLyric', noteId: string, lyric: string): void;
  (e: 'close'): void;
}>();

const position = ref({ x: 20, y: 20 }); // Initial position
const isDragging = ref(false);
const dragOffset = ref({ x: 0, y: 0 });
const dragHandle = ref<HTMLElement | null>(null);
const lyricInput = ref<HTMLInputElement | null>(null);

// Watch for changes in selectedNoteId and focus the input when a note is selected
watch(() => props.selectedNoteId, (newNoteId) => {
  if (newNoteId && lyricInput.value) {
    // Use nextTick to ensure the input is enabled before focusing
    nextTick(() => {
      lyricInput.value?.focus();
    });
  }
});

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
  const shouldStartDrag = props.lyricsEditMode && (
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
  if (!props.lyricsEditMode) return;
  
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
  if (!isDragging.value || !props.lyricsEditMode) return;
  
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

const addLyric = () => {
  if (props.selectedNoteId) {
    emit('setLyric', props.selectedNoteId, props.modelValue);
  }
};

const handleKeypress = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && props.selectedNoteId) {
    event.preventDefault();
    addLyric();
  }
};
</script>

<style scoped>
.lyrics-control-section {
  margin-top: 15px;
  padding: 10px;
  background-color: #f0f7ff;
  border: 1px solid #cce5ff;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  user-select: none;
}

.lyrics-control-section.draggable {
  position: fixed;
  width: 300px;
  touch-action: none;
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
  background-color: #e0f0ff;
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
  border-bottom: 1px solid #cce5ff;
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

.lyrics-control-section h4 {
  margin-top: 15px;
  margin-bottom: 8px;
  color: #333;
  font-size: 14px;
  text-align: center;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
}

.lyrics-input-container {
  display: flex;
  gap: 10px;
  margin-bottom: 8px;
}

.lyric-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

.add-lyric-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  font-weight: bold;
  white-space: nowrap;
}

.add-lyric-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.lyrics-help-text {
  font-size: 12px;
  color: #666;
  font-style: italic;
  margin-top: 5px;
  margin-bottom: 0;
}
</style> 