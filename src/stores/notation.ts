import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface Note {
  id: string;
  type: 'note' | 'rest';
  pitch?: string;
  duration: string;
  position: number;
}

export const useNotationStore = defineStore('notation', () => {
  const notes = ref<Note[]>([]);

  function addNote(note: Note) {
    // Check if there's already a note at this position
    const existingNoteIndex = notes.value.findIndex(n => n.position === note.position);
    
    if (existingNoteIndex !== -1) {
      // Replace existing note
      notes.value.splice(existingNoteIndex, 1, note);
    } else {
      // Add new note
      notes.value.push(note);
    }
  }

  function removeNote(id: string) {
    const index = notes.value.findIndex(note => note.id === id);
    if (index !== -1) {
      notes.value.splice(index, 1);
    }
  }

  function clearNotes() {
    notes.value = [];
  }

  return {
    notes,
    addNote,
    removeNote,
    clearNotes
  };
}); 