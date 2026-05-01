import React, { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.js";
import AuthProvider from "./context/authProvider.js";
import { BrowserRouter } from "react-router-dom";
import "./index.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}
ReactDOM.createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
