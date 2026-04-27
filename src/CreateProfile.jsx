import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, User, Sparkles } from "lucide-react";

const logoImageUrl = "/images/K-Editado.png";

export default function CreateProfile() {
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

      <main className="mx-auto max-w-[800px] px-6 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-[#ff7665]/10 text-[#ff7665] mb-6">
            <User className="w-8 h-8" />
          </div>
          <h1 className="font-serif text-5xl mb-4">Crea tu perfil profesional</h1>
          <p className="text-[#5f6a79] text-xl">Muestra tu talento y conecta con las mejores empresas.</p>
        </div>

        <div className="bg-white rounded-[40px] p-10 shadow-xl shadow-[#1f2c45]/5 border border-[#efe7e2]">
          <div className="space-y-8">
            <div className="p-6 bg-[#f7f3f1] rounded-3xl border-2 border-dashed border-[#efe7e2] text-center">
              <div className="h-20 w-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center text-[#ff7665]">
                <Sparkles className="w-8 h-8" />
              </div>
              <p className="font-bold">Sube tu foto de perfil</p>
              <p className="text-sm text-[#5f6a79]">JPG o PNG, máx 5MB</p>
            </div>

            <div className="grid gap-6">
              <div>
                <label className="block text-sm font-bold mb-2">Especialidad principal</label>
                <select className="w-full px-6 py-4 rounded-2xl bg-[#f7f3f1] border-none focus:ring-2 focus:ring-[#ff7665] outline-none font-medium">
                  <option>Electricidad</option>
                  <option>Plomería</option>
                  <option>Mecánica</option>
                  <option>Refrigeración</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Biografía profesional</label>
                <textarea rows="4" placeholder="Cuéntanos sobre tu experiencia..." className="w-full px-6 py-4 rounded-2xl bg-[#f7f3f1] border-none focus:ring-2 focus:ring-[#ff7665] outline-none font-medium resize-none"></textarea>
              </div>
            </div>

            <Link to="/register" className="block w-full bg-[#ff7665] text-white py-5 rounded-2xl font-bold text-lg text-center hover:bg-[#ff5a45] transition-all shadow-lg shadow-[#ff7665]/20">
              Continuar al Registro
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
