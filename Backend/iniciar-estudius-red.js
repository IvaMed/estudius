#!/usr/bin/env node
/**
 * Inicia Estudius en la red local (Wi‑Fi/Ethernet activa).
 * Libera puertos 3000/3443 si ya hay un servidor colgado.
 */

const { spawn, execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = path.join(__dirname, '..');
const BACKEND = path.join(ROOT, 'Backend');
const PORT = Number(process.env.PORT) || 3000;
const HTTPS_PORT = Number(process.env.HTTPS_PORT) || 3443;

function log(msg) {
  console.log(msg);
}

function isVirtualInterface(name) {
  const n = String(name || '').toLowerCase();
  return (
    n.includes('vethernet') ||
    n.includes('vmware') ||
    n.includes('virtual') ||
    n.includes('hyper-v') ||
    n.includes('loopback')
  );
}

function isLikelyVirtualIp(ip) {
  return ip.startsWith('169.254.') || ip.startsWith('192.168.56.');
}

function getLanIPv4Addresses() {
  const scored = [];
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    if (isVirtualInterface(name)) continue;
    for (const net of nets[name] || []) {
      if (net.family !== 'IPv4' || net.internal) continue;
      const ip = net.address;
      if (isLikelyVirtualIp(ip)) continue;
      let score = 3;
      const nl = name.toLowerCase();
      if (nl.includes('wi-fi') || nl.includes('wifi') || nl.includes('wlan')) score = 0;
      else if (nl.includes('ethernet') || nl.includes('eth')) score = 1;
      if (ip.startsWith('192.168.')) score -= 0.5;
      scored.push({ ip, score });
    }
  }
  const byIp = new Map();
  scored.forEach(({ ip, score }) => {
    if (!byIp.has(ip) || byIp.get(ip) > score) byIp.set(ip, score);
  });
  return [...byIp.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([ip]) => ip);
}

function freePortWindows(port) {
  if (process.platform !== 'win32') return;
  try {
    const out = execSync(`netstat -ano | findstr ":${port}"`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    const pids = new Set();
    for (const line of out.split(/\r?\n/)) {
      if (!/LISTENING/i.test(line)) continue;
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && /^\d+$/.test(pid)) pids.add(pid);
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
        log(`[OK] Proceso ${pid} cerrado (puerto ${port} liberado)`);
      } catch (_) {
        /* ignore */
      }
    }
  } catch (_) {
    /* puerto libre */
  }
}

function ensureBackendDeps() {
  const nm = path.join(BACKEND, 'node_modules');
  if (fs.existsSync(nm)) return;
  log('[...] Instalando dependencias del servidor (primera vez)...');
  execSync('npm install', { cwd: BACKEND, stdio: 'inherit' });
}

function openBrowser(url) {
  if (process.platform !== 'win32') return;
  try {
    exec(`start "" "${url}"`, { shell: true });
  } catch (_) {
    /* ignore */
  }
}

function main() {
  log('');
  log('========================================');
  log('  ESTUDIUS - Inicio en red local');
  log('========================================');
  log('');

  try {
    const v = execSync('node --version', { encoding: 'utf8' }).trim();
    log(`[OK] Node.js ${v}`);
  } catch (_) {
    console.error('[ERROR] Instalá Node.js desde https://nodejs.org/');
    process.exit(1);
  }

  ensureBackendDeps();

  log('[...] Comprobando puertos ' + PORT + ' y ' + HTTPS_PORT + '...');
  freePortWindows(PORT);
  freePortWindows(HTTPS_PORT);

  const lanIps = getLanIPv4Addresses();
  const primaryIp = lanIps[0] || null;

  log('');
  log('[OK] URLs cuando el servidor arranque:');
  log(`     PC:       http://localhost:${PORT}`);
  if (primaryIp) {
    log(`     Celular:  http://${primaryIp}:${PORT}`);
    log(`     (HTTPS)   https://${primaryIp}:${HTTPS_PORT}`);
  } else {
    log('     Celular:  http://<IP-WiFi-de-esta-PC>:' + PORT);
  }
  if (lanIps.length > 1) {
    log('     Otras IPs detectadas: ' + lanIps.slice(1).join(', '));
  }
  log('');
  log('[!!] ERR_SSL_PROTOCOL_ERROR = usaste https:// en puerto ' + PORT);
  log('[!!] Usá http://IP:' + PORT + '  o  https://IP:' + HTTPS_PORT);
  log('');

  const openUrl = primaryIp ? `http://${primaryIp}:${PORT}` : `http://localhost:${PORT}`;
  setTimeout(() => openBrowser(openUrl), 2500);

  log('[OK] Iniciando servidor... (Ctrl+C para detener)');
  log('');

  const serverJs = path.join(BACKEND, 'server.js');
  const child = spawn(process.execPath, [serverJs], {
    cwd: BACKEND,
    stdio: 'inherit',
    env: { ...process.env, PORT: String(PORT), HTTPS_PORT: String(HTTPS_PORT) }
  });

  child.on('error', (err) => {
    console.error('[ERROR] No se pudo iniciar el servidor:', err.message);
    process.exit(1);
  });

  child.on('exit', (code) => {
    if (code && code !== 0) {
      log('');
      log('[!!] El servidor terminó con error. Si ves EADDRINUSE, cerrá otras ventanas de Estudius/Node.');
    }
    process.exit(code == null ? 0 : code);
  });

  process.on('SIGINT', () => child.kill('SIGINT'));
  process.on('SIGTERM', () => child.kill('SIGTERM'));
}

main();
