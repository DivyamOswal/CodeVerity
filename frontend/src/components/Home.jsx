import { Link } from "react-router-dom"
import { useEffect, useState, useRef } from "react"

/* Particle canvas  */
function ParticleField() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx    = canvas.getContext("2d")
    let animId

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener("resize", resize)

    const particles = Array.from({ length: 55 }, () => ({
      x:  Math.random() * window.innerWidth,
      y:  Math.random() * window.innerHeight,
      r:  Math.random() * 1.2 + 0.3,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      o:  Math.random() * 0.35 + 0.08,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width)  p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(139,92,246,${p.o})`
        ctx.fill()
      })

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx   = particles[i].x - particles[j].x
          const dy   = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 110) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(139,92,246,${0.1 * (1 - dist / 110)})`
            ctx.lineWidth = 0.4
            ctx.stroke()
          }
        }
      }
      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />
}

/* Typed word  */
function TypedWord({ words }) {
  const [index, setIndex] = useState(0)
  const [text,  setText]  = useState("")
  const [del,   setDel]   = useState(false)

  useEffect(() => {
    const word  = words[index % words.length]
    const speed = del ? 38 : 85

    if (!del && text === word) {
      const t = setTimeout(() => setDel(true), 1600)
      return () => clearTimeout(t)
    }
    if (del && text === "") {
      setDel(false)
      setIndex(i => i + 1)
      return
    }
    const t = setTimeout(() => {
      setText(del ? text.slice(0, -1) : word.slice(0, text.length + 1))
    }, speed)
    return () => clearTimeout(t)
  }, [text, del, index, words])

  return (
    <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
      {text}
      <span className="text-violet-400 animate-pulse">|</span>
    </span>
  )
}

/* Feature card  */
const colorMap = {
  violet:  { border: "rgba(139,92,246,0.3)",  glow: "rgba(139,92,246,0.12)", icon: "#a78bfa", bg: "rgba(139,92,246,0.1)"  },
  fuchsia: { border: "rgba(217,70,239,0.3)",  glow: "rgba(217,70,239,0.12)", icon: "#e879f9", bg: "rgba(217,70,239,0.1)"  },
  cyan:    { border: "rgba(34,211,238,0.3)",   glow: "rgba(34,211,238,0.1)",  icon: "#22d3ee", bg: "rgba(34,211,238,0.08)" },
}

function Feature({ icon, title, desc, delay, color }) {
  const [hovered, setHovered] = useState(false)
  const c = colorMap[color]

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative group rounded-2xl p-6 text-left overflow-hidden cursor-default transition-all duration-300 ease-out"
      style={{
        background:   'rgba(255,255,255,0.025)',
        border:       `1px solid ${hovered ? c.border : 'rgba(255,255,255,0.07)'}`,
        transform:    hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow:    hovered ? `0 20px 40px ${c.glow}` : 'none',
        animation:    `fadeUp 0.6s ${delay} ease both`,
      }}
    >
      {/* Glow blob */}
      <div
        className='absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl transition-opacity duration-500'
        style={{ background: c.bg, opacity: hovered ? 0.5 : 0 }}
      />

      {/* Icon */}
      <div
        className='w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300'
        style={{ background: c.bg, transform: hovered ? 'scale(1.1)' : 'scale(1)' }}
      >
        <span className='text-xl'>{icon}</span>
      </div>

      <h3 className='font-semibold text-white text-[13.5px] tracking-wide mb-2'>{title}</h3>
      <p className='text-[12px] leading-relaxed' style={{ color: 'rgba(255,255,255,0.35)' }}>{desc}</p>
    </div>
  )
}

/* Stat pill */
function StatPill({ value, label }) {
  return (
    <div
      className='flex flex-col items-center px-6 py-3.5 rounded-2xl'
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <span className='text-2xl font-bold text-white tabular-nums'>{value}</span>
      <span className='text-[11px] mt-0.5' style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</span>
    </div>
  )
}

/* Scanline  */
function ScanLine() {
  return (
    <div className='absolute inset-0 pointer-events-none overflow-hidden rounded-xl'>
      <div
        className='absolute left-0 right-0 h-px'
        style={{
          background: 'linear-gradient(90deg,transparent,rgba(167,139,250,0.5),transparent)',
          animation: 'scanline 3s ease-in-out infinite',
        }}
      />
    </div>
  )
}

/* Home  */
export default function Home() {
  const token = localStorage.getItem("token")
  const [show, setShow] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      className='relative min-h-screen flex flex-col items-center justify-center px-6 text-white overflow-hidden'
      style={{ background: '#07070f' }}
    >
      {/* Radial background glow */}
      <div
        className='absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none'
        style={{ background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.1) 0%, transparent 65%)' }}
      />
      {/* Second soft glow  bottom right */}
      <div
        className='absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none'
        style={{ background: 'radial-gradient(ellipse at center, rgba(217,70,239,0.06) 0%, transparent 70%)' }}
      />

      <ParticleField />

      {/* Content  */}
      <div
        className={`relative z-10 max-w-3xl w-full text-center transition-all duration-700 ease-out
          ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
      >

        {/* Badge */}
        <div
          className='inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11.5px] font-medium mb-7'
          style={{
            background: 'rgba(139,92,246,0.1)',
            border: '1px solid rgba(139,92,246,0.3)',
            color: '#c4b5fd',
            animation: 'fadeDown 0.6s ease both',
          }}
        >
          <span
            className='w-1.5 h-1.5 rounded-full animate-pulse'
            style={{ background: '#a78bfa' }}
          />
          Powered by AI · Now in Beta
        </div>

        {/* Heading */}
        <h1
          className='text-5xl md:text-[4rem] font-extrabold leading-[1.08] mb-3 tracking-tight'
          style={{ animation: 'fadeUp 0.6s 0.1s ease both', animationFillMode: 'both' }}
        >
          <span className='text-white'>Devguard</span>
          <span
            style={{
              background: 'linear-gradient(135deg, #a78bfa 0%, #e879f9 50%, #22d3ee 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          > AI</span>
        </h1>

        {/* Typed subtitle */}
        <p
          className='text-xl md:text-2xl font-medium mb-5 h-8'
          style={{ animation: 'fadeUp 0.6s 0.2s ease both', animationFillMode: 'both' }}
        >
          <TypedWord words={["Finds your bugs.", "Flags vulnerabilities.", "Generates tests.", "Ships confidence."]} />
        </p>

        {/* Description */}
        <p
          className='text-sm md:text-base max-w-xl mx-auto mb-9 leading-relaxed'
          style={{
            color: 'rgba(255,255,255,0.38)',
            animation: 'fadeUp 0.6s 0.3s ease both',
            animationFillMode: 'both',
          }}
        >
          Drop any public GitHub URL and get a full AI-powered audit architecture analysis,
          security scan, bug report, and auto-generated tests in under 60 seconds.
        </p>

        {/* CTA Buttons */}
        <div
          className='flex justify-center gap-3 flex-wrap mb-10'
          style={{ animation: 'fadeUp 0.6s 0.4s ease both', animationFillMode: 'both' }}
        >
          {token ? (
            <Link
              to='/dashboard'
              className='relative group px-7 py-3 rounded-xl font-semibold text-sm overflow-hidden transition-all duration-200 hover:scale-105 active:scale-95'
              style={{
                background: 'linear-gradient(135deg,#7c3aed,#a21caf)',
                boxShadow: '0 0 30px rgba(139,92,246,0.25)',
              }}
            >
              <ScanLine />
              🚀 Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                to='/login'
                className='relative group px-7 py-3 rounded-xl font-semibold text-sm overflow-hidden transition-all duration-200 hover:scale-105 active:scale-95'
                style={{
                  background: 'linear-gradient(135deg,#7c3aed,#a21caf)',
                  boxShadow: '0 0 30px rgba(139,92,246,0.2)',
                }}
              >
                <ScanLine />
                Sign In
              </Link>
              <Link
                to='/register'
                className='px-7 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95'
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(8px)',
                  color: 'rgba(255,255,255,0.8)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                Get Started Free →
              </Link>
            </>
          )}
        </div>

        {/* Stats */}
        <div
          className='flex justify-center gap-3 flex-wrap mb-14'
          style={{ animation: 'fadeUp 0.6s 0.5s ease both', animationFillMode: 'both' }}
        >
          <StatPill value="100+" label="Repos Scanned"  />
          <StatPill value="98%"  label="Issue Accuracy" />
          <StatPill value="<60s" label="Avg Audit Time" />
        </div>

        {/* Feature cards */}
        <div className='grid md:grid-cols-3 gap-4'>
          <Feature
            icon="🐛" title="AI Bug Detection"
            desc="Pinpoints logic errors, edge cases, and anti-patterns across your entire codebase."
            color="violet" delay="0.55s"
          />
          <Feature
            icon="🔐" title="Security Analysis"
            desc="Scans for OWASP vulnerabilities, exposed secrets, and injection risks instantly."
            color="fuchsia" delay="0.65s"
          />
          <Feature
            icon="📄" title="Smart PDF Reports"
            desc="One-click export of your full audit with scores, grades, and a fix roadmap."
            color="cyan" delay="0.75s"
          />
        </div>

        {/* Footer note */}
        <p
          className='text-xs mt-10'
          style={{
            color: 'rgba(255,255,255,0.2)',
            animation: 'fadeUp 0.6s 0.85s ease both',
            animationFillMode: 'both',
          }}
        >
          No credit card required · Works with any public GitHub repo
        </p>
      </div>

      <style>{`
        @keyframes fadeUp   { from { transform:translateY(18px); opacity:0 } to { transform:translateY(0); opacity:1 } }
        @keyframes fadeDown { from { transform:translateY(-12px); opacity:0 } to { transform:translateY(0); opacity:1 } }
        @keyframes scanline { 0% { top:-2px; opacity:0 } 8% { opacity:1 } 92% { opacity:1 } 100% { top:100%; opacity:0 } }
      `}</style>
    </div>
  )
}