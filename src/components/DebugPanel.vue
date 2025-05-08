<template>
  <div v-if="debugMode" class="debug-panel">
    <h3>Debug Panel</h3>
    <div class="debug-controls">
      <div>
        <p>Show Note Positions:</p>
        <button @click="$emit('toggleShowNotePositions')" :class="['debug-btn', { active: showNotePositions }]">
          {{ showNotePositions ? 'Hide Pitches' : 'Show Pitches' }}
        </button>
      </div>
      <div>
        <p>Test All Notes:</p>
        <button @click="$emit('testAllNotes')" class="debug-btn">
          Place All Notes on Staff
        </button>
      </div>
    </div>
    <p>Last Click Position: {{ lastClickY }}px</p>
    <p>Selected Octave: {{ selectedOctave }}</p>
    <p class="debug-hint">Use "Show Pitches" to see note names on the staff. Use "Test All Notes" to place all available notes on the staff.</p>

    <div>
      <h4>Ledger Lines Debug:</h4>
      <div v-for="note in notesForDebug" :key="`debug-${note.id}`">
        <template v-if="note.type === 'note' && note.pitch">
          <p>Note: {{ note.pitch }} -
             Above: {{ needsLedgerLines(note, 'above') ? 'Yes' : 'No' }} -
             Below: {{ needsLedgerLines(note, 'below') ? 'Yes' : 'No' }}</p>
          <p v-if="needsLedgerLines(note, 'above')">
            Above lines: {{ getLedgerLines(note, 'above').join(', ') }}
          </p>
          <p v-if="needsLedgerLines(note, 'below')">
            Below lines: {{ getLedgerLines(note, 'below').join(', ') }}
          </p>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
// Assuming Note is imported from a shared types file or NotationEditorView
// For example: import type { Note } from '@/types/notation';

interface DebugNote { // Simplified for this component's needs
  id: string;
  type: "note" | "rest";
  pitch?: string;
  verticalPosition: number; // Needed for ledger line calculation context
  // Add other properties if your ledger line functions depend on them
}

const props = defineProps<{
  debugMode: boolean;
  showNotePositions: boolean;
  lastClickY: number;
  selectedOctave: number;
  notesForDebug: DebugNote[]; // Use a more specific type if possible
  needsLedgerLines: (note: DebugNote, side: 'above' | 'below') => boolean;
  getLedgerLines: (note: DebugNote, side: 'above' | 'below') => number[];
}>();

defineEmits<{
  (e: 'toggleShowNotePositions'): void;
  (e: 'testAllNotes'): void;
}>();
</script>

<style scoped>
.debug-panel {
  margin-top: 20px;
  padding: 15px;
  background: #e3f2fd;
  border: 1px solid #2196F3;
  border-radius: 4px;
  font-size: 13px;
}
.debug-panel h3 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #1976D2;
  text-align: center;
}
.debug-panel h4 {
  margin-top: 15px;
  margin-bottom: 5px;
  color: #1976D2;
}

.debug-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin: 10px 0;
}
.debug-controls > div {
  flex: 1;
  min-width: 200px;
}
.debug-controls p {
  margin-top: 0;
  margin-bottom: 5px;
  font-weight: 500;
}

.debug-btn {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  background: #ff5722;
  color: white;
  cursor: pointer;
  margin-top: 5px;
  font-size: 13px;
  transition: background-color 0.2s;
}
.debug-btn:hover {
  background-color: #e64a19;
}
.debug-btn.active {
  background: #9c27b0;
}
.debug-btn.active:hover {
  background: #7b1fa2;
}

.debug-hint {
  font-style: italic;
  color: #555; /* Was #666 */
  margin-top: 10px;
  font-size: 12px;
}
.debug-panel p {
  margin: 5px 0;
}
</style> 