import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.stcecilia.songbook',
  appName: "St Cecilia's Songbook",
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
    allowNavigation: [
      'accounts.google.com',
      '*.googleusercontent.com',
      'academic-ratio-261512.firebaseapp.com',
      '*.firebaseapp.com'
    ]
  },
  plugins: {
    CapacitorCookies: {
      enabled: true
    },
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;