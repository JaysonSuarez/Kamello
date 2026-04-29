import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./lib/supabase";
import ProviderDashboard from "./ProviderDashboard";
import ClientDashboard from "./ClientDashboard";
import AdminDashboard from "./AdminDashboard";

export default function DashboardWrapper() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let channel;
    const init = async () => {
      // Solicitar ubicación desde el inicio
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(() => {}, () => {});
      }

      try {
        let { data: { user: au } } = await supabase.auth.getUser();
        if (!au) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) au = session.user;
        }

        if (!au) { navigate("/login"); return; }
        setUser(au);

        // Listener en tiempo real para el perfil
        channel = supabase.channel(`dashboard_sync_${au.id}`)
          .on("postgres_changes", { 
            event: "UPDATE", 
            schema: "public", 
            table: "profiles", 
            filter: `id=eq.${au.id}` 
          }, payload => {
            const p = payload.new;
            const isAdminPayload = p.role === 'admin' || p.is_admin;
            const isRegPayload = isAdminPayload || (
              p.phone && (
                (p.role === 'client' && p.address) || 
                (p.role === 'kamellador' && p.specialty && p.verification_status === 'verified')
              )
            );
            if (isRegPayload) {
              setRole(isAdminPayload ? 'admin' : p.role);
            }
          })
          .subscribe();

        const { data: profile } = await supabase
          .from('profiles')
          .select('role, specialty, phone, is_admin, address, verification_status')
          .eq('id', au.id)
          .single();
        
        const isAdmin = profile?.role === 'admin' || profile?.is_admin;
        
        // Un usuario está "registrado" si es admin, o si tiene los datos mínimos según su rol
        const isRegistered = isAdmin || (
          profile?.phone && (
            (profile.role === 'client' && profile.address) || 
            (profile.role === 'kamellador' && profile.specialty && profile.verification_status === 'verified')
          )
        );

        if (!isRegistered) {
          console.log("Not registered or not verified. Redirecting to onboarding...", { isAdmin, profile });
          return navigate("/onboarding", { replace: true });
        }
        
        const finalRole = isAdmin ? 'admin' : profile.role;
        setRole(finalRole);
      } catch (err) {
        console.error("Error in DashboardWrapper:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [navigate]);

  if (loading) {
    return <div className="min-h-screen bg-[#f7f3f1] flex items-center justify-center"><div className="h-8 w-8 border-4 border-[#ff7665] border-t-transparent rounded-full animate-spin"></div></div>;
  }

  // Render Dashboard based on Role
  if (role === 'admin') {
    return <AdminDashboard />;
  }

  if (role === 'client' || role === 'cliente') {
    return <ClientDashboard user={user} />;
  }

  return <ProviderDashboard />;
}
