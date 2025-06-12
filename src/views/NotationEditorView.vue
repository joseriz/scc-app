<template>
  <!-- Add responsive meta tag -->
  <div class="notation-editor">
    <AppHeader v-model:keySignature="keySignature" v-model:timeSignature="timeSignature" :readOnlyMode="readOnlyMode"
      :selectedClef="staves.length > 0 ? staves[0].clef : 'treble'" @keySignatureChange="changeKeySignatureDirectly"
      @timeSignatureChange="updateTimeSignature" />

    <!-- Read-only toggle moved to the top -->
    <div class="read-only-toggle">
      <label class="toggle-switch">
        <input type="checkbox" v-model="readOnlyMode">
        <span class="toggle-slider"></span>
      </label>
      <span class="toggle-label">
        {{ readOnlyMode ? 'Read-Only Mode (Locked)' : 'Edit Mode' }}
      </span>
    </div>

    <!-- Floating Help Button -->
    <div @click="showHelp = true" class="floating-help-btn">
      ?
    </div>

    <TempoControl v-model="tempo" />

    <!-- Button to add a new staff -->
    <div class="add-staff-controls" v-if="!readOnlyMode">
      <button @click="addNewStaff" class="add-staff-btn">Add New Staff</button>
    </div>

    <!-- Staves container -->
    <div class="staves-wrapper">
      <div v-for="(stave, staveIndex) in staves" :key="stave.id" class="staff-outer-container">
        <div class="staff-header-controls">
          <span v-if="editingStaffNameId !== stave.id" class="staff-name" @click="editStaffName(stave)"
            title="Click to rename staff">
            {{ stave.name || `Staff ${staveIndex + 1}` }}
          </span>
          <input v-else type="text" :value="stave.name || `Staff ${staveIndex + 1}`"
            @blur="saveStaffName(stave, $event)" @keyup.enter="saveStaffName(stave, $event)"
            @keyup.esc="cancelEditStaffName(stave, $event)" ref="staffNameInput" class="staff-name-input" />
          <select :disabled="readOnlyMode" v-model="stave.clef" @change="handleStaffClefChange(stave)">
            <option value="treble">Treble</option>
            <option value="bass">Bass</option>
          </select>
          <button @click="toggleStaffCollapse(stave)" class="collapse-staff-btn">
            {{ stave.isCollapsed ? 'Expand' : 'Collapse' }}
          </button>
          <button v-if="staves.length > 1 && !readOnlyMode" @click="removeStaff(stave.id)"
            class="remove-staff-btn">Remove Staff</button>
          <button v-if="!readOnlyMode" @click="duplicateStaff(stave)" 
            class="duplicate-staff-btn">Duplicate Staff</button>
        </div>

        <!-- Update the space controls in the template -->
        <div class="space-controls" v-if="!readOnlyMode">
          <div class="space-insertion-controls">
            <button
              @click="isInsertingSpace = !isInsertingSpace; isDeletingSpace = false; isSelectingRange = false; isPasting = false; isCreatingTieSlur = false"
              :class="{ active: isInsertingSpace }" class="insert-space-btn">
              {{ isInsertingSpace ? 'Cancel Insert' : 'Insert Space' }}
            </button>
            <button
              @click="isDeletingSpace = !isDeletingSpace; isInsertingSpace = false; isSelectingRange = false; isPasting = false; isCreatingTieSlur = false"
              :class="{ active: isDeletingSpace }" class="delete-space-btn">
              {{ isDeletingSpace ? 'Cancel Delete' : 'Delete Space' }}
            </button>
            <div v-if="isInsertingSpace || isDeletingSpace" class="space-width-control">
              <label>Width:</label>
              <input type="number" v-model.number="spaceWidth" min="1" max="10" step="1">
            </div>

            <button @click="
              isSelectingRange
                ? clearSelection()
                : (isSelectingRange = true);
            isInsertingSpace = false;
            isDeletingSpace = false;
            isPasting = false;
            isCreatingTieSlur = false" :class="{ active: isSelectingRange }" class="select-range-btn">
              {{ isSelectingRange ? 'Cancel Selection' : 'Select Range' }}
            </button>
            
            <!-- Add Tie/Slur controls -->
            <button 
              @click="toggleTieSlurMode"
              :class="{ active: isCreatingTieSlur }" 
              class="tie-slur-btn">
              {{ isCreatingTieSlur ? 'Cancel Tie/Slur' : 'Add Tie/Slur' }}
            </button>
            <div v-if="isCreatingTieSlur" class="tie-slur-info">
              {{ tieSlurStartNote ? 'Click the end note to complete' : 'Click the start note' }}
            </div>
            
            <!-- Key Signature Change controls -->
            <button 
              @click="toggleKeySignatureChangeMode"
              :class="{ active: isAddingKeySignatureChange }" 
              class="key-change-btn">
              {{ isAddingKeySignatureChange ? 'Cancel Key Change' : 'Add Key Change' }}
            </button>
            <div v-if="isAddingKeySignatureChange" class="key-change-controls">
              <label>New Key:</label>
              <select v-model="newKeySignature">
                <option value="C">C Major</option>
                <option value="G">G Major</option>
                <option value="D">D Major</option>
                <option value="A">A Major</option>
                <option value="E">E Major</option>
                <option value="B">B Major</option>
                <option value="F#">F♯ Major</option>
                <option value="C#">C♯ Major</option>
                <option value="F">F Major</option>
                <option value="Bb">B♭ Major</option>
                <option value="Eb">E♭ Major</option>
                <option value="Ab">A♭ Major</option>
                <option value="Db">D♭ Major</option>
                <option value="Gb">G♭ Major</option>
                <option value="Cb">C♭ Major</option>
              </select>
              <div class="key-change-info">
                Click on a measure to insert key change
              </div>
            </div>
            
            <!-- Time Signature Change controls -->
            <button 
              @click="toggleTimeSignatureChangeMode"
              :class="{ active: isAddingTimeSignatureChange }" 
              class="time-change-btn">
              {{ isAddingTimeSignatureChange ? 'Cancel Time Change' : 'Add Time Change' }}
            </button>
            <div v-if="isAddingTimeSignatureChange" class="time-change-controls">
              <label>New Time:</label>
              <select v-model="newTimeSignatureNumerator" class="time-sig-select">
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
                <option value="7">7</option>
                <option value="9">9</option>
                <option value="12">12</option>
              </select>
              <span>/</span>
              <select v-model="newTimeSignatureDenominator" class="time-sig-select">
                <option value="2">2</option>
                <option value="4">4</option>
                <option value="8">8</option>
              </select>
              <div class="time-change-info">
                Click on a measure to insert time signature change
              </div>
            </div>
            
            <!-- Clef Change controls -->
            <button 
              @click="toggleClefChangeMode"
              :class="{ active: isAddingClefChange }" 
              class="clef-change-btn">
              {{ isAddingClefChange ? 'Cancel Clef Change' : 'Add Clef Change' }}
            </button>
            <div v-if="isAddingClefChange" class="clef-change-controls">
              <label>New Clef:</label>
              <select v-model="newClef">
                <option value="treble">Treble</option>
                <option value="bass">Bass</option>
              </select>
              <div class="clef-change-info">
                Click on a measure to insert clef change
              </div>
            </div>
            
            <div class="copy-controls" v-if="isSelectingRange && selectionEnd">
              <button @click="copySelectedNotes(false)" class="copy-btn">
                Copy Notes & Lyrics
              </button>
              <button @click="copySelectedNotes(true)" class="copy-lyrics-btn">
                Copy Lyrics Only
              </button>
            </div>

            <button v-if="isPasting" @click="cancelPaste" class="cancel-paste-btn">
              Cancel Paste
            </button>
            <div v-if="isPasting" class="paste-info">
              {{ isLyricsCopyMode
                ? `Click to paste ${copiedLyrics.length} lyrics to existing notes`
                : `Click to paste ${copiedNotes.length} notes`
              }}
            </div>
          </div>
        </div>

        <!-- Staff container with improved mobile layout - conditionally render based on isCollapsed -->
        <div v-if="!stave.isCollapsed" class="staff-container" :style="{ minHeight: staffContainerMinHeight }">
          <div class="clef">
            <img v-if="stave.clef === 'treble'" src="@/assets/treble-clef.svg" alt="Treble Clef" />
            <img v-else-if="stave.clef === 'bass'" src="@/assets/bass-clef.svg" alt="Bass Clef" />
          </div>

          <!-- Key Signature -->
          <div class="key-signature">
            <div v-for="(accidental, index) in currentKeySignatureAccidentals" :key="`key-sig-${stave.id}-${index}`"
              class="key-signature-accidental" :style="{
                top: `${getKeySignaturePosition(accidental, stave.clef)}px`,
                left: `${15 + (index * 8)}px`
              }">
              {{ getAccidentalSymbolForKeySignature(accidental) }}
            </div>
          </div>

          <!-- Update time signature positioning to appear after key signature -->
          <div class="time-signature-display"
            :style="{ left: `${45 + (currentKeySignatureAccidentals.length * 10) + 5}px` }">
            <div class="time-signature-numerator">{{ timeSignatureNumerator }}</div>
            <div class="time-signature-denominator">{{ timeSignatureDenominator }}</div>
          </div>

          <!-- Scrollable staff -->
          <div class="staff-scroll-container">
            <div class="staff"               @click="
              isInsertingSpace
                ? insertSpace($event, stave.id)
                : isDeletingSpace
                  ? deleteSpace($event, stave.id)
                  : isSelectingRange
                    ? handleRangeSelection($event, stave.id)
                    : isPasting
                      ? pasteNotes($event, stave.id)
                      : isCreatingTieSlur
                        ? null // Do nothing - tie/slur creation is handled by note clicks
                        : isAddingKeySignatureChange
                          ? addKeySignatureChange($event, stave.id)
                          : isAddingTimeSignatureChange
                            ? addTimeSignatureChange($event, stave.id)
                            : isAddingClefChange
                              ? addClefChange($event, stave.id)
                              : handleStaffClick($event, stave.id)
              " @mousedown="startDrag" @touchstart="startDrag" :class="{
                'inserting-space': isInsertingSpace,
                'deleting-space': isDeletingSpace,
                'selecting-range': isSelectingRange,
                'pasting': isPasting,
                'tie-slur-mode': isCreatingTieSlur,
                'key-change-mode': isAddingKeySignatureChange,
                'time-change-mode': isAddingTimeSignatureChange,
                'clef-change-mode': isAddingClefChange
              }" :style="{
                width: `${staffWidth}px`,
                transform: `translateX(-${scrollPosition}px)`,
                cursor: isInsertingSpace
                  ? 'col-resize'
                  : isDeletingSpace
                    ? 'col-resize'
                    : isSelectingRange
                      ? 'copy'
                      : isPasting
                        ? 'cell'
                        : isAddingKeySignatureChange
                          ? 'pointer'
                          : isAddingTimeSignatureChange
                            ? 'pointer'
                            : isAddingClefChange
                              ? 'pointer'
                              : 'default'
              }">
              <!-- Add selection highlight -->
              <div v-if="selectionStart && selectionEnd && selectionStart.staffId === stave.id" class="selection-highlight" :style="{
                left: `${Math.min(selectionStart.position, selectionEnd.position) * 25}px`,
                width: `${Math.abs(selectionEnd.position - selectionStart.position) * 25}px`
              }"></div>

              <!-- Staff lines -->
              <div class="staff-lines">
                <div class="staff-line" v-for="i in 5" :key="`line-${stave.id}-${i}`"></div>
              </div>

              <!-- Add this right after the staff-lines div and before the notes container -->
              <!-- Render section markers on all staves -->
              <div class="section-markers-container">
                <div v-for="section in sections" :key="`section-${section.id}`" class="section-markers"
                  :class="{ 'playing-section': section.id === playingSequenceSectionId }">
                  <!-- Start marker -->
                  <div class="section-marker section-start" :style="{
                    left: `${getSectionPosition(section.startMeasure)}px`,
                    top: '80px'
                  }" :title="`${section.name} (Start)`">
                    ◀ {{ section.name }}
                  </div>

                  <!-- End marker -->
                  <div class="section-marker section-end" :style="{
                    left: `${getSectionPosition(section.endMeasure + 1) - 6}px`,
                    top: '80px'
                  }" :title="`${section.name} (End)`">
                    {{ section.name }} ▶
                  </div>

                  <!-- Section background highlight -->
                  <div class="section-background" :style="{
                    left: `${getSectionPosition(section.startMeasure)}px`,
                    width: `${getSectionPosition(section.endMeasure + 1) - getSectionPosition(section.startMeasure)}px`,
                    height: '100%'
                  }">
                  </div>
                </div>
              </div>

              <!-- Then remove the duplicate section markers from inside the ledger lines -->

              <!-- Measure bars -->
              <div v-for="(barline, i) in barlines" :key="`barline-${stave.id}-${i}`" class="barline" :class="{
                'barline-single': barline.type === 'single',
                'barline-double': barline.type === 'double',
                'barline-final': barline.type === 'final',
                'barline-repeat-start': barline.type === 'repeat-start',
                'barline-repeat-end': barline.type === 'repeat-end'
              }" :style="{ left: `${barline.position}px` }">

                <!-- Add repeat dots for repeat barlines -->
                <template v-if="barline.type === 'repeat-start' || barline.type === 'repeat-end'">
                  <div class="repeat-dots">
                    <div class="repeat-dot"></div>
                    <div class="repeat-dot"></div>
                  </div>
                </template>

                <!-- Add measure number (only show if showMeasureNumbers is true) -->
                <div v-if="showMeasureNumbers && barline.measureNumber > 0" class="measure-number">
                  {{ barline.measureNumber }}
                </div>
              </div>

              <!-- Key Signature Changes -->
              <div v-for="keyChange in keySignatureChanges" :key="`key-change-${keyChange.id}`" 
                   class="key-signature-change" 
                   :class="{ 'clickable': !readOnlyMode }"
                   :style="{ left: `${keyChange.position}px`, transform: 'translateX(70px)' }"
                   @click.stop="!readOnlyMode && removeKeySignatureChange(keyChange.id)"
                   @mousedown.stop
                   :title="readOnlyMode ? undefined : 'Click to remove key signature change'">
                <!-- Key signature change marker -->
                <div class="key-change-marker" style="pointer-events: none;">
                  <div class="key-change-icon">🔑</div>
                  <div class="key-change-text">{{ keyChange.keySignature }}</div>
                </div>
              </div>

              <!-- Time Signature Changes -->
              <div v-for="timeChange in timeSignatureChanges" :key="`time-change-${timeChange.id}`" 
                   class="time-signature-change" 
                   :style="{ left: `${timeChange.position}px` }"
                   :class="{ 'clickable': !readOnlyMode }"
                   :title="readOnlyMode ? undefined : 'Click to remove time signature change'"
                   @mousedown.prevent.stop
                   @click.prevent.stop="() => {
                     if (!readOnlyMode) {
                       removeTimeSignatureChange(timeChange.id);
                     }
                   }">
                <!-- Time signature change marker -->
                <div class="time-change-marker" style="pointer-events: none;">
                  <div class="time-change-icon">⏱️</div>
                  <div class="time-change-text">{{ timeChange.numerator }}/{{ timeChange.denominator }}</div>
                </div>
              </div>

              <!-- Clef Changes -->
              <div v-for="clefChange in clefChanges.filter(c => c.staffId === stave.id)" 
                   :key="`clef-change-${clefChange.id}`" 
                   class="clef-change" 
                   :class="{ 'clickable': !readOnlyMode }"
                   :style="{ left: `${clefChange.position}px` }"
                   @click.stop="!readOnlyMode && removeClefChange(clefChange.id)"
                   @mousedown.stop
                   :title="readOnlyMode ? undefined : 'Click to remove clef change'">
                <div class="clef-change-marker" style="pointer-events: none;">
                  <div class="clef-change-icon">{{ clefChange.clef === 'treble' ? '𝄞' : '𝄢' }}</div>
                  <div class="clef-change-text">{{ clefChange.clef === 'treble' ? 'Treble' : 'Bass' }}</div>
                </div>
              </div>

              <!-- Beat markers (optional, for visual aid) -->
              <div v-if="showBeatMarkers" v-for="beat in beatPositions" :key="`beat-${stave.id}-${beat.position}`"
                class="beat-marker" :style="{ left: `${beat.position}px` }">
              </div>

              <!-- Ties and Slurs SVG Overlay -->
              <svg class="ties-slurs-overlay" :style="{ width: `${staffWidth}px`, height: '280px' }">
                <g v-for="tieSlur in tiesSlursForStaff(stave.id)" :key="tieSlur.id">
                  <path 
                    :d="getTieSlurPath(tieSlur)"
                    :class="['tie-slur-path', tieSlur.type]"
                    :stroke="getTieSlurColor(tieSlur)"
                    stroke-width="2"
                    fill="none"
                    @click.stop="removeTieSlur(tieSlur.id)"
                    style="cursor: pointer;"
                    :title="`${tieSlur.type === 'tie' ? 'Tie' : 'Slur'} - Click to remove`"
                  />
                </g>
              </svg>

              <!-- Triplet Brackets SVG Overlay -->
              <svg class="triplet-brackets-overlay" :style="{ width: `${staffWidth}px`, height: '280px' }">
                <g v-for="tripletGroup in getTripletGroupsForStaff(stave.id)" :key="tripletGroup.id">
                  <!-- Horizontal bracket line -->
                  <line 
                    :x1="tripletGroup.startX" 
                    :y1="tripletGroup.y" 
                    :x2="tripletGroup.endX" 
                    :y2="tripletGroup.y"
                    :stroke="tripletGroup.color"
                    stroke-width="1.5"
                    class="triplet-bracket-line"
                  />
                  <!-- Left vertical bracket -->
                  <line 
                    :x1="tripletGroup.startX" 
                    :y1="tripletGroup.y" 
                    :x2="tripletGroup.startX" 
                    :y2="tripletGroup.y + 8"
                    :stroke="tripletGroup.color"
                    stroke-width="1.5"
                    class="triplet-bracket-end"
                  />
                  <!-- Right vertical bracket -->
                  <line 
                    :x1="tripletGroup.endX" 
                    :y1="tripletGroup.y" 
                    :x2="tripletGroup.endX" 
                    :y2="tripletGroup.y + 8"
                    :stroke="tripletGroup.color"
                    stroke-width="1.5"
                    class="triplet-bracket-end"
                  />
                  <!-- Number "3" in the center -->
                  <text 
                    :x="tripletGroup.centerX" 
                    :y="tripletGroup.y - 3"
                    :fill="tripletGroup.color"
                    text-anchor="middle"
                    class="triplet-number"
                    font-family="Arial, sans-serif"
                    font-size="12"
                    font-weight="bold"
                  >3</text>
                </g>
              </svg>

              <!-- Notes container -->
              <div class="notes-container">
                <!-- Ledger lines for notes -->
                <template v-for="note in notesForStaff(stave.id)" :key="`ledger-${note.id}`">
                  <!-- Ledger lines for notes above the staff -->
                  <div v-if="needsLedgerLines(note, 'above', note.staffClef)" class="ledger-lines-container above"
                    :style="{
                      left: `${note.position * 25 - 10}px`
                    }">
                    <div v-for="linePos in getLedgerLines(note, 'above', note.staffClef)"
                      :key="`above-${note.id}-${linePos}`" class="ledger-line" :style="{
                        top: `${linePos}px`,
                        width: '20px'
                      }">
                    </div>
                  </div>

                  <!-- Ledger lines for notes below the staff -->
                  <div v-if="needsLedgerLines(note, 'below', note.staffClef)" class="ledger-lines-container below"
                    :style="{
                      left: `${note.position * 25 - 10}px`
                    }">
                    <div v-for="linePos in getLedgerLines(note, 'below', note.staffClef)"
                      :key="`below-${note.id}-${linePos}`" class="ledger-line" :style="{
                        top: `${linePos}px`,
                        width: '20px'
                      }">
                    </div>
                  </div>
                </template>

                <!-- Notes -->
                <div v-for="note in notesForStaff(stave.id)" :key="note.id" class="note" :class="{
                  'rest': note.type === 'rest',
                  'playing': currentPlayingNoteIds.includes(note.id), // Keep class for semantics or other non-background/transform styles
                  'selected': note.id === selectedNoteId,
                  'key-signature-affected': note.type === 'note' &&
                    note.pitch &&
                    !note.pitch.includes('#') &&
                    !note.pitch.includes('b') &&
                    isNoteAffectedByKeySignature(note.pitch.charAt(0), note.position),
                  'dotted': note.dotted,
                  'triplet': note.triplet,
                  'whole-note': note.duration === 'whole',
                  'has-lyric': note.lyric,
                  'natural-accidental': note.explicitNatural
                }" :style="[
                  getNoteStyle(note), // Base styles from function
                  currentPlayingNoteIds.includes(note.id)
                    ? {
                      backgroundColor: 'rgba(255, 255, 0, 0.3)',
                      transform: 'translate(-50%, -50%) scale(1.1)'
                    }
                    : {
                      backgroundColor: 'transparent', // Explicit default background
                      transform: 'translate(-50%, -50%)' // Explicit default transform
                    }
                ]" :data-duration="note.duration" :data-voice="note.voiceId" @contextmenu.prevent="removeNote(note)"
                  @touchstart="handleTouchStart(note, $event)" @touchend="handleTouchEnd" @touchmove="handleTouchMove"
                  @click.stop="selectNote(note)">

                  <!-- For rests, use the existing symbol -->
                  <template v-if="note.type === 'rest'">
                    {{ getNoteSymbol(note) }}
                    <!-- Add dot for dotted rests -->
                    <span v-if="note.dotted" class="dot">•</span>
                    <!-- Triplet indicator removed - now handled by triplet brackets -->
                  </template>

                  <!-- For notes, use separate notehead and stem -->
                  <template v-else>
                    <!-- Notehead -->
                    <div class="notehead" :class="note.duration">
                      <!-- Different noteheads for different durations -->
                    </div>

                    <!-- Stem (only for non-whole notes) -->
                    <div v-if="note.duration !== 'whole'" class="stem"
                      :class="[getStemDirection(note.pitch || '', note.staffClef), note.duration]">
                    </div>

                    <!-- Flag for eighth and sixteenth notes -->
                    <div v-if="['eighth', 'sixteenth'].includes(note.duration)" class="flag"
                      :class="[getStemDirection(note.pitch || '', note.staffClef), note.duration]">
                    </div>

                    <!-- Add dot for dotted notes -->
                    <span v-if="note.dotted" class="dot">•</span>
                    
                    <!-- Triplet indicator removed - now handled by triplet brackets -->
                  </template>

                  <!-- Accidental -->
                  <span v-if="note.type === 'note' && note.pitch && (
                    (note.pitch.includes('#') || note.pitch.includes('b')) ||
                    isNoteAffectedByKeySignature(note.pitch.charAt(0), note.position) ||
                    note.explicitNatural
                  )" class="accidental">
                    {{
                      note.explicitNatural ? '♮' :
                        (note.pitch.includes('#') || note.pitch.includes('b')) ?
                          getAccidentalSymbol(note) :
                          getAccidentalSymbolForKeySignature(getKeySignatureAccidentalForNote(note.pitch.charAt(0), note.position))
                    }}
                  </span>
                </div>

                <!-- Chord symbols (render only on the first staff) -->
                <div v-if="staveIndex === 0" v-for="chord in chordSymbols" :key="chord.id" class="chord-symbol" :style="{
                  left: `${chord.position * 25}px`,
                  top: `${chord.top}px`
                }">
                  {{ formatChordName(chord.chordName) }}
                </div>

                <!-- ADD Lyric Rendering - Separate loop outside the notes loop -->
                <div v-for="note in notesForStaffWithLyrics(stave.id)" :key="`lyric-${note.id}`" class="lyric"
                  :class="{ 'playing': currentPlayingNoteIds.includes(note.id) }" :style="{
                    left: `${note.position * 25}px`,
                    top: getLyricVerticalOffset(note.voiceId, stave.id), // Pass staveId
                    color: currentPlayingNoteIds.includes(note.id) ? '#f44336' : (note.voiceColor || '#333')
                  }">
                  {{ note.lyric }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>


    <!-- Scroll controls (global for all staves) -->
    <div class="staff-scroll-controls-global">
      <button @click="scrollStaff('left')" class="scroll-btn left" :disabled="scrollPosition === 0">
        ◀
      </button>
      <button @click="extendStaff" class="extend-btn">
        Extend Staff
      </button>
      <button @click="scrollStaff('right')" class="scroll-btn right" :disabled="scrollPosition >= maxScrollPosition">
        ▶
      </button>
    </div>


    <PlaybackControls :is-playing="isPlaying" :is-paused="isPaused" @toggle-playback="togglePlayback"
      @stop-playback="stopPlayback" @clear-or-restart="handleClearOrRestart" :readOnlyMode="readOnlyMode" />

    <PlaybackSettings v-model:playbackStartMeasure="playbackStartMeasure"
      v-model:playbackEndMeasure="playbackEndMeasure" :maxMeasures="barlines.length"
      v-model:autoScrollToPlayingNote="autoScrollToPlayingNote" v-model:showMeasureNumbers="showMeasureNumbers"
      v-model:lyricsEditMode="lyricsEditMode" />

    <!-- Mobile-optimized note controls with tabs -->
    <div class="mobile-tabs">
      <button @click="activeTab = 'notes'"
        :class="['tab-btn', { active: activeTab === 'notes', 'disabled': readOnlyMode }]" :disabled="readOnlyMode">
        {{ readOnlyMode ? 'Notes (Locked)' : 'Notes' }}
      </button>
      <button @click="activeTab = 'sections'" :class="['tab-btn', { active: activeTab === 'sections' }]">
        {{ readOnlyMode ? 'Sections (View Only)' : 'Sections' }}
      </button>
      <button @click="activeTab = 'saved'" :class="['tab-btn', { active: activeTab === 'saved' }]">
        Saved
      </button>
    </div>

    <!-- Modify the Notes tab content to be completely hidden in read-only mode -->
    <div v-if="activeTab === 'notes'">
      <div v-if="!readOnlyMode">
        <NoteInputControls v-model:selectedDuration="selectedDuration" v-model:selectedNoteType="selectedNoteType"
          v-model:isDottedNote="isDottedNote" v-model:isTripletNote="isTripletNote" :availableDurations="availableDurations"
          :usesFallbackSymbols="usesFallbackSymbols" v-model:selectedAccidental="selectedAccidental"
          :availableAccidentals="availableAccidentals" v-model:selectedOctave="selectedOctave"
          @toggleDottedNote="toggleDottedNote" @toggleTripletNote="toggleTripletNote" />
        <LyricsControls v-model="currentLyric" :selectedNoteId="selectedNoteId" @setLyric="setLyricForNoteHandler"
          :lyricsEditMode="lyricsEditMode" />
      </div>
      <div v-else class="read-only-message-container">
        <div class="read-only-message">
          <i class="lock-icon">🔒</i> Note editing is disabled in read-only mode.
          <div class="read-only-detail">Switch back to edit mode to modify notes and lyrics.</div>
        </div>
      </div>
    </div>

    <!-- <div v-if="activeTab === 'settings'">
      <SettingsPanel
        :debugMode="debugMode"
        @showChordInput="showChordInput = true"
        @addExampleChords="addExampleChords"
        @toggleDebugMode="toggleDebugMode"
      />
      </div> -->

    <DebugPanel :debugMode="debugMode" :showNotePositions="showNotePositions" :lastClickY="lastClickY"
      :selectedOctave="selectedOctave" :notesForDebug="notes" :needsLedgerLines="needsLedgerLinesForDebugPanel"
      :getLedgerLines="getLedgerLinesForDebugPanel" @toggleShowNotePositions="showNotePositions = !showNotePositions"
      @testAllNotes="testAllNotes" />

    <div v-if="activeTab === 'saved'">
      <SavedCompositionsPanel :savedCompositions="savedCompositions" v-model:compositionName="compositionName"
        :currentCompositionId="currentCompositionId" v-model:exportOnlySelectedVoices="exportOnlySelectedVoices"
        :readOnlyMode="readOnlyMode" @saveComposition="saveComposition" @loadComposition="loadCompositionWithReadOnly"
        @updateComposition="updateComposition" @saveRename="handleSaveRename" @deleteComposition="deleteComposition"
        @exportAllCompositions="exportAllCompositions" @exportCurrentComposition="exportCurrentComposition"
        @importCompositions="importCompositions" @combineCompositions="combineCompositions" />
    </div>

    <div v-if="activeTab === 'sections'">
      <SectionsPanel :sections="sections" :maxMeasures="Math.ceil(staffWidth / measureWidthByTimeSignature)"
        :sequenceItems="sequenceItems" :readOnlyMode="readOnlyMode" @addSection="addSection"
        @deleteSection="deleteSection" @playSection="playSection" @jumpToSection="jumpToSection"
        @playSequence="playSequence" @updateSequence="updateSequence" />
    </div>

    <HelpGuide :is-visible="showHelp" @close="showHelp = false" />

    <VoiceLayersPanel :voiceLayers="voiceLayers" :staves="staves" :activeStaffId="activeStaffId"
      :readOnlyMode="readOnlyMode" v-model:playSelectedVoicesOnly="playSelectedVoicesOnly" @renameVoice="renameVoice"
      @changeVoiceColor="changeVoiceColor" @switchActiveVoice="switchActiveVoice"
      @toggleVoiceVisibility="toggleVoiceVisibility" @updateVoiceSelection="updateVoiceLayerSelection"
      @confirmDeleteVoice="confirmDeleteVoice" @addVoiceLayer="addVoiceLayer" @assignVoiceToStaff="assignVoiceToStaff"
      @changeVolume="handleChangeVoiceVolume" />

    <!-- Add the FirstTimeInstructionModal component -->
    <FirstTimeInstructionModal :is-visible="showFirstTimeInstructions" @close="closeFirstTimeInstructions" />

    <!-- In your template, if needed, add this hidden element to force re-renders -->
    <div style="display: none;">{{ lastUIUpdateTimestamp }}</div>

    <!-- Find your staff container or notation display element -->
    <div class="notation-area" :key="forceStaffRedraw ? `staff-${lastUIUpdateTimestamp}` : 'staff'">
      <!-- Your existing staff rendering code -->
      <!-- This could be a v-for loop of notes, or a custom canvas rendering, etc. -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, reactive, watch, type ComputedRef } from 'vue';
import '@/assets/styles/global.css';
import * as Tone from 'tone';
import { useNotationStore } from '@/stores/notation';
import HelpGuide from '@/components/HelpGuide.vue';
import AppHeader from '@/components/AppHeader.vue';
import TempoControl from '@/components/TempoControl.vue';
import PlaybackControls from '@/components/PlaybackControls.vue';
import NoteInputControls from '@/components/NoteInputControls.vue';
import SavedCompositionsPanel from '@/components/SavedCompositionsPanel.vue';
import PlaybackSettings from '@/components/PlaybackSettings.vue';
import LyricsControls from '@/components/LyricsControls.vue';
import VoiceLayersPanel from '@/components/VoiceLayersPanel.vue';
import SettingsPanel from '@/components/SettingsPanel.vue';
import DebugPanel from '@/components/DebugPanel.vue';
import FirstTimeInstructionModal from '@/components/FirstTimeInstructionModal.vue'; // Import the new component
import { useDebug } from '@/composables/useDebug';
import SectionsPanel from '@/components/SectionsPanel.vue';
import { generateId } from '@/utils/idGenerator'; // Make sure this import path is correct

// Import types
import type {
  Note as ImportedNote, // Alias the import
  ChordSymbol as ImportedChordSymbol, // Alias the import
  VoiceLayer,
  CompositionData,
  NoteWithVoiceInfo,
  Section,
  SequenceItem,
  Stave, // Import Stave
  KeySignatureChange,
  TimeSignatureChange,
  ClefChange,
} from '@/types/types'; // Updated path

// Store
const notationStore = useNotationStore();

// --- CONSOLIDATED INTERFACE DEFINITIONS ---
// All interface definitions (Note, ChordSymbol, VoiceLayer, CompositionData, NoteWithVoiceInfo)
// are now imported. The local definitions below should be removed.

// State variables
// const selectedHeight = ref('middle');
const selectedOctave = ref(4);
const selectedNoteType = ref('note'); // Default to 'note'
const selectedAccidental = ref<string | null>(null); // Initialize as null instead of 'natural'
const selectedDuration = ref('quarter');
const lastClickY = ref(0);
const tempo = ref(120);
// const debugMode = ref(false); // Moved to composable
// const showNotePositions = ref(false); // Moved to composable
const currentPlayingNoteIds = ref<string[]>([]); // Changed from currentPlayingNoteId
// const selectedClef = ref('treble'); // REMOVED - Clef is now per staff
const exportOnlySelectedVoices = ref(false); // New ref for export option

// --- Stave Management ---
const staves = ref<Stave[]>([]);
const activeStaffId = ref<string | null>(null); // ID of the staff currently active for input

// Ref for staff name editing
const editingStaffNameId = ref<string | null>(null);
// const staffNameInput = ref<HTMLInputElement | null>(null); // Old type
const staffNameInput = ref<HTMLInputElement[]>([]); // Correct type: array of input elements

// Helper function to generate a random hex color
const getRandomColor = (): string => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

// Add voice layers and related refs near the top
// Default to one voice with a random color
const voiceLayers = ref<VoiceLayer[]>([]); // Explicitly type voiceLayers

// Track the currently active voice layer
const activeVoiceId = ref(''); // Still defaults to the first voice

// Get the active voice layer
const activeVoice = computed<VoiceLayer>(() => { // Explicitly type activeVoice
  const foundVoice = voiceLayers.value.find(layer => layer.id === activeVoiceId.value);

  if (foundVoice) {
    return foundVoice;
  } else if (voiceLayers.value.length > 0) {
    activeVoiceId.value = voiceLayers.value[0].id;
    // Ensure the active voice's staff is also the active staff
    const newActiveVoice = voiceLayers.value.find(v => v.id === activeVoiceId.value);
    if (newActiveVoice && newActiveVoice.staffId) {
      activeStaffId.value = newActiveVoice.staffId;
    }
    return voiceLayers.value[0];
  } else {
    // Create a default voice if no voices exist
    // This should ideally be rare if initializeDefaultStaffAndVoice works correctly on mount/load
    let staffIdForDefaultVoice = activeStaffId.value;
    if (!staffIdForDefaultVoice && staves.value.length > 0) {
      staffIdForDefaultVoice = staves.value[0].id;
    } else if (!staffIdForDefaultVoice && staves.value.length === 0) {
      // Emergency: if no staves exist, create one.
      const newDefaultStaffId = generateId();
      staves.value.push({ id: newDefaultStaffId, clef: 'treble', order: 0, name: 'Default Staff' });
      staffIdForDefaultVoice = newDefaultStaffId;
      activeStaffId.value = newDefaultStaffId; // Make it active
      console.warn("activeVoice computed created an default staff.");
    }

    const defaultVoice: VoiceLayer = {
      id: 'voice1_fallback', // More unique ID
      name: 'Voice 1 (Fallback)',
      color: getRandomColor(),
      visible: true,
      active: true,
      selected: true,
      volume: 100, // Default volume as percentage
      notes: [],
      staffId: staffIdForDefaultVoice! // Assert non-null after the logic above
    };

    voiceLayers.value.push(defaultVoice);
    activeVoiceId.value = defaultVoice.id;
    if (defaultVoice.staffId) { // Ensure activeStaffId is also set
      activeStaffId.value = defaultVoice.staffId;
    }
    return defaultVoice;
  }
});

// Update computed property to correctly set voice colors
const allVisibleNotes = computed((): NoteWithVoiceInfo[] => { // Specify return type
  // Get all notes from visible voices
  let allNotes: NoteWithVoiceInfo[] = [];

  voiceLayers.value.forEach(voice => {
    if (voice.visible) {
      const staff = staves.value.find(s => s.id === voice.staffId);
      if (staff) {
        const notesWithVoiceInfo = voice.notes.map(note => ({
          ...note,
          voiceId: voice.id,
          voiceColor: voice.color,
          staffId: staff.id,
          staffClef: staff.clef,
        })) as NoteWithVoiceInfo[];
        allNotes = [...allNotes, ...notesWithVoiceInfo];
      }
    }
  });

  // Sort by position (left to right)
  return allNotes.sort((a, b) => a.position - b.position);
});

// Update the existing notes ref to use the active voice's notes
const notes = computed<ImportedNote[]>({ // Explicitly type notes using aliased import
  get: () => {
    // Ensure activeVoice is never undefined and always has a notes array
    if (activeVoice.value && Array.isArray(activeVoice.value.notes)) {
      return activeVoice.value.notes;
    }
    return []; // Return empty array as fallback
  },
  set: (newNotes) => {
    // Find the active voice and update its notes
    const voiceIndex = voiceLayers.value.findIndex(v => v.id === activeVoiceId.value);
    if (voiceIndex !== -1) {
      voiceLayers.value[voiceIndex].notes = newNotes;
    } else if (voiceLayers.value.length > 0) {
      // If active voice not found but voices exist, use the first one
      voiceLayers.value[0].notes = newNotes;
      activeVoiceId.value = voiceLayers.value[0].id;
    }
    // If no voices at all, the activeVoice computed will create one
  }
});

// Create a safer version of availableDurations with fallback characters
// Add a ref to track if we need to use fallback symbols
const usesFallbackSymbols = ref(false);

// Test if the browser can display musical symbols
onMounted(() => {
  const testSymbols = ['𝅝', '𝄻', '𝅗𝅥', '𝄼', '♩', '𝄽', '♪', '𝄾', '♬', '𝄿'];
  const testElement = document.createElement('span');
  document.body.appendChild(testElement);
  
  for (const symbol of testSymbols) {
    testElement.textContent = symbol;
    if (testElement.offsetWidth === 0) {
      usesFallbackSymbols.value = true;
      break;
    }
  }
  
  document.body.removeChild(testElement);
});

const availableDurations = [
  {
    value: 'whole',
    noteLabel: '𝅝', // Unicode for whole note
    restLabel: '𝄻', // Unicode for whole rest
    fallbackNoteLabel: 'W', // Fallback for devices that can't display the symbol
    fallbackRestLabel: 'WR'
  },
  {
    value: 'half',
    noteLabel: '𝅗𝅥',
    restLabel: '𝄼',
    fallbackNoteLabel: 'H',
    fallbackRestLabel: 'HR'
  },
  {
    value: 'quarter',
    noteLabel: '♩',
    restLabel: '𝄽',
    fallbackNoteLabel: 'Q',
    fallbackRestLabel: 'QR'
  },
  {
    value: 'eighth',
    noteLabel: '♪',
    restLabel: '𝄾',
    fallbackNoteLabel: 'E',
    fallbackRestLabel: 'ER'
  },
  {
    value: 'sixteenth',
    noteLabel: '♬',
    restLabel: '𝄿',
    fallbackNoteLabel: 'S',
    fallbackRestLabel: 'SR'
  }
];

const availableAccidentals = [
  { value: 'natural', label: '♮' },
  { value: 'sharp', label: '♯' },
  { value: 'flat', label: '♭' }
];

// Add these type definitions at the top of your script section
// interface Note { // REMOVE THIS LOCAL DEFINITION
//   id: string;
//   type: "note" | "rest";
//   pitch?: string;
//   duration: string;
//   position: number;
//   verticalPosition: number;
//   dotted?: boolean;
//   lyric?: string;
// }

// Update the Composition interface to use the imported types
interface Composition {
  id: string;
  name: string;
  dateCreated: number;
  staves?: Stave[]; // Add staves
  voiceLayers?: VoiceLayer[];
  tempo: number;
  // clef: string; // Removed, clef is per-staff
  keySignature: string;
  timeSignature?: string;
  chordSymbols?: ImportedChordSymbol[]; // Use aliased import
  activeVoiceId?: string;
  staffWidth?: number;
  tiesSlurs?: TieSlur[];
  keySignatureChanges?: KeySignatureChange[];
  timeSignatureChanges?: TimeSignatureChange[];
  clefChanges?: ClefChange[];
}

// Add window property declarations
declare global {
  interface Window {
    playbackTimeouts: ReturnType<typeof setTimeout>[]; // Change from number[] to ReturnType<typeof setTimeout>[]
    debugMonitorInterval: number | null;
    debugMonitorRemover: () => void;
    // Add this if you use it, otherwise remove
    // gc?: () => void;
    // Add this for timeout info storage
    [key: `timeout_${number}_info`]: {
      startTime: number;
      duration: number;
      callback: Function;
    };
    Capacitor?: {
      isNativePlatform: () => boolean;
    };
  }
}

// Add this to track the currently active voice layer
// const activeVoiceId = ref('voice1');

// Add a new ref for the show help state
const showHelp = ref(false);

// Create a fallback synth with piano-like settings
const createFallbackPianoSynth = () => {
  return new Tone.PolySynth(Tone.Synth, {
    oscillator: {
      type: "triangle"
    },
    envelope: {
      attack: 0.02,
      decay: 0.1,
      sustain: 0.3,
      release: 1
    }
  }).toDestination();
};

// Initialize synths
let noteSynth: Tone.Synth | null = null;
let pianoSynth: Tone.Sampler | null = null;

// Define the missing initializeToneJs function
const initializeToneJs = async () => {
  try {

    // Set higher master volume for mobile devices
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      Tone.Destination.volume.value = 6; // Increase volume by 6dB on mobile
    }

    // Initialize any samplers or synthesizers if needed
    if (!pianoSynth) {
      // If there's already a pianoSynth defined elsewhere, this won't override it
      try {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        pianoSynth = new Tone.Sampler({
          urls: {
            'C4': 'C4.mp3',
            'D#4': 'Ds4.mp3',
            'F#4': 'Fs4.mp3',
            'A4': 'A4.mp3',
          },
          // Change this to use local files instead of external URL
          baseUrl: '/audio/',
          onload: () => {
            console.log('Piano samples loaded successfully');
            if (isMobile) {
              pianoSynth.volume.value = 3; // Boost sampler volume by 3dB on mobile
            }
          }
        }).toDestination();
      } catch (error) {
        console.error('Error initializing piano sampler:', error);
      }
    }

    if (!noteSynth) {
      // Create a basic synth as fallback
      try {
        noteSynth = new Tone.Synth({
          oscillator: {
            type: 'sine'
          },
          envelope: {
            attack: 0.005,
            decay: 0.1,
            sustain: 0.3,
            release: 1
          }
        }).toDestination();
      } catch (error) {
        console.error('Error initializing basic synth:', error);
      }
    }

    return true;
  } catch (error) {
    console.error('Failed to initialize Tone.js:', error);
    return false;
  }
};

// Initialize Tone.js
onMounted(async () => {
  try {
    // Initialize Tone.js
    await initializeToneJs();

    // Initialize the staff width based on the container
    const staffContainer = document.querySelector('.staff-scroll-container');
    if (staffContainer) {
      visibleStaffWidth.value = staffContainer.clientWidth;
    }

    // Make sure the staff is wide enough
    const staffElement = document.querySelector('.staff');
    if (staffElement) {
      (staffElement as HTMLElement).style.width = `${staffWidth.value}px`;
    }

    // Add window resize listener
    window.addEventListener('resize', handleResize);

    // Load saved compositions from localStorage
    loadSavedCompositions(); // This will also handle initializing staves if loading a composition

    // If after loading, staves are still empty (e.g. new user, no saved data), initialize default.
    if (staves.value.length === 0) {
      initializeDefaultStaffAndVoice();
    }

    // Check if it's the first time visit
    checkFirstTimeVisit();
  } catch (error) {
    console.error('Error initializing Tone.js:', error);
    // Fallback to basic synth if piano samples fail to load
    if (!noteSynth) {
      noteSynth = new Tone.Synth().toDestination();
    }
  }
});

// Types
// interface Note { // REMOVE THIS LOCAL DEFINITION
//   id: string;
//   type: 'note' | 'rest';
//   pitch?: string;
//   duration: string;
//   position: number;
//   verticalPosition: number;
//   dotted?: boolean;
//   lyric?: string; // Add this line for lyrics
// }

// Add new interface for chord symbols
// interface ChordSymbol { // REMOVE THIS LOCAL DEFINITION
//   id: string;
//   position: number;
//   chordName: string;
//   top: number; // Position above staff
// }

// Add chord symbols to the store
const chordSymbols = ref<ImportedChordSymbol[]>([]); // Use aliased import

// Add tie/slur data structures
interface TieSlur {
  id: string;
  type: 'tie' | 'slur';
  startNoteId: string;
  endNoteId: string;
  staffId: string;
  curvature: 'above' | 'below'; // Whether curve goes above or below the notes
}

const tiesSlurs = ref<TieSlur[]>([]);

// Key signature changes are now imported from types.ts

const keySignatureChanges = ref<KeySignatureChange[]>([]);

// Chord input state
const showChordInput = ref(false);
const chordInputPosition = ref(0);
const chordName = ref('');

// Add key signature support
const keySignature = ref('C'); // Default to C major (no sharps/flats)

// Define key signatures and their corresponding sharps/flats
const keySignatures = {
  // Sharp keys
  'G': ['F#'],
  'D': ['F#', 'C#'],
  'A': ['F#', 'C#', 'G#'],
  'E': ['F#', 'C#', 'G#', 'D#'],
  'B': ['F#', 'C#', 'G#', 'D#', 'A#'],
  'F#': ['F#', 'C#', 'G#', 'D#', 'A#', 'E#'],
  'C#': ['F#', 'C#', 'G#', 'D#', 'A#', 'E#', 'B#'],

  // Flat keys
  'F': ['Bb'],
  'Bb': ['Bb', 'Eb'],
  'Eb': ['Bb', 'Eb', 'Ab'],
  'Ab': ['Bb', 'Eb', 'Ab', 'Db'],
  'Db': ['Bb', 'Eb', 'Ab', 'Db', 'Gb'],
  'Gb': ['Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'],
  'Cb': ['Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb', 'Fb'],

  // No sharps/flats
  'C': [],

  // Minor keys (relative minor, accidentals are the same as major)
  // Sharp minor keys
  'Am': [], // Relative to C
  'Em': ['F#'], // Relative to G
  'Bm': ['F#', 'C#'], // Relative to D
  'F#m': ['F#', 'C#', 'G#'], // Relative to A
  'C#m': ['F#', 'C#', 'G#', 'D#'], // Relative to E
  'G#m': ['F#', 'C#', 'G#', 'D#', 'A#'], // Relative to B
  'D#m': ['F#', 'C#', 'G#', 'D#', 'A#', 'E#'], // Relative to F#
  'A#m': ['F#', 'C#', 'G#', 'D#', 'A#', 'E#', 'B#'], // Relative to C#

  // Flat minor keys
  'Dm': ['Bb'], // Relative to F
  'Gm': ['Bb', 'Eb'], // Relative to Bb
  'Cm': ['Bb', 'Eb', 'Ab'], // Relative to Eb
  'Fm': ['Bb', 'Eb', 'Ab', 'Db'], // Relative to Ab
  'Bbm': ['Bb', 'Eb', 'Ab', 'Db', 'Gb'], // Relative to Db
  'Ebm': ['Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'], // Relative to Gb
  'Abm': ['Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb', 'Fb'] // Relative to Cb
};

// Get the current key signature accidentals
const currentKeySignatureAccidentals = computed(() => {
  return keySignatures[keySignature.value] || [];
});

// Cache for key signature calculations to avoid redundant computation
const keySignatureCache = new Map<string, string>();

// Function to clear the key signature cache when changes are made
const clearKeySignatureCache = () => {
  keySignatureCache.clear();
};

// Function to get the effective key signature at a specific position
const getEffectiveKeySignatureAtPosition = (position: number): string => {
  // Create cache key based on position and current state
  const cacheKey = `${position}-${keySignature.value}-${keySignatureChanges.value.length}`;
  
  // Check cache first
  if (keySignatureCache.has(cacheKey)) {
    const cachedResult = keySignatureCache.get(cacheKey)!;
    return cachedResult;
  }
  
  // Find the measure number for this position
  const measureWidth = measureWidthByTimeSignature.value;
  // Calculate initial position using the GLOBAL key signature (not position-specific)
  // This avoids circular dependency since we're not calling getEffectiveKeySignatureAtPosition
  const globalKeySignatureWidth = (keySignatures[keySignature.value] || []).length * 10;
  const initialPosition = 70 + globalKeySignatureWidth + 20; // clef + global key sig + time sig
  
  const relativePosition = position - initialPosition;
  const measureNumber = Math.floor(relativePosition / measureWidth) + 1;
  
  const effectiveKey = getEffectiveKeySignatureAtMeasure(measureNumber);
  
  // Cache the result
  keySignatureCache.set(cacheKey, effectiveKey);
  
  return effectiveKey;
};

// Function to get the effective key signature at a specific measure
const getEffectiveKeySignatureAtMeasure = (measureNumber: number): string => {
  // Find the most recent key signature change at or before this measure
  const applicableChanges = keySignatureChanges.value
    .filter(change => change.measure <= measureNumber)
    .sort((a, b) => b.measure - a.measure); // Sort by measure descending
  
  // If there's a key signature change, use it; otherwise use the global key signature
  const result = applicableChanges.length > 0 ? applicableChanges[0].keySignature : keySignature.value;
  
  return result;
};

// Function to get the effective time signature at a specific measure
const getEffectiveTimeSignatureAtMeasure = (measureNumber: number): { numerator: number; denominator: number; } => {
  // Find the most recent time signature change at or before this measure
  const applicableChanges = timeSignatureChanges.value
    .filter(change => change.measure <= measureNumber)
    .sort((a, b) => b.measure - a.measure); // Sort by measure descending
  
  if (applicableChanges.length > 0) {
    return {
      numerator: applicableChanges[0].numerator,
      denominator: applicableChanges[0].denominator
    };
  }
  
  // If no changes, use the global time signature
  const [numerator, denominator] = timeSignature.value.split('/').map(Number);
  return { numerator, denominator };
};

// Function to toggle time signature change mode
const toggleTimeSignatureChangeMode = () => {
  isAddingTimeSignatureChange.value = !isAddingTimeSignatureChange.value;
  // Reset other modes
  isInsertingSpace.value = false;
  isDeletingSpace.value = false;
  isSelectingRange.value = false;
  isPasting.value = false;
  isCreatingTieSlur.value = false;
  tieSlurStartNote.value = null;
  isAddingKeySignatureChange.value = false;
};

// Function to add a time signature change at a specific measure
const addTimeSignatureChange = (event: MouseEvent, staffId: string) => {
  if (readOnlyMode.value || !isAddingTimeSignatureChange.value) return;

  const staffRect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const x = event.clientX - staffRect.left;
  
  // Calculate which measure was clicked
  const measureWidth = measureWidthByTimeSignature.value;
  const globalKeySignatureWidth = (keySignatures[keySignature.value] || []).length * 10;
  const initialPosition = 70 + globalKeySignatureWidth + 20;
  
  const relativePosition = x - initialPosition;
  const measureNumber = Math.floor(relativePosition / measureWidth) + 1;
  
  // Don't allow time signature change in measure 1 (use global time signature instead)
  if (measureNumber < 2) {
    alert('Time signature changes cannot be placed in measure 1. Use the global time signature setting instead.');
    return;
  }
  
  // Check if there's already a time signature change at this measure
  const existingChange = timeSignatureChanges.value.find(change => change.measure === measureNumber);
  if (existingChange) {
    // Update existing change
    existingChange.numerator = newTimeSignatureNumerator.value;
    existingChange.denominator = newTimeSignatureDenominator.value;
  } else {
    // Create new change
    const newChange: TimeSignatureChange = {
      id: generateId(),
      measure: measureNumber,
      numerator: newTimeSignatureNumerator.value,
      denominator: newTimeSignatureDenominator.value,
      position: initialPosition + ((measureNumber - 1) * measureWidth) + 5 // Small offset from measure line
    };
    console.log(`➕ Creating NEW time signature change: ${newTimeSignatureNumerator.value}/${newTimeSignatureDenominator.value} at measure ${measureNumber}, position ${newChange.position}`);
    timeSignatureChanges.value.push(newChange);
  }
  
  // Sort time signature changes by measure
  timeSignatureChanges.value.sort((a, b) => a.measure - b.measure);
  
  // Exit time signature change mode
  isAddingTimeSignatureChange.value = false;
  saveToLocalStorage();
  
};

// Function to get accidentals for a specific key signature
const getAccidentalsForKeySignature = (keySig: string): string[] => {
  return keySignatures[keySig] || [];
};

// Function to reverse a key signature application - convert note back to natural form
const reverseKeySignature = (pitch: string, keySignatureToReverse: string): string => {
  if (!pitch || !keySignatureToReverse) return pitch;
  
  const noteLetter = pitch.charAt(0);
  const octave = pitch.slice(-1);
  const hasAccidental = pitch.includes('#') || pitch.includes('b');
  
  // If no accidental in stored pitch, it's already natural
  if (!hasAccidental) {
    return pitch;
  }
  
  // Get the accidentals for the key signature we want to reverse
  const keyAccidentals = getAccidentalsForKeySignature(keySignatureToReverse);
  
  // Check if this note's accidental matches what the key signature would apply
  const expectedAccidental = keyAccidentals.find(acc => acc.startsWith(noteLetter));
  
  if (expectedAccidental) {
    // Check if the stored accidental matches the key signature accidental
    const expectedSymbol = expectedAccidental.includes('#') ? '#' : 'b';
    const storedSymbol = pitch.includes('#') ? '#' : 'b';
    
    if (expectedSymbol === storedSymbol) {
      // This accidental came from the key signature, so remove it to get natural form
      return `${noteLetter}${octave}`;
  }
  }
  
  // The accidental doesn't match the key signature, so it's explicit - keep it
  return pitch;
};

// Function to change the key signature
const changeKeySignature = (key: string) => {
  keySignature.value = key;
  // After changing key signature, re-evaluate natural notes for all voices on all staves
  enforceNaturalNotes();
};

// Function to get the position of a key signature accidental on the staff
const getKeySignaturePosition = (accidental: string, clef: 'treble' | 'bass') => {
  const note = accidental.charAt(0);
  let positions: Record<string, number> = {};

  if (clef === 'treble') {
    // Standard order for sharps: F, C, G, D, A, E, B
    const sharpPositionsTreble: Record<string, number> = { 'F': 100, 'C': 122.5, 'G': 92.5, 'D': 115, 'A': 137.5, 'E': 85, 'B': 107.5 };
    // Standard order for flats: B, E, A, D, G, C, F
    const flatPositionsTreble: Record<string, number> = { 'B': 130, 'E': 107.5, 'A': 137.5, 'D': 115, 'G': 145, 'C': 122.5, 'F': 152.5 };

    positions = accidental.includes('#') ? sharpPositionsTreble : flatPositionsTreble;

  } else { // Bass clef
    // Standard order for sharps: F, C, G, D, A, E, B
    const sharpPositionsBass: Record<string, number> = { 'F': 145, 'C': 115, 'G': 137.5, 'D': 160, 'A': 130, 'E': 152.5, 'B': 122.5 };
    // Standard order for flats: B, E, A, D, G, C, F
    const flatPositionsBass: Record<string, number> = { 'B': 107.5, 'E': 130, 'A': 100, 'D': 122.5, 'G': 152.5, 'C': 115, 'F': 137.5 };

    positions = accidental.includes('#') ? sharpPositionsBass : flatPositionsBass;
  }

  return positions[note] || 0;
};

// Update this function to make key signatures more compact
// const getKeySignatureXPosition = (index) => {
//   // More compact spacing - 10px between accidentals
//   return 45 + (index * 10);
// };

// Function to get the accidental symbol (# or b)
const getAccidentalSymbolForKeySignature = (accidental: string) => {
  if (accidental.includes('#')) {
    return '♯';
  } else if (accidental.includes('b')) {
    return '♭';
  }
  return '';
};

// Functions
const getPitchPosition = (pitch: string, clef: 'treble' | 'bass') => {
  if (!pitch) return 0;
  
  // Map pitches to vertical positions (in pixels)
  const octave = parseInt(pitch.slice(-1));
  const note = pitch.slice(0, -1).replace(/[#b]/, ''); // Remove accidentals

  // For notes above or below the staff
  const noteOrder = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const noteIndex = noteOrder.indexOf(note);
  
  if (clef === 'treble') {
    // Each step is 7.5px, F5 is at 100px
    const stepsFromF5 = (octave - 5) * 7 + noteIndex - noteOrder.indexOf('F');
    return 100 - (stepsFromF5 * 7.5); // Each step is 7.5px up (negative) or down (positive)
  } else {
    // Each step is 7.5px, A3 is at 100px
    const stepsFromA3 = (octave - 3) * 7 + noteIndex - noteOrder.indexOf('A');
    return 100 - (stepsFromA3 * 7.5); // Each step is 7.5px up (negative) or down (positive)
  }
};

// Update mapPositionToPitch to handle a wider range
const mapPositionToPitch = (verticalPosition: number, clef: 'treble' | 'bass'): string | null => {
  // Each 7.5px represents one step
  const noteOrder = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  
  if (clef === 'treble') {
    // F5 is at 100px
    const stepsFromF5 = Math.round((100 - verticalPosition) / 7.5);
    const totalSteps = noteOrder.indexOf('F') + (stepsFromF5);
    
    const octave = Math.floor(totalSteps / 7) + 5;
    const noteIndex = ((totalSteps % 7) + 7) % 7;
    
    return `${noteOrder[noteIndex]}${octave}`;
  } else {
    // A3 is at 100px
    const stepsFromA3 = Math.round((100 - verticalPosition) / 7.5);
    const totalSteps = noteOrder.indexOf('A') + (stepsFromA3);
    
    const octave = Math.floor(totalSteps / 7) + 3;
    const noteIndex = ((totalSteps % 7) + 7) % 7;
    
    return `${noteOrder[noteIndex]}${octave}`;
  }
};

// Add this function to check if a note is affected by the key signature at a specific position
const isNoteAffectedByKeySignature = (noteName: string, notePosition?: number) => {
  let accidentals;
  
  if (notePosition !== undefined) {
    // Get the effective key signature at this position
    const effectiveKeySignature = getEffectiveKeySignatureAtPosition(notePosition * 25);
    accidentals = getAccidentalsForKeySignature(effectiveKeySignature);
  } else {
    // Fall back to global key signature for backward compatibility
    accidentals = currentKeySignatureAccidentals.value;
  }

  // Check if the note is in the key signature
  for (const accidental of accidentals) {
    if (accidental.startsWith(noteName)) {
      return true;
    }
  }

  return false;
};

// Update the getModifiedPitchForKeySignature function to consider position
const getModifiedPitchForKeySignature = (pitch: string, isExplicitNatural = false, notePosition?: number) => {
  // If this note has an explicit natural, its stored pitch is already the correct natural pitch.
  if (isExplicitNatural) {
    return pitch;
  }

  // If the pitch *already* contains an accidental (e.g. F#4, Bb4),
  // it means it's either an explicit sharp/flat or a courtesy accidental.
  // The key signature should not override an existing explicit sharp or flat in the pitch string itself.
  if (pitch.includes('#') || pitch.includes('b')) {
    return pitch;
  }

  const noteName = pitch.charAt(0);
  const octave = pitch.slice(pitch.length - 1); // Correctly get last char for octave

  let effectiveAccidentals;
  let effectiveKeySignature;
  
  if (notePosition !== undefined) {
    // Get the effective key signature at this position
    effectiveKeySignature = getEffectiveKeySignatureAtPosition(notePosition * 25);
    effectiveAccidentals = getAccidentalsForKeySignature(effectiveKeySignature);
  } else {
    // Fall back to global key signature for backward compatibility
    effectiveKeySignature = keySignature.value;
    effectiveAccidentals = currentKeySignatureAccidentals.value;
  }

  // Check if we have an effective key signature with accidentals
  for (const accidentalInKey of effectiveAccidentals) {
    if (accidentalInKey.startsWith(noteName)) {
      const modifiedPitch = `${noteName}${accidentalInKey.includes('#') ? '#' : 'b'}${octave}`;
      return modifiedPitch;
    }
  }
  
  return pitch;
};

// Refine the playNoteSound function for robustness
const playNoteSound = (pitch: string, duration = "8n", isDotted = false, volumePercent = 100, explicitNatural = false, isTriplet = false, position?: number, durationModifier = 1.0) => {
  let pitchToPlay = pitch;
  let noteDuration = duration;
  
  // Get the measure number if position is provided
  let measureTempo = tempo.value;
  if (position !== undefined) {
    const dummyNote = { position, type: 'note' } as ImportedNote;
    const measureNumber = getNotesMeasure(dummyNote);
    measureTempo = getTempoForMeasure(measureNumber);
  }

  try {
    // Start Tone.js context (this requires user interaction)
    startToneJs();

    // Make sure Tone.js is started
    Tone.start();

    if (explicitNatural) {
      const noteLetter = pitch.charAt(0);
      const octave = pitch.slice(pitch.length - 1);
      pitchToPlay = `${noteLetter}${octave}`;
    }

    // Extract position from the pitch string (e.g., "C4") and create a dummy note for measure calculation
    const dummyNote = { position: Math.floor(pitchToPlay.length > 0 ? pitchToPlay.charCodeAt(0) / 25 : 0), type: 'note' } as ImportedNote;
    const measureNumber = getNotesMeasure(dummyNote);
    const measureTempo = getTempoForMeasure(measureNumber);
    
    const baseDurationMap: { [key: string]: number; } = {
      "1n": 4 * (60 / measureTempo),
      "2n": 2 * (60 / measureTempo),
      "4n": 1 * (60 / measureTempo),
      "8n": 0.5 * (60 / measureTempo),
      "16n": 0.25 * (60 / measureTempo)
    };

    let durationInSeconds;
    
    // Check if duration is already in seconds format (e.g., "2.5s" for tied notes)
    if (duration.endsWith('s')) {
      durationInSeconds = parseFloat(duration.slice(0, -1));
    } else {
      // Use standard Tone.js notation duration
      durationInSeconds = baseDurationMap[duration] || (60 / tempo.value);
      
      // Apply triplet timing first (if applicable)
      if (isTriplet) {
        durationInSeconds *= (2/3);
      }
      
      // Then apply dotted timing
      if (isDotted) {
        durationInSeconds *= 1.5;
      }
    }
    
    // Apply duration modifier (for slurred notes)
    durationInSeconds *= durationModifier;
    
    if (durationInSeconds <= 0) {
      durationInSeconds = 0.5;
    }
    noteDuration = `${durationInSeconds}s`;

    if (!pitchToPlay) {
      return;
    }

    // Convert volumePercent (0-100) to velocity (0.0-1.0)
    // On mobile, use a non-linear scaling to make quieter notes more audible
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    let velocity;
    if (isMobile) {
      // Use a square root curve for better volume scaling on mobile
      velocity = Math.sqrt(volumePercent / 100);
    } else {
      velocity = Math.max(0, Math.min(1, volumePercent / 100));
    }

    // Use the piano synth to play the note if available, otherwise use basic synth
    if (pianoSynth && pianoSynth.loaded) {
      pianoSynth.triggerAttackRelease(pitchToPlay, noteDuration, undefined, velocity);
    } else if (noteSynth) {
      noteSynth.triggerAttackRelease(pitchToPlay, noteDuration, undefined, velocity);
    } else {
      // Fallback to a very basic Tone.Synth if nothing else is initialized
      const fallbackSynth = createFallbackPianoSynth(); // Ensure this function exists or use new Tone.Synth()
      fallbackSynth.triggerAttackRelease(pitchToPlay, noteDuration, undefined, velocity);
      // Dispose of the fallback synth after a short delay to prevent memory leaks if used frequently
      setTimeout(() => fallbackSynth.dispose(), durationInSeconds * 1000 + 500);
    }
  } catch (error) {
    console.error('Error playing note sound:', error);
  }
};

// Update playComposition to enable read-only mode
const playComposition = () => {
  // Store the previous read-only state
  const wasReadOnly = readOnlyMode.value;

  // Enable read-only mode during playback
  readOnlyMode.value = true;

  // Call the playScore function which respects measure boundaries
  playScore();

  // Add a listener to restore previous read-only state when playback ends
  const checkPlaybackStatus = setInterval(() => {
    if (!isPlaying.value) {
      // Only restore to editable if it wasn't already read-only
      if (!wasReadOnly) {
        readOnlyMode.value = false;
      }
      clearInterval(checkPlaybackStatus);
    }
  }, 500); // Check every half second
};

// Function to get preview pitch with correct key signature
const getPreviewPitch = (basePitch: string, position: number): string => {
  if (!basePitch) return '';
  
  // Get the effective key signature at this position
  const effectiveKey = getEffectiveKeySignatureAtPosition(position * 25);
  const globalKey = keySignature.value;
  
  // Get the natural form first
  const naturalPitch = reverseKeySignature(basePitch, globalKey);
  
  // Then apply the effective key signature
  return getModifiedPitchForKeySignature(naturalPitch, false, position);
};

// Update the existing handleStaffClick function to handle explicit natural accidentals
const handleStaffClick = (event, staffId: string) => {
  if (readOnlyMode.value) {
    return; // Exit early if in read-only mode
  }

  if (isDragging.value) {
    return;
  }

  const targetStaff = staves.value.find(s => s.id === staffId);
  if (!targetStaff) {
    return;
  }
  const currentClef = targetStaff.clef;

  // Determine the target voice on the clicked staff for input
  let targetVoiceForInput = voiceLayers.value.find(v => v.staffId === staffId && v.active);
  if (!targetVoiceForInput) {
    targetVoiceForInput = voiceLayers.value.find(v => v.staffId === staffId && v.visible);
  }
  if (!targetVoiceForInput) {
    targetVoiceForInput = voiceLayers.value.find(v => v.staffId === staffId);
  }

  if (!targetVoiceForInput) {
    alert("No voice layer available on this staff. Please add or activate a voice for this staff.");
    return;
  }

  // If the determined voice for input is not the globally active voice, switch to it.
  if (targetVoiceForInput.id !== activeVoiceId.value) {
    switchActiveVoice(targetVoiceForInput.id);
    // After switchActiveVoice, activeVoice.value will be targetVoiceForInput.
    // For consistency within this function, we'll use the explicitly found 'targetVoiceForInput'.
  }

  const notesInTargetVoice = targetVoiceForInput.notes;

  const staffRect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const x = event.clientX - staffRect.left;
  const y = event.clientY - staffRect.top;

  // Use finer grid (25px) to allow more notes per measure
  const position = Math.floor(x / 25) + 0.5; // Center the note in the finer grid
  const verticalPosition = Math.round((y - 100) / 7.5) * 7.5 + 100;
  const pitch = mapPositionToPitch(verticalPosition, currentClef);

  const existingNoteIndex = notesInTargetVoice.findIndex(note =>
    Math.abs(note.position - position) < 0.2 // Slightly larger tolerance for finer grid
  );

  const durationMap = {
    'whole': '1n',
    'half': '2n',
    'quarter': '4n',
    'eighth': '8n',
    'sixteenth': '16n'
  };

  if (existingNoteIndex !== -1) {
    const existingNote = notesInTargetVoice[existingNoteIndex];
    if (pitch || selectedNoteType.value === 'rest') {
      // Get the base pitch first
      let basePitch = pitch || (currentClef === 'treble' ? 'C4' : 'C3');
      
      // If an accidental is selected, apply it directly
      if (selectedAccidental.value !== '') {
        basePitch = applyAccidental(basePitch, selectedAccidental.value, position);
      } else {
        // Otherwise, apply the effective key signature
        const effectiveKey = getEffectiveKeySignatureAtPosition(position * 25);
        basePitch = getModifiedPitchForKeySignature(basePitch, false, position);
      }
      
      const updatedNoteBase = {
        ...existingNote,
        type: selectedNoteType.value as "note" | "rest",
        duration: selectedDuration.value,
        dotted: isDottedNote.value,
        triplet: isTripletNote.value,
        pitch: selectedNoteType.value === 'note' ? basePitch : undefined,
        explicitNatural: selectedNoteType.value === 'note' && selectedAccidental.value === 'natural' ? true : undefined
      };
      const updatedNote = {
        ...updatedNoteBase,
        verticalPosition: selectedNoteType.value === 'rest' ? verticalPosition : getPitchPosition(updatedNoteBase.pitch || (currentClef === 'treble' ? 'C4' : 'C3'), currentClef)
      };

      notesInTargetVoice.splice(existingNoteIndex, 1, updatedNote);

      if (selectedNoteType.value === 'note' && updatedNote.pitch) {
        // For preview sound, we need to convert the pitch just like during playback
        let pitchToPlay = updatedNote.pitch;
        
        // First handle clef changes
        const effectiveClef = getEffectiveClefAtPosition(position * 25, staffId);
        const staff = staves.value.find(s => s.id === staffId);
        const originalClef = staff?.clef || 'treble';
        
        if (effectiveClef !== originalClef) {
          // Extract the note letter and octave
          const noteLetter = pitchToPlay.charAt(0);
          const hasAccidental = pitchToPlay.includes('#') || pitchToPlay.includes('b');
          const accidental = hasAccidental ? pitchToPlay.charAt(1) : '';
          const octave = parseInt(pitchToPlay.slice(hasAccidental ? -1 : -1));
          
          // Adjust octave based on clef change
          let newOctave = octave;
          if (originalClef === 'treble' && effectiveClef === 'bass') {
            newOctave = octave - 2; // Move down two octaves for treble to bass
          } else if (originalClef === 'bass' && effectiveClef === 'treble') {
            newOctave = octave + 2; // Move up two octaves for bass to treble
          }
          
          // Reconstruct the pitch with the new octave
          pitchToPlay = `${noteLetter}${accidental}${newOctave}`;
        }
        
        // Then handle key signature changes
        if (!updatedNote.explicitNatural) {
          const effectiveKey = getEffectiveKeySignatureAtPosition(position * 25);
          const globalKey = keySignature.value;
          
          // Get the natural form first
          const naturalPitch = reverseKeySignature(pitchToPlay, globalKey);
          
          // Then apply the effective key signature
          pitchToPlay = getModifiedPitchForKeySignature(naturalPitch, false, position);
        }
        
        playNoteSound(
          pitchToPlay,
          durationMap[updatedNote.duration],
          updatedNote.dotted,
          100, // volumePercent for click feedback
          updatedNote.explicitNatural,
          updatedNote.triplet,
          updatedNote.position
        );
      }
    }
  } else {
    if (pitch || selectedNoteType.value === 'rest') {
      // Get the base pitch first
      let basePitch = pitch || (currentClef === 'treble' ? 'C4' : 'C3');
      
      // If an accidental is selected, apply it directly
      if (selectedAccidental.value !== '') {
        basePitch = applyAccidental(basePitch, selectedAccidental.value, position);
      } else {
        // Otherwise, apply the effective key signature
        const effectiveKey = getEffectiveKeySignatureAtPosition(position * 25);
        basePitch = getModifiedPitchForKeySignature(basePitch, false, position);
      }
      
      const newNoteBase = {
        id: generateId(),
        type: selectedNoteType.value as "note" | "rest",
        position,
        duration: selectedDuration.value,
        dotted: isDottedNote.value,
        triplet: isTripletNote.value,
        pitch: selectedNoteType.value === 'note' ? basePitch : undefined,
        explicitNatural: selectedNoteType.value === 'note' && selectedAccidental.value === 'natural' ? true : undefined
      };
      const newNote = {
        ...newNoteBase,
        verticalPosition: selectedNoteType.value === 'rest' ? verticalPosition : getPitchPosition(newNoteBase.pitch || (currentClef === 'treble' ? 'C4' : 'C3'), currentClef)
      };

      notesInTargetVoice.push(newNote);

      if (selectedNoteType.value === 'note' && newNote.pitch) {
        // For preview sound, we need to convert the pitch just like during playback
        let pitchToPlay = newNote.pitch;
        
        // First handle clef changes
        const effectiveClef = getEffectiveClefAtPosition(position * 25, staffId);
        const staff = staves.value.find(s => s.id === staffId);
        const originalClef = staff?.clef || 'treble';
        
        if (effectiveClef !== originalClef) {
          // Extract the note letter and octave
          const noteLetter = pitchToPlay.charAt(0);
          const hasAccidental = pitchToPlay.includes('#') || pitchToPlay.includes('b');
          const accidental = hasAccidental ? pitchToPlay.charAt(1) : '';
          const octave = parseInt(pitchToPlay.slice(hasAccidental ? -1 : -1));
          
          // Adjust octave based on clef change
          let newOctave = octave;
          if (originalClef === 'treble' && effectiveClef === 'bass') {
            newOctave = octave - 2; // Move down two octaves for treble to bass
          } else if (originalClef === 'bass' && effectiveClef === 'treble') {
            newOctave = octave + 2; // Move up two octaves for bass to treble
          }
          
          // Reconstruct the pitch with the new octave
          pitchToPlay = `${noteLetter}${accidental}${newOctave}`;
        }
        
        // Then handle key signature changes
        if (!newNote.explicitNatural) {
          const effectiveKey = getEffectiveKeySignatureAtPosition(position * 25);
          const globalKey = keySignature.value;
          
          // Get the natural form first
          const naturalPitch = reverseKeySignature(pitchToPlay, globalKey);
          
          // Then apply the effective key signature
          pitchToPlay = getModifiedPitchForKeySignature(naturalPitch, false, position);
        }
        
        playNoteSound(
          pitchToPlay,
          durationMap[newNote.duration],
          newNote.dotted,
          100, // volumePercent for click feedback
          newNote.explicitNatural,
          newNote.triplet,
          position // Add position parameter to ensure correct tempo
        );
      }
    }
  }
};

// Add a function to determine stem direction based on note position
const getStemDirection = (pitch: string, clef: 'treble' | 'bass') => {
  if (!pitch) return 'up';

  // Get the base note without accidentals
  const octave = parseInt(pitch.slice(-1));
  const note = pitch.slice(0, -1).replace(/[#b]/, '');

  if (clef === 'treble') {
    // Middle line is B4 in treble clef
    // Notes above middle line have stems down, below have stems up
    if (octave > 4) return 'down';
    if (octave < 4) return 'up';

    // For octave 4, depends on the note
    const noteOrder = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const noteIndex = noteOrder.indexOf(note);

    // B4 is the middle line, notes above it would have stems down
    return noteIndex < 6 ? 'up' : 'down';
  } else {
    // Middle line is D3 in bass clef
    // Notes above middle line have stems down, below have stems up
    if (octave > 3) return 'down';
    if (octave < 3) return 'up';

    // For octave 3, depends on the note
    const noteOrder = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const noteIndex = noteOrder.indexOf(note);

    // D3 is the middle line, notes above it would have stems down
    return noteIndex < 1 ? 'up' : 'down';
  }
};

// Update the getNoteSymbol function to only handle rests
const getNoteSymbol = (note: ImportedNote | NoteWithVoiceInfo) => { // Accept both types
  if (note.type === 'rest') {
    // Return rest symbols based on duration
    switch (note.duration) {
      case 'whole': return '𝄻';
      case 'half': return '𝄼';
      case 'quarter': return '𝄽';
      case 'eighth': return '𝄾';
      case 'sixteenth': return '𝄿';
      default: return '𝄽';
    }
  }
  return ''; // For notes, we're using HTML elements instead
};

// Find the getNoteStyle function and update it to use voice colors
const getNoteStyle = (note: NoteWithVoiceInfo) => {
  const style: {
    left: string;
    top: string;
    color: string;
    borderColor?: string;
  } = {
    left: `${note.position * 25}px`, // Updated to use 25px grid for finer positioning
    top: `${note.verticalPosition}px`, // verticalPosition is already calculated based on staffClef
    color: note.voiceColor || 'black',
  };

  if (note.type === 'note') {
    style.borderColor = note.voiceColor || 'black';

    // Remove the backgroundColor setting that was causing the issue
    // We'll handle coloring through CSS instead
  }

  return style;
};

// Add the isPlaying ref
const isPlaying = ref(false);

// Fix the updateStaffScroll function
const updateStaffScroll = () => {
  const staffElement = document.querySelector('.staff');
  if (staffElement) {
    (staffElement as HTMLElement).style.transform = `translateX(-${scrollPosition}px)`;
  }
};

// Update the stopPlayback function
const stopPlayback = () => {
  isPlaying.value = false;
  isPaused.value = false;
  isPlayingSequence.value = false; // Ensure this is reset
  currentPlayingNoteIds.value = []; // Changed from currentPlayingNoteId
  playingSequenceSectionId.value = null; // Ensure this is reset
  pausedTimeouts.value = [];
  pauseTime.value = null;

  // Don't automatically disable read-only mode if user manually enabled it
  // This could be improved with a separate ref tracking whether read-only mode
  // was manually set versus automatically set for playback

  // Clear any timeouts
  if (window.playbackTimeouts) {
    window.playbackTimeouts.forEach(id => clearTimeout(id));
    window.playbackTimeouts = [];
  }

};

// Update the clearScore function to handle voice layers
const clearScore = () => {
  stopPlayback();

  // Clear notes from all voices
  voiceLayers.value.forEach(voice => {
    voice.notes = [];
  });

  // Reset staves to a single default staff
  staves.value = [];
  initializeDefaultStaffAndVoice(); // This will create one staff and one voice

  chordSymbols.value = [];
  tiesSlurs.value = [];
  keySignatureChanges.value = [];
  sections.value = [];
  sequenceItems.value = [];

  scrollPosition.value = 0;
  updateStaffScroll();

  playbackStartMeasure.value = 1;
  playbackEndMeasure.value = 0; // 0 means play to the end

  compositionName.value = 'Untitled';
  currentCompositionId.value = '';


};

// Add these functions to handle ledger lines
const needsLedgerLines = (note: NoteWithVoiceInfo, position: 'above' | 'below', clef: 'treble' | 'bass') => {
  if (note.type !== 'note' || !note.pitch) return false;

  const verticalPos = note.verticalPosition; // This is already calculated based on the note's staff clef

  if (clef === 'treble') {
    // For treble clef
    if (position === 'above') {
      // Notes above the staff (higher than F5)
      return verticalPos <= 92.5; // G5 and above
    } else if (position === 'below') {
      // Notes below the staff (lower than E4)
      return verticalPos >= 167.5; // D4 and below
    }
  } else {
    // For bass clef
    if (position === 'above') {
      // Notes above the staff (higher than A3)
      return verticalPos <= 85; // C4 (85px) is the first note ON a ledger line.
    } else if (position === 'below') {
      // Notes below the staff (lower than G2)
      return verticalPos >= 167.5; // F2 and below
    }
  }

  return false;
};

const getLedgerLines = (note: NoteWithVoiceInfo, position: 'above' | 'below', clef: 'treble' | 'bass') => {
  if (!needsLedgerLines(note, position, clef)) return [];

  const verticalPos = note.verticalPosition; // Already calculated for the correct clef
  const lines = [];

  if (clef === 'treble') {
    // For treble clef
    if (position === 'above') {
      // Add ledger lines above the staff
      for (let pos = 85; pos >= verticalPos; pos -= 15) {
        lines.push(pos);
      }
    } else if (position === 'below') {
      // Add ledger lines below the staff
      for (let pos = 175; pos <= verticalPos; pos += 15) {
        lines.push(pos);
      }
    }
  } else {
    // For bass clef
    if (position === 'above') {
      // Add ledger lines above the staff
      for (let pos = 85; pos >= verticalPos; pos -= 15) {
        lines.push(pos);
      }
    } else if (position === 'below') {
      // Add ledger lines below the staff
      for (let pos = 175; pos <= verticalPos; pos += 15) {
        lines.push(pos);
      }
    }
  }

  return lines;
};

// Format chord names with proper musical symbols
const formatChordName = (name: string) => {
  return name
    .replace(/b/g, '♭')
    .replace(/#/g, '♯')
    .replace(/maj7/g, 'Δ7')
    .replace(/maj9/g, 'Δ9')
    .replace(/m7/g, 'm⁷')
    .replace(/m9/g, 'm⁹')
    .replace(/dim/g, '°')
    .replace(/aug/g, '+')
    .replace(/sus4/g, 'sus⁴')
    .replace(/sus2/g, 'sus²')
    .replace(/add9/g, 'add⁹');
};

// Add example chords for demo
const addExampleChords = () => {
  chordSymbols.value = [
    { id: '1', position: 1, chordName: 'Cmaj7', top: 70 },
    { id: '2', position: 3, chordName: 'Dm7', top: 70 },
    { id: '3', position: 5, chordName: 'G7', top: 70 },
    { id: '4', position: 7, chordName: 'Cmaj7', top: 70 },
    { id: '5', position: 9, chordName: 'Am7', top: 70 },
    { id: '6', position: 11, chordName: 'Dm7', top: 70 },
    { id: '7', position: 13, chordName: 'G7', top: 70 }
  ];
};

// Helper function to safely get the key signature accidental for a note at a specific position
const getKeySignatureAccidentalForNote = (noteName: string, notePosition?: number) => {
  let accidentals;
  let effectiveKeySignature;
  
  if (notePosition !== undefined) {
    // Get the effective key signature at this position
    effectiveKeySignature = getEffectiveKeySignatureAtPosition(notePosition * 25);
    accidentals = getAccidentalsForKeySignature(effectiveKeySignature);
    } else {
      // Fall back to global key signature for backward compatibility
      effectiveKeySignature = keySignature.value;
      accidentals = currentKeySignatureAccidentals.value;
    }
  
  const accidental = accidentals.find(a => a.startsWith(noteName));
  return accidental || '';
};

// Update these variables for staff scrolling and measures
const measuresCount = ref(8); // Default number of measures
const measureWidthPx = ref(120); // Width of each measure in pixels

// Change these computed properties to refs
const staffWidth = ref(measuresCount.value * measureWidthPx.value);
const scrollPosition = ref(0); // Horizontal scroll position

// Add this near the other staff-related refs
const visibleStaffWidth = ref(800); // Width visible in the viewport

// Update the computed property to watch for changes
watch([measuresCount, measureWidthPx], () => {
  staffWidth.value = measuresCount.value * measureWidthPx.value;
});

// Add this computed property for maximum scroll position
const maxScrollPosition = computed(() => {
  return Math.max(0, staffWidth.value - visibleStaffWidth.value);
});

// Function to extend the staff
const extendStaff = () => {
  // Add 4 more measures
  measuresCount.value += 4;

  // Log for debugging
  console.log(`Extended staff: ${measuresCount.value} measures, width: ${staffWidth.value}px`);

  // Force a re-render of the staff lines
  nextTick(() => {
    const staffElement = document.querySelector('.staff');
    if (staffElement) {
      (staffElement as HTMLElement).style.width = `${staffWidth.value}px`;

      // Make sure staff lines extend across the full width
      const staffLines = document.querySelectorAll('.staff-line');
      staffLines.forEach(line => {
        (line as HTMLElement).style.width = `${staffWidth.value}px`;
      });
    }
  });
};

// Function to handle staff scrolling
const scrollStaff = (direction: 'left' | 'right') => {
  const scrollAmount = 200; // Amount to scroll in pixels

  if (direction === 'left') {
    // Scroll left (decrease position)
    scrollPosition.value = Math.max(0, scrollPosition.value - scrollAmount);
  } else {
    // Scroll right (increase position)
    scrollPosition.value = Math.min(maxScrollPosition.value, scrollPosition.value + scrollAmount);
  }

  // Apply the scroll position directly to the staff element
  const staffElement = document.querySelector('.staff');
  if (staffElement) {
    (staffElement as HTMLElement).style.transform = `translateX(-${scrollPosition.value}px)`;
  }

};

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
});

// Handle window resize
const handleResize = () => {
  const staffContainer = document.querySelector('.staff-scroll-container');
  if (staffContainer) {
    visibleStaffWidth.value = staffContainer.clientWidth;
  }
};

// Add back the getAccidentalSymbol function
const getAccidentalSymbol = (note: ImportedNote) => {
  if (note.type !== 'note' || !note.pitch) return '';

  if (note.pitch.includes('#')) {
    return '♯';
  } else if (note.pitch.includes('b')) {
    return '♭';
  }
  return '';
};

// Add this new function to handle clef change
const handleStaffClefChange = (stave: Stave) => {
  // The v-model on the select already updates stave.clef.
  // Now, we need to update the vertical position of all notes on this staff.

  let notesUpdatedCount = 0;
  voiceLayers.value.forEach(voice => {
    if (voice.staffId === stave.id) {
      voice.notes.forEach(note => {
        if (note.pitch) { // Only notes with a pitch have a vertical position dependent on clef
          const oldPosition = note.verticalPosition;
          note.verticalPosition = getPitchPosition(note.pitch, stave.clef);
          if (oldPosition !== note.verticalPosition) {
            notesUpdatedCount++;
          }
        }
      });
    }
  });

  if (notesUpdatedCount > 0) {
  }

  saveToLocalStorage(); // Save changes after updating note positions
};

// Add a new ref for the active tab
const activeTab = ref('notes');

// Add these variables for drag scrolling
const isDragging = ref(false);
const dragStartX = ref(0);
const dragStartScrollPosition = ref(0);

// Add these functions to handle drag scrolling
const startDrag = (event) => {
  // Only start dragging if it's not a click on a note
  if (event.target.closest('.note') || event.target.closest('.chord-symbol')) {
    return;
  }

  // Store the initial position for drag detection
  const startX = event.touches ? event.touches[0].clientX : event.clientX;
  const startY = event.touches ? event.touches[0].clientY : event.clientY;
  const startTime = Date.now();

  // Prevent default to avoid text selection during drag
  event.preventDefault();

  // Get the starting position for scroll calculation
  const clientX = event.touches ? event.touches[0].clientX : event.clientX;
  dragStartX.value = clientX;
  dragStartScrollPosition.value = scrollPosition.value;

  // Create a flag to track if we've moved enough to consider it a drag
  let hasDragged = false;

  // Define the move handler with drag detection
  const moveHandler = (moveEvent) => {
    // Get current position
    const currentX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
    const currentY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;

    // Calculate distance moved (use both X and Y for better detection)
    const distanceX = Math.abs(currentX - startX);
    const distanceY = Math.abs(currentY - startY);
    const totalDistance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

    // Only consider it a drag if moved more than 15px (higher threshold for mobile)
    if (totalDistance > 15) {
      if (!hasDragged) {
        hasDragged = true;
        isDragging.value = true;
      }

      // Now handle the drag
      // Prevent default to avoid scrolling the page
      moveEvent.preventDefault();

      // Calculate the distance moved for scrolling
      const deltaX = dragStartX.value - currentX;

      // Update the scroll position
      const newScrollPosition = Math.max(0, Math.min(maxScrollPosition.value, dragStartScrollPosition.value + deltaX));
      scrollPosition.value = newScrollPosition;

      // Update the staff transform
      updateStaffScroll();
    }
  };

  // Define the end handler
  const endHandler = (endEvent) => {
    // Calculate the time elapsed
    const endTime = Date.now();
    const timeElapsed = endTime - startTime;

    // If it was a quick tap (less than 300ms) and didn't move much, treat as a click
    if (timeElapsed < 300 && !hasDragged) {
      isDragging.value = false;

      // For touch events, we need to manually trigger a click at the right position
      if (endEvent.type === 'touchend') {
        // Create a synthetic click event at the touch position
        const clickEvent = new MouseEvent('click', {
          clientX: startX,
          clientY: startY,
          bubbles: true,
          cancelable: true,
          view: window
        });

        // Dispatch the click event on the staff element
        endEvent.target.dispatchEvent(clickEvent);
      }
    } else if (hasDragged) {
      // Reset after a short delay
      setTimeout(() => {
        isDragging.value = false;
      }, 50);
    } else {
      // It wasn't a drag but also wasn't a quick tap
      isDragging.value = false;
    }

    // Remove event listeners
    document.removeEventListener('mousemove', moveHandler);
    document.removeEventListener('mouseup', endHandler);
    document.removeEventListener('touchmove', moveHandler);
    document.removeEventListener('touchend', endHandler);
  };

  // Add event listeners for drag and end events
  if (event.type === 'mousedown') {
    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', endHandler);
  } else if (event.type === 'touchstart') {
    document.addEventListener('touchmove', moveHandler, { passive: false });
    document.addEventListener('touchend', endHandler);
  }
};

const handleDrag = (event) => {
  if (!isDragging.value) return;

  // Prevent default to avoid scrolling the page
  event.preventDefault();

  // Get the current position (handle both mouse and touch events)
  const clientX = event.touches ? event.touches[0].clientX : event.clientX;

  // Calculate the distance moved
  const deltaX = dragStartX.value - clientX;

  // Update the scroll position
  const newScrollPosition = Math.max(0, Math.min(maxScrollPosition.value, dragStartScrollPosition.value + deltaX));
  scrollPosition.value = newScrollPosition;

  // Update the staff transform
  updateStaffScroll();
};

const endDrag = () => {
  // If we weren't actually dragging, this was a click
  if (!isDragging.value) {
    // Do nothing, let the click handler work
  } else {
    // Reset after a short delay to allow the click handler to check
    setTimeout(() => {
      isDragging.value = false;
    }, 50);
  }

  // Remove event listeners
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', endDrag);
  document.removeEventListener('touchmove', handleDrag);
  document.removeEventListener('touchend', endDrag);
};

// Clean up event listeners when component is unmounted
onBeforeUnmount(() => {
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', endDrag);
  document.removeEventListener('touchmove', handleDrag);
  document.removeEventListener('touchend', endDrag);
  window.removeEventListener('resize', handleResize);
  // Clear playback timeouts if any are running
  if (window.playbackTimeouts) {
    window.playbackTimeouts.forEach(clearTimeout);
    window.playbackTimeouts = [];
  }
});



// Update the applyAccidental function to consider position
const applyAccidental = (pitch, accidental, notePosition) => {
  if (!pitch) return ''; // Should not happen if mapPositionToPitch returns a valid pitch

  const noteLetter = pitch.charAt(0);
  const octave = pitch.charAt(pitch.length - 1);

  if (accidental === 'natural') {
    // ALWAYS return the natural note (no accidental), regardless of key signature
    return `${noteLetter}${octave}`; // This ensures the pitch *value* is natural
  } else if (accidental === null) {
    // Store the base pitch without key signature modifications
    // Key signature will be applied during display and playback
    return `${noteLetter}${octave}`;
  } else if (accidental === 'sharp') {
    return `${noteLetter}#${octave}`;
  } else if (accidental === 'flat') {
    return `${noteLetter}b${octave}`;
  } else {
    // Default: remove any existing accidentals (should be rare if logic is correct)
    return `${noteLetter}${octave}`;
  }
};

// Add a dotted note toggle button to the Duration section
const isDottedNote = ref(false);
const toggleDottedNote = () => {
  isDottedNote.value = !isDottedNote.value;
};

// Add a triplet note toggle button
const isTripletNote = ref(false);
const toggleTripletNote = () => {
  isTripletNote.value = !isTripletNote.value;
};

// Add a function to remove a note
const removeNote = (noteToRemove) => {
  if (readOnlyMode.value) {
    return; // Exit early if in read-only mode
  }

  const voiceId = noteToRemove.voiceId || activeVoice.value?.id;
  if (!voiceId) return;

  const voiceIndex = voiceLayers.value.findIndex(v => v.id === voiceId);
  if (voiceIndex !== -1) {
    const noteIndex = voiceLayers.value[voiceIndex].notes.findIndex(n => n.id === noteToRemove.id);
    if (noteIndex !== -1) {
      voiceLayers.value[voiceIndex].notes.splice(noteIndex, 1);
    }
  }

  if (selectedNoteId.value === noteToRemove.id) {
    selectedNoteId.value = null;
  }
};

// Add these variables for touch handling
const touchTimer = ref(null);
const touchStartPos = ref({ x: 0, y: 0 });
const isTouching = ref(false);

// Add these functions to handle touch events
const handleTouchStart = (note, event) => {
  // Store initial touch position
  touchStartPos.value = {
    x: event.touches[0].clientX,
    y: event.touches[0].clientY
  };
  isTouching.value = true;

  // Start a timer for long press
  touchTimer.value = window.setTimeout(() => {
    if (isTouching.value) {
      removeNote(note);
      // Provide haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }
  }, 500); // 500ms for long press
};

const handleTouchEnd = () => {
  // Clear the timer if touch ends
  if (touchTimer.value) {
    clearTimeout(touchTimer.value);
    touchTimer.value = null;
  }
  isTouching.value = false;
};

const handleTouchMove = (event) => {
  // If user moves finger more than a small threshold, cancel the long press
  const moveX = Math.abs(event.touches[0].clientX - touchStartPos.value.x);
  const moveY = Math.abs(event.touches[0].clientY - touchStartPos.value.y);

  if (moveX > 10 || moveY > 10) {
    if (touchTimer.value) {
      clearTimeout(touchTimer.value);
      touchTimer.value = null;
    }
    isTouching.value = false;
  }
};

// Clean up on component unmount
onBeforeUnmount(() => {
  if (touchTimer.value) {
    clearTimeout(touchTimer.value);
  }
});

// Define a proper type for the saved composition
interface SavedComposition {
  id: string;
  name: string;
  dateCreated: number;
  notes: ImportedNote[]; // Use aliased import
  tempo: number;
  clef: string;
  keySignature: string;
  staffWidth: number; // Required for restoring layout
  selectedDuration: string;
  selectedNoteType: string;
  selectedAccidental?: string; // Add missing property (make optional if needed)
  selectedOctave: number;
  isDottedNote: boolean;
  chordSymbols: ImportedChordSymbol[]; // Use aliased import
  timeSignature?: string; // Add missing property (make optional)
}

// Update the savedCompositions ref to use CompositionData type
const savedCompositions = ref<CompositionData[]>([]);

// Function that prepares a composition object for saving
const prepareCompositionData = (): CompositionData => {
  return {
    id: currentCompositionId.value || generateId(),
    name: compositionName.value.trim(),
    dateCreated: Date.now(),
    staves: JSON.parse(JSON.stringify(staves.value)), // Save staves
    voiceLayers: voiceLayers.value.map(voice => ({ // Save voice layers with staffId
      ...voice,
      volume: voice.volume !== undefined ? voice.volume : 100, // Ensure volume is saved, default 100%
      notes: voice.notes.map(note => ({
        ...note,
        pitch: note.pitch, // Ensure pitch is the one stored on the note
        explicitNatural: !!note.explicitNatural, // Ensure boolean
        voiceId: voice.id,
        voiceColor: voice.color
      }))
    })),
    tempo: tempo.value,
    keySignature: keySignature.value,
    timeSignature: timeSignature.value,
    chordSymbols: [...chordSymbols.value],
    tiesSlurs: [...tiesSlurs.value],
    keySignatureChanges: [...keySignatureChanges.value],
    timeSignatureChanges: [...timeSignatureChanges.value],
    clefChanges: [...clefChanges.value],
    activeVoiceId: activeVoiceId.value,
    staffWidth: staffWidth.value,
    selectedDuration: selectedDuration.value,
    selectedNoteType: selectedNoteType.value,
    selectedAccidental: selectedAccidental.value,
    selectedOctave: selectedOctave.value,
    isDottedNote: isDottedNote.value,
    isTripletNote: isTripletNote.value,
    sections: JSON.parse(JSON.stringify(sections.value)),
    sequenceItems: JSON.parse(JSON.stringify(sequenceItems.value)),
  };
};

// Update existing saveComposition function
const saveComposition = () => {
  if (!compositionName.value.trim()) {
    alert('Please enter a name for your composition');
    return;
  }

  const newComposition = prepareCompositionData();

  // Save the composition
  savedCompositions.value.push(newComposition);

  // Update currentCompositionId to the newly saved composition
  currentCompositionId.value = newComposition.id;

  // Provide user feedback
  alert(`Composition "${compositionName.value}" saved successfully!`);
};

// Update the loadComposition function to be more robust
const loadComposition = (compositionId) => {
  const compositionToLoad = savedCompositions.value.find(comp => comp.id === compositionId);
  if (compositionToLoad) {
    try {
      stopPlayback();

      // Clear current state
      voiceLayers.value = [];
      staves.value = [];
      chordSymbols.value = [];
      sections.value = [];
      sequenceItems.value = [];
      timeSignatureChanges.value = [];
      clefChanges.value = [];
      keySignatureChanges.value = [];

      currentCompositionId.value = compositionToLoad.id;
      compositionName.value = compositionToLoad.name;
      tempo.value = Number(compositionToLoad.tempo) || 120; // Ensure tempo is a number
      keySignature.value = compositionToLoad.keySignature || 'C';
      timeSignature.value = compositionToLoad.timeSignature || '4/4';

      // Load time signature changes
      if (compositionToLoad.timeSignatureChanges) {
        timeSignatureChanges.value = JSON.parse(JSON.stringify(compositionToLoad.timeSignatureChanges));
      }

      // Load clef changes
      if (compositionToLoad.clefChanges) {
        clefChanges.value = JSON.parse(JSON.stringify(compositionToLoad.clefChanges));
      }

      // Load key signature changes
      if (compositionToLoad.keySignatureChanges) {
        keySignatureChanges.value = JSON.parse(JSON.stringify(compositionToLoad.keySignatureChanges));
      }

      // Use staffSettings if available, otherwise staffWidth
      if (compositionToLoad.staffSettings) {
        staffWidth.value = compositionToLoad.staffSettings.width || 2000;
        scrollPosition.value = compositionToLoad.staffSettings.scrollPosition || 0;
      } else {
        staffWidth.value = compositionToLoad.staffWidth || 2000;
        scrollPosition.value = 0;
      }

      selectedDuration.value = compositionToLoad.selectedDuration || 'quarter';
      selectedNoteType.value = compositionToLoad.selectedNoteType || 'note';
      selectedAccidental.value = compositionToLoad.selectedAccidental !== undefined ? compositionToLoad.selectedAccidental : null;
      selectedOctave.value = compositionToLoad.selectedOctave || 4;
      isDottedNote.value = compositionToLoad.isDottedNote || false;
      isTripletNote.value = compositionToLoad.isTripletNote || false;

      // Load Staves
      if (compositionToLoad.staves && compositionToLoad.staves.length > 0) {
        // Ensure staves have id, clef, order, name
        staves.value = JSON.parse(JSON.stringify(compositionToLoad.staves)).map((s, index) => ({
          id: s.id || generateId(),
          clef: s.clef || 'treble',
          order: s.order !== undefined ? s.order : index,
          name: s.name || `Staff ${index + 1}`,
          isCollapsed: typeof s.isCollapsed === 'boolean' ? s.isCollapsed : false, // Load isCollapsed, default false
          // Keep voiceLayerIds temporarily if present in old data, for mapping
          voiceLayerIds: s.voiceLayerIds
        }));
      } else {
        const defaultStaffId = generateId();
        staves.value = [{ id: defaultStaffId, clef: 'treble', order: 0, name: 'Staff 1', isCollapsed: false }];
      }
      activeStaffId.value = staves.value.length > 0 ? staves.value[0].id : null;

      // Load Voice Layers
      const loadedVoiceLayers = [];
      if (compositionToLoad.voiceLayers && compositionToLoad.voiceLayers.length > 0) {
        const tempVoiceLayers = JSON.parse(JSON.stringify(compositionToLoad.voiceLayers));

        tempVoiceLayers.forEach(vl => {
          let staffIdForVoice = null;
          // Attempt to find staffId using the old voiceLayerIds structure on staves
          if (!vl.staffId) {
            for (const staff of staves.value) {
              if (staff.voiceLayerIds && staff.voiceLayerIds.includes(vl.id)) {
                staffIdForVoice = staff.id;
                break;
              }
            }
          } else {
            staffIdForVoice = vl.staffId;
          }

          // If still no staffId, assign to the first staff or create one if needed
          if (!staffIdForVoice || !staves.value.some(s => s.id === staffIdForVoice)) {
            staffIdForVoice = activeStaffId.value || (staves.value.length > 0 ? staves.value[0].id : null);
            if (!staffIdForVoice) { // Should be very rare: no staves exist at all
              const newEmergencyStaffId = generateId();
              staves.value.push({ id: newEmergencyStaffId, clef: 'treble', order: staves.value.length, name: `Default Staff for ${vl.name}` });
              staffIdForVoice = newEmergencyStaffId;
              if (!activeStaffId.value) activeStaffId.value = newEmergencyStaffId;
            }
          }

          loadedVoiceLayers.push({
            ...vl,
            staffId: staffIdForVoice, // Assert non-null after logic above
            notes: (vl.notes || []).map(note => {
              const { voiceId, voiceColor, ...restOfNote } = note; // Strip voiceId and voiceColor
              return restOfNote;
            }),
            active: vl.active || false, // Ensure active is boolean
            volume: vl.volume !== undefined ? vl.volume : 100, // Load volume, default to 100% for imported old flat notes
          });
        });
      } else if (compositionToLoad.notes && compositionToLoad.notes.length > 0) {
        // Backwards compatibility: Convert flat notes array
        const firstStaffId = activeStaffId.value || (staves.value.length > 0 ? staves.value[0].id : generateId());
        if (!staves.value.find(s => s.id === firstStaffId)) {
          staves.value.push({ id: firstStaffId, clef: 'treble', order: 0, name: 'Default Staff (Import)' });
          if (!activeStaffId.value) activeStaffId.value = firstStaffId;
        }

        // Group notes by their original voiceId from the flat array
        const notesByOldVoiceId = {};
        compositionToLoad.notes.forEach(note => {
          const { voiceId, voiceColor, ...restOfNote } = note; // note is already any here due to source
          if (!notesByOldVoiceId[voiceId]) {
            notesByOldVoiceId[voiceId] = [];
          }
          notesByOldVoiceId[voiceId].push({ ...restOfNote, originalVoiceId: voiceId, originalVoiceColor: voiceColor });
        });

        Object.entries(notesByOldVoiceId).forEach(([oldVoiceId, notesInVoice], index) => {
          const originalColor = notesInVoice[0]?.originalVoiceColor || getRandomColor();
          loadedVoiceLayers.push({
            id: oldVoiceId || generateId(),
            name: `Voice ${index + 1} (Imported ${oldVoiceId.substring(0, 10)})`,
            color: originalColor,
            visible: true,
            active: index === 0, // Make first imported voice active
            selected: true,
            volume: 100, // Default to 100% for imported old flat notes
            notes: notesInVoice.map(n => { const { originalVoiceId, originalVoiceColor, ...rest } = n; return rest; }),
            staffId: firstStaffId
          });
        });
      }
      voiceLayers.value = loadedVoiceLayers;

      // Migrate Lyrics from old structure if present
      if (compositionToLoad.lyrics) {
        for (const voiceIdWithLyrics in compositionToLoad.lyrics) {
          const voiceLayer = voiceLayers.value.find(vl => vl.id === voiceIdWithLyrics);
          if (voiceLayer) {
            const lyricEntries = compositionToLoad.lyrics[voiceIdWithLyrics];
            if (Array.isArray(lyricEntries)) {
              lyricEntries.forEach(lyricEntry => {
                const noteToUpdate = voiceLayer.notes.find(n => n.id === lyricEntry.noteId);
                if (noteToUpdate && lyricEntry.text) {
                  noteToUpdate.lyric = lyricEntry.text;
                }
              });
            }
          }
        }
      }

      // Clean up temporary voiceLayerIds from staves object
      staves.value.forEach(s => delete s.voiceLayerIds);


      // Set active voice and staff
      if (compositionToLoad.activeVoiceId && voiceLayers.value.some(v => v.id === compositionToLoad.activeVoiceId)) {
        activeVoiceId.value = compositionToLoad.activeVoiceId;
      } else if (voiceLayers.value.length > 0) {
        activeVoiceId.value = voiceLayers.value[0].id;
      } else {
        activeVoiceId.value = '';
      }

      if (activeVoiceId.value) {
        const currentActiveVoice = voiceLayers.value.find(v => v.id === activeVoiceId.value);
        if (currentActiveVoice) {
          voiceLayers.value.forEach(v => v.active = (v.id === activeVoiceId.value));
          activeStaffId.value = currentActiveVoice.staffId;
        }
      } else if (staves.value.length > 0) {
        activeStaffId.value = staves.value[0].id;
      }


      chordSymbols.value = compositionToLoad.chordSymbols ? JSON.parse(JSON.stringify(compositionToLoad.chordSymbols)) : [];
      tiesSlurs.value = compositionToLoad.tiesSlurs ? JSON.parse(JSON.stringify(compositionToLoad.tiesSlurs)) : [];
      keySignatureChanges.value = compositionToLoad.keySignatureChanges ? JSON.parse(JSON.stringify(compositionToLoad.keySignatureChanges)) : [];
      sections.value = compositionToLoad.sections ? JSON.parse(JSON.stringify(compositionToLoad.sections)) : [];
      sequenceItems.value = compositionToLoad.sequenceItems ? JSON.parse(JSON.stringify(compositionToLoad.sequenceItems)) : [];

      if (voiceLayers.value.length === 0 && staves.value.length > 0) {
        const defaultVoiceId = generateId();
        voiceLayers.value.push({
          id: defaultVoiceId, name: 'Default Voice', color: getRandomColor(),
          visible: true, active: true, selected: true, volume: 100, notes: [], staffId: staves.value[0].id
        });
        activeVoiceId.value = defaultVoiceId;
        activeStaffId.value = staves.value[0].id;
      } else if (staves.value.length === 0) {
        initializeDefaultStaffAndVoice();
      }

      nextTick(() => {
        updateStaffScroll();
      });

      saveToLocalStorage();

    } catch (error) {
      alert(`Error loading composition: ${error instanceof Error ? error.message : String(error)}`);
    }
  } else {
    alert('Composition not found.');
  }
};

// Update the updateStaffDisplay function to accept an optional width parameter
const updateStaffDisplay = (width) => {
  document.querySelectorAll('.staff').forEach(staffElement => {
    if (staffElement) {
      const displayWidth = width || staffWidth.value;
      staffElement.style.width = `${displayWidth}px`;
    }
  });
};

// Improve the saveToLocalStorage function to handle potential errors
const saveToLocalStorage = () => {
  try {
    const dataToSave = JSON.stringify(savedCompositions.value);
    localStorage.setItem('stCeciliaCompositions', dataToSave);
  } catch (e) {
    alert('Error saving compositions. Local storage may be full or disabled.');
  }
};

// Improve the loadSavedCompositions function for better error handling
const loadSavedCompositions = () => {
  const savedItems = localStorage.getItem('stCeciliaCompositions');
  if (savedItems) {
    try {
      const parsed = JSON.parse(savedItems);
      savedCompositions.value = parsed;
    } catch (e) {
      savedCompositions.value = [];
    }
  }
};

// Delete a composition
const deleteComposition = (id) => {
  if (!confirm('Are you sure you want to delete this composition?')) {
    return;
  }

  savedCompositions.value = savedCompositions.value.filter(comp => comp.id !== id);
  saveToLocalStorage();
};

// Format date for display
const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleDateString();
};

// Add a new ref for the composition name
const compositionName = ref('');

// Update the onMounted hook to handle errors gracefully
onMounted(async () => {
  // Load saved compositions from localStorage
  loadSavedCompositions(); // This will call initializeDefaultStaffAndVoice if needed

  // If staves are still empty after load (e.g., first visit), initialize them.
  if (staves.value.length === 0) {
    initializeDefaultStaffAndVoice();
  }


  try {
    // Initialize Tone.js
    await initializeToneJs();

    // Set up the initial display
    updateStaffDisplay();

  } catch (error) {
    console.error('Error during component initialization:', error);
  }
});

// Add a proper function to start Tone.js that will be called on user interaction
const startToneJs = async () => {
  try {
    // This should only be called after a user gesture
    await Tone.start();
    return true;
  } catch (error) {
    console.error('Error starting Tone.js AudioContext:', error);
    return false;
  }
};

// Replace this watch function (around line 2742)
// watch(notes, (newNotes) => {
//   console.log('Notes array changed:', newNotes);
// }, { deep: true });

// With this one that watches allVisibleNotes instead
watch(allVisibleNotes, (newNotes) => {
}, { deep: true });

// Or alternatively, watch the voiceLayers directly
watch(voiceLayers, () => {
}, { deep: true });

// Add variables for tracking the current composition and renaming state
const currentCompositionId = ref('');
const editingComposition = ref('');
const editCompositionName = ref('');

// Update existing updateComposition function
const updateComposition = (id) => {
  if (!confirm('Are you sure you want to update this saved composition with your current changes?')) {
    return;
  }

  const compositionIndex = savedCompositions.value.findIndex(comp => comp.id === id);
  if (compositionIndex === -1) {
    console.error('Composition not found for update:', id);
    return;
  }

  // Create the updated composition object using the same helper function
  const updatedData = prepareCompositionData();
  // Preserve the original ID and creation date
  updatedData.id = savedCompositions.value[compositionIndex].id;
  updatedData.dateCreated = savedCompositions.value[compositionIndex].dateCreated;

  // Replace the old composition data with the new data
  savedCompositions.value.splice(compositionIndex, 1, updatedData);

  // Save to localStorage
  saveToLocalStorage();

  alert('Composition updated successfully!');
};

// Functions for renaming compositions
const startRename = (id, currentName) => {
  editingComposition.value = id;
  editCompositionName.value = currentName;
};

const saveRename = (id) => {
  if (!editCompositionName.value.trim()) {
    alert('Please enter a valid name');
    return;
  }

  const composition = savedCompositions.value.find(comp => comp.id === id);
  if (!composition) {
    console.error('Composition not found:', id);
    return;
  }

  composition.name = editCompositionName.value.trim();
  saveToLocalStorage();
  cancelRename();

  alert('Composition renamed successfully!');
};

const cancelRename = () => {
  editingComposition.value = '';
  editCompositionName.value = '';
};

// Add functions for importing and exporting compositions
const exportAllCompositions = async () => {
  try {
    // Create a JSON string of all compositions
    const dataToExport = JSON.stringify(savedCompositions.value, null, 2);
    const fileName = `music-notation-all-compositions-${new Date().toISOString().slice(0, 10)}.txt`;

    // Check if running in a capacitor environment (mobile app)
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
      try {
        // Use Capacitor Filesystem API for native platforms
        await Filesystem.writeFile({
          path: fileName,
          data: dataToExport,
          directory: Directory.Documents,
          encoding: Encoding.UTF8  // Use the Encoding enum from Capacitor
        });

        alert(`All compositions saved to Documents/${fileName}`);
      } catch (error) {
        console.error('Error writing file with Capacitor:', error);
        alert(`Error saving file: ${error.message}`);
      }
    } else {
      // Use web approach for browsers
      const blob = new Blob([dataToExport], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);

      console.log('All compositions exported successfully via browser download');
    }
  } catch (error) {
    console.error('Error exporting compositions:', error);
    alert('Error exporting compositions: ' + error.message);
  }
};

const exportCurrentComposition = async () => {
  if (!currentCompositionId.value && voiceLayers.value.flatMap(vl => vl.notes).length === 0) {
    alert('No composition is currently loaded or no notes to export.');
    return;
  }

  try {
    const baseLoadedComposition = savedCompositions.value.find(comp => comp.id === currentCompositionId.value);

    let compositionToExport: CompositionData = {
      id: baseLoadedComposition?.id || generateId(),
      name: compositionName.value || baseLoadedComposition?.name || 'Untitled Export',
      dateCreated: baseLoadedComposition?.dateCreated || Date.now(),
      staves: JSON.parse(JSON.stringify(staves.value)), // Include staves
      voiceLayers: JSON.parse(JSON.stringify(voiceLayers.value)),
      // notes: // This is derived from voiceLayers, so not explicitly set here.
      //         // The prepareCompositionData or a similar function would flatten it if needed for older formats.
      tempo: tempo.value,
      keySignature: keySignature.value,
      timeSignature: timeSignature.value,
      chordSymbols: JSON.parse(JSON.stringify(chordSymbols.value)),
      activeVoiceId: activeVoiceId.value,
      staffWidth: staffWidth.value,
      selectedDuration: selectedDuration.value,
      selectedNoteType: selectedNoteType.value,
      selectedAccidental: selectedAccidental.value,
      selectedOctave: selectedOctave.value,
      isDottedNote: isDottedNote.value,
      sections: sections.value ? JSON.parse(JSON.stringify(sections.value)) : [],
      sequenceItems: sequenceItems.value ? JSON.parse(JSON.stringify(sequenceItems.value)) : [],
      tiesSlurs: JSON.parse(JSON.stringify(tiesSlurs.value)),
      keySignatureChanges: JSON.parse(JSON.stringify(keySignatureChanges.value)),
      timeSignatureChanges: JSON.parse(JSON.stringify(timeSignatureChanges.value)),
      clefChanges: JSON.parse(JSON.stringify(clefChanges.value)),
    };

    if (exportOnlySelectedVoices.value) {
      if (compositionToExport.voiceLayers && Array.isArray(compositionToExport.voiceLayers)) {
        const allVoiceStates = compositionToExport.voiceLayers.map(v => ({ id: v.id, name: v.name, selected: v.selected }));
        const selectedVoiceLayers = compositionToExport.voiceLayers.filter(v => v.selected === true);

        if (selectedVoiceLayers.length === 0 && compositionToExport.voiceLayers.length > 0) {
          alert("No voices are selected for export. Please select at least one voice or uncheck 'Export selected voices only'.");
          return;
        }

        compositionToExport.voiceLayers = selectedVoiceLayers; // Update the voiceLayers on the object to be exported

        // Re-flatten notes from the NOW-FILTERED selectedVoiceLayers for the 'notes' property
        compositionToExport.notes = selectedVoiceLayers.flatMap(voice =>
          voice.notes.map(note => ({
            ...note,
            // Ensure voiceId and voiceColor are consistent if they are part of the Note type
            // and if the original flat notes array might not have them or have outdated ones.
            voiceId: voice.id,
            voiceColor: voice.color
          }))
        );
      }
    }
    const dataToExport = JSON.stringify(compositionToExport, null, 2);
    const fileName = `music-notation-${compositionToExport.name.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.txt`;

    // Check if running in a capacitor environment (mobile app)
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
      try {
        // Use Capacitor Filesystem API for native platforms
        await Filesystem.writeFile({
          path: fileName,
          data: dataToExport,
          directory: Directory.Documents,
          encoding: Encoding.UTF8  // Use the Encoding enum from Capacitor
        });

        alert(`Composition saved to Documents/${fileName}`);
      } catch (error) {
        console.error('Error writing file with Capacitor:', error);
        alert(`Error saving file: ${error.message}`);
      }
    } else {
      // Use web approach for browsers
      const blob = new Blob([dataToExport], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);

      console.log('Composition exported successfully via browser download');
    }
  } catch (error) {
    console.error('Error exporting composition:', error);
    alert('Error exporting composition: ' + error.message);
  }
};

// Add this validation function before processWebFiles
// (around line 2322)
const validateComposition = (comp: any): boolean => {
  // Basic validation - check if the composition has required properties
  return (
    comp &&
    typeof comp === 'object' &&
    // Check for staves or voiceLayers (which imply notes)
    (Array.isArray(comp.staves) || Array.isArray(comp.voiceLayers) || Array.isArray(comp.notes)) &&
    typeof comp.name === 'string'
  );
};

// Fix the readFileAsText function to handle types properly
// (around line 2318)
const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target && typeof e.target.result === 'string') {
        resolve(e.target.result);
      } else {
        reject(new Error(`Error reading file ${file.name}: Invalid result`));
      }
    };
    reader.onerror = () => {
      reject(new Error(`Error reading file ${file.name}`));
    };
    reader.readAsText(file);
  });
};

// Update the processWebFiles function to handle type safety
// (around line 2316)
const processWebFiles = async (files: File[]) => {
  const allFileResults = [];

  for (const file of Array.from(files)) {
    try {
      const result = await readFileAsText(file);
      const parsedJson = JSON.parse(result) as unknown;
      const compositionsFromFile = Array.isArray(parsedJson) ? parsedJson : [parsedJson];

      // Basic validation for each composition structure
      const validCompositions = compositionsFromFile.filter(comp => validateComposition(comp));
      allFileResults.push({
        fileName: file.name,
        parsedCompositions: validCompositions
      });
    } catch (error) {
      console.error(`Error parsing file ${file.name}:`, error);
      alert(`Error parsing file ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      allFileResults.push({ fileName: file.name, parsedCompositions: [] });
    }
  }

  return allFileResults;
};

// Update the importCompositions function to process the files and add them to savedCompositions
const importCompositions = async (event) => {
  // For web browser file input
  if (event && event.target && event.target.files) {
    const inputElement = event.target as HTMLInputElement;
    const files = inputElement.files;

    if (!files || files.length === 0) {
      return;
    }

    try {
      const allFileResults = await processWebFiles(Array.from(files));
      let importCount = 0;

      allFileResults.forEach(fileResult => {
        if (fileResult.parsedCompositions && fileResult.parsedCompositions.length > 0) {
          fileResult.parsedCompositions.forEach(compFromFile => {
            // Ensure the imported composition has a unique ID
            const importedComposition: CompositionData = {
              ...compFromFile,
              id: generateId(), // Always generate a new ID for imported compositions
              dateCreated: compFromFile.dateCreated || Date.now(),
              // Ensure staves and voiceLayers are properly structured
              staves: compFromFile.staves || [{ id: generateId(), clef: 'treble', order: 0, name: 'Staff 1' }],
              voiceLayers: compFromFile.voiceLayers || [],
            };

            // If voiceLayers exist, ensure they have staffId. If not, assign to first staff.
            if (importedComposition.voiceLayers && importedComposition.staves && importedComposition.staves.length > 0) {
              const firstStaffId = importedComposition.staves[0].id;
              importedComposition.voiceLayers.forEach(vl => {
                if (!vl.staffId || !importedComposition.staves!.some(s => s.id === vl.staffId)) {
                  vl.staffId = firstStaffId;
                }
              });
            }
            // If only comp.notes exists (old format), create a default voice on the first staff
            else if (compFromFile.notes && importedComposition.staves && importedComposition.staves.length > 0) {
              const firstStaffId = importedComposition.staves[0].id;
              importedComposition.voiceLayers = [{
                id: generateId(),
                name: "Imported Voice",
                color: getRandomColor(),
                visible: true,
                active: true,
                selected: true,
                volume: 100, // Default to 100%
                staffId: firstStaffId,
                notes: compFromFile.notes
              }];
            }


            savedCompositions.value.push(importedComposition);
            importCount++;
          });
        }
      });

      // Save to localStorage
      saveToLocalStorage();

      // Provide feedback
      if (importCount > 0) {
        alert(`Successfully imported ${importCount} composition${importCount !== 1 ? 's' : ''}.`);
      } else {
        alert('No valid compositions found in the imported files.');
      }
    } catch (error) {
      console.error('Error importing compositions:', error);
      alert(`Error importing compositions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  // Optional: Add a way to trigger native file picking for Android
  else if (window.Capacitor && window.Capacitor.isNativePlatform()) {
    try {
      // You'll need a file picker plugin for this, like @capacitor/filesystem
      // This is a placeholder for the implementation
      alert("Mobile file import is still being implemented. Please use the web version for now.");

      // Example implementation with proper plugin:
      /*
      const result = await FilePicker.pickFiles({
        types: ['text/plain'],
        multiple: false
      });
      
      if (result.files.length > 0) {
        const file = result.files[0];
        const contents = await Filesystem.readFile({
          path: file.path,
          encoding: 'utf8'
        });
        
        try {
          const parsedJson = JSON.parse(contents.data);
          // Process the imported file...
        } catch (error) {
          alert(`Error parsing file: ${error.message}`);
        }
      }
      */
    } catch (error) {
      console.error('Error picking file:', error);
      alert(`Error selecting file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

// Create a completely new function to force-reset the notes array
const forceResetNotesArray = () => {
  console.log('Forcing complete reset of notes array...');

  // Manually empty the array while preserving reactivity
  while (notes.value.length > 0) {
    notes.value.pop();
  }

  // Double-check
  if (notes.value.length > 0) {
    console.warn('Failed to clear notes array with pop method, trying splice...');
    notes.value.splice(0, notes.value.length);
  }

  console.log('Notes array reset, current length:', notes.value.length);

  // Force a redraw
  nextTick(() => {
    const noteElements = document.querySelectorAll('.note');
    console.log(`After reset, DOM has ${noteElements.length} note elements`);

    // Manual DOM cleanup if needed
    if (noteElements.length > 0) {
      console.warn('Forcing manual DOM cleanup of remaining notes');
      noteElements.forEach(el => {
        if (el.parentNode) el.parentNode.removeChild(el);
      });
    }
  });

  return nextTick();
};

// Add a mountable debug element to help diagnose notes issues
const addDebugMonitor = () => {
  const monitor = document.createElement('div');
  monitor.style.position = 'fixed';
  monitor.style.bottom = '10px';
  monitor.style.right = '10px';
  monitor.style.backgroundColor = 'rgba(0,0,0,0.7)';
  monitor.style.color = 'white';
  monitor.style.padding = '10px';
  monitor.style.borderRadius = '5px';
  monitor.style.zIndex = '9999';
  monitor.style.maxHeight = '200px';
  monitor.style.overflowY = 'auto';
  monitor.style.fontSize = '12px';
  monitor.style.fontFamily = 'monospace';
  monitor.id = 'notes-debug-monitor';

  const updateMonitor = () => {
    monitor.innerHTML = `
      <div><strong>Notes: ${notes.value.length}</strong></div>
      <div><strong>DOM Notes: ${document.querySelectorAll('.note').length}</strong></div>
      <div style="margin-top:5px"><strong>Notes List:</strong></div>
      ${notes.value.map((n, i) =>
      `<div>${i}: ${n.type} ${n.pitch || 'rest'} at ${n.position}</div>`
    ).join('')}
    `;
  };

  document.body.appendChild(monitor);

  // Update every second
  const interval = setInterval(updateMonitor, 1000);

  // Return function to remove
  return () => {
    clearInterval(interval);
    if (document.body.contains(monitor)) {
      document.body.removeChild(monitor);
    }
  };
};

// Add this debug monitor when needed (perhaps with a debug button)
const toggleDebugMonitor = () => {
  const existing = document.getElementById('notes-debug-monitor');
  if (existing) {
    document.body.removeChild(existing);
    if (window.debugMonitorInterval) {
      clearInterval(window.debugMonitorInterval);
      window.debugMonitorInterval = null;
    }
  } else {
    window.debugMonitorRemover = addDebugMonitor();
  }
};

// Add button animation function
const animateButton = (event) => {
  event.target.closest('button').classList.add('button-press-animation');
  setTimeout(() => {
    event.target.closest('button').classList.remove('button-press-animation');
  }, 300);
};

// Add these reactive variables
const timeSignature = ref('4/4');
const timeSignatureNumerator = computed(() => parseInt(timeSignature.value.split('/')[0]) || 4);
const timeSignatureDenominator = computed(() => parseInt(timeSignature.value.split('/')[1]) || 4);
const showBeatMarkers = ref(false); // Set to true for debugging

// Function to calculate measure width based on time signature
const getMeasureWidth = (numerator: number, denominator: number): number => {
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
};

// Make sure this computed property is correctly calculating measure width
const measureWidthByTimeSignature = computed(() => {
  const parts = timeSignature.value.split('/');
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
  console.log(`Measure width for ${timeSignature.value}: ${width}px (${Math.floor(width/25)} possible positions)`);
  return width;
});

// Function to calculate total width up to a measure
const getWidthUpToMeasure = (measureNumber: number): number => {
  let totalWidth = 0;
  for (let i = 1; i <= measureNumber; i++) {
    const timeSignature = getEffectiveTimeSignatureAtMeasure(i);
    totalWidth += getMeasureWidth(timeSignature.numerator, timeSignature.denominator);
  }
  return totalWidth;
};

// Generate barlines with proper musical positioning and measure numbers
const barlines = computed(() => {
  const lines = [];
  
  // Calculate key signature width
  const keySignatureWidth = currentKeySignatureAccidentals.value.length * 10;

  // Get initial position after clef, key signature, and time signature
  const initialPosition = 70 + keySignatureWidth + 20; // 70px for clef, then key sig, then 20px for time sig

  // First barline is at the start of first measure (after clef, key sig, and time sig)
  lines.push({
    type: 'single',
    position: initialPosition,
    measureNumber: 1, // This is actually the start of measure 1
    isIntervalMeasure: false
  });

  // Calculate total width and measures
  let currentPosition = initialPosition;
  let measureNumber = 1;
  
  while (currentPosition < staffWidth.value) {
    // Get the width of the current measure
    const timeSignature = getEffectiveTimeSignatureAtMeasure(measureNumber);
    const measureWidth = getMeasureWidth(timeSignature.numerator, timeSignature.denominator);
    
    // Add the measure width to get the next barline position
    currentPosition += measureWidth;
    measureNumber++;

    // By default, use single barlines for all regular measures
    let type = 'single';

    // For the last measure, use a final barline
    if (currentPosition >= staffWidth.value) {
      type = 'final';
    }

    lines.push({
      type,
      position: currentPosition,
      measureNumber, // This is the next measure number
      isIntervalMeasure: measureNumber % 5 === 0
    });
  }

  return lines;
});

// Calculate beat positions (for visual aid)
const beatPositions = computed(() => {
  const positions = [];
  
  // Calculate key signature width
  const keySignatureWidth = currentKeySignatureAccidentals.value.length * 10;
  const initialPosition = 70 + keySignatureWidth + 20; // clef + key sig + time sig
  
  let currentPosition = initialPosition;
  let measureNumber = 1;
  
  while (currentPosition < staffWidth.value) {
    // Get the time signature for this measure
    const timeSignature = getEffectiveTimeSignatureAtMeasure(measureNumber);
    const { numerator, denominator } = timeSignature;
    
    // Calculate beat width based on denominator
    let beatWidth = 50; // Default for quarter note
    if (denominator === 2) beatWidth = 100; // Half note
    if (denominator === 8) beatWidth = 25; // Eighth note
    
    // Calculate total beats (used for compound meters)
    let totalBeats = numerator;
    
    // For compound meters, show subdivisions
    if ([6, 9, 12].includes(numerator) && denominator === 8) {
      totalBeats = numerator; // Show all eighth notes
    }
    
    // Get the width of this measure
    const measureWidth = getMeasureWidth(numerator, denominator);
    
    // Add beat positions for this measure
    for (let beat = 1; beat < totalBeats; beat++) {
      positions.push({
        position: currentPosition + (beat * (measureWidth / totalBeats)),
        measure: measureNumber,
        beat
      });
    }
    
    // Move to next measure
    currentPosition += measureWidth;
    measureNumber++;
  }
  
  return positions;
});

// Function to update time signature
const updateTimeSignature = () => {
  // Recalculate measure widths and barline positions
  console.log(`Time signature changed to ${timeSignature.value}`);

  // Force redraw of staff
  updateStaffDisplay();

  // Notify user about the change
  const [numerator, denominator] = timeSignature.value.split('/');

  // Optional: Adjust notes to fit the new time signature
  const beatValue = denominator === '8' ? 0.5 : 1; // Eighth note vs quarter note

  // Update beat markers if needed
  updateBeatMarkers();

  // Ensure section boundaries don't exceed the new measure count
  const totalMeasures = Math.ceil(staffWidth.value / measureWidthByTimeSignature.value);
  sections.value.forEach(section => {
    if (section.endMeasure > totalMeasures) {
      section.endMeasure = totalMeasures;
    }
    if (section.startMeasure > section.endMeasure) {
      section.startMeasure = section.endMeasure;
    }
  });
};

// Function to update beat markers
const updateBeatMarkers = () => {
  // Update visual beat markers if they're enabled
  if (showBeatMarkers.value) {
    console.log('Updating beat markers');
  }
};

// Update exportComposition
const exportComposition = () => { // This function seems to be a duplicate of exportCurrentComposition. Consolidate if possible.
  // For now, let's assume this is a simplified export.
  // It should use prepareCompositionData() for consistency.
  const compositionData = prepareCompositionData();

  // Convert to JSON
  const jsonString = JSON.stringify(compositionData, null, 2);

  // Create a download link
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${compositionName.value || 'music-notation'}.json`;
  document.body.appendChild(a);
  a.click();

  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
};

// generateId is now imported from @/utils/idGenerator

// Add a new ref for the selected note
const selectedNoteId = ref<string | null>(null);

// Update the selectNote function to work with voice layers
const selectNote = (note) => {
  // Handle tie/slur creation mode
  if (isCreatingTieSlur.value) {
    const noteWithVoiceInfo = note as NoteWithVoiceInfo;
    
    if (!tieSlurStartNote.value) {
      // First note selected - set as start note
      tieSlurStartNote.value = noteWithVoiceInfo;
      console.log(`Selected start note: ${noteWithVoiceInfo.pitch}`);
    } else {
      // Second note selected - create tie/slur
      createTieSlur(tieSlurStartNote.value, noteWithVoiceInfo);
    }
    return; // Don't do normal note selection in tie/slur mode
  }

  // Normal note selection
  selectedNoteId.value = note.id;

  // If the note has a voiceId and it's not the active voice, switch to that voice
  if ((note as NoteWithVoiceInfo).voiceId && (note as NoteWithVoiceInfo).voiceId !== activeVoiceId.value) {
    switchActiveVoice((note as NoteWithVoiceInfo).voiceId);
  }

  // If there's a lyric, populate the lyric input
  if (note.lyric) {
    currentLyric.value = note.lyric;
  }
};

// Add a function to get the lyric style
const getLyricStyle = (note: NoteWithVoiceInfo) => { // Use NoteWithVoiceInfo
  return {
    color: note.id === currentPlayingNoteIds.value[0] ? 'red' : (note.voiceColor || 'black'),
    fontWeight: note.id === currentPlayingNoteIds.value[0] ? 'bold' : 'normal'
  };
};

// Add these refs for playback control
const playbackStartMeasure = ref(1);
const playbackEndMeasure = ref(0); // 0 means play to the end
const autoScrollToPlayingNote = ref(true);

// Add this helper function to calculate which measure a note is in
const getNotesMeasure = (note: ImportedNote | NoteWithVoiceInfo) => { // Update to use aliased import or union
  // Calculate the horizontal position in pixels using new 25px grid
  const notePosition = note.position * 25;

  // Calculate the initial position (where measure 1 starts)
  // Use global key signature to be consistent with getEffectiveKeySignatureAtPosition
  const globalKeySignatureWidth = (keySignatures[keySignature.value] || []).length * 10;
  const initialPosition = 70 + globalKeySignatureWidth + 20; // clef + global key sig + time sig

  // If the note is before the first measure, return 0
  if (notePosition < initialPosition) {
    return 0;
  }

  // Calculate the relative position from the start of the first measure
  const relativePosition = notePosition - initialPosition;

  // Calculate which measure this note is in
  // Use measureWidthByTimeSignature for correct measure width based on time signature
  return Math.floor(relativePosition / measureWidthByTimeSignature.value) + 1;
};

// Function to convert note duration to beats (quarter note = 1 beat)
const getNoteDurationInBeats = (duration: string, isDotted = false, isTriplet = false, measureNumber?: number) => {
  const baseDurations = {
    'whole': 4,
    'half': 2,
    'quarter': 1,
    'eighth': 0.5,
    'sixteenth': 0.25
  };
  
  let beats = baseDurations[duration] || 1;
  
  if (isTriplet) {
    beats *= (2/3); // Triplets are 2/3 the duration of normal notes
  }
  
  if (isDotted) {
    beats *= 1.5; // Dotted notes are 1.5 times their normal duration
  }
  
  // If measure number is provided, adjust beats based on time signature
  if (measureNumber !== undefined) {
    const timeSignature = getEffectiveTimeSignatureAtMeasure(measureNumber);
    
    // Convert beats based on time signature denominator
    if (timeSignature.denominator === 8) {
      beats *= 0.5; // Convert to eighth note beats
    }
    // We don't adjust for denominator === 2 (cut time) since we're already doubling the tempo
  }
  
  return beats;
};

// Function to get the tempo for a specific measure
const getTempoForMeasure = (measureNumber: number): number => {
  const timeSignature = getEffectiveTimeSignatureAtMeasure(measureNumber);
  
  // Adjust tempo based on time signature denominator
  let adjustedTempo = tempo.value;
  
  // For compound meters (6/8, 9/8, 12/8), adjust tempo to maintain musical feel
  if ([6, 9, 12].includes(timeSignature.numerator) && timeSignature.denominator === 8) {
    adjustedTempo = tempo.value * (2/3); // Slower for compound meters
  }
  // For 2/2 (cut time), double the tempo
  else if (timeSignature.numerator === 2 && timeSignature.denominator === 2) {
    adjustedTempo = tempo.value * 2;
  }
  
  return adjustedTempo;
};

// Function to check if a note is tied and get its total duration including tied notes
const getTotalTiedDuration = (note: NoteWithVoiceInfo, processedNotes = new Set<string>()): number => {
  // Prevent infinite recursion by tracking processed notes
  if (processedNotes.has(note.id)) return 0;
  processedNotes.add(note.id);

  const measureNumber = getNotesMeasure(note);
  let totalDuration = getNoteDurationInBeats(note.duration, note.dotted, note.triplet, measureNumber);
  
  // Find all ties connected to this note (both starting and ending)
  const tiesFromThis = tiesSlurs.value.filter(ts => 
    ts.type === 'tie' && 
    ts.startNoteId === note.id
  );
  
  const tiesToThis = tiesSlurs.value.filter(ts => 
    ts.type === 'tie' && 
    ts.endNoteId === note.id
  );

  // Process ties starting from this note
  tiesFromThis.forEach(tie => {
    const nextNote = allVisibleNotes.value.find(n => n.id === tie.endNoteId);
    if (nextNote && nextNote.pitch === note.pitch) {
      // Add duration of the next note in the tie chain
      const nextNoteMeasure = getNotesMeasure(nextNote);
      totalDuration += getNoteDurationInBeats(nextNote.duration, nextNote.dotted, nextNote.triplet, nextNoteMeasure);
      // Recursively add durations of any subsequent tied notes
      totalDuration += getTotalTiedDuration(nextNote, processedNotes);
    }
  });

  // Process ties ending at this note
  tiesToThis.forEach(tie => {
    const prevNote = allVisibleNotes.value.find(n => n.id === tie.startNoteId);
    if (prevNote && prevNote.pitch === note.pitch && !processedNotes.has(prevNote.id)) {
      // Add duration of the previous note in the tie chain
      const prevNoteMeasure = getNotesMeasure(prevNote);
      totalDuration += getNoteDurationInBeats(prevNote.duration, prevNote.dotted, prevNote.triplet, prevNoteMeasure);
      // Recursively add durations of any previous tied notes
      totalDuration += getTotalTiedDuration(prevNote, processedNotes);
    }
  });
  
  return totalDuration;
};

// Function to check if a note should be silent (it's the end of a tie)
const isNoteTiedFrom = (note: NoteWithVoiceInfo): boolean => {
  // Find any tie that ends at this note
  const tie = tiesSlurs.value.find(ts => 
    ts.type === 'tie' && 
    ts.endNoteId === note.id
  );
  
  if (!tie) return false;
  
  // Find the start note of the tie
  const startNote = allVisibleNotes.value.find(n => n.id === tie.startNoteId);
  if (!startNote || startNote.pitch !== note.pitch) return false;
  
  // Check if the notes are consecutive in their voice
  const startPos = Math.min(note.position, startNote.position);
  const endPos = Math.max(note.position, startNote.position);
  
  // Look for any notes between these positions in the same voice
  const hasNotesBetween = allVisibleNotes.value.some(n => 
    n.voiceId === note.voiceId && // Only check notes in the same voice
    n.position > startPos && 
    n.position < endPos && 
    n.type === 'note'
  );
  
  // Only silence the note if it's part of a tie with the same pitch
  return !hasNotesBetween;
};

// Function to get the time signature duration in quarter note beats
const getTimeSignatureDurationInBeats = () => {
  const numerator = timeSignatureNumerator.value;
  const denominator = timeSignatureDenominator.value;
  
  // Convert to quarter note beats
  // If denominator is 4, each beat is a quarter note (1 beat)
  // If denominator is 8, each beat is an eighth note (0.5 beats)
  // If denominator is 2, each beat is a half note (2 beats)
  const beatValue = 4 / denominator;
  return numerator * beatValue;
};

// Function to calculate total written duration of notes in a measure
const getTotalNoteDurationInMeasure = (measureNumber: number, voiceNotes: ImportedNote[]) => {
  const notesInMeasure = voiceNotes.filter(note => getNotesMeasure(note) === measureNumber);
  
  // Get the time signature for this measure
  const timeSignature = getEffectiveTimeSignatureAtMeasure(measureNumber);
  
  // Calculate total duration in beats
  let totalBeats = notesInMeasure.reduce((total, note) => {
    if (note.type === 'rest' || note.type === 'note') {
      // Get base duration in quarter note beats
      let beats = getNoteDurationInBeats(note.duration, note.dotted, note.triplet);
      
      // Convert beats based on time signature denominator
      if (timeSignature.denominator === 8) {
        beats *= 0.5; // Convert to eighth note beats
      }
      
      return total + beats;
    }
    return total;
  }, 0);
  
  // Convert total beats to quarter note beats for consistent comparison
  if (timeSignature.denominator === 8) {
    totalBeats *= 2; // Convert from eighth note beats to quarter note beats
  }
  
  return totalBeats;
};

// Function to get time signature duration in beats for a specific measure
const getTimeSignatureDurationInBeatsForMeasure = (measureNumber: number): number => {
  const timeSignature = getEffectiveTimeSignatureAtMeasure(measureNumber);
  const numerator = timeSignature.numerator;
  const denominator = timeSignature.denominator;
  
  // Convert to quarter note beats
  // If denominator is 4, each beat is a quarter note (1 beat)
  // If denominator is 8, each beat is an eighth note (0.5 beats)
  // If denominator is 2, each beat is a half note (2 beats)
  const beatValue = 4 / denominator;
  return numerator * beatValue;
};

// Function to calculate timing compression factor for a measure
const getMeasureTimingFactor = (measureNumber: number, voiceNotes: ImportedNote[]) => {
  const timeSignatureBeats = getTimeSignatureDurationInBeatsForMeasure(measureNumber);
  const actualNoteDuration = getTotalNoteDurationInMeasure(measureNumber, voiceNotes);
  
  if (actualNoteDuration === 0) return 1; // No notes in measure
  
  // Compression factor: how much to compress/stretch the timing
  // If actualNoteDuration > timeSignatureBeats, notes are compressed (play faster)
  // If actualNoteDuration < timeSignatureBeats, notes are stretched (play slower)
  return timeSignatureBeats / actualNoteDuration;
};

// Now update the playScore function to use this helper
const playScore = () => {
  if (isPlaying.value) return;

  isPlaying.value = true;
  currentPlayingNoteIds.value = []; // Changed from currentPlayingNoteId

  // Initialize Tone.js if needed
  initializeToneJs();

  // Get all visible notes from all visible voice layers
  const visibleVoices = voiceLayers.value.filter(voice => voice.visible);

  // Determine which voices to play based on playback settings
  const voicesToPlay = playSelectedVoicesOnly.value
    ? voiceLayers.value.filter(voice => voice.visible && voice.selected)
    : visibleVoices;

  // If no voices are selected for playback, use all visible voices
  if (playSelectedVoicesOnly.value && voicesToPlay.length === 0) {
    voicesToPlay.push(...visibleVoices);
  }

  console.log(`Playing ${voicesToPlay.length} voices:`, voicesToPlay.map(v => v.name));

  // Collect all notes from the voices to play
  let allNotesToPlay = [];
  voicesToPlay.forEach(voice => {
    // Add voice ID to each note for identification during playback
    const voiceNotes = voice.notes.map(note => ({
      ...note,
      voiceId: voice.id,
      voiceColor: voice.color
    }));
    allNotesToPlay = allNotesToPlay.concat(voiceNotes);
  });

  // Sort all notes by position
  const sortedNotes = allNotesToPlay.sort((a, b) => a.position - b.position);

  // Calculate measure boundaries
  const measureWidth = measureWidthByTimeSignature.value;
  // Use global key signature for consistency with getEffectiveKeySignatureAtPosition
  const globalKeySignatureWidth = (keySignatures[keySignature.value] || []).length * 10;
  const initialPosition = 70 + globalKeySignatureWidth + 20;

  console.log(`Playback range: measures ${playbackStartMeasure.value} to ${playbackEndMeasure.value || 'end'}`);
  console.log(`Measure width: ${measureWidth}px, Initial position: ${initialPosition}px`);

  // Filter notes based on selected measures
  let filteredNotes = sortedNotes;
  if (playbackStartMeasure.value > 1 || (playbackEndMeasure.value > 0)) {
    filteredNotes = sortedNotes.filter(note => {
      const noteMeasure = getNotesMeasure(note);

      // Check if the note is within the selected measure range
      const isAfterStart = noteMeasure >= playbackStartMeasure.value;
      const isBeforeEnd = playbackEndMeasure.value === 0 || noteMeasure <= playbackEndMeasure.value;

      return isAfterStart && isBeforeEnd;
    });
  }

  console.log(`Playing ${filteredNotes.length} notes out of ${sortedNotes.length} total notes`);

  // Initialize array to track timeout IDs for cleanup
  if (!window.playbackTimeouts) window.playbackTimeouts = [];
  window.playbackTimeouts = [];

  // Clear any existing timeouts
  window.playbackTimeouts.forEach(id => clearTimeout(id));
  window.playbackTimeouts = [];

  // Process each voice independently for truly independent timing
  const voiceSchedules = new Map();
  
  // Group notes by voice first
  const notesByVoice = {};
  filteredNotes.forEach(note => {
    if (!notesByVoice[note.voiceId]) {
      notesByVoice[note.voiceId] = [];
    }
    notesByVoice[note.voiceId].push(note);
  });

  // Create independent timing schedule for each voice
  Object.entries(notesByVoice).forEach(([voiceId, voiceNotes]) => {
    const voice = voicesToPlay.find(v => v.id === voiceId);
    if (!voice) return;

    // Sort notes by position for this voice
    const sortedVoiceNotes = (voiceNotes as any[]).sort((a, b) => a.position - b.position);
    
    // Group notes by position within this voice (for chords within the same voice)
    const notesByPosition = {};
    sortedVoiceNotes.forEach(note => {
    if (!notesByPosition[note.position]) {
      notesByPosition[note.position] = [];
    }
    notesByPosition[note.position].push(note);
  });

    // Calculate timing for this voice independently
    let voiceDelay = 0;
    const voiceSchedule = [];

    Object.keys(notesByPosition).map(Number).sort((a, b) => a - b).forEach(position => {
    const notesAtPosition = notesByPosition[position];

      // Find the longest duration at this position within this voice only
    let longestDuration = 0;
    notesAtPosition.forEach(note => {
        const noteDuration = getNoteDurationInBeats(note.duration, note.dotted, note.triplet);
      longestDuration = Math.max(longestDuration, noteDuration);
    });

      // Get the measure this position is in and calculate timing compression for this voice
      const measureNumber = getNotesMeasure(notesAtPosition[0]);
      let voiceTimingFactor = 1;
      if (measureNumber > 0) {
        voiceTimingFactor = getMeasureTimingFactor(measureNumber, voice.notes);
      }

      // Apply voice-specific compression
      const compressedDuration = longestDuration * voiceTimingFactor;
      
      // Log voice-specific compression when significant
      // if (Math.abs(voiceTimingFactor - 1) > 0.01) {
      //   console.log(`Voice ${voice.name}: Measure ${measureNumber}, compression factor ${voiceTimingFactor.toFixed(3)} (${longestDuration}→${compressedDuration.toFixed(3)} beats)`);
      // }

      // Calculate the wait duration in seconds for this voice
    const secondsPerBeat = 60 / tempo.value;
      const waitDurationSeconds = compressedDuration * secondsPerBeat;

      voiceSchedule.push({
        delay: voiceDelay * 1000, // Convert to milliseconds
        notes: notesAtPosition,
        duration: waitDurationSeconds * 1000
      });

      voiceDelay += waitDurationSeconds;
    });

    voiceSchedules.set(voiceId, voiceSchedule);
  });

  // Schedule playback for all voices
  voiceSchedules.forEach((schedule, voiceId) => {
    const voice = voiceLayers.value.find(v => v.id === voiceId);
    
    schedule.forEach((scheduleItem, index) => {
      const { delay, notes, duration } = scheduleItem;
      
      // Function to play notes for this voice at this time
      const playVoiceNotesWithDelay = (notesToPlay, playDelay) => {
      const callback = () => {
        const idsAtThisPosition = notesToPlay.map(n => n.id);
        currentPlayingNoteIds.value.push(...idsAtThisPosition.filter(id => !currentPlayingNoteIds.value.includes(id)));

          // Auto-scroll to the first note being played (from any voice)
        if (notesToPlay.length > 0 && autoScrollToPlayingNote.value) {
          autoScrollToNote(notesToPlay[0]);
        }

          // Play all notes at this position for this voice
          const tiedNotesInfo = [];
        notesToPlay.forEach(noteToPlay => {
            const playResult = playNoteWithTieHandling(noteToPlay, voice);
            if (playResult.isPlaying && playResult.totalDurationMs > 0) {
              // This is a tied note that will play longer than the schedule duration
              tiedNotesInfo.push({
                noteId: noteToPlay.id,
                totalDurationMs: playResult.totalDurationMs
              });
            }
          });

          // Schedule the end of regular notes (independent for this voice)
        const noteEndCallback = () => {
            // Only remove notes that are NOT tied with extended duration
            const tiedNoteIds = tiedNotesInfo.map(info => info.noteId);
            const notesToRemove = idsAtThisPosition.filter(id => !tiedNoteIds.includes(id));
            currentPlayingNoteIds.value = currentPlayingNoteIds.value.filter(id => !notesToRemove.includes(id));
          };

          const noteEndTimeoutId = setTimeout(noteEndCallback, duration);
          window.playbackTimeouts.push(noteEndTimeoutId);

        // Store timeout info for potential pausing
        (window as any)[`timeout_${noteEndTimeoutId}_info`] = {
          startTime: Date.now(),
            duration: duration,
          callback: noteEndCallback
        };

          // Schedule separate end callbacks for tied notes
          tiedNotesInfo.forEach(tiedNoteInfo => {
            const tiedNoteEndCallback = () => {
              currentPlayingNoteIds.value = currentPlayingNoteIds.value.filter(id => id !== tiedNoteInfo.noteId);
              console.log(`Tied note ${tiedNoteInfo.noteId} finished playing after ${tiedNoteInfo.totalDurationMs}ms`);
            };

            const tiedNoteEndTimeoutId = setTimeout(tiedNoteEndCallback, tiedNoteInfo.totalDurationMs);
            window.playbackTimeouts.push(tiedNoteEndTimeoutId);

      // Store timeout info for potential pausing
            (window as any)[`timeout_${tiedNoteEndTimeoutId}_info`] = {
        startTime: Date.now(),
              duration: tiedNoteInfo.totalDurationMs,
              callback: tiedNoteEndCallback
            };
          });
        };

        const timeoutId = setTimeout(callback, playDelay);
      window.playbackTimeouts.push(timeoutId);

        // Store timeout info for potential pausing
        (window as any)[`timeout_${timeoutId}_info`] = {
          startTime: Date.now(),
          duration: playDelay,
          callback
        };
      };

      // Schedule this voice's notes
      playVoiceNotesWithDelay(notes, delay);
    });
  });

  // Calculate the total duration to know when playback ends
  let maxTotalDuration = 0;
  voiceSchedules.forEach(schedule => {
    const voiceTotalDuration = schedule.reduce((total, item) => total + item.duration, 0) + 
                               (schedule.length > 0 ? schedule[schedule.length - 1].delay : 0);
    maxTotalDuration = Math.max(maxTotalDuration, voiceTotalDuration);
  });

  // Stop playing after all voices have finished
  const finalTimeoutId = setTimeout(() => {
    // Reset all playback state variables
    isPlaying.value = false;
    isPaused.value = false;
    currentPlayingNoteIds.value = [];

    // Clear any remaining timeouts
    if (window.playbackTimeouts) {
      window.playbackTimeouts.forEach(id => clearTimeout(id));
      window.playbackTimeouts = [];
    }

    console.log('Playback complete - all voices finished');
  }, maxTotalDuration + 100); // Add a small buffer

  // Store the final timeout ID for potential cleanup
  window.playbackTimeouts.push(finalTimeoutId);

  // Store timeout info for the final timeout
  (window as any)[`timeout_${finalTimeoutId}_info`] = {
    startTime: Date.now(),
    duration: maxTotalDuration + 100,
    callback: () => {
      isPlaying.value = false;
      isPaused.value = false;
      currentPlayingNoteIds.value = [];
    }
  };
};

// Add the autoScrollToNote function
const autoScrollToNote = (note: ImportedNote) => {
  // Calculate the horizontal position of the note using new 25px grid
  const noteXPosition = note.position * 25;

  // Calculate the visible area boundaries
  const leftBoundary = scrollPosition.value;
  const rightBoundary = scrollPosition.value + visibleStaffWidth.value;

  // Check if the note is outside the visible area
  if (noteXPosition < leftBoundary + 100) {
    // Note is to the left of the visible area or too close to the left edge
    // Scroll left to show the note with some margin
    scrollPosition.value = Math.max(0, noteXPosition - 100);
    updateStaffScroll();
  } else if (noteXPosition > rightBoundary - 100) {
    // Note is to the right of the visible area or too close to the right edge
    // Scroll right to show the note with some margin
    scrollPosition.value = Math.min(
      maxScrollPosition.value,
      noteXPosition - visibleStaffWidth.value + 200
    );
    updateStaffScroll();
  }
};

// Add this ref for measure visibility
const showMeasureNumbers = ref(true); // Default to shown

// Add a ref for lyrics edit mode
const lyricsEditMode = ref(false); // Default to disabled

// Add a ref to track if playback is paused
const isPaused = ref(false);

// Add a ref to store the remaining timeouts when paused
const pausedTimeouts = ref<{ id: number, remainingTime: number, callback: Function; }[]>([]);

// Add a ref to store the time when playback was paused
const pauseTime = ref<number | null>(null);

// Add a function to pause playback
const pausePlayback = () => {
  if (!isPlaying.value || isPaused.value) return;

  isPaused.value = true;
  pauseTime.value = Date.now();

  // Stop any currently playing sounds using the correct methods
  if (noteSynth) {
    try {
      // For basic Tone.Synth, use triggerRelease() without arguments to release all notes
      noteSynth.triggerRelease();
    } catch (e) {
      console.error('Error stopping noteSynth:', e);
    }
  }

  if (pianoSynth) {
    try {
      // For Tone.Sampler, we can use releaseAll()
      pianoSynth.releaseAll();
    } catch (e) {
      console.error('Error stopping pianoSynth:', e);
    }
  }

  // Store all active timeouts with their remaining time
  pausedTimeouts.value = [];

  // Clear all active timeouts
  if (window.playbackTimeouts) {
    window.playbackTimeouts.forEach(id => {
      // Calculate remaining time for this timeout
      // Use the dynamically generated key to access timeout info
      const timeoutInfoKey = `timeout_${id}_info` as keyof Window;
      const timeoutInfo = window[timeoutInfoKey];

      if (timeoutInfo) {
        const elapsedTime = Date.now() - timeoutInfo.startTime;
        const remainingTime = Math.max(0, timeoutInfo.duration - elapsedTime);

        // Store the timeout info for resuming later
        pausedTimeouts.value.push({
          id: id as unknown as number, // Convert Timeout to number
          remainingTime,
          callback: timeoutInfo.callback
        });
        // Clean up the stored info
        delete window[timeoutInfoKey];
      }

      // Clear the timeout
      clearTimeout(id);
    });

    // Clear the timeouts array
    window.playbackTimeouts = [];
  }

  console.log('Playback paused with', pausedTimeouts.value.length, 'pending timeouts');
};

// Add a function to resume playback
const resumePlayback = () => {
  if (!isPaused.value) return;

  isPaused.value = false;
  isPlaying.value = true;

  // Reset the currently playing note ID to avoid multiple highlights
  currentPlayingNoteIds.value = []; // Changed from currentPlayingNoteId

  // Recreate all timeouts with their remaining time
  window.playbackTimeouts = [];

  // Sort timeouts by remaining time to ensure they execute in the correct order
  const sortedTimeouts = [...pausedTimeouts.value].sort((a, b) => a.remainingTime - b.remainingTime);

  console.log('Resuming playback with', sortedTimeouts.length, 'timeouts');

  // Skip any timeouts with very small remaining time (less than 10ms)
  // These are likely to be the ones that would play immediately and cause the first note issue
  const validTimeouts = sortedTimeouts.filter(timeout => timeout.remainingTime > 10);

  // Create individual timeouts for each callback to preserve voice independence
  validTimeouts.forEach(timeout => {
    // Add a small delay (100ms) to all timeouts to prevent immediate playback
    const adjustedTime = Math.max(100, timeout.remainingTime);

    const newTimeoutId = setTimeout(() => {
      try {
        timeout.callback();
      } catch (error) {
        console.error('Error executing resume callback:', error);
      }
    }, adjustedTime);

    // Store the new timeout ID
    window.playbackTimeouts.push(newTimeoutId);

    // Store timeout info for potential future pausing (preserve original callback)
    (window as any)[`timeout_${newTimeoutId}_info`] = {
      startTime: Date.now(),
      duration: adjustedTime,
      callback: timeout.callback
    };
  });

  // Clear the paused timeouts
  pausedTimeouts.value = [];
  pauseTime.value = null;

  console.log(`Playback resumed with ${validTimeouts.length} individual timeouts`);
};

// Add a function to toggle playback
const togglePlayback = () => {
  if (!isPlaying.value && !isPaused.value) {
    // Not playing and not paused -> Start playing
    playComposition();
  } else if (isPlaying.value && !isPaused.value) {
    // Playing and not paused -> Pause
    pausePlayback();
  } else if (isPaused.value) {
    // Paused -> Resume
    resumePlayback();
  }
};

// Add a function to restart playback
const restartPlayback = () => {
  // First stop the current playback
  stopPlayback();

  // Small delay to ensure everything is stopped
  setTimeout(() => {
    // Start playback again (which will use the current measure range settings)
    playComposition();
  }, 100);
};

// Add a function to show a confirmation dialog before clearing the score
const confirmClearScore = () => {
  // Only show confirmation if there are notes to clear
  if (notes.value.length > 0) {
    if (confirm('Are you sure you want to clear the score? This action cannot be undone.')) {
      clearScore();
    }
  } else {
    // If there are no notes, just clear without confirmation
    clearScore();
  }
};

// Add this ref for the current lyric input
const currentLyric = ref('');

// Add a function to set lyrics for the selected note
const setLyricForNote = (noteId, lyric) => {
  if (readOnlyMode.value) {
    console.log("Read-only mode active - lyrics editing disabled");
    return; // Exit early if in read-only mode
  }

  // First try to find the note in the active voice
  let noteIndex = activeVoice.value.notes.findIndex(note => note.id === noteId);
  let targetVoice = activeVoice.value;

  // If not found in active voice, search all voices
  if (noteIndex === -1) {
    for (const voice of voiceLayers.value) {
      noteIndex = voice.notes.findIndex(note => note.id === noteId);
      if (noteIndex !== -1) {
        targetVoice = voice;
        break;
      }
    }
  }

  if (noteIndex !== -1) {
    // Create a new note object with the lyric added
    const updatedNote = {
      ...targetVoice.notes[noteIndex],
      lyric: lyric.trim()
    };

    // Replace the note in the array
    targetVoice.notes.splice(noteIndex, 1, updatedNote);

    // Clear the current lyric input
    currentLyric.value = '';

    // Clear the selected note
    selectedNoteId.value = null;
  }
};

// Add a function to handle lyric input keypress events
const handleLyricInputKeypress = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && selectedNoteId.value) {
    setLyricForNote(selectedNoteId.value, currentLyric.value);
    event.preventDefault();
  }
};

// Add a function to switch between voice layers
const switchActiveVoice = (voiceIdToActivate: string) => {
  const voiceToActivate = voiceLayers.value.find(v => v.id === voiceIdToActivate);
  if (!voiceToActivate) return;

  // Deactivate all other voices
  voiceLayers.value.forEach(voice => {
    voice.active = voice.id === voiceIdToActivate;
  });

  activeVoiceId.value = voiceIdToActivate;
  activeStaffId.value = voiceToActivate.staffId; // Also set the active staff

  selectedNoteId.value = null;
  console.log(`Switched to voice: ${voiceIdToActivate} on staff: ${activeStaffId.value}`);
};

// Add a function to toggle voice visibility
const toggleVoiceVisibility = (voiceId) => {
  const voiceIndex = voiceLayers.value.findIndex(v => v.id === voiceId);
  if (voiceIndex !== -1) {
    voiceLayers.value[voiceIndex].visible = !voiceLayers.value[voiceIndex].visible;
  }
};

// Add a function to rename a voice
const renameVoice = (voiceId, newName) => {
  const voiceIndex = voiceLayers.value.findIndex(v => v.id === voiceId);
  if (voiceIndex !== -1) {
    voiceLayers.value[voiceIndex].name = newName;
  }
};

// Add a function to change a voice's color
const changeVoiceColor = (voiceId, newColor) => {
  const voiceIndex = voiceLayers.value.findIndex(v => v.id === voiceId);
  if (voiceIndex !== -1) {
    voiceLayers.value[voiceIndex].color = newColor;
  }
};

// Helper function to get default voice color
const getDefaultVoiceColor = (voiceId: string): string => { // Added type annotations
  const colorMap: { [key: string]: string; } = { // Added type annotation
    'voice1': '#1976D2', // Blue
    'voice2': '#E91E63', // Pink
    'voice3': '#4CAF50', // Green
    'voice4': '#FF9800'  // Orange
  };
  return colorMap[voiceId] || '#000000';
};

// Add this ref for voice playback selection
const playSelectedVoicesOnly = ref(false);

// Function to confirm and delete a voice layer
const confirmDeleteVoice = (voiceIdToDelete: string) => {
  if (voiceLayers.value.length <= 1) {
    alert("Cannot delete the last voice."); // Or handle this more gracefully
    return;
  }

  const voiceToDelete = voiceLayers.value.find(v => v.id === voiceIdToDelete);
  if (!voiceToDelete) return;

  const confirmation = confirm(`Are you sure you want to delete "${voiceToDelete.name}" and all its notes? This action cannot be undone.`);

  if (confirmation) {
    deleteVoice(voiceIdToDelete);
  }
};

// Function to actually delete the voice
const deleteVoice = (voiceIdToDelete: string) => {
  const voiceIndex = voiceLayers.value.findIndex(v => v.id === voiceIdToDelete);
  if (voiceIndex > -1) {
    voiceLayers.value.splice(voiceIndex, 1);

    // If the deleted voice was the active one, make another voice active
    // Preferably the first one, or the one before the deleted one if possible.
    if (activeVoiceId.value === voiceIdToDelete) {
      if (voiceLayers.value.length > 0) {
        // Try to set the previous voice as active, or the first one
        let newActiveIndex = voiceIndex - 1;
        if (newActiveIndex < 0 || newActiveIndex >= voiceLayers.value.length) {
          newActiveIndex = 0;
        }
        if (voiceLayers.value[newActiveIndex]) {
          switchActiveVoice(voiceLayers.value[newActiveIndex].id);
        }
      } else {
        // This case should ideally not be reached if we prevent deleting the last voice,
        // but as a fallback:
        activeVoiceId.value = ''; // Or handle as appropriate if no voices are left
      }
    }
    // Notes associated with this voice are already part of the voice object and will be removed
    // when the voice is spliced from voiceLayers.
    // If notes were stored separately and only linked by voiceId, you'd need to filter them out here.

    // Persist changes (if you have a save-to-storage mechanism)
    // saveCompositionsToStorage(); // Assuming you have this function
    console.log(`Voice ${voiceIdToDelete} deleted.`);
  }
};

// Add a function to add a new voice layer
const addVoiceLayer = (staffIdToAddVoiceTo?: string) => {
  if (readOnlyMode.value) {
    console.log("Read-only mode active - can't add voice");
    return; // Exit early if in read-only mode
  }

  let targetStaffId = staffIdToAddVoiceTo || activeStaffId.value;

  if (!targetStaffId && staves.value.length > 0) {
    targetStaffId = staves.value[0].id; // Default to the first staff if no active one
  } else if (!targetStaffId && staves.value.length === 0) {
    // If no staves exist, create one first
    const newStaffId = generateId();
    staves.value.push({ id: newStaffId, clef: 'treble', order: 0, name: 'Staff 1' });
    activeStaffId.value = newStaffId;
    targetStaffId = newStaffId;
    console.log("No staves found when adding voice, created a default staff:", newStaffId);
  }

  if (!targetStaffId) {
    alert("Cannot add voice layer: No staff available or selected.");
    console.error("Failed to add voice layer: No targetStaffId determined.");
    return;
  }

  const newVoiceId = generateId();
  const newVoice: VoiceLayer = {
    id: newVoiceId,
    name: `Voice ${voiceLayers.value.length + 1}`,
    color: getRandomColor(),
    visible: true,
    active: false, // New voices are not active by default, user switches to them
    selected: true, // Selected for playback by default
    volume: 100, // Default volume as percentage
    notes: [],
    staffId: targetStaffId,
  };
  voiceLayers.value.push(newVoice);
  switchActiveVoice(newVoiceId); // Make the new voice active
  console.log(`Added new voice layer ${newVoiceId} to staff ${targetStaffId}`);
  saveToLocalStorage();
};

// Function to assign a voice to a different staff
const assignVoiceToStaff = (voiceId: string, newStaffId: string) => {
  const voice = voiceLayers.value.find(v => v.id === voiceId);
  const staffExists = staves.value.some(s => s.id === newStaffId);

  if (voice && staffExists) {
    voice.staffId = newStaffId;
    // If this voice was active, ensure the activeStaffId is also updated
    if (voice.active) {
      activeStaffId.value = newStaffId;
    }
    saveToLocalStorage();
  } else {
    console.error(`Failed to assign voice ${voiceId} to staff ${newStaffId}. Voice or staff not found.`);
    alert("Error assigning voice to staff. Please try again.");
  }
};

// Add this function to remove time signature changes
const removeTimeSignatureChange = (timeChangeId: string) => {
  if (readOnlyMode.value) return;

  const index = timeSignatureChanges.value.findIndex(change => change.id === timeChangeId);
  if (index !== -1) {
    const change = timeSignatureChanges.value[index];
    if (confirm(`Remove time signature change ${change.numerator}/${change.denominator} at measure ${change.measure}?`)) {
      timeSignatureChanges.value.splice(index, 1);
      saveToLocalStorage();
    }
  }
};

// Add this function near other key signature related functions
const removeKeySignatureChange = (keyChangeId: string) => {
  if (readOnlyMode.value) return;

  const index = keySignatureChanges.value.findIndex(change => change.id === keyChangeId);
  if (index !== -1) {
    const change = keySignatureChanges.value[index];
    if (confirm(`Remove key signature change to ${change.keySignature} at measure ${change.measure}?`)) {
      keySignatureChanges.value.splice(index, 1);
      clearKeySignatureCache(); // Clear cache since we removed a key signature change
      saveToLocalStorage();
    }
  }
};

// End of your script section with watches
watch(allVisibleNotes, (newNotes) => {
}, { deep: true });

watch(voiceLayers, () => {
}, { deep: true });

// existing code...
const debugMonitorInterval = ref<number | null>(null); // Added type annotation
const showStaffLines = ref(true); // Added this line

const LYRIC_BASE_OFFSET = 230; // Base Y position for the first line of lyrics
const LYRIC_LINE_HEIGHT = 20;  // Estimated height per lyric line (adjust as needed)

// Computed property to get an ordered list of visible voice IDs that have lyrics
const orderedVisibleVoicesWithLyrics = computed(() => {
  const voiceIdSetByStaff: Record<string, Set<string>> = {};

  allVisibleNotes.value.forEach(note => {
    if (note.lyric && note.voiceId && note.staffId) {
      if (!voiceIdSetByStaff[note.staffId]) {
        voiceIdSetByStaff[note.staffId] = new Set<string>();
      }
      voiceIdSetByStaff[note.staffId].add(note.voiceId);
    }
  });

  const result: Record<string, string[]> = {};
  for (const staffId in voiceIdSetByStaff) {
    result[staffId] = Array.from(voiceIdSetByStaff[staffId]).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10) || 0; // Extract numbers for sorting
      const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });
  }
  return result;
});

// Helper function to get vertical offset for lyrics based on its display index among visible voices with lyrics ON A SPECIFIC STAFF
const getLyricVerticalOffset = (voiceId: string, staffId: string): string => {
  const voicesWithLyricsOnThisStaff = orderedVisibleVoicesWithLyrics.value[staffId] || [];
  const displayIndex = voicesWithLyricsOnThisStaff.indexOf(voiceId);

  if (displayIndex === -1) {
    // Default position if this voice doesn't have lyrics or isn't found (should not happen if called correctly)
    return `${LYRIC_BASE_OFFSET}px`;
  }
  return `${LYRIC_BASE_OFFSET + displayIndex * LYRIC_LINE_HEIGHT}px`;
};

// Computed property for the dynamic height of the staff container
const staffContainerMinHeight = computed(() => {
  // This is now for a single staff. The outer container will grow.
  // Calculate max lyric lines for any single staff to determine individual staff height.
  let maxLyricLinesOnAnyStaff = 0;
  if (staves.value.length > 0) {
    for (const staff of staves.value) {
      const lyricLinesForThisStaff = (orderedVisibleVoicesWithLyrics.value[staff.id] || []).length;
      if (lyricLinesForThisStaff > maxLyricLinesOnAnyStaff) {
        maxLyricLinesOnAnyStaff = lyricLinesForThisStaff;
      }
    }
  }

  const staffBaseHeight = 250;
  if (maxLyricLinesOnAnyStaff === 0) {
    return `${staffBaseHeight}px`;
  }
  const topOfFirstLyric = LYRIC_BASE_OFFSET;
  const bottomEdgeOfLastLyric = topOfFirstLyric + (maxLyricLinesOnAnyStaff * LYRIC_LINE_HEIGHT);
  const PADDING_BELOW_LYRICS = LYRIC_LINE_HEIGHT;
  const requiredHeightForLyrics = bottomEdgeOfLastLyric + PADDING_BELOW_LYRICS;
  return `${Math.max(staffBaseHeight, requiredHeightForLyrics)}px`;
});

// Computed property to get notes for a specific staff
const notesForStaff = (staffId: string): NoteWithVoiceInfo[] => {
  return allVisibleNotes.value.filter(note => note.staffId === staffId);
};

// Computed property to get notes with lyrics for a specific staff
const notesForStaffWithLyrics = (staffId: string): NoteWithVoiceInfo[] => {
  return allVisibleNotes.value.filter(note => note.staffId === staffId && note.lyric);
};

// Helper function to get ties/slurs for a specific staff
const tiesSlursForStaff = (staffId: string): TieSlur[] => {
  return tiesSlurs.value.filter(tieSlur => tieSlur.staffId === staffId);
};

// Interface for triplet groups
interface TripletGroup {
  id: string;
  notes: NoteWithVoiceInfo[];
  startX: number;
  endX: number;
  centerX: number;
  y: number;
  color: string;
}

// Helper function to group consecutive triplet notes for a specific staff
const getTripletGroupsForStaff = (staffId: string): TripletGroup[] => {
  const tripletGroups: TripletGroup[] = [];
  const notesOnStaff = notesForStaff(staffId).filter(note => note.triplet && note.type === 'note');
  
  if (notesOnStaff.length === 0) return tripletGroups;

  // Sort notes by position and voice
  const sortedNotes = notesOnStaff.sort((a, b) => {
    if (a.voiceId !== b.voiceId) {
      return a.voiceId.localeCompare(b.voiceId);
    }
    return a.position - b.position;
  });

  // Group consecutive triplet notes by voice and proximity
  let currentGroup: NoteWithVoiceInfo[] = [];
  let lastPosition = -1;
  let lastVoiceId = '';

  sortedNotes.forEach((note, index) => {
    const positionGap = note.position - lastPosition;
    const isConsecutive = positionGap <= 2; // Allow for small gaps between triplet notes
    const isSameVoice = note.voiceId === lastVoiceId;

    if (currentGroup.length === 0 || (!isConsecutive || !isSameVoice)) {
      // Start a new group
      if (currentGroup.length >= 2) {
        // Process the previous group if it has at least 2 notes
        createTripletGroup(currentGroup, tripletGroups);
      }
      currentGroup = [note];
    } else {
      // Add to current group
      currentGroup.push(note);
    }

    lastPosition = note.position;
    lastVoiceId = note.voiceId;

    // Process the last group
    if (index === sortedNotes.length - 1 && currentGroup.length >= 2) {
      createTripletGroup(currentGroup, tripletGroups);
    }
  });

  return tripletGroups;
};

// Helper function to create a triplet group
const createTripletGroup = (notes: NoteWithVoiceInfo[], tripletGroups: TripletGroup[]) => {
  if (notes.length < 2) return;

  const startNote = notes[0];
  const endNote = notes[notes.length - 1];
  
  // Calculate positions
  const startX = startNote.position * 25 - 5; // Slightly before the first note
  const endX = endNote.position * 25 + 15; // Slightly after the last note
  const centerX = (startX + endX) / 2;
  
  // Calculate Y position - above the highest note in the group
  const highestY = Math.min(...notes.map(note => note.verticalPosition));
  const y = highestY - 30; // Position bracket 30px above the highest note
  
  // Use the voice color of the first note
  const color = startNote.voiceColor || '#333';
  
  tripletGroups.push({
    id: `triplet-${startNote.voiceId}-${startNote.position}-${endNote.position}`,
    notes: [...notes],
    startX,
    endX,
    centerX,
    y,
    color
  });
};

// Watch compositions and auto-save whenever they change
watch(savedCompositions, () => {
  saveToLocalStorage();
}, { deep: true });

// Add a function to handle the clearOrRestart emit from PlaybackControls
const handleClearOrRestart = () => {
  if (isPlaying.value || isPaused.value) {
    restartPlayback();
  } else {
    confirmClearScore();
  }
};

// Add a handler for saveRename from SavedCompositionsPanel
const handleSaveRename = (id: string, newName: string) => {
  if (!newName.trim()) {
    alert('Please enter a valid name');
    return;
  }
  const composition = savedCompositions.value.find(comp => comp.id === id);
  if (!composition) {
    console.error('Composition not found for rename:', id);
    return;
  }
  composition.name = newName.trim();
  saveToLocalStorage();
  
  // Find the SavedCompositionsPanel component and call its method to exit edit mode
  const savedCompositionsPanel = document.querySelector('saved-compositions-panel');
  if (savedCompositionsPanel) {
    // Emit event to exit edit mode
    savedCompositionsPanel.dispatchEvent(new CustomEvent('exitEditMode'));
  }
  
  alert('Composition renamed successfully!');
};

const setLyricForNoteHandler = (noteId: string, lyric: string) => {
  setLyricForNote(noteId, lyric); // Call the existing function
};

const updateVoiceLayerSelection = (voiceId: string, selected: boolean) => {
  const voice = voiceLayers.value.find(v => v.id === voiceId);
  if (voice) {
    voice.selected = selected; // This is where the magic happens!
  }
};

// Initialize Debug Composable
// Pass the 'notes' computed property (or the ref it depends on)
// For notesForDebug, DebugPanel expects 'notes' which is activeVoice.value.notes
const {
  debugMode, // Get the reactive ref from the composable
  showNotePositions, // Get the reactive ref from the composable
  toggleDebugMode, // Get the method from the composable
  testAllNotes, // Get the method from the composable
  // notesForDebug will be the 'notes' computed property from NotationEditorView
  // lastClickY and selectedOctave are passed through for DebugPanel
} = useDebug(
  notes as ComputedRef<ImportedNote[]>,
  computed(() => staves.value.find(s => s.id === activeStaffId.value)?.clef || (staves.value.length > 0 ? staves.value[0].clef : 'treble')), // Pass active staff's clef
  lastClickY,
  selectedOctave
);

// Add this import at the top of your script section
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

// Add this function near line 2060
const combineCompositions = (compositionIds: string[], newName: string, preserveStaves: boolean) => {
  const compositionsToCombine = savedCompositions.value.filter(comp => compositionIds.includes(comp.id));
  if (compositionsToCombine.length < 2) {
    alert("Please select at least two compositions to combine.");
    return;
  }

  stopPlayback(); // Stop any current playback

  // Create a new base composition structure
  const newComposition: CompositionData = {
    id: generateId(),
    name: newName || "Combined Composition",
    dateCreated: Date.now(),
    staves: [],
    voiceLayers: [],
    keySignature: compositionsToCombine[0].keySignature || 'C', // Take from first composition
    timeSignature: compositionsToCombine[0].timeSignature || '4/4', // Take from first composition
    tempo: compositionsToCombine[0].tempo || 120,
    staffWidth: compositionsToCombine[0].staffWidth || 2000,
    // notes: [], // Notes will be part of voice layers
    sections: [], // Sections could be complex to merge, starting fresh or taking from first
    sequenceItems: [], // Same for sequence items
    // Other metadata from the first composition or averaged/defaulted
    selectedDuration: compositionsToCombine[0].selectedDuration || 'quarter',
    selectedOctave: compositionsToCombine[0].selectedOctave || 4,
    isDottedNote: compositionsToCombine[0].isDottedNote || false,
  };

  const staffIdMap: Record<string, string> = {}; // Maps old staff IDs to new staff IDs
  const voiceIdMap: Record<string, string> = {}; // Maps old voice IDs to new voice IDs

  compositionsToCombine.forEach((comp, compIndex) => {
    const compStaves = comp.staves || [];
    const compVoiceLayers = comp.voiceLayers || [];

    if (preserveStaves) {
      compStaves.forEach((oldStaff: Stave) => {
        const newStaffId = generateId();
        staffIdMap[oldStaff.id] = newStaffId;
        const newStaff: Stave = {
          id: newStaffId,
          name: `${oldStaff.name || `Staff ${compIndex + 1}-${newComposition.staves!.length + 1}`} (from ${comp.name})`,
          clef: oldStaff.clef || 'treble', // *** Preserve original clef ***
          order: newComposition.staves!.length
        };
        newComposition.staves!.push(newStaff);
      });

      compVoiceLayers.forEach(oldVoice => {
        const newVoiceId = generateId();
        voiceIdMap[oldVoice.id] = newVoiceId;
        const newStaffIdForVoice = oldVoice.staffId ? staffIdMap[oldVoice.staffId] : undefined;

        if (!newStaffIdForVoice && newComposition.staves!.length > 0) {
          console.warn(`Voice ${oldVoice.name} had no staff or unmapped staff. Assigning to first new staff.`);
          // Attempt to find a staff from the same original composition if possible
          const originalCompStaff = newComposition.staves!.find(s => s.name?.includes(`(from ${comp.name})`));
          const targetStaff = originalCompStaff || newComposition.staves![0];

          const newVoice: VoiceLayer = {
            ...oldVoice,
            id: newVoiceId,
            staffId: targetStaff.id, // Assign to a valid new staff
            name: `${oldVoice.name} (from ${comp.name})`,
            notes: (oldVoice.notes || []).map(n => ({ ...n, id: generateId() })), // New IDs for notes
            active: false, // Deactivate by default
            selected: oldVoice.selected !== undefined ? oldVoice.selected : true,
            volume: oldVoice.volume !== undefined ? oldVoice.volume : 100, // Convert or default volume
          };
          newComposition.voiceLayers!.push(newVoice);
        } else if (newStaffIdForVoice) {
          const newVoice: VoiceLayer = {
            ...oldVoice,
            id: newVoiceId,
            staffId: newStaffIdForVoice,
            name: `${oldVoice.name} (from ${comp.name})`,
            notes: (oldVoice.notes || []).map(n => ({ ...n, id: generateId() })),
            active: false,
            selected: oldVoice.selected !== undefined ? oldVoice.selected : true,
            volume: oldVoice.volume !== undefined ? oldVoice.volume : 100, // Convert or default volume
          };
          newComposition.voiceLayers!.push(newVoice);
        } else {
          console.error(`Could not find a staff for voice ${oldVoice.name} from ${comp.name}. Skipping voice.`);
        }
      });

    } else { // Not preserving staves - create one new staff per old composition
      const compSpecificNewStaffIds: string[] = [];
      if (compStaves.length > 0) {
        // Create one new staff for this composition, taking clef from its first original staff
        const newStaffId = generateId();
        const firstOldStaffClef = compStaves[0].clef || 'treble';
        const newStaffForComp: Stave = {
          id: newStaffId,
          name: `${comp.name} - Merged Staff ${newComposition.staves!.length + 1}`,
          clef: firstOldStaffClef, // *** Use clef from first original staff ***
          order: newComposition.staves!.length,
          isCollapsed: false, // Default for new staves
        };
        newComposition.staves!.push(newStaffForComp);
        compSpecificNewStaffIds.push(newStaffId);
        staffIdMap[`${comp.id}_defaultStaff`] = newStaffId; // Generic mapping for this comp's voices
      } else {
        // If the old composition had no staves defined, create a default treble staff for its voices
        const newStaffId = generateId();
        const newStaffForComp: Stave = {
          id: newStaffId,
          name: `${comp.name} - Default Staff ${newComposition.staves!.length + 1}`,
          clef: 'treble', // Default if no original staves
          order: newComposition.staves!.length,
          isCollapsed: false, // Default for new staves
        };
        newComposition.staves!.push(newStaffForComp);
        compSpecificNewStaffIds.push(newStaffId);
        staffIdMap[`${comp.id}_defaultStaff`] = newStaffId;
      }

      const targetStaffIdForCompVoices = compSpecificNewStaffIds[0] || (newComposition.staves!.length > 0 ? newComposition.staves![0].id : undefined);

      if (!targetStaffIdForCompVoices) {
        console.error(`Cannot add voices for ${comp.name} as no target staff could be determined or created.`);
        return; // Skip voices for this comp if no staff
      }

      compVoiceLayers.forEach(oldVoice => {
        const newVoiceId = generateId();
        voiceIdMap[oldVoice.id] = newVoiceId;
        const newVoice: VoiceLayer = {
          ...oldVoice,
          id: newVoiceId,
          staffId: targetStaffIdForCompVoices, // All voices from this comp go to its new single staff
          name: `${oldVoice.name} (from ${comp.name})`,
          notes: (oldVoice.notes || []).map(n => ({ ...n, id: generateId() })),
          active: false,
          selected: oldVoice.selected !== undefined ? oldVoice.selected : true,
          volume: oldVoice.volume !== undefined ? oldVoice.volume : 100, // Convert or default volume
        };
        newComposition.voiceLayers!.push(newVoice);
      });

      // Handle 'flat notes' if they exist on the old composition (legacy)
      // These notes need to be assigned to a voice on the new staff for this composition.
      if ((comp as any).notes && (comp as any).notes.length > 0) {
        let defaultVoiceForFlatNotes = newComposition.voiceLayers!.find(
          vl => vl.staffId === targetStaffIdForCompVoices && vl.name?.includes('(from ${comp.name})')
        );
        if (!defaultVoiceForFlatNotes) {
          const newDefaultVoiceId = generateId();
          defaultVoiceForFlatNotes = {
            id: newDefaultVoiceId,
            name: `Default Voice (from ${comp.name} flat notes)`,
            color: getRandomColor(),
            visible: true,
            active: false,
            selected: true,
            volume: 100, // Default to 100%
            notes: [],
            staffId: targetStaffIdForCompVoices,
          };
          newComposition.voiceLayers!.push(defaultVoiceForFlatNotes);
        }
        (comp as any).notes.forEach((note: any) => {
          const { voiceId, voiceColor, ...restOfNote } = note;
          defaultVoiceForFlatNotes!.notes.push({
            ...restOfNote,
            id: generateId(),
          });
        });
      }
    }
  });

  // Final cleanup and loading
  if (newComposition.staves!.length === 0) {
    newComposition.staves!.push({ id: generateId(), name: "Default Combined Staff", clef: 'treble', order: 0, isCollapsed: false });
  }
  if (newComposition.voiceLayers!.length === 0 && newComposition.staves!.length > 0) {
    newComposition.voiceLayers!.push({
      id: generateId(), name: "Default Combined Voice", color: getRandomColor(), staffId: newComposition.staves![0].id,
      visible: true, active: true, selected: true, volume: 100, notes: [] // Default to 100%
    });
  }


  // Add the new combined composition to savedCompositions
  savedCompositions.value.push(newComposition);
  // Load the new combined composition
  loadComposition(newComposition.id);
  compositionName.value = newComposition.name; // Update current composition name input
  currentCompositionId.value = newComposition.id; // Set as current
  activeTab.value = 'notes'; // Switch to notes tab
  alert(`Compositions combined into "${newComposition.name}".`);
  saveToLocalStorage(); // Save all changes
};

// Add this around line 119 where other refs are defined
const sections = ref<Section[]>([]);

// Add a function to add a section
const addSection = (sectionData: Omit<Section, 'id'>) => {
  const newSection = {
    ...sectionData,
    id: generateId()
  };

  sections.value.push(newSection);
};

// Add a function to delete a section
const deleteSection = (sectionId: string) => {
  const index = sections.value.findIndex(section => section.id === sectionId);
  if (index !== -1) {
    const deletedSection = sections.value.splice(index, 1)[0];
  }
};

// Add a function to play a specific section
const playSection = (section: Section) => {
  // Stop any current playback
  stopPlayback();

  // Set the playback range to the section boundaries
  playbackStartMeasure.value = section.startMeasure;
  playbackEndMeasure.value = section.endMeasure;

  // Start playback
  playComposition();
};

// Add a function to jump to a section (just scroll, don't play)
const jumpToSection = (section: Section) => {
  // Calculate position of start measure
  const measureWidth = measureWidthByTimeSignature.value;
  // Use global key signature for consistency
  const globalKeySignatureWidth = (keySignatures[keySignature.value] || []).length * 10;
  const initialPosition = 70 + globalKeySignatureWidth + 20; // clef + global key sig + time sig

  // Calculate where the measure starts
  const measureStart = initialPosition + ((section.startMeasure - 1) * measureWidth);

  // Scroll to that position
  scrollPosition.value = Math.max(0, measureStart - 100); // 100px padding at left
  updateStaffScroll();
};

// Add this function to calculate the position of a section marker
const getSectionPosition = (measure: number) => {
  const measureWidth = measureWidthByTimeSignature.value;
  // Use global key signature for consistency
  const globalKeySignatureWidth = (keySignatures[keySignature.value] || []).length * 10;
  const initialPosition = 70 + globalKeySignatureWidth + 20; // clef + global key sig + time sig

  // Calculate position based on measure number
  return initialPosition + ((measure - 1) * measureWidth);
};

// Add these variables near where the 'sections' ref is defined
// Place this with other refs
const currentSequence = ref<SequenceItem[]>([]);
const currentSequenceIndex = ref<number>(0);
const isPlayingSequence = ref(false);
const playingSequenceSectionId = ref<string | null>(null);

// Add this function to play a sequence of sections
const playSequence = (sequence: SequenceItem[]) => {
  if (sequence.length === 0) {
    alert('Playback sequence is empty. Please add sections to the sequence.');
    return;
  }

  // Stop any current playback
  stopPlayback();

  // Store the current sequence for step tracking
  currentSequence.value = [...sequence];
  currentSequenceIndex.value = 0;
  isPlayingSequence.value = true;

  // Play the first section in the sequence
  playNextInSequence();
};

// Function to play the next section in the sequence
const playNextInSequence = () => {
  if (currentSequenceIndex.value >= currentSequence.value.length) {
    // End of sequence reached
    isPlayingSequence.value = false;
    currentSequenceIndex.value = 0;
    playingSequenceSectionId.value = null;
    return;
  }

  // Get the current section to play
  const sequenceItem = currentSequence.value[currentSequenceIndex.value];
  const section = sections.value.find(s => s.id === sequenceItem.sectionId);

  if (!section) {
    currentSequenceIndex.value++;
    setTimeout(() => playNextInSequence(), 100);
    return;
  }

  // Update UI to highlight the current section
  playingSequenceSectionId.value = section.id;

  // Jump to the section
  jumpToSection(section);

  // Play this section with its specific range WITHOUT changing global playback range
  playCompositionWithCallback(section.startMeasure, section.endMeasure);
};

// Modify playCompositionWithCallback to accept optional start/end measures
const playCompositionWithCallback = (sectionStartMeasure: number | null = null, sectionEndMeasure: number | null = null) => {
  if (isPlaying.value) return;

  isPlaying.value = true;
  currentPlayingNoteIds.value = []; // Changed from currentPlayingNoteId

  // Initialize Tone.js if needed
  initializeToneJs();

  // Get all visible notes from all visible voice layers
  const visibleVoices = voiceLayers.value.filter(voice => voice.visible);

  // Determine which voices to play based on playback settings
  const voicesToPlay = playSelectedVoicesOnly.value
    ? voiceLayers.value.filter(voice => voice.visible && voice.selected)
    : visibleVoices;

  // If no voices are selected for playback, use all visible voices
  if (playSelectedVoicesOnly.value && voicesToPlay.length === 0) {
    voicesToPlay.push(...visibleVoices);
  }

  // Collect all notes from the voices to play
  let allNotesToPlay = [];
  voicesToPlay.forEach(voice => {
    // Add voice ID to each note for identification during playback
    const voiceNotes = voice.notes.map(note => ({
      ...note,
      voiceId: voice.id,
      voiceColor: voice.color
    }));
    allNotesToPlay = allNotesToPlay.concat(voiceNotes);
  });

  // Sort all notes by position
  const sortedNotes = allNotesToPlay.sort((a, b) => a.position - b.position);

  // Filter notes based on selected measures
  let filteredNotes = sortedNotes;

  // Use section-specific measures if provided, otherwise use global playback range
  const startMeasure = sectionStartMeasure !== null ? sectionStartMeasure : playbackStartMeasure.value;
  const endMeasure = sectionEndMeasure !== null ? sectionEndMeasure : playbackEndMeasure.value;

  if (startMeasure > 1 || (endMeasure > 0)) {
    filteredNotes = sortedNotes.filter(note => {
      const noteMeasure = getNotesMeasure(note);

      // Check if the note is within the selected measure range
      const isAfterStart = noteMeasure >= startMeasure;
      const isBeforeEnd = endMeasure === 0 || noteMeasure <= endMeasure;

      return isAfterStart && isBeforeEnd;
    });
  }

  // Initialize array to track timeout IDs for cleanup
  if (!window.playbackTimeouts) window.playbackTimeouts = [];
  window.playbackTimeouts = [];

  // Clear any existing timeouts
  window.playbackTimeouts.forEach(id => clearTimeout(id));
  window.playbackTimeouts = [];

  // Process each voice independently for truly independent timing
  const voiceSchedules = new Map();
  
  // Group notes by voice first
  const notesByVoice = {};
  filteredNotes.forEach(note => {
    if (!notesByVoice[note.voiceId]) {
      notesByVoice[note.voiceId] = [];
    }
    notesByVoice[note.voiceId].push(note);
  });

  // Create independent timing schedule for each voice
  Object.entries(notesByVoice).forEach(([voiceId, voiceNotes]) => {
    const voice = voicesToPlay.find(v => v.id === voiceId);
    if (!voice) return;

    // Sort notes by position for this voice
    const sortedVoiceNotes = (voiceNotes as any[]).sort((a, b) => a.position - b.position);
    
    // Group notes by position within this voice (for chords within the same voice)
    const notesByPosition = {};
    sortedVoiceNotes.forEach(note => {
    if (!notesByPosition[note.position]) {
      notesByPosition[note.position] = [];
    }
    notesByPosition[note.position].push(note);
  });

    // Calculate timing for this voice independently
    let voiceDelay = 0;
    const voiceSchedule = [];

    Object.keys(notesByPosition).map(Number).sort((a, b) => a - b).forEach(position => {
    const notesAtPosition = notesByPosition[position];

      // Find the longest duration at this position within this voice only
    let longestDuration = 0;
    notesAtPosition.forEach(note => {
        const noteDuration = getNoteDurationInBeats(note.duration, note.dotted, note.triplet);
      longestDuration = Math.max(longestDuration, noteDuration);
    });

      // Get the measure this position is in and calculate timing compression for this voice
      const measureNumber = getNotesMeasure(notesAtPosition[0]);
      let voiceTimingFactor = 1;
      if (measureNumber > 0) {
        voiceTimingFactor = getMeasureTimingFactor(measureNumber, voice.notes);
      }

      // Apply voice-specific compression
      const compressedDuration = longestDuration * voiceTimingFactor;
      
      // Log voice-specific compression when significant
      // if (Math.abs(voiceTimingFactor - 1) > 0.01) {
      //   console.log(`Voice ${voice.name}: Measure ${measureNumber}, compression factor ${voiceTimingFactor.toFixed(3)} (${longestDuration}→${compressedDuration.toFixed(3)} beats)`);
      // }

      // Calculate the wait duration in seconds for this voice
    const secondsPerBeat = 60 / tempo.value;
      const waitDurationSeconds = compressedDuration * secondsPerBeat;

      voiceSchedule.push({
        delay: voiceDelay * 1000, // Convert to milliseconds
        notes: notesAtPosition,
        duration: waitDurationSeconds * 1000
      });

      voiceDelay += waitDurationSeconds;
    });

    voiceSchedules.set(voiceId, voiceSchedule);
  });

  // Schedule playback for all voices
  voiceSchedules.forEach((schedule, voiceId) => {
    const voice = voiceLayers.value.find(v => v.id === voiceId);
    
    schedule.forEach((scheduleItem, index) => {
      const { delay, notes, duration } = scheduleItem;
      
      // Function to play notes for this voice at this time
      const playVoiceNotesWithDelay = (notesToPlay, playDelay) => {
      const callback = () => {
        const idsAtThisPosition = notesToPlay.map(n => n.id);
        currentPlayingNoteIds.value.push(...idsAtThisPosition.filter(id => !currentPlayingNoteIds.value.includes(id)));

          // Auto-scroll to the first note being played (from any voice)
        if (notesToPlay.length > 0 && autoScrollToPlayingNote.value) {
          autoScrollToNote(notesToPlay[0]);
        }

          // Play all notes at this position for this voice
          const tiedNotesInfo = [];
        notesToPlay.forEach(noteToPlay => {
            const playResult = playNoteWithTieHandling(noteToPlay, voice);
            if (playResult.isPlaying && playResult.totalDurationMs > 0) {
              // This is a tied note that will play longer than the schedule duration
              tiedNotesInfo.push({
                noteId: noteToPlay.id,
                totalDurationMs: playResult.totalDurationMs
              });
            }
          });

          // Schedule the end of regular notes (independent for this voice)
          const noteEndCallback = () => {
            // Only remove notes that are NOT tied with extended duration
            const tiedNoteIds = tiedNotesInfo.map(info => info.noteId);
            const notesToRemove = idsAtThisPosition.filter(id => !tiedNoteIds.includes(id));
            currentPlayingNoteIds.value = currentPlayingNoteIds.value.filter(id => !notesToRemove.includes(id));
          };

          const noteEndTimeoutId = setTimeout(noteEndCallback, duration);
          window.playbackTimeouts.push(noteEndTimeoutId);

          // Store timeout info for potential pausing
          (window as any)[`timeout_${noteEndTimeoutId}_info`] = {
            startTime: Date.now(),
            duration: duration,
            callback: noteEndCallback
          };

          // Schedule separate end callbacks for tied notes
          tiedNotesInfo.forEach(tiedNoteInfo => {
            const tiedNoteEndCallback = () => {
              currentPlayingNoteIds.value = currentPlayingNoteIds.value.filter(id => id !== tiedNoteInfo.noteId);
              console.log(`Tied note ${tiedNoteInfo.noteId} finished playing after ${tiedNoteInfo.totalDurationMs}ms`);
            };

            const tiedNoteEndTimeoutId = setTimeout(tiedNoteEndCallback, tiedNoteInfo.totalDurationMs);
            window.playbackTimeouts.push(tiedNoteEndTimeoutId);

            // Store timeout info for potential pausing
            (window as any)[`timeout_${tiedNoteEndTimeoutId}_info`] = {
              startTime: Date.now(),
              duration: tiedNoteInfo.totalDurationMs,
              callback: tiedNoteEndCallback
            };
        });
      };

        const timeoutId = setTimeout(callback, playDelay);
      window.playbackTimeouts.push(timeoutId);

        // Store timeout info for potential pausing
        (window as any)[`timeout_${timeoutId}_info`] = {
          startTime: Date.now(),
          duration: playDelay,
          callback
        };
      };

      // Schedule this voice's notes
      playVoiceNotesWithDelay(notes, delay);
    });
  });

  // Calculate the total duration to know when playback ends
  let maxTotalDuration = 0;
  voiceSchedules.forEach(schedule => {
    const voiceTotalDuration = schedule.reduce((total, item) => total + item.duration, 0) + 
                               (schedule.length > 0 ? schedule[schedule.length - 1].delay : 0);
    maxTotalDuration = Math.max(maxTotalDuration, voiceTotalDuration);
  });

  // Stop playing after all voices have finished
  const finalTimeoutId = setTimeout(() => {
    // Reset playback state variables
    isPlaying.value = false;
    isPaused.value = false;
    currentPlayingNoteIds.value = [];

    // Clear any remaining timeouts
    if (window.playbackTimeouts) {
      window.playbackTimeouts.forEach(id => clearTimeout(id));
      window.playbackTimeouts = [];
    }

    console.log('Playback complete - all voices finished');

    // If we're playing a sequence, move to the next section
    if (isPlayingSequence.value) {
      currentSequenceIndex.value++;
      setTimeout(() => playNextInSequence(), 500); // Small delay between sections
    }
  }, maxTotalDuration + 100);

  window.playbackTimeouts.push(finalTimeoutId);
};

// Add this to the list of refs
const sequenceItems = ref<SequenceItem[]>([]);

// Add a function to handle sequence updates from the SectionsPanel
const updateSequence = (newSequence: SequenceItem[]) => {
  console.log('Updating sequence:', newSequence);
  sequenceItems.value = [...newSequence];
};

// Add this watch to confirm when sequenceItems changes
watch(sequenceItems, (newValue) => {
  console.log('sequenceItems changed:', newValue);
}, { deep: true });

// Modify the exportCurrentComposition function to log more details
// const exportCurrentComposition = async () => {
//   // ... existing code

//   // Add this log right before exporting
//   console.log('Exporting composition with sequence items:', compositionToExport.sequenceItems);

//   // ... rest of function
// };

// Add this new function
const enforceNaturalNotes = () => {
  let enforcedCount = 0;

  voiceLayers.value.forEach(voice => {
    voice.notes.forEach(note => {
      if (note.explicitNatural && note.pitch) {
        // Always force natural notes to be natural
        const noteLetter = note.pitch.charAt(0);
        const octave = note.pitch.slice(-1);

        // Set the pitch to explicitly have no accidentals
        if (note.pitch !== `${noteLetter}${octave}`) {
          note.pitch = `${noteLetter}${octave}`;
          enforcedCount++;
        }
      }
    });
  });

  if (enforcedCount > 0) {
    console.log(`Enforced ${enforcedCount} natural notes`);
  }

  return enforcedCount;
};

// Add a call to this function after key signature changes
const changeKeySignatureDirectly = (newKeySignature: string) => {
  // console.log(`Changing key signature from ${keySignature.value} to ${newKeySignature}`);
  keySignature.value = newKeySignature;

  // Clear the key signature cache since the global key signature changed
  clearKeySignatureCache();

  // Enforce natural notes after key signature change to ensure their pitches remain natural
  const changedCount = enforceNaturalNotes();
  if (changedCount > 0) {
    // console.log('Saving to localStorage after enforcing naturals due to key signature change.');
    saveToLocalStorage(); // Save changes if any note pitches were corrected
  }
};

// Watch for keySignature changes (this might be redundant if AppHeader directly calls changeKeySignatureDirectly)
// However, it's a good safeguard if keySignature.value can be changed by other means.
watch(keySignature, (newValue, oldValue) => {
  if (newValue !== oldValue) { // Only run if there's an actual change
    // console.log(`Key signature watcher: changed from ${oldValue} to ${newValue}`);
    const enforcedCount = enforceNaturalNotes();
    if (enforcedCount > 0) {
      // console.log('Saving to localStorage from keySignature watcher after enforcing naturals.');
      saveToLocalStorage();
    }
  }
}, { deep: true }); // deep might not be necessary for a simple string ref

// existing code...

// Add ref for instruction modal visibility
const showFirstTimeInstructions = ref(false);

// Function to check if it's the first time visit
const checkFirstTimeVisit = () => {
  const hasSeenInstructions = localStorage.getItem('musicNotationAppInstructionSeen');
  if (!hasSeenInstructions) {
    // Wait a short moment before showing the modal to ensure UI is loaded
    setTimeout(() => {
      showFirstTimeInstructions.value = true;
    }, 1000);
  }
};

// Function to close the instruction modal
const closeFirstTimeInstructions = () => {
  showFirstTimeInstructions.value = false;
};

// ... existing code ...

// Add this function to initialize a default staff and voice
const initializeDefaultStaffAndVoice = () => {
  console.log("Initializing default staff and voice.");
  if (staves.value.length === 0) {
    const defaultStaffId = generateId();
    staves.value.push({
      id: defaultStaffId,
      clef: 'treble',
      order: 0,
      name: 'Staff 1'
    });
    activeStaffId.value = defaultStaffId;
    console.log("Created default staff:", defaultStaffId);
  }

  if (voiceLayers.value.length === 0 && staves.value.length > 0) {
    const staffToUse = activeStaffId.value || staves.value[0].id;
    const defaultVoiceId = generateId();
    voiceLayers.value.push({
      id: defaultVoiceId,
      name: 'Voice 1',
      color: getRandomColor(),
      visible: true,
      active: true,
      selected: true,
      volume: 100, // Default volume as percentage
      notes: [],
      staffId: staffToUse
    });
    activeVoiceId.value = defaultVoiceId;
    console.log("Created default voice:", defaultVoiceId, "on staff:", staffToUse);
  }
  // Ensure activeStaffId is set if staves exist
  if (!activeStaffId.value && staves.value.length > 0) {
    activeStaffId.value = staves.value[0].id;
  }
  // Ensure activeVoiceId is set if voices exist
  if (!activeVoiceId.value && voiceLayers.value.length > 0) {
    activeVoiceId.value = voiceLayers.value[0].id;
    // also update active state for the voice
    const activeV = voiceLayers.value.find(v => v.id === activeVoiceId.value);
    if (activeV) activeV.active = true;
  }
};

// Function to duplicate a staff with all its settings and notes
const duplicateStaff = (staffToDuplicate: Stave) => {
  if (readOnlyMode.value) {
    console.log("Read-only mode active - can't duplicate staff");
    return;
  }

  const newStaffId = generateId();
  const newStaffOrder = staves.value.length;
  
  // Create new staff with copied settings
  const newStaff = {
    id: newStaffId,
    clef: staffToDuplicate.clef,
    order: newStaffOrder,
    name: `${staffToDuplicate.name} (Copy)`,
    isCollapsed: false
  };
  staves.value.push(newStaff);
  
  // Find and duplicate all voice layers associated with the original staff
  const originalVoiceLayers = voiceLayers.value.filter(vl => vl.staffId === staffToDuplicate.id);
  originalVoiceLayers.forEach(originalVoice => {
    const newVoiceId = generateId();
    const newVoice = {
      ...originalVoice,
      id: newVoiceId,
      staffId: newStaffId,
      name: `${originalVoice.name} (Copy)`,
      // Deep copy notes and assign new IDs
      notes: originalVoice.notes.map(note => ({
        ...note,
        id: generateId(),
        voiceId: newVoiceId
      }))
    };
    voiceLayers.value.push(newVoice);
  });

  // Duplicate any staff-specific changes
  const duplicateChanges = (changes: any[], staffId: string) => {
    const staffChanges = changes.filter(change => change.staffId === staffId);
    return staffChanges.map(change => ({
      ...change,
      id: generateId(),
      staffId: newStaffId
    }));
  };

  // Duplicate key signature changes
  const newKeySignatureChanges = duplicateChanges(keySignatureChanges.value, staffToDuplicate.id);
  keySignatureChanges.value.push(...newKeySignatureChanges);

  // Duplicate time signature changes
  const newTimeSignatureChanges = duplicateChanges(timeSignatureChanges.value, staffToDuplicate.id);
  timeSignatureChanges.value.push(...newTimeSignatureChanges);

  // Duplicate clef changes
  const newClefChanges = duplicateChanges(clefChanges.value, staffToDuplicate.id);
  clefChanges.value.push(...newClefChanges);

  // Create a mapping of old note IDs to new note IDs for ties/slurs
  const noteIdMapping = new Map();
  voiceLayers.value.forEach(voice => {
    if (voice.staffId === newStaffId) {
      // Find the original voice this was copied from
      const originalVoice = originalVoiceLayers.find(ov => ov.name === voice.name.replace(' (Copy)', ''));
      if (originalVoice) {
        // Map original note IDs to new note IDs
        originalVoice.notes.forEach((originalNote, index) => {
          noteIdMapping.set(originalNote.id, voice.notes[index].id);
        });
      }
    }
  });

  // Duplicate ties and slurs
  const staffTiesSlurs = tiesSlurs.value.filter(ts => ts.staffId === staffToDuplicate.id);
  const newTiesSlurs = staffTiesSlurs.map(ts => ({
    id: generateId(),
    type: ts.type,
    startNoteId: noteIdMapping.get(ts.startNoteId),
    endNoteId: noteIdMapping.get(ts.endNoteId),
    staffId: newStaffId,
    curvature: ts.curvature
  })).filter(ts => ts.startNoteId && ts.endNoteId); // Only keep ties/slurs where both notes were mapped
  tiesSlurs.value.push(...newTiesSlurs);

  // Make the new staff active
  activeStaffId.value = newStaffId;
  
  // Make the first voice of the new staff active
  const firstNewVoice = voiceLayers.value.find(vl => vl.staffId === newStaffId);
  if (firstNewVoice) {
    switchActiveVoice(firstNewVoice.id);
  }

  console.log(`Duplicated staff ${staffToDuplicate.id} to new staff ${newStaffId}`);
  saveToLocalStorage();
};

// Function to add a new staff
const addNewStaff = () => {
  if (readOnlyMode.value) {
    console.log("Read-only mode active - can't add staff");
    return; // Exit early if in read-only mode
  }

  const newStaffId = generateId();
  const newStaffOrder = staves.value.length;
  staves.value.push({
    id: newStaffId,
    clef: 'treble', // Default to treble
    order: newStaffOrder,
    name: `Staff ${newStaffOrder + 1}`
  });
  activeStaffId.value = newStaffId; // Make the new staff active

  // Add a default voice to the new staff
  const newVoiceId = generateId();
  voiceLayers.value.push({
    id: newVoiceId,
    name: `Voice ${voiceLayers.value.length + 1}`,
    color: getRandomColor(),
    visible: true,
    active: true, // Make this new voice active
    selected: true,
    volume: 100, // Default volume as percentage
    notes: [],
    staffId: newStaffId
  });
  switchActiveVoice(newVoiceId); // This will also set activeStaffId correctly
  console.log(`Added new staff ${newStaffId} and voice ${newVoiceId}`);
};

// Function to remove a staff
const removeStaff = (staffIdToRemove: string) => {
  if (readOnlyMode.value) {
    console.log("Read-only mode active - can't remove staff");
    return; // Exit early if in read-only mode
  }

  if (staves.value.length <= 1) {
    alert("Cannot remove the last staff.");
    return;
  }
  if (confirm("Are you sure you want to remove this staff and all its voices/notes? This cannot be undone.")) {
    // Remove voices associated with this staff
    voiceLayers.value = voiceLayers.value.filter(vl => vl.staffId !== staffIdToRemove);
    // Remove the staff
    staves.value = staves.value.filter(s => s.id !== staffIdToRemove);

    // Re-order remaining staves
    staves.value.forEach((s, index) => s.order = index);

    // Update active staff and voice if the removed one was active
    if (activeStaffId.value === staffIdToRemove) {
      activeStaffId.value = staves.value.length > 0 ? staves.value[0].id : null;
    }
    if (activeStaffId.value && !voiceLayers.value.some(vl => vl.staffId === activeStaffId.value && vl.active)) {
      const firstVoiceOnNewActiveStaff = voiceLayers.value.find(vl => vl.staffId === activeStaffId.value);
      if (firstVoiceOnNewActiveStaff) {
        switchActiveVoice(firstVoiceOnNewActiveStaff.id);
      } else if (voiceLayers.value.length > 0) {
        switchActiveVoice(voiceLayers.value[0].id);
      } else {
        activeVoiceId.value = ''; // No voices left
      }
    } else if (voiceLayers.value.length === 0) {
      activeVoiceId.value = '';
    }
    console.log(`Removed staff ${staffIdToRemove}`);
  }
};

// Function to initiate staff name editing
const editStaffName = (stave: Stave) => {
  if (readOnlyMode.value) {
    console.log("Read-only mode active - can't edit staff name");
    return; // Exit early if in read-only mode
  }
  editingStaffNameId.value = stave.id;
  nextTick(() => {
    // staffNameInput.value is an array because the ref is inside a v-for.
    // We expect only one input to be rendered with this ref at a time due to v-if/v-else.
    if (staffNameInput.value && staffNameInput.value.length > 0) {
      const inputElement = staffNameInput.value[0]; // Access the first (and only expected) element
      if (inputElement && typeof inputElement.focus === 'function') {
        inputElement.focus();
        if (typeof inputElement.select === 'function') {
          inputElement.select();
        }
      } else {
        console.error('Failed to focus/select staff name input: The referenced element is not a valid input or is not focusable.', staffNameInput.value);
      }
    } else {
      console.error('Failed to focus/select staff name input: The ref array is empty or undefined.', staffNameInput.value);
    }
  });
};

// Function to save staff name
const saveStaffName = (stave: Stave, event: Event) => {
  const inputElement = event.target as HTMLInputElement;
  const newName = inputElement.value.trim();

  if (!newName) {
    alert("Staff name cannot be empty.");
    inputElement.value = stave.name || ''; // Revert to old name
    editingStaffNameId.value = null;
    return;
  }

  const isNameTaken = staves.value.some(s => s.id !== stave.id && s.name === newName);
  if (isNameTaken) {
    alert(`The name "${newName}" is already used by another staff. Please choose a unique name.`);
    inputElement.value = stave.name || ''; // Revert to old name
    editingStaffNameId.value = null;
    return;
  }

  stave.name = newName;
  editingStaffNameId.value = null;
  console.log(`Staff ${stave.id} renamed to ${stave.name}`);
  saveToLocalStorage();
};

// Function to cancel staff name editing
const cancelEditStaffName = (stave: Stave, event: Event) => {
  const inputElement = event.target as HTMLInputElement;
  inputElement.value = stave.name || ''; // Revert to old name
  editingStaffNameId.value = null;
};

// const handleChangeVoiceVolume = (voiceId: string, newVolume: number) => {
//   const voice = voiceLayers.value.find(v => v.id === voiceId);
//   if (voice) {
//     voice.volume = newVolume;
//     // console.log(`Volume for voice ${voiceId} set to ${newVolume} dB`);
//     // Optionally save to localStorage if desired on every tweak, or rely on broader save mechanisms
//     // saveToLocalStorage(); 
//   }
// };

// Initialize Debug Composable
// Pass the 'notes' computed property (or the ref it depends on)
// existing code...

const toggleStaffCollapse = (stave: Stave) => {
  if (readOnlyMode.value) {
    console.log("Read-only mode active - can't toggle staff collapse");
    return; // Exit early if in read-only mode
  }

  stave.isCollapsed = !stave.isCollapsed;
  saveToLocalStorage(); // Save the change
};

// ... existing code ...

// Add this near other refs at the top of the <script setup> section
const readOnlyMode = ref(false);

// Add a computed property for a clear visual indication
const editorClassName = computed(() => {
  return {
    'notation-editor': true,
    'read-only-mode': readOnlyMode.value
  };
});

// Add this near other refs
const voiceVolumeSnapshot = ref<Record<string, number>>({});

// Add a watcher to save and restore voice volumes
watch(readOnlyMode, (newValue) => {
  if (newValue) {
    // Entering read-only mode: save a snapshot of all voice volumes
    voiceVolumeSnapshot.value = {};
    voiceLayers.value.forEach(voice => {
      voiceVolumeSnapshot.value[voice.id] = voice.volume;
    });
    console.log('Voice volume snapshot saved:', voiceVolumeSnapshot.value);
  } else {
    // Exiting read-only mode: restore voice volumes from snapshot
    voiceLayers.value.forEach(voice => {
      if (voiceVolumeSnapshot.value[voice.id] !== undefined) {
        voice.volume = voiceVolumeSnapshot.value[voice.id];
      }
    });
    console.log('Voice volumes restored from snapshot');

    // Clear the snapshot
    voiceVolumeSnapshot.value = {};
  }
});

// Modify handleChangeVoiceVolume to avoid saving in read-only mode
const handleChangeVoiceVolume = (voiceId: string, newVolume: number) => {
  const voice = voiceLayers.value.find(v => v.id === voiceId);
  if (voice) {
    voice.volume = newVolume;

    // Only save to localStorage if NOT in read-only mode
    if (!readOnlyMode.value) {
      saveToLocalStorage();
    }
  }
};

// Add this function to the script section
const loadCompositionWithReadOnly = (compositionId, enableReadOnly = true) => {
  // Call the original loadComposition function
  loadComposition(compositionId);

  // Enable read-only mode if requested (default is true)
  if (enableReadOnly) {
    readOnlyMode.value = true;
  }
};

// Wrapper functions for DebugPanel props
// Assumes DebugNote is compatible with ImportedNote and DebugPanel uses active clef context

const needsLedgerLinesForDebugPanel = (noteFromDebugPanel: ImportedNote, side: "above" | "below"): boolean => {
  const currentActiveVoice = activeVoice.value;
  if (!currentActiveVoice || !currentActiveVoice.staffId) {
    console.warn("DebugPanel (needsLedgerLines): Active voice or staffId not found for note", noteFromDebugPanel.id);
    return false;
  }
  const currentActiveStaff = staves.value.find(s => s.id === currentActiveVoice.staffId);
  if (!currentActiveStaff) {
    console.warn("DebugPanel (needsLedgerLines): Active staff not found for note", noteFromDebugPanel.id);
    return false;
  }

  const noteWithContext: NoteWithVoiceInfo = {
    ...noteFromDebugPanel,
    voiceId: currentActiveVoice.id,
    voiceColor: currentActiveVoice.color,
    staffId: currentActiveStaff.id,
    staffClef: currentActiveStaff.clef,
    verticalPosition: noteFromDebugPanel.verticalPosition !== undefined ? noteFromDebugPanel.verticalPosition : getPitchPosition(noteFromDebugPanel.pitch || '', currentActiveStaff.clef)
  };
  return needsLedgerLines(noteWithContext, side, currentActiveStaff.clef);
};

const getLedgerLinesForDebugPanel = (noteFromDebugPanel: ImportedNote, side: "above" | "below"): number[] => {
  const currentActiveVoice = activeVoice.value;
  if (!currentActiveVoice || !currentActiveVoice.staffId) {
    console.warn("DebugPanel (getLedgerLines): Active voice or staffId not found for note", noteFromDebugPanel.id);
    return [];
  }
  const currentActiveStaff = staves.value.find(s => s.id === currentActiveVoice.staffId);
  if (!currentActiveStaff) {
    console.warn("DebugPanel (getLedgerLines): Active staff not found for note", noteFromDebugPanel.id);
    return [];
  }

  const noteWithContext: NoteWithVoiceInfo = {
    ...noteFromDebugPanel,
    voiceId: currentActiveVoice.id,
    voiceColor: currentActiveVoice.color,
    staffId: currentActiveStaff.id,
    staffClef: currentActiveStaff.clef,
    verticalPosition: noteFromDebugPanel.verticalPosition !== undefined ? noteFromDebugPanel.verticalPosition : getPitchPosition(noteFromDebugPanel.pitch || '', currentActiveStaff.clef)
  };
  return getLedgerLines(noteWithContext, side, currentActiveStaff.clef);
};

const deleteNote = (noteToRemove: ImportedNote | NoteWithVoiceInfo) => {
  if (readOnlyMode.value) return;

  // Attempt to get voiceId directly from the note object if it's NoteWithVoiceInfo
  let voiceId = (noteToRemove as NoteWithVoiceInfo).voiceId;

  // If voiceId wasn't on the note object, try the active voice
  if (!voiceId) {
    voiceId = activeVoice.value?.id;
  }

  let noteDeleted = false;

  if (voiceId) {
    const voiceIndex = voiceLayers.value.findIndex(v => v.id === voiceId);
    if (voiceIndex !== -1) {
      const noteIndex = voiceLayers.value[voiceIndex].notes.findIndex(n => n.id === noteToRemove.id);
      if (noteIndex !== -1) {
        // Create a new array reference to ensure Vue detects the change
        const updatedNotes = [...voiceLayers.value[voiceIndex].notes];
        updatedNotes.splice(noteIndex, 1);
        voiceLayers.value[voiceIndex].notes = updatedNotes;

        noteDeleted = true;
        console.log(`Note ${noteToRemove.id} deleted from voice ${voiceId}`);
      }
    }
  }

  // If the note wasn't deleted (e.g., voiceId was wrong or note not in that voice)
  // try searching in all voice layers. This is a fallback for older data.
  if (!noteDeleted) {
    console.warn(`Note ${noteToRemove.id} not found with initial voiceId ${voiceId}. Searching all voice layers.`);
    for (let i = 0; i < voiceLayers.value.length; i++) {
      const currentVoiceLayer = voiceLayers.value[i];
      const noteIndexInCurrentLayer = currentVoiceLayer.notes.findIndex(n => n.id === noteToRemove.id);
      if (noteIndexInCurrentLayer !== -1) {
        // Create a new array reference to ensure Vue detects the change
        const updatedNotes = [...currentVoiceLayer.notes];
        updatedNotes.splice(noteIndexInCurrentLayer, 1);
        voiceLayers.value[i].notes = updatedNotes;

        noteDeleted = true;
        console.log(`Note ${noteToRemove.id} deleted from voice ${currentVoiceLayer.id} (fallback search).`);
        break; // Exit loop once note is found and deleted
      }
    }
  }

  if (noteDeleted) {
    if (selectedNoteId.value === noteToRemove.id) {
      selectedNoteId.value = null; // Deselect if the deleted note was selected
      currentLyric.value = ''; // Clear lyric input if the deleted note was selected
    }

    // Force a complete redraw of the staff
    forceStaffRedraw.value = true;
    nextTick(() => {
      lastUIUpdateTimestamp.value = Date.now();
      // Reset the flag after a brief delay to allow the DOM to update
      setTimeout(() => {
        forceStaffRedraw.value = false;
      }, 50);
    });
  } else {
    console.error(`Failed to delete note ${noteToRemove.id}. Note not found in any voice layer.`);
  }
};

// Update the function to toggle note dotting
// existing code...

// Add this with your other refs
const lastUIUpdateTimestamp = ref(Date.now());

// const allNotesWithVoiceInfo = computed(() => {
//   // Force computed property to re-evaluate when lastUIUpdateTimestamp changes
//   const _ = lastUIUpdateTimestamp.value;

//   let result: NoteWithVoiceInfo[] = [];
//   voiceLayers.value.forEach(voice => {
//     if (voice.visible) {
//       const notesWithInfo = voice.notes.map(note => {
//         const staff = staves.value.find(s => s.id === voice.staffId);
//         return {
//           ...note,
//           voiceId: voice.id,
//           voiceColor: voice.color,
//           staffId: voice.staffId,
//           staffClef: staff?.clef || 'treble'
//         } as NoteWithVoiceInfo;
//       });
//       result = result.concat(notesWithInfo);
//     }
//   });
//   return result;
// });

// Add this with your other refs (if not already there)
const forceStaffRedraw = ref(false);

// --- DELETE THE FOLLOWING BLOCK ---
// This block starting with "if (noteDeleted)" is incorrectly placed here
// and is causing the "noteDeleted is not defined" error at line ~5030.
// The correct logic is already inside your `deleteNote` function.

/*
if (noteDeleted) { // THIS IS THE LINE CAUSING THE ERROR
  if (selectedNoteId.value === noteToRemove.id) {
    selectedNoteId.value = null;
    currentLyric.value = '';
  }
  
  // Force a complete redraw of the staff
  forceStaffRedraw.value = true;
  nextTick(() => {
    lastUIUpdateTimestamp.value = Date.now();
    // Reset the flag after a brief delay to allow the DOM to update
    setTimeout(() => {
      forceStaffRedraw.value = false;
    }, 50);
  });
} else {
  console.error(`Failed to delete note ${noteToRemove.id}. Note not found in any voice layer.`);
}
*/
// --- END OF BLOCK TO DELETE ---


// Add this watcher to trigger manual redraw for custom rendering
watch([forceStaffRedraw, lastUIUpdateTimestamp], ([force, timestamp], [oldForce, oldTimestamp]) => {
  if (force || timestamp !== oldTimestamp) {
    nextTick(() => {
      // Instead of trying to call a redrawStaff function that doesn't exist,
      // rely on the :key binding on the notation-area div to trigger the re-render
      console.log("Staff redraw triggered by timestamp change or force flag");
      // If you have a specific redraw function, call it here
    });
  }
});

// existing code...

const allNotesWithVoiceInfo = computed(() => {
  // Force computed property to re-evaluate when lastUIUpdateTimestamp changes
  const _ = lastUIUpdateTimestamp.value;

  let result: NoteWithVoiceInfo[] = [];
  voiceLayers.value.forEach(voice => {
    if (voice.visible) {
      const notesWithInfo = voice.notes.map(note => {
        const staff = staves.value.find(s => s.id === voice.staffId);
        return {
          ...note,
          voiceId: voice.id,
          voiceColor: voice.color,
          staffId: voice.staffId,
          staffClef: staff?.clef || 'treble'
        } as NoteWithVoiceInfo;
      });
      result = result.concat(notesWithInfo);
    }
  });
  return result;
});

// Add this watcher to trigger manual redraw for custom rendering
watch([forceStaffRedraw, lastUIUpdateTimestamp], ([force, timestamp], [oldForce, oldTimestamp]) => {
  if (force || timestamp !== oldTimestamp) {
    nextTick(() => {
      // Instead of trying to call a redrawStaff function that doesn't exist,
      // rely on the :key binding on the notation-area div to trigger the re-render
      console.log("Staff redraw triggered by timestamp change or force flag");
      // If you have a specific redraw function, call it here
    });
  }
});

// existing code...

// Add these new refs near the top of the script section
const isInsertingSpace = ref(false);
const insertSpaceWidth = ref(1); // Default width of 1 grid unit (25px)

// Add tie/slur creation refs
const isCreatingTieSlur = ref(false);
const tieSlurStartNote = ref<NoteWithVoiceInfo | null>(null);

// Add key signature change refs
const isAddingKeySignatureChange = ref(false);
const newKeySignature = ref('C');

// Add this new function to handle space insertion
const insertSpace = (event: MouseEvent, staffId: string) => {
  if (readOnlyMode.value || !isInsertingSpace.value) return;

  const staffRect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const x = event.clientX - staffRect.left;
  const insertPosition = Math.floor(x / 25) + 0.5; // Grid-aligned position using 25px grid

  // Get all voices on this staff
  const voicesOnStaff = voiceLayers.value.filter(v => v.staffId === staffId);

  voicesOnStaff.forEach(voice => {
    // Shift all notes that come after the insertion point
    voice.notes = voice.notes.map(note => {
      if (note.position >= insertPosition) {
        return {
          ...note,
          position: note.position + insertSpaceWidth.value
        };
      }
      return note;
    });
  });

  // Shift chord symbols if they exist
  if (chordSymbols.value.length > 0) {
    chordSymbols.value = chordSymbols.value.map(chord => {
      if (chord.position >= insertPosition) {
        return {
          ...chord,
          position: chord.position + insertSpaceWidth.value
        };
      }
      return chord;
    });
  }

  // Update sections if they exist
  sections.value = sections.value.map(section => {
    const updatedSection = { ...section };
    if (section.startMeasure > Math.floor(insertPosition / 4)) {
      updatedSection.startMeasure += Math.ceil(insertSpaceWidth.value / 4);
    }
    if (section.endMeasure >= Math.floor(insertPosition / 4)) {
      updatedSection.endMeasure += Math.ceil(insertSpaceWidth.value / 4);
    }
    return updatedSection;
  });

  // Extend staff width if needed
  const newRequiredWidth = staffWidth.value + (insertSpaceWidth.value * 25);
  if (newRequiredWidth > staffWidth.value) {
    staffWidth.value = newRequiredWidth;
  }

  // Exit insert mode after insertion
  isInsertingSpace.value = false;
  saveToLocalStorage();
};

// Add the event listener in onMounted
onMounted(() => {
  // ... existing onMounted code ...
  window.addEventListener('keydown', handleKeyPress);
});

// Clean up in onBeforeUnmount
onBeforeUnmount(() => {
  // ... existing onBeforeUnmount code ...
  window.removeEventListener('keydown', handleKeyPress);
});

// Add these new refs near the other space-related refs
const isDeletingSpace = ref(false);
const deleteSpaceWidth = ref(1); // Default width of 1 grid unit (25px)

// Add this new function to handle space deletion
const deleteSpace = (event: MouseEvent, staffId: string) => {
  if (readOnlyMode.value || !isDeletingSpace.value) return;

  const staffRect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const x = event.clientX - staffRect.left;
  const deletePosition = Math.floor(x / 25) + 0.5; // Grid-aligned position using 25px grid

  // Get all voices on this staff
  const voicesOnStaff = voiceLayers.value.filter(v => v.staffId === staffId);

  // Check if there's enough space to delete
  const hasEnoughSpace = voicesOnStaff.every(voice => {
    const notesAfterPosition = voice.notes.filter(note => note.position > deletePosition);
    const minPosition = Math.min(...notesAfterPosition.map(note => note.position));
    return minPosition - deletePosition >= deleteSpaceWidth.value || notesAfterPosition.length === 0;
  });

  if (!hasEnoughSpace) {
    alert('Cannot delete space: notes are too close together');
    return;
  }

  voicesOnStaff.forEach(voice => {
    // Shift all notes that come after the deletion point
    voice.notes = voice.notes.map(note => {
      if (note.position > deletePosition) {
        return {
          ...note,
          position: Math.max(deletePosition, note.position - deleteSpaceWidth.value)
        };
      }
      return note;
    });
  });

  // Shift chord symbols if they exist
  if (chordSymbols.value.length > 0) {
    chordSymbols.value = chordSymbols.value.map(chord => {
      if (chord.position > deletePosition) {
        return {
          ...chord,
          position: Math.max(deletePosition, chord.position - deleteSpaceWidth.value)
        };
      }
      return chord;
    });
  }

  // Update sections if they exist
  sections.value = sections.value.map(section => {
    const updatedSection = { ...section };
    const deletePositionMeasure = Math.floor(deletePosition / 4);
    if (section.startMeasure > deletePositionMeasure) {
      updatedSection.startMeasure = Math.max(
        1,
        section.startMeasure - Math.ceil(deleteSpaceWidth.value / 4)
      );
    }
    if (section.endMeasure > deletePositionMeasure) {
      updatedSection.endMeasure = Math.max(
        updatedSection.startMeasure,
        section.endMeasure - Math.ceil(deleteSpaceWidth.value / 4)
      );
    }
    return updatedSection;
  });

  // Reduce staff width if possible
  const newWidth = staffWidth.value - (deleteSpaceWidth.value * 25);
  const minWidth = Math.max(
    ...voiceLayers.value.flatMap(v => v.notes.map(n => n.position * 25))
  ) + 200; // Add some padding
  staffWidth.value = Math.max(minWidth, newWidth);

  // Exit delete mode after deletion
  isDeletingSpace.value = false;
  saveToLocalStorage();
};

// Add this computed property near other space-related refs
const spaceWidth = computed({
  get() {
    return isInsertingSpace.value ? insertSpaceWidth.value : deleteSpaceWidth.value;
  },
  set(value: number) {
    if (isInsertingSpace.value) {
      insertSpaceWidth.value = value;
    } else {
      deleteSpaceWidth.value = value;
    }
  }
});

// Add these refs for copy/paste functionality
const isSelectingRange = ref(false);
const selectionStart = ref<{ position: number; staffId: string; } | null>(null);
const selectionEnd = ref<{ position: number; staffId: string; } | null>(null);
const copiedNotes = ref<NoteWithVoiceInfo[]>([]);

// Add refs for time signature changes
const timeSignatureChanges = ref<TimeSignatureChange[]>([]);
const isAddingTimeSignatureChange = ref(false);
const newTimeSignatureNumerator = ref(4);
const newTimeSignatureDenominator = ref(4);

// Add this function to handle range selection
const handleRangeSelection = (event: MouseEvent, staffId: string) => {
  if (!isSelectingRange.value) return;

  const staffRect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const x = event.clientX - staffRect.left;
  const position = Math.floor(x / 25) + 0.5;

  if (!selectionStart.value) {
    selectionStart.value = { position, staffId };
  } else {
    selectionEnd.value = { position, staffId };
  }
};

// Add function to get selected notes and related elements
const getSelectedNotes = (): { notes: NoteWithVoiceInfo[]; tiesSlurs: TieSlur[]; clefChanges: ClefChange[]; } => {
  if (!selectionStart.value || !selectionEnd.value) return { notes: [], tiesSlurs: [], clefChanges: [] };

  // Only select notes if the selection starts and ends on the same staff
  if (selectionStart.value.staffId !== selectionEnd.value.staffId) {
    alert('Selection must be within the same staff');
    return { notes: [], tiesSlurs: [], clefChanges: [] };
  }

  const startPos = Math.min(selectionStart.value.position, selectionEnd.value.position);
  const endPos = Math.max(selectionStart.value.position, selectionEnd.value.position);
  const targetStaffId = selectionStart.value.staffId;

  let selectedNotes: NoteWithVoiceInfo[] = [];
  voiceLayers.value.forEach(voice => {
    // Only process voices that belong to the target staff
    if (voice.staffId !== targetStaffId) return;

    const staff = staves.value.find(s => s.id === voice.staffId);
    if (!staff) return;

    const notesInRange = voice.notes
      .filter(note => note.position >= startPos && note.position <= endPos)
      .map(note => ({
        ...note,
        voiceId: voice.id,
        voiceColor: voice.color,
        staffId: voice.staffId,
        staffClef: staff.clef,
        originalPosition: note.position, // Store original position for relative placement
        lyric: note.lyric // Make sure to include lyrics
      }));

    selectedNotes = [...selectedNotes, ...notesInRange];
  });

  // Get all ties and slurs that involve the selected notes
  const selectedTiesSlurs = tiesSlurs.value.filter(ts => {
    const startNote = selectedNotes.find(n => n.id === ts.startNoteId);
    const endNote = selectedNotes.find(n => n.id === ts.endNoteId);
    // Include if both notes are in the selection
    return startNote && endNote;
  }).map(ts => ({
    ...ts,
    originalStartNoteId: ts.startNoteId,
    originalEndNoteId: ts.endNoteId
  }));

  // Get clef changes within the selected range
  const selectedClefChanges = clefChanges.value
    .filter(cc => cc.staffId === targetStaffId && cc.position >= startPos && cc.position <= endPos)
    .map(cc => ({
      ...cc,
      relativePosition: cc.position - startPos
    }));

  return {
    notes: selectedNotes,
    tiesSlurs: selectedTiesSlurs,
    clefChanges: selectedClefChanges
  };
};

// Add these refs for lyrics-only copy/paste
const isLyricsCopyMode = ref(false);
const copiedLyrics = ref<Array<{ position: number; lyric: string; }>>([]);

// Add refs for copied elements
const copiedTiesSlurs = ref<(TieSlur & { originalStartNoteId: string; originalEndNoteId: string; })[]>([]);
const copiedClefChanges = ref<(ClefChange & { relativePosition: number; })[]>([]);

// Modify the copySelectedNotes function to handle lyrics-only copying and additional elements
const copySelectedNotes = (lyricsOnly = false) => {
  const selected = getSelectedNotes();
  if (selected.notes.length === 0) {
    alert('No notes selected');
    return;
  }

  if (lyricsOnly) {
    // Store only the positions and lyrics
    const minPosition = Math.min(...selected.notes.map(n => n.position));
    copiedLyrics.value = selected.notes
      .filter(note => note.lyric) // Only copy notes that have lyrics
      .map(note => ({
        position: note.position - minPosition, // Store relative position
        lyric: note.lyric || ''
      }));

    // Clear selection and enable paste mode
    selectionStart.value = null;
    selectionEnd.value = null;
    isSelectingRange.value = false;
    isPasting.value = true;
    isLyricsCopyMode.value = true;

    alert(`Copied ${copiedLyrics.value.length} lyrics. Click to paste or press Escape to cancel.`);
  } else {
    // Copy notes with relative positions
    const minPosition = Math.min(...selected.notes.map(n => n.position));
    copiedNotes.value = selected.notes.map(note => ({
      ...note,
      relativePosition: note.position - minPosition
    }));

    // Copy ties and slurs with all required properties
    const selectionStaffId = selectionStart.value?.staffId || '';
    copiedTiesSlurs.value = selected.tiesSlurs.map(ts => ({
      ...ts,
      originalStartNoteId: ts.startNoteId,
      originalEndNoteId: ts.endNoteId,
      staffId: selectionStaffId,
      curvature: ts.curvature || 'above'
    }));

    // Copy clef changes with all required properties
    copiedClefChanges.value = selected.clefChanges.map(cc => ({
      ...cc,
      relativePosition: cc.position - minPosition,
      measure: Math.floor(cc.position / 4), // Calculate measure number based on position
      staffId: selectionStaffId
    }));

    // Clear selection and enable paste mode
    selectionStart.value = null;
    selectionEnd.value = null;
    isSelectingRange.value = false;
    isPasting.value = true;
    isLyricsCopyMode.value = false;

    alert(`Copied ${selected.notes.length} notes, ${selected.tiesSlurs.length} ties/slurs, and ${selected.clefChanges.length} clef changes. Click to paste or press Escape to cancel.`);
  }
};

// Modify the pasteNotes function to handle lyrics-only pasting
const pasteNotes = (event: MouseEvent, targetStaffId: string) => {
  if (isLyricsCopyMode.value) {
    if (copiedLyrics.value.length === 0) {
      alert('No lyrics copied');
      return;
    }

    const staffRect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = event.clientX - staffRect.left;
    const pastePosition = Math.floor(x / 25) + 0.5;

    // Find the active voice layer
    const activeVoiceLayer = voiceLayers.value.find(v => v.active);
    if (!activeVoiceLayer) {
      alert('No active voice layer selected');
      return;
    }

    // Get notes in the target area
    const targetNotes = activeVoiceLayer.notes.filter(note =>
      note.position >= pastePosition &&
      note.position < pastePosition + Math.max(...copiedLyrics.value.map(l => l.position)) + 1
    );

    // Apply lyrics to notes based on relative positions
    copiedLyrics.value.forEach(lyricData => {
      const targetNote = targetNotes.find(note =>
        Math.abs((note.position - pastePosition) - lyricData.position) < 0.1
      );
      if (targetNote) {
        targetNote.lyric = lyricData.lyric;
      }
    });

    // Exit paste mode
    isPasting.value = false;
    isLyricsCopyMode.value = false;
    copiedLyrics.value = [];
    saveToLocalStorage();
  } else {
    // Original note pasting logic
    if (copiedNotes.value.length === 0) {
      alert('No notes copied');
      return;
    }

    const staffRect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = event.clientX - staffRect.left;
    const pastePosition = Math.floor(x / 25) + 0.5;

    // Get target staff
    const targetStaff = staves.value.find(s => s.id === targetStaffId);
    if (!targetStaff) return;

    // Find the active voice layer
    const activeVoiceLayer = voiceLayers.value.find(v => v.active);
    if (!activeVoiceLayer) {
      alert('No active voice layer selected');
      return;
    }

    // Create a map to track old note IDs to new note IDs for ties/slurs
    const noteIdMap = new Map<string, string>();

    // Add all notes to the active voice layer
    copiedNotes.value.forEach(note => {
      const newId = generateId();
      noteIdMap.set(note.id, newId);
      
      const newNote = {
        ...note,
        id: newId,
        // Use the relative position from the paste point
        position: pastePosition + (note.relativePosition || 0),
        voiceId: activeVoiceLayer.id,
        staffId: activeVoiceLayer.staffId,
        staffClef: targetStaff.clef,
        // Preserve the original vertical position for both notes and rests
        verticalPosition: note.verticalPosition,
        // Add a scale factor of 0.75 for rest sizes
        scale: note.type === 'rest' ? 0.75 : 1,
        lyric: note.lyric // Preserve lyrics
      };
      activeVoiceLayer.notes.push(newNote);
    });

    // Add ties and slurs with updated note IDs
    copiedTiesSlurs.value.forEach(ts => {
      const newStartNoteId = noteIdMap.get(ts.originalStartNoteId);
      const newEndNoteId = noteIdMap.get(ts.originalEndNoteId);
      
      if (newStartNoteId && newEndNoteId) {
        tiesSlurs.value.push({
          id: generateId(),
          type: ts.type,
          startNoteId: newStartNoteId,
          endNoteId: newEndNoteId,
          staffId: targetStaffId,
          curvature: ts.curvature || 'above'
        });
      }
    });

    // Add clef changes
    copiedClefChanges.value.forEach(cc => {
      const newPosition = pastePosition + cc.relativePosition;
      clefChanges.value.push({
        id: generateId(),
        staffId: targetStaffId,
        position: newPosition,
        clef: cc.clef,
        measure: Math.floor(newPosition / 4) // Calculate measure number based on position
      });
    });

    // Exit paste mode
    isPasting.value = false;
    copiedNotes.value = [];
    copiedTiesSlurs.value = [];
    copiedClefChanges.value = [];
    saveToLocalStorage();
  }
};

// Update the cancelPaste function
const cancelPaste = () => {
  isPasting.value = false;
  isLyricsCopyMode.value = false;
  copiedNotes.value = [];
  copiedLyrics.value = [];
};

// Add this with the other refs near the top of the script section
const isPasting = ref(false);

// Add this ref to track if we're currently editing text
const isEditingText = computed(() => {
  // Check if the active element is an input or textarea
  const activeElement = document.activeElement;
  return (
    activeElement instanceof HTMLInputElement ||
    activeElement instanceof HTMLTextAreaElement ||
    // Also check for specific editing states
    editingStaffNameId.value !== null ||
    editingComposition.value !== '' ||
    currentLyric.value !== ''
  );
});

// Update the keyboard shortcut handler
const handleKeyPress = (event: KeyboardEvent) => {
  // Check if we're editing text in any input or contenteditable element
  const activeElement = document.activeElement;
  const isEditingText = (
    activeElement instanceof HTMLInputElement ||
    activeElement instanceof HTMLTextAreaElement ||
    activeElement?.hasAttribute('contenteditable') ||
    editingStaffNameId.value !== null
  );

  // Ignore shortcuts if we're editing text
  if (isEditingText) {
    return;
  }

  if (!event.ctrlKey && !event.metaKey && !event.altKey) {
    if (event.key === 'Escape') {
      // Cancel paste mode if active
      if (isPasting.value) {
        cancelPaste();
        return;
      }
      // Cancel other modes and clear selection
      isInsertingSpace.value = false;
      isDeletingSpace.value = false;
      isCreatingTieSlur.value = false;
      tieSlurStartNote.value = null;
      isAddingKeySignatureChange.value = false;
      clearSelection();
    } else if (event.key === 'r') {
      isSelectingRange.value ? clearSelection() : isSelectingRange.value = true;
      isInsertingSpace.value = false;
      isDeletingSpace.value = false;
      isPasting.value = false;
      isCreatingTieSlur.value = false;
      tieSlurStartNote.value = null;
      if (isSelectingRange.value) {
        alert('Range selection mode activated. Click to set start and end points. Press "r" again to cancel.');
      }
    } else if (event.key === 'i') {
      isInsertingSpace.value = !isInsertingSpace.value;
      isDeletingSpace.value = false;
      isSelectingRange.value = false;
      isPasting.value = false;
      isCreatingTieSlur.value = false;
      tieSlurStartNote.value = null;
      isAddingKeySignatureChange.value = false;
      if (isInsertingSpace.value) {
        alert('Space insertion mode activated. Click where you want to insert space. Press "i" again to cancel.');
      }
    } else if (event.key === 'd') {
      isDeletingSpace.value = !isDeletingSpace.value;
      isInsertingSpace.value = false;
      isSelectingRange.value = false;
      isPasting.value = false;
      isCreatingTieSlur.value = false;
      tieSlurStartNote.value = null;
      isAddingKeySignatureChange.value = false;
      if (isDeletingSpace.value) {
        alert('Space deletion mode activated. Click where you want to delete space. Press "d" again to cancel.');
      }
    } else if (event.key === 't') {
      toggleTieSlurMode();
      if (isCreatingTieSlur.value) {
        alert('Tie/Slur mode activated. Click first note, then second note. Same pitch = Tie, Different pitch = Slur. Press "t" again to cancel.');
      }
    } else if (event.key === 'k') {
      toggleKeySignatureChangeMode();
      if (isAddingKeySignatureChange.value) {
        alert('Key signature change mode activated. Click on a measure to insert key change. Press "k" again to cancel.');
      }
    } else if (event.key === 'm') {
      toggleTimeSignatureChangeMode();
      if (isAddingTimeSignatureChange.value) {
        alert('Time signature change mode activated. Click on a measure to insert time change. Press "m" again to cancel.');
      }
    } else if (event.key === 'c' && isSelectingRange.value) {
      copySelectedNotes();
    }
  }
};

// Add this function to clear selection
const clearSelection = () => {
  selectionStart.value = null;
  selectionEnd.value = null;
  isSelectingRange.value = false;
};

// Add tie/slur functions
const toggleTieSlurMode = () => {
  isCreatingTieSlur.value = !isCreatingTieSlur.value;
  if (!isCreatingTieSlur.value) {
    tieSlurStartNote.value = null;
  }
  // Reset other modes
  isInsertingSpace.value = false;
  isDeletingSpace.value = false;
  isSelectingRange.value = false;
  isPasting.value = false;
  isAddingKeySignatureChange.value = false;
};

// Add key signature change functions
const toggleKeySignatureChangeMode = () => {
  isAddingKeySignatureChange.value = !isAddingKeySignatureChange.value;
  // Reset other modes
  isInsertingSpace.value = false;
  isDeletingSpace.value = false;
  isSelectingRange.value = false;
  isPasting.value = false;
  isCreatingTieSlur.value = false;
  tieSlurStartNote.value = null;
};

// Function to add a key signature change at a specific measure
const addKeySignatureChange = (event: MouseEvent, staffId: string) => {
  if (readOnlyMode.value || !isAddingKeySignatureChange.value) return;

  const staffRect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const x = event.clientX - staffRect.left;
  
  // Calculate which measure was clicked
  const measureWidth = measureWidthByTimeSignature.value;
  // Use the same calculation as getEffectiveKeySignatureAtPosition
  const globalKeySignatureWidth = (keySignatures[keySignature.value] || []).length * 10;
  const initialPosition = 70 + globalKeySignatureWidth + 20;
  
  const relativePosition = x - initialPosition;
  const measureNumber = Math.floor(relativePosition / measureWidth) + 1;
  
  // Don't allow key signature change in measure 1 (use global key signature instead)
  if (measureNumber < 2) {
    alert('Key signature changes cannot be placed in measure 1. Use the global key signature setting instead.');
    return;
  }
  
  // Check if there's already a key signature change at this measure
  const existingChange = keySignatureChanges.value.find(change => change.measure === measureNumber);
  if (existingChange) {
    // Update existing change
    existingChange.keySignature = newKeySignature.value;
  } else {
    // Create new change only if there isn't an existing one
    const newChange: KeySignatureChange = {
      id: generateId(),
      measure: measureNumber,
      keySignature: newKeySignature.value,
      position: initialPosition + ((measureNumber - 1) * measureWidth) + 5 // Small offset from measure line
    };
    keySignatureChanges.value.push(newChange);
  }
  
  // Sort key signature changes by measure
  keySignatureChanges.value.sort((a, b) => a.measure - b.measure);
  
  // Clear the key signature cache since changes were made
  clearKeySignatureCache();
  
  // Exit key signature change mode
  isAddingKeySignatureChange.value = false;
  saveToLocalStorage();
  
};

// Helper function to handle tied note playback
const playNoteWithTieHandling = (noteToPlay: NoteWithVoiceInfo, voice: VoiceLayer | undefined) => {
  if (noteToPlay.type !== 'note' || !noteToPlay.pitch) return { isPlaying: false, totalDurationMs: 0 };
  
  // Check if this note is tied from another note (should be silent)
  if (isNoteTiedFrom(noteToPlay)) {
    return { isPlaying: false, totalDurationMs: 0 }; // Skip playing this note as it's tied from a previous note
  }

  const toneDurationMap = {
    'whole': '1n',
    'half': '2n',
    'quarter': '4n',
    'eighth': '8n',
    'sixteenth': '16n'
  };

  // Calculate total duration if this note is tied to others
  const totalTiedDuration = getTotalTiedDuration(noteToPlay);
  
  // Get the measure number for this note
  const measureNumber = getNotesMeasure(noteToPlay);
  
  // Get the effective time signature and tempo for this measure
  const timeSignature = getEffectiveTimeSignatureAtMeasure(measureNumber);
  const measureTempo = getTempoForMeasure(measureNumber);
  
  // Convert total duration in beats to seconds, using measure-specific tempo
  const secondsPerBeat = 60 / measureTempo;
  const totalDurationInSeconds = totalTiedDuration * secondsPerBeat;
  const totalDurationMs = totalDurationInSeconds * 1000;
  
  const currentVoiceVolumePercent = voice ? voice.volume : 100;

  // For playback, apply the key signature and handle clef changes at the note's position
  let pitchToPlay = noteToPlay.pitch;
  
  // Get the staff ID for this note through the voice
  const staffId = voice?.staffId;
  if (staffId) {
    // Get the effective clef at this position
    const effectiveClef = getEffectiveClefAtPosition(noteToPlay.position * 25, staffId);
    const staff = staves.value.find(s => s.id === staffId);
    const originalClef = staff?.clef || 'treble';
    
    // If the clef has changed, we need to adjust the pitch
    if (effectiveClef !== originalClef) {
      // Extract the note letter and octave
      const noteLetter = pitchToPlay.charAt(0);
      const hasAccidental = pitchToPlay.includes('#') || pitchToPlay.includes('b');
      const accidental = hasAccidental ? pitchToPlay.charAt(1) : '';
      const octave = parseInt(pitchToPlay.slice(hasAccidental ? -1 : -1));
      
      // Adjust octave based on clef change
      let newOctave = octave;
      if (originalClef === 'treble' && effectiveClef === 'bass') {
        newOctave = octave - 2; // Move down two octaves for treble to bass
      } else if (originalClef === 'bass' && effectiveClef === 'treble') {
        newOctave = octave + 2; // Move up two octaves for bass to treble
      }
      
      // Reconstruct the pitch with the new octave
      pitchToPlay = `${noteLetter}${accidental}${newOctave}`;
    }
  }
  
  // Handle key signature changes
  const effectiveKey = getEffectiveKeySignatureAtPosition(noteToPlay.position * 25);
  const globalKey = keySignature.value;
  
  // Always get the natural form first
  const naturalPitch = reverseKeySignature(pitchToPlay, globalKey);
  
  // Then apply the effective key signature
  const convertedPitch = getModifiedPitchForKeySignature(naturalPitch, false, noteToPlay.position);
  
  if (convertedPitch !== pitchToPlay) {
    pitchToPlay = convertedPitch;
  } else if (effectiveKey !== globalKey) {
  }

  // Check if this note is part of a slur
  const slur = tiesSlurs.value.find(ts => 
    ts.type === 'slur' && 
    (ts.startNoteId === noteToPlay.id || ts.endNoteId === noteToPlay.id)
  );

  // Check if this is the last note in a slur (for slightly softer volume)
  const isLastInSlur = slur && slur.endNoteId === noteToPlay.id;

  // Use custom duration for tied notes, otherwise use original duration
  if (totalTiedDuration !== getNoteDurationInBeats(noteToPlay.duration, noteToPlay.dotted, noteToPlay.triplet)) {
    // This note is tied - play for the total tied duration
    playNoteSound(
      pitchToPlay,
      `${totalDurationInSeconds}s`, // Use seconds duration for tied notes
      false, // Don't apply dotted modifier as it's already included in total duration
      isLastInSlur ? currentVoiceVolumePercent * 0.8 : currentVoiceVolumePercent, // Slightly softer for last note in slur
      noteToPlay.explicitNatural,
      noteToPlay.triplet,
      noteToPlay.position
    );
    return { isPlaying: true, totalDurationMs };
  } else {
        // This note is not tied - play normally
    const toneDuration = toneDurationMap[noteToPlay.duration] || '4n';
      
    playNoteSound(
      pitchToPlay,
      toneDuration,
      noteToPlay.dotted,
      isLastInSlur ? currentVoiceVolumePercent * 0.8 : currentVoiceVolumePercent, // Slightly softer for last note in slur
      noteToPlay.explicitNatural,
      noteToPlay.triplet,
      noteToPlay.position
    );
    return { isPlaying: true, totalDurationMs: 0 }; // 0 means use standard duration
  }
};

const createTieSlur = (startNote: NoteWithVoiceInfo, endNote: NoteWithVoiceInfo) => {
  if (startNote.staffId !== endNote.staffId) {
    alert('Ties and slurs can only connect notes on the same staff');
    return;
  }

  // Determine if it's a tie or slur based on pitch
  const isTie = startNote.pitch === endNote.pitch;
  const type = isTie ? 'tie' : 'slur';

  // Determine curvature based on note positions
  const curvature = determineCurvature(startNote, endNote);

  const newTieSlur: TieSlur = {
    id: generateId(),
    type,
    startNoteId: startNote.id,
    endNoteId: endNote.id,
    staffId: startNote.staffId,
    curvature
  };

  tiesSlurs.value.push(newTieSlur);
  console.log(`Created ${type} from ${startNote.pitch} to ${endNote.pitch}`);
  
  // Reset tie/slur creation mode
  isCreatingTieSlur.value = false;
  tieSlurStartNote.value = null;
  saveToLocalStorage();
};

const determineCurvature = (startNote: NoteWithVoiceInfo, endNote: NoteWithVoiceInfo): 'above' | 'below' => {
  // Get all notes on the same staff between the start and end positions
  const startPos = Math.min(startNote.position, endNote.position);
  const endPos = Math.max(startNote.position, endNote.position);
  
  const notesInPath = allVisibleNotes.value.filter(note => 
    note.staffId === startNote.staffId &&
    note.position > startPos &&
    note.position < endPos &&
    note.type === 'note'
  );
  
  // If there are notes in the path, curve above them to avoid overlap
  if (notesInPath.length > 0) {
    return 'above';
  }
  
  // If there are no notes in the path, use position-based logic
  const averagePosition = (startNote.verticalPosition + endNote.verticalPosition) / 2;
  const staffCenter = 145; // Middle line of staff
  const result = averagePosition < staffCenter ? 'below' : 'above';
  return result;
};

const removeTieSlur = (tieSlurId: string) => {
  const index = tiesSlurs.value.findIndex(ts => ts.id === tieSlurId);
  if (index !== -1) {
    tiesSlurs.value.splice(index, 1);
    saveToLocalStorage();
  }
};

const getTieSlurPath = (tieSlur: TieSlur): string => {
  // Find the start and end notes
  const startNote = allVisibleNotes.value.find(note => note.id === tieSlur.startNoteId);
  const endNote = allVisibleNotes.value.find(note => note.id === tieSlur.endNoteId);
  
  if (!startNote || !endNote) return '';

  const startX = startNote.position * 25 + 10; // Note center
  const endX = endNote.position * 25 + 10;
  
  // Adjust starting and ending points to avoid overlapping with note heads
  const noteHeadRadius = 8; // Approximate note head radius
  const clearance = 8; // Additional clearance from note
  
  // Calculate the average note position for determining curve direction if needed
  const avgY = (startNote.verticalPosition + endNote.verticalPosition) / 2;
  
  // Determine start and end Y positions with proper clearance
  let startY, endY;
  if (tieSlur.curvature === 'above') {
    startY = startNote.verticalPosition - noteHeadRadius - clearance;
    endY = endNote.verticalPosition - noteHeadRadius - clearance;
  } else {
    startY = startNote.verticalPosition + noteHeadRadius + clearance;
    endY = endNote.verticalPosition + noteHeadRadius + clearance;
  }

  // Calculate curve control points
  const midX = (startX + endX) / 2;
  const baseDistance = Math.abs(endX - startX);
  const curveHeight = Math.max(15, baseDistance * 0.2); // Minimum curve height of 15px
  
  const curveOffset = tieSlur.curvature === 'above' ? -curveHeight : curveHeight;
  const midY = (startY + endY) / 2 + curveOffset;

  // Create SVG path for quadratic curve
  return `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`;
};

const getTieSlurColor = (tieSlur: TieSlur): string => {
  // Find the start note to get the voice color
  const startNote = allVisibleNotes.value.find(note => note.id === tieSlur.startNoteId);
  
  if (startNote && startNote.voiceColor) {
    return startNote.voiceColor;
  }
  
  // Fallback to default colors if voice color not found
  return tieSlur.type === 'tie' ? '#2196F3' : '#4CAF50';
};

// Add clef change state and functions
const isAddingClefChange = ref(false);
const newClef = ref<'treble' | 'bass'>('treble');
const clefChanges = ref<ClefChange[]>([]);

// Add this function to toggle clef change mode
const toggleClefChangeMode = () => {
  isAddingClefChange.value = !isAddingClefChange.value;
  // Reset other modes
  isInsertingSpace.value = false;
  isDeletingSpace.value = false;
  isSelectingRange.value = false;
  isPasting.value = false;
  isCreatingTieSlur.value = false;
  tieSlurStartNote.value = null;
  isAddingKeySignatureChange.value = false;
  isAddingTimeSignatureChange.value = false;
};

// Add this function to remove a clef change
const removeClefChange = (changeId: string) => {
  if (readOnlyMode.value) return;

  const index = clefChanges.value.findIndex(change => change.id === changeId);
  if (index !== -1) {
    const change = clefChanges.value[index];
    if (confirm(`Remove clef change to ${change.clef} clef at measure ${change.measure}?`)) {
      clefChanges.value.splice(index, 1);
      saveToLocalStorage();
    }
  }
};

// Add this function to add a clef change
const addClefChange = (event: MouseEvent, staffId: string) => {
  if (readOnlyMode.value || !isAddingClefChange.value) return;

  const staffRect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const x = event.clientX - staffRect.left;
  
  // Calculate which measure was clicked
  const measureWidth = measureWidthByTimeSignature.value;
  const globalKeySignatureWidth = (keySignatures[keySignature.value] || []).length * 10;
  const initialPosition = 70 + globalKeySignatureWidth + 20;
  
  const relativePosition = x - initialPosition;
  const measureNumber = Math.floor(relativePosition / measureWidth) + 1;
  
  // Don't allow clef change in measure 1 (use staff clef setting instead)
  if (measureNumber < 2) {
    alert('Clef changes cannot be placed in measure 1. Use the staff clef setting instead.');
    return;
  }
  
  // Check if there's already a clef change at this measure for this staff
  const existingChange = clefChanges.value.find(change => 
    change.measure === measureNumber && change.staffId === staffId
  );
  
  if (existingChange) {
    // Update existing change
    existingChange.clef = newClef.value;
  } else {
    // Create new change
    const newChange: ClefChange = {
      id: generateId(),
      measure: measureNumber,
      clef: newClef.value,
      position: initialPosition + ((measureNumber - 1) * measureWidth) + 5,
      staffId: staffId
    };
    console.log(`➕ Creating NEW clef change: ${newClef.value} at measure ${measureNumber}, position ${newChange.position}`);
    clefChanges.value.push(newChange);
  }
  
  // Sort clef changes by measure
  clefChanges.value.sort((a, b) => a.measure - b.measure);
  
  // Exit clef change mode
  isAddingClefChange.value = false;
  saveToLocalStorage();
  
};

// Add this function to get the effective clef at a specific position for a staff
const getEffectiveClefAtPosition = (position: number, staffId: string): 'treble' | 'bass' => {
  const staff = staves.value.find(s => s.id === staffId);
  if (!staff) return 'treble';

  // Find the most recent clef change at or before this position
  const applicableChanges = clefChanges.value
    .filter(change => change.staffId === staffId && change.position <= position)
    .sort((a, b) => b.position - a.position);

  return applicableChanges.length > 0 ? applicableChanges[0].clef : staff.clef;
};

</script>

<style scoped>
/* Tie/Slur SVG Overlay Styles */
.ties-slurs-overlay {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 10;
}

.ties-slurs-overlay path {
  pointer-events: auto;
}

.tie-slur-path {
  transition: stroke-width 0.2s ease;
}

.tie-slur-path:hover {
  stroke-width: 3;
}

.tie-slur-path.tie {
  stroke-dasharray: none;
}

.tie-slur-path.slur {
  stroke-dasharray: 3, 2;
}

/* Tie/Slur button styling */
.tie-slur-btn {
  padding: 8px 16px;
  background-color: #9C27B0;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  font-size: 14px;
  font-weight: 500;
}

.tie-slur-btn.active {
  background-color: #7B1FA2;
}

.tie-slur-btn:hover {
  opacity: 0.9;
}

.tie-slur-info {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
}

/* Visual highlight for notes in tie/slur creation mode */
.note:hover {
  transform: translate(-50%, -50%) scale(1.05);
}

/* Staff cursor changes for different modes */
.staff.tie-slur-mode {
  cursor: crosshair;
}

.staff.key-change-mode {
  cursor: pointer;
}

/* Key signature change styling */
.key-change-btn {
  padding: 8px 16px;
  background-color: #FF5722;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  font-size: 14px;
  font-weight: 500;
}

.key-change-btn.active {
  background-color: #D84315;
}

.key-change-btn:hover {
  opacity: 0.9;
}

.key-change-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 5px;
  font-size: 12px;
}

.key-change-controls select {
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.key-change-info {
  color: #666;
  font-style: italic;
}

/* Time signature change styling */
.time-change-btn {
  padding: 8px 16px;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  font-size: 14px;
  font-weight: 500;
  margin-left: 8px;
}

.time-change-btn.active {
  background-color: #1976D2;
}

.time-change-btn:hover {
  opacity: 0.9;
}

.time-change-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 5px;
  font-size: 12px;
}

.time-sig-select {
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 60px;
}

.time-change-info {
  color: #666;
  font-style: italic;
}

/* Time signature change visual styling */
.time-signature-change {
  position: absolute;
  top: 180px; /* Position just below the staff lines */
  left: 0;
  z-index: 15;
  pointer-events: all;
  min-width: 60px;
}

.time-signature-change.clickable {
  cursor: pointer;
}

.time-change-marker {
  background: linear-gradient(135deg, #2196F3, #42A5F5);
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: bold;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  border: 2px solid #2196F3;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 50px;
}

.time-change-icon {
  font-size: 12px;
  margin-bottom: 2px;
}

.time-change-text {
  font-size: 9px;
  line-height: 1;
}

.time-signature-change.clickable:hover .time-change-marker {
  transform: scale(1.05);
  box-shadow: 0 3px 6px rgba(0,0,0,0.3);
}

.time-signature-change.clickable:hover::after {
  content: '×';
  position: absolute;
  top: -8px;
  right: -8px;
  font-size: 16px;
  color: #f44336;
  background: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  pointer-events: none;
  font-weight: bold;
}

/* Key signature change visual styling */
.key-signature-change {
  position: absolute;
  top: 20px; /* Position above the staff, clear of high notes */
  left: 0;
  z-index: 15;
  pointer-events: all;
  min-width: 60px;
  transform: translateX(70px); /* Move key changes to the right of clef changes */
}

.key-signature-change.clickable {
  cursor: pointer;
}

.key-change-marker {
  background: linear-gradient(135deg, #FF5722, #FF7043);
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: bold;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  border: 2px solid #FF5722;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 50px;
}

.key-change-icon {
  font-size: 12px;
  margin-bottom: 2px;
}

.key-change-text {
  font-size: 9px;
  line-height: 1;
}

.key-signature-change.clickable:hover .key-change-marker {
  transform: scale(1.05);
  box-shadow: 0 3px 6px rgba(0,0,0,0.3);
}

.key-signature-change.clickable:hover::after {
  content: '×';
  position: absolute;
  top: -8px;
  right: -8px;
  font-size: 16px;
  color: #f44336;
  background: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  pointer-events: none;
  font-weight: bold;
}

/* Triplet Bracket Styling */
.triplet-brackets-overlay {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 12; /* Above ties/slurs but below notes */
}

.triplet-bracket-line,
.triplet-bracket-end {
  stroke-linecap: round;
}

.triplet-number {
  pointer-events: none;
  user-select: none;
}

.note.triplet {
  /* Optional: Add subtle visual styling for triplet notes */
  border-radius: 3px;
}

/* Ensure triplet brackets are responsive */
.triplet-brackets-overlay .triplet-bracket-line,
.triplet-brackets-overlay .triplet-bracket-end,
.triplet-brackets-overlay .triplet-number {
  transition: none; /* Prevent animation lag during scrolling */
}

/* Clef change button styling */
.clef-change-btn {
  padding: 8px 16px;
  background-color: #9C27B0;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  font-size: 14px;
  font-weight: 500;
  margin-left: 8px;
}

.clef-change-btn.active {
  background-color: #7B1FA2;
}

.clef-change-btn:hover {
  opacity: 0.9;
}

.clef-change-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 5px;
  font-size: 12px;
}

.clef-change-controls select {
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.clef-change-info {
  color: #666;
  font-style: italic;
}

/* Clef change visual styling */
.clef-change {
  position: absolute;
  top: 20px; /* Position above the staff */
  left: 0;
  z-index: 15;
  pointer-events: all;
  min-width: 60px;
}

.clef-change.clickable {
  cursor: pointer;
}

.clef-change-marker {
  background: linear-gradient(135deg, #9C27B0, #BA68C8);
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: bold;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  border: 2px solid #9C27B0;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 50px;
}

.clef-change-icon {
  font-size: 16px;
  margin-bottom: 2px;
}

.clef-change-text {
  font-size: 9px;
  line-height: 1;
}

.clef-change.clickable:hover .clef-change-marker {
  transform: scale(1.05);
  box-shadow: 0 3px 6px rgba(0,0,0,0.3);
}

.clef-change.clickable:hover::after {
  content: '×';
  position: absolute;
  top: -8px;
  right: -8px;
  font-size: 16px;
  color: #f44336;
  background: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  pointer-events: none;
  font-weight: bold;
}

/* Ensure rests are properly scaled and positioned */
.note.rest {
  font-size: 2.5em; /* Reduce base size from 3.5em */
  transform: translate(-50%, -50%) scale(0.6); /* Reduce scale from 0.75 to 0.6 */
  transform-origin: center center;
  width: auto;
  height: auto;
  position: absolute;
}

/* Specific rest positioning adjustments */
.note.rest[data-duration="whole"],
.note.rest[data-duration="half"],
.note.rest[data-duration="quarter"],
.note.rest[data-duration="eighth"],
.note.rest[data-duration="sixteenth"] {
  transform: translate(-50%, -50%) scale(0.6);
}

/* Ensure rests maintain their color */
.note.rest {
  color: currentColor;
}

/* Ensure selected rests are properly highlighted */
.note.rest.selected {
  outline: 2px solid #2196F3;
  outline-offset: 3px;
  border-radius: 4px;
  box-shadow: 0 0 8px rgba(33, 150, 243, 0.5);
}

.duplicate-staff-btn {
  background-color: #4a90e2;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 8px;
  font-size: 0.9em;
}

.duplicate-staff-btn:hover {
  background-color: #357abd;
}

</style>
