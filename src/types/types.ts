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
  isCollapsed: boolean;
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
  activeVoiceId?: string;
  staffWidth?: number;
  selectedDuration?: string;
  selectedNoteType?: string;
  selectedAccidental?: string | null;
  selectedOctave?: number;
  isDottedNote?: boolean;
  sections?: Section[];
  sequenceItems?: SequenceItem[];
}

export interface NoteWithVoiceInfo extends Note {
  voiceId: string;
  voiceColor: string;
  staffId: string;
  staffClef: 'treble' | 'bass';
}

export interface DebugNote {
  id: string;
  staffId: string;
  voiceId: string;
  isRest: boolean;
  position: number;
  duration: string;
} 