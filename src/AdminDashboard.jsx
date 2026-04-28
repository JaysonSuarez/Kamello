import React, { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import { Loader2, CheckCircle2, XCircle, FileText, UserCheck, ShieldAlert, LogOut, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingUsers, setPendingUsers] = useState([]);
  const navigate = useNavigate();

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
    } catch (err) {
      console.error(err);
      navigate("/dashboard");
    }
  };

  const fetchPendingUsers = async () => {
    setLoading(true);
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
    const confirmMsg = action === 'approve' 
      ? "¿Deseas APROBAR este perfil? Podrá empezar a trabajar de inmediato." 
      : "¿Deseas RECHAZAR este perfil? Deberá subir los documentos nuevamente.";
    
    if (!window.confirm(confirmMsg)) return;

    setLoading(true);
    try {
      const newStatus = action === 'approve' ? 'verified' : 'rejected';
      const isActive = action === 'approve';
      
      const { error } = await supabase
        .from("profiles")
        .update({ 
          verification_status: newStatus,
          is_active: isActive 
        })
        .eq("id", userId);

      if (error) throw error;

      // Refrescar lista
      fetchPendingUsers();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin && loading) return <div className="app-shell" style={{ justifyContent: "center", alignItems: "center" }}><Loader2 className="h-8 w-8 animate-spin text-[#ff7665]" /></div>;

  return (
    <div className="app-shell" style={{ background: '#f7f3f1', overflowY: 'auto' }}>
      {/* Header Admin */}
      <div style={{ background: '#1f2c45', padding: '24px 20px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ShieldAlert className="w-8 h-8 text-[#ff7665]" />
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Centro de Comando</h1>
            <p style={{ margin: 0, color: '#a4b1c6', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Aprobación KYC</p>
          </div>
        </div>
        <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '10px 16px', borderRadius: 12, fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          Cerrar Sesión <LogOut className="w-4 h-4" />
        </button>
      </div>

      <div style={{ padding: 20 }}>
        {loading && <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#ff7665] mt-10" />}

        {!loading && pendingUsers.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 32, border: '1px solid #efe7e2' }}>
            <CheckCircle2 className="w-16 h-16 mx-auto text-[#00cba9] mb-4" />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 8px' }}>Todo bajo control</h2>
            <p style={{ color: '#5f6a79', margin: 0 }}>No hay técnicos esperando verificación.</p>
          </div>
        )}

        {!loading && pendingUsers.map(user => (
          <div key={user.id} style={{ background: 'white', borderRadius: 32, padding: 24, marginBottom: 20, border: '1px solid #efe7e2', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{ width: 56, height: 56, borderRadius: '20px', background: '#f7f3f1', color: '#1f2c45', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 900 }}>
                {user.full_name?.charAt(0) || '?'}
              </div>
              <div>
                <p style={{ fontWeight: 900, margin: 0, fontSize: '1.25rem', color: '#1f2c45' }}>{user.full_name}</p>
                <p style={{ color: '#ff7665', margin: 0, fontSize: '0.85rem', fontWeight: 800 }}>{user.specialty?.toUpperCase()}</p>
                <p style={{ color: '#a4b1c6', margin: 0, fontSize: '0.8rem' }}>ID: {user.id.slice(0, 8)}</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginBottom: 24 }}>
              {/* Cédula */}
              <div style={{ background: '#f8fafc', padding: 20, borderRadius: 24, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FileText className="w-5 h-5 text-[#ff7665]" />
                    <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>Cédula (PDF)</span>
                  </div>
                  {user.id_document_url && (
                    <a href={user.id_document_url} target="_blank" rel="noopener noreferrer" style={{ background: '#1f2c45', color: 'white', padding: '6px 12px', borderRadius: 10, fontSize: '0.7rem', fontWeight: 800, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                      ABRIR PDF <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                {!user.id_document_url && <p style={{ color: '#ff4757', fontWeight: 700, fontSize: '0.8rem', textAlign: 'center' }}>Documento no disponible</p>}
              </div>

              {/* Selfie */}
              <div style={{ background: '#f8fafc', padding: 20, borderRadius: 24, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <UserCheck className="w-5 h-5 text-[#ff7665]" />
                  <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>Selfie Biométrica</span>
                </div>
                {user.selfie_url ? (
                  <div style={{ position: 'relative', width: '100%', height: 250, borderRadius: 16, overflow: 'hidden', border: '2px solid white' }}>
                    <img src={user.selfie_url} alt="Selfie" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <a href={user.selfie_url} target="_blank" rel="noopener noreferrer" style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.5)', color: 'white', padding: '4px 8px', borderRadius: 8, fontSize: '0.6rem', backdropFilter: 'blur(4px)' }}>Ampliar</a>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: 20, background: '#f1f5f9', borderRadius: 16 }}>
                    <p style={{ color: '#ff4757', fontWeight: 700, fontSize: '0.8rem', margin: 0 }}>Selfie no disponible</p>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => handleAction(user.id, 'reject')} className="btn-secondary" style={{ flex: 1, borderColor: '#ff4757', color: '#ff4757', height: 54, borderRadius: 16 }}>
                <XCircle className="w-5 h-5" /> Rechazar
              </button>
              <button onClick={() => handleAction(user.id, 'approve')} className="btn-primary" style={{ flex: 1.5, background: '#00cba9', height: 54, borderRadius: 16 }}>
                <CheckCircle2 className="w-5 h-5" /> Aprobar Kamellador
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
