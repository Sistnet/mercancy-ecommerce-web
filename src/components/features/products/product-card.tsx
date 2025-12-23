'use client';

/**
 * ProductCard - Reusable product card component
 * AIDEV-NOTE: Refactored to use extracted hooks and utilities for better maintainability
 */

import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppSelector } from '@/lib/store/hooks';
import {
  useCartActions,
  useStoreStatus,
  useTenantPrefix,
  useTenant,
  useWishlistActions,
} from '@/lib/hooks';
import { formatPrice, calculateDiscountedPrice, formatDiscountBadge, hasDiscount } from '@/lib/utils/price';
import { getProductCardImageUrl } from '@/lib/utils/image';
import type { Product } from '@/types/product.types';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { config } = useAppSelector((state) => state.config);
  const tenantPrefix = useTenantPrefix();
  const tenant = useTenant();

  // AIDEV-NOTE: Use extracted hooks for cart and wishlist actions
  const { addToCart, canAddToCart } = useCartActions();
  const { isOpen } = useStoreStatus();
  const { isInWishlist, toggleWishlist } = useWishlistActions(product.id);

  // Calculate prices using utility
  const discountedPrice = hasDiscount(product.discount)
    ? calculateDiscountedPrice(product.price, product.discount, product.discountType)
    : product.price;

  // Calculate average rating
  const averageRating =
    product.rating && product.rating.length > 0
      ? product.rating.reduce((sum, r) => sum + r.average, 0) / product.rating.length
      : 0;

  // Get image URL using utility
  const imageUrl = getProductCardImageUrl(product, {
    storageConfig: config?.storage,
    tenant,
  });

  // Build product URL - use canonical format if publicId available
  const productUrl =
    product.publicId && product.slug
      ? `${tenantPrefix}/p/${product.publicId}/${product.slug}`
      : `${tenantPrefix}/products/${product.id}`;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addToCart({
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        image: product.image,
        price: product.price,
        discount: product.discount,
        discountType: product.discountType,
        tax: product.tax,
        taxType: product.taxType,
        variations: product.variations,
      },
      quantity: 1,
      variation: [],
      variationType: '',
    });
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    toggleWishlist(e);
  };

  const isOutOfStock = product.totalStock === 0;
  const cartButtonDisabled = isOutOfStock || !canAddToCart;

  const getCartButtonText = () => {
    if (isOutOfStock) return 'Indisponível';
    if (!isOpen) return 'Loja Fechada';
    return 'Adicionar';
  };

  return (
    <Link href={productUrl}>
      <Card className="group h-full hover:shadow-lg transition-shadow overflow-hidden">
        <CardContent className="p-0">
          {/* Image Container */}
          {/* AIDEV-NOTE: Uses custom --product-card-bg variable for branding, falls back to muted */}
          <div
            className="relative h-[120px] sm:h-[140px] overflow-hidden"
            style={{ backgroundColor: 'var(--product-card-bg, var(--muted))' }}
          >
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 16vw"
            />

            {/* Discount Badge */}
            {hasDiscount(product.discount) && (
              <Badge className="absolute top-2 left-2 bg-destructive">
                {formatDiscountBadge(product.discount, product.discountType, config)}
              </Badge>
            )}

            {/* Wishlist Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full h-8 w-8"
              onClick={handleToggleWishlist}
            >
              <Heart
                className={`h-4 w-4 ${isInWishlist ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`}
              />
            </Button>

            {/* Quick Add to Cart */}
            <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                className="w-full"
                size="sm"
                onClick={handleAddToCart}
                disabled={cartButtonDisabled}
                variant={!isOpen ? 'secondary' : 'default'}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                {getCartButtonText()}
              </Button>
            </div>
          </div>

          {/* Product Info */}
          <div className="p-3 space-y-2">
            {/* Name */}
            <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem]">{product.name}</h3>

            {/* Rating */}
            {averageRating > 0 && (
              <div className="flex items-center space-x-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs text-muted-foreground">
                  {averageRating.toFixed(1)} ({product.rating?.length || 0})
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-center space-x-2">
              <span className="font-bold text-primary">{formatPrice(discountedPrice, config)}</span>
              {hasDiscount(product.discount) && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(product.price, config)}
                </span>
              )}
            </div>

            {/* Stock Status */}
            {isOutOfStock && (
              <Badge variant="secondary" className="text-xs">
                Esgotado
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
