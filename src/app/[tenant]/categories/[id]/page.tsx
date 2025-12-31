'use client';

/**
 * Category Detail Page - Exibe produtos de uma categoria específica
 */

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, ChevronRight, Grid3X3, List, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import {
  fetchCategories,
  fetchSubCategories,
  fetchCategoryProducts,
  selectCategory,
} from '@/lib/store/slices/categories.slice';
import { fetchConfig } from '@/lib/store/slices/config.slice';
import { ProductCard } from '@/components/features/products/product-card';
import { getCategoryCardImageUrl } from '@/lib/utils/image';
import type { Category } from '@/types/product.types';

type SortOption = 'latest' | 'price_low' | 'price_high' | 'name_asc' | 'name_desc';

export default function CategoryDetailPage() {
  const params = useParams();
  const tenant = params.tenant as string;
  const categoryId = parseInt(params.id as string, 10);
  const dispatch = useAppDispatch();

  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { config, isLoading: configLoading, isInitialized: configInitialized } = useAppSelector(
    (state) => state.config
  );
  const {
    categories = [],
    selectedCategory,
    subCategories = [],
    categoryProducts = [],
    isLoading: categoriesLoading,
  } = useAppSelector((state) => state.categories) || {};
  const { currentTenant, isResolved } = useAppSelector((state) => state.tenant);

  // Carregar config quando tenant estiver resolvido
  useEffect(() => {
    if (tenant && isResolved && currentTenant === tenant && !configInitialized && !configLoading) {
      dispatch(fetchConfig());
    }
  }, [dispatch, tenant, isResolved, currentTenant, configInitialized, configLoading]);

  // Carregar categorias se ainda não carregadas
  useEffect(() => {
    if (tenant && isResolved && currentTenant === tenant && configInitialized && config?.base_urls) {
      if (categories.length === 0) {
        dispatch(fetchCategories());
      }
    }
  }, [dispatch, tenant, isResolved, currentTenant, configInitialized, config?.base_urls, categories.length]);

  // Selecionar categoria e carregar dados relacionados
  useEffect(() => {
    if (categories.length > 0 && categoryId) {
      // Encontrar a categoria pelo ID
      const category = findCategoryById(categories, categoryId);
      if (category) {
        dispatch(selectCategory(category));
        dispatch(fetchSubCategories(categoryId));
        dispatch(fetchCategoryProducts({ categoryId, limit: 50 }));
      }
    }
  }, [dispatch, categories, categoryId]);

  // Função auxiliar para encontrar categoria (incluindo subcategorias)
  const findCategoryById = (cats: Category[], id: number): Category | null => {
    for (const cat of cats) {
      if (cat.id === id) return cat;
      if (cat.childes) {
        const found = findCategoryById(cat.childes, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Encontrar categoria pai se for subcategoria
  const findParentCategory = (cats: Category[], childId: number): Category | null => {
    for (const cat of cats) {
      if (cat.childes?.some((c) => c.id === childId)) {
        return cat;
      }
      if (cat.childes) {
        const found = findParentCategory(cat.childes, childId);
        if (found) return found;
      }
    }
    return null;
  };

  // Ordenar produtos - usar array vazio como fallback seguro
  const products = categoryProducts || [];
  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case 'price_low':
        return a.price - b.price;
      case 'price_high':
        return b.price - a.price;
      case 'name_asc':
        return a.name.localeCompare(b.name);
      case 'name_desc':
        return b.name.localeCompare(a.name);
      default:
        return 0; // latest - manter ordem original
    }
  });

  // Loading state
  if (configLoading || !configInitialized || !config?.base_urls) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const parentCategory = selectedCategory?.parent_id
    ? findParentCategory(categories, selectedCategory.id)
    : null;

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6 flex-wrap">
        <Link href={`/${tenant}`} className="hover:text-primary">
          Início
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/${tenant}/categories`} className="hover:text-primary">
          Categorias
        </Link>
        {parentCategory && (
          <>
            <ChevronRight className="h-4 w-4" />
            <Link href={`/${tenant}/categories/${parentCategory.id}`} className="hover:text-primary">
              {parentCategory.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">
          {selectedCategory?.name || 'Carregando...'}
        </span>
      </nav>

      {/* Category Header */}
      <div className="mb-8">
        <div className="flex items-start gap-6">
          {/* Category Image */}
          {selectedCategory?.image && (
            <div className="hidden md:block relative w-24 h-24 rounded-xl overflow-hidden bg-muted flex-shrink-0">
              <Image
                src={getCategoryCardImageUrl(selectedCategory, { tenant, storageConfig: config?.storage })}
                alt={selectedCategory.name}
                fill
                className="object-cover"
              />
            </div>
          )}

          <div className="flex-1">
            <h1 className="text-3xl font-bold">{selectedCategory?.name || 'Categoria'}</h1>
            <p className="text-muted-foreground mt-1">
              {products.length} produto{products.length !== 1 ? 's' : ''} encontrado
              {products.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Subcategories */}
      {subCategories.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Subcategorias</h2>
          <div className="flex flex-wrap gap-3">
            {subCategories.map((sub) => (
              <Link
                key={sub.id}
                href={`/${tenant}/categories/${sub.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-muted hover:bg-primary/10 hover:text-primary rounded-full transition-colors"
              >
                {sub.image && (
                  <div className="relative w-6 h-6 rounded-full overflow-hidden">
                    <Image
                      src={getCategoryCardImageUrl(sub, { tenant, storageConfig: config?.storage })}
                      alt={sub.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <span className="text-sm font-medium">{sub.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Filters and Sort */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Ordenar por:</span>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Mais Recentes</SelectItem>
              <SelectItem value="price_low">Menor Preço</SelectItem>
              <SelectItem value="price_high">Maior Preço</SelectItem>
              <SelectItem value="name_asc">Nome (A-Z)</SelectItem>
              <SelectItem value="name_desc">Nome (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Products Grid */}
      {categoriesLoading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-[200px] rounded-lg" />
          ))}
        </div>
      ) : sortedProducts.length > 0 ? (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3'
              : 'flex flex-col gap-3'
          }
        >
          {sortedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <span className="text-4xl">🔍</span>
          </div>
          <h3 className="text-lg font-medium">Nenhum produto encontrado</h3>
          <p className="text-muted-foreground mt-1">
            Esta categoria ainda não possui produtos cadastrados.
          </p>
          <Button asChild className="mt-4">
            <Link href={`/${tenant}/categories`}>Ver outras categorias</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
