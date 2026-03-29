import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, MoreVertical, Search, SlidersHorizontal, UserPlus } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { DeactivateConfirmDialog } from "@/components/employees/DeactivateConfirmDialog"
import { DeleteConfirmDialog } from "@/components/employees/DeleteConfirmDialog"
import { EmployeeForm } from "@/components/employees/EmployeeForm"
import { DepartmentBadge, StatusBadge } from "@/components/ui/Badge"
import {
  useCreateEmployeeMutation,
  useDeleteEmployeeMutation,
  useGetDesignationsQuery,
  useGetEmployeesQuery,
  useGetTeamsQuery,
  useToggleActiveMutation,
  useUpdateEmployeeMutation,
} from "@/features/employees/employeesApi"
import type { Employee, EmployeeCreate, EmployeeUpdate } from "@/features/employees/types"
import { cn } from "@/lib/utils"

const PER_PAGE = 10

// ---------------------------------------------------------------------------
// Debounce hook
// ---------------------------------------------------------------------------
function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debouncedValue
}

// ---------------------------------------------------------------------------
// Actions dropdown
// ---------------------------------------------------------------------------
function ActionsMenu({
  employee,
  onEdit,
  onToggle,
  onDelete,
}: {
  employee: Employee
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-40 rounded-lg border border-gray-100 bg-white py-1 shadow-lg">
          <button
            onClick={() => { setOpen(false); onEdit() }}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            Edit
          </button>
          <button
            onClick={() => { setOpen(false); onToggle() }}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            {employee.is_active ? "Deactivate" : "Activate"}
          </button>
          <div className="my-1 border-t border-gray-100" />
          <button
            onClick={() => { setOpen(false); onDelete() }}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------
function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-800">
      {initials}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sortable column header
// ---------------------------------------------------------------------------
type SortKey = "name" | "email" | "joining_date"

function SortableHeader({
  label,
  sortKey,
  currentSortBy,
  currentSortDir,
  onSort,
}: {
  label: string
  sortKey: SortKey
  currentSortBy: SortKey
  currentSortDir: "asc" | "desc"
  onSort: (key: SortKey) => void
}) {
  const isActive = currentSortBy === sortKey
  return (
    <button
      onClick={() => onSort(sortKey)}
      className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500 hover:text-gray-800"
    >
      {label}
      {isActive ? (
        currentSortDir === "asc" ? (
          <ChevronUp className="h-3.5 w-3.5 text-blue-700" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-blue-700" />
        )
      ) : (
        <ChevronUp className="h-3.5 w-3.5 opacity-30" />
      )}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function EmployeesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "")
  const debouncedSearch = useDebounce(searchInput)

  const page = parseInt(searchParams.get("page") ?? "1")
  const statusParam = searchParams.get("status") // "active" | "inactive" | null (all)
  const teamId = searchParams.get("team_id") ?? undefined
  const designationId = searchParams.get("designation_id") ?? undefined
  const sortBy = (searchParams.get("sort_by") ?? "name") as SortKey
  const sortDir = (searchParams.get("sort_dir") ?? "asc") as "asc" | "desc"

  const isActive: boolean | undefined =
    statusParam === "active" ? true : statusParam === "inactive" ? false : undefined

  // Sync debounced search into URL
  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (debouncedSearch) next.set("search", debouncedSearch)
      else next.delete("search")
      next.set("page", "1")
      return next
    }, { replace: true })
  }, [debouncedSearch]) // eslint-disable-line react-hooks/exhaustive-deps

  const { data, isLoading, isFetching } = useGetEmployeesQuery({
    search: searchParams.get("search") ?? undefined,
    is_active: isActive,
    team_id: teamId,
    designation_id: designationId,
    sort_by: sortBy,
    sort_dir: sortDir,
    page,
    per_page: PER_PAGE,
  })

  const { data: teams = [] } = useGetTeamsQuery()
  const { data: designations = [] } = useGetDesignationsQuery()

  const [createEmployee, { isLoading: creating }] = useCreateEmployeeMutation()
  const [updateEmployee, { isLoading: updating }] = useUpdateEmployeeMutation()
  const [toggleActive, { isLoading: toggling }] = useToggleActiveMutation()
  const [deleteEmployee, { isLoading: deleting }] = useDeleteEmployeeMutation()

  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Employee | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<Employee | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)

  const updateParam = (key: string, value: string | null) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value)
      else next.delete(key)
      next.set("page", "1")
      return next
    }, { replace: true })
  }

  const handleSort = (key: SortKey) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (prev.get("sort_by") === key) {
        next.set("sort_dir", prev.get("sort_dir") === "asc" ? "desc" : "asc")
      } else {
        next.set("sort_by", key)
        next.set("sort_dir", "asc")
      }
      next.set("page", "1")
      return next
    }, { replace: true })
  }

  const handleSubmit = async (formData: EmployeeCreate & { is_active?: boolean }) => {
    if (editTarget) {
      await updateEmployee({ id: editTarget.id, body: formData as EmployeeUpdate }).unwrap()
    } else {
      await createEmployee(formData).unwrap()
    }
    setFormOpen(false)
    setEditTarget(null)
  }

  const totalPages = data ? Math.ceil(data.total / PER_PAGE) : 1
  const start = data ? (page - 1) * PER_PAGE + 1 : 0
  const end = data ? Math.min(page * PER_PAGE, data.total) : 0

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your organization's talent and oversee team structures.
          </p>
        </div>
        <button
          onClick={() => { setEditTarget(null); setFormOpen(true) }}
          className="flex items-center gap-2 rounded-lg bg-blue-900 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-blue-800"
        >
          <UserPlus className="h-4 w-4" />
          + Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Team */}
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm">
          <span className="text-gray-500">Team:</span>
          <select
            value={teamId ?? ""}
            onChange={(e) => updateParam("team_id", e.target.value || null)}
            className="border-none bg-transparent font-medium text-gray-800 focus:outline-none"
          >
            <option value="">All Teams</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* Designation */}
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm">
          <span className="text-gray-500">Designation:</span>
          <select
            value={designationId ?? ""}
            onChange={(e) => updateParam("designation_id", e.target.value || null)}
            className="border-none bg-transparent font-medium text-gray-800 focus:outline-none"
          >
            <option value="">All Roles</option>
            {designations.map((d) => (
              <option key={d.id} value={d.id}>{d.title}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm">
          <span className="text-gray-500">Status:</span>
          <select
            value={statusParam ?? "all"}
            onChange={(e) => updateParam("status", e.target.value === "all" ? null : e.target.value)}
            className="border-none bg-transparent font-medium text-gray-800 focus:outline-none"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
          <SlidersHorizontal className="h-4 w-4" />
          More Filters
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Search inside table header */}
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees, roles, or teams…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left">
              <th className="px-6 py-3">
                <SortableHeader label="Name" sortKey="name" currentSortBy={sortBy} currentSortDir={sortDir} onSort={handleSort} />
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Emp Id</th>
              <th className="px-6 py-3">
                <SortableHeader label="Email" sortKey="email" currentSortBy={sortBy} currentSortDir={sortDir} onSort={handleSort} />
              </th>
              <th className="px-6 py-3">
                <SortableHeader label="Joining Date" sortKey="joining_date" currentSortBy={sortBy} currentSortDir={sortDir} onSort={handleSort} />
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Team</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Skills</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-400">
                  Loading employees…
                </td>
              </tr>
            ) : data?.items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-400">
                  No employees found.
                </td>
              </tr>
            ) : (
              data?.items.map((emp) => (
                <tr
                  key={emp.id}
                  className={cn(
                    "hover:bg-gray-50 transition-colors",
                    !emp.is_active && "opacity-60"
                  )}
                >
                  {/* Name */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={emp.name} />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{emp.name}</p>
                        <p className="text-xs text-gray-500">{emp.designation_title ?? "—"}</p>
                      </div>
                    </div>
                  </td>

                  {/* Employee ID */}
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{emp.employee_number}</p>
                  </td>

                  {/* Email */}
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700">{emp.email}</p>
                  </td>

                  {/* Joining Date */}
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700">
                      {new Date(emp.joining_date).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </td>

                  {/* Team */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700">{emp.team_name ?? "—"}</span>
                  </td>

                  {/* Skills */}
                  <td className="px-6 py-4">
                    {emp.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {emp.skills.slice(0, 3).map((skill) => (
                          <span
                            key={skill.id}
                            className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
                          >
                            {skill.name}
                          </span>
                        ))}
                        {emp.skills.length > 3 && (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                            +{emp.skills.length - 3}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <StatusBadge isActive={emp.is_active} />
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <ActionsMenu
                      employee={emp}
                      onEdit={() => { setEditTarget(emp); setFormOpen(true) }}
                      onToggle={() => setDeactivateTarget(emp)}
                      onDelete={() => setDeleteTarget(emp)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {data && data.total > 0 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
            <p className="text-sm text-gray-500">
              Showing <span className="font-medium text-gray-900">{start}–{end}</span> of{" "}
              <span className="font-medium text-gray-900">{data.total}</span> employees
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => updateParam("page", String(page - 1))}
                disabled={page <= 1}
                className="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = i + 1
                return (
                  <button
                    key={p}
                    onClick={() => updateParam("page", String(p))}
                    className={cn(
                      "h-8 w-8 rounded text-sm font-medium",
                      p === page
                        ? "bg-blue-900 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    {p}
                  </button>
                )
              })}

              {totalPages > 5 && <span className="px-1 text-gray-400">…</span>}

              <button
                onClick={() => updateParam("page", String(page + 1))}
                disabled={page >= totalPages || isFetching}
                className="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs & forms */}
      <EmployeeForm
        open={formOpen}
        employee={editTarget}
        onSubmit={handleSubmit}
        onClose={() => { setFormOpen(false); setEditTarget(null) }}
        isLoading={creating || updating}
      />

      <DeactivateConfirmDialog
        open={!!deactivateTarget}
        employeeName={deactivateTarget?.name ?? ""}
        isActive={deactivateTarget?.is_active ?? true}
        isLoading={toggling}
        onConfirm={async () => {
          if (deactivateTarget) await toggleActive(deactivateTarget.id).unwrap()
          setDeactivateTarget(null)
        }}
        onClose={() => setDeactivateTarget(null)}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        employeeName={deleteTarget?.name ?? ""}
        isLoading={deleting}
        onConfirm={async () => {
          if (deleteTarget) await deleteEmployee(deleteTarget.id).unwrap()
          setDeleteTarget(null)
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
