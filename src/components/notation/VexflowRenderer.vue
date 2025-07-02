<template>
  <div class="vexflow-container" ref="vexflowContainer">
    <div :id="rendererId" class="vexflow-renderer"
         @click="handleStaffClick"
         @contextmenu.prevent="handleContextMenu"
         @mousedown="handleMouseDown"
         :class="{
           'inserting-space': isInsertingSpace,
           'deleting-space': isDeletingSpace,
           'selecting-range': isSelectingRange,
           'pasting': isPasting,
           'tie-slur-mode': isCreatingTieSlur,
           'key-change-mode': isAddingKeySignatureChange,
           'time-change-mode': isAddingTimeSignatureChange,
           'clef-change-mode': isAddingClefChange
         }"
         :style="{
           cursor: getCursorStyle()
         }">
    </div>
    
    <!-- Selection highlight overlay -->
    <div v-if="selectionStart && selectionEnd" class="selection-highlight"
         :style="getSelectionStyle()">
    </div>
    
    <!-- Error handling -->
    <div v-if="renderError" class="error-message">
      <p>Unable to render notation: {{ renderError }}</p>
      <button @click="retryRender" class="retry-btn">Retry</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, computed } from 'vue';
import { 
  Renderer, 
  Stave, 
  StaveNote, 
  Voice, 
  Formatter, 
  Beam, 
  StaveConnector, 
  StaveTie,
  Accidental,
  Dot,
  Annotation,
  ChordSymbol as VexChordSymbol,
  Barline
} from 'vexflow';
import type { Note } from '@/types/notation';
import type { 
  Stave as StaveType, 
  VoiceLayer, 
  TieSlur, 
  KeySignatureChange,
  TimeSignatureChange,
  ClefChange,
  ChordSymbol,
  NoteWithVoiceInfo
} from '@/types/types';

interface Props {
  staves: StaveType[];
  voiceLayers: VoiceLayer[];
  width?: number;
  height?: number;
  keySignature?: string;
  timeSignature?: string;
  tempo?: number;
  showMeasureNumbers?: boolean;
  measuresPerLine?: number;
  scrollPosition?: number;
  currentPlayingNoteIds?: string[];
  selectedNoteId?: string | null;
  
  // Interactive mode props
  isInsertingSpace?: boolean;
  isDeletingSpace?: boolean;
  isSelectingRange?: boolean;
  isPasting?: boolean;
  isCreatingTieSlur?: boolean;
  isAddingKeySignatureChange?: boolean;
  isAddingTimeSignatureChange?: boolean;
  isAddingClefChange?: boolean;
  
  // Selection props
  selectionStart?: { position: number; staffId: string } | null;
  selectionEnd?: { position: number; staffId: string } | null;
  
  // Additional data
  tiesSlurs?: TieSlur[];
  keySignatureChanges?: KeySignatureChange[];
  timeSignatureChanges?: TimeSignatureChange[];
  clefChanges?: ClefChange[];
  chordSymbols?: ChordSymbol[];
  
  // Read-only mode
  readOnlyMode?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  width: 800,
  height: 300,
  keySignature: 'C',
  timeSignature: '4/4',
  tempo: 120,
  showMeasureNumbers: true,
  measuresPerLine: 4,
  scrollPosition: 0,
  currentPlayingNoteIds: () => [],
  selectedNoteId: null,
  isInsertingSpace: false,
  isDeletingSpace: false,
  isSelectingRange: false,
  isPasting: false,
  isCreatingTieSlur: false,
  isAddingKeySignatureChange: false,
  isAddingTimeSignatureChange: false,
  isAddingClefChange: false,
  selectionStart: null,
  selectionEnd: null,
  tiesSlurs: () => [],
  keySignatureChanges: () => [],
  timeSignatureChanges: () => [],
  clefChanges: () => [],
  chordSymbols: () => [],
  readOnlyMode: false
});

// Emits for interaction
const emit = defineEmits<{
  staffClick: [event: MouseEvent, staffId: string];
  noteClick: [note: NoteWithVoiceInfo];
  noteContextMenu: [note: NoteWithVoiceInfo];
  insertSpace: [event: MouseEvent, staffId: string];
  deleteSpace: [event: MouseEvent, staffId: string];
  rangeSelection: [event: MouseEvent, staffId: string];
  pasteNotes: [event: MouseEvent, staffId: string];
  addKeySignatureChange: [event: MouseEvent, staffId: string];
  addTimeSignatureChange: [event: MouseEvent, staffId: string];
  addClefChange: [event: MouseEvent, staffId: string];
}>();

const vexflowContainer = ref<HTMLElement>();
const rendererId = ref(`vexflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
const renderError = ref<string | null>(null);

let renderer: Renderer | null = null;
let context: any = null;
let noteElements: Map<string, { x: number; y: number; width: number; height: number; staffId: string; note: NoteWithVoiceInfo }> = new Map();

// Computed cursor style based on current mode
const getCursorStyle = () => {
  if (props.isInsertingSpace || props.isDeletingSpace) return 'col-resize';
  if (props.isSelectingRange) return 'copy';
  if (props.isPasting) return 'cell';
  if (props.isAddingKeySignatureChange || props.isAddingTimeSignatureChange || props.isAddingClefChange) return 'pointer';
  return 'default';
};

// Get selection highlight style
const getSelectionStyle = () => {
  if (!props.selectionStart || !props.selectionEnd) return {};
  
  const startX = Math.min(props.selectionStart.position, props.selectionEnd.position) * 25;
  const endX = Math.max(props.selectionStart.position, props.selectionEnd.position) * 25;
  
  return {
    position: 'absolute' as const,
    left: `${startX}px`,
    width: `${endX - startX}px`,
    height: '100%',
    backgroundColor: 'rgba(0, 123, 255, 0.2)',
    pointerEvents: 'none' as const,
    zIndex: 1
  };
};

// Handle click events
const handleStaffClick = (event: MouseEvent) => {
  if (props.readOnlyMode) return;
  
  // Find which staff was clicked
  const clickedStaff = findStaffAtPosition(event.offsetX, event.offsetY);
  if (!clickedStaff) return;
  
  // Check if a note was clicked
  const clickedNote = findNoteAtPosition(event.offsetX, event.offsetY);
  if (clickedNote) {
    emit('noteClick', clickedNote);
    return;
  }
  
  // Handle different interaction modes
  if (props.isInsertingSpace) {
    emit('insertSpace', event, clickedStaff.id);
  } else if (props.isDeletingSpace) {
    emit('deleteSpace', event, clickedStaff.id);
  } else if (props.isSelectingRange) {
    emit('rangeSelection', event, clickedStaff.id);
  } else if (props.isPasting) {
    emit('pasteNotes', event, clickedStaff.id);
  } else if (props.isAddingKeySignatureChange) {
    emit('addKeySignatureChange', event, clickedStaff.id);
  } else if (props.isAddingTimeSignatureChange) {
    emit('addTimeSignatureChange', event, clickedStaff.id);
  } else if (props.isAddingClefChange) {
    emit('addClefChange', event, clickedStaff.id);
  } else {
    emit('staffClick', event, clickedStaff.id);
  }
};

const handleMouseDown = (event: MouseEvent) => {
  // Handle dragging for scrolling if needed
  event.preventDefault();
};

// Add context menu handler
const handleContextMenu = (event: MouseEvent) => {
  if (props.readOnlyMode) return;
  
  // Check if a note was clicked
  const clickedNote = findNoteAtPosition(event.offsetX, event.offsetY);
  if (clickedNote) {
    emit('noteContextMenu', clickedNote);
  }
};

// Find staff at clicked position
const findStaffAtPosition = (x: number, y: number): StaveType | null => {
  const staffHeight = 120;
  const staffIndex = Math.floor((y - 40) / staffHeight);
  return props.staves[staffIndex] || null;
};

// Find note at clicked position
const findNoteAtPosition = (x: number, y: number): NoteWithVoiceInfo | null => {
  for (const [noteId, element] of noteElements) {
    if (x >= element.x && x <= element.x + element.width &&
        y >= element.y && y <= element.y + element.height) {
      return element.note;
    }
  }
  return null;
};

// Convert app duration strings to VexFlow duration codes
function convertDurationToVexFlow(duration: string, isRest: boolean = false): string {
  const durationMap: Record<string, string> = {
    'whole': 'w',
    'half': 'h', 
    'quarter': 'q',
    'eighth': '8',
    'sixteenth': '16',
    'thirty-second': '32'
  };
  
  const vexflowDuration = durationMap[duration] || 'q'; // Default to quarter note
  return isRest ? vexflowDuration + 'r' : vexflowDuration;
}

// Create Vexflow stave note with proper formatting for grid-based sequencer
function createStaveNote(note: Note, clef: string, voiceColor?: string): StaveNote {
  let staveNote: StaveNote;
  
  if (note.type === 'rest') {
    // Use actual duration for rests
    const vexflowDuration = convertDurationToVexFlow(note.duration, true);
    staveNote = new StaveNote({ keys: ['d/5'], duration: vexflowDuration });
  } else {
    // Use the pitch directly and let VexFlow handle clef positioning with proper clef parameter
    let pitchForVexFlow: string;
    
    if (note.pitch) {
      pitchForVexFlow = note.pitch;
      
      // Log the original pitch
      console.log(`Note created - Original pitch: ${note.pitch}, Clef: ${clef}, Position: ${note.position}`);
    } else {
      throw new Error('Note must have pitch');
    }
    
    // Parse the pitch and convert to VexFlow format
    let octave = '4';
    let pitch = pitchForVexFlow;
    
    console.log(`Parsing pitch: ${pitchForVexFlow}`);
    
    const octaveMatch = pitch.match(/\d+$/);
    if (octaveMatch) {
      octave = octaveMatch[0];
      pitch = pitch.replace(/\d+$/, '');
      console.log(`Extracted octave: ${octave}, Note part: ${pitch}`);
    }

    // Convert to VexFlow format
    let noteName = pitch.charAt(0).toLowerCase();
    const accidental = pitch.slice(1);
    const vexflowNote = `${noteName}${accidental}/${octave}`;
    
    console.log(`Final VexFlow format: ${vexflowNote} with clef: ${clef}`);
    
    // Use actual duration from the note data
    const vexflowDuration = convertDurationToVexFlow(note.duration, false);
    
    // IMPORTANT: Pass the clef to StaveNote so VexFlow interprets pitches correctly!
    staveNote = new StaveNote({ 
      keys: [vexflowNote], 
      duration: vexflowDuration,
      clef: clef  // This tells VexFlow how to interpret the pitch
    });
    
    // Handle accidentals - use the original pitch to preserve accidental information
    const originalPitch = note.pitch || pitchForVexFlow;
    if (originalPitch.includes('#')) {
      staveNote.addModifier(new Accidental('#'), 0);
    } else if (originalPitch.includes('b')) {
      staveNote.addModifier(new Accidental('b'), 0);
    } else if ((note as any).explicitNatural) {
      staveNote.addModifier(new Accidental('n'), 0);
    }
    
    // Add dots if the original note was dotted (visual indicator)
    if (note.dotted) {
      staveNote.addModifier(new Dot(), 0);
    }
    
    // Add lyrics as annotations
    if (note.lyric) {
      const annotation = new Annotation(note.lyric);
      annotation.setVerticalJustification(Annotation.VerticalJustify.BOTTOM);
      staveNote.addModifier(annotation, 0);
    }
  }
  
  return staveNote;
}

// Get key signature for Vexflow
function getVexflowKeySignature(keySignature: string): string {
  const keyMap: Record<string, string> = {
    'C': 'C', 'Am': 'C',
    'G': 'G', 'Em': 'G',
    'D': 'D', 'Bm': 'D',
    'A': 'A', 'F#m': 'A',
    'E': 'E', 'C#m': 'E',
    'B': 'B', 'G#m': 'B',
    'F#': 'F#', 'D#m': 'F#',
    'C#': 'C#', 'A#m': 'C#',
    'F': 'F', 'Dm': 'F',
    'Bb': 'Bb', 'Gm': 'Bb',
    'Eb': 'Eb', 'Cm': 'Eb',
    'Ab': 'Ab', 'Fm': 'Ab',
    'Db': 'Db', 'Bbm': 'Db',
    'Gb': 'Gb', 'Ebm': 'Gb',
    'Cb': 'Cb', 'Abm': 'Cb'
  };
  
  return keyMap[keySignature] || 'C';
}

// Calculate measure width based on time signature (copied from NotationEditorView)
function getMeasureWidth(numerator: number, denominator: number): number {
  if (isNaN(numerator) || isNaN(denominator) || denominator === 0 || numerator === 0) {
    return 50 * 8; // Default to wider measure
  }

  // Base width per quarter note - increased to allow more note positions
  const quarterNoteWidth = 50;
  
  // Calculate minimum positions needed per measure (at least 8 for flexibility)
  const minimumPositionsPerMeasure = 8;

  // Calculate beats based on time signature
  let beatsPerMeasure = numerator;
  let beatUnit = denominator;

  // Compound meters (6/8, 9/8, 12/8) have different beat structures
  if ([6, 9, 12].includes(numerator) && denominator === 8) {
    beatsPerMeasure = numerator / 3;
    beatUnit = 4;
  }

  // Calculate width based on beat unit, but ensure minimum width for note placement
  let beatWidth = quarterNoteWidth;
  if (beatUnit === 2) beatWidth = quarterNoteWidth * 2; // Half note
  if (beatUnit === 8) beatWidth = quarterNoteWidth / 2; // Eighth note

  // Calculate base width from time signature
  const baseWidth = beatsPerMeasure * beatWidth;
  
  // Ensure we have enough positions (minimum 25px per position for tight packing)
  const minWidthForPositions = minimumPositionsPerMeasure * 25;
  const width = Math.max(baseWidth, minWidthForPositions);
  
  return width;
}

// Get key signature accidentals count (approximation based on common key signatures)
function getKeySignatureWidth(keySignature: string): number {
  const keySignatureAccidentals: Record<string, string[]> = {
    'C': [], 'Am': [],
    'G': ['F#'], 'Em': ['F#'],
    'D': ['F#', 'C#'], 'Bm': ['F#', 'C#'],
    'A': ['F#', 'C#', 'G#'], 'F#m': ['F#', 'C#', 'G#'],
    'E': ['F#', 'C#', 'G#', 'D#'], 'C#m': ['F#', 'C#', 'G#', 'D#'],
    'B': ['F#', 'C#', 'G#', 'D#', 'A#'], 'G#m': ['F#', 'C#', 'G#', 'D#', 'A#'],
    'F#': ['F#', 'C#', 'G#', 'D#', 'A#', 'E#'], 'D#m': ['F#', 'C#', 'G#', 'D#', 'A#', 'E#'],
    'C#': ['F#', 'C#', 'G#', 'D#', 'A#', 'E#', 'B#'], 'A#m': ['F#', 'C#', 'G#', 'D#', 'A#', 'E#', 'B#'],
    'F': ['Bb'], 'Dm': ['Bb'],
    'Bb': ['Bb', 'Eb'], 'Gm': ['Bb', 'Eb'],
    'Eb': ['Bb', 'Eb', 'Ab'], 'Cm': ['Bb', 'Eb', 'Ab'],
    'Ab': ['Bb', 'Eb', 'Ab', 'Db'], 'Fm': ['Bb', 'Eb', 'Ab', 'Db'],
    'Db': ['Bb', 'Eb', 'Ab', 'Db', 'Gb'], 'Bbm': ['Bb', 'Eb', 'Ab', 'Db', 'Gb'],
    'Gb': ['Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'], 'Ebm': ['Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'],
    'Cb': ['Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb', 'Fb'], 'Abm': ['Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb', 'Fb']
  };
  
  const accidentals = keySignatureAccidentals[keySignature] || [];
  return accidentals.length * 10; // 10px per accidental
}

// Calculate measureWidthByTimeSignature exactly like NotationEditorView
function calculateMeasureWidthByTimeSignature(timeSignature: string): number {
  const parts = timeSignature.split('/');
  if (parts.length !== 2) {
    return 50 * 8; // Default to wider measure (400px) to allow more notes
  }
  const [numeratorStr, denominatorStr] = parts;
  const numerator = parseInt(numeratorStr);
  const denominator = parseInt(denominatorStr);

  if (isNaN(numerator) || isNaN(denominator) || denominator === 0 || numerator === 0) {
    return 50 * 8; // Default to wider measure
  }

  const width = getMeasureWidth(numerator, denominator);
  console.log(`VexFlow Measure width for ${timeSignature}: ${width}px (${Math.floor(width/25)} possible positions)`);
  return width;
}

// EXACT copy of getNotesMeasure logic from NotationEditorView
function getNotesMeasure(note: Note, keySignature: string, timeSignature: string): number {
  // Calculate the horizontal position in pixels using new 25px grid
  const notePosition = note.position * 25;

  // Calculate the initial position (where measure 1 starts)
  const globalKeySignatureWidth = getKeySignatureWidth(keySignature);
  const initialPosition = 70 + globalKeySignatureWidth + 20; // clef + global key sig + time sig

  // If the note is before the first measure, return 0
  if (notePosition < initialPosition) {
    return 0;
  }

  // Calculate the relative position from the start of the first measure
  const relativePosition = notePosition - initialPosition;

  // Calculate which measure this note is in
  // Use measureWidthByTimeSignature for correct measure width based on time signature
  const measureWidth = calculateMeasureWidthByTimeSignature(timeSignature);
  return Math.floor(relativePosition / measureWidth) + 1;
}

// Group notes by measure using EXACT same logic as main editor
function groupNotesByMeasure(notes: Note[], keySignature: string, timeSignature: string): Note[][] {
  if (notes.length === 0) return []; // Return empty array for no notes
  
  const measures: Note[][] = [];
  const sortedNotes = [...notes].sort((a, b) => a.position - b.position);
  
  // Group notes by their calculated measure numbers using EXACT getNotesMeasure logic
  const measureMap = new Map<number, Note[]>();
  
  for (const note of sortedNotes) {
    const measureNumber = getNotesMeasure(note, keySignature, timeSignature);
    
    if (!measureMap.has(measureNumber)) {
      measureMap.set(measureNumber, []);
    }
    
    measureMap.get(measureNumber)!.push(note);
  }
  
  // Convert map to array, ensuring we have all measures in sequence
  if (measureMap.size > 0) {
    const minMeasure = Math.min(...measureMap.keys());
    const maxMeasure = Math.max(...measureMap.keys());
    
    // Start from measure 1 or the first measure with notes
    const startMeasure = Math.min(1, minMeasure);
    
    for (let i = startMeasure; i <= maxMeasure; i++) {
      // Convert measure number to 0-based index for array
      const arrayIndex = i - startMeasure;
      measures[arrayIndex] = measureMap.get(i) || [];
    }
  }
  
  // If we have no notes, ensure we have at least one empty measure for rendering
  if (measures.length === 0) {
    measures.push([]);
  }
  
  // Debug log to see measure grouping
  console.log('VexFlow measure grouping (using EXACT NotationEditorView logic):', 
    measures.map((measure, index) => ({
      measureIndex: index,
      noteCount: measure.length,
      notePositions: measure.map(n => n.position),
      actualMeasureNumber: index + 1,
      calculatedMeasures: measure.map(n => getNotesMeasure(n, keySignature, timeSignature))
    })));
  
  return measures;
}

// Main render function
function renderNotation() {
  if (!vexflowContainer.value) return;
  
  renderError.value = null;
  noteElements.clear();
  
  const container = document.getElementById(rendererId.value);
  if (!container) return;
  container.innerHTML = '';

  try {
    // Create renderer
    renderer = new Renderer(container as HTMLDivElement, Renderer.Backends.SVG);
    
    const calculatedHeight = Math.max(props.height, props.staves.length * 120 + 100);
    
    // Calculate measure width dynamically based on note density (not fixed musical rules)
    const calculateMeasureWidth = (noteCount: number): number => {
      const minWidth = 150; // Minimum measure width
      const noteSpacing = 40; // Space per note
      return Math.max(minWidth, noteCount * noteSpacing + 100); // Extra space for clefs/signatures
    };
    
    // Calculate total width needed for all measures
    let totalWidthNeeded = 10; // Start margin
    
    // First pass: Calculate maximum width needed for each measure across ALL staves
    const globalMeasureWidths: number[] = [];
    props.staves.forEach((staff) => {
      const staffVoices = props.voiceLayers.filter(v => v.staffId === staff.id && v.visible);
      staffVoices.forEach((voiceLayer) => {
        const [beatsPerMeasure] = props.timeSignature.split('/').map(Number);
        const measures = groupNotesByMeasure(voiceLayer.notes, props.keySignature, props.timeSignature);
        
        measures.forEach((measureNotes, measureIndex) => {
          const requiredWidth = calculateMeasureWidth(measureNotes.length);
          if (globalMeasureWidths[measureIndex] === undefined) {
            globalMeasureWidths[measureIndex] = requiredWidth;
          } else {
            // Use the maximum width needed across all staves for this measure
            globalMeasureWidths[measureIndex] = Math.max(globalMeasureWidths[measureIndex], requiredWidth);
          }
        });
      });
    });
    
    // Ensure we have at least one measure width
    if (globalMeasureWidths.length === 0) {
      globalMeasureWidths.push(calculateMeasureWidth(0));
    }
    
    // Calculate total width needed
    totalWidthNeeded = 10 + globalMeasureWidths.reduce((sum, width) => sum + width, 0) + 20; // margins
    const rendererWidth = Math.max(props.width, totalWidthNeeded);
    
    renderer.resize(rendererWidth, calculatedHeight);
    context = renderer.getContext();

    let yOffset = 40;
    // Render each staff
    props.staves.forEach((staff, staffIndex) => {
      const staffVoices = props.voiceLayers.filter(v => v.staffId === staff.id && v.visible);
      
      if (staffVoices.length === 0) {
        // Still draw empty staff with separate staves per measure
        let currentX = 10;
        
        globalMeasureWidths.forEach((width, measureIndex) => {
          const stave = new Stave(currentX, yOffset, width);
          
          // Add clef, key signature, and time signature only to first measure
          if (measureIndex === 0) {
            stave.addClef(staff.clef || 'treble');
            stave.addKeySignature(getVexflowKeySignature(props.keySignature));
            stave.addTimeSignature(props.timeSignature);
          } else {
            // Set barline type for subsequent measures
            stave.setBegBarType(Barline.type.SINGLE);
          }
          
          // Set end barline
          if (measureIndex === globalMeasureWidths.length - 1) {
            stave.setEndBarType(Barline.type.END);
          } else {
            stave.setEndBarType(Barline.type.SINGLE);
          }
          
          stave.setContext(context).draw();
          
          // Add measure number
          context.fillStyle = '#666';
          context.font = '12px Arial';
          context.textAlign = 'left';
          context.fillText((measureIndex + 1).toString(), currentX + 5, yOffset + 100);
          
          currentX += width;
        });
        
        yOffset += 120;
        return;
      }

      // Process each voice layer with separate staves per measure
      let currentX = 10;
      const allStavesForThisStaff: Stave[] = [];
      
      // Create staves for all measures first
      globalMeasureWidths.forEach((width, measureIndex) => {
        const stave = new Stave(currentX, yOffset, width);
        
        // Add clef, key signature, and time signature only to first measure
        if (measureIndex === 0) {
          stave.addClef(staff.clef || 'treble');
          stave.addKeySignature(getVexflowKeySignature(props.keySignature));
          stave.addTimeSignature(props.timeSignature);
        } else {
          // Set barline type for subsequent measures
          stave.setBegBarType(Barline.type.SINGLE);
        }
        
        // Set end barline
        if (measureIndex === globalMeasureWidths.length - 1) {
          stave.setEndBarType(Barline.type.END);
        } else {
          stave.setEndBarType(Barline.type.SINGLE);
        }
        
        stave.setContext(context).draw();
        
        // Add measure number
        context.fillStyle = '#666';
        context.font = '12px Arial';
        context.textAlign = 'left';
        context.fillText((measureIndex + 1).toString(), currentX + 5, yOffset + 100);
        
        allStavesForThisStaff.push(stave);
        currentX += width;
      });

      // Now process each voice layer
      staffVoices.forEach((voiceLayer) => {
        console.log(`Processing voice layer ${voiceLayer.id} with ${voiceLayer.notes.length} total notes`);
        
        // Group notes by their proper measure
        const measures = groupNotesByMeasure(voiceLayer.notes, props.keySignature, props.timeSignature);
        console.log('Notes grouped by measure:', measures.map((m, i) => ({ 
          measure: i, 
          noteCount: m.length, 
          positions: m.map(n => n.position),
          pitches: m.map(n => n.pitch)
        })));
        
        // Render each measure separately
        measures.forEach((measureNotes, measureIndex) => {
          if (measureIndex >= allStavesForThisStaff.length) return; // Skip if beyond our staves
          
          const stave = allStavesForThisStaff[measureIndex];
          
          if (measureNotes.length > 0) {
            try {
              console.log(`Rendering measure ${measureIndex + 1} with ${measureNotes.length} notes`);
              
              // Sort by position for proper order
              const sortedNotes = measureNotes.sort((a, b) => a.position - b.position);
              
              const vexflowNotes = sortedNotes.map((note) => {
                const staveNote = createStaveNote(note, staff.clef || 'treble', voiceLayer.color);
                
                // Apply visual effects
                if (props.currentPlayingNoteIds.includes(note.id)) {
                  staveNote.setStyle({ fillStyle: '#FFD700', strokeStyle: '#FFD700' });
                } else if (props.selectedNoteId === note.id) {
                  staveNote.setStyle({ fillStyle: '#87CEEB', strokeStyle: '#87CEEB' });
                } else {
                  staveNote.setStyle({ fillStyle: voiceLayer.color, strokeStyle: voiceLayer.color });
                }
                
                return staveNote;
              });

              // Store note positions
              vexflowNotes.forEach((staveNote, index) => {
                const note = sortedNotes[index];
                noteElements.set(note.id, {
                  x: 0, // Will be updated after formatting
                  y: 0, // Will be updated after formatting  
                  width: 30,
                  height: 30,
                  staffId: staff.id,
                  note: {
                    ...note,
                    voiceId: voiceLayer.id,
                    voiceColor: voiceLayer.color,
                    staffId: staff.id,
                    staffClef: staff.clef || 'treble'
                  } as NoteWithVoiceInfo
                });
              });

              // Create voice for this measure only
              const voice = new Voice({ 
                numBeats: 4, // Default, doesn't matter with SOFT mode
                beatValue: 4
              });
              
              // Set the voice mode to soft to disable timing validation
              voice.setMode(Voice.Mode.SOFT);
              
              voice.addTickables(vexflowNotes);
              
              // Format and draw the voice for this measure
              const formatter = new Formatter();
              formatter.joinVoices([voice]);
              formatter.formatToStave([voice], stave);
              voice.draw(context, stave);
              
              // Update note positions after VexFlow has rendered them
              vexflowNotes.forEach((staveNote, index) => {
                const note = sortedNotes[index];
                const noteElement = noteElements.get(note.id);
                if (noteElement && staveNote.getAbsoluteX) {
                  // Get the actual rendered position from VexFlow
                  noteElement.x = staveNote.getAbsoluteX();
                  noteElement.y = staveNote.getYs()[0] || yOffset + 40; // Use first y position or fallback
                  
                  // Update bounding box for click detection
                  const bbox = staveNote.getBoundingBox();
                  if (bbox) {
                    noteElement.width = bbox.getW();
                    noteElement.height = bbox.getH();
                  }
                }
              });
              
              console.log(`✅ Measure ${measureIndex + 1}: rendered ${vexflowNotes.length} notes`);
              
            } catch (voiceError) {
              console.warn(`❌ Measure ${measureIndex + 1} failed:`, voiceError);
            }
          }
        });
      });

      yOffset += 120;
    });

    // Add ties and slurs
    renderTiesAndSlurs();
    
    // Add chord symbols
    renderChordSymbols();
    
    // Connect multiple staves with bracket
    if (props.staves.length > 1) {
      try {
        const connectorWidth = 150; // Use minimum width for connector
        const topStave = new Stave(10, 40, connectorWidth);
        const bottomStave = new Stave(10, 40 + (props.staves.length - 1) * 120, connectorWidth);
        const connector = new StaveConnector(topStave, bottomStave);
        connector.setType(StaveConnector.type.BRACKET);
        connector.setContext(context).draw();
      } catch (connectorError) {
        console.warn('Staff connector creation failed:', connectorError);
      }
    }

  } catch (error) {
    console.error('Vexflow rendering error:', error);
    renderError.value = error instanceof Error ? error.message : 'Unknown rendering error';
  }
}

// Render ties and slurs
function renderTiesAndSlurs() {
  if (!props.tiesSlurs || !context) return;
  
  props.tiesSlurs.forEach(tieSlur => {
    const startNote = noteElements.get(tieSlur.startNoteId);
    const endNote = noteElements.get(tieSlur.endNoteId);
    
    if (startNote && endNote) {
      try {
        // Create a simple tie/slur using SVG path
        const startX = startNote.x + 15;
        const startY = startNote.y + (tieSlur.curvature === 'above' ? 0 : 30);
        const endX = endNote.x + 15;
        const endY = endNote.y + (tieSlur.curvature === 'above' ? 0 : 30);
        
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2 + (tieSlur.curvature === 'above' ? -20 : 20);
        
        context.beginPath();
        context.moveTo(startX, startY);
        context.quadraticCurveTo(midX, midY, endX, endY);
        context.strokeStyle = tieSlur.type === 'tie' ? '#000' : '#666';
        context.lineWidth = 2;
        context.stroke();
      } catch (error) {
        console.warn('Tie/slur rendering failed:', error);
      }
    }
  });
}

// Render chord symbols
function renderChordSymbols() {
  if (!props.chordSymbols || !context) return;
  
  props.chordSymbols.forEach(chord => {
    try {
      const x = chord.position * 25;
      const y = 20; // Above the staff
      
      context.fillStyle = '#000';
      context.font = '14px Arial';
      context.fillText(chord.chordName, x, y);
    } catch (error) {
      console.warn('Chord symbol rendering failed:', error);
    }
  });
}

function retryRender() {
  renderError.value = null;
  nextTick(() => {
    renderNotation();
  });
}

// Watch for changes and re-render
watch(() => [
  props.staves, 
  props.voiceLayers, 
  props.keySignature, 
  props.timeSignature,
  props.currentPlayingNoteIds,
  props.selectedNoteId,
  props.tiesSlurs,
  props.chordSymbols
], () => {
  nextTick(() => {
    renderNotation();
  });
}, { deep: true });

onMounted(() => {
  nextTick(() => {
    renderNotation();
  });
});
</script>

<style scoped>
.vexflow-container {
  width: 100%;
  overflow-x: auto;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  position: relative;
}

.vexflow-renderer {
  min-height: 200px;
  position: relative;
}

.vexflow-renderer svg {
  max-width: 100%;
  height: auto;
}

/* Interactive mode cursors */
.vexflow-renderer.inserting-space,
.vexflow-renderer.deleting-space {
  cursor: col-resize;
}

.vexflow-renderer.selecting-range {
  cursor: copy;
}

.vexflow-renderer.pasting {
  cursor: cell;
}

.vexflow-renderer.tie-slur-mode,
.vexflow-renderer.key-change-mode,
.vexflow-renderer.time-change-mode,
.vexflow-renderer.clef-change-mode {
  cursor: pointer;
}

.selection-highlight {
  position: absolute;
  background-color: rgba(0, 123, 255, 0.2);
  pointer-events: none;
  z-index: 1;
}

.error-message {
  padding: 20px;
  text-align: center;
  color: #d32f2f;
  background: #ffebee;
  border-radius: 4px;
  margin: 10px;
}

.retry-btn {
  margin-top: 10px;
  padding: 8px 16px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.retry-btn:hover {
  background: #1976D2;
}
</style> 