import { Note, VoiceLayer } from '@/types/types'; // Import shared types

// interface Voice { // Remove this local definition, use imported VoiceLayer
//   id: string;
//   name: string;
//   color: string;
//   visible: boolean;
//   active: boolean;
//   selected: boolean;
//   volume: number;
//   notes: Note[];
// }

interface Composition {
  id: string;
  name: string;
  dateCreated: number;
  notes: Note[]; // All notes (for backward compatibility)
  voiceLayers: VoiceLayer[]; // Updated to use imported VoiceLayer
  activeVoiceId: string;
  timeSignature: string;
  keySignature: string;
  tempo: number;
  clef: string;
  // Other properties
} 