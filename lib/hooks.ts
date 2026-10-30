'use client';

import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from './api';

type Query = Record<string, string | number | boolean | null | undefined>;

/** GET helper: `const { data, isLoading } = useApi<DevicesRes>('devices')` */
export function useApi<T = any>(path: string, query?: Query, opts: { refetchInterval?: number; enabled?: boolean } = {}) {
  return useQuery({
    queryKey: [path, query ?? {}],
    queryFn: () => api<T>(path, { query }),
    placeholderData: keepPreviousData,
    refetchInterval: opts.refetchInterval,
    enabled: opts.enabled,
  });
}

/**
 * Mutation helper with toast feedback and cache invalidation.
 *   const save = useAction<Body>('templates', { invalidate: ['templates'] })
 *   save.mutate({ name, content })
 * `path` may be a function of the variables (for DELETE /x/:id style routes).
 */
export function useAction<V = any, R = any>(
  path: string | ((vars: V) => string),
  opts: { method?: string; invalidate?: string[]; success?: string | ((res: R, vars: V) => string | undefined); onDone?: (res: R, vars: V) => void } = {},
) {
  const qc = useQueryClient();
  return useMutation<R, ApiError, V>({
    mutationFn: (vars) => api<R>(typeof path === 'function' ? path(vars) : path, { method: opts.method ?? 'POST', body: opts.method === 'DELETE' ? undefined : vars }),
    onSuccess: (res, vars) => {
      const msg = typeof opts.success === 'function' ? opts.success(res, vars) : (opts.success ?? (res as any)?.message);
      if (msg) toast.success(msg);
      for (const key of opts.invalidate ?? []) qc.invalidateQueries({ queryKey: [key] });
      opts.onDone?.(res, vars);
    },
    onError: (err) => toast.error(err.full),
  });
}
