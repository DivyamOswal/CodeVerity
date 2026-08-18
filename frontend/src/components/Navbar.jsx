import { useState, useRef, useEffect, useMemo } from "react"
import { NavLink, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../App"

function getInitials(token) {
  if (!token) return "U"
  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    const name = payload.name ?? payload.email ?? ""
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U"
  } catch { return "U" }
}

function getUserInfo(token) {
  if (!token) return { name: "", email: "" }
  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    return { name: payload.name ?? "", email: payload.email ?? "" }
  } catch { return { name: "", email: "" } }
}

function DropItem({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors duration-150"
      style={{ color: 'rgba(255,255,255,0.55)' }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(139,92,246,0.08)'
        e.currentTarget.style.color = 'rgba(255,255,255,0.9)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = 'rgba(255,255,255,0.55)'
      }}
    >
      <span>{icon}</span>{label}
    </button>
  )
}

export default function Navbar() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { isAuth, token, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)
  const dropRef = useRef(null)

  useEffect(() => {
    const handler = e => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  useEffect(() => { setMenuOpen(false); setDropOpen(false) }, [location.pathname])

  const initials = useMemo(() => getInitials(token), [token])
  const userInfo = useMemo(() => getUserInfo(token), [token])

  const handleLogout = () => { setDropOpen(false); logout(); navigate("/login") }

  const NavItem = ({ to, label }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150
        ${isActive
          ? 'text-violet-300 bg-violet-500/10 border border-violet-500/20'
          : 'text-gray-400 hover:text-white'}`
      }
    >
      {label}
    </NavLink>
  )

  return (
    <nav
      className="sticky top-0 z-50 px-6 py-3"
      style={{
        background: 'rgba(7,7,15,0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(139,92,246,0.12)',
      }}
    >
      <div className="flex items-center justify-between gap-4 max-w-6xl mx-auto">

        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2 shrink-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#a21caf)' }}
          >
            🛡️
          </div>
          <span
            className="font-bold text-[17px] hidden sm:block"
            style={{
              background: 'linear-gradient(135deg, #a78bfa, #e879f9)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Devguard AI
          </span>
        </NavLink>

        {/* Desktop links */}
        {isAuth && (
          <div className="hidden md:flex items-center gap-1">
            <NavItem to="/dashboard" label="Dashboard" />
            <NavItem to="/history"   label="History"   />
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3">
          {isAuth ? (
            <div className="relative" ref={dropRef}>
              {/* Avatar button */}
              <button
                onClick={() => setDropOpen(p => !p)}
                aria-label="Open user menu"
                aria-expanded={dropOpen}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white transition-all duration-150 hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg,#7c3aed,#a21caf)',
                  boxShadow: dropOpen ? '0 0 20px rgba(139,92,246,0.4)' : '0 0 12px rgba(139,92,246,0.2)',
                }}
              >
                {initials}
              </button>

              {/* Dropdown */}
              {dropOpen && (
                <div
                  className="absolute right-0 top-12 w-54 overflow-hidden z-50"
                  style={{
                    background: 'rgba(10,10,20,0.95)',
                    border: '1px solid rgba(139,92,246,0.2)',
                    borderRadius: 16,
                    boxShadow: '0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.08)',
                    backdropFilter: 'blur(20px)',
                    animation: 'fadeDown 0.18s ease both',
                  }}
                >
                  {/* User info */}
                  <div
                    className="px-4 py-3"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <p className="text-[13px] font-semibold text-white truncate">
                      {userInfo.name || initials}
                    </p>
                    <p className="text-[11px] mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {userInfo.email || "Signed in"}
                    </p>
                  </div>

                  <div className="py-1">
                    <DropItem icon="👤" label="Profile"   onClick={() => navigate("/profile")}   />
                    <DropItem icon="⚙️" label="Settings"  onClick={() => navigate("/settings")}  />
                    <DropItem icon="📋" label="History"   onClick={() => navigate("/history")}   />
                    <DropItem icon="📊" label="Dashboard" onClick={() => navigate("/dashboard")} />
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} className="py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors duration-150"
                      style={{ color: '#f87171' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span>🚪</span> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <NavLink
                to="/login"
                className="px-4 py-1.5 text-[13px] rounded-lg font-medium transition-all duration-150"
                style={{
                  border: '1px solid rgba(139,92,246,0.25)',
                  color: 'rgba(255,255,255,0.6)',
                  background: 'rgba(139,92,246,0.06)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.14)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(139,92,246,0.06)'}
              >
                Sign in
              </NavLink>
              <NavLink
                to="/register"
                className="px-4 py-1.5 text-[13px] rounded-lg font-semibold text-white transition-all duration-150 hover:scale-105"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#a21caf)' }}
              >
                Register
              </NavLink>
            </div>
          )}

          {/* Mobile hamburger */}
          {isAuth && (
            <button
              onClick={() => setMenuOpen(p => !p)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="md:hidden text-[18px] transition-colors duration-150"
              style={{ color: menuOpen ? '#a78bfa' : 'rgba(255,255,255,0.4)' }}
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {isAuth && menuOpen && (
        <div
          className="md:hidden mt-3 pt-3 pb-2 flex flex-col gap-1"
          style={{ borderTop: '1px solid rgba(139,92,246,0.12)' }}
        >
          {[
            ["/dashboard", "📊 Dashboard"],
            ["/history",   "📋 History"  ],
            ["/profile",   "👤 Profile"  ],
            ["/settings",  "⚙️ Settings" ],
          ].map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `px-4 py-2.5 rounded-xl text-[13px] transition-colors duration-150
                ${isActive
                  ? 'bg-violet-500/10 text-violet-300 border border-violet-500/15'
                  : 'text-gray-400 hover:text-white'}`
              }
              onMouseEnter={e => {
                if (!e.currentTarget.className.includes('text-violet')) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                }
              }}
              onMouseLeave={e => {
                if (!e.currentTarget.className.includes('text-violet')) {
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              {label}
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="px-4 py-2.5 text-[13px] rounded-xl text-left transition-colors duration-150"
            style={{ color: '#f87171' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            🚪 Sign out
          </button>
        </div>
      )}

      <style>{`
        @keyframes fadeDown { from { transform:translateY(-8px); opacity:0 } to { transform:translateY(0); opacity:1 } }
      `}</style>
    </nav>
  )
}