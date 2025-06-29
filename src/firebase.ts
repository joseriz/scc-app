// src/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, memoryLocalCache, connectFirestoreEmulator, collection, query, where, getDocs, deleteDoc, doc, updateDoc, addDoc, setDoc, orderBy, limit } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Debug: Check if environment variables are loaded
console.log('Firebase Config:', {
  apiKey: firebaseConfig.apiKey ? 'Present' : 'Missing',
  authDomain: firebaseConfig.authDomain ? 'Present' : 'Missing',
  projectId: firebaseConfig.projectId ? 'Present' : 'Missing',
  storageBucket: firebaseConfig.storageBucket ? 'Present' : 'Missing',
  messagingSenderId: firebaseConfig.messagingSenderId ? 'Present' : 'Missing',
  appId: firebaseConfig.appId ? 'Present' : 'Missing'
});

// Log platform information early
console.log('[Firebase] Capacitor detected? ->', Capacitor.isNativePlatform());

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore with different settings for native vs web
let db: any;
if (Capacitor.isNativePlatform()) {
  console.log('[Firebase] Native platform detected – using memory cache with long polling');
  db = initializeFirestore(app, {
    localCache: memoryLocalCache(),
    experimentalForceLongPolling: true,
    useFetchStreams: false
  } as any);
} else {
  console.log('[Firebase] Web platform – using default Firestore');
  db = initializeFirestore(app, {
    localCache: memoryLocalCache()
  });
}

export { db };

// Custom Firestore wrapper for native platforms that uses REST API directly
export class NativeFirestoreWrapper {
  private baseUrl: string;
  private projectId: string;
  
  constructor(projectId: string) {
    this.projectId = projectId;
    this.baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
  }
  
  private async getAuthToken(): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user');
    return await user.getIdToken();
  }
  
  async getCompositions(collectionName: string, filters: any[] = []): Promise<any[]> {
    try {
      const token = await this.getAuthToken();
      const url = `${this.baseUrl}:runQuery`;
      
      // Build structured query
      const structuredQuery: any = {
        from: [{ collectionId: collectionName }],
        orderBy: [{ field: { fieldPath: '__name__' }, direction: 'ASCENDING' }]
      };
      
      // Add where clause if filters exist
      filters.forEach(filter => {
        if (!structuredQuery.where) {
          structuredQuery.where = {};
        }
        
        if (filter.field === 'submittedBy') {
          structuredQuery.where.fieldFilter = {
            field: { fieldPath: 'submittedBy' },
            op: 'EQUAL',
            value: { stringValue: filter.value }
          };
        } else if (filter.field === 'visibility') {
          structuredQuery.where.fieldFilter = {
            field: { fieldPath: 'visibility' },
            op: 'EQUAL',
            value: { stringValue: filter.value }
          };
        } else if (filter.field === 'sharedWithEmails') {
          structuredQuery.where.fieldFilter = {
            field: { fieldPath: 'sharedWithEmails' },
            op: 'ARRAY_CONTAINS',
            value: { stringValue: filter.value }
          };
        }
      });
      
      const requestBody = { structuredQuery };
      console.log('[NativeFirestore] Request URL:', url);
      console.log('[NativeFirestore] Request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[NativeFirestore] Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('[NativeFirestore] Response data:', JSON.stringify(data, null, 2));
      return data.map((item: any) => {
        const doc = item.document;
        if (!doc) return null;
        
        // Convert Firestore field format to plain object
        const fields = this.convertFirestoreFields(doc.fields);
        
        console.log('[NativeFirestore] Converted fields for doc:', doc.name.split('/').pop(), fields);
        console.log('[NativeFirestore] All field keys:', Object.keys(fields));
        console.log('[NativeFirestore] Field types:', Object.keys(fields).map(key => `${key}: ${typeof fields[key]}`));
        if (fields.sequenceItems) {
          console.log('[NativeFirestore] sequenceItems:', fields.sequenceItems);
        }
        if (fields.notes) {
          console.log('[NativeFirestore] notes:', fields.notes);
        }
        if (fields.measures) {
          console.log('[NativeFirestore] measures:', fields.measures);
        }
        if (fields.staves) {
          console.log('[NativeFirestore] staves:', fields.staves);
        }
        if (fields.voiceLayers) {
          console.log('[NativeFirestore] voiceLayers:', fields.voiceLayers);
          fields.voiceLayers.forEach((voice: any, i: number) => {
            console.log(`[NativeFirestore] Voice ${i} notes:`, voice.notes);
          });
        }
        
        return {
          docId: doc.name.split('/').pop(),
          ...fields
        };
      }).filter(Boolean) || [];
    } catch (error) {
      console.error('[NativeFirestore] Error fetching compositions:', error);
      throw error;
    }
  }
  
  async deleteComposition(collectionName: string, docId: string): Promise<void> {
    try {
      const token = await this.getAuthToken();
      const url = `${this.baseUrl}/${collectionName}/${docId}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('[NativeFirestore] Error deleting composition:', error);
      throw error;
    }
  }
  
  async updateComposition(collectionName: string, docId: string, data: any): Promise<void> {
    try {
      const token = await this.getAuthToken();
      const url = `${this.baseUrl}/${collectionName}/${docId}`;
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: this.toFirestoreFields(data)
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('[NativeFirestore] Error updating composition:', error);
      throw error;
    }
  }

  async saveComposition(collectionName: string, data: any, docId?: string): Promise<any> {
    try {
      const token = await this.getAuthToken();
      const url = docId 
        ? `${this.baseUrl}/${collectionName}/${docId}?updateMask.fieldPaths=*`
        : `${this.baseUrl}/${collectionName}`;
      
      const method = docId ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: this.toFirestoreFields(data)
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }
      
      const result = await response.json();
      return {
        id: docId || result.name.split('/').pop()
      };
    } catch (error) {
      console.error('[NativeFirestore] Error saving composition:', error);
      throw error;
    }
  }
  
  private convertFirestoreFields(fields: any): any {
    if (!fields) return {};
    
    const result: any = {};
    Object.keys(fields).forEach(key => {
      const field = fields[key];
      if (field.stringValue !== undefined) {
        result[key] = field.stringValue;
      } else if (field.integerValue !== undefined) {
        result[key] = parseInt(field.integerValue);
      } else if (field.doubleValue !== undefined) {
        result[key] = parseFloat(field.doubleValue);
      } else if (field.booleanValue !== undefined) {
        result[key] = field.booleanValue;
      } else if (field.nullValue !== undefined) {
        result[key] = null;
      } else if (field.arrayValue) {
        if (field.arrayValue.values) {
          result[key] = field.arrayValue.values.map((item: any) => {
            if (item.mapValue && item.mapValue.fields) {
              return this.convertFirestoreFields(item.mapValue.fields);
            } else if (item.stringValue !== undefined) {
              return item.stringValue;
            } else if (item.integerValue !== undefined) {
              return parseInt(item.integerValue);
            } else if (item.doubleValue !== undefined) {
              return parseFloat(item.doubleValue);
            } else if (item.booleanValue !== undefined) {
              return item.booleanValue;
            } else if (item.nullValue !== undefined) {
              return null;
            }
            return item;
          });
        } else {
          result[key] = [];
        }
      } else if (field.mapValue && field.mapValue.fields) {
        result[key] = this.convertFirestoreFields(field.mapValue.fields);
      } else {
        // Handle unknown field types
        console.warn('[NativeFirestore] Unknown field type:', key, field);
        result[key] = field;
      }
    });
    return result;
  }

  private toFirestoreFields(obj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        result[key] = { stringValue: value };
      } else if (typeof value === 'number') {
        if (Number.isInteger(value)) {
          result[key] = { integerValue: value.toString() };
        } else {
          result[key] = { doubleValue: value };
        }
      } else if (typeof value === 'boolean') {
        result[key] = { booleanValue: value };
      } else if (value === null || value === undefined) {
        result[key] = { nullValue: null };
      } else if (Array.isArray(value)) {
        result[key] = { 
          arrayValue: { 
            values: value.map((v: any) => {
              if (typeof v === 'object' && v !== null) {
                return { mapValue: { fields: this.toFirestoreFields(v as Record<string, any>) } };
              } else {
                return this.toFirestoreFields({ value: v }).value;
              }
            })
          }
        };
      } else if (typeof value === 'object') {
        result[key] = { mapValue: { fields: this.toFirestoreFields(value as Record<string, any>) } };
      }
    }
    return result;
  }
}

// Export native wrapper instance
export const nativeFirestore = Capacitor.isNativePlatform() 
  ? new NativeFirestoreWrapper(firebaseConfig.projectId)
  : null;

// Handy helper to log whenever we make a Firestore call – replace/remove if too noisy
export function logFirestoreCall(method: string, payload?: unknown) {
  if (Capacitor.isNativePlatform()) {
    console.log(`[Firestore/native] ${method}`, payload ?? '');
  } else {
    console.log(`[Firestore/web] ${method}`, payload ?? '');
  }
}

// Helper to convert JS data to Firestore REST API fields
function toFirestoreFields(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') result[key] = { stringValue: value };
    else if (typeof value === 'number') {
      if (Number.isInteger(value)) result[key] = { integerValue: value.toString() };
      else result[key] = { doubleValue: value };
    } else if (typeof value === 'boolean') result[key] = { booleanValue: value };
    else if (value === null) result[key] = { nullValue: null };
    else if (Array.isArray(value)) result[key] = { arrayValue: { values: value.map((v: any) => typeof v === 'object' ? { mapValue: { fields: toFirestoreFields(v as Record<string, any>) } } : toFirestoreFields({ value: v }).value) } };
    else if (typeof value === 'object') result[key] = { mapValue: { fields: toFirestoreFields(value as Record<string, any>) } };
  }
  return result;
}

export async function saveCompositionToCloudREST(dataToSave: Record<string, any>, docId: string | null = null): Promise<any> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const token = await user.getIdToken();
  const projectId = 'academic-ratio-261512'; // or from config
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/compositions`;

  const url = docId
    ? `${baseUrl}/${docId}?updateMask.fieldPaths=*`
    : baseUrl;

  const method = docId ? 'PATCH' : 'POST';

  const body = { fields: toFirestoreFields(dataToSave) };

  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`REST save failed: ${response.status} ${errorText}`);
  }
  return await response.json();
} 