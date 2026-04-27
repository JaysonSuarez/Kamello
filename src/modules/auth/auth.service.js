/**
 * @file auth.service.js
 * @description Lógica de negocio del módulo de autenticación.
 * Detecta automáticamente si el contacto es Email o Phone.
 */

import { supabaseAnon, supabaseAdmin } from '../../config/supabase.js';

const VALID_ROLES = ['client', 'kamellador'];

/**
 * Helper para detectar tipo de contacto.
 * @param {string} contact 
 * @returns {'email' | 'phone'}
 */
function getContactType(contact) {
  return contact.includes('@') ? 'email' : 'phone';
}

/**
 * Envía un OTP al usuario.
 * Detecta si es email o teléfono automáticamente.
 */
export async function sendOtp({ contact, role, full_name }) {
  if (!VALID_ROLES.includes(role)) {
    const err = new Error(`Rol inválido: "${role}". Roles permitidos: ${VALID_ROLES.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  const type = getContactType(contact);
  const options = {
    data: { role, full_name },
    shouldCreateUser: true,
  };

  const { error } = await supabaseAnon.auth.signInWithOtp({
    [type]: contact,
    options,
  });

  if (error) {
    // Si falla el envío por teléfono es probable que no esté configurado el provider localmente.
    const err = new Error(`Error Supabase [${type}]: ${error.message}`);
    err.statusCode = 502;
    throw err;
  }

  return {
    message: `Código enviado a ${contact} vía ${type}.`,
  };
}

/**
 * Verifica el OTP ingresado.
 * Mantiene coherencia con el tipo de contacto detectado.
 */
export async function verifyOtp({ contact, token }) {
  const type = getContactType(contact);
  
  const { data, error } = await supabaseAnon.auth.verifyOtp({
    [type]: contact,
    token,
    type: type === 'phone' ? 'sms' : 'email',
  });

  if (error || !data?.session) {
    const err = new Error(error?.message || 'Código incorrecto o expirado.');
    err.statusCode = 401;
    throw err;
  }

  const { session, user: authUser } = data;

  // Leer el perfil creado por el trigger
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, role, full_name, avatar_url, is_active, created_at')
    .eq('id', authUser.id)
    .single();

  if (profileError || !profile) {
    const err = new Error('Error al sincronizar perfil. Contacta soporte.');
    err.statusCode = 500;
    throw err;
  }

  return {
    accessToken:  session.access_token,
    refreshToken: session.refresh_token,
    expiresAt:    session.expires_at,
    user:         profile,
  };
}

export async function getMe(userId) {
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    const err = new Error('Perfil no encontrado.');
    err.statusCode = 404;
    throw err;
  }

  return profile;
}
