'use client';

/**
 * ProductCard - Card de produto reutilizável
 */

import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks';
import { addToCart } from '@/lib/store/slices/cart.slice';
import { addToWishlist, removeFromWishlist } from '@/lib/store/slices/wishlist.slice';
import type { Product } from '@/types/product.types';
import { toast } from 'sonner';
import { getImageUrl } from '@/lib/utils/image';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const dispatch = useAppDispatch();
  const { config } = useAppSelector((state) => state.config);
  const { currentTenant } = useAppSelector((state) => state.tenant);
  const { productIds: wishlistIds } = useAppSelector((state) => state.wishlist);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const isInWishlist = wishlistIds.includes(product.id);

  // Calcular preço com desconto
  const originalPrice = product.price;
  let discountedPrice = originalPrice;

  if (product.discount > 0) {
    if (product.discountType === 'percent') {
      discountedPrice = originalPrice - (originalPrice * product.discount) / 100;
    } else {
      discountedPrice = originalPrice - product.discount;
    }
  }

  // Calcular rating médio
  const averageRating =
    product.rating && product.rating.length > 0
      ? product.rating.reduce((sum, r) => sum + r.average, 0) / product.rating.length
      : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    dispatch(
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
      })
    );

    toast.success('Produto adicionado ao carrinho!');
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Faça login para adicionar aos favoritos');
      return;
    }

    if (isInWishlist) {
      dispatch(removeFromWishlist(product.id));
      toast.success('Removido dos favoritos');
    } else {
      dispatch(addToWishlist(product.id));
      toast.success('Adicionado aos favoritos');
    }
  };

  const imageUrl = getImageUrl(config?.base_urls, 'product', product.image?.[0], { tenant: currentTenant || undefined });

  const formatPrice = (price: number) => {
    const symbol = config?.currency_symbol || 'R$';
    const position = config?.currency_symbol_position || 'left';
    const formatted = price.toFixed(2).replace('.', ',');

    return position === 'left' ? `${symbol} ${formatted}` : `${formatted} ${symbol}`;
  };

  return (
    <Link href={`/products/${product.id}`}>
      <Card className="group h-full hover:shadow-lg transition-shadow overflow-hidden">
        <CardContent className="p-0">
          {/* Image Container */}
          <div className="relative aspect-square bg-muted overflow-hidden">
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
            />

            {/* Discount Badge */}
            {product.discount > 0 && (
              <Badge className="absolute top-2 left-2 bg-destructive">
                -{product.discountType === 'percent' ? `${product.discount}%` : formatPrice(product.discount)}
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
                disabled={product.totalStock === 0}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                {product.totalStock === 0 ? 'Indisponível' : 'Adicionar'}
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
              <span className="font-bold text-primary">{formatPrice(discountedPrice)}</span>
              {product.discount > 0 && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(originalPrice)}
                </span>
              )}
            </div>

            {/* Stock Status */}
            {product.totalStock === 0 && (
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
