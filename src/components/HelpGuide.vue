<template>
  <div class="help-overlay" v-if="isVisible">
    <div class="help-container">
      <div class="help-header">
        <h1>St Cecilia's Songbook Help</h1>
        <button class="close-button" @click="close">×</button>
      </div>
      
      <div class="help-content">
        <div
          class="help-tabs-container"
          :class="{
            'scrollable-left': canScrollLeft,
            'scrollable-right': canScrollRight
          }"
        >
          <div
            ref="tabsScrollRef"  
            class="help-tabs-scroll"
            @scroll.passive="updateScrollIndicators" 
            @touchstart="handleTouchStart"
            @touchmove="handleTouchMove"
            @touchend="handleTouchEnd"
          >
            <div 
              v-for="tab in tabs" 
              :key="tab.id" 
              @click="activeTab = tab.id"
              :class="['tab-item', { active: activeTab === tab.id }]"
            >
              {{ tab.label }}
            </div>
          </div>
        </div>
        
        <div class="tab-content">
          <!-- Basic Usage Tab -->
          <div v-if="activeTab === 'basics'" class="tab-pane">
            <h2>Basic Interface Navigation</h2>
            
            <div class="help-section">
              <h3>Desktop Interface</h3>
              <ul>
                <li><strong>Staff Area:</strong> The central area with five lines where you place notes.</li>
                <li><strong>Control Panels:</strong> Located around the staff for adjusting musical elements (note input, playback, tempo, etc.).</li>
                <li><strong>Main Controls:</strong> Typically found in sections for Note Input, Playback, Lyrics, Voices, and Saved Compositions.</li>
              </ul>
            </div>
            
            <div class="help-section">
              <h3>Mobile Interface</h3>
              <ul>
                <li><strong>Tab Navigation:</strong> Switch between "Notes" (for input controls) and "Saved" (for managing compositions) using the tabs at the bottom.</li>
                <li><strong>Scrollable Staff:</strong> Use swipe gestures or arrow buttons (if available) to navigate horizontally.</li>
                <li><strong>Touch Controls:</strong> Tap to add notes, long-press on a note to remove it.</li>
              </ul>
            </div>
            
            <div class="help-section">
              <h3>Creating Your First Notes</h3>
              <ol>
                <li>Ensure a staff exists. If not, click "Add New Staff".</li>
                <li>Select a voice layer (a default one is usually created with a new staff).</li>
                <li>Select "Note" in the Type section.</li>
                <li>Choose a duration (quarter notes are a good start)</li>
                <li>Select an octave (4 is middle range)</li>
                <li>Click on the staff to place your note</li>
                <li>Continue adding notes to create a melody</li>
              </ol>
              <div class="help-tip">
                <strong>Tip:</strong> Start with a simple melody using just quarter notes before exploring more complex features.
              </div>
            </div>
          </div>
          
          <!-- Staves & Layout Tab (New/Renamed) -->
          <div v-if="activeTab === 'staves'" class="tab-pane">
            <h2>Staves & Layout</h2>
            <p>Manage multiple staves for more complex scores, like piano music or small ensembles.</p>

            <div class="help-section">
              <h3>Adding and Removing Staves</h3>
              <ul>
                <li><strong>Add New Staff:</strong> Click the "Add New Staff" button. A new staff with a default voice layer will be added below existing staves.</li>
                <li><strong>Remove Staff:</strong> Click the "Remove Staff" button (often an 'X' or "Remove") next to a staff's controls. You'll be asked for confirmation. The last staff cannot usually be removed. Removing a staff also removes all its associated voice layers and notes.</li>
              </ul>
            </div>

            <div class="help-section">
              <h3>Staff Controls</h3>
              <ul>
                <li><strong>Rename Staff:</strong> Click on the staff's name (e.g., "Staff 1"). An input field will appear. Type the new name and press Enter or click away to save.</li>
                <li><strong>Change Clef:</strong> Each staff has its own clef (Treble or Bass). Use the clef selector next to the staff's name to change it. Notes on that staff will adjust their vertical positions accordingly.</li>
                <li><strong>Collapse/Expand Staff:</strong> Click the "Collapse" or "Expand" button next to a staff's controls to hide or show its musical content. This is useful for focusing on specific parts of a large score. The staff's header controls remain visible.</li>
              </ul>
            </div>

            <div class="help-section">
              <h3>Staff Navigation</h3>
              <ul>
                <li><strong>Scrolling:</strong> If the music is wider than the screen, use the global scroll controls (◀ and ▶ buttons) or drag the staff area horizontally to view different parts of the score.</li>
                <li><strong>Extend Staff:</strong> Click the "Extend Staff" button (often found with scroll controls) to add more measures to the right, increasing the total width for all staves.</li>
              </ul>
              <div class="help-tip">
                <strong>Tip:</strong> Use multiple staves for instruments with wide ranges (like piano) or for different instrumental/vocal parts in an ensemble.
              </div>
            </div>
          </div>
          
          <!-- Notes & Editing Tab -->
          <div v-if="activeTab === 'notes'" class="tab-pane">
            <h2>Creating and Editing Music</h2>
            
            <div class="help-section">
              <h3>Adding Notes and Rests</h3>
              <ol>
                <li><strong>Select Note Type:</strong> Choose between "Note" or "Rest" from the input controls.</li>
                <li><strong>Select Duration:</strong> Choose whole, half, quarter, eighth, or sixteenth.</li>
                <li><strong>Select Accidental (for notes):</strong> Choose natural, sharp, or flat.
                  <ul>
                    <li>A <strong>natural</strong> (♮) explicitly cancels any sharp or flat that would otherwise apply from the key signature or a previous accidental in the same measure.</li>
                    <li>A <strong>sharp</strong> (♯) raises the pitch by a semitone.</li>
                    <li>A <strong>flat</strong> (♭) lowers the pitch by a semitone.</li>
                  </ul>
                </li>
                <li><strong>Select Octave (for notes):</strong> Choose the desired octave.</li>
                <li><strong>Dotted Notes:</strong> Toggle the "Dotted" option to make the selected duration dotted (extends duration by half).</li>
                <li><strong>Add to Staff:</strong> Click/tap on the staff at the desired vertical position within the currently active voice layer.</li>
              </ol>
            </div>
            
            <div class="help-section">
              <h3>Editing Notes</h3>
              <ul>
                <li><strong>Select a Note:</strong> Click/tap once on a note to select it. This is necessary for actions like adding lyrics or if other selection-based operations are implemented. The selected note is often highlighted.</li>
                <li><strong>Change a Note:</strong> With desired input controls (duration, pitch, etc.) selected, click/tap on an existing note's position to replace it.</li>
                <li><strong>Delete a Note:</strong>
                  <ul>
                    <li>Desktop: Right-click on a note.</li>
                    <li>Mobile: Long-press on a note.</li>
                  </ul>
                </li>
              </ul>
            </div>
            
            <div class="help-section">
              <h3>Adding Lyrics</h3>
              <ol>
                <li>Select a note on the staff by clicking/tapping it.</li>
                <li>Enter the lyric text in the "Lyrics" input field.</li>
                <li>Press Enter or click the "Set Lyric" (or similar) button.</li>
                <li>Lyrics will appear beneath the selected note, associated with its voice layer.</li>
              </ol>
              <div class="help-tip">
                <strong>Tip:</strong> Lyrics are tied to specific notes within voice layers and will share the voice's color.
              </div>
            </div>

            <div class="help-section">
              <h3>Key Signatures and Accidentals</h3>
              <ul>
                <li>Notes will automatically reflect the current key signature. For example, in G Major, all F's will sound and appear as F-sharps unless an explicit natural or flat is applied.</li>
                <li>If you place an explicit natural (♮) on a note that is sharpened or flattened by the key signature, it will be displayed with a natural sign and play as a natural. Its stored pitch value will be the natural pitch.</li>
                <li>If you place an explicit sharp (♯) or flat (♭) on a note, that accidental takes precedence over the key signature for that specific note.</li>
              </ul>
            </div>
          </div>
          
          <!-- Voice Layers Tab -->
          <div v-if="activeTab === 'voices'" class="tab-pane">
            <h2>Voice Layers</h2>
            <p>Voice layers allow you to write multiple independent musical lines (e.g., for different instruments or vocal parts) within the same composition.</p>

            <div class="help-section">
              <h3>Managing Voices</h3>
              <ul>
                <li><strong>Active Voice:</strong> Only one voice can be active for note input at a time. Notes you add will be placed in the currently active voice. The active voice is usually indicated in the Voice Layers panel.</li>
                <li><strong>Switch Active Voice:</strong> Click the "Switch" or "Activate" button next to a voice in the Voice Layers panel. This will also make the staff that voice is assigned to the active staff.</li>
                <li><strong>Add New Voice:</strong> Click the "Add Voice Layer" button. New voices get a default name and a unique color. You may be prompted to assign it to a staff, or it might default to the currently active staff.</li>
                <li><strong>Assign Voice to Staff:</strong> In the Voice Layers panel, there's usually an option (e.g., a dropdown menu) next to each voice to select which staff it belongs to. This allows you to move a voice from one staff to another.</li>
                <li><strong>Rename Voice:</strong> Click the "Rename" button for a voice, enter the new name, and confirm.</li>
                <li><strong>Change Voice Color:</strong> Click the color swatch next to a voice to open a color picker or cycle through predefined colors.</li>
                <li><strong>Toggle Visibility:</strong> Use the eye icon or checkbox to show/hide a voice layer on the staff. Hidden voices are not included in playback unless specified.</li>
                <li><strong>Delete Voice:</strong> Click the "Delete" button for a voice. You'll be asked for confirmation as this action also deletes all notes in that voice. You typically cannot delete the last remaining voice.</li>
              </ul>
            </div>

            <div class="help-section">
              <h3>Voices and Playback</h3>
              <ul>
                <li><strong>Playback All Visible:</strong> By default, all visible voices might play.</li>
                <li><strong>Play Selected Voices Only:</strong> Some playback settings might allow you to choose to play only the voices that are marked as "selected" in the Voice Layers panel.</li>
                <li><strong>Volume:</strong> Each voice layer typically has its own volume control (e.g., a slider from 0-100%) in the Voice Layers panel, allowing you to balance the different parts.</li>
              </ul>
            </div>

            <div class="help-section">
              <h3>Voices and Export</h3>
              <ul>
                <li>When exporting a composition, you may have an option to "Export selected voices only." If checked, only the voices marked as "selected" in the Voice Layers panel will be included in the exported file. Otherwise, all voices are typically included.</li>
              </ul>
              <div class="help-tip">
                <strong>Tip:</strong> Use different colors for voices to easily distinguish them on the staff, especially when multiple lines are complex.
              </div>
            </div>
          </div>
          
          <!-- Musical Elements Tab -->
          <div v-if="activeTab === 'elements'" class="tab-pane">
            <h2>Musical Elements</h2>
            
            <div class="help-section">
              <h3>Clef Selection (Global/Default)</h3>
              <ul>
                <li>A global clef setting might apply to newly created staves or if only one staff is used.</li>
                <li>However, each staff typically has its own independent clef control (see "Staves & Layout" tab).</li>
              </ul>
            </div>
            
            <div class="help-section">
              <h3>Key Signature</h3>
              <ul>
                <li>Select from all major key signatures (0-7 sharps/flats)</li>
                <li>Notes affected by the key signature will automatically display correctly</li>
              </ul>
              <div class="help-tip">
                <strong>Tip:</strong> If you're writing in C major or A minor, select "C Maj (0)" as your key signature.
              </div>
            </div>
            
            <div class="help-section">
              <h3>Time Signature</h3>
              <ul>
                <li>Choose standard time signatures (4/4, 3/4, 2/4, etc.)</li>
                <li>Affects measure display and playback timing</li>
              </ul>
            </div>
            
            <div class="help-section">
              <h3>Tempo Control</h3>
              <ul>
                <li>Adjust the slider or input field to set the tempo in Beats Per Minute (BPM).</li>
                <li>Affects playback speed of your composition.</li>
              </ul>
            </div>

            <div class="help-section">
              <h3>Chord Symbols</h3>
              <ul>
                <li>Chord symbols can be displayed above the staff.</li>
                <li><strong>Adding Chords:</strong> If a chord input mode is active (e.g., via a button in a settings or debug panel), clicking on the staff might prompt you to enter a chord name. Chords are typically added at a specific horizontal position.</li>
                <li>Example chords might also be available to add for demonstration.</li>
              </ul>
              <div class="help-tip">
                <strong>Tip:</strong> Chord symbols are useful for lead sheets or indicating harmonic structure.
              </div>
            </div>
          </div>
          
          <!-- Sections & Sequence Tab (New) -->
          <div v-if="activeTab === 'sections'" class="tab-pane">
            <h2>Sections & Sequencing</h2>
            <p>Organize your composition into named sections (e.g., Verse, Chorus, Bridge) and arrange them for playback.</p>

            <div class="help-section">
              <h3>Defining Sections</h3>
              <ul>
                <li><strong>Access:</strong> Open the "Sections" panel (usually via a tab or button).</li>
                <li><strong>Add Section:</strong>
                  <ol>
                    <li>Enter a name for your section (e.g., "Intro", "Verse 1").</li>
                    <li>Specify the "Start Measure" and "End Measure" for the section.</li>
                    <li>Click "Add Section".</li>
                  </ol>
                </li>
                <li><strong>Section Markers:</strong> Named sections will appear as markers above the staves, indicating their span.</li>
                <li><strong>Delete Section:</strong> Click the "Delete" button next to a section in the list.</li>
              </ul>
            </div>

            <div class="help-section">
              <h3>Interacting with Sections</h3>
              <ul>
                <li><strong>Play Section:</strong> Click the "Play" button next to a section in the list to play only that section.</li>
                <li><strong>Jump to Section:</strong> Click the "Jump" button (or the section name) to scroll the staff view to the beginning of that section.</li>
              </ul>
            </div>

            <div class="help-section">
              <h3>Creating a Playback Sequence</h3>
              <ul>
                <li><strong>Add to Sequence:</strong> In the Sections panel, find the "Playback Sequence" area. Select a defined section from a dropdown or list and click an "Add to Sequence" button.</li>
                <li><strong>Order Sections:</strong> Sections will be added to the sequence list. You can usually reorder them (e.g., by dragging or using up/down arrows).</li>
                <li><strong>Remove from Sequence:</strong> Click a "Remove" button next to an item in the sequence list.</li>
                <li><strong>Play Sequence:</strong> Once your sequence is arranged, click the "Play Sequence" button. The application will play through the sections in the order you've defined.</li>
              </ul>
              <div class="help-tip">
                <strong>Tip:</strong> Use sections to easily navigate and manage different parts of your song. The sequence player is great for testing song structure.
              </div>
            </div>
          </div>
          
          <!-- Playback Tab -->
          <div v-if="activeTab === 'playback'" class="tab-pane">
            <h2>Playback Features</h2>
            
            <div class="help-section">
              <h3>Basic Playback</h3>
              <ul>
                <li><strong>Play/Pause:</strong> Start or pause playback</li>
                <li><strong>Stop:</strong> Halt playback completely</li>
                <li><strong>Restart:</strong> Start playback from the beginning</li>
              </ul>
            </div>
            
            <div class="help-section">
              <h3>Playback Range</h3>
              <ul>
                <li>Set "From" and "To" measure numbers to play specific sections. This applies when using the main Play button.</li>
                <li>Enter 0 in the "To" field to play until the end.</li>
                <li>Playing individual sections or a sequence (from the "Sections" panel) will override these global settings for that specific playback.</li>
              </ul>
              <div class="help-tip">
                <strong>Tip:</strong> Use the playback range to practice specific sections of your composition.
              </div>
            </div>
            
            <div class="help-section">
              <h3>Auto-Scroll</h3>
              <ul>
                <li>Toggle "Auto-scroll to playing notes" (if available) to have the staff view automatically follow the currently playing notes.</li>
                <li>Helpful for longer compositions that extend beyond the visible screen area.</li>
              </ul>
            </div>

            <div class="help-section">
              <h3>Voice Playback</h3>
              <ul>
                <li>You may have options to play all visible voices or only specifically "selected" voices from the Voice Layers panel. Check your Playback Settings or Voice Layers panel for these controls.</li>
                <li>Each voice layer also has its own volume control, affecting its loudness during playback.</li>
              </ul>
            </div>
          </div>
          
          <!-- Saving Tab -->
          <div v-if="activeTab === 'saving'" class="tab-pane">
            <h2>Saving and Loading Compositions</h2>
            
            <div class="help-section">
              <h3>Saving a Composition</h3>
              <ol>
                <li>Go to the "Saved" tab</li>
                <li>Enter a name for your composition</li>
                <li>Click "Save"</li>
              </ol>
            </div>
            
            <div class="help-section">
              <h3>Loading Previous Work</h3>
              <ol>
                <li>Go to the "Saved" tab</li>
                <li>Find your composition in the list</li>
                <li>Click "Load"</li>
              </ol>
            </div>
            
            <div class="help-section">
              <h3>Managing Compositions</h3>
              <ul>
                <li><strong>Update:</strong> If you've loaded a composition and made changes, an "Update" button (often appearing next to the loaded composition in the list) allows you to save these changes back to the original saved item.</li>
                <li><strong>Rename:</strong> Change the name of a saved composition using the "Rename" button.</li>
                <li><strong>Delete:</strong> Remove a saved composition permanently using the "Delete" button.</li>
              </ul>
            </div>
            
            <div class="help-section">
              <h3>Combining Compositions</h3>
              <ol>
                <li>In the "Saved Compositions" panel, look for a "Combine Mode" or similar option.</li>
                <li>Select two or more compositions from your saved list (e.g., by checking checkboxes next to them).</li>
                <li>Click the "Combine Selected Compositions" (or similar) button.</li>
                <li>You'll be prompted to enter a name for the new, combined composition.</li>
                <li>You might be asked if you want to preserve the original staves from each composition or merge voices onto fewer staves.
                  <ul>
                    <li><strong>Preserve Staves:</strong> Each original staff and its voices will be maintained as distinct entities in the new composition.</li>
                    <li><strong>Merge Staves:</strong> Voices from each old composition might be grouped onto one new staff created for that original composition's content.</li>
                  </ul>
                </li>
                <li>A new composition will be created. Voice and staff names might be adjusted to indicate their origin.</li>
              </ol>
              <div class="help-tip">
                <strong>Tip:</strong> Combining compositions is useful for merging different musical ideas or sections into a larger piece. Pay attention to the staff merging options to get the desired layout.
              </div>
            </div>
            
            <div class="help-section">
              <h3>Import/Export</h3>
              <ul>
                <li><strong>Export All:</strong> Save all your saved compositions to a single JSON file.</li>
                <li><strong>Export Current:</strong> Save only the currently loaded composition to a JSON file.</li>
                <li><strong>Export Selected Voices Only:</strong> When exporting the current composition, you may have a checkbox option to include only the voice layers that are currently marked as "selected" in the Voice Layers panel.</li>
                <li><strong>Import:</strong> Load compositions from a previously exported JSON file. This will add the compositions from the file to your list of saved compositions.</li>
              </ul>
              <div class="help-tip">
                <strong>Tip:</strong> Regularly export your compositions as a backup or to transfer between devices.
              </div>
            </div>
          </div>
          
          <!-- Mobile Tips Tab -->
          <div v-if="activeTab === 'mobile'" class="tab-pane">
            <h2>Mobile-Specific Tips</h2>
            
            <div class="help-section">
              <h3>Touch Gestures</h3>
              <ul>
                <li><strong>Tap:</strong> Place a note or select an element</li>
                <li><strong>Long Press:</strong> Delete a note</li>
                <li><strong>Swipe:</strong> Scroll the staff horizontally</li>
              </ul>
            </div>
            
            <div class="help-section">
              <h3>Tab Navigation</h3>
              <ul>
                <li>Use the bottom tabs (e.g., "Notes", "Saved") to switch between different control panels and views.</li>
                <li>All essential functions are organized within these tabs for easy access on smaller screens.</li>
              </ul>
            </div>
            
            <div class="help-section">
              <h3>Responsive Controls</h3>
              <ul>
                <li>Rotate to landscape orientation for a wider staff view</li>
                <li>Controls automatically adjust to your screen size</li>
              </ul>
              <div class="help-tip">
                <strong>Tip:</strong> For detailed editing on mobile, try using a stylus for more precise note placement.
              </div>
            </div>
          </div>
          
          <!-- Troubleshooting Tab -->
          <div v-if="activeTab === 'troubleshooting'" class="tab-pane">
            <h2>Troubleshooting</h2>
            
            <div class="help-section">
              <h3>Notes Not Playing</h3>
              <ul>
                <li>Ensure your device's sound is on</li>
                <li>Try clicking elsewhere on the page first (browser may require interaction before playing audio)</li>
                <li>If using headphones, check they're properly connected</li>
              </ul>
            </div>
            
            <div class="help-section">
              <h3>Display Issues</h3>
              <ul>
                <li>Use "Clear Score" (if available) to reset if notes appear incorrectly, but be cautious as this erases your work.</li>
                <li>Extend the staff if you need more horizontal space for your music.</li>
                <li>Try refreshing the page if elements don't display properly or the application seems unresponsive.</li>
              </ul>
            </div>
            
            <div class="help-section">
              <h3>Mobile Performance</h3>
              <ul>
                <li>If the app feels slow, try closing other apps</li>
                <li>Restart the browser if you experience issues with touch controls</li>
                <li>Ensure your device has sufficient free memory</li>
              </ul>
              <div class="help-tip">
                <strong>Tip:</strong> For the best experience on mobile, use the latest version of Chrome or Safari.
              </div>
            </div>
          </div>

          <!-- Advanced Features Tab -->
          <div v-if="activeTab === 'advanced'" class="tab-pane">
            <h2>Advanced Features & Debugging</h2>

            <div class="help-section">
              <h3>Debug Panel</h3>
              <ul>
                <li>A Debug Panel might be available (often toggled via a "Debug Mode" switch in a general settings area or sometimes persistently visible during development).</li>
                <li>This panel can display internal information like:
                  <ul>
                    <li><strong>Last Click Y:</strong> The vertical (Y) coordinate of the last click on the staff area.</li>
                    <li><strong>Selected Octave:</strong> The currently selected octave for note input.</li>
                    <li><strong>Notes for Debug:</strong> A list of notes belonging to the currently active voice layer, often showing their properties (ID, pitch, duration, position).</li>
                    <li><strong>Needs Ledger Lines:</strong> A function or indicator showing if a given note requires ledger lines above or below the staff.</li>
                    <li><strong>Get Ledger Lines:</strong> A function or data showing the calculated positions for ledger lines for a given note.</li>
                    <li>Other internal state variables relevant for development.</li>
                  </ul>
                </li>
                <li>It may also offer functions like "Test All Notes" to help developers diagnose issues.</li>
                <li>This panel is primarily intended for development and troubleshooting.</li>
              </ul>
              <div class="help-tip">
                <strong>Tip:</strong> If you encounter unexpected behavior, information from the Debug Panel might be helpful if you need to report an issue.
              </div>
            </div>
          </div>

          <!-- Legal Information Tab -->
          <div v-if="activeTab === 'legal'" class="tab-pane">
            <h2>Legal Information</h2>
            <div class="help-section">
              <ul>
                <li>
                  <router-link :to="{ name: 'TermsAndConditions' }" @click="close">Terms and Conditions</router-link>
                </li>
                <li>
                  <router-link :to="{ name: 'PrivacyPolicy' }" @click="close">Privacy Policy</router-link>
                </li>
              </ul>
            </div>
            <div class="help-tip">
              Please review our terms and policies to understand your rights and responsibilities when using this application.
            </div>
          </div>
        </div>
      </div>
      
      <div class="help-footer">
        <button class="close-help-button" @click="close">Close Help</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close']);

const activeTab = ref('basics');

const tabs = [
  { id: 'basics', label: 'Basic Usage' },
  { id: 'staves', label: 'Staves & Layout' },
  { id: 'notes', label: 'Notes & Editing' },
  { id: 'voices', label: 'Voice Layers' },
  { id: 'elements', label: 'Musical Elements' },
  { id: 'sections', label: 'Sections & Sequence' },
  { id: 'playback', label: 'Playback' },
  { id: 'saving', label: 'Saving & Loading' },
  { id: 'mobile', label: 'Mobile Tips' },
  { id: 'troubleshooting', label: 'Troubleshooting' },
  { id: 'advanced', label: 'Advanced Features' },
  { id: 'legal', label: 'Legal' }
];

const close = () => {
  emit('close');
};

// --- Scroll Indicator Logic ---
const tabsScrollRef = ref<HTMLDivElement | null>(null);
const canScrollLeft = ref(false);
const canScrollRight = ref(false);

const updateScrollIndicators = () => {
  const el = tabsScrollRef.value;
  if (!el) return;

  // Use a small tolerance (e.g., 1px) for floating point inaccuracies
  const tolerance = 1;
  canScrollLeft.value = el.scrollLeft > tolerance;
  canScrollRight.value = el.scrollWidth - el.clientWidth - el.scrollLeft > tolerance;
};

// Update indicators when the component/modal becomes visible or tabs change
watch(() => props.isVisible, (newValue) => {
  if (newValue) {
    nextTick(() => {
      updateScrollIndicators();
      // Add resize observer if needed for dynamic content changes
    });
  }
});

// Initial check on mount (though visibility check is more reliable)
onMounted(() => {
  if (props.isVisible) {
     nextTick(updateScrollIndicators);
  }
  // Consider adding ResizeObserver here if tabs could change size/number
});

// --- Touch Handling Logic (keep existing) ---
const touchStart = ref({ x: 0, y: 0 });
const isScrolling = ref(false);

const handleTouchStart = (e: TouchEvent) => {
  touchStart.value = {
    x: e.touches[0].clientX,
    y: e.touches[0].clientY
  };
  isScrolling.value = false;
};

const handleTouchMove = (e: TouchEvent) => {
  if (!isScrolling.value) {
    const deltaX = touchStart.value.x - e.touches[0].clientX;
    const deltaY = touchStart.value.y - e.touches[0].clientY;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Only prevent default if horizontal scroll is intended
      // This allows vertical scroll on the page if needed
      // e.preventDefault(); // Removed this to allow page scroll if needed
      isScrolling.value = true;
    }
  }
};

const handleTouchEnd = () => {
  isScrolling.value = false;
};
</script>

<style scoped>
.help-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  overflow: hidden;
}

.help-container {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.help-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.help-header h1 {
  margin: 0;
  font-size: 24px;
  color: #2196F3;
}

.close-button {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #666;
  transition: color 0.2s;
}

.close-button:hover {
  color: #f44336;
}

.help-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.help-tabs-container {
  position: relative;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ddd;
  overflow: hidden;
  flex-shrink: 0;
}

.help-tabs-scroll {
  display: flex;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding: 0 5px;
  touch-action: pan-x;
  min-height: 45px;
  align-items: center;
}

.help-tabs-scroll::-webkit-scrollbar {
  display: none;
}

.tab-item {
  padding: 10px 16px;
  white-space: nowrap;
  cursor: pointer;
  color: #555;
  font-weight: 500;
  font-size: 14px;
  border: none;
  border-bottom: 3px solid transparent;
  background-color: transparent;
  flex-shrink: 0;
  text-align: center;
  transition: color 0.2s, border-color 0.2s, background-color 0.2s;
  position: relative;
  line-height: 1.4;
}

.tab-item:not(:last-child)::after {
  content: "";
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 24px;
  width: 1px;
  background-color: #ddd;
}

.tab-item:hover {
  color: #2196F3;
  background-color: rgba(33, 150, 243, 0.05);
}

.tab-item.active {
  color: #2196F3;
  border-bottom-color: #2196F3;
  font-weight: 600;
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.tab-pane {
  animation: fadeIn 0.3s ease-out;
}

.tab-pane h2 {
  margin-top: 0;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.help-section {
  margin-bottom: 25px;
}

.help-section h3 {
  color: #2196F3;
  margin-bottom: 10px;
}

.help-section ul, .help-section ol {
  padding-left: 25px;
  margin-bottom: 15px;
}

.help-section li {
  margin-bottom: 8px;
  line-height: 1.5;
}

.help-tip {
  background-color: #e3f2fd;
  border-left: 4px solid #2196F3;
  padding: 10px 15px;
  margin-top: 10px;
  border-radius: 4px;
}

.help-footer {
  padding: 15px 20px;
  border-top: 1px solid #eee;
  text-align: right;
}

.close-help-button {
  background-color: #2196F3;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.close-help-button:hover {
  background-color: #1976D2;
}

@media (max-width: 768px) {
  .help-container {
    width: 95%;
    max-height: 95vh;
  }
  
  .help-header h1 {
    font-size: 20px;
  }
  
  .help-tabs-scroll {
    min-height: 42px;
  }
  .tab-item {
    padding: 8px 14px;
    font-size: 13px;
  }
  .tab-item:not(:last-child)::after {
    height: 20px;
  }
}

@media (max-width: 480px) {
  .help-container {
    width: 95%;
    max-height: 95vh;
  }
  
  .help-header h1 {
    font-size: 18px;
  }
  .help-tabs-scroll {
    min-height: 40px;
  }
  .tab-item {
    padding: 8px 12px;
    font-size: 12px;
  }
  .tab-item:not(:last-child)::after {
    height: 18px;
  }
}

/* Fade effect styles */
.help-tabs-container::before,
.help-tabs-container::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 35px; /* Slightly wider fade */
  pointer-events: none;
  z-index: 2;
  opacity: 0; /* Hidden by default */
  transition: opacity 0.2s ease-in-out; /* Smooth transition */
}

.help-tabs-container::before {
  left: 0;
  background: linear-gradient(to right, #f5f5f5 20%, transparent);
}

.help-tabs-container::after {
  right: 0;
  background: linear-gradient(to left, #f5f5f5 20%, transparent);
}

/* Show fades only when scrolling is possible */
.help-tabs-container.scrollable-left::before {
  opacity: 1;
}

.help-tabs-container.scrollable-right::after {
  opacity: 1;
}
</style> 