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
        <button 
          @click="togglePlayback" 
          class="action-button play-button"
          :class="{
            'play-button': !isPlaying && !isPaused,
            'pause-button': isPlaying && !isPaused,
            'resume-button': isPaused
          }"
        >
          <span class="button-icon">
            <span v-if="!isPlaying && !isPaused">▶</span>
            <span v-else-if="isPlaying && !isPaused">⏸</span>
            <span v-else-if="isPaused">⏯</span>
          </span>
          <span class="button-label">
            {{ !isPlaying && !isPaused ? 'Play' : (isPlaying && !isPaused ? 'Pause' : 'Resume') }}
          </span>
        </button>
        
        <button @click="stopPlayback" class="action-button stop-button" :disabled="!isPlaying && !isPaused">
          <span class="button-icon">■</span>
          <span class="button-label">Stop</span>
        </button>
        
        <!-- Update the clear button to be disabled during playback -->
        <button 
          @click="isPlaying || isPaused ? restartPlayback() : confirmClearScore()" 
          class="action-button"
          :class="{
            'clear-button': !isPlaying && !isPaused,
            'restart-button': isPlaying || isPaused
          }"
          @mousedown="animateButton"
        >
          <span class="button-icon">
            <span v-if="!isPlaying && !isPaused">✕</span>
            <span v-else>⟲</span>
          </span>
          <span class="button-label">
            {{ !isPlaying && !isPaused ? 'Clear' : 'Restart' }}
          </span>
        </button>
        </div>
      </div>
    </div>

    <!-- Add this after the clef selector -->
    <div class="time-signature-selector">
      <label for="time-signature">Time:</label>
      <div class="custom-select">
        <select id="time-signature" v-model="timeSignature" @change="updateTimeSignature">
          <option value="4/4">4/4</option>
          <option value="3/4">3/4</option>
          <option value="2/4">2/4</option>
          <option value="6/8">6/8</option>
          <option value="9/8">9/8</option>
          <option value="12/8">12/8</option>
        </select>
        <div class="select-icon">▼</div>
      </div>
    </div>

    <!-- Add this to the time signature selector section -->
    <div class="measure-visibility-toggle">
      <input 
        type="checkbox" 
        id="show-measures" 
        v-model="showMeasureNumbers"
      />
      <label for="show-measures">Show measure numbers</label>
    </div>

    <!-- Add this after the playback controls section, inside the controls-row div -->
    <div class="playback-measure-controls">
      <div class="control-label">Playback Range:</div>
      <div class="measure-range-inputs">
        <div class="measure-input">
          <label for="start-measure">From:</label>
          <input 
            type="number" 
            id="start-measure" 
            v-model.number="playbackStartMeasure" 
            min="1" 
            :max="barlines.length"
            class="measure-number-input"
          />
        </div>
        <div class="measure-input">
          <label for="end-measure">To:</label>
          <input 
            type="number" 
            id="end-measure" 
            v-model.number="playbackEndMeasure" 
            min="0" 
            :max="barlines.length"
            class="measure-number-input"
          />
          <span class="measure-hint">(0 = end)</span>
        </div>
      </div>
      <div class="auto-scroll-toggle">
        <input 
          type="checkbox" 
          id="auto-scroll" 
          v-model="autoScrollToPlayingNote"
        />
        <label for="auto-scroll">Auto-scroll to playing notes</label>
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
               left: `${15 + (index * 8)}px` // More compact horizontal spacing
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
        <div class="staff" 
             @click="handleStaffClick"
             @mousedown="startDrag"
             @touchstart="startDrag"
             :style="{
               width: `${staffWidth}px`,
               transform: `translateX(-${scrollPosition}px)`
             }">
          <!-- Staff lines -->
          <div class="staff-lines">
            <div class="staff-line" v-for="i in 5" :key="`line-${i}`"></div>
          </div>
          
          <!-- Measure bars -->
          <div v-for="(barline, i) in barlines" 
               :key="`barline-${i}`" 
               class="barline"
               :class="{ 
                 'barline-single': barline.type === 'single',
                 'barline-double': barline.type === 'double',
                 'barline-final': barline.type === 'final',
                 'barline-repeat-start': barline.type === 'repeat-start',
                 'barline-repeat-end': barline.type === 'repeat-end'
               }"
               :style="{ left: `${barline.position}px` }">
            
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
          <div v-if="showBeatMarkers" 
               v-for="beat in beatPositions" 
               :key="`beat-${beat.position}`"
               class="beat-marker"
               :style="{ left: `${beat.position}px` }">
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
                   'rest': note.type === 'rest',
                   'playing': note.id === currentPlayingNoteId,
                   'selected': note.id === selectedNoteId, // Add class for selected note
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
                 @touchmove="handleTouchMove"
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

              <!-- Lyric Display -->
              <span v-if="note.lyric"
                    class="lyric"
                    :class="{ 'playing': note.id === currentPlayingNoteId }"
                    :data-note-id="note.id"
                    :style="getLyricStyle(note)">
                {{ note.lyric }}
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
              <!-- Update this loop -->
              <button v-for="duration in availableDurations"
                      :key="duration.value"
                      @click="selectedDuration = duration.value"
                      :class="['note-btn', { active: selectedDuration === duration.value }]">
                {{ selectedNoteType === 'note' 
                  ? (usesFallbackSymbols ? duration.fallbackNoteLabel : duration.noteLabel) 
                  : (usesFallbackSymbols ? duration.fallbackRestLabel : duration.restLabel) }}
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
// const selectedHeight = ref('middle');
const selectedOctave = ref(4);
const selectedNoteType = ref('note'); // Default to 'note'
const selectedAccidental = ref('natural');
const selectedDuration = ref('quarter');
const lastClickY = ref(0);
const tempo = ref(120);
const debugMode = ref(false);
const showNotePositions = ref(false);
const currentPlayingNoteId = ref<string | null>(null);
const selectedClef = ref('treble');

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
interface Note {
  id: string;
  type: "note" | "rest";
  pitch?: string;
  duration: string;
  position: number;
  verticalPosition: number;
  dotted?: boolean;
  lyric?: string;
}

interface Composition {
  id: string;
  name: string;
  dateCreated: number;
  notes: Note[];
  clef: string;
  keySignature: string;
  timeSignature?: string;
  tempo: number;
  chordSymbols: any[];
  selectedNoteType: string;
  selectedNoteDuration: string;
  selectedOctave: number;
  isDottedNote: boolean;
}

// Add window property declarations
declare global {
  interface Window {
    playbackTimeouts: number[];
    debugMonitorInterval: number | null;
    debugMonitorRemover: () => void;
  }
}

// Then update your notes ref to use this type
const notes = ref<Note[]>([]);

// Create a piano-like synth for playback
// const createPianoSynth = () => {
//   return new Tone.Sampler({
//     urls: {
//       A1: "A1.mp3",
//       A2: "A2.mp3",
//       A3: "A3.mp3",
//       A4: "A4.mp3",
//       A5: "A5.mp3",
//       A6: "A6.mp3",
//       C1: "C1.mp3",
//       C2: "C2.mp3",
//       C3: "C3.mp3",
//       C4: "C4.mp3",
//       C5: "C5.mp3",
//       C6: "C6.mp3",
//       'D#1': "Ds1.mp3",
//       'D#2': "Ds2.mp3",
//       'D#3': "Ds3.mp3",
//       'D#4': "Ds4.mp3",
//       'D#5': "Ds5.mp3",
//       'F#1': "Fs1.mp3",
//       'F#2': "Fs2.mp3",
//       'F#3': "Fs3.mp3",
//       'F#4': "Fs4.mp3",
//       'F#5': "Fs5.mp3"
//     },
//     release: 1,
//     baseUrl: "https://tonejs.github.io/audio/salamander/",
//   }).toDestination();
// };

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
  lyric?: string; // Add this line for lyrics
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
  };
  
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

// const showLedgerLinesForNote = (pitch: string, position: number) => {
//   // Get the base note without accidentals
//   const octave = parseInt(pitch.slice(-1));
//   const note = pitch.slice(0, -1).replace(/[#b]/, '');
//   const baseNote = `${note}${octave}`;
  
//   // Define the staff range
//   const aboveStaff = ['F5', 'G5', 'A5', 'B5', 'C6', 'D6', 'E6', 'F6', 'G6', 'A6', 'B6'];
//   const belowStaff = ['D3', 'C3', 'B2', 'A2', 'G2', 'F2', 'E2', 'D2', 'C2'];
  
//   // Find all ledger line elements
//   const ledgerLinesAbove = document.querySelectorAll('.ledger-line.above');
//   const ledgerLinesBelow = document.querySelectorAll('.ledger-line.below');
  
//   // Reset all ledger lines
//   ledgerLinesAbove.forEach(line => (line as HTMLElement).style.display = 'none');
//   ledgerLinesBelow.forEach(line => (line as HTMLElement).style.display = 'none');
  
//   // Show appropriate ledger lines based on the note
//   if (aboveStaff.includes(baseNote)) {
//     const index = aboveStaff.indexOf(baseNote);
//     const linesNeeded = Math.floor(index / 2) + 1;
    
//     for (let i = 0; i < linesNeeded && i < ledgerLinesAbove.length; i++) {
//       const line = ledgerLinesAbove[i] as HTMLElement;
//       line.style.display = 'block';
//       line.style.left = `${position * 50}px`;
//       line.style.width = '20px';
//     }
//   } else if (belowStaff.includes(baseNote)) {
//     const index = belowStaff.indexOf(baseNote);
//     const linesNeeded = Math.floor(index / 2) + 1;
    
//     for (let i = 0; i < linesNeeded && i < ledgerLinesBelow.length; i++) {
//       const line = ledgerLinesBelow[i] as HTMLElement;
//       line.style.display = 'block';
//       line.style.left = `${position * 50}px`;
//       line.style.width = '20px';
//     }
//   }
// };

// Add this new function
// const selectNoteHeight = (height: 'high' | 'middle' | 'low') => {
//   selectedHeight.value = height;
//   switch (height) {
//     case 'high':
//       selectedOctave.value = 5;
//       break;
//     case 'middle':
//       selectedOctave.value = 4;
//       break;
//     case 'low':
//       selectedOctave.value = 3;
//       break;
//   }
// };

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
const playComposition = () => {
  // Call the playScore function which respects measure boundaries
  playScore();
};

// Add this new function to adjust the pitch for playback
// const adjustPitchForPlayback = (pitch: string) => {
//   // Extract the note name and octave
//   const noteName = pitch.replace(/[0-9]/g, '');
//   const octave = parseInt(pitch.match(/[0-9]/)?.[0] || '4');
  
//   // Define the note sequence
//   const noteSequence = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
//   // Find the current note index
//   let noteIndex = noteSequence.indexOf(noteName);
//   if (noteIndex === -1) {
//     // Handle flats by converting to equivalent sharps
//     const flatToSharp: Record<string, string> = {
//       'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#',
//       'Cb': 'B', 'Fb': 'E'
//     };
    
//     // Check if we have a flat note and convert it
//     for (const [flat, sharp] of Object.entries(flatToSharp)) {
//       if (noteName === flat) {
//         noteIndex = noteSequence.indexOf(sharp);
//         break;
//       }
//     }
    
//     // If still not found, return the original pitch
//     if (noteIndex === -1) return pitch;
//   }
  
//   // Adjust down by a half step (semitone)
//   noteIndex = (noteIndex - 1 + 12) % 12;
//   let newOctave = octave;
  
//   // Handle octave change if needed - only for B going to C
//   if (noteName === 'C') {
//     newOctave = octave - 1;
//   }
  
//   return noteSequence[noteIndex] + newOctave;
// };

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
// const autoScrollToNote = (note) => {
//   // Calculate the horizontal position of the note
//   const noteXPosition = note.position * 50;
  
//   // Calculate the visible area boundaries
//   const leftBoundary = scrollPosition.value;
//   const rightBoundary = scrollPosition.value + visibleStaffWidth.value;
  
//   // Check if the note is outside the visible area
//   if (noteXPosition < leftBoundary + 100) {
//     // Note is to the left of the visible area or too close to the left edge
//     // Scroll left to show the note with some margin
//     scrollPosition.value = Math.max(0, noteXPosition - 100);
//     updateStaffScroll();
//   } else if (noteXPosition > rightBoundary - 100) {
//     // Note is to the right of the visible area or too close to the right edge
//     // Scroll right to show the note with some margin
//     scrollPosition.value = Math.min(
//       maxScrollPosition.value,
//       noteXPosition - visibleStaffWidth.value + 200
//     );
//     updateStaffScroll();
//   }
// };

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
  currentPlayingNoteId.value = null;
  pausedTimeouts.value = [];
  pauseTime.value = null;
  
  // Clear all timeouts
  if (window.playbackTimeouts) {
    window.playbackTimeouts.forEach(id => clearTimeout(id));
    window.playbackTimeouts = [];
  }
  
  console.log('Playback stopped');
};

// Update the clearScore function to properly clear all notes
const clearScore = () => {
  // First stop any playback
  stopPlayback();
  
  // Clear all notes
  notes.value = [];
  
  // Reset scroll position
  scrollPosition.value = 0;
  updateStaffScroll();
  
  // Reset playback range to default
  playbackStartMeasure.value = 1;
  playbackEndMeasure.value = 0;
  
  console.log('Score cleared');
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
// const addChordToScore = () => {
//   if (chordName.value.trim()) {
//     chordSymbols.value.push({
//       id: Date.now().toString(),
//       position: chordInputPosition.value,
//       chordName: chordName.value,
//       top: 70 // Position above the staff
//     });
//     chordName.value = '';
//     showChordInput.value = false;
//   }
// };

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
// const handleChordPlacement = (event: MouseEvent) => {
//   if (!showChordInput.value) return;
  
//   const staffRect = (event.currentTarget as HTMLElement).getBoundingClientRect();
//   const x = event.clientX - staffRect.left;
//   chordInputPosition.value = Math.floor(x / 50);
  
//   // Position the chord input modal near the click
//   const chordModal = document.querySelector('.chord-input-modal') as HTMLElement;
//   if (chordModal) {
//     chordModal.style.left = `${x}px`;
//     chordModal.style.top = '40px';
//   }
// };

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

// Fix the saveComposition function to properly handle duplicate names
const saveComposition = () => {
  // Validate that the composition name is not empty
  if (!compositionName.value.trim()) {
    alert('Please enter a name for your composition');
    return;
  }
  
  // Check if a composition with this name already exists
  const existingComposition = savedCompositions.value.find(
    comp => comp.name.toLowerCase() === compositionName.value.trim().toLowerCase()
  );
  
  // If a composition with this name exists
  if (existingComposition) {
    // If it's the current composition being edited, offer to update instead
    if (existingComposition.id === currentCompositionId.value) {
      if (confirm(`Do you want to update the existing composition "${compositionName.value}"?`)) {
        // Update existing composition
        updateComposition(existingComposition.id);
        return;
      }
    } else {
      // It's a different composition with the same name
      const choice = confirm(`A composition named "${compositionName.value}" already exists. Choose:\n\n- OK to update the existing composition\n- Cancel to create a new composition with a unique name`);
      
      if (choice) {
        // User chose to update the existing composition
        currentCompositionId.value = existingComposition.id;
        updateComposition(existingComposition.id);
        return;
      } else {
        // User chose to create a new composition - ask for a different name
        const newName = prompt(`Please enter a different name for your composition:`, `${compositionName.value} (copy)`);
        if (!newName) return; // User canceled
        compositionName.value = newName.trim();
      }
    }
  }
  
  // Create a new composition
  const newComposition = {
    id: Date.now().toString(),
    name: compositionName.value.trim(),
    dateCreated: Date.now(),
    notes: notes.value,
    tempo: tempo.value,
    clef: selectedClef.value,
    keySignature: keySignature.value,
    timeSignature: timeSignature.value,
    selectedNoteType: selectedNoteType.value,
    selectedNoteDuration: selectedDuration.value,
    selectedOctave: selectedOctave.value,
    isDottedNote: isDottedNote.value,
    chordSymbols: chordSymbols.value
  };
  
  // Save the composition
  savedCompositions.value.push(newComposition);
  
  // Update currentCompositionId to the newly saved composition
  currentCompositionId.value = newComposition.id;
  
  // Save to localStorage
  saveToLocalStorage();
  
  alert(`Composition "${compositionName.value}" saved successfully!`);
};

// Update the updateNotes function to handle the read-only property
// const updateNotes = (newNotes) => {
//   try {
//     // Instead of direct assignment, use array methods
//     // Clear the array first
//     while (notes.value.length > 0) {
//       notes.value.pop();
//     }
    
//     // Then add all the new notes
//     newNotes.forEach(note => {
//       notes.value.push(note);
//     });
    
//     console.log('Notes updated through array manipulation');
//   } catch (error) {
//     console.error('Error updating notes:', error);
    
//     // Try alternative methods if needed
//     try {
//       const notationStore = useNotationStore();
//       // Add a setNotes method to your store if it doesn't exist
//       if (typeof notationStore.setNotes === 'function') {
//         notationStore.setNotes(newNotes);
//         console.log('Notes updated through store');
//       } else {
//         console.error('setNotes method not found in store');
//       }
//     } catch (storeError) {
//       console.error('Error updating notes through store:', storeError);
//       alert('Failed to load notes. Please try again or reload the application.');
//     }
//   }
// };

// Improve the clearStaffCompletely function to forcefully clear everything
// const clearStaffCompletely = async () => {
//   console.log('Clearing staff completely...');
  
//   // Stop any playback first
//   stopPlayback();
  
//   // Store the current length for debugging
//   const originalLength = notes.value.length;
  
//   // First, mark all existing notes for removal (helps with debugging)
//   document.querySelectorAll('.note').forEach(noteElement => {
//     noteElement.classList.add('to-be-removed');
//     noteElement.style.opacity = '0.3'; // Visual indicator that these will be removed
//   });
  
//   // Create a fresh empty array for notes (this ensures no references to old notes remain)
//   const emptyArray = [];
//   notes.value = emptyArray;
  
//   // Wait for Vue to update
//   await nextTick();
  
//   // Force manual DOM cleanup if needed
//   document.querySelectorAll('.note.to-be-removed').forEach(noteElement => {
//     if (noteElement.parentNode) {
//       noteElement.parentNode.removeChild(noteElement);
//     }
//   });
  
//   console.log(`Staff cleared: removed ${originalLength} notes, current length: ${notes.value.length}`);
  
//   // Reset scroll position to beginning
//   scrollPosition.value = 0;
  
//   // Reset the DOM transform to avoid ghost notes
//   const staffElement = document.querySelector('.staff');
//   if (staffElement) {
//     staffElement.style.transform = 'translateX(0px)';
//   }
  
//   // Force garbage collection if possible
//   if (window.gc) window.gc();
  
//   return new Promise(resolve => setTimeout(resolve, 50)); // Give the browser time to update
// };

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
// const resetAudioSystem = async () => {
//   console.log('Completely resetting audio system...');
  
//   // Stop any ongoing playback
//   stopPlayback();
  
//   // First, release and dispose all current audio nodes
//   if (noteSynth) {
//     try {
//       noteSynth.releaseAll();
//       noteSynth.dispose();
//       noteSynth = null;
//     } catch (e) {
//       console.error('Error disposing noteSynth:', e);
//     }
//   }
  
//   if (pianoSynth) {
//     try {
//       pianoSynth.releaseAll();
//       pianoSynth.dispose();
//       pianoSynth = null;
//     } catch (e) {
//       console.error('Error disposing pianoSynth:', e);
//     }
//   }
  
//   // Clear all scheduled events
//   try {
//     Tone.Transport.cancel(0);
//     Tone.Transport.stop();
//   } catch (e) {
//     console.error('Error clearing Tone.Transport:', e);
//   }
  
//   // Clear any timeouts
//   if (window.playbackTimeouts) {
//     window.playbackTimeouts.forEach(id => clearTimeout(id));
//     window.playbackTimeouts = [];
//   }
  
//   // Re-initialize the audio context if possible
//   try {
//     await Tone.start();
//     Tone.context.resume();
//   } catch (e) {
//     console.log('Could not restart Tone context (may need user interaction):', e);
//   }
  
//   // Recreate the synthesizers
//   try {
//     noteSynth = new Tone.Synth({
//       oscillator: { type: 'sine' },
//       envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 }
//     }).toDestination();
    
//     pianoSynth = new Tone.Sampler({
//       urls: {
//         'C4': 'C4.mp3',
//         'D#4': 'Ds4.mp3',
//         'F#4': 'Fs4.mp3',
//         'A4': 'A4.mp3',
//       },
//       baseUrl: 'https://tonejs.github.io/audio/salamander/'
//     }).toDestination();
    
//     console.log('Audio system reset complete, new synths created');
//   } catch (e) {
//     console.error('Error recreating synths:', e);
//   }
// };

// Update the loadComposition function to use the resetAudioSystem
const loadComposition = (compositionId: string) => {
  try {
    // Find the composition in the saved compositions array
    const composition = savedCompositions.value.find(comp => comp.id === compositionId);
    
    if (!composition) {
      console.error('Composition not found:', compositionId);
      return;
    }
    
    // Set the current composition ID so the Update button will appear
    currentCompositionId.value = compositionId;
    
    console.log('Loading composition:', composition);
    
    // Clear current score
    clearScore();
    
    // Set composition name
    compositionName.value = composition.name;
    
    // Load notes
    notes.value = composition.notes;
    
    // Load other settings
    selectedClef.value = composition.clef || 'treble';
    keySignature.value = composition.keySignature || 'C';
    tempo.value = composition.tempo || 120;
    
    // Load chord symbols if they exist
    if (composition.chordSymbols && composition.chordSymbols.length) {
      chordSymbols.value = composition.chordSymbols;
    }
    
    // Load time signature if it exists
    if (composition.timeSignature) {
      timeSignature.value = composition.timeSignature;
      updateTimeSignature(); // Update UI based on time signature
    }
    
    console.log('Composition loaded successfully with', notes.value.length, 'notes');
  } catch (e) {
    console.error('Error loading composition:', e);
  }
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
  
  // Check if the name has changed and if the new name conflicts with any existing compositions
  if (composition.name !== compositionName.value.trim()) {
    const nameExists = savedCompositions.value.some(
      comp => comp.id !== id && comp.name.toLowerCase() === compositionName.value.trim().toLowerCase()
    );
    
    if (nameExists) {
      if (!confirm(`A composition named "${compositionName.value}" already exists. Do you want to use this name anyway?`)) {
        return;
      }
    }
    
    // Update the name
    composition.name = compositionName.value.trim();
  }
  
  // Update the composition with current state
  composition.notes = notes.value.map(note => ({...note}));
  composition.tempo = tempo.value;
  composition.clef = selectedClef.value;
  composition.keySignature = keySignature.value;
  composition.timeSignature = timeSignature.value;
  composition.selectedNoteType = selectedNoteType.value;
  composition.selectedNoteDuration = selectedDuration.value;
  composition.selectedOctave = selectedOctave.value;
  composition.isDottedNote = isDottedNote.value;
  composition.chordSymbols = chordSymbols.value;
  
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
      // Parse the JSON data - handle the string | ArrayBuffer type
      const result = e.target?.result;
      if (typeof result !== 'string') {
        throw new Error('Expected string result from FileReader');
      }
      
      const importedData = JSON.parse(result);
      
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
      alert('Error importing file: ' + (error as Error).message);
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

// Add these reactive variables
const timeSignature = ref('4/4');
const timeSignatureNumerator = computed(() => timeSignature.value.split('/')[0]);
const timeSignatureDenominator = computed(() => timeSignature.value.split('/')[1]);
const showBeatMarkers = ref(false); // Set to true for debugging

// Make sure this computed property is correctly calculating measure width
const measureWidthByTimeSignature = computed(() => {
  const [numerator, denominator] = timeSignature.value.split('/').map(n => parseInt(n));
  
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

// Update importComposition to support time signature
// const handleImportFile = (e) => {
//   const file = e.target.files[0];
//   if (!file) return;
  
//   const reader = new FileReader();
//   reader.onload = (e) => {
//     try {
//       // Parse the JSON data
//       const importedData = JSON.parse(e.target.result);
      
//       // Check if it's an array (multiple compositions) or a single composition
//       if (Array.isArray(importedData)) {
//         // Multiple compositions
//         importedCompositions.value = importedData;
//         showImportModal.value = true;
//       } else {
//         // Single composition
//         importComposition(importedData);
//       }
//     } catch (error) {
//       console.error('Error importing file:', error);
//       alert('Error importing file. Please check the file format.');
//     }
//   };
//   reader.readAsText(file);
// };

// Function to import a single composition
// const importComposition = (composition) => {
//   try {
//     // Clear existing score
//     clearScore();
    
//     // Load notes
//     notes.value = composition.notes.map(note => ({
//       ...note,
//       id: note.id || generateId(),
//       type: note.type || 'note',
//       position: note.position || 0,
//       verticalPosition: note.verticalPosition || 0,
//       duration: note.duration || 'quarter',
//       dotted: note.dotted || false,
//       pitch: note.pitch || 'C4'
//     }));
    
//     // Set time signature, defaulting to 4/4 if not provided
//     timeSignature.value = composition.timeSignature || '4/4';
    
//     // Set other musical parameters
//     selectedClef.value = composition.clef || 'treble';
//     keySignature.value = composition.keySignature || 'C'; // FIX: Use keySignature instead of selectedKeySignature
//     tempo.value = composition.tempo || 120;
    
//     // Load chord symbols if present
//     if (composition.chordSymbols) {
//       chordSymbols.value = composition.chordSymbols;
//     }
    
//     // Set composition name
//     compositionName.value = composition.name || 'Imported Composition';
    
//     // Update UI based on loaded data
//     updateTimeSignature();
//     handleClefChange();
//     updateKeySignature();
    
//     console.log(`Imported composition: ${composition.name}`);
//     alert(`Successfully imported: ${composition.name}`);
//   } catch (error) {
//     console.error('Error during import:', error);
//     alert('Error importing composition. Please check the file format.');
//   }
// };

// Add timeSignature to exportComposition if it exists
// const exportToFile = () => {
//   // Create a JSON string with the current composition
//   const compositionData = {
//     name: compositionName.value || 'Untitled Composition',
//     notes: notes.value,
//     tempo: tempo.value,
//     clef: selectedClef.value,
//     keySignature: keySignature.value,
//     timeSignature: timeSignature.value, // Add time signature
//     // Add any other properties you want to save
//   };
  
//   const dataStr = JSON.stringify(compositionData);
//   const dataBlob = new Blob([dataStr], { type: 'application/json' });
//   const url = URL.createObjectURL(dataBlob);
  
//   // Create a link and trigger download
//   const a = document.createElement('a');
//   a.href = url;
//   a.download = `${compositionData.name.replace(/\s+/g, '_')}.json`;
//   document.body.appendChild(a);
//   a.click();
//   document.body.removeChild(a);
//   URL.revokeObjectURL(url);
// };

// Add the missing generateId function
// const generateId = () => {
//   return Date.now().toString() + Math.random().toString(36).substring(2, 9);
// };

// // Add the missing updateKeySignature function
// const updateKeySignature = () => {
//   console.log(`Key signature changed to ${keySignature.value}`);
//   // Update the display based on the key signature
//   // This would update the accidentals displayed on the staff
// };

// // Add missing importedCompositions ref and showImportModal
// const importedCompositions = ref([]);
// const showImportModal = ref(false);

// Add a new ref for the selected note
const selectedNoteId = ref<string | null>(null);

// Add a function to select a note
const selectNote = (note: Note) => {
  selectedNoteId.value = note.id;
};

// Add a function to get the lyric style
const getLyricStyle = (note: Note) => {
  return {
    color: note.id === currentPlayingNoteId.value ? 'red' : 'black',
    fontWeight: note.id === currentPlayingNoteId.value ? 'bold' : 'normal'
  };
};

// Add these refs for playback control
const playbackStartMeasure = ref(1);
const playbackEndMeasure = ref(0); // 0 means play to the end
const autoScrollToPlayingNote = ref(true);

// Add this helper function to calculate which measure a note is in
const getNotesMeasure = (note: Note) => {
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
  currentPlayingNoteId.value = null;
  
  // Initialize Tone.js if needed
  initializeToneJs();
  
  // Get all notes and sort them by position
  const allNotes = [...notes.value];
  const sortedNotes = allNotes.sort((a, b) => a.position - b.position);
  
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
      
      console.log(`Note ${note.id} at position ${note.position * 50}px is in measure ${noteMeasure}, include: ${isAfterStart && isBeforeEnd}`);
      
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
  
  // Play notes in sequence with proper timing
  let totalDelay = 0;
  
  for (const note of filteredNotes) {
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
      const callback = () => {
        currentPlayingNoteId.value = noteToPlay.id;
        
        // Auto-scroll to the playing note if enabled
        if (autoScrollToPlayingNote.value) {
          autoScrollToNote(noteToPlay);
        }
        
        if (noteToPlay.type === 'note' && noteToPlay.pitch) {
          // Play the note using the Tone.js duration format ('4n', '8n', etc.)
          const toneDuration = toneDurationMap[noteToPlay.duration] || '4n';
          playNoteSound(noteToPlay.pitch, toneDuration, noteToPlay.dotted);
        }
        
        // Schedule the end of this note
        const noteEndCallback = () => {
          if (currentPlayingNoteId.value === noteToPlay.id) {
            currentPlayingNoteId.value = null;
          }
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
    
    // Schedule this note
    playNoteWithDelay(note, totalDelay * 1000);
    totalDelay += waitDurationSeconds;
  }
  
  // Stop playing after all notes have played
  const finalTimeoutId = setTimeout(() => {
    // Reset all playback state variables
    isPlaying.value = false;
    isPaused.value = false;
    currentPlayingNoteId.value = null;
    
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
      currentPlayingNoteId.value = null;
    }
  };
};

// Add the autoScrollToNote function
const autoScrollToNote = (note: Note) => {
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
const pausedTimeouts = ref<{id: number, remainingTime: number, callback: Function}[]>([]);

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
      const timeoutInfo = (window as any)[`timeout_${id}_info`];
      if (timeoutInfo) {
        const elapsedTime = Date.now() - timeoutInfo.startTime;
        const remainingTime = Math.max(0, timeoutInfo.duration - elapsedTime);
        
        // Store the timeout info for resuming later
        pausedTimeouts.value.push({
          id,
          remainingTime,
          callback: timeoutInfo.callback
        });
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
  currentPlayingNoteId.value = null;
  
  // Recreate all timeouts with their remaining time
  window.playbackTimeouts = [];
  
  // Sort timeouts by remaining time to ensure they execute in the correct order
  const sortedTimeouts = [...pausedTimeouts.value].sort((a, b) => a.remainingTime - b.remainingTime);
  
  console.log('Resuming playback with', sortedTimeouts.length, 'timeouts');
  
  // Skip any timeouts with very small remaining time (less than 10ms)
  // These are likely to be the ones that would play immediately and cause the first note issue
  const validTimeouts = sortedTimeouts.filter(timeout => timeout.remainingTime > 10);
  
  // Group timeouts that are very close together (within 50ms) to prevent duplicates
  const groupedTimeouts: {remainingTime: number, callbacks: Function[]}[] = [];
  
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
</script>

<style scoped src="@/assets/styles/global.css">
</style>