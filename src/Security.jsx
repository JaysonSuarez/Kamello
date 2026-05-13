import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Lock, CheckCircle, ArrowLeft, UserCheck, ShieldAlert } from "lucide-react";
import { useLanguage } from "./lib/i18n";
import LanguageSwitcher from "./components/LanguageSwitcher";

const logoImageUrl = "/images/K-Editado.png";

export default function Security() {
  const { t } = useLanguage();
  
  const pillars = [
    {
      title: t('security_kyc_title'),
      desc: t('security_kyc_text'),
      icon: <UserCheck className="w-8 h-8 text-[#ff7665]" />
    },
    {
      title: t('security_pin_title'),
      desc: t('security_pin_text'),
      icon: <Lock className="w-8 h-8 text-[#ff7665]" />
    },
    {
      title: t('security_reviews_title'),
      desc: t('security_reviews_text'),
      icon: <ShieldCheck className="w-8 h-8 text-[#ff7665]" />
    }
  ];

  return (
    <div className="min-h-screen bg-[#f7f3f1] font-sans text-[#1f2c45]">
      <header className="sticky top-0 z-50 w-full border-b border-[#efe7e2] bg-[#f7f3f1]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3 group">
            <img src={logoImageUrl} alt="Logo" className="h-8 w-auto transition-transform group-hover:scale-110" />
            <span className="text-2xl font-bold tracking-tight">Kamello</span>
          </Link>
          <div className="flex items-center gap-6">
            <LanguageSwitcher />
            <Link to="/" className="flex items-center gap-2 text-sm font-bold text-[#5f6a79] hover:text-[#ff7665] transition-colors">
              <ArrowLeft className="w-4 h-4" />
              {t('common_back_home').split(' ')[0]}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1000px] px-6 py-16">
        <div className="text-center mb-20">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ff7665]/10 text-[#ff7665] mb-6">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h1 className="font-serif text-5xl md:text-6xl mb-6">
            {t('security_hero_1')}
            <span className="text-[#ff7665]">{t('security_hero_2')}</span>
          </h1>
          <p className="text-[#5f6a79] text-xl max-w-2xl mx-auto">{t('security_hero_text')}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-24">
          {pillars.map((p, i) => (
            <div key={i} className="bg-white p-8 rounded-[32px] border border-[#efe7e2] shadow-sm hover:shadow-xl transition-all">
              <div className="mb-6">{p.icon}</div>
              <h3 className="text-xl font-bold mb-4">{p.title}</h3>
              <p className="text-[#5f6a79] leading-relaxed text-sm">{p.desc}</p>
            </div>
          ))}
        </div>

        <section className="bg-[#1f2c45] rounded-[48px] p-10 md:p-16 text-white overflow-hidden relative">
          <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-serif mb-6">{t('security_data_title')}</h2>
              <p className="text-[#a4b1c6] mb-8 leading-relaxed">
                {t('security_data_text')}
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-[#00cba9]" /> {t('security_data_list_1')}</li>
                <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-[#00cba9]" /> {t('security_data_list_2')}</li>
                <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-[#00cba9]" /> {t('security_data_list_3')}</li>
              </ul>
            </div>
            <div className="flex justify-center">
              <div className="relative h-64 w-64">
                <div className="absolute inset-0 bg-[#ff7665] rounded-full blur-[60px] opacity-20 animate-pulse"></div>
                <div className="relative z-10 h-full w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-[60px] flex items-center justify-center">
                   <ShieldAlert className="w-32 h-32 text-[#ff7665]" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
