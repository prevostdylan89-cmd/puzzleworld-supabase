// Captures the last N console logs/errors/warnings in memory
const MAX_LOGS = 100;
const logs = [];

const levels = ['log', 'warn', 'error', 'info'];

export function initConsoleCapture() {
  levels.forEach(level => {
    const original = console[level].bind(console);
    console[level] = (...args) => {
      logs.push({
        level,
        time: new Date().toISOString(),
        message: args.map(a => {
          try { return typeof a === 'object' ? JSON.stringify(a) : String(a); } catch { return String(a); }
        }).join(' '),
      });
      if (logs.length > MAX_LOGS) logs.shift();
      original(...args);
    };
  });

  // Also capture unhandled errors
  window.addEventListener('error', (e) => {
    logs.push({ level: 'error', time: new Date().toISOString(), message: `[Unhandled] ${e.message} — ${e.filename}:${e.lineno}` });
    if (logs.length > MAX_LOGS) logs.shift();
  });

  window.addEventListener('unhandledrejection', (e) => {
    logs.push({ level: 'error', time: new Date().toISOString(), message: `[UnhandledPromise] ${e.reason}` });
    if (logs.length > MAX_LOGS) logs.shift();
  });
}

export function getCapturedLogs() {
  return [...logs];
}