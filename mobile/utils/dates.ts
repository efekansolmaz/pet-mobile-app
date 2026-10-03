import { differenceInYears, format, formatDistanceToNow, parseISO } from 'date-fns';

export function petAge(birthDate?: string | null): string {
  if (!birthDate) return 'Age unknown';
  const years = differenceInYears(new Date(), parseISO(birthDate));
  if (years < 1) return 'Under 1 year';
  return `${years} year${years === 1 ? '' : 's'} old`;
}

export function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function prettyDate(value?: string | null): string {
  if (!value) return 'Not set';
  return format(parseISO(value), 'MMM d, yyyy');
}

export function prettyDateTime(value?: string | null): string {
  if (!value) return 'Not set';
  return format(parseISO(value), 'MMM d, yyyy · HH:mm');
}

export function relative(value?: string | null): string {
  if (!value) return '';
  return formatDistanceToNow(parseISO(value), { addSuffix: true });
}
