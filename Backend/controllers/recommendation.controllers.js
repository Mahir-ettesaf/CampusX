import { findOpportunityRecommendations } from "../models/recommendation.model.js";

const applicantRoles = new Set(["student", "graduate"]);
const fail = (res, status, message) => res.status(status).json({ success: false, message });

export const getOpportunityRecommendations = async (req, res) => {
  if (!applicantRoles.has(req.user.role)) {
    return fail(res, 403, "Only students and graduates can view opportunity recommendations");
  }

  try {
    const rows = await findOpportunityRecommendations(req.user.id, 10);
    return res.json({
      success: true,
      recommendations: rows.map((row) => {
        const totalRequiredSkills = Number(row.total_required_skills);
        const matchedSkillCount = Number(row.matched_skill_count);
        return {
          opportunity: {
            id: row.id,
            title: row.title,
            type: row.opportunity_type,
            location: row.location,
            remote: Boolean(row.is_remote),
            deadline: row.deadline,
          },
          match: {
            percentage: totalRequiredSkills === 0 ? null : Number(row.match_percentage),
            matched_skill_count: matchedSkillCount,
            total_required_skill_count: totalRequiredSkills,
            can_calculate: totalRequiredSkills > 0,
          },
        };
      }),
    });
  } catch (error) {
    console.error("Opportunity recommendations fetch failed:", error?.code || error?.message || error);
    return fail(res, 500, "Unable to load opportunity recommendations");
  }
};
