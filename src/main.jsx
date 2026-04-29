import React from "react";
// Filtro global para silenciar errores de extensiones del navegador
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    if (e.filename && (e.filename.includes('webextension') || e.filename.includes('extension'))) {
      e.stopImmediatePropagation();
    }
  }, true);
  window.addEventListener('unhandledrejection', (e) => {
    if (e.reason && e.reason.stack && (e.reason.stack.includes('webextension') || e.reason.stack.includes('extension'))) {
      e.stopImmediatePropagation();
    }
  }, true);
}
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SiteDesign from "./SiteDesign";
import Login from "./Login";
import Register from "./Register";
import Terms from "./Terms";
import Privacy from "./Privacy";
import Pricing from "./Pricing";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import Security from "./Security";
import HelpCenter from "./HelpCenter";
import Dashboard from "./Dashboard";
import Onboarding from "./Onboarding";
import Profile from "./Profile";
import AdminDashboard from "./AdminDashboard";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SiteDesign />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/precios" element={<Pricing />} />
        <Route path="/seguridad" element={<Security />} />
        <Route path="/ayuda" element={<HelpCenter />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/perfil" element={<Profile />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/chat/:id" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
