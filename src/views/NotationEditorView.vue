<template>
  <!-- Add responsive meta tag -->
  <div class="notation-editor">
    <AppHeader v-model:keySignature="keySignature"
      v-model:timeSignature="timeSignature"
      :selectedClef="staves.length > 0 ? staves[0].clef : 'treble'"
      @keySignatureChange="changeKeySignatureDirectly" @timeSignatureChange="updateTimeSignature" />

    <!-- Floating Help Button -->
    <div @click="showHelp = true" class="floating-help-btn">
      ?
    </div>

    <TempoControl v-model="tempo" />

    <!-- Button to add a new staff -->
    <div class="add-staff-controls">
      <button @click="addNewStaff" class="add-staff-btn">Add New Staff</button>
    </div>

    <!-- Staves container -->
    <div class="staves-wrapper">
      <div v-for="(stave, staveIndex) in staves" :key="stave.id" class="staff-outer-container">
        <div class="staff-header-controls">
          <span 
            v-if="editingStaffNameId !== stave.id" 
            class="staff-name" 
            @click="editStaffName(stave)" 
            title="Click to rename staff"
          >
            {{ stave.name || `Staff ${staveIndex + 1}` }}
          </span>
          <input 
            v-else 
            type="text"
            :value="stave.name || `Staff ${staveIndex + 1}`"
            @blur="saveStaffName(stave, $event)"
            @keyup.enter="saveStaffName(stave, $event)"
            @keyup.esc="cancelEditStaffName(stave, $event)"
            ref="staffNameInput"
            class="staff-name-input"
          />
          <select v-model="stave.clef" @change="handleStaffClefChange(stave)">
            <option value="treble">Treble</option>
            <option value="bass">Bass</option>
          </select>
          <button @click="toggleStaffCollapse(stave)" class="collapse-staff-btn">
            {{ stave.isCollapsed ? 'Expand' : 'Collapse' }}
          </button>
          <button v-if="staves.length > 1" @click="removeStaff(stave.id)" class="remove-staff-btn">Remove Staff</button>
        </div>

    <!-- Staff container with improved mobile layout - conditionally render based on isCollapsed -->
    <div v-if="!stave.isCollapsed" class="staff-container" :style="{ minHeight: staffContainerMinHeight }">
      <div class="clef">
            <img v-if="stave.clef === 'treble'" src="@/assets/treble-clef.svg" alt="Treble Clef" />
            <img v-else-if="stave.clef === 'bass'" src="@/assets/bass-clef.svg" alt="Bass Clef" />
      </div>

      <!-- Key Signature -->
      <div class="key-signature">
            <div v-for="(accidental, index) in currentKeySignatureAccidentals" :key="`key-sig-${stave.id}-${index}`"
          class="key-signature-accidental" :style="{
                top: `${getKeySignaturePosition(accidental, stave.clef)}px`,
                left: `${15 + (index * 8)}px`
          }">
          {{ getAccidentalSymbolForKeySignature(accidental) }}
        </div>
      </div>

      <!-- Update time signature positioning to appear after key signature -->
      <div class="time-signature-display"
        :style="{ left: `${45 + (currentKeySignatureAccidentals.length * 10) + 5}px` }">
        <div class="time-signature-numerator">{{ timeSignatureNumerator }}</div>
        <div class="time-signature-denominator">{{ timeSignatureDenominator }}</div>
      </div>

      <!-- Scrollable staff -->
      <div class="staff-scroll-container">
            <div class="staff" @click="handleStaffClick($event, stave.id)" @mousedown="startDrag" @touchstart="startDrag" :style="{
          width: `${staffWidth}px`,
          transform: `translateX(-${scrollPosition}px)`
        }">
          <!-- Staff lines -->
          <div class="staff-lines">
                <div class="staff-line" v-for="i in 5" :key="`line-${stave.id}-${i}`"></div>
          </div>

          <!-- Add this right after the staff-lines div and before the notes container -->
              <!-- Render section markers on all staves -->
              <div class="section-markers-container">
            <div v-for="section in sections" 
                 :key="`section-${section.id}`" 
                 class="section-markers"
                 :class="{ 'playing-section': section.id === playingSequenceSectionId }">
              <!-- Start marker -->
              <div class="section-marker section-start" 
                   :style="{ 
                     left: `${getSectionPosition(section.startMeasure)}px`,
                     top: '80px' 
                   }"
                   :title="`${section.name} (Start)`">
                ◀ {{ section.name }}
              </div>
              
              <!-- End marker -->
              <div class="section-marker section-end" 
                   :style="{ 
                     left: `${getSectionPosition(section.endMeasure + 1) - 6}px`,
                     top: '80px' 
                   }"
                   :title="`${section.name} (End)`">
                {{ section.name }} ▶
              </div>
              
              <!-- Section background highlight -->
              <div class="section-background" 
                   :style="{ 
                     left: `${getSectionPosition(section.startMeasure)}px`,
                     width: `${getSectionPosition(section.endMeasure + 1) - getSectionPosition(section.startMeasure)}px`,
                     height: '100%'
                   }">
              </div>
            </div>
          </div>

          <!-- Then remove the duplicate section markers from inside the ledger lines -->

          <!-- Measure bars -->
              <div v-for="(barline, i) in barlines" :key="`barline-${stave.id}-${i}`" class="barline" :class="{
            'barline-single': barline.type === 'single',
            'barline-double': barline.type === 'double',
            'barline-final': barline.type === 'final',
            'barline-repeat-start': barline.type === 'repeat-start',
            'barline-repeat-end': barline.type === 'repeat-end'
          }" :style="{ left: `${barline.position}px` }">

            <!-- Add repeat dots for repeat barlines -->
            <template v-if="barline.type === 'repeat-start' || barline.type === 'repeat-end'">
              <div class="repeat-dots">
                <div class="repeat-dot"></div>
                <div class="repeat-dot"></div>
              </div>
            </template>

                <!-- Add measure number (only show if showMeasureNumbers is true and on the first staff) -->
                <div v-if="staveIndex === 0 && showMeasureNumbers && barline.measureNumber > 0" class="measure-number">
              {{ barline.measureNumber }}
            </div>
          </div>

          <!-- Beat markers (optional, for visual aid) -->
              <div v-if="showBeatMarkers" v-for="beat in beatPositions" :key="`beat-${stave.id}-${beat.position}`" class="beat-marker"
            :style="{ left: `${beat.position}px` }">
          </div>

          <!-- Notes container -->
          <div class="notes-container">
            <!-- Ledger lines for notes -->
                <template v-for="note in notesForStaff(stave.id)" :key="`ledger-${note.id}`">
              <!-- Ledger lines for notes above the staff -->
                  <div v-if="needsLedgerLines(note, 'above', note.staffClef)" class="ledger-lines-container above" :style="{
                left: `${note.position * 50 - 10}px`
              }">
                    <div v-for="linePos in getLedgerLines(note, 'above', note.staffClef)" :key="`above-${note.id}-${linePos}`"
                  class="ledger-line" :style="{
                    top: `${linePos}px`,
                    width: '20px'
                  }">
                </div>
              </div>

              <!-- Ledger lines for notes below the staff -->
                  <div v-if="needsLedgerLines(note, 'below', note.staffClef)" class="ledger-lines-container below" :style="{
                left: `${note.position * 50 - 10}px`
              }">
                    <div v-for="linePos in getLedgerLines(note, 'below', note.staffClef)" :key="`below-${note.id}-${linePos}`"
                  class="ledger-line" :style="{
                    top: `${linePos}px`,
                    width: '20px'
                  }">
                </div>
              </div>
            </template>

            <!-- Notes -->
                <div v-for="note in notesForStaff(stave.id)" :key="note.id" class="note" :class="{
              'rest': note.type === 'rest',
              'playing': currentPlayingNoteIds.includes(note.id), // Keep class for semantics or other non-background/transform styles
              'selected': note.id === selectedNoteId,
              'key-signature-affected': note.type === 'note' &&
                note.pitch &&
                !note.pitch.includes('#') &&
                !note.pitch.includes('b') &&
                isNoteAffectedByKeySignature(note.pitch.charAt(0)),
              'dotted': note.dotted,
              'whole-note': note.duration === 'whole',
              'has-lyric': note.lyric,
              'natural-accidental': note.explicitNatural
            }" :style="[
                  getNoteStyle(note), // Base styles from function
                  currentPlayingNoteIds.includes(note.id) 
                    ? { 
                        backgroundColor: 'rgba(255, 255, 0, 0.3)', 
                        transform: 'translate(-50%, -50%) scale(1.1)' 
                      } 
                    : { 
                        backgroundColor: 'transparent', // Explicit default background
                        transform: 'translate(-50%, -50%)' // Explicit default transform
                      }
                ]" :data-duration="note.duration" :data-voice="note.voiceId" @contextmenu.prevent="removeNote(note)"
              @touchstart="handleTouchStart(note, $event)" @touchend="handleTouchEnd" @touchmove="handleTouchMove"
              @click.stop="selectNote(note)">

              <!-- For rests, use the existing symbol -->
              <template v-if="note.type === 'rest'">
                {{ getNoteSymbol(note) }}
                <!-- Add dot for dotted rests -->
                <span v-if="note.dotted" class="dot">•</span>
              </template>

              <!-- For notes, use separate notehead and stem -->
              <template v-else>
                <!-- Notehead -->
                <div class="notehead" :class="note.duration">
                  <!-- Different noteheads for different durations -->
                </div>

                <!-- Stem (only for non-whole notes) -->
                <div v-if="note.duration !== 'whole'" class="stem"
                      :class="[getStemDirection(note.pitch || '', note.staffClef), note.duration]">
                </div>

                <!-- Flag for eighth and sixteenth notes -->
                <div v-if="['eighth', 'sixteenth'].includes(note.duration)" class="flag"
                      :class="[getStemDirection(note.pitch || '', note.staffClef), note.duration]">
                </div>

                <!-- Add dot for dotted notes -->
                <span v-if="note.dotted" class="dot">•</span>
              </template>

              <!-- Accidental -->
              <span v-if="note.type === 'note' && note.pitch && (
    (note.pitch.includes('#') || note.pitch.includes('b')) || 
    isNoteAffectedByKeySignature(note.pitch.charAt(0)) ||
    note.explicitNatural
  )" class="accidental">
  {{ 
    note.explicitNatural ? '♮' : 
    (note.pitch.includes('#') || note.pitch.includes('b')) ?
      getAccidentalSymbol(note) :
      getAccidentalSymbolForKeySignature(getKeySignatureAccidentalForNote(note.pitch.charAt(0)))
  }}
</span>
            </div>

                <!-- Chord symbols (render only on the first staff) -->
                <div v-if="staveIndex === 0" v-for="chord in chordSymbols" :key="chord.id" class="chord-symbol" :style="{
              left: `${chord.position * 50}px`,
              top: `${chord.top}px`
            }">
              {{ formatChordName(chord.chordName) }}
            </div>

            <!-- ADD Lyric Rendering - Separate loop outside the notes loop -->
                <div v-for="note in notesForStaffWithLyrics(stave.id)" :key="`lyric-${note.id}`" class="lyric"
              :class="{ 'playing': currentPlayingNoteIds.includes(note.id) }" :style="{
                left: `${note.position * 50}px`,
                    top: getLyricVerticalOffset(note.voiceId, stave.id), // Pass staveId
                    color: currentPlayingNoteIds.includes(note.id) ? '#f44336' : (note.voiceColor || '#333')
              }">
              {{ note.lyric }}
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>


    <!-- Scroll controls (global for all staves) -->
    <div class="staff-scroll-controls-global">
        <button @click="scrollStaff('left')" class="scroll-btn left" :disabled="scrollPosition === 0">
          ◀
        </button>
        <button @click="extendStaff" class="extend-btn">
          Extend Staff
        </button>
        <button @click="scrollStaff('right')" class="scroll-btn right" :disabled="scrollPosition >= maxScrollPosition">
          ▶
        </button>
    </div>
    

    <PlaybackControls :is-playing="isPlaying" :is-paused="isPaused" @toggle-playback="togglePlayback"
      @stop-playback="stopPlayback" @clear-or-restart="handleClearOrRestart" />

    <PlaybackSettings v-model:playbackStartMeasure="playbackStartMeasure"
      v-model:playbackEndMeasure="playbackEndMeasure" :maxMeasures="barlines.length"
      v-model:autoScrollToPlayingNote="autoScrollToPlayingNote" v-model:showMeasureNumbers="showMeasureNumbers" />

    <!-- Mobile-optimized note controls with tabs -->
    <div class="mobile-tabs">
      <button @click="activeTab = 'notes'" :class="['tab-btn', { active: activeTab === 'notes' }]">Notes</button>
      <!-- <button @click="activeTab = 'settings'" :class="['tab-btn', { active: activeTab === 'settings' }]">Settings</button> -->
      <button @click="activeTab = 'saved'" :class="['tab-btn', { active: activeTab === 'saved' }]">Saved</button>
      <button @click="activeTab = 'sections'"
        :class="['tab-btn', { active: activeTab === 'sections' }]">Sections</button>
    </div>

    <div v-if="activeTab === 'notes'">
      <NoteInputControls v-model:selectedDuration="selectedDuration" v-model:selectedNoteType="selectedNoteType"
        v-model:isDottedNote="isDottedNote" :availableDurations="availableDurations"
        :usesFallbackSymbols="usesFallbackSymbols" v-model:selectedAccidental="selectedAccidental"
        :availableAccidentals="availableAccidentals" v-model:selectedOctave="selectedOctave"
        @toggleDottedNote="toggleDottedNote" />
      <LyricsControls v-model="currentLyric" :selectedNoteId="selectedNoteId" @setLyric="setLyricForNoteHandler" />
    </div>

    <!-- <div v-if="activeTab === 'settings'">
      <SettingsPanel
        :debugMode="debugMode"
        @showChordInput="showChordInput = true"
        @addExampleChords="addExampleChords"
        @toggleDebugMode="toggleDebugMode"
      />
      </div> -->

    <DebugPanel :debugMode="debugMode" :showNotePositions="showNotePositions" :lastClickY="lastClickY"
      :selectedOctave="selectedOctave" :notesForDebug="notes" 
      :needsLedgerLines="needsLedgerLines"
      :getLedgerLines="getLedgerLines" 
      @toggleShowNotePositions="showNotePositions = !showNotePositions"
      @testAllNotes="testAllNotes" />

    <div v-if="activeTab === 'saved'">
      <SavedCompositionsPanel :savedCompositions="savedCompositions" v-model:compositionName="compositionName"
        :currentCompositionId="currentCompositionId" v-model:exportOnlySelectedVoices="exportOnlySelectedVoices"
        @saveComposition="saveComposition" @loadComposition="loadComposition" @updateComposition="updateComposition"
        @saveRename="handleSaveRename" @deleteComposition="deleteComposition"
        @exportAllCompositions="exportAllCompositions" @exportCurrentComposition="exportCurrentComposition"
        @importCompositions="importCompositions" @combineCompositions="combineCompositions"></SavedCompositionsPanel>
    </div>

    <div v-if="activeTab === 'sections'">
      <SectionsPanel
        :sections="sections"
        :maxMeasures="Math.ceil(staffWidth / measureWidthByTimeSignature)"
        :sequenceItems="sequenceItems"
        @addSection="addSection"
        @deleteSection="deleteSection"
        @playSection="playSection"
        @jumpToSection="jumpToSection"
        @playSequence="playSequence"
        @updateSequence="updateSequence"
      />
    </div>

    <HelpGuide :is-visible="showHelp" @close="showHelp = false" />

    <VoiceLayersPanel 
      :voiceLayers="voiceLayers" 
      :staves="staves"
      :activeStaffId="activeStaffId"
      v-model:playSelectedVoicesOnly="playSelectedVoicesOnly"
      @renameVoice="renameVoice" 
      @changeVoiceColor="changeVoiceColor" 
      @switchActiveVoice="switchActiveVoice"
      @toggleVoiceVisibility="toggleVoiceVisibility" 
      @updateVoiceSelection="updateVoiceLayerSelection"
      @confirmDeleteVoice="confirmDeleteVoice" 
      @addVoiceLayer="addVoiceLayer"
      @assignVoiceToStaff="assignVoiceToStaff"
      @changeVolume="handleChangeVoiceVolume"
    />
    
    <!-- Add the FirstTimeInstructionModal component -->
    <FirstTimeInstructionModal 
      :is-visible="showFirstTimeInstructions" 
      @close="closeFirstTimeInstructions" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, reactive, watch, type ComputedRef } from 'vue';
import * as Tone from 'tone';
import { useNotationStore } from '@/stores/notation';
import HelpGuide from '@/components/HelpGuide.vue';
import AppHeader from '@/components/AppHeader.vue';
import TempoControl from '@/components/TempoControl.vue';
import PlaybackControls from '@/components/PlaybackControls.vue';
import NoteInputControls from '@/components/NoteInputControls.vue';
import SavedCompositionsPanel from '@/components/SavedCompositionsPanel.vue';
import PlaybackSettings from '@/components/PlaybackSettings.vue';
import LyricsControls from '@/components/LyricsControls.vue';
import VoiceLayersPanel from '@/components/VoiceLayersPanel.vue';
import SettingsPanel from '@/components/SettingsPanel.vue';
import DebugPanel from '@/components/DebugPanel.vue';
import FirstTimeInstructionModal from '@/components/FirstTimeInstructionModal.vue'; // Import the new component
import { useDebug } from '@/composables/useDebug';
import SectionsPanel from '@/components/SectionsPanel.vue';

// Import types
import type {
  Note as ImportedNote, // Alias the import
  ChordSymbol as ImportedChordSymbol, // Alias the import
  VoiceLayer,
  CompositionData,
  NoteWithVoiceInfo,
  Section,
  SequenceItem,
  Stave, // Import Stave
} from '@/types/types'; // Updated path

// Store
const notationStore = useNotationStore();

// --- CONSOLIDATED INTERFACE DEFINITIONS ---
// All interface definitions (Note, ChordSymbol, VoiceLayer, CompositionData, NoteWithVoiceInfo)
// are now imported. The local definitions below should be removed.

// State variables
// const selectedHeight = ref('middle');
const selectedOctave = ref(4);
const selectedNoteType = ref('note'); // Default to 'note'
const selectedAccidental = ref<string | null>(null); // Initialize as null instead of 'natural'
const selectedDuration = ref('quarter');
const lastClickY = ref(0);
const tempo = ref(120);
// const debugMode = ref(false); // Moved to composable
// const showNotePositions = ref(false); // Moved to composable
const currentPlayingNoteIds = ref<string[]>([]); // Changed from currentPlayingNoteId
// const selectedClef = ref('treble'); // REMOVED - Clef is now per staff
const exportOnlySelectedVoices = ref(false); // New ref for export option

// --- Stave Management ---
const staves = ref<Stave[]>([]);
const activeStaffId = ref<string | null>(null); // ID of the staff currently active for input

// Ref for staff name editing
const editingStaffNameId = ref<string | null>(null);
// const staffNameInput = ref<HTMLInputElement | null>(null); // Old type
const staffNameInput = ref<HTMLInputElement[]>([]); // Correct type: array of input elements

// Helper function to generate a random hex color
const getRandomColor = (): string => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

// Add voice layers and related refs near the top
// Default to one voice with a random color
const voiceLayers = ref<VoiceLayer[]>([]); // Explicitly type voiceLayers

// Track the currently active voice layer
const activeVoiceId = ref(''); // Still defaults to the first voice

// Get the active voice layer
const activeVoice = computed<VoiceLayer>(() => { // Explicitly type activeVoice
  const foundVoice = voiceLayers.value.find(layer => layer.id === activeVoiceId.value);

  if (foundVoice) {
    return foundVoice;
  } else if (voiceLayers.value.length > 0) {
    activeVoiceId.value = voiceLayers.value[0].id;
    // Ensure the active voice's staff is also the active staff
    const newActiveVoice = voiceLayers.value.find(v => v.id === activeVoiceId.value);
    if (newActiveVoice && newActiveVoice.staffId) {
        activeStaffId.value = newActiveVoice.staffId;
    }
    return voiceLayers.value[0];
  } else {
    // Create a default voice if no voices exist
    // This should ideally be rare if initializeDefaultStaffAndVoice works correctly on mount/load
    let staffIdForDefaultVoice = activeStaffId.value;
    if (!staffIdForDefaultVoice && staves.value.length > 0) {
        staffIdForDefaultVoice = staves.value[0].id;
    } else if (!staffIdForDefaultVoice && staves.value.length === 0) {
        // Emergency: if no staves exist, create one.
        const newDefaultStaffId = generateId();
        staves.value.push({ id: newDefaultStaffId, clef: 'treble', order: 0, name: 'Emergency Staff'});
        staffIdForDefaultVoice = newDefaultStaffId;
        activeStaffId.value = newDefaultStaffId; // Make it active
        console.warn("activeVoice computed created an emergency staff.");
    }

    const defaultVoice: VoiceLayer = {
      id: 'voice1_fallback', // More unique ID
      name: 'Voice 1 (Fallback)',
      color: getRandomColor(),
      visible: true,
      active: true,
      selected: true,
      volume: 100, // Default volume as percentage
      notes: [],
      staffId: staffIdForDefaultVoice! // Assert non-null after the logic above
    };

    voiceLayers.value.push(defaultVoice);
    activeVoiceId.value = defaultVoice.id;
    if (defaultVoice.staffId) { // Ensure activeStaffId is also set
        activeStaffId.value = defaultVoice.staffId;
    }
    return defaultVoice;
  }
});

// Update computed property to correctly set voice colors
const allVisibleNotes = computed((): NoteWithVoiceInfo[] => { // Specify return type
  // Get all notes from visible voices
  let allNotes: NoteWithVoiceInfo[] = [];

  voiceLayers.value.forEach(voice => {
    if (voice.visible) {
      const staff = staves.value.find(s => s.id === voice.staffId);
      if (staff) {
      const notesWithVoiceInfo = voice.notes.map(note => ({
        ...note,
        voiceId: voice.id,
          voiceColor: voice.color,
          staffId: staff.id,
          staffClef: staff.clef,
        })) as NoteWithVoiceInfo[];
      allNotes = [...allNotes, ...notesWithVoiceInfo];
      }
    }
  });

  // Sort by position (left to right)
  return allNotes.sort((a, b) => a.position - b.position);
});

// Update the existing notes ref to use the active voice's notes
const notes = computed<ImportedNote[]>({ // Explicitly type notes using aliased import
  get: () => {
    // Ensure activeVoice is never undefined and always has a notes array
    if (activeVoice.value && Array.isArray(activeVoice.value.notes)) {
      return activeVoice.value.notes;
    }
    return []; // Return empty array as fallback
  },
  set: (newNotes) => {
    // Find the active voice and update its notes
    const voiceIndex = voiceLayers.value.findIndex(v => v.id === activeVoiceId.value);
    if (voiceIndex !== -1) {
      voiceLayers.value[voiceIndex].notes = newNotes;
    } else if (voiceLayers.value.length > 0) {
      // If active voice not found but voices exist, use the first one
      voiceLayers.value[0].notes = newNotes;
      activeVoiceId.value = voiceLayers.value[0].id;
    }
    // If no voices at all, the activeVoice computed will create one
  }
});

// Create a safer version of availableDurations with fallback characters
const availableDurations = [
  {
    value: 'whole',
    noteLabel: '𝅝', // Unicode for whole note
    restLabel: '𝄻', // Unicode for whole rest
    fallbackNoteLabel: 'W', // Fallback for devices that can't display the symbol
    fallbackRestLabel: 'WR'
  },
  {
    value: 'half',
    noteLabel: '𝅗𝅥',
    restLabel: '𝄼',
    fallbackNoteLabel: 'H',
    fallbackRestLabel: 'HR'
  },
  {
    value: 'quarter',
    noteLabel: '♩',
    restLabel: '𝄽',
    fallbackNoteLabel: 'Q',
    fallbackRestLabel: 'QR'
  },
  {
    value: 'eighth',
    noteLabel: '♪',
    restLabel: '𝄾',
    fallbackNoteLabel: 'E',
    fallbackRestLabel: 'ER'
  },
  {
    value: 'sixteenth',
    noteLabel: '♬',
    restLabel: '𝄿',
    fallbackNoteLabel: 'S',
    fallbackRestLabel: 'SR'
  }
];

const availableAccidentals = [
  { value: 'natural', label: '♮' },
  { value: 'sharp', label: '♯' },
  { value: 'flat', label: '♭' }
];

// Add these type definitions at the top of your script section
// interface Note { // REMOVE THIS LOCAL DEFINITION
//   id: string;
//   type: "note" | "rest";
//   pitch?: string;
//   duration: string;
//   position: number;
//   verticalPosition: number;
//   dotted?: boolean;
//   lyric?: string;
// }

// Update the Composition interface to use the imported types
interface Composition {
  id: string;
  name: string;
  dateCreated: number;
  staves?: Stave[]; // Add staves
  voiceLayers?: VoiceLayer[];
  tempo: number;
  // clef: string; // Removed, clef is per-staff
  keySignature: string;
  timeSignature?: string;
  chordSymbols?: ImportedChordSymbol[]; // Use aliased import
  activeVoiceId?: string;
  staffWidth?: number;
}

// Add window property declarations
declare global {
  interface Window {
    playbackTimeouts: ReturnType<typeof setTimeout>[]; // Change from number[] to ReturnType<typeof setTimeout>[]
    debugMonitorInterval: number | null;
    debugMonitorRemover: () => void;
    // Add this if you use it, otherwise remove
    // gc?: () => void;
    // Add this for timeout info storage
    [key: `timeout_${number}_info`]: {
      startTime: number;
      duration: number;
      callback: Function;
    };
    Capacitor?: {
      isNativePlatform: () => boolean;
    };
  }
}

// Add this to track the currently active voice layer
// const activeVoiceId = ref('voice1');

// Add a new ref for the show help state
const showHelp = ref(false);

// Create a fallback synth with piano-like settings
const createFallbackPianoSynth = () => {
  return new Tone.PolySynth(Tone.Synth, {
    oscillator: {
      type: "triangle"
    },
    envelope: {
      attack: 0.02,
      decay: 0.1,
      sustain: 0.3,
      release: 1
    }
  }).toDestination();
};

// Initialize synths
let noteSynth: Tone.Synth | null = null;
let pianoSynth: Tone.Sampler | null = null;

// Define the missing initializeToneJs function
const initializeToneJs = async () => {
  try {
    // Do not start Tone.js here - only set up the synths
    console.log('Setting up Tone.js components...');

    // Initialize any samplers or synthesizers if needed
    if (!pianoSynth) {
      // If there's already a pianoSynth defined elsewhere, this won't override it
      console.log('Creating piano sampler...');
      try {
        pianoSynth = new Tone.Sampler({
          urls: {
            'C4': 'C4.mp3',
            'D#4': 'Ds4.mp3',
            'F#4': 'Fs4.mp3',
            'A4': 'A4.mp3',
          },
          // Change this to use local files instead of external URL
          baseUrl: '/audio/',
          onload: () => {
            console.log('Piano samples loaded successfully');
          }
        }).toDestination();
      } catch (error) {
        console.error('Error initializing piano sampler:', error);
      }
    }

    if (!noteSynth) {
      // Create a basic synth as fallback
      console.log('Creating basic synth...');
      try {
        noteSynth = new Tone.Synth({
          oscillator: {
            type: 'sine'
          },
          envelope: {
            attack: 0.005,
            decay: 0.1,
            sustain: 0.3,
            release: 1
          }
        }).toDestination();
      } catch (error) {
        console.error('Error initializing basic synth:', error);
      }
    }

    return true;
  } catch (error) {
    console.error('Failed to initialize Tone.js:', error);
    return false;
  }
};

// Initialize Tone.js
onMounted(async () => {
  try {
    // Initialize Tone.js
    await initializeToneJs();

    // Initialize the staff width based on the container
    const staffContainer = document.querySelector('.staff-scroll-container');
    if (staffContainer) {
      visibleStaffWidth.value = staffContainer.clientWidth;
      console.log(`Visible staff width: ${visibleStaffWidth.value}px`);
    }

    // Make sure the staff is wide enough
    const staffElement = document.querySelector('.staff');
    if (staffElement) {
      (staffElement as HTMLElement).style.width = `${staffWidth.value}px`;
      console.log(`Staff width set to: ${staffWidth.value}px`);
    }

    // Add window resize listener
    window.addEventListener('resize', handleResize);
    
    // Load saved compositions from localStorage
    loadSavedCompositions(); // This will also handle initializing staves if loading a composition

    // If after loading, staves are still empty (e.g. new user, no saved data), initialize default.
    if (staves.value.length === 0) {
        initializeDefaultStaffAndVoice();
    }
    
    // Check if it's the first time visit
    checkFirstTimeVisit();
  } catch (error) {
    console.error('Error initializing Tone.js:', error);
    // Fallback to basic synth if piano samples fail to load
    if (!noteSynth) {
      noteSynth = new Tone.Synth().toDestination();
    }
  }
});

// Types
// interface Note { // REMOVE THIS LOCAL DEFINITION
//   id: string;
//   type: 'note' | 'rest';
//   pitch?: string;
//   duration: string;
//   position: number;
//   verticalPosition: number;
//   dotted?: boolean;
//   lyric?: string; // Add this line for lyrics
// }

// Add new interface for chord symbols
// interface ChordSymbol { // REMOVE THIS LOCAL DEFINITION
//   id: string;
//   position: number;
//   chordName: string;
//   top: number; // Position above staff
// }

// Add chord symbols to the store
const chordSymbols = ref<ImportedChordSymbol[]>([]); // Use aliased import

// Chord input state
const showChordInput = ref(false);
const chordInputPosition = ref(0);
const chordName = ref('');

// Add key signature support
const keySignature = ref('C'); // Default to C major (no sharps/flats)

// Define key signatures and their corresponding sharps/flats
const keySignatures = {
  // Sharp keys
  'G': ['F#'],
  'D': ['F#', 'C#'],
  'A': ['F#', 'C#', 'G#'],
  'E': ['F#', 'C#', 'G#', 'D#'],
  'B': ['F#', 'C#', 'G#', 'D#', 'A#'],
  'F#': ['F#', 'C#', 'G#', 'D#', 'A#', 'E#'],
  'C#': ['F#', 'C#', 'G#', 'D#', 'A#', 'E#', 'B#'],

  // Flat keys
  'F': ['Bb'],
  'Bb': ['Bb', 'Eb'],
  'Eb': ['Bb', 'Eb', 'Ab'],
  'Ab': ['Bb', 'Eb', 'Ab', 'Db'],
  'Db': ['Bb', 'Eb', 'Ab', 'Db', 'Gb'],
  'Gb': ['Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'],
  'Cb': ['Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb', 'Fb'],

  // No sharps/flats
  'C': [],

  // Minor keys (relative minor, accidentals are the same as major)
  // Sharp minor keys
  'Am': [], // Relative to C
  'Em': ['F#'], // Relative to G
  'Bm': ['F#', 'C#'], // Relative to D
  'F#m': ['F#', 'C#', 'G#'], // Relative to A
  'C#m': ['F#', 'C#', 'G#', 'D#'], // Relative to E
  'G#m': ['F#', 'C#', 'G#', 'D#', 'A#'], // Relative to B
  'D#m': ['F#', 'C#', 'G#', 'D#', 'A#', 'E#'], // Relative to F#
  'A#m': ['F#', 'C#', 'G#', 'D#', 'A#', 'E#', 'B#'], // Relative to C#

  // Flat minor keys
  'Dm': ['Bb'], // Relative to F
  'Gm': ['Bb', 'Eb'], // Relative to Bb
  'Cm': ['Bb', 'Eb', 'Ab'], // Relative to Eb
  'Fm': ['Bb', 'Eb', 'Ab', 'Db'], // Relative to Ab
  'Bbm': ['Bb', 'Eb', 'Ab', 'Db', 'Gb'], // Relative to Db
  'Ebm': ['Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'], // Relative to Gb
  'Abm': ['Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb', 'Fb'] // Relative to Cb
};

// Get the current key signature accidentals
const currentKeySignatureAccidentals = computed(() => {
  return keySignatures[keySignature.value] || [];
});

// Function to change the key signature
const changeKeySignature = (key: string) => {
  keySignature.value = key;
  // After changing key signature, re-evaluate natural notes for all voices on all staves
  enforceNaturalNotes();
};

// Function to get the position of a key signature accidental on the staff
const getKeySignaturePosition = (accidental: string, clef: 'treble' | 'bass') => {
  const note = accidental.charAt(0);
  let positions: Record<string, number> = {};

  if (clef === 'treble') {
     // Standard order for sharps: F, C, G, D, A, E, B
    const sharpPositionsTreble: Record<string, number> = { 'F': 100, 'C': 122.5, 'G': 92.5, 'D': 115, 'A': 137.5, 'E': 85, 'B': 107.5 };
    // Standard order for flats: B, E, A, D, G, C, F
    const flatPositionsTreble: Record<string, number> = { 'B': 130, 'E': 107.5, 'A': 137.5, 'D': 115, 'G': 145, 'C': 122.5, 'F': 152.5 };

    positions = accidental.includes('#') ? sharpPositionsTreble : flatPositionsTreble;

  } else { // Bass clef
    // Standard order for sharps: F, C, G, D, A, E, B
    const sharpPositionsBass: Record<string, number> = { 'F': 145, 'C': 115, 'G': 137.5, 'D': 160, 'A': 130, 'E': 152.5, 'B': 122.5 };
    // Standard order for flats: B, E, A, D, G, C, F
    const flatPositionsBass: Record<string, number> = { 'B': 107.5, 'E': 130, 'A': 100, 'D': 122.5, 'G': 152.5, 'C': 115, 'F': 137.5 };
    
    positions = accidental.includes('#') ? sharpPositionsBass : flatPositionsBass;
  }

  return positions[note] || 0;
};

// Update this function to make key signatures more compact
// const getKeySignatureXPosition = (index) => {
//   // More compact spacing - 10px between accidentals
//   return 45 + (index * 10);
// };

// Function to get the accidental symbol (# or b)
const getAccidentalSymbolForKeySignature = (accidental: string) => {
  if (accidental.includes('#')) {
    return '♯';
  } else if (accidental.includes('b')) {
    return '♭';
  }
  return '';
};

// Functions
const getPitchPosition = (pitch: string, clef: 'treble' | 'bass') => {
  // Map pitches to vertical positions (in pixels)
  const octave = parseInt(pitch.slice(-1));
  const note = pitch.slice(0, -1).replace(/[#b]/, ''); // Remove accidentals

  if (clef === 'treble') {
    // Treble clef staff positions (pixels from top)
    const staffPositions: Record<string, number> = {
      'F5': 100, 'E5': 107.5, 'D5': 115, 'C5': 122.5, 'B4': 130,
      'A4': 137.5, 'G4': 145, 'F4': 152.5, 'E4': 160, 'D4': 167.5,
      'C4': 175, 'B3': 182.5, 'A3': 190, 'G3': 197.5, 'F3': 205
    };

    // Calculate position based on note and octave
    const baseNote = `${note}${octave}`;

    // If the note is in our standard staff range
    if (baseNote in staffPositions) {
      return staffPositions[baseNote];
    }

    // For notes above or below the staff
    const noteOrder = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const noteIndex = noteOrder.indexOf(note);

    if (baseNote > 'F5') {
      // Notes above the staff (higher than F5)
      const stepsAboveF5 = (octave - 5) * 7 + noteIndex - noteOrder.indexOf('F');
      return 100 - (stepsAboveF5 * 7.5); // Each step is 7.5px
    } else {
      // Notes below the staff (lower than F3)
      const stepsBelowF3 = (3 - octave) * 7 + noteOrder.indexOf('F') - noteIndex;
      return 205 + (stepsBelowF3 * 7.5); // Each step is 7.5px
    }
  } else {
    // Bass clef staff positions (pixels from top)
    const staffPositions: Record<string, number> = {
      'A3': 100, 'G3': 107.5, 'F3': 115, 'E3': 122.5, 'D3': 130,
      'C3': 137.5, 'B2': 145, 'A2': 152.5, 'G2': 160, 'F2': 167.5,
      'E2': 175, 'D2': 182.5, 'C2': 190, 'B1': 197.5, 'A1': 205
    };

    // Calculate position based on note and octave
    const baseNote = `${note}${octave}`;

    // If the note is in our standard staff range
    if (baseNote in staffPositions) {
      return staffPositions[baseNote];
    }

    // For notes above or below the staff
    const noteOrder = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const noteIndex = noteOrder.indexOf(note);

    if (baseNote > 'A3') {
      // Notes above the staff (higher than A3)
      const stepsAboveA3 = (octave - 3) * 7 + noteIndex - noteOrder.indexOf('A');
      return 100 - (stepsAboveA3 * 7.5); // Each step is 7.5px
    } else {
      // Notes below the staff (lower than A1)
      const stepsBelowA1 = (1 - octave) * 7 + noteOrder.indexOf('A') - noteIndex;
      return 205 + (stepsBelowA1 * 7.5); // Each step is 7.5px
    }
  }
};

// Add this function to check if a note is affected by the key signature
const isNoteAffectedByKeySignature = (noteName: string) => {
  const accidentals = currentKeySignatureAccidentals.value;

  // Check if the note is in the key signature
  for (const accidental of accidentals) {
    if (accidental.startsWith(noteName)) {
      return true;
    }
  }

  return false;
};

// Update the getModifiedPitchForKeySignature function
const getModifiedPitchForKeySignature = (pitch: string, isExplicitNatural = false) => {
  // If this note has an explicit natural, its stored pitch is already the correct natural pitch.
  if (isExplicitNatural) {
    // console.log(`getModifiedPitchForKeySignature: Explicit natural for ${pitch}, returning as is.`);
    return pitch;
  }

  // If the pitch *already* contains an accidental (e.g. F#4, Bb4),
  // it means it's either an explicit sharp/flat or a courtesy accidental.
  // The key signature should not override an existing explicit sharp or flat in the pitch string itself.
  if (pitch.includes('#') || pitch.includes('b')) {
    // console.log(`getModifiedPitchForKeySignature: Pitch ${pitch} already has accidental, returning as is.`);
    return pitch;
  }

  const noteName = pitch.charAt(0);
  const octave = pitch.slice(pitch.length - 1); // Correctly get last char for octave

  for (const accidentalInKey of currentKeySignatureAccidentals.value) {
    if (accidentalInKey.startsWith(noteName)) {
      // console.log(`getModifiedPitchForKeySignature: Applying key sig to ${pitch} -> ${noteName}${accidentalInKey.includes('#') ? '#' : 'b'}${octave}`);
      return `${noteName}${accidentalInKey.includes('#') ? '#' : 'b'}${octave}`;
    }
  }
  // console.log(`getModifiedPitchForKeySignature: No key sig effect on ${pitch}, returning as is.`);
  return pitch;
};

// Refine the playNoteSound function for robustness
const playNoteSound = async (pitch: string, duration = "8n", isDotted = false, volumePercent = 100, explicitNatural = false) => {
  let pitchToPlay = pitch;
  let noteDuration = duration;

  try {
    // Start Tone.js context (this requires user interaction)
    await startToneJs();

    // Make sure Tone.js is started
    await Tone.start();

    if (explicitNatural) {
      const noteLetter = pitch.charAt(0);
      const octave = pitch.slice(pitch.length - 1);
      pitchToPlay = `${noteLetter}${octave}`;
    } else {
      if (!pitchToPlay.includes('#') && !pitchToPlay.includes('b')) {
        pitchToPlay = getModifiedPitchForKeySignature(pitchToPlay, false);
      }
    }

    const baseDurationMap: { [key: string]: number } = {
      "1n": 4 * (60 / tempo.value),
      "2n": 2 * (60 / tempo.value),
      "4n": 1 * (60 / tempo.value),
      "8n": 0.5 * (60 / tempo.value),
      "16n": 0.25 * (60 / tempo.value)
    };

    let durationInSeconds = baseDurationMap[duration] || (60 / tempo.value);
    if (isDotted) {
      durationInSeconds *= 1.5;
    }
    if (durationInSeconds <= 0) {
      durationInSeconds = 0.5;
    }
    noteDuration = `${durationInSeconds}s`;

    if (!pitchToPlay) {
      console.warn("Invalid pitch provided, cannot play note.");
      return;
    }

    // Convert volumePercent (0-100) to velocity (0.0-1.0)
    // Ensure velocity is clamped between 0 and 1.
    const velocity = Math.max(0, Math.min(1, volumePercent / 100));

    // Use the piano synth to play the note if available, otherwise use basic synth
    if (pianoSynth && pianoSynth.loaded) {
      pianoSynth.triggerAttackRelease(pitchToPlay, noteDuration, undefined, velocity);
    } else if (noteSynth) {
      noteSynth.triggerAttackRelease(pitchToPlay, noteDuration, undefined, velocity);
    } else {
      console.warn('No synth available to play note.');
      // Fallback to a very basic Tone.Synth if nothing else is initialized
      const fallbackSynth = createFallbackPianoSynth(); // Ensure this function exists or use new Tone.Synth()
      fallbackSynth.triggerAttackRelease(pitchToPlay, noteDuration, undefined, velocity);
      // Dispose of the fallback synth after a short delay to prevent memory leaks if used frequently
      setTimeout(() => fallbackSynth.dispose(), durationInSeconds * 1000 + 500);
    }
  } catch (error) {
    console.error('Error playing note sound:', error);
  }
};

// Ensure playComposition uses the correct duration mapping for playNoteSound
const playComposition = () => {
  // Call the playScore function which respects measure boundaries
  playScore();
};

// Update the existing handleStaffClick function to handle explicit natural accidentals
const handleStaffClick = (event, staffId: string) => {
  if (isDragging.value) {
    return;
  }

  const targetStaff = staves.value.find(s => s.id === staffId);
  if (!targetStaff) {
    console.error("Clicked on a non-existent staff:", staffId);
    return;
  }
  const currentClef = targetStaff.clef;

  // Determine the target voice on the clicked staff for input
  let targetVoiceForInput = voiceLayers.value.find(v => v.staffId === staffId && v.active);
  if (!targetVoiceForInput) {
    targetVoiceForInput = voiceLayers.value.find(v => v.staffId === staffId && v.visible);
  }
  if (!targetVoiceForInput) {
    targetVoiceForInput = voiceLayers.value.find(v => v.staffId === staffId);
  }

  if (!targetVoiceForInput) {
    alert("No voice layer available on this staff. Please add or activate a voice for this staff.");
    console.warn(`No suitable voice layer found for staff ${staffId} to add/modify note.`);
    return;
  }

  // If the determined voice for input is not the globally active voice, switch to it.
  if (targetVoiceForInput.id !== activeVoiceId.value) {
    switchActiveVoice(targetVoiceForInput.id);
    // After switchActiveVoice, activeVoice.value will be targetVoiceForInput.
    // For consistency within this function, we'll use the explicitly found 'targetVoiceForInput'.
  }
  
  const notesInTargetVoice = targetVoiceForInput.notes;

  const staffRect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const x = event.clientX - staffRect.left;
  const y = event.clientY - staffRect.top;

  const position = Math.floor(x / 50) + 0.5; // Center the note in the grid
  const verticalPosition = Math.round((y - 100) / 7.5) * 7.5 + 100;
  const pitch = mapPositionToPitch(verticalPosition, currentClef);

  const existingNoteIndex = notesInTargetVoice.findIndex(note =>
    Math.abs(note.position - position) < 0.1
  );

  const durationMap = {
    'whole': '1n',
    'half': '2n',
    'quarter': '4n',
    'eighth': '8n',
    'sixteenth': '16n'
  };

  if (existingNoteIndex !== -1) {
    const existingNote = notesInTargetVoice[existingNoteIndex];
    if (pitch || selectedNoteType.value === 'rest') {
      const updatedNoteBase = {
        ...existingNote,
        type: selectedNoteType.value as "note" | "rest",
        duration: selectedDuration.value,
        dotted: isDottedNote.value,
        pitch: selectedNoteType.value === 'note' ?
          applyAccidental(pitch || (currentClef === 'treble' ? 'C4' : 'C3'), selectedAccidental.value) : undefined,
        explicitNatural: selectedNoteType.value === 'note' && selectedAccidental.value === 'natural' ? true : undefined
      };
      const updatedNote = {
        ...updatedNoteBase,
        verticalPosition: getPitchPosition(updatedNoteBase.pitch || (currentClef === 'treble' ? 'C4' : 'C3'), currentClef)
      };
      
      notesInTargetVoice.splice(existingNoteIndex, 1, updatedNote);

      if (selectedNoteType.value === 'note' && updatedNote.pitch) {
        playNoteSound(
          updatedNote.pitch,
          durationMap[updatedNote.duration], 
          updatedNote.dotted,
          100, // volumePercent for click feedback
          updatedNote.explicitNatural
        );
      }
      console.log(`Updated note in voice ${targetVoiceForInput.id} on staff ${staffId} at position ${position}, pitch: ${updatedNote.pitch || 'rest'}, dotted: ${updatedNote.dotted}`);
    }
  } else {
  if (pitch || selectedNoteType.value === 'rest') {
      const newNoteBase = {
      id: Date.now().toString(),
      type: selectedNoteType.value as "note" | "rest",
      position,
      duration: selectedDuration.value,
      dotted: isDottedNote.value,
      pitch: selectedNoteType.value === 'note' ?
          applyAccidental(pitch || (currentClef === 'treble' ? 'C4' : 'C3'), selectedAccidental.value) : undefined,
      explicitNatural: selectedNoteType.value === 'note' && selectedAccidental.value === 'natural' ? true : undefined
    };
      const newNote = {
        ...newNoteBase,
        verticalPosition: getPitchPosition(newNoteBase.pitch || (currentClef === 'treble' ? 'C4' : 'C3'), currentClef)
      };

      notesInTargetVoice.push(newNote);

      if (selectedNoteType.value === 'note' && newNote.pitch) {
        playNoteSound(
            newNote.pitch, 
            durationMap[newNote.duration], 
            newNote.dotted, 
            100, // volumePercent for click feedback
            newNote.explicitNatural
        );
      }
      console.log(`Added ${selectedNoteType.value} to voice ${targetVoiceForInput.id} on staff ${staffId} at position ${position}, pitch: ${newNote.pitch || 'rest'}, dotted: ${newNote.dotted}`);
    }
  }
};

// const toggleDebugMode = () => { // This function is now in useDebug.ts
//   debugMode.value = !debugMode.value;
// };

// const testAllNotes = () => { // This function is now in useDebug.ts
//   // ...
// };

// Add a function to determine stem direction based on note position
const getStemDirection = (pitch: string, clef: 'treble' | 'bass') => {
  if (!pitch) return 'up';

  // Get the base note without accidentals
  const octave = parseInt(pitch.slice(-1));
  const note = pitch.slice(0, -1).replace(/[#b]/, '');

  if (clef === 'treble') {
    // Middle line is B4 in treble clef
    // Notes above middle line have stems down, below have stems up
    if (octave > 4) return 'down';
    if (octave < 4) return 'up';

    // For octave 4, depends on the note
    const noteOrder = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const noteIndex = noteOrder.indexOf(note);

    // B4 is the middle line, notes above it would have stems down
    return noteIndex < 6 ? 'up' : 'down';
  } else {
    // Middle line is D3 in bass clef
    // Notes above middle line have stems down, below have stems up
    if (octave > 3) return 'down';
    if (octave < 3) return 'up';

    // For octave 3, depends on the note
    const noteOrder = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const noteIndex = noteOrder.indexOf(note);

    // D3 is the middle line, notes above it would have stems down
    return noteIndex < 1 ? 'up' : 'down';
  }
};

// Update the getNoteSymbol function to only handle rests
const getNoteSymbol = (note: ImportedNote | NoteWithVoiceInfo) => { // Accept both types
  if (note.type === 'rest') {
    // Return rest symbols based on duration
    switch (note.duration) {
      case 'whole': return '𝄻';
      case 'half': return '𝄼';
      case 'quarter': return '𝄽';
      case 'eighth': return '𝄾';
      case 'sixteenth': return '𝄿';
      default: return '𝄽';
    }
  }
  return ''; // For notes, we're using HTML elements instead
};

// Find the getNoteStyle function and update it to use voice colors
const getNoteStyle = (note: NoteWithVoiceInfo) => {
  const style: {
    left: string;
    top: string;
    color: string;
    borderColor?: string;
  } = {
    left: `${note.position * 50}px`,
    top: `${note.verticalPosition}px`, // verticalPosition is already calculated based on staffClef
    color: note.voiceColor || 'black',
  };

  if (note.type === 'note') {
    style.borderColor = note.voiceColor || 'black';

    // Remove the backgroundColor setting that was causing the issue
    // We'll handle coloring through CSS instead
  }

  return style;
};

// Add the isPlaying ref
const isPlaying = ref(false);

// Fix the updateStaffScroll function
const updateStaffScroll = () => {
  const staffElement = document.querySelector('.staff');
  if (staffElement) {
    (staffElement as HTMLElement).style.transform = `translateX(-${scrollPosition}px)`;
  }
};

// Update the stopPlayback function
const stopPlayback = () => {
  isPlaying.value = false;
  isPaused.value = false;
  isPlayingSequence.value = false; // Ensure this is reset
  currentPlayingNoteIds.value = []; // Changed from currentPlayingNoteId
  playingSequenceSectionId.value = null; // Ensure this is reset
  pausedTimeouts.value = [];
  pauseTime.value = null;
  
  // Clear all timeouts
  if (window.playbackTimeouts) {
    window.playbackTimeouts.forEach(id => clearTimeout(id));
    window.playbackTimeouts = [];
  }
  
  console.log('Playback stopped');
};

// Update the clearScore function to handle voice layers
const clearScore = () => {
  stopPlayback();

  // Clear notes from all voices
  voiceLayers.value.forEach(voice => {
    voice.notes = [];
  });

  // Reset staves to a single default staff
  staves.value = [];
  initializeDefaultStaffAndVoice(); // This will create one staff and one voice

  chordSymbols.value = [];
  sections.value = [];
  sequenceItems.value = [];

  scrollPosition.value = 0;
  updateStaffScroll();

  playbackStartMeasure.value = 1;
  playbackEndMeasure.value = 0; // 0 means play to the end

  compositionName.value = 'Untitled';
  currentCompositionId.value = '';


  console.log('Score cleared. Reset to default staff and voice.');
};

// Add these functions to handle ledger lines
const needsLedgerLines = (note: NoteWithVoiceInfo, position: 'above' | 'below', clef: 'treble' | 'bass') => {
  if (note.type !== 'note' || !note.pitch) return false;

  const verticalPos = note.verticalPosition; // This is already calculated based on the note's staff clef

  if (clef === 'treble') {
    // For treble clef
    if (position === 'above') {
      // Notes above the staff (higher than F5)
      return verticalPos <= 92.5; // G5 and above
    } else if (position === 'below') {
      // Notes below the staff (lower than E4)
      return verticalPos >= 167.5; // D4 and below
    }
  } else {
    // For bass clef
    if (position === 'above') {
      // Notes above the staff (higher than A3)
      return verticalPos <= 92.5; // B3 and above
    } else if (position === 'below') {
      // Notes below the staff (lower than G2)
      return verticalPos >= 167.5; // F2 and below
    }
  }

  return false;
};

const getLedgerLines = (note: NoteWithVoiceInfo, position: 'above' | 'below', clef: 'treble' | 'bass') => {
  if (!needsLedgerLines(note, position, clef)) return [];

  const verticalPos = note.verticalPosition; // Already calculated for the correct clef
  const lines = [];

  if (clef === 'treble') {
    // For treble clef
    if (position === 'above') {
      // Add ledger lines above the staff
      for (let pos = 85; pos >= verticalPos; pos -= 15) {
        lines.push(pos);
      }
    } else if (position === 'below') {
      // Add ledger lines below the staff
      for (let pos = 175; pos <= verticalPos; pos += 15) {
        lines.push(pos);
      }
    }
  } else {
    // For bass clef
    if (position === 'above') {
      // Add ledger lines above the staff
      for (let pos = 85; pos >= verticalPos; pos -= 15) {
        lines.push(pos);
      }
    } else if (position === 'below') {
      // Add ledger lines below the staff
      for (let pos = 175; pos <= verticalPos; pos += 15) {
        lines.push(pos);
      }
    }
  }

  return lines;
};

// Format chord names with proper musical symbols
const formatChordName = (name: string) => {
  return name
    .replace(/b/g, '♭')
    .replace(/#/g, '♯')
    .replace(/maj7/g, 'Δ7')
    .replace(/maj9/g, 'Δ9')
    .replace(/m7/g, 'm⁷')
    .replace(/m9/g, 'm⁹')
    .replace(/dim/g, '°')
    .replace(/aug/g, '+')
    .replace(/sus4/g, 'sus⁴')
    .replace(/sus2/g, 'sus²')
    .replace(/add9/g, 'add⁹');
};

// Add example chords for demo
const addExampleChords = () => {
  chordSymbols.value = [
    { id: '1', position: 1, chordName: 'Cmaj7', top: 70 },
    { id: '2', position: 3, chordName: 'Dm7', top: 70 },
    { id: '3', position: 5, chordName: 'G7', top: 70 },
    { id: '4', position: 7, chordName: 'Cmaj7', top: 70 },
    { id: '5', position: 9, chordName: 'Am7', top: 70 },
    { id: '6', position: 11, chordName: 'Dm7', top: 70 },
    { id: '7', position: 13, chordName: 'G7', top: 70 }
  ];
};

// Helper function to safely get the key signature accidental for a note
const getKeySignatureAccidentalForNote = (noteName: string) => {
  const accidental = currentKeySignatureAccidentals.value.find(a => a.startsWith(noteName));
  return accidental || '';
};

// Update these variables for staff scrolling and measures
const measuresCount = ref(8); // Default number of measures
const measureWidthPx = ref(120); // Width of each measure in pixels

// Change these computed properties to refs
const staffWidth = ref(measuresCount.value * measureWidthPx.value);
const scrollPosition = ref(0); // Horizontal scroll position

// Add this near the other staff-related refs
const visibleStaffWidth = ref(800); // Width visible in the viewport

// Update the computed property to watch for changes
watch([measuresCount, measureWidthPx], () => {
  staffWidth.value = measuresCount.value * measureWidthPx.value;
});

// Add this computed property for maximum scroll position
const maxScrollPosition = computed(() => {
  return Math.max(0, staffWidth.value - visibleStaffWidth.value);
});

// Function to extend the staff
const extendStaff = () => {
  // Add 4 more measures
  measuresCount.value += 4;

  // Log for debugging
  console.log(`Extended staff: ${measuresCount.value} measures, width: ${staffWidth.value}px`);

  // Force a re-render of the staff lines
  nextTick(() => {
    const staffElement = document.querySelector('.staff');
    if (staffElement) {
      (staffElement as HTMLElement).style.width = `${staffWidth.value}px`;

      // Make sure staff lines extend across the full width
      const staffLines = document.querySelectorAll('.staff-line');
      staffLines.forEach(line => {
        (line as HTMLElement).style.width = `${staffWidth.value}px`;
      });
    }
  });
};

// Function to handle staff scrolling
const scrollStaff = (direction: 'left' | 'right') => {
  const scrollAmount = 200; // Amount to scroll in pixels

  if (direction === 'left') {
    // Scroll left (decrease position)
    scrollPosition.value = Math.max(0, scrollPosition.value - scrollAmount);
  } else {
    // Scroll right (increase position)
    scrollPosition.value = Math.min(maxScrollPosition.value, scrollPosition.value + scrollAmount);
  }

  // Apply the scroll position directly to the staff element
  const staffElement = document.querySelector('.staff');
  if (staffElement) {
    (staffElement as HTMLElement).style.transform = `translateX(-${scrollPosition.value}px)`;
  }

  console.log(`Scrolled ${direction}: position=${scrollPosition.value}, max=${maxScrollPosition.value}`);
};

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
});

// Handle window resize
const handleResize = () => {
  const staffContainer = document.querySelector('.staff-scroll-container');
  if (staffContainer) {
    visibleStaffWidth.value = staffContainer.clientWidth;
  }
};

// Add back the convertPitchToToneFormat function
// const convertPitchToToneFormat = (pitch: string) => {
//   // First, apply key signature if needed
//   let modifiedPitch = pitch;

//   // If the note doesn't have an explicit accidental, check key signature
//   if (!modifiedPitch.includes('#') && !modifiedPitch.includes('b')) {
//     modifiedPitch = getModifiedPitchForKeySignature(modifiedPitch);
//   }

//   return modifiedPitch;
// };

// Add back the getAccidentalSymbol function
const getAccidentalSymbol = (note: ImportedNote) => {
  if (note.type !== 'note' || !note.pitch) return '';

  if (note.pitch.includes('#')) {
    return '♯';
  } else if (note.pitch.includes('b')) {
    return '♭';
  }
  return '';
};

// Add this new function to handle clef change
const handleStaffClefChange = (stave: Stave) => {
  // The v-model on the select already updates stave.clef.
  // Now, we need to update the vertical position of all notes on this staff.

  console.log(`Clef for staff ${stave.name || stave.id} (ID: ${stave.id}) changed to ${stave.clef}. Updating note positions.`);

  let notesUpdatedCount = 0;
      voiceLayers.value.forEach(voice => {
    if (voice.staffId === stave.id) {
          voice.notes.forEach(note => {
        if (note.pitch) { // Only notes with a pitch have a vertical position dependent on clef
          const oldPosition = note.verticalPosition;
          note.verticalPosition = getPitchPosition(note.pitch, stave.clef);
          if (oldPosition !== note.verticalPosition) {
            notesUpdatedCount++;
            // console.log(`Note ${note.id} (${note.pitch}) on staff ${stave.id} moved from ${oldPosition} to ${note.verticalPosition}`);
          }
            }
          });
        }
      });

  if (notesUpdatedCount > 0) {
    console.log(`Updated vertical positions for ${notesUpdatedCount} notes on staff ${stave.id} due to clef change.`);
  }
  
  saveToLocalStorage(); // Save changes after updating note positions
};

// Add a new ref for the active tab
const activeTab = ref('notes');

// Add these variables for drag scrolling
const isDragging = ref(false);
const dragStartX = ref(0);
const dragStartScrollPosition = ref(0);

// Add these functions to handle drag scrolling
const startDrag = (event) => {
  // Only start dragging if it's not a click on a note
  if (event.target.closest('.note') || event.target.closest('.chord-symbol')) {
    return;
  }

  // Store the initial position for drag detection
  const startX = event.touches ? event.touches[0].clientX : event.clientX;
  const startY = event.touches ? event.touches[0].clientY : event.clientY;
  const startTime = Date.now();

  // Prevent default to avoid text selection during drag
  event.preventDefault();

  // Get the starting position for scroll calculation
  const clientX = event.touches ? event.touches[0].clientX : event.clientX;
  dragStartX.value = clientX;
  dragStartScrollPosition.value = scrollPosition.value;

  // Create a flag to track if we've moved enough to consider it a drag
  let hasDragged = false;

  // Define the move handler with drag detection
  const moveHandler = (moveEvent) => {
    // Get current position
    const currentX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
    const currentY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;

    // Calculate distance moved (use both X and Y for better detection)
    const distanceX = Math.abs(currentX - startX);
    const distanceY = Math.abs(currentY - startY);
    const totalDistance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

    // Only consider it a drag if moved more than 15px (higher threshold for mobile)
    if (totalDistance > 15) {
      if (!hasDragged) {
        hasDragged = true;
        isDragging.value = true;
      }

      // Now handle the drag
      // Prevent default to avoid scrolling the page
      moveEvent.preventDefault();

      // Calculate the distance moved for scrolling
      const deltaX = dragStartX.value - currentX;

      // Update the scroll position
      const newScrollPosition = Math.max(0, Math.min(maxScrollPosition.value, dragStartScrollPosition.value + deltaX));
      scrollPosition.value = newScrollPosition;

      // Update the staff transform
      updateStaffScroll();
    }
  };

  // Define the end handler
  const endHandler = (endEvent) => {
    // Calculate the time elapsed
    const endTime = Date.now();
    const timeElapsed = endTime - startTime;

    // If it was a quick tap (less than 300ms) and didn't move much, treat as a click
    if (timeElapsed < 300 && !hasDragged) {
      isDragging.value = false;

      // For touch events, we need to manually trigger a click at the right position
      if (endEvent.type === 'touchend') {
        // Create a synthetic click event at the touch position
        const clickEvent = new MouseEvent('click', {
          clientX: startX,
          clientY: startY,
          bubbles: true,
          cancelable: true,
          view: window
        });

        // Dispatch the click event on the staff element
        endEvent.target.dispatchEvent(clickEvent);
      }
    } else if (hasDragged) {
      // Reset after a short delay
      setTimeout(() => {
        isDragging.value = false;
      }, 50);
    } else {
      // It wasn't a drag but also wasn't a quick tap
      isDragging.value = false;
    }

    // Remove event listeners
    document.removeEventListener('mousemove', moveHandler);
    document.removeEventListener('mouseup', endHandler);
    document.removeEventListener('touchmove', moveHandler);
    document.removeEventListener('touchend', endHandler);
  };

  // Add event listeners for drag and end events
  if (event.type === 'mousedown') {
    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', endHandler);
  } else if (event.type === 'touchstart') {
    document.addEventListener('touchmove', moveHandler, { passive: false });
    document.addEventListener('touchend', endHandler);
  }
};

const handleDrag = (event) => {
  if (!isDragging.value) return;

  // Prevent default to avoid scrolling the page
  event.preventDefault();

  // Get the current position (handle both mouse and touch events)
  const clientX = event.touches ? event.touches[0].clientX : event.clientX;

  // Calculate the distance moved
  const deltaX = dragStartX.value - clientX;

  // Update the scroll position
  const newScrollPosition = Math.max(0, Math.min(maxScrollPosition.value, dragStartScrollPosition.value + deltaX));
  scrollPosition.value = newScrollPosition;

  // Update the staff transform
  updateStaffScroll();
};

const endDrag = () => {
  // If we weren't actually dragging, this was a click
  if (!isDragging.value) {
    // Do nothing, let the click handler work
  } else {
    // Reset after a short delay to allow the click handler to check
    setTimeout(() => {
      isDragging.value = false;
    }, 50);
  }

  // Remove event listeners
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', endDrag);
  document.removeEventListener('touchmove', handleDrag);
  document.removeEventListener('touchend', endDrag);
};

// Clean up event listeners when component is unmounted
onBeforeUnmount(() => {
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', endDrag);
  document.removeEventListener('touchmove', handleDrag);
  document.removeEventListener('touchend', endDrag);
  window.removeEventListener('resize', handleResize);
  // Clear playback timeouts if any are running
  if (window.playbackTimeouts) {
    window.playbackTimeouts.forEach(clearTimeout);
    window.playbackTimeouts = [];
  }
});

// Add the mapPositionToPitch function
const mapPositionToPitch = (verticalPosition: number, clef: 'treble' | 'bass'): string | null => {
  const positions: Record<number, string> = {};

  if (clef === 'treble') {
    // Treble clef positions (rounded to nearest 7.5px)
    positions[85] = 'A5';    // Ledger line above staff
    positions[92.5] = 'G5';  // Space above top line
    positions[100] = 'F5';   // Top line
    positions[107.5] = 'E5'; // Space
    positions[115] = 'D5';   // Line
    positions[122.5] = 'C5'; // Space
    positions[130] = 'B4';   // Line
    positions[137.5] = 'A4'; // Space
    positions[145] = 'G4';   // Line
    positions[152.5] = 'F4'; // Space
    positions[160] = 'E4';   // Bottom line
    positions[167.5] = 'D4'; // Space below bottom line
    positions[175] = 'C4';   // First ledger line below staff
    positions[182.5] = 'B3'; // Space
    positions[190] = 'A3';   // Ledger line
    positions[197.5] = 'G3'; // Space
    positions[205] = 'F3';   // Ledger line
    positions[212.5] = 'E3'; // Space
    positions[220] = 'D3';   // Ledger line
    positions[227.5] = 'C3'; // Space
    positions[235] = 'B2';   // Ledger line
  } else {
    // Bass clef positions (rounded to nearest 7.5px)
    positions[85] = 'C4';    // Ledger line above staff
    positions[92.5] = 'B3';  // Space above top line
    positions[100] = 'A3';   // Top line
    positions[107.5] = 'G3'; // Space
    positions[115] = 'F3';   // Line
    positions[122.5] = 'E3'; // Space
    positions[130] = 'D3';   // Line
    positions[137.5] = 'C3'; // Space
    positions[145] = 'B2';   // Line
    positions[152.5] = 'A2'; // Space
    positions[160] = 'G2';   // Bottom line
    positions[167.5] = 'F2'; // Space below bottom line
    positions[175] = 'E2';   // First ledger line below staff
    positions[182.5] = 'D2'; // Space
    positions[190] = 'C2';   // Ledger line
    positions[197.5] = 'B1'; // Space
    positions[205] = 'A1';   // Ledger line
    positions[212.5] = 'G1'; // Space
    positions[220] = 'F1';   // Ledger line
    positions[227.5] = 'E1'; // Space
    positions[235] = 'D1';   // Ledger line
  }

  // Return the pitch for the exact position, or null if not found
  return positions[verticalPosition] || null;
};

// Update the applyAccidental function to be more aggressive about naturals
const applyAccidental = (pitch: string, accidental: string | null): string => {
  if (!pitch) return ''; // Should not happen if mapPositionToPitch returns a valid pitch

  const noteLetter = pitch.charAt(0);
  const octave = pitch.charAt(pitch.length - 1);

  // console.log(`Applying ${accidental} to ${pitch}`); // Keep for debugging if needed

  if (accidental === 'natural') {
    // ALWAYS return the natural note (no accidental), regardless of key signature
    // console.log(`Forcing natural for ${noteLetter}${octave}`); // Keep for debugging
    return `${noteLetter}${octave}`; // This ensures the pitch *value* is natural
  } else if (accidental === null) {
    // If no specific accidental is selected, apply key signature (respecting explicitNatural if passed)
    // This function is usually called when placing a new note without an explicit accidental selected.
    // The `explicitNatural` flag on the note object itself will handle display/playback.
    return getModifiedPitchForKeySignature(pitch, false); // Assume not explicitly natural here
  } else if (accidental === 'sharp') {
    return `${noteLetter}#${octave}`;
  } else if (accidental === 'flat') {
    return `${noteLetter}b${octave}`;
  } else {
    // Default: remove any existing accidentals (should be rare if logic is correct)
    return `${noteLetter}${octave}`;
  }
};

// Add a dotted note toggle button to the Duration section
const isDottedNote = ref(false);
const toggleDottedNote = () => {
  isDottedNote.value = !isDottedNote.value;
};

// Add a function to remove a note
const removeNote = (noteToRemove: NoteWithVoiceInfo | ImportedNote) => { // Can be either type
  const voiceId = (noteToRemove as NoteWithVoiceInfo).voiceId || activeVoice.value?.id;
  if (!voiceId) return;

  const voiceIndex = voiceLayers.value.findIndex(v => v.id === voiceId);
    if (voiceIndex !== -1) {
    const noteIndex = voiceLayers.value[voiceIndex].notes.findIndex(n => n.id === noteToRemove.id);
      if (noteIndex !== -1) {
        voiceLayers.value[voiceIndex].notes.splice(noteIndex, 1);
      console.log(`Removed note ${noteToRemove.id} from voice ${voiceId}`);
    }
  }

  if (selectedNoteId.value === noteToRemove.id) {
    selectedNoteId.value = null;
  }
};

// Add these variables for touch handling
const touchTimer = ref<number | null>(null);
const touchStartPos = ref({ x: 0, y: 0 });
const isTouching = ref(false);

// Add these functions to handle touch events
const handleTouchStart = (note: ImportedNote, event: TouchEvent) => {
  // Store initial touch position
  touchStartPos.value = {
    x: event.touches[0].clientX,
    y: event.touches[0].clientY
  };
  isTouching.value = true;

  // Start a timer for long press
  touchTimer.value = window.setTimeout(() => {
    if (isTouching.value) {
      removeNote(note);
      // Provide haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }
  }, 500); // 500ms for long press
};

const handleTouchEnd = () => {
  // Clear the timer if touch ends
  if (touchTimer.value) {
    clearTimeout(touchTimer.value);
    touchTimer.value = null;
  }
  isTouching.value = false;
};

const handleTouchMove = (event: TouchEvent) => {
  // If user moves finger more than a small threshold, cancel the long press
  const moveX = Math.abs(event.touches[0].clientX - touchStartPos.value.x);
  const moveY = Math.abs(event.touches[0].clientY - touchStartPos.value.y);

  if (moveX > 10 || moveY > 10) {
    if (touchTimer.value) {
      clearTimeout(touchTimer.value);
      touchTimer.value = null;
    }
    isTouching.value = false;
  }
};

// Clean up on component unmount
onBeforeUnmount(() => {
  if (touchTimer.value) {
    clearTimeout(touchTimer.value);
  }
});

// Define a proper type for the saved composition
interface SavedComposition {
  id: string;
  name: string;
  dateCreated: number;
  notes: ImportedNote[]; // Use aliased import
  tempo: number;
  clef: string;
  keySignature: string;
  staffWidth: number; // Required for restoring layout
  selectedDuration: string;
  selectedNoteType: string;
  selectedAccidental?: string; // Add missing property (make optional if needed)
  selectedOctave: number;
  isDottedNote: boolean;
  chordSymbols: ImportedChordSymbol[]; // Use aliased import
  timeSignature?: string; // Add missing property (make optional)
}

// Update the savedCompositions ref to use CompositionData type
const savedCompositions = ref<CompositionData[]>([]);

// Function that prepares a composition object for saving
const prepareCompositionData = (): CompositionData => {
  // console.log('Saving with notes having naturalAccidentals:', // Debug log
  //   voiceLayers.value.flatMap(v =>
  //     v.notes.filter(n => n.explicitNatural).map(n => ({
  //       id: n.id, pitch: n.pitch, explicitNatural: n.explicitNatural
  //     }))
  //   )
  // );

  return {
    id: currentCompositionId.value || generateId(),
    name: compositionName.value.trim(),
    dateCreated: Date.now(),
    staves: JSON.parse(JSON.stringify(staves.value)), // Save staves
    voiceLayers: voiceLayers.value.map(voice => ({ // Save voice layers with staffId
      ...voice,
      volume: voice.volume !== undefined ? voice.volume : 100, // Ensure volume is saved, default 100%
      notes: voice.notes.map(note => ({
        ...note,
        pitch: note.pitch, // Ensure pitch is the one stored on the note
        explicitNatural: !!note.explicitNatural, // Ensure boolean
        voiceId: voice.id,
        voiceColor: voice.color
      }))
    })),
    tempo: tempo.value,
    keySignature: keySignature.value,
    timeSignature: timeSignature.value,
    chordSymbols: [...chordSymbols.value],
    activeVoiceId: activeVoiceId.value,
    staffWidth: staffWidth.value,
    selectedDuration: selectedDuration.value,
    selectedNoteType: selectedNoteType.value,
    selectedAccidental: selectedAccidental.value,
    selectedOctave: selectedOctave.value,
    isDottedNote: isDottedNote.value,
    sections: JSON.parse(JSON.stringify(sections.value)),
    sequenceItems: JSON.parse(JSON.stringify(sequenceItems.value)),
  };
};

// Update existing saveComposition function
const saveComposition = () => {
  if (!compositionName.value.trim()) {
    alert('Please enter a name for your composition');
    return;
  }

  const newComposition = prepareCompositionData();
  
  // Add near the start of saveComposition
  const notesWithNaturals = voiceLayers.value.flatMap(voice => 
    voice.notes.filter(note => note.explicitNatural)
  );
  console.log(`About to save composition with ${notesWithNaturals.length} natural notes:`, 
    notesWithNaturals.map(n => ({id: n.id, pitch: n.pitch, position: n.position}))
  );
  
  // Save the composition
  savedCompositions.value.push(newComposition);

  // Update currentCompositionId to the newly saved composition
  currentCompositionId.value = newComposition.id;

  // Provide user feedback
  alert(`Composition "${compositionName.value}" saved successfully!`);
};

// Update the loadComposition function to be more robust
const loadComposition = (compositionId: string) => {
  const compositionToLoad = savedCompositions.value.find(comp => comp.id === compositionId);
  if (compositionToLoad) {
    try {
      console.log('Loading composition:', compositionToLoad.name, compositionToLoad);
    stopPlayback();

      // Clear current state
      voiceLayers.value = [];
      staves.value = [];
    chordSymbols.value = [];
    sections.value = [];
    sequenceItems.value = [];

      currentCompositionId.value = compositionToLoad.id;
      compositionName.value = compositionToLoad.name;
      tempo.value = Number(compositionToLoad.tempo) || 120; // Ensure tempo is a number
      keySignature.value = compositionToLoad.keySignature || 'C';
      timeSignature.value = compositionToLoad.timeSignature || '4/4';
      
      // Use staffSettings if available, otherwise staffWidth
      if ((compositionToLoad as any).staffSettings) {
        staffWidth.value = (compositionToLoad as any).staffSettings.width || 2000;
        scrollPosition.value = (compositionToLoad as any).staffSettings.scrollPosition || 0;
    } else {
        staffWidth.value = compositionToLoad.staffWidth || 2000;
        scrollPosition.value = 0;
      }

      selectedDuration.value = compositionToLoad.selectedDuration || 'quarter';
      selectedNoteType.value = compositionToLoad.selectedNoteType || 'note';
      selectedAccidental.value = compositionToLoad.selectedAccidental !== undefined ? compositionToLoad.selectedAccidental : null;
      selectedOctave.value = compositionToLoad.selectedOctave || 4;
      isDottedNote.value = compositionToLoad.isDottedNote || false;

      // Load Staves
      if (compositionToLoad.staves && compositionToLoad.staves.length > 0) {
        // Ensure staves have id, clef, order, name
        staves.value = JSON.parse(JSON.stringify(compositionToLoad.staves)).map((s, index) => ({
          id: s.id || generateId(),
          clef: s.clef || 'treble',
          order: s.order !== undefined ? s.order : index,
          name: s.name || `Staff ${index + 1}`,
          isCollapsed: typeof s.isCollapsed === 'boolean' ? s.isCollapsed : false, // Load isCollapsed, default false
          // Keep voiceLayerIds temporarily if present in old data, for mapping
          voiceLayerIds: (s as any).voiceLayerIds 
      }));
    } else {
        const defaultStaffId = generateId();
        staves.value = [{ id: defaultStaffId, clef: 'treble', order: 0, name: 'Staff 1', isCollapsed: false }];
      }
      activeStaffId.value = staves.value.length > 0 ? staves.value[0].id : null;

      // Load Voice Layers
      const loadedVoiceLayers: VoiceLayer[] = [];
      if (compositionToLoad.voiceLayers && compositionToLoad.voiceLayers.length > 0) {
        const tempVoiceLayers = JSON.parse(JSON.stringify(compositionToLoad.voiceLayers));
        
        tempVoiceLayers.forEach(vl => {
          let staffIdForVoice: string | null = null;
          // Attempt to find staffId using the old voiceLayerIds structure on staves
          if (!vl.staffId) {
            for (const staff of staves.value) {
              if ((staff as any).voiceLayerIds && (staff as any).voiceLayerIds.includes(vl.id)) {
                staffIdForVoice = staff.id;
                break;
              }
            }
    } else {
            staffIdForVoice = vl.staffId;
          }

          // If still no staffId, assign to the first staff or create one if needed
          if (!staffIdForVoice || !staves.value.some(s => s.id === staffIdForVoice)) {
            console.warn(`Voice layer ${vl.name} has missing/invalid staffId or mapping. Assigning to first available staff.`);
            staffIdForVoice = activeStaffId.value || (staves.value.length > 0 ? staves.value[0].id : null);
            if (!staffIdForVoice) { // Should be very rare: no staves exist at all
                const newEmergencyStaffId = generateId();
                staves.value.push({ id: newEmergencyStaffId, clef: 'treble', order: staves.value.length, name: `Emergency Staff for ${vl.name}`});
                staffIdForVoice = newEmergencyStaffId;
                if (!activeStaffId.value) activeStaffId.value = newEmergencyStaffId;
            }
          }
          
          loadedVoiceLayers.push({
            ...vl,
            staffId: staffIdForVoice!, // Assert non-null after logic above
            notes: (vl.notes || []).map(note => {
              const { voiceId, voiceColor, ...restOfNote } = (note as any); // Strip voiceId and voiceColor
              return restOfNote;
            }),
            active: vl.active || false, // Ensure active is boolean
            volume: vl.volume !== undefined ? vl.volume : 100, // Load volume, default to 100%
      });
    });
      } else if (compositionToLoad.notes && compositionToLoad.notes.length > 0) {
        // Backwards compatibility: Convert flat notes array
        console.warn("Loading composition with old flat notes structure. Converting to voice layers.");
        const firstStaffId = activeStaffId.value || (staves.value.length > 0 ? staves.value[0].id : generateId());
        if (!staves.value.find(s => s.id === firstStaffId)) {
             staves.value.push({ id: firstStaffId, clef: 'treble', order: 0, name: 'Default Staff (Import)' });
             if(!activeStaffId.value) activeStaffId.value = firstStaffId;
        }
        
        // Group notes by their original voiceId from the flat array
        const notesByOldVoiceId: Record<string, any[]> = {};
        (compositionToLoad.notes as any[]).forEach(note => {
            const { voiceId, voiceColor, ...restOfNote } = note; // note is already any here due to source
            if (!notesByOldVoiceId[voiceId]) {
                notesByOldVoiceId[voiceId] = [];
            }
            notesByOldVoiceId[voiceId].push({ ...restOfNote, originalVoiceId: voiceId, originalVoiceColor: voiceColor });
        });

        Object.entries(notesByOldVoiceId).forEach(([oldVoiceId, notesInVoice], index) => {
            const originalColor = notesInVoice[0]?.originalVoiceColor || getRandomColor();
            loadedVoiceLayers.push({
                id: oldVoiceId || generateId(),
                name: `Voice ${index + 1} (Imported ${oldVoiceId.substring(0,10)})`,
                color: originalColor,
                visible: true,
                active: index === 0, // Make first imported voice active
                selected: true,
                volume: 100, // Default to 100% for imported old flat notes
                notes: notesInVoice.map(n => { const {originalVoiceId, originalVoiceColor, ...rest} = n; return rest; }),
                staffId: firstStaffId
            });
        });
      }
      voiceLayers.value = loadedVoiceLayers;

      // Migrate Lyrics from old structure if present
      if ((compositionToLoad as any).lyrics) {
        console.warn("Migrating lyrics from old structure.");
        for (const voiceIdWithLyrics in (compositionToLoad as any).lyrics) {
          const voiceLayer = voiceLayers.value.find(vl => vl.id === voiceIdWithLyrics);
          if (voiceLayer) {
            const lyricEntries = (compositionToLoad as any).lyrics[voiceIdWithLyrics];
            if (Array.isArray(lyricEntries)) {
              lyricEntries.forEach(lyricEntry => {
                const noteToUpdate = voiceLayer.notes.find(n => n.id === lyricEntry.noteId);
                if (noteToUpdate && lyricEntry.text) {
                  noteToUpdate.lyric = lyricEntry.text;
                }
              });
            }
          }
        }
      }
      
      // Clean up temporary voiceLayerIds from staves object
      staves.value.forEach(s => delete (s as any).voiceLayerIds);


      // Set active voice and staff
      if (compositionToLoad.activeVoiceId && voiceLayers.value.some(v => v.id === compositionToLoad.activeVoiceId)) {
        activeVoiceId.value = compositionToLoad.activeVoiceId;
      } else if (voiceLayers.value.length > 0) {
        activeVoiceId.value = voiceLayers.value[0].id;
            } else {
        activeVoiceId.value = '';
      }

      if (activeVoiceId.value) {
        const currentActiveVoice = voiceLayers.value.find(v => v.id === activeVoiceId.value);
        if (currentActiveVoice) {
          voiceLayers.value.forEach(v => v.active = (v.id === activeVoiceId.value));
          activeStaffId.value = currentActiveVoice.staffId;
        }
      } else if (staves.value.length > 0) {
        activeStaffId.value = staves.value[0].id;
      }


      chordSymbols.value = compositionToLoad.chordSymbols ? JSON.parse(JSON.stringify(compositionToLoad.chordSymbols)) : [];
      sections.value = compositionToLoad.sections ? JSON.parse(JSON.stringify(compositionToLoad.sections)) : [];
      sequenceItems.value = compositionToLoad.sequenceItems ? JSON.parse(JSON.stringify(compositionToLoad.sequenceItems)) : [];

      if (voiceLayers.value.length === 0 && staves.value.length > 0) {
        const defaultVoiceId = generateId();
        voiceLayers.value.push({
          id: defaultVoiceId, name: 'Default Voice', color: getRandomColor(),
          visible: true, active: true, selected: true, volume: 100, notes: [], staffId: staves.value[0].id
        });
        activeVoiceId.value = defaultVoiceId;
        activeStaffId.value = staves.value[0].id;
      } else if (staves.value.length === 0) {
        initializeDefaultStaffAndVoice();
      }

      nextTick(() => {
        updateStaffScroll();
      });

      console.log('Composition loaded successfully.');
      saveToLocalStorage();

    } catch (error) {
      console.error(`Error loading composition: ${error}`); // Log the error object itself
      if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack); 
      }
      alert(`Error loading composition: ${error instanceof Error ? error.message : String(error)}`);
    }
    } else {
    alert('Composition not found.');
  }
};

// Update updateStaffDisplay to accept an optional width parameter
const updateStaffDisplay = (width?: number) => {
  document.querySelectorAll('.staff').forEach(staffElement => {
  if (staffElement) {
    const displayWidth = width || staffWidth.value;
    (staffElement as HTMLElement).style.width = `${displayWidth}px`;
    }
  });
  if (document.querySelectorAll('.staff').length > 0) {
    console.log(`Set staff width to ${width || staffWidth.value}px for ${document.querySelectorAll('.staff').length} staves`);
  } else {
    console.warn('No staff elements found to update display');
  }
};

// Improve saveToLocalStorage to handle potential errors
const saveToLocalStorage = () => {
  try {
    const dataToSave = JSON.stringify(savedCompositions.value);
    console.log('Saving data to localStorage:', dataToSave);
    localStorage.setItem('musicNotationAppCompositions', dataToSave);
  } catch (e) {
    console.error('Error saving to localStorage:', e);
    alert('Error saving compositions. Local storage may be full or disabled.');
  }
};

// Improve loadSavedCompositions for better error handling
const loadSavedCompositions = () => {
  const savedItems = localStorage.getItem('musicNotationAppCompositions');
  if (savedItems) {
    try {
      const parsed = JSON.parse(savedItems);
      console.log('Loaded compositions from localStorage:', parsed);
      savedCompositions.value = parsed;
    } catch (e) {
      console.error('Error parsing saved compositions:', e);
      savedCompositions.value = [];
    }
  }
};

// Delete a composition
const deleteComposition = (id: string) => {
  if (!confirm('Are you sure you want to delete this composition?')) {
    return;
  }

  savedCompositions.value = savedCompositions.value.filter(comp => comp.id !== id);
  saveToLocalStorage();
};

// Format date for display
const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString();
};

// Add a new ref for the composition name
const compositionName = ref('');

// Update the onMounted hook to handle errors gracefully
onMounted(async () => {
  // Load saved compositions from localStorage
  loadSavedCompositions(); // This will call initializeDefaultStaffAndVoice if needed

  // If staves are still empty after load (e.g., first visit), initialize them.
  if (staves.value.length === 0) {
    initializeDefaultStaffAndVoice();
  }


  try {
    // Initialize Tone.js
    await initializeToneJs();

    // Set up the initial display
    updateStaffDisplay();

    console.log('Component mounted, saved compositions loaded:', savedCompositions.value);
  } catch (error) {
    console.error('Error during component initialization:', error);
  }
});

// Add a proper function to start Tone.js that will be called on user interaction
const startToneJs = async () => {
  try {
    // This should only be called after a user gesture
    console.log('Starting Tone.js AudioContext...');
    await Tone.start();
    console.log('Tone.js AudioContext started successfully');
    return true;
  } catch (error) {
    console.error('Error starting Tone.js AudioContext:', error);
    return false;
  }
};

// Replace this watch function (around line 2742)
// watch(notes, (newNotes) => {
//   console.log('Notes array changed:', newNotes);
// }, { deep: true });

// With this one that watches allVisibleNotes instead
watch(allVisibleNotes, (newNotes) => {
  console.log('All visible notes changed:', newNotes.length);
}, { deep: true });

// Or alternatively, watch the voiceLayers directly
watch(voiceLayers, () => {
  console.log('Voice layers changed');
}, { deep: true });

// Add variables for tracking the current composition and renaming state
const currentCompositionId = ref('');
const editingComposition = ref('');
const editCompositionName = ref('');

// Update existing updateComposition function
const updateComposition = (id: string) => {
  if (!confirm('Are you sure you want to update this saved composition with your current changes?')) {
    return;
  }

  const compositionIndex = savedCompositions.value.findIndex(comp => comp.id === id);
  if (compositionIndex === -1) {
    console.error('Composition not found for update:', id);
    return;
  }

  // Create the updated composition object using the same helper function
  const updatedData = prepareCompositionData();
  // Preserve the original ID and creation date
  updatedData.id = savedCompositions.value[compositionIndex].id;
  updatedData.dateCreated = savedCompositions.value[compositionIndex].dateCreated;
  
  // Replace the old composition data with the new data
  savedCompositions.value.splice(compositionIndex, 1, updatedData);

  // Save to localStorage
  saveToLocalStorage();

  alert('Composition updated successfully!');
};

// Functions for renaming compositions
const startRename = (id: string, currentName: string) => {
  editingComposition.value = id;
  editCompositionName.value = currentName;
};

const saveRename = (id: string) => {
  if (!editCompositionName.value.trim()) {
    alert('Please enter a valid name');
    return;
  }

  const composition = savedCompositions.value.find(comp => comp.id === id);
  if (!composition) {
    console.error('Composition not found:', id);
    return;
  }

  composition.name = editCompositionName.value.trim();
  saveToLocalStorage();
  cancelRename();

  alert('Composition renamed successfully!');
};

const cancelRename = () => {
  editingComposition.value = '';
  editCompositionName.value = '';
};

// Add functions for importing and exporting compositions
const exportAllCompositions = async () => {
  try {
    // Create a JSON string of all compositions
    const dataToExport = JSON.stringify(savedCompositions.value, null, 2);
    const fileName = `music-notation-all-compositions-${new Date().toISOString().slice(0, 10)}.txt`;

    // Check if running in a capacitor environment (mobile app)
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
      try {
        // Use Capacitor Filesystem API for native platforms
        await Filesystem.writeFile({
          path: fileName,
          data: dataToExport,
          directory: Directory.Documents,
          encoding: Encoding.UTF8  // Use the Encoding enum from Capacitor
        });

        alert(`All compositions saved to Documents/${fileName}`);
      } catch (error) {
        console.error('Error writing file with Capacitor:', error);
        alert(`Error saving file: ${error.message}`);
      }
    } else {
      // Use web approach for browsers
      const blob = new Blob([dataToExport], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);

      console.log('All compositions exported successfully via browser download');
    }
  } catch (error) {
    console.error('Error exporting compositions:', error);
    alert('Error exporting compositions: ' + error.message);
  }
};

const exportCurrentComposition = async () => {
  if (!currentCompositionId.value && voiceLayers.value.flatMap(vl => vl.notes).length === 0) {
    alert('No composition is currently loaded or no notes to export.');
    return;
  }

  try {
    const baseLoadedComposition = savedCompositions.value.find(comp => comp.id === currentCompositionId.value);

    let compositionToExport: CompositionData = {
      id: baseLoadedComposition?.id || generateId(),
      name: compositionName.value || baseLoadedComposition?.name || 'Untitled Export',
      dateCreated: baseLoadedComposition?.dateCreated || Date.now(),
      staves: JSON.parse(JSON.stringify(staves.value)), // Include staves
      voiceLayers: JSON.parse(JSON.stringify(voiceLayers.value)),
      // notes: // This is derived from voiceLayers, so not explicitly set here.
      //         // The prepareCompositionData or a similar function would flatten it if needed for older formats.
      tempo: tempo.value,
      keySignature: keySignature.value,
      timeSignature: timeSignature.value,
      chordSymbols: JSON.parse(JSON.stringify(chordSymbols.value)),
      activeVoiceId: activeVoiceId.value,
      staffWidth: staffWidth.value,
      selectedDuration: selectedDuration.value,
      selectedNoteType: selectedNoteType.value,
      selectedAccidental: selectedAccidental.value,
      selectedOctave: selectedOctave.value,
      isDottedNote: isDottedNote.value,
      sections: sections.value ? JSON.parse(JSON.stringify(sections.value)) : [],
      sequenceItems: sequenceItems.value ? JSON.parse(JSON.stringify(sequenceItems.value)) : [],
    };

    console.log('Exporting composition with sequence items:', compositionToExport.sequenceItems);
    
    console.log('[Export] Initial compositionToExport from live state:', JSON.parse(JSON.stringify(compositionToExport)));
    console.log('[Export] exportOnlySelectedVoices flag:', exportOnlySelectedVoices.value);

    if (exportOnlySelectedVoices.value) {
      console.log('[Export] Filtering for selected voices. Initial voiceLayers from live state:', JSON.parse(JSON.stringify(compositionToExport.voiceLayers)));

      if (compositionToExport.voiceLayers && Array.isArray(compositionToExport.voiceLayers)) {
        const allVoiceStates = compositionToExport.voiceLayers.map(v => ({ id: v.id, name: v.name, selected: v.selected }));
        console.log('[Export] All voice selected states from live data:', allVoiceStates);

        const selectedVoiceLayers = compositionToExport.voiceLayers.filter(v => v.selected === true);
        console.log('[Export] Filtered selectedVoiceLayers:', JSON.parse(JSON.stringify(selectedVoiceLayers)));

        if (selectedVoiceLayers.length === 0 && compositionToExport.voiceLayers.length > 0) {
          alert("No voices are selected for export. Please select at least one voice or uncheck 'Export selected voices only'.");
          return;
        }

        compositionToExport.voiceLayers = selectedVoiceLayers; // Update the voiceLayers on the object to be exported

        // Re-flatten notes from the NOW-FILTERED selectedVoiceLayers for the 'notes' property
        compositionToExport.notes = selectedVoiceLayers.flatMap(voice =>
          voice.notes.map(note => ({
            ...note,
            // Ensure voiceId and voiceColor are consistent if they are part of the Note type
            // and if the original flat notes array might not have them or have outdated ones.
            voiceId: voice.id,
            voiceColor: voice.color
          }))
        );
        console.log('[Export] Updated compositionToExport.voiceLayers after filtering:', JSON.parse(JSON.stringify(compositionToExport.voiceLayers)));
        console.log('[Export] Updated compositionToExport.notes count after filtering:', compositionToExport.notes.length);
      }
    } else {
      console.log('[Export] Not filtering by selected voices. Exporting all from live state.');
    }

    console.log('[Export] Final compositionToExport for stringify:', JSON.parse(JSON.stringify(compositionToExport)));
    const dataToExport = JSON.stringify(compositionToExport, null, 2);
    const fileName = `music-notation-${compositionToExport.name.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.txt`;

    // Check if running in a capacitor environment (mobile app)
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
      try {
        // Use Capacitor Filesystem API for native platforms
        await Filesystem.writeFile({
          path: fileName,
          data: dataToExport,
          directory: Directory.Documents,
          encoding: Encoding.UTF8  // Use the Encoding enum from Capacitor
        });

        alert(`Composition saved to Documents/${fileName}`);
      } catch (error) {
        console.error('Error writing file with Capacitor:', error);
        alert(`Error saving file: ${error.message}`);
      }
    } else {
      // Use web approach for browsers
      const blob = new Blob([dataToExport], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);

      console.log('Composition exported successfully via browser download');
    }
  } catch (error) {
    console.error('Error exporting composition:', error);
    alert('Error exporting composition: ' + error.message);
  }
};

// Add this validation function before processWebFiles
// (around line 2322)
const validateComposition = (comp: any): boolean => {
  // Basic validation - check if the composition has required properties
  return (
    comp &&
    typeof comp === 'object' &&
    // Check for staves or voiceLayers (which imply notes)
    (Array.isArray(comp.staves) || Array.isArray(comp.voiceLayers) || Array.isArray(comp.notes)) &&
    typeof comp.name === 'string'
  );
};

// Fix the readFileAsText function to handle types properly
// (around line 2318)
const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target && typeof e.target.result === 'string') {
        resolve(e.target.result);
      } else {
        reject(new Error(`Error reading file ${file.name}: Invalid result`));
      }
    };
    reader.onerror = () => {
      reject(new Error(`Error reading file ${file.name}`));
    };
    reader.readAsText(file);
  });
};

// Update the processWebFiles function to handle type safety
// (around line 2316)
const processWebFiles = async (files: File[]) => {
  const allFileResults = [];

  for (const file of Array.from(files)) {
    try {
      const result = await readFileAsText(file);
      const parsedJson = JSON.parse(result) as unknown;
      const compositionsFromFile = Array.isArray(parsedJson) ? parsedJson : [parsedJson];

      // Basic validation for each composition structure
      const validCompositions = compositionsFromFile.filter(comp => validateComposition(comp));
      allFileResults.push({
        fileName: file.name,
        parsedCompositions: validCompositions
      });
    } catch (error) {
      console.error(`Error parsing file ${file.name}:`, error);
      alert(`Error parsing file ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      allFileResults.push({ fileName: file.name, parsedCompositions: [] });
    }
  }

  return allFileResults;
};

// Update the importCompositions function to process the files and add them to savedCompositions
const importCompositions = async (event) => {
  // For web browser file input
  if (event && event.target && event.target.files) {
    const inputElement = event.target as HTMLInputElement;
    const files = inputElement.files;

    if (!files || files.length === 0) {
      return;
    }

    try {
      const allFileResults = await processWebFiles(Array.from(files));
      let importCount = 0;

      allFileResults.forEach(fileResult => {
        if (fileResult.parsedCompositions && fileResult.parsedCompositions.length > 0) {
          fileResult.parsedCompositions.forEach(compFromFile => {
            // Ensure the imported composition has a unique ID
            const importedComposition: CompositionData = {
              ...compFromFile,
              id: generateId(), // Always generate a new ID for imported compositions
              dateCreated: compFromFile.dateCreated || Date.now(),
              // Ensure staves and voiceLayers are properly structured
              staves: compFromFile.staves || [{ id: generateId(), clef: 'treble', order: 0, name: 'Staff 1'}],
              voiceLayers: compFromFile.voiceLayers || [],
            };

            // If voiceLayers exist, ensure they have staffId. If not, assign to first staff.
            if (importedComposition.voiceLayers && importedComposition.staves && importedComposition.staves.length > 0) {
              const firstStaffId = importedComposition.staves[0].id;
              importedComposition.voiceLayers.forEach(vl => {
                if (!vl.staffId || !importedComposition.staves!.some(s => s.id === vl.staffId)) {
                  vl.staffId = firstStaffId;
                }
              });
            }
            // If only comp.notes exists (old format), create a default voice on the first staff
            else if (compFromFile.notes && importedComposition.staves && importedComposition.staves.length > 0) {
                const firstStaffId = importedComposition.staves[0].id;
                importedComposition.voiceLayers = [{
                    id: generateId(),
                    name: "Imported Voice",
                    color: getRandomColor(),
                    visible: true,
                    active: true,
                    selected: true,
                    volume: 100, // Default to 100%
                    staffId: firstStaffId,
                    notes: compFromFile.notes
                }];
            }


            savedCompositions.value.push(importedComposition);
            importCount++;
          });
        }
      });

      // Save to localStorage
      saveToLocalStorage();

      // Provide feedback
      if (importCount > 0) {
        alert(`Successfully imported ${importCount} composition${importCount !== 1 ? 's' : ''}.`);
      } else {
        alert('No valid compositions found in the imported files.');
      }
    } catch (error) {
      console.error('Error importing compositions:', error);
      alert(`Error importing compositions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  // Optional: Add a way to trigger native file picking for Android
  else if (window.Capacitor && window.Capacitor.isNativePlatform()) {
    try {
      // You'll need a file picker plugin for this, like @capacitor/filesystem
      // This is a placeholder for the implementation
      alert("Mobile file import is still being implemented. Please use the web version for now.");

      // Example implementation with proper plugin:
      /*
      const result = await FilePicker.pickFiles({
        types: ['text/plain'],
        multiple: false
      });
      
      if (result.files.length > 0) {
        const file = result.files[0];
        const contents = await Filesystem.readFile({
          path: file.path,
          encoding: 'utf8'
        });
        
        try {
          const parsedJson = JSON.parse(contents.data);
          // Process the imported file...
        } catch (error) {
          alert(`Error parsing file: ${error.message}`);
        }
      }
      */
    } catch (error) {
      console.error('Error picking file:', error);
      alert(`Error selecting file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

// Create a completely new function to force-reset the notes array
const forceResetNotesArray = () => {
  console.log('Forcing complete reset of notes array...');

  // Manually empty the array while preserving reactivity
  while (notes.value.length > 0) {
    notes.value.pop();
  }

  // Double-check
  if (notes.value.length > 0) {
    console.warn('Failed to clear notes array with pop method, trying splice...');
    notes.value.splice(0, notes.value.length);
  }

  console.log('Notes array reset, current length:', notes.value.length);

  // Force a redraw
  nextTick(() => {
    const noteElements = document.querySelectorAll('.note');
    console.log(`After reset, DOM has ${noteElements.length} note elements`);

    // Manual DOM cleanup if needed
    if (noteElements.length > 0) {
      console.warn('Forcing manual DOM cleanup of remaining notes');
      noteElements.forEach(el => {
        if (el.parentNode) el.parentNode.removeChild(el);
      });
    }
  });

  return nextTick();
};

// Add a mountable debug element to help diagnose notes issues
const addDebugMonitor = () => {
  const monitor = document.createElement('div');
  monitor.style.position = 'fixed';
  monitor.style.bottom = '10px';
  monitor.style.right = '10px';
  monitor.style.backgroundColor = 'rgba(0,0,0,0.7)';
  monitor.style.color = 'white';
  monitor.style.padding = '10px';
  monitor.style.borderRadius = '5px';
  monitor.style.zIndex = '9999';
  monitor.style.maxHeight = '200px';
  monitor.style.overflowY = 'auto';
  monitor.style.fontSize = '12px';
  monitor.style.fontFamily = 'monospace';
  monitor.id = 'notes-debug-monitor';

  const updateMonitor = () => {
    monitor.innerHTML = `
      <div><strong>Notes: ${notes.value.length}</strong></div>
      <div><strong>DOM Notes: ${document.querySelectorAll('.note').length}</strong></div>
      <div style="margin-top:5px"><strong>Notes List:</strong></div>
      ${notes.value.map((n, i) =>
      `<div>${i}: ${n.type} ${n.pitch || 'rest'} at ${n.position}</div>`
    ).join('')}
    `;
  };

  document.body.appendChild(monitor);

  // Update every second
  const interval = setInterval(updateMonitor, 1000);

  // Return function to remove
  return () => {
    clearInterval(interval);
    if (document.body.contains(monitor)) {
      document.body.removeChild(monitor);
    }
  };
};

// Add this debug monitor when needed (perhaps with a debug button)
const toggleDebugMonitor = () => {
  const existing = document.getElementById('notes-debug-monitor');
  if (existing) {
    document.body.removeChild(existing);
    if (window.debugMonitorInterval) {
      clearInterval(window.debugMonitorInterval);
      window.debugMonitorInterval = null;
    }
  } else {
    window.debugMonitorRemover = addDebugMonitor();
  }
};

// Add button animation function
const animateButton = (event) => {
  event.target.closest('button').classList.add('button-press-animation');
  setTimeout(() => {
    event.target.closest('button').classList.remove('button-press-animation');
  }, 300);
};

// Add these reactive variables
const timeSignature = ref('4/4');
const timeSignatureNumerator = computed(() => parseInt(timeSignature.value.split('/')[0]) || 4);
const timeSignatureDenominator = computed(() => parseInt(timeSignature.value.split('/')[1]) || 4);
const showBeatMarkers = ref(false); // Set to true for debugging

// Make sure this computed property is correctly calculating measure width
const measureWidthByTimeSignature = computed(() => {
  const parts = timeSignature.value.split('/');
  if (parts.length !== 2) {
    // console.warn(`Invalid time signature format: ${timeSignature.value}, using default width.`);
    return 50 * 4; // Default to 4 quarter notes width (200px)
  }
  const [numeratorStr, denominatorStr] = parts;
  const numerator = parseInt(numeratorStr);
  const denominator = parseInt(denominatorStr);

  if (isNaN(numerator) || isNaN(denominator) || denominator === 0 || numerator === 0) {
    // console.warn(`Invalid time signature numbers: N=${numerator}, D=${denominator}, using default width.`);
    return 50 * 4; // Default to 4 quarter notes width
  }

  // Base width per quarter note
  const quarterNoteWidth = 50;

  // Calculate beats based on time signature
  let beatsPerMeasure = numerator;
  let beatUnit = denominator;

  // Compound meters (6/8, 9/8, 12/8) have different beat structures
  if ([6, 9, 12].includes(numerator) && denominator === 8) {
    // In compound meters, each dotted quarter note is one beat
    beatsPerMeasure = numerator / 3;
    beatUnit = 4; // Treat as quarter note equivalent
  }

  // Calculate width based on beat unit
  let beatWidth = quarterNoteWidth;
  if (beatUnit === 2) beatWidth = quarterNoteWidth * 2; // Half note
  if (beatUnit === 8) beatWidth = quarterNoteWidth / 2; // Eighth note

  const width = beatsPerMeasure * beatWidth;
  console.log(`Measure width for ${timeSignature.value}: ${width}px`);
  return width;
});

// Generate barlines with proper musical positioning and measure numbers
const barlines = computed(() => {
  const lines = [];
  const totalMeasures = Math.ceil(staffWidth.value / measureWidthByTimeSignature.value);

  // Calculate key signature width
  const keySignatureWidth = currentKeySignatureAccidentals.value.length * 10;

  // Get initial position after clef, key signature, and time signature
  const initialPosition = 70 + keySignatureWidth + 20; // 70px for clef, then key sig, then 20px for time sig

  // First barline is at the start of first measure (after clef, key sig, and time sig)
  lines.push({
    type: 'single',
    position: initialPosition,
    measureNumber: 1, // This is actually the start of measure 1
    isIntervalMeasure: false
  });

  // Add remaining barlines
  for (let i = 1; i < totalMeasures; i++) {
    // Position each barline at the end of the measure
    const position = initialPosition + (i * measureWidthByTimeSignature.value);

    // By default, use single barlines for all regular measures
    let type = 'single';

    // For the last measure, use a final barline
    if (i === totalMeasures - 1) {
      type = 'final';
    }

    lines.push({
      type,
      position,
      measureNumber: i + 1, // Adjust measure number to start from 2
      isIntervalMeasure: (i + 1) % 5 === 0
    });
  }

  return lines;
});

// Calculate beat positions (for visual aid)
const beatPositions = computed(() => {
  const positions = [];
  const [numerator, denominator] = timeSignature.value.split('/').map(n => parseInt(n));

  // Base width per quarter note
  const quarterNoteWidth = 50;

  // Calculate beat width based on denominator
  let beatWidth = quarterNoteWidth; // Default for quarter note
  if (denominator === 2) beatWidth = quarterNoteWidth * 2; // Half note
  if (denominator === 8) beatWidth = quarterNoteWidth / 2; // Eighth note

  // Calculate total beats (used for compound meters)
  let totalBeats = numerator;

  // For compound meters, show subdivisions
  if ([6, 9, 12].includes(numerator) && denominator === 8) {
    totalBeats = numerator; // Show all eighth notes
  }

  const totalMeasures = Math.ceil(staffWidth.value / measureWidthByTimeSignature.value);

  for (let measure = 0; measure < totalMeasures; measure++) {
    const measureStart = 70 + (measure * measureWidthByTimeSignature.value);

    for (let beat = 1; beat < totalBeats; beat++) {
      positions.push({
        position: measureStart + (beat * (measureWidthByTimeSignature.value / totalBeats)),
        measure,
        beat
      });
    }
  }

  return positions;
});

// Function to update time signature
const updateTimeSignature = () => {
  // Recalculate measure widths and barline positions
  console.log(`Time signature changed to ${timeSignature.value}`);

  // Force redraw of staff
  updateStaffDisplay();

  // Notify user about the change
  const [numerator, denominator] = timeSignature.value.split('/');

  // Optional: Adjust notes to fit the new time signature
  const beatValue = denominator === '8' ? 0.5 : 1; // Eighth note vs quarter note

  // Update beat markers if needed
  updateBeatMarkers();

  // Ensure section boundaries don't exceed the new measure count
  const totalMeasures = Math.ceil(staffWidth.value / measureWidthByTimeSignature.value);
  sections.value.forEach(section => {
    if (section.endMeasure > totalMeasures) {
      section.endMeasure = totalMeasures;
    }
    if (section.startMeasure > section.endMeasure) {
      section.startMeasure = section.endMeasure;
    }
  });
};

// Function to update beat markers
const updateBeatMarkers = () => {
  // Update visual beat markers if they're enabled
  if (showBeatMarkers.value) {
    console.log('Updating beat markers');
  }
};

// Update exportComposition
const exportComposition = () => { // This function seems to be a duplicate of exportCurrentComposition. Consolidate if possible.
  // For now, let's assume this is a simplified export.
  // It should use prepareCompositionData() for consistency.
  const compositionData = prepareCompositionData();

  // Convert to JSON
  const jsonString = JSON.stringify(compositionData, null, 2);

  // Create a download link
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${compositionName.value || 'music-notation'}.json`;
  document.body.appendChild(a);
  a.click();

  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
};

// Add the missing generateId function
const generateId = () => {
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
};

// Add a new ref for the selected note
const selectedNoteId = ref<string | null>(null);

// Update the selectNote function to work with voice layers
const selectNote = (note) => {
  selectedNoteId.value = note.id;

  // If the note has a voiceId and it's not the active voice, switch to that voice
  if ((note as NoteWithVoiceInfo).voiceId && (note as NoteWithVoiceInfo).voiceId !== activeVoiceId.value) {
    switchActiveVoice((note as NoteWithVoiceInfo).voiceId);
  }

  // If there's a lyric, populate the lyric input
  if (note.lyric) {
    currentLyric.value = note.lyric;
  }
};

// Add a function to get the lyric style
const getLyricStyle = (note: NoteWithVoiceInfo) => { // Use NoteWithVoiceInfo
  return {
    color: note.id === currentPlayingNoteIds.value[0] ? 'red' : (note.voiceColor || 'black'),
    fontWeight: note.id === currentPlayingNoteIds.value[0] ? 'bold' : 'normal'
  };
};

// Add these refs for playback control
const playbackStartMeasure = ref(1);
const playbackEndMeasure = ref(0); // 0 means play to the end
const autoScrollToPlayingNote = ref(true);

// Add this helper function to calculate which measure a note is in
const getNotesMeasure = (note: ImportedNote | NoteWithVoiceInfo) => { // Update to use aliased import or union
  // Calculate the horizontal position in pixels
  const notePosition = note.position * 50;

  // Calculate the initial position (where measure 1 starts)
  const keySignatureWidth = currentKeySignatureAccidentals.value.length * 10;
  const initialPosition = 70 + keySignatureWidth + 20; // clef + key sig + time sig

  // If the note is before the first measure, return 0
  if (notePosition < initialPosition) {
    return 0;
  }

  // Calculate the relative position from the start of the first measure
  const relativePosition = notePosition - initialPosition;

  // Calculate which measure this note is in
  // Use measureWidthByTimeSignature for correct measure width based on time signature
  return Math.floor(relativePosition / measureWidthByTimeSignature.value) + 1;
};

// Now update the playScore function to use this helper
const playScore = () => {
  if (isPlaying.value) return;

  isPlaying.value = true;
  currentPlayingNoteIds.value = []; // Changed from currentPlayingNoteId

  // Initialize Tone.js if needed
  initializeToneJs();

  // Get all visible notes from all visible voice layers
  const visibleVoices = voiceLayers.value.filter(voice => voice.visible);

  // Determine which voices to play based on playback settings
  const voicesToPlay = playSelectedVoicesOnly.value
    ? voiceLayers.value.filter(voice => voice.visible && voice.selected)
    : visibleVoices;

  // If no voices are selected for playback, use all visible voices
  if (playSelectedVoicesOnly.value && voicesToPlay.length === 0) {
    voicesToPlay.push(...visibleVoices);
  }

  console.log(`Playing ${voicesToPlay.length} voices:`, voicesToPlay.map(v => v.name));

  // Collect all notes from the voices to play
  let allNotesToPlay = [];
  voicesToPlay.forEach(voice => {
    // Add voice ID to each note for identification during playback
    const voiceNotes = voice.notes.map(note => ({
      ...note,
      voiceId: voice.id,
      voiceColor: voice.color
    }));
    allNotesToPlay = allNotesToPlay.concat(voiceNotes);
  });

  // Sort all notes by position
  const sortedNotes = allNotesToPlay.sort((a, b) => a.position - b.position);

  // Calculate measure boundaries
  const measureWidth = measureWidthByTimeSignature.value;
  const initialPosition = 70 + (currentKeySignatureAccidentals.value.length * 10) + 20;

  console.log(`Playback range: measures ${playbackStartMeasure.value} to ${playbackEndMeasure.value || 'end'}`);
  console.log(`Measure width: ${measureWidth}px, Initial position: ${initialPosition}px`);

  // Filter notes based on selected measures
  let filteredNotes = sortedNotes;
  if (playbackStartMeasure.value > 1 || (playbackEndMeasure.value > 0)) {
    filteredNotes = sortedNotes.filter(note => {
      const noteMeasure = getNotesMeasure(note);

      // Check if the note is within the selected measure range
      const isAfterStart = noteMeasure >= playbackStartMeasure.value;
      const isBeforeEnd = playbackEndMeasure.value === 0 || noteMeasure <= playbackEndMeasure.value;

      return isAfterStart && isBeforeEnd;
    });
  }

  console.log(`Playing ${filteredNotes.length} notes out of ${sortedNotes.length} total notes`);

  // Initialize array to track timeout IDs for cleanup
  if (!window.playbackTimeouts) window.playbackTimeouts = [];
  window.playbackTimeouts = [];

  // Clear any existing timeouts
  window.playbackTimeouts.forEach(id => clearTimeout(id));
  window.playbackTimeouts = [];

  // Group notes by position for chord playback
  const notesByPosition = {};
  filteredNotes.forEach(note => {
    if (!notesByPosition[note.position]) {
      notesByPosition[note.position] = [];
    }
    notesByPosition[note.position].push(note);
  });

  // Sort positions for sequential playback
  const positions = Object.keys(notesByPosition).map(Number).sort((a, b) => a - b);

  // Play notes in sequence with proper timing
  let totalDelay = 0;

  positions.forEach(position => {
    const notesAtPosition = notesByPosition[position];

    // Find the longest note duration at this position
    let longestDuration = 0;
    const durationMap = {
      'whole': 4,
      'half': 2,
      'quarter': 1,
      'eighth': 0.5,
      'sixteenth': 0.25
    };

    notesAtPosition.forEach(note => {
      let noteDuration = durationMap[note.duration] || 1;
      if (note.dotted) noteDuration *= 1.5;
      longestDuration = Math.max(longestDuration, noteDuration);
    });

    // Calculate the wait duration in seconds
    const secondsPerBeat = 60 / tempo.value;
    const waitDurationSeconds = longestDuration * secondsPerBeat;

    // Function to play all notes at this position
    const playNotesWithDelay = (notesToPlay, delay) => {
      const callback = () => {
        const idsAtThisPosition = notesToPlay.map(n => n.id);
        // Add new notes to be played, ensuring no duplicates if logic allows overlap (it doesn't currently for same-time notes)
        currentPlayingNoteIds.value.push(...idsAtThisPosition.filter(id => !currentPlayingNoteIds.value.includes(id)));

        // Auto-scroll to the playing note if enabled (scroll to the first note in the batch)
        if (notesToPlay.length > 0 && autoScrollToPlayingNote.value) {
          autoScrollToNote(notesToPlay[0]);
        }

        // Play all notes at this position simultaneously
        notesToPlay.forEach(noteToPlay => {
          // currentPlayingNoteId.value = noteToPlay.id; // Removed, using array now

          if (noteToPlay.type === 'note' && noteToPlay.pitch) {
            // Map durations to Tone.js format
            const toneDurationMap = {
              'whole': '1n',
              'half': '2n',
              'quarter': '4n',
              'eighth': '8n',
              'sixteenth': '16n'
            };

            // Play the note using the Tone.js duration format
            const toneDuration = toneDurationMap[noteToPlay.duration] || '4n';

            // Adjust volume based on voice settings
            const voice = voiceLayers.value.find(v => v.id === noteToPlay.voiceId);
            const currentVoiceVolumePercent = voice ? voice.volume : 100; // Default to 100%

            playNoteSound(
              noteToPlay.pitch, 
              toneDuration, 
              noteToPlay.dotted, 
              currentVoiceVolumePercent, // Pass the voice's volume as percentage
              noteToPlay.explicitNatural  // Add this parameter
            );
          }
        });

        // Schedule the end of these notes
        const noteEndCallback = () => {
          // Remove IDs of notes that just finished
          currentPlayingNoteIds.value = currentPlayingNoteIds.value.filter(id => !idsAtThisPosition.includes(id));
        };

        const noteEndTimeoutId = setTimeout(noteEndCallback, waitDurationSeconds * 1000);

        // Store timeout info for potential pausing
        (window as any)[`timeout_${noteEndTimeoutId}_info`] = {
          startTime: Date.now(),
          duration: waitDurationSeconds * 1000,
          callback: noteEndCallback
        };

        window.playbackTimeouts.push(noteEndTimeoutId);
      };

      const timeoutId = setTimeout(callback, delay);

      // Store timeout info for potential pausing
      (window as any)[`timeout_${timeoutId}_info`] = {
        startTime: Date.now(),
        duration: delay,
        callback
      };

      window.playbackTimeouts.push(timeoutId);
    };

    // Schedule these notes
    playNotesWithDelay(notesAtPosition, totalDelay * 1000);
    totalDelay += waitDurationSeconds;
  });

  // Stop playing after all notes have played
  const finalTimeoutId = setTimeout(() => {
    // Reset all playback state variables
    isPlaying.value = false;
    isPaused.value = false;
    currentPlayingNoteIds.value = []; // Changed from currentPlayingNoteId

    // Clear any remaining timeouts
    if (window.playbackTimeouts) {
      window.playbackTimeouts.forEach(id => clearTimeout(id));
      window.playbackTimeouts = [];
    }

    console.log('Playback complete');
  }, totalDelay * 1000 + 100); // Add a small buffer

  // Store the final timeout ID for potential cleanup
  window.playbackTimeouts.push(finalTimeoutId);

  // Store timeout info for the final timeout
  (window as any)[`timeout_${finalTimeoutId}_info`] = {
    startTime: Date.now(),
    duration: totalDelay * 1000 + 100,
    callback: () => {
      isPlaying.value = false;
      isPaused.value = false;
      currentPlayingNoteIds.value = []; // Changed from currentPlayingNoteId
    }
  };
};

// Add the autoScrollToNote function
const autoScrollToNote = (note: ImportedNote) => {
  // Calculate the horizontal position of the note
  const noteXPosition = note.position * 50;

  // Calculate the visible area boundaries
  const leftBoundary = scrollPosition.value;
  const rightBoundary = scrollPosition.value + visibleStaffWidth.value;

  // Check if the note is outside the visible area
  if (noteXPosition < leftBoundary + 100) {
    // Note is to the left of the visible area or too close to the left edge
    // Scroll left to show the note with some margin
    scrollPosition.value = Math.max(0, noteXPosition - 100);
    updateStaffScroll();
  } else if (noteXPosition > rightBoundary - 100) {
    // Note is to the right of the visible area or too close to the right edge
    // Scroll right to show the note with some margin
    scrollPosition.value = Math.min(
      maxScrollPosition.value,
      noteXPosition - visibleStaffWidth.value + 200
    );
    updateStaffScroll();
  }
};

// Add this ref for measure visibility
const showMeasureNumbers = ref(true); // Default to shown

// Add a ref to track if playback is paused
const isPaused = ref(false);

// Add a ref to store the remaining timeouts when paused
const pausedTimeouts = ref<{ id: number, remainingTime: number, callback: Function; }[]>([]);

// Add a ref to store the time when playback was paused
const pauseTime = ref<number | null>(null);

// Add a function to pause playback
const pausePlayback = () => {
  if (!isPlaying.value || isPaused.value) return;

  isPaused.value = true;
  pauseTime.value = Date.now();

  // Stop any currently playing sounds using the correct methods
  if (noteSynth) {
    try {
      // For basic Tone.Synth, use triggerRelease() without arguments to release all notes
      noteSynth.triggerRelease();
    } catch (e) {
      console.error('Error stopping noteSynth:', e);
    }
  }

  if (pianoSynth) {
    try {
      // For Tone.Sampler, we can use releaseAll()
      pianoSynth.releaseAll();
    } catch (e) {
      console.error('Error stopping pianoSynth:', e);
    }
  }

  // Store all active timeouts with their remaining time
  pausedTimeouts.value = [];

  // Clear all active timeouts
  if (window.playbackTimeouts) {
    window.playbackTimeouts.forEach(id => {
      // Calculate remaining time for this timeout
      // Use the dynamically generated key to access timeout info
      const timeoutInfoKey = `timeout_${id}_info` as keyof Window;
      const timeoutInfo = window[timeoutInfoKey];

      if (timeoutInfo) {
        const elapsedTime = Date.now() - timeoutInfo.startTime;
        const remainingTime = Math.max(0, timeoutInfo.duration - elapsedTime);

        // Store the timeout info for resuming later
        pausedTimeouts.value.push({
          id: id as unknown as number, // Convert Timeout to number
          remainingTime,
          callback: timeoutInfo.callback
        });
        // Clean up the stored info
        delete window[timeoutInfoKey];
      }

      // Clear the timeout
      clearTimeout(id);
    });

    // Clear the timeouts array
    window.playbackTimeouts = [];
  }

  console.log('Playback paused with', pausedTimeouts.value.length, 'pending timeouts');
};

// Add a function to resume playback
const resumePlayback = () => {
  if (!isPaused.value) return;

  isPaused.value = false;
  isPlaying.value = true;

  // Reset the currently playing note ID to avoid multiple highlights
  currentPlayingNoteIds.value = []; // Changed from currentPlayingNoteId

  // Recreate all timeouts with their remaining time
  window.playbackTimeouts = [];

  // Sort timeouts by remaining time to ensure they execute in the correct order
  const sortedTimeouts = [...pausedTimeouts.value].sort((a, b) => a.remainingTime - b.remainingTime);

  console.log('Resuming playback with', sortedTimeouts.length, 'timeouts');

  // Skip any timeouts with very small remaining time (less than 10ms)
  // These are likely to be the ones that would play immediately and cause the first note issue
  const validTimeouts = sortedTimeouts.filter(timeout => timeout.remainingTime > 10);

  // Group timeouts that are very close together (within 50ms) to prevent duplicates
  const groupedTimeouts: { remainingTime: number, callbacks: Function[]; }[] = [];

  validTimeouts.forEach(timeout => {
    // Check if we have a group that's very close in time
    const existingGroup = groupedTimeouts.find(group =>
      Math.abs(group.remainingTime - timeout.remainingTime) < 50
    );

    if (existingGroup) {
      // Add this callback to the existing group
      existingGroup.callbacks.push(timeout.callback);
    } else {
      // Create a new group
      groupedTimeouts.push({
        remainingTime: timeout.remainingTime,
        callbacks: [timeout.callback]
      });
    }
  });

  // Create timeouts for each group
  groupedTimeouts.forEach(group => {
    // Add a small delay (100ms) to all timeouts to prevent immediate playback
    const adjustedTime = Math.max(100, group.remainingTime);

    const newTimeoutId = setTimeout(() => {
      // Execute only the first callback in the group to prevent duplicates
      if (group.callbacks.length > 0) {
        group.callbacks[0]();
      }
    }, adjustedTime);

    // Store the new timeout ID
    window.playbackTimeouts.push(newTimeoutId);

    // Store timeout info for potential future pausing
    (window as any)[`timeout_${newTimeoutId}_info`] = {
      startTime: Date.now(),
      duration: adjustedTime,
      callback: group.callbacks[0]
    };
  });

  // Clear the paused timeouts
  pausedTimeouts.value = [];
  pauseTime.value = null;

  console.log('Playback resumed with', groupedTimeouts.length, 'grouped timeouts');
};

// Add a function to toggle playback
const togglePlayback = () => {
  if (!isPlaying.value && !isPaused.value) {
    // Not playing and not paused -> Start playing
    playComposition();
  } else if (isPlaying.value && !isPaused.value) {
    // Playing and not paused -> Pause
    pausePlayback();
  } else if (isPaused.value) {
    // Paused -> Resume
    resumePlayback();
  }
};

// Add a function to restart playback
const restartPlayback = () => {
  // First stop the current playback
  stopPlayback();

  // Small delay to ensure everything is stopped
  setTimeout(() => {
    // Start playback again (which will use the current measure range settings)
    playComposition();
  }, 100);
};

// Add a function to show a confirmation dialog before clearing the score
const confirmClearScore = () => {
  // Only show confirmation if there are notes to clear
  if (notes.value.length > 0) {
    if (confirm('Are you sure you want to clear the score? This action cannot be undone.')) {
      clearScore();
    }
  } else {
    // If there are no notes, just clear without confirmation
    clearScore();
  }
};

// Add this function to detect if musical symbols are properly displayed
const usesFallbackSymbols = ref(false);

// Check if the device needs fallback symbols
onMounted(() => {
  // Try to detect iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  // Default to fallback symbols on iOS
  usesFallbackSymbols.value = isIOS;

  // Additional check: try to measure a rendered symbol
  const testElement = document.createElement('span');
  testElement.style.fontFamily = 'Bravura, serif';
  testElement.style.fontSize = '20px';
  testElement.style.visibility = 'hidden';
  testElement.innerText = '♩'; // Test with a quarter note
  document.body.appendChild(testElement);

  // If the width is too small, it's likely showing a square or placeholder
  const width = testElement.offsetWidth;
  if (width < 5) {
    usesFallbackSymbols.value = true;
  }

  document.body.removeChild(testElement);
});

// Add a new ref for the current lyric input
const currentLyric = ref('');

// Add a function to set lyrics for the selected note
const setLyricForNote = (noteId, lyric) => {
  // First try to find the note in the active voice
  let noteIndex = activeVoice.value.notes.findIndex(note => note.id === noteId);
  let targetVoice = activeVoice.value;

  // If not found in active voice, search all voices
  if (noteIndex === -1) {
    for (const voice of voiceLayers.value) {
      noteIndex = voice.notes.findIndex(note => note.id === noteId);
      if (noteIndex !== -1) {
        targetVoice = voice;
        break;
      }
    }
  }

  if (noteIndex !== -1) {
    // Create a new note object with the lyric added
    const updatedNote = {
      ...targetVoice.notes[noteIndex],
      lyric: lyric.trim()
    };

    // Replace the note in the array
    targetVoice.notes.splice(noteIndex, 1, updatedNote);

    // Clear the current lyric input
    currentLyric.value = '';

    // Clear the selected note
    selectedNoteId.value = null;
  }
};

// Add a function to handle lyric input keypress events
const handleLyricInputKeypress = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && selectedNoteId.value) {
    setLyricForNote(selectedNoteId.value, currentLyric.value);
    event.preventDefault();
  }
};



// Add this computed property to get the active voice layer
// const activeVoice = computed(() => {
//   return voiceLayers.value.find(layer => layer.id === activeVoiceId.value) || voiceLayers.value[0];
// });


// Update the existing notes ref to use the active voice's notes
// This is a computed property with a getter and setter
// const notes = computed({
//   get: () => {
//     return activeVoice.value.notes;
//   },
//   set: (newNotes) => {
//     // Find the active voice and update its notes
//     const voiceIndex = voiceLayers.value.findIndex(v => v.id === activeVoiceId.value);
//     if (voiceIndex !== -1) {
//       voiceLayers.value[voiceIndex].notes = newNotes;
//     }
//   }
// });

// Add a function to switch between voice layers
const switchActiveVoice = (voiceIdToActivate: string) => {
  const voiceToActivate = voiceLayers.value.find(v => v.id === voiceIdToActivate);
  if (!voiceToActivate) return;

  // Deactivate all other voices
  voiceLayers.value.forEach(voice => {
    voice.active = voice.id === voiceIdToActivate;
  });

  activeVoiceId.value = voiceIdToActivate;
  activeStaffId.value = voiceToActivate.staffId; // Also set the active staff

  selectedNoteId.value = null;
  console.log(`Switched to voice: ${voiceIdToActivate} on staff: ${activeStaffId.value}`);
};

// Add a function to toggle voice visibility
const toggleVoiceVisibility = (voiceId) => {
  const voiceIndex = voiceLayers.value.findIndex(v => v.id === voiceId);
  if (voiceIndex !== -1) {
    voiceLayers.value[voiceIndex].visible = !voiceLayers.value[voiceIndex].visible;
  }
};

// Add a function to rename a voice
const renameVoice = (voiceId, newName) => {
  const voiceIndex = voiceLayers.value.findIndex(v => v.id === voiceId);
  if (voiceIndex !== -1) {
    voiceLayers.value[voiceIndex].name = newName;
  }
};

// Add a function to change a voice's color
const changeVoiceColor = (voiceId, newColor) => {
  const voiceIndex = voiceLayers.value.findIndex(v => v.id === voiceId);
  if (voiceIndex !== -1) {
    voiceLayers.value[voiceIndex].color = newColor;
  }
};

// Helper function to get default voice color
const getDefaultVoiceColor = (voiceId: string): string => { // Added type annotations
  const colorMap: { [key: string]: string; } = { // Added type annotation
    'voice1': '#1976D2', // Blue
    'voice2': '#E91E63', // Pink
    'voice3': '#4CAF50', // Green
    'voice4': '#FF9800'  // Orange
  };
  return colorMap[voiceId] || '#000000';
};

// Add this ref for voice playback selection
const playSelectedVoicesOnly = ref(false);

// Function to confirm and delete a voice layer
const confirmDeleteVoice = (voiceIdToDelete: string) => {
  if (voiceLayers.value.length <= 1) {
    alert("Cannot delete the last voice."); // Or handle this more gracefully
    return;
  }

  const voiceToDelete = voiceLayers.value.find(v => v.id === voiceIdToDelete);
  if (!voiceToDelete) return;

  const confirmation = confirm(`Are you sure you want to delete "${voiceToDelete.name}" and all its notes? This action cannot be undone.`);

  if (confirmation) {
    deleteVoice(voiceIdToDelete);
  }
};

// Function to actually delete the voice
const deleteVoice = (voiceIdToDelete: string) => {
  const voiceIndex = voiceLayers.value.findIndex(v => v.id === voiceIdToDelete);
  if (voiceIndex > -1) {
    voiceLayers.value.splice(voiceIndex, 1);

    // If the deleted voice was the active one, make another voice active
    // Preferably the first one, or the one before the deleted one if possible.
    if (activeVoiceId.value === voiceIdToDelete) {
      if (voiceLayers.value.length > 0) {
        // Try to set the previous voice as active, or the first one
        let newActiveIndex = voiceIndex - 1;
        if (newActiveIndex < 0 || newActiveIndex >= voiceLayers.value.length) {
          newActiveIndex = 0;
        }
        if (voiceLayers.value[newActiveIndex]) {
          switchActiveVoice(voiceLayers.value[newActiveIndex].id);
        }
      } else {
        // This case should ideally not be reached if we prevent deleting the last voice,
        // but as a fallback:
        activeVoiceId.value = ''; // Or handle as appropriate if no voices are left
      }
    }
    // Notes associated with this voice are already part of the voice object and will be removed
    // when the voice is spliced from voiceLayers.
    // If notes were stored separately and only linked by voiceId, you'd need to filter them out here.

    // Persist changes (if you have a save-to-storage mechanism)
    // saveCompositionsToStorage(); // Assuming you have this function
    console.log(`Voice ${voiceIdToDelete} deleted.`);
  }
};

// Add a function to add a new voice layer
const addVoiceLayer = (staffIdToAddVoiceTo?: string) => {
  let targetStaffId = staffIdToAddVoiceTo || activeStaffId.value;

  if (!targetStaffId && staves.value.length > 0) {
    targetStaffId = staves.value[0].id; // Default to the first staff if no active one
  } else if (!targetStaffId && staves.value.length === 0) {
    // If no staves exist, create one first
    const newStaffId = generateId();
    staves.value.push({ id: newStaffId, clef: 'treble', order: 0, name: 'Staff 1' });
    activeStaffId.value = newStaffId;
    targetStaffId = newStaffId;
    console.log("No staves found when adding voice, created a default staff:", newStaffId);
  }
  
  if (!targetStaffId) {
    alert("Cannot add voice layer: No staff available or selected.");
    console.error("Failed to add voice layer: No targetStaffId determined.");
    return;
  }

  const newVoiceId = generateId();
  const newVoice: VoiceLayer = {
    id: newVoiceId,
    name: `Voice ${voiceLayers.value.length + 1}`,
    color: getRandomColor(),
    visible: true,
    active: false, // New voices are not active by default, user switches to them
    selected: true, // Selected for playback by default
    volume: 100, // Default volume as percentage
    notes: [],
    staffId: targetStaffId,
  };
  voiceLayers.value.push(newVoice);
  switchActiveVoice(newVoiceId); // Make the new voice active
  console.log(`Added new voice layer ${newVoiceId} to staff ${targetStaffId}`);
  saveToLocalStorage();
};

// Function to assign a voice to a different staff
const assignVoiceToStaff = (voiceId: string, newStaffId: string) => {
  const voice = voiceLayers.value.find(v => v.id === voiceId);
  const staffExists = staves.value.some(s => s.id === newStaffId);

  if (voice && staffExists) {
    voice.staffId = newStaffId;
    console.log(`Voice ${voice.name} assigned to staff ${newStaffId}`);
    // If this voice was active, ensure the activeStaffId is also updated
    if (voice.active) {
      activeStaffId.value = newStaffId;
    }
    saveToLocalStorage();
  } else {
    console.error(`Failed to assign voice ${voiceId} to staff ${newStaffId}. Voice or staff not found.`);
    alert("Error assigning voice to staff. Please try again.");
  }
};

// End of your script section with watches
watch(allVisibleNotes, (newNotes) => {
  console.log('All visible notes changed:', newNotes.length);
}, { deep: true });

watch(voiceLayers, () => {
  console.log('Voice layers changed');
}, { deep: true });

// existing code...
const debugMonitorInterval = ref<number | null>(null); // Added type annotation
const showStaffLines = ref(true); // Added this line

const LYRIC_BASE_OFFSET = 230; // Base Y position for the first line of lyrics
const LYRIC_LINE_HEIGHT = 20;  // Estimated height per lyric line (adjust as needed)

// Computed property to get an ordered list of visible voice IDs that have lyrics
const orderedVisibleVoicesWithLyrics = computed(() => {
  const voiceIdSetByStaff: Record<string, Set<string>> = {};

  allVisibleNotes.value.forEach(note => {
    if (note.lyric && note.voiceId && note.staffId) {
      if (!voiceIdSetByStaff[note.staffId]) {
        voiceIdSetByStaff[note.staffId] = new Set<string>();
      }
      voiceIdSetByStaff[note.staffId].add(note.voiceId);
    }
  });

  const result: Record<string, string[]> = {};
  for (const staffId in voiceIdSetByStaff) {
    result[staffId] = Array.from(voiceIdSetByStaff[staffId]).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10) || 0; // Extract numbers for sorting
      const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
    return numA - numB;
  });
  }
  return result;
});

// Helper function to get vertical offset for lyrics based on its display index among visible voices with lyrics ON A SPECIFIC STAFF
const getLyricVerticalOffset = (voiceId: string, staffId: string): string => {
  const voicesWithLyricsOnThisStaff = orderedVisibleVoicesWithLyrics.value[staffId] || [];
  const displayIndex = voicesWithLyricsOnThisStaff.indexOf(voiceId);

  if (displayIndex === -1) {
    // Default position if this voice doesn't have lyrics or isn't found (should not happen if called correctly)
    return `${LYRIC_BASE_OFFSET}px`;
  }
  return `${LYRIC_BASE_OFFSET + displayIndex * LYRIC_LINE_HEIGHT}px`;
};

// Computed property for the dynamic height of the staff container
const staffContainerMinHeight = computed(() => {
  // This is now for a single staff. The outer container will grow.
  // Calculate max lyric lines for any single staff to determine individual staff height.
  let maxLyricLinesOnAnyStaff = 0;
  if (staves.value.length > 0) {
      for (const staff of staves.value) {
          const lyricLinesForThisStaff = (orderedVisibleVoicesWithLyrics.value[staff.id] || []).length;
          if (lyricLinesForThisStaff > maxLyricLinesOnAnyStaff) {
              maxLyricLinesOnAnyStaff = lyricLinesForThisStaff;
          }
      }
  }

  const staffBaseHeight = 250;
  if (maxLyricLinesOnAnyStaff === 0) {
    return `${staffBaseHeight}px`;
  }
  const topOfFirstLyric = LYRIC_BASE_OFFSET;
  const bottomEdgeOfLastLyric = topOfFirstLyric + (maxLyricLinesOnAnyStaff * LYRIC_LINE_HEIGHT);
  const PADDING_BELOW_LYRICS = LYRIC_LINE_HEIGHT;
  const requiredHeightForLyrics = bottomEdgeOfLastLyric + PADDING_BELOW_LYRICS;
  return `${Math.max(staffBaseHeight, requiredHeightForLyrics)}px`;
});

// Computed property to get notes for a specific staff
const notesForStaff = (staffId: string): NoteWithVoiceInfo[] => {
  return allVisibleNotes.value.filter(note => note.staffId === staffId);
};

// Computed property to get notes with lyrics for a specific staff
const notesForStaffWithLyrics = (staffId: string): NoteWithVoiceInfo[] => {
  return allVisibleNotes.value.filter(note => note.staffId === staffId && note.lyric);
};

// Add these functions to save and load compositions from localStorage

// Save compositions to localStorage
const saveCompositionsToStorage = () => {
  try {
    const compositionsJson = JSON.stringify(savedCompositions.value);
    localStorage.setItem('stCeciliaCompositions', compositionsJson);
    console.log('Compositions saved to localStorage');
  } catch (error) {
    console.error('Error saving compositions to localStorage:', error);
  }
};

// Load compositions from localStorage
const loadCompositionsFromStorage = () => {
  try {
    const compositionsJson = localStorage.getItem('stCeciliaCompositions');
    if (compositionsJson) {
      const loadedCompositions = JSON.parse(compositionsJson);
      savedCompositions.value = loadedCompositions;
      console.log('Compositions loaded from localStorage');
    }
  } catch (error) {
    console.error('Error loading compositions from localStorage:', error);
  }
};

// Then, in your onMounted lifecycle hook, load compositions from localStorage
onMounted(() => {
  // Other initialization code...

  // Load saved compositions from localStorage
  loadCompositionsFromStorage();

  // Other setup code...
});

// Additionally, we can setup a watch to auto-save whenever compositions change
watch(savedCompositions, () => {
  saveCompositionsToStorage();
}, { deep: true });

// Function to change the key signature (this is the handler for the event)
// const changeKeySignatureDirectly = (key: string) => {
//   keySignature.value = key;
//   // Potentially other logic that was in the original changeKeySignature if it did more than set the ref
// };

// Add a function to handle the clearOrRestart emit from PlaybackControls
const handleClearOrRestart = () => {
  if (isPlaying.value || isPaused.value) {
    restartPlayback();
  } else {
    confirmClearScore();
  }
};

// Add a handler for saveRename from SavedCompositionsPanel
const handleSaveRename = (id: string, newName: string) => {
  // The actual logic for renaming is in NotationEditorView
  if (!newName.trim()) {
    alert('Please enter a valid name');
    return;
  }
  const composition = savedCompositions.value.find(comp => comp.id === id);
  if (!composition) {
    console.error('Composition not found for rename:', id);
    return;
  }
  composition.name = newName.trim();
  saveCompositionsToStorage(); // Corrected function call
  // The SavedCompositionsPanel will handle its internal UI state for editing
  alert('Composition renamed successfully!');
};

// The toggleDottedNote function is simple enough to be emitted directly
// or handled by v-model:isDottedNote if NoteInputControls uses it.
// For now, if NoteInputControls emits 'toggleDottedNote', this existing function will handle it.

const setLyricForNoteHandler = (noteId: string, lyric: string) => {
  setLyricForNote(noteId, lyric); // Call the existing function
  // currentLyric.value = ''; // LyricsControls now uses v-model, so parent doesn't need to clear it.
  // The setLyricForNote function itself should clear currentLyric if that's the desired UX.
};

const updateVoiceLayerSelection = (voiceId: string, selected: boolean) => {
  const voice = voiceLayers.value.find(v => v.id === voiceId);
  if (voice) {
    voice.selected = selected; // This is where the magic happens!
  }
};

// Initialize Debug Composable
// Pass the 'notes' computed property (or the ref it depends on)
// For notesForDebug, DebugPanel expects 'notes' which is activeVoice.value.notes
const {
  debugMode, // Get the reactive ref from the composable
  showNotePositions, // Get the reactive ref from the composable
  toggleDebugMode, // Get the method from the composable
  testAllNotes, // Get the method from the composable
  // notesForDebug will be the 'notes' computed property from NotationEditorView
  // lastClickY and selectedOctave are passed through for DebugPanel
} = useDebug(
    notes as ComputedRef<ImportedNote[]>,
    computed(() => staves.value.find(s => s.id === activeStaffId.value)?.clef || (staves.value.length > 0 ? staves.value[0].clef : 'treble')), // Pass active staff's clef
    lastClickY,
    selectedOctave
);

// Add this import at the top of your script section
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

// Add this function near other composition-related functions (around line 2060)
const combineCompositions = (compositionIds: string[], newName: string, preserveStaves: boolean) => {
  const compositionsToCombine = savedCompositions.value.filter(comp => compositionIds.includes(comp.id));
  if (compositionsToCombine.length < 2) {
    alert("Please select at least two compositions to combine.");
    return;
  }

  console.log(`Combining ${compositionsToCombine.length} compositions. Preserve staves: ${preserveStaves}`);

  stopPlayback(); // Stop any current playback

  // Create a new base composition structure
    const newComposition: CompositionData = {
    id: generateId(),
    name: newName || "Combined Composition",
      dateCreated: Date.now(),
      staves: [],
      voiceLayers: [],
    keySignature: compositionsToCombine[0].keySignature || 'C', // Take from first composition
    timeSignature: compositionsToCombine[0].timeSignature || '4/4', // Take from first composition
    tempo: compositionsToCombine[0].tempo || 120,
    staffWidth: compositionsToCombine[0].staffWidth || 2000,
    // notes: [], // Notes will be part of voice layers
    sections: [], // Sections could be complex to merge, starting fresh or taking from first
    sequenceItems: [], // Same for sequence items
    // Other metadata from the first composition or averaged/defaulted
    selectedDuration: compositionsToCombine[0].selectedDuration || 'quarter',
    selectedOctave: compositionsToCombine[0].selectedOctave || 4,
    isDottedNote: compositionsToCombine[0].isDottedNote || false,
  };

  const staffIdMap: Record<string, string> = {}; // Maps old staff IDs to new staff IDs
  const voiceIdMap: Record<string, string> = {}; // Maps old voice IDs to new voice IDs

  compositionsToCombine.forEach((comp, compIndex) => {
    console.log(`Processing composition: ${comp.name}`, comp);
    const compStaves = comp.staves || [];
    const compVoiceLayers = comp.voiceLayers || [];

    if (preserveStaves) {
      compStaves.forEach((oldStaff: Stave) => {
          const newStaffId = generateId();
        staffIdMap[oldStaff.id] = newStaffId;
        const newStaff: Stave = {
            id: newStaffId,
          name: `${oldStaff.name || `Staff ${compIndex + 1}-${newComposition.staves!.length + 1}`} (from ${comp.name})`,
          clef: oldStaff.clef || 'treble', // *** Preserve original clef ***
          order: newComposition.staves!.length
        };
        newComposition.staves!.push(newStaff);
        console.log(`Created new staff ${newStaff.id} with clef ${newStaff.clef} from old staff ${oldStaff.id}`);
      });

      compVoiceLayers.forEach(oldVoice => {
        const newVoiceId = generateId();
        voiceIdMap[oldVoice.id] = newVoiceId;
        const newStaffIdForVoice = oldVoice.staffId ? staffIdMap[oldVoice.staffId] : undefined;

        if (!newStaffIdForVoice && newComposition.staves!.length > 0) {
          console.warn(`Voice ${oldVoice.name} had no staff or unmapped staff. Assigning to first new staff.`);
           // Attempt to find a staff from the same original composition if possible
          const originalCompStaff = newComposition.staves!.find(s => s.name?.includes(`(from ${comp.name})`));
          const targetStaff = originalCompStaff || newComposition.staves![0];
          
          const newVoice: VoiceLayer = {
            ...oldVoice,
            id: newVoiceId,
            staffId: targetStaff.id, // Assign to a valid new staff
            name: `${oldVoice.name} (from ${comp.name})`,
            notes: (oldVoice.notes || []).map(n => ({ ...n, id: generateId() })), // New IDs for notes
            active: false, // Deactivate by default
            selected: oldVoice.selected !== undefined ? oldVoice.selected : true,
            volume: oldVoice.volume !== undefined ? oldVoice.volume : 100, // Convert or default volume
          };
          newComposition.voiceLayers!.push(newVoice);
          console.log(`Added voice ${newVoice.id} to staff ${newVoice.staffId}`);
        } else if (newStaffIdForVoice) {
           const newVoice: VoiceLayer = {
            ...oldVoice,
            id: newVoiceId,
            staffId: newStaffIdForVoice,
            name: `${oldVoice.name} (from ${comp.name})`,
            notes: (oldVoice.notes || []).map(n => ({ ...n, id: generateId() })),
            active: false,
            selected: oldVoice.selected !== undefined ? oldVoice.selected : true,
            volume: oldVoice.volume !== undefined ? oldVoice.volume : 100, // Convert or default volume
          };
          newComposition.voiceLayers!.push(newVoice);
          console.log(`Added voice ${newVoice.id} to staff ${newVoice.staffId}`);
      } else {
            console.error(`Could not find a staff for voice ${oldVoice.name} from ${comp.name}. Skipping voice.`);
        }
      });

    } else { // Not preserving staves - create one new staff per old composition
      const compSpecificNewStaffIds: string[] = [];
      if (compStaves.length > 0) {
        // Create one new staff for this composition, taking clef from its first original staff
        const newStaffId = generateId();
        const firstOldStaffClef = compStaves[0].clef || 'treble';
        const newStaffForComp: Stave = {
          id: newStaffId,
          name: `${comp.name} - Merged Staff ${newComposition.staves!.length + 1}`,
          clef: firstOldStaffClef, // *** Use clef from first original staff ***
          order: newComposition.staves!.length,
          isCollapsed: false, // Default for new staves
        };
        newComposition.staves!.push(newStaffForComp);
        compSpecificNewStaffIds.push(newStaffId);
        staffIdMap[`${comp.id}_defaultStaff`] = newStaffId; // Generic mapping for this comp's voices
        console.log(`Created merged staff ${newStaffId} with clef ${firstOldStaffClef} for composition ${comp.name}`);
      } else {
        // If the old composition had no staves defined, create a default treble staff for its voices
        const newStaffId = generateId();
        const newStaffForComp: Stave = {
          id: newStaffId,
          name: `${comp.name} - Default Staff ${newComposition.staves!.length + 1}`,
          clef: 'treble', // Default if no original staves
          order: newComposition.staves!.length,
          isCollapsed: false, // Default for new staves
        };
        newComposition.staves!.push(newStaffForComp);
        compSpecificNewStaffIds.push(newStaffId);
        staffIdMap[`${comp.id}_defaultStaff`] = newStaffId;
        console.log(`Created default staff ${newStaffId} with clef treble for composition ${comp.name} (had no staves)`);
      }
      
      const targetStaffIdForCompVoices = compSpecificNewStaffIds[0] || (newComposition.staves!.length > 0 ? newComposition.staves![0].id : undefined);

      if (!targetStaffIdForCompVoices) {
        console.error(`Cannot add voices for ${comp.name} as no target staff could be determined or created.`);
        return; // Skip voices for this comp if no staff
      }

      compVoiceLayers.forEach(oldVoice => {
        const newVoiceId = generateId();
        voiceIdMap[oldVoice.id] = newVoiceId;
          const newVoice: VoiceLayer = {
          ...oldVoice,
          id: newVoiceId,
          staffId: targetStaffIdForCompVoices, // All voices from this comp go to its new single staff
            name: `${oldVoice.name} (from ${comp.name})`,
          notes: (oldVoice.notes || []).map(n => ({ ...n, id: generateId() })),
          active: false,
          selected: oldVoice.selected !== undefined ? oldVoice.selected : true,
          volume: oldVoice.volume !== undefined ? oldVoice.volume : 100, // Convert or default volume
          };
          newComposition.voiceLayers!.push(newVoice);
        });

      // Handle 'flat notes' if they exist on the old composition (legacy)
      // These notes need to be assigned to a voice on the new staff for this composition.
      if ((comp as any).notes && (comp as any).notes.length > 0) {
        console.log(`Migrating ${comp.notes.length} flat notes from ${comp.name}`);
        let defaultVoiceForFlatNotes = newComposition.voiceLayers!.find(
          vl => vl.staffId === targetStaffIdForCompVoices && vl.name?.includes('(from ${comp.name})')
        );
        if (!defaultVoiceForFlatNotes) {
            const newDefaultVoiceId = generateId();
          defaultVoiceForFlatNotes = {
              id: newDefaultVoiceId,
            name: `Default Voice (from ${comp.name} flat notes)`,
              color: getRandomColor(),
              visible: true,
            active: false,
              selected: true,
              volume: 100, // Default to 100%
              notes: [],
            staffId: targetStaffIdForCompVoices,
          };
          newComposition.voiceLayers!.push(defaultVoiceForFlatNotes);
          console.log(`Created default voice ${defaultVoiceForFlatNotes.id} for flat notes from ${comp.name} on staff ${targetStaffIdForCompVoices}`);
        }
        (comp as any).notes.forEach((note: any) => {
          const { voiceId, voiceColor, ...restOfNote } = note;
          defaultVoiceForFlatNotes!.notes.push({
            ...restOfNote,
            id: generateId(),
          });
          });
        }
      }
  });

  // Final cleanup and loading
    if (newComposition.staves!.length === 0) {
    console.warn("Combined composition resulted in no staves. Adding a default staff.");
    newComposition.staves!.push({ id: generateId(), name: "Default Combined Staff", clef: 'treble', order: 0, isCollapsed: false });
  }
  if (newComposition.voiceLayers!.length === 0 && newComposition.staves!.length > 0) {
     console.warn("Combined composition resulted in no voice layers. Adding a default voice.");
        newComposition.voiceLayers!.push({
        id: generateId(), name: "Default Combined Voice", color: getRandomColor(), staffId: newComposition.staves![0].id,
        visible: true, active: true, selected: true, volume: 100, notes:[] // Default to 100%
        });
    }


  // Add the new combined composition to savedCompositions
    savedCompositions.value.push(newComposition);
  // Load the new combined composition
      loadComposition(newComposition.id);
  compositionName.value = newComposition.name; // Update current composition name input
  currentCompositionId.value = newComposition.id; // Set as current
  activeTab.value = 'notes'; // Switch to notes tab
  alert(`Compositions combined into "${newComposition.name}".`);
  saveToLocalStorage(); // Save all changes
};

// Add this around line 119 where other refs are defined
const sections = ref<Section[]>([]);

// Add a function to add a section
const addSection = (sectionData: Omit<Section, 'id'>) => {
  const newSection = {
    ...sectionData,
    id: generateId()
  };

  sections.value.push(newSection);
  console.log(`Added section "${newSection.name}" from measure ${newSection.startMeasure} to ${newSection.endMeasure}`);
};

// Add a function to delete a section
const deleteSection = (sectionId: string) => {
  const index = sections.value.findIndex(section => section.id === sectionId);
  if (index !== -1) {
    const deletedSection = sections.value.splice(index, 1)[0];
    console.log(`Deleted section "${deletedSection.name}"`);
  }
};

// Add a function to play a specific section
const playSection = (section: Section) => {
  // Stop any current playback
  stopPlayback();

  // Set the playback range to the section boundaries
  playbackStartMeasure.value = section.startMeasure;
  playbackEndMeasure.value = section.endMeasure;

  // Start playback
  console.log(`Playing section "${section.name}" (measures ${section.startMeasure} to ${section.endMeasure})`);
  playComposition();
};

// Add a function to jump to a section (just scroll, don't play)
const jumpToSection = (section: Section) => {
  // Calculate position of start measure
  const measureWidth = measureWidthByTimeSignature.value;
  const keySignatureWidth = currentKeySignatureAccidentals.value.length * 10;
  const initialPosition = 70 + keySignatureWidth + 20; // clef + key sig + time sig

  // Calculate where the measure starts
  const measureStart = initialPosition + ((section.startMeasure - 1) * measureWidth);

  // Scroll to that position
  scrollPosition.value = Math.max(0, measureStart - 100); // 100px padding at left
  updateStaffScroll();

  console.log(`Jumped to section "${section.name}" (measure ${section.startMeasure})`);
};

// Add this function to calculate the position of a section marker
const getSectionPosition = (measure: number) => {
  const measureWidth = measureWidthByTimeSignature.value;
  const keySignatureWidth = currentKeySignatureAccidentals.value.length * 10;
  const initialPosition = 70 + keySignatureWidth + 20; // clef + key sig + time sig

  // Calculate position based on measure number
  return initialPosition + ((measure - 1) * measureWidth);
};

// Add these variables near where the 'sections' ref is defined
// Place this with other refs
const currentSequence = ref<SequenceItem[]>([]);
const currentSequenceIndex = ref<number>(0);
const isPlayingSequence = ref(false);
const playingSequenceSectionId = ref<string | null>(null);

// Add this function to play a sequence of sections
const playSequence = (sequence: SequenceItem[]) => {
  console.log('playSequence called with sequence:', sequence);
  
  if (sequence.length === 0) {
    alert('Playback sequence is empty. Please add sections to the sequence.');
    return;
  }
  
  // Stop any current playback
  stopPlayback();
  
  // Store the current sequence for step tracking
  currentSequence.value = [...sequence]; 
  currentSequenceIndex.value = 0;
  isPlayingSequence.value = true;
  
  console.log('About to play sequence with', sequence.length, 'sections. First section ID:', sequence[0].sectionId);
  
  // Play the first section in the sequence
  playNextInSequence();
};

// Function to play the next section in the sequence
const playNextInSequence = () => {
  if (currentSequenceIndex.value >= currentSequence.value.length) {
    // End of sequence reached
    isPlayingSequence.value = false;
    currentSequenceIndex.value = 0;
    playingSequenceSectionId.value = null;
    console.log('Sequence playback completed');
    return;
  }
  
  // Get the current section to play
  const sequenceItem = currentSequence.value[currentSequenceIndex.value];
  const section = sections.value.find(s => s.id === sequenceItem.sectionId);
  
  if (!section) {
    console.error(`Section with ID ${sequenceItem.sectionId} not found, skipping`);
    currentSequenceIndex.value++;
    setTimeout(() => playNextInSequence(), 100);
    return;
  }
  
  console.log(`Playing sequence part ${currentSequenceIndex.value + 1}/${currentSequence.value.length}: ${section.name}`);
  
  // Update UI to highlight the current section
  playingSequenceSectionId.value = section.id;
  
  // Jump to the section
  jumpToSection(section);
  
  // Play this section with its specific range WITHOUT changing global playback range
  playCompositionWithCallback(section.startMeasure, section.endMeasure);
};

// Modify playCompositionWithCallback to accept optional start/end measures
const playCompositionWithCallback = (sectionStartMeasure: number | null = null, sectionEndMeasure: number | null = null) => {
  if (isPlaying.value) return;
  
  isPlaying.value = true;
  currentPlayingNoteIds.value = []; // Changed from currentPlayingNoteId
  
  // Initialize Tone.js if needed
  initializeToneJs();
  
  // Get all visible notes from all visible voice layers
  const visibleVoices = voiceLayers.value.filter(voice => voice.visible);
  
  // Determine which voices to play based on playback settings
  const voicesToPlay = playSelectedVoicesOnly.value 
    ? voiceLayers.value.filter(voice => voice.visible && voice.selected)
    : visibleVoices;
  
  // If no voices are selected for playback, use all visible voices
  if (playSelectedVoicesOnly.value && voicesToPlay.length === 0) {
    voicesToPlay.push(...visibleVoices);
  }
  
  // Collect all notes from the voices to play
  let allNotesToPlay = [];
  voicesToPlay.forEach(voice => {
    // Add voice ID to each note for identification during playback
    const voiceNotes = voice.notes.map(note => ({
      ...note,
      voiceId: voice.id,
      voiceColor: voice.color
    }));
    allNotesToPlay = allNotesToPlay.concat(voiceNotes);
  });
  
  // Sort all notes by position
  const sortedNotes = allNotesToPlay.sort((a, b) => a.position - b.position);
  
  // Filter notes based on selected measures
  let filteredNotes = sortedNotes;
  
  // Use section-specific measures if provided, otherwise use global playback range
  const startMeasure = sectionStartMeasure !== null ? sectionStartMeasure : playbackStartMeasure.value;
  const endMeasure = sectionEndMeasure !== null ? sectionEndMeasure : playbackEndMeasure.value;
  
  if (startMeasure > 1 || (endMeasure > 0)) {
    filteredNotes = sortedNotes.filter(note => {
      const noteMeasure = getNotesMeasure(note);
      
      // Check if the note is within the selected measure range
      const isAfterStart = noteMeasure >= startMeasure;
      const isBeforeEnd = endMeasure === 0 || noteMeasure <= endMeasure;
      
      return isAfterStart && isBeforeEnd;
    });
  }
  
  // Initialize array to track timeout IDs for cleanup
  if (!window.playbackTimeouts) window.playbackTimeouts = [];
  window.playbackTimeouts = [];
  
  // Clear any existing timeouts
  window.playbackTimeouts.forEach(id => clearTimeout(id));
  window.playbackTimeouts = [];
  
  // Group notes by position for chord playback
  const notesByPosition = {};
  filteredNotes.forEach(note => {
    if (!notesByPosition[note.position]) {
      notesByPosition[note.position] = [];
    }
    notesByPosition[note.position].push(note);
  });
  
  // Sort positions for sequential playback
  const positions = Object.keys(notesByPosition).map(Number).sort((a, b) => a - b);
  
  // Play notes in sequence with proper timing
  let totalDelay = 0;
  
  positions.forEach(position => {
    const notesAtPosition = notesByPosition[position];
    
    // Find the longest note duration at this position
    let longestDuration = 0;
    const durationMap = {
      'whole': 4,
      'half': 2,
      'quarter': 1,
      'eighth': 0.5,
      'sixteenth': 0.25
    };
    
    notesAtPosition.forEach(note => {
      let noteDuration = durationMap[note.duration] || 1;
      if (note.dotted) noteDuration *= 1.5;
      longestDuration = Math.max(longestDuration, noteDuration);
    });
    
    // Calculate the wait duration in seconds
    const secondsPerBeat = 60 / tempo.value;
    const waitDurationSeconds = longestDuration * secondsPerBeat;
    
    // Function to play all notes at this position
    const playNotesWithDelay = (notesToPlay, delay) => {
      const callback = () => {
        const idsAtThisPosition = notesToPlay.map(n => n.id);
        currentPlayingNoteIds.value.push(...idsAtThisPosition.filter(id => !currentPlayingNoteIds.value.includes(id)));
        
        if (notesToPlay.length > 0 && autoScrollToPlayingNote.value) {
            autoScrollToNote(notesToPlay[0]);
        }

        // Play all notes at this position simultaneously
        notesToPlay.forEach(noteToPlay => {
          // Set the current playing note ID // Removed: currentPlayingNoteId.value = noteToPlay.id;
          
          // Auto-scroll to the playing note if enabled // Moved up
          // if (autoScrollToPlayingNote.value) {
          //   autoScrollToNote(noteToPlay);
          // }
          
          if (noteToPlay.type === 'note' && noteToPlay.pitch) {
            // Map durations to Tone.js format
            const toneDurationMap = {
              'whole': '1n',
              'half': '2n',
              'quarter': '4n',
              'eighth': '8n',
              'sixteenth': '16n'
            };
            
            // Play the note using the Tone.js duration format
            const toneDuration = toneDurationMap[noteToPlay.duration] || '4n';
            
            // Adjust volume based on voice settings
            const voice = voiceLayers.value.find(v => v.id === noteToPlay.voiceId);
            const currentVoiceVolumePercent = voice ? voice.volume : 100; // Default to 100%
            
            playNoteSound(
              noteToPlay.pitch, 
              toneDuration, 
              noteToPlay.dotted, 
              currentVoiceVolumePercent, // Pass the voice's volume as percentage
              noteToPlay.explicitNatural  // Add this parameter
            );
          }
        });
      };
      
      const timeoutId = setTimeout(callback, delay);
      window.playbackTimeouts.push(timeoutId);
    };
    
    // Schedule these notes
    playNotesWithDelay(notesAtPosition, totalDelay * 1000);
    totalDelay += waitDurationSeconds;
  });
  
  // Stop playing after all notes have played
  const finalTimeoutId = setTimeout(() => {
    // Reset playback state variables
    isPlaying.value = false;
    isPaused.value = false;
    currentPlayingNoteIds.value = []; // Changed from currentPlayingNoteId
    
    // Clear any remaining timeouts
    if (window.playbackTimeouts) {
      window.playbackTimeouts.forEach(id => clearTimeout(id));
      window.playbackTimeouts = [];
    }
    
    console.log('Playback complete');
    
    // If we're playing a sequence, move to the next section
    if (isPlayingSequence.value) {
      currentSequenceIndex.value++;
      setTimeout(() => playNextInSequence(), 500); // Small delay between sections
    }
  }, totalDelay * 1000 + 100);
  
  window.playbackTimeouts.push(finalTimeoutId);
};

// Add this to the list of refs
const sequenceItems = ref<SequenceItem[]>([]);

// Add a function to handle sequence updates from the SectionsPanel
const updateSequence = (newSequence: SequenceItem[]) => {
  console.log('Updating sequence:', newSequence);
  sequenceItems.value = [...newSequence];
};

// Add this watch to confirm when sequenceItems changes
watch(sequenceItems, (newValue) => {
  console.log('sequenceItems changed:', newValue);
}, { deep: true });

// Modify the exportCurrentComposition function to log more details
// const exportCurrentComposition = async () => {
//   // ... existing code
  
//   // Add this log right before exporting
//   console.log('Exporting composition with sequence items:', compositionToExport.sequenceItems);
  
//   // ... rest of function
// };

// Add this new function
const enforceNaturalNotes = () => {
  let enforcedCount = 0;
  
  voiceLayers.value.forEach(voice => {
    voice.notes.forEach(note => {
      if (note.explicitNatural && note.pitch) {
        // Always force natural notes to be natural
        const noteLetter = note.pitch.charAt(0);
        const octave = note.pitch.slice(-1);
        
        // Set the pitch to explicitly have no accidentals
        if (note.pitch !== `${noteLetter}${octave}`) {
          note.pitch = `${noteLetter}${octave}`;
          enforcedCount++;
        }
      }
    });
  });
  
  if (enforcedCount > 0) {
    console.log(`Enforced ${enforcedCount} natural notes`);
  }
  
  return enforcedCount;
};

// Add a call to this function after key signature changes
const changeKeySignatureDirectly = (newKeySignature: string) => {
  // console.log(`Changing key signature from ${keySignature.value} to ${newKeySignature}`);
  keySignature.value = newKeySignature;
  
  // Enforce natural notes after key signature change to ensure their pitches remain natural
  const changedCount = enforceNaturalNotes();
  if (changedCount > 0) {
    // console.log('Saving to localStorage after enforcing naturals due to key signature change.');
    saveToLocalStorage(); // Save changes if any note pitches were corrected
  }
};

// Watch for keySignature changes (this might be redundant if AppHeader directly calls changeKeySignatureDirectly)
// However, it's a good safeguard if keySignature.value can be changed by other means.
watch(keySignature, (newValue, oldValue) => {
  if (newValue !== oldValue) { // Only run if there's an actual change
    // console.log(`Key signature watcher: changed from ${oldValue} to ${newValue}`);
    const enforcedCount = enforceNaturalNotes();
    if (enforcedCount > 0) {
      // console.log('Saving to localStorage from keySignature watcher after enforcing naturals.');
      saveToLocalStorage();
    }
  }
}, { deep: true }); // deep might not be necessary for a simple string ref

// existing code...

// Add ref for instruction modal visibility
const showFirstTimeInstructions = ref(false);

// Function to check if it's the first time visit
const checkFirstTimeVisit = () => {
  const hasSeenInstructions = localStorage.getItem('musicNotationAppInstructionSeen');
  if (!hasSeenInstructions) {
    // Wait a short moment before showing the modal to ensure UI is loaded
    setTimeout(() => {
      showFirstTimeInstructions.value = true;
    }, 1000);
  }
};

// Function to close the instruction modal
const closeFirstTimeInstructions = () => {
  showFirstTimeInstructions.value = false;
};

// ... existing code ...

// Add this function to initialize a default staff and voice
const initializeDefaultStaffAndVoice = () => {
  console.log("Initializing default staff and voice.");
  if (staves.value.length === 0) {
    const defaultStaffId = generateId();
    staves.value.push({
      id: defaultStaffId,
      clef: 'treble',
      order: 0,
      name: 'Staff 1'
    });
    activeStaffId.value = defaultStaffId;
    console.log("Created default staff:", defaultStaffId);
  }

  if (voiceLayers.value.length === 0 && staves.value.length > 0) {
    const staffToUse = activeStaffId.value || staves.value[0].id;
    const defaultVoiceId = generateId();
    voiceLayers.value.push({
      id: defaultVoiceId,
      name: 'Voice 1',
      color: getRandomColor(),
      visible: true,
      active: true,
      selected: true,
      volume: 100, // Default volume as percentage
      notes: [],
      staffId: staffToUse
    });
    activeVoiceId.value = defaultVoiceId;
    console.log("Created default voice:", defaultVoiceId, "on staff:", staffToUse);
  }
  // Ensure activeStaffId is set if staves exist
  if (!activeStaffId.value && staves.value.length > 0) {
      activeStaffId.value = staves.value[0].id;
  }
  // Ensure activeVoiceId is set if voices exist
  if (!activeVoiceId.value && voiceLayers.value.length > 0) {
      activeVoiceId.value = voiceLayers.value[0].id;
      // also update active state for the voice
      const activeV = voiceLayers.value.find(v => v.id === activeVoiceId.value);
      if (activeV) activeV.active = true;
  }
};

// Function to add a new staff
const addNewStaff = () => {
  const newStaffId = generateId();
  const newStaffOrder = staves.value.length;
  staves.value.push({
    id: newStaffId,
    clef: 'treble', // Default to treble
    order: newStaffOrder,
    name: `Staff ${newStaffOrder + 1}`
  });
  activeStaffId.value = newStaffId; // Make the new staff active

  // Add a default voice to the new staff
  const newVoiceId = generateId();
  voiceLayers.value.push({
    id: newVoiceId,
    name: `Voice ${voiceLayers.value.length + 1}`,
    color: getRandomColor(),
    visible: true,
    active: true, // Make this new voice active
    selected: true,
    volume: 100, // Default volume as percentage
    notes: [],
    staffId: newStaffId
  });
  switchActiveVoice(newVoiceId); // This will also set activeStaffId correctly
  console.log(`Added new staff ${newStaffId} and voice ${newVoiceId}`);
};

// Function to remove a staff
const removeStaff = (staffIdToRemove: string) => {
  if (staves.value.length <= 1) {
    alert("Cannot remove the last staff.");
    return;
  }
  if (confirm("Are you sure you want to remove this staff and all its voices/notes? This cannot be undone.")) {
    // Remove voices associated with this staff
    voiceLayers.value = voiceLayers.value.filter(vl => vl.staffId !== staffIdToRemove);
    // Remove the staff
    staves.value = staves.value.filter(s => s.id !== staffIdToRemove);

    // Re-order remaining staves
    staves.value.forEach((s, index) => s.order = index);

    // Update active staff and voice if the removed one was active
    if (activeStaffId.value === staffIdToRemove) {
      activeStaffId.value = staves.value.length > 0 ? staves.value[0].id : null;
    }
    if (activeStaffId.value && !voiceLayers.value.some(vl => vl.staffId === activeStaffId.value && vl.active)) {
        const firstVoiceOnNewActiveStaff = voiceLayers.value.find(vl => vl.staffId === activeStaffId.value);
        if (firstVoiceOnNewActiveStaff) {
            switchActiveVoice(firstVoiceOnNewActiveStaff.id);
        } else if (voiceLayers.value.length > 0) {
            switchActiveVoice(voiceLayers.value[0].id);
        } else {
            activeVoiceId.value = ''; // No voices left
        }
    } else if (voiceLayers.value.length === 0) {
        activeVoiceId.value = '';
    }
    console.log(`Removed staff ${staffIdToRemove}`);
  }
};

// Function to initiate staff name editing
const editStaffName = (stave: Stave) => {
  editingStaffNameId.value = stave.id;
  nextTick(() => {
    // staffNameInput.value is an array because the ref is inside a v-for.
    // We expect only one input to be rendered with this ref at a time due to v-if/v-else.
    if (staffNameInput.value && staffNameInput.value.length > 0) {
      const inputElement = staffNameInput.value[0]; // Access the first (and only expected) element
      if (inputElement && typeof inputElement.focus === 'function') {
        inputElement.focus();
        if (typeof inputElement.select === 'function') {
          inputElement.select();
        }
      } else {
        console.error('Failed to focus/select staff name input: The referenced element is not a valid input or is not focusable.', staffNameInput.value);
      }
    } else {
      console.error('Failed to focus/select staff name input: The ref array is empty or undefined.', staffNameInput.value);
    }
  });
};

// Function to save staff name
const saveStaffName = (stave: Stave, event: Event) => {
  const inputElement = event.target as HTMLInputElement;
  const newName = inputElement.value.trim();

  if (!newName) {
    alert("Staff name cannot be empty.");
    inputElement.value = stave.name || ''; // Revert to old name
    editingStaffNameId.value = null;
    return;
  }

  const isNameTaken = staves.value.some(s => s.id !== stave.id && s.name === newName);
  if (isNameTaken) {
    alert(`The name "${newName}" is already used by another staff. Please choose a unique name.`);
    inputElement.value = stave.name || ''; // Revert to old name
    editingStaffNameId.value = null;
    return;
  }

  stave.name = newName;
  editingStaffNameId.value = null;
  console.log(`Staff ${stave.id} renamed to ${stave.name}`);
  saveToLocalStorage();
};

// Function to cancel staff name editing
const cancelEditStaffName = (stave: Stave, event: Event) => {
  const inputElement = event.target as HTMLInputElement;
  inputElement.value = stave.name || ''; // Revert to old name
  editingStaffNameId.value = null;
};

const handleChangeVoiceVolume = (voiceId: string, newVolume: number) => {
  const voice = voiceLayers.value.find(v => v.id === voiceId);
  if (voice) {
    voice.volume = newVolume;
    // console.log(`Volume for voice ${voiceId} set to ${newVolume} dB`);
    // Optionally save to localStorage if desired on every tweak, or rely on broader save mechanisms
    // saveToLocalStorage(); 
  }
};

// Initialize Debug Composable
// Pass the 'notes' computed property (or the ref it depends on)
// existing code...

const toggleStaffCollapse = (stave: Stave) => {
  stave.isCollapsed = !stave.isCollapsed;
  saveToLocalStorage(); // Save the change
};

// ... existing code ...
</script>

<style scoped src="@/assets/styles/global.css" />

<style scoped>
/* Remove or comment out the previous .show-help-btn styles if they were added here */
/*
.show-help-btn {
  display: block;
  margin: 10px auto;
  padding: 10px 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  text-align: center;
}

.show-help-btn:hover {
  background-color: #0056b3;
}
*/

.floating-help-btn {
  position: fixed;
  /* Or absolute if .notation-editor is the main scroll container and has position: relative */
  top: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  background-color: #2196F3;
  /* Material Blue or your theme color */
  color: white;
  border-radius: 50%;
  /* Makes it circular */
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  /* Adjust for question mark size */
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  z-index: 999;
  /* Ensure it's above other content */
  transition: background-color 0.3s ease, transform 0.2s ease-out;
}

.floating-help-btn:hover {
  background-color: #1976D2;
  /* Darker shade on hover */
  transform: scale(1.05);
  /* Slight scale effect on hover */
}

/* Adjustments for smaller screens if needed */
@media (max-width: 768px) {
  .floating-help-btn {
    top: 15px;
    right: 15px;
    width: 45px;
    height: 45px;
    font-size: 20px;
  }
}

@media (max-width: 480px) {
  .floating-help-btn {
    top: 10px;
    right: 10px;
    width: 40px;
    height: 40px;
    font-size: 18px;
  }
}

/* Add this to the style section */
.section-markers {
  position: relative;
  z-index: 5;
}

.section-marker {
  position: absolute;
  padding: 3px 6px;
  background-color: rgba(156, 39, 176, 0.8);
  color: white;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  z-index: 10;
  pointer-events: none;
}

.section-start {
  transform: translateX(-100%);
}

.section-end {
  transform: translateX(0);
}

.section-background {
  position: absolute;
  top: 0;
  height: 100%;
  background-color: #9C27B0;
  opacity: 0.1;
  pointer-events: none;
  z-index: 1;
}

.playing-section .section-marker {
  background-color: #f44336;
  animation: pulse 1s infinite alternate;
}

.playing-section .section-background {
  background-color: rgba(244, 67, 54, 0.2);
  opacity: 0.3 !important;
}

@keyframes pulse {
  from {
    opacity: 0.8;
  }
  to {
    opacity: 1;
  }
}

/* Add this to your CSS */
.section-markers-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* Allow clicks to pass through to the staff */
  z-index: 5; /* Above staff lines but below notes */
}

.staff-name-input {
  font-weight: bold;
  flex-grow: 1;
  padding: 2px 5px;
  border: 1px solid #ccc;
  border-radius: 3px;
  font-size: inherit; /* Inherit font size from parent */
}

.staff-name[title="Click to rename staff"] {
  cursor: pointer;
  border-bottom: 1px dashed #ccc; /* Indicate it's clickable */
}

.staff-header-controls select {
  padding: 5px;
  border-radius: 4px;
  border: 1px solid #ccc;
}

.collapse-staff-btn {
  padding: 5px 10px;
  background-color: #607d8b; /* Blue Grey */
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
}
.collapse-staff-btn:hover {
  background-color: #546e7a;
}

.remove-staff-btn {
  padding: 5px 10px;
  background-color: #f44336;
}
</style>