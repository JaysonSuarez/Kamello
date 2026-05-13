import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Lock, MapPin, UserCheck } from "lucide-react";
import { useLanguage } from "./lib/i18n";
import LanguageSwitcher from "./components/LanguageSwitcher";

const logoImageUrl = "/images/K-Editado.png";

export default function Privacy() {
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
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="font-serif text-5xl mb-4 leading-tight">{t('privacy_title')}</h1>
          <p className="text-[#5f6a79] text-lg italic">{t('common_last_update')}: 27 de abril de 2026</p>
        </div>

        <div className="prose prose-slate prose-lg max-w-none space-y-10 text-[#1f2c45]/90">
          <section>
            <h2 className="font-serif text-2xl font-bold mb-4 border-b border-[#efe7e2] pb-2">{t('privacy_section_1_title')}</h2>
            <p className="leading-relaxed">
              {t('privacy_section_1_text')}
            </p>
            <div className="mt-6 grid gap-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1"><UserCheck className="w-6 h-6 text-[#ff7665]" /></div>
                <div>
                  <h4 className="font-bold">{t('privacy_section_1_kyc_title')}</h4>
                  <p className="text-sm text-[#5f6a79]">{t('privacy_section_1_kyc_text')}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1"><MapPin className="w-6 h-6 text-[#ff7665]" /></div>
                <div>
                  <h4 className="font-bold">{t('privacy_section_1_loc_title')}</h4>
                  <p className="text-sm text-[#5f6a79]">{t('privacy_section_1_loc_text')}</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4 border-b border-[#efe7e2] pb-2">{t('privacy_section_2_title')}</h2>
            <p className="leading-relaxed">
              {t('privacy_section_2_text')}
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-sm text-[#5f6a79]">
              <li>{t('privacy_section_2_list_1')}</li>
              <li>{t('privacy_section_2_list_2')}</li>
              <li>{t('privacy_section_2_list_3')}</li>
              <li>{t('privacy_section_2_list_4')}</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4 border-b border-[#efe7e2] pb-2">{t('privacy_section_3_title')}</h2>
            <p className="leading-relaxed text-sm text-[#5f6a79]">
              {t('privacy_section_3_text')}
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4 border-b border-[#efe7e2] pb-2">{t('privacy_section_4_title')}</h2>
            <p className="leading-relaxed text-sm text-[#5f6a79]">
              {t('privacy_section_4_text')}
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4 border-b border-[#efe7e2] pb-2">{t('privacy_section_5_title')}</h2>
            <p className="leading-relaxed text-sm text-[#5f6a79]">
              {t('privacy_section_5_text')}
            </p>
          </section>
        </div>

        <footer className="mt-20 pt-10 border-t border-[#efe7e2] text-center">
          <p className="text-[#5f6a79]">{t('privacy_footer')} <a href="mailto:privacidad@kamello.com" className="text-[#ff7665] font-bold">privacidad@kamello.com</a></p>
        </footer>
      </main>
    </div>
  );
}
