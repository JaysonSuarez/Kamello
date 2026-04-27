/**
 * @file dashboard.js
 * Dashboard — Panel principal después de iniciar sesión.
 * Muestra estadísticas, habilidades (kamelladores) y lista de operaciones.
 */
import { navigate } from '../router.js';
import { api, isLoggedIn, clearToken } from '../api.js';

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Formatea una fecha ISO en español relativo o corto.
 * Ej: "hace 2 días" | "10 abr 2026"
 */
function formatDate(iso) {
  if (!iso) return '';
  const date  = new Date(iso);
  const now   = new Date();
  const diffMs  = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH   = Math.floor(diffMs / 3600000);
  const diffD   = Math.floor(diffMs / 86400000);

  if (diffMin < 1)   return 'hace un momento';
  if (diffMin < 60)  return `hace ${diffMin} min`;
  if (diffH < 24)    return `hace ${diffH}h`;
  if (diffD === 1)   return 'ayer';
  if (diffD < 7)     return `hace ${diffD} días`;

  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Devuelve las iniciales de un nombre completo */
function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
}

// ── Status maps ────────────────────────────────────────────────────────────
const STATUS_LABELS = {
  pending:     'Pendiente',
  accepted:    'Aceptada',
  rejected:    'Rechazada',
  in_progress: 'En Progreso',
  completed:   'Completada',
  cancelled:   'Cancelada',
};

const STATUS_CLASSES = {
  pending:     'badge-pending',
  accepted:    'badge-accepted',
  rejected:    'badge-rejected',
  in_progress: 'badge-progress',
  completed:   'badge-completed',
  cancelled:   'badge-cancelled',
};

// ── Main export ────────────────────────────────────────────────────────────

export function renderDashboard(container) {
  if (!isLoggedIn()) {
    navigate('/auth');
    return;
  }

  const user         = JSON.parse(localStorage.getItem('kamello_user') || '{}');
  const isClient     = user.role === 'client';
  const isKamellador = user.role === 'kamellador';

  let operations     = [];
  let mySkills       = [];
  let hireSkills     = [];
  let loadingOps     = true;
  let loadingSkills  = true;
  let modalOpen      = false;
  let submittingHire = false;

  // Pre-filled kamellador from URL param: ?hire=<id>&name=<name>
  let hireKamelladorId   = null;
  let hireKamelladorName = null;

  const urlParams    = new URLSearchParams(window.location.search);
  const hireParam    = urlParams.get('hire');
  const hireNameParam = urlParams.get('name');
  if (hireParam && isClient) {
    hireKamelladorId   = hireParam;
    hireKamelladorName = hireNameParam ? decodeURIComponent(hireNameParam) : 'Kamellador';
    modalOpen          = true;
    history.replaceState(null, '', '/dashboard');
  }

  // ── Render ─────────────────────────────────────────────────────────────
  function render() {
    const pendingCount   = operations.filter(o => o.status === 'pending').length;
    const activeCount    = operations.filter(o => ['accepted', 'in_progress'].includes(o.status)).length;
    const completedCount = operations.filter(o => o.status === 'completed').length;
    const avatarInit     = initials(user.full_name);

    container.innerHTML = `
      <!-- Dashboard top nav -->
      <nav class="dashboard-nav">
        <div class="container nav-inner">
          <div class="nav-logo" id="nav-home">
            <span class="text-gradient">Kamello</span> 🐪
          </div>
          <div class="nav-links">
            ${isClient ? `
              <button class="nav-link" id="nav-explore">
                <span>🔍</span><span>Explorar</span>
              </button>
            ` : ''}
            <button class="nav-link" id="nav-profile">
              <span>👤</span><span>Mi Perfil</span>
            </button>
            <div class="nav-user-chip">
              <div class="nav-avatar">${avatarInit}</div>
              <span>${user.full_name?.split(' ')[0] || 'Usuario'}</span>
            </div>
            <button class="btn btn-ghost" id="btn-logout" style="padding:8px 14px; font-size:13px;">Salir</button>
          </div>
        </div>
      </nav>

      <div class="dashboard page-enter" style="padding-top:80px;">
        <div class="container" style="padding-top:40px; padding-bottom:60px;">

          <!-- Header row -->
          <div class="dash-header-row">
            <div class="dash-header">
              <h1>Hola, <span class="text-gradient">${user.full_name?.split(' ')[0] || 'Kamellero'}</span> 👋</h1>
              <p style="color:var(--color-text-secondary); margin-top:4px;">
                ${isClient
                  ? 'Gestiona tus solicitudes de servicio y encuentra nuevos Kamelladores.'
                  : 'Revisa tus trabajos pendientes y gestiona tu perfil profesional.'}
              </p>
            </div>
            ${isClient ? `
              <div style="display:flex; gap:10px; flex-shrink:0; padding-top:4px; flex-wrap:wrap;">
                <button class="btn btn-outline" id="btn-go-explore" style="padding:10px 18px; font-size:14px;">
                  🔍 Explorar
                </button>
                <button class="btn btn-primary" id="btn-nueva-solicitud" style="padding:10px 20px; font-size:14px;">
                  ✚ Nueva Solicitud
                </button>
              </div>
            ` : ''}
          </div>

          <!-- Stats -->
          <div class="dash-grid">
            <div class="card stat-card">
              <div class="stat-icon orange">⏳</div>
              <div>
                <div class="stat-value">${pendingCount}</div>
                <div class="stat-label">Pendientes</div>
              </div>
            </div>
            <div class="card stat-card">
              <div class="stat-icon cyan">🔄</div>
              <div>
                <div class="stat-value">${activeCount}</div>
                <div class="stat-label">En progreso</div>
              </div>
            </div>
            <div class="card stat-card">
              <div class="stat-icon green">✅</div>
              <div>
                <div class="stat-value">${completedCount}</div>
                <div class="stat-label">Completados</div>
              </div>
            </div>
          </div>

          <!-- Kamellador: Mis Habilidades -->
          ${isKamellador ? renderSkillsSection() : ''}

          <!-- Operations -->
          <div class="ops-section">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:8px;">
              <h2 style="font-size:1.3rem; font-weight:700;">Mis Operaciones</h2>
              ${!loadingOps && operations.length > 0 ? `
                <span style="font-size:13px; color:var(--color-text-muted);">
                  ${operations.length} ${operations.length === 1 ? 'operación' : 'operaciones'}
                </span>
              ` : ''}
            </div>
            ${loadingOps
              ? `<div class="text-center" style="padding:60px 20px;">
                   <div class="spinner" style="margin:0 auto; width:32px; height:32px; border-width:3px;"></div>
                   <p style="margin-top:16px; color:var(--color-text-muted); font-size:14px;">Cargando operaciones…</p>
                 </div>`
              : operations.length === 0
                ? renderEmptyState()
                : `<div class="ops-grid">
                     ${operations.map(op => renderOpCard(op, user.role)).join('')}
                   </div>`
            }
          </div>

        </div>
      </div>

      <!-- Modal (mounted outside the scrollable area) -->
      ${modalOpen ? renderModal() : ''}
    `;

    bindEvents();
  }

  // ── Skills section (kamellador) ─────────────────────────────────────────
  function renderSkillsSection() {
    if (loadingSkills) {
      return `
        <div class="skills-section">
          <h3>Mis Habilidades</h3>
          <div style="display:flex; gap:8px; align-items:center;">
            ${[80, 100, 64].map(w =>
              `<div style="height:26px; width:${w}px; background:var(--color-bg-elevated); border-radius:999px; opacity:0.4;"></div>`
            ).join('')}
          </div>
        </div>
      `;
    }

    const tagsHtml = mySkills.length > 0
      ? mySkills.map(s => `<span class="skill-tag">${s.skills?.name || s.name || 'Habilidad'}</span>`).join('')
      : `<span class="skill-tag-empty">Sin habilidades registradas aún</span>`;

    return `
      <div class="skills-section">
        <h3>Mis Habilidades</h3>
        <div class="skills-tags">
          ${tagsHtml}
          <button class="skills-manage-link" id="btn-manage-skills">Gestionar →</button>
        </div>
      </div>
    `;
  }

  // ── Empty states ────────────────────────────────────────────────────────
  function renderEmptyState() {
    if (isClient) {
      return `
        <div class="empty-state">
          <div class="icon">🔍</div>
          <p class="empty-title">¡Aún no has contratado ningún servicio!</p>
          <p class="empty-sub">Encuentra tu Kamellador ideal, revisa su perfil y envíale una solicitud de trabajo.</p>
          <button class="btn btn-primary" id="btn-empty-explore" style="margin-top:8px;">
            Explorar Kamelladores
          </button>
        </div>
      `;
    }
    return `
      <div class="empty-state">
        <div class="icon">📋</div>
        <p class="empty-title">Aún no tienes solicitudes de trabajo</p>
        <p class="empty-sub">Los clientes te encontrarán cuando tengas habilidades en tu perfil. ¡Complétalo para destacar!</p>
        <button class="btn btn-outline" id="btn-empty-profile" style="margin-top:8px;">
          Completar mi perfil
        </button>
      </div>
    `;
  }

  // ── Operation card ──────────────────────────────────────────────────────
  function renderOpCard(op, userRole) {
    const otherPerson     = userRole === 'client'
      ? (op.kamellador?.full_name || 'Kamellador')
      : (op.client?.full_name || 'Cliente');
    const otherPersonIcon = userRole === 'client' ? '🔧' : '👤';
    const skillName       = op.skills?.name || op.skill?.name || null;
    const dateStr         = formatDate(op.created_at);

    const actions = [];
    if (userRole === 'kamellador') {
      if (op.status === 'pending') {
        actions.push(`<button class="btn btn-primary" data-action="accepted"    data-id="${op.id}" style="padding:7px 14px; font-size:13px;">✓ Aceptar</button>`);
        actions.push(`<button class="btn btn-outline" data-action="rejected"    data-id="${op.id}" style="padding:7px 14px; font-size:13px;">✕ Rechazar</button>`);
      }
      if (op.status === 'accepted') {
        actions.push(`<button class="btn btn-primary" data-action="in_progress" data-id="${op.id}" style="padding:7px 14px; font-size:13px;">▶ Iniciar trabajo</button>`);
      }
      if (op.status === 'in_progress') {
        actions.push(`<button class="btn btn-primary" data-action="completed"   data-id="${op.id}" style="padding:7px 14px; font-size:13px;">✓ Marcar completado</button>`);
      }
    }
    if (userRole === 'client' && op.status === 'pending') {
      actions.push(`<button class="btn btn-outline" data-action="cancelled" data-id="${op.id}" style="padding:7px 14px; font-size:13px;">Cancelar</button>`);
    }

    return `
      <div class="card op-card">
        <div class="op-header">
          <div style="flex:1; min-width:0;">
            ${skillName ? `<div class="op-skill-name">${skillName}</div>` : ''}
            <div class="op-description">${op.description}</div>
          </div>
          <span class="badge ${STATUS_CLASSES[op.status] || ''}" style="flex-shrink:0; margin-top:2px;">
            ${STATUS_LABELS[op.status] || op.status}
          </span>
        </div>

        <div class="op-card-meta">
          <span class="op-card-meta-item">
            ${otherPersonIcon}&nbsp;<strong style="color:var(--color-text-secondary);">${otherPerson}</strong>
          </span>
          ${dateStr ? `<span>·</span><span class="op-card-meta-item">🕐 ${dateStr}</span>` : ''}
          ${op.proposed_price
            ? `<span>·</span><span class="op-price">💵 $${Number(op.proposed_price).toLocaleString('es-CO')} COP</span>`
            : ''}
        </div>

        ${actions.length > 0 ? `<div class="op-actions">${actions.join('')}</div>` : ''}
      </div>
    `;
  }

  // ── Modal ───────────────────────────────────────────────────────────────
  function renderModal() {
    return hireKamelladorId ? renderHireForm() : renderGoExploreModal();
  }

  function renderGoExploreModal() {
    return `
      <div class="modal-overlay" id="modal-overlay">
        <div class="modal-box" role="dialog" aria-modal="true" aria-label="Nueva solicitud">
          <div class="modal-header">
            <span class="modal-title">Nueva Solicitud</span>
            <button class="modal-close" id="modal-close" aria-label="Cerrar">✕</button>
          </div>
          <div class="modal-body">
            <div class="hire-info-box">
              <div class="info-icon">🐪</div>
              <div class="info-title">¿A quién quieres contratar?</div>
              <p class="info-sub">
                Para crear una solicitud primero debes seleccionar un Kamellador.
                Visita <strong>Explorar</strong> para ver técnicos disponibles, revisar sus habilidades y calificaciones.
              </p>
            </div>
            <div style="display:flex; flex-direction:column; gap:10px;">
              <button class="btn btn-primary btn-lg" id="btn-modal-explore">
                🔍 Ir a Explorar Kamelladores
              </button>
              <button class="btn btn-ghost" id="btn-modal-cancel" style="color:var(--color-text-muted);">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderHireForm() {
    const skillOptions = hireSkills.length > 0
      ? hireSkills.map(s => `<option value="${s.id}">${s.name}</option>`).join('')
      : `<option value="" disabled selected>Cargando habilidades…</option>`;

    return `
      <div class="modal-overlay" id="modal-overlay">
        <div class="modal-box" role="dialog" aria-modal="true" aria-label="Contratar Kamellador">
          <div class="modal-header">
            <span class="modal-title">Solicitar Servicio</span>
            <button class="modal-close" id="modal-close" aria-label="Cerrar">✕</button>
          </div>
          <div class="modal-body">

            <!-- Kamellador preview -->
            <div class="kamellador-preview">
              <div class="kamellador-preview-avatar">${initials(hireKamelladorName)}</div>
              <div class="kamellador-preview-info">
                <div class="kamellador-preview-name">${hireKamelladorName}</div>
                <div class="kamellador-preview-role">🔧 Kamellador</div>
              </div>
              <span class="badge badge-accepted" style="flex-shrink:0;">Seleccionado</span>
            </div>

            <!-- Skill -->
            <div class="input-group">
              <label for="hire-skill">Habilidad / Servicio</label>
              <select id="hire-skill" class="input" style="cursor:pointer;">
                <option value="">— Selecciona una habilidad (opcional) —</option>
                ${skillOptions}
              </select>
            </div>

            <!-- Description -->
            <div class="input-group">
              <label for="hire-desc">
                Descripción del trabajo&nbsp;<span style="color:var(--color-error);">*</span>
              </label>
              <textarea
                id="hire-desc"
                class="input"
                placeholder="Describe detalladamente qué necesitas que haga el Kamellador…"
                rows="4"
              ></textarea>
              <span class="input-hint" id="hire-desc-hint">Mínimo 20 caracteres</span>
            </div>

            <!-- Price -->
            <div class="input-group">
              <label for="hire-price">
                Precio propuesto (COP)&nbsp;<span style="color:var(--color-text-muted); font-weight:400; text-transform:none; font-size:11px;">— opcional</span>
              </label>
              <input
                type="number"
                id="hire-price"
                class="input"
                placeholder="Ej. 80000"
                min="0"
                step="1000"
              />
              <span class="input-hint">En pesos colombianos</span>
            </div>

            <!-- Error -->
            <div id="hire-error" style="display:none;"></div>

            <!-- Actions -->
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <button class="btn btn-primary" id="btn-hire-submit" style="flex:1; min-width:140px;">
                Enviar Solicitud
              </button>
              <button class="btn btn-outline" id="btn-modal-cancel" style="padding:12px 20px;">
                Cancelar
              </button>
            </div>

          </div>
        </div>
      </div>
    `;
  }

  // ── Event binding ───────────────────────────────────────────────────────
  function bindEvents() {
    // Nav links
    const q = id => container.querySelector(id);

    q('#nav-home')?.addEventListener('click', () => navigate('/'));
    q('#nav-explore')?.addEventListener('click', () => navigate('/explore'));
    q('#nav-profile')?.addEventListener('click', () => navigate('/profile'));

    q('#btn-logout')?.addEventListener('click', () => {
      clearToken();
      localStorage.removeItem('kamello_user');
      navigate('/');
    });

    // Header CTAs (client)
    q('#btn-go-explore')?.addEventListener('click', () => navigate('/explore'));
    q('#btn-nueva-solicitud')?.addEventListener('click', () => {
      modalOpen = true;
      render();
    });

    // Empty state CTAs
    q('#btn-empty-explore')?.addEventListener('click', () => navigate('/explore'));
    q('#btn-empty-profile')?.addEventListener('click', () => navigate('/profile'));

    // Kamellador: manage skills
    q('#btn-manage-skills')?.addEventListener('click', () => navigate('/profile'));

    // Modal close logic
    function closeModal() {
      modalOpen          = false;
      hireKamelladorId   = null;
      hireKamelladorName = null;
      hireSkills         = [];
      render();
    }

    q('#modal-close')?.addEventListener('click', closeModal);
    q('#btn-modal-cancel')?.addEventListener('click', closeModal);
    q('#btn-modal-explore')?.addEventListener('click', () => navigate('/explore'));

    // Click backdrop to close
    const overlay = q('#modal-overlay');
    if (overlay) {
      overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
    }

    // ESC key
    if (modalOpen) {
      const escFn = e => {
        if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', escFn); }
      };
      document.addEventListener('keydown', escFn);
    }

    // Hire form
    if (hireKamelladorId) bindHireFormEvents();

    // Operation status action buttons
    container.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const opId      = btn.dataset.id;
        const newStatus = btn.dataset.action;
        btn.disabled    = true;
        btn.innerHTML   = '<span class="spinner" style="width:14px;height:14px;border-width:2px;"></span>';
        try {
          await api.updateStatus(opId, newStatus);
          await loadOps();
        } catch (err) {
          showToast('Error: ' + err.message, 'error');
          render();
        }
      });
    });
  }

  function bindHireFormEvents() {
    const q        = id => container.querySelector(id);
    const descEl   = q('#hire-desc');
    const hintEl   = q('#hire-desc-hint');
    const skillEl  = q('#hire-skill');
    const priceEl  = q('#hire-price');
    const submitEl = q('#btn-hire-submit');
    const errorDiv = q('#hire-error');

    // Live description counter
    if (descEl && hintEl) {
      descEl.addEventListener('input', () => {
        const len = descEl.value.trim().length;
        hintEl.textContent = len < 20
          ? `Faltan ${20 - len} caracteres`
          : `✓ ${len} caracteres`;
        hintEl.style.color = len < 20
          ? 'var(--color-warning)'
          : 'var(--color-success)';
      });
    }

    if (submitEl) {
      submitEl.addEventListener('click', async () => {
        if (submittingHire) return;

        const skillId     = skillEl?.value || null;
        const description = descEl?.value.trim() || '';
        const rawPrice    = priceEl?.value;
        const price       = rawPrice !== '' && rawPrice !== null ? Number(rawPrice) : null;

        // Validate
        if (description.length < 20) {
          showHireError('La descripción debe tener al menos 20 caracteres.');
          descEl?.focus();
          return;
        }
        if (price !== null && (isNaN(price) || price < 0)) {
          showHireError('El precio propuesto debe ser un número positivo.');
          priceEl?.focus();
          return;
        }

        submittingHire       = true;
        submitEl.disabled    = true;
        submitEl.innerHTML   = '<span class="spinner" style="width:16px;height:16px;border-width:2px;"></span> Enviando…';

        try {
          const body = { kamellador_id: hireKamelladorId, description };
          if (skillId)        body.skill_id       = skillId;
          if (price !== null) body.proposed_price  = price;

          await api.createOp(body);

          // Success
          modalOpen          = false;
          hireKamelladorId   = null;
          hireKamelladorName = null;
          hireSkills         = [];
          submittingHire     = false;
          showToast('¡Solicitud enviada con éxito! 🎉', 'success');
          await loadOps();
        } catch (err) {
          submittingHire     = false;
          submitEl.disabled  = false;
          submitEl.innerHTML = 'Enviar Solicitud';
          showHireError(err.message || 'Error al enviar la solicitud. Inténtalo de nuevo.');
        }
      });
    }

    function showHireError(msg) {
      if (!errorDiv) return;
      errorDiv.style.display = 'block';
      errorDiv.innerHTML = `<div class="alert alert-error">${msg}</div>`;
    }
  }

  // ── Toast ───────────────────────────────────────────────────────────────
  function showToast(msg, type = 'success') {
    document.querySelector('.kamello-toast')?.remove();

    const toast = document.createElement('div');
    toast.className = 'kamello-toast';
    const isSuccess = type === 'success';
    Object.assign(toast.style, {
      position:       'fixed',
      bottom:         '32px',
      left:           '50%',
      transform:      'translateX(-50%) translateY(16px)',
      opacity:        '0',
      background:     isSuccess ? 'rgba(16,185,129,0.15)'  : 'rgba(239,68,68,0.15)',
      border:         `1px solid ${isSuccess ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
      color:          isSuccess ? '#6EE7B7' : '#FCA5A5',
      padding:        '12px 24px',
      borderRadius:   '999px',
      fontSize:       '14px',
      fontWeight:     '600',
      fontFamily:     'var(--font-family)',
      zIndex:         '9999',
      backdropFilter: 'blur(12px)',
      whiteSpace:     'nowrap',
      boxShadow:      '0 8px 24px rgba(0,0,0,0.3)',
      transition:     'all 300ms cubic-bezier(0.16, 1, 0.3, 1)',
    });
    toast.textContent = msg;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(-50%) translateY(0)';
      toast.style.opacity   = '1';
    });

    setTimeout(() => {
      toast.style.transform = 'translateX(-50%) translateY(16px)';
      toast.style.opacity   = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // ── Data loaders ────────────────────────────────────────────────────────
  async function loadOps() {
    try {
      operations = await api.getOps();
    } catch (_) {
      operations = [];
    }
    loadingOps = false;
    render();
  }

  async function loadMySkills() {
    if (!isKamellador) return;
    try {
      mySkills = await api.getMySkills();
    } catch (_) {
      mySkills = [];
    }
    loadingSkills = false;
    render();
  }

  async function loadHireSkills() {
    if (!hireKamelladorId) return;
    try {
      hireSkills = await api.getSkills();
    } catch (_) {
      hireSkills = [];
    }
    render();
  }

  // ── Bootstrap ───────────────────────────────────────────────────────────
  render();
  loadOps();
  if (isKamellador) loadMySkills();
  if (hireKamelladorId) loadHireSkills();
}
