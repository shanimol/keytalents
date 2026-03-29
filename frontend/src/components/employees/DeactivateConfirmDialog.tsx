import { Dialog } from "@/components/ui/Dialog"

interface Props {
  open: boolean
  employeeName: string
  isActive: boolean
  isLoading: boolean
  onConfirm: () => void
  onClose: () => void
}

export function DeactivateConfirmDialog({
  open,
  employeeName,
  isActive,
  isLoading,
  onConfirm,
  onClose,
}: Props) {
  const action = isActive ? "Deactivate" : "Activate"

  return (
    <Dialog open={open} onClose={onClose} title={`${action} Employee`}>
      <p className="mb-6 text-sm text-gray-600">
        Are you sure you want to {action.toLowerCase()}{" "}
        <span className="font-semibold text-gray-900">{employeeName}</span>?
        {isActive && (
          <span className="block mt-1 text-gray-500">
            They will lose access to the platform until reactivated.
          </span>
        )}
      </p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60"
        >
          {isLoading ? "Saving…" : action}
        </button>
      </div>
    </Dialog>
  )
}
