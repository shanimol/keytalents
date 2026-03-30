import { useEffect, useState } from "react"
import { Dialog } from "@/components/ui/Dialog"
import type { Designation, DesignationCreate } from "@/features/designations/types"

interface Props {
  open: boolean
  designation: Designation | null
  onSubmit: (data: DesignationCreate) => void
  onClose: () => void
  isLoading: boolean
  error?: string | null
}

export function DesignationForm({ open, designation, onSubmit, onClose, isLoading, error }: Props) {
  const [name, setName] = useState("")

  useEffect(() => {
    if (open) {
      setName(designation?.name ?? "")
    }
  }, [open, designation])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ name: name.trim() })
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={designation ? "Edit Designation" : "Add Designation"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Designation Name *
          </label>
          <input
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Software Engineer, Product Designer"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="rounded-lg bg-blue-900 px-5 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60"
          >
            {isLoading ? "Saving…" : designation ? "Save Changes" : "Add Designation"}
          </button>
        </div>
      </form>
    </Dialog>
  )
}
