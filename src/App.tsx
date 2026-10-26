import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { ScrollManager } from "@/components/ScrollManager"
import { SiteLayout } from "@/components/SiteLayout/SiteLayout"
import { AboutPage } from "@/pages/About/AboutPage"
import { Home } from "@/pages/Home/Home"

export default function App() {
  return (
    <BrowserRouter>
      <ScrollManager />
      <SiteLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SiteLayout>
    </BrowserRouter>
  )
}
