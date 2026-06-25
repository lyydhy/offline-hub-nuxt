import { useState, useEffect } from 'react'

export default function About() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const update = () => setTime(new Date().toLocaleString('zh-CN'))
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div>
      <h1 style={{ color: '#61dafb' }}>ℹ️ About (React 19)</h1>
      <p>这是关于页。路由:<code>/about</code></p>
      <p>当前时间:<strong>{time}</strong></p>
      <p style={{ color: '#7f8c8d', fontSize: 14 }}>
        💡 路由是 history 模式,URL 形如 <code>app://main/about</code>
        (WebView 加载本地资源,不会真的发 HTTP 请求)
      </p>
    </div>
  )
}
