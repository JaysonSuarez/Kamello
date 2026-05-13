import React from "react";
import { useLanguage } from "../lib/i18n";
import { Globe } from "lucide-react";

export default function LanguageSwitcher({ className = "" }) {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className={`flex items-center gap-2 rounded-full border border-[#efe7e2] bg-white/50 px-3 py-1.5 text-sm font-semibold text-[#1f2c45] transition-all hover:bg-white hover:shadow-md ${className}`}
      title={language === "es" ? "Cambiar a Inglés" : "Switch to Spanish"}
    >
      <Globe className="h-4 w-4 text-[#ff7665]" />
      <span className="uppercase">{language}</span>
    </button>
  );
}
