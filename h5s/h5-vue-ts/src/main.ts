import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import './style.css'
import App from './App.vue'
import Home from './pages/Home.vue'
import About from './pages/About.vue'

// ⚠️ 关键:createWebHashHistory(不是 createWebHistory)
// 原因:WebView 加载的是 app://main/index.html 这种协议,服务器端路由
// (BrowserRouter / createWebHistory) 没法处理 — 服务只认识 index.html
// hash 模式把路由放在 # 后面,纯前端解析,任何协议都 OK
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/about', component: About },
  ],
})

createApp(App).use(router).mount('#app')
