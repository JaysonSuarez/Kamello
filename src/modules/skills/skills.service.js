import { supabaseAdmin } from '../../config/supabase.js';

export async function getAllCategories() {
  const { data, error } = await supabaseAdmin.from('categories').select('*');
  if (error) {
    const err = new Error('Error fetching categories');
    err.statusCode = 500;
    throw err;
  }
  return data;
}

export async function getAllSkills() {
  const { data, error } = await supabaseAdmin.from('skills').select('*, categories(name)');
  if (error) {
    const err = new Error('Error fetching skills');
    err.statusCode = 500;
    throw err;
  }
  return data;
}

export async function getKamelladorSkills(kamelladorId) {
  const { data, error } = await supabaseAdmin
    .from('kamellador_skills')
    .select('*, skills(*, categories(*))')
    .eq('kamellador_id', kamelladorId);

  if (error) {
    const err = new Error('Error fetching kamellador skills');
    err.statusCode = 500;
    throw err;
  }
  return data;
}

export async function addKamelladorSkill(kamelladorId, skillId, experienceYears) {
  const { data, error } = await supabaseAdmin
    .from('kamellador_skills')
    .insert({ kamellador_id: kamelladorId, skill_id: skillId, experience_years: experienceYears })
    .select()
    .single();

  if (error) {
    const err = new Error('Error adding skill to kamellador');
    err.statusCode = 500;
    throw err;
  }
  return data;
}

export async function deleteKamelladorSkill(userId, skillId) {
  const { error } = await supabaseAdmin
    .from('kamellador_skills')
    .delete()
    .eq('kamellador_id', userId)
    .eq('skill_id', skillId);

  if (error) {
    const err = new Error('Error al eliminar habilidad');
    err.statusCode = 500;
    throw err;
  }
  return { success: true };
}
