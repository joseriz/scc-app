<template>
  <div class="login-container">
    <button 
      @click="handleGoogleSignIn"
      class="google-btn"
      :disabled="loading"
    >
      <svg class="google-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      </svg>
      {{ loading ? '...' : 'Sign in' }}
    </button>
    <p v-if="error" class="error-message">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuth } from '../firebase/auth';

const loading = ref(false);
const error = ref('');
const auth = useAuth();

const handleGoogleSignIn = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    const { user, error: signInError } = await auth.googleSignIn();
    if (signInError) {
      error.value = signInError;
    }
  } catch (e) {
    error.value = 'An unexpected error occurred';
    console.error(e);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.google-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
  color: #444;
}

.google-btn:hover {
  background-color: #f8f9fa;
  border-color: #dadce0;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.google-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.google-icon {
  width: 18px;
  height: 18px;
}

.error-message {
  color: #dc3545;
  font-size: 0.75rem;
  margin: 0;
}
</style> 