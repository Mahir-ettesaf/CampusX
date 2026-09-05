import { findUserSkills, findUserSkillsForUsers } from "./skill.model.js";
import { findOpportunitySkills } from "./opportunity-skill.model.js";

export const findMatchSkillData = async (userId, opportunityId) => {
  const [requiredSkills, userSkills] = await Promise.all([
    findOpportunitySkills(opportunityId),
    findUserSkills(userId),
  ]);
  return { requiredSkills, userSkills };
};

export const calculateSkillMatch = (requiredSkills, userSkills) => {
  if (requiredSkills.length === 0) {
    return {
      can_calculate: false,
      percentage: null,
      total_required_skills: 0,
      matched_skill_count: 0,
      matched_skills: [],
      missing_skills: [],
      message: "This opportunity has no required skills yet, so a match cannot be calculated.",
    };
  }

  const skillsById = new Map(userSkills.map((skill) => [skill.skill_id, skill]));
  const matched_skills = [];
  const missing_skills = [];
  for (const requiredSkill of requiredSkills) {
    const userSkill = skillsById.get(requiredSkill.skill_id);
    if (userSkill) {
      matched_skills.push({ skill_id: requiredSkill.skill_id, skill_name: requiredSkill.name, proficiency_level: userSkill.proficiency_level });
    } else {
      missing_skills.push({ skill_id: requiredSkill.skill_id, skill_name: requiredSkill.name });
    }
  }

  return {
    can_calculate: true,
    percentage: Number(((matched_skills.length / requiredSkills.length) * 100).toFixed(2)),
    total_required_skills: requiredSkills.length,
    matched_skill_count: matched_skills.length,
    matched_skills,
    missing_skills,
  };
};

export const findMatchesForUsers = async (userIds, opportunityId) => {
  const uniqueUserIds = [...new Set(userIds)];
  const [requiredSkills, rows] = await Promise.all([
    findOpportunitySkills(opportunityId),
    findUserSkillsForUsers(uniqueUserIds),
  ]);
  const skillsByUserId = new Map(uniqueUserIds.map((userId) => [userId, []]));
  for (const row of rows) skillsByUserId.get(row.user_id)?.push(row);

  return new Map(uniqueUserIds.map((userId) => [
    userId,
    calculateSkillMatch(requiredSkills, skillsByUserId.get(userId) || []),
  ]));
};
