/**
 * @file explore.js
 * Página de descubrimiento de Kamelladores.
 * Permite buscar por nombre, filtrar por categoría y contratar.
 */
import { navigate } from '../router.js';
import { api, isLoggedIn } from '../api.js';
import { escapeHtml, showToast, upsertFieldHint } from '../ui.js';

export function renderExplore(container) {
  if (!isLoggedIn()) {
    navigate('/auth');
    return;
  }

  const user = JSON.parse(localStorage.getItem('kamello_user') || '{}');

  // ── State ──────────────────────────────────────────────────────
  let kamelladores = [];
  let categories   = [];
  let loading      = true;
  let searchQuery  = '';
  let activeCat    = null; // category id or null = all

  // ── Hire modal state ───────────────────────────────────────────
  let modalKamellador = null;

  // ── Render ─────────────────────────────────────────────────────
  function render() {
    container.innerHTML = `
      <div class="explore-page page-enter">

        <!-- Nav -->
        <nav class="nav scrolled">
          <div class="container nav-inner">
            <div class="nav-logo">
              <a href="/" data-link style="text-decoration:none;">
                <span class="text-gradient">Kamello</span> 🐪
              </a>
            </div>
            <div class="nav-links">
              <a href="/explore" data-link class="btn btn-ghost" style="color:var(--color-primary-light);">Explorar</a>
              <a href="/dashboard" data-link class="btn btn-ghost">Mi Panel</a>
              <span style="color:var(--color-text-secondary); font-size:13px; display:flex; align-items:center; gap:6px;">
                ${user.role === 'kamellador' ? '🔧' : '🏠'} ${user.full_name?.split(' ')[0] || 'Usuario'}
              </span>
            </div>
          </div>
        </nav>

        <!-- Hero header -->
        <div class="explore-hero">
          <div class="container">
            <div class="explore-hero-badge">🔍 Descubre talento verificado</div>
            <h1 class="explore-hero-title">Encuentra tu <span class="text-gradient">Kamellador</span></h1>
            <p class="explore-hero-sub">Técnicos verificados listos para ayudarte. Filtra por categoría o busca por nombre.</p>

            <!-- Search bar -->
            <div class="search-bar-wrap">
              <div class="search-bar">
                <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  class="search-input"
                  id="search-input"
                  type="text"
                  placeholder="Buscar por nombre..."
                  value="${escapeHtml(searchQuery)}"
                  autocomplete="off"
                />
                ${searchQuery ? `<button class="search-clear" id="search-clear" aria-label="Limpiar búsqueda">✕</button>` : ''}
              </div>
            </div>
          </div>
        </div>

        <!-- Category filters -->
        <div class="container">
          <div class="category-filters" id="category-filters">
            <button class="category-chip ${activeCat === null ? 'active' : ''}" data-cat="">
              Todas las categorías
            </button>
            ${categories.map(c => `
              <button class="category-chip ${activeCat === c.id ? 'active' : ''}" data-cat="${c.id}">
                ${escapeHtml(c.name)}
              </button>
            `).join('')}
          </div>

          <!-- Results count -->
          ${!loading ? `
            <div class="explore-results-count">
              ${kamelladores.length === 0
                ? 'Sin resultados'
                : `${kamelladores.length} Kamellador${kamelladores.length !== 1 ? 'es' : ''} encontrado${kamelladores.length !== 1 ? 's' : ''}`
              }
            </div>
          ` : ''}

          <!-- Grid -->
          <div class="kamellador-grid" id="kamellador-grid">
            ${loading ? renderSkeletons() : renderCards()}
          </div>
        </div>

        <!-- Footer -->
        <footer class="footer container" style="margin-top:60px;">
          <p>© ${new Date().getFullYear()} Kamello — Hecho con ❤️ en Colombia</p>
        </footer>
      </div>

      <!-- Hire Modal -->
      <div class="modal-overlay" id="hire-modal" aria-hidden="true" role="dialog" aria-modal="true">
        <div class="modal-box" id="hire-modal-box">
          <!-- filled by openModal() -->
        </div>
      </div>
    `;

    bindEvents();
  }

  // ── Skeleton loader ────────────────────────────────────────────
  function renderSkeletons() {
    return Array.from({ length: 6 }).map(() => `
      <div class="kamellador-card skeleton-card">
        <div class="skeleton sk-avatar"></div>
        <div class="skeleton sk-name"></div>
        <div class="skeleton sk-badge"></div>
        <div class="skeleton sk-tags"></div>
        <div class="skeleton sk-btn"></div>
      </div>
    `).join('');
  }

  // ── Kamellador cards ───────────────────────────────────────────
  function renderCards() {
    if (kamelladores.length === 0) {
      return `
        <div class="empty-state" style="grid-column:1/-1;">
          <div class="icon">🔍</div>
          <p>No encontramos kamelladores con esos filtros.</p>
          <p style="font-size:13px; margin-top:8px; color:var(--color-text-muted);">
            Intenta con otra categoría o limpia la búsqueda.
          </p>
          ${searchQuery || activeCat ? `
            <button class="btn btn-outline" id="clear-filters" style="margin-top:20px;">
              Limpiar filtros
            </button>
          ` : ''}
        </div>
      `;
    }

    return kamelladores.map(k => {
      const initials = getInitials(k.full_name);
      const color = avatarColor(k.id);
      const visibleSkills = (k.skills || []).slice(0, 3);
      const extraCount = (k.skills || []).length - 3;

      return `
        <article class="kamellador-card card" data-id="${k.id}">
          <div class="kcard-top">
            <div class="avatar-initials" style="background:${color};">
              ${initials}
            </div>
            <div class="kcard-info">
              <div class="kcard-name">${escapeHtml(k.full_name || 'Sin nombre')}</div>
              <span class="badge badge-kamellador">Kamellador</span>
            </div>
          </div>

          <div class="skill-tags">
            ${visibleSkills.map(s => `
                <span class="skill-tag">${escapeHtml(s.name || '')}</span>
            `).join('')}
            ${extraCount > 0 ? `<span class="skill-tag skill-tag-more">+${extraCount} más</span>` : ''}
            ${(k.skills || []).length === 0 ? `<span class="skill-tag-empty">Sin habilidades registradas</span>` : ''}
          </div>

          <button
            class="btn btn-primary kcard-hire-btn"
            data-kamellador-id="${k.id}"
            ${user.role === 'kamellador' ? 'disabled title="Solo clientes pueden contratar"' : ''}
          >
            Contratar
          </button>
        </article>
      `;
    }).join('');
  }

  // ── Bind events ────────────────────────────────────────────────
  function bindEvents() {
    // Search input
    const searchInput = container.querySelector('#search-input');
    if (searchInput) {
      searchInput.addEventListener('input', debounce(e => {
        searchQuery = e.target.value.trim();
        fetchKamelladores();
      }, 400));
    }

    // Clear search
    const clearBtn = container.querySelector('#search-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        searchQuery = '';
        fetchKamelladores();
      });
    }

    // Category chips
    const catFilters = container.querySelector('#category-filters');
    if (catFilters) {
      catFilters.addEventListener('click', e => {
        const chip = e.target.closest('.category-chip');
        if (!chip) return;
        const catVal = chip.dataset.cat;
        activeCat = catVal === '' ? null : catVal;
        fetchKamelladores();
      });
    }

    // Clear filters (empty state)
    const clearFilters = container.querySelector('#clear-filters');
    if (clearFilters) {
      clearFilters.addEventListener('click', () => {
        searchQuery = '';
        activeCat = null;
        fetchKamelladores();
      });
    }

    // Hire buttons
    const grid = container.querySelector('#kamellador-grid');
    if (grid) {
      grid.addEventListener('click', e => {
        const btn = e.target.closest('.kcard-hire-btn');
        if (!btn || btn.disabled) return;
        const kamelladorId = btn.dataset.kamelladorId;
        const k = kamelladores.find(k => String(k.id) === String(kamelladorId));
        if (k) openModal(k);
      });
    }

    // Modal overlay click-outside-to-close
    const overlay = document.getElementById('hire-modal');
    if (overlay) {
      overlay.addEventListener('click', e => {
        if (e.target === overlay) closeModal();
      });
    }

    // Escape key
    document.addEventListener('keydown', onEscKey);
  }

  function onEscKey(e) {
    if (e.key === 'Escape') closeModal();
  }

  // ── Modal ──────────────────────────────────────────────────────
  function openModal(kamellador) {
    modalKamellador = kamellador;
    const overlay = document.getElementById('hire-modal');
    const box = document.getElementById('hire-modal-box');
    if (!overlay || !box) return;

    const skills = kamellador.skills || [];

    box.innerHTML = `
      <div class="modal-header">
        <div class="modal-avatar-wrap">
          <div class="avatar-initials avatar-initials-lg" style="background:${avatarColor(kamellador.id)};">
            ${getInitials(kamellador.full_name)}
          </div>
          <div>
            <div class="modal-kamellador-name">${escapeHtml(kamellador.full_name || '')}</div>
            <span class="badge badge-kamellador">Kamellador</span>
          </div>
        </div>
        <button class="modal-close" id="modal-close" aria-label="Cerrar">✕</button>
      </div>

      <form class="modal-form" id="hire-form" novalidate>
        <div class="input-group">
          <label for="hire-skill">Habilidad requerida</label>
          <select class="input" id="hire-skill" name="skill_id" required>
            <option value="">— Selecciona una habilidad —</option>
            ${skills.map(s => `<option value="${s.id}">${escapeHtml(s.name)}${s.category ? ` · ${escapeHtml(s.category)}` : ''}</option>`).join('')}
          </select>
        </div>

        <div class="input-group">
          <label for="hire-desc">Descripción del trabajo</label>
          <textarea
            class="input"
            id="hire-desc"
            name="description"
            rows="4"
            placeholder="Describe el trabajo que necesitas, el lugar, y cualquier detalle relevante..."
            required
            style="resize:vertical; min-height:110px;"
          ></textarea>
        </div>

        <div class="input-group">
          <label for="hire-price">Precio propuesto (COP)</label>
          <input
            class="input"
            id="hire-price"
            name="proposed_price"
            type="number"
            min="0"
            step="1000"
            placeholder="Ej: 80000"
          />
        </div>

        <div id="hire-alert"></div>

        <div class="modal-actions">
          <button type="button" class="btn btn-outline" id="modal-cancel">Cancelar</button>
          <button type="submit" class="btn btn-primary" id="hire-submit">
            Enviar solicitud
          </button>
        </div>
      </form>
    `;

    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');

    // Bind modal events
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('hire-form').addEventListener('submit', onHireSubmit);
    document.getElementById('hire-skill')?.focus();
  }

  function closeModal() {
    const overlay = document.getElementById('hire-modal');
    if (overlay) {
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
    }
    document.removeEventListener('keydown', onEscKey);
    modalKamellador = null;
  }

  async function onHireSubmit(e) {
    e.preventDefault();
    const form   = e.target;
    const skillId = form.skill_id.value;
    const desc    = form.description.value.trim();
    const price   = form.proposed_price.value;
    const alertEl = document.getElementById('hire-alert');
    const submitBtn = document.getElementById('hire-submit');

    // Simple validation
    if (!skillId) {
      alertEl.innerHTML = `<div class="alert alert-error">Por favor selecciona una habilidad.</div>`;
      upsertFieldHint(form.skill_id, 'Selecciona el servicio principal que necesitas.', 'error');
      return;
    }
    if (!desc) {
      alertEl.innerHTML = `<div class="alert alert-error">Por favor describe el trabajo que necesitas.</div>`;
      upsertFieldHint(form.description, 'Describe el trabajo para que el kamellador responda mas rapido.', 'error');
      return;
    }
    if (desc.length < 20) {
      alertEl.innerHTML = `<div class="alert alert-error">Incluye al menos 20 caracteres para dar contexto al servicio.</div>`;
      upsertFieldHint(form.description, 'Agrega detalles como zona, urgencia y alcance del trabajo.', 'error');
      return;
    }

    upsertFieldHint(form.description, 'Descripcion suficiente. Ya puedes enviar la solicitud.', 'success');
    alertEl.innerHTML = '';
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Enviando...';

    try {
      await api.createOp({
        kamellador_id:  modalKamellador.id,
        skill_id:       skillId,
        description:    desc,
        proposed_price: price ? Number(price) : null,
      });

      alertEl.innerHTML = `<div class="alert alert-success">✅ ¡Solicitud enviada! El kamellador la revisará pronto.</div>`;
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Enviado ✓';

      showToast('Solicitud enviada con exito.', 'success');
      setTimeout(() => closeModal(), 2200);
    } catch (err) {
      showToast(err.message || 'No pudimos enviar la solicitud.', 'error');
      alertEl.innerHTML = `<div class="alert alert-error">${escapeHtml(err.message || 'Error al enviar la solicitud.')}</div>`;
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Enviar solicitud';
    }
  }

  // ── Data fetching ──────────────────────────────────────────────
  async function fetchKamelladores() {
    loading = true;
    // Partial re-render: just update the grid area
    const grid = container.querySelector('#kamellador-grid');
    const countEl = container.querySelector('.explore-results-count');
    if (grid) grid.innerHTML = renderSkeletons();
    if (countEl) countEl.textContent = '';

    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (activeCat)   params.category_id = activeCat;
      kamelladores = await api.getKamelladores(params);
    } catch (err) {
      kamelladores = [];
    }

    loading = false;

    // Re-render grid + count + chip states without full re-render
    render();
  }

  async function init() {
    // Fetch categories and first batch of kamelladores in parallel
    try {
      [categories] = await Promise.all([
        api.getCategories().catch(() => []),
        api.getKamelladores({}).then(data => { kamelladores = data; }).catch(() => { kamelladores = []; }),
      ]);
    } catch (_) {
      categories = [];
      kamelladores = [];
    }
    loading = false;
    render();
  }

  // Initial render (with skeletons) then load data
  render();
  init();
}

// ── Utilities ────────────────────────────────────────────────────
function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || '')
    .join('');
}

const AVATAR_PALETTE = [
  'linear-gradient(135deg,#F97316,#EA580C)',
  'linear-gradient(135deg,#06B6D4,#0891B2)',
  'linear-gradient(135deg,#8B5CF6,#7C3AED)',
  'linear-gradient(135deg,#10B981,#059669)',
  'linear-gradient(135deg,#F59E0B,#D97706)',
  'linear-gradient(135deg,#EC4899,#DB2777)',
];

function avatarColor(id = '') {
  // Stable hash of the id string
  let h = 0;
  const s = String(id);
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
