import type { ComputedRef } from 'vue';

export interface Note {
  id: string;
  type: "note" | "rest";
  pitch?: string;
  duration: string;
  position: number;
  verticalPosition: number;
  dotted?: boolean;
  lyric?: string;
  voiceId?: string;
  voiceColor?: string;
  explicitNatural?: boolean;
}

export interface ChordSymbol {
  id: string;
  position: number;
  chordName: string;
  top: number;
}

export interface VoiceLayer {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  active: boolean;
  selected: boolean;
  volume: number;
  notes: Note[];
}

export interface Section {
  id: string;
  name: string;
  startMeasure: number;
  endMeasure: number;
}

export interface SequenceItem {
  id: string;
  sectionId: string;
}

export interface CompositionData {
  id: string;
  name: string;
  dateCreated: number;
  notes: Note[]; // For a flattened list of all notes from all voices
  voiceLayers?: VoiceLayer[];
  tempo: number;
  clef: string;
  keySignature: string;
  timeSignature?: string;
  chordSymbols?: ChordSymbol[];
  activeVoiceId?: string;
  staffWidth?: number;
  // UI state saved with the composition
  selectedDuration: string;
  selectedNoteType: string;
  selectedAccidental?: string;
  selectedOctave: number;
  isDottedNote: boolean;
  sections?: Section[];
  sequenceItems?: SequenceItem[];
}

export interface NoteWithVoiceInfo extends Note {
  voiceId: string; // Non-optional here
  voiceColor: string; // Non-optional here
} 