<template>
  <div class="playback-controls-container">
    <div class="playback-controls">
      <button @click="$emit('togglePlayback')" class="action-button play-button" :class="{
        'play-button': !isPlaying && !isPaused,
        'pause-button': isPlaying && !isPaused,
        'resume-button': isPaused
      }">
        <span class="button-icon">
          <span v-if="!isPlaying && !isPaused">▶</span>
          <span v-else-if="isPlaying && !isPaused">⏸</span>
          <span v-else-if="isPaused">⏯</span>
        </span>
        <span class="button-label">{{ !isPlaying && !isPaused ? 'Play' : (isPlaying && !isPaused ? 'Pause' : 'Resume') }}</span>
      </button>

      <button @click="$emit('stopPlayback')" class="action-button stop-button" :disabled="!isPlaying && !isPaused">
        <span class="button-icon">■</span>
        <span class="button-label">Stop</span>
      </button>

      <button @click="$emit('clearOrRestart')"
        class="action-button" :class="{
          'clear-button': !isPlaying && !isPaused,
          'restart-button': isPlaying || isPaused
        }">
        <span class="button-icon">
          <span v-if="!isPlaying && !isPaused">✕</span>
          <span v-else>⟲</span>
        </span>
        <span class="button-label">{{ !isPlaying && !isPaused ? 'Clear' : 'Restart' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

defineProps<{
  isPlaying: boolean;
  isPaused: boolean;
}>();

defineEmits<{
  (e: 'togglePlayback'): void;
  (e: 'stopPlayback'): void;
  (e: 'clearOrRestart'): void;
}>();
</script>

<style scoped>
.playback-controls-container {
  margin: 10px 0;
  display: flex;
  justify-content: center;
}

.playback-controls {
  display: flex;
  gap: 8px; /* Reduced from 12px in global.css for compactness if needed */
  justify-content: center;
  background-color: rgba(248, 248, 248, 0.8);
  padding: 8px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.action-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 5px rgba(0,0,0,0.15);
  position: relative;
  overflow: hidden;
}

.action-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
}

.action-button::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 120%;
  height: 120%;
  background: rgba(255,255,255,0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  transition: all 0.3s ease;
}

.action-button:active:not(:disabled)::after {
  transform: translate(-50%, -50%) scale(1.5);
  opacity: 1;
  transition: all 0.2s ease;
}

.button-icon {
  font-size: 18px;
  line-height: 1;
}

.button-label {
  font-weight: 500;
}

.play-button { background-color: #4CAF50; color: white; }
.play-button:hover:not(:disabled) { background-color: #45a049; transform: translateY(-2px); }

.pause-button { background-color: #FF9800; color: white; }
.pause-button:hover:not(:disabled) { background-color: #F57C00; transform: translateY(-2px); }

.resume-button { background-color: #2196F3; color: white; }
.resume-button:hover:not(:disabled) { background-color: #1976D2; transform: translateY(-2px); }

.stop-button { background-color: #f44336; color: white; }
.stop-button:hover:not(:disabled) { background-color: #e53935; transform: translateY(-2px); }

.clear-button { background-color: #757575; color: white; }
.clear-button:hover:not(:disabled) { background-color: #616161; transform: translateY(-2px); }

.restart-button { background-color: #2196F3; color: white; } /* Same as resume for now */
.restart-button:hover:not(:disabled) { background-color: #1976D2; transform: translateY(-2px); }
</style> 