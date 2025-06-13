<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <h2>Save Composition to Cloud</h2>
      <form @submit.prevent="save">
        <div class="form-group">
          <label for="title">Title (required)</label>
          <input type="text" id="title" v-model="compositionDetails.title" required>
        </div>
        <div class="form-group">
          <label for="author">Author</label>
          <input type="text" id="author" v-model="compositionDetails.author">
        </div>
        <div class="form-group">
          <label for="arrangedBy">Arrangement by</label>
          <input type="text" id="arrangedBy" v-model="compositionDetails.arrangedBy">
        </div>
        <div class="form-group">
          <label>Visibility</label>
          <div class="radio-group">
            <label><input type="radio" value="private" v-model="compositionDetails.visibility"> Private</label>
            <label><input type="radio" value="public" v-model="compositionDetails.visibility"> Public</label>
            <label><input type="radio" value="shared" v-model="compositionDetails.visibility"> Shared</label>
          </div>
        </div>
        <div v-if="compositionDetails.visibility === 'shared'" class="form-group">
          <label>Share with (email addresses)</label>
          <div v-for="(share, index) in compositionDetails.sharedWith" :key="index" class="share-entry">
            <input type="email" placeholder="email@example.com" v-model="share.email">
            <select v-model="share.access">
              <option value="read">Read-only</option>
              <option value="write">Read/Write</option>
            </select>
            <button type="button" @click="removeShare(index)">Remove</button>
          </div>
          <button type="button" @click="addShare">Add person</button>
        </div>
        <div v-if="compositionDetails.visibility === 'public'" class="form-group">
          <label>
            <input type="checkbox" v-model="compositionDetails.allowPublicWrite" /> Allow anyone to edit (public write access)
          </label>
        </div>
        <div class="modal-actions">
          <button type="submit" class="save-btn">Save</button>
          <button type="button" @click="$emit('close')" class="cancel-btn">Cancel</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineEmits } from 'vue';

const emit = defineEmits(['close', 'save']);

const compositionDetails = ref({
  title: '',
  author: '',
  arrangedBy: '',
  visibility: 'private',
  sharedWith: [] as { email: string, access: 'read' | 'write' }[],
  allowPublicWrite: false,
});

const addShare = () => {
  compositionDetails.value.sharedWith.push({ email: '', access: 'read' });
};

const removeShare = (index: number) => {
  compositionDetails.value.sharedWith.splice(index, 1);
};

const save = () => {
  if (!compositionDetails.value.title) {
    alert('Title is required.');
    return;
  }
  emit('save', compositionDetails.value);
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
}

input[type="text"],
input[type="email"],
select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.radio-group label {
  margin-right: 15px;
}

.share-entry {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
</style> 