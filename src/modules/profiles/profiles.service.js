import { supabaseAdmin } from '../../config/supabase.js';

export async function getKamelladores({ category_id, skill_id, search } = {}) {
  // Fetch active kamellador profiles
  let query = supabaseAdmin
    .from('profiles')
    .select('*, kamellador_skills(*, skills(id, name, categories(id, name)))')
    .eq('role', 'kamellador')
    .eq('is_active', true);

  if (search) {
    query = query.ilike('full_name', `%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    const err = new Error('Error al obtener kamelladores');
    err.statusCode = 500;
    throw err;
  }

  // Post-filter by category_id or skill_id if needed
  let results = data || [];

  if (skill_id) {
    results = results.filter(k =>
      (k.kamellador_skills || []).some(ks => String(ks.skill_id) === String(skill_id))
    );
  }

  if (category_id) {
    results = results.filter(k =>
      (k.kamellador_skills || []).some(
        ks => ks.skills && ks.skills.categories && String(ks.skills.categories.id) === String(category_id)
      )
    );
  }

  // Normalize: attach flat skills array to each profile
  return results.map(k => ({
    id: k.id,
    full_name: k.full_name,
    avatar_url: k.avatar_url,
    role: k.role,
    is_active: k.is_active,
    skills: (k.kamellador_skills || []).map(ks => ({
      id: ks.skills?.id,
      name: ks.skills?.name,
      category: ks.skills?.categories?.name,
      experience_years: ks.experience_years,
    })),
  }));
}

export async function getProfile(userId) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    const err = new Error('Perfil no encontrado');
    err.statusCode = 404;
    throw err;
  }
  return data;
}

export async function updateProfile(userId, updates) {
  // Solo permitimos actualizar ciertos campos
  const allowedUpdates = {};
  if (updates.full_name) allowedUpdates.full_name = updates.full_name;
  if (updates.avatar_url) allowedUpdates.avatar_url = updates.avatar_url;
  if (updates.phone !== undefined) allowedUpdates.phone = updates.phone;
  if (updates.specialty !== undefined) allowedUpdates.specialty = updates.specialty;
  if (updates.age !== undefined) allowedUpdates.age = updates.age;

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update(allowedUpdates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    const err = new Error('Error al actualizar perfil');
    err.statusCode = 500;
    throw err;
  }
  return data;
}
