import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getPrisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.js";



const router = Router();

const AUTH_COOKIE_NAME = "toktickit_session";
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

const jwtSecret: string = JWT_SECRET;

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(401).json({
        error: "Invalid email or password",
        code: "INVALID_CREDENTIALS",
        details: [],
      });
    }

    const prisma = getPrisma();

    const user = await prisma.user.findUnique({
      where: {
        email: email.trim().toLowerCase(),
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: "Invalid email or password",
        code: "INVALID_CREDENTIALS",
        details: [],
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      return res.status(401).json({
        error: "Invalid email or password",
        code: "INVALID_CREDENTIALS",
        details: [],
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      jwtSecret,
      {
        expiresIn: "8h",
      },
    );

    res.cookie(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      error: "Internal server error",
      code: "INTERNAL_SERVER_ERROR",
      details: [],
    });
  }
});

router.post("/logout", requireAuth, (_req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return res.status(200).json({
    message: "Successfully logged out.",
  });
});

router.get("/me", requireAuth, (req, res) => {
  return res.status(200).json({
    user: req.user,
  });
});

router.post("/change-password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body ?? {};

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string"
    ) {
      return res.status(400).json({
        error: "Invalid password input",
        code: "INVALID_PASSWORD_INPUT",
        details: [],
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: "New password must be at least 8 characters.",
        code: "PASSWORD_TOO_SHORT",
        details: [],
      });
    }

    const prisma = getPrisma();

    const user = await prisma.user.findUnique({
      where: {
        id: req.user!.id,
      },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        error: "Invalid authentication credentials",
        code: "INVALID_AUTHENTICATION",
        details: [],
      });
    }

    const currentPasswordMatches = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );

    if (!currentPasswordMatches) {
      return res.status(401).json({
        error: "Current password verification failed.",
        code: "CURRENT_PASSWORD_INVALID",
        details: [],
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        error: "New password must be different from the current password.",
        code: "PASSWORD_UNCHANGED",
        details: [],
      });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        passwordHash: newPasswordHash,
        mustChangePassword: false,
      },
    });

    return res.status(200).json({
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Change password error:", error);

    return res.status(500).json({
      error: "Internal server error",
      code: "INTERNAL_SERVER_ERROR",
      details: [],
    });
  }
});

export default router;
