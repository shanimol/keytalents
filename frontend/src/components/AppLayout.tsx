import {
  Briefcase,
  ClipboardList,
  FileText,
  LogOut,
  RefreshCw,
  Star,
  Users,
  Users2,
} from "lucide-react"
import { NavLink, Outlet, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { logout, selectCurrentUser, type UserRole } from "@/features/auth/authSlice"

interface NavItem {
  to: string
  label: string
  icon: React.ElementType
  roles: UserRole[]
}

const NAV_ITEMS: NavItem[] = [
  { to: "/employees", label: "Employees", icon: Users, roles: ["admin"] },
  { to: "/appraisal-cycles", label: "Appraisal Cycles", icon: RefreshCw, roles: ["admin"] },
  {
    to: "/appraisal-form-templates",
    label: "Form Templates",
    icon: FileText,
    roles: ["admin"],
  },
  { to: "/teams", label: "Teams", icon: Users2, roles: ["admin"] },
  { to: "/designations", label: "Designations", icon: Briefcase, roles: ["admin"] },
  {
    to: "/my-appraisals",
    label: "My Appraisals",
    icon: ClipboardList,
    roles: ["employee", "lead"],
  },
  { to: "/my-reviews", label: "My Reviews", icon: Star, roles: ["lead"] },
]

export default function AppLayout() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const user = useAppSelector(selectCurrentUser)

  const visibleItems = NAV_ITEMS.filter(
    (item) => user && item.roles.includes(user.role)
  )

  const handleLogout = () => {
    dispatch(logout())
    navigate("/login", { replace: true })
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r bg-card">
        <div className="flex h-16 items-center gap-2.5 border-b px-5">
          {/* Mini brand icon */}
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-900">
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
              <circle cx="10" cy="10" r="1.5" fill="white" />
              {[0, 60, 120, 180, 240, 300].map((deg) => {
                const rad = (deg * Math.PI) / 180
                return (
                  <line
                    key={deg}
                    x1="10"
                    y1="10"
                    x2={10 + 7 * Math.cos(rad)}
                    y2={10 + 7 * Math.sin(rad)}
                    stroke="white"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                )
              })}
            </svg>
          </div>
          <h1 className="text-base font-semibold text-foreground">KeyTalent</h1>
        </div>

        <nav className="flex-1 space-y-0.5 p-3">
          {visibleItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-900 text-white"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b bg-card px-6">
          <div />
          <div className="flex items-center gap-4">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                referrerPolicy="no-referrer"
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-900">
                {user?.name?.[0]?.toUpperCase() ?? "U"}
              </div>
            )}
            <span className="text-sm text-muted-foreground">{user?.name ?? user?.email}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
