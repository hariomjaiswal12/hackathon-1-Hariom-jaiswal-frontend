import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { ScrollManager } from "@/components/ScrollManager"
import { SiteLayout } from "@/components/SiteLayout/SiteLayout"
import { AuthProvider } from "@/context/AuthContext"
import { ProtectedRoute } from "@/components/Auth/ProtectedRoute"
import { AboutPage } from "@/pages/About/AboutPage"
import { ContactPage } from "@/pages/Contact/ContactPage"
import { EventDetailPage } from "@/pages/Events/EventDetailPage"
import { EventsPage } from "@/pages/Events/EventsPage"
import { Home } from "@/pages/Home/Home"
import { NewsDetailPage } from "@/pages/News/NewsDetailPage"
import { NewsPage } from "@/pages/News/NewsPage"
import { DashboardPage } from "@/pages/Dashboard/DashboardPage"
import { OperationsPage } from "@/pages/Operations/OperationsPage"
import { AdminDashboardPage } from "@/pages/AdminDashboard/AdminDashboardPage"

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollManager />
        <SiteLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:slug" element={<EventDetailPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/news/:slug" element={<NewsDetailPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/operations"
              element={
                <ProtectedRoute roles={["STAFF", "ADMIN"]}>
                  <OperationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute roles={["ADMIN"]}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SiteLayout>
      </AuthProvider>
    </BrowserRouter>
  )
}
