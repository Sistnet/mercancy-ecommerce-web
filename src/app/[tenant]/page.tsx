'use client';

/**
 * Tenant Home Page - Página inicial com tenant dinâmico
 * Acesso: http://localhost:3000/lojinhateste
 */

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

export default function TenantHomePage() {
  const params = useParams();
  const tenant = params.tenant as string;
  const dispatch = useAppDispatch();

  const { config, isLoading: configLoading, isInitialized: configInitialized } = useAppSelector((state) => state.config);
  const { banners, isLoading: bannersLoading } = useAppSelector((state) => state.banners);
  const { categories, isLoading: categoriesLoading } = useAppSelector((state) => state.categories);
  const {
    products,
    featuredProducts,
    dailyNeedsProducts,
    isLoading: productsLoading,
  } = useAppSelector((state) => state.products);
  const { currentTenant, isResolved } = useAppSelector((state) => state.tenant);

  // Primeiro: carregar config quando tenant estiver resolvido
  useEffect(() => {
    if (tenant && isResolved && currentTenant === tenant && !configInitialized && !configLoading) {
      dispatch(fetchConfig());
    }
  }, [dispatch, tenant, isResolved, currentTenant, configInitialized, configLoading]);

  // Segundo: carregar demais dados apenas após config estar disponível
  useEffect(() => {
    if (tenant && isResolved && currentTenant === tenant && configInitialized && config?.base_urls) {
      dispatch(fetchBanners());
      dispatch(fetchFlashDeals({}));
      dispatch(fetchCategories());
      dispatch(fetchProducts({ limit: 12 }));
      dispatch(fetchFeaturedProducts({}));
      dispatch(fetchDailyNeedsProducts({}));
    }
  }, [dispatch, tenant, isResolved, currentTenant, configInitialized, config?.base_urls]);

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
      <div className="space-y-12 pb-12">
        {/* Banner Section */}
        <section className="relative">
          {bannersLoading ? (
            <Skeleton className="w-full h-[300px] md:h-[400px]" />
          ) : banners.length > 0 ? (
            <div className="relative w-full h-[300px] md:h-[400px] bg-muted rounded-lg overflow-hidden">
              <Image
                src={getImageUrl(config.base_urls, 'banner', banners[0]?.image, { tenant })}
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
                      <Link href={`/${tenant}/products`}>Ver Produtos</Link>
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
                <p className="text-sm opacity-75">Tenant: {tenant}</p>
                <Button size="lg" variant="secondary" asChild>
                  <Link href={`/${tenant}/products`}>Explorar Produtos</Link>
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* Categories Section */}
        <section className="container">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Categorias</h2>
            <Button variant="ghost" asChild>
              <Link href={`/${tenant}/categories`} className="flex items-center">
                Ver Todas <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>

          {categoriesLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categories.slice(0, 6).map((category) => (
                <Link key={category.id} href={`/${tenant}/categories/${category.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
                      {category.image ? (
                        <div className="relative w-16 h-16">
                          <Image
                            src={getImageUrl(config.base_urls, 'category', category.image, { tenant })}
                            alt={category.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded-full" />
                      )}
                      <span className="font-medium text-sm line-clamp-2">{category.name}</span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <section className="container">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Produtos em Destaque</h2>
              <Button variant="ghost" asChild>
                <Link href={`/${tenant}/products?filter=featured`} className="flex items-center">
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
          <section className="container">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Necessidades Diárias</h2>
              <Button variant="ghost" asChild>
                <Link href={`/${tenant}/products?filter=daily-needs`} className="flex items-center">
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
        <section className="container">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Todos os Produtos</h2>
            <Button variant="ghost" asChild>
              <Link href={`/${tenant}/products`} className="flex items-center">
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
