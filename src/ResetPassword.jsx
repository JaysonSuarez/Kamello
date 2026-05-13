import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase } from "./lib/supabase";
import { useLanguage } from "./lib/i18n";
import LanguageSwitcher from "./components/LanguageSwitcher";

const logoImageUrl = "/images/K-Editado.png";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true);
        setCheckingSession(false);
      } else if (event === "SIGNED_IN" && session) {
        setSessionReady(true);
        setCheckingSession(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      }
      setTimeout(() => setCheckingSession(false), 2000);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError(t('auth_reset_mismatch'));
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      setMessage(t('auth_reset_success'));
      await supabase.auth.signOut();
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.message || "Error");
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
          <div className="mt-4 flex justify-center">
            <LanguageSwitcher />
          </div>
          <h1 className="mt-8 font-serif text-4xl text-[#1f2c45]">{t('auth_reset_title')}</h1>
          <p className="mt-3 text-lg text-[#5f6a79]">{t('auth_reset_subtitle')}</p>
        </div>

        <div className="bg-white rounded-[32px] p-8 shadow-xl shadow-[#1f2c45]/5 border border-[#efe7e2]">
          {checkingSession ? (
            <div className="flex flex-col items-center py-8 gap-4">
              <Loader2 className="w-10 h-10 text-[#ff7665] animate-spin" />
              <p className="text-[#5f6a79] font-medium">{t('auth_reset_verifying')}</p>
            </div>
          ) : !sessionReady ? (
            <div className="py-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-amber-50 text-amber-500">
                  <AlertTriangle className="w-9 h-9" />
                </div>
                <h3 className="text-xl font-bold text-[#1f2c45]">{t('auth_reset_invalid_title')}</h3>
                <p className="text-[#5f6a79]">
                  {t('auth_reset_invalid_text')}
                </p>
                <Link
                  to="/forgot-password"
                  className="mt-2 inline-flex items-center gap-2 bg-[#ff7665] text-white px-6 py-3 rounded-2xl font-bold hover:bg-[#ff5a45] transition-all"
                >
                  {t('auth_reset_request_new')}
                </Link>
              </div>
            </div>
          ) : !message ? (
            <form className="space-y-5" onSubmit={handleUpdatePassword}>
              {error && (
                <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-[#1f2c45] mb-2 px-1">
                  {t('auth_reset_label')}
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5f6a79] group-focus-within:text-[#ff7665] transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('auth_reset_placeholder')}
                    minLength="8"
                    required
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[#f7f3f1] border-2 border-transparent focus:border-[#ff7665] focus:bg-white outline-none transition-all text-[#1f2c45] font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#1f2c45] mb-2 px-1">
                  {t('auth_reset_confirm_label')}
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5f6a79] group-focus-within:text-[#ff7665] transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('auth_reset_confirm_placeholder')}
                    minLength="8"
                    required
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[#f7f3f1] border-2 border-transparent focus:border-[#ff7665] focus:bg-white outline-none transition-all text-[#1f2c45] font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#ff7665] text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-[#ff7665]/30 hover:bg-[#ff5a45] hover:-translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  t('auth_reset_btn')
                )}
              </button>
            </form>
          ) : (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-50 text-green-500 mb-6">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-[#1f2c45] mb-2">{t('auth_forgot_success_title')}</h3>
              <p className="text-[#5f6a79] mb-8">{message}</p>
              <p className="text-sm text-[#a4b1c6]">{t('auth_reset_redirecting')}</p>
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-lg text-[#5f6a79]">
          {t('auth_forgot_remember')}{" "}
          <Link to="/login" className="font-bold text-[#ff7665] hover:underline">
            {t('register_login_link')}
          </Link>
        </p>
      </div>
    </div>
  );
}
