const db = require('../db/database');
const { ok, notFound } = require('../utils/respond');

/** Accepts either the integer PK or the business-key hostId string */
const resolveHost = async (param) => {
  const byHostId = await db.get('SELECT * FROM hosts WHERE hostId = ?', [param]);
  if (byHostId) return byHostId;
  return await db.get('SELECT * FROM hosts WHERE id = ?', [param]) || null;
};

exports.getHosts = async (_req, res) => {
  const hosts = await db.all(`
    SELECT
      id,
      hostId,
      hostname,
      ip          AS ip_address,
      os          AS os_name,
      ''          AS os_version,
      complianceScore,
      lastSeen    AS last_seen,
      CASE 
        WHEN strftime('%s', 'now') - strftime('%s', lastSeen) <= 300 THEN 'online'
        WHEN strftime('%s', 'now') - strftime('%s', lastSeen) <= 900 THEN 'stale'
        ELSE 'offline'
      END AS status
    FROM hosts
    ORDER BY lastSeen DESC
  `);
  return ok(res, hosts);
};

exports.getHostById = async (req, res) => {
  const raw = await resolveHost(req.params.id);
  if (!raw) return notFound(res, 'Host not found');

  return ok(res, {
    id:              raw.id,
    hostId:          raw.hostId,
    hostname:        raw.hostname,
    ip_address:      raw.ip,
    os_name:         raw.os,
    os_version:      '',
    complianceScore: raw.complianceScore,
    last_seen:       raw.lastSeen,
    status:          (Math.floor(Date.now() / 1000) - Math.floor(new Date(raw.lastSeen).getTime() / 1000) <= 300) ? 'online' :
                     (Math.floor(Date.now() / 1000) - Math.floor(new Date(raw.lastSeen).getTime() / 1000) <= 900) ? 'stale' : 'offline'
  });
};

exports.getHostPackages = async (req, res) => {
  const host = await resolveHost(req.params.id);
  if (!host) return notFound(res, 'Host not found');

  const packages = await db.all(`
    SELECT
      id,
      packageName AS name,
      version
    FROM packages
    WHERE hostId = ?
    ORDER BY packageName ASC
  `, [host.hostId]);

  return ok(res, packages);
};

exports.getHostChecks = async (req, res) => {
  const host = await resolveHost(req.params.id);
  if (!host) return notFound(res, 'Host not found');

  const checks = await db.all(`
    SELECT
      id,
      title           AS name,
      status,
      severity,
      evidence,
      remediation     AS recommendation,
      createdAt
    FROM checks
    WHERE hostId = ?
    ORDER BY createdAt DESC
  `, [host.hostId]);

  return ok(res, checks);
};
