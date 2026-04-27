import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";

const logoImageUrl = "/images/K-Editado.png";

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#f7f3f1] font-sans text-[#1f2c45]">
      {/* Header Simplificado */}
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
          <p className="text-[#5f6a79] text-lg italic">Última actualización: 24 de abril de 2026</p>
        </div>

        <div className="prose prose-slate prose-lg max-w-none space-y-10 text-[#1f2c45]/90">
          <section>
            <h2 className="font-serif text-2xl font-bold mb-4 border-b border-[#efe7e2] pb-2">1. Aceptación de los Términos</h2>
            <p className="leading-relaxed">
              Al acceder y utilizar Kamello, usted acepta cumplir y estar sujeto a estos Términos de Servicio. Si no está de acuerdo con alguna parte de estos términos, no podrá utilizar nuestra plataforma ni nuestros servicios.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4 border-b border-[#efe7e2] pb-2">2. Descripción del Servicio</h2>
            <p className="leading-relaxed">
              Kamello es un marketplace que conecta a técnicos independientes ("Kamelladores") con clientes que requieren servicios especializados. Kamello no es empleador de los técnicos ni es responsable de la ejecución directa de los trabajos.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4 border-b border-[#efe7e2] pb-2">3. Registro de Cuenta</h2>
            <p className="leading-relaxed font-bold">
              Para utilizar ciertas funciones de la plataforma, debe registrarse y crear una cuenta. Usted es responsable de:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Mantener la confidencialidad de su contraseña.</li>
              <li>Proporcionar información veraz y actualizada.</li>
              <li>Todas las actividades que ocurran bajo su cuenta.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4 border-b border-[#efe7e2] pb-2">4. Conducta del Usuario</h2>
            <p className="leading-relaxed">
              Queda prohibido el uso de la plataforma para fines ilegales, fraudulentos o que atenten contra la integridad de otros usuarios. Kamello se reserva el derecho de suspender cuentas que violen estas normas.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4 border-b border-[#efe7e2] pb-2">5. Pagos y Comisiones</h2>
            <p className="leading-relaxed">
              Kamello puede cobrar una comisión por servicio en cada transacción exitosa. Los términos de pago específicos se detallarán antes de confirmar cualquier contratación.
            </p>
          </section>
        </div>

        <footer className="mt-20 pt-10 border-t border-[#efe7e2] text-center">
          <p className="text-[#5f6a79]">¿Tienes dudas sobre nuestros términos? <a href="mailto:soporte@kamello.com" className="text-[#ff7665] font-bold">Contáctanos</a></p>
        </footer>
      </main>
    </div>
  );
}
