// backend/controllers/analyzeController.js
import { analyzeWithGroq, generateTests } from "../utils/groq.js";
import User from "../models/User.js";

// ─── Helper: estimate tokens if not returned ──────────────
function estimateTokens(text) {
  // Rough approximation: ~4 chars per token
  return Math.ceil(text.length / 4);
}

// ─── POST /api/analyze ─────────────────────────────────────
export const analyzeCode = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code || code.trim().length < 10) {
      return res.status(400).json({ error: "Invalid code input." });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const response = await analyzeWithGroq(code);
    const tokensUsed = response.usage?.total_tokens ?? estimateTokens(code);

    const deducted = await user.deductTokens(tokensUsed);
    if (!deducted) {
      return res.status(402).json({
        error: `Insufficient tokens. You have ${user.tokensRemaining} tokens, need ${tokensUsed}.`,
      });
    }

    return res.status(200).json({
      ...response.result,
      _sourceCode: code,
      tokensUsed,
      tokensRemaining: user.tokensRemaining,
    });
  } catch (err) {
    console.error("analyzeCode error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// ─── POST /api/analyze/generate-tests ──────────────────────
export const generateTestCases = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code || typeof code !== "string" || code.trim().length < 10) {
      return res.status(400).json({
        error: "Request body must contain a non-empty 'code' string.",
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    console.log(`📥 /api/generate-tests received ${code.length} chars`);

    const result = await generateTests(code);   // returns { tests, usage: { total_tokens } }

    let tokensUsed = result?.usage?.total_tokens ?? estimateTokens(code);
    console.log(`🔢 Tokens used: ${tokensUsed}`);

    const deducted = await user.deductTokens(tokensUsed);
    if (!deducted) {
      return res.status(402).json({
        error: `Insufficient tokens. You have ${user.tokensRemaining} tokens, need ${tokensUsed}.`,
      });
    }

    return res.status(200).json({
      ...result,
      tokensUsed,
      tokensRemaining: user.tokensRemaining,
    });

  } catch (err) {
    console.error("❌ generateTestCases error:", err.message);
    return res.status(500).json({ error: err.message ?? "Test generation failed." });
  }
};