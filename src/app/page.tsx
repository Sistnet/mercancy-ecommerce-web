'use client';

/**
 * Home Page - Página inicial (raiz)
 * NOTA: Esta página é para acesso sem tenant (ex: em produção via subdomínio)
 */

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { fetchBanners, fetchFlashDeals } from '@/lib/store/slices/banners.slice';
import { fetchCategories } from '@/lib/store/slices/categories.slice';
import { fetchConfig } from '@/lib/store/slices/config.slice';
import {
  fetchProducts,
  fetchFeaturedProducts,
  fetchDailyNeedsProducts,
} from '@/lib/store/slices/products.slice';
import { ProductCard } from '@/components/features/products/product-card';
import { MainLayout } from '@/components/layouts/main-layout';
import { getImageUrl } from '@/lib/utils/image';

export default function HomePage() {
  const dispatch = useAppDispatch();

  const { config, isLoading: configLoading, isInitialized: configInitialized } = useAppSelector((state) => state.config);
  const { currentTenant } = useAppSelector((state) => state.tenant);
  const { banners, isLoading: bannersLoading } = useAppSelector((state) => state.banners);
  const { categories, isLoading: categoriesLoading } = useAppSelector((state) => state.categories);
  const {
    products,
    featuredProducts,
    dailyNeedsProducts,
    isLoading: productsLoading,
  } = useAppSelector((state) => state.products);

  // Primeiro: carregar config
  useEffect(() => {
    if (!configInitialized && !configLoading) {
      dispatch(fetchConfig());
    }
  }, [dispatch, configInitialized, configLoading]);

  // Segundo: carregar demais dados apenas após config estar disponível
  useEffect(() => {
    if (configInitialized && config?.base_urls) {
      dispatch(fetchBanners());
      dispatch(fetchFlashDeals({}));
      dispatch(fetchCategories());
      dispatch(fetchProducts({ limit: 12 }));
      dispatch(fetchFeaturedProducts({}));
      dispatch(fetchDailyNeedsProducts({}));
    }
  }, [dispatch, configInitialized, config?.base_urls]);

  // Aguardar config antes de renderizar qualquer coisa com imagem
  if (configLoading || !configInitialized || !config?.base_urls) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container space-y-12 pb-12">
        {/* Banner Section */}
        <section className="relative">
          {bannersLoading ? (
            <Skeleton className="w-full h-[300px] md:h-[400px]" />
          ) : banners.length > 0 ? (
            <div className="relative w-full h-[300px] md:h-[400px] bg-muted rounded-lg overflow-hidden">
              <Image
                src={getImageUrl(config.base_urls, 'banner', banners[0]?.image, { tenant: currentTenant || undefined })}
                alt={banners[0]?.title || 'Banner'}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
              <div className="absolute inset-0 flex items-center">
                <div className="container">
                  <div className="max-w-lg text-white space-y-4">
                    <h1 className="text-3xl md:text-5xl font-bold">{banners[0]?.title}</h1>
                    <Button size="lg" asChild>
                      <Link href="/products">Ver Produtos</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-[300px] md:h-[400px] bg-gradient-to-r from-primary to-primary/80 rounded-lg flex items-center justify-center">
              <div className="text-center text-primary-foreground space-y-4">
                <h1 className="text-3xl md:text-5xl font-bold">
                  Bem-vindo ao {config.ecommerce_name || 'Mercado'}
                </h1>
                <p className="text-lg opacity-90">Os melhores produtos você encontra aqui</p>
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/products">Explorar Produtos</Link>
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* Categories Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Categorias</h2>
            <Button variant="ghost" asChild>
              <Link href="/categories" className="flex items-center">
                Ver Todas <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>

          {categoriesLoading ? (
            <div className="flex flex-wrap justify-start gap-6 md:gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="w-20 h-20 md:w-24 md:h-24 rounded-full" />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap justify-start gap-6 md:gap-8">
              {categories.slice(0, 8).map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.id}`}
                  className="group relative flex flex-col items-center"
                >
                  {/* Circular Image Container */}
                  <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 ring-2 ring-transparent group-hover:ring-primary/50 group-hover:scale-105 transition-all duration-300 shadow-md group-hover:shadow-lg">
                    {category.image ? (
                      <Image
                        src={getImageUrl(config.base_urls, 'category', category.image, { tenant: currentTenant || undefined })}
                        alt={category.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                        <span className="text-2xl font-bold text-muted-foreground/50">
                          {category.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    {/* Hover Overlay with Name */}
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-white text-xs md:text-sm font-medium text-center px-2 line-clamp-2">
                        {category.name}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Produtos em Destaque</h2>
              <Button variant="ghost" asChild>
                <Link href="/products?filter=featured" className="flex items-center">
                  Ver Todos <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {featuredProducts.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* Daily Needs */}
        {dailyNeedsProducts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Necessidades Diárias</h2>
              <Button variant="ghost" asChild>
                <Link href="/products?filter=daily-needs" className="flex items-center">
                  Ver Todos <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {dailyNeedsProducts.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* All Products */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Todos os Produtos</h2>
            <Button variant="ghost" asChild>
              <Link href="/products" className="flex items-center">
                Ver Todos <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {products.slice(0, 12).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
}
