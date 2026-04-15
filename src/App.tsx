import { BrowserRouter, Routes, Route } from "react-router-dom";
import SearchProperties from "./pages/SearchProperties";
import ChatPage from "./pages/ChatPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SearchProperties />} />
        <Route path="/chat/:id" element={<ChatPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;