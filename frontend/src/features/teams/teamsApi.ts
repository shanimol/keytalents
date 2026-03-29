import { api } from "@/services/api"
import type { Team, TeamCreate, TeamFilters, TeamListResponse, TeamUpdate } from "./types"

export const teamsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getTeamsList: builder.query<TeamListResponse, TeamFilters>({
      query: (params) => ({ url: "/api/teams", params }),
      providesTags: ["Team"],
    }),

    createTeam: builder.mutation<Team, TeamCreate>({
      query: (body) => ({ url: "/api/teams", method: "POST", body }),
      invalidatesTags: ["Team"],
    }),

    updateTeam: builder.mutation<Team, { id: string; body: TeamUpdate }>({
      query: ({ id, body }) => ({ url: `/api/teams/${id}`, method: "PUT", body }),
      invalidatesTags: ["Team"],
    }),

    deleteTeam: builder.mutation<void, string>({
      query: (id) => ({ url: `/api/teams/${id}`, method: "DELETE" }),
      invalidatesTags: ["Team"],
    }),
  }),
})

export const {
  useGetTeamsListQuery,
  useCreateTeamMutation,
  useUpdateTeamMutation,
  useDeleteTeamMutation,
} = teamsApi
