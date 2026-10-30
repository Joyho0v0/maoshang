import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

const EXIT = Object.freeze({
  OK: 0,
  CLI: 2,
  DECLARATION: 10,
  NODE: 11,
  NPM_LAUNCHER: 12,
  NPM_VERSION: 13,
  SECRET: 14,
  NPM_CI: 20,
  LOCK_CHANGED: 21,
});

const REGISTRY = 'https://registry.npmjs.org/';
const REPOSITORY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PACKAGE_PATH = path.join(REPOSITORY_ROOT, 'package.json');
const NVMRC_PATH = path.join(REPOSITORY_ROOT, '.nvmrc');
const LOCK_PATH = path.join(REPOSITORY_ROOT, 'package-lock.json');
const EXACT_SEMVER = /^\d+\.\d+\.\d+$/;
const INSTALL_ARGS = [
  'ci',
  '--ignore-scripts',
  '--no-audit',
  '--no-fund',
  `--registry=${REGISTRY}`,
];

function statusLine(message) {
  process.stdout.write(`[install-locked] ${message}\n`);
}

function fail(code, reason) {
  statusLine(`status=FAIL code=${code} reason=${reason}`);
  return code;
}

function isExactSemver(value) {
  return typeof value === 'string' && EXACT_SEMVER.test(value);
}

function readNvmrc() {
  const raw = readFileSync(NVMRC_PATH, 'utf8').replace(/\r\n?/g, '\n');
  const value = raw.endsWith('\n') ? raw.slice(0, -1) : raw;
  if (value.includes('\n') || !isExactSemver(value)) {
    throw new Error('nvmrc format');
  }
  return value;
}

function sha256File(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function requiredMirror(object, expected, name) {
  return Boolean(
    object &&
      typeof object === 'object' &&
      object.name === name &&
      object.version === expected &&
      object.onFail === 'error',
  );
}

function loadDeclarations() {
  let packageJson;
  let lockJson;
  let nodeVersion;
  let lockDigest;

  try {
    nodeVersion = readNvmrc();
    packageJson = JSON.parse(readFileSync(PACKAGE_PATH, 'utf8'));
    lockJson = JSON.parse(readFileSync(LOCK_PATH, 'utf8'));
    lockDigest = sha256File(LOCK_PATH);
  } catch {
    return { ok: false, reason: 'repository declaration or lockfile unreadable' };
  }

  const packageManager = packageJson.packageManager;
  const npmVersion =
    typeof packageManager === 'string' && packageManager.startsWith('npm@')
      ? packageManager.slice('npm@'.length)
      : '';
  const valid =
    isExactSemver(nodeVersion) &&
    typeof packageManager === 'string' &&
    packageManager === `npm@${npmVersion}` &&
    isExactSemver(npmVersion) &&
    packageJson.engines?.node === `>=${nodeVersion}` &&
    requiredMirror(packageJson.devEngines?.runtime, nodeVersion, 'node') &&
    requiredMirror(packageJson.devEngines?.packageManager, npmVersion, 'npm') &&
    lockJson.lockfileVersion === 3;

  if (!valid) {
    return { ok: false, reason: 'repository declaration or lockfile drift' };
  }

  return { ok: true, nodeVersion, npmVersion, lockDigest };
}

function nodeExitCode(actual, expected) {
  return actual === expected ? EXIT.OK : EXIT.NODE;
}

function npmExitCode(actual, expected) {
  if (!isExactSemver(actual)) {
    return EXIT.NPM_LAUNCHER;
  }
  return actual === expected ? EXIT.OK : EXIT.NPM_VERSION;
}

function forbiddenSecrets(environment) {
  return Object.keys(environment)
    .filter(
      (name) =>
        name === 'DATABASE_URL' ||
        name === 'SESSION_SECRET' ||
        name.startsWith('PG') ||
        name.startsWith('POSTGRES_'),
    )
    .sort();
}

function runSelfTest() {
  const cases = [
    ['Node 18.20.8', nodeExitCode('18.20.8', '22.22.3'), EXIT.NODE],
    ['Node 24.22.1', nodeExitCode('24.22.1', '22.22.3'), EXIT.NODE],
    ['npm 10.8.2', npmExitCode('10.8.2', '11.6.2'), EXIT.NPM_VERSION],
    ['Node/npm match', npmExitCode('11.6.2', '11.6.2'), EXIT.OK],
    ['declaration drift', EXIT.DECLARATION, EXIT.DECLARATION],
    ['secret environment', forbiddenSecrets({ DATABASE_URL: 'redacted' }).length > 0 ? EXIT.SECRET : EXIT.OK, EXIT.SECRET],
    ['PG secret environment', forbiddenSecrets({ PGHOST: 'redacted' }).length > 0 ? EXIT.SECRET : EXIT.OK, EXIT.SECRET],
    ['session secret environment', forbiddenSecrets({ SESSION_SECRET: 'redacted' }).length > 0 ? EXIT.SECRET : EXIT.OK, EXIT.SECRET],
  ];

  for (const [name, actual, expected] of cases) {
    if (actual !== expected) {
      return fail(EXIT.DECLARATION, `self-test case=${name}`);
    }
  }

  statusLine('mode=self-test status=PASS cases=8');
  return EXIT.OK;
}

function cleanNpmEnvironment() {
  const environment = {};
  const globalConfigDevice = process.platform === 'win32' ? 'NUL' : '/proc/self/fd/0';
  const allowed = [
    'PATH',
    'HOME',
    'USERPROFILE',
    'SystemRoot',
    'ComSpec',
    'PATHEXT',
    'TMPDIR',
    'TMP',
    'TEMP',
    'LANG',
    'LANGUAGE',
    'LC_ALL',
    'LC_CTYPE',
    'LC_MESSAGES',
    'LC_COLLATE',
    'LC_MONETARY',
    'LC_NUMERIC',
    'LC_TIME',
    'TZ',
    'CI',
    'NO_COLOR',
    'FORCE_COLOR',
    'TERM',
    'TERM_PROGRAM',
    'COLORTERM',
  ];

  for (const name of allowed) {
    if (process.env[name] !== undefined) {
      environment[name] = process.env[name];
    }
  }

  if (process.platform === 'win32' && environment.PATH === undefined && process.env.Path !== undefined) {
    environment.Path = process.env.Path;
  }

  environment.NPM_CONFIG_REGISTRY = REGISTRY;
  environment.NPM_CONFIG_IGNORE_SCRIPTS = 'true';
  environment.NPM_CONFIG_AUDIT = 'false';
  environment.NPM_CONFIG_FUND = 'false';
  environment.NPM_CONFIG_UPDATE_NOTIFIER = 'false';
  environment.NPM_CONFIG_USERCONFIG = os.devNull;
  environment.NPM_CONFIG_GLOBALCONFIG = globalConfigDevice;
  environment.npm_config_registry = REGISTRY;
  environment.npm_config_ignore_scripts = 'true';
  environment.npm_config_audit = 'false';
  environment.npm_config_fund = 'false';
  environment.npm_config_update_notifier = 'false';
  environment.npm_config_userconfig = os.devNull;
  environment.npm_config_globalconfig = globalConfigDevice;
  return environment;
}

function runNpm(npmArgs, environment) {
  const launcher = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  return {
    launcher,
    result: spawnSync(launcher, npmArgs, {
      cwd: REPOSITORY_ROOT,
      env: environment,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 16,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    }),
  };
}

function printChildOutput(result) {
  if (typeof result.stdout === 'string' && result.stdout.length > 0) {
    process.stdout.write(result.stdout);
  }
  if (typeof result.stderr === 'string' && result.stderr.length > 0) {
    process.stderr.write(result.stderr);
  }
}

function execute(mode) {
  const declarations = loadDeclarations();
  if (!declarations.ok) {
    return fail(EXIT.DECLARATION, declarations.reason);
  }

  statusLine(`mode=${mode} expected_node=${declarations.nodeVersion} expected_npm=${declarations.npmVersion} lock_sha256=${declarations.lockDigest}`);

  const nodeCode = nodeExitCode(process.versions.node, declarations.nodeVersion);
  if (nodeCode !== EXIT.OK) {
    return fail(nodeCode, `node version mismatch actual=${process.versions.node} expected=${declarations.nodeVersion}; npm_ci=not-started`);
  }

  const environment = cleanNpmEnvironment();
  const npmRun = runNpm(['--version'], environment);
  if (npmRun.result.error || npmRun.result.status !== 0) {
    return fail(EXIT.NPM_LAUNCHER, `npm launcher unavailable launcher=${npmRun.launcher}; npm_ci=not-started`);
  }

  const npmStdout = typeof npmRun.result.stdout === 'string' ? npmRun.result.stdout.trim() : '';
  const npmCode = npmExitCode(npmStdout, declarations.npmVersion);
  if (npmCode !== EXIT.OK) {
    const reason = npmCode === EXIT.NPM_VERSION ? `npm version mismatch actual=${npmStdout || 'invalid'} expected=${declarations.npmVersion}` : 'npm version output invalid';
    return fail(npmCode, `${reason}; npm_ci=not-started`);
  }

  const secrets = forbiddenSecrets(process.env);
  if (secrets.length > 0) {
    return fail(EXIT.SECRET, `forbidden_variables=${secrets.join(',')} npm_ci=not-started`);
  }

  statusLine(`actual_node=${process.versions.node} actual_npm=${npmStdout} registry=${REGISTRY}`);
  if (mode === 'check') {
    statusLine('mode=check status=PASS install=not-started');
    return EXIT.OK;
  }

  statusLine(`command=npm ${INSTALL_ARGS.join(' ')} cache=environment-default`);
  const installRun = runNpm(INSTALL_ARGS, environment);
  printChildOutput(installRun.result);
  if (installRun.result.error || installRun.result.status !== 0) {
    const childCode = installRun.result.status === null ? 'null' : String(installRun.result.status);
    return fail(EXIT.NPM_CI, `npm_ci_child_exit=${childCode}`);
  }

  const afterDigest = sha256File(LOCK_PATH);
  if (afterDigest !== declarations.lockDigest) {
    return fail(EXIT.LOCK_CHANGED, `lock_sha256_before=${declarations.lockDigest} lock_sha256_after=${afterDigest}`);
  }

  statusLine(`mode=install status=PASS npm_ci_child_exit=0 lock_sha256=${afterDigest}`);
  return EXIT.OK;
}

function parseMode(args) {
  if (args.length === 0 || args.length === 1 && args[0] === '--install') {
    return 'install';
  }
  if (args.length === 1 && (args[0] === '--check' || args[0] === '--self-test')) {
    return args[0].slice(2);
  }
  return null;
}

const mode = parseMode(process.argv.slice(2));
const exitCode = mode === null ? fail(EXIT.CLI, 'unknown or conflicting arguments') : mode === 'self-test' ? runSelfTest() : execute(mode);
process.exitCode = exitCode;
