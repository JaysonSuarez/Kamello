import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Lock, MapPin, ShieldCheck, UserCheck } from "lucide-react";

const logoImageUrl = "/images/K-Editado.png";

export default function Privacy() {
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
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="font-serif text-5xl mb-4 leading-tight">Política de Privacidad</h1>
          <p className="text-[#5f6a79] text-lg italic">Última actualización: 27 de abril de 2026</p>
        </div>

        <div className="prose prose-slate prose-lg max-w-none space-y-10 text-[#1f2c45]/90">
          <section>
            <h2 className="font-serif text-2xl font-bold mb-4 border-b border-[#efe7e2] pb-2">1. Información que Recolectamos</h2>
            <p className="leading-relaxed">
              En Kamello, la privacidad y seguridad de tus datos son fundamentales. Recolectamos información necesaria para operar el marketplace de servicios técnicos:
            </p>
            <div className="mt-6 grid gap-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1"><UserCheck className="w-6 h-6 text-[#ff7665]" /></div>
                <div>
                  <h4 className="font-bold">Datos de Identidad (KYC)</h4>
                  <p className="text-sm text-[#5f6a79]">Para Kamelladores, recolectamos copias de documentos de identidad y antecedentes para verificar la seguridad del profesional ante la comunidad.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1"><MapPin className="w-6 h-6 text-[#ff7665]" /></div>
                <div>
                  <h4 className="font-bold">Ubicación en Tiempo Real</h4>
                  <p className="text-sm text-[#5f6a79]">Recolectamos coordenadas GPS tanto de clientes como de técnicos para facilitar el emparejamiento por cercanía geográfica (máximo 15km).</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4 border-b border-[#efe7e2] pb-2">2. Uso de la Información</h2>
            <p className="leading-relaxed">
              Utilizamos tus datos exclusivamente para:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-sm text-[#5f6a79]">
              <li>Validar la veracidad de los perfiles técnicos.</li>
              <li>Calcular distancias y tiempos de llegada entre el Kamellador y el Cliente.</li>
              <li>Gestionar el sistema de seguridad por Código PIN.</li>
              <li>Habilitar el canal de chat interno para la coordinación del servicio.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4 border-b border-[#efe7e2] pb-2">3. Intercambio de Información entre Partes</h2>
            <p className="leading-relaxed text-sm text-[#5f6a79]">
              Tu número de teléfono y nombre completo solo se comparten con la contraparte una vez que una oferta ha sido aceptada. La ubicación exacta del servicio solo es visible para el Kamellador asignado durante el transcurso de la orden activa.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4 border-b border-[#efe7e2] pb-2">4. Seguridad de los Datos</h2>
            <p className="leading-relaxed text-sm text-[#5f6a79]">
              Utilizamos encriptación de grado industrial para proteger tus documentos e información de ubicación. No vendemos ni compartimos tu información con anunciantes externos.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4 border-b border-[#efe7e2] pb-2">5. Derechos (Habeas Data)</h2>
            <p className="leading-relaxed text-sm text-[#5f6a79]">
              Bajo la ley colombiana, tienes derecho a conocer, actualizar y rectificar tus datos personales. Puedes solicitar la eliminación de tu cuenta y datos asociados en cualquier momento desde la configuración de tu perfil.
            </p>
          </section>
        </div>

        <footer className="mt-20 pt-10 border-t border-[#efe7e2] text-center">
          <p className="text-[#5f6a79]">¿Deseas ejercer tus derechos de privacidad? <a href="mailto:privacidad@kamello.com" className="text-[#ff7665] font-bold">privacidad@kamello.com</a></p>
        </footer>
      </main>
    </div>
  );
}
