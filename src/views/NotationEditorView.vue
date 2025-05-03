<template>
  <!-- Add responsive meta tag -->
  <div class="notation-editor">
    <!-- Make controls more mobile-friendly -->
    <div class="controls">
      <div class="controls-row">
      <div class="tempo-control">
          <label>Tempo: {{ tempo }}</label>
        <input 
          type="range" 
          v-model="tempo" 
          min="40" 
          max="240" 
          class="tempo-slider"
        />
      </div>
      
        <div class="clef-selector">
          <label for="clef-select">Clef:</label>
          <div class="custom-select">
            <select id="clef-select" v-model="selectedClef" @change="handleClefChange">
              <option value="treble">𝄞 Treble</option>
              <option value="bass">𝄢 Bass</option>
            </select>
            <div class="select-icon">▼</div>
          </div>
        </div>
      </div>
      
      <div class="controls-row">
      <div class="playback-controls">
        <button @click="playComposition" class="action-button play-button" :disabled="isPlaying">
          <span class="button-icon">▶</span>
          <span class="button-label">Play</span>
        </button>
        
        <button @click="stopPlayback" class="action-button stop-button" :disabled="!isPlaying">
          <span class="button-icon">■</span>
          <span class="button-label">Stop</span>
        </button>
        
        <button @click="clearScore" class="action-button clear-button" @mousedown="animateButton">
          <span class="button-icon">✕</span>
          <span class="button-label">Clear</span>
        </button>
        </div>
      </div>
    </div>

    <!-- Staff container with improved mobile layout -->
    <div class="staff-container">
      <div class="clef">
        <img v-if="selectedClef === 'treble'" src="@/assets/treble-clef.svg" alt="Treble Clef" />
        <img v-else-if="selectedClef === 'bass'" src="@/assets/bass-clef.svg" alt="Bass Clef" />
      </div>
      
      <!-- Key Signature -->
      <div class="key-signature">
        <div v-for="(accidental, index) in currentKeySignatureAccidentals" 
             :key="`key-sig-${index}`"
             class="key-signature-accidental"
             :style="{
               top: `${getKeySignaturePosition(accidental)}px`,
               left: `${getKeySignatureXPosition(index)}px`
             }">
          {{ getAccidentalSymbolForKeySignature(accidental) }}
        </div>
      </div>
      
      <!-- Scrollable staff -->
      <div class="staff-scroll-container">
        <div class="staff" 
             @click="handleStaffClick"
             @mousedown="startDrag"
             @touchstart="startDrag"
             :style="{
               width: `${staffWidth.value}px`,
               transform: `translateX(-${scrollPosition.value}px)`
             }">
          <!-- Staff lines -->
          <div class="staff-lines">
            <div class="staff-line" v-for="i in 5" :key="`line-${i}`"></div>
          </div>
          
          <!-- Measure bars -->
          <div v-for="i in measuresCount" 
               :key="`measure-${i}`" 
               class="measure-bar"
               :style="{ left: `${i * measureWidth.value}px` }">
          </div>
          
          <!-- Notes container -->
          <div class="notes-container">
            <!-- Ledger lines for notes -->
            <template v-for="note in notes" :key="`ledger-${note.id}`">
              <!-- Ledger lines for notes above the staff -->
              <div v-if="needsLedgerLines(note, 'above')" 
                   class="ledger-lines-container above"
                   :style="{
                     left: `${note.position * 50 - 10}px`
                   }">
                <div v-for="linePos in getLedgerLines(note, 'above')" 
                     :key="`above-${note.id}-${linePos}`"
                     class="ledger-line"
                     :style="{
                       top: `${linePos}px`,
                     width: '20px'
                   }">
                </div>
              </div>
              
              <!-- Ledger lines for notes below the staff -->
              <div v-if="needsLedgerLines(note, 'below')" 
                   class="ledger-lines-container below"
                   :style="{
                     left: `${note.position * 50 - 10}px`
                   }">
                <div v-for="linePos in getLedgerLines(note, 'below')" 
                     :key="`below-${note.id}-${linePos}`"
                     class="ledger-line"
                     :style="{
                       top: `${linePos}px`,
                     width: '20px'
                   }">
              </div>
            </div>
            </template>
            
            <!-- Notes -->
            <div v-for="note in notes" 
                 :key="note.id"
                 class="note"
                 :class="{ 
                   'playing': note.id === currentPlayingNoteId,
                   'key-signature-affected': note.type === 'note' && 
                                            note.pitch && 
                                            !note.pitch.includes('#') && 
                                            !note.pitch.includes('b') && 
                                            isNoteAffectedByKeySignature(note.pitch.charAt(0)),
                   'dotted': note.dotted,
                   'whole-note': note.duration === 'whole'
                 }"
                 :style="getNoteStyle(note)"
                 :data-duration="note.duration"
                 @contextmenu.prevent="removeNote(note)"
                 @touchstart="handleTouchStart(note, $event)"
                 @touchend="handleTouchEnd"
                 @touchmove="handleTouchMove">
              
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
                <div v-if="note.duration !== 'whole'" 
                     class="stem" 
                     :class="[getStemDirection(note.pitch || ''), note.duration]">
                </div>
                
                <!-- Flag for eighth and sixteenth notes -->
                <div v-if="['eighth', 'sixteenth'].includes(note.duration)" 
                     class="flag" 
                     :class="[getStemDirection(note.pitch || ''), note.duration]">
                </div>
                
                <!-- Add dot for dotted notes -->
                <span v-if="note.dotted" class="dot">•</span>
              </template>
              
              <!-- Accidental -->
              <span v-if="note.type === 'note' && note.pitch && 
                          ((note.pitch.includes('#') || note.pitch.includes('b')) || 
                           isNoteAffectedByKeySignature(note.pitch.charAt(0)))" 
                    class="accidental">
                {{ note.pitch.includes('#') || note.pitch.includes('b') ? 
                     getAccidentalSymbol(note) : 
                     getAccidentalSymbolForKeySignature(getKeySignatureAccidentalForNote(note.pitch.charAt(0))) }}
              </span>
            </div>
            
            <!-- Chord symbols -->
            <div v-for="chord in chordSymbols" 
                 :key="chord.id"
                 class="chord-symbol"
                 :style="{
                   left: `${chord.position * 50}px`,
                   top: `${chord.top}px`
                 }">
              {{ formatChordName(chord.chordName) }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Scroll controls -->
      <div class="staff-scroll-controls">
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
    </div>

    <!-- Mobile-optimized note controls with tabs -->
    <div class="mobile-tabs">
      <button @click="activeTab = 'notes'" :class="['tab-btn', { active: activeTab === 'notes' }]">Notes</button>
      <button @click="activeTab = 'settings'" :class="['tab-btn', { active: activeTab === 'settings' }]">Settings</button>
      <button @click="activeTab = 'saved'" :class="['tab-btn', { active: activeTab === 'saved' }]">Saved</button>
    </div>

    <div v-if="activeTab === 'notes'" class="note-controls-container">
      <div class="note-controls">
        <!-- Use a grid layout for better organization on mobile -->
        <div class="note-controls-grid">
          <!-- First Row: Duration and Type -->
          <div class="control-section duration-section">
            <h4>Duration</h4>
            <div class="scrollable-buttons">
              <button v-for="duration in availableDurations" 
                      :key="duration.value"
                      @click="selectedDuration = duration.value"
                      :class="['note-btn', { active: selectedDuration === duration.value }]">
                {{ duration.label }}
              </button>
            </div>
            <div class="dotted-note-toggle">
              <button @click="toggleDottedNote" 
                      :class="['note-btn', { active: isDottedNote }]">
                Dotted
              </button>
            </div>
          </div>
          
          <div class="control-section type-section">
            <h4>Type</h4>
            <div class="button-group">
              <button @click="selectedNoteType = 'note'"
                      :class="['note-btn', { active: selectedNoteType === 'note' }]">
                Note
              </button>
              <button @click="selectedNoteType = 'rest'"
                      :class="['note-btn', { active: selectedNoteType === 'rest' }]">
                Rest
              </button>
            </div>
          </div>
          
          <!-- Second Row: Accidental and Octave -->
          <div class="control-section accidental-section">
            <h4>Accidental</h4>
            <div class="scrollable-buttons">
              <button v-for="accidental in availableAccidentals"
                      :key="accidental.value"
                      @click="selectedAccidental = accidental.value"
                      :class="['note-btn', { active: selectedAccidental === accidental.value }]">
                {{ accidental.label }}
              </button>
            </div>
          </div>
          
          <div class="control-section octave-section">
            <h4>Octave</h4>
            <div class="scrollable-buttons">
              <button v-for="octave in [2,3,4,5,6]"
                      :key="octave"
                      @click="selectedOctave = octave"
                      :class="['octave-btn', { active: selectedOctave === octave }]">
                {{ octave }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'settings'" class="settings-container">
      <!-- Key signature selector -->
      <div class="control-section">
        <h4>Key Signature</h4>
        <select id="key-signature" v-model="keySignature" @change="changeKeySignature(keySignature)">
          <option value="C">C Major (No sharps/flats)</option>
          <option value="G">G Major (1 sharp)</option>
          <option value="D">D Major (2 sharps)</option>
          <option value="A">A Major (3 sharps)</option>
          <option value="E">E Major (4 sharps)</option>
          <option value="B">B Major (5 sharps)</option>
          <option value="F#">F# Major (6 sharps)</option>
          <option value="C#">C# Major (7 sharps)</option>
          <option value="F">F Major (1 flat)</option>
          <option value="Bb">Bb Major (2 flats)</option>
          <option value="Eb">Eb Major (3 flats)</option>
          <option value="Ab">Ab Major (4 flats)</option>
          <option value="Db">Db Major (5 flats)</option>
          <option value="Gb">Gb Major (6 flats)</option>
          <option value="Cb">Cb Major (7 flats)</option>
        </select>
      </div>

      <!-- Chord controls -->
      <div class="control-section">
        <h4>Chords</h4>
        <div class="button-group">
          <button @click="showChordInput = true" class="chord-btn">Add Chord</button>
          <button @click="addExampleChords" class="chord-btn">Example Chords</button>
        </div>
      </div>

      <!-- Debug toggle -->
      <div class="control-section">
        <h4>Debug</h4>
        <button @click="toggleDebugMode" 
                :class="['note-btn', { active: debugMode }]">
          Debug Mode
        </button>
      </div>
    </div>

    <!-- Debug Panel -->
    <div v-if="debugMode" class="debug-panel">
      <h3>Debug Panel</h3>
      <div class="debug-controls">
        <div>
          <p>Show Note Positions:</p>
          <button @click="showNotePositions = !showNotePositions"
                  :class="['debug-btn', { active: showNotePositions }]">
            {{ showNotePositions ? 'Hide Pitches' : 'Show Pitches' }}
          </button>
        </div>
        <div>
          <p>Test All Notes:</p>
          <button @click="testAllNotes" class="debug-btn">
            Place All Notes on Staff
          </button>
        </div>
      </div>
      <p>Last Click Position: {{ lastClickY }}px</p>
      <p>Selected Octave: {{ selectedOctave }}</p>
      <p class="debug-hint">Use "Show Pitches" to see note names on the staff. Use "Test All Notes" to place all available notes on the staff.</p>
      
      <div>
        <h4>Ledger Lines Debug:</h4>
        <div v-for="note in notes" :key="`debug-${note.id}`">
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

    <!-- Add a panel for saved compositions -->
    <div v-if="activeTab === 'saved'" class="saved-compositions-container">
      <div class="control-section">
        <h4>Save Current Composition</h4>
        <div class="save-composition-form">
          <input 
            type="text" 
            v-model="compositionName" 
            placeholder="Enter a name for your composition" 
            class="composition-name-input"
          />
          <button @click="saveComposition" class="save-btn">Save</button>
        </div>
      </div>
      
      <div class="control-section">
        <h4>Your Saved Compositions</h4>
        <div v-if="savedCompositions.length === 0" class="no-saved-compositions">
          No saved compositions yet.
        </div>
        <div v-else class="saved-composition-list">
          <div v-for="comp in savedCompositions" :key="comp.id" class="saved-composition-item">
            <div class="composition-info">
              <!-- Show name or edit form based on edit state -->
              <template v-if="editingComposition === comp.id">
                <div class="edit-name-form">
                  <input 
                    type="text" 
                    v-model="editCompositionName" 
                    class="rename-input" 
                    @keyup.enter="saveRename(comp.id)"
                  />
                  <button @click="saveRename(comp.id)" class="save-rename-btn">Save</button>
                  <button @click="cancelRename" class="cancel-rename-btn">Cancel</button>
                </div>
              </template>
              <template v-else>
                <span class="composition-name">{{ comp.name }}</span>
                <span class="composition-date">{{ formatDate(comp.dateCreated) }}</span>
              </template>
            </div>
            <div class="composition-actions">
              <button @click="loadComposition(comp.id)" class="load-btn">Load</button>
              <!-- Show update button if the current composition matches -->
              <button 
                v-if="currentCompositionId === comp.id" 
                @click="updateComposition(comp.id)" 
                class="update-btn"
                title="Update this composition with current changes"
              >
                Update
              </button>
              <button @click="startRename(comp.id, comp.name)" class="load-btn" style="background-color: #9C27B0;">Rename</button>
              <button @click="deleteComposition(comp.id)" class="delete-btn">Delete</button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Add import/export buttons to the Saved tab -->
      <div class="import-export-controls">
        <button @click="exportAllCompositions" class="export-btn">Export All</button>
        <button @click="exportCurrentComposition" class="export-btn" :disabled="!currentCompositionId">Export Current</button>
        <label for="import-file" class="import-btn">Import</label>
        <input 
          type="file" 
          id="import-file" 
          accept=".txt,.json" 
          @change="importCompositions" 
          style="display: none;"
        />
      </div>
    </div>
  </div>
  <button @click="toggleDebugMonitor" style="position: fixed; bottom: 10px; left: 10px; z-index: 9999; background: #ff5722; color: white; border: none; padding: 5px 10px; border-radius: 4px;">
    Toggle Debug
  </button>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, reactive, watch } from 'vue';
import * as Tone from 'tone';
import { useNotationStore } from '@/stores/notation';

// Store
const notationStore = useNotationStore();

// State variables
const selectedHeight = ref('middle');
const selectedOctave = ref(4);
const selectedNoteType = ref('note');
const selectedAccidental = ref('natural');
const selectedDuration = ref('quarter');
const lastClickY = ref(0);
const tempo = ref(120);
const debugMode = ref(false);
const showNotePositions = ref(false);
const currentPlayingNoteId = ref<string | null>(null);
const selectedClef = ref('treble');

const staffGuideNotes = [
  'G5', 'F5', 'E5', 'D5', 'C5',
  'B4', 'A4', 'G4', 'F4', 'E4', 'D4',
  'C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3', 'B2', 'A2'
];

const availableDurations = [
  { value: 'whole', label: '𝅝' },
  { value: 'half', label: '𝅗𝅥' },
  { value: 'quarter', label: '♩' },
  { value: 'eighth', label: '♪' },
  { value: 'sixteenth', label: '♬' }
];

const availableAccidentals = [
  { value: 'natural', label: '♮' },
  { value: 'sharp', label: '♯' },
  { value: 'flat', label: '♭' }
];

// Add computed property for notes
const notes = computed(() => notationStore.notes);

// Create a piano-like synth for playback
const createPianoSynth = () => {
  return new Tone.Sampler({
    urls: {
      A1: "A1.mp3",
      A2: "A2.mp3",
      A3: "A3.mp3",
      A4: "A4.mp3",
      A5: "A5.mp3",
      A6: "A6.mp3",
      C1: "C1.mp3",
      C2: "C2.mp3",
      C3: "C3.mp3",
      C4: "C4.mp3",
      C5: "C5.mp3",
      C6: "C6.mp3",
      'D#1': "Ds1.mp3",
      'D#2': "Ds2.mp3",
      'D#3': "Ds3.mp3",
      'D#4': "Ds4.mp3",
      'D#5': "Ds5.mp3",
      'F#1': "Fs1.mp3",
      'F#2': "Fs2.mp3",
      'F#3': "Fs3.mp3",
      'F#4': "Fs4.mp3",
      'F#5': "Fs5.mp3"
    },
    release: 1,
    baseUrl: "https://tonejs.github.io/audio/salamander/",
  }).toDestination();
};

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
          release: 1,
          baseUrl: 'https://tonejs.github.io/audio/salamander/'
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
      staffElement.style.width = `${staffWidth.value}px`;
      console.log(`Staff width set to: ${staffWidth.value}px`);
    }
    
    // Add window resize listener
    window.addEventListener('resize', handleResize);
  } catch (error) {
    console.error('Error initializing Tone.js:', error);
    // Fallback to basic synth if piano samples fail to load
    if (!noteSynth) {
      noteSynth = new Tone.Synth().toDestination();
    }
  }
});

// Types
interface Note {
  id: string;
  type: 'note' | 'rest';
  pitch?: string;
  duration: string;
  position: number;
  verticalPosition: number;
  dotted?: boolean;
}

// Add new interface for chord symbols
interface ChordSymbol {
  id: string;
  position: number;
  chordName: string;
  top: number; // Position above staff
}

// Add chord symbols to the store
const chordSymbols = ref<ChordSymbol[]>([]);

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
const getKeySignaturePosition = (accidental: string) => {
  // Remove the accidental symbol to get the base note
  const note = accidental.charAt(0);
  
  // Map notes to their positions on the staff
  const positions: Record<string, number> = {
    // For sharps
    'F': 145, // F4 line
    'C': 115, // C5 line
    'G': 137.5, // G4 space
    'D': 160, // D4 line
    'A': 130, // A4 line
    'E': 152.5, // E4 space
    'B': 122.5, // B4 space
    
    // For flats (positions would be different)
    'B': 122.5, // B4 space
    'E': 152.5, // E4 space
    'A': 130, // A4 line
    'D': 160, // D4 line
    'G': 137.5, // G4 space
    'C': 115, // C5 line
    'F': 145  // F4 line
  };
  
  return positions[note] || 0;
};

// Function to get the horizontal position of a key signature accidental
const getKeySignatureXPosition = (index: number) => {
  // Start after the clef, space them evenly
  return 60 + (index * 15);
};

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

const showLedgerLinesForNote = (pitch: string, position: number) => {
  // Get the base note without accidentals
  const octave = parseInt(pitch.slice(-1));
  const note = pitch.slice(0, -1).replace(/[#b]/, '');
  const baseNote = `${note}${octave}`;
  
  // Define the staff range
  const aboveStaff = ['F5', 'G5', 'A5', 'B5', 'C6', 'D6', 'E6', 'F6', 'G6', 'A6', 'B6'];
  const belowStaff = ['D3', 'C3', 'B2', 'A2', 'G2', 'F2', 'E2', 'D2', 'C2'];
  
  // Find all ledger line elements
  const ledgerLinesAbove = document.querySelectorAll('.ledger-line.above');
  const ledgerLinesBelow = document.querySelectorAll('.ledger-line.below');
  
  // Reset all ledger lines
  ledgerLinesAbove.forEach(line => (line as HTMLElement).style.display = 'none');
  ledgerLinesBelow.forEach(line => (line as HTMLElement).style.display = 'none');
  
  // Show appropriate ledger lines based on the note
  if (aboveStaff.includes(baseNote)) {
    const index = aboveStaff.indexOf(baseNote);
    const linesNeeded = Math.floor(index / 2) + 1;
    
    for (let i = 0; i < linesNeeded && i < ledgerLinesAbove.length; i++) {
      const line = ledgerLinesAbove[i] as HTMLElement;
      line.style.display = 'block';
      line.style.left = `${position * 50}px`;
      line.style.width = '20px';
    }
  } else if (belowStaff.includes(baseNote)) {
    const index = belowStaff.indexOf(baseNote);
    const linesNeeded = Math.floor(index / 2) + 1;
    
    for (let i = 0; i < linesNeeded && i < ledgerLinesBelow.length; i++) {
      const line = ledgerLinesBelow[i] as HTMLElement;
      line.style.display = 'block';
      line.style.left = `${position * 50}px`;
      line.style.width = '20px';
    }
  }
};

// Add this new function
const selectNoteHeight = (height: 'high' | 'middle' | 'low') => {
  selectedHeight.value = height;
  switch (height) {
    case 'high':
      selectedOctave.value = 5;
      break;
    case 'middle':
      selectedOctave.value = 4;
      break;
    case 'low':
      selectedOctave.value = 3;
      break;
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

// Add this function to get the modified pitch based on key signature
const getModifiedPitchForKeySignature = (pitch: string) => {
  // If the pitch already has an accidental, don't modify it
  if (pitch.includes('#') || pitch.includes('b')) {
    return pitch;
  }
  
  const noteName = pitch.charAt(0);
  const octave = pitch.slice(-1);
  
  // Check if this note is affected by the key signature
  for (const accidental of currentKeySignatureAccidentals.value) {
    if (accidental.startsWith(noteName)) {
      // Apply the key signature accidental
      if (accidental.includes('#')) {
        return `${noteName}#${octave}`;
      } else if (accidental.includes('b')) {
        return `${noteName}b${octave}`;
      }
    }
  }
  
  return pitch;
};

// Refine the playNoteSound function for robustness
const playNoteSound = async (pitch: string, duration: string = "8n", isDotted: boolean = false) => {
  let pitchToPlay = pitch; // Define pitchToPlay outside try block
  let noteDuration = duration; // Define noteDuration outside try block

  try {
    // Start Tone.js context (this requires user interaction)
    await startToneJs();
    
    // Make sure Tone.js is started
    await Tone.start();
    
    // Apply key signature if needed
    if (!pitchToPlay.includes('#') && !pitchToPlay.includes('b')) {
      pitchToPlay = getModifiedPitchForKeySignature(pitchToPlay);
    }
    
    // Calculate the actual duration in seconds first for reliability
    const baseDurationMap: Record<string, number> = {
      "1n": 4 * (60 / tempo.value), // Whole note duration based on tempo
      "2n": 2 * (60 / tempo.value), // Half note
      "4n": 1 * (60 / tempo.value), // Quarter note (1 beat)
      "8n": 0.5 * (60 / tempo.value), // Eighth note
      "16n": 0.25 * (60 / tempo.value) // Sixteenth note
    };

    let durationInSeconds = baseDurationMap[duration] || (60 / tempo.value); // Default to quarter note duration if invalid

    if (isDotted) {
      durationInSeconds *= 1.5;
    }

    // Ensure duration is a positive number
    if (durationInSeconds <= 0) {
      console.warn(`Calculated invalid duration (${durationInSeconds}s), defaulting to 0.5s`);
      durationInSeconds = 0.5;
    }

    // Convert seconds to Tone.js compatible time string (e.g., "1.5s")
    noteDuration = `${durationInSeconds}s`;

    // Ensure pitch is valid
    if (!pitchToPlay) {
        console.warn("Invalid pitch provided, cannot play note.");
        return; // Exit if pitch is invalid
    }

    // Use the piano synth to play the note if available, otherwise use basic synth
    if (pianoSynth && pianoSynth.loaded) {
      pianoSynth.triggerAttackRelease(pitchToPlay, noteDuration);
    } else if (noteSynth) {
      noteSynth.triggerAttackRelease(pitchToPlay, noteDuration);
    } else {
      console.warn("No synthesizer available to play notes");
    }
  } catch (error) {
    console.error(`Error playing note (${pitchToPlay}, ${noteDuration}):`, error);
    // Try fallback to basic synth, ensuring variables are defined
  if (noteSynth) {
      try {
        // Use the already defined pitchToPlay and noteDuration from the outer scope
        // Add extra checks for safety
        const safePitch = pitchToPlay || 'C4';
        const safeDuration = noteDuration || '0.5s'; // Use calculated duration or a default
        console.log(`Fallback synth playing: ${safePitch}, ${safeDuration}`);
        noteSynth.triggerAttackRelease(safePitch, safeDuration);
      } catch (fallbackError) {
        console.error("Fallback synth also failed:", fallbackError);
      }
    }
  }
};

// Ensure playComposition uses the correct duration mapping for playNoteSound
const playComposition = async () => {
  if (isPlaying.value) {
    // If already playing, stop first
    stopPlayback();
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to ensure everything is stopped
  }
  
  // Make sure we have notes to play
  if (notes.value.length === 0) {
    alert('No notes to play');
    return;
  }
  
  console.log(`Starting playback with ${notes.value.length} notes`);
  
  // Start Tone.js context (this requires user interaction)
  await startToneJs();
  
  isPlaying.value = true;
  
  // Sort notes by position for proper playback order
  const sortedNotes = [...notes.value].sort((a, b) => a.position - b.position);
  
  // Initialize array to track timeout IDs for cleanup
  if (!window.playbackTimeouts) window.playbackTimeouts = [];
  window.playbackTimeouts = [];
  
  // Clear any existing timeouts
  window.playbackTimeouts.forEach(id => clearTimeout(id));
  window.playbackTimeouts = [];
  
  // Play notes in sequence with proper timing
  let totalDelay = 0;
  
  for (const note of sortedNotes) {
    // console.log(`Scheduling ${note.pitch || 'rest'} at position ${note.position}`);
    
    // Calculate delay for this note
    const secondsPerBeat = 60 / tempo.value;
    
    // Map durations to relative lengths
    const durationMap = {
      'whole': 4,
      'half': 2,
      'quarter': 1,
      'eighth': 0.5,
      'sixteenth': 0.25
    };
    
    // Map durations to Tone.js format
    const toneDurationMap = {
      'whole': '1n',
      'half': '2n',
      'quarter': '4n',
      'eighth': '8n',
      'sixteenth': '16n'
    };
    
    // Calculate the wait duration in seconds
    let waitDurationSeconds = (durationMap[note.duration] || 1) * secondsPerBeat;
    if (note.dotted) {
      waitDurationSeconds *= 1.5;
    }
    
    // Function to play this note at the right time
    const playNoteWithDelay = (noteToPlay, delay) => {
      const timeoutId = setTimeout(() => {
        currentPlayingNoteId.value = noteToPlay.id;
        
        if (noteToPlay.type === 'note' && noteToPlay.pitch) {
          // Play the note using the Tone.js duration format ('4n', '8n', etc.)
          const toneDuration = toneDurationMap[noteToPlay.duration] || '4n';
          playNoteSound(noteToPlay.pitch, toneDuration, noteToPlay.dotted);
        }
        
        // Schedule the end of this note
        const noteEndTimeoutId = setTimeout(() => {
          if (currentPlayingNoteId.value === noteToPlay.id) {
            currentPlayingNoteId.value = null;
          }
        }, waitDurationSeconds * 1000);
        
        window.playbackTimeouts.push(noteEndTimeoutId);
      }, delay);
      
      window.playbackTimeouts.push(timeoutId);
    };
    
    // Schedule this note
    playNoteWithDelay(note, totalDelay * 1000);
    totalDelay += waitDurationSeconds;
  }
  
  // Stop playing after all notes have played
  const finalTimeoutId = setTimeout(() => {
    isPlaying.value = false;
    currentPlayingNoteId.value = null;
    console.log('Playback complete');
  }, totalDelay * 1000 + 100); // Add a small buffer
  
  window.playbackTimeouts.push(finalTimeoutId);
};

// Add this new function to adjust the pitch for playback
const adjustPitchForPlayback = (pitch: string) => {
  // Extract the note name and octave
  const noteName = pitch.replace(/[0-9]/g, '');
  const octave = parseInt(pitch.match(/[0-9]/)?.[0] || '4');
  
  // Define the note sequence
  const noteSequence = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  // Find the current note index
  let noteIndex = noteSequence.indexOf(noteName);
  if (noteIndex === -1) {
    // Handle flats by converting to equivalent sharps
    const flatToSharp: Record<string, string> = {
      'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#',
      'Cb': 'B', 'Fb': 'E'
    };
    
    // Check if we have a flat note and convert it
    for (const [flat, sharp] of Object.entries(flatToSharp)) {
      if (noteName === flat) {
        noteIndex = noteSequence.indexOf(sharp);
        break;
      }
    }
    
    // If still not found, return the original pitch
    if (noteIndex === -1) return pitch;
  }
  
  // Adjust down by a half step (semitone)
  noteIndex = (noteIndex - 1 + 12) % 12;
  let newOctave = octave;
  
  // Handle octave change if needed - only for B going to C
  if (noteName === 'C') {
    newOctave = octave - 1;
  }
  
  return noteSequence[noteIndex] + newOctave;
};

// Update the existing handleStaffClick function to include the dotted property
const handleStaffClick = (event: MouseEvent) => {
  // If we were dragging, don't add a note
  if (isDragging.value) {
    return;
  }
  
  // Get the click position relative to the staff
  const staffRect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const x = event.clientX - staffRect.left;
  const y = event.clientY - staffRect.top;
  
  console.log(`Staff click at x=${x}, y=${y}`);
  
  // Calculate the position in the staff (horizontal)
  const position = Math.floor(x / 50) + 0.5; // Center the note in the grid
  
  // Check if there's already a note at this position
  const existingNoteIndex = notes.value.findIndex(note => 
    Math.abs(note.position - position) < 0.1 // Allow for small rounding differences
  );
  
  // Calculate the vertical position to determine the pitch
  const verticalPosition = Math.round((y - 100) / 7.5) * 7.5 + 100;
  
  // Map the vertical position to a pitch
  const pitch = mapPositionToPitch(verticalPosition);
  
  // If there's already a note at this position, replace it
  if (existingNoteIndex !== -1) {
    const existingNote = notes.value[existingNoteIndex];
    
    // Only update if we have a valid pitch or it's a rest
    if (pitch || selectedNoteType.value === 'rest') {
      // Create the updated note
      const updatedNote = {
        ...existingNote,
        type: selectedNoteType.value,
        verticalPosition,
        duration: selectedDuration.value,
        dotted: isDottedNote.value, // Add the dotted property
        pitch: selectedNoteType.value === 'note' ? 
          applyAccidental(pitch || 'C4', selectedAccidental.value) : undefined
      };
      
      // Replace the note in the array
      notes.value.splice(existingNoteIndex, 1, updatedNote);
      
      // Play the note sound with correct duration
      if (selectedNoteType.value === 'note' && pitch) {
        const durationMap = {
          'whole': '1n',
          'half': '2n',
          'quarter': '4n',
          'eighth': '8n',
          'sixteenth': '16n'
        };
        playNoteSound(updatedNote.pitch || '', durationMap[updatedNote.duration], updatedNote.dotted);
      }
      
      console.log(`Updated note at position ${position}, pitch: ${updatedNote.pitch || 'rest'}, dotted: ${updatedNote.dotted}`);
    }
    
    return;
  }
  
  // If we get here, there's no existing note at this position
  // Only add a note if we have a valid pitch or it's a rest
  if (pitch || selectedNoteType.value === 'rest') {
    // Create a new note
    const newNote = {
      id: Date.now().toString(),
      type: selectedNoteType.value,
      position,
      verticalPosition,
      duration: selectedDuration.value,
      dotted: isDottedNote.value, // Add the dotted property
      pitch: selectedNoteType.value === 'note' ? 
        applyAccidental(pitch || 'C4', selectedAccidental.value) : undefined
    };
    
    // Add the note to the score
    notes.value.push(newNote);
    
    // Play the note sound with correct duration
    if (selectedNoteType.value === 'note' && pitch) {
      const durationMap = {
        'whole': '1n',
        'half': '2n',
        'quarter': '4n',
        'eighth': '8n',
        'sixteenth': '16n'
      };
      playNoteSound(newNote.pitch || '', durationMap[newNote.duration], newNote.dotted);
    }
    
    console.log(`Added ${selectedNoteType.value} at position ${position}, pitch: ${newNote.pitch || 'rest'}, dotted: ${newNote.dotted}`);
  }
};

const toggleDebugMode = () => {
  debugMode.value = !debugMode.value;
};

// Update the testAllNotes function to use the correct pitches
const testAllNotes = () => {
  // Clear existing notes
  notationStore.clearNotes();
  
  // Define the balanced range of notes based on selected clef
  let testNotes;
  
  if (selectedClef.value === 'treble') {
    testNotes = [
    // Higher notes (with ledger lines)
      'A5', 'G5',
    
    // Staff notes
      'F5', 'E5', 'D5', 'C5', 'B4', 'A4', 'G4', 'F4', 'E4',
    
    // Lower notes (with ledger lines)
      'D4', 'C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3'
    ];
  } else {
    testNotes = [
      // Higher notes (with ledger lines)
      'C4', 'B3',
      
      // Staff notes
      'A3', 'G3', 'F3', 'E3', 'D3', 'C3', 'B2', 'A2', 'G2',
      
      // Lower notes (with ledger lines)
      'F2', 'E2', 'D2', 'C2', 'B1', 'A1', 'G1', 'F1', 'E1'
    ];
  }
  
  // Place each note on the staff
  testNotes.forEach((pitch, index) => {
    notationStore.addNote({
      id: `test-${index}`,
      type: 'note',
      pitch,
      duration: 'quarter',
      position: index + 1 // Space them out horizontally
    });
  });
};

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
const getNoteSymbol = (note: Note) => {
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

// Update the getNoteStyle function to adjust positioning based on stem direction
const getNoteStyle = (note: Note) => {
  if (note.type === 'rest') {
    return {
      left: `${note.position * 50}px`,
      top: '130px' // Center rests on the staff
    };
  }
  
  if (!note.pitch) return {};
  
  const position = getPitchPosition(note.pitch);
  const stemDirection = getStemDirection(note.pitch);
  
  // Adjust vertical position slightly based on stem direction for better alignment
  const verticalAdjustment = stemDirection === 'up' ? 0 : -2;
  
  return {
    left: `${note.position * 50}px`,
    top: `${position + verticalAdjustment}px`
  };
};

// Add the isPlaying ref
const isPlaying = ref(false);

// Add a function to auto-scroll to the currently playing note
const autoScrollToNote = (note) => {
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

// Add a function to update the staff scroll position
const updateStaffScroll = () => {
  const staffElement = document.querySelector('.staff');
  if (staffElement) {
    staffElement.style.transform = `translateX(-${scrollPosition.value}px)`;
  }
};

// Update the stopPlayback function to use the isPlaying ref
const stopPlayback = () => {
  isPlaying.value = false;
  currentPlayingNoteId.value = null;
  
  // Cancel any scheduled note playback
  if (window.playbackTimeouts) {
    window.playbackTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    window.playbackTimeouts = [];
  }
  
  // Stop Tone.js Transport if it's running
  try {
    Tone.Transport.stop();
    Tone.Transport.cancel(0);
  } catch (e) {
    console.error('Error stopping Tone.Transport:', e);
  }
  
  // Use triggerRelease instead of releaseAll for noteSynth
  if (noteSynth) {
    try {
      noteSynth.triggerRelease(); // This is the correct method for basic Tone.Synth
    } catch (e) {
      console.error('Error stopping synth:', e);
    }
  }
  
  if (pianoSynth) {
    try {
      pianoSynth.releaseAll();
    } catch (e) {
      console.error('Error stopping piano sampler:', e);
    }
  }
  
  console.log('Playback stopped and all scheduled notes cleared');
};

const clearScore = () => {
  notationStore.clearNotes();
  chordSymbols.value = []; // Clear chord symbols too
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

// Add a chord to the score
const addChordToScore = () => {
  if (chordName.value.trim()) {
    chordSymbols.value.push({
      id: Date.now().toString(),
      position: chordInputPosition.value,
      chordName: chordName.value,
      top: 70 // Position above the staff
    });
    chordName.value = '';
    showChordInput.value = false;
  }
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

// Handle staff click for chord placement
const handleChordPlacement = (event: MouseEvent) => {
  if (!showChordInput.value) return;
  
  const staffRect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const x = event.clientX - staffRect.left;
  chordInputPosition.value = Math.floor(x / 50);
  
  // Position the chord input modal near the click
  const chordModal = document.querySelector('.chord-input-modal') as HTMLElement;
  if (chordModal) {
    chordModal.style.left = `${x}px`;
    chordModal.style.top = '40px';
  }
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

// Computed properties for staff dimensions
const staffWidth = computed(() => {
  return measuresCount.value * measureWidthPx.value;
});
const measureWidth = computed(() => measureWidthPx.value);
const visibleStaffWidth = ref(800); // Width visible in the viewport
const scrollPosition = ref(0); // Horizontal scroll position

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
      staffElement.style.width = `${staffWidth.value}px`;
      
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
    staffElement.style.transform = `translateX(-${scrollPosition.value}px)`;
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
const convertPitchToToneFormat = (pitch: string) => {
  // First, apply key signature if needed
  let modifiedPitch = pitch;
  
  // If the note doesn't have an explicit accidental, check key signature
  if (!modifiedPitch.includes('#') && !modifiedPitch.includes('b')) {
    modifiedPitch = getModifiedPitchForKeySignature(modifiedPitch);
  }
  
  return modifiedPitch;
};

// Add back the getAccidentalSymbol function
const getAccidentalSymbol = (note: Note) => {
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
});

// Add the mapPositionToPitch function
const mapPositionToPitch = (verticalPosition: number): string | null => {
  // Define positions based on selected clef
  const positions: Record<number, string> = {};
  
  if (selectedClef.value === 'treble') { // Use .value for the ref
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

// Add the applyAccidental function
const applyAccidental = (pitch: string, accidental: string): string => {
  if (!pitch) return '';
  
  // Extract the note letter and octave
  const noteLetter = pitch.charAt(0);
  const octave = pitch.charAt(pitch.length - 1);
  
  // Apply the accidental
  switch (accidental) {
    case 'sharp':
      return `${noteLetter}#${octave}`;
    case 'flat':
      return `${noteLetter}b${octave}`;
    case 'natural':
    default:
      // Remove any existing accidentals
      return `${noteLetter}${octave}`;
  }
};

// Add a dotted note toggle button to the Duration section
const isDottedNote = ref(false);
const toggleDottedNote = () => {
  isDottedNote.value = !isDottedNote.value;
};

// Add a function to remove a note
const removeNote = (noteToRemove: Note) => {
  const index = notes.value.findIndex(note => note.id === noteToRemove.id);
  if (index !== -1) {
    notes.value.splice(index, 1);
  }
};

// Add these variables for touch handling
const touchTimer = ref<number | null>(null);
const touchStartPos = ref({ x: 0, y: 0 });
const isTouching = ref(false);

// Add these functions to handle touch events
const handleTouchStart = (note: Note, event: TouchEvent) => {
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
  notes: Note[];
  tempo: number;
  clef: string;
  keySignature: string;
  staffWidth: number;
  selectedDuration: string;
  selectedNoteType: string;
  selectedAccidental: string;
  selectedOctave: number;
  isDottedNote: boolean;
}

// Update the savedCompositions ref to use this type
const savedCompositions = ref<SavedComposition[]>([]);

// Improve saveComposition to store all state
const saveComposition = () => {
  if (!compositionName.value.trim()) {
    alert('Please enter a name for your composition');
    return;
  }
  
  console.log('Saving notes:', notes.value);
  
  // Create deep copies of notes to ensure all properties are preserved
  const notesToSave = notes.value.map(note => ({
    id: note.id,
    type: note.type,
    position: note.position,
    verticalPosition: note.verticalPosition !== undefined ? note.verticalPosition : 0,
    duration: note.duration,
    dotted: note.dotted !== undefined ? note.dotted : false,
    pitch: note.pitch
  }));
  
  const newComposition: SavedComposition = {
    id: Date.now().toString(),
    name: compositionName.value.trim(),
    dateCreated: Date.now(),
    notes: notesToSave,
    tempo: tempo.value,
    clef: selectedClef.value,
    keySignature: keySignature.value,
    staffWidth: staffWidth.value,
    selectedDuration: selectedDuration.value,
    selectedNoteType: selectedNoteType.value,
    selectedAccidental: selectedAccidental.value,
    selectedOctave: selectedOctave.value,
    isDottedNote: isDottedNote.value
  };
  
  // Log the composition to debug
  console.log('Saving composition:', newComposition);
  
  savedCompositions.value.push(newComposition);
  saveToLocalStorage();
  
  // Reset the input
  compositionName.value = '';
  
  alert('Composition saved successfully!');
};

// First, let's check if notes is a computed property or a ref
// Add a function to safely update notes if it's a computed property
const updateNotes = (newNotes) => {
  // If notes is a computed property with a setter, this should work
  // If it's a ref, this will also work fine
  
  try {
    // Try direct assignment first (for writable refs)
    notes.value = newNotes;
    console.log('Notes updated through direct assignment');
  } catch (error) {
    console.error('Error updating notes directly:', error);
    
    // If direct assignment fails, try alternative methods:
    
    // Method 1: If using a store, use the store's methods
    try {
      const notationStore = useNotationStore();
      notationStore.setNotes(newNotes);
      console.log('Notes updated through store');
      return;
    } catch (storeError) {
      console.error('Error updating notes through store:', storeError);
    }
    
    // Method 2: If notes is managed through a different ref, find and use that
    try {
      // Clear existing notes and add new ones
      while (notes.value.length > 0) {
        notes.value.pop();
      }
      
      // Add new notes one by one (this avoids replacing the entire array)
      newNotes.forEach(note => {
        notes.value.push(note);
      });
      
      console.log('Notes updated through array manipulation');
    } catch (arrayError) {
      console.error('Error updating notes through array manipulation:', arrayError);
      
      // Last resort - alert the user that loading failed
      alert('Failed to load notes. Please try again or reload the application.');
    }
  }
};

// Improve the clearStaffCompletely function to forcefully clear everything
const clearStaffCompletely = async () => {
  console.log('Clearing staff completely...');
  
  // Stop any playback first
  stopPlayback();
  
  // Store the current length for debugging
  const originalLength = notes.value.length;
  
  // First, mark all existing notes for removal (helps with debugging)
  document.querySelectorAll('.note').forEach(noteElement => {
    noteElement.classList.add('to-be-removed');
    noteElement.style.opacity = '0.3'; // Visual indicator that these will be removed
  });
  
  // Create a fresh empty array for notes (this ensures no references to old notes remain)
  const emptyArray = [];
  notes.value = emptyArray;
  
  // Wait for Vue to update
  await nextTick();
  
  // Force manual DOM cleanup if needed
  document.querySelectorAll('.note.to-be-removed').forEach(noteElement => {
    if (noteElement.parentNode) {
      noteElement.parentNode.removeChild(noteElement);
    }
  });
  
  console.log(`Staff cleared: removed ${originalLength} notes, current length: ${notes.value.length}`);
  
  // Reset scroll position to beginning
  scrollPosition.value = 0;
  
  // Reset the DOM transform to avoid ghost notes
  const staffElement = document.querySelector('.staff');
  if (staffElement) {
    staffElement.style.transform = 'translateX(0px)';
  }
  
  // Force garbage collection if possible
  if (window.gc) window.gc();
  
  return new Promise(resolve => setTimeout(resolve, 50)); // Give the browser time to update
};

// Add this CSS to help with the force redraw
// Add this inside the <style> section:
/*
.force-redraw {
  animation: flash 0.1s;
}

@keyframes flash {
  0% { opacity: 0.9; }
  100% { opacity: 1; }
}
*/

// Add a function to completely reset the audio system
const resetAudioSystem = async () => {
  console.log('Completely resetting audio system...');
  
  // Stop any ongoing playback
  stopPlayback();
  
  // First, release and dispose all current audio nodes
  if (noteSynth) {
    try {
      noteSynth.releaseAll();
      noteSynth.dispose();
      noteSynth = null;
    } catch (e) {
      console.error('Error disposing noteSynth:', e);
    }
  }
  
  if (pianoSynth) {
    try {
      pianoSynth.releaseAll();
      pianoSynth.dispose();
      pianoSynth = null;
    } catch (e) {
      console.error('Error disposing pianoSynth:', e);
    }
  }
  
  // Clear all scheduled events
  try {
    Tone.Transport.cancel(0);
    Tone.Transport.stop();
  } catch (e) {
    console.error('Error clearing Tone.Transport:', e);
  }
  
  // Clear any timeouts
  if (window.playbackTimeouts) {
    window.playbackTimeouts.forEach(id => clearTimeout(id));
    window.playbackTimeouts = [];
  }
  
  // Re-initialize the audio context if possible
  try {
    await Tone.start();
    Tone.context.resume();
  } catch (e) {
    console.log('Could not restart Tone context (may need user interaction):', e);
  }
  
  // Recreate the synthesizers
  try {
    noteSynth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 }
    }).toDestination();
    
    pianoSynth = new Tone.Sampler({
      urls: {
        'C4': 'C4.mp3',
        'D#4': 'Ds4.mp3',
        'F#4': 'Fs4.mp3',
        'A4': 'A4.mp3',
      },
      baseUrl: 'https://tonejs.github.io/audio/salamander/'
    }).toDestination();
    
    console.log('Audio system reset complete, new synths created');
  } catch (e) {
    console.error('Error recreating synths:', e);
  }
};

// Update the loadComposition function to use the resetAudioSystem
const loadComposition = async (id: string) => {
  const composition = savedCompositions.value.find(comp => comp.id === id);
  if (!composition) {
    console.error('Composition not found:', id);
    return;
  }
  
  // Store the current composition ID
  currentCompositionId.value = id;
  console.log('Loading composition:', composition);
  
  // Confirm before loading and overwriting current composition
  if (notes.value.length > 0) {
    if (!confirm('Loading this composition will replace your current work. Continue?')) {
      return;
    }
  }
  
  try {
    // Stop any playback
    stopPlayback();
    
    // Force notes array reset - this is the most important part
    await forceResetNotesArray();
    
    // Give the browser time to process changes
    await new Promise(resolve => setTimeout(resolve, 200));
    
    console.log('Notes array completely reset, now loading new notes...');
    
    // Create proper Note objects from the saved data
    const loadedNotes = composition.notes.map(note => {
      return {
        id: note.id || Date.now().toString(),
        type: note.type || 'note',
        position: note.position || 0,
        verticalPosition: note.verticalPosition !== undefined ? note.verticalPosition : 0,
        duration: note.duration || 'quarter',
        dotted: note.dotted !== undefined ? note.dotted : false,
        pitch: note.pitch
      };
    });
    
    // Wait for another tick before adding notes
    await nextTick();
    
    // Add the notes individually
    for (const note of loadedNotes) {
      notes.value.push(note);
      await nextTick();
    }
    
    // Set properties from the composition
    try {
      tempo.value = composition.tempo || 120;
      selectedClef.value = composition.clef || 'treble';
      keySignature.value = composition.keySignature || 'C';
    } catch (e) {
      console.warn('Error updating some properties:', e);
    }
    
    // Force update of staff display
    updateStaffDisplay();
    
    console.log('Composition loaded successfully with', notes.value.length, 'notes');
    
    // Switch to notes tab
    activeTab.value = 'notes';
    
    alert('Composition loaded successfully!');
  } catch (error) {
    console.error('Error loading composition:', error);
    alert('Error loading composition: ' + error.message);
  }
};

// Update updateStaffDisplay to accept an optional width parameter
const updateStaffDisplay = async (width?: number) => {
  // Use nextTick to ensure Vue has updated the DOM
  await nextTick();
  
  // Update staff width if specified
  const staffElement = document.querySelector('.staff');
  if (staffElement) {
    // Use the provided width or the current staffWidth.value
    const displayWidth = width || staffWidth.value;
    staffElement.style.width = `${displayWidth}px`;
    console.log(`Set staff width to ${displayWidth}px`);
  } else {
    console.warn('Staff element not found');
  }
  
  // Force redraw of each note
  notes.value.forEach((note, index) => {
    console.log(`Verifying note ${index} display:`, note);
    
    // Check if note elements exist and are visible
    const noteElement = document.querySelector(`.note[data-id="${note.id}"]`);
    if (!noteElement) {
      console.warn(`Note element for ${note.id} not found in DOM`);
    }
  });
  
  // Update staff scroll position to show notes if they're off-screen
  if (notes.value.length > 0) {
    // Find the first note position
    const firstNotePosition = Math.min(...notes.value.map(note => note.position));
    const xPos = firstNotePosition * 50;
    
    // Scroll to show this position
    if (xPos > 0) {
      scrollPosition.value = Math.max(0, xPos - 100);
      console.log(`Set scroll position to ${scrollPosition.value}`);
    } else {
      scrollPosition.value = 0;
    }
    
    // Apply the scroll position
    const staffElement = document.querySelector('.staff');
    if (staffElement) {
      staffElement.style.transform = `translateX(-${scrollPosition.value}px)`;
    }
  }
  
  console.log('Staff updated, notes:', notes.value);
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

// Add a watch function to detect when notes change
watch(notes, (newNotes) => {
  console.log('Notes array changed:', newNotes);
}, { deep: true });

// Add variables for tracking the current composition and renaming state
const currentCompositionId = ref('');
const editingComposition = ref('');
const editCompositionName = ref('');

// Add a function to update an existing composition
const updateComposition = (id: string) => {
  if (!confirm('Are you sure you want to update this saved composition with your current changes?')) {
    return;
  }
  
  const composition = savedCompositions.value.find(comp => comp.id === id);
  if (!composition) {
    console.error('Composition not found:', id);
    return;
  }
  
  console.log('Updating composition:', composition);
  
  // Create deep copies of notes to ensure all properties are preserved
  const notesToSave = notes.value.map(note => ({
    id: note.id,
    type: note.type,
    position: note.position,
    verticalPosition: note.verticalPosition !== undefined ? note.verticalPosition : 0,
    duration: note.duration,
    dotted: note.dotted !== undefined ? note.dotted : false,
    pitch: note.pitch
  }));
  
  // Update the composition with current state
  composition.notes = notesToSave;
  composition.tempo = tempo.value;
  composition.clef = selectedClef.value;
  composition.keySignature = keySignature.value;
  composition.staffWidth = staffWidth.value;
  composition.selectedDuration = selectedDuration.value;
  composition.selectedNoteType = selectedNoteType.value;
  composition.selectedAccidental = selectedAccidental.value;
  composition.selectedOctave = selectedOctave.value;
  composition.isDottedNote = isDottedNote.value;
  
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
const exportAllCompositions = () => {
  try {
    // Create a JSON string of all compositions
    const dataToExport = JSON.stringify(savedCompositions.value, null, 2);
    
    // Create a Blob with the data
    const blob = new Blob([dataToExport], { type: 'text/plain' });
    
    // Create a download link
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `music-notation-all-compositions-${new Date().toISOString().slice(0, 10)}.txt`;
    
    // Trigger the download
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    
    console.log('All compositions exported successfully');
  } catch (error) {
    console.error('Error exporting compositions:', error);
    alert('Error exporting compositions: ' + error.message);
  }
};

const exportCurrentComposition = () => {
  if (!currentCompositionId.value) {
    alert('No composition is currently loaded');
    return;
  }
  
  try {
    // Find the current composition
    const composition = savedCompositions.value.find(comp => comp.id === currentCompositionId.value);
    if (!composition) {
      throw new Error('Current composition not found');
    }
    
    // Create a JSON string of the composition
    const dataToExport = JSON.stringify(composition, null, 2);
    
    // Create a Blob with the data
    const blob = new Blob([dataToExport], { type: 'text/plain' });
    
    // Create a download link
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `music-notation-${composition.name.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.txt`;
    
    // Trigger the download
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    
    console.log('Composition exported successfully');
  } catch (error) {
    console.error('Error exporting composition:', error);
    alert('Error exporting composition: ' + error.message);
  }
};

const importCompositions = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  
  reader.onload = (e) => {
    try {
      // Parse the JSON data
      const importedData = JSON.parse(e.target.result);
      
      // Check if it's an array (multiple compositions) or a single composition
      if (Array.isArray(importedData)) {
        // Ask for confirmation if there are existing compositions
        if (savedCompositions.value.length > 0) {
          if (!confirm(`Import ${importedData.length} compositions? This will merge with your existing compositions.`)) {
            return;
          }
        }
        
        // Validate and add each composition
        let importCount = 0;
        for (const comp of importedData) {
          if (validateComposition(comp)) {
            // Generate a new ID to avoid conflicts
            const newId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
            savedCompositions.value.push({
              ...comp,
              id: newId,
              dateCreated: comp.dateCreated || Date.now()
            });
            importCount++;
          }
        }
        
        if (importCount > 0) {
          saveToLocalStorage();
          alert(`Successfully imported ${importCount} compositions`);
        } else {
          alert('No valid compositions found in the import file');
        }
      } else if (validateComposition(importedData)) {
        // It's a single composition - confirm import
        if (!confirm(`Import composition "${importedData.name || 'Unnamed'}"?`)) {
          return;
        }
        
        // Generate a new ID to avoid conflicts
        const newId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
        savedCompositions.value.push({
          ...importedData,
          id: newId,
          dateCreated: importedData.dateCreated || Date.now()
        });
        
        saveToLocalStorage();
        alert('Composition imported successfully');
      } else {
        alert('Invalid composition format');
      }
    } catch (error) {
      console.error('Error importing compositions:', error);
      alert('Error importing file: ' + error.message);
    }
    
    // Reset the file input
    event.target.value = '';
  };
  
  reader.onerror = () => {
    alert('Error reading file');
    event.target.value = '';
  };
  
  reader.readAsText(file);
};

// Helper function to validate a composition object
const validateComposition = (comp) => {
  // Check required fields
  if (!comp || typeof comp !== 'object') return false;
  if (!comp.name || typeof comp.name !== 'string') return false;
  if (!Array.isArray(comp.notes)) return false;
  
  // Basic check for notes format
  for (const note of comp.notes) {
    if (!note.id || !note.type || !note.position) {
      return false;
    }
  }
  
  return true;
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
</script>

<style scoped>
/* Mobile-first styles with better responsiveness */
.notation-editor {
  max-width: 100%;
  padding: 10px;
  overflow-x: hidden;
  box-sizing: border-box;
}

/* Responsive controls */
.controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 15px;
  width: 100%;
}

.controls-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  width: 100%;
}

.tempo-control {
  flex: 1;
  min-width: 120px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;
}

.tempo-control label {
  white-space: nowrap;
  font-size: 14px;
}

.tempo-slider {
  width: 100%;
  max-width: 200px;
}

.clef-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.clef-selector label {
  font-weight: 500;
  white-space: nowrap;
}

.custom-select {
  position: relative;
  min-width: 120px;
}

.custom-select select {
  appearance: none;
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 8px 30px 8px 10px;
  width: 100%;
  font-size: 15px;
  cursor: pointer;
  outline: none;
  transition: all 0.2s ease;
}

.custom-select select:hover {
  border-color: #2196F3;
}

.custom-select select:focus {
  border-color: #2196F3;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
}

.custom-select .select-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  font-size: 10px;
  color: #666;
}

/* Enhance select options (works in some browsers) */
.custom-select select option {
  padding: 10px;
  font-size: 15px;
}

/* Media query for mobile */
@media (max-width: 600px) {
  .custom-select {
    min-width: 100px;
  }
  
  .custom-select select {
    padding: 6px 25px 6px 8px;
    font-size: 14px;
  }
}

.playback-controls {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin: 10px 0;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 5px rgba(0,0,0,0.15);
  position: relative;
  overflow: hidden;
}

.action-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
}

/* Add ripple effect */
.action-button::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 120%;
  height: 120%;
  background: rgba(255,255,255,0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  transition: all 0.3s ease;
}

.action-button:active:not(:disabled)::after {
  transform: translate(-50%, -50%) scale(1.5);
  opacity: 1;
  transition: all 0.2s ease;
}

.button-icon {
  font-size: 18px;
  line-height: 1;
}

.button-label {
  font-weight: 500;
}

.play-button {
  background-color: #4CAF50;
  color: white;
}

.play-button:hover:not(:disabled) {
  background-color: #43a047;
  transform: translateY(-2px);
}

.stop-button {
  background-color: #f44336;
  color: white;
}

.stop-button:hover:not(:disabled) {
  background-color: #e53935;
  transform: translateY(-2px);
}

.clear-button {
  background-color: #757575;
  color: white;
}

.clear-button:hover:not(:disabled) {
  background-color: #616161;
  transform: translateY(-2px);
}

/* Button press animation */
@keyframes buttonPress {
  0% { transform: scale(1); }
  50% { transform: scale(0.95); }
  100% { transform: scale(1); }
}

.button-press-animation {
  animation: buttonPress 0.3s ease;
}

/* Mobile tabs with better sizing */
.mobile-tabs {
  display: flex;
  margin: 10px 0;
  width: 100%;
}

.tab-btn {
  flex: 1;
  padding: 10px 5px;
  background: #f0f0f0;
  border: none;
  border-bottom: 2px solid #ddd;
  font-weight: bold;
  font-size: 14px;
  white-space: nowrap;
}

/* Note controls container with better sizing */
.note-controls-container, .settings-container {
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 10px;
  width: 100%;
  box-sizing: border-box;
}

.control-section {
  margin-bottom: 15px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.control-section h4 {
  margin-top: 0;
  margin-bottom: 8px;
  color: #333;
  font-size: 14px;
  text-align: center;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
}

/* Improve button spacing and appearance */
.scrollable-buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 5px;
}

.note-btn {
  flex: 0 0 auto;
  min-width: 40px;
  height: 40px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  font-size: 18px;
  line-height: 1;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.note-btn.active {
  background: #2196F3;
  color: white;
  border-color: #0d8aee;
  box-shadow: 0 0 5px rgba(33, 150, 243, 0.5);
}

/* Style dotted note toggle more prominently */
.dotted-note-toggle {
  margin-top: 8px;
  display: flex;
  justify-content: center;
}

.dotted-note-toggle button {
  width: 100%;
  max-width: 120px;
  height: 36px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.dotted-note-toggle button.active {
  background: #2196F3;
  box-shadow: 0 0 5px rgba(33, 150, 243, 0.5);
}

.button-group {
  display: flex;
  gap: 5px;
  width: 100%;
}

.button-group button {
  flex: 1;
}

/* Responsive buttons */
.note-btn, .octave-btn, .chord-btn, .extend-btn {
  padding: 8px;
  border: none;
  border-radius: 4px;
  background: #4CAF50;
  color: white;
  cursor: pointer;
  white-space: nowrap;
  font-size: 14px;
  min-width: 40px;
  text-align: center;
}

/* Staff scroll controls with better positioning */
.staff-scroll-controls {
  position: absolute;
  bottom: 10px;
  right: 10px;
  display: flex;
  gap: 5px;
  z-index: 10;
}

.scroll-btn {
  width: 36px;
  height: 36px;
  background: rgba(33, 150, 243, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.extend-btn {
  padding: 0 10px;
  height: 36px;
  background: rgba(76, 175, 80, 0.7);
  color: white;
  border: none;
  border-radius: 18px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
}

/* Responsive adjustments for different screen sizes */
@media (max-width: 360px) {
  /* Extra small screens */
  .notation-editor {
    padding: 5px;
  }
  
  .tempo-control label {
    font-size: 12px;
  }
  
  .tab-btn {
    padding: 8px 5px;
    font-size: 12px;
  }
  
  .note-btn, .octave-btn, .chord-btn {
    padding: 6px;
    font-size: 12px;
    min-width: 30px;
  }
  
  .scroll-btn {
    width: 30px;
    height: 30px;
  }
  
  .extend-btn {
    padding: 0 8px;
    height: 30px;
    font-size: 11px;
  }
}

@media (min-width: 768px) {
  /* Larger screens */
  .notation-editor {
    padding: 20px;
  }
  
  .controls {
    flex-direction: row;
    align-items: center;
  }
  
  .mobile-tabs {
    display: none;
  }
  
  .note-controls-container, .settings-container {
    display: block !important;
  }
  
  .note-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
  }
  
  .control-section {
    flex: 1;
    min-width: 150px;
  }
  
  .scrollable-buttons {
    flex-wrap: wrap;
  }
  
  .staff-container {
  height: 300px;
  }
  
  .scroll-btn {
    width: 40px;
    height: 40px;
  }
  
  .extend-btn {
    padding: 0 15px;
    height: 40px;
    font-size: 14px;
  }
}

/* Keep other existing styles */
.clef {
  width: 60px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid #ddd;
}

.clef img {
  height: 150px;
  width: auto;
  margin-left: 5px;
  margin-top: -10px;
  object-fit: contain;
}

.staff-scroll-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  width: calc(100% - 60px); /* Subtract clef width */
}

/* Add these styles for better drag behavior */
.staff {
  position: absolute;
  height: 100%;
  padding-top: 60px;
  transition: transform 0.1s ease;
  min-width: 100%;
  cursor: grab;
}

.staff:active {
  cursor: grabbing;
  transition: none; /* Disable transition during active dragging for better responsiveness */
}

.staff-lines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.staff-line {
  position: absolute;
  width: 100%;
  height: 1px;
  background-color: black;
  left: 0;
}

/* Make sure the staff lines are positioned correctly */
.staff-line:nth-child(1) { top: 100px; }
.staff-line:nth-child(2) { top: 115px; }
.staff-line:nth-child(3) { top: 130px; }
.staff-line:nth-child(4) { top: 145px; }
.staff-line:nth-child(5) { top: 160px; }

.note-controls {
  display: flex;
  gap: 5px;
  padding: 10px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.note-btn {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  background: #4CAF50;
  color: white;
  cursor: pointer;
}

.note-btn.active {
  background: #2196F3;
}

.octave-range {
  margin-top: 10px;
  padding: 10px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.octave-buttons {
  display: flex;
  gap: 5px;
  margin-top: 5px;
}

.octave-btn {
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  background: #4CAF50;
  color: white;
  cursor: pointer;
}

.octave-btn.active {
  background: #2196F3;
}

.debug-panel {
  margin-top: 20px;
  padding: 15px;
  background: #e3f2fd;
  border: 1px solid #2196F3;
  border-radius: 4px;
}

.debug-controls {
  display: flex;
  gap: 20px;
  margin: 10px 0;
}

.debug-btn {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  background: #ff5722;
  color: white;
  cursor: pointer;
  margin-top: 5px;
}

.debug-btn.active {
  background: #9c27b0;
}

.debug-hint {
  font-style: italic;
  color: #666;
  margin-top: 10px;
}

button {
  transition: all 0.2s;
}

button:hover {
  opacity: 0.9;
}

.play-btn { background: #4CAF50; }
.stop-btn { background: #f44336; }
.clear-btn { background: #ff9800; }

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.notes-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 3;
}

.note {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 3;
  cursor: pointer;
  transition: all 0.2s;
  width: 20px;
  height: 40px;
}

.note.playing {
  filter: drop-shadow(0 0 5px #2196F3);
}

/* Notehead styles */
.notehead {
  position: absolute;
  width: 10px;
  height: 8px;
  background: black;
  border-radius: 50%;
  left: 5px;
  top: 16px;
  transform: rotate(-20deg);
}

/* Styles for whole and half notes */
.notehead.whole, .notehead.half {
  background: white;
  border: 1px solid black;
}

/* Specific styles for whole notes */
.notehead.whole {
  width: 12px;
  height: 8px;
  left: 4px;
}

/* Remove stem for whole notes */
.note[data-duration="whole"] .stem,
.note[data-duration="whole"] .flag {
  display: none;
}

/* Ensure whole notes are properly centered */
.note[data-duration="whole"] {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Adjust dot position for whole notes */
.note[data-duration="whole"] .dot {
  right: -12px;
  top: 2px;
}

/* Remove redundant styles */
/* Removing .whole-note .notehead.whole and .whole-note .stem as they're redundant */

/* For whole and half notes, use hollow noteheads */
.notehead.half {
  background: white;
  border: 1px solid black;
  height: 7px;
}

/* Special styling for whole notes */
.whole-note .notehead.whole {
  width: 12px;
  height: 8px;
  border: 1px solid black;
  background: white;
  border-radius: 50%;
  transform: rotate(-20deg);
  left: 4px;
  top: 16px;
}

/* Make sure whole notes don't have stems */
.whole-note .stem {
  display: none;
}

/* Adjust dot position for whole notes */
.whole-note .dot {
  right: -12px;
  top: 16px;
}

/* Stem styles */
.stem {
  position: absolute;
  width: 1px;
  height: 30px;
  background: black;
}

.stem.up {
  bottom: 20px;
  right: 5px;
}

.stem.down {
  top: 20px;
  left: 5px;
}

/* Flag styles for eighth and sixteenth notes */
.flag {
  position: absolute;
  width: 10px;
  height: 10px;
}

.flag.up {
  top: 0;
  right: 5px;
  border-right: 1px solid black;
  border-top: 1px solid black;
  transform: rotate(-30deg);
}

.flag.down {
  bottom: 0;
  left: 5px;
  border-left: 1px solid black;
  border-bottom: 1px solid black;
  transform: rotate(-30deg);
}

.flag.sixteenth:after {
  content: '';
  position: absolute;
  width: 10px;
  height: 10px;
  border-right: 1px solid black;
  border-top: 1px solid black;
  top: 5px;
  right: -1px;
  transform: rotate(0deg);
}

.flag.sixteenth.down:after {
  border-right: none;
  border-top: none;
  border-left: 1px solid black;
  border-bottom: 1px solid black;
  top: auto;
  right: auto;
  bottom: 5px;
  left: -1px;
}

/* Accidental positioning */
.accidental {
  position: absolute;
  left: -12px;
  top: 8px;
  font-size: 18px;
}

/* Add stem direction classes */
.note[data-stem="up"] {
  transform: translate(-50%, -50%);
}

.note[data-stem="down"] {
  transform: translate(-50%, -50%) rotate(180deg);
}

/* Adjust accidental positioning for stem direction */
.note[data-stem="up"] .accidental {
  left: -12px;
  top: 0;
  transform: none;
}

.note[data-stem="down"] .accidental {
  left: 12px;
  top: 0;
  transform: rotate(180deg);
}

/* Chord symbol styles */
.chord-symbol {
  position: absolute;
  font-family: 'Times New Roman', serif;
  font-size: 16px;
  font-weight: bold;
  transform: translateX(-50%);
  z-index: 4;
  color: #333;
}

.chord-controls {
  margin: 10px 0;
  display: flex;
  gap: 10px;
}

.chord-btn {
  background-color: #4a6da7;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.chord-btn:hover {
  background-color: #3a5d97;
}

.chord-input-modal {
  position: absolute;
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.modal-header {
  font-weight: bold;
  margin-bottom: 10px;
}

.chord-input-modal input {
  width: 100%;
  padding: 8px;
  margin-bottom: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.add-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-btn {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}

/* Key signature styles */
.key-signature {
  position: absolute;
  top: 0;
  left: 60px; /* Position after the clef */
  height: 100%;
  width: 120px; /* Give enough space for up to 7 accidentals */
  z-index: 3;
}

.key-signature-accidental {
  position: absolute;
  font-size: 24px;
  transform: translateY(-50%);
}

.key-signature-control {
  display: flex;
  align-items: center;
  margin-left: 20px;
}

.key-signature-control label {
  margin-right: 10px;
}

.key-signature-control select {
  padding: 5px;
  border-radius: 4px;
  border: 1px solid #ccc;
}

.note.key-signature-affected {
  color: #2196F3;
}

/* Restore the missing staff container styles */
.staff-container {
  border: 1px solid #ddd;
  background: white;
  margin: 10px 0;
  display: flex;
  height: 250px;
  position: relative;
  overflow: hidden;
}

/* Restore tab button active styles */
.tab-btn.active {
  background: #fff;
  border-bottom: 2px solid #2196F3;
  color: #2196F3;
}

/* Restore active button styles */
.note-btn.active, .octave-btn.active {
  background: #2196F3;
}

/* Restore hover effects */
.extend-btn:hover {
  background: rgba(76, 175, 80, 0.9);
}

.scroll-btn:hover {
  background: rgba(33, 150, 243, 0.9);
}

/* Restore measure bar styles */
.measure-bar {
  position: absolute;
  top: 100px;
  width: 1px;
  height: 60px;
  background: black;
  z-index: 2;
}

/* Restore ledger line styles */
.ledger-lines-container {
  position: absolute;
  z-index: 2;
  pointer-events: none; /* Allow clicking through to the note */
}

.ledger-line {
  position: absolute;
  height: 1px;
  background-color: black;
  z-index: 2;
  width: 20px;
}

/* Ensure ledger lines are visible for all note types */
.ledger-line.above, .ledger-line.below {
  display: block;
  width: 20px;
  opacity: 1;
  visibility: visible;
}

/* Adjust ledger line positioning for whole notes */
.note[data-duration="whole"] + .ledger-lines-container {
  transform: none;
}

/* Make ledger lines slightly wider for whole notes */
.note[data-duration="whole"] ~ .ledger-lines-container .ledger-line {
  width: 24px; /* Slightly wider to match the whole note */
  left: -12px; /* Center the wider ledger line */
}

/* Remove any transform that might be affecting ledger lines */
.ledger-lines-container.above,
.ledger-lines-container.below {
  transform: none;
}

/* Add specific styles for bass clef ledger lines */
.bass-clef-ledger-line {
  position: absolute;
  height: 1px;
  background-color: black;
  z-index: 2;
  width: 20px;
}

/* Restore bass clef specific adjustments */
.clef img[alt="Bass Clef"] {
  height: 100px;
  width: auto;
  margin-top: 10px;
  margin-left: 0;
  transform: scale(0.7);
}

.dotted-note-toggle {
  display: flex;
  gap: 5px;
}

.dotted-note-toggle button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  background: #4CAF50;
  color: white;
  cursor: pointer;
}

.dotted-note-toggle button.active {
  background: #2196F3;
}

.dot {
  font-size: 12px;
  margin-left: 5px;
}

/* Add styles for the dot */
.dot {
  position: absolute;
  font-size: 16px;
  font-weight: bold;
  right: -10px;
  top: 8px;
}

/* Adjust dot position for stem direction */
.note[data-stem="up"] .dot {
  right: -10px;
  top: 8px;
}

.note[data-stem="down"] .dot {
  left: -10px;
  bottom: 8px;
}

/* Update the dotted note toggle styles */
.dotted-note-toggle {
  margin-top: 5px;
}

.dot-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
}

.dot-symbol {
  font-size: 18px;
  font-weight: bold;
  line-height: 1;
}

/* Make the active state more obvious */
.dot-btn.active {
  background: #2196F3;
  box-shadow: 0 0 5px rgba(33, 150, 243, 0.5);
}

/* Update the dot styles for notes */
.dot {
  position: absolute;
  font-size: 16px;
  font-weight: bold;
  right: -10px;
  top: 8px;
}

/* Adjust dot position for stem direction */
.note[data-stem="up"] .dot {
  right: -10px;
  top: 8px;
}

.note[data-stem="down"] .dot {
  left: -10px;
  bottom: 8px;
}

/* Update ledger line styles for all note types */
.ledger-lines-container {
  position: absolute;
  z-index: 2;
  pointer-events: none;
  width: 24px; /* Consistent width for all ledger lines */
}

.ledger-line {
  position: absolute;
  height: 1px;
  background-color: black;
  z-index: 2;
  width: 24px;
}

/* Position ledger lines relative to the note */
.ledger-lines-container.above,
.ledger-lines-container.below {
  left: -12px; /* Center the ledger lines */
  transform: none;
}

/* Ensure ledger lines are visible */
.ledger-line.above,
.ledger-line.below {
  display: block !important;
  opacity: 1;
  visibility: visible;
}

/* Specific positioning for ledger lines */
.ledger-line:nth-child(1) { top: 0px; }
.ledger-line:nth-child(2) { top: 15px; }
.ledger-line:nth-child(3) { top: 30px; }
.ledger-line:nth-child(4) { top: 45px; }
.ledger-line:nth-child(5) { top: 60px; }

/* Remove any transforms that might interfere */
.note ~ .ledger-lines-container {
  transform: none !important;
}

/* Ensure proper z-index stacking */
.note {
  z-index: 3;
}

.ledger-lines-container {
  z-index: 2;
}

/* Make sure ledger lines extend full width */
.ledger-line {
  min-width: 24px;
  left: 0;
}

/* Add a visual indicator for right-click functionality */
.note {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 3;
  cursor: pointer;
  transition: all 0.2s;
  width: 20px;
  height: 40px;
}

.note:hover {
  filter: brightness(0.9);
}

.note:hover::after {
  content: '×';
  position: absolute;
  top: -15px;
  right: -15px;
  color: #f44336;
  font-size: 16px;
  font-weight: bold;
  opacity: 0.7;
  pointer-events: none;
}

/* Update the hover styles to only show on non-touch devices */
@media (hover: hover) {
  .note:hover::after {
    content: '×';
    position: absolute;
    top: -15px;
    right: -15px;
    color: #f44336;
    font-size: 16px;
    font-weight: bold;
    opacity: 0.7;
    pointer-events: none;
  }
}

/* Add styles for touch feedback */
.note.touch-active {
  opacity: 0.7;
}

/* Improved mobile note controls */
.note-controls-container {
  padding: 10px;
  background: #f5f5f5;
  border-top: 1px solid #ddd;
}

.note-controls-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

/* Make control sections more compact */
.control-section {
  margin-bottom: 10px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
}

/* Smaller headers */
.control-section h4 {
  margin-top: 0;
  margin-bottom: 5px;
  font-size: 12px;
  text-align: center;
  border-bottom: 1px solid #eee;
  padding-bottom: 3px;
}

/* Make buttons smaller and more touch-friendly */
.note-btn, .octave-btn {
  flex: 0 0 auto;
  min-width: 36px;
  height: 36px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  font-size: 16px;
  line-height: 1;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

/* Ensure the scrollable buttons don't overflow */
.scrollable-buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 5px;
  max-height: none;
  overflow: visible;
}

/* Adjust button groups for the type section */
.button-group {
  display: flex;
  gap: 5px;
  justify-content: center;
}

.button-group button {
  flex: 1;
}

/* Make sure octave buttons are always visible */
.octave-section .scrollable-buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.octave-btn {
  flex: 0 0 calc(20% - 5px);
  margin: 0;
}

/* Ensure active state is clearly visible */
.note-btn.active, .octave-btn.active {
  background: #2196F3;
  color: white;
  border-color: #0d8aee;
  box-shadow: 0 0 5px rgba(33, 150, 243, 0.5);
}

/* Mobile-specific adjustments */
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
    min-width: 25px;
  }
}

/* Fix button icon visibility */
.note-btn, .octave-btn {
  flex: 0 0 auto;
  min-width: 36px;
  height: 36px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  color: #333; /* Ensure text is visible */
  font-size: 16px;
  font-weight: bold; /* Make text more visible */
  line-height: 1;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  text-shadow: none; /* Remove any text shadows */
  box-shadow: 0 1px 3px rgba(0,0,0,0.1); /* Add subtle shadow for depth */
}

/* Ensure button text is visible in all states */
.note-btn:not(.active), .octave-btn:not(.active) {
  color: #333; /* Dark text on light background for contrast */
  background: #f7f7f7; /* Slightly off-white background */
  border-color: #ddd;
}

/* Style active state with higher contrast */
.note-btn.active, .octave-btn.active {
  background: #2196F3;
  color: white;
  border-color: #0d8aee;
  box-shadow: 0 0 5px rgba(33, 150, 243, 0.5);
  font-weight: bold;
}

/* Add specific styles for duration buttons to ensure symbols are visible */
.duration-section .note-btn {
  font-family: 'Times New Roman', serif; /* Better for music symbols */
  font-size: 20px; /* Larger for better visibility */
  font-weight: normal; /* Normal weight for symbols */
}

/* Add specific styles for accidental buttons */
.accidental-section .note-btn {
  font-size: 18px;
  font-weight: normal;
}

/* Octave buttons should be very clear */
.octave-section .octave-btn {
  font-weight: bold;
  font-size: 16px;
}

/* Add styles for saved compositions */
.saved-compositions-container {
  margin-top: 20px;
  padding: 15px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.save-composition-form {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.save-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.no-saved-compositions {
  text-align: center;
  color: #666;
}

.saved-composition-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.saved-composition-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px;
  background: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.composition-info {
  display: flex;
  flex-direction: column;
}

.composition-name {
  font-weight: bold;
}

.composition-date {
  font-size: 12px;
  color: #666;
}

.composition-actions {
  display: flex;
  gap: 5px;
}

.load-btn, .delete-btn {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}

/* Styles for saved compositions */
.saved-compositions-container {
  padding: 15px;
  background: #f5f5f5;
}

.save-composition-form {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.composition-name-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

.save-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 15px;
  cursor: pointer;
  font-weight: bold;
}

.save-btn:hover {
  background-color: #45a049;
}

.no-saved-compositions {
  text-align: center;
  padding: 20px;
  color: #666;
  font-style: italic;
}

.saved-composition-list {
  max-height: 300px;
  overflow-y: auto;
}

.saved-composition-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #ddd;
  background: white;
  margin-bottom: 5px;
  border-radius: 4px;
}

.composition-info {
  display: flex;
  flex-direction: column;
}

.composition-name {
  font-weight: bold;
  color: #333;
}

.composition-date {
  font-size: 12px;
  color: #777;
}

.composition-actions {
  display: flex;
  gap: 5px;
}

.load-btn {
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  cursor: pointer;
}

.delete-btn {
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  cursor: pointer;
}

/* Make tabs fit the new third option */
.mobile-tabs {
  display: flex;
}

.mobile-tabs .tab-btn {
  flex: 1;
  padding: 10px;
  text-align: center;
  background: #f0f0f0;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
}

.mobile-tabs .tab-btn.active {
  background: white;
  border-bottom: 2px solid #2196F3;
  font-weight: bold;
}

/* Add CSS for force-redraw animation */
.force-redraw {
  animation: flash 0.1s;
}

@keyframes flash {
  0% { opacity: 0.9; }
  100% { opacity: 1; }
}

/* Add styles for edit mode in saved compositions */
.edit-name-form {
  display: flex;
  gap: 5px;
  margin-top: 5px;
}

.rename-input {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid #2196F3;
  border-radius: 4px;
  font-size: 14px;
}

.save-rename-btn, .cancel-rename-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.save-rename-btn {
  background-color: #4CAF50;
  color: white;
}

.cancel-rename-btn {
  background-color: #f44336;
  color: white;
}

/* Update button */
.update-btn {
  background-color: #FF9800;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  cursor: pointer;
  margin-left: 5px;
}

/* Import/Export controls */
.import-export-controls {
  display: flex;
  gap: 10px;
  margin-top: 15px;
  margin-bottom: 15px;
  justify-content: center;
}

.export-btn, .import-btn {
  background-color: #3F51B5;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 15px;
  cursor: pointer;
  font-size: 14px;
  display: inline-block;
  text-align: center;
}

.export-btn:hover, .import-btn:hover {
  background-color: #303F9F;
}

.export-btn:disabled {
  background-color: #9E9E9E;
  cursor: not-allowed;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  background: #4CAF50;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background-color: #45a049;
}

.btn-icon {
  font-size: 18px;
  font-weight: bold;
}

.btn-text {
  font-size: 14px;
  font-weight: normal;
}

.btn-disabled {
  background-color: #9E9E9E;
  cursor: not-allowed;
}

.custom-select {
  position: relative;
  display: inline-block;
}

.select-icon {
  position: absolute;
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
  pointer-events: none;
  color: #999;
}

.select-icon::after {
  content: "\25BC";
  position: absolute;
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
  pointer-events: none;
  color: #999;
}

.select-icon::before {
  content: "\25B2";
  position: absolute;
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
  pointer-events: none;
  color: #999;
}

.select-icon::after,
.select-icon::before {
  font-size: 12px;
  line-height: 1;
  pointer-events: none;
}
</style> 