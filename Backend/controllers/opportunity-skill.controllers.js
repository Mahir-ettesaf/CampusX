import { findOpportunity } from "../models/opportunity.model.js";
import { addOpportunitySkill, findOpportunitySkills, findSkill, hasOpportunitySkill, removeOpportunitySkill } from "../models/opportunity-skill.model.js";

const facultyTypes = new Set(["ra", "ta", "research"]);
const recruiterTypes = new Set(["job", "internship"]);
const validId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};
const fail = (res, status, message) => res.status(status).json({ success: false, message });

const findVisibleOpportunity = async (req, res) => {
  const opportunityId = validId(req.params.opportunityId);
  if (!opportunityId) {
    fail(res, 400, "Provide a valid opportunity ID");
    return null;
  }
  const opportunity = await findOpportunity(opportunityId);
  if (!opportunity) {
    fail(res, 404, "Opportunity was not found");
    return null;
  }
  const isOwner = opportunity.creator_user_id === req.user.id;
  if (opportunity.status !== "published" && !isOwner && req.user.role !== "admin") {
    fail(res, 404, "Opportunity was not found");
    return null;
  }
  return opportunity;
};

const canManage = (req, opportunity) => {
  if (req.user.role === "admin") return true;
  if (opportunity.creator_user_id !== req.user.id) return false;
  return req.user.role === "faculty"
    ? facultyTypes.has(opportunity.opportunity_type)
    : req.user.role === "recruiter" && recruiterTypes.has(opportunity.opportunity_type);
};

export const listOpportunitySkills = async (req, res) => {
  try {
    const opportunity = await findVisibleOpportunity(req, res);
    if (!opportunity) return;
    return res.json({ success: true, skills: await findOpportunitySkills(opportunity.id) });
  } catch {
    return fail(res, 500, "Unable to load opportunity skills");
  }
};

export const addRequiredSkill = async (req, res) => {
  const skillId = validId(req.body?.skill_id);
  if (!skillId) return fail(res, 400, "Provide a valid skill ID");
  if (!["faculty", "recruiter", "admin"].includes(req.user.role)) {
    return fail(res, 403, "You are not allowed to manage required skills");
  }
  try {
    const opportunity = await findVisibleOpportunity(req, res);
    if (!opportunity) return;
    if (!canManage(req, opportunity)) {
      return fail(res, opportunity.creator_user_id === req.user.id ? 403 : 404, opportunity.creator_user_id === req.user.id ? "Your role cannot manage required skills for this opportunity" : "Opportunity was not found");
    }
    if (!await findSkill(skillId)) return fail(res, 404, "Skill was not found");
    if (await hasOpportunitySkill(opportunity.id, skillId)) return fail(res, 409, "This skill is already required for the opportunity");
    await addOpportunitySkill(opportunity.id, skillId);
    return res.status(201).json({ success: true, message: "Required skill added", skills: await findOpportunitySkills(opportunity.id) });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") return fail(res, 409, "This skill is already required for the opportunity");
    return fail(res, 500, "Unable to add the required skill");
  }
};

export const removeRequiredSkill = async (req, res) => {
  const skillId = validId(req.params.skillId);
  if (!skillId) return fail(res, 400, "Provide a valid skill ID");
  if (!["faculty", "recruiter", "admin"].includes(req.user.role)) {
    return fail(res, 403, "You are not allowed to manage required skills");
  }
  try {
    const opportunity = await findVisibleOpportunity(req, res);
    if (!opportunity) return;
    if (!canManage(req, opportunity)) {
      return fail(res, opportunity.creator_user_id === req.user.id ? 403 : 404, opportunity.creator_user_id === req.user.id ? "Your role cannot manage required skills for this opportunity" : "Opportunity was not found");
    }
    const result = await removeOpportunitySkill(opportunity.id, skillId);
    if (!result.affectedRows) return fail(res, 404, "Required skill was not found for this opportunity");
    return res.json({ success: true, message: "Required skill removed" });
  } catch {
    return fail(res, 500, "Unable to remove the required skill");
  }
};
