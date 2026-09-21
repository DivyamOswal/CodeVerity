// backend/controllers/authController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import Report from "../models/Report.js";
import WorkSpace from "../models/WorkSpace.js";
import { addAuditLog } from "./workspaceController.js";

/* =========================================================
   HELPERS
========================================================= */

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// A pre-computed bcrypt hash used for constant-time login behavior.
// This is NOT a real user's hash  it exists only so that bcrypt.compare()
// always runs, even when the email isn't registered. Prevents user
// enumeration via response-timing differences.
const DUMMY_HASH =
  "$2a$10$CwTycUXWue0Thq9StjUM0uJ8pFC8Q9V3eZ.Ez2vJ0FOfyY2qL6nQO";

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

const getOAuthUserPassword = () => {
  return bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);
};

const normalizeEmail = (raw) =>
  typeof raw === "string" ? raw.trim().toLowerCase() : "";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Cookie helpers
const setOAuthStateCookie = (res, state) => {
  res.cookie("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600000,
    path: "/",
  });
};

const getCookie = (req, name) => {
  const cookies = req.headers.cookie;
  if (!cookies) return null;
  const cookie = cookies
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.split("=")[1]) : null;
};

const clearOAuthStateCookie = (res) => {
  res.clearCookie("oauth_state", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
};

const redirectWithError = (res, errorMessage) => {
  res.redirect(
    `${FRONTEND_URL}/oauth-error?error=${encodeURIComponent(errorMessage)}`
  );
};

// ── Helper: Create workspace for a user ────────────────────────
const createWorkspaceForUser = async (user) => {
  const workspace = await WorkSpace.create({
    name: `${user.name}'s Workspace`,
    ownerId: user._id,
    members: [{ userId: user._id, role: "owner" }],
  });
  user.workspaceId = workspace._id;
  user.role = "owner";
  await user.save();
  return workspace;
};

/* =========================================================
   REGISTER
========================================================= */

export const register = async (req, res) => {
  const { name, password } = req.body;
  const email = normalizeEmail(req.body.email);

  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }
  if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 80) {
    return res.status(400).json({ error: "Name must be 2–80 characters." });
  }
  if (password.length < 8) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters." });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "Invalid email address." });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email,
      password: hashedPassword,
    });

    await createWorkspaceForUser(user);

    addAuditLog(
      user.workspaceId,
      user._id,
      "register",
      `User ${user.email} registered`
    );

    const token = generateToken(user);
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        workspaceId: user.workspaceId,
        hasGithubConnected: Boolean(user.githubAccessToken),
      },
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Registration failed." });
  }
};

/* =========================================================
   GET /me
========================================================= */

export const getMe = async (req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");

  try {
    const user = await User.findById(req.user.id)
      .select("-password +githubAccessToken")
      .lean();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { githubAccessToken, ...safeUser } = user;

    res.json({
      success: true,
      user: {
        ...safeUser,
        hasGithubConnected: Boolean(githubAccessToken),
      },
    });
  } catch (err) {
    console.error("Get /me error:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

/* =========================================================
   LOGIN
========================================================= */

export const login = async (req, res) => {
  const { password } = req.body;
  const email = normalizeEmail(req.body.email);

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required." });
  }

  try {
    const user = await User.findOne({ email });

    // Always run bcrypt so an attacker can't distinguish "user does not
    // exist" from "wrong password" via response timing.
    const hashToCompare = user?.password || DUMMY_HASH;
    const valid = await bcrypt.compare(password, hashToCompare);

    if (!user || !valid) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    if (user.workspaceId) {
      addAuditLog(
        user.workspaceId,
        user._id,
        "login",
        `User ${user.email} logged in`
      );
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        workspaceId: user.workspaceId,
        hasGithubConnected: Boolean(user.githubAccessToken),
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed." });
  }
};

/* =========================================================
   GOOGLE OAUTH
========================================================= */

export const googleAuth = async (req, res) => {
  try {
    const state = crypto.randomBytes(32).toString("hex");
    setOAuthStateCookie(res, state);

    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: process.env.GOOGLE_CALLBACK_URL,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "select_account",
      state,
    });

    res.redirect(
      `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
    );
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({ error: "Failed to start Google authentication" });
  }
};

export const googleAuthCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    const savedState = getCookie(req, "oauth_state");

    if (!code) {
      return redirectWithError(res, "Authorization code missing from Google");
    }
    if (!state || !savedState || state !== savedState) {
      return redirectWithError(res, "Invalid OAuth state (possible CSRF)");
    }

    clearOAuthStateCookie(res);

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("Google token error:", tokenData);
      return redirectWithError(res, "Failed to authenticate with Google");
    }

    const googleUserResponse = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }
    );
    const googleUser = await googleUserResponse.json();
    if (!googleUserResponse.ok) {
      console.error("Google user error:", googleUser);
      return redirectWithError(res, "Failed to fetch Google user profile");
    }

    const email = normalizeEmail(googleUser.email);
    const name = googleUser.name || googleUser.given_name || "Google User";
    if (!email) {
      return redirectWithError(res, "Google account has no email address");
    }

    let user = await User.findOne({ email });
    let isNew = false;
    if (!user) {
      const password = await getOAuthUserPassword();
      user = await User.create({ name, email, password });
      isNew = true;
    }

    if (isNew) {
      await createWorkspaceForUser(user);
      addAuditLog(
        user.workspaceId,
        user._id,
        "register",
        `User ${user.email} registered via Google`
      );
    } else if (user.workspaceId) {
      addAuditLog(
        user.workspaceId,
        user._id,
        "login",
        `User ${user.email} logged in via Google`
      );
    }

    const token = generateToken(user);
    res.redirect(
      `${FRONTEND_URL}/oauth-success?token=${encodeURIComponent(token)}`
    );
  } catch (error) {
    console.error("Google callback error:", error);
    redirectWithError(res, "Google authentication failed");
  }
};

/* =========================================================
   GITHUB OAUTH
========================================================= */

export const githubAuth = async (req, res) => {
  try {
    const state = crypto.randomBytes(32).toString("hex");
    const isConnect = req.query.connect === "true";

    let userId = null;
    if (isConnect) {
      const token =
        req.headers.authorization?.split(" ")[1] || req.cookies?.token;
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          userId = decoded.id;
        } catch (e) {
          // invalid token  fall through to the 401 below
        }
      }
      if (!userId) {
        return res
          .status(401)
          .json({ error: "You must be logged in to connect GitHub." });
      }
    }

    const stateData = { state, connect: isConnect, userId };
    const stateEncoded = Buffer.from(JSON.stringify(stateData)).toString(
      "base64"
    );
    setOAuthStateCookie(res, stateEncoded);

    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID,
      redirect_uri: process.env.GITHUB_CALLBACK_URL,
      scope: "repo user:email",
      state: stateEncoded,
    });

    res.redirect(
      `https://github.com/login/oauth/authorize?${params.toString()}`
    );
  } catch (error) {
    console.error("GitHub auth error:", error);
    res.status(500).json({ error: "Failed to start GitHub authentication" });
  }
};

export const githubAuthCallback = async (req, res) => {
  try {
    const { code, state: stateParam } = req.query;
    const savedState = getCookie(req, "oauth_state");
    if (!code) return redirectWithError(res, "Authorization code missing");
    if (!stateParam || !savedState || stateParam !== savedState) {
      return redirectWithError(res, "Invalid state");
    }

    clearOAuthStateCookie(res);

    let stateData = {};
    try {
      stateData = JSON.parse(
        Buffer.from(stateParam, "base64").toString("utf-8")
      );
    } catch (e) {
      stateData = { state: stateParam };
    }

    const isConnect = stateData.connect || false;
    const userId = stateData.userId || null;

    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: process.env.GITHUB_CALLBACK_URL,
        }),
      }
    );
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("GitHub token error:", tokenData);
      return redirectWithError(res, "Failed to authenticate with GitHub");
    }
    const accessToken = tokenData.access_token;

    const githubUserResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "CodeVerity",
      },
    });
    const githubUser = await githubUserResponse.json();
    if (!githubUserResponse.ok) {
      return redirectWithError(res, "Failed to fetch GitHub user profile");
    }

    let email = githubUser.email;
    if (!email) {
      const emailResponse = await fetch(
        "https://api.github.com/user/emails",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.github+json",
            "User-Agent": "CodeVerity",
          },
        }
      );
      const emails = await emailResponse.json();
      if (emailResponse.ok && Array.isArray(emails)) {
        const primary = emails.find((e) => e.primary && e.verified);
        email = primary?.email || emails.find((e) => e.verified)?.email;
      }
    }
    if (!email) return redirectWithError(res, "No verified email found");

    email = normalizeEmail(email);

    const name = githubUser.name || githubUser.login || "GitHub User";

    if (isConnect) {
      if (!userId) return redirectWithError(res, "User not identified");
      const user = await User.findById(userId);
      if (!user) return redirectWithError(res, "User not found");

      user.githubAccessToken = accessToken;
      user.githubId = String(githubUser.id);
      await user.save();

      return res.redirect(`${FRONTEND_URL}/settings?github=connected`);
    }

    // Login flow
    let user = await User.findOne({ email });
    let isNew = false;
    if (!user) {
      const password = await getOAuthUserPassword();
      user = await User.create({ name, email, password });
      isNew = true;
    }

    if (isNew) {
      await createWorkspaceForUser(user);
      addAuditLog(
        user.workspaceId,
        user._id,
        "register",
        `User ${user.email} registered via GitHub`
      );
    } else if (user.workspaceId) {
      addAuditLog(
        user.workspaceId,
        user._id,
        "login",
        `User ${user.email} logged in via GitHub`
      );
    }

    if (!user.githubAccessToken) {
      user.githubAccessToken = accessToken;
      user.githubId = String(githubUser.id);
      await user.save();
    }

    const jwtToken = generateToken(user);
    res.redirect(
      `${FRONTEND_URL}/oauth-success?token=${encodeURIComponent(jwtToken)}`
    );
  } catch (error) {
    console.error("GitHub callback error:", error);
    redirectWithError(res, "GitHub authentication failed");
  }
};

/* =========================================================
   DISCONNECT GITHUB
========================================================= */

export const disconnectGitHub = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: "User not found" });

    user.githubAccessToken = null;
    user.githubId = undefined; // removes the field, satisfying the sparse/partial unique index

    await user.save();

    if (user.workspaceId) {
      addAuditLog(
        user.workspaceId,
        user._id,
        "github_disconnect",
        `User ${user.email} disconnected GitHub`
      );
    }

    res.json({ success: true, message: "GitHub account disconnected." });
  } catch (err) {
    console.error("Disconnect GitHub error:", err);
    res.status(500).json({ error: "Failed to disconnect GitHub." });
  }
};