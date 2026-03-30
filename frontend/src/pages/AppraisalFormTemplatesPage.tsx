import {
  Archive,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  useActivateTemplateMutation,
  useArchiveTemplateMutation,
  useCopyTemplateMutation,
  useCreateTemplateMutation,
  useDeleteTemplateMutation,
  useGetTemplatesQuery,
} from "@/features/appraisal-templates/templatesApi"
import type { AppraisalTemplate, TemplateStatus } from "@/features/appraisal-templates/types"
import { cn } from "@/lib/utils"

const PER_PAGE = 10

function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

function StatusBadge({ status }: { status: TemplateStatus }) {
  const styles: Record<TemplateStatus, string> = {
    draft: "bg-gray-100 text-gray-600",
    active: "bg-green-100 text-green-700",
    archived: "bg-orange-100 text-orange-700",
  }
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", styles[status])}>
      {status}
    </span>
  )
}

function DesignationChips({ designations }: { designations: AppraisalTemplate["designations"] }) {
  const max = 3
  const visible = designations.slice(0, max)
  const extra = designations.length - max
  if (designations.length === 0) {
    return <span className="text-xs text-gray-400">None</span>
  }
  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map((d) => (
        <span key={d.id} className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
          {d.name}
        </span>
      ))}
      {extra > 0 && (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
          +{extra}
        </span>
      )}
    </div>
  )
}

function CreateTemplateDialog({
  open,
  activeTemplates,
  onCreate,
  onClose,
  isLoading,
}: {
  open: boolean
  activeTemplates: AppraisalTemplate[]
  onCreate: (name: string, copyFromId?: string) => void
  onClose: () => void
  isLoading: boolean
}) {
  const [name, setName] = useState("")
  const [copyFromId, setCopyFromId] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) { setName(""); setCopyFromId(""); setError(null) }
  }, [open])

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError("Template name is required"); return }
    onCreate(name.trim(), copyFromId || undefined)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Create Template</h2>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:text-gray-700">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Template Name *</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(null) }}
              placeholder="e.g. Mid-year Appraisal 2025"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
          </div>
          {activeTemplates.length > 0 && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Copy from (optional)</label>
              <select
                value={copyFromId}
                onChange={(e) => setCopyFromId(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
              >
                <option value="">— Start blank —</option>
                {activeTemplates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
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
              className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50"
            >
              {isLoading ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DeleteTemplateDialog({
  template,
  onConfirm,
  onClose,
  isLoading,
}: {
  template: AppraisalTemplate | null
  onConfirm: () => void
  onClose: () => void
  isLoading: boolean
}) {
  if (!template) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-2 text-lg font-semibold text-gray-900">Delete Template</h2>
        <p className="mb-6 text-sm text-gray-600">
          Are you sure you want to delete <span className="font-medium">"{template.name}"</span>? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AppraisalFormTemplatesPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "")
  const debouncedSearch = useDebounce(searchInput)

  const page = parseInt(searchParams.get("page") ?? "1")
  const statusFilter = searchParams.get("status") ?? ""

  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (debouncedSearch) next.set("search", debouncedSearch)
      else next.delete("search")
      next.set("page", "1")
      return next
    }, { replace: true })
  }, [debouncedSearch]) // eslint-disable-line react-hooks/exhaustive-deps

  const { data, isLoading, isFetching } = useGetTemplatesQuery({
    search: searchParams.get("search") ?? undefined,
    status: statusFilter || undefined,
    page,
    per_page: PER_PAGE,
  })

  // Separate query for copy-from dropdown (active templates, all pages)
  const { data: activeData } = useGetTemplatesQuery({ status: "active", per_page: 100 })

  const [createTemplate, { isLoading: creating }] = useCreateTemplateMutation()
  const [copyTemplate, { isLoading: copying }] = useCopyTemplateMutation()
  const [deleteTemplate, { isLoading: deleting }] = useDeleteTemplateMutation()
  const [activateTemplate] = useActivateTemplateMutation()
  const [archiveTemplate] = useArchiveTemplateMutation()

  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AppraisalTemplate | null>(null)

  const updateParam = (key: string, value: string | null) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value)
      else next.delete(key)
      next.set("page", "1")
      return next
    }, { replace: true })
  }

  const handleCreate = async (name: string, copyFromId?: string) => {
    try {
      let newTemplate: AppraisalTemplate
      if (copyFromId) {
        newTemplate = await copyTemplate({ id: copyFromId, body: { name } }).unwrap()
      } else {
        newTemplate = await createTemplate({ name }).unwrap()
      }
      setCreateOpen(false)
      navigate(`/appraisal-form-templates/${newTemplate.id}/edit`)
    } catch {
      // error handled silently; user stays in dialog
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await deleteTemplate(deleteTarget.id).unwrap()
    setDeleteTarget(null)
  }

  const totalPages = data ? Math.ceil(data.total / PER_PAGE) : 1
  const start = data ? (page - 1) * PER_PAGE + 1 : 0
  const end = data ? Math.min(page * PER_PAGE, data.total) : 0

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Form Templates</h1>
          <p className="mt-1 text-sm text-gray-500">
            Design appraisal form structures and assign them to designations.
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-900 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-blue-800"
        >
          <Plus className="h-4 w-4" />
          Create Template
        </button>
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Filters */}
        <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => updateParam("status", e.target.value || null)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left">
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Name</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Mapped Designations</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Created</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400">
                  Loading templates…
                </td>
              </tr>
            ) : data?.items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400">
                  {searchParams.get("search") || statusFilter
                    ? "No templates match your filters."
                    : "No templates yet. Create your first template."}
                </td>
              </tr>
            ) : (
              data?.items.map((template) => (
                <tr
                  key={template.id}
                  className={cn("hover:bg-gray-50 transition-colors", isFetching && "opacity-60")}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 flex-shrink-0 text-gray-400" />
                      <p className="text-sm font-semibold text-gray-900">{template.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={template.status} />
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <DesignationChips designations={template.designations} />
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600">
                      {new Date(template.created_at).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => navigate(`/appraisal-form-templates/${template.id}/edit`)}
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {template.status === "draft" && (
                        <button
                          onClick={() => activateTemplate(template.id)}
                          className="rounded p-1.5 text-gray-400 hover:bg-green-50 hover:text-green-600"
                          title="Activate"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      {template.status === "active" && (
                        <button
                          onClick={() => archiveTemplate(template.id)}
                          className="rounded p-1.5 text-gray-400 hover:bg-orange-50 hover:text-orange-600"
                          title="Archive"
                        >
                          <Archive className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => copyTemplate({ id: template.id, body: { name: `${template.name} (Copy)` } })
                          .unwrap()
                          .then((t) => navigate(`/appraisal-form-templates/${t.id}/edit`))
                        }
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                        title="Copy"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      {template.status === "draft" && (
                        <button
                          onClick={() => setDeleteTarget(template)}
                          className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
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
              <span className="font-medium text-gray-900">{data.total}</span> templates
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
                      p === page ? "bg-blue-900 text-white" : "text-gray-600 hover:bg-gray-100"
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

      {/* Dialogs */}
      <CreateTemplateDialog
        open={createOpen}
        activeTemplates={activeData?.items ?? []}
        onCreate={handleCreate}
        onClose={() => setCreateOpen(false)}
        isLoading={creating || copying}
      />
      <DeleteTemplateDialog
        template={deleteTarget}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
        isLoading={deleting}
      />
    </div>
  )
}
