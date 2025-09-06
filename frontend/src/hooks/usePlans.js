import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from '../api';
import { keys } from './queryKeys';

export function usePlansList(filters = {}, options = {}) {
  return useQuery({
    queryKey: keys.plans.list(filters),
    queryFn: async () => apiGet('/api/plans', filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...options,
  });
}

export function usePlan(id, options = {}) {
  return useQuery({
    queryKey: keys.plans.detail(id),
    queryFn: async () => apiGet(`/api/plans/${id}`),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data) => apiPost('/api/plans', data),
    onMutate: async (newData) => {
      await qc.cancelQueries({ queryKey: keys.plans.all, exact: false });
      const snapshots = qc.getQueriesData({ queryKey: keys.plans.list(), exact: false });
      const tempId = `temp-${Date.now()}`;
      snapshots.forEach(([qk, prev]) => {
        if (!prev) return;
        const items = Array.isArray(prev.data) ? prev.data : prev?.data?.data;
        if (!Array.isArray(items)) return;
        const optimistic = { ...newData, _id: tempId, status: newData?.status || 'draft' };
        const next = Array.isArray(prev.data)
          ? { ...prev, data: [optimistic, ...items] }
          : { ...prev, data: { ...(prev.data || {}), data: [optimistic, ...items] } };
        qc.setQueryData(qk, next);
      });
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots?.forEach(([qk, data]) => qc.setQueryData(qk, data));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.plans.all, exact: false });
    },
  });
}

export function useUpdatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }) => apiPut(`/api/plans/${id}`, updates),
    onMutate: async ({ id, updates }) => {
      await qc.cancelQueries({ queryKey: keys.plans.all, exact: false });
      const detailKey = keys.plans.detail(id);
      const prevDetail = qc.getQueryData(detailKey);
      if (prevDetail) {
        const nextDetail = Array.isArray(prevDetail?.data)
          ? prevDetail
          : { ...prevDetail, data: { ...(prevDetail.data || {}), data: { ...(prevDetail?.data?.data || {}), ...updates, _id: id } } };
        qc.setQueryData(detailKey, nextDetail);
      }
      const snapshots = qc.getQueriesData({ queryKey: keys.plans.list(), exact: false });
      snapshots.forEach(([qk, prev]) => {
        if (!prev) return;
        const items = Array.isArray(prev.data) ? prev.data : prev?.data?.data;
        if (!Array.isArray(items)) return;
        const nextItems = items.map((it) => (String(it._id) === String(id) ? { ...it, ...updates } : it));
        const next = Array.isArray(prev.data)
          ? { ...prev, data: nextItems }
          : { ...prev, data: { ...(prev.data || {}), data: nextItems } };
        qc.setQueryData(qk, next);
      });
      return { prevDetail, snapshots, id };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevDetail) qc.setQueryData(keys.plans.detail(ctx.id), ctx.prevDetail);
      ctx?.snapshots?.forEach(([qk, data]) => qc.setQueryData(qk, data));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.plans.all, exact: false });
    },
  });
}

export function useDeletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => apiDelete(`/api/plans/${id}`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: keys.plans.all, exact: false });
      const snapshots = qc.getQueriesData({ queryKey: keys.plans.list(), exact: false });
      snapshots.forEach(([qk, prev]) => {
        if (!prev) return;
        const items = Array.isArray(prev.data) ? prev.data : prev?.data?.data;
        if (!Array.isArray(items)) return;
        const nextItems = items.filter((it) => String(it._id) !== String(id));
        const next = Array.isArray(prev.data)
          ? { ...prev, data: nextItems }
          : { ...prev, data: { ...(prev.data || {}), data: nextItems } };
        qc.setQueryData(qk, next);
      });
      const detailKey = keys.plans.detail(id);
      const prevDetail = qc.getQueryData(detailKey);
      qc.removeQueries({ queryKey: detailKey });
      return { snapshots, prevDetail, id };
    },
    onError: (_err, _id, ctx) => {
      ctx?.snapshots?.forEach(([qk, data]) => qc.setQueryData(qk, data));
      if (ctx?.prevDetail) qc.setQueryData(keys.plans.detail(ctx.id), ctx.prevDetail);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.plans.all, exact: false });
    },
  });
}
