import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import AppLayout from "@/components/AppLayout"
import AppraisalCyclesPage from "@/pages/AppraisalCyclesPage"
import AppraisalFormTemplatesPage from "@/pages/AppraisalFormTemplatesPage"
import DesignationsPage from "@/pages/DesignationsPage"
import EmployeesPage from "@/pages/EmployeesPage"
import TeamsPage from "@/pages/TeamsPage"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/employees" replace />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="appraisal-cycles" element={<AppraisalCyclesPage />} />
          <Route path="appraisal-form-templates" element={<AppraisalFormTemplatesPage />} />
          <Route path="teams" element={<TeamsPage />} />
          <Route path="designations" element={<DesignationsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
