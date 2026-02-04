import { useAuth } from '@clerk/clerk-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mongoQuery, CollectionName } from '@/lib/mongodb';

export function useMongoFind<T>(
  collection: CollectionName,
  filter: Record<string, unknown> = {},
  options: Record<string, unknown> = {},
  enabled = true
) {
  const { getToken } = useAuth();

  return useQuery<T[]>({
    queryKey: ['mongo', collection, 'find', filter, options],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return mongoQuery<T[]>({ collection, operation: 'find', filter, options }, token);
    },
    enabled,
  });
}

export function useMongoFindOne<T>(
  collection: CollectionName,
  filter: Record<string, unknown>,
  enabled = true
) {
  const { getToken } = useAuth();

  return useQuery<T | null>({
    queryKey: ['mongo', collection, 'findOne', filter],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return mongoQuery<T | null>({ collection, operation: 'findOne', filter }, token);
    },
    enabled,
  });
}

export function useMongoInsert<T>(collection: CollectionName) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (document: Partial<T>) => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return mongoQuery({ collection, operation: 'insertOne', document: document as Record<string, unknown> }, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mongo', collection] });
    },
  });
}

export function useMongoUpdate<T>(collection: CollectionName) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, update }: { id: string; update: Partial<T> }) => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return mongoQuery({
        collection,
        operation: 'updateOne',
        filter: { _id: id },
        update: { $set: update as Record<string, unknown> },
      }, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mongo', collection] });
    },
  });
}

export function useMongoDelete(collection: CollectionName) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return mongoQuery({
        collection,
        operation: 'deleteOne',
        filter: { _id: id },
      }, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mongo', collection] });
    },
  });
}

export function useMongoAggregate<T>(
  collection: CollectionName,
  pipeline: Record<string, unknown>[],
  enabled = true
) {
  const { getToken } = useAuth();

  return useQuery<T[]>({
    queryKey: ['mongo', collection, 'aggregate', pipeline],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return mongoQuery<T[]>({ collection, operation: 'aggregate', pipeline }, token);
    },
    enabled,
  });
}
