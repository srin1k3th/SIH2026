import { format, formatDistanceToNow, parseISO } from 'date-fns';

export function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  try {
    const d = parseISO(isoString);
    return format(d, 'dd MMM yyyy, HH:mm');
  } catch {
    return isoString;
  }
}

export function formatDateOnly(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  try {
    const d = parseISO(isoString);
    return format(d, 'dd MMM yyyy');
  } catch {
    return isoString;
  }
}

export function formatRelative(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  try {
    const d = parseISO(isoString);
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return isoString;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function truncateHash(hash: string, len: number = 8): string {
  if (!hash) return '';
  return hash.slice(0, len);
}
