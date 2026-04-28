import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, MessageCircle, Phone, Mail, ChevronRight, HelpCircle } from "lucide-react";

const logoImageUrl = "/images/K-Editado.png";

export default function HelpCenter() {
  const faqs = [
    {
      q: "¿Cómo pido un servicio?",
      a: "Es muy fácil: regístrate como cliente, elige la categoría (ej: Electricista), describe tu problema y pon un presupuesto. Los técnicos cercanos recibirán tu alerta y te enviarán ofertas."
    },
    {
      q: "¿Cómo se le paga al Kamellador?",
      a: "El pago se acuerda directamente con el profesional. Kamello no cobra comisión por el servicio, por lo que tú le pagas el 100% de lo pactado al técnico por el medio que ambos prefieran (Efectivo, Nequi, etc.)."
    },
    {
      q: "¿Qué hago si el técnico no llega?",
      a: "Si el técnico no llega, puedes cancelar la solicitud desde tu dashboard. Recuerda que el trabajo solo se marca como 'Iniciado' cuando tú le entregas el código PIN de seguridad."
    },
    {
      q: "¿Cómo puedo ser Kamellador?",
      a: "Regístrate en la plataforma eligiendo el rol 'Kamellador'. Deberás subir tu documento de identidad y esperar a que nuestro equipo administrativo verifique tu perfil para empezar a recibir trabajos."
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
          <Link to="/" className="flex items-center gap-2 text-sm font-bold text-[#5f6a79] hover:text-[#ff7665] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[900px] px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="font-serif text-5xl md:text-6xl mb-6">¿Cómo podemos <span className="text-[#ff7665]">ayudarte?</span></h1>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#a4b1c6] w-5 h-5" />
            <input 
              type="text" 
              placeholder="Busca una pregunta o tema..." 
              className="w-full pl-14 pr-6 py-5 rounded-2xl border-2 border-[#efe7e2] focus:border-[#ff7665] focus:outline-none shadow-sm transition-all text-lg"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="p-8 bg-white rounded-3xl border border-[#efe7e2] text-center hover:shadow-lg transition-all cursor-pointer group">
            <div className="w-12 h-12 bg-[#ff7665]/10 rounded-xl flex items-center justify-center mx-auto mb-4 text-[#ff7665] group-hover:scale-110 transition-transform">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold mb-2">Chat en vivo</h3>
            <p className="text-xs text-[#5f6a79]">Respuesta inmediata</p>
          </div>
          <div className="p-8 bg-white rounded-3xl border border-[#efe7e2] text-center hover:shadow-lg transition-all cursor-pointer group">
            <div className="w-12 h-12 bg-[#00cba9]/10 rounded-xl flex items-center justify-center mx-auto mb-4 text-[#00cba9] group-hover:scale-110 transition-transform">
              <Phone className="w-6 h-6" />
            </div>
            <h3 className="font-bold mb-2">Llamada</h3>
            <p className="text-xs text-[#5f6a79]">Lunes a Viernes</p>
          </div>
          <div className="p-8 bg-white rounded-3xl border border-[#efe7e2] text-center hover:shadow-lg transition-all cursor-pointer group">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4 text-blue-500 group-hover:scale-110 transition-transform">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="font-bold mb-2">Email</h3>
            <p className="text-xs text-[#5f6a79]">Soporte 24/7</p>
          </div>
        </div>

        <section>
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
            <HelpCircle className="w-6 h-6 text-[#ff7665]" />
            Preguntas Frecuentes
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
          <h2 className="text-2xl font-bold mb-4">¿No encuentras lo que buscas?</h2>
          <p className="text-[#a4b1c6] mb-8">Nuestro equipo de soporte está listo para darte una mano con cualquier duda.</p>
          <button className="bg-[#ff7665] px-10 py-4 rounded-xl font-bold hover:bg-[#ff5a45] transition-all shadow-lg shadow-[#ff7665]/20">
            Contactar Soporte
          </button>
        </div>
      </main>
    </div>
  );
}
