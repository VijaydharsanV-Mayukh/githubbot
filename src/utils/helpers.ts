/**
 * Truncates text to a maximum length and appends ellipsis if needed
 */
export function truncate(str: string | undefined | null, maxLength: number): string {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Formats seconds into human readable duration string (e.g. 1m 23s)
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

/**
 * Normalizes repository name to standard format "owner/repo" or lowercased string
 */
export function normalizeRepoName(name: string): string {
  return name.trim().toLowerCase();
}
