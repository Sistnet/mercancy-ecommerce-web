/**
 * Hook useSignedImageUrl - Obtém URLs de imagem com suporte a múltiplos drivers
 *
 * Este hook facilita o uso de imagens em componentes React,
 * gerenciando estado de loading, cache e fallback automático.
 *
 * Suporta:
 * - R2: Retorna URLs públicas diretamente (sem signed URLs)
 * - GCS: Usa signed URLs quando autenticado, proxy como fallback
 * - Local: Usa proxy Laravel
 *
 * @example
 * // Uso básico
 * const { imageUrl, isLoading } = useSignedImageUrl('product', product.image);
 *
 * @example
 * // Com fallback customizado
 * const { imageUrl } = useSignedImageUrl('product', product.image, {
 *   fallbackUrl: '/default-product.png',
 * });
 *
 * AIDEV-NOTE: Integração com signed-url.service.ts e image.ts storage config
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getImageUrl, getImageUrlWithSignedFallback, usesPublicUrls, type ImageType } from '@/lib/utils/image';
import type { BaseUrls } from '@/types/config.types';

interface UseSignedImageUrlOptions {
  /**
   * Se deve usar signed URLs (requer autenticação)
   * @default true
   */
  useSignedUrl?: boolean;

  /**
   * URL de fallback se a imagem não existir
   * @default '/placeholder.svg'
   */
  fallbackUrl?: string;

  /**
   * BaseUrls do config (para compatibilidade)
   */
  baseUrls?: BaseUrls | null;

  /**
   * Tenant específico (usa localStorage se não informado)
   */
  tenant?: string;

  /**
   * Se deve carregar imediatamente ou aguardar trigger
   * @default true
   */
  immediate?: boolean;
}

interface UseSignedImageUrlResult {
  /**
   * URL da imagem (signed ou proxy)
   */
  imageUrl: string;

  /**
   * Se está carregando a signed URL
   */
  isLoading: boolean;

  /**
   * Erro se houver falha
   */
  error: Error | null;

  /**
   * Se está usando signed URL ou proxy
   */
  isSignedUrl: boolean;

  /**
   * Força refresh da URL
   */
  refresh: () => void;
}

const PLACEHOLDER = '/placeholder.svg';

/**
 * Hook para obter URLs de imagem com suporte a Signed URLs
 */
export function useSignedImageUrl(
  type: ImageType,
  filename: string | undefined | null,
  options: UseSignedImageUrlOptions = {}
): UseSignedImageUrlResult {
  const {
    useSignedUrl = true,
    fallbackUrl = PLACEHOLDER,
    baseUrls = null,
    tenant,
    immediate = true,
  } = options;

  // URL inicial é o proxy (síncrono, sempre funciona)
  // AIDEV-NOTE: Passa tenant explicitamente para evitar dependência de localStorage
  const initialUrl = filename
    ? getImageUrl(baseUrls, type, filename, { tenant })
    : fallbackUrl;

  const [imageUrl, setImageUrl] = useState<string>(initialUrl);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [isSignedUrl, setIsSignedUrl] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const loadSignedUrl = useCallback(async () => {
    if (!filename) {
      setImageUrl(fallbackUrl);
      setIsSignedUrl(false);
      return;
    }

    // AIDEV-NOTE: R2 uses public URLs directly, no async loading needed
    if (usesPublicUrls() || !useSignedUrl) {
      setImageUrl(getImageUrl(baseUrls, type, filename, { tenant }));
      setIsSignedUrl(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const url = await getImageUrlWithSignedFallback(type, filename, {
        preferSignedUrl: useSignedUrl,
        tenant,
      });

      setImageUrl(url);
      // Verifica se é uma signed URL (contém parâmetros de assinatura do GCS)
      setIsSignedUrl(url.includes('X-Goog-') || url.includes('storage.googleapis.com'));
    } catch (err) {
      console.error('[useSignedImageUrl] Error:', err);
      setError(err instanceof Error ? err : new Error('Failed to load signed URL'));
      // Fallback para proxy
      setImageUrl(getImageUrl(baseUrls, type, filename, { tenant }));
      setIsSignedUrl(false);
    } finally {
      setIsLoading(false);
    }
  }, [filename, type, useSignedUrl, baseUrls, tenant, fallbackUrl]);

  // Carrega signed URL quando monta ou quando dependências mudam
  useEffect(() => {
    if (immediate) {
      loadSignedUrl();
    }
  }, [loadSignedUrl, immediate, refreshKey]);

  // Função para forçar refresh
  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return {
    imageUrl,
    isLoading,
    error,
    isSignedUrl,
    refresh,
  };
}

/**
 * Hook para pré-carregar múltiplas imagens com Signed URLs
 */
export function useSignedImageUrls(
  images: Array<{ type: ImageType; filename: string | undefined | null }>,
  options: Omit<UseSignedImageUrlOptions, 'immediate'> = {}
): {
  urls: Map<string, string>;
  isLoading: boolean;
  loadAll: () => Promise<void>;
} {
  const [urls, setUrls] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { useSignedUrl = true, baseUrls = null, tenant } = options;

  const loadAll = useCallback(async () => {
    setIsLoading(true);

    const newUrls = new Map<string, string>();

    const promises = images
      .filter((img) => img.filename)
      .map(async ({ type, filename }) => {
        if (!filename) return;

        try {
          const url = await getImageUrlWithSignedFallback(type, filename, {
            preferSignedUrl: useSignedUrl,
            tenant,
          });
          newUrls.set(`${type}:${filename}`, url);
        } catch {
          // Fallback para proxy
          newUrls.set(`${type}:${filename}`, getImageUrl(baseUrls, type, filename, { tenant }));
        }
      });

    await Promise.all(promises);
    setUrls(newUrls);
    setIsLoading(false);
  }, [images, useSignedUrl, baseUrls, tenant]);

  return { urls, isLoading, loadAll };
}

export default useSignedImageUrl;
