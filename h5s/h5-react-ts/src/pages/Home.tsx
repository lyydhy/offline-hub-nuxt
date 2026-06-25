import { useState } from 'react'

export default function Home() {
  const [count, setCount] = useState(0)
  return (
    <div>
      <h1 style={{ color: '#61dafb' }}>🏠 Home (React 19)</h1>
      <p>这是首页。路由:<code>/</code></p>
      <button
        onClick={() => setCount(c => c + 1)}
        style={{
          padding: '12px 24px',
          background: '#61dafb',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          fontSize: 16,
          cursor: 'pointer',
        }}
      >
        点击了 {count} 次
      </button>
    </div>
  )
}
