/**
 * Signed URL Service - Gerencia URLs assinadas do GCS
 *
 * Este serviço obtém URLs assinadas temporárias da API Laravel para acessar
 * imagens privadas no Google Cloud Storage de forma segura.
 *
 * Benefícios:
 * - Acesso direto ao GCS (sem passar pelo Laravel para cada imagem)
 * - Cache local para evitar requisições repetidas
 * - Renovação automática antes da expiração
 * - Fallback para proxy em caso de erro
 *
 * AIDEV-NOTE: Integração com AssetSignedUrlController do Laravel
 * AIDEV-NOTE: R2 uses public URLs directly, no signed URLs needed
 */

import { apiClient } from '@/lib/api/client';
import type { ImageType } from '@/lib/utils/image';
import { getStorageConfig, usesPublicUrls } from '@/lib/utils/image';

// Configurações
const CACHE_BUFFER_SECONDS = 60; // Renovar 60s antes de expirar
const MAX_CACHE_SIZE = 500; // Máximo de URLs em cache
const DEFAULT_EXPIRATION_MINUTES = 10;

// Tipos
interface SignedUrlResponse {
  success: boolean;
  data?: {
    url: string;
    expires_at: string;
    expires_in_seconds: number;
  };
  error?: string;
  message?: string;
}

interface CachedUrl {
  url: string;
  expiresAt: Date;
}

// Cache em memória
const urlCache = new Map<string, CachedUrl>();

/**
 * Gera a chave do cache baseada no tenant e caminho
 */
function getCacheKey(tenant: string, type: ImageType, filename: string): string {
  return `${tenant}:${type}:${filename}`;
}

/**
 * Constrói o key do arquivo para a API
 * Formato: tenants/{tenant}/{type}/{filename}
 */
function buildAssetKey(tenant: string, type: ImageType, filename: string): string {
  const cleanFilename = filename.startsWith('/') ? filename.slice(1) : filename;
  return `tenants/${tenant}/${type}/${cleanFilename}`;
}

/**
 * Verifica se uma URL em cache ainda é válida
 */
function isCacheValid(cached: CachedUrl): boolean {
  const now = new Date();
  const bufferDate = new Date(cached.expiresAt.getTime() - CACHE_BUFFER_SECONDS * 1000);
  return now < bufferDate;
}

/**
 * Limpa entradas expiradas do cache
 */
function cleanExpiredCache(): void {
  const now = new Date();
  for (const [key, cached] of urlCache.entries()) {
    if (now >= cached.expiresAt) {
      urlCache.delete(key);
    }
  }

  // Se ainda estiver muito grande, remove as mais antigas
  if (urlCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(urlCache.entries());
    entries.sort((a, b) => a[1].expiresAt.getTime() - b[1].expiresAt.getTime());
    const toRemove = entries.slice(0, entries.length - MAX_CACHE_SIZE);
    for (const [key] of toRemove) {
      urlCache.delete(key);
    }
  }
}

/**
 * Obtém uma URL assinada da API Laravel
 */
async function fetchSignedUrl(
  key: string,
  expirationMinutes: number = DEFAULT_EXPIRATION_MINUTES
): Promise<string | null> {
  try {
    const response = await apiClient.get<SignedUrlResponse>('/api/v1/assets/signed-url', {
      params: { key, expiration: expirationMinutes },
    });

    if (response.data.success && response.data.data?.url) {
      return response.data.data.url;
    }

    console.warn('[SignedURL] API returned error:', response.data.message);
    return null;
  } catch (error) {
    console.warn('[SignedURL] Failed to fetch signed URL:', error);
    return null;
  }
}

/**
 * Obtém uma URL assinada para uma imagem (com cache)
 *
 * @param tenant - Slug do tenant
 * @param type - Tipo de imagem (product, category, etc.)
 * @param filename - Nome do arquivo
 * @returns URL assinada ou null se falhar ou se usando R2 (public URLs)
 */
export async function getSignedImageUrl(
  tenant: string,
  type: ImageType,
  filename: string
): Promise<string | null> {
  // AIDEV-NOTE: R2 uses public URLs, no signed URLs needed
  if (usesPublicUrls()) {
    return null;
  }

  // Limpa cache expirado periodicamente
  if (Math.random() < 0.1) {
    cleanExpiredCache();
  }

  const cacheKey = getCacheKey(tenant, type, filename);

  // Verifica cache
  const cached = urlCache.get(cacheKey);
  if (cached && isCacheValid(cached)) {
    return cached.url;
  }

  // Busca nova URL
  const assetKey = buildAssetKey(tenant, type, filename);
  const signedUrl = await fetchSignedUrl(assetKey);

  if (signedUrl) {
    // Armazena no cache
    const expiresAt = new Date(Date.now() + DEFAULT_EXPIRATION_MINUTES * 60 * 1000);
    urlCache.set(cacheKey, { url: signedUrl, expiresAt });
    return signedUrl;
  }

  return null;
}

/**
 * Pré-carrega URLs assinadas para uma lista de imagens
 * Útil para carregar todas as imagens de uma página de uma vez
 */
export async function prefetchSignedUrls(
  tenant: string,
  images: Array<{ type: ImageType; filename: string }>
): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  // Filtra imagens que já estão em cache
  const toFetch = images.filter(({ type, filename }) => {
    const cacheKey = getCacheKey(tenant, type, filename);
    const cached = urlCache.get(cacheKey);
    if (cached && isCacheValid(cached)) {
      results.set(`${type}:${filename}`, cached.url);
      return false;
    }
    return true;
  });

  // Busca URLs em paralelo (com limite de concorrência)
  const BATCH_SIZE = 10;
  for (let i = 0; i < toFetch.length; i += BATCH_SIZE) {
    const batch = toFetch.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async ({ type, filename }) => {
      const url = await getSignedImageUrl(tenant, type, filename);
      if (url) {
        results.set(`${type}:${filename}`, url);
      }
    });
    await Promise.all(promises);
  }

  return results;
}

/**
 * Limpa o cache de URLs assinadas
 */
export function clearSignedUrlCache(): void {
  urlCache.clear();
}

/**
 * Verifica se signed URLs podem ser usadas
 * Requer: autenticação + storage GCS (R2 usa URLs públicas)
 */
export function canUseSignedUrls(): boolean {
  // R2 uses public URLs, no signed URLs needed
  if (usesPublicUrls()) return false;

  if (typeof window === 'undefined') return false;
  try {
    const token = localStorage.getItem('token');
    return !!token;
  } catch {
    return false;
  }
}

/**
 * Informações de debug do cache
 */
export function getSignedUrlCacheStats(): { size: number; keys: string[] } {
  return {
    size: urlCache.size,
    keys: Array.from(urlCache.keys()),
  };
}
