import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, renameSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { expectedClaudePackage, validateClaudePackage, validateFiles, validatePath, writeClaudePackage } from './claude-package.mjs';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=', 'base64');
const manifest = { name: 'afipsdk', version: '0.2.1', icon: './icon.png', license: 'Proprietary' };
const readme = '# Afip SDK\n\n' + 'This plugin provides documented workflows through an authorized remote MCP connection. '.repeat(5);
const skill = '---\nname: sample\ndescription: A sample workflow.\n---\n\n# Sample workflow\nRead the documented reference before using the remote tool.\n';
const bytes = (value) => Buffer.isBuffer(value) ? value : Buffer.from(value);
const json = (value) => Buffer.from(JSON.stringify(value, null, 2) + '\n');
function files() {
  return new Map([
    ['.claude-plugin/plugin.json', json(manifest)], ['.mcp.json', json({ mcpServers: { afipsdk: { type: 'http', url: 'https://app.afipsdk.com/mcp' } } })],
    ['icon.png', png], ['LICENSE', bytes('Proprietary. All rights reserved.\n')], ['README.md', bytes(readme)],
    ['skills/sample/SKILL.md', bytes(skill)], ['skills/sample/references/input-schema.json', json({ type: 'object' })],
  ]);
}
function put(root, path, value) {
  const target = join(root, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, bytes(value));
}
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'claude-package-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const [path, data] of files()) put(root, path === 'README.md' ? 'docs/claude-plugin.md' : path, data);
  return root;
}
function rejectsFile(path, value, pattern) {
  const input = files();
  input.set(path, bytes(value));
  assert.throws(() => validateFiles(input), pattern);
}

test('allowlisted generation is deterministic and preserves all shared skill bytes', (t) => {
  const root = fixture(t);
  put(root, 'scripts/maintenance.js', 'process.exit(1)');
  put(root, '.claude-plugin/marketplace.json', '{}');
  assert.deepEqual(writeClaudePackage(root), { files: 7, skills: 1 });
  const first = expectedClaudePackage(root);
  assert.deepEqual(writeClaudePackage(root), validateClaudePackage(root));
  for (const [path, data] of first) assert.deepEqual(readFileSync(join(root, 'plugins/claude', path)), data);
  assert.deepEqual(first, expectedClaudePackage(root));
});

test('check detects missing, stale and extra files; write resynchronizes', (t) => {
  const root = fixture(t);
  writeClaudePackage(root);
  put(root, 'plugins/claude/skills/sample/references/input-schema.json', '{}');
  assert.throws(() => validateClaudePackage(root), /Stale bundle/);
  writeClaudePackage(root);
  rmSync(join(root, 'plugins/claude/skills/sample/references/input-schema.json'));
  assert.throws(() => validateClaudePackage(root), /Missing bundle/);
  writeClaudePackage(root);
  put(root, 'plugins/claude/skills/sample/extra.md', '# Extra documentation');
  assert.throws(() => validateClaudePackage(root), /Extra bundle/);
  writeClaudePackage(root);
  assert.deepEqual(validateClaudePackage(root), { files: 7, skills: 1 });
  put(root, 'skills/sample/SKILL.md', skill + '\nNew canonical content.\n');
  assert.throws(() => validateClaudePackage(root), /Stale bundle/);
});

test('script formats, disguised programs and unsupported payloads are rejected', () => {
  for (const path of ['scripts/run.js', 'skills/sample/run.js', 'skills/sample/icon.svg', 'skills/sample/references/package.json', 'skills/sample/pnpm-workspace.yaml', '.claude-plugin/marketplace.json', 'skills/sample/hooks.json', 'skills/sample/.mcp.json', 'skills/sample/.claude/skills/nested/SKILL.md', 'skills/sample/nested/.claude-plugin/plugin.json', 'skills/sample/egress/hosts.json']) {
    rejectsFile(path, '{}', /Unexpected|Forbidden|Package manager/);
  }
  for (const content of ['#!/bin/sh\necho hi', '\uFEFF#!/usr/bin/env python\nprint(1)', 'const hidden = 1;\nconsole.log(hidden);', 'import os\nos.system("echo hidden")', '<svg xmlns="http://www.w3.org/2000/svg"></svg>']) {
    rejectsFile('skills/sample/program.md', content, /Shebang|Program disguised/);
  }
  const documented = files();
  documented.set('skills/sample/examples.md', bytes('# Usage example\n\n```js\nconst example = 1;\nconsole.log(example);\n```\n'));
  assert.doesNotThrow(() => validateFiles(documented));
});

test('UTF-8, NUL, JSON, file size and actual PNG checks', () => {
  rejectsFile('skills/sample/with-nul.txt', 'hello\0world', /NUL/);
  rejectsFile('skills/sample/encoding.txt', Buffer.from([0xc3, 0x28]), /encoded data/);
  rejectsFile('skills/sample/reference.json', '{broken', /JSON|property name/);
  rejectsFile('skills/sample/large.txt', Buffer.alloc(256 * 1024, 65), /too large/);
  rejectsFile('icon.png', bytes('not an image'), /Invalid.*image/);
  rejectsFile('icon.png', png.subarray(0, 30), /Invalid.*image/);
  rejectsFile('icon.png', Buffer.concat([png, bytes('const hidden = true;')]), /Invalid.*image/);
});

test('portable paths reject traversal, reserved names and case collisions', () => {
  for (const path of ['../outside.md', '/absolute.md', 'skills/sample/x:y.md', 'skills/sample/CON.md', 'skills/sample/name.', 'skills/sample/space .md', 'skills\\sample\\x.md']) {
    assert.throws(() => validatePath(path), /Unsafe|Nonportable|Reserved/);
  }
  rejectsFile('skills/SAMPLE/notes.md', '# Notes', /Case collision/);
});

test('component paths stay inside the bundle, name real directories/assets and use remote MCP only', () => {
  for (const change of [
    { icon: '../icon.png' }, { icon: './missing.png' }, { icon: './README.md' },
    { skills: './skills/sample/SKILL.md' }, { skills: './skills/missing' }, { skills: './../../skills' },
    { mcpServers: './missing.json' }, { hooks: './hooks/hooks.json' },
  ]) rejectsFile('.claude-plugin/plugin.json', json({ ...manifest, ...change }), /path|Component|image|MCP|Unsupported/);
  const declared = files();
  declared.set('.claude-plugin/plugin.json', json({ ...manifest, skills: ['./skills/sample'], mcpServers: './.mcp.json' }));
  assert.doesNotThrow(() => validateFiles(declared));
  for (const server of [
    { type: 'stdio', command: 'node', args: ['run.js'] },
    { type: 'http', url: 'http://app.afipsdk.com/mcp' },
    { type: 'http', url: 'https://user:password@example.com/mcp' },
  ]) rejectsFile('.mcp.json', json({ mcpServers: { unsafe: server } }), /Only declarative|HTTPS|credentials/);
});

test('symlinks in canonical inputs or generated output are refused before writing', (t) => {
  const root = fixture(t);
  writeClaudePackage(root);
  const source = join(root, 'skills/sample/SKILL.md');
  const original = readFileSync(join(root, 'plugins/claude/skills/sample/SKILL.md'));
  rmSync(source);
  symlinkSync(join(root, 'docs/claude-plugin.md'), source);
  assert.throws(() => writeClaudePackage(root), /Symlink/);
  assert.deepEqual(readFileSync(join(root, 'plugins/claude/skills/sample/SKILL.md')), original);
  rmSync(source);
  put(root, 'skills/sample/SKILL.md', skill);
  symlinkSync(join(root, 'docs/claude-plugin.md'), join(root, 'plugins/claude/linked.md'));
  assert.throws(() => validateClaudePackage(root), /Symlink/);
  assert.throws(() => writeClaudePackage(root), /Symlink/);
});

test('symlinked plugins ancestor cannot redirect validation or generation', (t) => {
  const root = fixture(t);
  writeClaudePackage(root);
  renameSync(join(root, 'plugins'), join(root, 'elsewhere'));
  symlinkSync(join(root, 'elsewhere'), join(root, 'plugins'), 'dir');
  assert.throws(() => validateClaudePackage(root), /symlink/);
  assert.throws(() => writeClaudePackage(root), /symlink/);
});
