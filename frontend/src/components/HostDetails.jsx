import React, { useState, useEffect, useCallback } from 'react';
import { formatRelativeTime } from '../utils/time';
import { StatusBadge } from './shared/StatusBadge';
import { SkeletonRow, SkeletonCard } from './shared/SkeletonCard';
import { exportCSV, exportHostPDF } from '../utils/export';
import { fetchHostMeta, fetchHostPackages, fetchHostChecks } from '../utils/api';

const Icons = {
  ArrowLeft: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  Server: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>,
  Shield: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Package: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  Download: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  FileText: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
};

function HostDetails({ hostId, hostname, onBack }) {
  const [activeTab, setActiveTab] = useState('cis'); // 'cis' or 'packages'
  const [meta, setMeta] = useState(null);
  const [checks, setChecks] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [metaData, pkgsData, checksData] = await Promise.all([
        fetchHostMeta(hostId),
        fetchHostPackages(hostId),
        fetchHostChecks(hostId)
      ]);
      setMeta(metaData);
      setPackages(pkgsData);
      setChecks(checksData);
    } catch (err) {
      console.error(err);
    } finally {
      if (loading) setLoading(false);
    }
  }, [hostId, loading]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleCsvExportInfo = () => {
    if (activeTab === 'cis') {
      const headers = ['Benchmark', 'Status', 'Risk Severity', 'Time', 'Remediation'];
      const rows = checks.map(c => [c.name, c.status, c.severity, c.createdAt, c.recommendation]);
      exportCSV(`${hostname}_cis_findings`, headers, rows);
    } else {
      const headers = ['Package Name', 'Version'];
      const rows = packages.map(p => [p.name, p.version]);
      exportCSV(`${hostname}_packages`, headers, rows);
    }
  };

  const handlePdfExport = () => {
    exportHostPDF(hostname, meta, meta?.complianceScore, checks);
  };

  if (loading) {
    return (
      <div className="host-details-page">
        <SkeletonCard style={{ height: '200px', marginBottom: '2rem' }} />
        {[1,2,3,4].map(i => <SkeletonRow key={i} />)}
      </div>
    );
  }

  if (!meta) {
    return <div style={{textAlign: 'center', padding: '4rem'}}>Failed to load endpoint details.</div>;
  }

  return (
    <div className="host-details">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-outline" style={{ padding: '0.4rem 0.6rem' }} onClick={onBack}>
            <Icons.ArrowLeft /> Back
          </button>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--primary-accent)' }}><Icons.Server /></span>
            {hostname}
          </h2>
          <StatusBadge status={meta.status} />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-outline" onClick={handleCsvExportInfo}>
            <Icons.FileText /> Export {activeTab === 'cis' ? 'Findings (CSV)' : 'Inventory (CSV)'}
          </button>
          <button className="btn btn-primary" onClick={handlePdfExport}>
            <Icons.Download /> Security Audit (PDF)
          </button>
        </div>
      </div>

      {/* Meta Card */}
      <div className="card" style={{ marginBottom: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <div>
          <p style={{ color: '#64748b', fontSize: '0.813rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>IP Address</p>
          <div style={{ fontFamily: 'monospace', fontSize: '1.125rem', color: '#0f172a' }}>{meta.ip_address}</div>
        </div>
        <div>
          <p style={{ color: '#64748b', fontSize: '0.813rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Operating System</p>
          <div style={{ fontSize: '1.125rem', color: '#0f172a' }}>{meta.os_name}</div>
        </div>
        <div>
          <p style={{ color: '#64748b', fontSize: '0.813rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Last Scanned</p>
          <div style={{ fontSize: '1.125rem', color: '#0f172a' }}>{meta.last_seen ? formatRelativeTime(meta.last_seen) : 'Never'}</div>
        </div>
        <div>
          <p style={{ color: '#64748b', fontSize: '0.813rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Compliance Score</p>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: meta.complianceScore >= 80 ? 'var(--success)' : meta.complianceScore < 50 ? 'var(--danger)' : 'var(--warning)' }}>
            {meta.complianceScore}%
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
        <button 
          className={`tab-btn ${activeTab === 'cis' ? 'active' : ''}`}
          style={{ padding: '1rem 1.5rem', background: 'none', border: 'none', borderBottom: activeTab === 'cis' ? '2px solid var(--primary-accent)' : '2px solid transparent', color: activeTab === 'cis' ? 'var(--primary-accent)' : '#64748b', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
          onClick={() => setActiveTab('cis')}
        >
          <Icons.Shield /> CIS Security Benchmarks ({checks.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'packages' ? 'active' : ''}`}
          style={{ padding: '1rem 1.5rem', background: 'none', border: 'none', borderBottom: activeTab === 'packages' ? '2px solid var(--primary-accent)' : '2px solid transparent', color: activeTab === 'packages' ? 'var(--primary-accent)' : '#64748b', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
          onClick={() => setActiveTab('packages')}
        >
          <Icons.Package /> Software Inventory ({packages.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'cis' && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Benchmark</th>
                <th>Status</th>
                <th>Risk Severity</th>
                <th>Time</th>
                <th>Remediation / Note</th>
              </tr>
            </thead>
            <tbody>
              {checks.map((c, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 500, color: '#0f172a' }}>{c.name}</td>
                  <td>
                    <span className={`badge ${c.status === 'PASS' ? 'badge-success' : 'badge-danger'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td>
                    {c.severity !== 'INFO' ? (
                      <span className={`badge ${c.severity === 'CRITICAL' ? 'badge-danger' : c.severity === 'HIGH' ? 'badge-warning' : 'badge-general'}`}>
                        {c.severity}
                      </span>
                    ) : (
                      <span className="badge badge-general">INFO</span>
                    )}
                  </td>
                  <td style={{ color: '#64748b' }}>{formatRelativeTime(c.createdAt)}</td>
                  <td style={{ color: '#64748b', fontSize: '0.875rem' }}>{c.recommendation || '-'}</td>
                </tr>
              ))}
              {checks.length === 0 && (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No security scans found for this endpoint.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'packages' && (
        <div className="table-container" style={{ maxWidth: '800px' }}>
          <table>
            <thead>
              <tr>
                <th>Package Name</th>
                <th>Version</th>
              </tr>
            </thead>
            <tbody>
              {packages.map((p, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 500, color: '#0f172a' }}>{p.name}</td>
                  <td style={{ fontFamily: 'monospace', color: '#64748b' }}>{p.version}</td>
                </tr>
              ))}
              {packages.length === 0 && (
                <tr><td colSpan="2" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No packages found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}

export default HostDetails;
