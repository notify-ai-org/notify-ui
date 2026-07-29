import { httpService } from '../services/httpService';
import type { GetOptions } from '../services/httpService';

export const ADMIN_PAGE_SIZE = 5;

export interface PaginatedResponse<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface PaginationRequest extends Omit<GetOptions, 'params'> {
  page?: number;
  size?: number;
  params?: Record<string, unknown>;
}

function normalizePage<T>(response: PaginatedResponse<T> | T[], page: number, size: number): PaginatedResponse<T> {
  if (!Array.isArray(response)) return response;

  const start = page * size;
  const content = response.slice(start, start + size);
  const totalPages = Math.ceil(response.length / size);
  return {
    content,
    number: page,
    size,
    totalElements: response.length,
    totalPages,
    first: page === 0,
    last: page >= totalPages - 1,
  };
}

/** Fetches an admin collection with the standard five-record page contract. */
export async function getPaginated<T>(
  url: string,
  { page = 0, size = ADMIN_PAGE_SIZE, params, ...options }: PaginationRequest = {},
): Promise<PaginatedResponse<T>> {
  const pageSize = Math.min(Math.max(size, 1), ADMIN_PAGE_SIZE);
  const response = await httpService.get<PaginatedResponse<T> | T[]>(url, {
    ...options,
    cacheKey: options.cacheKey ? `${options.cacheKey}:page:${Math.max(page, 0)}:size:${pageSize}` : undefined,
    params: { ...params, page: Math.max(page, 0), size: pageSize },
  });
  return normalizePage(response, Math.max(page, 0), pageSize);
}
