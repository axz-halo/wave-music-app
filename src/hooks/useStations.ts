import { useState, useEffect, useCallback } from 'react';
import { StationService, StationPlaylist } from '@/services/stationService';

interface UseStationsOptions {
  limit?: number;
  autoLoad?: boolean;
  sharedOnly?: boolean; // Feed용: 공유된 Station만 가져오기
}

interface UseStationsReturn {
  playlists: StationPlaylist[];
  isLoading: boolean;
  error: Error | null;
  refreshPlaylists: () => Promise<void>;
}

export function useStations(options: UseStationsOptions = {}): UseStationsReturn {
  const { limit = 50, autoLoad = true, sharedOnly = false } = options;
  
  const [playlists, setPlaylists] = useState<StationPlaylist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadPlaylists = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = sharedOnly 
        ? await StationService.getSharedStations(limit)
        : await StationService.getPlaylists();
      
      setPlaylists(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load playlists'));
      console.error('Error loading playlists:', err);
    } finally {
      setIsLoading(false);
    }
  }, [limit, sharedOnly]);

  const refreshPlaylists = useCallback(async () => {
    await loadPlaylists();
  }, [loadPlaylists]);

  useEffect(() => {
    if (autoLoad) {
      loadPlaylists();
    }
  }, [autoLoad, loadPlaylists]);

  return {
    playlists,
    isLoading,
    error,
    refreshPlaylists,
  };
}
