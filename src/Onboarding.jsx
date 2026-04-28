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
  Loader2
} from "lucide-react";
import { supabase } from "./lib/supabase";
import { SERVICE_CATEGORIES } from "./serviceCategories";

const logoImageUrl = "/images/K-Editado.png";

export default function Onboarding() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // null, 'kamellador', 'client'
  const [step, setStep] = useState(0); // Empezamos en 0 para selección de rol si es necesario
  const [loading, setLoading] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const navigate = useNavigate();

  // Estados Kamellador
  const [specialty, setSpecialty] = useState("");
  const [phone, setPhone] = useState("");

  // Estados Cliente
  const [address, setAddress] = useState("");

  useEffect(() => {
    const checkUserAndRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }
      setUser(user);

      // Verificar si ya tiene un perfil con rol
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_active')
        .eq('id', user.id)
        .single();

      if (profile?.role) {
        if (profile.is_active) {
          navigate("/dashboard"); // Ya terminó onboarding
        } else {
          setRole(profile.role);
          setStep(1); // Ya tiene rol, ir a paso 1
        }
      } else {
        // No tiene rol (Login con Google por primera vez)
        setStep(0);
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
    if (!specialty || !phone) return alert("Por favor completa todos los campos.");
    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').update({
        specialty, 
        phone, 
        role: 'kamellador', 
        is_active: false, // BLOQUEADO hasta aprobación admin
        verification_status: null // Para que inicie flujo KYC
      }).eq('id', user.id);
      if (error) throw error;
      navigate("/dashboard");
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
        is_active: true, // CLIENTES entran directo
        verification_status: 'verified', // No requieren KYC manual
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
    <div className="min-h-screen bg-[#f7f3f1] flex flex-col font-sans">
      <header className="p-8 flex justify-center">
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
              <h1 className="font-serif text-4xl text-[#1f2c45] leading-tight text-center italic mb-4">¿Cómo quieres usar Kamello?</h1>
              <p className="text-[#5f6a79] text-lg text-center mb-10">Personalizaremos tu experiencia según tu elección.</p>
              
              <div className="grid grid-cols-1 gap-6">
                <button 
                  onClick={() => handleSelectRole('kamellador')}
                  className="group relative overflow-hidden bg-white p-8 rounded-[32px] border-2 border-[#efe7e2] hover:border-[#ff7665] hover:shadow-xl transition-all text-left flex items-center gap-6"
                >
                  <div className="p-5 bg-[#ff7665]/10 rounded-[24px] text-[#ff7665] group-hover:scale-110 transition-transform">
                    <Briefcase className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[#1f2c45]">Quiero Kamellar</h3>
                    <p className="text-[#5f6a79] text-sm">Soy un experto técnico y busco trabajos en mi zona.</p>
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
                    <h3 className="text-2xl font-black text-[#1f2c45]">Quiero Pedir Ayuda</h3>
                    <p className="text-[#5f6a79] text-sm">Necesito a un experto para una reparación o servicio técnico.</p>
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
                  <h1 className="font-serif text-4xl text-[#1f2c45] leading-tight text-center italic">¡Bienvenido, Kamellador!</h1>
                  <p className="mt-4 text-[#5f6a79] text-lg text-center">Configura tu perfil para empezar a recibir ofertas hoy mismo.</p>
                  <div className="mt-10 bg-[#fff8f4] p-6 rounded-3xl border border-[#f1d8cb] flex items-start gap-4">
                    <div className="bg-[#ff7665] p-3 rounded-2xl text-white shadow-lg"><ShieldCheck className="w-6 h-6" /></div>
                    <div>
                      <h3 className="font-bold text-[#1f2c45]">Seguridad</h3>
                      <p className="text-sm text-[#5f6a79] mt-1">Tu perfil será verificado antes de poder ver clientes.</p>
                    </div>
                  </div>
                  <button onClick={nextStep} className="w-full mt-10 bg-[#1f2c45] text-white py-5 rounded-[24px] font-bold text-lg flex items-center justify-center gap-2 hover:bg-[#ff7665] transition-all group">
                    Continuar <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="animate-in fade-in slide-in-from-right-4">
                  <h2 className="font-serif text-3xl text-[#1f2c45] text-center mb-6 italic">¿En qué eres experto?</h2>
                  <div className="grid grid-cols-2 gap-4 max-h-[420px] overflow-y-auto pr-1">
                    {SERVICE_CATEGORIES.map(cat => (
                      <button key={cat.id} onClick={() => setSpecialty(cat.id)}
                        className={`p-6 rounded-[32px] border-2 transition-all flex flex-col items-center gap-3 ${specialty === cat.id ? 'border-[#ff7665] bg-[#fff8f7] scale-[1.02]' : 'border-[#efe7e2] hover:border-[#a4b1c6]'}`}>
                        <div className={`p-4 rounded-2xl ${cat.chip}`}>{cat.icon}</div>
                        <span className="font-bold text-[#1f2c45] text-sm text-center">{cat.shortName}</span>
                      </button>
                    ))}
                  </div>
                  <button onClick={nextStep} disabled={!specialty} className="w-full mt-10 bg-[#1f2c45] text-white py-5 rounded-[24px] font-bold text-lg disabled:opacity-50">Continuar</button>
                </div>
              )}

              {step === 3 && (
                <div className="animate-in fade-in slide-in-from-right-4">
                  <h2 className="font-serif text-3xl text-[#1f2c45] text-center mb-6 italic">Contacto Final</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-[#1f2c45] mb-2 pl-1">Celular</label>
                      <input type="tel" placeholder="+57 3..." value={phone} onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-6 py-5 rounded-[24px] bg-[#f7f3f1] border-2 border-transparent focus:border-[#ff7665] focus:bg-white outline-none font-bold text-[#1f2c45]" />
                    </div>
                  </div>
                  <button onClick={handleFinishKamellador} disabled={loading || !phone}
                    className="w-full mt-10 bg-[#ff7665] text-white py-5 rounded-[24px] font-bold text-lg shadow-lg shadow-[#ff7665]/30 hover:bg-[#ff5a45] transition-all">
                    {loading ? "Cargando..." : "¡Empezar a Kamellar!"}
                  </button>
                </div>
              )}
            </>
          )}

          {step > 0 && role === 'client' && (
            /* ONBOARDING CLIENTE */
            <>
              {step === 1 && (
                <div className="animate-in fade-in slide-in-from-right-4">
                  <h1 className="font-serif text-4xl text-[#1f2c45] leading-tight text-center italic">¡Bienvenido a Kamello!</h1>
                  <p className="mt-4 text-[#5f6a79] text-lg text-center">Estamos listos para ayudarte con tus reparaciones.</p>
                  <div className="mt-10 bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-start gap-4">
                    <div className="bg-[#1f2c45] p-3 rounded-2xl text-white shadow-lg"><Heart className="w-6 h-6" /></div>
                    <div>
                      <h3 className="font-bold text-[#1f2c45]">Confianza</h3>
                      <p className="text-sm text-[#5f6a79] mt-1">Conectamos solo con técnicos verificados de tu comunidad.</p>
                    </div>
                  </div>
                  <button onClick={nextStep} className="w-full mt-10 bg-[#1f2c45] text-white py-5 rounded-[24px] font-bold text-lg flex items-center justify-center gap-2 hover:bg-[#ff7665] transition-all group">
                    Comenzar <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="animate-in fade-in slide-in-from-right-4">
                  <h2 className="font-serif text-3xl text-[#1f2c45] text-center mb-6 italic">Tu Ubicación</h2>
                  <div className="space-y-6">
                    <div className="relative">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#a4b1c6]"><Navigation className="w-5 h-5" /></div>
                      <input 
                        type="text" placeholder="Ej: Calle 100 #15-20, Bogotá" value={address} onChange={(e) => setAddress(e.target.value)}
                        className="w-full pl-14 pr-6 py-5 rounded-[24px] bg-[#f7f3f1] border-2 border-transparent focus:border-[#ff7665] focus:bg-white outline-none font-bold text-[#1f2c45]" />
                    </div>
                    <div className="p-6 bg-green-50 rounded-3xl border border-green-100 flex items-center gap-4">
                      <Star className="fill-green-500 text-green-500 w-6 h-6" />
                      <p className="text-sm text-green-700 font-medium">Encontraremos técnicos a menos de 5km de ti.</p>
                    </div>
                  </div>
                  <button onClick={nextStep} disabled={!address} className="w-full mt-10 bg-[#1f2c45] text-white py-5 rounded-[24px] font-bold text-lg disabled:opacity-50 transition-all shadow-xl">Continuar</button>
                </div>
              )}

              {step === 3 && (
                <div className="animate-in fade-in slide-in-from-right-4">
                  <h2 className="font-serif text-3xl text-[#1f2c45] text-center mb-6 italic">Contacto Final</h2>
                  <div className="space-y-6">
                    <input type="tel" placeholder="+57 3..." value={phone} onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-6 py-5 rounded-[24px] bg-[#f7f3f1] border-2 border-transparent focus:border-[#ff7665] focus:bg-white outline-none font-bold text-[#1f2c45]" />
                  </div>
                  <button onClick={handleFinishCliente} disabled={loading || !phone}
                    className="w-full mt-10 bg-[#ff7665] text-white py-5 rounded-[24px] font-bold text-lg shadow-lg shadow-[#ff7665]/30 hover:bg-[#ff5a45] transition-all">
                    {loading ? "Cargando..." : "¡Listos para pedir servicios!"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <footer className="p-8 text-center">
        <p className="text-xs text-[#a4b1c6] font-black uppercase tracking-widest">
          {step === 0 ? "Selección de rol" : `Paso ${step} de 3`}
        </p>
      </footer>
    </div>
  );
}
