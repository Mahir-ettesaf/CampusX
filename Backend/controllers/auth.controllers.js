import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createUser, findUserByEmail } from "../models/user.model.js";

const PUBLIC_REGISTRATION_ROLES = new Set(["student", "graduate", "faculty", "recruiter"]);
const isValidEmail = (email) => /^\S+@\S+\.\S+$/.test(email);

// =========================
// Register Controller
// =========================
export const register = async (req, res) => {
  try {
    const { full_name, email, password, role } = req.body;
    if (!full_name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedRole = role.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ success: false, message: "Please provide a valid email address" });
    }

    if (!PUBLIC_REGISTRATION_ROLES.has(normalizedRole)) {
      return res.status(400).json({ success: false, message: "Please select a valid public registration role" });
    }

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      full_name: full_name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: normalizedRole,
    };

    createUser(userData, (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({
            success: false,
            message: "An account with this email already exists",
          });
        }

        return res.status(500).json({
          success: false,
          message: "Unable to register the user",
        });
      }

      res.status(201).json({
        success: true,
        message: "User Registered Successfully",
        userId: result.insertId,
      });
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to register the user",
    });
  }
};

// =========================
// Login Controller
// =========================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    findUserByEmail(normalizedEmail, async (err, result) => {
      try {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Unable to log in",
          });
        }

      // User not found
      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
      // Compare password
      const isMatch = await bcrypt.compare(password, result[0].password);

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid Password",
        });
      }
      const token = jwt.sign(
        {
          id: result[0].id,
          email: result[0].email,
          role: result[0].role,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "7d",
        },
      );

      res.status(200).json({
        success: true,
        message: "Login Successful",
        token,
        user: {
          id: result[0].id,
          full_name: result[0].full_name,
          email: result[0].email,
          role: result[0].role,
        },
      });
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: "Unable to log in",
        });
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to log in",
    });
  }
};

export const getCurrentUser = (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};
