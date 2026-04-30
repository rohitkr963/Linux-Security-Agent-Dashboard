import React from 'react';
import { formatRelativeTime } from '../utils/time';
import { exportDashboardCSV, exportDashboardPDF } from '../utils/export';
import { SkeletonCard, SkeletonRow } from './shared/SkeletonCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, Donut, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';

const Icons = {
  Host: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>,
  CheckCircle: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11"/></svg>,
  AlertTriangle: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Shield: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Download: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  FileText: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  Clock: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
};

function Dashboard({ stats, trend, loading, lastUpdated, onNavigateToHosts }) {
  const alerts = stats.recentAlerts || [];
  const lowestHosts = stats.lowestHosts || [];

  if (loading && stats.totalHosts === 0) {
    return (
      <div>
        <div className="stats-grid">
          {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
        </div>
        <div className="chart-grid">
          <SkeletonCard style={{ height: '350px' }} />
          <SkeletonCard style={{ height: '350px' }} />
        </div>
      </div>
    );
  }

  // --- Chart Data Preparation ---
  // 1. Passed vs Failed (Pie)
  const passFailData = [
    { name: 'Passed', value: stats.passedChecks, color: '#10b981' },
    { name: 'Failed', value: stats.failedChecks, color: '#ef4444' }
  ];

  // 2. Status Donut (Online / Stale / Offline)
  const statusData = [
    { name: 'Online', value: stats.onlineHosts, color: '#10b981' },
    { name: 'Stale', value: stats.staleHosts, color: '#f59e0b' },
    { name: 'Offline', value: stats.offlineHosts, color: '#64748b' }
  ];

  // --- Handlers ---
  const handleExportCSV = () => {
    alert("Exporting CSV is disabled in stub, implement export utils for dashboard!");
  };

  const handleExportPDF = () => {
    exportDashboardPDF(stats, trend);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Platform Overview</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {lastUpdated && (
            <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Icons.Clock /> Last updated: {formatRelativeTime(lastUpdated)}
            </span>
          )}
          <button className="btn btn-outline" onClick={handleExportCSV}>
            <Icons.FileText /> Export CSV
          </button>
          <button className="btn btn-primary" onClick={handleExportPDF}>
            <Icons.Download /> Export PDF
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="card card-top-primary">
          <div className="card-header-flex"><div className="card-title">Total Endpoints</div><div className="card-icon"><Icons.Host /></div></div>
          <div className="card-value">{stats.totalHosts}</div>
        </div>

        <div className="card card-top-success">
          <div className="card-header-flex"><div className="card-title">Online Hosts</div><div className="card-icon" style={{color:'var(--success)'}}><Icons.CheckCircle /></div></div>
          <div className="card-value" style={{color:'var(--success)'}}>{stats.onlineHosts}</div>
        </div>

        <div className="card card-top-warning">
          <div className="card-header-flex"><div className="card-title">Stale / Degraded</div><div className="card-icon" style={{color:'var(--warning)'}}><Icons.AlertTriangle /></div></div>
          <div className="card-value" style={{color:'var(--warning)'}}>{stats.staleHosts}</div>
        </div>

        <div className="card" style={{ borderTop: '4px solid #64748b' }}>
          <div className="card-header-flex"><div className="card-title">Offline</div><div className="card-icon" style={{color:'#64748b'}}><Icons.AlertTriangle /></div></div>
          <div className="card-value" style={{color:'#64748b'}}>{stats.offlineHosts}</div>
        </div>

        <div className="card card-top-success">
          <div className="card-header-flex"><div className="card-title">Global Compliance</div><div className="card-icon" style={{color: stats.compliancePercent >= 80 ? 'var(--success)' : 'var(--warning)' }}><Icons.Shield /></div></div>
          <div className="card-value" style={{color: stats.compliancePercent >= 80 ? 'var(--success)' : 'var(--warning)' }}>{stats.compliancePercent}%</div>
        </div>
      </div>

      {/* Enterprise Charts */}
      <div className="chart-grid">
        
        {/* Pass vs Fail Pie Chart */}
        <div className="chart-card">
          <h3 className="section-title" style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Global Security Controls</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={passFailData} cx="50%" cy="50%" innerRadius={0} outerRadius={80} dataKey="value" label>
                  {passFailData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <RechartsTooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Donut */}
        <div className="chart-card">
          <h3 className="section-title" style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Fleet Status Distribution</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <RechartsTooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Compliance Bar */}
        <div className="chart-card">
          <h3 className="section-title" style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Top Hosts by Lowest Compliance</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lowestHosts} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="hostname" tick={{fontSize: 12}} />
                <YAxis domain={[0, 100]} />
                <RechartsTooltip />
                <Bar dataKey="score" fill="#ef4444" radius={[4, 4, 0, 0]} name="Compliance %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Compliance Trend Line */}
        <div className="chart-card">
          <h3 className="section-title" style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Compliance Trend (30 Days)</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{fontSize: 12}} />
                <YAxis domain={[0, 100]} />
                <RechartsTooltip />
                <Line type="monotone" dataKey="avgScore" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} name="Avg Score %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Critical Alerts section */}
      <div className="dashboard-layout" style={{ gridTemplateColumns: '1fr' }}>
        <div className="chart-card" style={{ height: 'auto', minHeight: '300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="section-title" style={{ margin: 0 }}><Icons.AlertTriangle /> Critical & High Priority Security Alerts</h3>
            <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }} onClick={onNavigateToHosts}>View Full Fleet</button>
          </div>
          
          <div className="table-container" style={{boxShadow: 'none', border: '1px solid #e2e8f0'}}>
            <table>
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Hostname</th>
                  <th>Failed Control</th>
                  <th>Recorded At</th>
                </tr>
              </thead>
              <tbody>
                {alerts.length > 0 ? alerts.map((alert, i) => (
                  <tr key={i}>
                    <td>
                      <span className={`badge ${alert.severity === 'CRITICAL' ? 'badge-danger' : 'badge-warning'}`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{alert.host}</td>
                    <td>{alert.title}</td>
                    <td style={{ color: '#64748b' }}>{formatRelativeTime(alert.time)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                      <Icons.Shield /> No critical security alerts detected in the fleet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
    </div>
  );
}

export default Dashboard;
