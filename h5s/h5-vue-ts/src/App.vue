<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="app">
    <nav class="nav">
      <RouterLink to="/" class="link">Home</RouterLink>
      <RouterLink to="/about" class="link">About</RouterLink>
    </nav>
    <main class="main">
      <RouterView />
    </main>
  </div>
</template>

<style>
.app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  max-width: 720px;
  margin: 0 auto;
  padding: 24px;
}
.nav {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #42b883;
}
.link {
  color: #42b883;
  text-decoration: none;
  font-weight: 500;
  font-size: 16px;
}
.link.router-link-active {
  border-bottom: 2px solid #42b883;
  padding-bottom: 2px;
}
.main {
  min-height: 400px;
}
h1 { color: #42b883; }
</style>
