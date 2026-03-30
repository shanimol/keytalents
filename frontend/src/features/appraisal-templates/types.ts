export type TemplateStatus = "draft" | "active" | "archived"

export interface TemplateDesignation {
  id: string
  name: string
}

// ─── structure_json types ────────────────────────────────────────────────────

export interface SelfReflectionQuestion {
  id: string
  question_text: string
  word_limit: number
  is_required: boolean
  order: number
}

export interface SelfReflectionSection {
  id: string
  type: "self_reflection"
  title: string
  description: string
  questions: SelfReflectionQuestion[]
}

export interface RatingPoint {
  id: string
  rating: number
  description: string
}

export interface SubFactor {
  id: string
  name: string
  description: string
  rating_scale_min: number
  rating_scale_max: number
  order: number
  rating_points: RatingPoint[]
}

export interface CompetencyGroup {
  id: string
  name: string
  condition: { field: string; operator: string; value: number } | null
  sub_factors: SubFactor[]
}

export interface PerformanceFactorsSection {
  id: string
  type: "performance_factors"
  title: string
  description: string
  competency_groups: CompetencyGroup[]
}

export interface IdpCategoryDescription {
  category: string
  description: string
}

export interface IdpSection {
  id: string
  type: "idp"
  title: string
  description: string
  category_descriptions: IdpCategoryDescription[]
}

export interface AdditionalRemarkField {
  id: string
  label: string
}

export interface AdditionalRemarksSection {
  id: string
  type: "additional_remarks"
  title: string
  description: string
  fields: AdditionalRemarkField[]
}

export type Section =
  | SelfReflectionSection
  | PerformanceFactorsSection
  | IdpSection
  | AdditionalRemarksSection

export interface TemplateStructure {
  sections: Section[]
}

// ─── API types ────────────────────────────────────────────────────────────────

export interface AppraisalTemplate {
  id: string
  name: string
  status: TemplateStatus
  structure_json: TemplateStructure | Record<string, unknown>
  designations: TemplateDesignation[]
  created_by_id: string | null
  updated_by_id: string | null
  created_at: string
  updated_at: string
}

export interface TemplateListResponse {
  items: AppraisalTemplate[]
  total: number
  page: number
  per_page: number
}

export interface TemplateCreate {
  name: string
  structure_json?: Record<string, unknown>
  designation_ids?: string[]
}

export interface TemplateUpdate {
  name?: string
  structure_json?: Record<string, unknown>
}

export interface TemplateCopyRequest {
  name: string
}

export interface TemplateFilters {
  search?: string
  status?: string
  page?: number
  per_page?: number
}
