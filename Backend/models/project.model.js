import db from "../config/db.js";

const query = (sql, values = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, values, (error, results) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(results);
    });
  });

const projectColumns = `id, user_id, title, description, project_type, start_date,
  end_date, project_url, github_url, technologies, created_at, updated_at`;

export const findUserProjects = async (userId) =>
  query(
    `SELECT ${projectColumns}
     FROM portfolio_projects
     WHERE user_id = ?
     ORDER BY updated_at DESC, id DESC`,
    [userId],
  );

export const findUserProject = async (userId, projectId) => {
  const results = await query(
    `SELECT ${projectColumns} FROM portfolio_projects WHERE id = ? AND user_id = ?`,
    [projectId, userId],
  );
  return results[0] || null;
};

export const createUserProject = async (userId, projectData) => {
  const result = await query(
    `INSERT INTO portfolio_projects
      (user_id, title, description, project_type, start_date, end_date, project_url, github_url, technologies)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      projectData.title,
      projectData.description,
      projectData.project_type,
      projectData.start_date,
      projectData.end_date,
      projectData.project_url,
      projectData.github_url,
      projectData.technologies,
    ],
  );

  return findUserProject(userId, result.insertId);
};

export const updateUserProject = async (userId, projectId, projectData) => {
  const fields = Object.keys(projectData);
  const assignments = fields.map((field) => `\`${field}\` = ?`).join(", ");

  await query(
    `UPDATE portfolio_projects SET ${assignments} WHERE id = ? AND user_id = ?`,
    [...fields.map((field) => projectData[field]), projectId, userId],
  );

  return findUserProject(userId, projectId);
};

export const deleteUserProject = async (userId, projectId) =>
  query("DELETE FROM portfolio_projects WHERE id = ? AND user_id = ?", [projectId, userId]);
