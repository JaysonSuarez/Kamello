/**
 * @file verify-email.js
 * Pantalla informativa para que el Kamellador verifique su correo.
 */
import { navigate } from '../router.js';

export function renderVerifyEmail(container) {
  const user = JSON.parse(localStorage.getItem('kamello_user') || '{}');

  container.innerHTML = `
    <div class="auth-page page-enter">
      <div class="card auth-card text-center" style="max-width: 480px;">
        <div class="verify-icon-animate">
          <div class="icon-circle">✉️</div>
          <div class="icon-waves">
            <span></span><span></span><span></span>
          </div>
        </div>
        
        <h2 class="text-gradient" style="margin-bottom: 16px;">¡Casi listo, ${user.full_name?.split(' ')[0] || 'Kamellador'}!</h2>
        <p style="color: var(--color-text-secondary); margin-bottom: 24px; line-height: 1.6;">
          Para activar tu perfil de técnico y empezar a recibir trabajos, 
          necesitamos que confirmes tu dirección de correo electrónico.
        </p>

        <div class="verify-box">
          <p style="font-size: 14px; font-weight: 600; margin-bottom: 4px;">Revisa tu bandeja de entrada:</p>
          <p style="font-family: monospace; color: var(--color-brand); font-size: 16px;">
            ${user.email || 'tu-correo@ejemplo.com'}
          </p>
        </div>

        <div style="margin-top: 32px; display: flex; flex-direction: column; gap: 12px;">
          <button class="btn btn-primary btn-lg" id="btn-open-email">Abrir mi correo</button>
          <button class="btn btn-ghost" id="btn-resend">No recibí nada, reenviar</button>
        </div>

        <p style="margin-top: 24px; font-size: 13px; color: var(--color-text-secondary);">
          <a href="/auth" data-link style="color: var(--color-text); text-decoration: underline;">¿Usaste el correo equivocado?</a>
        </p>
      </div>
    </div>
  `;

  // Estilos rápidos específicos para esta página
  const style = document.createElement('style');
  style.textContent = `
    .verify-icon-animate {
      position: relative;
      width: 80px;
      height: 80px;
      margin: 0 auto 32px;
    }
    .icon-circle {
      position: relative;
      z-index: 2;
      width: 80px;
      height: 80px;
      background: var(--color-brand-gradient);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      box-shadow: 0 10px 25px rgba(249, 115, 22, 0.3);
    }
    .verify-box {
      background: rgba(255, 255, 255, 0.03);
      border: 1px border;
      border-color: rgba(255, 255, 255, 0.1);
      padding: 16px;
      border-radius: 12px;
    }
    .icon-waves span {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: var(--color-brand);
      border-radius: 50%;
      opacity: 0.4;
      animation: wave-ping 2s infinite;
    }
    .icon-waves span:nth-child(2) { animation-delay: 0.5s; }
    .icon-waves span:nth-child(3) { animation-delay: 1s; }
    @keyframes wave-ping {
      0% { transform: scale(1); opacity: 0.4; }
      100% { transform: scale(2.5); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  // Eventos
  container.querySelector('#btn-open-email').onclick = () => {
    window.open('https://mail.google.com/', '_blank');
  };
  
  container.querySelector('#btn-resend').onclick = (e) => {
    e.target.innerText = '¡Enviado de nuevo! ✓';
    e.target.classList.add('text-gradient');
    setTimeout(() => {
      if(e.target) e.target.innerText = 'No recibí nada, reenviar';
    }, 3000);
  };
}
