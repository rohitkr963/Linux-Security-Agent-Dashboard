export function formatRelativeTime(dateInput) {
  if (!dateInput) return '—';
  
  const date = new Date(
    typeof dateInput === 'string' && dateInput.includes(' ') 
      ? dateInput.replace(' ', 'T') + 'Z' 
      : dateInput
  );
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  
  if (diffSec < 60) return 'Just now';
  
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
}
