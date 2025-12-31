/**
 * Image URL Helper - Constrói URLs de imagem para o tenant
 *
 * Suporta três modos de operação baseado na config.storage:
 * 1. CDN Mode: Usa CDN customizado quando NEXT_PUBLIC_CDN_URL está configurado
 * 2. R2 Mode: Usa URLs públicas do CloudFlare R2 diretamente
 * 3. GCS Mode: Usa proxy Laravel ou signed URLs para Google Cloud Storage
 * 4. Local Mode: Usa proxy Laravel para storage local
 *
 * AIDEV-NOTE: Integração com API config.storage para determinar driver ativo
 * AIDEV-NOTE: CDN_URL tem prioridade sobre storage.public_url da API
 */

import type { BaseUrls, StorageConfig } from '@/types/config.types';

export type ImageType =
  | 'product'
  | 'customer'
  | 'banner'
  | 'category'
  | 'review'
  | 'notification'
  | 'ecommerce'
  | 'delivery_man'
  | 'chat'
  | 'category_banner'
  | 'flash_sale'
  | 'gateway'
  | 'order';

const PLACEHOLDER_IMAGE = '/placeholder.svg';

// URL base da API Laravel (proxy para storage)
// AIDEV-NOTE: Inclui porta 80 explícita para compatibilidade com Next.js remotePatterns
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:80';

// CDN URL for serving images (takes priority over API storage.public_url)
// AIDEV-NOTE: When set, all cloud storage images are served through this CDN
const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '';

// AIDEV-NOTE: Entity image path prefixes (Amazon/ML style)
// URL pattern: {base_url}/img/{prefix}/{publicId}/{index}.{ext}
type EntityPrefix = 'p' | 'c';
const ENTITY_PREFIXES: Record<ImageType, EntityPrefix | null> = {
  product: 'p',
  category: 'c',
  customer: null,
  banner: null,
  review: null,
  notification: null,
  ecommerce: null,
  delivery_man: null,
  chat: null,
  category_banner: null,
  flash_sale: null,
  gateway: null,
  order: null,
};

// Cache da configuração de storage
let cachedStorageConfig: StorageConfig | null = null;

/**
 * Define a configuração de storage (chamado pelo config slice quando carrega)
 */
export function setStorageConfig(config: StorageConfig | undefined): void {
  cachedStorageConfig = config ?? null;
}

/**
 * Obtém a configuração de storage em cache
 */
export function getStorageConfig(): StorageConfig | null {
  return cachedStorageConfig;
}

/**
 * Obtém o tenant atual do localStorage
 */
function getCurrentTenant(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('current_tenant');
  } catch {
    return null;
  }
}

/**
 * Verifica se uma URL já é uma URL completa (http/https)
 */
function isFullUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}

/**
 * Verifica se CDN está configurado
 */
export function hasCdnConfigured(): boolean {
  return CDN_URL.length > 0;
}

/**
 * Obtém a URL base do CDN
 */
export function getCdnUrl(): string {
  return CDN_URL;
}

/**
 * Constrói URL usando CDN customizado
 * AIDEV-NOTE: CDN_URL tem prioridade sobre storage.public_url da API
 * AIDEV-NOTE: Uses storage_folder from config (db_schema) for correct image path
 */
function buildCdnUrl(
  storage: StorageConfig | null,
  tenant: string,
  type: ImageType,
  filename: string
): string {
  const cleanFilename = filename.startsWith('/') ? filename.slice(1) : filename;
  const pathPrefix = storage?.path_prefix || 'img';
  const baseUrl = CDN_URL.endsWith('/') ? CDN_URL.slice(0, -1) : CDN_URL;
  // AIDEV-NOTE: Use storage_folder (db_schema) if available, otherwise fallback to tenant
  const storageFolder = storage?.storage_folder || tenant;

  // CDN URL format: {CDN_URL}/{path_prefix}/tenants/{storageFolder}/{type}/{filename}
  return `${baseUrl}/${pathPrefix}/tenants/${storageFolder}/${type}/${cleanFilename}`;
}

/**
 * Constrói URL para R2 (CloudFlare R2 public bucket)
 * AIDEV-NOTE: Uses storage_folder from config (db_schema) for correct image path
 */
function buildR2Url(
  storage: StorageConfig,
  tenant: string,
  type: ImageType,
  filename: string
): string {
  // Se CDN está configurado, usa CDN ao invés do R2 public_url
  if (CDN_URL) {
    return buildCdnUrl(storage, tenant, type, filename);
  }

  if (!storage.public_url) {
    console.warn('[Image] R2 public_url not configured, falling back to proxy');
    return buildProxyUrl(storage, tenant, type, filename);
  }

  const cleanFilename = filename.startsWith('/') ? filename.slice(1) : filename;
  const pathPrefix = storage.path_prefix || 'img';
  // AIDEV-NOTE: Use storage_folder (db_schema) if available, otherwise fallback to tenant
  const storageFolder = storage.storage_folder || tenant;

  // R2 URL format: {public_url}/{path_prefix}/tenants/{storageFolder}/{type}/{filename}
  return `${storage.public_url}/${pathPrefix}/tenants/${storageFolder}/${type}/${cleanFilename}`;
}

/**
 * Constrói URL para proxy Laravel (GCS ou local)
 * AIDEV-NOTE: Uses storage_folder from config (db_schema) for correct image path
 */
function buildProxyUrl(storage: StorageConfig | null, tenant: string, type: ImageType, filename: string): string {
  const cleanFilename = filename.startsWith('/') ? filename.slice(1) : filename;
  // AIDEV-NOTE: Use storage_folder (db_schema) if available, otherwise fallback to tenant
  const storageFolder = storage?.storage_folder || tenant;
  // Proxy URL format: {API_URL}/{tenant}/storage/gcs/img/tenants/{storageFolder}/{type}/{filename}
  return `${API_BASE_URL}/${tenant}/storage/gcs/img/tenants/${storageFolder}/${type}/${cleanFilename}`;
}

/**
 * Opções para construção de URL de imagem
 */
export interface ImageUrlOptions {
  /** Configuração de storage (opcional, usa cache se não fornecido) */
  storageConfig?: StorageConfig | null;
  /** Tenant específico (opcional, usa localStorage se não fornecido) */
  tenant?: string;
}

/**
 * Constrói URL completa da imagem baseada na configuração de storage
 *
 * @param baseUrls - Objeto base_urls do config (mantido para compatibilidade)
 * @param type - Tipo de imagem (product, category, banner, etc.)
 * @param filename - Nome do arquivo da imagem
 * @param options - Opções adicionais (storageConfig, tenant)
 * @returns URL completa ou placeholder
 *
 * @example
 * // CDN: https://cdn.dev.mercancy.com.br/img/tenants/lojinhateste/category/image.png
 * // R2: https://pub-xxx.r2.dev/img/tenants/lojinhateste/category/image.png
 * // GCS/Local: http://localhost/lojinhateste/storage/gcs/img/tenants/lojinhateste/category/image.png
 * getImageUrl(config.base_urls, 'category', 'image.png', { tenant: 'lojinhateste' });
 */
export function getImageUrl(
  baseUrls: BaseUrls | undefined | null,
  type: ImageType,
  filename: string | undefined | null,
  options?: ImageUrlOptions | StorageConfig | null
): string {
  if (!filename) {
    return PLACEHOLDER_IMAGE;
  }

  // Se já é uma URL completa, retorna diretamente
  if (isFullUrl(filename)) {
    return filename;
  }

  // AIDEV-NOTE: Backward compatibility - options pode ser StorageConfig diretamente
  let storageConfig: StorageConfig | null = null;
  let tenantParam: string | undefined;

  if (options && 'driver' in options) {
    // Legacy: passado StorageConfig diretamente
    storageConfig = options;
  } else if (options) {
    // New: passado ImageUrlOptions
    storageConfig = options.storageConfig ?? null;
    tenantParam = options.tenant;
  }

  // AIDEV-NOTE: Usa tenant passado explicitamente, ou busca do localStorage
  const tenant = tenantParam || getCurrentTenant();

  if (!tenant) {
    return PLACEHOLDER_IMAGE;
  }

  const storage = storageConfig ?? cachedStorageConfig;
  const cleanFilename = filename.startsWith('/') ? filename.slice(1) : filename;

  // AIDEV-NOTE: CDN tem prioridade sobre qualquer driver de storage
  if (CDN_URL) {
    return buildCdnUrl(storage, tenant, type, cleanFilename);
  }

  // Determina qual URL construir baseado no driver de storage
  if (storage?.driver === 'r2') {
    return buildR2Url(storage, tenant, type, cleanFilename);
  }

  // GCS ou Local: usa proxy Laravel
  return buildProxyUrl(storage, tenant, type, cleanFilename);
}

/**
 * Constrói URL da imagem usando Signed URL quando possível
 * Com fallback automático para proxy mode.
 *
 * Esta função é assíncrona e deve ser usada com o hook useSignedImageUrl
 * para obter melhor performance em páginas com muitas imagens.
 *
 * @param type - Tipo de imagem
 * @param filename - Nome do arquivo
 * @param options - Opções adicionais
 * @returns Promise com URL completa ou placeholder
 */
export async function getImageUrlWithSignedFallback(
  type: ImageType,
  filename: string | undefined | null,
  options: {
    preferSignedUrl?: boolean;
    tenant?: string;
    storageConfig?: StorageConfig | null;
  } = {}
): Promise<string> {
  if (!filename) {
    return PLACEHOLDER_IMAGE;
  }

  // Se já é uma URL completa, retorna diretamente
  if (isFullUrl(filename)) {
    return filename;
  }

  const tenant = options.tenant || getCurrentTenant();
  if (!tenant) {
    return PLACEHOLDER_IMAGE;
  }

  const storage = options.storageConfig ?? cachedStorageConfig;
  const cleanFilename = filename.startsWith('/') ? filename.slice(1) : filename;

  // AIDEV-NOTE: CDN tem prioridade sobre qualquer driver de storage
  if (CDN_URL) {
    return buildCdnUrl(storage, tenant, type, cleanFilename);
  }

  // R2: usa URLs públicas diretamente (não precisa de signed URLs)
  if (storage?.driver === 'r2') {
    return buildR2Url(storage, tenant, type, cleanFilename);
  }

  // GCS com signed URLs habilitadas
  const { preferSignedUrl = true } = options;
  if (storage?.driver === 'gcs' && storage.use_signed_urls && preferSignedUrl && typeof window !== 'undefined') {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // Import dinâmico para evitar carregar o serviço se não necessário
        const { getSignedImageUrl } = await import('@/lib/services/signed-url.service');
        const signedUrl = await getSignedImageUrl(tenant, type, filename);
        if (signedUrl) {
          return signedUrl;
        }
      }
    } catch (error) {
      console.warn('[Image] Failed to get signed URL, falling back to proxy:', error);
    }
  }

  // Fallback para proxy mode
  return buildProxyUrl(storage, tenant, type, cleanFilename);
}

/**
 * Hook-friendly helper que retorna uma função getImageUrl pré-configurada
 * AIDEV-NOTE: Aceita tenant opcional para evitar dependência de localStorage
 */
export function createImageUrlGetter(
  baseUrls: BaseUrls | undefined | null,
  options?: { storageConfig?: StorageConfig | null; tenant?: string }
) {
  return (type: ImageType, filename: string | undefined | null) =>
    getImageUrl(baseUrls, type, filename, options);
}

/**
 * Constrói o asset key para uso com a API de Signed URLs
 * Formato: tenants/{tenant}/{type}/{filename}
 *
 * @example
 * buildAssetKey('lojinhateste', 'product', 'image.png')
 * // Retorna: 'tenants/lojinhateste/product/image.png'
 */
export function buildAssetKey(
  tenant: string,
  type: ImageType,
  filename: string
): string {
  const cleanFilename = filename.startsWith('/') ? filename.slice(1) : filename;
  return `tenants/${tenant}/${type}/${cleanFilename}`;
}

/**
 * Verifica se um URL é um placeholder
 */
export function isPlaceholder(url: string): boolean {
  return url === PLACEHOLDER_IMAGE || url.endsWith('/placeholder.svg');
}

/**
 * Extrai informações de um URL de imagem do sistema
 */
export function parseImageUrl(url: string): {
  tenant: string | null;
  type: ImageType | null;
  filename: string | null;
} | null {
  // Pattern: .../tenants/{tenant}/{type}/{filename}
  const match = url.match(/\/tenants\/([^/]+)\/([^/]+)\/(.+)$/);
  if (!match) return null;

  return {
    tenant: match[1],
    type: match[2] as ImageType,
    filename: match[3],
  };
}

/**
 * Verifica se o storage atual usa URLs públicas (R2) ou precisa de proxy/signed URLs
 */
export function usesPublicUrls(): boolean {
  return cachedStorageConfig?.driver === 'r2';
}

/**
 * Verifica se o storage atual usa signed URLs (GCS com signed URLs habilitadas)
 */
export function usesSignedUrls(): boolean {
  return cachedStorageConfig?.driver === 'gcs' && cachedStorageConfig?.use_signed_urls === true;
}

// ============================================================================
// GENERIC PUBLIC ID IMAGE FUNCTIONS
// AIDEV-NOTE: Unified functions for entities with publicId (products, categories, etc.)
// ============================================================================

/**
 * Build image URL using publicId for any entity type
 *
 * AIDEV-NOTE: Generic function that handles all entity types with publicId
 * URL pattern: {base_url}/img/{prefix}/{publicId}/{filename}
 *
 * @param entityType - Type of entity (product, category, etc.)
 * @param publicId - Entity's public_id (ULID)
 * @param indexOrFilename - Image index (0, 1, 2) or filename ("0.jpg")
 * @param options - Storage config options
 * @returns Full image URL or placeholder
 *
 * @example
 * getPublicIdImageUrl('product', '01kcvqtf...', 0) // → img/p/01kcvqtf.../0.jpg
 * getPublicIdImageUrl('category', '01kdtrsg...', '0.png') // → img/c/01kdtrsg.../0.png
 */
export function getPublicIdImageUrl(
  entityType: ImageType,
  publicId: string | undefined | null,
  indexOrFilename: number | string,
  options?: { storageConfig?: StorageConfig | null }
): string {
  const prefix = ENTITY_PREFIXES[entityType];

  if (!publicId || !prefix) {
    return PLACEHOLDER_IMAGE;
  }

  const storage = options?.storageConfig ?? cachedStorageConfig;
  const pathPrefix = storage?.path_prefix || 'img';

  // Convert index to filename if needed
  const filename = typeof indexOrFilename === 'number'
    ? `${indexOrFilename}.jpg`
    : indexOrFilename;

  // Build the path: {prefix}/{publicId}/{filename}
  const imagePath = `${prefix}/${publicId}/${filename}`;

  // CDN has priority
  if (CDN_URL) {
    const baseUrl = CDN_URL.endsWith('/') ? CDN_URL.slice(0, -1) : CDN_URL;
    return `${baseUrl}/${pathPrefix}/${imagePath}`;
  }

  // R2 public URL
  if (storage?.driver === 'r2' && storage.public_url) {
    return `${storage.public_url}/${pathPrefix}/${imagePath}`;
  }

  // Fallback to proxy (for local/GCS)
  return `${API_BASE_URL}/storage/${pathPrefix}/${imagePath}`;
}

/**
 * Entity data interface for card image URL
 */
export interface EntityImageData {
  image?: string | string[] | null;
  publicId?: string | null;
  public_id?: string | null; // Alternative naming (snake_case from API)
}

/**
 * Get entity image URL for display in cards/lists (generic)
 *
 * AIDEV-NOTE: Handles both legacy and new image formats automatically
 * - New format (0.jpg, 1.jpg): uses publicId-based path (img/{prefix}/{publicId}/{filename})
 * - Legacy format (2025-xx-xx-xxx.jpg): uses tenant-based path (img/tenants/{tenant}/{type}/{filename})
 *
 * @param entityType - Type of entity (product, category, etc.)
 * @param entity - Entity with image and optional publicId/public_id
 * @param options - Storage config and tenant options
 * @returns Image URL or placeholder
 *
 * @example
 * getEntityCardImageUrl('product', product, { tenant, storageConfig })
 * getEntityCardImageUrl('category', category, { tenant, storageConfig })
 */
export function getEntityCardImageUrl(
  entityType: ImageType,
  entity: EntityImageData,
  options?: { storageConfig?: StorageConfig | null; tenant?: string }
): string {
  // Get first image (handle both array and string)
  const imageValue = entity.image;
  const firstImage = Array.isArray(imageValue) ? imageValue[0] : imageValue;

  if (!firstImage) {
    return PLACEHOLDER_IMAGE;
  }

  // Get publicId (handle both camelCase and snake_case)
  const publicId = entity.publicId ?? entity.public_id;

  // Check if new format (numeric filename like "0.jpg", "1.webp")
  const isNewFormat = /^\d+\.\w+$/.test(firstImage);

  if (isNewFormat && publicId && ENTITY_PREFIXES[entityType]) {
    return getPublicIdImageUrl(entityType, publicId, firstImage, {
      storageConfig: options?.storageConfig,
    });
  }

  // Legacy format - use tenant-based path
  return getImageUrl(null, entityType, firstImage, {
    tenant: options?.tenant,
    storageConfig: options?.storageConfig,
  });
}

// ============================================================================
// PRODUCT-SPECIFIC FUNCTIONS (wrappers for backward compatibility)
// ============================================================================

/**
 * Build product image URL using publicId (Amazon/ML style)
 * @deprecated Use getPublicIdImageUrl('product', ...) instead
 */
export function getProductImageUrl(
  publicId: string | undefined | null,
  indexOrFilename: number | string,
  options?: { storageConfig?: StorageConfig | null }
): string {
  return getPublicIdImageUrl('product', publicId, indexOrFilename, options);
}

/**
 * Get all product image URLs from the image array
 *
 * AIDEV-NOTE: Handles both legacy filenames and new index-based format
 *
 * @param publicId - Product's public_id (ULID)
 * @param images - Array of image filenames or indices
 * @param options - Storage config options
 * @returns Array of full image URLs
 */
export function getProductImageUrls(
  publicId: string | undefined | null,
  images: (string | number)[] | undefined | null,
  options?: { storageConfig?: StorageConfig | null }
): string[] {
  if (!publicId || !images || images.length === 0) {
    return [PLACEHOLDER_IMAGE];
  }

  return images.map((img, index) => {
    // If it's a legacy filename (contains date pattern), use index-based URL
    if (typeof img === 'string' && img.match(/^\d{4}-\d{2}-\d{2}-/)) {
      // Legacy filename - use index as the new filename
      return getProductImageUrl(publicId, index, options);
    }
    return getProductImageUrl(publicId, img, options);
  });
}

/**
 * Check if an image array uses legacy filenames
 */
export function usesLegacyImageFormat(images: (string | number)[] | undefined | null): boolean {
  if (!images || images.length === 0) return false;
  const firstImage = images[0];
  return typeof firstImage === 'string' && firstImage.match(/^\d{4}-\d{2}-\d{2}-/) !== null;
}

/**
 * Product image data for getProductCardImageUrl
 * @deprecated Use EntityImageData instead
 */
export type ProductImageData = EntityImageData;

/**
 * Get the first product image URL for display in cards/lists
 * @deprecated Use getEntityCardImageUrl('product', ...) instead
 */
export function getProductCardImageUrl(
  product: ProductImageData,
  options?: { storageConfig?: StorageConfig | null; tenant?: string }
): string {
  return getEntityCardImageUrl('product', product, options);
}

// ============================================================================
// CATEGORY-SPECIFIC FUNCTIONS (wrappers for backward compatibility)
// ============================================================================

/**
 * Build category image URL using publicId
 * @deprecated Use getPublicIdImageUrl('category', ...) instead
 */
export function getCategoryImageUrl(
  publicId: string | undefined | null,
  filename: string,
  options?: { storageConfig?: StorageConfig | null }
): string {
  return getPublicIdImageUrl('category', publicId, filename, options);
}

/**
 * Category image data for getCategoryCardImageUrl
 * @deprecated Use EntityImageData instead
 */
export type CategoryImageData = EntityImageData;

/**
 * Get category image URL for display in cards/lists
 * @deprecated Use getEntityCardImageUrl('category', ...) instead
 */
export function getCategoryCardImageUrl(
  category: CategoryImageData,
  options?: { storageConfig?: StorageConfig | null; tenant?: string }
): string {
  return getEntityCardImageUrl('category', category, options);
}
