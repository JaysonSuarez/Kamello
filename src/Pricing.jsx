import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, Zap, Star, ShieldCheck, CreditCard, Award } from "lucide-react";

const logoImageUrl = "/images/K-Editado.png";

export default function Pricing() {
  const packs = [
    { name: "Pack Básico", price: "15.000", ops: "5 OPS", description: "Ideal para arrancar y probar la plataforma.", icon: <Zap className="w-6 h-6 text-[#ff7665]" /> },
    { name: "Pack Profesional", price: "35.000", ops: "15 OPS", description: "Para Kamelladores recurrentes.", icon: <Star className="w-6 h-6 text-[#ffd700]" />, popular: true },
  ];

  const subscriptions = [
    { 
      name: "Plan PRO", 
      price: "49.000", 
      features: [
        "🚀 100 Oportunidades de Oro", 
        "📍 Radar Expandido (15km a la redonda)",
        "⚡ Primicia Total: Ves servicios antes que el resto", 
        "✨ Identidad de Élite (Nombre Dorado)",
        "🏆 Badge de Confianza 'PRO'"
      ], 
      icon: <Award className="w-8 h-8 text-[#ffd700]" />,
      color: "border-[#ffd700]"
    },
    { 
      name: "Plan ULTRA", 
      price: "89.000", 
      features: [
        "♾️ Conexiones Infinitas (Sin Límites)", 
        "📍 Cobertura Total en tu Ciudad", 
        "🔝 Posicionamiento VIP: Sé siempre el #1",
        "🔥 Mapa de Calor: Mira dónde hay más clientes",
        "💎 Perfil Diamante (Exclusividad Total)"
      ], 
      icon: <Zap className="w-8 h-8 text-[#ff7665]" />,
      color: "border-[#ff7665]",
      popular: true
    },
  ];

  return (
    <div className="min-h-screen bg-[#f7f3f1] font-sans text-[#1f2c45] pb-20">
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

      <main className="mx-auto max-w-[1100px] px-6 py-12">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-[#ff7665]/10 text-[#ff7665] text-sm font-bold tracking-wider uppercase mb-4">
            Precios Transparentes
          </span>
          <h1 className="font-serif text-5xl md:text-6xl mb-6">Elige cómo quieres <span className="text-[#ff7665]">Kamelliar</span></h1>
          <p className="text-[#5f6a79] text-xl max-w-2xl mx-auto">Sin comisiones sobre tu trabajo. Tú eliges si pagas por uso o te suscribes para beneficios ilimitados.</p>
        </div>

        {/* OPS PACKS */}
        <section className="mb-24">
          <div className="flex items-center gap-3 mb-10">
            <CreditCard className="w-6 h-6 text-[#1f2c45]" />
            <h2 className="text-2xl font-extrabold tracking-tight">Créditos OPS (Pago por uso)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {packs.map((pack, i) => (
              <div key={i} className={`flex flex-col p-8 rounded-[32px] bg-white border-2 ${pack.popular ? 'border-[#ff7665] shadow-xl' : 'border-[#efe7e2]'} transition-transform hover:scale-[1.01]`}>
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-[#f7f3f1] rounded-2xl">{pack.icon}</div>
                  {pack.popular && <span className="bg-[#ff7665] text-white px-4 py-1 rounded-full text-xs font-bold">RECOMENDADO</span>}
                </div>
                <h3 className="text-xl font-bold mb-1">{pack.name}</h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-black">${pack.price}</span>
                  <span className="text-sm font-bold text-[#5f6a79]">COP</span>
                </div>
                <div className="flex items-center gap-2 text-[#00cba9] font-bold mb-6">
                  <Zap className="w-4 h-4" /> {pack.ops} disponibles
                </div>
                <p className="text-[#5f6a79] text-sm mb-8 flex-1">{pack.description}</p>
                <button className="w-full py-4 rounded-xl font-bold bg-[#1f2c45] text-white hover:bg-[#2b3a4f] transition-all">
                  Comprar Pack
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* SUBSCRIPTIONS */}
        <section>
          <div className="flex items-center gap-3 mb-10">
            <ShieldCheck className="w-6 h-6 text-[#ffd700]" />
            <h2 className="text-2xl font-extrabold tracking-tight">Planes de Suscripción</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {subscriptions.map((plan, i) => (
              <div key={i} className={`flex flex-col p-10 rounded-[44px] bg-white border-4 ${plan.color} relative transition-all hover:shadow-2xl`}>
                {plan.popular && <span className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#ff7665] text-white px-8 py-2 rounded-full text-sm font-bold shadow-lg">EL MÁS POTENTE</span>}
                
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-4 bg-[#f7f3f1] rounded-3xl">{plan.icon}</div>
                  <div>
                    <h3 className="text-2xl font-black">{plan.name}</h3>
                    <p className="text-[#5f6a79] text-sm">Cobro mensual</p>
                  </div>
                </div>

                <div className="flex items-baseline gap-2 mb-10">
                  <span className="text-6xl font-black text-[#1f2c45]">${plan.price}</span>
                  <span className="text-[#5f6a79] font-bold">COP / mes</span>
                </div>

                <div className="flex-1">
                  <p className="font-bold text-sm text-[#a4b1c6] uppercase tracking-widest mb-6">Beneficios incluidos:</p>
                  <ul className="space-y-5 mb-12">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-4 text-[#1f2c45] font-semibold">
                        <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#00cba9] text-white">
                          <Check className="w-3 h-3" />
                        </div>
                        <span className="leading-tight">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button className={`w-full py-5 rounded-2xl font-black text-lg transition-all ${plan.popular ? 'bg-[#ff7665] text-white shadow-xl hover:bg-[#ff5a45]' : 'bg-[#1f2c45] text-white hover:bg-[#2b3a4f]'}`}>
                  Activar {plan.name}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-24 p-12 rounded-[48px] bg-[#1f2c45] text-center text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
             <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-[100px]"></div>
          </div>
          <h2 className="text-3xl font-serif mb-6 relative z-10">¿Por qué este modelo?</h2>
          <p className="text-[#a4b1c6] max-w-2xl mx-auto leading-relaxed relative z-10 text-lg">
            Queremos que Kamello sea sostenible sin ser abusivo. 
            <span className="text-white font-bold"> No tocamos tus ganancias.</span> 
            Al pagar por OPS o suscripción, ayudas a mantener la tecnología activa mientras tú te llevas todo lo que trabajas.
          </p>
        </section>
      </main>
    </div>
  );
}
