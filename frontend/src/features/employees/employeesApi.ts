import { api } from "@/services/api"
import type {
  Designation,
  Employee,
  EmployeeCreate,
  EmployeeFilters,
  EmployeeListResponse,
  EmployeeUpdate,
  Skill,
  Team,
} from "./types"

export const employeesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getEmployees: builder.query<EmployeeListResponse, EmployeeFilters>({
      query: (params) => ({
        url: "/api/employees",
        params,
      }),
      providesTags: ["Employee"],
    }),

    getEmployee: builder.query<Employee, string>({
      query: (id) => `/api/employees/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Employee", id }],
    }),

    createEmployee: builder.mutation<Employee, EmployeeCreate>({
      query: (body) => ({
        url: "/api/employees",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Employee"],
    }),

    updateEmployee: builder.mutation<Employee, { id: string; body: EmployeeUpdate }>({
      query: ({ id, body }) => ({
        url: `/api/employees/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Employee"],
    }),

    toggleActive: builder.mutation<Employee, string>({
      query: (id) => ({
        url: `/api/employees/${id}/deactivate`,
        method: "PATCH",
      }),
      invalidatesTags: ["Employee"],
    }),

    deleteEmployee: builder.mutation<void, string>({
      query: (id) => ({
        url: `/api/employees/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Employee"],
    }),

    getTeams: builder.query<Team[], void>({
      query: () => "/api/employees/teams",
      providesTags: ["Team"],
    }),

    getDesignations: builder.query<Designation[], void>({
      query: () => "/api/employees/designations",
      providesTags: ["Designation"],
    }),

    getSkills: builder.query<Skill[], void>({
      query: () => "/api/employees/skills",
      providesTags: ["Skill"],
    }),
  }),
})

export const {
  useGetEmployeesQuery,
  useGetEmployeeQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useToggleActiveMutation,
  useDeleteEmployeeMutation,
  useGetTeamsQuery,
  useGetDesignationsQuery,
  useGetSkillsQuery,
} = employeesApi
