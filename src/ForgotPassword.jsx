import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "./lib/supabase";

const logoImageUrl = "/images/K-Editado.png";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) throw resetError;

      setMessage("¡Enlace enviado! Revisa tu correo electrónico para restablecer tu contraseña.");
    } catch (err) {
      setError(err.message || "Error al enviar el correo de restablecimiento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f3f1] p-6 font-sans">
      <div className="w-full max-w-[480px]">
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
          <h1 className="mt-8 font-serif text-4xl text-[#1f2c45]">Recuperar acceso</h1>
          <p className="mt-3 text-lg text-[#5f6a79]">Te enviaremos un enlace para crear una nueva contraseña</p>
        </div>

        <div className="bg-white rounded-[32px] p-8 shadow-xl shadow-[#1f2c45]/5 border border-[#efe7e2]">
          {!message ? (
            <form className="space-y-6" onSubmit={handleResetPassword}>
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

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-[#ff7665] text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-[#ff7665]/30 hover:bg-[#ff5a45] hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  "Enviar enlace de recuperación"
                )}
              </button>
            </form>
          ) : (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-50 text-green-500 mb-6">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-[#1f2c45] mb-2">¡Correo enviado!</h3>
              <p className="text-[#5f6a79] mb-8">{message}</p>
              <Link to="/login" className="text-[#ff7665] font-bold hover:underline flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Volver al inicio de sesión
              </Link>
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-lg text-[#5f6a79]">
          ¿Recordaste tu contraseña?{" "}
          <Link to="/login" className="font-bold text-[#ff7665] hover:underline">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
