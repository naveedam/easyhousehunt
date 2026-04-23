import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import AddEditProperty from "./pages/AddEditProperty";
import PropertyDetail from "./pages/PropertyDetail";
import ChatPage from "./pages/ChatPage";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* HOME */}
        <Route path="/" element={<Index />} />

        {/* LIST PROPERTY */}
        <Route path="/add-property" element={<AddEditProperty />} />

        {/* PROPERTY DETAIL */}
        <Route path="/property/:id" element={<PropertyDetail />} />

        {/* CHAT / INBOX */}
        <Route path="/chat" element={<ChatPage />} />

        {/* AUTH (optional page if you use it later) */}
        <Route path="/auth" element={<Auth />} />

        {/* FALLBACK */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </BrowserRouter>
  );
}