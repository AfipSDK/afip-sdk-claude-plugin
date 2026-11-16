import assert from 'node:assert/strict';
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';

const destination = 'plugins/claude';
const sources = new Map([
  ['.claude-plugin/plugin.json', '.claude-plugin/plugin.json'],
  ['.mcp.json', '.mcp.json'], ['icon.png', 'icon.png'], ['LICENSE', 'LICENSE'],
  ['README.md', 'docs/claude-plugin.md'],
]);
const decoder = new TextDecoder('utf-8', { fatal: true });
const imageTypes = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico']);
const packageFiles = /^(?:package(?:-lock)?\.json|npm-shrinkwrap\.json|pnpm-(?:workspace|lock)\.ya?ml|yarn\.lock|\.npmrc|\.yarnrc(?:\.yml)?|bun\.(?:lock|lockb)|bunfig\.toml|uv\.toml|pyproject\.toml|requirements(?:-[\w-]+)?\.txt|Pipfile(?:\.lock)?|poetry\.lock|composer\.(?:json|lock)|Cargo\.(?:toml|lock)|Gemfile(?:\.lock)?|go\.(?:mod|sum))$/i;

export function validatePath(path) {
  assert.match(path, /^[A-Za-z0-9._/-]+$/, `Nonportable path: ${path}`);
  for (const part of path.split('/')) {
    assert.ok(part && part !== '.' && part !== '..' && !part.endsWith('.'), `Unsafe path: ${path}`);
    assert.ok(!/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part), `Reserved path: ${path}`);
  }
}

function regular(root, path) {
  validatePath(path);
  const parts = path.split('/');
  for (let i = 1; i <= parts.length; i++) {
    const entry = parts.slice(0, i).join('/');
    const stat = lstatSync(resolve(root, entry));
    assert.ok(!stat.isSymbolicLink(), `Symlink is not permitted: ${entry}`);
    assert.ok(i === parts.length ? stat.isFile() : stat.isDirectory(), `Not a regular file: ${path}`);
  }
  return readFileSync(resolve(root, path));
}

function walk(root, path = '') {
  const dir = resolve(root, path);
  assert.ok(lstatSync(dir).isDirectory() && !lstatSync(dir).isSymbolicLink(), `Not a regular directory: ${dir}`);
  return readdirSync(dir).sort().flatMap((name) => {
    const relative = path ? `${path}/${name}` : name;
    validatePath(relative);
    const stat = lstatSync(resolve(root, relative));
    assert.ok(!stat.isSymbolicLink(), `Symlink is not permitted: ${relative}`);
    return stat.isDirectory() ? walk(root, relative) : [[relative, regular(root, relative)]];
  });
}

function validateImage(path, data) {
  const type = extname(path).toLowerCase();
  const fail = `Invalid ${type} image: ${path}`;
  if (type === '.png') {
    assert.ok(data.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')), fail);
    let offset = 8;
    const chunks = [];
    const compressed = [];
    while (offset < data.length) {
      assert.ok(offset + 12 <= data.length, fail);
      const size = data.readUInt32BE(offset);
      const kind = data.toString('ascii', offset + 4, offset + 8);
      assert.ok(offset + size + 12 <= data.length, fail);
      if (kind === 'IHDR') assert.ok(size === 13 && data.readUInt32BE(offset + 8) > 0 && data.readUInt32BE(offset + 12) > 0, fail);
      if (kind === 'IDAT') compressed.push(data.subarray(offset + 8, offset + 8 + size));
      if (kind === 'IEND') assert.ok(size === 0 && offset + 12 === data.length, fail);
      chunks.push(kind);
      offset += size + 12;
    }
    assert.ok(chunks[0] === 'IHDR' && chunks.at(-1) === 'IEND' && compressed.length, fail);
    assert.ok(inflateSync(Buffer.concat(compressed), { maxOutputLength: 32 * 1024 * 1024 }).length, fail);
  } else if (type === '.jpg' || type === '.jpeg') {
    assert.ok(data.subarray(0, 3).equals(Buffer.from([255, 216, 255])) && data.subarray(-2).equals(Buffer.from([255, 217])), fail);
  } else if (type === '.gif') {
    assert.ok(/^GIF8[79]a$/.test(data.toString('ascii', 0, 6)) && data.length > 13 && data.at(-1) === 59, fail);
  } else if (type === '.webp') {
    assert.ok(data.length >= 20 && data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP' && data.readUInt32LE(4) + 8 === data.length, fail);
  } else {
    assert.ok(data.length > 22 && data.readUInt32LE(0) === 65536 && data.readUInt16LE(4) > 0, fail);
  }
}

export function validateFiles(files) {
  assert.ok(files.size <= 512, 'Claude bundle exceeds 512 files');
  const casing = new Map();
  for (const [path, data] of files) {
    validatePath(path);
    const parts = path.split('/');
    parts.forEach((_, i) => {
      const prefix = parts.slice(0, i + 1).join('/');
      const previous = casing.get(prefix.toLowerCase());
      assert.ok(!previous || previous === prefix, `Case collision: ${path}`);
      casing.set(prefix.toLowerCase(), prefix);
    });
    assert.ok(sources.has(path) || /^skills\/[^/]+\/.+/.test(path), `Unexpected payload file: ${path}`);
    assert.ok(!parts.some((part) => packageFiles.test(part)), `Package manager file: ${path}`);
    assert.ok(!parts.slice(0, -1).some((part) => /^(?:\.claude.*|\.codex.*|bin|egress|node_modules)$/i.test(part)) || path === '.claude-plugin/plugin.json', `Forbidden component folder: ${path}`);
    assert.ok(path === '.mcp.json' || !/^(?:hooks|monitors)\.json$|^\.(?:mcp|lsp)\.json$/i.test(parts.at(-1)), `Unexpected component configuration: ${path}`);
    const type = extname(path).toLowerCase();
    const image = imageTypes.has(type);
    assert.ok(data.length < (image ? 5 * 1024 * 1024 : 256 * 1024), `File too large: ${path}`);
    if (image) { validateImage(path, data); continue; }
    assert.ok(path === 'LICENSE' || ['.md', '.txt', '.json', '.yaml', '.yml'].includes(type), `Forbidden file type: ${path}`);
    const text = decoder.decode(data);
    assert.ok(!text.includes('\0'), `NUL byte: ${path}`);
    assert.ok(!/^\s*#!/.test(text), `Shebang: ${path}`);
    if (type === '.json') JSON.parse(text);
    // Catch obvious renamed programs without treating fenced documentation examples as programs.
    const prose = text.replace(/^```[^\n]*\n[\s\S]*?^```\s*$/gm, '');
    assert.ok(!/^\s*(?:<\?php|<svg\b|<!doctype\s+html|<html\b|(?:const|let|var)\s+\w+\s*=|(?:async\s+)?function\s+\w+\s*\(|(?:import|export)\s.+(?:from\s+['"]|;\s*$)|import\s+[\w., ]+$|from\s+[\w.]+\s+import\b|(?:def|class)\s+\w+.*:\s*$|(?:print|console\.log)\s*\(|set\s+-[a-z]+\b|echo\s+['"])/im.test(prose), `Program disguised as text: ${path}`);
  }
  for (const path of sources.keys()) assert.ok(files.has(path), `Missing bundle file: ${path}`);
  const manifest = JSON.parse(decoder.decode(files.get('.claude-plugin/plugin.json')));
  assert.match(manifest.name, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
  const internal = (path, directory = false) => {
    assert.equal(typeof path, 'string', 'Component path must be a string');
    assert.ok(path.startsWith('./'), `Component path must start with ./: ${path}`);
    const relative = path.slice(2).replace(/\/$/, '');
    validatePath(relative);
    assert.ok(directory ? [...files.keys()].some((key) => key.startsWith(`${relative}/`) && key.endsWith('/SKILL.md')) : files.has(relative), `Missing/internal component path required: ${path}`);
  };
  for (const path of Array.isArray(manifest.skills) ? manifest.skills : [manifest.skills ?? './skills/']) internal(path, true);
  for (const key of ['icon', 'logo']) if (manifest[key]) {
    internal(manifest[key]);
    assert.ok(imageTypes.has(extname(manifest[key]).toLowerCase()), `Manifest ${key} must be an image`);
  }
  if (manifest.mcpServers) {
    assert.equal(manifest.mcpServers, './.mcp.json', 'Use only the bundled remote MCP config');
    internal(manifest.mcpServers);
  }
  for (const key of ['hooks', 'lspServers', 'monitors', 'workflows', 'commands', 'agents', 'outputStyles', 'experimental']) {
    assert.ok(!(key in manifest), `Unsupported component in this text-only bundle: ${key}`);
  }
  const mcp = JSON.parse(decoder.decode(files.get('.mcp.json')));
  assert.deepEqual(Object.keys(mcp), ['mcpServers'], 'Unexpected MCP top-level fields');
  assert.ok(mcp.mcpServers && Object.keys(mcp.mcpServers).length, 'Missing MCP servers');
  for (const server of Object.values(mcp.mcpServers)) {
    assert.deepEqual(Object.keys(server).sort(), ['type', 'url'], 'Only declarative remote MCP servers are allowed');
    assert.ok(['http', 'sse'].includes(server.type) && new URL(server.url).protocol === 'https:', 'MCP requires HTTPS');
    assert.ok(!new URL(server.url).username && !new URL(server.url).password, 'MCP URL must not contain credentials');
  }
  const readme = decoder.decode(files.get('README.md')).replace(/```[\s\S]*?```/g, '');
  assert.ok(readme.split(/\s+/).filter(Boolean).length >= 40, 'README needs at least 40 words outside code blocks');
  return files;
}

export function expectedClaudePackage(root) {
  const files = new Map([...sources].map(([target, source]) => [target, regular(root, source)]));
  for (const [path, data] of walk(root, 'skills')) files.set(path, data);
  return validateFiles(files);
}

export function validateClaudePackage(root) {
  const expected = expectedClaudePackage(root);
  if (existsSync(resolve(root, 'plugins'))) assert.ok(!lstatSync(resolve(root, 'plugins')).isSymbolicLink(), 'plugins/ must not be a symlink');
  const actual = validateFiles(new Map(walk(resolve(root, destination))));
  for (const path of actual.keys()) assert.ok(expected.has(path), `Extra bundle file: ${path}`);
  for (const [path, data] of expected) {
    assert.ok(actual.has(path), `Missing bundle file: ${path}`);
    assert.ok(data.equals(actual.get(path)), `Stale bundle file: ${path}; run node scripts/claude-package.mjs --write`);
  }
  return { files: actual.size, skills: [...actual.keys()].filter((path) => /^skills\/[^/]+\/SKILL\.md$/.test(path)).length };
}

export function writeClaudePackage(root) {
  const files = expectedClaudePackage(root); // Validate all inputs before touching generated output.
  const output = resolve(root, destination);
  if (existsSync(resolve(root, 'plugins'))) assert.ok(!lstatSync(resolve(root, 'plugins')).isSymbolicLink(), 'plugins/ must not be a symlink');
  if (existsSync(output)) walk(output); // Refuse symlinks before synchronizing the owned generated directory.
  mkdirSync(output, { recursive: true });
  if (existsSync(output)) for (const [path] of walk(output)) if (!files.has(path)) rmSync(resolve(output, path));
  for (const [path, data] of files) {
    mkdirSync(dirname(resolve(output, path)), { recursive: true });
    writeFileSync(resolve(output, path), data);
  }
  return validateClaudePackage(root);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  assert.ok(process.argv.length <= 3 && [undefined, '--check', '--write'].includes(process.argv[2]), 'Usage: node scripts/claude-package.mjs [--check|--write]');
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const result = process.argv[2] === '--write' ? writeClaudePackage(root) : validateClaudePackage(root);
  console.log(`PASS: Claude bundle, ${result.files} files, ${result.skills} skills, canonical byte parity.`);
}
