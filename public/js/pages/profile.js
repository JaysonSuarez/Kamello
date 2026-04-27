/**
 * @file profile.js
 * Página de perfil — edición de datos personales y gestión de habilidades.
 * Accesible en /profile para clientes y kamelladores.
 */
import { navigate } from '../router.js';
import { api, isLoggedIn } from '../api.js';
import { showToast, upsertFieldHint, validatePhone } from '../ui.js';

export function renderProfile(container) {
  if (!isLoggedIn()) {
    navigate('/auth');
    return;
  }

  // State
  let profile = null;
  let mySkills = [];
  let allSkills = [];
  let categories = [];
  let loadingProfile = true;
  let savingProfile = false;
  let addingSkill = false;
  let selectedCategoryId = '';
  let profileMsg = null; // { type: 'success'|'error', text }
  let skillMsg = null;

  function validateProfileForm(fullName, phone) {
    if (!fullName) return 'El nombre no puede estar vacio.';
    if (fullName.length < 2) return 'El nombre debe tener al menos 2 caracteres.';
    if (phone && !validatePhone(phone)) return 'Usa un telefono valido en formato internacional.';
    return '';
  }

  // ── Render ───────────────────────────────────────────────────────

  function getInitials(name) {
    if (!name) return '?';
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(w => w[0].toUpperCase())
      .join('');
  }

  function renderSkillItem(ks) {
    const skillName = ks.skills?.name || '—';
    const categoryName = ks.skills?.categories?.name || '';
    const years = ks.experience_years ?? 0;
    const skillId = ks.skill_id;
    return `
      <li class="skill-item" data-skill-id="${skillId}">
        <div class="skill-item-info">
          <span class="skill-item-name">${skillName}</span>
          ${categoryName ? `<span class="skill-item-cat">${categoryName}</span>` : ''}
        </div>
        <span class="years-badge">${years} año${years !== 1 ? 's' : ''}</span>
        <button class="btn-remove-skill" data-skill-id="${skillId}" title="Eliminar habilidad" aria-label="Eliminar ${skillName}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </li>
    `;
  }

  function filteredSkills() {
    if (!selectedCategoryId) return allSkills;
    return allSkills.filter(s => String(s.category_id) === String(selectedCategoryId));
  }

  function render() {
    if (loadingProfile) {
      container.innerHTML = `
        <div class="profile-page page-enter">
          <nav class="nav scrolled">
            <div class="container nav-inner">
              <div class="nav-logo"><span class="text-gradient">Kamello</span> 🐪</div>
              <div class="nav-links">
                <a href="/dashboard" data-link class="btn btn-ghost">← Dashboard</a>
              </div>
            </div>
          </nav>
          <div class="container" style="padding-top:120px; text-align:center;">
            <span class="spinner" style="margin:auto; width:32px; height:32px; border-width:3px;"></span>
            <p style="color:var(--color-text-muted); margin-top:16px;">Cargando perfil...</p>
          </div>
        </div>
      `;
      return;
    }

    const isKamellador = profile?.role === 'kamellador';
    const initials = getInitials(profile?.full_name);
    const skills = filteredSkills();

    container.innerHTML = `
      <div class="profile-page page-enter">

        <!-- Nav -->
        <nav class="nav scrolled">
          <div class="container nav-inner">
            <div class="nav-logo"><span class="text-gradient">Kamello</span> 🐪</div>
            <div class="nav-links">
              <a href="/dashboard" data-link class="btn btn-ghost" style="font-size:14px;">← Dashboard</a>
            </div>
          </div>
        </nav>

        <div class="container" style="padding-top:100px; padding-bottom:60px; max-width:720px;">

          <!-- Profile Header -->
          <div class="profile-header">
            <div class="profile-avatar-lg">${initials}</div>
            <div>
              <h1 style="font-size:1.6rem; font-weight:800; letter-spacing:-0.5px;">
                ${profile?.full_name || 'Mi Perfil'}
              </h1>
              <p style="color:var(--color-text-secondary); font-size:14px; margin-top:2px;">
                ${isKamellador ? '🔧 Kamellador' : '🏠 Cliente'} · ${profile?.phone || 'Sin teléfono'}
              </p>
            </div>
          </div>

          <!-- Edit Profile Section -->
          <div class="profile-section card">
            <div class="profile-section-header">
              <span class="profile-section-icon" style="background:rgba(249,115,22,0.12);">👤</span>
              <h2>Información Personal</h2>
            </div>

            ${profileMsg ? `<div class="alert alert-${profileMsg.type}" id="profile-alert">${profileMsg.text}</div>` : ''}

            <form id="form-profile" novalidate>
              <div class="form-row">
                <div class="input-group" style="flex:1;">
                  <label for="inp-fullname">Nombre completo</label>
                  <input
                    id="inp-fullname"
                    class="input"
                    type="text"
                    placeholder="Tu nombre y apellido"
                    value="${profile?.full_name || ''}"
                    autocomplete="name"
                  />
                </div>
                <div class="input-group" style="flex:1;">
                  <label for="inp-phone">Teléfono</label>
                  <input
                    id="inp-phone"
                    class="input"
                    type="tel"
                    placeholder="+57 300 000 0000"
                    value="${profile?.phone || ''}"
                    autocomplete="tel"
                  />
                </div>
              </div>
              <div style="margin-top:20px; display:flex; justify-content:flex-end;">
                <button type="submit" class="btn btn-primary" id="btn-save-profile" ${savingProfile ? 'disabled' : ''}>
                  ${savingProfile
                    ? '<span class="spinner"></span> Guardando…'
                    : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>

          ${isKamellador ? renderSkillsSection() : ''}

        </div>
      </div>
    `;

    bindEvents();
  }

  function renderSkillsSection() {
    const skills = filteredSkills();

    return `
      <!-- Skills Section -->
      <div class="profile-section card" style="margin-top:24px;">
        <div class="profile-section-header">
          <span class="profile-section-icon" style="background:rgba(6,182,212,0.12);">🛠️</span>
          <h2>Mis Habilidades</h2>
        </div>

        ${skillMsg ? `<div class="alert alert-${skillMsg.type}" id="skill-alert">${skillMsg.text}</div>` : ''}

        <!-- Current Skills List -->
        ${mySkills.length === 0
          ? `<div class="empty-state" style="padding:32px 20px;">
               <div class="icon" style="font-size:36px;">🎯</div>
               <p>Aún no has agregado habilidades.</p>
               <p style="font-size:13px; margin-top:4px;">Agrega tus especialidades para que los clientes puedan encontrarte.</p>
             </div>`
          : `<ul class="skills-list" id="skills-list">
               ${mySkills.map(renderSkillItem).join('')}
             </ul>`
        }

        <!-- Add Skill Form -->
        <div class="skill-form-wrapper">
          <h3 style="font-size:14px; font-weight:700; color:var(--color-text-secondary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:14px;">
            Agregar Habilidad
          </h3>
          <form id="form-add-skill" novalidate>
            <div class="skill-form">
              <div class="input-group" style="flex:1; min-width:160px;">
                <label for="sel-category">Categoría</label>
                <select id="sel-category" class="input">
                  <option value="">— Selecciona —</option>
                  ${categories.map(c => `<option value="${c.id}" ${String(c.id) === String(selectedCategoryId) ? 'selected' : ''}>${c.name}</option>`).join('')}
                </select>
              </div>
              <div class="input-group" style="flex:1.4; min-width:180px;">
                <label for="sel-skill">Habilidad</label>
                <select id="sel-skill" class="input" ${!selectedCategoryId ? 'disabled' : ''}>
                  <option value="">${!selectedCategoryId ? 'Primero elige categoría' : '— Selecciona —'}</option>
                  ${selectedCategoryId
                    ? skills.map(s => `<option value="${s.id}">${s.name}</option>`).join('')
                    : ''}
                </select>
              </div>
              <div class="input-group" style="width:120px; flex-shrink:0;">
                <label for="inp-years">Años exp.</label>
                <input
                  id="inp-years"
                  class="input"
                  type="number"
                  min="0"
                  max="50"
                  placeholder="0"
                  value="1"
                />
              </div>
              <div class="input-group" style="justify-content:flex-end; padding-top:22px; flex-shrink:0;">
                <button type="submit" class="btn btn-primary" id="btn-add-skill" ${addingSkill ? 'disabled' : ''} style="white-space:nowrap;">
                  ${addingSkill
                    ? '<span class="spinner"></span>'
                    : '+ Agregar'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  // ── Event Binding ─────────────────────────────────────────────

  function bindEvents() {
    // Profile form
    const formProfile = container.querySelector('#form-profile');
    if (formProfile) {
      const fullNameInput = container.querySelector('#inp-fullname');
      const phoneInput = container.querySelector('#inp-phone');

      const syncProfileHints = () => {
        const fullName = fullNameInput.value.trim();
        const phone = phoneInput.value.trim().replace(/\s+/g, '');

        const error = validateProfileForm(fullName, phone);
        if (error) {
          upsertFieldHint(fullNameInput, 'Este nombre aparecera en tu perfil.', '');
        } else if (fullName.length < 2) {
          upsertFieldHint(fullNameInput, 'El nombre debe tener al menos 2 caracteres.', 'error');
        } else {
          upsertFieldHint(fullNameInput, 'Nombre listo para guardar.', 'success');
        }

        if (!phone) {
          upsertFieldHint(phoneInput, 'Opcional. Te ayuda a coordinar mejor los trabajos.', '');
        } else if (!validatePhone(phone)) {
          upsertFieldHint(phoneInput, 'Usa formato internacional, por ejemplo +573001234567.', 'error');
        } else {
          upsertFieldHint(phoneInput, 'Telefono valido.', 'success');
        }
      };

      fullNameInput?.addEventListener('input', syncProfileHints);
      phoneInput?.addEventListener('input', syncProfileHints);
      syncProfileHints();

      formProfile.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullName = fullNameInput.value.trim();
        const phone = phoneInput.value.trim().replace(/\s+/g, '');
        const error = validateProfileForm(fullName, phone);
        if (error) {
          profileMsg = { type: 'error', text: 'El nombre no puede estar vacío.' };
          showToast(error, 'error');
          render();
          return;
        }
        savingProfile = true;
        profileMsg = null;
        render();
        try {
          const updated = await api.updateProfile({ full_name: fullName, phone });
          profile = { ...profile, ...updated };
          // Keep local user cache in sync
          const stored = JSON.parse(localStorage.getItem('kamello_user') || '{}');
          localStorage.setItem('kamello_user', JSON.stringify({ ...stored, full_name: updated.full_name, phone: updated.phone }));
          profileMsg = { type: 'success', text: 'Perfil actualizado correctamente.' };
          showToast('Perfil actualizado correctamente.', 'success');
        } catch (err) {
          profileMsg = { type: 'error', text: err.message || 'Error al guardar el perfil.' };
          showToast(profileMsg.text, 'error');
        } finally {
          savingProfile = false;
          render();
        }
      });
    }

    // Category selector → filter skills
    const selCategory = container.querySelector('#sel-category');
    if (selCategory) {
      selCategory.addEventListener('change', () => {
        selectedCategoryId = selCategory.value;
        render();
      });
    }

    // Add skill form
    const formSkill = container.querySelector('#form-add-skill');
    if (formSkill) {
      formSkill.addEventListener('submit', async (e) => {
        e.preventDefault();
        const skillId = container.querySelector('#sel-skill')?.value;
        const years = parseInt(container.querySelector('#inp-years')?.value || '0', 10);

        if (!skillId) {
          skillMsg = { type: 'error', text: 'Debes seleccionar una habilidad.' };
          render();
          return;
        }
        if (isNaN(years) || years < 0 || years > 50) {
          skillMsg = { type: 'error', text: 'Los años de experiencia deben estar entre 0 y 50.' };
          render();
          return;
        }

        const alreadyAdded = mySkills.some(ks => String(ks.skill_id) === String(skillId));
        if (alreadyAdded) {
          skillMsg = { type: 'error', text: 'Ya tienes esa habilidad en tu perfil.' };
          render();
          return;
        }

        addingSkill = true;
        skillMsg = null;
        render();
        try {
          await api.addMySkill({ skill_id: skillId, experience_years: years });
          await loadMySkills();
          skillMsg = { type: 'success', text: 'Habilidad agregada exitosamente.' };
          showToast('Habilidad agregada.', 'success');
        } catch (err) {
          skillMsg = { type: 'error', text: err.message || 'Error al agregar habilidad.' };
          showToast(skillMsg.text, 'error');
        } finally {
          addingSkill = false;
          render();
        }
      });
    }

    // Remove skill buttons
    container.querySelectorAll('.btn-remove-skill').forEach(btn => {
      btn.addEventListener('click', async () => {
        const skillId = btn.dataset.skillId;
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner" style="width:12px;height:12px;border-width:2px;"></span>';
        try {
          await api.deleteMySkill(skillId);
          mySkills = mySkills.filter(ks => String(ks.skill_id) !== String(skillId));
          skillMsg = null;
          showToast('Habilidad eliminada.', 'success');
          render();
        } catch (err) {
          skillMsg = { type: 'error', text: err.message || 'Error al eliminar habilidad.' };
          showToast(skillMsg.text, 'error');
          render();
        }
      });
    });

    // Auto-dismiss alerts after 4 s
    setTimeout(() => {
      if (profileMsg?.type === 'success') { profileMsg = null; }
      if (skillMsg?.type === 'success')   { skillMsg   = null; }
    }, 4000);
  }

  // ── Data Loading ──────────────────────────────────────────────

  async function loadMySkills() {
    try {
      mySkills = await api.getMySkills();
    } catch {
      mySkills = [];
    }
  }

  async function init() {
    try {
      [profile] = await Promise.all([api.getProfile()]);
    } catch (err) {
      // Token likely expired
      navigate('/auth');
      return;
    }

    loadingProfile = false;

    if (profile?.role === 'kamellador') {
      try {
        [categories, allSkills] = await Promise.all([
          api.getCategories(),
          api.getSkills(),
        ]);
      } catch {
        categories = [];
        allSkills = [];
      }
      await loadMySkills();
    }

    render();
  }

  // Boot
  render(); // show spinner immediately
  init();
}
