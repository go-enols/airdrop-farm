/**
 * sandbox-enforcer.cjs
 *
 * Node.js pre-load module that ENFORCES (not just declares) sandbox
 * permissions for task worker scripts. Loaded via NODE_OPTIONS=--require
 * so it runs BEFORE the user's script.
 *
 * Permission flags are read from environment variables:
 *   TASK_PERM_NETWORK     = "1" or "0"
 *   TASK_PERM_FILESYSTEM  = "1" or "0"
 *   TASK_PERM_BYPASS      = "1" — opt-out (for internal scripts that need full access)
 *   TASK_SANDBOX          = "1" or "0" (mirror of is_sandbox for the worker)
 *
 * When a permission is denied, the corresponding API call throws
 * ERR_PERMISSION_DENIED with a clear message and stack trace pointing
 * to the caller's code.
 *
 * Patches are applied at module level (not just one reference), so the
 * script cannot bypass by re-requiring the module.
 *
 * Coverage:
 *   - http.request, http.get, fetch (Node 18+ global)
 *   - https.request, https.get
 *   - net.connect, net.createConnection, net.createServer
 *   - tls.connect
 *   - dgram.createSocket
 *   - dns.lookup, dns.resolve*
 *   - child_process.{spawn, exec, execFile, fork}
 *   - worker_threads.Worker
 *   - fs.* (sync + async + promises), with chroot enforcement
 *
 * Filesystem policy:
 *   - When TASK_PERM_FILESYSTEM=0: all fs operations throw
 *   - When TASK_PERM_FILESYSTEM=1: paths must resolve to within cwd or
 *     process.env.TEMP / TMP. Outside these dirs -> throw.
 *
 * Usage (in main process):
 *   const proc = spawn('node', [entryPoint], {
 *     cwd,
 *     env: {
 *       ...existingEnv,
 *       NODE_OPTIONS: `--require ${path.resolve(sandboxEnforcerPath)}`
 *     }
 *   })
 */

'use strict';

const PERMISSION_DENIED = 'ERR_PERMISSION_DENIED';
const PERMISSION_DENIED_MSG = (op) =>
  `[sandbox] ${op} denied: task does not have permission. Set the task to is_sandbox=false with manifest.permissions including the required capability, or use a trusted internal script.`;

// Read permission flags from env
const ALLOW_NETWORK = process.env.TASK_PERM_NETWORK === '1';
const ALLOW_FILESYSTEM = process.env.TASK_PERM_FILESYSTEM === '1';
const BYPASS = process.env.TASK_PERM_BYPASS === '1';

if (BYPASS) {
  // No patches; this is an internal script that needs full access
  return;
}

// ---------- 1. Filesystem chroot (computed lazily) ----------

const ALLOWED_DIRS = (() => {
  const dirs = [];
  if (process.env.TASK_CWD_RESOLVED) dirs.push(process.env.TASK_CWD_RESOLVED);
  if (process.env.TEMP) dirs.push(process.env.TEMP);
  if (process.env.TMP) dirs.push(process.env.TMP);
  if (process.env.TMPDIR) dirs.push(process.env.TMPDIR);
  return dirs;
})();

function isPathAllowed(p) {
  if (!ALLOW_FILESYSTEM) return false;
  if (typeof p !== 'string') return false;
  const path = require('path');
  let resolved;
  try {
    resolved = path.resolve(p);
  } catch {
    return false;
  }
  for (const dir of ALLOWED_DIRS) {
    if (!dir) continue;
    const dirResolved = path.resolve(dir);
    if (resolved === dirResolved) return true;
    if (resolved.startsWith(dirResolved + path.sep)) return true;
    // Windows is case-insensitive
    if (process.platform === 'win32') {
      const lower = resolved.toLowerCase();
      const dirLower = dirResolved.toLowerCase();
      if (lower === dirLower) return true;
      if (lower.startsWith(dirLower + path.sep)) return true;
    }
  }
  return false;
}

function denyFs(op) {
  const err = new Error(PERMISSION_DENIED_MSG(op));
  err.code = PERMISSION_DENIED;
  Error.captureStackTrace(err, denyFs);
  return err;
}

// ---------- 2. Network patcher ----------

function denyNet(op) {
  const err = new Error(PERMISSION_DENIED_MSG(op));
  err.code = PERMISSION_DENIED;
  Error.captureStackTrace(err, denyNet);
  return err;
}

function patchNetwork() {
  if (ALLOW_NETWORK) return;

  // http
  try {
    const http = require('http');
    http.request = function () { throw denyNet('http.request'); };
    http.get = function () { throw denyNet('http.get'); };
  } catch {
    // http module unavailable in this Node build
  }

  // https
  try {
    const https = require('https');
    https.request = function () { throw denyNet('https.request'); };
    https.get = function () { throw denyNet('https.get'); };
  } catch {
    // https module unavailable
  }

  // net
  try {
    const net = require('net');
    net.connect = function () { throw denyNet('net.connect'); };
    net.createConnection = function () { throw denyNet('net.createConnection'); };
    net.createServer = function () { throw denyNet('net.createServer'); };
  } catch {
    // net module unavailable
  }

  // tls
  try {
    const tls = require('tls');
    tls.connect = function () { throw denyNet('tls.connect'); };
  } catch {
    // tls module unavailable
  }

  // dgram (UDP)
  try {
    const dgram = require('dgram');
    dgram.createSocket = function () { throw denyNet('dgram.createSocket'); };
  } catch {
    // dgram module unavailable
  }

  // dns
  try {
    const dns = require('dns');
    const blocked = [
      'lookup', 'lookupService',
      'resolve', 'resolve4', 'resolve6',
      'resolveMx', 'resolveTxt', 'resolveSrv', 'resolveNs',
      'resolveCname', 'resolveSoa', 'resolvePtr', 'reverse'
    ];
    for (const fn of blocked) {
      if (typeof dns[fn] === 'function') {
        dns[fn] = function () { throw denyNet('dns.' + fn); };
      }
    }
  } catch {
    // dns module unavailable
  }

  // fetch (Node 18+ global)
  if (typeof globalThis.fetch === 'function') {
    globalThis.fetch = function () { throw denyNet('fetch'); };
  }
}

// ---------- 3. Filesystem patcher ----------

function patchFs() {
  // Always patch fs to enforce chroot. Even if ALLOW_FILESYSTEM, paths
  // outside the allowed dirs are rejected.
  const fs = require('fs');

  function wrapSync(name, fn) {
    return function (p) {
      if (!isPathAllowed(p)) {
        throw denyFs(`fs.${name}(${typeof p === 'string' ? p : '<non-string>'})`);
      }
      return Reflect.apply(fn, this, arguments);
    };
  }

  function wrapAsync(name, fn) {
    return function (p) {
      if (!isPathAllowed(p)) {
        throw denyFs(`fs.${name}(${typeof p === 'string' ? p : '<non-string>'})`);
      }
      return Reflect.apply(fn, this, arguments);
    };
  }

  function wrapPromise(name, fn) {
    return function (p) {
      if (!isPathAllowed(p)) {
        return Promise.reject(denyFs(`fs.${name}(${typeof p === 'string' ? p : '<non-string>'})`));
      }
      return Reflect.apply(fn, this, arguments);
    };
  }

  const SYNC_OPS = [
    'readFileSync', 'writeFileSync', 'appendFileSync',
    'statSync', 'lstatSync', 'accessSync', 'existsSync',
    'realpathSync', 'readlinkSync',
    'mkdirSync', 'mkdtempSync', 'rmdirSync', 'rmSync',
    'renameSync', 'copyFileSync', 'unlinkSync', 'chmodSync', 'lchmodSync',
    'chownSync', 'lchownSync', 'utimesSync', 'lutimesSync',
    'readdirSync', 'opendirSync', 'truncateSync', 'symlinkSync', 'linkSync',
    'createReadStream', 'createWriteStream'
  ];
  for (const op of SYNC_OPS) {
    if (typeof fs[op] === 'function') {
      fs[op] = wrapSync(op, fs[op]);
    }
  }

  const ASYNC_OPS = [
    'readFile', 'writeFile', 'appendFile',
    'stat', 'lstat', 'access', 'realpath', 'readlink',
    'mkdir', 'mkdtemp', 'rmdir', 'rm',
    'rename', 'copyFile', 'unlink', 'chmod', 'lchmod',
    'chown', 'lchown', 'utimes', 'lutimes',
    'readdir', 'opendir', 'truncate', 'symlink', 'link'
  ];
  for (const op of ASYNC_OPS) {
    if (typeof fs[op] === 'function') {
      fs[op] = wrapAsync(op, fs[op]);
    }
  }

  // fs.promises
  if (fs.promises) {
    const promises = fs.promises;
    for (const op of SYNC_OPS) {
      const promiseName = op.endsWith('Sync') ? op.slice(0, -4) : op;
      if (typeof promises[promiseName] === 'function') {
        promises[promiseName] = wrapPromise(promiseName, promises[promiseName]);
      }
    }
    for (const op of ASYNC_OPS) {
      if (typeof promises[op] === 'function') {
        promises[op] = wrapPromise(op, promises[op]);
      }
    }
  }
}

// ---------- 4. child_process / worker_threads patcher ----------

function patchSubprocess() {
  // Block spawning subprocesses (they could escape the sandbox via shell).
  try {
    const cp = require('child_process');
    const blocked = ['spawn', 'exec', 'execFile', 'execSync', 'execFileSync', 'spawnSync', 'fork'];
    for (const op of blocked) {
      if (typeof cp[op] === 'function') {
        cp[op] = function () { throw denyNet(`child_process.${op}`); };
      }
    }
  } catch {
    // child_process unavailable
  }

  try {
    const wt = require('worker_threads');
    wt.Worker = function () { throw denyNet('worker_threads.Worker'); };
  } catch {
    // worker_threads unavailable
  }
}

// ---------- 5. Apply patches ----------

patchNetwork();
patchFs();
patchSubprocess();

// Done.
