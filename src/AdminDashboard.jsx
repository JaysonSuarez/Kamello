import React, { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import { Loader2, CheckCircle2, XCircle, FileText, UserCheck, ShieldAlert } from "lucide-react";
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
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (!profile?.is_admin) {
        alert("Acceso denegado. Esta sección es solo para administradores.");
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

  const handleAction = async (userId, action) => {
    if (!window.confirm(`¿Seguro que deseas ${action === 'approve' ? 'APROBAR' : 'RECHAZAR'} a este Kamellador?`)) return;

    setLoading(true);
    try {
      const newStatus = action === 'approve' ? 'verified' : 'rejected';
      
      const { error } = await supabase
        .from("profiles")
        .update({ verification_status: newStatus })
        .eq("id", userId);

      if (error) throw error;

      // Enviar notificación Push al Kamellador
      const title = action === 'approve' ? "✅ ¡Identidad Verificada!" : "❌ Identidad Rechazada";
      const body = action === 'approve' 
        ? "Tu perfil ha sido aprobado. Ya puedes empezar a recibir ofertas en Kamello."
        : "Hubo un problema con tus documentos. Por favor, vuelve a subirlos de forma clara.";

      await fetch('/api/v1/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          title: title,
          body: body,
          data: { url: "/dashboard" }
        })
      });

      // Refrescar lista
      fetchPendingUsers();
    } catch (err) {
      alert("Error al procesar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin && loading) return <div className="app-shell" style={{ justifyContent: "center", alignItems: "center" }}><Loader2 className="h-8 w-8 animate-spin text-[#ff7665]" /></div>;

  return (
    <div className="app-shell" style={{ background: '#f7f3f1', overflowY: 'auto', padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, padding: '20px 0', borderBottom: '1px solid #efe7e2' }}>
        <ShieldAlert className="w-10 h-10 text-[#1f2c45]" />
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#1f2c45' }}>Centro de Comando</h1>
          <p style={{ margin: 0, color: '#5f6a79', fontSize: '0.85rem' }}>Aprobación de Kamelladores (KYC)</p>
        </div>
      </div>

      {loading && <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#ff7665]" />}

      {!loading && pendingUsers.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, background: 'white', borderRadius: 20 }}>
          <CheckCircle2 className="w-12 h-12 mx-auto text-[#00cba9] mb-4" />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 8px' }}>Todo limpio</h2>
          <p style={{ color: '#a4b1c6', margin: 0 }}>No hay Kamelladores pendientes de verificación en este momento.</p>
        </div>
      )}

      {!loading && pendingUsers.map(user => (
        <div key={user.id} style={{ background: 'white', borderRadius: 20, padding: 20, marginBottom: 16, border: '1px solid #efe7e2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1f2c45', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
              {user.full_name?.charAt(0) || '?'}
            </div>
            <div>
              <p style={{ fontWeight: 800, margin: 0, fontSize: '1.1rem', color: '#1f2c45' }}>{user.full_name}</p>
              <p style={{ color: '#5f6a79', margin: 0, fontSize: '0.85rem' }}>{user.phone || 'Sin teléfono'} • {user.specialty}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            {/* Cédula (PDF simulado o enlace) */}
            <div style={{ background: '#f7f3f1', padding: 12, borderRadius: 12, textAlign: 'center' }}>
              <FileText className="w-8 h-8 mx-auto text-[#a4b1c6] mb-2" />
              <p style={{ fontSize: '0.8rem', fontWeight: 700, margin: '0 0 8px' }}>Cédula (PDF)</p>
              {user.id_document_url ? (
                <a href={user.id_document_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: '#ff7665', textDecoration: 'none', fontWeight: 700 }}>VER DOCUMENTO</a>
              ) : <p style={{ fontSize: '0.75rem', color: '#ff4757', margin: 0 }}>No subido</p>}
            </div>

            {/* Selfie (Imagen) */}
            <div style={{ background: '#f7f3f1', padding: 12, borderRadius: 12, textAlign: 'center' }}>
              <UserCheck className="w-8 h-8 mx-auto text-[#a4b1c6] mb-2" />
              <p style={{ fontSize: '0.8rem', fontWeight: 700, margin: '0 0 8px' }}>Selfie Biométrica</p>
              {user.selfie_url ? (
                // En producción esto debería cargar la imagen de Supabase Storage
                <img src={user.selfie_url} alt="Selfie" style={{ width: '100%', height: 60, objectFit: 'cover', borderRadius: 8 }} />
              ) : <p style={{ fontSize: '0.75rem', color: '#ff4757', margin: 0 }}>No subida</p>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => handleAction(user.id, 'reject')} className="btn-secondary" style={{ flex: 1, borderColor: '#ff4757', color: '#ff4757' }}>
              <XCircle className="w-5 h-5" /> Rechazar
            </button>
            <button onClick={() => handleAction(user.id, 'approve')} className="btn-primary" style={{ flex: 1, background: '#00cba9' }}>
              <CheckCircle2 className="w-5 h-5" /> Aprobar Perfil
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
