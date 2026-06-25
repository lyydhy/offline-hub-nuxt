<script setup lang="ts">
import { ref, onMounted } from 'vue'

const time = ref('')

onMounted(() => {
  const update = () => {
    time.value = new Date().toLocaleString('zh-CN')
  }
  update()
  setInterval(update, 1000)
})
</script>

<template>
  <div>
    <h1>ℹ️ About (Vue 3)</h1>
    <p>这是关于页。路由:<code>/about</code></p>
    <p>当前时间:<strong>{{ time }}</strong></p>
    <p class="hint">💡 路由是 hash 模式,URL 形如 <code>app://main/index.html#/about</code></p>
  </div>
</template>

<style scoped>
code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; }
.hint { color: #7f8c8d; font-size: 14px; }
</style>
