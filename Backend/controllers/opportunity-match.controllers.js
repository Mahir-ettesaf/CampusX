import { findOpportunity } from "../models/opportunity.model.js";
import { findMatchSkillData } from "../models/opportunity-match.model.js";

const applicantRoles = new Set(["student", "graduate"]);
const validId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};
const fail = (res, status, message) => res.status(status).json({ success: false, message });

export const getOpportunityMatch = async (req, res) => {
  if (!applicantRoles.has(req.user.role)) {
    return fail(res, 403, "Only students and graduates can calculate a skill match");
  }

  const opportunityId = validId(req.params.opportunityId);
  if (!opportunityId) return fail(res, 400, "Provide a valid opportunity ID");

  try {
    const opportunity = await findOpportunity(opportunityId);
    if (!opportunity || opportunity.status !== "published") {
      return fail(res, 404, "Opportunity was not found");
    }

    const { requiredSkills, userSkills } = await findMatchSkillData(req.user.id, opportunityId);
    if (requiredSkills.length === 0) {
      return res.json({
        success: true,
        opportunity: { id: opportunity.id, title: opportunity.title },
        match: {
          can_calculate: false,
          percentage: null,
          total_required_skills: 0,
          matched_skill_count: 0,
          matched_skills: [],
          missing_skills: [],
          message: "This opportunity has no required skills yet, so a match cannot be calculated.",
        },
      });
    }

    const skillsById = new Map(userSkills.map((skill) => [skill.skill_id, skill]));
    const matchedSkills = [];
    const missingSkills = [];
    for (const requiredSkill of requiredSkills) {
      const userSkill = skillsById.get(requiredSkill.skill_id);
      if (userSkill) {
        matchedSkills.push({ skill_id: requiredSkill.skill_id, skill_name: requiredSkill.name, proficiency_level: userSkill.proficiency_level });
      } else {
        missingSkills.push({ skill_id: requiredSkill.skill_id, skill_name: requiredSkill.name });
      }
    }

    return res.json({
      success: true,
      opportunity: { id: opportunity.id, title: opportunity.title },
      match: {
        can_calculate: true,
        percentage: Number(((matchedSkills.length / requiredSkills.length) * 100).toFixed(2)),
        total_required_skills: requiredSkills.length,
        matched_skill_count: matchedSkills.length,
        matched_skills: matchedSkills,
        missing_skills: missingSkills,
      },
    });
  } catch {
    return fail(res, 500, "Unable to calculate the skill match");
  }
};
