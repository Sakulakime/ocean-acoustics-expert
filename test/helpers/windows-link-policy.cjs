// Model only the directory-link permission policy, not the Windows runtime.
const fs = require('node:fs');
const path = require('node:path');
const { syncBuiltinESMExports } = require('node:module');
const original = fs.symlinkSync;
const originalReadlink = fs.readlinkSync;
// Doctor-only virtual path mapping, restricted to one manifest link.
for (const method of ['lstatSync', 'statSync']) {
  const originalStat = fs[method];
  fs[method] = function (entry, ...args) {
    return originalStat(entry === process.env.OAE_TEST_VIRTUAL_LINK
      ? process.env.OAE_TEST_REAL_LINK : entry, ...args);
  };
}
fs.readlinkSync = function (entry, ...args) {
  if (entry === process.env.OAE_TEST_VIRTUAL_LINK) return process.env.OAE_TEST_READLINK_TARGET;
  const target = originalReadlink(entry, ...args);
  return entry === process.env.OAE_TEST_FILE_LINK ? `\\\\?\\${target}` : target;
};

// Select future platform-dependent installer logic. Paths and filesystem
// remain Linux-native; this is not Windows path/runtime emulation.
Object.defineProperty(process, 'platform', { value: 'win32' });

fs.symlinkSync = function (target, destination, type) {
  const nativeTarget = target.replace(/^\\\\\?\\/, '');
  if (type === 'junction' && fs.existsSync(nativeTarget) && fs.statSync(nativeTarget).isFile()) {
    const error = new Error('ENOTDIR: junction target is a file');
    error.code = 'ENOTDIR';
    throw error;
  }
  if (destination === process.env.OAE_TEST_LINK || process.env.OAE_TEST_ALL_LINKS === '1') {
    if (type !== 'junction') {
      const error = new Error(`EPERM: operation not permitted, symlink '${target}' -> '${destination}'`);
      error.code = 'EPERM';
      throw error;
    }
    if (!path.isAbsolute(target)) {
      throw new Error('The modeled junction must have an absolute target');
    }
    // Linux symlink stands in for successful junction creation only.
    return original(target, destination, 'dir');
  }
  return original(nativeTarget, destination, type);
};
syncBuiltinESMExports();
