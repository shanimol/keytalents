import { api } from "@/services/api"
import type {
  Designation,
  DesignationCreate,
  DesignationFilters,
  DesignationListResponse,
  DesignationUpdate,
} from "./types"

export const designationsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDesignationsList: builder.query<DesignationListResponse, DesignationFilters>({
      query: (params) => ({ url: "/api/designations", params }),
      providesTags: ["Designation"],
    }),

    createDesignation: builder.mutation<Designation, DesignationCreate>({
      query: (body) => ({ url: "/api/designations", method: "POST", body }),
      invalidatesTags: ["Designation"],
    }),

    updateDesignation: builder.mutation<Designation, { id: string; body: DesignationUpdate }>({
      query: ({ id, body }) => ({ url: `/api/designations/${id}`, method: "PUT", body }),
      invalidatesTags: ["Designation"],
    }),

    deleteDesignation: builder.mutation<void, string>({
      query: (id) => ({ url: `/api/designations/${id}`, method: "DELETE" }),
      invalidatesTags: ["Designation"],
    }),
  }),
})

export const {
  useGetDesignationsListQuery,
  useCreateDesignationMutation,
  useUpdateDesignationMutation,
  useDeleteDesignationMutation,
} = designationsApi
