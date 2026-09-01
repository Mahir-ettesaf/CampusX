import { findCareerReadinessData } from "../models/career-readiness.model.js";

const applicantRoles = new Set(["student", "graduate"]);
const profileFields = ["headline", "bio", "phone", "location", "linkedin_url", "github_username", "portfolio_url"];
const academicFields = ["student_id", "department", "program", "degree_level", "graduation_year"];
const hasValue = (value) => value !== null && value !== undefined && String(value).trim() !== "";
const percentage = (earned, maximum) => maximum === 0 ? null : Math.round((earned / maximum) * 100);

const levelFor = (score) => {
  if (score >= 80) return "Highly Career Ready";
  if (score >= 60) return "Career Ready";
  if (score >= 40) return "Developing";
  return "Needs Development";
};

const category = (name, earned, maximum, improvement) => ({
  category: name,
  earned,
  maximum,
  percentage: percentage(earned, maximum),
  applicable: maximum > 0,
  improvement,
});

const buildBreakdown = (data) => {
  const isGraduate = data.role === "graduate";
  const profileMaximum = isGraduate ? 15 : 20;
  const projectMaximum = isGraduate ? 10 : 15;
  const profileCompleted = profileFields.filter((field) => hasValue(data[field])).length;
  const academicCompleted = academicFields.filter((field) => hasValue(data[field])).length;
  const skillPoints = Math.min(Number(data.skill_points), 20);
  const resumePoints = Number(data.has_primary_resume) === 1 ? 15 : Number(data.resume_count) > 0 ? 10 : 0;

  return [
    category("Profile", Math.round((profileCompleted / profileFields.length) * profileMaximum), profileMaximum, "Complete your professional profile"),
    category("Skills", skillPoints, 20, Number(data.skill_count) === 0 ? "Add relevant skills" : "Develop your skill proficiency"),
    category("Resume", resumePoints, 15, "Add a professional resume"),
    category("Projects", Math.min(Number(data.project_count), isGraduate ? 2 : 3) * 5, projectMaximum, "Add another relevant project"),
    category("Certificates", Math.min(Number(data.certificate_count), 2) * 5, 10, "Add a certificate"),
    category("Academic Profile", academicCompleted * 4, 20, "Complete your academic profile"),
    category(
      "Publications",
      isGraduate ? Math.min(Number(data.publication_count), 2) * 5 : 0,
      isGraduate ? 10 : 0,
      "Add a publication",
    ),
  ];
};

export const getCareerReadiness = async (req, res) => {
  if (!applicantRoles.has(req.user.role)) {
    return res.status(403).json({ success: false, message: "Career readiness is available to students and graduates only" });
  }

  try {
    const data = await findCareerReadinessData(req.user.id);
    if (!data) return res.status(404).json({ success: false, message: "User account was not found" });

    const breakdown = buildBreakdown(data);
    const score = breakdown.reduce((total, item) => total + item.earned, 0);
    const improvementAreas = breakdown
      .map((item, index) => ({ ...item, index }))
      .filter((item) => item.applicable && item.earned < item.maximum)
      .sort((left, right) => (right.maximum - right.earned) - (left.maximum - left.earned) || left.index - right.index)
      .slice(0, 5)
      .map((item) => item.improvement);

    return res.json({
      success: true,
      career_readiness: { score, level: levelFor(score) },
      breakdown: breakdown.map(({ improvement, ...item }) => item),
      improvement_areas: improvementAreas,
    });
  } catch {
    return res.status(500).json({ success: false, message: "Unable to calculate career readiness" });
  }
};
