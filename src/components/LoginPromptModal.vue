<template>
  <div v-if="isVisible" class="login-prompt-overlay">
    <div class="login-prompt-modal">
      <div class="modal-header">
        <h2>Login Required</h2>
        <button @click="$emit('close')" class="close-btn">&times;</button>
      </div>
      
      <div class="modal-body">
        <p>You need to be logged in to access this shared composition.</p>
        <p>Please sign in to continue.</p>
        
        <div class="login-options">
          <button @click="signInWithGoogle" class="google-signin-btn">
            <img src="@/assets/google-icon.svg" alt="Google" class="google-icon">
            Sign in with Google
          </button>
        </div>
        
        <div class="modal-footer">
          <button @click="$emit('close')" class="cancel-btn">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/firebase';

const props = defineProps<{
  isVisible: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'login-success'): void;
}>();

const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    emit('login-success');
    emit('close');
  } catch (error: unknown) {
    console.error('Sign-in error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Sign-in failed';
    alert('Sign-in failed: ' + errorMessage);
  }
};
</script>

<style scoped>
.login-prompt-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.login-prompt-modal {
  background: white;
  border-radius: 8px;
  padding: 0;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px 0 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
  color: #333;
  font-size: 1.5rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: #f0f0f0;
}

.modal-body {
  padding: 20px;
}

.modal-body p {
  margin: 0 0 10px 0;
  color: #666;
  line-height: 1.5;
}

.login-options {
  margin: 20px 0;
}

.google-signin-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 12px 20px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  color: #333;
  transition: all 0.2s;
}

.google-signin-btn:hover {
  background: #f8f9fa;
  border-color: #c1c1c1;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.google-icon {
  width: 18px;
  height: 18px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.cancel-btn {
  padding: 8px 16px;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: #e0e0e0;
  border-color: #c1c1c1;
}
</style> 