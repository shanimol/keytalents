import { cn } from "@/lib/utils"

const DEPT_COLORS: Record<string, string> = {
  Engineering: "bg-violet-100 text-violet-700 border-violet-200",
  Design: "bg-blue-100 text-blue-700 border-blue-200",
  Growth: "bg-amber-100 text-amber-700 border-amber-200",
  Marketing: "bg-orange-100 text-orange-700 border-orange-200",
  Product: "bg-teal-100 text-teal-700 border-teal-200",
  Sales: "bg-green-100 text-green-700 border-green-200",
  Finance: "bg-yellow-100 text-yellow-700 border-yellow-200",
  HR: "bg-pink-100 text-pink-700 border-pink-200",
  Operations: "bg-cyan-100 text-cyan-700 border-cyan-200",
}

const DEFAULT_DEPT_COLOR = "bg-gray-100 text-gray-600 border-gray-200"

interface DepartmentBadgeProps {
  department: string
  className?: string
}

export function DepartmentBadge({ department, className }: DepartmentBadgeProps) {
  const color = DEPT_COLORS[department] ?? DEFAULT_DEPT_COLOR
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
        color,
        className
      )}
    >
      {department}
    </span>
  )
}

interface StatusBadgeProps {
  isActive: boolean
  className?: string
}

export function StatusBadge({ isActive, className }: StatusBadgeProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm", className)}>
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          isActive ? "bg-green-500" : "bg-gray-400"
        )}
      />
      <span className={isActive ? "text-green-700" : "text-gray-500"}>
        {isActive ? "Active" : "Inactive"}
      </span>
    </span>
  )
}
