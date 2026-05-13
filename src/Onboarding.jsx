import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowRight, 
  CheckCircle2, 
  MapPin, 
  ShieldCheck,
  Hammer,
  Paintbrush,
  Droplets,
  Zap as Sparkles,
  Heart,
  Navigation,
  Star,
  ShoppingCart,
  Briefcase,
  Loader2,
  Upload,
  Camera,
  UserCheck,
  FileText,
  Clock
} from "lucide-react";
import { supabase } from "./lib/supabase";
import { SERVICE_CATEGORIES } from "./serviceCategories";
import KYCVerification from "./components/KYCVerification";
import { useLanguage } from "./lib/i18n";

const logoImageUrl = "/images/K-Editado.png";

export default function Onboarding() {
  const { t, language } = useLanguage();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // null, 'kamellador', 'client'
  const [step, setStep] = useState(0); // Empezamos en 0 para selección de rol si es necesario
  const [loading, setLoading] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const navigate = useNavigate();

  // Estados Kamellador
  const [specialty, setSpecialty] = useState("");
  const [subspecialties, setSubspecialties] = useState([]);
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [cedula, setCedula] = useState("");
  const [reviewPrice, setReviewPrice] = useState("");
  const [bio, setBio] = useState("");
  const [hasVehicle, setHasVehicle] = useState(false);

  // Estados Cliente
  const [address, setAddress] = useState("");

  useEffect(() => {
    const checkUserAndRole = async () => {
      let { data: { user } } = await supabase.auth.getUser();
      
      // Manejo de redirect de OAuth (esperar si hay hash)
      if (!user) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) user = session.user;
      }

      if (!user) {
        navigate("/login");
        return;
      }
      setUser(user);

      // Verificar si ya tiene un perfil con datos completos
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_active, phone, specialty, verification_status, is_admin, address')
        .eq('id', user.id)
        .single();

      const isAdmin = profile?.role === 'admin' || profile?.is_admin;
      const isVerified = ((profile?.role === 'client' || profile?.role === 'cliente') && profile?.address) || 
                        (profile?.role === 'kamellador' && profile?.specialty && profile?.specialty.trim().length > 3 && profile?.verification_status === 'verified');

      if (isAdmin || (profile?.phone && isVerified)) {
        // Si ya tiene todo según su rol, al dashboard
        navigate("/dashboard"); 
      } else {
        // Pre-llenar nombre desde metadatos si está disponible
        if (user.user_metadata?.full_name) {
          setFullName(user.user_metadata.full_name);
        }
        
        // No ha completado el onboarding o no está verificado
        if (profile?.verification_status === 'in_review' || profile?.verification_status === 'rejected') {
          setRole(profile.role);
          setStep(4);
        } else {
          // Always check localStorage first — it's the source of truth for what the user chose
          const intendedRole = localStorage.getItem('kamello_intended_role');
          
          if (intendedRole === 'client' || intendedRole === 'kamellador') {
            // User explicitly chose a role (from Register or Register+Google)
            setRole(intendedRole);
            localStorage.removeItem('kamello_intended_role');
            setStep(profile?.phone ? 2 : 1); // If they already have a phone, skip to next step
          } else if (profile?.phone) {
            // Has phone, no intended role in storage — trust the DB role
            setRole(profile.role);
            setStep(1); 
          } else {
            // Brand new user, no phone, no stored role — ask them
            setStep(0);
          }
        }
      }
      setCheckingRole(false);
    };
    checkUserAndRole();
  }, [navigate]);

  const handleSelectRole = async (selectedRole) => {
    setRole(selectedRole);
    setStep(1);
  };

  const handleFinishKamellador = async () => {
    if (!specialty || !phone || !fullName || !age || !cedula) return alert("Por favor completa todos los campos, incluyendo tu número de cédula.");
    setLoading(true);
    try {
      // Verificar que la cédula no esté ya registrada
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('cedula', cedula.trim())
        .neq('id', user.id)
        .maybeSingle();
      if (existing) {
        alert("Ese número de cédula ya está registrado. Si crees que es un error, contacta a soporte.");
        setLoading(false);
        return;
      }
      const { error } = await supabase.from('profiles').update({
        role: 'kamellador',
        specialty: subspecialties.length > 0 ? `${specialty}|${subspecialties.join(',')}` : specialty,
        phone,
        full_name: fullName,
        age: parseInt(age),
        cedula: cedula.trim(),
        bio,
        review_price: parseFloat(reviewPrice) || 0,
        has_vehicle: hasVehicle,
        is_active: false // Inactivo hasta que lo aprueben
      }).eq('id', user.id);
      if (error) throw error;
      setStep(4); // Ir a documentos
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFinishCliente = async () => {
    if (!address || !phone) return alert("Por favor completa todos los campos.");
    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').update({
        role: 'client', 
        is_active: true, 
        verification_status: 'verified', // Clientes no necesitan KYC
        phone,
        address
      }).eq('id', user.id);
      if (error) throw error;
      navigate("/dashboard");
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(step + 1);

  if (checkingRole) {
    return (
      <div className="min-h-screen bg-[#f7f3f1] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#ff7665] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f3f1] flex flex-col font-sans" style={{ minHeight: '100dvh' }}>
      <header className="p-8 flex justify-center" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)' }}>
        <div className="flex items-center gap-3">
          <img src={logoImageUrl} alt="Kamello" className="h-8 w-auto" />
          <span className="text-2xl font-bold tracking-tight text-[#1f2c45]">Kamello</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-xl bg-white rounded-[40px] shadow-2xl p-10 md:p-14 border border-[#efe7e2] relative overflow-hidden">
          
          {step > 0 && (
            <div className="flex gap-2 mb-10 justify-center">
              {[1, 2, 3].map(i => (
                <div key={i} className={`h-2 rounded-full transition-all duration-500 ${step === i ? 'w-8 bg-[#ff7665]' : 'w-2 bg-[#efe7e2]'}`}></div>
              ))}
            </div>
          )}

          {step === 0 && (
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
              <h1 className="font-serif text-4xl text-[#1f2c45] leading-tight text-center italic mb-4">{t('onboarding_title_role')}</h1>
              <p className="text-[#5f6a79] text-lg text-center mb-10">{t('onboarding_subtitle_role')}</p>
              
              <div className="grid grid-cols-1 gap-6">
                <button 
                  onClick={() => handleSelectRole('kamellador')}
                  className="group relative overflow-hidden bg-white p-8 rounded-[32px] border-2 border-[#efe7e2] hover:border-[#ff7665] hover:shadow-xl transition-all text-left flex items-center gap-6"
                >
                  <div className="p-5 bg-[#ff7665]/10 rounded-[24px] text-[#ff7665] group-hover:scale-110 transition-transform">
                    <Briefcase className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[#1f2c45]">{t('onboarding_role_provider_title')}</h3>
                    <p className="text-[#5f6a79] text-sm">{t('onboarding_role_provider_desc')}</p>
                  </div>
                  <ArrowRight className="absolute right-8 w-6 h-6 text-[#efe7e2] group-hover:text-[#ff7665] group-hover:translate-x-2 transition-all" />
                </button>

                <button 
                  onClick={() => handleSelectRole('client')}
                  className="group relative overflow-hidden bg-white p-8 rounded-[32px] border-2 border-[#efe7e2] hover:border-[#ff7665] hover:shadow-xl transition-all text-left flex items-center gap-6"
                >
                  <div className="p-5 bg-blue-50 rounded-[24px] text-blue-500 group-hover:scale-110 transition-transform">
                    <ShoppingCart className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[#1f2c45]">{t('onboarding_role_client_title')}</h3>
                    <p className="text-[#5f6a79] text-sm">{t('onboarding_role_client_desc')}</p>
                  </div>
                  <ArrowRight className="absolute right-8 w-6 h-6 text-[#efe7e2] group-hover:text-[#ff7665] group-hover:translate-x-2 transition-all" />
                </button>
              </div>
            </div>
          )}

          {step > 0 && role === 'kamellador' && (
            /* ONBOARDING KAMELLADOR */
            <>
              {step === 1 && (
                <div className="animate-in fade-in slide-in-from-right-4">
                  <h1 className="font-serif text-4xl text-[#1f2c45] leading-tight text-center italic">{t('onboarding_welcome_provider')}</h1>
                  <p className="mt-4 text-[#5f6a79] text-lg text-center">{t('onboarding_welcome_provider_desc')}</p>
                  <div className="mt-10 bg-[#fff8f4] p-6 rounded-3xl border border-[#f1d8cb] flex items-start gap-4">
                    <div className="bg-[#ff7665] p-3 rounded-2xl text-white shadow-lg"><ShieldCheck className="w-6 h-6" /></div>
                    <div>
                      <h3 className="font-bold text-[#1f2c45]">{t('onboarding_security_title')}</h3>
                      <p className="text-sm text-[#5f6a79] mt-1">{t('onboarding_security_desc')}</p>
                    </div>
                  </div>
                  <button onClick={nextStep} className="w-full mt-10 bg-[#1f2c45] text-white py-5 rounded-[24px] font-bold text-lg flex items-center justify-center gap-2 hover:bg-[#ff7665] transition-all group">
                    {t('common_continue')} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="animate-in fade-in slide-in-from-right-4">
                  <h2 className="font-serif text-3xl text-[#1f2c45] text-center mb-6 italic">{t('onboarding_specialty_title')}</h2>
                  <div className="grid grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1">
                    {SERVICE_CATEGORIES.map(cat => (
                      <button key={cat.id} onClick={() => { setSpecialty(cat.id); setSubspecialties([]); }}
                        className={`p-6 rounded-[32px] border-2 transition-all flex flex-col items-center gap-3 ${specialty === cat.id ? 'border-[#ff7665] bg-[#fff8f7] scale-[1.02]' : 'border-[#efe7e2] hover:border-[#a4b1c6]'}`}>
                        <div className={`p-4 rounded-2xl ${cat.chip}`}>{cat.icon}</div>
                        <span className="font-bold text-[#1f2c45] text-sm text-center">{language === 'en' ? cat.name : cat.shortName}</span>
                      </button>
                    ))}
                  </div>

                  {(() => {
                    const cat = SERVICE_CATEGORIES.find(c => c.id === specialty);
                    if (cat?.subcategories) {
                      return (
                        <div className="mt-6 animate-fade-in-up">
                          <label className="block text-xs font-black text-[#a4b1c6] uppercase tracking-widest mb-3 pl-1 text-center">{t('onboarding_specialty_hint')}</label>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                            {cat.subcategories.map(sub => {
                              const isSelected = subspecialties.includes(sub);
                              return (
                                <button
                                  key={sub}
                                  onClick={() => {
                                    if (isSelected) setSubspecialties(prev => prev.filter(s => s !== sub));
                                    else setSubspecialties(prev => [...prev, sub]);
                                  }}
                                  style={{
                                    padding: "8px 16px", borderRadius: 12, fontSize: "0.85rem", fontWeight: 700,
                                    border: "2px solid", borderColor: isSelected ? "#ff7665" : "#efe7e2",
                                    background: isSelected ? "#ff7665" : "white", color: isSelected ? "white" : "#1f2c45",
                                    transition: "all 0.2s"
                                  }}
                                >
                                  {sub}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <button 
                    onClick={nextStep} 
                    disabled={!specialty || (SERVICE_CATEGORIES.find(c => c.id === specialty)?.subcategories && subspecialties.length === 0)} 
                    className="w-full mt-8 bg-[#1f2c45] text-white py-5 rounded-[24px] font-bold text-lg disabled:opacity-50"
                  >
                    {t('common_continue')}
                  </button>
                </div>
              )}

              {step === 3 && (
                <div className="animate-in fade-in slide-in-from-right-4">
                  <h2 className="font-serif text-3xl text-[#1f2c45] text-center mb-6 italic">{t('onboarding_data_title')}</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black text-[#a4b1c6] uppercase tracking-widest mb-2 pl-1">{t('profile_name_label')}</label>
                      <input type="text" placeholder="Tu nombre" value={fullName} onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-6 py-4 rounded-[24px] bg-[#f7f3f1] border-2 border-transparent focus:border-[#ff7665] focus:bg-white outline-none font-bold text-[#1f2c45]" />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-[#a4b1c6] uppercase tracking-widest mb-2 pl-1">{t('onboarding_cedula_label')}</label>
                      <input type="text" placeholder="Ej: 1234567890" value={cedula} onChange={(e) => setCedula(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-6 py-4 rounded-[24px] bg-[#f7f3f1] border-2 border-transparent focus:border-[#ff7665] focus:bg-white outline-none font-bold text-[#1f2c45]" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black text-[#a4b1c6] uppercase tracking-widest mb-2 pl-1">{t('profile_phone_label')}</label>
                        <input type="tel" placeholder="+57 3..." value={phone} onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-6 py-4 rounded-[24px] bg-[#f7f3f1] border-2 border-transparent focus:border-[#ff7665] focus:bg-white outline-none font-bold text-[#1f2c45]" />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-[#a4b1c6] uppercase tracking-widest mb-2 pl-1">{t('profile_age_label')}</label>
                        <input type="number" placeholder="25" value={age} onChange={(e) => setAge(e.target.value)}
                          className="w-full px-6 py-4 rounded-[24px] bg-[#f7f3f1] border-2 border-transparent focus:border-[#ff7665] focus:bg-white outline-none font-bold text-[#1f2c45]" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-[#a4b1c6] uppercase tracking-widest mb-2 pl-1">{t('profile_price_label')}</label>
                      <input type="number" placeholder="Ej: 30000" value={reviewPrice} onChange={(e) => setReviewPrice(e.target.value)}
                        className="w-full px-6 py-4 rounded-[24px] bg-[#f7f3f1] border-2 border-transparent focus:border-[#ff7665] focus:bg-white outline-none font-bold text-[#1f2c45]" />
                      <p className="text-[10px] text-[#a4b1c6] mt-1 pl-2">{t('onboarding_review_price_hint')}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-[#a4b1c6] uppercase tracking-widest mb-2 pl-1">{t('profile_bio_label')}</label>
                      <textarea placeholder={t('onboarding_bio_placeholder')} value={bio} onChange={(e) => setBio(e.target.value)}
                        className="w-full px-6 py-4 rounded-[24px] bg-[#f7f3f1] border-2 border-transparent focus:border-[#ff7665] focus:bg-white outline-none font-bold text-[#1f2c45] min-h-[80px]" />
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-[#f7f3f1] rounded-[24px]">
                      <input type="checkbox" id="hasVehicle" checked={hasVehicle} onChange={(e) => setHasVehicle(e.target.checked)} className="w-5 h-5 accent-[#ff7665]" />
                      <label htmlFor="hasVehicle" className="text-sm font-bold text-[#1f2c45]">{t('profile_vehicle_label')}</label>
                    </div>
                  </div>
                  <button onClick={handleFinishKamellador} disabled={loading || !phone || !fullName || !age || !cedula || !reviewPrice}
                    className="w-full mt-10 bg-[#ff7665] text-white py-5 rounded-[24px] font-bold text-lg shadow-lg shadow-[#ff7665]/30 hover:bg-[#ff5a45] transition-all">
                    {loading ? t('common_saving') : t('onboarding_finish_provider')}
                  </button>
                </div>
              )}

              {step === 4 && (
                <div className="animate-in fade-in slide-in-from-right-4 -mx-10 md:-mx-14 -mb-10 md:-mb-14">
                  <KYCVerification 
                    user={user} 
                    profile={{ role, phone, specialty, full_name: fullName }} 
                    onVerified={() => navigate("/dashboard")} 
                  />
                </div>
              )}
            </>
          )}

          {step > 0 && role === 'client' && (
            /* ONBOARDING CLIENTE */
            <>
              {step === 1 && (
                <div className="animate-in fade-in slide-in-from-right-4">
                  <h1 className="font-serif text-4xl text-[#1f2c45] leading-tight text-center italic">{t('onboarding_welcome_client')}</h1>
                  <p className="mt-4 text-[#5f6a79] text-lg text-center">{t('onboarding_welcome_client_desc')}</p>
                  <div className="mt-10 bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-start gap-4">
                    <div className="bg-[#1f2c45] p-3 rounded-2xl text-white shadow-lg"><Heart className="w-6 h-6" /></div>
                    <div>
                      <h3 className="font-bold text-[#1f2c45]">{t('onboarding_trust_title')}</h3>
                      <p className="text-sm text-[#5f6a79] mt-1">{t('onboarding_trust_desc')}</p>
                    </div>
                  </div>
                  <button onClick={nextStep} className="w-full mt-10 bg-[#1f2c45] text-white py-5 rounded-[24px] font-bold text-lg flex items-center justify-center gap-2 hover:bg-[#ff7665] transition-all group">
                    {t('hero_cta_start')} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="animate-in fade-in slide-in-from-right-4">
                  <h2 className="font-serif text-3xl text-[#1f2c45] text-center mb-6 italic">{t('onboarding_location_title')}</h2>
                  <div className="space-y-6">
                    <div className="relative">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#a4b1c6]"><Navigation className="w-5 h-5" /></div>
                      <input 
                        type="text" placeholder={t('onboarding_location_placeholder')} value={address} onChange={(e) => setAddress(e.target.value)}
                        className="w-full pl-14 pr-6 py-5 rounded-[24px] bg-[#f7f3f1] border-2 border-transparent focus:border-[#ff7665] focus:bg-white outline-none font-bold text-[#1f2c45]" />
                    </div>
                    <div className="p-6 bg-green-50 rounded-3xl border border-green-100 flex items-center gap-4">
                      <Star className="fill-green-500 text-green-500 w-6 h-6" />
                      <p className="text-sm text-green-700 font-medium">{t('onboarding_location_hint')}</p>
                    </div>
                  </div>
                  <button onClick={nextStep} disabled={!address} className="w-full mt-10 bg-[#1f2c45] text-white py-5 rounded-[24px] font-bold text-lg disabled:opacity-50 transition-all shadow-xl">{t('common_continue')}</button>
                </div>
              )}

              {step === 3 && (
                <div className="animate-in fade-in slide-in-from-right-4">
                  <h2 className="font-serif text-3xl text-[#1f2c45] text-center mb-6 italic">{t('onboarding_contact_title')}</h2>
                  <div className="space-y-6">
                    <input type="tel" placeholder="+57 3..." value={phone} onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-6 py-5 rounded-[24px] bg-[#f7f3f1] border-2 border-transparent focus:border-[#ff7665] focus:bg-white outline-none font-bold text-[#1f2c45]" />
                  </div>
                  <button onClick={handleFinishCliente} disabled={loading || !phone}
                    className="w-full mt-10 bg-[#ff7665] text-white py-5 rounded-[24px] font-bold text-lg shadow-lg shadow-[#ff7665]/30 hover:bg-[#ff5a45] transition-all">
                    {loading ? t('common_saving') : t('onboarding_finish_client')}
                  </button>
                </div>
              )}

              {step === 4 && (
                <div className="animate-in fade-in slide-in-from-right-4 -mx-10 md:-mx-14 -mb-10 md:-mb-14">
                  <KYCVerification 
                    user={user} 
                    profile={{ role, phone, address, full_name: fullName }} 
                    onVerified={() => navigate("/dashboard")} 
                  />
                </div>
              )}
            </>
          )}

        </div>
      </main>

      <footer className="p-8 text-center" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}>
        <p className="text-xs text-[#a4b1c6] font-black uppercase tracking-widest">
          {step === 0 ? t('onboarding_step_role') : (step === 4 && role === 'kamellador') ? t('onboarding_step_kyc') : t('onboarding_step_n_of_m').replace('{{n}}', step).replace('{{m}}', role === 'kamellador' ? 4 : 3)}
        </p>
      </footer>
    </div>
  );
}
