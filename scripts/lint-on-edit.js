#!/usr/bin/env node
// PostToolUse hook: after Claude writes or edits a .js file, run the ESLint
// that belongs to that file's project. Problems go to stderr with exit code 2
// so Claude sees them and can fix them. Anything else exits 0 quietly, so the
// hook never gets in the way of files it does not understand.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

// Walk up from the edited file to the nearest folder with an ESLint flat
// config and a local eslint install.
function findProjectRoot(start) {
  let dir = path.dirname(start);
  for (;;) {
    const hasConfig = ['eslint.config.js', 'eslint.config.mjs', 'eslint.config.cjs']
      .some((f) => fs.existsSync(path.join(dir, f)));
    if (hasConfig && fs.existsSync(path.join(dir, 'node_modules', '.bin', 'eslint'))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

let input = {};
try {
  input = JSON.parse(readStdin() || '{}');
} catch {
  process.exit(0);
}

const filePath = input.tool_input && input.tool_input.file_path;
if (!filePath || !/\.(c|m)?js$/.test(filePath) || !fs.existsSync(filePath)) {
  process.exit(0);
}

const root = findProjectRoot(path.resolve(filePath));
if (!root) process.exit(0);

const eslint = path.join(root, 'node_modules', '.bin', 'eslint');
const result = spawnSync(eslint, ['--no-warn-ignored', path.relative(root, filePath)], {
  cwd: root,
  encoding: 'utf8',
});

if (result.status === 0) process.exit(0);

const output = `${result.stdout || ''}${result.stderr || ''}`.trim();
process.stderr.write(`ESLint found problems in ${path.relative(root, filePath)}:\n${output}\n`);
process.exit(2);
