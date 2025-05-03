<template>
  <div class="app">
    <header>
      <h1>Music Notation App</h1>
    </header>
    <main>
      <RouterView />
    </main>
  </div>
</template>

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
</style>