import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, MessageCircle, Phone, Mail, ChevronRight, HelpCircle } from "lucide-react";
import { useLanguage } from "./lib/i18n";
import LanguageSwitcher from "./components/LanguageSwitcher";

const logoImageUrl = "/images/K-Editado.png";

export default function HelpCenter() {
  const { t } = useLanguage();
  
  const faqs = [
    { q: t('faq_1_q'), a: t('faq_1_a') },
    { q: t('faq_2_q'), a: t('faq_2_a') },
    { q: t('faq_3_q'), a: t('faq_3_a') },
    { q: t('faq_4_q'), a: t('faq_4_a') }
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

      <main className="mx-auto max-w-[900px] px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="font-serif text-5xl md:text-6xl mb-6">
            {t('help_hero_1')}
            <span className="text-[#ff7665]">{t('help_hero_2')}</span>
          </h1>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#a4b1c6] w-5 h-5" />
            <input 
              type="text" 
              placeholder={t('help_search_placeholder')} 
              className="w-full pl-14 pr-6 py-5 rounded-2xl border-2 border-[#efe7e2] focus:border-[#ff7665] focus:outline-none shadow-sm transition-all text-lg"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="p-8 bg-white rounded-3xl border border-[#efe7e2] text-center hover:shadow-lg transition-all cursor-pointer group">
            <div className="w-12 h-12 bg-[#ff7665]/10 rounded-xl flex items-center justify-center mx-auto mb-4 text-[#ff7665] group-hover:scale-110 transition-transform">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold mb-2">{t('help_chat')}</h3>
            <p className="text-xs text-[#5f6a79]">{t('help_chat_subtitle')}</p>
          </div>
          <div className="p-8 bg-white rounded-3xl border border-[#efe7e2] text-center hover:shadow-lg transition-all cursor-pointer group">
            <div className="w-12 h-12 bg-[#00cba9]/10 rounded-xl flex items-center justify-center mx-auto mb-4 text-[#00cba9] group-hover:scale-110 transition-transform">
              <Phone className="w-6 h-6" />
            </div>
            <h3 className="font-bold mb-2">{t('help_call')}</h3>
            <p className="text-xs text-[#5f6a79]">{t('help_call_subtitle')}</p>
          </div>
          <div className="p-8 bg-white rounded-3xl border border-[#efe7e2] text-center hover:shadow-lg transition-all cursor-pointer group">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4 text-blue-500 group-hover:scale-110 transition-transform">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="font-bold mb-2">{t('help_email')}</h3>
            <p className="text-xs text-[#5f6a79]">{t('help_email_subtitle')}</p>
          </div>
        </div>

        <section>
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
            <HelpCircle className="w-6 h-6 text-[#ff7665]" />
            {t('help_faq_title')}
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details key={i} className="group bg-white rounded-2xl border border-[#efe7e2] overflow-hidden transition-all hover:border-[#ff7665]">
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none font-bold text-lg">
                  {faq.q}
                  <ChevronRight className="w-5 h-5 text-[#a4b1c6] group-open:rotate-90 transition-transform" />
                </summary>
                <div className="px-6 pb-6 text-[#5f6a79] leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </section>

        <div className="mt-20 p-10 bg-[#1f2c45] rounded-[40px] text-center text-white">
          <h2 className="text-2xl font-bold mb-4">{t('help_not_found')}</h2>
          <p className="text-[#a4b1c6] mb-8">{t('help_not_found_text')}</p>
          <button className="bg-[#ff7665] px-10 py-4 rounded-xl font-bold hover:bg-[#ff5a45] transition-all shadow-lg shadow-[#ff7665]/20">
            {t('help_contact_btn')}
          </button>
        </div>
      </main>
    </div>
  );
}
