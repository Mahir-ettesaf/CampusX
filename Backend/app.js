import cors from "cors";
import express from "express";
import "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import applicationsRoutes from "./routes/applications.routes.js";
import opportunityApplicationsRoutes from "./routes/opportunity-applications.routes.js";
import certificatesRoutes from "./routes/certificates.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import projectsRoutes from "./routes/projects.routes.js";
import publicationsRoutes from "./routes/publications.routes.js";
import opportunitiesRoutes from "./routes/opportunities.routes.js";
import opportunitySkillsRoutes from "./routes/opportunity-skills.routes.js";
import opportunityMatchRoutes from "./routes/opportunity-match.routes.js";
import recommendationsRoutes from "./routes/recommendations.routes.js";
import careerReadinessRoutes from "./routes/career-readiness.routes.js";
import resumesRoutes from "./routes/resumes.routes.js";
import skillsRoutes from "./routes/skills.routes.js";
import companiesRoutes from "./routes/companies.routes.js";
import adminCompaniesRoutes from "./routes/admin-companies.routes.js";
import adminDashboardRoutes from "./routes/admin-dashboard.routes.js";
import academicResourcesRoutes from "./routes/academic-resources.routes.js";
import announcementsRoutes from "./routes/announcements.routes.js";
import plannerRoutes from "./routes/planner.routes.js";
import teamsRoutes from "./routes/teams.routes.js";
import notificationsRoutes from "./routes/notifications.routes.js";
import learningPathRoutes from "./routes/learning-path.routes.js";
import adminUsersRoutes from "./routes/admin-users.routes.js";
import adminOpportunitiesRoutes from "./routes/admin-opportunities.routes.js";
import thesisMilestonesRoutes from "./routes/thesis-milestones.routes.js";

const app = express();
app.use(cors());

app.use(express.json());

app.get("/", (req, res) => {
  res.send("CampusX Backend is Running 🚀");
});

app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationsRoutes);
app.use("/api/opportunities", opportunityApplicationsRoutes);
app.use("/api/profile/certificates", certificatesRoutes);
app.use("/api/profile/projects", projectsRoutes);
app.use("/api/profile/publications", publicationsRoutes);
app.use("/api/opportunities", opportunitiesRoutes);
app.use("/api/opportunities", opportunitySkillsRoutes);
app.use("/api/opportunities", opportunityMatchRoutes);
app.use("/api/recommendations", recommendationsRoutes);
app.use("/api/career-readiness", careerReadinessRoutes);
app.use("/api/profile/resumes", resumesRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/skills", skillsRoutes);
app.use("/api/companies", companiesRoutes);
app.use("/api/admin/companies", adminCompaniesRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/resources", academicResourcesRoutes);
app.use("/api/announcements", announcementsRoutes);
app.use("/api/planner", plannerRoutes);
app.use("/api/teams", teamsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/learning-path", learningPathRoutes);
app.use("/api/admin/users", adminUsersRoutes);
app.use("/api/admin/opportunities", adminOpportunitiesRoutes);
app.use("/api/thesis-milestones", thesisMilestonesRoutes);

export default app;
