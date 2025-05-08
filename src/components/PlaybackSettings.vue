<template>
  <div class="playback-settings">
    <div class="playback-range">
      <div class="control-label">Playback Range:</div>
      <div class="measure-range-inputs">
        <div class="measure-input">
          <label for="start-measure">From:</label>
          <input
            type="number"
            id="start-measure"
            :value="playbackStartMeasure"
            @input="$emit('update:playbackStartMeasure', parseInt(($event.target as HTMLInputElement).value) || 1)"
            min="1"
            :max="maxMeasures"
            class="measure-number-input"
          />
        </div>
        <div class="measure-input">
          <label for="end-measure">To:</label>
          <input
            type="number"
            id="end-measure"
            :value="playbackEndMeasure"
            @input="$emit('update:playbackEndMeasure', parseInt(($event.target as HTMLInputElement).value) || 0)"
            min="0"
            :max="maxMeasures"
            class="measure-number-input"
          />
          <span class="measure-hint">(0 = end)</span>
        </div>
      </div>
    </div>

    <div class="playback-options">
      <div class="auto-scroll-toggle">
        <input
          type="checkbox"
          id="auto-scroll-input"
          :checked="autoScrollToPlayingNote"
          @change="$emit('update:autoScrollToPlayingNote', ($event.target as HTMLInputElement).checked)"
        />
        <label for="auto-scroll-input">Auto-scroll to playing notes</label>
      </div>

      <div class="measure-visibility-toggle">
        <input
          type="checkbox"
          id="show-measures-input"
          :checked="showMeasureNumbers"
          @change="$emit('update:showMeasureNumbers', ($event.target as HTMLInputElement).checked)"
        />
        <label for="show-measures-input">Show measure numbers</label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

defineProps<{
  playbackStartMeasure: number;
  playbackEndMeasure: number;
  maxMeasures: number;
  autoScrollToPlayingNote: boolean;
  showMeasureNumbers: boolean;
}>();

defineEmits<{
  (e: 'update:playbackStartMeasure', value: number): void;
  (e: 'update:playbackEndMeasure', value: number): void;
  (e: 'update:autoScrollToPlayingNote', value: boolean): void;
  (e: 'update:showMeasureNumbers', value: boolean): void;
}>();
</script>

<style scoped>
.playback-settings {
  margin: 10px 0 15px;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 8px;
  border: 1px solid #ddd;
}

.playback-range {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.control-label {
  font-weight: 500;
  color: #333;
  min-width: 120px; /* Ensure label doesn't wrap too soon */
}

.measure-range-inputs {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: center;
}

.measure-input {
  display: flex;
  align-items: center;
  gap: 5px;
}

.measure-input label {
  font-size: 14px;
}

.measure-number-input {
  width: 60px;
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
  text-align: center;
  font-size: 14px;
}

.measure-hint {
  font-size: 12px;
  color: #666;
  font-style: italic;
}

.playback-options {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center; /* Align items vertically */
}

.auto-scroll-toggle,
.measure-visibility-toggle {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
}

.auto-scroll-toggle input[type="checkbox"],
.measure-visibility-toggle input[type="checkbox"] {
  margin: 0;
  width: 16px;
  height: 16px;
  accent-color: #007bff;
}

@media (max-width: 600px) {
  .playback-range {
    flex-direction: column;
    align-items: flex-start;
  }
  .control-label {
    min-width: auto; /* Allow label to take natural width */
    margin-bottom: 5px;
  }
  .measure-range-inputs {
    width: 100%;
    gap: 10px; /* Reduce gap on smaller screens */
  }
  .measure-input {
    width: calc(50% - 5px); /* Two inputs per row */
  }
  .measure-input label {
    font-size: 13px;
  }
  .measure-number-input {
    width: 50px;
    font-size: 13px;
  }
  .playback-options {
    flex-direction: column;
    align-items: flex-start; /* Align options to the left */
    gap: 10px;
  }
}
</style> 