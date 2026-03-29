import {
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react"
import { logout, setCredentials } from "@/features/auth/authSlice"
import type { TokenPayload } from "@/features/auth/authSlice"

const _rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000",
  prepareHeaders: (headers, { getState }) => {
    // Avoid importing RootState to prevent circular dep at value level
    const token = (getState() as { auth: { accessToken: string | null } }).auth.accessToken
    if (token) {
      headers.set("Authorization", `Bearer ${token}`)
    }
    return headers
  },
})

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  let result = await _rawBaseQuery(args, api, extraOptions)

  if (result.error?.status === 401) {
    const refreshToken = localStorage.getItem("refreshToken")
    if (refreshToken) {
      const refreshResult = await _rawBaseQuery(
        { url: "/api/auth/refresh", method: "POST", body: { refresh_token: refreshToken } },
        api,
        extraOptions
      )
      if (refreshResult.data) {
        api.dispatch(setCredentials(refreshResult.data as TokenPayload))
        result = await _rawBaseQuery(args, api, extraOptions)
      } else {
        api.dispatch(logout())
      }
    } else {
      api.dispatch(logout())
    }
  }

  return result
}

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Employee", "AppraisalCycle", "AppraisalFormTemplate", "Team", "Designation", "Skill"],
  endpoints: () => ({}),
})
