import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { RootState } from "@/store"

export type UserRole = "admin" | "employee" | "lead"

export interface UserInfo {
  id: string
  email: string
  name: string
  role: UserRole
  avatar_url: string | null
  is_active: boolean
  created_at: string
}

export interface TokenPayload {
  access_token: string
  refresh_token: string
  user: UserInfo
}

interface AuthState {
  user: UserInfo | null
  accessToken: string | null
  isAuthenticated: boolean
}

function loadFromStorage(): AuthState {
  const accessToken = localStorage.getItem("accessToken")
  const raw = localStorage.getItem("user")
  const user: UserInfo | null = raw ? (JSON.parse(raw) as UserInfo) : null
  return {
    user,
    accessToken,
    isAuthenticated: !!accessToken && !!user,
  }
}

const authSlice = createSlice({
  name: "auth",
  initialState: loadFromStorage,
  reducers: {
    setCredentials(state, action: PayloadAction<TokenPayload>) {
      const { access_token, refresh_token, user } = action.payload
      state.accessToken = access_token
      state.user = user
      state.isAuthenticated = true
      localStorage.setItem("accessToken", access_token)
      localStorage.setItem("refreshToken", refresh_token)
      localStorage.setItem("user", JSON.stringify(user))
    },
    logout(state) {
      state.accessToken = null
      state.user = null
      state.isAuthenticated = false
      localStorage.removeItem("accessToken")
      localStorage.removeItem("refreshToken")
      localStorage.removeItem("user")
    },
  },
})

export const { setCredentials, logout } = authSlice.actions
export default authSlice.reducer

export const selectCurrentUser = (state: RootState) => state.auth.user
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated
export const selectAccessToken = (state: RootState) => state.auth.accessToken
