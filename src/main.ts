import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

import './assets/main.css'
import './assets/styles/global.css'
import { getSymbolCSSClasses, initializeSymbolSupport } from './utils/symbolUtils'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Initialize auth store
const authStore = useAuthStore(pinia)

// Initialize auth in the background
authStore.initialize().catch(error => {
  console.error('Failed to initialize auth:', error);
});

// Initialize symbol support for cross-device compatibility
try {
  const symbolResults = initializeSymbolSupport();
  // Add device-specific CSS classes to the body
  const deviceClasses = getSymbolCSSClasses();
  if (deviceClasses) {
    document.body.className += ' ' + deviceClasses;
  }
  console.log('Symbol support initialized with device classes:', deviceClasses);
  console.log('Symbol support results:', symbolResults);
} catch (error) {
  console.warn('Could not initialize symbol support:', error);
}

app.mount('#app') 