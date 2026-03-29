import { ChevronDown, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import {
  useGetDesignationsQuery,
  useGetSkillsQuery,
  useGetTeamsQuery,
} from "@/features/employees/employeesApi"
import type { Employee, EmployeeCreate, Skill } from "@/features/employees/types"
import { cn } from "@/lib/utils"

interface Props {
  open: boolean
  employee: Employee | null  // null = create mode
  onSubmit: (data: EmployeeCreate & { is_active?: boolean }) => void
  onClose: () => void
  isLoading: boolean
}

// ---------------------------------------------------------------------------
// Skill multiselect with chips
// ---------------------------------------------------------------------------
function SkillMultiSelect({
  selectedIds,
  onChange,
  skills,
}: {
  selectedIds: string[]
  onChange: (ids: string[]) => void
  skills: Skill[]
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((s) => s !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  const remove = (id: string) => onChange(selectedIds.filter((s) => s !== id))

  const selectedSkills = skills.filter((s) => selectedIds.includes(s.id))
  const filtered = skills.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) && !selectedIds.includes(s.id)
  )

  return (
    <div ref={ref} className="relative">
      {/* Chip display + toggle button */}
      <div
        className="flex min-h-[38px] cursor-pointer flex-wrap items-center gap-1.5 rounded-lg border border-gray-300 px-2.5 py-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
        onClick={() => setOpen((o) => !o)}
      >
        {selectedSkills.length === 0 && (
          <span className="text-sm text-gray-400">Select skills…</span>
        )}
        {selectedSkills.map((skill) => (
          <span
            key={skill.id}
            className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
          >
            {skill.name}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); remove(skill.id) }}
              className="text-blue-600 hover:text-blue-900"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <ChevronDown className="ml-auto h-4 w-4 shrink-0 text-gray-400" />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 p-2">
            <input
              autoFocus
              type="text"
              placeholder="Search skills…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <ul className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-xs text-gray-400">No skills found</li>
            ) : (
              filtered.map((skill) => (
                <li key={skill.id}>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggle(skill.id) }}
                    className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-blue-50"
                  >
                    {skill.name}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

interface FormState extends EmployeeCreate {
  is_active: boolean
}

const EMPTY: FormState = {
  employee_number: "",
  name: "",
  email: "",
  joining_date: "",
  total_experience: 0,
  skill_ids: [],
  team_id: null,
  designation_id: null,
  last_appraisal_cycle: null,
  is_active: true,
}

export function EmployeeForm({ open, employee, onSubmit, onClose, isLoading }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY)
  const panelRef = useRef<HTMLDivElement>(null)
  const { data: teams = [] } = useGetTeamsQuery()
  const { data: designations = [] } = useGetDesignationsQuery()
  const { data: skills = [] } = useGetSkillsQuery()

  useEffect(() => {
    if (open) {
      if (employee) {
        setForm({
          employee_number: employee.employee_number,
          name: employee.name,
          email: employee.email,
          joining_date: employee.joining_date,
          total_experience: employee.total_experience,
          skill_ids: employee.skills.map((s) => s.id),
          team_id: employee.team_id,
          designation_id: employee.designation_id,
          last_appraisal_cycle: employee.last_appraisal_cycle,
          is_active: employee.is_active,
        })
      } else {
        setForm(EMPTY)
      }
    }
  }, [open, employee])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...form,
      total_experience: Number(form.total_experience),
      team_id: form.team_id || null,
      designation_id: form.designation_id || null,
      last_appraisal_cycle: form.last_appraisal_cycle || null,
      is_active: form.is_active,
    })
  }

  const labelCls = "block text-xs font-medium text-gray-600 mb-1"
  const inputCls =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"

  return (
    <>
      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} aria-hidden="true" />
      )}

      {/* Sliding panel */}
      <div
        ref={panelRef}
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col bg-white shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {employee ? "Edit Employee" : "Add Employee"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1 space-y-4 px-6 py-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Employee Number *</label>
                <input
                  type="text"
                  required
                  value={form.employee_number}
                  onChange={(e) => set("employee_number", e.target.value)}
                  placeholder="KT-0001"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Jane Smith"
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Email *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="jane@company.com"
                className={inputCls}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Joining Date *</label>
                <input
                  type="date"
                  required
                  value={form.joining_date}
                  onChange={(e) => set("joining_date", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Experience (years) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  step={0.5}
                  value={form.total_experience}
                  onChange={(e) => set("total_experience", parseFloat(e.target.value) || 0)}
                  className={inputCls}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Team</label>
                <select
                  value={form.team_id ?? ""}
                  onChange={(e) => set("team_id", e.target.value || null)}
                  className={inputCls}
                >
                  <option value="">— No Team —</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Designation</label>
                <select
                  value={form.designation_id ?? ""}
                  onChange={(e) => set("designation_id", e.target.value || null)}
                  className={inputCls}
                >
                  <option value="">— No Designation —</option>
                  {designations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls}>Skills</label>
              <SkillMultiSelect
                selectedIds={form.skill_ids}
                onChange={(ids) => set("skill_ids", ids)}
                skills={skills}
              />
            </div>

            <div>
              <label className={labelCls}>Last Appraisal Cycle</label>
              <input
                type="text"
                value={form.last_appraisal_cycle ?? ""}
                onChange={(e) => set("last_appraisal_cycle", e.target.value || null)}
                placeholder="Jan 2026"
                className={inputCls}
              />
            </div>

            {employee && (
              <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Status</p>
                  <p className="text-xs text-gray-500">
                    {form.is_active ? "Employee is active" : "Employee is inactive"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => set("is_active", !form.is_active)}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none",
                    form.is_active ? "bg-blue-900" : "bg-gray-300"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200",
                      form.is_active ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-lg bg-blue-900 px-5 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60"
            >
              {isLoading ? "Saving…" : employee ? "Save Changes" : "Add Employee"}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
