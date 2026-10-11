// Model only the directory-link permission policy, not the Windows runtime.
const fs = require('node:fs');
const path = require('node:path');
const { syncBuiltinESMExports } = require('node:module');
const original = fs.symlinkSync;

// Select future platform-dependent installer logic. Paths and filesystem
// remain Linux-native; this is not Windows path/runtime emulation.
Object.defineProperty(process, 'platform', { value: 'win32' });

fs.symlinkSync = function (target, destination, type) {
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
  return original(target, destination, type);
};
syncBuiltinESMExports();
