import type { ComputedRef } from 'vue';

export interface Note {
  id: string;
  type: "note" | "rest";
  pitch?: string;
  duration: string;
  position: number;
  verticalPosition: number;
  dotted?: boolean;
  triplet?: boolean;
  lyric?: string;
  explicitNatural?: boolean;
}

export interface ChordSymbol {
  id: string;
  position: number;
  chordName: string;
  top: number;
}

export interface Stave {
  id: string;
  clef: 'treble' | 'bass';
  order: number;
  name: string;
  isCollapsed?: boolean;
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
  staffId: string;
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

export interface TieSlur {
  id: string;
  type: 'tie' | 'slur';
  startNoteId: string;
  endNoteId: string;
  staffId: string;
  curvature: 'above' | 'below';
}

export interface KeySignatureChange {
  id: string;
  measure: number;
  keySignature: string;
  position: number;
}

export interface TimeSignatureChange {
  id: string;
  measure: number;
  numerator: number;
  denominator: number;
  position: number;
}

export interface ClefChange {
  id: string;
  measure: number;
  clef: 'treble' | 'bass';
  position: number;
  staffId: string;
}

export interface PartialMeasure {
  id: string;
  measureNumber: number;
  durationFactor: number; // 0.5 for half duration, 0.25 for quarter duration, etc.
  position: number; // Position on the staff for UI purposes
}

export interface CompositionData {
  id: string;
  name: string;
  dateCreated: number;
  staves?: Stave[];
  voiceLayers?: VoiceLayer[];
  notes?: Note[];
  tempo: number;
  keySignature: string;
  timeSignature?: string;
  chordSymbols?: ChordSymbol[];
  tiesSlurs?: TieSlur[];
  keySignatureChanges?: KeySignatureChange[];
  timeSignatureChanges?: TimeSignatureChange[];
  clefChanges?: ClefChange[];
  partialMeasures?: PartialMeasure[];
  activeVoiceId?: string;
  staffWidth?: number;
  selectedDuration?: string;
  selectedNoteType?: string;
  selectedAccidental?: string | null;
  selectedOctave?: number;
  isDottedNote?: boolean;
  isTripletNote?: boolean;
  sections?: Section[];
  sequenceItems?: SequenceItem[];
}

export interface NoteWithVoiceInfo extends Note {
  voiceId: string;
  voiceColor: string;
  staffId: string;
  staffClef: 'treble' | 'bass';
} 