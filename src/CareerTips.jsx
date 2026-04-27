import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, ChevronRight } from "lucide-react";

const logoImageUrl = "/images/K-Editado.png";

export default function CareerTips() {
  const tips = [
    { title: "Cómo optimizar tu CV técnico", category: "Currículum", time: "5 min lectura" },
    { title: "5 herramientas esenciales para electricistas", category: "Herramientas", time: "8 min lectura" },
    { title: "Domina la entrevista de trabajo", category: "Entrevistas", time: "10 min lectura" },
  ];

  return (
    <div className="min-h-screen bg-[#f7f3f1] font-sans text-[#1f2c45]">
      <header className="sticky top-0 z-50 w-full border-b border-[#efe7e2] bg-[#f7f3f1]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3 group">
            <img src={logoImageUrl} alt="Logo" className="h-8 w-auto transition-transform group-hover:scale-110" />
            <span className="text-2xl font-bold tracking-tight">Kamello</span>
          </Link>
          <Link to="/" className="flex items-center gap-2 text-sm font-bold text-[#5f6a79] hover:text-[#ff7665] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1000px] px-6 py-12">
        <div className="mb-16">
          <h1 className="font-serif text-6xl mb-6">Consejos profesionales</h1>
          <p className="text-[#5f6a79] text-xl max-w-2xl">Aprende nuevas habilidades y lleva tu carrera al siguiente nivel con nuestras guías expertas.</p>
        </div>

        <div className="grid gap-8">
          {tips.map((tip, i) => (
            <div key={i} className="bg-white p-8 rounded-[32px] border border-[#efe7e2] hover:shadow-xl hover:shadow-[#1f2c45]/5 transition-all group cursor-pointer flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="h-16 w-16 bg-[#ff7665]/10 rounded-2xl flex items-center justify-center text-[#ff7665]">
                  <BookOpen className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#ff7665]">{tip.category}</span>
                  <h3 className="text-2xl font-bold mt-1">{tip.title}</h3>
                  <p className="text-[#5f6a79] text-sm mt-1">{tip.time}</p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-[#efe7e2] group-hover:text-[#ff7665] transition-colors" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
