/**
 * Hook to check store open/closed status
 * AIDEV-NOTE: Uses first active branch's business hours status
 */

import { useAppSelector } from '@/lib/store/hooks';
import { useMemo } from 'react';

export interface StoreStatus {
  isOpen: boolean;
  isAlwaysOpen: boolean;
  isTemporarilyClosed: boolean;
  nextOpeningTime: Date | null;
  isLoading: boolean;
}

export function useStoreStatus(): StoreStatus {
  const { config, isLoading } = useAppSelector((state) => state.config);

  return useMemo(() => {
    // Default: store is open if no config loaded yet (optimistic)
    if (!config || !config.branches || config.branches.length === 0) {
      return {
        isOpen: true,
        isAlwaysOpen: false,
        isTemporarilyClosed: false,
        nextOpeningTime: null,
        isLoading,
      };
    }

    // AIDEV-NOTE: Use first active branch for store status
    // In multi-branch scenarios, this could be enhanced to use selected branch
    const branch = config.branches[0];

    return {
      isOpen: branch.is_open ?? true,
      isAlwaysOpen: branch.is_always_open ?? false,
      isTemporarilyClosed: branch.is_temporarily_closed ?? false,
      nextOpeningTime: branch.next_opening_time
        ? new Date(branch.next_opening_time)
        : null,
      isLoading,
    };
  }, [config, isLoading]);
}

/**
 * Format next opening time for display
 */
export function formatNextOpeningTime(date: Date | null): string {
  if (!date) return '';

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const timeStr = date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isToday) {
    return `Abre hoje às ${timeStr}`;
  }

  if (isTomorrow) {
    return `Abre amanhã às ${timeStr}`;
  }

  const dayStr = date.toLocaleDateString('pt-BR', {
    weekday: 'long',
  });

  return `Abre ${dayStr} às ${timeStr}`;
}
