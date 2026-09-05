import db from "../config/db.js";

const query = (sql, values = []) => new Promise((resolve, reject) => db.query(sql, values, (error, results) => error ? reject(error) : resolve(results)));
const transaction = (work) => new Promise((resolve, reject) => db.beginTransaction(async (beginError) => { if (beginError) return reject(beginError); try { const result = await work((sql, values = []) => new Promise((done, fail) => db.query(sql, values, (error, rows) => error ? fail(error) : done(rows)))); db.commit((commitError) => commitError ? reject(commitError) : resolve(result)); } catch (error) { db.rollback(() => reject(error)); } }));
const teamColumns = `t.id, t.name, t.description, t.created_by, t.created_at, t.updated_at, u.full_name AS creator_name,
  (SELECT CASE WHEN COUNT(*) = 0 THEN 0 ELSE ROUND(100 * SUM(progress_task.status = 'completed') / COUNT(*)) END
   FROM team_tasks progress_task WHERE progress_task.team_id = t.id AND progress_task.status <> 'cancelled') AS progress_percentage`;
const taskColumns = "tt.id, tt.team_id, tt.title, tt.description, tt.assigned_to, tt.status, tt.priority, tt.due_at, tt.created_at, tt.updated_at, assignee.full_name AS assignee_name, creator.full_name AS creator_name";

export const findUserTeams = (userId) => query(`SELECT ${teamColumns}, COUNT(DISTINCT tm_all.user_id) AS member_count, COUNT(DISTINCT tt.id) AS task_count FROM project_teams t INNER JOIN team_members mine ON mine.team_id = t.id AND mine.user_id = ? INNER JOIN users u ON u.id = t.created_by LEFT JOIN team_members tm_all ON tm_all.team_id = t.id LEFT JOIN team_tasks tt ON tt.team_id = t.id GROUP BY t.id ORDER BY t.updated_at DESC, t.id DESC`, [userId]);
export const findAccessibleTeam = async (teamId, userId) => (await query(`SELECT ${teamColumns} FROM project_teams t INNER JOIN team_members tm ON tm.team_id = t.id AND tm.user_id = ? INNER JOIN users u ON u.id = t.created_by WHERE t.id = ?`, [userId, teamId]))[0] || null;
export const findOwnedTeam = async (teamId, userId) => (await query(`SELECT ${teamColumns} FROM project_teams t INNER JOIN users u ON u.id = t.created_by WHERE t.id = ? AND t.created_by = ?`, [teamId, userId]))[0] || null;
export const createTeamWithOwner = (userId, data) => transaction(async (run) => { const created = await run("INSERT INTO project_teams (name, description, created_by) VALUES (?, ?, ?)", [data.name, data.description, userId]); await run("INSERT INTO team_members (team_id, user_id, membership_role) VALUES (?, ?, 'owner')", [created.insertId, userId]); return created.insertId; });
export const updateTeam = (teamId, data) => query(`UPDATE project_teams SET ${Object.keys(data).map((field) => `\`${field}\` = ?`).join(", ")} WHERE id = ?`, [...Object.values(data), teamId]);
export const deleteTeam = (teamId) => transaction(async (run) => {
  await run("DELETE FROM team_tasks WHERE team_id = ?", [teamId]);
  await run("DELETE FROM team_members WHERE team_id = ?", [teamId]);
  return run("DELETE FROM project_teams WHERE id = ?", [teamId]);
});
export const findTeamMembers = (teamId) => query("SELECT tm.user_id, u.full_name, u.role, tm.membership_role, tm.joined_at FROM team_members tm INNER JOIN users u ON u.id = tm.user_id WHERE tm.team_id = ? ORDER BY tm.membership_role = 'owner' DESC, u.full_name ASC", [teamId]);
export const findEligibleUser = async (userId) => (await query("SELECT id, full_name, role FROM users WHERE id = ? AND role IN ('student', 'graduate')", [userId]))[0] || null;
export const isTeamMember = async (teamId, userId) => Boolean((await query("SELECT 1 FROM team_members WHERE team_id = ? AND user_id = ?", [teamId, userId]))[0]);
export const addTeamMember = (teamId, userId) => query("INSERT INTO team_members (team_id, user_id, membership_role) VALUES (?, ?, 'member')", [teamId, userId]);
export const removeTeamMember = (teamId, userId) => transaction(async (run) => { await run("UPDATE team_tasks SET assigned_to = NULL WHERE team_id = ? AND assigned_to = ?", [teamId, userId]); return run("DELETE FROM team_members WHERE team_id = ? AND user_id = ? AND membership_role = 'member'", [teamId, userId]); });
export const findTeamTasks = (teamId) => query(`SELECT ${taskColumns} FROM team_tasks tt LEFT JOIN users assignee ON assignee.id = tt.assigned_to INNER JOIN users creator ON creator.id = tt.created_by WHERE tt.team_id = ? ORDER BY CASE WHEN tt.status IN ('todo', 'in_progress') THEN 0 WHEN tt.status = 'completed' THEN 1 ELSE 2 END, tt.due_at IS NULL, tt.due_at ASC, tt.id ASC`, [teamId]);
export const findTeamTask = async (teamId, taskId) => (await query(`SELECT ${taskColumns} FROM team_tasks tt LEFT JOIN users assignee ON assignee.id = tt.assigned_to INNER JOIN users creator ON creator.id = tt.created_by WHERE tt.team_id = ? AND tt.id = ?`, [teamId, taskId]))[0] || null;
export const createTeamTask = async (teamId, createdBy, data) => { const result = await query("INSERT INTO team_tasks (team_id, title, description, assigned_to, status, priority, due_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [teamId, data.title, data.description, data.assigned_to, data.status, data.priority, data.due_at, createdBy]); return findTeamTask(teamId, result.insertId); };
export const updateTeamTask = async (teamId, taskId, data) => { await query(`UPDATE team_tasks SET ${Object.keys(data).map((field) => `\`${field}\` = ?`).join(", ")} WHERE team_id = ? AND id = ?`, [...Object.values(data), teamId, taskId]); return findTeamTask(teamId, taskId); };
export const deleteTeamTask = (teamId, taskId) => query("DELETE FROM team_tasks WHERE team_id = ? AND id = ?", [teamId, taskId]);
