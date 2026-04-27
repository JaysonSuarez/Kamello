import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  User, 
  Settings, 
  MapPin, 
  Phone, 
  Briefcase, 
  ShieldCheck, 
  ChevronLeft, 
  Camera, 
  Award,
  Star,
  CheckCircle2,
  ExternalLink,
  Save,
  Loader2,
  Trash2,
  X
} from "lucide-react";
import { supabase } from "./lib/supabase";
import { SERVICE_CATEGORIES } from "./serviceCategories";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form States
  const [formData, setFormData] = useState({
    full_name: "",
    specialty: "",
    phone: "",
    age: "",
    avatar_url: ""
  });

  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, [navigate]);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }
    setUser(user);

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
        avatar_url: data.avatar_url || ""
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
          specialty: formData.specialty,
          phone: formData.phone,
          age: parseInt(formData.age) || null,
          avatar_url: formData.avatar_url
        })
        .eq('id', user.id);

      if (error) throw error;
      
      await loadProfile();
      setIsEditing(false);
      alert("Perfil actualizado con éxito");
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
      
      // Auto-save the avatar URL
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));

    } catch (err) {
      alert("Error al subir foto: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm("¿Estás ABSOLUTAMENTE seguro? Esta acción no se puede deshacer y perderás todos tus datos y reputación.");
    if (!confirmDelete) return;

    const secondConfirm = window.confirm("Última advertencia: Tu cuenta será borrada permanentemente de Kamello. ¿Proceder?");
    if (!secondConfirm) return;

    setSaving(true);
    try {
      // Eliminar el perfil (las políticas de cascada deberían encargarse del resto si están configuradas, 
      // pero por seguridad borramos el perfil explícitamente)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Cerrar sesión
      await supabase.auth.signOut();
      
      alert("Tu cuenta ha sido eliminada. Lamentamos verte partir.");
      navigate("/");
    } catch (err) {
      alert("Error al eliminar cuenta: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#f7f3f1] flex items-center justify-center"><div className="h-8 w-8 border-4 border-[#ff7665] border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-[#f7f3f1] font-sans text-[#1f2c45]">
      {/* ... (rest of header and main) ... */}
      {/* Header */}
      <div className="bg-[#1f2c45] h-64 relative">
        <div className="max-w-[1000px] mx-auto px-6 py-8 flex justify-between items-start">
          <Link to="/dashboard" className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl text-white backdrop-blur-md transition-all">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className={`p-3 rounded-2xl backdrop-blur-md transition-all ${isEditing ? 'bg-[#ff7665] text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
          >
            {isEditing ? <X className="w-6 h-6" /> : <Settings className="w-6 h-6" />}
          </button>
        </div>
        
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-full max-w-[800px] px-6">
          <div className="bg-white rounded-[40px] shadow-2xl p-8 flex flex-col md:flex-row items-center gap-8 border border-[#efe7e2]">
            <div className="relative group">
              <div className="w-32 h-32 bg-[#f7f3f1] rounded-[40px] overflow-hidden border-4 border-white shadow-xl flex items-center justify-center">
                {formData.avatar_url ? (
                  <img src={formData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-black text-[#1f2c45]">{formData.full_name[0]}</span>
                )}
              </div>
              <label className="absolute -bottom-2 -right-2 bg-[#ff7665] p-3 rounded-2xl text-white shadow-lg hover:scale-110 transition-all border-4 border-white cursor-pointer">
                <Camera className="w-4 h-4" />
                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={saving} />
              </label>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              {!isEditing ? (
                <>
                  <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                    <h1 className="text-3xl font-serif font-bold">{profile?.full_name}</h1>
                    <div className="flex items-center gap-1.5 bg-[#00cba9]/10 text-[#00cba9] px-3 py-1 rounded-full w-fit mx-auto md:mx-0">
                      <ShieldCheck className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Verificado</span>
                    </div>
                  </div>
                  <p className="text-[#5f6a79] flex items-center justify-center md:justify-start gap-2 text-lg">
                    <Briefcase className="w-5 h-5 text-[#ff7665]" /> {profile?.specialty} {profile?.age ? `(${profile.age} años)` : ''}
                  </p>
                </>
              ) : (
                <div className="space-y-2">
                  <h2 className="text-sm font-black uppercase text-[#ff7665] tracking-widest">Editando Perfil</h2>
                  <p className="text-xs text-[#a4b1c6]">Actualiza tu información pública</p>
                </div>
              )}
            </div>

            <div className="flex gap-4 border-t md:border-t-0 md:border-l border-[#efe7e2] pt-6 md:pt-0 md:pl-8 w-full md:w-auto justify-center">
              <div className="text-center">
                <span className="block text-2xl font-black text-[#1f2c45]">4.9</span>
                <span className="text-[10px] font-black uppercase text-[#a4b1c6] tracking-widest">Rating</span>
              </div>
              <div className="w-px h-10 bg-[#efe7e2]"></div>
              <div className="text-center">
                <span className="block text-2xl font-black text-[#1f2c45]">124</span>
                <span className="text-[10px] font-black uppercase text-[#a4b1c6] tracking-widest">Servicios</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-[800px] mx-auto px-6 pt-36 pb-20">
        {isEditing ? (
          <form onSubmit={handleUpdateProfile} className="bg-white p-10 rounded-[40px] border border-[#efe7e2] shadow-sm space-y-6 animate-in slide-in-from-bottom-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#1f2c45] px-1">Nombre Completo</label>
                <input 
                  type="text" 
                  value={formData.full_name} 
                  onChange={e => setFormData({...formData, full_name: e.target.value})}
                  className="w-full px-6 py-4 rounded-2xl bg-[#f7f3f1] border-2 border-transparent focus:border-[#ff7665] outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#1f2c45] px-1">Edad</label>
                <input 
                  type="number" 
                  value={formData.age} 
                  onChange={e => setFormData({...formData, age: e.target.value})}
                  className="w-full px-6 py-4 rounded-2xl bg-[#f7f3f1] border-2 border-transparent focus:border-[#ff7665] outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#1f2c45] px-1">Especialidad</label>
                <select 
                  value={formData.specialty} 
                  onChange={e => setFormData({...formData, specialty: e.target.value})}
                  className="w-full px-6 py-4 rounded-2xl bg-[#f7f3f1] border-2 border-transparent focus:border-[#ff7665] outline-none transition-all appearance-none"
                >
                  {SERVICE_CATEGORIES.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                  <option value="Electricista">Electricista</option>
                  <option value="Albañil">Albañil</option>
                  <option value="Fontanero">Fontanero</option>
                  <option value="Pintor">Pintor</option>
                  <option value="Técnico de Sistemas">Técnico de Sistemas</option>
                  <option value="General">General</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#1f2c45] px-1">Teléfono</label>
                <input 
                  type="tel" 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-6 py-4 rounded-2xl bg-[#f7f3f1] border-2 border-transparent focus:border-[#ff7665] outline-none transition-all"
                />
              </div>
            </div>
            
            <div className="pt-6 border-t border-[#efe7e2] flex gap-4">
              <button 
                type="submit" 
                disabled={saving}
                className="flex-1 bg-[#1f2c45] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#ff7665] transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Guardar Cambios
              </button>
              <button 
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-8 border-2 border-[#efe7e2] text-[#1f2c45] py-4 rounded-2xl font-bold hover:bg-[#f7f3f1] transition-all"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-[32px] border border-[#efe7e2] shadow-sm">
                <h3 className="text-sm font-black uppercase tracking-widest text-[#a4b1c6] mb-6 flex items-center gap-2">
                  <User className="w-4 h-4" /> Datos de Contacto
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#f7f3f1] rounded-xl flex items-center justify-center text-[#1f2c45]">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="block text-xs text-[#5f6a79]">Teléfono</span>
                      <span className="font-bold">{profile?.phone || "No registrado"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#f7f3f1] rounded-xl flex items-center justify-center text-[#1f2c45]">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="block text-xs text-[#5f6a79]">Correo</span>
                      <span className="font-bold">{user?.email}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[32px] border border-[#efe7e2] shadow-sm">
                <h3 className="text-sm font-black uppercase tracking-widest text-[#a4b1c6] mb-6 flex items-center gap-2">
                  <Award className="w-4 h-4" /> Logros
                </h3>
                <div className="flex flex-wrap gap-3">
                  <Badge text="Puntual" color="bg-amber-100 text-amber-600" />
                  <Badge text="Top 10" color="bg-blue-100 text-blue-600" />
                  <Badge text="Experto" color="bg-purple-100 text-purple-600" />
                  <Badge text="Amigable" color="bg-green-100 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[32px] border border-[#efe7e2] shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-widest text-[#a4b1c6] mb-6">Sobre mí</h3>
              <p className="text-[#5f6a79] leading-relaxed">
                Especialista en {profile?.specialty} con más de 5 años de experiencia en el sector. Me enfoco en brindar soluciones rápidas, seguras y de alta calidad para hogares y empresas. Siempre puntual y comprometido con la satisfacción del cliente.
              </p>
            </div>

            {/* DANGER ZONE */}
            <div className="pt-12 border-t border-[#efe7e2]">
              <div className="bg-red-50 p-8 rounded-[32px] border border-red-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-xl font-bold text-red-600 flex items-center gap-2">
                    <Trash2 className="w-5 h-5" /> Zona de Peligro
                  </h3>
                  <p className="text-sm text-red-500/70 mt-1">
                    Una vez elimines tu cuenta, no hay vuelta atrás. Por favor, asegúrate.
                  </p>
                </div>
                <button 
                  onClick={handleDeleteAccount}
                  disabled={saving}
                  className="bg-red-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-red-700 transition-all flex items-center gap-2 shadow-lg shadow-red-600/20"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                  Eliminar Cuenta Permanentemente
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Badge({ text, color }) {
  return (
    <div className={`px-4 py-2 rounded-xl text-xs font-bold ${color}`}>
      {text}
    </div>
  );
}
