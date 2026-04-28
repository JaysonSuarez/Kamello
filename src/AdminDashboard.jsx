import React, { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import { Loader2, CheckCircle2, XCircle, FileText, UserCheck, ShieldAlert, LogOut, ExternalLink, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePushNotifications } from "./hooks/usePushNotifications";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingUsers, setPendingUsers] = useState([]);
  const navigate = useNavigate();
  const { subscribeToPush } = usePushNotifications();

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate("/login");

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, is_admin")
        .eq("id", user.id)
        .single();

      if (profile?.role !== 'admin' && !profile?.is_admin) {
        alert("Acceso denegado.");
        return navigate("/dashboard");
      }

      setIsAdmin(true);
      fetchPendingUsers();
      
      // Suscribir al Admin a notificaciones proactivamente
      setTimeout(() => subscribeToPush(user.id), 2000);

      // --- TIEMPO REAL: Escuchar nuevos registros ---
      const adminChannel = supabase.channel('admin_realtime')
        .on("postgres_changes", { 
          event: "*", 
          schema: "public", 
          table: "profiles" 
        }, payload => {
          // Si alguien cambió a 'in_review', refrescamos la lista
          fetchPendingUsers();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(adminChannel);
      };

    } catch (err) {
      console.error(err);
      navigate("/dashboard");
    }
  };

  const fetchPendingUsers = async () => {
    // Solo mostramos cargando la primera vez para no interrumpir
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("verification_status", "in_review")
      .order("updated_at", { ascending: false });
    
    if (data) setPendingUsers(data);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleAction = async (userId, action) => {
    const isApprove = action === 'approve';
    if (!window.confirm(isApprove ? "¿Aprobar perfil?" : "¿Rechazar perfil?")) return;

    try {
      const updateData = isApprove ? {
        verification_status: 'verified',
        is_active: true
      } : {
        verification_status: 'rejected',
        is_active: false,
        id_document_url: null,
        selfie_url: null
      };
      
      const { error } = await supabase.from("profiles").update(updateData).eq("id", userId);
      if (error) throw error;

      setPendingUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  if (!isAdmin && loading) return <div className="app-shell" style={{ justifyContent: "center", alignItems: "center" }}><Loader2 className="h-8 w-8 animate-spin text-[#ff7665]" /></div>;

  return (
    <div className="app-shell" style={{ background: '#f7f3f1', overflowY: 'auto' }}>
      <div style={{ background: '#1f2c45', padding: '24px 20px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ShieldAlert className="w-8 h-8 text-[#ff7665]" />
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Centro de Comando</h1>
            <p style={{ margin: 0, color: '#a4b1c6', fontSize: '0.75rem', fontWeight: 700 }}>{pendingUsers.length} PENDIENTES</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => subscribeToPush()} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: 10, borderRadius: 12 }}>
            <Bell className="w-5 h-5" />
          </button>
          <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: 10, borderRadius: 12 }}>
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div style={{ padding: 20 }}>
        {pendingUsers.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 32, border: '1px solid #efe7e2' }}>
            <CheckCircle2 className="w-16 h-16 mx-auto text-[#00cba9] mb-4" />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 8px' }}>Todo limpio</h2>
            <p style={{ color: '#5f6a79', margin: 0 }}>No hay técnicos esperando.</p>
          </div>
        )}

        {pendingUsers.map(user => (
          <div key={user.id} className="animate-fade-in-up" style={{ background: 'white', borderRadius: 32, padding: 24, marginBottom: 20, border: '1px solid #efe7e2', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{ width: 56, height: 56, borderRadius: '20px', background: '#f7f3f1', color: '#1f2c45', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 900 }}>
                {user.full_name?.charAt(0) || '?'}
              </div>
              <div>
                <p style={{ fontWeight: 900, margin: 0, fontSize: '1.25rem', color: '#1f2c45' }}>{user.full_name}</p>
                <p style={{ color: '#ff7665', margin: 0, fontSize: '0.85rem', fontWeight: 800 }}>{user.specialty?.toUpperCase()}</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginBottom: 24 }}>
              <div style={{ background: '#f8fafc', padding: 20, borderRadius: 24, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FileText className="w-5 h-5 text-[#ff7665]" />
                    <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>Cédula (PDF)</span>
                  </div>
                  <a href={user.id_document_url} target="_blank" rel="noopener noreferrer" style={{ background: '#1f2c45', color: 'white', padding: '6px 12px', borderRadius: 10, fontSize: '0.7rem', fontWeight: 800, textDecoration: 'none' }}>ABRIR PDF</a>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: 20, borderRadius: 24, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <UserCheck className="w-5 h-5 text-[#ff7665]" />
                  <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>Selfie Biométrica</span>
                </div>
                <img src={user.selfie_url} alt="Selfie" style={{ width: '100%', height: 250, objectFit: 'cover', borderRadius: 16 }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => handleAction(user.id, 'reject')} className="btn-secondary" style={{ flex: 1, borderColor: '#ff4757', color: '#ff4757', height: 54, borderRadius: 16 }}>Rechazar</button>
              <button onClick={() => handleAction(user.id, 'approve')} className="btn-primary" style={{ flex: 1.5, background: '#00cba9', height: 54, borderRadius: 16 }}>Aprobar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
