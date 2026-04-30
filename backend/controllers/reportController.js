const db       = require('../db/database');
const { created, badReq, serverErr } = require('../utils/respond');

const VALID_SEVERITIES = new Set(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']);
const VALID_STATUSES   = new Set(['PASS', 'FAIL', 'WARN', 'UNKNOWN']);

exports.ingestReport = async (req, res) => {
  const { hostId, hostname, ip, os, complianceScore, packages, checks } = req.body;

  // ── Validation ────────────────────────────────────────────────────────────
  if (!hostId || typeof hostId !== 'string' || !hostId.trim()) {
    return badReq(res, 'hostId is required and must be a non-empty string');
  }
  if (!hostname || typeof hostname !== 'string' || !hostname.trim()) {
    return badReq(res, 'hostname is required and must be a non-empty string');
  }

  const safeHostId  = hostId.trim();
  const safeHostname = hostname.trim();
  const safeIp      = (ip || '').toString().trim();
  const safeOs      = (os || '').toString().trim();
  const safeScore   = typeof complianceScore === 'number' ? complianceScore : 0;
  const now         = new Date().toISOString();

  await db.beginTransaction();
  try {
    // ── Upsert host ──────────────────────────────────────────────────────────
    const existing = await db.get('SELECT id FROM hosts WHERE hostId = ?', [safeHostId]);
    if (existing) {
      await db.run(
        `UPDATE hosts SET hostname = ?, ip = ?, os = ?, complianceScore = ?, lastSeen = ?
         WHERE hostId = ?`,
        [safeHostname, safeIp, safeOs, safeScore, now, safeHostId]
      );
    } else {
      await db.run(
        `INSERT INTO hosts (hostId, hostname, ip, os, complianceScore, lastSeen)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [safeHostId, safeHostname, safeIp, safeOs, safeScore, now]
      );
    }

    // ── Packages (de-duplicated by name+version) ─────────────────────────────
    if (Array.isArray(packages)) {
      await db.run('DELETE FROM packages WHERE hostId = ?', [safeHostId]);

      const seen = new Set();
      for (const pkg of packages) {
        if (!pkg || !pkg.packageName) continue;
        const name    = String(pkg.packageName).trim();
        const version = String(pkg.version || 'unknown').trim();
        const key     = `${name}@${version}`;
        if (seen.has(key)) continue;
        seen.add(key);
        await db.run(
          'INSERT INTO packages (hostId, packageName, version) VALUES (?, ?, ?)',
          [safeHostId, name, version]
        );
      }
    }

    // ── Security Checks ───────────────────────────────────────────────────────
    if (Array.isArray(checks)) {
      await db.run('DELETE FROM checks WHERE hostId = ?', [safeHostId]);

      for (const check of checks) {
        if (!check || !check.title) continue;
        const status   = VALID_STATUSES.has(check.status)     ? check.status   : 'UNKNOWN';
        const severity = VALID_SEVERITIES.has(check.severity) ? check.severity : 'INFO';
        await db.run(
          `INSERT INTO checks (hostId, title, status, severity, evidence, remediation, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            safeHostId,
            String(check.title).trim(),
            status,
            severity,
            (check.evidence    || '').toString(),
            (check.remediation || '').toString(),
            now
          ]
        );
      }
    }

    // ── Store Scan History ────────────────────────────────────────────────────
    await db.run(
      'INSERT INTO scan_history (hostId, score, createdAt) VALUES (?, ?, ?)',
      [safeHostId, safeScore, now]
    );

    await db.commitTransaction();
    console.log(`[REPORT] Ingested host: ${safeHostId} (${safeHostname})`);
    return created(res, { message: 'Report ingested successfully', hostId: safeHostId });

  } catch (err) {
    await db.rollbackTransaction();
    console.error('[REPORT] Transaction rolled back:', err.message);
    return serverErr(res, 'Failed to ingest report');
  }
};
