import { useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';

export function useTrendingSocket(onUpdate) {
  const { setTrendingCallback } = useSocket();

  useEffect(() => {
    if (!onUpdate) return undefined;
    return setTrendingCallback(onUpdate);
  }, [onUpdate, setTrendingCallback]);
}
