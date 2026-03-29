import { useGoogleLogin } from "@react-oauth/google"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useLoginWithGoogleMutation } from "@/features/auth/authApi"

/* ─── Network background ──────────────────────────────────────────────────── */

const NODE_POSITIONS = [
  [120, 80], [280, 60], [460, 120], [640, 70], [820, 100], [980, 60], [1100, 130],
  [60, 220], [200, 280], [380, 240], [560, 300], [740, 250], [900, 220], [1060, 290],
  [140, 420], [320, 480], [500, 400], [680, 460], [860, 390], [1020, 440],
  [80, 580], [260, 620], [440, 560], [620, 600], [800, 540], [960, 590], [1140, 550],
  [180, 720], [360, 700], [560, 740], [740, 710], [920, 730],
] as const

const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6],
  [0, 7], [1, 8], [2, 9], [3, 10], [4, 11], [5, 12], [6, 13],
  [7, 8], [8, 9], [9, 10], [10, 11], [11, 12], [12, 13],
  [7, 14], [8, 15], [9, 16], [10, 17], [11, 18], [12, 19],
  [14, 15], [15, 16], [16, 17], [17, 18], [18, 19],
  [14, 20], [15, 21], [16, 22], [17, 23], [18, 24], [19, 25],
  [20, 21], [21, 22], [22, 23], [23, 24], [24, 25], [25, 26],
  [20, 27], [22, 28], [23, 29], [24, 30], [25, 31],
  [27, 28], [28, 29], [29, 30], [30, 31],
  [1, 9], [3, 11], [8, 16], [10, 18], [15, 22], [17, 24],
] as const

function NetworkBackground() {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {/* Soft blob shapes */}
      <ellipse cx="120" cy="650" rx="160" ry="110" fill="rgba(147,197,253,0.18)" />
      <ellipse cx="1080" cy="160" rx="190" ry="130" fill="rgba(147,197,253,0.15)" />
      <ellipse cx="600" cy="740" rx="220" ry="100" fill="rgba(147,197,253,0.12)" />
      <ellipse cx="950" cy="500" rx="140" ry="90" fill="rgba(96,165,250,0.1)" />
      <ellipse cx="250" cy="350" rx="120" ry="80" fill="rgba(147,197,253,0.1)" />

      {/* Connection lines */}
      {CONNECTIONS.map(([a, b], i) => (
        <line
          key={i}
          x1={NODE_POSITIONS[a][0]}
          y1={NODE_POSITIONS[a][1]}
          x2={NODE_POSITIONS[b][0]}
          y2={NODE_POSITIONS[b][1]}
          stroke="rgba(30,64,175,0.18)"
          strokeWidth="1"
        />
      ))}

      {/* Nodes */}
      {NODE_POSITIONS.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="4" fill="rgba(30,64,175,0.45)" />
      ))}
    </svg>
  )
}

/* ─── Key Talents star logo ───────────────────────────────────────────────── */

function BrandIcon() {
  return (
    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-900 shadow-lg">
      <svg viewBox="0 0 40 40" className="h-9 w-9" fill="none" aria-hidden="true">
        <circle cx="20" cy="20" r="3" fill="white" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
          const rad = (deg * Math.PI) / 180
          const x2 = 20 + 13 * Math.cos(rad)
          const y2 = 20 + 13 * Math.sin(rad)
          const dotX = 20 + 15 * Math.cos(rad)
          const dotY = 20 + 15 * Math.sin(rad)
          return (
            <g key={deg}>
              <line x1="20" y1="20" x2={x2} y2={y2} stroke="white" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx={dotX} cy={dotY} r="1.5" fill="white" />
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/* ─── Google sign-in button ───────────────────────────────────────────────── */

function GoogleIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

/* ─── Login page ──────────────────────────────────────────────────────────── */

export default function LoginPage() {
  const navigate = useNavigate()
  const [loginWithGoogle, { isLoading }] = useLoginWithGoogleMutation()
  const [error, setError] = useState<string | null>(null)

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError(null)
      try {
        await loginWithGoogle({ token: tokenResponse.access_token }).unwrap()
        navigate("/", { replace: true })
      } catch {
        setError("Sign-in failed. Please try again.")
      }
    },
    onError: () => setError("Google sign-in was cancelled or failed."),
  })

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-blue-100 via-sky-100 to-blue-200 p-4">
      <NetworkBackground />

      {/* Outer glass card */}
      <div className="relative z-10 w-full max-w-3xl rounded-3xl border border-white/40 bg-white/25 p-10 shadow-2xl backdrop-blur-sm">
        {/* Branding */}
        <div className="mb-8 text-center">
          <BrandIcon />
          <h1 className="text-2xl font-bold text-blue-900">Key Talents</h1>
          <p className="mt-1 text-sm tracking-wide text-blue-600">Curating Excellence in HR</p>
        </div>

        {/* Inner login card */}
        <div className="mx-auto max-w-sm rounded-2xl bg-white px-8 py-8 shadow-md">
          <h2 className="mb-1 text-center text-xl font-semibold text-gray-900">Welcome back</h2>
          <p className="mb-7 text-center text-sm text-gray-500">
            Sign in to manage your talent ecosystem
          </p>

          <button
            onClick={() => handleGoogleLogin()}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <GoogleIcon />
            {isLoading ? "Signing in…" : "Sign in with Google"}
          </button>

          {error && (
            <p className="mt-4 text-center text-xs text-red-500">{error}</p>
          )}
        </div>

        {/* Footer links */}
        <div className="mt-8 flex items-center justify-center gap-5 text-xs text-blue-700/60">
          <a href="#" className="hover:text-blue-800">Terms of Service</a>
          <span>·</span>
          <a href="#" className="hover:text-blue-800">Privacy Policy</a>
          <span>·</span>
          <a href="#" className="hover:text-blue-800">Support</a>
        </div>
      </div>
    </div>
  )
}
