/**
 * @file router.js
 * Minimal SPA router — maneja navegación sin recargar la página.
 * Llama a render() de cada page según la ruta actual.
 */
import { renderLanding }    from './pages/landing.js';
import { renderAuth }       from './pages/auth.js';
import { renderDashboard }  from './pages/dashboard.js';
import { renderVerifyEmail } from './pages/verify-email.js';
import { renderProfile }    from './pages/profile.js';
import { renderExplore }    from './pages/explore.js';

const app = document.getElementById('app');

const routes = {
  '/':             renderLanding,
  '/auth':         renderAuth,
  '/dashboard':    renderDashboard,
  '/verify-email': renderVerifyEmail,
  '/profile':      renderProfile,
  '/explore':      renderExplore,
};

export function navigate(path) {
  if (window.location.pathname === path) return;
  history.pushState(null, '', path);
  route();
}

function route() {
  const path = window.location.pathname;
  const render = routes[path] || routes['/'];
  app.classList.add('route-transitioning');
  app.innerHTML = '';
  render(app);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  requestAnimationFrame(() => app.classList.remove('route-transitioning'));
}

// Interceptar clicks en links con data-link
document.addEventListener('click', (e) => {
  const link = e.target.closest('[data-link]');
  if (link) {
    e.preventDefault();
    navigate(link.getAttribute('href'));
  }
});

window.addEventListener('popstate', route);

// Primera carga
const hash = window.location.hash;
if (hash && (hash.includes('access_token=') || hash.includes('type=recovery'))) {
  // Supabase devolvió un link de auth. El cliente de supabase lo maneja solo,
  // pero podemos forzar una redirección al dashboard.
  setTimeout(() => navigate('/dashboard'), 500);
}

route();
