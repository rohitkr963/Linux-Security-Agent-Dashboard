import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { formatRelativeTime } from '../utils/time';
import { StatusBadge } from './shared/StatusBadge';
import { SkeletonRow } from './shared/SkeletonCard';
import { exportCSV } from '../utils/export';
import { fetchHosts } from '../utils/api';

const Icons = {
  Server: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>,
  FileText: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  RefreshCw: ({ spinning }) => <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: spinning ? 'spin 0.8s linear infinite' : 'none' }}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
  ChevronRight: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  Monitor: () => <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
  Filter: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
};

function formatOsLabel(osName, osVersion) {
  if (!osName) return 'Unknown OS';
  const combined = `${osName} ${osVersion || ''}`.trim();
  return combined.length > 36 ? combined.substring(0, 35) + '…' : combined;
}

function Hosts({ onViewDetails }) {
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters & Sorting
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [complianceFilter, setComplianceFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('lastSeen_desc');
  
  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  const loadHosts = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const data = await fetchHosts();
      setHosts(data);
    } catch (err) {
      console.error(err);
    } finally {
      if (loading) setLoading(false);
      setRefreshing(false);
    }
  }, [loading]);

  useEffect(() => {
    loadHosts();
    const interval = setInterval(loadHosts, 10000);
    return () => clearInterval(interval);
  }, [loadHosts]);

  // Derived: Stats
  const stats = useMemo(() => {
    return {
      online: hosts.filter(h => h.status === 'online').length,
      stale: hosts.filter(h => h.status === 'stale').length,
      offline: hosts.filter(h => h.status === 'offline').length,
      total: hosts.length
    };
  }, [hosts]);

  // Derived: Filtered and Sorted
  const processedHosts = useMemo(() => {
    let result = hosts.filter((host) => {
      const term = search.toLowerCase();
      const matchesSearch = 
        host.hostname?.toLowerCase().includes(term) || 
        host.ip_address?.toLowerCase().includes(term) || 
        host.os_name?.toLowerCase().includes(term);

      const matchesStatus = statusFilter === 'all' || host.status === statusFilter;
      
      let matchesCompliance = true;
      if (complianceFilter === 'low') matchesCompliance = host.complianceScore < 50;
      if (complianceFilter === 'high') matchesCompliance = host.complianceScore >= 80;

      return matchesSearch && matchesStatus && matchesCompliance;
    });

    result.sort((a, b) => {
      switch (sortOrder) {
        case 'lastSeen_desc': return new Date(b.last_seen) - new Date(a.last_seen);
        case 'lastSeen_asc': return new Date(a.last_seen) - new Date(b.last_seen);
        case 'compliance_desc': return b.complianceScore - a.complianceScore;
        case 'compliance_asc': return a.complianceScore - b.complianceScore;
        case 'hostname_asc': return a.hostname.localeCompare(b.hostname);
        case 'hostname_desc': return b.hostname.localeCompare(a.hostname);
        default: return 0;
      }
    });

    return result;
  }, [hosts, search, statusFilter, complianceFilter, sortOrder]);

  // Derived: Paginated
  const totalPages = Math.ceil(processedHosts.length / itemsPerPage) || 1;
  const currentHosts = processedHosts.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  // Pagination bounds check
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const handleExportCSV = () => {
    const headers = ['Hostname', 'IP Address', 'OS', 'Status', 'Compliance %', 'Last Seen'];
    const rows = processedHosts.map(h => [
      h.hostname, h.ip_address, formatOsLabel(h.os_name, h.os_version),
      h.status, h.complianceScore, h.last_seen
    ]);
    exportCSV('fleet_inventory', headers, rows);
  };

  return (
    <div className="hosts-page">
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .hosts-page { display: flex; flex-direction: column; gap: 1.5rem; }
        
        .bulk-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
        .bulk-card { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem; background: var(--bg-card); border-radius: var(--radius); border: 1px solid var(--border); box-shadow: var(--shadow-sm); }
        .bulk-card-content p { color: var(--text-muted); font-size: 0.875rem; font-weight: 600; text-transform: uppercase; margin-bottom: 0.25rem; }
        .bulk-card-content h3 { font-size: 1.75rem; font-weight: 800; color: #0f172a; }
        
        .controls-toolbar { display: flex; flex-wrap: wrap; gap: 1rem; padding: 1rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); align-items: center; justify-content: space-between; box-shadow: var(--shadow-sm); }
        .search-wrap { position: relative; flex: 1; min-width: 280px; }
        .search-icon { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: #94a3b8; }
        .search-input { width: 100%; padding: 0.6rem 1rem 0.6rem 2.5rem; border: 1px solid var(--border); border-radius: var(--radius-sm); outline: none; background: #f8fafc; transition: all 0.2s; font-size: 0.875rem; }
        .search-input:focus { border-color: var(--primary-accent); background: white; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        
        .filters-wrap { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }
        .filter-select { padding: 0.5rem 1rem; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.813rem; background: #f8fafc; font-weight: 500; color: var(--text-main); outline: none; transition: border-color 0.2s; cursor: pointer; }
        .filter-select:focus { border-color: var(--primary-accent); }
        
        .pagination { display: flex; align-items: center; justify-content: space-between; padding: 1rem 0; }
        .page-text { font-size: 0.875rem; color: var(--text-muted); }
      `}</style>

      {/* Header & Bulk Stats */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '-0.5rem' }}>Fleet Inventory</h2>
      
      <div className="bulk-stats">
        <div className="bulk-card" style={{ borderTop: '4px solid #0f172a' }}>
          <div className="bulk-card-content"><p>Total Fleet</p><h3>{stats.total}</h3></div>
        </div>
        <div className="bulk-card" style={{ borderTop: '4px solid var(--success)' }}>
          <div className="bulk-card-content"><p>Online Healthy</p><h3>{stats.online}</h3></div>
        </div>
        <div className="bulk-card" style={{ borderTop: '4px solid var(--warning)' }}>
          <div className="bulk-card-content"><p>Stale Issues</p><h3>{stats.stale}</h3></div>
        </div>
        <div className="bulk-card" style={{ borderTop: '4px solid #64748b' }}>
          <div className="bulk-card-content"><p>Offline Servers</p><h3>{stats.offline}</h3></div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="controls-toolbar">
        <div className="search-wrap">
          <span className="search-icon"><Icons.Search /></span>
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search by hostname, IP address, OS..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
        
        <div className="filters-wrap">
          <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="online">Online</option>
            <option value="stale">Stale</option>
            <option value="offline">Offline</option>
          </select>

          <select className="filter-select" value={complianceFilter} onChange={e => setComplianceFilter(e.target.value)}>
            <option value="all">All Compliance</option>
            <option value="high">High (&geq; 80%)</option>
            <option value="low">Low (&lt; 50%)</option>
          </select>

          <select className="filter-select" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
            <option value="lastSeen_desc">Last Seen (Newest)</option>
            <option value="lastSeen_asc">Last Seen (Oldest)</option>
            <option value="compliance_asc">Compliance (Lowest)</option>
            <option value="compliance_desc">Compliance (Highest)</option>
            <option value="hostname_asc">Hostname (A-Z)</option>
            <option value="hostname_desc">Hostname (Z-A)</option>
          </select>

          <div style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 0.5rem' }} />

          <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem' }} onClick={handleExportCSV}>
            <Icons.FileText /> Export CSV
          </button>
          
          <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem' }} onClick={() => loadHosts(true)}>
            <Icons.RefreshCw spinning={refreshing} />
          </button>
        </div>
      </div>

      {/* Table Content */}
      {loading ? (
        <div className="table-container" style={{ padding: '1rem' }}>
          {[1,2,3,4,5].map(i => <SkeletonRow key={i} />)}
        </div>
      ) : processedHosts.length === 0 ? (
        <div className="table-container" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <div style={{ color: '#94a3b8', marginBottom: '1rem' }}><Icons.Monitor /></div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.5rem' }}>No Endpoints Found</h3>
          <p style={{ color: '#64748b' }}>Try adjusting your search query or removing filters to view the fleet inventory.</p>
        </div>
      ) : (
        <div className="table-container">
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Hostname</th>
                  <th>Status</th>
                  <th>Compliance</th>
                  <th>IP Address</th>
                  <th>Operating System</th>
                  <th>Last Scanned</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentHosts.map(host => (
                  <tr key={host.id} onClick={() => onViewDetails(host.id, host.hostname)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ color: 'var(--primary-accent)', background: '#eff6ff', padding: '0.4rem', borderRadius: '8px' }}>
                        <Icons.Server />
                      </span>
                      {host.hostname}
                    </td>
                    <td><StatusBadge status={host.status} /></td>
                    <td>
                      <span className={`badge ${host.complianceScore >= 80 ? 'badge-success' : host.complianceScore < 50 ? 'badge-danger' : 'badge-warning'}`}>
                        {host.complianceScore}%
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', color: '#64748b' }}>{host.ip_address}</td>
                    <td>
                      <span style={{ background: '#f8fafc', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', border: '1px solid var(--border)' }}>
                        {formatOsLabel(host.os_name, host.os_version)}
                      </span>
                    </td>
                    <td style={{ color: '#64748b', fontSize: '0.813rem' }}>{formatRelativeTime(host.last_seen)}</td>
                    <td>
                      <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }} onClick={(e) => { e.stopPropagation(); onViewDetails(host.id, host.hostname); }}>
                        Review <Icons.ChevronRight />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="pagination" style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)' }}>
            <span className="page-text">
              Showing {((page - 1) * itemsPerPage) + 1} to {Math.min(page * itemsPerPage, processedHosts.length)} of {processedHosts.length} endpoints
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className="btn btn-outline" 
                disabled={page === 1} 
                onClick={() => setPage(page - 1)}
                style={{ padding: '0.4rem 0.75rem' }}
              >
                Previous
              </button>
              <button 
                className="btn btn-outline" 
                disabled={page === totalPages} 
                onClick={() => setPage(page + 1)}
                style={{ padding: '0.4rem 0.75rem' }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Hosts;
