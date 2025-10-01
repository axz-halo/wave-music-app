import { useState, useEffect, useCallback } from 'react';
import { StationService, StationPlaylist } from '@/services/stationService';

interface UseStationsReturn {
  playlists: StationPlaylist[];
  isLoading: boolean;
  error: Error | null;
  loadPlaylists: () => Promise<void>;
  refreshPlaylists: () => Promise<void>;
}

export function useStations(): UseStationsReturn {
  const [playlists, setPlaylists] = useState<StationPlaylist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadPlaylists = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await StationService.getPlaylists();
      setPlaylists(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load playlists'));
      console.error('Error loading playlists:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshPlaylists = useCallback(async () => {
    await loadPlaylists();
  }, [loadPlaylists]);

  useEffect(() => {
    loadPlaylists();
  }, [loadPlaylists]);

  return {
    playlists,
    isLoading,
    error,
    loadPlaylists,
    refreshPlaylists,
  };
}

