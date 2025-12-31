'use client';

/**
 * Categories Page - Lista todas as categorias do tenant
 */

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { fetchCategories } from '@/lib/store/slices/categories.slice';
import { fetchConfig } from '@/lib/store/slices/config.slice';
import { getCategoryCardImageUrl } from '@/lib/utils/image';

export default function CategoriesPage() {
  const params = useParams();
  const tenant = params.tenant as string;
  const dispatch = useAppDispatch();

  const { config, isLoading: configLoading, isInitialized: configInitialized } = useAppSelector(
    (state) => state.config
  );
  const { categories = [], isLoading: categoriesLoading } = useAppSelector((state) => state.categories) || {};
  const { currentTenant, isResolved } = useAppSelector((state) => state.tenant) || {};

  // Carregar config quando tenant estiver resolvido
  useEffect(() => {
    if (tenant && isResolved && currentTenant === tenant && !configInitialized && !configLoading) {
      dispatch(fetchConfig());
    }
  }, [dispatch, tenant, isResolved, currentTenant, configInitialized, configLoading]);

  // Carregar categorias após config estar disponível
  useEffect(() => {
    if (tenant && isResolved && currentTenant === tenant && configInitialized && config?.base_urls) {
      dispatch(fetchCategories());
    }
  }, [dispatch, tenant, isResolved, currentTenant, configInitialized, config?.base_urls]);

  // Loading state
  if (configLoading || !configInitialized || !config?.base_urls) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Separar categorias pai (parent_id = 0) e filhas - usar array vazio como fallback
  const categoriesList = categories || [];
  const parentCategories = categoriesList.filter((cat) => cat.parent_id === 0);

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
        <Link href={`/${tenant}`} className="hover:text-primary">
          Início
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">Categorias</span>
      </nav>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Categorias</h1>
        <p className="text-muted-foreground mt-2">
          Explore nossos produtos por categoria
        </p>
      </div>

      {/* Categories Grid */}
      {categoriesLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center space-y-3">
              <Skeleton className="w-32 h-32 rounded-xl" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      ) : parentCategories.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {parentCategories.map((category) => (
            <Link
              key={category.id}
              href={`/${tenant}/categories/${category.id}`}
              className="group flex flex-col items-center"
            >
              {/* Category Card */}
              <div className="relative w-full aspect-square max-w-[160px] rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 ring-2 ring-transparent group-hover:ring-primary/50 transition-all duration-300 shadow-md group-hover:shadow-xl group-hover:scale-105">
                {category.image ? (
                  <Image
                    src={getCategoryCardImageUrl(category, { tenant, storageConfig: config?.storage })}
                    alt={category.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                    <span className="text-4xl font-bold text-muted-foreground/50">
                      {category.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-2">
                  <span className="text-white text-[11px] font-medium text-center leading-tight break-words hyphens-auto">
                    {category.name}
                  </span>
                  <span className="text-white/70 text-[9px] mt-1">
                    Ver produtos →
                  </span>
                </div>

                {/* Subcategories Count Badge */}
                {category.childes && category.childes.length > 0 && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                    {category.childes.length} sub
                  </div>
                )}
              </div>

              {/* Category Name */}
              <h3
                className="mt-3 text-sm font-medium text-center group-hover:text-primary transition-colors line-clamp-2 max-w-[160px]"
                title={category.name}
              >
                {category.name}
              </h3>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <span className="text-4xl">📦</span>
          </div>
          <h3 className="text-lg font-medium">Nenhuma categoria encontrada</h3>
          <p className="text-muted-foreground mt-1">
            As categorias aparecerão aqui quando forem cadastradas.
          </p>
        </div>
      )}
    </div>
  );
}
