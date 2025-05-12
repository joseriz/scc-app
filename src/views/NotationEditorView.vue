<template>
  <!-- Add responsive meta tag -->
  <div class="notation-editor">
    <AppHeader v-model:selectedClef="selectedClef" v-model:keySignature="keySignature"
      v-model:timeSignature="timeSignature" @clefChange="handleClefChange"
      @keySignatureChange="changeKeySignatureDirectly" @timeSignatureChange="updateTimeSignature" />

    <!-- Floating Help Button -->
    <div @click="showHelp = true" class="floating-help-btn">
      ?
    </div>

    <TempoControl v-model="tempo" />

    <!-- Replace the existing staff-container with this new staves-container structure -->
    <div class="staves-container">
      <div v-for="staff in staves" :key="staff.id" class="staff-wrapper">
        <div class="staff-header">
          <div class="staff-title">{{ staff.name }}</div>
          <div class="staff-actions">
            <button 
              class="staff-action-btn"
              @click="changeStaffClef(staff.id, staff.clef === 'treble' ? 'bass' : 'treble')"
            >
              {{ staff.clef === 'treble' ? 'Switch to Bass Clef' : 'Switch to Treble Clef' }}
            </button>
            <button 
              v-if="staves.length > 1"
              class="staff-action-btn remove"
              @click="removeStaff(staff.id)"
            >
              Remove
            </button>
          </div>
        </div>
        
        <!-- Staff connections if needed -->
        <div v-if="staves.length > 1 && staves.indexOf(staff) < staves.length - 1" class="staff-connector staff-connector-bottom"></div>
        <div v-if="staves.length > 1 && staves.indexOf(staff) > 0" class="staff-connector staff-connector-top"></div>
        
        <!-- Staff container (similar to original but with staff-specific data) -->
        <div class="staff-container-multi" :style="{ minHeight: staffContainerMinHeight }">
      <div class="clef">
            <img v-if="staff.clef === 'treble'" src="@/assets/treble-clef.svg" alt="Treble Clef" />
            <img v-else-if="staff.clef === 'bass'" src="@/assets/bass-clef.svg" alt="Bass Clef" />
      </div>

      <!-- Key Signature -->
      <div class="key-signature">
            <div v-for="(accidental, index) in currentKeySignatureAccidentals" :key="`key-sig-${staff.id}-${index}`"
          class="key-signature-accidental" :style="{
                top: `${getKeySignaturePosition(accidental, staff.clef)}px`,
                left: `${15 + (index * 8)}px`
          }">
          {{ getAccidentalSymbolForKeySignature(accidental) }}
        </div>
      </div>

          <!-- Time signature -->
      <div class="time-signature-display"
        :style="{ left: `${45 + (currentKeySignatureAccidentals.length * 10) + 5}px` }">
        <div class="time-signature-numerator">{{ timeSignatureNumerator }}</div>
        <div class="time-signature-denominator">{{ timeSignatureDenominator }}</div>
      </div>

      <!-- Scrollable staff -->
      <div class="staff-scroll-container">
            <div class="staff" 
                 @click="handleStaffClick($event, staff.id)" 
                 @mousedown="startDrag($event, staff.id)" 
                 @touchstart="startDrag($event, staff.id)" 
                 :data-staff-id="staff.id"
                 :style="{
                   width: `${getStaffWidth(staff.id)}px`,
                   transform: `translateX(-${getStaffScrollPosition(staff.id)}px)`
        }">
          <!-- Staff lines -->
          <div class="staff-lines">
                <div class="staff-line" v-for="i in 5" :key="`line-${staff.id}-${i}`"></div>
          </div>

              <!-- Section markers container -->
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
              <div v-for="(barline, i) in barlinesList" :key="`barline-${staff.id}-${i}`" class="barline" :class="{
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

            <!-- Add measure number (only show if showMeasureNumbers is true) -->
            <div v-if="showMeasureNumbers && barline.measureNumber > 0" class="measure-number">
              {{ barline.measureNumber }}
            </div>
          </div>

          <!-- Beat markers (optional, for visual aid) -->
          <div v-if="showBeatMarkers" v-for="beat in beatPositionsList" :key="`beat-${beat.position}`" class="beat-marker"
            :style="{ left: `${beat.position}px` }">
          </div>

          <!-- Notes container -->
          <div class="notes-container">
                <!-- Get notes specifically for this staff -->
                <template v-for="note in getNotesForStaff(staff.id)" :key="`ledger-${note.id}`">
              <!-- Ledger lines for notes above the staff -->
              <div v-if="needsLedgerLines(note, 'above')" class="ledger-lines-container above" :style="{
                left: `${note.position * 50 - 10}px`
              }">
                <div v-for="linePos in getLedgerLines(note, 'above')" :key="`above-${note.id}-${linePos}`"
                  class="ledger-line" :style="{
                    top: `${linePos}px`,
                    width: '20px'
                  }">
                </div>
              </div>

              <!-- Ledger lines for notes below the staff -->
              <div v-if="needsLedgerLines(note, 'below')" class="ledger-lines-container below" :style="{
                left: `${note.position * 50 - 10}px`
              }">
                <div v-for="linePos in getLedgerLines(note, 'below')" :key="`below-${note.id}-${linePos}`"
                  class="ledger-line" :style="{
                    top: `${linePos}px`,
                    width: '20px'
                  }">
                </div>
              </div>
            </template>

            <!-- Notes -->
                <div v-for="note in getNotesForStaff(staff.id)" :key="note.id" class="note" :class="{
              'rest': note.type === 'rest',
                  'playing': isNotePlaying(note.id),
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
            }" :style="{
                  ...getNoteStyle(note),
                  borderColor: note.voiceColor || 'black'
                }" :data-duration="note.duration" :data-voice="note.voiceId" @contextmenu.prevent="removeNote(note)"
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
                  :class="[getStemDirection(note.pitch || ''), note.duration]">
                </div>

                <!-- Flag for eighth and sixteenth notes -->
                <div v-if="['eighth', 'sixteenth'].includes(note.duration)" class="flag"
                  :class="[getStemDirection(note.pitch || ''), note.duration]">
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

            <!-- Chord symbols -->
                <div v-for="chord in chordSymbols.filter(c => isChordInStaffRange(c, staff.id))" 
                     :key="`chord-${staff.id}-${chord.id}`" 
                     class="chord-symbol" 
                     :style="{
              left: `${chord.position * 50}px`,
              top: `${chord.top}px`
            }">
              {{ formatChordName(chord.chordName) }}
            </div>

            <!-- ADD Lyric Rendering - Separate loop outside the notes loop -->
                <div v-for="note in getNotesForStaff(staff.id).filter(n => n.lyric)" 
                     :key="`lyric-${note.id}`" 
                     class="lyric"
                     :class="{ 'playing': isNotePlaying(note.id) }"
                     :style="{
                left: `${note.position * 50}px`,
                       top: getLyricVerticalOffset(note.voiceId),
                       color: note.voiceColor || 'black'
              }">
              {{ note.lyric }}
            </div>
          </div>
        </div>
      </div>

      <!-- Scroll controls -->
      <div class="staff-scroll-controls">
            <button @click="scrollStaffById('left', staff.id)" class="scroll-btn left" 
                    :disabled="getStaffScrollPosition(staff.id) === 0">
          ◀
        </button>
            <button @click="extendStaffById(staff.id)" class="extend-btn">
          Extend Staff
        </button>
            <button @click="scrollStaffById('right', staff.id)" class="scroll-btn right" 
                    :disabled="getStaffScrollPosition(staff.id) >= (getStaffWidth(staff.id) - visibleStaffWidth)">
          ▶
        </button>
          </div>
      </div>
      </div>
      
      <!-- Button to add a new staff -->
      <button @click="addStaff" class="add-staff-button">
        Add Staff
      </button>
    </div>

    <PlaybackControls :is-playing="isPlaying" :is-paused="isPaused" @toggle-playback="togglePlayback"
      @stop-playback="stopPlayback" @clear-or-restart="handleClearOrRestart" />

    <PlaybackSettings v-model:playbackStartMeasure="playbackStartMeasure"
      v-model:playbackEndMeasure="playbackEndMeasure" :maxMeasures="barlinesList.length"
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
      :selectedOctave="selectedOctave" :notesForDebug="notes" :needsLedgerLines="needsLedgerLines"
      :getLedgerLines="getLedgerLines" @toggleShowNotePositions="showNotePositions = !showNotePositions"
      @testAllNotes="testAllNotes" />

    <div v-if="activeTab === 'saved'">
      <SavedCompositionsPanel
        :savedCompositions="savedCompositions"
        :compositionName="compositionName"
        :currentCompositionId="currentCompositionId"
        :exportOnlySelectedVoices="exportOnlySelectedVoices"
        @update:compositionName="compositionName = $event"
        @saveComposition="saveComposition"
        @loadComposition="loadComposition"
        @updateComposition="updateComposition"
        @saveRename="saveRename"
        @deleteComposition="deleteComposition"
        @exportAllCompositions="exportAllCompositions"
        @exportCurrentComposition="exportCurrentComposition"
        @importCompositions="importCompositions"
        @update:exportOnlySelectedVoices="exportOnlySelectedVoices = $event"
        @combineCompositions="combineCompositions"
      />
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

    <VoiceLayersPanel :voiceLayers="voiceLayers" v-model:playSelectedVoicesOnly="playSelectedVoicesOnly"
      @renameVoice="renameVoice" @changeVoiceColor="changeVoiceColor" @switchActiveVoice="switchActiveVoice"
      @toggleVoiceVisibility="toggleVoiceVisibility" @updateVoiceSelection="updateVoiceLayerSelection"
      @confirmDeleteVoice="confirmDeleteVoice" @addVoiceLayer="addVoiceLayer" />
    
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
  SequenceItem
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
const currentPlayingNoteIds = ref<string[]>([]);
const selectedClef = ref('treble');
const exportOnlySelectedVoices = ref(false); // New ref for export option

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
const voiceLayers = ref<VoiceLayer[]>([ // Explicitly type voiceLayers
  {
    id: 'voice1',
    name: 'Voice 1',
    color: getRandomColor(), // Use random color for the first voice
    visible: true,
    active: true,
    selected: true,
    volume: 0,
    notes: []
  }
]);

// Track the currently active voice layer
const activeVoiceId = ref('voice1'); // Still defaults to the first voice

// Get the active voice layer
const activeVoice = computed<VoiceLayer>(() => { // Explicitly type activeVoice
  const foundVoice = voiceLayers.value.find(layer => layer.id === activeVoiceId.value);

  // If the active voice ID doesn't exist in the voices, return the first voice
  // If there are no voices at all, create a default voice to prevent errors
  if (foundVoice) {
    return foundVoice;
  } else if (voiceLayers.value.length > 0) {
    // Set activeVoiceId to the first available voice
    activeVoiceId.value = voiceLayers.value[0].id;
    return voiceLayers.value[0];
  } else {
    // Create a default voice if no voices exist
    const defaultVoice: VoiceLayer = {
      id: 'voice1',
      name: 'Voice 1',
      color: getRandomColor(),
      visible: true,
      active: true,
      selected: true,
      volume: 0,
      notes: []
    };

    // Add the default voice to the voice layers
    voiceLayers.value.push(defaultVoice);
    activeVoiceId.value = 'voice1';
    return defaultVoice;
  }
});

// Update computed property to correctly set voice colors
const allVisibleNotes = computed((): NoteWithVoiceInfo[] => { // Specify return type
  // Get all notes from visible voices
  let allNotes: NoteWithVoiceInfo[] = [];

  voiceLayers.value.forEach(voice => {
    if (voice.visible) {
      // Add voice information to each note
      const notesWithVoiceInfo = voice.notes.map(note => ({
        ...note,
        voiceId: voice.id,
        voiceColor: voice.color
      })) as NoteWithVoiceInfo[]; // Ensure this maps to NoteWithVoiceInfo

      allNotes = [...allNotes, ...notesWithVoiceInfo];
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
  notes?: ImportedNote[]; // Use aliased import
  voiceLayers?: VoiceLayer[];
  tempo: number;
  clef: string;
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
    loadSavedCompositions();
    
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
  'C': []
};

// Get the current key signature accidentals
const currentKeySignatureAccidentals = computed(() => {
  return keySignatures[keySignature.value] || [];
});

// Function to change the key signature
const changeKeySignature = (key: string) => {
  keySignature.value = key;
};

// Function to get the position of a key signature accidental on the staff
const getKeySignaturePosition = (accidental: string, clef: string) => {
  // Remove the accidental symbol to get the base note
  const note = accidental.charAt(0);

  // Staff-specific positions
  if (clef === 'treble') {
    const positions = {
    'F': 145, // F4 line
    'C': 115, // C5 line
    'G': 137.5, // G4 space
    'D': 160, // D4 line
    'A': 130, // A4 line
    'E': 152.5, // E4 space
    'B': 122.5, // B4 space
  };
  return positions[note] || 0;
  } else { // Bass clef
    const positions = {
      'F': 167.5, // F2 line
      'C': 137.5, // C3 line
      'G': 160, // G2 line
      'D': 130, // D3 line
      'A': 152.5, // A2 space
      'E': 122.5, // E3 space
      'B': 145, // B2 line
    };
    return positions[note] || 0;
  }
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
const getPitchPosition = (pitch: string) => {
  // Map pitches to vertical positions (in pixels)
  const octave = parseInt(pitch.slice(-1));
  const note = pitch.slice(0, -1).replace(/[#b]/, ''); // Remove accidentals

  if (selectedClef.value === 'treble') {
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
const playNoteSound = async (pitch, duration = "8n", isDotted = false, volumeDb = 0, explicitNatural = false) => {
  let pitchToPlay = pitch;
  let noteDuration = duration;

  try {
    // Start Tone.js context (this requires user interaction)
    await startToneJs();

    // Make sure Tone.js is started
    await Tone.start();

    // Update the playNoteSound function's handling of explicitNatural
    if (explicitNatural) {
      // The pitch *should* already be natural if explicitNatural is true.
      // This block is more of a safeguard or for clarity.
      const noteLetter = pitch.charAt(0);
      const octave = pitch.slice(pitch.length - 1);
      pitchToPlay = `${noteLetter}${octave}`;
      // console.log(`Playing explicitly natural note: ${pitchToPlay} (original pitch: ${pitch})`);
    } else {
      // If not explicitly natural, apply key signature if the pitch doesn't already have an accidental
      if (!pitchToPlay.includes('#') && !pitchToPlay.includes('b')) {
        pitchToPlay = getModifiedPitchForKeySignature(pitchToPlay, false); // explicitNatural is false here
      }
    }

    // Calculate the actual duration in seconds first for reliability
    const baseDurationMap = {
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

    // Ensure duration is a positive number
    if (durationInSeconds <= 0) {
      console.warn(`Calculated invalid duration (${durationInSeconds}s), defaulting to 0.5s`);
      durationInSeconds = 0.5;
    }

    // Convert seconds to Tone.js compatible time string
    noteDuration = `${durationInSeconds}s`;

    // Ensure pitch is valid
    if (!pitchToPlay) {
      console.warn("Invalid pitch provided, cannot play note.");
      return;
    }

    // Convert volume from dB to linear gain (0dB = 1.0)
    const volumeGain = Math.pow(10, volumeDb / 20);

    // Use the piano synth to play the note if available, otherwise use basic synth
    if (pianoSynth && pianoSynth.loaded) {
      // Set volume for this note
      pianoSynth.volume.value = volumeDb;
      pianoSynth.triggerAttackRelease(pitchToPlay, noteDuration);
    } else if (noteSynth) {
      // Set volume for this note
      noteSynth.volume.value = volumeDb;
      noteSynth.triggerAttackRelease(pitchToPlay, noteDuration);
    } else {
      console.warn("No synthesizer available to play notes");
    }
  } catch (error) {
    console.error(`Error playing note (${pitchToPlay}, ${noteDuration}):`, error);
    // Try fallback to basic synth
    if (noteSynth) {
      try {
        const safePitch = pitchToPlay || 'C4';
        const safeDuration = noteDuration || '0.5s';
        noteSynth.volume.value = volumeDb;
        noteSynth.triggerAttackRelease(safePitch, safeDuration);
      } catch (fallbackError) {
        console.error("Fallback synth also failed:", fallbackError);
      }
    }
  }
};

// Ensure playComposition uses the correct duration mapping for playNoteSound
const playComposition = () => {
  // Call the playScore function which respects measure boundaries
  playScore();
};

// Update the existing handleStaffClick function to handle explicit natural accidentals
const handleStaffClick = (event, staffId) => {
  // If we were dragging, don't add a note
  if (isDragging.value) {
    return;
  }

  // Get the click position relative to the staff
  const staffRect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const x = event.clientX - staffRect.left;
  const y = event.clientY - staffRect.top;

  console.log(`Staff click at x=${x}, y=${y} on staff ${staffId}`);

  // Calculate the position in the staff (horizontal)
  const position = Math.floor(x / 50) + 0.5; // Center the note in the grid

  // Find the staff object
  const staff = staves.value.find(s => s.id === staffId);
  if (!staff) return;

  // First, ensure active voice is assigned to the current staff
  if (!staff.voiceLayerIds.includes(activeVoiceId.value)) {
    assignVoiceToStaff(activeVoiceId.value, staffId);
  }

  // Get the active voice's notes (this must happen AFTER potentially assigning to staff)
  const activeNotes = activeVoice.value.notes;

  // Calculate the vertical position to determine the pitch
  const verticalPosition = Math.round((y - 100) / 7.5) * 7.5 + 100;

  // Map the vertical position to a pitch using the staff's clef
  const pitch = mapPositionToPitch(verticalPosition, staff.clef);

  // Check if there's already a note at this position in the active voice
  const existingNoteIndex = activeNotes.findIndex(note =>
    Math.abs(note.position - position) < 0.1 // Allow for small rounding differences
  );

  if (existingNoteIndex !== -1) {
    // Only update if we have a valid pitch or it's a rest
    if (pitch || selectedNoteType.value === 'rest') {
      // Create the updated note
      const updatedNote = {
        ...activeNotes[existingNoteIndex],
        type: selectedNoteType.value as "note" | "rest",
        verticalPosition,
        duration: selectedDuration.value,
        dotted: isDottedNote.value,
        pitch: selectedNoteType.value === 'note' ?
          applyAccidental(pitch || 'C4', selectedAccidental.value) : undefined,
        explicitNatural: selectedNoteType.value === 'note' && selectedAccidental.value === 'natural' ? true : undefined
      };

      // Replace the note in the array
      activeVoice.value.notes.splice(existingNoteIndex, 1, updatedNote);

      // Play the note sound with correct duration
      if (selectedNoteType.value === 'note' && pitch) {
        const durationMap = {
          'whole': '1n',
          'half': '2n',
          'quarter': '4n',
          'eighth': '8n',
          'sixteenth': '16n'
        };
        playNoteSound(
          updatedNote.pitch || '', 
          durationMap[updatedNote.duration], 
          updatedNote.dotted,
          0, // volumeDb
          updatedNote.explicitNatural  // Add this parameter
        );
      }

      console.log(`Updated note in voice ${activeVoiceId.value} at position ${position}, pitch: ${updatedNote.pitch || 'rest'}, dotted: ${updatedNote.dotted}`);
    }
  } else {
    // If no existing note, add a new one
  // Only add a note if we have a valid pitch or it's a rest
  if (pitch || selectedNoteType.value === 'rest') {
    // Create a new note
    const newNote = {
      id: Date.now().toString(),
      type: selectedNoteType.value as "note" | "rest",
      position,
      verticalPosition,
      duration: selectedDuration.value,
      dotted: isDottedNote.value,
      pitch: selectedNoteType.value === 'note' ?
        applyAccidental(pitch || 'C4', selectedAccidental.value) : undefined,
      explicitNatural: selectedNoteType.value === 'note' && selectedAccidental.value === 'natural' ? true : undefined
    };

    // Add the note to the active voice
    activeVoice.value.notes.push(newNote);

    // Play the note sound with correct duration
    if (selectedNoteType.value === 'note' && pitch) {
      const durationMap = {
        'whole': '1n',
        'half': '2n',
        'quarter': '4n',
        'eighth': '8n',
        'sixteenth': '16n'
      };
      playNoteSound(newNote.pitch || '', durationMap[newNote.duration], newNote.dotted, 0, newNote.explicitNatural);
    }

    console.log(`Added ${selectedNoteType.value} to voice ${activeVoiceId.value} at position ${position}, pitch: ${newNote.pitch || 'rest'}, dotted: ${newNote.dotted}`);
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
const getStemDirection = (pitch: string) => {
  if (!pitch) return 'up';

  // Get the base note without accidentals
  const octave = parseInt(pitch.slice(-1));
  const note = pitch.slice(0, -1).replace(/[#b]/, '');

  if (selectedClef.value === 'treble') {
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
const getNoteSymbol = (note: ImportedNote) => {
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
const getNoteStyle = (note: NoteWithVoiceInfo) => { // Use NoteWithVoiceInfo and define return type
  // Base position calculations
  const style: {
    left: string;
    top: string;
    color: string;
    borderColor?: string; // Ensure borderColor is allowed and is a string
  } = {
    left: `${note.position * 50}px`,
    top: `${note.verticalPosition}px`,
    color: note.voiceColor || 'black', // This sets the text/SVG color
  };

  // For notes (not rests), set the border color but NOT the background color
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
// const stopPlayback = () => {
//   isPlaying.value = false;
//   isPaused.value = false;
  
//   // Clear timeouts
//   if (window.playbackTimeouts) {
//     window.playbackTimeouts.forEach(id => clearTimeout(id));
//     window.playbackTimeouts = [];
//   }
  
//   // Clear playing notes highlighting
//   currentPlayingNoteIds.value = [];
  
//   console.log('Playback stopped');
// };

// Update the clearScore function to handle voice layers
const clearScore = () => {
  // First stop any playback
  stopPlayback();

  // Clear all notes from all voices, but maintain the voice structure
  voiceLayers.value.forEach(voice => {
    voice.notes = [];
  });

  // Ensure that at least one voice exists and is active
  if (voiceLayers.value.length === 0) {
    // Re-create the default voice
    voiceLayers.value.push({
      id: 'voice1',
      name: 'Voice 1',
      color: getRandomColor(),
      visible: true,
      active: true,
      selected: true,
      volume: 0,
      notes: []
    });
    activeVoiceId.value = 'voice1';
  } else {
    // Make sure activeVoiceId points to an existing voice
    if (!voiceLayers.value.some(v => v.id === activeVoiceId.value)) {
      activeVoiceId.value = voiceLayers.value[0].id;
    }
  }

  // Reset scroll position
  scrollPosition.value = 0;
  updateStaffScroll();

  // Reset playback range to default
  playbackStartMeasure.value = 1;
  playbackEndMeasure.value = 0;

  console.log('Score cleared for all voices');
};

// Add these functions to handle ledger lines
const needsLedgerLines = (note, position) => {
  if (note.type !== 'note') return false;

  // Get the vertical position
  const verticalPos = note.verticalPosition;

  if (selectedClef.value === 'treble') {
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

const getLedgerLines = (note, position) => {
  if (!needsLedgerLines(note, position)) return [];

  const verticalPos = note.verticalPosition;
  const lines = [];

  if (selectedClef.value === 'treble') {
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
// const extendStaff = () => {
//   // Add 4 more measures
//   measuresCount.value += 4;

//   // Log for debugging
//   console.log(`Extended staff: ${measuresCount.value} measures, width: ${staffWidth.value}px`);

//   // Force a re-render of the staff lines
//   nextTick(() => {
//     const staffElement = document.querySelector('.staff');
//     if (staffElement) {
//       (staffElement as HTMLElement).style.width = `${staffWidth.value}px`;

//       // Make sure staff lines extend across the full width
//       const staffLines = document.querySelectorAll('.staff-line');
//       staffLines.forEach(line => {
//         (line as HTMLElement).style.width = `${staffWidth.value}px`;
//       });
//     }
//   });
// };

// Function to handle staff scrolling
// const scrollStaff = (direction: 'left' | 'right') => {
//   const scrollAmount = 200; // Amount to scroll in pixels

//   if (direction === 'left') {
//     // Scroll left (decrease position)
//     scrollPosition.value = Math.max(0, scrollPosition.value - scrollAmount);
//   } else {
//     // Scroll right (increase position)
//     scrollPosition.value = Math.min(maxScrollPosition.value, scrollPosition.value + scrollAmount);
//   }

//   // Apply the scroll position directly to the staff element
//   const staffElement = document.querySelector('.staff');
//   if (staffElement) {
//     (staffElement as HTMLElement).style.transform = `translateX(-${scrollPosition.value}px)`;
//   }

//   console.log(`Scrolled ${direction}: position=${scrollPosition.value}, max=${maxScrollPosition.value}`);
// };

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
const handleClefChange = () => {
  // Clear the score when changing clefs to avoid confusion
  if (notes.value.length > 0) {
    if (confirm('Changing clef will clear the current score. Continue?')) {
      clearScore();
    } else {
      // Revert selection if user cancels
      selectedClef.value = selectedClef.value === 'treble' ? 'bass' : 'treble';
      return;
    }
  }
};

// Add a new ref for the active tab
const activeTab = ref('notes');

// Add these variables for drag scrolling
const isDragging = ref(false);
const dragStartX = ref(0);
const dragStartScrollPosition = ref(0);

// Add these functions to handle drag scrolling
// const startDrag = (event, staffId) => {
//   // Only start dragging if it's not a click on a note
//   if (event.target.closest('.note') || event.target.closest('.chord-symbol')) {
//     return;
//   }

//   // Store the initial position for drag detection
//   const startX = event.touches ? event.touches[0].clientX : event.clientX;
//   const startY = event.touches ? event.touches[0].clientY : event.clientY;
//   const startTime = Date.now();
  
//   // Store the staff ID for the drag operation
//   const dragStaffId = staffId;

//   // Prevent default to avoid text selection during drag
//   event.preventDefault();

//   // Get the starting position for scroll calculation
//   const clientX = event.touches ? event.touches[0].clientX : event.clientX;
//   dragStartX.value = clientX;
  
//   // Get the staff-specific scroll position
//   const settings = initializeStaffSettings(dragStaffId);
//   dragStartScrollPosition.value = settings.scrollPosition;

//   // Create a flag to track if we've moved enough to consider it a drag
//   let hasDragged = false;

//   // Define the move handler with drag detection
//   const moveHandler = (moveEvent) => {
//     // Get current position
//     const currentX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
//     const currentY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;

//     // Calculate distance moved
//     const distanceX = Math.abs(currentX - startX);
//     const distanceY = Math.abs(currentY - startY);
//     const totalDistance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

//     // Only consider it a drag if moved more than 15px
//     if (totalDistance > 15) {
//       if (!hasDragged) {
//         hasDragged = true;
//         isDragging.value = true;
//       }

//       // Now handle the drag
//       moveEvent.preventDefault();

//       // Calculate the distance moved for scrolling
//       const deltaX = dragStartX.value - currentX;

//       // Update the scroll position for this specific staff
//       const settings = initializeStaffSettings(dragStaffId);
//       const newScrollPosition = Math.max(
//         0, 
//         Math.min(
//           calculateMaxScrollPosition(settings.width), 
//           dragStartScrollPosition.value + deltaX
//         )
//       );
//       settings.scrollPosition = newScrollPosition;

//       // Update the staff transform
//       const staffElement = document.querySelector(`.staff[data-staff-id="${dragStaffId}"]`);
//       if (staffElement) {
//         (staffElement as HTMLElement).style.transform = `translateX(-${settings.scrollPosition}px)`;
//       }
//     }
//   };

//   // Define the end handler
//   const endHandler = (endEvent) => {
//     // Calculate the time elapsed
//     const endTime = Date.now();
//     const timeElapsed = endTime - startTime;

//     // If it was a quick tap and didn't move much, treat as a click
//     if (timeElapsed < 300 && !hasDragged) {
//       isDragging.value = false;

//       // For touch events, trigger a synthetic click
//       if (endEvent.type === 'touchend') {
//         const clickEvent = new MouseEvent('click', {
//           clientX: startX,
//           clientY: startY,
//           bubbles: true,
//           cancelable: true,
//           view: window
//         });
//         endEvent.target.dispatchEvent(clickEvent);
//       }
//     } else if (hasDragged) {
//       // Reset after a short delay
//       setTimeout(() => {
//         isDragging.value = false;
//       }, 50);
//     } else {
//       isDragging.value = false;
//     }

//     // Remove event listeners
//     document.removeEventListener('mousemove', moveHandler);
//     document.removeEventListener('mouseup', endHandler);
//     document.removeEventListener('touchmove', moveHandler);
//     document.removeEventListener('touchend', endHandler);
//   };

//   // Add event listeners
//   if (event.type === 'mousedown') {
//     document.addEventListener('mousemove', moveHandler);
//     document.addEventListener('mouseup', endHandler);
//   } else if (event.type === 'touchstart') {
//     document.addEventListener('touchmove', moveHandler, { passive: false });
//     document.addEventListener('touchend', endHandler);
//   }
// };

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
});

// Add the mapPositionToPitch function
const mapPositionToPitch = (verticalPosition: number, clef: string): string | null => {
  // Define positions based on clef
  const positions = {};

  if (clef === 'treble') {
    // Treble clef positions (same as before)
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
    // Bass clef positions (same as before)
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
  if (!pitch) return '';

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
const removeNote = (note) => {
  // If the note has a voiceId property, it's from allVisibleNotes
  if ((note as NoteWithVoiceInfo).voiceId) { // Cast to NoteWithVoiceInfo to access voiceId
    const voiceIndex = voiceLayers.value.findIndex(v => v.id === (note as NoteWithVoiceInfo).voiceId);
    if (voiceIndex !== -1) {
      const noteIndex = voiceLayers.value[voiceIndex].notes.findIndex(n => n.id === note.id);
      if (noteIndex !== -1) {
        voiceLayers.value[voiceIndex].notes.splice(noteIndex, 1);
      }
    }
  } else {
    // Otherwise, it's from the active voice
    const noteIndex = activeVoice.value.notes.findIndex(n => n.id === note.id);
    if (noteIndex !== -1) {
      activeVoice.value.notes.splice(noteIndex, 1);
    }
  }

  // Clear selected note if it was the one removed
  if (selectedNoteId.value === note.id) {
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
const prepareCompositionData = () => {
  // Calculate the furthest note position to set proper width
  const maxWidth = calculateMaxRequiredWidth();
  
  // Start with basic composition data
  const compositionData = {
    id: currentCompositionId.value,
    name: compositionName.value,
    dateCreated: currentCompositionDateCreated.value || Date.now(),
    dateModified: Date.now(),
    notes: getAllNotes(), // Get all notes from all voices
    timeSignature: timeSignature.value,
    keySignature: keySignature.value,
    tempo: tempo.value,
    chordSymbols: chordSymbols.value,
    lyrics: getLyricsFromNotes(),
    
    // Voice-related data
    voiceLayers: voiceLayers.value,
    
    // Add staff-related data
    staves: staves.value.map(staff => ({
      id: staff.id,
      name: staff.name,
      clef: staff.clef,
      voiceLayerIds: staff.voiceLayerIds
    })),
    
    // Additional data for sections and sequences if available
    sections: sections.value,
    sequenceItems: sequenceItems.value,
    
    // Store global staff settings
    staffSettings: {
      width: globalStaffSettings.value.width,
      scrollPosition: 0 // Don't save scroll position
    }
  };
  
  return compositionData;
};

// Function to collect all notes from all voices for saving
const getAllNotes = () => {
  return voiceLayers.value.flatMap(voice => 
      voice.notes.map(note => ({
        ...note,
      voiceId: voice.id // Ensure each note has its voice ID
    }))
  );
};

// Extract lyrics from notes for better accessibility
const getLyricsFromNotes = () => {
  const lyricsMap = {};
  
  voiceLayers.value.forEach(voice => {
    voice.notes.forEach(note => {
      if (note.lyric && note.lyric.trim()) {
        if (!lyricsMap[voice.id]) {
          lyricsMap[voice.id] = [];
        }
        lyricsMap[voice.id].push({
          text: note.lyric,
          position: note.position,
          noteId: note.id
        });
      }
    });
  });
  
  return lyricsMap;
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
const loadComposition = async (compositionId: string) => { // Make it async for nextTick
  try {
    const composition = savedCompositions.value.find(comp => comp.id === compositionId);
    if (!composition) {
      throw new Error(`Composition with ID ${compositionId} not found`);
    }
    console.log('Loading composition:', composition.name);

    currentCompositionId.value = composition.id;

    // Stop playback and reset relevant parts of the score before loading
    stopPlayback();
    voiceLayers.value.forEach(voice => { voice.notes = []; }); // Clear notes from existing layers
    chordSymbols.value = [];
    sections.value = [];
    sequenceItems.value = [];
    scrollPosition.value = 0; // Reset scroll position

    // 1. Load essential musical parameters first
    selectedClef.value = composition.clef || 'treble';
    keySignature.value = composition.keySignature || 'C';
    timeSignature.value = composition.timeSignature || '4/4'; // CRITICAL: Load this early
    tempo.value = composition.tempo || 120;

    // 2. Wait for Vue to update computed properties dependent on the above
    // This ensures measureWidthByTimeSignature is correct for subsequent calculations.
    await nextTick();

    // 3. Load structural data (voices, notes, chords)
    // Load chord symbols
    if (composition.chordSymbols && Array.isArray(composition.chordSymbols)) {
      chordSymbols.value = composition.chordSymbols.map(chord => ({ ...chord }));
    } else {
      chordSymbols.value = [];
    }

    // Load voice layers and notes
    if (composition.voiceLayers && Array.isArray(composition.voiceLayers) && composition.voiceLayers.length > 0) {
      voiceLayers.value = composition.voiceLayers.map(voice => ({
        ...voice,
        // Ensure notes array exists and map notes
        notes: (voice.notes || []).map(note => ({
          ...note,
          explicitNatural: !!note.explicitNatural
        }))
      }));
    } else {
      // Fallback for older compositions or if voiceLayers is missing but top-level notes exist
      const defaultVoiceId = 'voice1';
      voiceLayers.value = [{
        id: defaultVoiceId,
        name: 'Voice 1',
        color: getRandomColor(),
        visible: true,
        active: true,
        selected: true,
        volume: 0,
        notes: (composition.notes && Array.isArray(composition.notes))
          ? composition.notes.map(note => ({ ...note, explicitNatural: !!note.explicitNatural }))
          : []
      }];
      activeVoiceId.value = defaultVoiceId;
    }

    // Ensure at least one voice layer exists and one is active
    if (voiceLayers.value.length === 0) {
        const defaultVoiceId = 'voice1_fallback'; // Use a distinct ID if creating a fallback
        voiceLayers.value.push({
            id: defaultVoiceId,
            name: 'Voice 1 (Fallback)',
            color: getRandomColor(),
            visible: true,
            active: true,
            selected: true,
            volume: 0,
            notes: []
        });
        activeVoiceId.value = defaultVoiceId;
    } else {
        // Determine active voice: use loaded one, or first one if loaded is invalid
        const targetActiveVoiceId = composition.activeVoiceId || voiceLayers.value[0].id;
        const activeVoiceExists = voiceLayers.value.some(v => v.id === targetActiveVoiceId);
        activeVoiceId.value = activeVoiceExists ? targetActiveVoiceId : voiceLayers.value[0].id;
        voiceLayers.value.forEach(v => v.active = v.id === activeVoiceId.value);
    }

    // Correct explicit natural pitches after notes are loaded
    let naturalNotesCorrectedCount = 0;
    voiceLayers.value.forEach(voice => {
      voice.notes.forEach(note => {
        if (note.explicitNatural && note.pitch) {
          const noteLetter = note.pitch.charAt(0);
          const octave = note.pitch.slice(note.pitch.length - 1); // Correctly get last char for octave
          const naturalPitch = `${noteLetter}${octave}`;
          if (note.pitch !== naturalPitch) {
            note.pitch = naturalPitch;
            naturalNotesCorrectedCount++;
          }
        }
      });
    });
    if (naturalNotesCorrectedCount > 0) {
      console.log(`Corrected ${naturalNotesCorrectedCount} natural note pitches during load.`);
    }

    // 4. Calculate staff width directly based on rightmost note position
    const allNotesInLoadedComposition: ImportedNote[] = voiceLayers.value.flatMap(voice => voice.notes);
    
    // Log key measurements for debugging
    console.log(`Current measureWidthByTimeSignature: ${measureWidthByTimeSignature.value}px`);
    
    if (allNotesInLoadedComposition.length > 0) {
        // Find the rightmost note position
        let maxPosition = -1;
        let rightmostNote: ImportedNote | null = null;
        
        allNotesInLoadedComposition.forEach(note => {
            if (note.position > maxPosition) {
                maxPosition = note.position;
                rightmostNote = note;
            }
        });
        
        if (rightmostNote) {
            console.log(`Composition from storage had staffWidth: ${composition.staffWidth || 'undefined'}`);
            
            // Set a truly massive staff width to ensure it's enough for any composition
            const absoluteWidth = 10000; // 10,000 pixels should be plenty for any composition
            
            // Set the reactive values
            staffWidth.value = absoluteWidth;
            
            // Log what we're doing
            console.log(`Setting staff to MASSIVE width: ${absoluteWidth}px`);
            
            // Log the staffWidth value after setting it
            console.log(`Immediately after setting - staffWidth.value: ${staffWidth.value}`);
            
            // Directly modify the DOM for the staff element before any computed properties run
            const staffElement = document.querySelector('.staff');
            if (staffElement) {
                (staffElement as HTMLElement).style.width = `${absoluteWidth}px`;
                console.log(`Directly set staff element width to ${absoluteWidth}px`);
            } else {
                console.warn('Staff element not found for direct width setting');
            }
            
            // Wait for Vue to process updates
            await nextTick();
            
            // Double check and fix again if needed
            setTimeout(() => {
                // Check what happened
                const staffEl = document.querySelector('.staff');
                const currentWidth = staffEl ? (staffEl as HTMLElement).clientWidth : 'unknown';
                console.log(`After timeout - staffWidth.value: ${staffWidth.value}, actual DOM width: ${currentWidth}px`);
                
                // Force it again if needed
                if (staffEl && (staffEl as HTMLElement).clientWidth < 7000) {
                    console.warn('Staff width still not properly set, forcing again...');
                    (staffEl as HTMLElement).style.width = `${absoluteWidth}px`;
                    
                    // Count how many measure bars are actually rendered
                    const barlineElements = document.querySelectorAll('.barline');
                    console.log(`Number of barlines rendered: ${barlineElements.length}`);
                }
            }, 300);
        } else {
            // Fallback - if no rightmost note was found
            const calculatedStaffWidth = 8 * measureWidthByTimeSignature.value + 100; // 8 measures + extra space
            staffWidth.value = calculatedStaffWidth;
            measuresCount.value = 8;
            
            console.log(`No rightmost note found. Using default width: ${calculatedStaffWidth}px`);
        }
    } else {
        // No notes in the composition - default to 8 measures
        const calculatedStaffWidth = 8 * measureWidthByTimeSignature.value + 100;
        staffWidth.value = calculatedStaffWidth;
        measuresCount.value = 8;
        
        console.log(`No notes in composition. Using default width: ${calculatedStaffWidth}px`);
    }

    // 6. Ensure DOM updates for staff width and scroll (moved from end of function to here)
    await nextTick(); // Wait for Vue to process the direct staffWidth assignment
    
    // Force update the DOM with explicit width
    updateStaffDisplay(staffWidth.value); // Pass explicit width to ensure it's used
    
    // Double-check staffWidth is being applied (sometimes DOM updates can lag)
    setTimeout(() => {
        updateStaffDisplay(staffWidth.value); // Apply again after a short delay
        updateStaffScroll(); // Make sure scroll position is applied too
    }, 100);

    // 5. Load other UI state properties
    selectedDuration.value = composition.selectedDuration || 'quarter';
    selectedNoteType.value = composition.selectedNoteType || 'note';
    selectedAccidental.value = composition.selectedAccidental !== undefined ? composition.selectedAccidental : null;
    selectedOctave.value = composition.selectedOctave || 4;
    isDottedNote.value = composition.isDottedNote || false;
    // activeVoiceId is already set based on loaded data or fallback

    // 7. Load sections and sequence items (can depend on measure count for validation if any)
    if (composition.sections && Array.isArray(composition.sections)) {
      sections.value = JSON.parse(JSON.stringify(composition.sections));
    } else {
      sections.value = [];
    }
    if (composition.sequenceItems && Array.isArray(composition.sequenceItems)) {
      sequenceItems.value = JSON.parse(JSON.stringify(composition.sequenceItems));
    } else {
      sequenceItems.value = [];
    }

    compositionName.value = composition.name; // Set the composition name input field
    saveToLocalStorage(); // Save the current state of savedCompositions (if it was modified by this load)
    console.log(`Composition "${composition.name}" loaded. Staff width: ${staffWidth.value}, Measures: ${measuresCount.value}`);

  } catch (error) {
    console.error('Error loading composition:', error);
    alert(`Error loading composition: ${error.message}`);
    return false;
  }
};

// Make sure every voice is assigned to a staff
const ensureVoiceAssignment = () => {
  // If no staves exist, create one
  if (staves.value.length === 0) {
    staves.value.push({
      id: 'staff1',
      name: 'Staff 1',
      clef: 'treble',
      voiceLayerIds: []
    });
  }
  
  // Make sure every voice is assigned to a staff
  voiceLayers.value.forEach(voice => {
    const isAssigned = staves.value.some(staff => staff.voiceLayerIds.includes(voice.id));
    if (!isAssigned) {
      // Assign to first staff if not assigned elsewhere
      staves.value[0].voiceLayerIds.push(voice.id);
    }
  });
};

// Update updateStaffDisplay to accept an optional width parameter
const updateStaffDisplay = (width?: number) => {
  const staffElement = document.querySelector('.staff');
  if (staffElement) {
    // Use the provided width or the current staffWidth.value
    const displayWidth = width || staffWidth.value;
    (staffElement as HTMLElement).style.width = `${displayWidth}px`;
    console.log(`Set staff width to ${displayWidth}px`);
  } else {
    console.warn('Staff element not found');
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
  loadSavedCompositions();

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

// Update exportCurrentComposition to include staves
const exportCurrentComposition = async () => {
  try {
    // Prepare the full composition data
    const compositionToExport = prepareCompositionData();
    
    // Create a Blob with the JSON data
    const compositionBlob = new Blob(
      [JSON.stringify(compositionToExport, null, 2)], 
      { type: 'application/json' }
    );
    
    // Create a download link and trigger download
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(compositionBlob);
    downloadLink.download = `${compositionName.value || 'composition'}.json`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    console.log('Composition exported successfully');
    return true;
  } catch (error) {
    console.error('Error exporting composition:', error);
    alert(`Error exporting composition: ${error.message}`);
    return false;
  }
};

// Add this validation function before processWebFiles
// (around line 2322)
const validateComposition = (comp: any): boolean => {
  // Basic validation - check if the composition has required properties
  return (
    comp &&
    typeof comp === 'object' &&
    (Array.isArray(comp.voiceLayers) || Array.isArray(comp.notes)) &&
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

      // Process the imported compositions
      let importCount = 0;

      allFileResults.forEach(fileResult => {
        if (fileResult.parsedCompositions && fileResult.parsedCompositions.length > 0) {
          fileResult.parsedCompositions.forEach(comp => {
            // Generate a new ID for the imported composition
            const newId = generateId();

            // Create a new composition object with the imported data
            const importedComposition: CompositionData = {
              ...comp,
              id: newId,
              dateCreated: comp.dateCreated || Date.now()
            };

            // Add to savedCompositions
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
const timeSignatureNumerator = computed(() => timeSignature.value.split('/')[0]);
const timeSignatureDenominator = computed(() => timeSignature.value.split('/')[1]);
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
const exportComposition = () => {
  // Create the export data object with all measure information
  const exportData = {
    name: compositionName.value || 'Untitled',
    notes: notes.value.map(note => ({
      ...note,
      type: note.type,
      position: note.position,
      verticalPosition: note.verticalPosition,
      duration: note.duration,
      dotted: note.dotted,
      pitch: note.pitch
    })),
    // Include all necessary measure and musical data
    timeSignature: timeSignature.value,
    clef: selectedClef.value,
    keySignature: keySignature.value, // FIX: Use keySignature instead of selectedKeySignature
    tempo: tempo.value,
    chordSymbols: chordSymbols.value,
    // Add metadata
    version: '1.0',
    dateExported: new Date().toISOString()
  };

  // Convert to JSON
  const jsonString = JSON.stringify(exportData, null, 2);

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
  return Date.now().toString() + Math.random().toString(36).substring(2, 9);
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

// Update getLyricStyle to work with the array
const getLyricStyle = (note: ImportedNote) => {
  return {
    color: isNotePlaying(note.id) ? 'red' : 'black',
    fontWeight: isNotePlaying(note.id) ? 'bold' : 'normal'
  };
};

// Add these refs for playback control
const playbackStartMeasure = ref(1);
const playbackEndMeasure = ref(0); // 0 means play to the end
const autoScrollToPlayingNote = ref(true);

// Add this helper function to calculate which measure a note is in
const getNotesMeasure = (note: ImportedNote) => { // Update to use aliased import
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
  currentPlayingNoteIds.value = []; // Clear any previously playing notes

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

  // Filter notes to only include those that should be played
  const allNotes = voicesToPlay.flatMap(voice => 
    voice.notes.map(note => ({
      ...note,
      voiceId: voice.id,
      voiceColor: voice.color
    }))
  );
  
  // Rest of the function remains the same until we get to playing notes
  
  // Group notes by position
  const notesByPosition = {};
  allNotes.forEach(note => {
    if (!notesByPosition[note.position]) {
      notesByPosition[note.position] = [];
    }
    notesByPosition[note.position].push(note);
  });

  // Sort positions for sequential playback
  const positions = Object.keys(notesByPosition).map(Number).sort((a, b) => a - b);

  // Play notes in sequence with proper timing
  let totalDelay = 0;
  
  // Clear previous timeouts
  if (window.playbackTimeouts) {
    window.playbackTimeouts.forEach(id => clearTimeout(id));
    window.playbackTimeouts = [];
  }
  window.playbackTimeouts = [];

  positions.forEach(position => {
    const notesAtPosition = notesByPosition[position];

    // Find longest duration at this position
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

    // Calculate timing
    const secondsPerBeat = 60 / tempo.value;
    const waitDurationSeconds = longestDuration * secondsPerBeat;

    // Schedule the notes
    const timeoutId = setTimeout(() => {
      // Clear previous notes
      currentPlayingNoteIds.value = [];
      
      // Add all current notes to the playing array
      notesAtPosition.forEach(note => {
        // Add to currently playing notes
        currentPlayingNoteIds.value.push(note.id);
        
        // Play the note sound
        if (note.type === 'note' && note.pitch) {
            const toneDurationMap = {
              'whole': '1n',
              'half': '2n',
              'quarter': '4n',
              'eighth': '8n',
              'sixteenth': '16n'
            };

          // Get voice volume
          const voice = voiceLayers.value.find(v => v.id === note.voiceId);
          const volume = voice ? voice.volume || 0 : 0;

          // Play the note
            playNoteSound(
            note.pitch,
            toneDurationMap[note.duration] || '4n',
            note.dotted,
              volume,
            note.explicitNatural
            );
          }
        });

      // Auto-scroll to the first note if enabled
      if (autoScrollToPlayingNote.value && notesAtPosition.length > 0) {
        autoScrollToNote(notesAtPosition[0]);
      }
    }, totalDelay * 1000);

      window.playbackTimeouts.push(timeoutId);
    totalDelay += waitDurationSeconds;
  });

  // Final timeout to end playback
  const finalTimeoutId = setTimeout(() => {
    isPlaying.value = false;
    isPaused.value = false;
    currentPlayingNoteIds.value = [];

    // Clear timeouts
      window.playbackTimeouts.forEach(id => clearTimeout(id));
      window.playbackTimeouts = [];

    console.log('Playback complete');
  }, totalDelay * 1000 + 100);

  window.playbackTimeouts.push(finalTimeoutId);
};

// Fix togglePlayback function to work with the array of note IDs
const togglePlayback = () => {
  if (isPlaying.value) {
    // Pause playback
    isPaused.value = true;
      isPlaying.value = false;
    
    // Clear timeouts but don't clear playing notes - keep them highlighted
    if (window.playbackTimeouts) {
      window.playbackTimeouts.forEach(id => clearTimeout(id));
      window.playbackTimeouts = [];
    }
  } else if (isPaused.value) {
    // Resume playback
      isPaused.value = false;
    isPlaying.value = true;
    
    // Start from current notes - don't clear currentPlayingNoteIds
    // Logic to resume playback should go here
    
    // For simplicity, we'll restart playback for now
    playScore();
  } else {
    // Start new playback
    currentPlayingNoteIds.value = []; // Clear any playing notes
    playScore();
  }
};

// Fix stopPlayback to clear the array of playing note IDs
const stopPlayback = () => {
  isPlaying.value = false;
  isPaused.value = false;
  
  // Clear timeouts
  if (window.playbackTimeouts) {
    window.playbackTimeouts.forEach(id => clearTimeout(id));
    window.playbackTimeouts = [];
  }
  
  // Clear playing notes highlighting
  currentPlayingNoteIds.value = [];
  
  console.log('Playback stopped');
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
  currentPlayingNoteIds.value = [];

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
const switchActiveVoice = (voiceId) => {
  // Update the active state for all voices
  voiceLayers.value.forEach(voice => {
    voice.active = voice.id === voiceId;
  });

  // Set the active voice ID
  activeVoiceId.value = voiceId;

  // Clear the selected note when switching voices
  selectedNoteId.value = null;

  console.log(`Switched to voice: ${voiceId}`);
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
const addVoiceLayer = () => {
  const newId = `voice${voiceLayers.value.length + 1}`;
  const newName = `Voice ${voiceLayers.value.length + 1}`;

  // Generate a random color if we've used all the default colors
  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  voiceLayers.value.push({
    id: newId,
    name: newName,
    color: getDefaultVoiceColor(newId) || getRandomColor(),
    visible: true,
    active: false,
    selected: true,
    volume: 0,
    notes: []
  });
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
  const voiceIdSet = new Set<string>();
  // allVisibleNotes already contains only notes from voices that are currently visible
  allVisibleNotes.value.forEach(note => {
    if (note.lyric && note.voiceId) {
      voiceIdSet.add(note.voiceId);
    }
  });
  // Convert set to array and sort to maintain a consistent order (e.g., voice1, voice2, etc.)
  return Array.from(voiceIdSet).sort((a, b) => {
    const numA = parseInt(a.replace('voice', ''), 10);
    const numB = parseInt(b.replace('voice', ''), 10);
    return numA - numB;
  });
});

// Helper function to get vertical offset for lyrics based on its display index among visible voices with lyrics
const getLyricVerticalOffset = (voiceId: string): string => {
  const displayIndex = orderedVisibleVoicesWithLyrics.value.indexOf(voiceId);

  if (displayIndex === -1) {
    return `${LYRIC_BASE_OFFSET}px`;
  }

  return `${LYRIC_BASE_OFFSET + displayIndex * LYRIC_LINE_HEIGHT}px`;
};

// Computed property for the dynamic height of the staff container
const staffContainerMinHeight = computed(() => {
  const staffBaseHeight = 250; // Minimum height for the staff itself (e.g., to show staff lines)
  const lyricLinesCount = orderedVisibleVoicesWithLyrics.value.length;

  if (lyricLinesCount === 0) {
    return `${staffBaseHeight}px`; // Just the staff height if no lyrics
  }

  // Y-coordinate of the top of the first lyric line
  const topOfFirstLyric = LYRIC_BASE_OFFSET;

  // Calculate the Y-coordinate of the bottom edge of the last lyric line
  // If LYRIC_LINE_HEIGHT is the height of one line, and lyricLinesCount is the number of lines,
  // the block of lyrics occupies lyricLinesCount * LYRIC_LINE_HEIGHT.
  // The bottom edge will be topOfFirstLyric + (height of all lyric lines).
  const bottomEdgeOfLastLyric = topOfFirstLyric + (lyricLinesCount * LYRIC_LINE_HEIGHT);

  // Define how much padding you want below the last lyric line
  const PADDING_BELOW_LYRICS = LYRIC_LINE_HEIGHT; // Increased from LYRIC_LINE_HEIGHT / 2

  // The total required height is the bottom edge of the last lyric plus padding
  const requiredHeightForLyrics = bottomEdgeOfLastLyric + PADDING_BELOW_LYRICS;

  // The container should be at least as tall as the staffBaseHeight, or tall enough for lyrics.
  return `${Math.max(staffBaseHeight, requiredHeightForLyrics)}px`;
});

// Add this ref for voice playback selection
// existing code...

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
} = useDebug(notes as ComputedRef<ImportedNote[]>, selectedClef, lastClickY, selectedOctave); // Pass aliased type

// Add this import at the top of your script section
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

// Add this function near other composition-related functions (around line 2060)
const combineCompositions = (compositionIds, newName) => {
  try {
    // Get the compositions that were selected for combining
  const compositionsToMerge = savedCompositions.value.filter(comp =>
    compositionIds.includes(comp.id)
  );

  if (compositionsToMerge.length < 2) {
      alert("Please select at least 2 compositions to combine.");
    return;
  }

    // Start with a new composition structure
    const combinedComposition = {
      id: crypto.randomUUID(),
      name: newName,
      dateCreated: Date.now(),
      dateModified: Date.now(),
      notes: [],
      voiceLayers: [],
      staves: [],
      timeSignature: compositionsToMerge[0].timeSignature || '4/4',
      keySignature: compositionsToMerge[0].keySignature || 'C',
      tempo: compositionsToMerge[0].tempo || 120,
      chordSymbols: [],
      sections: [],
      staffSettings: {
        width: 960,
        scrollPosition: 0
      }
    };
    
    // Track voice ID mapping to avoid conflicts
    const voiceIdMapping = new Map();
    
    // Track which voices belong to which clefs (for compositions without staff data)
    const clefToVoices = new Map();
    
    // First pass: process voices and create voice ID mappings
    compositionsToMerge.forEach((comp, compIndex) => {
      // Track if this composition has explicit staff data
      const hasStaffData = comp.staves && Array.isArray(comp.staves) && comp.staves.length > 0;
      
      // Process voice layers
      if (comp.voiceLayers && Array.isArray(comp.voiceLayers)) {
        comp.voiceLayers.forEach(originalVoice => {
          const newVoiceId = `voice_${compIndex}_${originalVoice.id}`;
          voiceIdMapping.set(originalVoice.id, newVoiceId);
          
          // Create a copy of the voice with the new ID
          const newVoice = {
            ...originalVoice,
            id: newVoiceId,
            name: `${comp.name}: ${originalVoice.name}`,
            notes: []
          };
          
          // Add notes to this voice
          if (comp.notes && Array.isArray(comp.notes)) {
            const voiceNotes = comp.notes.filter(note => note.voiceId === originalVoice.id);
            newVoice.notes = voiceNotes.map(note => ({
              ...note,
              voiceId: newVoiceId
            }));
          }
          
          // Add the voice to the combined composition
          combinedComposition.voiceLayers.push(newVoice);
          
          // For compositions without staff data, track voice by clef
          if (!hasStaffData) {
            const clef = comp.clef || 'treble';
            if (!clefToVoices.has(clef)) {
              clefToVoices.set(clef, []);
            }
            clefToVoices.get(clef).push(newVoiceId);
          }
        });
      }
      
      // Process chords and merge them
      if (comp.chordSymbols && Array.isArray(comp.chordSymbols)) {
        combinedComposition.chordSymbols.push(...comp.chordSymbols);
      }
      
      // Process sections (we don't combine these, but could be extended)
      if (comp.sections && Array.isArray(comp.sections)) {
        // Optional: merge sections (would need additional logic to handle measure numbers)
      }
    });
    
    // Second pass: process staves and assign voices
    compositionsToMerge.forEach((comp, compIndex) => {
      // Check if the composition has explicit staff data
      if (comp.staves && Array.isArray(comp.staves) && comp.staves.length > 0) {
        // This composition has staff data, so add each staff
        comp.staves.forEach((staff, staffIndex) => {
          // Create a new staff with a unique ID
          const newStaff = {
            id: `staff_${compIndex}_${staffIndex}`,
            name: `${comp.name}: ${staff.name}`,
            clef: staff.clef || 'treble',
            voiceLayerIds: []
          };
          
          // Map old voice IDs to new voice IDs for this staff
          if (staff.voiceLayerIds && Array.isArray(staff.voiceLayerIds)) {
            staff.voiceLayerIds.forEach(oldVoiceId => {
              const newVoiceId = voiceIdMapping.get(oldVoiceId);
              if (newVoiceId) {
                newStaff.voiceLayerIds.push(newVoiceId);
          }
        });
      }

          // Add the staff to the combined composition
          combinedComposition.staves.push(newStaff);
        });
      }
    });
    
    // Handle compositions without staff data, organizing by clef
    if (clefToVoices.size > 0) {
      // For each unique clef, create a staff
      let staffCounter = combinedComposition.staves.length;
      clefToVoices.forEach((voiceIds, clef) => {
        const newStaff = {
          id: `staff_auto_${staffCounter++}`,
          name: `${clef.charAt(0).toUpperCase() + clef.slice(1)} Staff`,
          clef: clef,
          voiceLayerIds: voiceIds
        };
        
        // Add the staff to the combined composition
        combinedComposition.staves.push(newStaff);
      });
    }
    
    // If we don't have any staves at all (unlikely), create a default one
    if (combinedComposition.staves.length === 0) {
      combinedComposition.staves.push({
        id: 'staff1',
        name: 'Staff 1',
        clef: 'treble',
        voiceLayerIds: combinedComposition.voiceLayers.map(v => v.id)
      });
    }
    
    // Collect all notes for the top-level notes array
    combinedComposition.notes = combinedComposition.voiceLayers.flatMap(voice => 
      voice.notes.map(note => ({
        ...note,
        voiceId: voice.id
      }))
    );

    // Add the combined composition to saved compositions
    savedCompositions.value.push(combinedComposition);
    
    // Save to localStorage
    saveToLocalStorage();

    // Optional: Load the new composition immediately
    loadComposition(combinedComposition.id);
    
    alert(`Successfully combined ${compositionsToMerge.length} compositions into "${newName}"`);
    return true;
  } catch (error) {
    console.error('Error combining compositions:', error);
    alert(`Error combining compositions: ${error.message}`);
    return false;
  }
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
const playCompositionWithCallback = (sectionStartMeasure = null, sectionEndMeasure = null) => {
  if (isPlaying.value) return;
  
  isPlaying.value = true;
  currentPlayingNoteIds.value = []; // Clear any previously playing notes
  
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
        // Clear previous notes
        currentPlayingNoteIds.value = [];
        
        // Add all currently playing notes to the array
        notesToPlay.forEach(noteToPlay => {
          // Add to the list of currently playing notes
          currentPlayingNoteIds.value.push(noteToPlay.id);
          
          // Auto-scroll to the playing note if enabled
          if (autoScrollToPlayingNote.value) {
            autoScrollToNote(noteToPlay);
          }
          
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
            const volume = voice ? voice.volume || 0 : 0; // Default to 0dB if not specified
            
            playNoteSound(
              noteToPlay.pitch, 
              toneDuration, 
              noteToPlay.dotted, 
              volume,
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
    currentPlayingNoteIds.value = []; // Clear any playing notes
    
    // ... existing sequence handling ...
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

// Add this to the script section with other refs
const staves = ref([
  {
    id: 'staff1',
    name: 'Staff 1',
    clef: 'treble',
    voiceLayerIds: [] // IDs of voice layers that belong to this staff
  }
]);

// Add a function to add a new staff
const addStaff = () => {
  const newStaffId = `staff${staves.value.length + 1}`;
  staves.value.push({
    id: newStaffId,
    name: `Staff ${staves.value.length + 1}`,
    clef: 'treble',
    voiceLayerIds: []
  });
};

// Add a function to remove a staff
const removeStaff = (staffId) => {
  if (staves.value.length <= 1) {
    alert("Cannot remove the last staff.");
    return;
  }
  
  const staffIndex = staves.value.findIndex(s => s.id === staffId);
  if (staffIndex !== -1) {
    if (confirm(`Are you sure you want to remove ${staves.value[staffIndex].name}?`)) {
      staves.value.splice(staffIndex, 1);
    }
  }
};

// Add a function to change staff clef
const changeStaffClef = (staffId, newClef) => {
  const staff = staves.value.find(s => s.id === staffId);
  if (staff) {
    staff.clef = newClef;
  }
};

// Add a function to assign a voice layer to a staff
const assignVoiceToStaff = (voiceId, staffId) => {
  // Check if already assigned
  const targetStaff = staves.value.find(s => s.id === staffId);
  if (targetStaff && targetStaff.voiceLayerIds.includes(voiceId)) {
    return; // Already assigned
  }
  
  // Remove from other staves first
  staves.value.forEach(staff => {
    const index = staff.voiceLayerIds.indexOf(voiceId);
    if (index !== -1) {
      staff.voiceLayerIds.splice(index, 1);
    }
  });
  
  // Add to target staff
  if (targetStaff) {
    targetStaff.voiceLayerIds.push(voiceId);
    
    // Ensure the voice exists
    if (!voiceLayers.value.some(v => v.id === voiceId)) {
      // Create a new voice if needed
      voiceLayers.value.push({
        id: voiceId,
        name: `Voice for ${targetStaff.name}`,
        color: getRandomColor(),
        visible: true,
        active: voiceLayers.value.length === 0, // Only active if it's the first one
        selected: true,
        volume: 0,
        notes: []
      });
    }
  }
};

// Create a helper function to ensure each staff has at least one voice
const ensureStaffHasVoice = () => {
  staves.value.forEach(staff => {
    if (staff.voiceLayerIds.length === 0) {
      // Create a voice ID specific to this staff
      const voiceId = `voice_${staff.id}_${Date.now()}`;
      
      // Create the voice
      const newVoice = {
        id: voiceId,
        name: `Voice for ${staff.name}`,
        color: getRandomColor(),
        visible: true,
        active: false,
        selected: true,
        volume: 0,
        notes: []
      };
      
      // Add to voice layers
      voiceLayers.value.push(newVoice);
      
      // Assign to staff
      staff.voiceLayerIds.push(voiceId);
    }
  });
};

// Modify/add a method to get notes for a specific staff
const getNotesForStaff = (staffId) => {
  const staff = staves.value.find(s => s.id === staffId);
  if (!staff) return [];
  
  // Get all voice IDs assigned to this staff
  const voiceIds = staff.voiceLayerIds || [];
  
  // Get all voices that belong to this staff and are visible
  const staffVoices = voiceLayers.value.filter(voice => 
    voiceIds.includes(voice.id) && voice.visible
  );
  
  // Log for debugging
  console.log(`Staff ${staffId} has ${voiceIds.length} voice IDs and ${staffVoices.length} visible voices`);
  
  // Map all notes from these voices to include voice ID and color
  const notes = staffVoices.flatMap(voice => 
    voice.notes.map(note => ({
      ...note,
      voiceId: voice.id,
      voiceColor: voice.color
    }))
  );
  
  console.log(`Retrieved ${notes.length} notes for staff ${staffId}`);
  
  return notes;
};

// Add function to determine if a chord symbol belongs to a staff
const isChordInStaffRange = (chord, staffId) => {
  // For now, simply assign all chord symbols to the first staff
  // In a more sophisticated implementation, you might assign chords
  // based on position or have staff-specific chord symbols
  return staves.value.indexOf(staves.value.find(s => s.id === staffId)) === 0;
};

// Add this computed to get the staff for a voice
const getStaffForVoice = (voiceId) => {
  const staff = staves.value.find(s => s.voiceLayerIds.includes(voiceId));
  return staff ? staff.id : null;
};

// Make staffWidth and scrollPosition staff-specific
const staffSettings = ref(new Map());

// Initialize staff settings with default values
const initializeStaffSettings = (staffId) => {
  if (!staffSettings.value.has(staffId)) {
    staffSettings.value.set(staffId, {
      scrollPosition: 0,
      width: staffWidth.value // Use the global default initially
    });
  }
  return staffSettings.value.get(staffId);
};

// Update the scrollStaff function to be staff-specific
const scrollStaff = (direction, staffId) => {
  const settings = initializeStaffSettings(staffId);
  const scrollAmount = 200; // Amount to scroll in pixels

  if (direction === 'left') {
    // Scroll left (decrease position)
    settings.scrollPosition = Math.max(0, settings.scrollPosition - scrollAmount);
  } else {
    // Scroll right (increase position)
    settings.scrollPosition = Math.min(
      calculateMaxScrollPosition(settings.width), 
      settings.scrollPosition + scrollAmount
    );
  }

  // Apply the scroll position to the specific staff element
  const staffElement = document.querySelector(`.staff[data-staff-id="${staffId}"]`);
  if (staffElement) {
    (staffElement as HTMLElement).style.transform = `translateX(-${settings.scrollPosition}px)`;
  }

  console.log(`Scrolled ${direction} for staff ${staffId}: position=${settings.scrollPosition}`);
};

// Calculate max scroll position for a specific staff
const calculateMaxScrollPosition = (staffWidth) => {
  return Math.max(0, staffWidth - visibleStaffWidth.value);
};

// Update the extendStaff function to be staff-specific
const extendStaff = (staffId) => {
  const settings = initializeStaffSettings(staffId);
  
  // Increase width by enough space for 4 more measures
  settings.width += measureWidthByTimeSignature.value * 4;

  // Log for debugging
  console.log(`Extended staff ${staffId}: width=${settings.width}px`);

  // Force a re-render of the staff lines
  nextTick(() => {
    const staffElement = document.querySelector(`.staff[data-staff-id="${staffId}"]`);
    if (staffElement) {
      (staffElement as HTMLElement).style.width = `${settings.width}px`;

      // Make sure staff lines extend across the full width
      const staffLines = staffElement.querySelectorAll('.staff-line');
      staffLines.forEach(line => {
        (line as HTMLElement).style.width = `${settings.width}px`;
      });
    }
  });
};

// Helper functions to get staff-specific settings
// const getStaffWidth = (staffId) => {
//   return initializeStaffSettings(staffId).width;
// };

// const getStaffScrollPosition = (staffId) => {
//   return initializeStaffSettings(staffId).scrollPosition;
// };

// Initialize settings for all staves
onMounted(() => {
  // Other initialization code...
  
  // Initialize global staff settings
  globalStaffSettings.value.width = calculateMaxRequiredWidth();
  globalStaffSettings.value.scrollPosition = 0;
  
  // Initialize settings for all staves
  staves.value.forEach(staff => {
    // Initialize any staff-specific settings
  });
  
  // Ensure each staff has at least one voice
  ensureStaffHasVoice();
  
  // Apply the initial width to all staves
  nextTick(() => {
    staves.value.forEach(staff => {
      const staffElement = document.querySelector(`.staff[data-staff-id="${staff.id}"]`);
      if (staffElement) {
        staffElement.style.width = `${globalStaffSettings.value.width}px`;
        
        // Update staff lines width
        const staffLines = staffElement.querySelectorAll('.staff-line');
        staffLines.forEach(line => {
          line.style.width = `${globalStaffSettings.value.width}px`;
        });
      }
    });
  });
});

// Watch for staves changes to initialize settings for new staves
watch(staves, (newStaves) => {
  newStaves.forEach(staff => {
    initializeStaffSettings(staff.id);
  });
  
  // Ensure all staves have at least one voice
  ensureStaffHasVoice();
}, { deep: true });

// Fix the staffSettings implementation
// const staffSettings = ref(new Map());

// Initialize staff settings with a better implementation that doesn't conflict
// const getStaffSettings = (staffId) => {
//   if (!staffSettings.value.has(staffId)) {
//     // Initialize with a copy of the global settings
//     staffSettings.value.set(staffId, {
//       scrollPosition: 0,
//       width: staffWidth.value || 960
//     });
//   }
//   return staffSettings.value.get(staffId);
// };

// Helper functions for staff-specific settings that don't override global functions
const getStaffWidth = (staffId) => {
  return getStaffSettings(staffId).width;
};

const getStaffScrollPosition = (staffId) => {
  return getStaffSettings(staffId).scrollPosition;
};

// Create staff-specific scroll function with a different name to avoid conflicts
const scrollStaffById = (direction, staffId) => {
  const scrollAmount = 200; // Amount to scroll in pixels

  if (direction === 'left') {
    globalStaffSettings.value.scrollPosition = Math.max(0, globalStaffSettings.value.scrollPosition - scrollAmount);
  } else {
    const maxScroll = Math.max(0, globalStaffSettings.value.width - visibleStaffWidth.value);
    globalStaffSettings.value.scrollPosition = Math.min(maxScroll, globalStaffSettings.value.scrollPosition + scrollAmount);
  }

  // Update all staves to the new scroll position
  updateAllStaffsPosition();
};

// Function to update all staff positions
const updateAllStaffsPosition = () => {
  staves.value.forEach(staff => {
    const staffElement = document.querySelector(`.staff[data-staff-id="${staff.id}"]`);
    if (staffElement) {
      staffElement.style.transform = `translateX(-${globalStaffSettings.value.scrollPosition}px)`;
    }
  });
};

// Modify the updateStaffPosition to use the global scroll
const updateStaffPosition = (staffId) => {
  const staffElement = document.querySelector(`.staff[data-staff-id="${staffId}"]`);
  if (staffElement) {
    staffElement.style.transform = `translateX(-${globalStaffSettings.value.scrollPosition}px)`;
  }
};

// Update extendStaffById to extend all staves
const extendStaffById = (staffId) => {
  // Increase width by enough space for 4 more measures
  globalStaffSettings.value.width += measureWidthByTimeSignature.value * 4;
  
  // Update all staves to the new width
  updateAllStaffsWidth();
};

// Function to update all staff widths
const updateAllStaffsWidth = () => {
  staves.value.forEach(staff => {
    const staffElement = document.querySelector(`.staff[data-staff-id="${staff.id}"]`);
    if (staffElement) {
      staffElement.style.width = `${globalStaffSettings.value.width}px`;
      
      // Update staff lines width
      const staffLines = staffElement.querySelectorAll('.staff-line');
      staffLines.forEach(line => {
        line.style.width = `${globalStaffSettings.value.width}px`;
      });
    }
  });
};

// Fix the drag handling to work with staff-specific settings
const startDrag = (event, staffId) => {
  // Skip if clicking on a note or chord
  if (event.target.closest('.note') || event.target.closest('.chord-symbol')) {
    return;
  }

  const startX = event.touches ? event.touches[0].clientX : event.clientX;
  const startY = event.touches ? event.touches[0].clientY : event.clientY;
  const startTime = Date.now();
  
  // Get current global scroll position
  const startScrollPosition = globalStaffSettings.value.scrollPosition;
  
  // Prevent default
  event.preventDefault();
  
  // Record drag start position
  dragStartX.value = startX;
  dragStartScrollPosition.value = startScrollPosition;
  
  let hasDragged = false;

  const moveHandler = (moveEvent) => {
    const currentX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
    const currentY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;
    
    const distanceX = Math.abs(currentX - startX);
    const distanceY = Math.abs(currentY - startY);
    const totalDistance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
    
    if (totalDistance > 15) {
      if (!hasDragged) {
        hasDragged = true;
        isDragging.value = true;
      }
      
      moveEvent.preventDefault();
      
      // Calculate delta
      const deltaX = dragStartX.value - currentX;
      
      // Update global scroll position
      const maxScroll = Math.max(0, globalStaffSettings.value.width - visibleStaffWidth.value);
      globalStaffSettings.value.scrollPosition = Math.max(0, Math.min(maxScroll, startScrollPosition + deltaX));
      
      // Apply the scroll to all staves
      updateAllStaffsPosition();
    }
  };

  const endHandler = (endEvent) => {
    const endTime = Date.now();
    const timeElapsed = endTime - startTime;
    
    if (timeElapsed < 300 && !hasDragged) {
      isDragging.value = false;
      
      // For touch, create a synthetic click
      if (endEvent.type === 'touchend') {
        const clickEvent = new MouseEvent('click', {
          clientX: startX,
          clientY: startY,
          bubbles: true,
          cancelable: true,
          view: window
        });
        endEvent.target.dispatchEvent(clickEvent);
      }
    } else if (hasDragged) {
      setTimeout(() => {
        isDragging.value = false;
      }, 50);
    } else {
      isDragging.value = false;
    }
    
    // Remove listeners
    document.removeEventListener('mousemove', moveHandler);
    document.removeEventListener('mouseup', endHandler);
    document.removeEventListener('touchmove', moveHandler);
    document.removeEventListener('touchend', endHandler);
  };

  // Add listeners based on event type
  if (event.type === 'mousedown') {
    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', endHandler);
  } else if (event.type === 'touchstart') {
    document.addEventListener('touchmove', moveHandler, { passive: false });
    document.addEventListener('touchend', endHandler);
  }
};

// Add a helper function to check if a note is currently playing
const isNotePlaying = (noteId: string) => {
  return currentPlayingNoteIds.value.includes(noteId);
};

// Update autoScrollToNote to scroll all staves together
const autoScrollToNote = (note) => {
  if (!note) return;
  
  // Get the note's horizontal position in pixels
  const notePositionPx = note.position * 50;
  
  // Calculate if we need to scroll (if note is off-screen)
  const noteVisibleLeft = notePositionPx - globalStaffSettings.value.scrollPosition;
  const noteVisibleRight = noteVisibleLeft + 50; // assuming note width is 50px
  const visibleWidth = visibleStaffWidth.value;
  
  // If note is not fully visible, scroll to make it visible
  if (noteVisibleLeft < 100 || noteVisibleRight > visibleWidth - 100) {
    // Center the note in the staff
    const newScrollPosition = Math.max(0, notePositionPx - (visibleWidth / 2));
    
    // Update global scroll position
    globalStaffSettings.value.scrollPosition = newScrollPosition;
    
    // Apply the scrolling to all staves
    updateAllStaffsPosition();
  }
};

// Add a global setting for all staves
const globalStaffSettings = ref({
  scrollPosition: 0,
  width: 960 // Default width
});

// Update getStaffSettings to use global settings for scrolling and width
const getStaffSettings = (staffId) => {
  if (!staffSettings.value.has(staffId)) {
    staffSettings.value.set(staffId, {
      // Other staff-specific settings can remain here
      // But scroll position and width will be shared
      scrollPosition: 0,
      width: staffWidth.value || 960
    });
  }
  return {
    ...staffSettings.value.get(staffId),
    // Use global settings for shared properties
    scrollPosition: globalStaffSettings.value.scrollPosition,
    width: globalStaffSettings.value.width
  };
};

// Function to get the maximum width needed based on all notes
const calculateMaxRequiredWidth = () => {
  let maxPosition = 0;
  
  // Check all notes across all staves
  staves.value.forEach(staff => {
    const notes = getNotesForStaff(staff.id);
    if (notes.length > 0) {
      const furthestNote = Math.max(...notes.map(note => note.position));
      maxPosition = Math.max(maxPosition, furthestNote);
    }
  });
  
  // Add some margin to the end
  return Math.max(960, (maxPosition + 10) * 50);
};

// Update importComposition to handle staves
const importComposition = async (file) => {
  try {
    // Read the file as text
    const fileContent = await file.text();
    const importedData = JSON.parse(fileContent);
    
    // Reset current state
    resetComposition();
    
    // Process the same way as loadComposition but with some validation
    if (!importedData.id) {
      importedData.id = crypto.randomUUID();
    }
    
    if (!importedData.dateCreated) {
      importedData.dateCreated = Date.now();
    }
    
    // Load the imported data as a composition
    currentCompositionId.value = importedData.id;
    compositionName.value = importedData.name || 'Imported Composition';
    currentCompositionDateCreated.value = importedData.dateCreated;
    
    // Load time signature, key signature, tempo with defaults
    timeSignature.value = importedData.timeSignature || '4/4';
    keySignature.value = importedData.keySignature || 'C';
    tempo.value = importedData.tempo || 120;
    
    // Load chord symbols if available
    chordSymbols.value = importedData.chordSymbols || [];
    
    // Load sections and sequence items if available
    sections.value = importedData.sections || [];
    sequenceItems.value = importedData.sequenceItems || [];
    
    // Load voice layers
    if (importedData.voiceLayers && Array.isArray(importedData.voiceLayers)) {
      voiceLayers.value = importedData.voiceLayers;
    } else {
      // Create default voice layer if none exist
      voiceLayers.value = [{
        id: 'voice1',
        name: 'Voice 1',
        color: '#333333',
        visible: true,
        active: true,
        selected: true,
        volume: 0,
        notes: []
      }];
    }
    
    // Load staves if available
    if (importedData.staves && Array.isArray(importedData.staves)) {
      staves.value = importedData.staves;
    } else {
      // Create default staff if none exist
      staves.value = [{
        id: 'staff1',
        name: 'Staff 1',
        clef: 'treble',
        voiceLayerIds: voiceLayers.value.map(voice => voice.id) // Assign all voices to this staff
      }];
    }
    
    // Apply global staff settings if available
    if (importedData.staffSettings) {
      globalStaffSettings.value.width = importedData.staffSettings.width || calculateMaxRequiredWidth();
    } else {
      // Calculate appropriate width based on note positions
      globalStaffSettings.value.width = calculateMaxRequiredWidth();
    }
    
    // Reset scroll position to start
    globalStaffSettings.value.scrollPosition = 0;
    
    // Load notes into their respective voices
    if (importedData.notes && Array.isArray(importedData.notes)) {
      // First, make sure any voice referenced by notes exists
      const voiceIds = new Set(voiceLayers.value.map(v => v.id));
      
      importedData.notes.forEach(note => {
        if (note.voiceId && !voiceIds.has(note.voiceId)) {
          // Create missing voice
          const newVoice = {
            id: note.voiceId,
            name: `Voice ${voiceLayers.value.length + 1}`,
            color: getRandomColor(),
            visible: true,
            active: false,
            selected: true,
            volume: 0,
            notes: []
          };
          voiceLayers.value.push(newVoice);
          voiceIds.add(note.voiceId);
          
          // Assign to first staff if not assigned elsewhere
          if (staves.value.length > 0 && !staves.value.some(s => s.voiceLayerIds.includes(note.voiceId))) {
            staves.value[0].voiceLayerIds.push(note.voiceId);
          }
        }
      });
      
      // Now distribute notes to their voices
      voiceLayers.value.forEach(voice => {
        voice.notes = importedData.notes.filter(note => note.voiceId === voice.id);
      });
    }
    
    // Ensure every voice is assigned to a staff
    ensureVoiceAssignment();
    
    // Save imported composition
    saveToLocalStorage();
    
    // Update staff widths and positions
    nextTick(() => {
      updateAllStaffsPosition();
      updateAllStaffsWidth();
    });
    
    console.log(`Imported composition: ${compositionName.value}`);
    return true;
  } catch (error) {
    console.error('Error importing composition:', error);
    alert(`Error importing composition: ${error.message}`);
    return false;
  }
};

// Update resetComposition to handle staves
const resetComposition = () => {
  // Reset all composition data
  currentCompositionId.value = crypto.randomUUID();
  compositionName.value = 'New Composition';
  currentCompositionDateCreated.value = Date.now();
  
  // Reset voice layers
  voiceLayers.value = [{
    id: 'voice1',
    name: 'Voice 1',
    color: '#333333',
    visible: true,
    active: true,
    selected: true,
    volume: 0,
    notes: []
  }];
  
  // Reset staves
  staves.value = [{
    id: 'staff1',
    name: 'Staff 1',
    clef: 'treble',
    voiceLayerIds: ['voice1']
  }];
  
  // Reset other properties
  chordSymbols.value = [];
  sections.value = [];
  sequenceItems.value = [];
  
  // Reset playback state
  isPlaying.value = false;
  isPaused.value = false;
  currentPlayingNoteIds.value = [];
  
  // Reset global staff settings
  globalStaffSettings.value.width = 960; // Default width
  globalStaffSettings.value.scrollPosition = 0;
  
  // Reset selection state
  selectedNoteId.value = null;
  
  // Update UI if needed
  nextTick(() => {
    updateAllStaffsPosition();
    updateAllStaffsWidth();
  });
  
  console.log('Composition reset');
};

// Add the missing currentCompositionDateCreated ref near the top of the script section
// Add it near where currentCompositionId is defined

// Find where you have something like:
// const currentCompositionId = ref('');
// And add this right after it:
const currentCompositionDateCreated = ref<number | null>(null);

// Add these functions to handle barlines and beat positions
// const updateBarlines = () => {
//   // Calculate measure width based on time signature
//   const measureWidth = measureWidthByTimeSignature.value;
//   const initialPosition = 70 + (currentKeySignatureAccidentals.value.length * 10) + 20;
  
//   // Clear existing barlines
//   barlines.value = [];
  
//   // Get width of visible area to determine how many barlines to show
//   const staffWidthValue = globalStaffSettings.value.width;
//   const numMeasures = Math.ceil(staffWidthValue / measureWidth) + 1; // Add 1 for safety
  
//   // Add initial barline
//   barlines.value.push({
//     position: initialPosition,
//     type: 'single',
//     measureNumber: 1
//   });
  
//   // Add subsequent barlines
//   for (let i = 1; i < numMeasures; i++) {
//     const position = initialPosition + (i * measureWidth);
    
//     // Regular barline between measures
//     barlines.value.push({
//       position,
//       type: 'single',
//       measureNumber: i + 1
//     });
//   }
  
//   console.log(`Generated ${barlines.value.length} barlines`);
// };

// Update beat positions based on time signature
// const updateBeatPositions = () => {
//   // Clear existing beat markers
//   beatPositions.value = [];
  
//   // Parse time signature
//   const [beatsPerMeasure, beatValue] = timeSignature.value.split('/').map(Number);
  
//   // Calculate measure width and get initial position (same as barlines)
//   const measureWidth = measureWidthByTimeSignature.value;
//   const initialPosition = 70 + (currentKeySignatureAccidentals.value.length * 10) + 20;
  
//   // Calculate beat width
//   const beatWidth = measureWidth / beatsPerMeasure;
  
//   // Get width of visible area to determine how many beat markers to show
//   const staffWidthValue = globalStaffSettings.value.width;
//   const numMeasures = Math.ceil(staffWidthValue / measureWidth) + 1; // Add 1 for safety
  
//   // Add beat markers for each measure
//   for (let measure = 0; measure < numMeasures; measure++) {
//     const measureStart = initialPosition + (measure * measureWidth);
    
//     // Add beat markers within each measure (skip first beat as it's the barline)
//     for (let beat = 1; beat < beatsPerMeasure; beat++) {
//       const position = measureStart + (beat * beatWidth);
      
//       beatPositions.value.push({
//         position,
//         measureNumber: measure + 1,
//         beatNumber: beat + 1
//       });
//     }
//   }
  
//   console.log(`Generated ${beatPositions.value.length} beat markers`);
// };

// Add computed property to calculate measure width based on time signature
// const measureWidthByTimeSignature = computed(() => {
//   // Base width
//   let width = 200; // Default for 4/4
  
//   // Adjust based on time signature
//   const [numerator, denominator] = timeSignature.value.split('/').map(Number);
  
//   // Wider for more beats per measure
//   if (numerator > 4) {
//     width = 250;
//   } else if (numerator < 4) {
//     width = 150;
//   }
  
//   return width;
// });

// Create writable refs for barlines and beatPositions
// Add these near your other ref declarations
const barlinesList = ref([]);
const beatPositionsList = ref([]);

// Update the barlines function to use the writable ref
const updateBarlines = () => {
  // Calculate measure width based on time signature
  const measureWidth = measureWidthByTimeSignature.value;
  const initialPosition = 70 + (currentKeySignatureAccidentals.value.length * 10) + 20;
  
  // Clear existing barlines
  barlinesList.value = []; // Use the writable ref
  
  // Get width of visible area to determine how many barlines to show
  const staffWidthValue = globalStaffSettings.value.width;
  const numMeasures = Math.ceil(staffWidthValue / measureWidth) + 1; // Add 1 for safety
  
  // Add initial barline
  barlinesList.value.push({
    position: initialPosition,
    type: 'single',
    measureNumber: 1
  });
  
  // Add subsequent barlines
  for (let i = 1; i < numMeasures; i++) {
    const position = initialPosition + (i * measureWidth);
    
    // Regular barline between measures
    barlinesList.value.push({
      position,
      type: 'single',
      measureNumber: i + 1
    });
  }
  
  console.log(`Generated ${barlinesList.value.length} barlines`);
};

// Update beat positions based on time signature
const updateBeatPositions = () => {
  // Clear existing beat markers
  beatPositionsList.value = []; // Use the writable ref
  
  // Parse time signature
  const [beatsPerMeasure, beatValue] = timeSignature.value.split('/').map(Number);
  
  // Calculate measure width and get initial position (same as barlines)
  const measureWidth = measureWidthByTimeSignature.value;
  const initialPosition = 70 + (currentKeySignatureAccidentals.value.length * 10) + 20;
  
  // Calculate beat width
  const beatWidth = measureWidth / beatsPerMeasure;
  
  // Get width of visible area to determine how many beat markers to show
  const staffWidthValue = globalStaffSettings.value.width;
  const numMeasures = Math.ceil(staffWidthValue / measureWidth) + 1; // Add 1 for safety
  
  // Add beat markers for each measure
  for (let measure = 0; measure < numMeasures; measure++) {
    const measureStart = initialPosition + (measure * measureWidth);
    
    // Add beat markers within each measure (skip first beat as it's the barline)
    for (let beat = 1; beat < beatsPerMeasure; beat++) {
      const position = measureStart + (beat * beatWidth);
      
      beatPositionsList.value.push({
        position,
        measureNumber: measure + 1,
        beatNumber: beat + 1
      });
    }
  }
  
  console.log(`Generated ${beatPositionsList.value.length} beat markers`);
};
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

/* Make playing notes and lyrics more prominent */
.note.playing {
  /* Remove the scale transform entirely and use a glow effect instead */
  filter: brightness(1.2) drop-shadow(0 0 1px rgba(255, 255, 255, 0.8));
  /* Don't use any transform that could shift the note */
  z-index: 10;
  transition: all 0.1s ease;
}

/* For whole and half notes (hollow noteheads) */
.note.playing .notehead.whole,
.note.playing .notehead.half {
  filter: brightness(1.2);
  box-shadow: 0 0 3px rgba(0, 0, 0, 0.2);
}

/* For quarter, eighth, etc. (filled noteheads) */
.note.playing .notehead.quarter,
.note.playing .notehead.eighth,
.note.playing .notehead.sixteenth {
  filter: brightness(1.2);
}

/* Improve the lyric highlight without moving it */
.lyric.playing {
  font-weight: bold;
  filter: brightness(1.2);
  /* Remove any transform that could cause movement */
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
  z-index: 10;
  transition: all 0.1s ease;
}

/* Better highlighting for stems and flags */
.note.playing .stem,
.note.playing .flag {
  filter: brightness(1.2);
}

/* Add a subtle pulse animation for currently playing notes */
@keyframes subtle-pulse {
  0% { opacity: 0.9; }
  50% { opacity: 1; }
  100% { opacity: 0.9; }
}

.note.playing {
  animation: subtle-pulse 0.5s infinite alternate;
}
</style>