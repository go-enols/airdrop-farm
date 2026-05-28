import { Router, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { randomBytes } from "crypto";
import { stmts } from "../db";
import { AuthenticatedRequest, UserRecord } from "../types";
import { authMiddleware, requireRole } from "../middleware/auth";

const router = Router();

function getJwtSecret(): string {
  return process.env.JWT_SECRET || "";
}

// POST /api/auth/login
router.post("/login", (req: AuthenticatedRequest, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({
      error: {
        message: "username and password are required",
        code: "VALIDATION_ERROR",
      },
    });
    return;
  }

  const user = stmts.userGetByUsername.get(username) as UserRecord | undefined;
  if (!user) {
    res
      .status(401)
      .json({
        error: { message: "Invalid credentials", code: "UNAUTHORIZED" },
      });
    return;
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    res
      .status(401)
      .json({
        error: { message: "Invalid credentials", code: "UNAUTHORIZED" },
      });
    return;
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    getJwtSecret(),
    { expiresIn: "24h" },
  );

  res.json({
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        role: user.role,
      },
    },
  });
});

// POST /api/auth/register (admin only)
router.post(
  "/register",
  authMiddleware,
  requireRole("admin"),
  (req: AuthenticatedRequest, res: Response) => {
    const { username, password, displayName, role } = req.body;

    if (!username || !password) {
      res.status(400).json({
        error: {
          message: "username and password are required",
          code: "VALIDATION_ERROR",
        },
      });
      return;
    }

    if (password.length < 4) {
      res.status(400).json({
        error: {
          message: "password must be at least 4 characters",
          code: "VALIDATION_ERROR",
        },
      });
      return;
    }

    const existing = stmts.userGetByUsername.get(username) as
      | UserRecord
      | undefined;
    if (existing) {
      res
        .status(409)
        .json({
          error: { message: "Username already exists", code: "CONFLICT" },
        });
      return;
    }

    const id = uuidv4();
    const passwordHash = bcrypt.hashSync(password, 10);
    const apiKey = randomBytes(32).toString("hex");
    const now = new Date().toISOString();

    stmts.userInsert.run(
      id,
      username,
      passwordHash,
      displayName || username,
      role || "user",
      apiKey,
      now,
      now,
    );

    const created = stmts.userGetById.get(id) as UserRecord;
    res.status(201).json({
      data: {
        id: created.id,
        username: created.username,
        displayName: created.display_name,
        role: created.role,
        apiKey: created.api_key,
        createdAt: created.created_at,
      },
    });
  },
);

export default router;
