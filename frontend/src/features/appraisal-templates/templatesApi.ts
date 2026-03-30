import { api } from "@/services/api"
import type {
  AppraisalTemplate,
  TemplateCreate,
  TemplateCopyRequest,
  TemplateFilters,
  TemplateListResponse,
  TemplateUpdate,
} from "./types"

export const templatesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getTemplates: builder.query<TemplateListResponse, TemplateFilters>({
      query: (params) => ({ url: "/api/appraisal-templates", params }),
      providesTags: ["AppraisalFormTemplate"],
    }),

    getTemplate: builder.query<AppraisalTemplate, string>({
      query: (id) => ({ url: `/api/appraisal-templates/${id}` }),
      providesTags: (_result, _err, id) => [{ type: "AppraisalFormTemplate", id }],
    }),

    createTemplate: builder.mutation<AppraisalTemplate, TemplateCreate>({
      query: (body) => ({ url: "/api/appraisal-templates", method: "POST", body }),
      invalidatesTags: ["AppraisalFormTemplate"],
    }),

    updateTemplate: builder.mutation<AppraisalTemplate, { id: string; body: TemplateUpdate }>({
      query: ({ id, body }) => ({ url: `/api/appraisal-templates/${id}`, method: "PUT", body }),
      invalidatesTags: ["AppraisalFormTemplate"],
    }),

    deleteTemplate: builder.mutation<void, string>({
      query: (id) => ({ url: `/api/appraisal-templates/${id}`, method: "DELETE" }),
      invalidatesTags: ["AppraisalFormTemplate"],
    }),

    activateTemplate: builder.mutation<AppraisalTemplate, string>({
      query: (id) => ({ url: `/api/appraisal-templates/${id}/activate`, method: "POST" }),
      invalidatesTags: ["AppraisalFormTemplate"],
    }),

    archiveTemplate: builder.mutation<AppraisalTemplate, string>({
      query: (id) => ({ url: `/api/appraisal-templates/${id}/archive`, method: "POST" }),
      invalidatesTags: ["AppraisalFormTemplate"],
    }),

    copyTemplate: builder.mutation<AppraisalTemplate, { id: string; body: TemplateCopyRequest }>({
      query: ({ id, body }) => ({ url: `/api/appraisal-templates/${id}/copy`, method: "POST", body }),
      invalidatesTags: ["AppraisalFormTemplate"],
    }),

    mapDesignation: builder.mutation<AppraisalTemplate, { templateId: string; designationId: string }>({
      query: ({ templateId, designationId }) => ({
        url: `/api/appraisal-templates/${templateId}/designations`,
        method: "POST",
        body: { designation_id: designationId },
      }),
      invalidatesTags: ["AppraisalFormTemplate"],
    }),

    unmapDesignation: builder.mutation<AppraisalTemplate, { templateId: string; designationId: string }>({
      query: ({ templateId, designationId }) => ({
        url: `/api/appraisal-templates/${templateId}/designations/${designationId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AppraisalFormTemplate"],
    }),
  }),
})

export const {
  useGetTemplatesQuery,
  useGetTemplateQuery,
  useCreateTemplateMutation,
  useUpdateTemplateMutation,
  useDeleteTemplateMutation,
  useActivateTemplateMutation,
  useArchiveTemplateMutation,
  useCopyTemplateMutation,
  useMapDesignationMutation,
  useUnmapDesignationMutation,
} = templatesApi
