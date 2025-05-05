import { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
appId: 'com.stcecilia.songbook',
appName: "St Cecilia's Songbook",
webDir: 'dist',
server: {
androidScheme: 'https'
},
plugins: {
// Add any plugin configurations here
}
};
export default config;