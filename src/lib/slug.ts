export function slugify(value: string): string {
  if (!value) {
    return 'station';
  }

  const normalized = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .toLowerCase();

  const slug = normalized
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  return slug || 'station';
}

export function withRandomSuffix(slug: string, length: number = 4): string {
  const random = Math.random().toString(36).slice(2, 2 + length);
  return `${slug}-${random}`;
}

