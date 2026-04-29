import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "./lib/supabase";

const logoImageUrl = "/images/K-Editado.png";

export default function Login() {
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
        navigate("/dashboard");
      }
    };
    checkSession();
  }, [navigate]);

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
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setSocialLoading(true);
    try {
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
              disabled={loading || socialLoading}
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

          <div className="mt-8">
            <button 
              onClick={handleGoogleLogin}
              disabled={loading || socialLoading}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border-2 border-[#efe7e2] font-bold text-[#1f2c45] hover:bg-[#f7f3f1] transition-all disabled:opacity-50"
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
                  Continuar con Google
                </>
              )}
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
