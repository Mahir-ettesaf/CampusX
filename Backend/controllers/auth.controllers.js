import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createUser, findUserByEmail } from "../models/user.model.js";
import { createEmailToken, findEmailUser, updatePassword, useEmailToken, verifyUser } from "../models/email-token.model.js";
import { sendEmail } from "../services/email.service.js";

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
      createEmailToken(result.insertId, "verification").then((token) => sendEmail({ to: normalizedEmail, subject: "Verify your CampusX account", text: `Verify your account: ${process.env.FRONTEND_URL || "campusx://"}/verify?token=${token}` })).catch(() => undefined);
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
const emailValid=(email)=>typeof email==="string"&&isValidEmail(email.trim().toLowerCase());
export const requestPasswordReset=async(req,res)=>{if(!emailValid(req.body?.email))return res.status(400).json({success:false,message:"Please provide a valid email address"});try{const user=await findEmailUser(req.body.email.trim().toLowerCase());if(user){const token=await createEmailToken(user.id,"password_reset");await sendEmail({to:user.email,subject:"Reset your CampusX password",text:`Reset your password: ${process.env.FRONTEND_URL||"campusx://"}/reset-password?token=${token}`});}return res.json({success:true,message:"If an account exists, a password reset email has been sent."});}catch(error){return res.status(error.status||500).json({success:false,message:error.status===503?"Email service is not configured yet.":"Unable to send password reset email"});}};
export const resetPassword=async(req,res)=>{const {token,password}=req.body||{};if(typeof token!=="string"||token.length<32||typeof password!=="string"||password.length<8)return res.status(400).json({success:false,message:"Provide a valid reset token and a password of at least 8 characters"});try{const userId=await useEmailToken(token,"password_reset");if(!userId)return res.status(400).json({success:false,message:"This reset link is invalid or expired"});await updatePassword(userId,await bcrypt.hash(password,10));return res.json({success:true,message:"Password updated successfully"});}catch{return res.status(500).json({success:false,message:"Unable to reset password"});}};
export const verifyAccount=async(req,res)=>{const token=req.body?.token;if(typeof token!=="string"||token.length<32)return res.status(400).json({success:false,message:"Provide a valid verification token"});try{const userId=await useEmailToken(token,"verification");if(!userId)return res.status(400).json({success:false,message:"This verification link is invalid or expired"});await verifyUser(userId);return res.json({success:true,message:"Account verified successfully"});}catch{return res.status(500).json({success:false,message:"Unable to verify account"});}};
