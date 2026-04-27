import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowRight, 
  CheckCircle2, 
  MapPin, 
  Camera,
  ShieldCheck,
  Hammer,
  Paintbrush,
  Droplets,
  Zap as Sparkles,
  User,
  Heart,
  Navigation,
  Star
} from "lucide-react";
import { supabase } from "./lib/supabase";
import { SERVICE_CATEGORIES } from "./serviceCategories";

const logoImageUrl = "/images/K-Editado.png";

const CATEGORIES = [
  { id: "Electricista", name: "Electricidad", icon: <Sparkles className="w-6 h-6" />, color: "bg-amber-100 text-amber-600" },
  { id: "Albañil", name: "Albañilería", icon: <Hammer className="w-6 h-6" />, color: "bg-orange-100 text-orange-600" },
  { id: "Fontanero", name: "Fontanería", icon: <Droplets className="w-6 h-6" />, color: "bg-blue-100 text-blue-600" },
  { id: "Pintor", name: "Pintura", icon: <Paintbrush className="w-6 h-6" />, color: "bg-purple-100 text-purple-600" }
];

export default function Onboarding() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Estados Kamellador
  const [specialty, setSpecialty] = useState("");
  const [phone, setPhone] = useState("");

  // Estados Cliente
  const [address, setAddress] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }
      setUser(user);
      setRole(user.user_metadata?.role || 'kamellador');
    };
    checkUser();
  }, [navigate]);

  const handleFinishKamellador = async () => {
    if (!specialty || !phone) return alert("Por favor completa todos los campos.");
    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').update({
        specialty, phone, role: 'kamellador', is_active: true
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
    if (!address) return alert("Por favor ingresa tu dirección.");
    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').update({
        role: 'client', is_active: true, phone // phone si lo pedimos
      }).eq('id', user.id);
      if (error) throw error;
      navigate("/dashboard"); // O a una vista de cliente específica
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(step + 1);

  if (!user) return null;

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
          
          <div className="flex gap-2 mb-10 justify-center">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-2 rounded-full transition-all duration-500 ${step === i ? 'w-8 bg-[#ff7665]' : 'w-2 bg-[#efe7e2]'}`}></div>
            ))}
          </div>

          {role === 'kamellador' ? (
            /* ONBOARDING KAMELLADOR */
            <>
              {step === 1 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h1 className="font-serif text-4xl text-[#1f2c45] leading-tight text-center italic">¡Bienvenido a la manada, Kamellador!</h1>
                  <p className="mt-4 text-[#5f6a79] text-lg text-center leading-relaxed">
                    Prepara tus herramientas. Vamos a configurar tu perfil para que empieces a ganar dinero hoy mismo.
                  </p>
                  <div className="mt-10 bg-[#fff8f4] p-6 rounded-3xl border border-[#f1d8cb] flex items-start gap-4">
                    <div className="bg-[#ff7665] p-3 rounded-2xl text-white shadow-lg">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#1f2c45]">Seguridad Primero</h3>
                      <p className="text-sm text-[#5f6a79] mt-1">Verificamos cada perfil para mantener la calidad de la red.</p>
                    </div>
                  </div>
                  <button onClick={nextStep} className="w-full mt-10 bg-[#1f2c45] text-white py-5 rounded-[24px] font-bold text-lg flex items-center justify-center gap-2 hover:bg-[#ff7665] transition-all group shadow-xl">
                    Configurar mi Perfil <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <h2 className="font-serif text-3xl text-[#1f2c45] text-center mb-2 italic">¿En qué eres experto?</h2>
                  <p className="text-[#5f6a79] text-center mb-10">Selecciona tu categoría principal.</p>
                  <div className="grid grid-cols-2 gap-4 max-h-[420px] overflow-y-auto pr-1">
                    {SERVICE_CATEGORIES.map(cat => (
                      <button key={cat.id} onClick={() => setSpecialty(cat.id)}
                        className={`p-6 rounded-[32px] border-2 transition-all flex flex-col items-center gap-3 ${specialty === cat.id ? 'border-[#ff7665] bg-[#fff8f4] scale-[1.02] shadow-md' : 'border-[#efe7e2] hover:border-[#a4b1c6]'}`}>
                        <div className={`p-4 rounded-2xl ${cat.chip}`}>{cat.icon}</div>
                        <span className="font-bold text-[#1f2c45] text-sm leading-tight">{cat.shortName}</span>
                      </button>
                    ))}
                  </div>
                  <button onClick={nextStep} disabled={!specialty} className="w-full mt-10 bg-[#1f2c45] text-white py-5 rounded-[24px] font-bold text-lg disabled:opacity-50 transition-all shadow-xl">Continuar</button>
                </div>
              )}

              {step === 3 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <h2 className="font-serif text-3xl text-[#1f2c45] text-center mb-2 italic">Casi listo</h2>
                  <p className="text-[#5f6a79] text-center mb-10">Danos un número para que te contacten.</p>
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
          ) : (
            /* ONBOARDING CLIENTE */
            <>
              {step === 1 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h1 className="font-serif text-4xl text-[#1f2c45] leading-tight text-center italic">¡Bienvenido a Kamello!</h1>
                  <p className="mt-4 text-[#5f6a79] text-lg text-center leading-relaxed">
                    Estamos aquí para hacerte la vida más fácil. Configura tu cuenta para empezar a solicitar servicios.
                  </p>
                  <div className="mt-10 bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-start gap-4">
                    <div className="bg-[#1f2c45] p-3 rounded-2xl text-white shadow-lg">
                      <Heart className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#1f2c45]">Calidad Garantizada</h3>
                      <p className="text-sm text-[#5f6a79] mt-1">Todos nuestros profesionales pasan por un filtro de confianza.</p>
                    </div>
                  </div>
                  <button onClick={nextStep} className="w-full mt-10 bg-[#1f2c45] text-white py-5 rounded-[24px] font-bold text-lg flex items-center justify-center gap-2 hover:bg-[#ff7665] transition-all group shadow-xl">
                    Configurar mi Cuenta <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <h2 className="font-serif text-3xl text-[#1f2c45] text-center mb-2 italic">Tu Ubicación</h2>
                  <p className="text-[#5f6a79] text-center mb-10">¿Dónde necesitas que lleguen nuestros expertos?</p>
                  <div className="space-y-6">
                    <div className="relative">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#a4b1c6]">
                        <Navigation className="w-5 h-5" />
                      </div>
                      <input 
                        type="text" placeholder="Ej: Calle 100 #15-20, Bogotá" value={address} onChange={(e) => setAddress(e.target.value)}
                        className="w-full pl-14 pr-6 py-5 rounded-[24px] bg-[#f7f3f1] border-2 border-transparent focus:border-[#ff7665] focus:bg-white outline-none font-bold text-[#1f2c45]" />
                    </div>
                    <div className="p-6 bg-green-50 rounded-3xl border border-green-100 flex items-center gap-4">
                      <Star className="fill-green-500 text-green-500 w-6 h-6" />
                      <p className="text-sm text-green-700 font-medium">Usaremos esto para encontrar profesionales a menos de 5km de ti.</p>
                    </div>
                  </div>
                  <button onClick={nextStep} disabled={!address} className="w-full mt-10 bg-[#1f2c45] text-white py-5 rounded-[24px] font-bold text-lg disabled:opacity-50 transition-all shadow-xl">Continuar</button>
                </div>
              )}

              {step === 3 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <h2 className="font-serif text-3xl text-[#1f2c45] text-center mb-2 italic">Contacto Directo</h2>
                  <p className="text-[#5f6a79] text-center mb-10">Un número para coordinar la llegada del Kamellador.</p>
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
        <p className="text-xs text-[#a4b1c6] font-black uppercase tracking-widest">Paso {step} de 3 • Onboarding de {role === 'kamellador' ? 'Profesional' : 'Cliente'}</p>
      </footer>
    </div>
  );
}
