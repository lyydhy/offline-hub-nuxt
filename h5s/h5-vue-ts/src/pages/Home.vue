<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
</script>

<template>
  <div>
    <h1>🏠 Home (Vue 3)</h1>
    <p>这是首页。路由:<code>/</code></p>
    <button class="btn" @click="count++">点击了 {{ count }} 次</button>
  </div>
</template>

<style scoped>
.btn {
  padding: 12px 24px;
  background: #42b883;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
}
.btn:hover { background: #369870; }
code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; }
</style>
