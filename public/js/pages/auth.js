/**
 * @file auth.js
 * Pantalla de autenticación — OTP por email/teléfono.
 * Dos pasos: 1) solicitar código, 2) verificar código.
 */
import { navigate } from '../router.js';
import { api, setToken, isLoggedIn } from '../api.js';
import { clearFieldHint, showToast, upsertFieldHint, validateEmail, validatePhone } from '../ui.js';

export function renderAuth(container) {
  if (isLoggedIn()) {
    navigate('/dashboard');
    return;
  }

  // State
  let step = 1;
  let method = 'email';
  let contact = '';
  let fullName = '';
  let role = 'client';
  let otp = '';
  let loading = false;
  let error = null;
  let touched = {
    contact: false,
    fullName: false,
    otp: false,
  };

  function getContactError() {
    if (!contact.trim()) return `Ingresa tu ${method === 'phone' ? 'telefono' : 'correo'} para continuar.`;
    if (method === 'phone' && !validatePhone(contact)) return 'Usa formato internacional, por ejemplo +573001234567.';
    if (method === 'email' && !validateEmail(contact)) return 'Ingresa un correo valido.';
    return '';
  }

  function getFullNameError() {
    if (!fullName.trim()) return 'Tu nombre ayuda a personalizar tu perfil.';
    if (fullName.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres.';
    return '';
  }

  function getOtpError() {
    if (!otp) return 'Ingresa el codigo de 6 digitos.';
    if (otp.length !== 6) return 'El codigo debe tener exactamente 6 digitos.';
    return '';
  }

  function isStep1Valid() {
    return !getContactError() && !getFullNameError();
  }

  function isStep2Valid() {
    return !getOtpError();
  }

  function render() {
    container.innerHTML = `
      <div class="auth-page page-enter">
        <div class="card auth-card">
          <div class="auth-header">
            <h2>Kamello 🐪</h2>
            <p>${step === 1 ? 'Ingresa a tu cuenta o regístrate' : 'Verifica tu identidad'}</p>
          </div>
          <div class="auth-body">
            <div class="auth-progress" aria-hidden="true">
              <span class="auth-progress-step ${step >= 1 ? 'active' : ''}"></span>
              <span class="auth-progress-step ${step >= 2 ? 'active' : ''}"></span>
            </div>
            ${error ? `<div class="alert alert-error">${error}</div>` : ''}
            ${step === 1 ? renderStep1() : renderStep2()}
          </div>
        </div>
      </div>
    `;
    bindEvents();
  }

  function renderStep1() {
    return `
      <!-- Método -->
      <div class="input-group">
        <label>Método de ingreso</label>
        <div class="toggle-group">
          <div class="toggle-item ${method === 'phone' ? 'active' : ''}" data-method="phone">
            <span class="icon">📱</span>
            <span class="toggle-title">SMS</span>
            <span class="toggle-desc">Código por mensaje</span>
          </div>
          <div class="toggle-item ${method === 'email' ? 'active' : ''}" data-method="email">
            <span class="icon">✉️</span>
            <span class="toggle-title">Email</span>
            <span class="toggle-desc">Código por correo</span>
          </div>
        </div>
      </div>

      <!-- Contacto -->
      <div class="input-group">
        <label>${method === 'phone' ? 'Número de teléfono' : 'Correo electrónico'}</label>
        <input
          type="${method === 'phone' ? 'tel' : 'email'}"
          class="input"
          id="input-contact"
          placeholder="${method === 'phone' ? '+573001234567' : 'correo@ejemplo.com'}"
          value="${contact}"
          required
        />
        <span class="input-hint">${method === 'phone' ? 'Recibiras un SMS de acceso.' : 'Usaremos este correo para enviarte el codigo.'}</span>
      </div>

      <!-- Nombre -->
      <div class="input-group">
        <label>Tu nombre completo</label>
        <input type="text" class="input" id="input-name" placeholder="Juan Pérez" value="${fullName}" required />
        <span class="input-hint">Solo se usará si eres un nuevo usuario.</span>
      </div>

      <!-- Rol -->
      <div class="input-group">
        <label>¿Cómo usarás Kamello?</label>
        <div class="toggle-group">
          <div class="toggle-item ${role === 'client' ? 'active' : ''}" data-role="client">
            <span class="icon">🏠</span>
            <span class="toggle-title">Cliente</span>
            <span class="toggle-desc">Busco técnicos</span>
          </div>
          <div class="toggle-item ${role === 'kamellador' ? 'active' : ''}" data-role="kamellador">
            <span class="icon">🔧</span>
            <span class="toggle-title">Kamellador</span>
            <span class="toggle-desc">Ofrezco servicios</span>
          </div>
        </div>
      </div>

      <!-- Submit -->
      <button class="btn btn-primary btn-lg" id="btn-send" ${loading ? 'disabled' : ''}>
        ${loading ? '<span class="spinner"></span> Enviando...' : 'Recibir Código →'}
      </button>

      <div class="text-center">
        <a href="/" data-link class="btn btn-ghost">← Volver al inicio</a>
      </div>
    `;
  }

  function renderStep2() {
    return `
      <div class="text-center">
        <div class="otp-icon-wrap">🔐</div>
        <h3 style="font-size:18px; font-weight:700; margin-bottom:4px;">Ingresa el código</h3>
        <p style="font-size:14px; color:var(--color-text-secondary);">
          Enviamos un código de 6 dígitos a<br/>
          <strong style="color:var(--color-text);">${contact}</strong>
        </p>
      </div>

      <div class="input-group">
        <input
          type="text"
          class="input input-otp"
          id="input-otp"
          maxlength="6"
          placeholder="------"
          value="${otp}"
          autocomplete="one-time-code"
        />
        <span class="input-hint">Si no lo ves, revisa spam o cambia el método de ingreso.</span>
      </div>

      <button class="btn btn-primary btn-lg" id="btn-verify" ${loading || !isStep2Valid() ? 'disabled' : ''}>
        ${loading ? '<span class="spinner"></span> Verificando...' : 'Confirmar y Entrar'}
      </button>

      <div class="text-center">
        <button class="btn btn-ghost" id="btn-back">
          Cambiar ${method === 'phone' ? 'número' : 'correo'} o reenviar
        </button>
      </div>
    `;
  }

  function bindEvents() {
    const syncHints = () => {
      const contactInput = container.querySelector('#input-contact');
      const nameInput = container.querySelector('#input-name');
      const otpInput = container.querySelector('#input-otp');

      if (contactInput && touched.contact) {
        const contactError = getContactError();
        if (contactError) {
          upsertFieldHint(contactInput, contactError, 'error');
        } else {
          upsertFieldHint(contactInput, method === 'phone' ? 'Formato correcto. Te enviaremos un SMS.' : 'Correo listo para recibir el codigo.', 'success');
        }
      } else if (contactInput) {
        clearFieldHint(contactInput);
      }

      if (nameInput && touched.fullName) {
        const nameError = getFullNameError();
        if (nameError) {
          upsertFieldHint(nameInput, nameError, 'error');
        } else {
          upsertFieldHint(nameInput, 'Perfecto, asi aparecera tu perfil.', 'success');
        }
      } else if (nameInput) {
        clearFieldHint(nameInput);
      }

      if (otpInput && touched.otp) {
        const otpError = getOtpError();
        if (otpError) {
          upsertFieldHint(otpInput, otpError, 'error');
        } else {
          upsertFieldHint(otpInput, 'Codigo completo. Ya puedes entrar.', 'success');
        }
      } else if (otpInput) {
        clearFieldHint(otpInput);
      }
    };

    // Method toggles
    container.querySelectorAll('[data-method]').forEach(el => {
      el.addEventListener('click', () => {
        method = el.dataset.method;
        touched.contact = false;
        error = null;
        render();
      });
    });

    // Role toggles
    container.querySelectorAll('[data-role]').forEach(el => {
      el.addEventListener('click', () => {
        role = el.dataset.role;
        render();
      });
    });

    // Input sync
    const contactInput = container.querySelector('#input-contact');
    if (contactInput) {
      contactInput.addEventListener('input', (e) => {
        contact = e.target.value.trim();
        touched.contact = true;
        syncHints();
        const btn = container.querySelector('#btn-send');
        if (btn) btn.disabled = loading || !isStep1Valid();
      });
      contactInput.addEventListener('blur', () => {
        touched.contact = true;
        syncHints();
      });
      contactInput.focus();
    }

    const nameInput = container.querySelector('#input-name');
    if (nameInput) {
      nameInput.addEventListener('input', (e) => {
        fullName = e.target.value;
        touched.fullName = true;
        syncHints();
        const btn = container.querySelector('#btn-send');
        if (btn) btn.disabled = loading || !isStep1Valid();
      });
      nameInput.addEventListener('blur', () => {
        touched.fullName = true;
        syncHints();
      });
    }

    const otpInput = container.querySelector('#input-otp');
    if (otpInput) {
      otpInput.addEventListener('input', (e) => {
        otp = e.target.value.replace(/[^0-9]/g, '');
        e.target.value = otp;
        touched.otp = true;
        syncHints();
        const btn = container.querySelector('#btn-verify');
        if (btn) btn.disabled = loading || !isStep2Valid();
      });
      otpInput.addEventListener('blur', () => {
        touched.otp = true;
        syncHints();
      });
      otpInput.focus();
    }

    // Send OTP
    const btnSend = container.querySelector('#btn-send');
    if (btnSend) {
      btnSend.addEventListener('click', async () => {
        touched.contact = true;
        touched.fullName = true;
        syncHints();
        if (!isStep1Valid()) {
          error = getContactError() || getFullNameError();
          render();
          return;
        }
        loading = true;
        error = null;
        render();
        try {
          await api.sendOtp({ contact, role, full_name: fullName });
          step = 2;
          touched.otp = false;
          showToast(`Codigo enviado a ${contact}.`, 'success');
        } catch (err) {
          error = err.message || 'Error al enviar el código.';
          showToast(error, 'error');
        }
        loading = false;
        render();
      });
    }

    // Verify OTP
    const btnVerify = container.querySelector('#btn-verify');
    if (btnVerify) {
      btnVerify.addEventListener('click', async () => {
        touched.otp = true;
        syncHints();
        if (!isStep2Valid()) {
          error = getOtpError();
          render();
          return;
        }
        loading = true;
        error = null;
        render();
        try {
          const data = await api.verifyOtp({ contact, token: otp });
          setToken(data.accessToken);
          // Guardar info del usuario
          localStorage.setItem('kamello_user', JSON.stringify(data.user));
          showToast('Sesion iniciada correctamente.', 'success');
          
          if (data.user?.role === 'kamellador') {
            navigate('/verify-email');
          } else {
            navigate('/dashboard');
          }
        } catch (err) {
          error = err.message || 'Código incorrecto o expirado.';
          showToast(error, 'error');
          loading = false;
          render();
        }
      });
    }

    // Back
    const btnBack = container.querySelector('#btn-back');
    if (btnBack) {
      btnBack.addEventListener('click', () => {
        step = 1;
        otp = '';
        touched.otp = false;
        error = null;
        render();
      });
    }

    syncHints();
  }

  render();
}
