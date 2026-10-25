const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const validateTask = require('../middleware/validateTask');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Protect AI route with existing JWT authentication middleware
router.use(authMiddleware);

// Rate limiting map: tracks timestamp of last AI request per user/task to avoid excessive API usage
// Cooldown: 1 request per minute (60,000 ms)
const rateLimitMap = new Map();
const RATE_LIMIT_COOLDOWN_MS = 60 * 1000;

// Periodic cleanup of stale rate-limit timestamps
setInterval(() => {
  const cutoff = Date.now() - RATE_LIMIT_COOLDOWN_MS;
  for (const [key, timestamp] of rateLimitMap.entries()) {
    if (timestamp < cutoff) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

/**
 * POST /api/ai/generate-description
 * Generates a concise, context-aware task description based on the provided title using Google Gemini API.
 */
router.post('/generate-description', validateTask, async (req, res, next) => {
  const { title } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  // 1. Guard against unconfigured or empty API key on server
  if (!apiKey || !apiKey.trim()) {
    return res.status(503).json({
      error: 'AI service is currently unavailable. Gemini API key is not configured on the server. You can enter the description manually.'
    });
  }

  // 2. Simple Rate Limiting: Max 1 AI request per user/task per minute
  const userId = (req.user && (req.user.userId || req.user.id || req.user.email)) || req.ip || 'client';
  const rateLimitKey = `${userId}_${title.trim().toLowerCase()}`;
  const now = Date.now();
  const lastRequestTime = rateLimitMap.get(rateLimitKey) || rateLimitMap.get(userId);

  if (lastRequestTime && now - lastRequestTime < RATE_LIMIT_COOLDOWN_MS) {
    const remainingSeconds = Math.ceil((RATE_LIMIT_COOLDOWN_MS - (now - lastRequestTime)) / 1000);
    return res.status(429).json({
      error: `Rate limit reached (max 1 AI request per minute). Please wait ${remainingSeconds} second${remainingSeconds > 1 ? 's' : ''} before trying again.`
    });
  }

  // Record rate limit timestamp
  rateLimitMap.set(rateLimitKey, now);
  rateLimitMap.set(userId, now);

  // 2. Call Google Gemini API with timeout protection
  const TIMEOUT_MS = 60000; // 60 second timeout for reliable external LLM responses

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const candidateModels = [
      process.env.GEMINI_MODEL,
      'gemini-3.5-flash',
      'gemini-3.6-flash',
      'gemini-3.7-flash',
      'gemini-3.8-flash',
      'gemini-flash-latest',
      'gemini-2.5-flash',
      'gemini-1.5-flash'
    ].filter(Boolean);

    const prompt = `Provide a concise, practical 1 to 2 sentence description (maximum 40 words) for a task titled: "${title.trim()}". Return only the description text without any title, prefix, markdown headings, or conversational filler.`;

    // Timeout promise to prevent hung requests
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('AI_TIMEOUT')), TIMEOUT_MS);
    });

    const generatePromise = (async () => {
      let lastErr = null;
      for (const modelName of candidateModels) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          const response = await result.response;
          const text = response.text();
          if (text && typeof text === 'string' && text.trim()) {
            return text;
          }
        } catch (e) {
          lastErr = e;
          // Fallback to next candidate model on 503, 404, 429, etc.
          continue;
        }
      }
      throw lastErr || new Error('No compatible Gemini model found');
    })();

    const rawDescription = await Promise.race([generatePromise, timeoutPromise]);

    if (!rawDescription || typeof rawDescription !== 'string') {
      return res.status(502).json({
        error: 'Received an empty response from AI service. Please try again or enter the description manually.'
      });
    }

    // Clean up any leading/trailing quotes, markdown headers, or redundant prefix
    let cleanDescription = rawDescription
      .trim()
      .replace(/^["']|["']$/g, '')
      .replace(/^(\*\*.*?\*\*|Task:\s*|Description:\s*)/i, '')
      .trim();

    return res.status(200).json({
      description: cleanDescription
    });
  } catch (err) {
    if (err.message === 'AI_TIMEOUT') {
      return res.status(504).json({
        error: 'AI request timed out. Please try again or enter the description manually.'
      });
    }

    // Safely log the error on the server without exposing the API key
    console.error('[AI Service Error]:', err.message || err);

    return res.status(500).json({
      error: 'Unable to generate description right now. Please try again or enter the description manually.'
    });
  }
});

module.exports = router;
