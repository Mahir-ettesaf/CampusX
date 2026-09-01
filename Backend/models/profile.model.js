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

export const findUserProfile = async (userId) => {
  const results = await query(
    `SELECT id, full_name, email, role, profile_picture, is_verified, created_at, updated_at
     FROM users WHERE id = ?`,
    [userId],
  );

  return results[0] || null;
};

export const findCommonProfile = async (userId) => {
  const results = await query("SELECT * FROM profiles WHERE user_id = ?", [userId]);
  return results[0] || null;
};

export const findAcademicProfile = async (userId) => {
  const results = await query(
    "SELECT * FROM student_academic_profiles WHERE user_id = ?",
    [userId],
  );
  return results[0] || null;
};

export const findFacultyProfile = async (userId) => {
  const results = await query("SELECT * FROM faculty_profiles WHERE user_id = ?", [userId]);
  return results[0] || null;
};

export const findRecruiterProfile = async (userId) => {
  const results = await query(
    `SELECT rp.id, rp.user_id, rp.company_id, rp.job_title, rp.created_at, rp.updated_at,
            c.name AS company_name, c.description AS company_description,
            c.website AS company_website, c.logo AS company_logo,
            c.location AS company_location, c.approval_status AS company_approval_status
     FROM recruiter_profiles rp
     INNER JOIN companies c ON c.id = rp.company_id
     WHERE rp.user_id = ?`,
    [userId],
  );

  return results[0] || null;
};

export const upsertCommonProfile = async (userId, profileData) => {
  const fields = Object.keys(profileData);
  const columns = fields.map((field) => `\`${field}\``).join(", ");
  const placeholders = fields.map(() => "?").join(", ");
  const updates = fields.map((field) => `\`${field}\` = VALUES(\`${field}\`)`).join(", ");

  await query(
    `INSERT INTO profiles (user_id, ${columns}) VALUES (?, ${placeholders})
     ON DUPLICATE KEY UPDATE ${updates}`,
    [userId, ...fields.map((field) => profileData[field])],
  );

  return findCommonProfile(userId);
};

export const upsertAcademicProfile = async (userId, profileData) => {
  const values = [
    profileData.student_id,
    profileData.department,
    profileData.program,
    profileData.degree_level,
    profileData.graduation_year,
    profileData.cgpa,
    profileData.interests,
  ];
  const updateResult = await query(
    `UPDATE student_academic_profiles
     SET student_id = ?, department = ?, program = ?, degree_level = ?,
         graduation_year = ?, cgpa = ?, interests = ?
     WHERE user_id = ?`,
    [...values, userId],
  );

  if (updateResult.affectedRows === 0) {
    await query(
      `INSERT INTO student_academic_profiles
        (user_id, student_id, department, program, degree_level, graduation_year, cgpa, interests)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      ...values,
    ],
    );
  }

  return findAcademicProfile(userId);
};

export const upsertFacultyProfile = async (userId, profileData) => {
  await query(
    `INSERT INTO faculty_profiles
      (user_id, department, designation, research_areas, office_location, contact_details)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
      department = VALUES(department), designation = VALUES(designation),
      research_areas = VALUES(research_areas), office_location = VALUES(office_location),
      contact_details = VALUES(contact_details)`,
    [
      userId,
      profileData.department,
      profileData.designation,
      profileData.research_areas,
      profileData.office_location,
      profileData.contact_details,
    ],
  );

  return findFacultyProfile(userId);
};

export const companyExists = async (companyId) => {
  const results = await query("SELECT id FROM companies WHERE id = ?", [companyId]);
  return Boolean(results[0]);
};
export const approvedCompanyExists = async (companyId) => {
  const results = await query("SELECT id FROM companies WHERE id = ? AND approval_status = 'approved'", [companyId]);
  return Boolean(results[0]);
};

export const upsertRecruiterProfile = async (userId, profileData) => {
  await query(
    `INSERT INTO recruiter_profiles (user_id, company_id, job_title)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE company_id = VALUES(company_id), job_title = VALUES(job_title)`,
    [userId, profileData.company_id, profileData.job_title],
  );

  return findRecruiterProfile(userId);
};
