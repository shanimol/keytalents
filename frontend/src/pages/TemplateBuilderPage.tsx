import {
  ArrowLeft,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Loader2,
  Plus,
  Trash2,
  X,
  XCircle,
} from "lucide-react"
import { useEffect, useReducer, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  useActivateTemplateMutation,
  useGetTemplateQuery,
  useMapDesignationMutation,
  useUnmapDesignationMutation,
  useUpdateTemplateMutation,
} from "@/features/appraisal-templates/templatesApi"
import type {
  AdditionalRemarksSection,
  CompetencyGroup,
  IdpSection,
  PerformanceFactorsSection,
  RatingPoint,
  Section,
  SelfReflectionSection,
  SubFactor,
  TemplateStatus,
  TemplateStructure,
} from "@/features/appraisal-templates/types"
import {
  newAdditionalRemarksSection,
  newCompetencyGroup,
  newIdpSection,
  newPerformanceFactorsSection,
  newQuestion,
  newRemarkField,
  newSelfReflectionSection,
  newSubFactor,
  syncRatingPoints,
} from "@/lib/template-helpers"
import { cn } from "@/lib/utils"
import { useGetDesignationsListQuery } from "@/features/designations/designationsApi"

// ─── Reducer ─────────────────────────────────────────────────────────────────

type BuilderState = {
  name: string
  structure: TemplateStructure
  selectedSectionId: string | null
  dirty: boolean
}

type BuilderAction =
  | { type: "SET_NAME"; name: string }
  | { type: "ADD_SECTION"; section: Section }
  | { type: "REMOVE_SECTION"; id: string }
  | { type: "MOVE_SECTION"; id: string; direction: "up" | "down" }
  | { type: "SELECT_SECTION"; id: string }
  | { type: "UPDATE_SECTION"; section: Section }
  | { type: "RESET"; name: string; structure: TemplateStructure }

function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case "SET_NAME":
      return { ...state, name: action.name, dirty: true }

    case "ADD_SECTION": {
      const sections = [...state.structure.sections, action.section]
      return {
        ...state,
        structure: { sections },
        selectedSectionId: action.section.id,
        dirty: true,
      }
    }

    case "REMOVE_SECTION": {
      const sections = state.structure.sections.filter((s) => s.id !== action.id)
      const selectedSectionId =
        state.selectedSectionId === action.id
          ? (sections[0]?.id ?? null)
          : state.selectedSectionId
      return { ...state, structure: { sections }, selectedSectionId, dirty: true }
    }

    case "MOVE_SECTION": {
      const sections = [...state.structure.sections]
      const idx = sections.findIndex((s) => s.id === action.id)
      if (idx === -1) return state
      const target = action.direction === "up" ? idx - 1 : idx + 1
      if (target < 0 || target >= sections.length) return state
      ;[sections[idx], sections[target]] = [sections[target], sections[idx]]
      return { ...state, structure: { sections }, dirty: true }
    }

    case "SELECT_SECTION":
      return { ...state, selectedSectionId: action.id }

    case "UPDATE_SECTION": {
      const sections = state.structure.sections.map((s) =>
        s.id === action.section.id ? action.section : s
      )
      return { ...state, structure: { sections }, dirty: true }
    }

    case "RESET":
      return {
        name: action.name,
        structure: action.structure,
        selectedSectionId: action.structure.sections[0]?.id ?? null,
        dirty: false,
      }

    default:
      return state
  }
}

// ─── Status badge ─────────────────────────────────────────────────────────────

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

// ─── Toast ────────────────────────────────────────────────────────────────────

type ToastItem = { id: string; message: string; variant: "success" | "error" }

function Toaster({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: string) => void }) {
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg text-sm font-medium",
            t.variant === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          )}
        >
          {t.variant === "success"
            ? <CheckCircle className="h-4 w-4 flex-shrink-0" />
            : <XCircle className="h-4 w-4 flex-shrink-0" />}
          <span>{t.message}</span>
          <button onClick={() => onDismiss(t.id)} className="ml-1 opacity-70 hover:opacity-100">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}

function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const show = (message: string, variant: ToastItem["variant"]) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, message, variant }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id))

  return { toasts, show, dismiss }
}

// ─── Section type label/icon helpers ─────────────────────────────────────────

const SECTION_LABELS: Record<Section["type"], string> = {
  self_reflection: "Self Appraisal",
  performance_factors: "Performance Factors",
  idp: "IDP",
  additional_remarks: "Additional Remarks",
}

// ─── Self Reflection editor ───────────────────────────────────────────────────

function SelfReflectionEditor({
  section,
  onChange,
}: {
  section: SelfReflectionSection
  onChange: (s: SelfReflectionSection) => void
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Section Title</label>
        <input
          type="text"
          value={section.title}
          onChange={(e) => onChange({ ...section, title: e.target.value })}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
        <textarea
          rows={2}
          value={section.description}
          onChange={(e) => onChange({ ...section, description: e.target.value })}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      </div>

      <div className="flex flex-col gap-3">
        <h4 className="text-sm font-semibold text-gray-800">Questions</h4>
        {section.questions.map((q, qi) => (
          <div key={q.id} className="rounded-lg border border-gray-200 p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <span className="mt-0.5 text-xs font-semibold uppercase text-gray-400">Q{qi + 1}</span>
              <button
                onClick={() => onChange({ ...section, questions: section.questions.filter((x) => x.id !== q.id) })}
                className="rounded p-1 text-gray-300 hover:text-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <textarea
                rows={2}
                placeholder="Question text…"
                value={q.question_text}
                onChange={(e) => {
                  const questions = section.questions.map((x) => x.id === q.id ? { ...x, question_text: e.target.value } : x)
                  onChange({ ...section, questions })
                }}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600">Word limit</label>
                  <input
                    type="number"
                    min={10}
                    max={2000}
                    value={q.word_limit}
                    onChange={(e) => {
                      const questions = section.questions.map((x) => x.id === q.id ? { ...x, word_limit: Number(e.target.value) } : x)
                      onChange({ ...section, questions })
                    }}
                    className="w-20 rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>
                <label className="flex items-center gap-2 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={q.is_required}
                    onChange={(e) => {
                      const questions = section.questions.map((x) => x.id === q.id ? { ...x, is_required: e.target.checked } : x)
                      onChange({ ...section, questions })
                    }}
                    className="rounded"
                  />
                  Required
                </label>
              </div>
            </div>
          </div>
        ))}
        <button
          onClick={() => onChange({ ...section, questions: [...section.questions, newQuestion(section.questions.length)] })}
          className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 py-3 text-sm font-medium text-gray-500 hover:border-blue-300 hover:text-blue-600"
        >
          <Plus className="h-4 w-4" />
          Add Self Appraisal Question
        </button>
      </div>
    </div>
  )
}

// ─── Performance Factors editor ───────────────────────────────────────────────

const RATING_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1)

function SubFactorRow({
  subfactor,
  onUpdate,
  onRemove,
}: {
  subfactor: SubFactor
  onUpdate: (s: SubFactor) => void
  onRemove: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  const min = subfactor.rating_scale_min
  const max = subfactor.rating_scale_max
  const rangeInvalid = min > max

  const handleFromChange = (newMin: number) => {
    const rating_points = syncRatingPoints(subfactor.rating_points, newMin, max)
    onUpdate({ ...subfactor, rating_scale_min: newMin, rating_points })
  }

  const handleToChange = (newMax: number) => {
    const rating_points = syncRatingPoints(subfactor.rating_points, min, newMax)
    onUpdate({ ...subfactor, rating_scale_max: newMax, rating_points })
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50">
      <div className="flex items-center gap-3 px-4 py-3">
        <GripVertical className="h-4 w-4 flex-shrink-0 text-gray-300" />
        <input
          type="text"
          placeholder="Sub-factor name…"
          value={subfactor.name}
          onChange={(e) => onUpdate({ ...subfactor, name: e.target.value })}
          className="flex-1 rounded border border-gray-200 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        <button
          onClick={() => setExpanded((v) => !v)}
          className="rounded p-1 text-gray-400 hover:text-gray-700"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        <button onClick={onRemove} className="rounded p-1 text-gray-300 hover:text-red-500">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-gray-200 px-4 pb-4 pt-3 flex flex-col gap-4">
          {/* Rate Range */}
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-600">Rate Range</label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">From</span>
                <select
                  value={min}
                  onChange={(e) => handleFromChange(Number(e.target.value))}
                  className={cn(
                    "rounded border px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400",
                    rangeInvalid ? "border-red-300 bg-red-50" : "border-gray-200"
                  )}
                >
                  {RATING_OPTIONS.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <span className="text-xs text-gray-400">to</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">To</span>
                <select
                  value={max}
                  onChange={(e) => handleToChange(Number(e.target.value))}
                  className={cn(
                    "rounded border px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400",
                    rangeInvalid ? "border-red-300 bg-red-50" : "border-gray-200"
                  )}
                >
                  {RATING_OPTIONS.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            </div>
            {rangeInvalid && (
              <p className="mt-1 text-xs text-red-500">From must be ≤ To</p>
            )}
          </div>

          {/* Auto-generated rating definitions */}
          {!rangeInvalid && subfactor.rating_points.length > 0 && (
            <div>
              <h5 className="mb-2 text-xs font-semibold uppercase text-gray-500">Rating Definitions</h5>
              <div className="flex flex-col gap-3">
                {subfactor.rating_points.map((rp) => (
                  <div key={rp.id}>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Rating {rp.rating}</label>
                    <textarea
                      rows={2}
                      placeholder={`Description for rating ${rp.rating}…`}
                      value={rp.description}
                      onChange={(e) => {
                        const rating_points = subfactor.rating_points.map((x: RatingPoint) =>
                          x.id === rp.id ? { ...x, description: e.target.value } : x
                        )
                        onUpdate({ ...subfactor, rating_points })
                      }}
                      className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CompetencyGroupCard({
  group,
  onUpdate,
  onRemove,
}: {
  group: CompetencyGroup
  onUpdate: (g: CompetencyGroup) => void
  onRemove: () => void
}) {
  const [collapsed, setCollapsed] = useState(false)

  const updateSubFactor = (sf: SubFactor) => {
    onUpdate({ ...group, sub_factors: group.sub_factors.map((x) => (x.id === sf.id ? sf : x)) })
  }

  const removeSubFactor = (sfId: string) => {
    onUpdate({ ...group, sub_factors: group.sub_factors.filter((x) => x.id !== sfId) })
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center gap-3 px-5 py-4">
        <input
          type="text"
          value={group.name}
          onChange={(e) => onUpdate({ ...group, name: e.target.value })}
          className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        <button onClick={() => setCollapsed((v) => !v)} className="rounded p-1 text-gray-400 hover:text-gray-700">
          {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
        <button onClick={onRemove} className="rounded p-1 text-gray-300 hover:text-red-500">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {!collapsed && (
        <div className="border-t border-gray-100 px-5 pb-5 pt-4">
          <div className="flex flex-col gap-2">
            {group.sub_factors.map((sf) => (
              <SubFactorRow
                key={sf.id}
                subfactor={sf}
                onUpdate={updateSubFactor}
                onRemove={() => removeSubFactor(sf.id)}
              />
            ))}
          </div>
          <button
            onClick={() => onUpdate({ ...group, sub_factors: [...group.sub_factors, newSubFactor(group.sub_factors.length)] })}
            className="mt-3 flex items-center gap-1 rounded border border-dashed border-gray-200 px-3 py-2 text-xs text-gray-500 hover:border-blue-300 hover:text-blue-600"
          >
            <Plus className="h-3 w-3" /> Add Sub-factor
          </button>
        </div>
      )}
    </div>
  )
}

function PerformanceFactorsEditor({
  section,
  onChange,
}: {
  section: PerformanceFactorsSection
  onChange: (s: PerformanceFactorsSection) => void
}) {
  const updateGroup = (g: CompetencyGroup) => {
    onChange({ ...section, competency_groups: section.competency_groups.map((x) => (x.id === g.id ? g : x)) })
  }
  const removeGroup = (gId: string) => {
    onChange({ ...section, competency_groups: section.competency_groups.filter((x) => x.id !== gId) })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Section Title</label>
          <input
            type="text"
            value={section.title}
            onChange={(e) => onChange({ ...section, title: e.target.value })}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
          <input
            type="text"
            value={section.description}
            onChange={(e) => onChange({ ...section, description: e.target.value })}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h4 className="text-sm font-semibold text-gray-800">Competency Groups</h4>
        {section.competency_groups.map((group) => (
          <CompetencyGroupCard
            key={group.id}
            group={group}
            onUpdate={updateGroup}
            onRemove={() => removeGroup(group.id)}
          />
        ))}
        <button
          onClick={() => onChange({ ...section, competency_groups: [...section.competency_groups, newCompetencyGroup()] })}
          className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 py-3 text-sm font-medium text-gray-500 hover:border-blue-300 hover:text-blue-600"
        >
          <Plus className="h-4 w-4" />
          New Competency Framework
        </button>
      </div>
    </div>
  )
}

// ─── IDP editor ───────────────────────────────────────────────────────────────

function IdpEditor({ section, onChange }: { section: IdpSection; onChange: (s: IdpSection) => void }) {
  const [expandedCat, setExpandedCat] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Section Title</label>
        <input
          type="text"
          value={section.title}
          onChange={(e) => onChange({ ...section, title: e.target.value })}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
        <textarea
          rows={3}
          value={section.description}
          onChange={(e) => onChange({ ...section, description: e.target.value })}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      </div>
      <div className="flex flex-col gap-2">
        <h4 className="text-sm font-semibold text-gray-800">Categories</h4>
        {section.category_descriptions.map((cat) => (
          <div key={cat.category} className="rounded-xl border border-gray-200 bg-white">
            <button
              type="button"
              onClick={() => setExpandedCat(expandedCat === cat.category ? null : cat.category)}
              className="flex w-full items-center justify-between px-4 py-3"
            >
              <span className="text-sm font-medium text-gray-800">{cat.category}</span>
              {expandedCat === cat.category
                ? <ChevronUp className="h-4 w-4 text-gray-400" />
                : <ChevronDown className="h-4 w-4 text-gray-400" />}
            </button>
            {expandedCat === cat.category && (
              <div className="border-t border-gray-100 px-4 pb-4 pt-3">
                <label className="mb-1 block text-xs font-medium text-gray-600">Description</label>
                <textarea
                  rows={3}
                  placeholder={`Describe the ${cat.category} category…`}
                  value={cat.description}
                  onChange={(e) => {
                    const category_descriptions = section.category_descriptions.map((c) =>
                      c.category === cat.category ? { ...c, description: e.target.value } : c
                    )
                    onChange({ ...section, category_descriptions })
                  }}
                  className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Additional Remarks editor ────────────────────────────────────────────────

function AdditionalRemarksEditor({
  section,
  onChange,
}: {
  section: AdditionalRemarksSection
  onChange: (s: AdditionalRemarksSection) => void
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Section Title</label>
        <input
          type="text"
          value={section.title}
          onChange={(e) => onChange({ ...section, title: e.target.value })}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
        <textarea
          rows={3}
          value={section.description}
          onChange={(e) => onChange({ ...section, description: e.target.value })}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      </div>
      <div className="flex flex-col gap-3">
        <h4 className="text-sm font-semibold text-gray-800">Remark Fields</h4>
        {section.fields.map((field) => (
          <div key={field.id} className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-3">
            <input
              type="text"
              placeholder="Field label…"
              value={field.label}
              onChange={(e) => {
                const fields = section.fields.map((f) => f.id === field.id ? { ...f, label: e.target.value } : f)
                onChange({ ...section, fields })
              }}
              className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <button
              onClick={() => onChange({ ...section, fields: section.fields.filter((f) => f.id !== field.id) })}
              className="rounded p-1 text-gray-300 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          onClick={() => onChange({ ...section, fields: [...section.fields, newRemarkField()] })}
          className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 py-3 text-sm font-medium text-gray-500 hover:border-blue-300 hover:text-blue-600"
        >
          <Plus className="h-4 w-4" />
          Add Remark Field
        </button>
      </div>
    </div>
  )
}

// ─── Section Editor dispatcher ────────────────────────────────────────────────

function SectionEditor({ section, onUpdate }: { section: Section; onUpdate: (s: Section) => void }) {
  switch (section.type) {
    case "self_reflection":
      return <SelfReflectionEditor section={section} onChange={onUpdate} />
    case "performance_factors":
      return <PerformanceFactorsEditor section={section} onChange={onUpdate} />
    case "idp":
      return <IdpEditor section={section} onChange={onUpdate} />
    case "additional_remarks":
      return <AdditionalRemarksEditor section={section} onChange={onUpdate} />
  }
}

// ─── Designation Mapping panel ────────────────────────────────────────────────

function DesignationMappingPanel({
  templateId,
  templateStatus,
  mappedDesignations,
}: {
  templateId: string
  templateStatus: TemplateStatus
  mappedDesignations: { id: string; name: string }[]
}) {
  const { data: desigData } = useGetDesignationsListQuery({ per_page: 200 })
  const [mapDesignation, { isLoading: mapping }] = useMapDesignationMutation()
  const [unmapDesignation, { isLoading: unmapping }] = useUnmapDesignationMutation()
  const [error, setError] = useState<string | null>(null)

  const isActive = templateStatus === "active"
  const mappedIds = new Set(mappedDesignations.map((d) => d.id))
  const available = (desigData?.items ?? []).filter((d) => !mappedIds.has(d.id))

  const handleMap = async (designationId: string) => {
    setError(null)
    try {
      await mapDesignation({ templateId, designationId }).unwrap()
    } catch (err: unknown) {
      const detail = (err as { data?: { detail?: string } })?.data?.detail
      setError(detail ?? "Failed to map designation")
    }
  }

  const handleUnmap = async (designationId: string) => {
    setError(null)
    try {
      await unmapDesignation({ templateId, designationId }).unwrap()
    } catch {
      setError("Failed to unmap designation")
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
      <h3 className="mb-3 text-sm font-semibold text-gray-800">Mapped Designations</h3>
      {error && <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
      <div className="mb-3 flex flex-wrap gap-2">
        {mappedDesignations.length === 0 ? (
          <p className="text-xs text-gray-400">No designations mapped yet.</p>
        ) : (
          mappedDesignations.map((d) => (
            <span key={d.id} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
              {d.name}
              {isActive && (
                <button
                  onClick={() => handleUnmap(d.id)}
                  disabled={unmapping}
                  className="hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))
        )}
      </div>
      {isActive ? (
        available.length > 0 && (
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Add designation</label>
            <select
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
              value=""
              onChange={(e) => { if (e.target.value) handleMap(e.target.value) }}
              disabled={mapping}
            >
              <option value="">Select designation…</option>
              {available.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        )
      ) : (
        <p className="text-xs text-gray-400 italic">
          Activate the template to assign designations.
        </p>
      )}
    </div>
  )
}

// ─── Add Section menu ─────────────────────────────────────────────────────────

function AddSectionMenu({ onAdd }: { onAdd: (section: Section) => void }) {
  const [open, setOpen] = useState(false)

  const options: { label: string; factory: () => Section }[] = [
    { label: "Self Appraisal", factory: newSelfReflectionSection },
    { label: "Performance Factors", factory: newPerformanceFactorsSection },
    { label: "IDP", factory: newIdpSection },
    { label: "Additional Remarks", factory: newAdditionalRemarksSection },
  ]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 py-2.5 text-sm font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600"
      >
        <Plus className="h-4 w-4" />
        Add Section
      </button>
      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 rounded-lg border border-gray-200 bg-white shadow-lg z-10">
          {options.map((opt) => (
            <button
              key={opt.label}
              onClick={() => { onAdd(opt.factory()); setOpen(false) }}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TemplateBuilderPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: template, isLoading } = useGetTemplateQuery(id!, { skip: !id })
  const [updateTemplate, { isLoading: saving }] = useUpdateTemplateMutation()
  const [activateTemplate, { isLoading: activating }] = useActivateTemplateMutation()

  const [state, dispatch] = useReducer(builderReducer, {
    name: "",
    structure: { sections: [] },
    selectedSectionId: null,
    dirty: false,
  })

  const { toasts, show: showToast, dismiss: dismissToast } = useToasts()

  // Hydrate from server
  useEffect(() => {
    if (template) {
      dispatch({
        type: "RESET",
        name: template.name,
        structure: (template.structure_json as TemplateStructure)?.sections
          ? (template.structure_json as TemplateStructure)
          : { sections: [] },
      })
    }
  }, [template])

  const selectedSection = state.structure.sections.find((s) => s.id === state.selectedSectionId) ?? null

  const handleSave = async () => {
    if (!id) return
    try {
      await updateTemplate({
        id,
        body: { name: state.name, structure_json: state.structure as unknown as Record<string, unknown> },
      }).unwrap()
      dispatch({ type: "RESET", name: state.name, structure: state.structure })
      showToast("Draft saved successfully", "success")
    } catch (err: unknown) {
      const detail = (err as { data?: { detail?: string } })?.data?.detail
      showToast(detail ?? "Failed to save", "error")
    }
  }

  const handlePublish = async () => {
    if (!id) return
    try {
      await updateTemplate({
        id,
        body: { name: state.name, structure_json: state.structure as unknown as Record<string, unknown> },
      }).unwrap()
      await activateTemplate(id).unwrap()
      showToast("Template published", "success")
    } catch (err: unknown) {
      const detail = (err as { data?: { detail?: string } })?.data?.detail
      showToast(detail ?? "Failed to publish", "error")
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!template) {
    return (
      <div className="flex h-full items-center justify-center py-24 text-sm text-gray-400">
        Template not found.
      </div>
    )
  }

  const isArchived = template.status === "archived"

  return (
    <div className="flex h-full flex-col">
      <Toaster toasts={toasts} onDismiss={dismissToast} />
      {/* ── Top bar ── */}
      <div className="flex items-center gap-4 border-b border-gray-200 bg-white px-6 py-3">
        <button
          onClick={() => navigate("/appraisal-form-templates")}
          className="rounded p-1.5 text-gray-500 hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <input
          type="text"
          value={state.name}
          onChange={(e) => dispatch({ type: "SET_NAME", name: e.target.value })}
          disabled={isArchived}
          className="flex-1 rounded-lg border border-transparent px-3 py-1.5 text-base font-semibold text-gray-900 hover:border-gray-200 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:cursor-default disabled:bg-transparent"
        />

        <StatusBadge status={template.status} />

        {state.dirty && (
          <p className="text-xs text-amber-500">Unsaved changes</p>
        )}

        <button
          onClick={handleSave}
          disabled={saving || isArchived}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save Draft"}
        </button>
        <button
          onClick={handlePublish}
          disabled={activating || saving || template.status !== "draft"}
          className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-40"
        >
          {activating ? "Publishing…" : "Publish Template"}
        </button>
      </div>

      {/* ── Two-column layout ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="flex w-72 flex-shrink-0 flex-col gap-2 border-r border-gray-200 bg-gray-50 p-4 overflow-y-auto">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Sections</h3>
          {state.structure.sections.length === 0 && (
            <p className="text-xs text-gray-400">No sections yet. Add one below.</p>
          )}
          {state.structure.sections.map((section, idx) => (
            <div
              key={section.id}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2.5 cursor-pointer",
                state.selectedSectionId === section.id
                  ? "border-blue-400 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
              )}
              onClick={() => dispatch({ type: "SELECT_SECTION", id: section.id })}
            >
              <span className="flex-1 truncate text-sm font-medium">
                {section.title || SECTION_LABELS[section.type]}
              </span>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={(e) => { e.stopPropagation(); dispatch({ type: "MOVE_SECTION", id: section.id, direction: "up" }) }}
                  disabled={idx === 0}
                  className="rounded p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); dispatch({ type: "MOVE_SECTION", id: section.id, direction: "down" }) }}
                  disabled={idx === state.structure.sections.length - 1}
                  className="rounded p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); dispatch({ type: "REMOVE_SECTION", id: section.id }) }}
                  className="rounded p-0.5 text-gray-300 hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}

          <div className="mt-auto pt-2">
            <AddSectionMenu
              onAdd={(section) => dispatch({ type: "ADD_SECTION", section })}
            />
          </div>
        </div>

        {/* Main editor area */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedSection ? (
            <div className="mx-auto max-w-3xl flex flex-col gap-6">
              <SectionEditor
                section={selectedSection}
                onUpdate={(s) => dispatch({ type: "UPDATE_SECTION", section: s })}
              />
              {template.status === "active" && (
                <DesignationMappingPanel
                  templateId={template.id}
                  templateStatus={template.status}
                  mappedDesignations={template.designations}
                />
              )}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <p className="text-sm text-gray-400">
                Select a section from the sidebar to edit it, or add a new section to get started.
              </p>
              {template.status === "active" && (
                <div className="w-full max-w-md">
                  <DesignationMappingPanel
                    templateId={template.id}
                    templateStatus={template.status}
                    mappedDesignations={template.designations}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
