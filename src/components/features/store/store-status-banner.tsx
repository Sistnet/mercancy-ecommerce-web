'use client';

/**
 * Store Status Banner - Shows when store is closed
 * AIDEV-NOTE: Displays prominent banner when store is not accepting orders
 */

import { Clock, AlertCircle } from 'lucide-react';
import { useStoreStatus, formatNextOpeningTime } from '@/lib/hooks';

export function StoreStatusBanner() {
  const { isOpen, isTemporarilyClosed, nextOpeningTime, isLoading } = useStoreStatus();

  // Don't show anything while loading or if store is open
  if (isLoading || isOpen) {
    return null;
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="container py-3">
        <div className="flex items-center justify-center gap-3 text-amber-800">
          {isTemporarilyClosed ? (
            <>
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium">
                Loja temporariamente fechada. Não estamos aceitando pedidos no momento.
              </p>
            </>
          ) : (
            <>
              <Clock className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium">
                Estamos fechados no momento.
                {nextOpeningTime && (
                  <span className="ml-1">
                    {formatNextOpeningTime(nextOpeningTime)}
                  </span>
                )}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
