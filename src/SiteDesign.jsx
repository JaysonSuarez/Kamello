import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, FileText, Handshake, ChevronRight, LogIn, UserPlus, Share2, Send, Camera, CheckCircle2, X, Zap, MapPin, DollarSign, Clock } from "lucide-react";

const landingImageUrl = "/images/Kamello image.png";
const logoImageUrl = "/images/K-Editado.png";
const otherPagesImageUrl = "/images/otherpages.png";

const SAMPLE_OFFERS = [
  { id: 1, title: "Reparación Tablero Eléctrico", category: "Electricidad", price: "$120.000 COP", distance: "2.5 km" },
  { id: 2, title: "Pintura Fachada Local", category: "Pintura", price: "$450.000 COP", distance: "4.1 km" },
  { id: 3, title: "Arreglo Grifería Cocina", category: "Fontanería", price: "$85.000 COP", distance: "0.8 km" },
  { id: 4, title: "Levantamiento de Muro", category: "Albañilería", price: "$280.000 COP", distance: "5.2 km" },
  { id: 5, title: "Instalación de Lámparas", category: "Electricidad", price: "$65.000 COP", distance: "1.2 km" }
];

export default function SiteDesign() {
  const [showOffers, setShowOffers] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    // Solicitar permiso de ubicación proactivamente para precargar en el Dashboard
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          console.log("📍 Ubicación precargada con éxito");
          // Guardar en session para que el Dashboard lo tome rápido
          sessionStorage.setItem("last_lat", pos.coords.latitude);
          sessionStorage.setItem("last_lng", pos.coords.longitude);
        },
        (err) => console.warn("Permiso de ubicación denegado o error:", err.message),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#f7f3f1] text-[#1f2c45] font-sans selection:bg-[#ff7665] selection:text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 w-full border-b border-[#efe7e2] bg-[#f7f3f1]/90 backdrop-blur-md transition-all">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-6 py-4 md:px-10 lg:px-16 lg:py-5">
          <div className="flex items-center gap-3 cursor-pointer group">
            <img 
              src={logoImageUrl} 
              alt="Kamello Logo" 
              className="h-8 w-auto object-contain transition-transform group-hover:scale-110" 
            />
            <span className="font-sans text-2xl font-bold leading-none tracking-[-0.03em] text-[#1f2c45] md:text-3xl">
              Kamello
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 font-medium">
            <a href="#beneficios" className="text-[#4e5969] hover:text-[#ff7665] transition-colors">Beneficios</a>
            <a href="#testimonios" className="text-[#4e5969] hover:text-[#ff7665] transition-colors">Testimonios</a>
            <a href="#empresas" className="text-[#4e5969] hover:text-[#ff7665] transition-colors">Para Empresas</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/login" className="font-semibold text-[#1f2c45] hover:text-[#ff7665] transition-colors">
              Iniciar Sesión
            </Link>
            <Link to="/register" className="rounded-full bg-[#1f2c45] px-6 py-2.5 font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-[#2b3a4f] shadow-lg hover:shadow-xl">
              Regístrate
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            aria-label="Abrir menú"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-full text-[#1f2c45] hover:bg-[#efe7e2] transition-colors md:hidden"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <>
                <span className="h-[2px] w-6 rounded-full bg-current transition-all" />
                <span className="h-[2px] w-6 rounded-full bg-current transition-all" />
              </>
            )}
          </button>
        </div>

        {/* Mobile Nav Overlay */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-[72px] left-0 right-0 bg-[#f7f3f1] border-b border-[#efe7e2] shadow-xl p-6 flex flex-col gap-6 animate-in slide-in-from-top-4">
            <nav className="flex flex-col gap-4 font-medium">
              <a href="#beneficios" onClick={() => setIsMenuOpen(false)} className="text-[#4e5969] hover:text-[#ff7665] text-lg">Beneficios</a>
              <a href="#testimonios" onClick={() => setIsMenuOpen(false)} className="text-[#4e5969] hover:text-[#ff7665] text-lg">Testimonios</a>
              <a href="#empresas" onClick={() => setIsMenuOpen(false)} className="text-[#4e5969] hover:text-[#ff7665] text-lg">Para Empresas</a>
            </nav>
            <div className="flex flex-col gap-4 pt-4 border-t border-[#efe7e2]">
              <Link to="/login" className="font-bold text-[#1f2c45] text-center py-3 border-2 border-[#1f2c45] rounded-xl hover:bg-[#1f2c45] hover:text-white transition-colors">
                Iniciar Sesión
              </Link>
              <Link to="/register" className="bg-[#ff7665] text-white font-bold text-center py-3 rounded-xl hover:bg-[#ff5a45] transition-colors">
                Regístrate Gratis
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-[1200px]">
        {/* HERO */}
        <section className="relative flex flex-col items-center justify-between gap-12 overflow-hidden px-6 py-12 md:flex-row md:px-10 lg:px-16 lg:py-24">
          <div className="z-10 flex flex-1 flex-col items-start text-left">
            <div className="mb-6 inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#f5c49f] bg-[#fff8f4] px-4 py-2 text-xs font-semibold text-[#4f5b6f] shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md sm:text-sm">
              <span className="animate-pulse text-[#ff8b40]">★</span>
              Tu próximo trabajo está más cerca de lo que pienses
            </div>

            <h1 className="max-w-[16ch] font-serif text-5xl leading-[1.05] tracking-[-0.03em] text-[#1f2c45] sm:text-6xl md:text-[64px] lg:text-[76px]">
              Conecta con oportunidades que impulsan{" "}
              <span className="relative inline-block text-[#ff7665]">
                tu futuro
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 10C50 2 150 2 198 10" stroke="#ff7665" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            <p className="mt-8 max-w-[32ch] text-lg leading-[1.6] text-[#4e5969] sm:text-xl md:text-2xl">
              Kamello es la plataforma que te ayuda a encontrar el trabajo ideal de
              forma fácil, rápida y personalizada.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                to="/register"
                className="group flex items-center justify-center gap-3 rounded-2xl bg-[#ff7665] px-8 py-4 text-xl font-bold text-white shadow-lg shadow-[#ff7665]/30 transition-all hover:-translate-y-1 hover:bg-[#ff5a45] hover:shadow-xl hover:shadow-[#ff7665]/40"
              >
                Comenzar ahora
                <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <button
                type="button"
                onClick={() => setShowOffers(true)}
                className="flex items-center justify-center gap-2 rounded-2xl border-2 border-[#1f2c45] px-8 py-4 text-xl font-bold text-[#1f2c45] transition-all hover:-translate-y-1 hover:bg-[#1f2c45] hover:text-white"
              >
                Ver ofertas
              </button>
            </div>
          </div>

          {/* Hero Image / Desktop Layout */}
          <div className="relative flex-1 w-full max-w-[500px] md:max-w-none flex justify-center md:justify-end">
            <div className="relative h-[400px] w-full max-w-[380px] sm:h-[500px] sm:max-w-[440px] lg:h-[600px] lg:max-w-[520px]">
              <div className="absolute inset-0 rounded-tl-[160px] rounded-br-[80px] rounded-tr-[40px] rounded-bl-[40px] border-4 border-[#ff8e7e] bg-[#f8cdbc] shadow-2xl transition-transform hover:scale-[1.02]">
                <div className="absolute inset-2 overflow-hidden rounded-tl-[150px] rounded-br-[70px] rounded-tr-[30px] rounded-bl-[30px]">
                  <img
                    src={landingImageUrl}
                    alt="Camello con mochila"
                    className="h-full w-full object-cover object-center opacity-95 transition-transform duration-700 hover:scale-105"
                  />
                </div>
              </div>
              

            </div>
          </div>
        </section>

        {/* BENEFICIOS */}
        <section id="beneficios" className="mt-12 rounded-[40px] bg-white px-6 py-16 shadow-sm md:px-10 lg:px-16 lg:py-24">
          <div className="text-center">
            <h2 className="mx-auto max-w-[24ch] font-serif text-4xl leading-[1.1] tracking-[-0.02em] text-[#1f2c45] md:text-5xl lg:text-6xl">
              Todo lo que necesitas para conseguir{" "}
              <span className="text-[#ff7665]">tu próximo trabajo</span>
            </h2>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
            {[
              {
                iconBg: "bg-[#fee4db]",
                icon: <Search className="w-6 h-6" />,
                iconColor: "text-[#ff7f61]",
                title: "Encuentra oportunidades adaptadas",
                text: "Filtra por tus habilidades, intereses y ubicación con nuestro motor inteligente.",
              },
              {
                iconBg: "bg-[#fff2d8]",
                icon: <FileText className="w-6 h-6" />,
                iconColor: "text-[#f3af2f]",
                title: "Destaca tu perfil profesional",
                text: "Crea un CV increíble en minutos y llama la atención de los mejores reclutadores.",
              },
              {
                iconBg: "bg-[#dff3ea]",
                icon: <Handshake className="w-6 h-6" />,
                iconColor: "text-[#3e9b76]",
                title: "Conecta y avanza rápidamente",
                text: "Postúlate con un clic y comunícate directamente con empresas interesantes.",
              },
            ].map((item, i) => (
              <article 
                key={item.title} 
                className="group cursor-pointer rounded-3xl border border-[#efe7e2] bg-[#f7f3f1] p-8 transition-all duration-300 hover:-translate-y-2 hover:bg-white hover:shadow-xl hover:shadow-[#ff7665]/5"
              >
                <div
                  className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${item.iconBg} ${item.iconColor} transition-transform group-hover:scale-110 group-hover:rotate-3`}
                >
                  {item.icon}
                </div>
                <h3 className="font-serif text-2xl font-bold leading-[1.3] text-[#2b3a4f] transition-colors group-hover:text-[#ff7665]">
                  {item.title}
                </h3>
                <p className="mt-4 text-lg leading-[1.6] text-[#5f6a79]">
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* TESTIMONIO + METRICAS */}
        <section id="testimonios" className="px-6 py-16 md:px-10 lg:px-16 lg:py-24">
          <div className="overflow-hidden rounded-[40px] border border-[#f1d8cb] bg-gradient-to-br from-[#fbf1ea] to-[#fff8f4] p-8 md:p-12 lg:p-16">
            <div className="grid gap-12 md:grid-cols-[1.2fr_1fr] md:items-center">
              <div className="relative">
                <span className="absolute -left-4 -top-6 text-6xl text-[#ff7665]/20 font-serif">"</span>
                <p className="relative z-10 text-2xl font-medium leading-[1.5] text-[#3a4557] md:text-3xl lg:text-[34px]">
                  Gracias a Kamello encontré el trabajo que cambió mi carrera profesional por completo.
                </p>
                <div className="mt-8 flex items-center gap-5">
                  <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-white shadow-md">
                    <img
                      src={landingImageUrl}
                      alt="Laura G."
                      className="h-full w-full object-cover object-[32%_88%]"
                    />
                  </div>
                  <div>
                    <span className="block text-xl font-bold text-[#1f2c45]">Laura G.</span>
                    <span className="text-[#5f6a79]">Diseñadora UX/UI</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-8 md:border-l md:border-[#ecd7ca]/60 md:pl-12 lg:pl-16">
                {[
                  { number: "+10K", label: "Personas contratadas" },
                  { number: "+5K", label: "Empresas activas" },
                  { number: "+20K", label: "Ofertas disponibles" },
                ].map((stat, idx) => (
                  <div key={idx} className="group flex flex-col">
                    <span className="text-5xl font-extrabold tracking-tight text-[#ff7665] transition-transform group-hover:translate-x-2 md:text-6xl">
                      {stat.number}
                    </span>
                    <span className="mt-1 text-lg font-medium text-[#2d394e] md:text-xl">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* OFFERS MODAL */}
      {showOffers && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#1f2c45]/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            {/* Modal Header */}
            <div className="p-8 bg-[#1f2c45] text-white flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-serif font-bold mb-1">Trabajos Cerca de Ti</h3>
                <p className="text-sm text-[#a4b1c6] font-medium italic">Ejemplos de órdenes de trabajo en tiempo real</p>
              </div>
              <button 
                onClick={() => setShowOffers(false)}
                className="p-3 bg-white/10 hover:bg-[#ff7665] rounded-2xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Offers List */}
            <div className="p-8 space-y-4 max-h-[500px] overflow-y-auto bg-[#fcfaf9]">
              {SAMPLE_OFFERS.map(offer => (
                <div key={offer.id} className="bg-white p-5 rounded-3xl border border-[#efe7e2] flex items-center justify-between group hover:border-[#ff7665] transition-all hover:shadow-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-[#ff7665]/10 rounded-2xl flex items-center justify-center text-[#ff7665]">
                      <Zap className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#1f2c45]">{offer.title}</h4>
                      <div className="flex gap-3 mt-1">
                        <span className="text-[10px] font-black uppercase text-[#a4b1c6] tracking-widest flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {offer.distance}
                        </span>
                        <span className="text-[10px] font-black uppercase text-[#00cba9] tracking-widest flex items-center gap-1">
                          <DollarSign className="w-3 h-3" /> {offer.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-xl font-black text-[#1f2c45]">{offer.price}</span>
                    <span className="text-[10px] font-black text-[#ff7665] uppercase tracking-tighter">Disponible ahora</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-8 border-t border-[#efe7e2] bg-white flex flex-col items-center">
              <p className="text-[#5f6a79] text-sm text-center mb-6">¿Quieres ganar dinero con estos trabajos? Únete a la red más grande de profesionales.</p>
              <Link 
                to="/register" 
                className="w-full bg-[#ff7665] text-white py-4 rounded-2xl font-bold text-center shadow-lg hover:bg-[#ff5a45] transition-all flex items-center justify-center gap-2"
              >
                Registrarme para postular <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="mt-8 overflow-hidden rounded-t-[40px] bg-[#1f2c45] px-8 py-12 text-white md:px-12 lg:px-16 lg:py-16">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
            <div className="max-w-sm">
              <div className="flex items-center gap-3">
                <img 
                  src={logoImageUrl} 
                  alt="Kamello Logo" 
                  className="h-8 w-auto object-contain [filter:brightness(0)_invert(1)]" 
                />
                <span className="text-3xl font-bold tracking-[-0.03em] text-white">
                  Kamello
                </span>
              </div>
              <p className="mt-6 text-lg leading-[1.6] text-[#a4b1c6]">
                Conectamos el mejor talento con las oportunidades más increíbles de todo el mundo.
              </p>
              
              <div className="mt-8 flex gap-4">
                <div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-[#ff7665]">
                  <Share2 className="w-5 h-5" />
                </div>
                <div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-[#ff7665]">
                  <Send className="w-5 h-5" />
                </div>
                <div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-[#ff7665]">
                  <Camera className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xl font-bold text-white">Para candidatos</h4>
              <ul className="mt-6 flex flex-col gap-4 text-lg text-[#a4b1c6]">
                <li><Link to="/buscar-trabajos" className="hover:text-[#ff7665] transition-colors">Buscar trabajos</Link></li>
                <li><Link to="/crear-perfil" className="hover:text-[#ff7665] transition-colors">Crear perfil</Link></li>
                <li><Link to="/consejos-profesionales" className="hover:text-[#ff7665] transition-colors">Consejos profesionales</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xl font-bold text-white">Para empresas</h4>
              <ul className="mt-6 flex flex-col gap-4 text-lg text-[#a4b1c6]">
                <li><a href="#" className="hover:text-[#ff7665] transition-colors">Publicar ofertas</a></li>
                <li><a href="#" className="hover:text-[#ff7665] transition-colors">Buscar talento</a></li>
                <li><Link to="/precios" className="hover:text-[#ff7665] transition-colors">Planes y precios</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-16 flex flex-col items-center justify-between border-t border-white/10 pt-8 text-[#a4b1c6] md:flex-row">
            <p>© 2026 Kamello. Todos los derechos reservados.</p>
            <div className="mt-4 flex gap-6 md:mt-0">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacidad</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Términos</Link>
            </div>
          </div>
        </footer>
    </div>
  );
}

