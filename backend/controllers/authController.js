import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import PDFDocument from "pdfkit";
import Report from "../models/Report.js";

/* =========================================================
   HELPERS
========================================================= */

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

const getOAuthUserPassword = () => {
  // Used only for OAuth-created users if your User schema
  // requires a password field.
  return bcrypt.hash(
    crypto.randomBytes(32).toString("hex"),
    10
  );
};

const setOAuthStateCookie = (res, state) => {
  res.setHeader(
    "Set-Cookie",
    `oauth_state=${state}; HttpOnly; Path=/; SameSite=Lax; Max-Age=600`
  );
};

const getCookie = (req, name) => {
  const cookies = req.headers.cookie;

  if (!cookies) return null;

  const cookie = cookies
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.split("=")[1]) : null;
};

const clearOAuthStateCookie = (res) => {
  res.setHeader(
    "Set-Cookie",
    "oauth_state=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0"
  );
};

/* =========================================================
   NORMAL REGISTER
========================================================= */

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Name, email and password are required",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        error: "User already exists",
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashed,
    });

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Register error:", error);

    res.status(500).json({
      error: "Registration failed",
    });
  }
};

/* =========================================================
   NORMAL LOGIN
========================================================= */

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    if (!user.password) {
      return res.status(401).json({
        error:
          "This account uses Google/GitHub login. Please continue with that provider.",
      });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!validPassword) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      error: "Login failed",
    });
  }
};

/* =========================================================
   GOOGLE LOGIN
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

    const googleUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    res.redirect(googleUrl);
  } catch (error) {
    console.error("Google auth error:", error);

    res.status(500).json({
      error: "Failed to start Google authentication",
    });
  }
};

/* =========================================================
   GOOGLE CALLBACK
========================================================= */

export const googleAuthCallback = async (req, res) => {
  try {
    const { code, state } = req.query;

    const savedState = getCookie(req, "oauth_state");

    if (!code) {
      return res.status(400).json({
        error: "Google authorization code missing",
      });
    }

    if (!state || !savedState || state !== savedState) {
      return res.status(400).json({
        error: "Invalid OAuth state",
      });
    }

    clearOAuthStateCookie(res);

    /* -----------------------------------------
       Exchange authorization code for token
    ----------------------------------------- */

    const tokenResponse = await fetch(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: process.env.GOOGLE_CALLBACK_URL,
          grant_type: "authorization_code",
        }),
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Google token error:", tokenData);

      return res.status(400).json({
        error: "Failed to authenticate with Google",
      });
    }

    /* -----------------------------------------
       Get Google user information
    ----------------------------------------- */

    const googleUserResponse = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    const googleUser = await googleUserResponse.json();

    if (!googleUserResponse.ok) {
      console.error("Google user error:", googleUser);

      return res.status(400).json({
        error: "Failed to fetch Google user",
      });
    }

    const email = googleUser.email;
    const name =
      googleUser.name ||
      googleUser.given_name ||
      "Google User";

    if (!email) {
      return res.status(400).json({
        error: "Google account email not available",
      });
    }

    /* -----------------------------------------
       Find or create user
    ----------------------------------------- */

    let user = await User.findOne({ email });

    if (!user) {
      const password = await getOAuthUserPassword();

      user = await User.create({
        name,
        email,
        password,
      });
    }

    const token = generateToken(user);

    /* -----------------------------------------
       Send token back to frontend
    ----------------------------------------- */

    res.redirect(
      `${FRONTEND_URL}/oauth-success?token=${encodeURIComponent(token)}`
    );
  } catch (error) {
    console.error("Google callback error:", error);

    res.status(500).json({
      error: "Google authentication failed",
    });
  }
};

/* =========================================================
   GITHUB LOGIN
========================================================= */

export const githubAuth = async (req, res) => {
  try {
    const state = crypto.randomBytes(32).toString("hex");

    setOAuthStateCookie(res, state);

    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID,
      redirect_uri: process.env.GITHUB_CALLBACK_URL,
      scope: "read:user user:email",
      state,
    });

    const githubUrl =
      `https://github.com/login/oauth/authorize?${params.toString()}`;

    res.redirect(githubUrl);
  } catch (error) {
    console.error("GitHub auth error:", error);

    res.status(500).json({
      error: "Failed to start GitHub authentication",
    });
  }
};

/* =========================================================
   GITHUB CALLBACK
========================================================= */

export const githubAuthCallback = async (req, res) => {
  try {
    const { code, state } = req.query;

    const savedState = getCookie(req, "oauth_state");

    if (!code) {
      return res.status(400).json({
        error: "GitHub authorization code missing",
      });
    }

    if (!state || !savedState || state !== savedState) {
      return res.status(400).json({
        error: "Invalid OAuth state",
      });
    }

    clearOAuthStateCookie(res);

    /* -----------------------------------------
       Exchange code for GitHub access token
    ----------------------------------------- */

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

      return res.status(400).json({
        error: "Failed to authenticate with GitHub",
      });
    }

    /* -----------------------------------------
       Get GitHub profile
    ----------------------------------------- */

    const githubUserResponse = await fetch(
      "https://api.github.com/user",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "CodeVerity",
        },
      }
    );

    const githubUser = await githubUserResponse.json();

    if (!githubUserResponse.ok) {
      console.error("GitHub user error:", githubUser);

      return res.status(400).json({
        error: "Failed to fetch GitHub user",
      });
    }

    /* -----------------------------------------
       GitHub may not expose public email
    ----------------------------------------- */

    let email = githubUser.email;

    if (!email) {
      const emailResponse = await fetch(
        "https://api.github.com/user/emails",
        {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            Accept: "application/vnd.github+json",
            "User-Agent": "CodeVerity",
          },
        }
      );

      const emails = await emailResponse.json();

      if (emailResponse.ok && Array.isArray(emails)) {
        const primaryEmail = emails.find(
          (item) => item.primary && item.verified
        );

        email =
          primaryEmail?.email ||
          emails.find((item) => item.verified)?.email;
      }
    }

    if (!email) {
      return res.status(400).json({
        error:
          "No verified email found on your GitHub account",
      });
    }

    const name =
      githubUser.name ||
      githubUser.login ||
      "GitHub User";

    /* -----------------------------------------
       Find or create user
    ----------------------------------------- */

    let user = await User.findOne({ email });

    if (!user) {
      const password = await getOAuthUserPassword();

      user = await User.create({
        name,
        email,
        password,
      });
    }

    const token = generateToken(user);

    /* -----------------------------------------
       Send token to frontend
    ----------------------------------------- */

    res.redirect(
      `${FRONTEND_URL}/oauth-success?token=${encodeURIComponent(token)}`
    );
  } catch (error) {
    console.error("GitHub callback error:", error);

    res.status(500).json({
      error: "GitHub authentication failed",
    });
  }
};

/* =========================================================
   DOWNLOAD REPORT
========================================================= */

export const downloadReportPDF = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        error: "Report not found",
      });
    }

    const doc = new PDFDocument();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=report.pdf"
    );

    doc.pipe(res);

    doc.fontSize(18).text("AI Code Review Report\n\n");
    doc
      .fontSize(12)
      .text(JSON.stringify(report.analysis, null, 2));

    doc.end();
  } catch (error) {
    console.error("Download report error:", error);

    res.status(500).json({
      error: "Failed to generate report",
    });
  }
};