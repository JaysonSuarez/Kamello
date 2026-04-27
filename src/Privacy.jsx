import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Lock } from "lucide-react";

const logoImageUrl = "/images/K-Editado.png";

export default function Privacy() {
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
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="font-serif text-5xl mb-4 leading-tight">Política de Privacidad</h1>
          <p className="text-[#5f6a79] text-lg italic">Última actualización: 24 de abril de 2026</p>
        </div>

        <div className="prose prose-slate prose-lg max-w-none space-y-10 text-[#1f2c45]/90">
          <section>
            <h2 className="font-serif text-2xl font-bold mb-4 border-b border-[#efe7e2] pb-2">1. Información que Recolectamos</h2>
            <p className="leading-relaxed">
              Recopilamos información que usted nos proporciona directamente cuando se registra, crea un perfil o se comunica con nosotros. Esto incluye su nombre, dirección de correo electrónico, número de teléfono y cualquier otra información que decida compartir.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4 border-b border-[#efe7e2] pb-2">2. Uso de la Información</h2>
            <p className="leading-relaxed">
              Utilizamos la información recopilada para:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Proporcionar y mantener nuestra plataforma.</li>
              <li>Conectar clientes con técnicos de manera eficiente.</li>
              <li>Enviar actualizaciones de servicio y notificaciones de seguridad.</li>
              <li>Mejorar nuestra experiencia de usuario a través de análisis internos.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4 border-b border-[#efe7e2] pb-2">3. Intercambio de Información</h2>
            <p className="leading-relaxed font-bold">
              No vendemos sus datos personales a terceros. Compartimos su información solo en las siguientes circunstancias:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Con técnicos o clientes para facilitar la prestación del servicio solicitado.</li>
              <li>Para cumplir con obligaciones legales o procesos judiciales.</li>
              <li>Con proveedores de servicios que nos ayudan en nuestras operaciones (ej. procesamiento de pagos).</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4 border-b border-[#efe7e2] pb-2">4. Seguridad de los Datos</h2>
            <p className="leading-relaxed">
              Implementamos medidas de seguridad técnicas y organizativas para proteger sus datos personales contra el acceso no autorizado, la alteración o la destrucción. Sin embargo, ningún método de transmisión por internet es 100% seguro.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4 border-b border-[#efe7e2] pb-2">5. Sus Derechos</h2>
            <p className="leading-relaxed">
              Usted tiene derecho a acceder, rectificar o eliminar sus datos personales en cualquier momento a través de la configuración de su cuenta o contactando a nuestro equipo de soporte.
            </p>
          </section>
        </div>

        <footer className="mt-20 pt-10 border-t border-[#efe7e2] text-center">
          <p className="text-[#5f6a79]">¿Deseas ejercer tus derechos de privacidad? <a href="mailto:privacidad@kamello.com" className="text-[#ff7665] font-bold">Escríbenos</a></p>
        </footer>
      </main>
    </div>
  );
}
