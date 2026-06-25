import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

// ⚠️ React 项目用 BrowserRouter(默认 history 模式)
// URL 形如 app://main/about(不是 #/about)
// 注意:WebView 加载协议下,BrowserRouter 不会去请求服务器,只会触发 popstate 事件
// 实际跳转由 WebView 拦截 + js 桥接
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
