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
  return bcrypt.hash(
    crypto.randomBytes(32).toString("hex"),
    10
  );
};

// ✅ Improved cookie helper – uses res.cookie()
const setOAuthStateCookie = (res, state) => {
  res.cookie('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600000, // 10 minutes
    path: '/',
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
  res.clearCookie('oauth_state', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
};

// Helper to redirect with error
const redirectWithError = (res, errorMessage) => {
  res.redirect(`${FRONTEND_URL}/oauth-error?error=${encodeURIComponent(errorMessage)}`);
};

/* =========================================================
   NORMAL REGISTER & LOGIN (unchanged)
========================================================= */

export const register = async (req, res) => {
  // ... (your existing code)
};

export const login = async (req, res) => {
  // ... (your existing code)
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

    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
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

    // Exchange code for access token
    const tokenResponse = await fetch(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
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
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("Google token error:", tokenData);
      return redirectWithError(res, "Failed to authenticate with Google");
    }

    // Get user info
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

    const email = googleUser.email;
    const name = googleUser.name || googleUser.given_name || "Google User";
    if (!email) {
      return redirectWithError(res, "Google account has no email address");
    }

    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      const password = await getOAuthUserPassword();
      user = await User.create({ name, email, password });
    }

    const token = generateToken(user);
    res.redirect(`${FRONTEND_URL}/oauth-success?token=${encodeURIComponent(token)}`);
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
    setOAuthStateCookie(res, state);

    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID,
      redirect_uri: process.env.GITHUB_CALLBACK_URL,
      scope: "read:user user:email",
      state,
    });

    res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
  } catch (error) {
    console.error("GitHub auth error:", error);
    res.status(500).json({ error: "Failed to start GitHub authentication" });
  }
};

export const githubAuthCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    const savedState = getCookie(req, "oauth_state");

    if (!code) {
      return redirectWithError(res, "Authorization code missing from GitHub");
    }
    if (!state || !savedState || state !== savedState) {
      return redirectWithError(res, "Invalid OAuth state (possible CSRF)");
    }

    clearOAuthStateCookie(res);

    // Exchange code for access token
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

    // Get GitHub user
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
      return redirectWithError(res, "Failed to fetch GitHub user profile");
    }

    // Get email (primary verified)
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
        const primary = emails.find((e) => e.primary && e.verified);
        email = primary?.email || emails.find((e) => e.verified)?.email;
      }
    }

    if (!email) {
      return redirectWithError(res, "No verified email found on GitHub account");
    }

    const name = githubUser.name || githubUser.login || "GitHub User";

    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      const password = await getOAuthUserPassword();
      user = await User.create({ name, email, password });
    }

    const token = generateToken(user);
    res.redirect(`${FRONTEND_URL}/oauth-success?token=${encodeURIComponent(token)}`);
  } catch (error) {
    console.error("GitHub callback error:", error);
    redirectWithError(res, "GitHub authentication failed");
  }
};

/* =========================================================
   DOWNLOAD REPORT (unchanged)
========================================================= */

export const downloadReportPDF = async (req, res) => {
  // ... (your existing code)
};