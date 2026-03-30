export interface Skill {
  id: string
  name: string
}

export interface Employee {
  id: string
  employee_number: string
  name: string
  email: string
  user_id: string | null
  joining_date: string
  total_experience: number
  skills: Skill[]
  team_id: string | null
  designation_id: string | null
  is_active: boolean
  last_appraisal_cycle: string | null
  created_at: string
  updated_at: string
  team_name: string | null
  designation_title: string | null
  department: string | null
}

export interface EmployeeListResponse {
  items: Employee[]
  total: number
  page: number
  per_page: number
}

export interface EmployeeCreate {
  employee_number: string
  name: string
  email: string
  joining_date: string
  total_experience: number
  skill_ids: string[]
  team_id: string | null
  designation_id: string | null
  last_appraisal_cycle: string | null
}

export interface EmployeeUpdate extends Partial<EmployeeCreate> {
  is_active?: boolean
}

export interface EmployeeFilters {
  search?: string
  is_active?: boolean
  team_id?: string
  designation_id?: string
  sort_by?: "name" | "email" | "joining_date"
  sort_dir?: "asc" | "desc"
  page?: number
  per_page?: number
}

export interface Team {
  id: string
  name: string
  description: string | null
  is_active: boolean
}

export interface Designation {
  id: string
  name: string
}
