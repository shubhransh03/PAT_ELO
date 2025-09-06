import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from '../api';
import { keys } from './queryKeys';

// Fetch list of patients
export function usePatientsList(filters = {}, options = {}) {
  return useQuery({
    queryKey: keys.patients.list(filters),
    queryFn: async () => apiGet('/api/patients', filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...options,
  });
}

// Fetch a single patient by id
export function usePatient(id, options = {}) {
  return useQuery({
    queryKey: keys.patients.detail(id),
    queryFn: async () => apiGet(`/api/patients/${id}`),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

// Create patient (optimistic add)
export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data) => apiPost('/api/patients', data),
    onMutate: async (newData) => {
      await qc.cancelQueries({ queryKey: keys.patients.all, exact: false });
      const snapshots = qc.getQueriesData({ queryKey: keys.patients.list(), exact: false });

      // Optimistically add to any cached lists
      const tempId = `temp-${Date.now()}`;
      snapshots.forEach(([qk, prev]) => {
        if (!prev) return;
        const items = Array.isArray(prev.data) ? prev.data : prev?.data?.data;
        if (!Array.isArray(items)) return;
        const optimistic = { ...newData, _id: tempId };
        const next = Array.isArray(prev.data)
          ? { ...prev, data: [optimistic, ...items] }
          : { ...prev, data: { ...(prev.data || {}), data: [optimistic, ...items] } };
        qc.setQueryData(qk, next);
      });

      return { snapshots };
    },
    onError: (_err, _newData, ctx) => {
      // Rollback
      ctx?.snapshots?.forEach(([qk, data]) => qc.setQueryData(qk, data));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.patients.all, exact: false });
    },
  });
}

// Update patient (optimistic update in lists and detail)
export function useUpdatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }) => apiPut(`/api/patients/${id}`, updates),
    onMutate: async ({ id, updates }) => {
      await qc.cancelQueries({ queryKey: keys.patients.all, exact: false });
      const detailKey = keys.patients.detail(id);
      const prevDetail = qc.getQueryData(detailKey);
      if (prevDetail) {
        const nextDetail = Array.isArray(prevDetail?.data)
          ? prevDetail
          : { ...prevDetail, data: { ...(prevDetail.data || {}), data: { ...(prevDetail?.data?.data || {}), ...updates, _id: id } } };
        qc.setQueryData(detailKey, nextDetail);
      }

      const snapshots = qc.getQueriesData({ queryKey: keys.patients.list(), exact: false });
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
      if (ctx?.prevDetail) qc.setQueryData(keys.patients.detail(ctx.id), ctx.prevDetail);
      ctx?.snapshots?.forEach(([qk, data]) => qc.setQueryData(qk, data));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.patients.all, exact: false });
    },
  });
}

// Delete patient (optimistic remove)
export function useDeletePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => apiDelete(`/api/patients/${id}`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: keys.patients.all, exact: false });
      const snapshots = qc.getQueriesData({ queryKey: keys.patients.list(), exact: false });
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
      const detailKey = keys.patients.detail(id);
      const prevDetail = qc.getQueryData(detailKey);
      qc.removeQueries({ queryKey: detailKey });
      return { snapshots, prevDetail, id };
    },
    onError: (_err, _id, ctx) => {
      ctx?.snapshots?.forEach(([qk, data]) => qc.setQueryData(qk, data));
      if (ctx?.prevDetail) qc.setQueryData(keys.patients.detail(ctx.id), ctx.prevDetail);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.patients.all, exact: false });
    },
  });
}
