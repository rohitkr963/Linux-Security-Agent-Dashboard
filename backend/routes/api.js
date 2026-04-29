const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/ingest
router.post('/ingest', async (req, res) => {
  const { hostInfo, packages, cisResults } = req.body;

  if (!hostInfo || !hostInfo.hostname) {
    return res.status(400).json({ error: 'Invalid payload: Missing hostInfo' });
  }

  try {
    // 1. Upsert Host
    let host = await db.get('SELECT id FROM hosts WHERE hostname = ?', [hostInfo.hostname]);
    let hostId;

    if (host) {
      hostId = host.id;
      await db.run(
        `UPDATE hosts SET 
          os_name = ?, 
          os_version = ?, 
          kernel_version = ?, 
          ip_address = ?, 
          current_user = ?, 
          uptime = ?, 
          last_seen = CURRENT_TIMESTAMP 
        WHERE id = ?`,
        [
          hostInfo.os_name,
          hostInfo.os_version,
          hostInfo.kernel_version,
          hostInfo.ip_address,
          hostInfo.current_user,
          hostInfo.uptime,
          hostId
        ]
      );
    } else {
      const result = await db.run(
        `INSERT INTO hosts (hostname, os_name, os_version, kernel_version, ip_address, current_user, uptime) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          hostInfo.hostname,
          hostInfo.os_name,
          hostInfo.os_version,
          hostInfo.kernel_version,
          hostInfo.ip_address,
          hostInfo.current_user,
          hostInfo.uptime
        ]
      );
      hostId = result.id;
    }

    // 2. Refresh Packages (Delete old, insert new)
    await db.run('DELETE FROM packages WHERE host_id = ?', [hostId]);
    if (packages && packages.length > 0) {
      const pkgStmt = 'INSERT INTO packages (host_id, name, version) VALUES (?, ?, ?)';
      for (const pkg of packages) {
        await db.run(pkgStmt, [hostId, pkg.name, pkg.version]);
      }
    }

    // 3. Refresh CIS Results (Delete old, insert new)
    await db.run('DELETE FROM cis_results WHERE host_id = ?', [hostId]);
    if (cisResults && cisResults.length > 0) {
      const cisStmt = 'INSERT INTO cis_results (host_id, name, status, severity, evidence, recommendation) VALUES (?, ?, ?, ?, ?, ?)';
      for (const cis of cisResults) {
        await db.run(cisStmt, [hostId, cis.name, cis.status, cis.severity, cis.evidence, cis.recommendation]);
      }
    }

    res.status(201).json({ message: 'Data ingested successfully', hostId });
  } catch (err) {
    console.error('Ingest Error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/hosts
router.get('/hosts', async (req, res) => {
  try {
    const hosts = await db.all('SELECT * FROM hosts ORDER BY last_seen DESC');
    res.json(hosts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/hosts/:id
router.get('/hosts/:id', async (req, res) => {
  try {
    const host = await db.get('SELECT * FROM hosts WHERE id = ?', [req.params.id]);
    if (!host) return res.status(404).json({ error: 'Host not found' });
    res.json(host);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/hosts/:id/packages
router.get('/hosts/:id/packages', async (req, res) => {
  try {
    const packages = await db.all('SELECT * FROM packages WHERE host_id = ? ORDER BY name ASC', [req.params.id]);
    res.json(packages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/hosts/:id/cis-results
router.get('/hosts/:id/cis-results', async (req, res) => {
  try {
    const results = await db.all('SELECT * FROM cis_results WHERE host_id = ?', [req.params.id]);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/summary
router.get('/dashboard/summary', async (req, res) => {
  try {
    const totalHostsRow = await db.get('SELECT COUNT(*) as count FROM hosts');
    const totalPackagesRow = await db.get('SELECT COUNT(*) as count FROM packages');
    const passedChecksRow = await db.get("SELECT COUNT(*) as count FROM cis_results WHERE status = 'PASS'");
    const failedChecksRow = await db.get("SELECT COUNT(*) as count FROM cis_results WHERE status = 'FAIL'");

    const totalHosts = totalHostsRow.count;
    const totalPackages = totalPackagesRow.count;
    const passedChecks = passedChecksRow.count;
    const failedChecks = failedChecksRow.count;
    
    const totalChecks = passedChecks + failedChecks;
    const compliancePercent = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 100;

    // Fetch real alerts (recent failed checks)
    const recentAlerts = await db.all(`
      SELECT c.name as title, h.hostname as host, c.severity, h.last_seen as time
      FROM cis_results c
      JOIN hosts h ON c.host_id = h.id
      WHERE c.status = 'FAIL'
      ORDER BY h.last_seen DESC
      LIMIT 4
    `);

    // Fetch real recent scans
    const recentScans = await db.all(`
      SELECT h.hostname, h.last_seen, 
             (SELECT COUNT(*) FROM cis_results WHERE host_id = h.id AND status = 'PASS') as passed,
             (SELECT COUNT(*) FROM cis_results WHERE host_id = h.id AND status = 'FAIL') as failed
      FROM hosts h
      ORDER BY h.last_seen DESC
      LIMIT 3
    `);

    res.json({
      totalHosts,
      totalPackages,
      passedChecks,
      failedChecks,
      compliancePercent,
      recentAlerts,
      recentScans
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
