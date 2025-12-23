'use client';

/**
 * Hook for wishlist actions with authentication validation
 * AIDEV-NOTE: Encapsulates wishlist toggle logic with toast notifications
 */

import { useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks';
import { addToWishlist, removeFromWishlist } from '@/lib/store/slices/wishlist.slice';
import { toast } from 'sonner';

export interface UseWishlistActionsResult {
  /** Whether the product is in the wishlist */
  isInWishlist: boolean;
  /** Toggle wishlist status (add/remove) */
  toggleWishlist: (e?: React.MouseEvent) => void;
  /** Add to wishlist */
  addToWishlist: (e?: React.MouseEvent) => void;
  /** Remove from wishlist */
  removeFromWishlist: (e?: React.MouseEvent) => void;
  /** Whether user can modify wishlist (authenticated) */
  canModifyWishlist: boolean;
}

/**
 * Hook for managing wishlist actions for a specific product
 * @param productId - The product ID to manage
 */
export function useWishlistActions(productId: number): UseWishlistActionsResult {
  const dispatch = useAppDispatch();
  const { productIds: wishlistIds } = useAppSelector((state) => state.wishlist);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const isInWishlist = wishlistIds.includes(productId);

  const handleAdd = useCallback(
    (e?: React.MouseEvent) => {
      e?.preventDefault();
      e?.stopPropagation();

      if (!isAuthenticated) {
        toast.error('Faça login para adicionar aos favoritos');
        return;
      }

      dispatch(addToWishlist(productId));
      toast.success('Adicionado aos favoritos');
    },
    [dispatch, isAuthenticated, productId]
  );

  const handleRemove = useCallback(
    (e?: React.MouseEvent) => {
      e?.preventDefault();
      e?.stopPropagation();

      if (!isAuthenticated) {
        toast.error('Faça login para gerenciar favoritos');
        return;
      }

      dispatch(removeFromWishlist(productId));
      toast.success('Removido dos favoritos');
    },
    [dispatch, isAuthenticated, productId]
  );

  const toggleWishlist = useCallback(
    (e?: React.MouseEvent) => {
      if (isInWishlist) {
        handleRemove(e);
      } else {
        handleAdd(e);
      }
    },
    [isInWishlist, handleAdd, handleRemove]
  );

  return {
    isInWishlist,
    toggleWishlist,
    addToWishlist: handleAdd,
    removeFromWishlist: handleRemove,
    canModifyWishlist: isAuthenticated,
  };
}
