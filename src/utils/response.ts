import { Response } from "express";
import { PaginationMeta, SortMeta } from "@/utils/pagination";

export function ok<T>(res: Response, data: T, status = 200): Response {
  return res.status(status).json({
    success: true,
    data,
  });
}

export function okList<T>(
  res: Response,
  data: T[],
  pagination: PaginationMeta,
  filters: Record<string, unknown>,
  sort: SortMeta,
  status = 200,
): Response {
  return res.status(status).json({
    success: true,
    data,
    pagination,
    filters,
    sort,
  });
}

export function created<T>(res: Response, data: T): Response {
  return ok(res, data, 201);
}
