interface Voice {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  active: boolean;
  selected: boolean;
  volume: number;
  notes: Note[];
}

interface Composition {
  id: string;
  name: string;
  dateCreated: number;
  notes: Note[]; // All notes (for backward compatibility)
  voiceLayers: Voice[]; // Added voice layers
  activeVoiceId: string;
  timeSignature: string;
  keySignature: string;
  tempo: number;
  clef: string;
  // Other properties
} 