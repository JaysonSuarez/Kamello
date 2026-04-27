import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SiteDesign from "./SiteDesign";
import Login from "./Login";
import Register from "./Register";
import Terms from "./Terms";
import Privacy from "./Privacy";
import SearchJobs from "./SearchJobs";
import CreateProfile from "./CreateProfile";
import CareerTips from "./CareerTips";
import Pricing from "./Pricing";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
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
        <Route path="/buscar-trabajos" element={<SearchJobs />} />
        <Route path="/crear-perfil" element={<CreateProfile />} />
        <Route path="/consejos-profesionales" element={<CareerTips />} />
        <Route path="/precios" element={<Pricing />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/perfil" element={<Profile />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
