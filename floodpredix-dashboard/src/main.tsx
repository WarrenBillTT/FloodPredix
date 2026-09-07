import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "leaflet/dist/leaflet.css";
import "./index.css";
import App from "./App.tsx";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

// Warn if Google Client ID is missing
if (!GOOGLE_CLIENT_ID && import.meta.env.DEV) {
  console.warn(
    "⚠️ VITE_GOOGLE_CLIENT_ID is not set. Google OAuth will not work. " +
      "Please add it to your .env file and ensure your origin is authorized in Google Cloud Console."
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>
);
