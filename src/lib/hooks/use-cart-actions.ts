/**
 * Hook for cart actions with store status validation
 * AIDEV-NOTE: Blocks cart operations when store is closed
 */

import { useCallback } from 'react';
import { useAppDispatch } from '@/lib/store/hooks';
import { addToCart as addToCartAction } from '@/lib/store/slices/cart.slice';
import { useStoreStatus, formatNextOpeningTime } from './use-store-status';
import { toast } from 'sonner';
import type { AddToCartPayload } from '@/types/cart.types';

export interface UseCartActionsResult {
  addToCart: (payload: AddToCartPayload) => boolean;
  canAddToCart: boolean;
  storeClosedMessage: string | null;
}

export function useCartActions(): UseCartActionsResult {
  const dispatch = useAppDispatch();
  const { isOpen, isTemporarilyClosed, nextOpeningTime } = useStoreStatus();

  const canAddToCart = isOpen;

  const storeClosedMessage = !isOpen
    ? isTemporarilyClosed
      ? 'Loja temporariamente fechada'
      : nextOpeningTime
        ? formatNextOpeningTime(nextOpeningTime)
        : 'Loja fechada no momento'
    : null;

  const addToCart = useCallback(
    (payload: AddToCartPayload): boolean => {
      // AIDEV-NOTE: Block adding to cart when store is closed
      if (!isOpen) {
        toast.error(
          isTemporarilyClosed
            ? 'A loja está temporariamente fechada. Não é possível adicionar itens ao carrinho.'
            : 'A loja está fechada no momento. Tente novamente durante o horário de funcionamento.',
          {
            description: nextOpeningTime
              ? formatNextOpeningTime(nextOpeningTime)
              : undefined,
            duration: 5000,
          }
        );
        return false;
      }

      dispatch(addToCartAction(payload));
      toast.success('Produto adicionado ao carrinho!');
      return true;
    },
    [dispatch, isOpen, isTemporarilyClosed, nextOpeningTime]
  );

  return {
    addToCart,
    canAddToCart,
    storeClosedMessage,
  };
}
