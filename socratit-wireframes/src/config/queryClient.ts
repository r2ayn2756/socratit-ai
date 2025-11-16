// ============================================================================
// REACT QUERY CONFIGURATION
// Configure TanStack Query for server state management
// ============================================================================

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Prevent refetch on component mount (use cached data)
      refetchOnReconnect: false, // Prevent refetch on network reconnect
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes - data is considered fresh
      gcTime: 10 * 60 * 1000, // 10 minutes - how long to keep unused data in cache
    },
  },
});
