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
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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
            role: role // Guardamos el rol en el metadata del usuario
          },
        },
      });

      if (authError) throw authError;

      if (data.user) {
        // Si es Kamellador, va al onboarding profesional
        // Si es Cliente, va al dashboard de pedidos (que crearemos o redirigiremos)
        if (role === "kamellador") {
          navigate("/onboarding");
        } else {
          // Por ahora al dashboard general, pero marcado como cliente
          navigate("/dashboard"); 
        }
      }
    } catch (err) {
      setError(err.message || "Error al crear la cuenta");
    } finally {
      setLoading(false);
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
            <h2 className="mt-16 font-serif text-5xl leading-tight">Únete a la mayor red de talento.</h2>
            <p className="mt-6 text-xl text-[#a4b1c6] max-w-sm">Crea tu perfil en minutos y accede a miles de oportunidades personalizadas.</p>
          </div>

          <div className="mt-12 space-y-6 z-10">
            {[
              "Acceso ilimitado a ofertas exclusivas",
              "Motor de búsqueda inteligente",
              "Asistencia profesional 24/7"
            ].map((text) => (
              <div key={text} className="flex items-center gap-4 text-lg">
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-[#ff7665] flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
                <span>{text}</span>
              </div>
            ))}
          </div>

          {/* Decorative shapes */}
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

          <form className="space-y-5" onSubmit={handleRegister}>
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
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[#f7f3f1] border-2 border-transparent focus:border-[#ff7665] focus:bg-white outline-none transition-all text-[#1f2c45] font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#1f2c45] mb-2 px-1">Apellido</label>
                <input 
                  type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                  placeholder="Pérez" required
                  className="w-full px-6 py-4 rounded-2xl bg-[#f7f3f1] border-2 border-transparent focus:border-[#ff7665] focus:bg-white outline-none transition-all text-[#1f2c45] font-medium"
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
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[#f7f3f1] border-2 border-transparent focus:border-[#ff7665] focus:bg-white outline-none transition-all text-[#1f2c45] font-medium"
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
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[#f7f3f1] border-2 border-transparent focus:border-[#ff7665] focus:bg-white outline-none transition-all text-[#1f2c45] font-medium"
                />
              </div>
            </div>

            <button 
              type="submit" disabled={loading}
              className="w-full bg-[#1f2c45] text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-[#ff7665] transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Registrarme como {role === 'kamellador' ? 'Profesional' : 'Cliente'} <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" /></>}
            </button>
          </form>

          <p className="mt-8 text-center text-lg text-[#5f6a79]">
            ¿Ya tienes una cuenta? <Link to="/login" className="font-bold text-[#ff7665] hover:underline">Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
