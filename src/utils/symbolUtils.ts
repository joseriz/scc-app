// Symbol utilities for cross-device compatibility
// This ensures all symbols work properly on iPhones, Android devices, and other platforms

export interface SymbolSet {
  primary: string;
  fallback: string;
  description: string;
}

// Musical note symbols with fallbacks
export const musicalSymbols = {
  // Note durations
  wholeNote: { primary: '𝅝', fallback: 'W', description: 'Whole note' },
  halfNote: { primary: '𝅗𝅥', fallback: 'H', description: 'Half note' },
  quarterNote: { primary: '♩', fallback: 'Q', description: 'Quarter note' },
  eighthNote: { primary: '♪', fallback: 'E', description: 'Eighth note' },
  sixteenthNote: { primary: '♬', fallback: 'S', description: 'Sixteenth note' },
  
  // Rest durations
  wholeRest: { primary: '𝄻', fallback: 'WR', description: 'Whole rest' },
  halfRest: { primary: '𝄼', fallback: 'HR', description: 'Half rest' },
  quarterRest: { primary: '𝄽', fallback: 'QR', description: 'Quarter rest' },
  eighthRest: { primary: '𝄾', fallback: 'ER', description: 'Eighth rest' },
  sixteenthRest: { primary: '𝄿', fallback: 'SR', description: 'Sixteenth rest' },
  
  // Accidentals
  natural: { primary: '♮', fallback: 'N', description: 'Natural' },
  sharp: { primary: '♯', fallback: '#', description: 'Sharp' },
  flat: { primary: '♭', fallback: 'b', description: 'Flat' },
  
  // Other musical symbols
  dot: { primary: '•', fallback: '.', description: 'Dot' },
  tie: { primary: '⌒', fallback: '~', description: 'Tie' },
  slur: { primary: '⌒', fallback: '~', description: 'Slur' },
  triplet: { primary: '³', fallback: '3', description: 'Triplet' },
  
  // Clefs
  trebleClef: { primary: '𝄞', fallback: 'G', description: 'Treble clef' },
  bassClef: { primary: '𝄢', fallback: 'F', description: 'Bass clef' },
  altoClef: { primary: '𝄡', fallback: 'C', description: 'Alto clef' },
  tenorClef: { primary: '𝄡', fallback: 'C', description: 'Tenor clef' }
};

// UI control symbols with fallbacks
export const controlSymbols = {
  // Playback controls
  play: { primary: '▶', fallback: '>', description: 'Play' },
  pause: { primary: '⏸', fallback: '||', description: 'Pause' },
  stop: { primary: '⏹', fallback: '[]', description: 'Stop' },
  skipBack: { primary: '⏮', fallback: '<<', description: 'Skip back' },
  skipForward: { primary: '⏭', fallback: '>>', description: 'Skip forward' },
  
  // Navigation
  leftArrow: { primary: '◀', fallback: '<', description: 'Left arrow' },
  rightArrow: { primary: '▶', fallback: '>', description: 'Right arrow' },
  upArrow: { primary: '▲', fallback: '^', description: 'Up arrow' },
  downArrow: { primary: '▼', fallback: 'v', description: 'Down arrow' },
  
  // Status indicators
  lock: { primary: '🔒', fallback: 'L', description: 'Locked' },
  unlock: { primary: '🔓', fallback: 'U', description: 'Unlocked' },
  check: { primary: '✓', fallback: 'OK', description: 'Check' },
  cross: { primary: '✗', fallback: 'X', description: 'Cross' },
  warning: { primary: '⚠', fallback: '!', description: 'Warning' },
  info: { primary: 'ℹ', fallback: 'i', description: 'Information' }
};

// Voice layer control symbols
export const voiceControlSymbols = {
  // Visibility
  visible: { primary: '👁', fallback: 'V', description: 'Visible' },
  hidden: { primary: '🚫', fallback: 'H', description: 'Hidden' },
  
  // Selection
  selected: { primary: '🔊', fallback: 'S', description: 'Selected' },
  unselected: { primary: '🔇', fallback: 'U', description: 'Unselected' },
  
  // Active state
  active: { primary: '★', fallback: 'A', description: 'Active' },
  inactive: { primary: '☆', fallback: 'I', description: 'Inactive' },
  
  // Delete
  delete: { primary: '❌', fallback: 'D', description: 'Delete' },
  
  // Volume
  volume: { primary: '🔊', fallback: 'V', description: 'Volume' },
  mute: { primary: '🔇', fallback: 'M', description: 'Mute' }
};

// Device detection utilities
export const deviceInfo = {
  isIOS: () => /iPad|iPhone|iPod/.test(navigator.userAgent),
  isAndroid: () => /Android/.test(navigator.userAgent),
  isMobile: () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
  isSafari: () => /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent),
  isChrome: () => /Chrome/.test(navigator.userAgent),
  isFirefox: () => /Firefox/.test(navigator.userAgent)
};

// Symbol compatibility testing
export const symbolSupport = {
  // Test if a symbol can be displayed properly
  testSymbol: (symbol: string): boolean => {
    const testElement = document.createElement('span');
    testElement.style.fontSize = '16px';
    testElement.style.fontFamily = 'monospace';
    testElement.textContent = symbol;
    document.body.appendChild(testElement);
    
    const width = testElement.offsetWidth;
    const height = testElement.offsetHeight;
    
    document.body.removeChild(testElement);
    
    // If the symbol has no width or height, it's not supported
    return width > 0 && height > 0;
  },
  
  // Test multiple symbols and return which ones are supported
  testSymbols: (symbols: string[]): { [key: string]: boolean } => {
    const results: { [key: string]: boolean } = {};
    
    symbols.forEach(symbol => {
      results[symbol] = symbolSupport.testSymbol(symbol);
    });
    
    return results;
  },
  
  // Get the best symbol for the current device
  getBestSymbol: (symbolSet: SymbolSet): string => {
    // Test the primary symbol first
    if (symbolSupport.testSymbol(symbolSet.primary)) {
      return symbolSet.primary;
    }
    
    // Fall back to the fallback symbol
    return symbolSet.fallback;
  }
};

// Initialize symbol support testing
export const initializeSymbolSupport = () => {
  // Test musical symbols
  const musicalSymbolsToTest = Object.values(musicalSymbols).map(s => s.primary);
  const musicalSymbolResults = symbolSupport.testSymbols(musicalSymbolsToTest);
  
  // Test control symbols
  const controlSymbolsToTest = Object.values(controlSymbols).map(s => s.primary);
  const controlSymbolResults = symbolSupport.testSymbols(controlSymbolsToTest);
  
  // Test voice control symbols
  const voiceSymbolsToTest = Object.values(voiceControlSymbols).map(s => s.primary);
  const voiceSymbolResults = symbolSupport.testSymbols(voiceSymbolsToTest);
  
  console.log('Musical symbol support:', musicalSymbolResults);
  console.log('Control symbol support:', controlSymbolResults);
  console.log('Voice control symbol support:', voiceSymbolResults);
  
  return {
    musical: musicalSymbolResults,
    control: controlSymbolResults,
    voice: voiceSymbolResults
  };
};

// Utility function to get a symbol with automatic fallback
export const getSymbol = (category: 'musical' | 'control' | 'voice', key: string): string => {
  let symbolSet: SymbolSet | undefined;
  
  switch (category) {
    case 'musical':
      symbolSet = musicalSymbols[key as keyof typeof musicalSymbols];
      break;
    case 'control':
      symbolSet = controlSymbols[key as keyof typeof controlSymbols];
      break;
    case 'voice':
      symbolSet = voiceControlSymbols[key as keyof typeof voiceControlSymbols];
      break;
  }
  
  if (!symbolSet) {
    console.warn(`Symbol not found: ${category}.${key}`);
    return '?';
  }
  
  return symbolSupport.getBestSymbol(symbolSet);
};

// CSS classes for different symbol support levels
export const getSymbolCSSClasses = () => {
  const classes = [];
  
  if (deviceInfo.isIOS()) classes.push('device-ios');
  if (deviceInfo.isAndroid()) classes.push('device-android');
  if (deviceInfo.isMobile()) classes.push('device-mobile');
  if (deviceInfo.isSafari()) classes.push('browser-safari');
  if (deviceInfo.isChrome()) classes.push('browser-chrome');
  if (deviceInfo.isFirefox()) classes.push('browser-firefox');
  
  return classes.join(' ');
};

// Export all symbols for easy access
export default {
  musicalSymbols,
  controlSymbols,
  voiceControlSymbols,
  deviceInfo,
  symbolSupport,
  getSymbol,
  getSymbolCSSClasses,
  initializeSymbolSupport
};
