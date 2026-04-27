import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./lib/supabase";
import ProviderDashboard from "./ProviderDashboard";
import ClientDashboard from "./ClientDashboard";

export default function DashboardWrapper() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/login");
          return;
        }
        setUser(user);

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setRole(profile.role);
        } else {
          setRole(user.user_metadata?.role || 'kamellador');
        }
      } catch (err) {
        console.error("Error in DashboardWrapper:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [navigate]);

  if (loading) {
    return <div className="min-h-screen bg-[#f7f3f1] flex items-center justify-center"><div className="h-8 w-8 border-4 border-[#ff7665] border-t-transparent rounded-full animate-spin"></div></div>;
  }

  // Render Dashboard based on Role
  if (role === 'client' || role === 'cliente') {
    return <ClientDashboard user={user} />;
  }

  return <ProviderDashboard />;
}
