import { AlertTriangle } from "lucide-react"
import { Dialog } from "@/components/ui/Dialog"

interface Props {
  open: boolean
  designationName: string
  isLoading: boolean
  onConfirm: () => void
  onClose: () => void
}

export function DeleteDesignationDialog({ open, designationName, isLoading, onConfirm, onClose }: Props) {
  return (
    <Dialog open={open} onClose={onClose} title="Delete Designation">
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg bg-red-50 p-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div>
            <p className="text-sm font-medium text-red-800">This action cannot be undone.</p>
            <p className="mt-0.5 text-sm text-red-700">
              Designation <span className="font-semibold">"{designationName}"</span> will be permanently deleted.
              Employees assigned to this designation will lose their designation association.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded-lg bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {isLoading ? "Deleting…" : "Delete Designation"}
          </button>
        </div>
      </div>
    </Dialog>
  )
}
