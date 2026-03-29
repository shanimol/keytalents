import { api } from "@/services/api"
import { setCredentials, type TokenPayload, type UserInfo } from "./authSlice"

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    loginWithGoogle: builder.mutation<TokenPayload, { token: string }>({
      query: (body) => ({
        url: "/api/auth/google",
        method: "POST",
        body,
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled
        dispatch(setCredentials(data))
      },
    }),
    refreshToken: builder.mutation<TokenPayload, { refresh_token: string }>({
      query: (body) => ({
        url: "/api/auth/refresh",
        method: "POST",
        body,
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled
        dispatch(setCredentials(data))
      },
    }),
    getMe: builder.query<UserInfo, void>({
      query: () => "/api/auth/me",
    }),
  }),
})

export const { useLoginWithGoogleMutation, useRefreshTokenMutation, useGetMeQuery } = authApi
