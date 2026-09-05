import { findOpportunity } from "../models/opportunity.model.js";
import { calculateSkillMatch, findMatchSkillData } from "../models/opportunity-match.model.js";

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
    return res.json({
      success: true,
      opportunity: { id: opportunity.id, title: opportunity.title },
      match: calculateSkillMatch(requiredSkills, userSkills),
    });
  } catch {
    return fail(res, 500, "Unable to calculate the skill match");
  }
};
