/**
 * @file landing.js
 * Landing page — primera vista que el usuario ve.
 */
import { navigate } from '../router.js';
import { isLoggedIn } from '../api.js';

export function renderLanding(container) {
  // Si ya está logueado, ir al dashboard
  if (isLoggedIn()) {
    navigate('/dashboard');
    return;
  }

  container.innerHTML = `
    <div class="landing page-enter">

      <!-- Navigation -->
      <nav class="nav" id="main-nav">
        <div class="container nav-inner">
          <div class="nav-logo"><span class="text-gradient">Kamello</span> 🐪</div>
          <div class="nav-links">
            <a href="/explore" data-link class="btn btn-ghost">Ver Kamelladores</a>
            <a href="/auth" data-link class="btn btn-ghost">Iniciar Sesión</a>
            <a href="/auth" data-link class="btn btn-primary">Registrarme</a>
          </div>
        </div>
      </nav>

      <!-- Hero -->
      <section class="hero">
        <div class="hero-content">
          <div class="hero-badge">✨ Marketplace de técnicos #1 en Colombia</div>
          <h1>Encuentra al <span class="text-gradient">técnico perfecto</span> para cualquier trabajo</h1>
          <p>Plomería, electricidad, carpintería, limpieza y más. Conectamos tu necesidad con kamelladores verificados cerca de ti.</p>
          <div class="hero-actions">
            <a href="/explore" data-link class="btn btn-primary btn-lg">
              Ver Kamelladores →
            </a>
            <a href="#features" class="btn btn-outline btn-lg">
              ¿Cómo funciona?
            </a>
          </div>
        </div>
      </section>

      <!-- Features -->
      <section class="features container" id="features">
        <div class="features-header">
          <h2>Todo lo que necesitas, <span class="text-gradient">en un solo lugar</span></h2>
          <p>Simple, rápido y seguro. Así funciona Kamello.</p>
        </div>
        <div class="features-grid">
          <div class="card feature-card">
            <div class="feature-icon">🔍</div>
            <h3>Busca un servicio</h3>
            <p>Explora categorías o busca directamente el técnico que necesitas. Filtra por habilidades, experiencia y calificación.</p>
          </div>
          <div class="card feature-card">
            <div class="feature-icon">📲</div>
            <h3>Solicita en segundos</h3>
            <p>Describe tu problema, el técnico recibe la solicitud y puede aceptarla al instante. Sin llamadas, sin esperas.</p>
          </div>
          <div class="card feature-card">
            <div class="feature-icon">🔒</div>
            <h3>Pago seguro</h3>
            <p>Solo pagas cuando el trabajo está hecho. Todos los pagos son procesados de forma segura dentro de la plataforma.</p>
          </div>
          <div class="card feature-card">
            <div class="feature-icon">⭐</div>
            <h3>Técnicos verificados</h3>
            <p>Cada kamellador pasa por un proceso de verificación. Puedes ver sus calificaciones y reseñas de otros clientes.</p>
          </div>
          <div class="card feature-card">
            <div class="feature-icon">⚡</div>
            <h3>Respuesta rápida</h3>
            <p>Los técnicos responden en minutos. Nuestro sistema de notificaciones garantiza que no pierdas tiempo esperando.</p>
          </div>
          <div class="card feature-card">
            <div class="feature-icon">📍</div>
            <h3>Cerca de ti</h3>
            <p>Encuentra técnicos en tu zona. No importa dónde estés, siempre hay un kamellador dispuesto a ayudarte.</p>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="cta-section container">
        <div class="cta-box">
          <h2>¿Eres técnico? <span class="text-gradient">Únete como Kamellador</span></h2>
          <p>Recibe solicitudes de trabajo, fija tus precios y haz crecer tu negocio. Sin complicaciones.</p>
          <a href="/auth" data-link class="btn btn-primary btn-lg">
            Registrarme como Kamellador 🐪
          </a>
        </div>
      </section>

      <!-- Footer -->
      <footer class="footer container">
        <p>© ${new Date().getFullYear()} Kamello — Hecho con ❤️ en Colombia</p>
      </footer>

    </div>
  `;

  // Navbar scroll effect
  const nav = document.getElementById('main-nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  });
}
