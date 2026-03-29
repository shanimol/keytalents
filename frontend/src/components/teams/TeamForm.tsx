import { useEffect, useState } from "react"
import { Dialog } from "@/components/ui/Dialog"
import type { Team, TeamCreate } from "@/features/teams/types"

interface Props {
  open: boolean
  team: Team | null
  onSubmit: (data: TeamCreate) => void
  onClose: () => void
  isLoading: boolean
  error?: string | null
}

export function TeamForm({ open, team, onSubmit, onClose, isLoading, error }: Props) {
  const [name, setName] = useState("")

  useEffect(() => {
    if (open) {
      setName(team?.name ?? "")
    }
  }, [open, team])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ name: name.trim() })
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={team ? "Edit Team" : "Add Team"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Team Name *
          </label>
          <input
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Frontend, Backend, Design"
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
            {isLoading ? "Saving…" : team ? "Save Changes" : "Add Team"}
          </button>
        </div>
      </form>
    </Dialog>
  )
}
