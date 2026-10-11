import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./hooks/useAuth";
import { UserLocationProvider } from "./hooks/useUserLocation";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <UserLocationProvider>
      <App />
    </UserLocationProvider>
  </AuthProvider>
);
