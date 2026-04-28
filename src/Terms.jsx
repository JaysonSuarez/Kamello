import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, CheckCircle, AlertCircle } from "lucide-react";

const logoImageUrl = "/images/K-Editado.png";

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#f7f3f1] font-sans text-[#1f2c45]">
      <header className="sticky top-0 z-50 w-full border-b border-[#efe7e2] bg-[#f7f3f1]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1000px] items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3 group">
            <img src={logoImageUrl} alt="Logo" className="h-8 w-auto transition-transform group-hover:scale-110" />
            <span className="text-2xl font-bold tracking-tight">Kamello</span>
          </Link>
          <Link to="/" className="flex items-center gap-2 text-sm font-bold text-[#5f6a79] hover:text-[#ff7665] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[800px] px-6 py-16">
        <div className="mb-12">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-[#ff7665]/10 text-[#ff7665] mb-6">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="font-serif text-5xl mb-4 leading-tight">Términos de Servicio</h1>
          <p className="text-[#5f6a79] text-lg italic">Última actualización: 27 de abril de 2026</p>
        </div>

        <div className="prose prose-slate prose-lg max-w-none space-y-10 text-[#1f2c45]/90">
          <section>
            <h2 className="font-serif text-2xl font-bold mb-4 border-b border-[#efe7e2] pb-2">1. Naturaleza de la Plataforma</h2>
            <p className="leading-relaxed">
              Kamello es una plataforma tecnológica que actúa como un <strong>directorio activo y marketplace</strong> para conectar técnicos independientes ("Kamelladores") con usuarios que requieren servicios técnicos ("Clientes"). Kamello no es una empresa de servicios técnicos, ni actúa como empleador o contratista de los Kamelladores.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4 border-b border-[#efe7e2] pb-2">2. Modelo de 0% Comisión</h2>
            <div className="bg-[#00cba9]/5 border-l-4 border-[#00cba9] p-6 rounded-r-2xl mb-4">
              <p className="leading-relaxed font-bold text-[#00cba9]">
                Kamello NO cobra comisiones sobre el valor de los servicios prestados.
              </p>
              <p className="text-sm mt-2">
                El 100% del pago acordado entre el Cliente y el Kamellador pertenece íntegramente al Kamellador. El pago se realiza de forma directa entre las partes por el medio que estas acuerden (efectivo, transferencia, etc.).
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4 border-b border-[#efe7e2] pb-2">3. Monetización: OPS y Planes</h2>
            <p className="leading-relaxed">
              Kamello se financia a través de la venta de créditos de conexión denominados <strong>OPS</strong> y planes de suscripción (PRO y ULTRA). 
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-sm">
              <li><strong>OPS:</strong> Créditos necesarios para que un Kamellador pueda enviar una oferta o aceptar una solicitud de servicio.</li>
              <li><strong>Planes:</strong> Membresías mensuales que otorgan beneficios como OPS ilimitadas, mayor alcance geográfico y visibilidad prioritaria.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4 border-b border-[#efe7e2] pb-2">4. Seguridad y Verificación (KYC)</h2>
            <p className="leading-relaxed">
              Para garantizar la seguridad de la comunidad, todo Kamellador debe someterse a un proceso de verificación de identidad (KYC). Kamello se reserva el derecho de rechazar o suspender perfiles que no cumplan con los estándares de seguridad o que proporcionen información falsa.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4 border-b border-[#efe7e2] pb-2">5. Protocolo de Inicio de Trabajo (PIN)</h2>
            <p className="leading-relaxed">
              El Cliente reconoce que es su responsabilidad entregar el <strong>Código PIN</strong> de 4 dígitos al Kamellador únicamente cuando este se encuentre físicamente en el lugar del servicio y esté listo para iniciar el trabajo. La entrega del PIN marca el inicio oficial del servicio en la plataforma.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4 border-b border-[#efe7e2] pb-2">6. Limitación de Responsabilidad</h2>
            <div className="bg-[#ff7665]/5 border-l-4 border-[#ff7665] p-6 rounded-r-2xl">
              <div className="flex items-center gap-2 mb-2 text-[#ff7665]">
                <AlertCircle className="w-5 h-5" />
                <span className="font-bold">Aviso Importante</span>
              </div>
              <p className="text-sm leading-relaxed text-[#5f6a79]">
                Kamello no se hace responsable por daños, perjuicios, incumplimientos o la calidad del trabajo realizado por los Kamelladores. Cualquier reclamo relacionado con el servicio técnico prestado debe dirigirse directamente al profesional contratado.
              </p>
            </div>
          </section>
        </div>

        <footer className="mt-20 pt-10 border-t border-[#efe7e2] text-center">
          <p className="text-[#5f6a79]">¿Dudas sobre estos términos? <a href="mailto:soporte@kamello.com" className="text-[#ff7665] font-bold">legal@kamello.com</a></p>
        </footer>
      </main>
    </div>
  );
}
