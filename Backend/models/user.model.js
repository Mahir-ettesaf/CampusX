import db from "../config/db.js";

export const createUser = (userData, callback) => {
  const sql = `
        INSERT INTO users
        (full_name, email, password, role)
        VALUES (?, ?, ?, ?)
    `;

  db.query(
    sql,
    [userData.full_name, userData.email, userData.password, userData.role],
    callback,
  );
};
export const findUserByEmail = (email, callback) => {
  const sql = `
        SELECT *
        FROM users
        WHERE email = ?
    `;

  db.query(sql, [email], callback);
};
