import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Rocket, Users, BadgePercent } from "lucide-react";

const logoImageUrl = "/images/K-Editado.png";

export default function Pricing() {
  const plans = [
    { name: "Gratis", price: "0", features: ["1 oferta activa", "Búsqueda básica", "Soporte email"] },
    { name: "Pro", price: "49", features: ["10 ofertas activas", "Filtros avanzados", "Soporte prioritario", "Análisis de candidatos"], popular: true },
    { name: "Enterprise", price: "199", features: ["Ofertas ilimitadas", "Acceso vía API", "Account Manager", "Contratos personalizados"] },
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

      <main className="mx-auto max-w-[1200px] px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="font-serif text-6xl mb-6">Planes y precios</h1>
          <p className="text-[#5f6a79] text-xl">Encuentra el talento técnico que tu empresa necesita hoy.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, i) => (
            <div key={i} className={`p-10 rounded-[40px] bg-white border ${plan.popular ? 'border-[#ff7665] ring-4 ring-[#ff7665]/5 shadow-2xl scale-105' : 'border-[#efe7e2]'} relative flex flex-col`}>
              {plan.popular && <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#ff7665] text-white px-6 py-1 rounded-full text-sm font-bold">MÁS POPULAR</span>}
              <h3 className="text-2xl font-bold mb-4">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-5xl font-bold">${plan.price}</span>
                <span className="text-[#5f6a79]">/mes</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-3 text-[#5f6a79]">
                    <Rocket className="w-5 h-5 text-[#ff7665]" />
                    {f}
                  </li>
                ))}
              </ul>
              <button className={`w-full py-4 rounded-2xl font-bold transition-all ${plan.popular ? 'bg-[#ff7665] text-white shadow-lg shadow-[#ff7665]/20 hover:bg-[#ff5a45]' : 'bg-[#f7f3f1] text-[#1f2c45] hover:bg-[#efe7e2]'}`}>
                Seleccionar plan
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
