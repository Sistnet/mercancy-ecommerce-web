'use client';

/**
 * Product Detail Page - Canonical URL (Amazon/Mercado Livre style)
 *
 * URL Pattern: /{tenant}/p/{publicId}/{slug}
 *
 * This page fetches product by publicId (ULID) instead of numeric id.
 * The slug is optional and used for SEO purposes.
 */

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Loader2,
  ChevronRight,
  Star,
  Heart,
  ShoppingCart,
  Minus,
  Plus,
  Share2,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { fetchProductDetails, clearSelectedProduct } from '@/lib/store/slices/products.slice';
import { fetchConfig } from '@/lib/store/slices/config.slice';
import { addToWishlist, removeFromWishlist } from '@/lib/store/slices/wishlist.slice';
import { useCartActions, useStoreStatus } from '@/lib/hooks';
import { getImageUrl, getProductImageUrl } from '@/lib/utils/image';
import { toast } from 'sonner';

export default function CanonicalProductPage() {
  const params = useParams();
  const router = useRouter();
  const tenant = params.tenant as string;
  const publicId = params.publicId as string;
  const slug = params.slug as string;
  const dispatch = useAppDispatch();

  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariation, setSelectedVariation] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description');

  // Zoom/Lupa state
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [lensPosition, setLensPosition] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const { config, isLoading: configLoading, isInitialized: configInitialized } = useAppSelector(
    (state) => state.config
  );
  const { selectedProduct: product, isLoading: productLoading } = useAppSelector(
    (state) => state.products
  );
  const { currentTenant, isResolved } = useAppSelector((state) => state.tenant);
  const { productIds: wishlistIds } = useAppSelector((state) => state.wishlist);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // AIDEV-NOTE: Use cart actions hook to block adding when store is closed
  const { addToCart, canAddToCart } = useCartActions();
  const { isOpen } = useStoreStatus();

  const isInWishlist = product ? wishlistIds.includes(product.id) : false;

  // Zoom lens size
  const LENS_SIZE = 100;
  const ZOOM_PANEL_SIZE = 350;

  useEffect(() => {
    if (tenant && isResolved && currentTenant === tenant && !configInitialized && !configLoading) {
      dispatch(fetchConfig());
    }
  }, [dispatch, tenant, isResolved, currentTenant, configInitialized, configLoading]);

  useEffect(() => {
    if (tenant && isResolved && currentTenant === tenant && configInitialized && publicId) {
      // AIDEV-NOTE: Fetch by publicId - backend now supports ULID lookup
      dispatch(fetchProductDetails(publicId));
    }
    return () => {
      dispatch(clearSelectedProduct());
    };
  }, [dispatch, tenant, isResolved, currentTenant, configInitialized, publicId]);

  // Redirect to canonical URL if slug doesn't match
  useEffect(() => {
    if (product && product.slug && slug !== product.slug) {
      router.replace(`/${tenant}/p/${publicId}/${product.slug}`, { scroll: false });
    }
  }, [product, slug, tenant, publicId, router]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;

    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const lensX = Math.max(LENS_SIZE / 2, Math.min(x, rect.width - LENS_SIZE / 2));
    const lensY = Math.max(LENS_SIZE / 2, Math.min(y, rect.height - LENS_SIZE / 2));

    const lensLeft = lensX - LENS_SIZE / 2;
    const lensTop = lensY - LENS_SIZE / 2;

    setLensPosition({ x: lensLeft, y: lensTop });

    const zoomRatio = ZOOM_PANEL_SIZE / LENS_SIZE;
    const bgX = lensLeft * zoomRatio;
    const bgY = lensTop * zoomRatio;

    setZoomPosition({ x: bgX, y: bgY });
  };

  const handleMouseEnter = () => setIsZooming(true);
  const handleMouseLeave = () => setIsZooming(false);

  const calculatePrice = () => {
    if (!product) return { original: 0, discounted: 0, hasDiscount: false };
    let basePrice = product.price;
    if (selectedVariation && product.variations) {
      const variation = product.variations.find((v) => v.type === selectedVariation);
      if (variation) basePrice = variation.price;
    }
    let discountedPrice = basePrice;
    if (product.discount > 0) {
      discountedPrice = product.discountType === 'percent'
        ? basePrice - (basePrice * product.discount) / 100
        : basePrice - product.discount;
    }
    return { original: basePrice, discounted: discountedPrice, hasDiscount: product.discount > 0 };
  };

  const prices = calculatePrice();
  const averageRating = product?.rating?.length
    ? product.rating.reduce((sum, r) => sum + r.average, 0) / product.rating.length
    : 0;

  const formatPrice = (price: number) => {
    const symbol = config?.currency_symbol || 'R$';
    const formatted = price.toFixed(2).replace('.', ',');
    return `${symbol} ${formatted}`;
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    const maxQuantity = product?.maximumOrderQuantity || 10;
    if (newQuantity >= 1 && newQuantity <= maxQuantity) setQuantity(newQuantity);
  };

  const handleAddToCart = () => {
    if (!product) return;
    // AIDEV-NOTE: useCartActions hook handles store closed validation and toast
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
      quantity,
      variation: selectedVariation ? [selectedVariation] : [],
      variationType: selectedVariation || '',
    });
  };

  const handleToggleWishlist = () => {
    if (!product) return;
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

  const handleShare = async () => {
    if (!product) return;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, text: product.description, url });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado!');
    }
  };

  if (configLoading || !configInitialized || !config?.base_urls) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (productLoading || !product) {
    return (
      <div className="container max-w-5xl py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <Skeleton className="w-full md:w-80 h-80 rounded-2xl flex-shrink-0" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const images = product.image || [];
  const currentImage = images[selectedImageIndex] || images[0];

  // AIDEV-NOTE: Detect image format to use correct URL builder
  // - New format (0.jpg, 1.jpg): use publicId-based path (img/p/{publicId}/{filename})
  // - Legacy format (2025-xx-xx-xxx.jpg): use tenant-based path (img/tenants/{tenant}/product/{filename})
  const isNewFormat = currentImage && /^\d+\.\w+$/.test(currentImage);
  const imageUrl = isNewFormat && product.publicId
    ? getProductImageUrl(product.publicId, currentImage, { storageConfig: config?.storage })
    : getImageUrl(config.base_urls, 'product', currentImage, { tenant, storageConfig: config?.storage });

  // Build canonical URL for meta tags
  const canonicalUrl = `/${tenant}/p/${product.publicId || publicId}/${product.slug}`;

  return (
    <div className="container max-w-5xl py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href={`/${tenant}`} className="hover:text-primary transition-colors">Início</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/${tenant}/products`} className="hover:text-primary transition-colors">Produtos</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
        {/* Image Section */}
        <div className="w-full md:w-[320px] lg:w-[380px] flex-shrink-0">
          {/* Main Image with Zoom */}
          <div className="relative">
            <div
              ref={imageContainerRef}
              className="relative aspect-square bg-muted/30 rounded-2xl overflow-hidden border cursor-zoom-in"
              onMouseMove={handleMouseMove}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <Image
                src={imageUrl}
                alt={product.name}
                fill
                className="object-contain p-4"
                priority
              />

              {/* Lens/Lupa */}
              {isZooming && (
                <div
                  className="absolute border-2 border-primary/70 bg-white/20 pointer-events-none z-10"
                  style={{
                    width: LENS_SIZE,
                    height: LENS_SIZE,
                    left: lensPosition.x,
                    top: lensPosition.y,
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.3)',
                  }}
                />
              )}

              {product.discount > 0 && (
                <Badge className="absolute top-3 left-3 bg-red-500 hover:bg-red-500 text-white font-semibold z-20">
                  -{product.discountType === 'percent' ? `${product.discount}%` : formatPrice(product.discount)}
                </Badge>
              )}
            </div>

            {/* Zoom Preview Panel */}
            {isZooming && imageContainerRef.current && (
              <div
                className="hidden md:block absolute left-full top-0 ml-4 border-2 border-gray-200 rounded-xl overflow-hidden bg-white shadow-xl z-30"
                style={{
                  width: ZOOM_PANEL_SIZE,
                  height: ZOOM_PANEL_SIZE,
                }}
              >
                <div
                  className="w-full h-full"
                  style={{
                    backgroundImage: `url(${imageUrl})`,
                    backgroundSize: `${imageContainerRef.current.offsetWidth * (ZOOM_PANEL_SIZE / LENS_SIZE)}px ${imageContainerRef.current.offsetHeight * (ZOOM_PANEL_SIZE / LENS_SIZE)}px`,
                    backgroundPosition: `-${zoomPosition.x}px -${zoomPosition.y}px`,
                    backgroundRepeat: 'no-repeat',
                  }}
                />
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {images.map((img, index) => {
                const thumbIsNewFormat = img && /^\d+\.\w+$/.test(img);
                const thumbUrl = thumbIsNewFormat && product.publicId
                  ? getProductImageUrl(product.publicId, img, { storageConfig: config?.storage })
                  : getImageUrl(config.base_urls, 'product', img, { tenant, storageConfig: config?.storage });
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                      index === selectedImageIndex
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-transparent hover:border-muted-foreground/30'
                    }`}
                  >
                    <Image
                      src={thumbUrl}
                      alt={`${product.name} ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="space-y-3">
            <h1 className="text-2xl font-semibold text-foreground leading-tight">{product.name}</h1>

            {/* Rating */}
            {averageRating > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.round(averageRating) ? 'fill-amber-400 text-amber-400' : 'text-muted'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  ({product.activeReviews?.length || 0})
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 pt-2">
              <span className="text-3xl font-bold text-primary">
                {formatPrice(prices.discounted)}
              </span>
              {prices.hasDiscount && (
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(prices.original)}
                </span>
              )}
            </div>

            {/* Stock */}
            {product.totalStock === 0 ? (
              <Badge variant="secondary" className="mt-2">Esgotado</Badge>
            ) : product.totalStock <= 5 ? (
              <p className="text-sm text-orange-600 font-medium">
                Apenas {product.totalStock} em estoque
              </p>
            ) : (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <Check className="h-4 w-4" /> Em estoque
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-border my-5" />

          {/* Variations */}
          {product.variations && product.variations.length > 0 && (
            <div className="mb-5">
              <label className="text-sm font-medium text-foreground mb-2 block">Variação</label>
              <div className="flex flex-wrap gap-2">
                {product.variations.map((variation) => (
                  <button
                    key={variation.type}
                    onClick={() => setSelectedVariation(variation.type)}
                    disabled={variation.stock === 0}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedVariation === variation.type
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80 text-foreground'
                    } ${variation.stock === 0 ? 'opacity-50 cursor-not-allowed line-through' : ''}`}
                  >
                    {variation.type}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity & Actions */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-foreground">Quantidade</label>
              <div className="flex items-center bg-muted rounded-full">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  className="w-10 h-10 flex items-center justify-center hover:bg-muted-foreground/10 rounded-l-full transition-colors disabled:opacity-50"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center font-semibold">{quantity}</span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= (product.maximumOrderQuantity || 10)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-muted-foreground/10 rounded-r-full transition-colors disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {product.unit && (
                <span className="text-sm text-muted-foreground">
                  {product.capacity} {product.unit}
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                size="lg"
                className="flex-1 h-12 rounded-full font-semibold"
                onClick={handleAddToCart}
                disabled={product.totalStock === 0 || !canAddToCart}
                variant={!isOpen ? 'secondary' : 'default'}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {!isOpen ? 'Loja Fechada' : 'Adicionar ao Carrinho'}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={handleToggleWishlist}
              >
                <Heart className={`h-5 w-5 ${isInWishlist ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={handleShare}
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="mt-12">
        {/* Tab Headers */}
        <div className="flex gap-1 border-b">
          <button
            onClick={() => setActiveTab('description')}
            className={`px-6 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'description'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Descrição
            {activeTab === 'description' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-6 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'reviews'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Avaliações ({product.activeReviews?.length || 0})
            {activeTab === 'reviews' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="py-6">
          {activeTab === 'description' ? (
            <div className="prose prose-sm max-w-none text-muted-foreground">
              {product.description ? (
                <p className="whitespace-pre-line leading-relaxed">{product.description}</p>
              ) : (
                <p className="italic">Nenhuma descrição disponível.</p>
              )}
              {(product.weight > 0 || product.unit) && (
                <div className="mt-6 not-prose grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {product.weight > 0 && (
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground">Peso</p>
                      <p className="font-semibold text-foreground">{product.weight}g</p>
                    </div>
                  )}
                  {product.unit && (
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground">Unidade</p>
                      <p className="font-semibold text-foreground">{product.capacity} {product.unit}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              {product.activeReviews && product.activeReviews.length > 0 ? (
                <div className="space-y-4">
                  {product.activeReviews.map((review) => (
                    <div key={review.id} className="bg-muted/30 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-primary">
                            {review.customer?.fName?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-sm truncate">
                              {review.customer ? `${review.customer.fName} ${review.customer.lName}` : 'Usuário'}
                            </p>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <div className="flex items-center gap-0.5 mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                          {review.attachment && review.attachment.length > 0 && (
                            <div className="flex gap-2 mt-3">
                              {review.attachment.map((img, index) => (
                                <div key={index} className="relative w-12 h-12 rounded-lg overflow-hidden">
                                  <Image
                                    src={getImageUrl(config.base_urls, 'review', img, { tenant })}
                                    alt={`Review ${index + 1}`}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Star className="h-10 w-10 mx-auto text-muted" />
                  <p className="mt-3 font-medium text-foreground">Nenhuma avaliação ainda</p>
                  <p className="text-sm text-muted-foreground">Seja o primeiro a avaliar!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
