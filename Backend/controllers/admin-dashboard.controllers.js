import { findDashboardStatistics } from "../models/admin-dashboard.model.js";

export const getDashboard = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Only administrators can view the dashboard" });
  }

  try {
    const statistics = await findDashboardStatistics();
    return res.json({
      success: true,
      statistics: {
        total_users: Number(statistics.total_users),
        students: Number(statistics.students),
        graduates: Number(statistics.graduates),
        faculty: Number(statistics.faculty),
        recruiters: Number(statistics.recruiters),
        companies: Number(statistics.companies),
        pending_companies: Number(statistics.pending_companies),
        approved_companies: Number(statistics.approved_companies),
        opportunities: Number(statistics.opportunities),
        published_opportunities: Number(statistics.published_opportunities),
        applications: Number(statistics.applications),
      },
    });
  } catch {
    return res.status(500).json({ success: false, message: "Unable to load dashboard statistics" });
  }
};
