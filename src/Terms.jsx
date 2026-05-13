import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, AlertCircle } from "lucide-react";
import { useLanguage } from "./lib/i18n";
import LanguageSwitcher from "./components/LanguageSwitcher";

const logoImageUrl = "/images/K-Editado.png";

export default function Terms() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-[#f7f3f1] font-sans text-[#1f2c45]">
      <header className="sticky top-0 z-50 w-full border-b border-[#efe7e2] bg-[#f7f3f1]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1000px] items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3 group">
            <img src={logoImageUrl} alt="Logo" className="h-8 w-auto transition-transform group-hover:scale-110" />
            <span className="text-2xl font-bold tracking-tight">Kamello</span>
          </Link>
          <div className="flex items-center gap-6">
            <LanguageSwitcher />
            <Link to="/" className="flex items-center gap-2 text-sm font-bold text-[#5f6a79] hover:text-[#ff7665] transition-colors">
              <ArrowLeft className="w-4 h-4" />
              {t('common_back_home')}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[800px] px-6 py-16">
        <div className="mb-12">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-[#ff7665]/10 text-[#ff7665] mb-6">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="font-serif text-5xl mb-4 leading-tight">{t('terms_title')}</h1>
          <p className="text-[#5f6a79] text-lg italic">{t('common_last_update')}: 27 de abril de 2026</p>
        </div>

        <div className="prose prose-slate prose-lg max-w-none space-y-10 text-[#1f2c45]/90">
          <section>
            <h2 className="font-serif text-2xl font-bold mb-4 border-b border-[#efe7e2] pb-2">{t('terms_section_1_title')}</h2>
            <p className="leading-relaxed">
              {t('terms_section_1_text')}
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4 border-b border-[#efe7e2] pb-2">{t('terms_section_2_title')}</h2>
            <div className="bg-[#00cba9]/5 border-l-4 border-[#00cba9] p-6 rounded-r-2xl mb-4">
              <p className="leading-relaxed font-bold text-[#00cba9]">
                {t('terms_section_2_text_bold')}
              </p>
              <p className="text-sm mt-2">
                {t('terms_section_2_text')}
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4 border-b border-[#efe7e2] pb-2">{t('terms_section_3_title')}</h2>
            <p className="leading-relaxed">
              {t('terms_section_3_text')} 
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-sm">
              <li><strong>OPS:</strong> {t('terms_section_3_ops')}</li>
              <li><strong>{t('nav_pricing').split('&')[0]}:</strong> {t('terms_section_3_plans')}</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4 border-b border-[#efe7e2] pb-2">{t('terms_section_4_title')}</h2>
            <p className="leading-relaxed">
              {t('terms_section_4_text')}
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4 border-b border-[#efe7e2] pb-2">{t('terms_section_5_title')}</h2>
            <p className="leading-relaxed">
              {t('terms_section_5_text')}
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4 border-b border-[#efe7e2] pb-2">{t('terms_section_6_title')}</h2>
            <div className="bg-[#ff7665]/5 border-l-4 border-[#ff7665] p-6 rounded-r-2xl">
              <div className="flex items-center gap-2 mb-2 text-[#ff7665]">
                <AlertCircle className="w-5 h-5" />
                <span className="font-bold">{t('terms_section_6_important')}</span>
              </div>
              <p className="text-sm leading-relaxed text-[#5f6a79]">
                {t('terms_section_6_text')}
              </p>
            </div>
          </section>
        </div>

        <footer className="mt-20 pt-10 border-t border-[#efe7e2] text-center">
          <p className="text-[#5f6a79]">{t('terms_footer')} <a href="mailto:legal@kamello.com" className="text-[#ff7665] font-bold">legal@kamello.com</a></p>
        </footer>
      </main>
    </div>
  );
}
