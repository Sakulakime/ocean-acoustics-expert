import { test as nodeTest } from 'node:test';
// This is a Linux policy model, not an emulation of Windows paths or permissions.
const test = (name, fn) => nodeTest(name, { skip: process.platform === 'win32' }, fn);
import assert from 'node:assert/strict';
import { existsSync, readFileSync, realpathSync, writeFileSync, mkdirSync, symlinkSync, readlinkSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { installPaths, writeHome, writePackage } from './helpers/install.js';

const policy = fileURLToPath(new URL('./helpers/windows-link-policy.cjs', import.meta.url));

function install(t, inject) {
  const pkg = writePackage(t, { checkout: false });
  const home = writeHome(t);
  const paths = installPaths(home);
  const args = inject ? ['--require', policy] : [];
  const result = spawnSync(process.execPath, [
    ...args, join(pkg, 'bin/ocean-acoustics-expert.js'),
    'install', '--harness', 'claude', '--mode', 'copy', '--yes',
  ], {
    encoding: 'utf8',
    env: { PATH: process.env.PATH ?? '', HOME: home, USERPROFILE: home, OAE_TEST_LINK: paths.claudeSkill },
  });
  assert.equal(result.error, undefined);
  assert.equal(result.signal, null);
  return { result, paths };
}

test('control: real CLI copy install succeeds without the permission policy', (t) => {
  const { result, paths } = install(t, false);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(realpathSync(paths.claudeSkill), realpathSync(paths.sharedSkill));
  assert.ok(existsSync(paths.manifest));
});

test('regression: Claude copy install succeeds when ordinary symlinks are denied', (t) => {
  const { result, paths } = install(t, true);
  // Establish that the real install reached the reported failure boundary.
  assert.ok(existsSync(join(paths.knowledge, '00-hub.md')));
  assert.match(readFileSync(join(paths.sharedSkill, 'SKILL.md'), 'utf8'), /ocean-acoustics-router/);
  assert.ok(result.stdout.includes(`link    ${paths.claudeSkill}`));
  if (result.status !== 0) {
    assert.equal(result.status, 1);
    assert.match(result.stderr, /FAIL EPERM: operation not permitted, symlink/);
    assert.ok(result.stderr.includes(paths.claudeSkill));
    assert.equal(existsSync(paths.claudeSkill), false);
    assert.equal(existsSync(paths.manifest), false);
  }
  assert.equal(result.status, 0, result.stderr);
  assert.equal(realpathSync(paths.claudeSkill), realpathSync(paths.sharedSkill));
  assert.ok(existsSync(paths.manifest));
});

function scenario(t, extraEnv = {}) {
  const pkg = writePackage(t, { checkout: false });
  const home = writeHome(t);
  const paths = installPaths(home);
  const run = (...args) => spawnSync(process.execPath, ['--require', policy,
    join(pkg, 'bin/ocean-acoustics-expert.js'), ...args], {
    encoding: 'utf8', env: { PATH: process.env.PATH ?? '', HOME: home, USERPROFILE: home, OAE_TEST_LINK: paths.claudeSkill, ...extraEnv },
  });
  const install = () => run('install', '--harness', 'claude', '--mode', 'copy', '--yes');
  return { home, paths, run, install };
}

test('legacy relative manifest accepts the same absolute directory link through its lifecycle', (t) => {
  const { paths, run, install } = scenario(t);
  assert.equal(install().status, 0);
  const manifest = JSON.parse(readFileSync(paths.manifest, 'utf8'));
  const record = manifest.units.find((unit) => unit.path === paths.claudeSkill);
  record.target = relative(dirname(paths.claudeSkill), paths.sharedSkill);
  delete record.linkType;
  writeFileSync(paths.manifest, JSON.stringify(manifest));
  const doctor = run('doctor');
  assert.equal(doctor.status, 0, doctor.stderr);
  assert.equal(install().status, 0);
  assert.equal(JSON.parse(readFileSync(paths.manifest)).backups.length, 0);
  const uninstall = run('uninstall');
  assert.equal(uninstall.status, 0, uninstall.stderr);
  assert.doesNotMatch(uninstall.stdout, /backup /);
});

test('install and restore preserve a pre-existing relative directory link destination', (t) => {
  const { home, paths, run, install } = scenario(t, { OAE_TEST_ALL_LINKS: '1' });
  const original = join(home, 'custom-router');
  mkdirSync(original);
  writeFileSync(join(original, 'user.txt'), 'user data');
  mkdirSync(dirname(paths.claudeSkill), { recursive: true });
  symlinkSync('../../custom-router', paths.claudeSkill, 'dir');
  const installed = install();
  assert.equal(installed.status, 0, installed.stderr);
  const manifest = JSON.parse(readFileSync(paths.manifest));
  const backup = manifest.backups.find((entry) => entry.path === paths.claudeSkill);
  assert.equal(realpathSync(backup.backup), original);
  const restored = run('uninstall', '--restore');
  assert.equal(restored.status, 0, restored.stderr);
  assert.equal(realpathSync(paths.claudeSkill), original);
  assert.equal(readFileSync(join(original, 'user.txt'), 'utf8'), 'user data');
});

test('retargeting through an alias remains a user change even if its referent is shared', (t) => {
  const { home, paths, run, install } = scenario(t);
  assert.equal(install().status, 0);
  const alias = join(home, 'alias-router');
  symlinkSync(paths.sharedSkill, alias, 'dir');
  rmSync(paths.claudeSkill);
  symlinkSync(alias, paths.claudeSkill, 'dir');
  const doctor = run('doctor');
  assert.equal(doctor.status, 1);
  assert.match(doctor.stderr, /no longer the symbolic link/);
  assert.equal(install().status, 0);
  const manifest = JSON.parse(readFileSync(paths.manifest));
  assert.ok(manifest.backups.some((entry) => entry.path === paths.claudeSkill));
  assert.equal(run('uninstall', '--restore').status, 0);
  assert.equal(readlinkSync(paths.claudeSkill), alias);
});

test('uninstall accepts legacy relative link records without a preceding reinstall', (t) => {
  const { paths, run, install } = scenario(t);
  assert.equal(install().status, 0);
  const manifest = JSON.parse(readFileSync(paths.manifest));
  const record = manifest.units.find((unit) => unit.path === paths.claudeSkill);
  record.target = '../../.agents/skills/ocean-acoustics-router';
  delete record.linkType;
  writeFileSync(paths.manifest, JSON.stringify(manifest));
  const result = run('uninstall');
  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(result.stdout, /backup /);
});

test('a namespace-prefixed file link stays a file link during backup and restore', (t) => {
  const home = writeHome(t);
  const paths = installPaths(home);
  const pkg = writePackage(t, { checkout: false });
  const original = join(home, 'original-agent.md');
  writeFileSync(original, 'original user agent');
  mkdirSync(dirname(paths.agent), { recursive: true });
  symlinkSync(original, paths.agent, 'file');
  const run = (...args) => spawnSync(process.execPath, ['--require', policy,
    join(pkg, 'bin/ocean-acoustics-expert.js'), ...args], {
    encoding: 'utf8', env: { PATH: process.env.PATH ?? '', HOME: home,
      USERPROFILE: home, OAE_TEST_LINK: paths.claudeSkill, OAE_TEST_FILE_LINK: paths.agent },
  });
  const installed = run('install', '--harness', 'claude', '--mode', 'copy', '--yes');
  assert.equal(installed.status, 0, installed.stderr);
  const manifest = JSON.parse(readFileSync(paths.manifest));
  const backup = manifest.backups.find((entry) => entry.path === paths.agent);
  assert.equal(realpathSync(backup.backup), original);
  const restored = run('uninstall', '--restore');
  assert.equal(restored.status, 0, restored.stderr);
  assert.equal(realpathSync(paths.agent), original);
  assert.equal(readFileSync(paths.agent, 'utf8'), 'original user agent');
});

test('doctor compares Windows namespace, UNC, and drive targets without accepting retargeting', (t) => {
  const { home, paths, install } = scenario(t);
  assert.equal(install().status, 0);
  const pkg = writePackage(t, { checkout: false });
  const original = JSON.parse(readFileSync(paths.manifest));
  const driveLink = String.raw`C:\Users\fixture\.claude\skills\ocean-acoustics-router`;
  const uncLink = String.raw`\\server\share\fixture\.claude\skills\ocean-acoustics-router`;
  const cases = [
    [driveLink, String.raw`..\..\.agents\skills\ocean-acoustics-router`, String.raw`\??\C:\Users\fixture\.agents\skills\ocean-acoustics-router`, 0],
    [driveLink, String.raw`..\..\.agents\skills\ocean-acoustics-router`, String.raw`\\?\C:\Users\fixture\.agents\skills\ocean-acoustics-router`, 0],
    [driveLink, String.raw`C:\Users\fixture\.agents\skills\ocean-acoustics-router`, String.raw`c:\Users\fixture\.agents\skills\ocean-acoustics-router`, 0],
    [uncLink, String.raw`..\..\.agents\skills\ocean-acoustics-router`, String.raw`\\?\UNC\server\share\fixture\.agents\skills\ocean-acoustics-router`, 0],
    [uncLink, String.raw`..\..\.agents\skills\ocean-acoustics-router`, String.raw`\??\UNC\server\share\fixture\.agents\skills\ocean-acoustics-router`, 0],
    [driveLink, String.raw`..\..\.agents\skills\ocean-acoustics-router`, String.raw`\\?\C:\Users\fixture\different-router`, 1],
  ];
  for (const [virtualLink, recordedTarget, currentTarget, status] of cases) {
    const manifest = structuredClone(original);
    Object.assign(manifest.units.find((unit) => unit.path === paths.claudeSkill), {
      path: virtualLink, target: recordedTarget,
    });
    writeFileSync(paths.manifest, JSON.stringify(manifest));
    const result = spawnSync(process.execPath, ['--require', policy,
      join(pkg, 'bin/ocean-acoustics-expert.js'), 'doctor'], {
      encoding: 'utf8', env: { PATH: process.env.PATH ?? '', HOME: home, USERPROFILE: home,
        OAE_TEST_VIRTUAL_LINK: virtualLink, OAE_TEST_REAL_LINK: paths.claudeSkill,
        OAE_TEST_READLINK_TARGET: currentTarget },
    });
    assert.equal(result.status, status, `${currentTarget}: ${result.stderr}`);
    if (status === 1) assert.match(result.stderr, /no longer the symbolic link/);
  }
});
