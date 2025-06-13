<template>
  <div class="legacy-migration">
    <h2>Legacy Data Migration</h2>
    <p>This tool will update legacy compositions that only have email-based ownership to include user UIDs.</p>
    
    <div v-if="stats.total > 0" class="stats">
      <p>Found {{ stats.total }} compositions</p>
      <p>{{ stats.needsMigration }} need migration</p>
      <p>{{ stats.migrated }} successfully migrated</p>
      <p>{{ stats.failed }} failed to migrate</p>
    </div>

    <div class="actions">
      <button @click="scanLegacyData" :disabled="isProcessing">
        {{ isProcessing ? 'Scanning...' : 'Scan for Legacy Data' }}
      </button>
      
      <button 
        @click="migrateData" 
        :disabled="isProcessing || stats.needsMigration === 0"
      >
        {{ isProcessing ? 'Migrating...' : 'Migrate Data' }}
      </button>
    </div>

    <div v-if="error" class="error">
      {{ error }}
    </div>

    <div v-if="legacyCompositions.length > 0" class="compositions-list">
      <h3>Compositions Needing Migration</h3>
      <ul>
        <li v-for="comp in legacyCompositions" :key="comp.id">
          {{ comp.name }} (by {{ comp.submittedByEmail }})
          <span v-if="comp.migrated" class="success">✓ Migrated</span>
          <span v-if="comp.error" class="error">✗ {{ comp.error }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { auth, db } from '@/firebase';
import { collection, query, getDocs, updateDoc, doc, where } from 'firebase/firestore';
import { getAuth, fetchSignInMethodsForEmail } from 'firebase/auth';

const isProcessing = ref(false);
const error = ref('');
const legacyCompositions = ref<any[]>([]);
const stats = ref({
  total: 0,
  needsMigration: 0,
  migrated: 0,
  failed: 0
});

// Scan for compositions that need migration
const scanLegacyData = async () => {
  isProcessing.value = true;
  error.value = '';
  legacyCompositions.value = [];
  stats.value = { total: 0, needsMigration: 0, migrated: 0, failed: 0 };

  try {
    // Get all compositions
    const q = query(collection(db, 'compositions'));
    const snapshot = await getDocs(q);
    
    stats.value.total = snapshot.size;
    
    // Filter for compositions that need migration
    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (data.submittedByEmail && !data.submittedBy) {
        legacyCompositions.value.push({
          id: doc.id,
          ...data,
          migrated: false,
          error: null
        });
      }
    }
    
    stats.value.needsMigration = legacyCompositions.value.length;
  } catch (err: any) {
    error.value = `Error scanning data: ${err.message}`;
  } finally {
    isProcessing.value = false;
  }
};

// Get UID for an email address
const getUidForEmail = async (email: string): Promise<string | null> => {
  try {
    // Check if the email exists in Firebase Auth
    const methods = await fetchSignInMethodsForEmail(getAuth(), email);
    if (methods.length === 0) {
      throw new Error('User not found');
    }
    
    // Query Firestore for a recent composition by this user that has both email and UID
    const q = query(
      collection(db, 'compositions'),
      where('submittedByEmail', '==', email),
      where('submittedBy', '!=', null)
    );
    const snapshot = await getDocs(q);
    
    // Get the first document that has a UID
    const doc = snapshot.docs[0];
    if (doc) {
      const data = doc.data();
      if (data.submittedBy) {
        return data.submittedBy;
      }
    }
    
    throw new Error('No UID found');
  } catch (err) {
    console.error('Error getting UID for email:', err);
    return null;
  }
};

// Migrate the data
const migrateData = async () => {
  isProcessing.value = true;
  error.value = '';
  stats.value.migrated = 0;
  stats.value.failed = 0;

  try {
    for (const comp of legacyCompositions.value) {
      if (comp.migrated) continue;

      try {
        const uid = await getUidForEmail(comp.submittedByEmail);
        if (!uid) {
          throw new Error('Could not determine UID');
        }

        // Update the document
        await updateDoc(doc(db, 'compositions', comp.id), {
          submittedBy: uid
        });

        comp.migrated = true;
        stats.value.migrated++;
      } catch (err: any) {
        comp.error = err.message;
        stats.value.failed++;
      }
    }
  } catch (err: any) {
    error.value = `Error during migration: ${err.message}`;
  } finally {
    isProcessing.value = false;
  }
};
</script>

<style scoped>
.legacy-migration {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.stats {
  margin: 20px 0;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 4px;
}

.actions {
  margin: 20px 0;
  display: flex;
  gap: 10px;
}

button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background: #4CAF50;
  color: white;
  cursor: pointer;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error {
  color: #f44336;
  margin: 10px 0;
}

.compositions-list {
  margin-top: 20px;
}

.compositions-list ul {
  list-style: none;
  padding: 0;
}

.compositions-list li {
  padding: 8px;
  border-bottom: 1px solid #eee;
}

.success {
  color: #4CAF50;
  margin-left: 10px;
}

.error {
  color: #f44336;
  margin-left: 10px;
}
</style> 