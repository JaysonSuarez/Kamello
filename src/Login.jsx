import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, Code2, Globe, Loader2 } from "lucide-react";
import { supabase } from "./lib/supabase";

const logoImageUrl = "/images/K-Editado.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (data.session) {
        navigate("/dashboard"); // Redirigir al dashboard tras login exitoso
      }
    } catch (err) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f3f1] p-6 font-sans">
      <div className="w-full max-w-[480px]">
        {/* Logo & Header */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <img 
              src={logoImageUrl} 
              alt="Kamello Logo" 
              className="h-10 w-auto object-contain transition-transform group-hover:scale-110" 
            />
            <span className="text-3xl font-bold tracking-[-0.03em] text-[#1f2c45]">
              Kamello
            </span>
          </Link>
          <h1 className="mt-8 font-serif text-4xl text-[#1f2c45]">¡Bienvenido de nuevo!</h1>
          <p className="mt-3 text-lg text-[#5f6a79]">Ingresa tus credenciales para continuar</p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-[32px] p-8 shadow-xl shadow-[#1f2c45]/5 border border-[#efe7e2]">
          <form className="space-y-5" onSubmit={handleLogin}>
            {error && (
              <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-bold text-[#1f2c45] mb-2 px-1">Correo electrónico</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5f6a79] group-focus-within:text-[#ff7665] transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  required
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
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[#f7f3f1] border-2 border-transparent focus:border-[#ff7665] focus:bg-white outline-none transition-all text-[#1f2c45] font-medium"
                />
              </div>
              <div className="mt-2 text-right">
                <Link to="/forgot-password" size="sm" className="text-sm font-semibold text-[#ff7665] hover:underline">¿Olvidaste tu contraseña?</Link>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#ff7665] text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-[#ff7665]/30 hover:bg-[#ff5a45] hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  Iniciar Sesión
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#efe7e2]"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-4 bg-white text-[#5f6a79] font-medium">O continúa con</span></div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl border-2 border-[#efe7e2] font-bold text-[#1f2c45] hover:bg-[#f7f3f1] transition-all">
              <Globe className="w-5 h-5 text-[#4285F4]" />
              Google
            </button>
            <button className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl border-2 border-[#efe7e2] font-bold text-[#1f2c45] hover:bg-[#f7f3f1] transition-all">
              <Code2 className="w-5 h-5" />
              GitHub
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-lg text-[#5f6a79]">
          ¿No tienes una cuenta?{" "}
          <Link to="/register" className="font-bold text-[#ff7665] hover:underline">Regístrate gratis</Link>
        </p>
      </div>
    </div>
  );
}
