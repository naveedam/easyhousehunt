import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import SearchProperties from "./pages/SearchProperties";
import PropertyDetail from "./pages/PropertyDetail";
import LandlordDashboard from "./pages/LandlordDashboard";
import AddEditProperty from "./pages/AddEditProperty";
import TenantDashboard from "./pages/TenantDashboard";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppLayout() {
  const location = useLocation();
  const isMapPage = location.pathname === '/' || location.pathname === '/search';

  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen">
        {!isMapPage && <Navbar />}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<SearchProperties />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/search" element={<SearchProperties />} />
            <Route path="/about" element={<Index />} />
            <Route path="/property/:id" element={<PropertyDetail />} />
            <Route path="/landlord" element={<LandlordDashboard />} />
            <Route path="/landlord/add" element={<AddEditProperty />} />
            <Route path="/landlord/edit/:id" element={<AddEditProperty />} />
            <Route path="/dashboard" element={<TenantDashboard />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        {!isMapPage && <Footer />}
      </div>
    </AuthProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
