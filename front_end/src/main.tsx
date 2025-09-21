import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./LoginPage";
import { SignupPage } from "./SignupPage";
import { UserInfoPage } from "./UserInfoPage";
import { App } from "./App"; // your main game app
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Authentication flow */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/user-info" element={<UserInfoPage />} />

        {/* Main app/game pages */}
        <Route path="/app/*" element={<App />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
