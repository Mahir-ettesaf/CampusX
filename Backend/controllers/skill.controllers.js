import {
  addUserSkill,
  findOrCreateSkill,
  findSkills,
  findUserSkill,
  findUserSkills,
  removeUserSkill,
  updateUserSkillProficiency,
} from "../models/skill.model.js";

const PROFICIENCY_LEVELS = new Set(["beginner", "intermediate", "advanced", "expert"]);

const normalizeSkillName = (name) => name.trim().replace(/\s+/g, " ").toLowerCase();
const formatSkillName = (name) => name.trim().replace(/\s+/g, " ");

const getSkillId = (value) => {
  const skillId = Number(value);
  return Number.isInteger(skillId) && skillId > 0 ? skillId : null;
};

const isValidProficiency = (proficiencyLevel) =>
  typeof proficiencyLevel === "string" && PROFICIENCY_LEVELS.has(proficiencyLevel.toLowerCase());

const respondInternalError = (res) =>
  res.status(500).json({ success: false, message: "Unable to process the skills request" });

export const getSkills = async (req, res) => {
  const search = req.query.search || "";
  if (typeof search !== "string") {
    return res.status(400).json({ success: false, message: "Search must be text" });
  }

  try {
    const skills = await findSkills(normalizeSkillName(search));
    return res.status(200).json({ success: true, skills });
  } catch {
    return respondInternalError(res);
  }
};

export const getMySkills = async (req, res) => {
  try {
    const skills = await findUserSkills(req.user.id);
    return res.status(200).json({ success: true, skills });
  } catch {
    return respondInternalError(res);
  }
};

export const addMySkill = async (req, res) => {
  const { name, proficiency_level } = req.body;
  if (Object.hasOwn(req.body, "user_id")) {
    return res.status(400).json({ success: false, message: "User ID cannot be provided when adding a skill" });
  }

  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ success: false, message: "Skill name is required" });
  }

  const formattedName = formatSkillName(name);
  if (formattedName.length > 150) {
    return res.status(400).json({ success: false, message: "Skill name must be 150 characters or fewer" });
  }

  if (!isValidProficiency(proficiency_level)) {
    return res.status(400).json({ success: false, message: "Select a valid proficiency level" });
  }

  try {
    const skill = await findOrCreateSkill(formattedName, normalizeSkillName(formattedName));
    await addUserSkill(req.user.id, skill.id, proficiency_level.toLowerCase());
    const userSkill = await findUserSkill(req.user.id, skill.id);
    return res.status(201).json({ success: true, message: "Skill added successfully", skill: userSkill });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "This skill is already on your profile" });
    }

    return respondInternalError(res);
  }
};

export const updateMySkill = async (req, res) => {
  const skillId = getSkillId(req.params.skillId);
  const { proficiency_level } = req.body;

  if (!skillId) {
    return res.status(400).json({ success: false, message: "Provide a valid skill ID" });
  }

  if (!isValidProficiency(proficiency_level)) {
    return res.status(400).json({ success: false, message: "Select a valid proficiency level" });
  }

  try {
    const result = await updateUserSkillProficiency(
      req.user.id,
      skillId,
      proficiency_level.toLowerCase(),
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Skill was not found on your profile" });
    }

    const skill = await findUserSkill(req.user.id, skillId);
    return res.status(200).json({ success: true, message: "Skill updated successfully", skill });
  } catch {
    return respondInternalError(res);
  }
};

export const deleteMySkill = async (req, res) => {
  const skillId = getSkillId(req.params.skillId);
  if (!skillId) {
    return res.status(400).json({ success: false, message: "Provide a valid skill ID" });
  }

  try {
    const result = await removeUserSkill(req.user.id, skillId);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Skill was not found on your profile" });
    }

    return res.status(200).json({ success: true, message: "Skill removed successfully" });
  } catch {
    return respondInternalError(res);
  }
};
