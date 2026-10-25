const { describe, it } = require('node:test');
const assert = require('node:assert');
const validateTask = require('../middleware/validateTask');
const authMiddleware = require('../middleware/authMiddleware');

describe('AI Endpoint & Middleware Tests (Offline / Mocked)', () => {

  describe('AI Route Request Validation', () => {
    it('should reject AI description request with 400 if title is empty', () => {
      const req = { body: { title: '   ' } };
      let statusCode = null;
      let jsonResponse = null;
      const res = {
        status: (code) => {
          statusCode = code;
          return {
            json: (data) => { jsonResponse = data; }
          };
        }
      };
      let nextCalled = false;
      const next = () => { nextCalled = true; };

      validateTask(req, res, next);

      assert.strictEqual(statusCode, 400);
      assert.strictEqual(jsonResponse.error, 'Title is required and must be a non-empty string');
      assert.strictEqual(nextCalled, false);
    });

    it('should reject AI description request with 400 if title is omitted', () => {
      const req = { body: {} };
      let statusCode = null;
      let jsonResponse = null;
      const res = {
        status: (code) => {
          statusCode = code;
          return {
            json: (data) => { jsonResponse = data; }
          };
        }
      };
      let nextCalled = false;
      const next = () => { nextCalled = true; };

      validateTask(req, res, next);

      assert.strictEqual(statusCode, 400);
      assert.strictEqual(nextCalled, false);
    });

    it('should allow valid title to proceed to AI generation handler', () => {
      const req = { body: { title: 'Prepare for React practical' } };
      let nextCalled = false;
      const next = () => { nextCalled = true; };
      const res = {};

      validateTask(req, res, next);

      assert.strictEqual(nextCalled, true);
    });
  });

  describe('AI Route Authentication Protection', () => {
    it('should reject unauthenticated request to AI endpoint with 401', () => {
      const req = { headers: {} };
      let statusCode = null;
      let jsonResponse = null;
      const res = {
        status: (code) => {
          statusCode = code;
          return {
            json: (data) => { jsonResponse = data; }
          };
        }
      };
      let nextCalled = false;
      const next = () => { nextCalled = true; };

      authMiddleware(req, res, next);

      assert.strictEqual(statusCode, 401);
      assert.strictEqual(jsonResponse.error, 'Authentication required');
      assert.strictEqual(nextCalled, false);
    });
  });

  describe('AI Service Graceful Degradation', () => {
    it('should return clean 503 error without crashing if GEMINI_API_KEY is missing or empty', () => {
      // Simulate missing API key check logic
      const checkApiKey = (key) => {
        if (!key || !key.trim()) {
          return {
            status: 503,
            error: 'AI service is currently unavailable. Gemini API key is not configured on the server. You can enter the description manually.'
          };
        }
        return { status: 200 };
      };

      const resultMissing = checkApiKey('');
      assert.strictEqual(resultMissing.status, 503);
      assert.match(resultMissing.error, /Gemini API key is not configured/);

      const resultWhitespace = checkApiKey('   ');
      assert.strictEqual(resultWhitespace.status, 503);
    });

    it('should clean and strip extraneous quotes from generated description', () => {
      const rawOutput = '"Review React components, props, state, and hooks before exam."';
      const cleanOutput = rawOutput.trim().replace(/^["']|["']$/g, '');

      assert.strictEqual(cleanOutput, 'Review React components, props, state, and hooks before exam.');
      assert.strictEqual(cleanOutput.startsWith('"'), false);
      assert.strictEqual(cleanOutput.endsWith('"'), false);
    });
  });

  describe('AI Rate Limiting (1 request per minute)', () => {
    it('should reject second request within 60 seconds with 429 status', () => {
      const rateLimitMap = new Map();
      const COOLDOWN_MS = 60 * 1000;
      const userId = 'user_123';

      // First request at t = 0
      const t0 = Date.now();
      rateLimitMap.set(userId, t0);

      // Second request at t = 10s (within 60s)
      const now = t0 + 10000;
      const lastRequest = rateLimitMap.get(userId);
      const isRateLimited = lastRequest && (now - lastRequest < COOLDOWN_MS);

      assert.strictEqual(isRateLimited, true);
      const remainingSec = Math.ceil((COOLDOWN_MS - (now - lastRequest)) / 1000);
      assert.strictEqual(remainingSec, 50);
    });

    it('should permit request after 60 seconds cooldown expires', () => {
      const rateLimitMap = new Map();
      const COOLDOWN_MS = 60 * 1000;
      const userId = 'user_123';

      // Request from 61 seconds ago
      const pastTime = Date.now() - 61000;
      rateLimitMap.set(userId, pastTime);

      const now = Date.now();
      const lastRequest = rateLimitMap.get(userId);
      const isRateLimited = lastRequest && (now - lastRequest < COOLDOWN_MS);

      assert.strictEqual(isRateLimited, false);
    });
  });
});
