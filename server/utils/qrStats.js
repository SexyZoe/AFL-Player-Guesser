const fs = require('fs');
const path = require('path');

const QR_STATS_FILE = process.env.QR_STATS_FILE || path.join(__dirname, '../data/qr_scans.jsonl');

function ensureParentDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  const raw = Array.isArray(xff) ? xff[0] : (xff || req.ip || req.connection?.remoteAddress || '');
  const ip = String(raw).split(',')[0].trim();
  return ip || '';
}

function anonymizeIp(ip) {
  if (!ip) return '';
  if (ip.includes(':')) {
    // IPv6: keep only the first 4 segments
    const parts = ip.split(':');
    return parts.slice(0, 4).join(':') + '::';
  }
  // IPv4: truncate the last octet
  const parts = ip.split('.');
  if (parts.length === 4) {
    parts[3] = '0';
    return parts.join('.');
  }
  return ip;
}

function recordScan(key, req) {
  try {
    ensureParentDir(QR_STATS_FILE);
    const now = Date.now();
    const ip = anonymizeIp(getClientIp(req));
    const ua = String(req.headers['user-agent'] || '').slice(0, 256);
    const referer = String(req.headers['referer'] || req.headers['referrer'] || '').slice(0, 512);
    const line = JSON.stringify({ t: now, key, ip, ua, ref: referer }) + '\n';
    fs.appendFile(QR_STATS_FILE, line, (err) => {
      if (err) console.error('Failed to record QR scan:', err);
    });
  } catch (err) {
    console.error('QR scan recording error:', err);
  }
}

function aggregateScans(options = {}) {
  const days = Number(options.days) > 0 ? Number(options.days) : 30;
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  const resultByDay = new Map();
  const uniqueIpByDay = new Map();
  let total = 0;
  let totalUniqueIps = new Set();

  if (!fs.existsSync(QR_STATS_FILE)) {
    return { total: 0, totalUnique: 0, days, byDay: [] };
  }

  const content = fs.readFileSync(QR_STATS_FILE, 'utf8');
  const lines = content.split('\n');
  for (const line of lines) {
    if (!line) continue;
    try {
      const row = JSON.parse(line);
      if (!row || typeof row.t !== 'number') continue;
      if (row.t < since) continue;
      const date = new Date(row.t).toISOString().slice(0, 10); // YYYY-MM-DD UTC
      total += 1;
      totalUniqueIps.add(`${date}|${row.ip}`);
      resultByDay.set(date, (resultByDay.get(date) || 0) + 1);
      if (!uniqueIpByDay.has(date)) uniqueIpByDay.set(date, new Set());
      uniqueIpByDay.get(date).add(row.ip || '');
    } catch {}
  }

  const byDay = Array.from(resultByDay.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count, unique: (uniqueIpByDay.get(date) || new Set()).size }));

  return {
    total,
    totalUnique: totalUniqueIps.size, // De-dup heuristic: day + IP approximates UV
    days,
    byDay
  };
}

module.exports = {
  QR_STATS_FILE,
  recordScan,
  aggregateScans
};

