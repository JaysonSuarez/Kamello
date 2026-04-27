import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";

const logoImageUrl = "/images/K-Editado.png";

export default function SearchJobs() {
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

      <main className="mx-auto max-w-[1200px] px-6 py-12">
        <h1 className="font-serif text-5xl mb-8">Buscar trabajos</h1>
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#efe7e2] mb-12">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5f6a79] w-5 h-5" />
              <input type="text" placeholder="Cargo, habilidad o empresa" className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[#f7f3f1] border-none focus:ring-2 focus:ring-[#ff7665] outline-none" />
            </div>
            <button className="bg-[#ff7665] text-white px-8 py-4 rounded-2xl font-bold hover:bg-[#ff5a45] transition-all shadow-lg shadow-[#ff7665]/20">
              Buscar
            </button>
          </div>
        </div>
        
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-[#efe7e2] hover:border-[#ff7665] transition-all cursor-pointer group">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold mb-1">Técnico {i === 1 ? 'Electromecánico' : i === 2 ? 'en Refrigeración' : 'de Mantenimiento'}</h3>
                  <p className="text-[#5f6a79] font-medium">Empresa Ejemplo S.A. • Bogotá, Colombia</p>
                </div>
                <span className="bg-[#f7f3f1] px-4 py-2 rounded-full text-sm font-bold text-[#1f2c45] group-hover:bg-[#ff7665] group-hover:text-white transition-colors">
                  $2.5M - $3.5M
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
