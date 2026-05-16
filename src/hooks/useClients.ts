'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  createClient,
  deleteClient,
  getClientStats,
  subscribeToClients,
  updateClient,
} from '@/lib/services/clientService';
import { type Client, type ClientFormData } from '@/types/client';

export interface ClientStats {
  total: number;
  totalRevenue: number;
  avgRevenue: number;
}

export function useClients() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) {
      setClients([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToClients((clientList) => {
      setClients(clientList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // ─── Actions ───────────────────────────────────────────────────────────────

  const addClient = useCallback(async (data: ClientFormData) => {
    try {
      setError(null);
      return await createClient(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create client';
      setError(message);
      throw err;
    }
  }, []);

  const editClient = useCallback(async (id: string, data: Partial<ClientFormData>) => {
    try {
      setError(null);
      await updateClient(id, data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update client';
      setError(message);
      throw err;
    }
  }, []);

  const removeClient = useCallback(async (id: string) => {
    try {
      setError(null);
      await deleteClient(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete client';
      setError(message);
      throw err;
    }
  }, []);

  const refreshStats = useCallback(async (): Promise<ClientStats | null> => {
    return getClientStats();
  }, []);

  // ─── Computed ──────────────────────────────────────────────────────────────

  const getClientById = useCallback((id: string) => clients.find((c) => c.id === id), [clients]);

  const totalRevenue = useMemo(
    () => clients.reduce((sum, c) => sum + (c.totalRevenue || 0), 0),
    [clients],
  );

  return {
    clients,
    loading,
    error,
    addClient,
    editClient,
    removeClient,
    refreshStats,
    getClientById,
    totalRevenue,
    total: clients.length,
  };
}
