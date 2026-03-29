import { GoogleOAuthProvider } from "@react-oauth/google"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import AppLayout from "@/components/AppLayout"
import ProtectedRoute from "@/components/ProtectedRoute"
import LoginPage from "@/pages/LoginPage"
import AppraisalCyclesPage from "@/pages/AppraisalCyclesPage"
import AppraisalFormTemplatesPage from "@/pages/AppraisalFormTemplatesPage"
import DesignationsPage from "@/pages/DesignationsPage"
import EmployeesPage from "@/pages/EmployeesPage"
import MyAppraisalsPage from "@/pages/MyAppraisalsPage"
import MyReviewsPage from "@/pages/MyReviewsPage"
import TeamsPage from "@/pages/TeamsPage"

export default function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* All authenticated routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Navigate to="/employees" replace />} />

              {/* Admin routes */}
              {/* Admin-only routes */}
              <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                <Route path="employees" element={<EmployeesPage />} />
                <Route path="appraisal-cycles" element={<AppraisalCyclesPage />} />
                <Route path="appraisal-form-templates" element={<AppraisalFormTemplatesPage />} />
                <Route path="teams" element={<TeamsPage />} />
                <Route path="designations" element={<DesignationsPage />} />
              </Route>

              {/* Employee + lead routes */}
              <Route element={<ProtectedRoute allowedRoles={["employee", "lead"]} />}>
                <Route path="my-appraisals" element={<MyAppraisalsPage />} />
              </Route>

              {/* Lead-only routes */}
              <Route element={<ProtectedRoute allowedRoles={["lead"]} />}>
                <Route path="my-reviews" element={<MyReviewsPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  )
}
