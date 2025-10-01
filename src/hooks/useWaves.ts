import { useState, useEffect, useCallback } from 'react';
import { Wave } from '@/types';
import { WaveService } from '@/services/waveService';
import { transformWaveData } from '@/lib/transformers';

interface UseWavesOptions {
  limit?: number;
  autoLoad?: boolean;
}

interface UseWavesReturn {
  waves: Wave[];
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadWaves: () => Promise<void>;
  refreshWaves: () => Promise<void>;
  updateWave: (waveId: string, updates: Partial<Wave>) => void;
}

export function useWaves(options: UseWavesOptions = {}): UseWavesReturn {
  const { limit = 100, autoLoad = true } = options;
  
  const [waves, setWaves] = useState<Wave[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadWaves = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await WaveService.getWaves({ limit });
      const transformedWaves = await transformWaveData(data);
      
      setWaves(transformedWaves);
      setHasMore(data.length >= limit);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load waves'));
      console.error('Error loading waves:', err);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  const refreshWaves = useCallback(async () => {
    await loadWaves();
  }, [loadWaves]);

  const updateWave = useCallback((waveId: string, updates: Partial<Wave>) => {
    setWaves(prev => 
      prev.map(wave => 
        wave.id === waveId ? { ...wave, ...updates } : wave
      )
    );
  }, []);

  useEffect(() => {
    if (autoLoad) {
      loadWaves();
    }
  }, [autoLoad, loadWaves]);

  return {
    waves,
    isLoading,
    error,
    hasMore,
    loadWaves,
    refreshWaves,
    updateWave,
  };
}

