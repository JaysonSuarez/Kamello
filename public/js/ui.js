const TOAST_ROOT_ID = 'kamello-toast-root';

function ensureToastRoot() {
  let root = document.getElementById(TOAST_ROOT_ID);
  if (!root) {
    root = document.createElement('div');
    root.id = TOAST_ROOT_ID;
    root.className = 'toast-stack';
    root.setAttribute('aria-live', 'polite');
    root.setAttribute('aria-atomic', 'true');
    document.body.appendChild(root);
  }
  return root;
}

export function showToast(message, type = 'info', duration = 3200) {
  const root = ensureToastRoot();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'status');
  toast.innerHTML = `
    <div class="toast-icon" aria-hidden="true">${getToastIcon(type)}</div>
    <div class="toast-content">
      <strong>${getToastTitle(type)}</strong>
      <span>${escapeHtml(message)}</span>
    </div>
  `;

  root.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast-visible'));

  const close = () => {
    toast.classList.remove('toast-visible');
    setTimeout(() => toast.remove(), 220);
  };

  setTimeout(close, duration);
  return close;
}

export function upsertFieldHint(input, message = '', state = '') {
  if (!input?.id) return;

  let hint = document.getElementById(`${input.id}-hint`);
  if (!hint) {
    hint = document.createElement('div');
    hint.id = `${input.id}-hint`;
    hint.className = 'field-hint';
    input.insertAdjacentElement('afterend', hint);
  }

  hint.textContent = message;
  hint.className = `field-hint${state ? ` is-${state}` : ''}`;
  input.setAttribute('aria-describedby', hint.id);
  input.setAttribute('aria-invalid', state === 'error' ? 'true' : 'false');
}

export function clearFieldHint(input) {
  if (!input?.id) return;
  const hint = document.getElementById(`${input.id}-hint`);
  if (hint) hint.remove();
  input.removeAttribute('aria-describedby');
  input.removeAttribute('aria-invalid');
}

export function validateEmail(value = '') {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function validatePhone(value = '') {
  return /^\+?[1-9]\d{9,14}$/.test(value.trim());
}

export function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getToastIcon(type) {
  if (type === 'success') return '✓';
  if (type === 'error') return '!';
  if (type === 'warning') return '•';
  return 'i';
}

function getToastTitle(type) {
  if (type === 'success') return 'Listo';
  if (type === 'error') return 'Atencion';
  if (type === 'warning') return 'Revisa esto';
  return 'Kamello';
}
