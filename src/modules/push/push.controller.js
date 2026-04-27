import webpush from 'web-push';
import { supabaseService } from '../../lib/supabaseAdmin.js';
import { AppError } from '../../utils/errors.js';

// Configurar Web Push
webpush.setVapidDetails(
  'mailto:soporte@kamello.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export const subscribe = async (req, res, next) => {
  try {
    // El frontend puede insertar directamente en Supabase si usa su cliente autenticado,
    // pero si lo manda por aquí, lo insertamos con el service_role (requiere user_id en el body).
    res.status(200).json({ success: true, message: "Use frontend supabase client to insert into push_subscriptions." });
  } catch (err) {
    next(err);
  }
};

export const sendNotification = async (req, res, next) => {
  try {
    const { userId, title, body, data } = req.body;
    
    if (!userId || !title || !body) {
      throw new AppError('Faltan parámetros requeridos (userId, title, body)', 400, 'BAD_REQUEST');
    }

    // 1. Obtener todas las suscripciones de ese usuario
    const { data: subs, error } = await supabaseService
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw new AppError('Error obteniendo suscripciones', 500, 'DB_ERROR');
    }

    if (!subs || subs.length === 0) {
      return res.status(200).json({ success: false, message: 'El usuario no tiene suscripciones push activas.' });
    }

    const payload = JSON.stringify({
      title,
      body,
      data: data || { url: '/' }
    });

    // 2. Enviar la notificación a cada dispositivo registrado
    const sendPromises = subs.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      try {
        await webpush.sendNotification(pushSubscription, payload);
      } catch (err) {
        // Si el endpoint expiró o ya no es válido, lo eliminamos de la BD
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabaseService.from('push_subscriptions').delete().eq('id', sub.id);
        } else {
          console.error('Error enviando push al endpoint:', sub.endpoint, err);
        }
      }
    });

    await Promise.all(sendPromises);

    res.status(200).json({ success: true, message: 'Notificación enviada' });
  } catch (err) {
    next(err);
  }
};
