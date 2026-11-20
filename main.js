const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { spawn, execFile, execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');

// electron-builder already brands the packaged .app as "Cozmo" (name/icon in
// package.json's build config) — this is what fixes the same branding in
// unpackaged dev mode (`npm start`), where Electron otherwise shows its own
// name/icon in the menu bar and dock regardless of what's packaged.
app.setName('Cozmo');
if (process.platform === 'darwin' && !app.isPackaged) {
  app.dock.setIcon(path.join(__dirname, 'build', 'icon.iconset', 'icon_512x512.png'));
}

const DASHBOARD_DIR = app.isPackaged
  ? path.join(process.resourcesPath, 'dashboard')
  : path.join(__dirname, '..', 'cozbra-dashboard');
const VAULT_TEMPLATE_DIR = app.isPackaged
  ? path.join(process.resourcesPath, 'vault-template')
  : path.join(__dirname, 'vault-template');
// A fresh install has no vault at all — never point at the dev machine's
// own ~/cozbra, that's personal data, not a template. Each install gets its
// own blank-but-structured vault here instead.
const USER_VAULT_DIR = path.join(os.homedir(), 'Cozmo', 'vault');

function ensureVault() {
  if (fs.existsSync(USER_VAULT_DIR)) return;
  fs.mkdirSync(USER_VAULT_DIR, { recursive: true });
  fs.cpSync(VAULT_TEMPLATE_DIR, USER_VAULT_DIR, { recursive: true });
}
// Own port, separate from any pm2-managed dashboard (3002) that might already
// be running on this machine — the app must own and control its own server,
// not silently piggyback on a pre-existing one.
const PORT = 3099;

let serverProc = null;
let win = null;
let serverReady = null;

function waitForServer(retries = 40) {
  return new Promise((resolve, reject) => {
    const tryOnce = (n) => {
      http.get(`http://localhost:${PORT}/api/whoami`, () => resolve())
        .on('error', () => {
          if (n <= 0) return reject(new Error('Dashboard server did not come up'));
          setTimeout(() => tryOnce(n - 1), 250);
        });
    };
    tryOnce(retries);
  });
}

function startServer() {
  // Already have a live child from a previous call (e.g. a second window-open
  // on macOS) — reuse it instead of spawning another one on the same port.
  if (serverProc) return serverReady;

  ensureVault();

  serverProc = spawn(process.execPath, [path.join(DASHBOARD_DIR, 'server.js')], {
    cwd: DASHBOARD_DIR,
    // Without this, a packaged app's binary ignores the script path argument
    // entirely (its argv always resolves to its own baked-in main.js) and
    // just relaunches Cozmo itself — which the single-instance lock then
    // silently quits, with no dashboard output at all. Dev mode only "worked"
    // because unpackaged Electron happens to treat a path argument as "load
    // this as the app" instead.
    // DISABLE_LEARN1: Learn1 is a personal BUE/Moodle integration, meaningless
    // for anyone else — only set here, in the packaged app, never on the dev
    // machine's own pm2-run dashboard, which still uses it for real.
    env: { ...process.env, PORT: String(PORT), VAULT_DIR: USER_VAULT_DIR, DISABLE_LEARN1: '1', ELECTRON_RUN_AS_NODE: '1' },
    stdio: 'pipe',
  });
  serverProc.stdout.on('data', (d) => process.stdout.write(`[dashboard] ${d}`));
  serverProc.stderr.on('data', (d) => process.stderr.write(`[dashboard] ${d}`));
  serverProc.on('exit', (code) => {
    console.log(`[dashboard] exited with code ${code}`);
    serverProc = null;
    serverReady = null;
  });

  serverReady = waitForServer();
  return serverReady;
}

// A GUI app launched by Finder/Dock often gets a minimal PATH that skips
// ~/.local/bin — where both `claude` and `nlm` (and anything the installers
// below place) actually live. Without this, checks below could wrongly
// think they're missing even right after installing them.
const LOCAL_BIN = path.join(os.homedir(), '.local', 'bin');
if (!process.env.PATH.split(path.delimiter).includes(LOCAL_BIN)) {
  process.env.PATH = `${LOCAL_BIN}${path.delimiter}${process.env.PATH}`;
}

function binExists(name) {
  if (fs.existsSync(path.join(LOCAL_BIN, name))) return true;
  try { execFileSync('which', [name], { env: process.env }); return true; } catch { return false; }
}

function runShell(cmd, timeout = 300000) {
  return new Promise((resolve) => {
    execFile('bash', ['-lc', cmd], { timeout, maxBuffer: 8 * 1024 * 1024 }, (err, stdout, stderr) => {
      resolve({ ok: !err, output: (stderr || stdout || '').trim() });
    });
  });
}

function sendStatus(text) {
  console.log(`[bootstrap] ${text}`);
  if (win) win.webContents.send('bootstrap:status', text);
}

// Replicates the exact commands this install actually uses — the official
// native installer for Claude Code, and uv + `uv tool install` for the
// NotebookLM CLI. Claude is required (the whole app is built on it); nlm is
// best-effort, since only the Learn tab's NotebookLM features need it.
async function ensureClaudeCli() {
  if (binExists('claude')) return true;
  sendStatus('Installing Claude Code…');
  const { ok, output } = await runShell('curl -fsSL https://claude.ai/install.sh | bash');
  if (!ok || !fs.existsSync(path.join(LOCAL_BIN, 'claude'))) {
    sendStatus('Claude Code install failed');
    dialog.showErrorBox('Setup failed', `Couldn't install Claude Code automatically.\n\n${output.slice(0, 500)}\n\nInstall it manually from claude.ai/code, then relaunch Cozmo.`);
    return false;
  }
  return true;
}

async function ensureNlmCli() {
  if (binExists('nlm')) return;
  if (!binExists('uv')) {
    sendStatus('Installing uv…');
    await runShell('curl -fsSL https://astral.sh/uv/install.sh | sh');
  }
  if (!binExists('uv')) return; // best-effort — Learn tab's NotebookLM features just won't work
  sendStatus('Installing NotebookLM CLI…');
  await runShell('uv tool install notebooklm-mcp-cli --with "cryptography<44"');
}

function checkAuth() {
  return new Promise((resolve) => {
    execFile('claude', ['auth', 'status'], { timeout: 10000 }, (err, stdout) => {
      try { resolve(JSON.parse(stdout).loggedIn === true); }
      catch { resolve(false); }
    });
  });
}

function runLogin() {
  // Opens the user's browser for the OAuth flow — no terminal, no password typed here.
  spawn('claude', ['auth', 'login'], { detached: true, stdio: 'ignore' }).unref();
}

async function enterDashboard() {
  try {
    await startServer();
  } catch (e) {
    dialog.showErrorBox('Startup failed', e.message);
    app.quit();
    return;
  }
  win.loadURL(`http://localhost:${PORT}`);
}

async function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 860,
    title: 'Cozmo',
    backgroundColor: '#06080C',
    icon: path.join(__dirname, 'build', 'icon.iconset', 'icon_512x512.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
  });

  await win.loadFile('bootstrap.html');
  if (!(await ensureClaudeCli())) return; // error already shown, nothing to recover into
  ensureNlmCli(); // best-effort, runs in the background — don't block on it

  // FORCE_SIGNIN=1 npm start — preview the sign-in page without logging out
  // of the real Claude session (checkAuth() would otherwise skip right past it).
  if (!process.env.FORCE_SIGNIN && await checkAuth()) {
    enterDashboard();
  } else {
    win.loadFile('signin.html');
  }
}

// IPC: the sign-in page never touches node/child_process directly — it just
// asks the main process to check/trigger auth and waits for the result.
ipcMain.handle('auth:check', async () => {
  const ok = await checkAuth();
  if (ok) enterDashboard();
  return ok;
});
ipcMain.handle('auth:login', () => { runLogin(); });
ipcMain.handle('auth:logout', () => {
  return new Promise((resolve) => {
    execFile('claude', ['auth', 'logout'], { timeout: 10000 }, () => {
      // The session is invalid now — stop the dashboard child so a fresh
      // sign-in gets a clean server, not one holding stale credentials.
      if (serverProc) { serverProc.kill(); serverProc = null; serverReady = null; }
      if (win) win.loadFile('signin.html');
      resolve();
    });
  });
});

// Without this, every launch (double-click, dock re-open, a second `open`)
// starts a fully independent instance, each spawning its own dashboard child
// fighting over the same port — that's what caused the earlier runaway spawn.
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
  });
  app.whenReady().then(createWindow);
}

app.on('window-all-closed', () => {
  if (serverProc) serverProc.kill();
  if (process.platform !== 'darwin') app.quit();
});

// macOS: clicking the dock icon after all windows closed should reopen one,
// not leave the app sitting there with no window and no way back in.
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
