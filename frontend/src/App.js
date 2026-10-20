import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "sonner";
import "@/App.css";
import { AuthProvider } from "@/context/AuthContext";
import { SiteProvider } from "@/context/SiteContext";
import PublicLayout from "@/components/site/PublicLayout";
import { EnquiryModalProvider } from "@/components/site/EnquiryModal";
import AdminLayout from "@/components/admin/AdminLayout";
import Home from "@/pages/Home";
import CmsPage from "@/pages/CmsPage";
import Technology from "@/pages/Technology";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import CategoryDetail from "@/pages/CategoryDetail";
import Industries from "@/pages/Industries";
import IndustryDetail from "@/pages/IndustryDetail";
import Directors from "@/pages/Directors";
import Contact from "@/pages/Contact";
import RequestQuote from "@/pages/RequestQuote";
import NotFound from "@/pages/NotFound";
import AdminLogin from "@/pages/admin/AdminLogin";
import Dashboard from "@/pages/admin/Dashboard";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminCategories from "@/pages/admin/AdminCategories";
import AdminIndustries from "@/pages/admin/AdminIndustries";
import AdminDirectors from "@/pages/admin/AdminDirectors";
import AdminContent from "@/pages/admin/AdminContent";
import AdminEnquiries from "@/pages/admin/AdminEnquiries";
import AdminMedia from "@/pages/admin/AdminMedia";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminAuditLogs from "@/pages/admin/AdminAuditLogs";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);
  return null;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SiteProvider>
          <EnquiryModalProvider>
          <ScrollToTop />
          <Toaster position="top-right" richColors />
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<CmsPage slug="about" eyebrow="Company" fallbackTitle="About Us" />} />
              <Route path="/technology" element={<Technology />} />
              <Route path="/sustainability" element={<CmsPage slug="sustainability" eyebrow="Responsible Growth" fallbackTitle="Sustainability" />} />
              <Route path="/privacy-policy" element={<CmsPage slug="privacy-policy" eyebrow="Legal" fallbackTitle="Privacy Policy" />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/category/:slug" element={<CategoryDetail />} />
              <Route path="/products/:slug" element={<ProductDetail />} />
              <Route path="/industries" element={<Industries />} />
              <Route path="/industries/:slug" element={<IndustryDetail />} />
              <Route path="/directors" element={<Directors />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/request-quote" element={<RequestQuote />} />
              <Route path="*" element={<NotFound />} />
            </Route>

            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="industries" element={<AdminIndustries />} />
              <Route path="directors" element={<AdminDirectors />} />
              <Route path="content" element={<AdminContent />} />
              <Route path="enquiries" element={<AdminEnquiries />} />
              <Route path="media" element={<AdminMedia />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="audit-logs" element={<AdminAuditLogs />} />
            </Route>
          </Routes>
          </EnquiryModalProvider>
        </SiteProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
