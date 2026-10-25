const { describe, it } = require('node:test');
const assert = require('node:assert');
const validateContentType = require('../middleware/validateContentType');
const validateTask = require('../middleware/validateTask');
const { validateRegister, validateLogin } = require('../middleware/validateAuth');
const authMiddleware = require('../middleware/authMiddleware');

describe('Backend Middleware Unit Tests', () => {

  describe('validateContentType middleware', () => {
    it('should return 400 if Content-Type is missing on POST request', () => {
      const req = { method: 'POST', headers: {} };
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

      validateContentType(req, res, next);

      assert.strictEqual(statusCode, 400);
      assert.strictEqual(jsonResponse.error, 'Content-Type must be application/json');
      assert.strictEqual(nextCalled, false);
    });

    it('should call next() if Content-Type is application/json on POST request', () => {
      const req = {
        method: 'POST',
        headers: { 'content-type': 'application/json' }
      };
      let nextCalled = false;
      const next = () => { nextCalled = true; };
      const res = {};

      validateContentType(req, res, next);

      assert.strictEqual(nextCalled, true);
    });
  });

  describe('validateTask middleware', () => {
    it('should return 400 if task title is missing or empty', () => {
      const req = { body: { title: '' } };
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

    it('should call next() when task title is a non-empty string', () => {
      const req = { body: { title: 'Implement GitHub Actions Pipeline' } };
      let nextCalled = false;
      const next = () => { nextCalled = true; };
      const res = {};

      validateTask(req, res, next);

      assert.strictEqual(nextCalled, true);
    });
  });

  describe('validateAuth middleware', () => {
    it('should reject registration if email is missing', () => {
      const req = { body: { name: 'John Doe', email: '', password: 'secretpassword' } };
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

      validateRegister(req, res, next);

      assert.strictEqual(statusCode, 400);
      assert.strictEqual(jsonResponse.error, 'Email is required');
      assert.strictEqual(nextCalled, false);
    });

    it('should pass registration validation when all fields are present', () => {
      const req = { body: { name: 'Harshil Patel', email: 'harshil@example.com', password: 'password123' } };
      let nextCalled = false;
      const next = () => { nextCalled = true; };
      const res = {};

      validateRegister(req, res, next);

      assert.strictEqual(nextCalled, true);
    });

    it('should reject login if password is missing', () => {
      const req = { body: { email: 'harshil@example.com', password: '' } };
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

      validateLogin(req, res, next);

      assert.strictEqual(statusCode, 400);
      assert.strictEqual(jsonResponse.error, 'Password is required');
      assert.strictEqual(nextCalled, false);
    });
  });

  describe('authMiddleware', () => {
    it('should return 401 if Authorization header is missing', () => {
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
});
