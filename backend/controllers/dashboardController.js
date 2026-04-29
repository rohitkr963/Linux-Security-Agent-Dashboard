const db     = require('../db/database');
const { ok } = require('../utils/respond');

exports.getSummary = async (_req, res) => {
  const [totalHostsRow, totalPkgsRow, passedRow, failedRow] = await Promise.all([
    db.get('SELECT COUNT(*) AS count FROM hosts'),
    db.get('SELECT COUNT(*) AS count FROM packages'),
    db.get("SELECT COUNT(*) AS count FROM checks WHERE status = 'PASS'"),
    db.get("SELECT COUNT(*) AS count FROM checks WHERE status = 'FAIL'"),
  ]);

  const totalHosts    = totalHostsRow?.count ?? 0;
  const totalPackages = totalPkgsRow?.count  ?? 0;
  const passedChecks  = passedRow?.count     ?? 0;
  const failedChecks  = failedRow?.count     ?? 0;
  const totalChecks   = passedChecks + failedChecks;
  const compliancePercent = totalChecks > 0
    ? Math.round((passedChecks / totalChecks) * 100)
    : 100;

  const [recentAlerts, recentScans] = await Promise.all([
    // recentAlerts: failed HIGH/CRITICAL checks — { title, host, severity, time }
    db.all(`
      SELECT
        c.title                AS title,
        h.hostname             AS host,
        c.severity             AS severity,
        c.createdAt            AS time
      FROM   checks c
      JOIN   hosts  h ON c.hostId = h.hostId
      WHERE  c.status = 'FAIL'
        AND  c.severity IN ('CRITICAL', 'HIGH')
      ORDER  BY c.createdAt DESC
      LIMIT  10
    `),

    // recentScans: latest hosts with pass/fail counts — { hostname, passed, failed, last_seen }
    db.all(`
      SELECT
        h.hostname                                                                       AS hostname,
        (SELECT COUNT(*) FROM checks WHERE hostId = h.hostId AND status = 'PASS')       AS passed,
        (SELECT COUNT(*) FROM checks WHERE hostId = h.hostId AND status = 'FAIL')       AS failed,
        h.lastSeen                                                                       AS last_seen
      FROM   hosts h
      ORDER  BY h.lastSeen DESC
      LIMIT  5
    `),
  ]);

  return ok(res, {
    totalHosts,
    totalPackages,
    passedChecks,
    failedChecks,
    compliancePercent,
    recentAlerts:  recentAlerts  || [],
    recentScans:   recentScans   || [],
  });
};
