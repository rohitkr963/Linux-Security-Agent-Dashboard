import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { formatRelativeTime } from '../utils/time';

const API_URL = 'http://localhost:5000/api';

// --- Icon Library ---
const Icons = {
  Package: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
  ),
  Shield: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
  ),
  Search: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
  ),
  Download: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
  ),
  RefreshCw: ({ spinning }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: spinning ? 'hd-spin 0.8s linear infinite' : 'none' }}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
  ),
  ArrowLeft: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
  ),
  CheckCircle: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
  ),
  XCircle: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
  ),
  Activity: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
  ),
  Copy: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
  ),
  AlertTriangle: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
  ),
  Box: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
  )
};

// --- Main Component ---
function HostDetails({ hostId, hostname, onBack }) {
  const [activeTab, setActiveTab] = useState('cis');
  const [hostMeta, setHostMeta] = useState(null);
  const [packages, setPackages] = useState([]);
  const [cisResults, setCisResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // States for CIS Tab
  const [searchCis, setSearchCis] = useState('');
  const [cisFilter, setCisFilter] = useState('all');

  // States for Packages Tab
  const [searchPkg, setSearchPkg] = useState('');
  const [sortPkg, setSortPkg] = useState('name');

  const fetchDetails = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [hostRes, pkgRes, cisRes] = await Promise.all([
        fetch(`${API_URL}/hosts/${hostId}`),
        fetch(`${API_URL}/hosts/${hostId}/packages`),
        fetch(`${API_URL}/hosts/${hostId}/cis-results`)
      ]);

      if (hostRes.ok) setHostMeta(await hostRes.json());
      if (pkgRes.ok) setPackages(await pkgRes.json());
      if (cisRes.ok) setCisResults(await cisRes.json());
    } catch (err) {
      console.error('Error fetching details:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hostId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // Derived KPI Stats
  const totalChecks = cisResults.length;
  const passedChecks = cisResults.filter(c => c.status === 'PASS').length;
  const failedChecks = totalChecks - passedChecks;
  const complianceScore = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;
  const totalPackages = packages.length;

  // Render KPIs
  const KPIs = [
    { label: 'Compliance Score', value: `${complianceScore}%`, icon: <Icons.Activity />, color: complianceScore > 80 ? 'text-green-600' : 'text-amber-500' },
    { label: 'Passed Controls', value: passedChecks, icon: <Icons.CheckCircle />, color: 'text-green-600' },
    { label: 'Failed Controls', value: failedChecks, icon: <Icons.XCircle />, color: 'text-red-500' },
    { label: 'Installed Packages', value: totalPackages, icon: <Icons.Package />, color: 'text-blue-500' },
  ];

  // Derived CIS Data
  const filteredCis = useMemo(() => {
    return cisResults.filter(c => {
      const matchSearch = c.name?.toLowerCase().includes(searchCis.toLowerCase()) || c.recommendation?.toLowerCase().includes(searchCis.toLowerCase());
      const matchFilter = cisFilter === 'all' || 
                         (cisFilter === 'pass' && c.status === 'PASS') || 
                         (cisFilter === 'fail' && c.status !== 'PASS');
      return matchSearch && matchFilter;
    });
  }, [cisResults, searchCis, cisFilter]);

  // Derived PKG Data
  const filteredPackages = useMemo(() => {
    let result = packages.filter(pkg => 
      pkg.name.toLowerCase().includes(searchPkg.toLowerCase()) || 
      pkg.version.toLowerCase().includes(searchPkg.toLowerCase())
    );
    result.sort((a, b) => {
      if (sortPkg === 'name') return a.name.localeCompare(b.name);
      if (sortPkg === 'version') return b.version.localeCompare(a.version);
      return 0;
    });
    return result;
  }, [packages, searchPkg, sortPkg]);

  // Handlers
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    // Optional: add a tiny toast here if you want
  };

  const exportJSON = () => {
    const data = {
      endpoint: hostname,
      scannedAt: hostMeta?.last_seen,
      compliance: { score: complianceScore, passed: passedChecks, failed: failedChecks },
      cisResults,
      packages
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_${hostname.replace(/\s+/g, '_')}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentStatus = React.useMemo(() => {
    if (!hostMeta || !hostMeta.last_seen) return 'inactive';
    const dateInput = hostMeta.last_seen;
    const date = new Date(
      typeof dateInput === 'string' && dateInput.includes(' ') 
        ? dateInput.replace(' ', 'T') + 'Z' 
        : dateInput
    );
    const diffMs = Date.now() - date.getTime();
    return diffMs < 120 * 1000 ? 'active' : 'inactive';
  }, [hostMeta]);

  if (loading) return (
    <div className="hd-loading">
      <Icons.RefreshCw spinning={true} />
      Retrieving security posture database...
    </div>
  );

  return (
    <div className="hd-page">
      <style>{`
        @keyframes hd-spin { to { transform: rotate(360deg); } }

        .hd-page { display: flex; flex-direction: column; gap: 1.5rem; animation: hd-fade-in 0.3s ease-out; }
        @keyframes hd-fade-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

        /* Scoped Utlity Resets */
        .hd-page * { box-sizing: border-box; }
        
        /* Header Section */
        .hd-header-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
        .hd-header-top { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; }
        
        .hd-title-area { display: flex; flex-direction: column; gap: 0.5rem; }
        .hd-back-btn { display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.813rem; font-weight: 600; color: #64748b; background: none; border: none; cursor: pointer; padding: 0; margin-bottom: 0.5rem; transition: color 0.2s; }
        .hd-back-btn:hover { color: #0f172a; }
        .hd-title-wrapper { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
        .hd-title { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.03em; }
        .hd-hostname { font-family: 'SFMono-Regular', Consolas, monospace; background: #f1f5f9; border: 1px solid #e2e8f0; padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 1.125rem; color: #2563eb; letter-spacing: 0; }
        .hd-status-chip { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.25rem 0.6rem; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; color: #059669; }
        .hd-status-inactive { background: #f1f5f9; border-color: #e2e8f0; color: #64748b; }
        .hd-status-dot { width: 6px; height: 6px; border-radius: 50%; background: #10b981; box-shadow: 0 0 0 2px rgba(16,185,129,0.2); }
        .hd-dot-inactive { background: #94a3b8; box-shadow: none; }
        .hd-subtitle { font-size: 0.875rem; color: #64748b; margin: 0; max-width: 600px; }

        .hd-header-utils { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
        .hd-btn { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.5rem 0.875rem; border-radius: 9px; font-size: 0.813rem; font-weight: 600; cursor: pointer; transition: all 0.2s; border: 1px solid transparent; }
        .hd-btn-outline { background: #ffffff; border-color: #e2e8f0; color: #334155; }
        .hd-btn-outline:hover { background: #f8fafc; border-color: #cbd5e1; }
        .hd-btn-primary { background: #eff6ff; border-color: #bfdbfe; color: #2563eb; }
        .hd-btn-primary:hover { background: #dbeafe; border-color: #93c5fd; }
        .hd-sync-time { font-size: 0.75rem; color: #94a3b8; }

        /* KPI Cards */
        .hd-kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
        .hd-kpi-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1.25rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 1px 2px rgba(0,0,0,0.03); transition: transform 0.2s, box-shadow 0.2s; }
        .hd-kpi-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .hd-kpi-icon-wrap { width: 44px; height: 44px; border-radius: 12px; background: #f8fafc; display: flex; align-items: center; justify-content: center; }
        .hd-kpi-content { display: flex; flex-direction: column; }
        .hd-kpi-value { font-size: 1.5rem; font-weight: 800; color: #0f172a; line-height: 1.2; }
        .hd-kpi-label { font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }

        .text-green-600 { color: #16a34a; }
        .text-amber-500 { color: #f59e0b; }
        .text-red-500 { color: #ef4444; }
        .text-blue-500 { color: #3b82f6; }

        /* Tabs */
        .hd-tabs-wrap { border-bottom: 1px solid #e2e8f0; display: flex; gap: 2rem; padding: 0 0.5rem; }
        .hd-tab { display: flex; align-items: center; gap: 0.5rem; padding: 1rem 0; font-size: 0.875rem; font-weight: 600; color: #64748b; cursor: pointer; position: relative; transition: color 0.2s; border: none; background: transparent; }
        .hd-tab:hover { color: #0f172a; }
        .hd-tab.active { color: #2563eb; }
        .hd-tab::after { content: ''; position: absolute; bottom: -1px; left: 0; width: 100%; height: 2px; background: #2563eb; border-radius: 2px 2px 0 0; opacity: 0; transform: scaleX(0.8); transition: all 0.2s; }
        .hd-tab.active::after { opacity: 1; transform: scaleX(1); }
        .hd-tab-count { background: #f1f5f9; color: #475569; padding: 0.15rem 0.5rem; border-radius: 9999px; font-size: 0.7rem; border: 1px solid #e2e8f0; }
        .hd-tab.active .hd-tab-count { background: #eff6ff; color: #2563eb; border-color: #bfdbfe; }

        /* Toolbar for Tabs */
        .hd-tab-toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-top: 0.5rem; }
        .hd-search-wrap { position: relative; flex: 1; min-width: 250px; max-width: 400px; }
        .hd-search-icon { position: absolute; left: 0.875rem; top: 50%; transform: translateY(-50%); color: #94a3b8; pointer-events: none; }
        .hd-search { width: 100%; padding: 0.5rem 1rem 0.5rem 2.5rem; border: 1px solid #e2e8f0; border-radius: 9px; font-size: 0.875rem; background: #fff; color: #1e293b; transition: all 0.2s; outline: none; }
        .hd-search:focus { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
        .hd-filters { display: flex; gap: 0.5rem; }
        .hd-select { padding: 0.5rem 2rem 0.5rem 1rem; border: 1px solid #e2e8f0; border-radius: 9px; font-size: 0.813rem; background: #fff; color: #334155; font-weight: 500; cursor: pointer; outline: none; transition: border-color 0.2s; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 0.75rem center; }
        .hd-select:focus { border-color: #93c5fd; }

        /* Table Structure */
        .hd-table-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04); display: flex; flex-direction: column; }
        .hd-table-scroll { overflow: auto; max-height: 65vh; }
        .hd-table { width: 100%; border-collapse: separate; border-spacing: 0; min-width: 800px; text-align: left; }
        .hd-table thead th { background: #f8fafc; padding: 0.875rem 1.25rem; font-size: 0.7rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 20; white-space: nowrap; box-shadow: 0 1px 0 #e2e8f0; }
        .hd-table tbody tr { transition: background 0.15s; }
        .hd-table tbody tr:nth-child(even) { background: #fafbfc; }
        .hd-table tbody tr:hover { background: #f1f5f9; }
        .hd-table td { padding: 1.125rem 1.25rem; font-size: 0.875rem; border-bottom: 1px solid #e2e8f0; vertical-align: top; color: #334155; }
        .hd-table tbody tr:last-child td { border-bottom: none; }

        /* specific table contents */
        .hd-bench-name { font-weight: 600; color: #0f172a; line-height: 1.4; display: block; margin-bottom: 0.25rem; }
        
        .hd-pill { display: inline-flex; align-items: center; padding: 0.25rem 0.6rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; border: 1px solid transparent; }
        .hd-pill-pass { background: #ecfdf5; color: #059669; border-color: #a7f3d0; }
        .hd-pill-fail { background: #fef2f2; color: #dc2626; border-color: #fca5a5; }
        
        .hd-risk-high { color: #dc2626; font-weight: 700; }
        .hd-risk-medium { color: #d97706; font-weight: 700; }
        .hd-risk-low { color: #16a34a; font-weight: 700; }
        
        .hd-evidence-box { position: relative; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.75rem; padding-right: 2.5rem; max-height: 120px; overflow-y: auto; }
        .hd-evidence-pre { margin: 0; font-family: 'SFMono-Regular', Consolas, monospace; font-size: 0.75rem; color: #475569; white-space: pre-wrap; word-break: break-all; }
        .hd-copy-btn { position: absolute; top: 0.5rem; right: 0.5rem; background: #fff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 0.25rem; color: #64748b; cursor: pointer; transition: all 0.2s; display: flex; }
        .hd-copy-btn:hover { background: #f1f5f9; color: #0f172a; border-color: #94a3b8; }

        .hd-remediation { font-size: 0.813rem; line-height: 1.5; color: #475569; }

        /* PKG specifics */
        .hd-pkg-name { font-weight: 600; color: #0f172a; font-size: 0.875rem; }
        .hd-pkg-ver { font-family: 'SFMono-Regular', Consolas, monospace; font-size: 0.813rem; background: #eff6ff; color: #2563eb; padding: 0.2rem 0.5rem; border-radius: 6px; border: 1px solid #bfdbfe; }

        /* Empty States */
        .hd-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; text-align: center; color: #64748b; }
        .hd-empty-icon { width: 64px; height: 64px; border-radius: 16px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; color: #94a3b8; border: 1px solid #e2e8f0; }
        .hd-empty-title { font-size: 1rem; font-weight: 700; color: #0f172a; margin-bottom: 0.5rem; }

        /* Loading */
        .hd-loading { display: flex; align-items: center; justify-content: center; padding: 4rem; color: #64748b; gap: 0.75rem; font-size: 0.875rem; }

        @media (max-width: 768px) {
          .hd-header-top { flex-direction: column; }
          .hd-header-utils { width: 100%; justify-content: space-between; }
          .hd-tab-toolbar { flex-direction: column; align-items: stretch; }
          .hd-search-wrap, .hd-filters { width: 100%; max-width: none; }
        }
      `}</style>

      {/* Header Section */}
      <div className="hd-header-card">
        <div className="hd-header-top">
          <div className="hd-title-area">
            <button className="hd-back-btn" onClick={onBack}>
              <Icons.ArrowLeft /> Back to Fleet
            </button>
            <div className="hd-title-wrapper">
              <h2 className="hd-title">Endpoint Audit:</h2>
              <span className="hd-hostname">{hostname}</span>
              <span className={`hd-status-chip ${currentStatus === 'inactive' ? 'hd-status-inactive' : ''}`}>
                <span className={`hd-status-dot ${currentStatus === 'inactive' ? 'hd-dot-inactive' : ''}`} /> 
                {currentStatus === 'active' ? 'Active Monitoring' : 'Inactive'}
              </span>
            </div>
            <p className="hd-subtitle">Real-time endpoint posture, package inventory, and CIS benchmark compliance.</p>
          </div>
          
          <div className="hd-header-utils">
             {hostMeta?.last_seen && (
              <span className="hd-sync-time">
                Last Scanned: {formatRelativeTime(hostMeta.last_seen)}
              </span>
            )}
            <button className="hd-btn hd-btn-outline" onClick={() => fetchDetails(true)} disabled={refreshing}>
              <Icons.RefreshCw spinning={refreshing} /> Refresh
            </button>
            <button className="hd-btn hd-btn-primary" onClick={exportJSON}>
              <Icons.Download /> Export JSON
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="hd-kpi-grid">
        {KPIs.map((kpi, idx) => (
          <div key={idx} className="hd-kpi-card">
            <div className={`hd-kpi-icon-wrap ${kpi.color}`}>
              {kpi.icon}
            </div>
            <div className="hd-kpi-content">
              <span className="hd-kpi-value">{kpi.value}</span>
              <span className="hd-kpi-label">{kpi.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="hd-tabs-wrap">
        <button 
          className={`hd-tab ${activeTab === 'cis' ? 'active' : ''}`}
          onClick={() => setActiveTab('cis')}
        >
          <Icons.Shield /> CIS Benchmark Controls
          <span className="hd-tab-count">{cisResults.length}</span>
        </button>
        <button 
          className={`hd-tab ${activeTab === 'packages' ? 'active' : ''}`}
          onClick={() => setActiveTab('packages')}
        >
          <Icons.Package /> Software Inventory
          <span className="hd-tab-count">{packages.length}</span>
        </button>
      </div>

      {/* Tab Content: CIS Controls */}
      {activeTab === 'cis' && (
        <>
          <div className="hd-tab-toolbar">
            <div className="hd-search-wrap">
              <span className="hd-search-icon"><Icons.Search /></span>
              <input 
                type="text" 
                className="hd-search" 
                placeholder="Search benchmark names or remediation..." 
                value={searchCis}
                onChange={(e) => setSearchCis(e.target.value)}
              />
            </div>
            <div className="hd-filters">
              <select className="hd-select" value={cisFilter} onChange={e => setCisFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="pass">Passed Only</option>
                <option value="fail">Failed Only</option>
              </select>
            </div>
          </div>

          <div className="hd-table-card">
            <div className="hd-table-scroll">
              <table className="hd-table">
                <thead>
                  <tr>
                    <th style={{ width: '25%' }}>Benchmark Definition</th>
                    <th style={{ width: '10%' }}>Status</th>
                    <th style={{ width: '10%' }}>Risk Level</th>
                    <th style={{ width: '30%' }}>System Evidence</th>
                    <th style={{ width: '25%' }}>Remediation Path</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCis.length > 0 ? filteredCis.map((check, index) => (
                    <tr key={index}>
                      <td>
                        <span className="hd-bench-name">{check.name}</span>
                      </td>
                      <td>
                        <span className={`hd-pill ${check.status === 'PASS' ? 'hd-pill-pass' : 'hd-pill-fail'}`}>
                          {check.status}
                        </span>
                      </td>
                      <td>
                        <span className={`
                          ${check.severity === 'High' ? 'hd-risk-high' : 
                            check.severity === 'Medium' ? 'hd-risk-medium' : 'hd-risk-low'}
                        `}>
                          {check.severity}
                        </span>
                      </td>
                      <td>
                        <div className="hd-evidence-box">
                          <button className="hd-copy-btn" onClick={() => handleCopy(check.evidence || 'N/A')} title="Copy evidence">
                            <Icons.Copy />
                          </button>
                          <pre className="hd-evidence-pre">{check.evidence || 'N/A'}</pre>
                        </div>
                      </td>
                      <td>
                        <div className="hd-remediation">{check.recommendation}</div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5">
                        <div className="hd-empty">
                          <div className="hd-empty-icon"><Icons.AlertTriangle /></div>
                          <h3 className="hd-empty-title">No compliance results available</h3>
                          <p>Adjust your search/filters or run a new scan.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Tab Content: Software Inventory */}
      {activeTab === 'packages' && (
        <>
          <div className="hd-tab-toolbar">
            <div className="hd-search-wrap">
              <span className="hd-search-icon"><Icons.Search /></span>
              <input 
                type="text" 
                className="hd-search" 
                placeholder="Search installed packages..." 
                value={searchPkg}
                onChange={(e) => setSearchPkg(e.target.value)}
              />
            </div>
            <div className="hd-filters">
              <select className="hd-select" value={sortPkg} onChange={e => setSortPkg(e.target.value)}>
                <option value="name">Sort by Name</option>
                <option value="version">Sort by Version</option>
              </select>
            </div>
          </div>

          <div className="hd-table-card">
            <div className="hd-table-scroll">
              <table className="hd-table">
                <thead>
                  <tr>
                    <th style={{ width: '50%' }}>Component Identifier</th>
                    <th style={{ width: '50%' }}>Installed Version</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPackages.length > 0 ? filteredPackages.map((pkg, index) => (
                    <tr key={index}>
                      <td><span className="hd-pkg-name">{pkg.name}</span></td>
                      <td><span className="hd-pkg-ver">{pkg.version}</span></td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="2">
                        <div className="hd-empty">
                          <div className="hd-empty-icon"><Icons.Box /></div>
                          <h3 className="hd-empty-title">No software inventory detected</h3>
                          <p>No matching packages found for your query.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

    </div>
  );
}

export default HostDetails;
