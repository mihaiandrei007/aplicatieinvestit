/**
 * lib/paginate — paginare offset-based, pură și reutilizabilă.
 *
 * Validează și normalizează parametrii (page ≥ 1, pageSize în limite) și
 * întoarce felia cerută plus metadate de navigare.
 */

export interface PageParams {
  page?: number;
  pageSize?: number;
}

export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** Normalizează parametrii de paginare la valori sigure. */
export function normalizePageParams(params: PageParams = {}): { page: number; pageSize: number } {
  const page = Math.max(1, Math.floor(params.page ?? 1));
  const rawSize = Math.floor(params.pageSize ?? DEFAULT_PAGE_SIZE);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, rawSize));
  return { page, pageSize };
}

/** Paginează o listă deja încărcată în memorie. */
export function paginate<T>(items: readonly T[], params: PageParams = {}): Page<T> {
  const { page, pageSize } = normalizePageParams(params);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const slice = items.slice(start, start + pageSize);

  return {
    items: slice,
    page,
    pageSize,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/** Calculează `skip`/`take` pentru interogări de bază de date (ex. Prisma). */
export function toSkipTake(params: PageParams = {}): { skip: number; take: number } {
  const { page, pageSize } = normalizePageParams(params);
  return { skip: (page - 1) * pageSize, take: pageSize };
}
