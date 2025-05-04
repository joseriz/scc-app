<template>
  <div class="help-overlay" v-if="isVisible">
    <div class="help-container">
      <div class="help-header">
        <h1>Music Notation Editor Help</h1>
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
                <li><strong>Staff Area:</strong> The central area with five lines where you place notes</li>
                <li><strong>Control Panels:</strong> Located above and below the staff for adjusting musical elements</li>
                <li><strong>Tab Sections:</strong> Notes, Settings, and Saved tabs contain different controls</li>
              </ul>
            </div>
            
            <div class="help-section">
              <h3>Mobile Interface</h3>
              <ul>
                <li><strong>Tab Navigation:</strong> Switch between Notes, Settings, and Saved compositions using the tabs at the bottom</li>
                <li><strong>Scrollable Staff:</strong> Use swipe gestures or arrow buttons to navigate horizontally</li>
                <li><strong>Touch Controls:</strong> Tap to add notes, long-press to remove notes</li>
              </ul>
            </div>
            
            <div class="help-section">
              <h3>Creating Your First Notes</h3>
              <ol>
                <li>Select "Note" in the Type section</li>
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
          
          <!-- Notes & Editing Tab -->
          <div v-if="activeTab === 'notes'" class="tab-pane">
            <h2>Creating and Editing Music</h2>
            
            <div class="help-section">
              <h3>Adding Notes and Rests</h3>
              <ol>
                <li><strong>Select Note Type:</strong> Choose between "Note" or "Rest" in the Type section</li>
                <li><strong>Select Duration:</strong> Choose whole, half, quarter, eighth, or sixteenth notes</li>
                <li><strong>Select Accidental</strong> (for notes): Choose natural, sharp or flat</li>
                <li><strong>Select Octave</strong> (for notes): Choose which octave to place your note in</li>
                <li><strong>Add to Staff:</strong> Click on the staff at the desired vertical position</li>
                <li><strong>Dotted Notes:</strong> Toggle "Dotted" to add a dot (extends duration by half)</li>
              </ol>
            </div>
            
            <div class="help-section">
              <h3>Editing Notes</h3>
              <ul>
                <li><strong>Change a Note:</strong> Click on an existing note position to replace it</li>
                <li><strong>Delete a Note:</strong>
                  <ul>
                    <li>Desktop: Right-click on a note</li>
                    <li>Mobile: Long-press on a note</li>
                  </ul>
                </li>
                <li><strong>Select a Note:</strong> Click once to select for adding lyrics or other operations</li>
              </ul>
            </div>
            
            <div class="help-section">
              <h3>Adding Lyrics</h3>
              <ol>
                <li>Select a note on the staff</li>
                <li>Enter lyrics text in the input field at the bottom</li>
                <li>Press Enter or click "Add Lyric"</li>
                <li>Lyrics will appear beneath the note</li>
              </ol>
              <div class="help-tip">
                <strong>Tip:</strong> You can add lyrics to multiple notes in sequence to create a complete vocal line.
              </div>
            </div>
          </div>
          
          <!-- Musical Elements Tab -->
          <div v-if="activeTab === 'elements'" class="tab-pane">
            <h2>Musical Elements</h2>
            
            <div class="help-section">
              <h3>Clef Selection</h3>
              <ul>
                <li>Choose between Treble (𝄞) and Bass (𝄢) clefs using the dropdown</li>
                <li>Note: Changing clef will clear the current score</li>
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
                <li>Adjust the slider to set the tempo (40-240 BPM)</li>
                <li>Affects playback speed of your composition</li>
              </ul>
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
                <li>Set "From" and "To" measure numbers to play specific sections</li>
                <li>Enter 0 in the "To" field to play until the end</li>
              </ul>
              <div class="help-tip">
                <strong>Tip:</strong> Use the playback range to practice specific sections of your composition.
              </div>
            </div>
            
            <div class="help-section">
              <h3>Auto-Scroll</h3>
              <ul>
                <li>Toggle "Auto-scroll to playing notes" to follow along during playback</li>
                <li>Helpful for longer compositions that extend beyond the visible area</li>
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
                <li><strong>Update:</strong> Update a previously saved composition with current changes</li>
                <li><strong>Rename:</strong> Change the name of a saved composition</li>
                <li><strong>Delete:</strong> Remove a saved composition</li>
              </ul>
            </div>
            
            <div class="help-section">
              <h3>Import/Export</h3>
              <ul>
                <li><strong>Export All:</strong> Save all compositions to a file</li>
                <li><strong>Export Current:</strong> Save only the current composition</li>
                <li><strong>Import:</strong> Load compositions from a previously exported file</li>
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
                <li>Use the bottom tabs to switch between Notes, Settings, and Saved views</li>
                <li>All essential functions are organized within these tabs</li>
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
                <li>Use "Clear" to reset if notes appear incorrectly</li>
                <li>Extend the staff if you need more space</li>
                <li>Try refreshing the page if elements don't display properly</li>
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
  { id: 'notes', label: 'Notes & Editing' },
  { id: 'elements', label: 'Musical Elements' },
  { id: 'playback', label: 'Playback' },
  { id: 'saving', label: 'Saving & Loading' },
  { id: 'mobile', label: 'Mobile Tips' },
  { id: 'troubleshooting', label: 'Troubleshooting' }
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