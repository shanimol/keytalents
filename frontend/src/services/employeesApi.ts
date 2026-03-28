import { api } from "./api"

export interface Employee {
  id: string
  name: string
  email: string
  created_at: string
  updated_at: string
}

export const employeesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getEmployees: builder.query<Employee[], void>({
      query: () => "/api/v1/employees",
      providesTags: ["Employee"],
    }),
    getEmployee: builder.query<Employee, string>({
      query: (id) => `/api/v1/employees/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Employee", id }],
    }),
  }),
})

export const { useGetEmployeesQuery, useGetEmployeeQuery } = employeesApi
