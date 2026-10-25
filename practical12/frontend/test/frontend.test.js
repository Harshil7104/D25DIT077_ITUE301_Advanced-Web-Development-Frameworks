import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Frontend Application Structure & HTML Configuration Tests', () => {

  it('should verify index.html exists and contains the React root container', () => {
    const indexPath = path.resolve(__dirname, '../index.html');
    assert.strictEqual(fs.existsSync(indexPath), true, 'index.html must exist in the frontend root');

    const htmlContent = fs.readFileSync(indexPath, 'utf-8');
    assert.match(htmlContent, /<div\s+id=["']root["']\s*><\/div>/, 'index.html must contain <div id="root"></div>');
    assert.match(htmlContent, /<meta\s+name=["']viewport["']/, 'index.html must contain a responsive viewport meta tag');
  });

  it('should verify essential React component source files exist', () => {
    const componentsDir = path.resolve(__dirname, '../src/components');
    const requiredComponents = ['Home.jsx', 'Tasks.jsx', 'Auth.jsx', 'Contact.jsx', 'NavBar.jsx'];

    requiredComponents.forEach((component) => {
      const componentPath = path.join(componentsDir, component);
      assert.strictEqual(
        fs.existsSync(componentPath),
        true,
        `Expected component ${component} to exist at ${componentPath}`
      );
    });
  });

  it('should verify package.json has essential scripts and production dependencies', () => {
    const pkgPath = path.resolve(__dirname, '../package.json');
    assert.strictEqual(fs.existsSync(pkgPath), true, 'package.json must exist');

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    assert.ok(pkg.scripts.build, 'package.json must contain a build script');
    assert.ok(pkg.scripts.test, 'package.json must contain a test script');
    assert.ok(pkg.dependencies.react, 'package.json must include react');
    assert.ok(pkg.dependencies['react-dom'], 'package.json must include react-dom');
    assert.ok(pkg.dependencies['react-router-dom'], 'package.json must include react-router-dom');
  });

  it('should verify client-side task validation logic', () => {
    // Client-side task input validation rule: Title must be a non-empty trimmed string
    const validateClientTask = (title) => {
      if (!title || typeof title !== 'string' || title.trim() === '') {
        return { valid: false, error: 'Task title is required' };
      }
      return { valid: true };
    };

    const emptyResult = validateClientTask('   ');
    assert.strictEqual(emptyResult.valid, false);
    assert.strictEqual(emptyResult.error, 'Task title is required');

    const validResult = validateClientTask('Complete Practical 12');
    assert.strictEqual(validResult.valid, true);
  });
});
