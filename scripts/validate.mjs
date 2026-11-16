import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateClaudePackage } from './claude-package.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const json = (path) => JSON.parse(read(path));
const endpoint = 'https://app.afipsdk.com/mcp';
const repository = 'https://github.com/AfipSDK/skills';
const manifests = ['plugin.json', '.claude-plugin/plugin.json', '.codex-plugin/plugin.json', '.antigravity-plugin/plugin.json'];
const version = json('plugin.json').version;
assert.match(version, /^\d+\.\d+\.\d+$/);
for (const path of manifests) {
  const value = json(path);
  assert.equal(value.name, 'afipsdk', path);
  assert.equal(value.version, version, path);
  assert.equal(value.repository, repository, path);
  assert.equal(value.license, 'Proprietary', path);
}
assert.equal(json('plugin.json').$schema, 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json');
assert.deepEqual(json('mcp.json'), {
  $schema: 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json',
  mcpServers: { afipsdk: { type: 'streamable-http', url: endpoint } },
});
assert.deepEqual(json('.mcp.json'), {
  mcpServers: { afipsdk: { type: 'http', url: endpoint } },
});
const codex = json('.codex-plugin/plugin.json');
assert.equal(codex.skills, './skills/');
assert.equal(codex.mcpServers, undefined, 'Codex must use the shared portable MCP config');
assert.deepEqual(codex.interface.capabilities, ['Read', 'Write']);
for (const path of [json('.claude-plugin/plugin.json').icon, codex.interface.logo, codex.interface.composerIcon, json('.antigravity-plugin/plugin.json').logo]) {
  assert.ok(path && existsSync(resolve(root, path)), `Missing asset: ${path}`);
}
const claudeMarket = json('.claude-plugin/marketplace.json');
assert.equal(claudeMarket.name, 'afipsdk');
assert.equal(claudeMarket.plugins.length, 1);
assert.equal(claudeMarket.plugins[0].name, 'afipsdk');
assert.equal(claudeMarket.plugins[0].source, './plugins/claude');
const codexMarket = json('.agents/plugins/marketplace.json');
assert.equal(codexMarket.name, 'afipsdk');
assert.equal(codexMarket.plugins.length, 1);
assert.equal(codexMarket.plugins[0].name, 'afipsdk');
assert.equal(codexMarket.plugins[0].source.url, `${repository}.git`);
assert.equal(codexMarket.plugins[0].policy.authentication, 'ON_USE');
const antigravity = json('mcp_config.json').mcpServers.afipsdk;
assert.equal(antigravity.serverUrl, endpoint);
assert.deepEqual(antigravity.headers, { Authorization: 'Bearer ${AFIPSDK_ACCESS_TOKEN}' });
assert.equal(antigravity.variables.length, 1);
assert.equal(antigravity.variables[0].name, 'AFIPSDK_ACCESS_TOKEN');

const skillDirs = readdirSync(resolve(root, 'skills')).filter((name) => statSync(resolve(root, 'skills', name)).isDirectory());
assert.equal(skillDirs.length, 30, 'Expected the existing 30 skills');
let referenceCount = 0;
for (const name of skillDirs) {
  const dir = resolve(root, 'skills', name);
  const content = readFileSync(resolve(dir, 'SKILL.md'), 'utf8');
  assert.equal(content.match(/^name:\s*(.+)$/m)?.[1].replace(/^['"]|['"]$/g, ''), name);
  assert.match(content, /^description:\s*\S/m, name);
  const links = [...content.matchAll(/\]\((references\/[^)]+)\)/g)];
  assert.ok(links.length, `Missing reference link: ${name}`);
  for (const [, link] of links) {
    const target = realpathSync(resolve(dir, link));
    assert.ok(target.startsWith(`${dir}${sep}`), `Reference escapes skill: ${name}`);
    JSON.parse(readFileSync(target, 'utf8'));
    referenceCount++;
  }
}

// Check public instructions without executing configuration or contacting a service.
for (const path of ['README.md', 'docs/mcp.md']) {
  const content = read(path);
  for (const [, block] of content.matchAll(/```json\n([\s\S]*?)```/g)) JSON.parse(block);
  for (const [, href] of content.matchAll(/\]\(([^)\s]+)\)/g)) {
    if (/^[a-z]+:|^#/.test(href)) continue;
    const target = resolve(root, dirname(path), href.split('#')[0]);
    assert.ok(!relative(root, target).startsWith('..'), `Link escapes repo: ${href}`);
    assert.ok(existsSync(target), `Broken local link in ${path}: ${href}`);
  }
}
validateClaudePackage(root);
console.log(`PASS: ${manifests.length} manifests, 30 skills, ${referenceCount} references, MCP contracts and documentation.`);
