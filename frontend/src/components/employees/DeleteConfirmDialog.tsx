import { useState } from "react"
import { Dialog } from "@/components/ui/Dialog"

interface Props {
  open: boolean
  employeeName: string
  isLoading: boolean
  onConfirm: () => void
  onClose: () => void
}

export function DeleteConfirmDialog({ open, employeeName, isLoading, onConfirm, onClose }: Props) {
  const [typed, setTyped] = useState("")

  const handleClose = () => {
    setTyped("")
    onClose()
  }

  const confirmed = typed.trim().toLowerCase() === employeeName.trim().toLowerCase()

  return (
    <Dialog open={open} onClose={handleClose} title="Delete Employee">
      <div className="mb-2 rounded-lg bg-red-50 border border-red-200 p-3">
        <p className="text-sm font-medium text-red-700">This action cannot be undone.</p>
        <p className="text-sm text-red-600 mt-0.5">
          All data for this employee will be permanently deleted.
        </p>
      </div>
      <p className="mt-4 mb-2 text-sm text-gray-600">
        Type{" "}
        <span className="font-semibold text-gray-900">{employeeName}</span>{" "}
        to confirm deletion:
      </p>
      <input
        type="text"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        placeholder={employeeName}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
      />
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={handleClose}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={() => { setTyped(""); onConfirm() }}
          disabled={!confirmed || isLoading}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading ? "Deleting…" : "Delete Employee"}
        </button>
      </div>
    </Dialog>
  )
}
