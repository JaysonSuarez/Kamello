import * as skillsService from './skills.service.js';

export async function getCategories(req, res, next) {
  try {
    const categories = await skillsService.getAllCategories();
    res.json(categories);
  } catch (error) {
    next(error);
  }
}

export async function getSkills(req, res, next) {
  try {
    const skills = await skillsService.getAllSkills();
    res.json(skills);
  } catch (error) {
    next(error);
  }
}

export async function getMySkills(req, res, next) {
  try {
    const kamelladorId = req.user.id;
    const skills = await skillsService.getKamelladorSkills(kamelladorId);
    res.json(skills);
  } catch (error) {
    next(error);
  }
}

export async function addMySkill(req, res, next) {
  try {
    const kamelladorId = req.user.id;
    const { skill_id, experience_years } = req.body;
    const skill = await skillsService.addKamelladorSkill(kamelladorId, skill_id, experience_years);
    res.status(201).json(skill);
  } catch (error) {
    next(error);
  }
}

export async function deleteMySkill(req, res, next) {
  try {
    const userId = req.user.id;
    const skillId = req.params.skill_id;
    const result = await skillsService.deleteKamelladorSkill(userId, skillId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
