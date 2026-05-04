export function formatPrice(price: number | null | undefined): string {
  if (!price) return 'Price Upon Request';
  return `$${price.toLocaleString('en-US')}`;
}

export function formatSqft(sqft: number | null | undefined): string {
  if (sqft == null) return '—';
  return `${sqft.toLocaleString('en-US')} sf`;
}

export function formatAcres(acres: number | null | undefined): string {
  if (acres == null) return '—';
  return `${acres.toFixed(1)} ac`;
}

export function formatDom(dom: number | null | undefined): string {
  if (dom == null) return '—';
  return Math.round(dom).toString();
}

export function formatBeds(beds: number | null | undefined): string {
  if (beds == null) return '—';
  return `${beds} bd`;
}

export function formatBaths(baths: number | null | undefined): string {
  if (baths == null) return '—';
  // Drop trailing ".0" but keep ".5" etc. for half-baths.
  const rounded = Math.round(baths * 10) / 10;
  const display = Number.isInteger(rounded) ? rounded.toString() : rounded.toString();
  return `${display} ba`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}
