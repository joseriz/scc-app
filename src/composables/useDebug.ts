import { ref, Ref, ComputedRef } from 'vue';
import { Note, NoteWithVoiceInfo } from '@/types/notation'; // Assuming types are here
import { useNotationStore } from '@/stores/notation'; // If needed

// Define a type for the notes prop if it's complex
// For simplicity, assuming notes is Ref<Note[]> or Ref<NoteWithVoiceInfo[]>
// and selectedClef is Ref<string>

export function useDebug(
  notesRef: Ref<Note[]>, // Pass the reactive notes array (e.g., activeVoice.value.notes)
  selectedClefRef: Ref<string>,
  lastClickYRef: Ref<number>,
  selectedOctaveRef: Ref<number>
) {
  const debugMode = ref(false);
  const showNotePositions = ref(false);
  const notationStore = useNotationStore(); // If methods from store are used directly

  const toggleDebugMode = () => {
    debugMode.value = !debugMode.value;
  };

  const testAllNotes = () => {
    // Clear existing notes (using the passed ref or store)
    // If using store:
    notationStore.clearNotes();
    // If modifying a passed ref directly (less common for clearing all):
    // notesRef.value = []; 

    let testNotesPitches: string[];

    if (selectedClefRef.value === 'treble') {
      testNotesPitches = [
        'A5', 'G5', 'F5', 'E5', 'D5', 'C5', 'B4', 'A4', 'G4', 'F4', 'E4',
        'D4', 'C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3'
      ];
    } else {
      testNotesPitches = [
        'C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3', 'B2', 'A2', 'G2',
        'F2', 'E2', 'D2', 'C2', 'B1', 'A1', 'G1', 'F1', 'E1'
      ];
    }

    testNotesPitches.forEach((pitch, index) => {
      // Example of adding to store, adjust if adding to notesRef directly
      notationStore.addNote({
        id: `test-${index}`,
        type: 'note',
        pitch,
        duration: 'quarter',
        // verticalPosition and position would need to be calculated or set
        position: index + 1, // Simplified position
        verticalPosition: 130 // Placeholder, needs calculation based on pitch
      });
    });
  };
  
  // Placeholder for debug monitor logic if you want to move it here
  // const debugMonitorInterval = ref<number | null>(null);
  // const addDebugMonitor = () => { /* ... */ };
  // const toggleDebugMonitor = () => { /* ... */ };

  return {
    debugMode,
    showNotePositions,
    // Pass through refs that DebugPanel might need directly if not managed by this composable
    lastClickY: lastClickYRef, 
    selectedOctave: selectedOctaveRef,
    notesForDebug: notesRef, // Pass the original notes ref for the panel

    toggleDebugMode,
    testAllNotes,
    // toggleDebugMonitor, // if moved
  };
} 