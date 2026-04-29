const API_URL = 'https://hostguard.duckdns.org/api';
// Use localhost during dev if needed, or point to prod
// const API_URL = 'http://localhost:5000/api';

export const fetchSummary = async () => {
  const res = await fetch(`${API_URL}/dashboard/summary`);
  if (!res.ok) throw new Error('Failed to fetch summary');
  return res.json();
};

export const fetchTrend = async () => {
  const res = await fetch(`${API_URL}/dashboard/compliance-trend`);
  if (!res.ok) throw new Error('Failed to fetch trend');
  return res.json();
};

export const fetchHosts = async () => {
  const res = await fetch(`${API_URL}/hosts`);
  if (!res.ok) throw new Error('Failed to fetch hosts');
  return res.json();
};

export const fetchHostMeta = async (id) => {
  const res = await fetch(`${API_URL}/hosts/${id}`);
  if (!res.ok) throw new Error('Failed to fetch host details');
  return res.json();
};

export const fetchHostPackages = async (id) => {
  const res = await fetch(`${API_URL}/hosts/${id}/packages`);
  if (!res.ok) throw new Error('Failed to fetch packages');
  return res.json();
};

export const fetchHostChecks = async (id) => {
  const res = await fetch(`${API_URL}/hosts/${id}/cis-results`);
  if (!res.ok) throw new Error('Failed to fetch checks');
  return res.json();
};
