export const getHostStatus = (lastSeen) => {
  if (!lastSeen) return 'offline';
  
  // Parses timezone-aware ISO string
  const dateInput = lastSeen;
  const date = new Date(
    typeof dateInput === 'string' && dateInput.includes(' ') 
      ? dateInput.replace(' ', 'T') + 'Z' 
      : dateInput
  );
  
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes <= 5) return 'online';
  if (diffMinutes <= 15) return 'stale';
  return 'offline';
};
