import React, { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import AuthProvider from "./context/authProvider.jsx"; 
import { BrowserRouter } from "react-router-dom"; 
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
