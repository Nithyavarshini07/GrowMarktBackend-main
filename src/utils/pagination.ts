import { ParsedQs } from "qs";

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface SortMeta {
  sortBy: string;
  sortOrder: "asc" | "desc";
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function toPositiveInt(input: unknown, fallback: number): number {
  const n = Number(input);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.floor(n);
}

export function parsePagination(query: ParsedQs): PaginationParams {
  const page = toPositiveInt(query.page, DEFAULT_PAGE);
  const rawLimit = toPositiveInt(query.limit, DEFAULT_LIMIT);
  const limit = Math.min(rawLimit, MAX_LIMIT);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function buildPaginationMeta(
  total: number,
  params: Pick<PaginationParams, "page" | "limit">,
): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / params.limit));
  return {
    page: params.page,
    limit: params.limit,
    total,
    totalPages,
    hasNext: params.page < totalPages,
    hasPrev: params.page > 1,
  };
}

export function parseSort(
  query: ParsedQs,
  allowedSortBy: string[],
  fallbackSortBy = "createdAt",
  fallbackSortOrder: "asc" | "desc" = "desc",
): { mongoSort: Record<string, 1 | -1>; sortMeta: SortMeta } {
  const sortByRaw = String(query.sortBy || fallbackSortBy);
  const sortBy = allowedSortBy.includes(sortByRaw) ? sortByRaw : fallbackSortBy;
  const sortOrder =
    String(query.sortOrder || fallbackSortOrder).toLowerCase() === "asc"
      ? "asc"
      : "desc";

  return {
    mongoSort: { [sortBy]: sortOrder === "asc" ? 1 : -1 },
    sortMeta: { sortBy, sortOrder },
  };
}

export function parseRangeToStartDate(range?: string): Date | null {
  if (!range) return null;

  const normalized = range.trim().toLowerCase();
  const now = Date.now();

  const map: Record<string, number> = {
    "7d": 7,
    "14d": 14,
    "30d": 30,
    "90d": 90,
  };

  if (!map[normalized]) return null;
  const days = map[normalized];
  return new Date(now - days * 24 * 60 * 60 * 1000);
}
