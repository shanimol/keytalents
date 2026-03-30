export interface Designation {
  id: string
  name: string
  created_at: string
  member_count: number
}

export interface DesignationListResponse {
  items: Designation[]
  total: number
  page: number
  per_page: number
}

export interface DesignationCreate {
  name: string
}

export interface DesignationUpdate {
  name: string
}

export interface DesignationFilters {
  search?: string
  sort_dir?: "asc" | "desc"
  page?: number
  per_page?: number
}
