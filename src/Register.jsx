import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, ArrowRight, CheckCircle2, Loader2, Briefcase, ShoppingCart } from "lucide-react";
import { supabase } from "./lib/supabase";

const logoImageUrl = "/images/K-Editado.png";

export default function Register() {
  const [role, setRole] = useState("kamellador"); // kamellador o client
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Redirigir según el rol guardado en los metadatos
        const userRole = session.user.user_metadata?.role;
        if (userRole === "kamellador") {
          navigate("/onboarding");
        } else {
          navigate("/dashboard");
        }
      }
    };
    checkSession();
  }, [navigate]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: `${firstName} ${lastName}`.trim(),
            role: role
          },
        },
      });

      if (authError) throw authError;

      if (data.user) {
        // Save the intended role so Onboarding doesn't ask again
        localStorage.setItem('kamello_intended_role', role);
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message || "Error al crear la cuenta");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setSocialLoading(true);
    try {
      localStorage.setItem('kamello_intended_role', role);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/dashboard",
        },
      });
      if (error) throw error;
    } catch (err) {
      setError(err.message);
      setSocialLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f3f1] p-6 font-sans">
      <div className="w-full max-w-[1000px] flex flex-col md:flex-row bg-white rounded-[40px] overflow-hidden shadow-2xl shadow-[#1f2c45]/5 border border-[#efe7e2]">
        
        {/* Left Side: Illustration & Value Prop */}
        <div className="flex-1 bg-[#1f2c45] p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="z-10">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <img 
                src={logoImageUrl} 
                alt="Kamello Logo" 
                className="h-10 w-auto object-contain brightness-0 invert transition-transform group-hover:scale-110" 
              />
              <span className="text-3xl font-bold tracking-[-0.03em] text-white">
                Kamello
              </span>
            </Link>
            <h2 className="mt-16 font-serif text-5xl leading-tight">Únete a la mayor red de técnicos.</h2>
            <p className="mt-6 text-xl text-[#a4b1c6] max-w-sm">Crea tu perfil en minutos y accede a cientos de solicitudes en tu zona.</p>
          </div>

          <div className="mt-12 space-y-6 z-10">
            {[
              "Cobra el 100% de tu trabajo",
              "Seguridad garantizada por PIN",
              "Soporte técnico 24/7"
            ].map((text) => (
              <div key={text} className="flex items-center gap-4 text-lg">
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-[#ff7665] flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
                <span>{text}</span>
              </div>
            ))}
          </div>

          <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-[#ff7665]/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-white/5 rounded-full"></div>
        </div>

        {/* Right Side: Form */}
        <div className="flex-[1.2] p-12 bg-white w-full">
          <div className="mb-10 text-center md:text-left">
            <h1 className="font-serif text-4xl text-[#1f2c45]">Crear cuenta</h1>
            <p className="mt-3 text-lg text-[#5f6a79]">Selecciona cómo quieres usar Kamello</p>
          </div>

          {/* Role Selector */}
          <div className="flex gap-4 mb-8">
            <button 
              type="button"
              onClick={() => setRole("kamellador")}
              className={`flex-1 p-4 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 ${role === 'kamellador' ? 'border-[#ff7665] bg-[#fff8f7] text-[#ff7665]' : 'border-[#efe7e2] text-[#5f6a79] hover:border-[#ff7665]/50'}`}
            >
              <Briefcase className="w-6 h-6" />
              <span className="font-bold text-sm">Quiero Kamellar</span>
            </button>
            <button 
              type="button"
              onClick={() => setRole("client")}
              className={`flex-1 p-4 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 ${role === 'client' ? 'border-[#ff7665] bg-[#fff8f7] text-[#ff7665]' : 'border-[#efe7e2] text-[#5f6a79] hover:border-[#ff7665]/50'}`}
            >
              <ShoppingCart className="w-6 h-6" />
              <span className="font-bold text-sm">Quiero Solicitar</span>
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleRegister}>
            {error && (
              <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-[#1f2c45] mb-2 px-1">Nombre</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5f6a79] group-focus-within:text-[#ff7665] transition-colors">
                    <User className="w-5 h-5" />
                  </div>
                  <input 
                    type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Juan" required
                    className="w-full pl-12 pr-4 py-3 rounded-2xl bg-[#f7f3f1] border-2 border-transparent focus:border-[#ff7665] focus:bg-white outline-none transition-all text-[#1f2c45] font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#1f2c45] mb-2 px-1">Apellido</label>
                <input 
                  type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                  placeholder="Pérez" required
                  className="w-full px-6 py-3 rounded-2xl bg-[#f7f3f1] border-2 border-transparent focus:border-[#ff7665] focus:bg-white outline-none transition-all text-[#1f2c45] font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#1f2c45] mb-2 px-1">Correo electrónico</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5f6a79] group-focus-within:text-[#ff7665] transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input 
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com" required
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-[#f7f3f1] border-2 border-transparent focus:border-[#ff7665] focus:bg-white outline-none transition-all text-[#1f2c45] font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#1f2c45] mb-2 px-1">Contraseña</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5f6a79] group-focus-within:text-[#ff7665] transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input 
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres" minLength="8" required
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-[#f7f3f1] border-2 border-transparent focus:border-[#ff7665] focus:bg-white outline-none transition-all text-[#1f2c45] font-medium"
                />
              </div>
            </div>

            <button 
              type="submit" disabled={loading || socialLoading}
              className="w-full bg-[#1f2c45] text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-[#ff7665] transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Registrarme como {role === 'kamellador' ? 'Profesional' : 'Cliente'} <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" /></>}
            </button>
          </form>

          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#efe7e2]"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-4 bg-white text-[#5f6a79] font-medium">O usa tu cuenta de</span></div>
          </div>

          <div className="mt-6">
            <button 
              onClick={handleGoogleLogin}
              disabled={loading || socialLoading}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl border-2 border-[#efe7e2] font-bold text-[#1f2c45] hover:bg-[#f7f3f1] transition-all disabled:opacity-50"
            >
              {socialLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </>
              )}
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-[#5f6a79]">
            ¿Ya tienes una cuenta? <Link to="/login" className="font-bold text-[#ff7665] hover:underline">Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
