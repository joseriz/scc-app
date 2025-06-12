<template>
  <div class="app">
    <main>
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router';
</script>

<style scoped>
.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Arial', sans-serif;
}

header {
  margin-bottom: 20px;
  text-align: center;
}

h1 {
  color: #2c3e50;
}

main {
  margin-top: 1rem;
}
</style>