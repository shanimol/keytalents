import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { DeleteDesignationDialog } from "@/components/designations/DeleteDesignationDialog"
import { DesignationForm } from "@/components/designations/DesignationForm"
import {
  useCreateDesignationMutation,
  useDeleteDesignationMutation,
  useGetDesignationsListQuery,
  useUpdateDesignationMutation,
} from "@/features/designations/designationsApi"
import type { Designation, DesignationCreate } from "@/features/designations/types"
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

export default function DesignationsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "")
  const debouncedSearch = useDebounce(searchInput)

  const page = parseInt(searchParams.get("page") ?? "1")
  const sortDir = (searchParams.get("sort_dir") ?? "asc") as "asc" | "desc"

  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (debouncedSearch) next.set("search", debouncedSearch)
      else next.delete("search")
      next.set("page", "1")
      return next
    }, { replace: true })
  }, [debouncedSearch]) // eslint-disable-line react-hooks/exhaustive-deps

  const { data, isLoading, isFetching } = useGetDesignationsListQuery({
    search: searchParams.get("search") ?? undefined,
    sort_dir: sortDir,
    page,
    per_page: PER_PAGE,
  })

  const [createDesignation, { isLoading: creating }] = useCreateDesignationMutation()
  const [updateDesignation, { isLoading: updating }] = useUpdateDesignationMutation()
  const [deleteDesignation, { isLoading: deleting }] = useDeleteDesignationMutation()

  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Designation | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Designation | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const updateParam = (key: string, value: string | null) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value)
      else next.delete(key)
      next.set("page", "1")
      return next
    }, { replace: true })
  }

  const toggleSort = () => {
    updateParam("sort_dir", sortDir === "asc" ? "desc" : "asc")
  }

  const openCreate = () => {
    setEditTarget(null)
    setFormError(null)
    setFormOpen(true)
  }

  const openEdit = (designation: Designation) => {
    setEditTarget(designation)
    setFormError(null)
    setFormOpen(true)
  }

  const handleSubmit = async (data: DesignationCreate) => {
    try {
      setFormError(null)
      if (editTarget) {
        await updateDesignation({ id: editTarget.id, body: data }).unwrap()
      } else {
        await createDesignation(data).unwrap()
      }
      setFormOpen(false)
      setEditTarget(null)
    } catch (err: unknown) {
      const detail = (err as { data?: { detail?: string } })?.data?.detail
      setFormError(detail ?? "Something went wrong. Please try again.")
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await deleteDesignation(deleteTarget.id).unwrap()
    setDeleteTarget(null)
  }

  const totalPages = data ? Math.ceil(data.total / PER_PAGE) : 1
  const start = data ? (page - 1) * PER_PAGE + 1 : 0
  const end = data ? Math.min(page * PER_PAGE, data.total) : 0

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Designations</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage designations across your organization.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-blue-900 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-blue-800"
        >
          <Plus className="h-4 w-4" />
          Add Designation
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Search bar */}
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search designations…"
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
                <button
                  onClick={toggleSort}
                  className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500 hover:text-gray-800"
                >
                  Designation Name
                  {sortDir === "asc" ? (
                    <ChevronUp className="h-3.5 w-3.5 text-blue-700" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-blue-700" />
                  )}
                </button>
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Members
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Created Date
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-400">
                  Loading designations…
                </td>
              </tr>
            ) : data?.items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-400">
                  {searchParams.get("search")
                    ? "No designations match your search."
                    : "No designations yet. Add your first designation."}
                </td>
              </tr>
            ) : (
              data?.items.map((designation) => (
                <tr
                  key={designation.id}
                  className={cn("hover:bg-gray-50 transition-colors", isFetching && "opacity-60")}
                >
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-gray-900">{designation.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                      {designation.member_count}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600">
                      {new Date(designation.created_at).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(designation)}
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(designation)}
                        className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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
              <span className="font-medium text-gray-900">{data.total}</span> designations
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
      <DesignationForm
        open={formOpen}
        designation={editTarget}
        onSubmit={handleSubmit}
        onClose={() => { setFormOpen(false); setEditTarget(null) }}
        isLoading={creating || updating}
        error={formError}
      />

      <DeleteDesignationDialog
        open={!!deleteTarget}
        designationName={deleteTarget?.name ?? ""}
        isLoading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
