<script setup lang="ts">
interface PackageRow {
  id: number
  package_id: string
  version: string
  filename: string
  size: number
  md5: string | null
  upload_time: number
}

interface Stats {
  totalCount: number
  totalSize: number
  packageCount: number
  byPackage: Array<{ package_id: string; c: number; s: number }>
}

const filter = ref('')
const list = ref<PackageRow[]>([])
const stats = ref<Stats | null>(null)
const uploading = ref(false)
const message = ref('')
const messageType = ref<'info' | 'success' | 'error'>('info')

const form = ref({
  packageId: '',
  version: '',
  file: null as File | null,
})

const filteredList = computed(() => {
  if (!filter.value) return list.value
  const f = filter.value.toLowerCase()
  return list.value.filter((p) => p.package_id.toLowerCase().includes(f))
})

const latestJson = computed(() => {
  // 每个 packageId 取最新
  const byPkg = new Map<string, PackageRow>()
  for (const row of list.value) {
    const cur = byPkg.get(row.package_id)
    if (!cur || cur.upload_time < row.upload_time) {
      byPkg.set(row.package_id, row)
    }
  }
  return Array.from(byPkg.values()).map((row) => ({
    packageId: row.package_id,
    version: row.version,
    zipUrl: `${location.origin}/api/packages/${row.id}/download`,
    expectedMd5: row.md5,
    size: row.size,
  }))
})

async function loadList() {
  try {
    const res = await $fetch<{ packages: PackageRow[] }>('/api/packages')
    list.value = res.packages
  } catch (e: any) {
    showMessage(`加载失败: ${e.message}`, 'error')
  }
}

async function loadStats() {
  try {
    stats.value = await $fetch<Stats>('/api/packages/stats')
  } catch {}
}

async function refresh() {
  await Promise.all([loadList(), loadStats()])
}

async function upload() {
  if (!form.value.file || !form.value.packageId || !form.value.version) {
    showMessage('请填写完整信息', 'error')
    return
  }
  uploading.value = true
  message.value = ''
  try {
    // 客户端算 MD5
    const buf = await form.value.file.arrayBuffer()
    const hashBuf = await crypto.subtle.digest('MD5', buf)
    const md5 = Array.from(new Uint8Array(hashBuf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    const fd = new FormData()
    fd.append('file', form.value.file)
    fd.append('packageId', form.value.packageId)
    fd.append('version', form.value.version)
    fd.append('md5', md5)

    await $fetch('/api/packages', { method: 'POST', body: fd })
    showMessage(`✅ 上传成功 ${form.value.packageId}@${form.value.version}`, 'success')
    form.value = { packageId: '', version: '', file: null }
    await refresh()
  } catch (e: any) {
    showMessage(`上传失败: ${e.data?.statusMessage || e.message}`, 'error')
  } finally {
    uploading.value = false
  }
}

async function del(p: PackageRow) {
  if (!confirm(`确定删除 ${p.package_id}@${p.version}?`)) return
  try {
    await $fetch(`/api/packages/${p.id}`, { method: 'DELETE' })
    showMessage('✅ 已删除', 'success')
    await refresh()
  } catch (e: any) {
    showMessage(`删除失败: ${e.message}`, 'error')
  }
}

function showMessage(msg: string, type: 'info' | 'success' | 'error') {
  message.value = msg
  messageType.value = type
  setTimeout(() => (message.value = ''), 5000)
}

function formatSize(bytes: number): string {
  if (!bytes) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB'
  return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB'
}

function formatTime(ts: number): string {
  if (!ts) return '-'
  return new Date(ts).toLocaleString('zh-CN')
}

let timer: any
onMounted(() => {
  refresh()
  timer = setInterval(refresh, 5000)
})
onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="container">
    <!-- 顶部 -->
    <header class="topbar">
      <div class="brand">
        <span class="logo">📦</span>
        <h1>Offline Hub</h1>
        <span class="subtitle">H5 离线包管理</span>
      </div>
      <div v-if="stats" class="stats">
        <div class="stat">
          <div class="stat-value">{{ stats.totalCount }}</div>
          <div class="stat-label">总包数</div>
        </div>
        <div class="stat">
          <div class="stat-value">{{ stats.packageCount }}</div>
          <div class="stat-label">业务数</div>
        </div>
        <div class="stat">
          <div class="stat-value">{{ formatSize(stats.totalSize) }}</div>
          <div class="stat-label">总大小</div>
        </div>
      </div>
    </header>

    <main>
      <!-- 上传 -->
      <section class="card">
        <h2>📤 上传离线包</h2>
        <form @submit.prevent="upload">
          <div class="form-row">
            <label>
              <span>包 ID</span>
              <input v-model="form.packageId" type="text" placeholder="如:main / activity" required>
            </label>
            <label>
              <span>版本号</span>
              <input v-model="form.version" type="text" placeholder="如:v1.0.0" required>
            </label>
          </div>
          <label class="file-label">
            <span>zip 文件</span>
            <input type="file" accept=".zip" required @change="(e: any) => form.file = e.target.files?.[0] || null">
            <div v-if="form.file" class="file-info">
              <span>{{ form.file.name }}</span>
              <span class="size">{{ formatSize(form.file.size) }}</span>
            </div>
          </label>
          <button type="submit" :disabled="uploading">
            <span v-if="!uploading">上传</span>
            <span v-else>上传中...</span>
          </button>
        </form>
        <div v-if="message" class="message" :class="messageType">{{ message }}</div>
      </section>

      <!-- 列表 -->
      <section class="card">
        <div class="list-header">
          <h2>📋 已上传包</h2>
          <div class="filter">
            <input v-model="filter" type="text" placeholder="按包 ID 过滤...">
            <button @click="filter = ''">清除</button>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>包 ID</th>
              <th>版本</th>
              <th>大小</th>
              <th>MD5</th>
              <th>上传时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in filteredList" :key="p.id">
              <td><strong>{{ p.package_id }}</strong></td>
              <td><code>{{ p.version }}</code></td>
              <td>{{ formatSize(p.size) }}</td>
              <td><code class="md5" :title="p.md5 ?? ''">{{ (p.md5 ?? '').slice(0, 12) }}...</code></td>
              <td>{{ formatTime(p.upload_time) }}</td>
              <td class="actions">
                <a :href="`/api/packages/${p.id}/download`" :download="`${p.package_id}_${p.version}.zip`">
                  <button class="btn-download">下载</button>
                </a>
                <button class="btn-delete" @click="del(p)">删除</button>
              </td>
            </tr>
            <tr v-if="filteredList.length === 0">
              <td colspan="6" class="empty">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- App 下发配置 -->
      <section class="card">
        <h2>🚀 最新版本（给 App 下发）</h2>
        <p class="hint">App 启动后调 <code>GET /api/packages/latest</code> 获取最新包列表，然后调 <code>OfflineManager.registerPackage</code> 注册</p>
        <pre>{{ JSON.stringify(latestJson, null, 2) }}</pre>
      </section>
    </main>
  </div>
</template>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif;
  background: #f5f7fa;
  color: #2c3e50;
  line-height: 1.6;
}

.container {
  min-height: 100vh;
}

.topbar {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 24px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.brand { display: flex; align-items: center; gap: 12px; }
.brand .logo { font-size: 32px; }
.brand h1 { font-size: 24px; font-weight: 600; }
.brand .subtitle { font-size: 14px; opacity: 0.85; }

.stats { display: flex; gap: 24px; }
.stat { text-align: center; }
.stat-value { font-size: 24px; font-weight: 700; }
.stat-label { font-size: 12px; opacity: 0.85; text-transform: uppercase; }

main {
  max-width: 1200px;
  margin: 24px auto;
  padding: 0 24px;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
.card h2 { font-size: 18px; margin-bottom: 16px; color: #2c3e50; }

form { display: flex; flex-direction: column; gap: 12px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
label { display: flex; flex-direction: column; gap: 4px; }
label > span { font-size: 13px; color: #7f8c8d; font-weight: 500; }

input[type="text"], input[type="file"] {
  padding: 10px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 14px;
}
input[type="text"]:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); }

.file-label {
  border: 2px dashed #dcdfe6;
  border-radius: 6px;
  padding: 12px;
  transition: all 0.2s;
}
.file-label:hover { border-color: #667eea; background: #f8f9ff; }
.file-info {
  margin-top: 8px;
  font-size: 13px;
  color: #7f8c8d;
  display: flex;
  justify-content: space-between;
}

button {
  padding: 10px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
button:hover:not(:disabled) { background: #5568d3; }
button:disabled { opacity: 0.6; cursor: not-allowed; }

.message {
  margin-top: 12px;
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 14px;
}
.message.success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
.message.error   { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
.message.info    { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }

.list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.list-header h2 { margin: 0; }
.filter { display: flex; gap: 8px; }
.filter input { width: 240px; }
.filter button { background: #95a5a6; font-size: 13px; padding: 8px 14px; }

table { width: 100%; border-collapse: collapse; }
th {
  text-align: left;
  padding: 12px 8px;
  background: #f8f9fa;
  font-size: 12px;
  color: #7f8c8d;
  text-transform: uppercase;
  font-weight: 600;
  border-bottom: 1px solid #e4e7ed;
}
td { padding: 12px 8px; font-size: 14px; border-bottom: 1px solid #f0f2f5; }
tbody tr:hover { background: #f8f9ff; }

code {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-family: 'SF Mono', Monaco, monospace;
}

.actions { display: flex; gap: 8px; }
.btn-download { background: #27ae60; font-size: 12px; padding: 6px 12px; }
.btn-delete   { background: #e74c3c; font-size: 12px; padding: 6px 12px; }
.btn-download:hover { background: #229954; }
.btn-delete:hover   { background: #c0392b; }

.empty { text-align: center; color: #95a5a6; padding: 32px 0; }

.hint { font-size: 13px; color: #7f8c8d; margin-bottom: 12px; }
pre {
  background: #2c3e50;
  color: #ecf0f1;
  padding: 16px;
  border-radius: 6px;
  font-size: 13px;
  overflow-x: auto;
  font-family: 'SF Mono', Monaco, monospace;
}
</style>
