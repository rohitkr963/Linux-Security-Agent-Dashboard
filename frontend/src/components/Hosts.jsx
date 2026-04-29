import React, { useState, useEffect, useCallback } from 'react';
import { formatRelativeTime } from '../utils/time';

const API_URL = 'https://hostguard.duckdns.org/api';

// --- Icon Library ---
const Icons = {
  Server: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
  ),
  FileText: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
  ),
  Search: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
  ),
  RefreshCw: ({ spinning }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: spinning ? 'hosts-spin 0.8s linear infinite' : 'none' }}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
  ),
  ChevronRight: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
  ),
  Monitor: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
  ),
  Filter: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
  ),
};

// --- Helper: Format OS Label ---
function formatOsLabel(osName, osVersion) {
  if (!osName) return 'Unknown OS';
  const combined = `${osName} ${osVersion || ''}`.trim();

  // Truncate excessively long strings
  if (combined.length > 36) {
    return combined.substring(0, 35) + '…';
  }
  return combined;
}

// --- Helper: Fix APIPA IPs ---
function getRealisticIp(hostId, rawIp) {
  return rawIp;
}

// --- Helper: Determine host status ---
function getHostStatus(host) {
  if (!host.last_seen) return 'inactive';
  const dateInput = host.last_seen;
  const date = new Date(
    typeof dateInput === 'string' && dateInput.includes(' ') 
      ? dateInput.replace(' ', 'T') + 'Z' 
      : dateInput
  );
  const diffMs = Date.now() - date.getTime();
  return diffMs < 120 * 1000 ? 'active' : 'inactive';
}

// --- StatusBadge Component ---
function StatusBadge({ status }) {
  const isActive = status === 'active';
  return (
    <span className={`hosts-badge ${isActive ? 'hosts-badge-active' : 'hosts-badge-inactive'}`}>
      <span className={`hosts-badge-dot ${isActive ? 'hosts-dot-active' : 'hosts-dot-inactive'}`} />
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

// --- Main Component ---
function Hosts({ onViewDetails }) {
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchHosts = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const res = await fetch(`${API_URL}/hosts`);
      if (res.ok) {
        setHosts(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHosts();
  }, [fetchHosts]);

  // Derived: filtered hosts
  const filtered = hosts.filter((host) => {
    const matchesSearch = host.hostname?.toLowerCase().includes(search.toLowerCase());
    const hostStatus = getHostStatus(host);
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && hostStatus === 'active') ||
      (statusFilter === 'inactive' && hostStatus === 'inactive');
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="hosts-page">
      {/* Keyframe for spin animation */}
      <style>{`
        @keyframes hosts-spin { to { transform: rotate(360deg); } }

        .hosts-page { display: flex; flex-direction: column; gap: 1.5rem; }

        /* Header */
        .hosts-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
        .hosts-header-left { display: flex; flex-direction: column; gap: 0.25rem; }
        .hosts-title-row { display: flex; align-items: center; gap: 0.75rem; }
        .hosts-title { font-size: 1.375rem; font-weight: 800; color: #0f172a; letter-spacing: -0.03em; margin: 0; }
        .hosts-count-badge { background: #eff6ff; color: #2563eb; font-size: 0.75rem; font-weight: 700; padding: 0.2rem 0.65rem; border-radius: 9999px; border: 1px solid #bfdbfe; }
        .hosts-subtitle { font-size: 0.813rem; color: #64748b; margin: 0; }

        /* Toolbar */
        .hosts-toolbar { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1rem 1.25rem; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
        .hosts-search-wrap { position: relative; flex: 1; min-width: 200px; }
        .hosts-search-icon { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: #94a3b8; pointer-events: none; }
        .hosts-search { width: 100%; padding: 0.5rem 0.875rem 0.5rem 2.25rem; border: 1px solid #e2e8f0; border-radius: 9px; font-size: 0.875rem; color: #1e293b; background: #f8fafc; outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
        .hosts-search::placeholder { color: #94a3b8; }
        .hosts-search:focus { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.12); background: #fff; }
        .hosts-filter-wrap { display: flex; align-items: center; gap: 0.4rem; color: #64748b; }
        .hosts-select { padding: 0.5rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 9px; font-size: 0.875rem; color: #334155; background: #f8fafc; outline: none; cursor: pointer; transition: border-color 0.2s; }
        .hosts-select:focus { border-color: #93c5fd; }
        .hosts-toolbar-divider { width: 1px; height: 28px; background: #e2e8f0; flex-shrink: 0; }
        .hosts-refresh-btn { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.5rem 0.875rem; border: 1px solid #e2e8f0; border-radius: 9px; font-size: 0.813rem; font-weight: 600; color: #334155; background: #f8fafc; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .hosts-refresh-btn:hover { background: #f1f5f9; border-color: #cbd5e1; color: #1e293b; }
        .hosts-sync-text { font-size: 0.75rem; color: #94a3b8; white-space: nowrap; }

        /* Table wrapper */
        .hosts-table-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04); overflow: hidden; }
        .hosts-table-scroll { overflow-x: auto; }
        .hosts-table { width: 100%; border-collapse: collapse; text-align: left; min-width: 680px; }
        .hosts-table thead th { background: #f8fafc; padding: 0.875rem 1.375rem; font-size: 0.7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.07em; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
        .hosts-table tbody tr { border-bottom: 1px solid #f1f5f9; transition: background 0.15s, box-shadow 0.15s; cursor: pointer; }
        .hosts-table tbody tr:last-child { border-bottom: none; }
        .hosts-table tbody tr:nth-child(even) { background: #fafbfc; }
        .hosts-table tbody tr:hover { background: #eff6ff !important; box-shadow: inset 3px 0 0 #2563eb; }
        .hosts-table td { padding: 1.125rem 1.375rem; font-size: 0.875rem; color: #334155; vertical-align: middle; }

        /* Hostname cell */
        .hosts-hostname-cell { display: flex; align-items: center; gap: 0.75rem; }
        .hosts-hostname-icon { width: 34px; height: 34px; border-radius: 9px; background: #eff6ff; border: 1px solid #bfdbfe; display: flex; align-items: center; justify-content: center; color: #2563eb; flex-shrink: 0; }
        .hosts-hostname-text { font-weight: 700; color: #0f172a; font-size: 0.875rem; }

        /* OS chip */
        .hosts-os-chip { display: inline-flex; align-items: center; background: #f1f5f9; color: #475569; font-size: 0.75rem; font-weight: 500; padding: 0.3rem 0.65rem; border-radius: 7px; border: 1px solid #e2e8f0; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        /* IP code */
        .hosts-ip { font-family: 'SFMono-Regular', 'Consolas', 'Liberation Mono', monospace; font-size: 0.813rem; color: #2563eb; font-weight: 600; letter-spacing: 0.02em; }

        /* Badges */
        .hosts-badge { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.3rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.02em; }
        .hosts-badge-active { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
        .hosts-badge-inactive { background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; }
        .hosts-badge-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .hosts-dot-active { background: #10b981; box-shadow: 0 0 0 2.5px rgba(16,185,129,0.25); }
        .hosts-dot-inactive { background: #94a3b8; }

        /* Last ping */
        .hosts-ping-text { font-size: 0.813rem; color: #64748b; }

        /* Audit button */
        .hosts-audit-btn { display: inline-flex; align-items: center; gap: 0.45rem; padding: 0.45rem 0.875rem; font-size: 0.8rem; font-weight: 600; color: #2563eb; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 9px; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .hosts-audit-btn:hover { background: #dbeafe; border-color: #93c5fd; color: #1d4ed8; transform: translateY(-1px); box-shadow: 0 3px 8px rgba(37,99,235,0.15); }

        /* Empty state */
        .hosts-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.06); text-align: center; gap: 1rem; }
        .hosts-empty-icon { width: 72px; height: 72px; border-radius: 18px; background: #f1f5f9; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; color: #94a3b8; }
        .hosts-empty-title { font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0; }
        .hosts-empty-desc { font-size: 0.875rem; color: #64748b; max-width: 380px; margin: 0; line-height: 1.6; }

        /* Loading */
        .hosts-loading { display: flex; align-items: center; justify-content: center; padding: 4rem; color: #64748b; font-size: 0.875rem; gap: 0.75rem; }

        /* Responsive */
        @media (max-width: 640px) {
          .hosts-toolbar { flex-direction: column; align-items: stretch; }
          .hosts-toolbar-divider { display: none; }
          .hosts-filter-wrap { flex-wrap: wrap; }
        }
      `}</style>

      {/* Header */}
      <div className="hosts-header">
        <div className="hosts-header-left">
          <div className="hosts-title-row">
            <h2 className="hosts-title">Monitored Fleet</h2>
            <span className="hosts-count-badge">{hosts.length} hosts</span>
          </div>
          <p className="hosts-subtitle">Live endpoint inventory and health status</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="hosts-toolbar">
        <div className="hosts-search-wrap">
          <span className="hosts-search-icon"><Icons.Search /></span>
          <input
            className="hosts-search"
            type="text"
            placeholder="Search hostname..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="hosts-filter-wrap">
          <Icons.Filter />
          <select
            className="hosts-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="hosts-toolbar-divider" />

        <button
          className="hosts-refresh-btn"
          onClick={() => fetchHosts(true)}
          disabled={refreshing}
        >
          <Icons.RefreshCw spinning={refreshing} />
          Refresh
        </button>

        {hosts.length > 0 && (
          <span className="hosts-sync-text">
            Synced {formatRelativeTime(Math.max(...hosts.map(h => new Date(h.last_seen || 0).getTime())))}
          </span>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="hosts-loading">
          <Icons.RefreshCw spinning={true} />
          Querying active fleet...
        </div>
      ) : filtered.length === 0 ? (
        <div className="hosts-empty">
          <div className="hosts-empty-icon"><Icons.Monitor /></div>
          <p className="hosts-empty-title">
            {hosts.length === 0 ? 'No monitored endpoints found' : 'No results match your filter'}
          </p>
          <p className="hosts-empty-desc">
            {hosts.length === 0
              ? 'Run the local Go agent on an active terminal to generate machine diagnostics and populate this view.'
              : 'Try adjusting your search query or changing the status filter to see more results.'}
          </p>
        </div>
      ) : (
        <div className="hosts-table-card">
          <div className="hosts-table-scroll">
            <table className="hosts-table">
              <thead>
                <tr>
                  <th>Hostname</th>
                  <th>OS &amp; Architecture</th>
                  <th>Private IP</th>
                  <th>Status</th>
                  <th>Last Ping</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((host, index) => {
                  const status = getHostStatus(host);
                  const displayIp = getRealisticIp(host.id, host.ip_address);
                  const displayOs = formatOsLabel(host.os_name, host.os_version);
                  return (
                    <tr
                      key={host.id}
                      onClick={() => onViewDetails(host.id, host.hostname)}
                      title={`Open audit report for ${host.hostname}`}
                    >
                      <td>
                        <div className="hosts-hostname-cell">
                          <span className="hosts-hostname-icon"><Icons.Server /></span>
                          <span className="hosts-hostname-text">{host.hostname}</span>
                        </div>
                      </td>
                      <td>
                        <span className="hosts-os-chip" title={`${host.os_name} ${host.os_version}`}>
                          {displayOs}
                        </span>
                      </td>
                      <td>
                        <code className="hosts-ip">{displayIp}</code>
                      </td>
                      <td>
                        <StatusBadge status={status} />
                      </td>
                      <td>
                        <span className="hosts-ping-text">
                          {formatRelativeTime(host.last_seen)}
                        </span>
                      </td>
                      <td>
                        <button
                          className="hosts-audit-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewDetails(host.id, host.hostname);
                          }}
                        >
                          <Icons.FileText />
                          Audit Report
                          <Icons.ChevronRight />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Hosts;
