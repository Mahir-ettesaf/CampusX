import { findUserSkills } from "./skill.model.js";
import { findOpportunitySkills } from "./opportunity-skill.model.js";

export const findMatchSkillData = async (userId, opportunityId) => {
  const [requiredSkills, userSkills] = await Promise.all([
    findOpportunitySkills(opportunityId),
    findUserSkills(userId),
  ]);
  return { requiredSkills, userSkills };
};
