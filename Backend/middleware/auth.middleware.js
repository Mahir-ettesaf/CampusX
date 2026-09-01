import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
  const authorizationHeader = req.headers.authorization;
  const [scheme, token] = authorizationHeader?.split(" ") || [];

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      success: false,
      message: "Authentication token is required",
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
    });
  }
};
