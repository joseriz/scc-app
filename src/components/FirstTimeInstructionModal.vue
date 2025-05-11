<template>
  <div v-if="isVisible" class="instruction-modal-overlay">
    <div class="instruction-modal">
      <div class="modal-header">
        <h2>Welcome to St Cecilia's Songbook</h2>
        <button class="close-btn" @click="close">×</button>
      </div>
      
      <div class="modal-content">
        <p>This app helps you create and practice music notation. Here's a quick guide to get you started:</p>
        
        <div class="video-container" :class="{ 'video-active': videoLoaded }">
          <!-- Video Thumbnail (shown initially) -->
          <div v-if="!videoLoaded" class="video-thumbnail" @click="loadVideo">
            <div class="play-button">
              <span class="play-icon">▶</span>
            </div>
            <img src="/video-thumbnail.jpg" alt="Tutorial Video Thumbnail" class="thumbnail-img" />
            <div class="video-caption">Click to watch tutorial (15MB)</div>
          </div>
          
          <!-- Actual Video (loaded on demand) -->
          <video 
            v-if="videoLoaded" 
            ref="videoPlayer"
            controls
            class="tutorial-video"
            @loadeddata="videoReady"
          >
            <source :src="videoSrc" type="video/mp4">
            Your browser does not support the video tag.
          </video>
          
          <div v-if="videoLoaded && isLoading" class="loading-indicator">
            Loading video...
          </div>
        </div>
        
        <div class="quick-tips">
          <h3>Quick Tips:</h3>
          <ul>
            <li>Click on the staff to add notes</li>
            <li>Select note duration from the Notes tab</li>
            <li>Right-click or long-press to remove notes</li>
            <li>Use the Sections tab to organize your composition</li>
            <li>Save your work using the Saved tab</li>
          </ul>
        </div>
      </div>
      
      <div class="modal-footer">
        <label class="dont-show-again">
          <input type="checkbox" v-model="dontShowAgain"> Don't show again
        </label>
        <button class="start-btn" @click="close">Start Using App</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close']);

const videoLoaded = ref(false);
const isLoading = ref(false);
const videoPlayer = ref(null);
const dontShowAgain = ref(false);

// Path to the video - you'd need to place your 15MB instruction video here
const videoSrc = ref('/tutorial-video.mp4');

// Watch for checkbox changes to save preference
watch(dontShowAgain, (newValue) => {
  if (newValue) {
    localStorage.setItem('musicNotationAppInstructionSeen', 'true');
  }
});

// Function to load the video when the thumbnail is clicked
const loadVideo = () => {
  videoLoaded.value = true;
  isLoading.value = true;
  
  // Focus on the video after it's loaded into the DOM
  setTimeout(() => {
    if (videoPlayer.value) {
      videoPlayer.value.focus();
    }
  }, 100);
};

// Function called when video data is loaded
const videoReady = () => {
  isLoading.value = false;
  
  // Auto-play after loading
  if (videoPlayer.value) {
    videoPlayer.value.play().catch(err => {
      console.log('Auto-play prevented by browser:', err);
    });
  }
};

// Function to close the modal
const close = () => {
  if (dontShowAgain.value) {
    localStorage.setItem('musicNotationAppInstructionSeen', 'true');
  }
  emit('close');
};
</script>

<style scoped>
.instruction-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.instruction-modal {
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #9C27B0, #673AB7);
  color: white;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: white;
  cursor: pointer;
  outline: none;
}

.modal-content {
  padding: 20px;
  overflow-y: auto;
  flex-grow: 1;
}

.video-container {
  width: 100%;
  margin: 20px 0;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  aspect-ratio: 16 / 9;
  background-color: #000;
}

.video-thumbnail {
  position: relative;
  width: 100%;
  height: 100%;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.thumbnail-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.video-thumbnail:hover .thumbnail-img {
  transform: scale(1.05);
}

.play-button {
  position: absolute;
  width: 70px;
  height: 70px;
  background-color: rgba(33, 150, 243, 0.9);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.play-icon {
  font-size: 30px;
  color: white;
  margin-left: 5px;
}

.video-thumbnail:hover .play-button {
  transform: scale(1.1);
  background-color: rgba(33, 150, 243, 1);
}

.video-caption {
  position: absolute;
  bottom: 10px;
  left: 0;
  right: 0;
  text-align: center;
  color: white;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 8px;
  font-size: 14px;
}

.tutorial-video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.loading-indicator {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 18px;
}

.quick-tips {
  margin-top: 20px;
  background-color: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #2196F3;
}

.quick-tips h3 {
  margin-top: 0;
  color: #2196F3;
}

.quick-tips ul {
  margin-bottom: 0;
  padding-left: 20px;
}

.quick-tips li {
  margin-bottom: 8px;
}

.modal-footer {
  padding: 15px 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dont-show-again {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  user-select: none;
}

.start-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.start-btn:hover {
  background-color: #388E3C;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .instruction-modal {
    width: 95%;
    max-height: 95vh;
  }
  
  .modal-header h2 {
    font-size: 1.2rem;
  }
  
  .play-button {
    width: 50px;
    height: 50px;
  }
  
  .play-icon {
    font-size: 24px;
  }
  
  .modal-footer {
    flex-direction: column;
    gap: 15px;
  }
  
  .start-btn {
    width: 100%;
  }
}
</style> 