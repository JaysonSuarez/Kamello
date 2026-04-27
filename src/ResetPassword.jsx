import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "./lib/supabase";

const logoImageUrl = "/images/K-Editado.png";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      setMessage("¡Contraseña actualizada con éxito!");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.message || "Error al actualizar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f3f1] p-6 font-sans">
      <div className="w-full max-w-[480px]">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-3">
            <img src={logoImageUrl} alt="Logo" className="h-10 w-auto" />
            <span className="text-3xl font-bold text-[#1f2c45]">Kamello</span>
          </Link>
          <h1 className="mt-8 font-serif text-4xl text-[#1f2c45]">Nueva contraseña</h1>
          <p className="mt-3 text-lg text-[#5f6a79]">Elige una contraseña segura para tu cuenta</p>
        </div>

        <div className="bg-white rounded-[32px] p-8 shadow-xl border border-[#efe7e2]">
          {!message ? (
            <form className="space-y-6" onSubmit={handleUpdatePassword}>
              {error && <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100">{error}</div>}
              
              <div>
                <label className="block text-sm font-bold text-[#1f2c45] mb-2 px-1">Nueva contraseña</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5f6a79]">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    minLength="8"
                    required
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[#f7f3f1] border-2 border-transparent focus:border-[#ff7665] outline-none transition-all"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-[#ff7665] text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-[#ff7665]/30 hover:bg-[#ff5a45] disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "Actualizar contraseña"}
              </button>
            </form>
          ) : (
            <div className="text-center py-4">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-[#1f2c45] mb-2">{message}</h3>
              <p className="text-[#5f6a79]">Serás redirigido al inicio de sesión en unos segundos...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
