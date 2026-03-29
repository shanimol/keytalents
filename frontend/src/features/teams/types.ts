export interface Team {
  id: string
  name: string
  created_at: string
  member_count: number
}

export interface TeamListResponse {
  items: Team[]
  total: number
  page: number
  per_page: number
}

export interface TeamCreate {
  name: string
}

export interface TeamUpdate {
  name: string
}

export interface TeamFilters {
  search?: string
  sort_dir?: "asc" | "desc"
  page?: number
  per_page?: number
}
