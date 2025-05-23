/**
 * Generates a UUID version 4.
 * @returns {string} A new UUID v4 string.
 */
export function generateId(): string {
  // Standard RFC4122 version 4 UUID generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// If you want to keep the old generator for any reason (e.g., specific prefixing),
// you could rename it and keep it, but for general ID generation,
// the UUID function above is recommended.
/*
export function generateTimestampId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`;
}
*/ 