import React, { useState, useEffect } from "react";
import { 
  User, Settings, MapPin, Phone, Briefcase, ShieldCheck, 
  Camera, Award, Star, Save, Loader2, Trash2, X, LogOut, Zap 
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { SERVICE_CATEGORIES } from "../serviceCategories";

export default function ProfileView({ user, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: "",
    specialty: "",
    phone: "",
    age: "",
    avatar_url: "",
    address: ""
  });

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  const loadProfile = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (data) {
      setProfile(data);
      setFormData({
        full_name: data.full_name || "",
        specialty: data.specialty || "",
        phone: data.phone || "",
        age: data.age || "",
        avatar_url: data.avatar_url || "",
        address: data.address || ""
      });
    }
    setLoading(false);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          specialty: profile.role === 'kamellador' ? formData.specialty : null,
          phone: formData.phone,
          age: parseInt(formData.age) || null,
          avatar_url: formData.avatar_url,
          address: profile.role === 'client' ? formData.address : null
        })
        .eq('id', user.id);

      if (error) throw error;
      
      await loadProfile();
      setIsEditing(false);
    } catch (err) {
      alert("Error al actualizar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSaving(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
    } catch (err) {
      alert("Error al subir foto: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("¿Estás seguro? Esta acción no se puede deshacer.")) return;
    if (!window.confirm("¿Confirmas la eliminación permanente de tu cuenta?")) return;

    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', user.id);
      if (error) throw error;
      await supabase.auth.signOut();
      if (onLogout) onLogout();
    } catch (err) {
      alert("Error al eliminar cuenta: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
      <Loader2 className="animate-spin" style={{ color: '#ff7665' }} />
    </div>
  );

  return (
    <div className="animate-fade-in-up">
      {/* Profile Header Card */}
      <div style={{ background: '#1f2c45', borderRadius: '24px', padding: '24px', color: 'white', marginBottom: '20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid rgba(255,255,255,0.2)' }}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '2rem', fontWeight: 800 }}>{profile?.full_name?.[0] || user.email[0].toUpperCase()}</span>
              )}
            </div>
            <label style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: '#ff7665', padding: '6px', borderRadius: '12px', cursor: 'pointer', border: '3px solid #1f2c45' }}>
              <Camera className="w-3.5 h-3.5 text-white" />
              <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={saving} />
            </label>
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>{profile?.full_name || 'Sin nombre'}</h2>
            <p style={{ fontSize: '0.85rem', opacity: 0.7, margin: '2px 0 8px' }}>{user.email}</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '1rem', fontWeight: 800 }}>{profile?.rating_avg || '0.0'}</span>
                <span style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', opacity: 0.5 }}>Rating</span>
              </div>
              <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }} />
              <div style={{ textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '1rem', fontWeight: 800 }}>{profile?.services_count || '0'}</span>
                <span style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', opacity: 0.5 }}>Servicios</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setIsEditing(!isEditing)}
            style={{ background: isEditing ? '#ff7665' : 'rgba(255,255,255,0.1)', border: 'none', padding: '10px', borderRadius: '16px', color: 'white', cursor: 'pointer' }}
          >
            {isEditing ? <X className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={handleUpdateProfile} style={{ background: 'white', borderRadius: '24px', padding: '20px', border: '1px solid #efe7e2', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Editar Perfil</h3>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Nombre Completo</label>
            <input type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="sheet-input" required />
          </div>
          {profile?.role === 'kamellador' ? (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Especialidad / Rol</label>
              <select value={formData.specialty} onChange={e => setFormData({...formData, specialty: e.target.value})} className="sheet-input">
                {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          ) : (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Dirección de Servicio</label>
              <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="sheet-input" placeholder="Ej: Calle 100 #15-20" />
            </div>
          )}
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Teléfono</label>
              <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="sheet-input" />
            </div>
            <div style={{ width: '80px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Edad</label>
              <input type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="sheet-input" />
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary" style={{ marginTop: '8px' }}>
            {saving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />} Guardar cambios
          </button>
        </form>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {profile?.role === 'kamellador' && (
            <div style={{ background: 'linear-gradient(135deg, #1f2c45 0%, #2c3e50 100%)', borderRadius: '24px', padding: '24px', color: 'white', border: '1px solid rgba(255,118,101,0.2)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '80px', height: '80px', background: 'rgba(255,118,101,0.1)', borderRadius: '50%', blur: '40px' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <Award className="w-6 h-6 text-[#ff7665]" />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Nivel de Lealtad</h3>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.8 }}>Total OPS invertidos</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ff7665' }}>{profile?.total_ops_spent || 0}</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  {/* Calculate progress to next milestone */}
                  {(() => {
                    const spent = profile?.total_ops_spent || 0;
                    let next = 10;
                    if (spent >= 10 && spent < 50) next = 50;
                    else if (spent >= 50 && spent < 100) next = 100;
                    else if (spent >= 100 && spent < 200) next = 200;
                    else if (spent >= 200) next = Math.ceil((spent + 1) / 100) * 100;
                    const progress = Math.min((spent / next) * 100, 100);
                    return <div style={{ width: `${progress}%`, height: '100%', background: '#ff7665', borderRadius: '4px', transition: 'width 1s ease-out' }} />;
                  })()}
                </div>
                <p style={{ fontSize: '0.7rem', marginTop: '8px', opacity: 0.6, fontWeight: 600 }}>
                  {(() => {
                    const spent = profile?.total_ops_spent || 0;
                    if (spent < 10) return `Te faltan ${10 - spent} OPS para tu primer regalo de +1 OPS.`;
                    if (spent < 50) return `Te faltan ${50 - spent} OPS para un regalo de +5 OPS.`;
                    if (spent < 100) return `Te faltan ${100 - spent} OPS para un regalo de +8 OPS.`;
                    if (spent < 200) return `Te faltan ${200 - spent} OPS para un regalo de +10 OPS.`;
                    const next = Math.ceil((spent + 1) / 100) * 100;
                    return `Próximo regalo de +15 OPS al llegar a ${next} OPS invertidos.`;
                  })()}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[{v:10, b:1}, {v:50, b:5}, {v:100, b:8}, {v:200, b:10}].map(m => (
                  <div key={m.v} style={{ 
                    padding: '8px 12px', borderRadius: '12px', 
                    background: (profile?.total_ops_spent || 0) >= m.v ? 'rgba(255,118,101,0.2)' : 'rgba(255,255,255,0.05)',
                    border: (profile?.total_ops_spent || 0) >= m.v ? '1px solid #ff7665' : '1px solid transparent',
                    display: 'flex', alignItems: 'center', gap: '6px', opacity: (profile?.total_ops_spent || 0) >= m.v ? 1 : 0.4
                  }}>
                    <Zap className="w-3 h-3 text-[#ff7665]" />
                    <span style={{ fontSize: '10px', fontWeight: 800 }}>{m.v} → +{m.b}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ background: 'white', borderRadius: '20px', padding: '20px', border: '1px solid #efe7e2' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '0.9rem', fontWeight: 800, color: '#a4b1c6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Información</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f7f3f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1f2c45' }}>
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '10px', color: '#5f6a79', fontWeight: 700 }}>Teléfono</span>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{profile?.phone || 'No registrado'}</span>
                </div>
              </div>
              {profile?.role === 'kamellador' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f7f3f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1f2c45' }}>
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '10px', color: '#5f6a79', fontWeight: 700 }}>Especialidad</span>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{profile?.specialty || 'General'}</span>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f7f3f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1f2c45' }}>
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '10px', color: '#5f6a79', fontWeight: 700 }}>Mi Dirección</span>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{profile?.address || 'No registrada'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button onClick={() => supabase.auth.signOut().then(() => onLogout?.())} style={{ background: 'white', border: '1px solid #efe7e2', borderRadius: '20px', padding: '16px', color: '#ff7665', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
            <LogOut className="w-5 h-5" /> Cerrar Sesión
          </button>

          <div style={{ background: '#fff1f0', border: '1px solid #ffe1df', borderRadius: '20px', padding: '16px', marginTop: '20px' }}>
            <h4 style={{ margin: '0 0 4px', color: '#ef4444', fontSize: '0.9rem', fontWeight: 800 }}>Zona de Peligro</h4>
            <p style={{ margin: '0 0 12px', fontSize: '11px', color: '#ef4444', opacity: 0.7 }}>Elimina tu cuenta y datos permanentemente.</p>
            <button onClick={handleDeleteAccount} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>
              Eliminar Cuenta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
