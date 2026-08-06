import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createUser, findUserByEmail } from "../models/user.model.js";

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

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      full_name,
      email,
      password: hashedPassword,
      role,
    };

    createUser(userData, (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: err.message,
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
      message: error.message,
    });
  }
};

// =========================
// Login Controller
// =========================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    findUserByEmail(email, async (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: err.message,
        });
      }

      // User not found
      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
      console.log("Entered Password:", password);
      console.log("Stored Hash:", result[0].password);

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
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
