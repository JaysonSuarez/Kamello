import * as profileService from './profiles.service.js';

export async function getKamelladores(req, res, next) {
  try {
    const { category_id, skill_id, search } = req.query;
    const kamelladores = await profileService.getKamelladores({ category_id, skill_id, search });
    res.json(kamelladores);
  } catch (error) {
    next(error);
  }
}

export async function getProfile(req, res, next) {
  try {
    const profile = await profileService.getProfile(req.user.id);
    res.json(profile);
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req, res, next) {
  try {
    // Ideally validate req.body with Zod here
    const updated = await profileService.updateProfile(req.user.id, req.body);
    res.json(updated);
  } catch (error) {
    next(error);
  }
}
