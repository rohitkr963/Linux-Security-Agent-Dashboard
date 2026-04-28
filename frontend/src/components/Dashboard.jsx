import React from 'react';

// Inline SVG Icons for zero-dependency modern look
const Icons = {
  Host: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
  ),
  Package: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
  ),
  CheckCircle: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11"/></svg>
  ),
  AlertTriangle: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
  ),
  Shield: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
  )
};

function Dashboard({ stats, onNavigateToHosts }) {
  // Use seeded fallback data if real data hasn't reported yet
  const isDemoMode = stats.totalHosts === 0;
  
  const displayStats = isDemoMode ? {
    totalHosts: 4,
    totalPackages: 1420,
    passedChecks: 32,
    failedChecks: 8,
    compliancePercent: 80
  } : stats;

  const mockAlerts = [
    { type: 'danger', title: 'SSH Root Login Enabled', host: 'prod-web-01', time: '10m ago' },
    { type: 'warning', title: 'Firewall Disabled', host: 'staging-db', time: '45m ago' },
    { type: 'success', title: 'Auditd Service Started', host: 'prod-api', time: '2h ago' },
    { type: 'danger', title: 'World Writable Files Found', host: 'dev-box', time: '5h ago' }
  ];

  const mockScans = [
    { host: 'prod-web-01', status: 'Compliant', score: '90%', time: 'Just now' },
    { host: 'staging-db', status: 'Non-Compliant', score: '60%', time: '12m ago' },
    { host: 'prod-api', status: 'Compliant', score: '100%', time: '1h ago' }
  ];

  return (
    <div>
      {isDemoMode && (
        <div className="demo-banner">
          <span><strong>DEMO MODE:</strong> Currently showing seeded enterprise metrics. Run the Go Agent on a target machine to collect real-time telemetry.</span>
          <button className="btn btn-outline" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none' }} onClick={onNavigateToHosts}>Manage Real Hosts</button>
        </div>
      )}

      <div className="stats-grid">
        <div className="card card-top-primary">
          <div className="card-header-flex">
            <div className="card-title">Total Endpoints</div>
            <div className="card-icon"><Icons.Host /></div>
          </div>
          <div className="card-value">{displayStats.totalHosts}</div>
        </div>

        <div className="card card-top-primary">
          <div className="card-header-flex">
            <div className="card-title">Discovered Packages</div>
            <div className="card-icon"><Icons.Package /></div>
          </div>
          <div className="card-value">{displayStats.totalPackages}</div>
        </div>

        <div className="card card-top-success">
          <div className="card-header-flex">
            <div className="card-title">Passed Controls</div>
            <div className="card-icon" style={{ color: 'var(--success)' }}><Icons.CheckCircle /></div>
          </div>
          <div className="card-value" style={{ color: 'var(--success)' }}>{displayStats.passedChecks}</div>
        </div>

        <div className="card card-top-danger">
          <div className="card-header-flex">
            <div className="card-title">Failed Controls</div>
            <div className="card-icon" style={{ color: 'var(--danger)' }}><Icons.AlertTriangle /></div>
          </div>
          <div className="card-value" style={{ color: 'var(--danger)' }}>{displayStats.failedChecks}</div>
        </div>

        <div className="card card-top-success">
          <div className="card-header-flex">
            <div className="card-title">Compliance Score</div>
            <div className="card-icon" style={{ color: displayStats.compliancePercent >= 80 ? 'var(--success)' : 'var(--warning)' }}><Icons.Shield /></div>
          </div>
          <div className="card-value" style={{ color: displayStats.compliancePercent >= 80 ? 'var(--success)' : 'var(--warning)' }}>
            {displayStats.compliancePercent}%
          </div>
        </div>
      </div>

      <div className="dashboard-layout">
        <div>
          <h3 className="section-title"><Icons.AlertTriangle /> Critical Security Alerts</h3>
          <div className="activity-list">
            {mockAlerts.map((alert, i) => (
              <div className="activity-item" key={i}>
                <div className={`activity-indicator bg-${alert.type}`} />
                <div className="activity-content">
                  <div className="activity-title">{alert.title}</div>
                  <div className="activity-desc">Host: <code>{alert.host}</code></div>
                </div>
                <div className="activity-time">{alert.time}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="section-title"><Icons.Shield /> Latest Scan Logs</h3>
          <div className="activity-list">
            {mockScans.map((scan, i) => (
              <div className="activity-item" key={i} style={{ background: '#f8fafc' }}>
                <div className="activity-content">
                  <div className="activity-title" style={{ fontWeight: 700 }}>{scan.host}</div>
                  <div className="activity-desc">
                    <span className={`badge ${scan.status === 'Compliant' ? 'badge-success' : 'badge-danger'}`} style={{ marginTop: '0.25rem' }}>
                      {scan.status} ({scan.score})
                    </span>
                  </div>
                </div>
                <div className="activity-time">{scan.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ textAlign: 'center', padding: '2.5rem', background: '#ffffff' }}>
        <h2 style={{ color: '#0f172a', marginBottom: '0.5rem', fontWeight: 800 }}>Ready to ingest more endpoints?</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: '600px', margin: '0 auto 1.5rem' }}>
          Execute the lightweight Go binary across your fleet. It maps findings directly back to this localized command interface.
        </p>
        <button className="btn btn-primary" onClick={onNavigateToHosts}>
          <Icons.Host /> Access Monitored Fleet
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
