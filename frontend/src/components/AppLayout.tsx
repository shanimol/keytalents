import { Briefcase, FileText, LogOut, RefreshCw, Users, Users2 } from "lucide-react"
import { NavLink, Outlet } from "react-router-dom"
import { cn } from "@/lib/utils"

const navItems = [
  { to: "/employees", label: "Employees", icon: Users },
  { to: "/appraisal-cycles", label: "Appraisal Cycles", icon: RefreshCw },
  { to: "/appraisal-form-templates", label: "Appraisal Form Templates", icon: FileText },
  { to: "/teams", label: "Teams", icon: Users2 },
  { to: "/designations", label: "Designations", icon: Briefcase },
]

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r bg-card">
        <div className="flex h-16 items-center border-b px-6">
          <h1 className="text-xl font-semibold text-foreground">KeyTalent</h1>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
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
            <span className="text-sm text-muted-foreground">user@example.com</span>
            <button
              className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => {
                /* TODO: implement logout */
              }}
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
