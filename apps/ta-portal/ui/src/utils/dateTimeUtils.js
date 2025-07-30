export const formatTimestamp = (isoString) => {
  if (!isoString) return 'No date';
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};