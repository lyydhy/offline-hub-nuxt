import { Routes, Route, NavLink } from 'react-router-dom'
import Home from './pages/Home'
import About from './pages/About'

function App() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 24, fontFamily: 'sans-serif' }}>
      <nav style={{ display: 'flex', gap: 16, marginBottom: 24, paddingBottom: 16, borderBottom: '2px solid #61dafb' }}>
        <NavLink
          to="/"
          style={({ isActive }) => ({
            color: '#61dafb',
            fontWeight: 500,
            textDecoration: isActive ? 'underline' : 'none',
          })}
        >
          Home
        </NavLink>
        <NavLink
          to="/about"
          style={({ isActive }) => ({
            color: '#61dafb',
            fontWeight: 500,
            textDecoration: isActive ? 'underline' : 'none',
          })}
        >
          About
        </NavLink>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
