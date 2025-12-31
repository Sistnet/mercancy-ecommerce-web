/**
 * API Client - Baseado em Flutter dio_client.dart e tenant_interceptor.dart
 *
 * Axios client configurado com interceptors para:
 * - Multi-tenant (X-Tenant header)
 * - Autenticação (Bearer token)
 * - Localização (X-localization header)
 * - Guest ID
 */

import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import Cookies from 'js-cookie';
import {
  TenantResolver,
  TENANT_HEADER_NAME,
  TENANT_SCHEMA_HEADER_NAME,
  DEFAULT_TENANT,
} from '@/lib/tenant/tenant-resolver';

// Storage Keys (baseado em AppConstants do Flutter)
export const STORAGE_KEYS = {
  TOKEN: 'token',
  GUEST_ID: 'guest_id',
  LANGUAGE_CODE: 'language_code',
  COUNTRY_CODE: 'country_code',
  THEME: 'theme',
  CART_LIST: 'cart_list',
  USER_ADDRESS: 'user_address',
  ONBOARDING_SKIP: 'onboarding_skip',
  CURRENT_TENANT: 'current_tenant',
} as const;

// Configuração base
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';
const API_TIMEOUT = 120000; // 120 segundos (igual ao Flutter)

/**
 * Cria instância do Axios com interceptors configurados
 */
export const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT,
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
    },
  });

  // Request Interceptor
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // 1. Tenant Resolution - Prioriza localStorage (definido pela página [tenant])
      const storedTenant = getStorageItem(STORAGE_KEYS.CURRENT_TENANT);
      const tenant = storedTenant || TenantResolver.resolveTenantFromHost() || DEFAULT_TENANT;

      // AIDEV-NOTE: Tenant is sent via headers only, not in URL path
      // The Laravel API routes are at /api/v1/... without tenant prefix
      // Tenant context is resolved by ResolveTenantContext middleware via X-Tenant header

      // Headers de tenant
      config.headers[TENANT_HEADER_NAME] = tenant;
      config.headers[TENANT_SCHEMA_HEADER_NAME] = tenant;

      // 2. Auth Token
      const token = getStorageItem(STORAGE_KEYS.TOKEN);
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }

      // 3. Localization
      const languageCode = getStorageItem(STORAGE_KEYS.LANGUAGE_CODE) || 'en';
      config.headers['X-localization'] = languageCode;

      // 4. Guest ID (quando não autenticado)
      if (!token) {
        const guestId = getStorageItem(STORAGE_KEYS.GUEST_ID);
        if (guestId) {
          config.headers['guest-id'] = guestId;
        }
      }

      // Log em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url} | Tenant: ${tenant}`);
      }

      return config;
    },
    (error: AxiosError) => {
      return Promise.reject(error);
    }
  );

  // Response Interceptor
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[API] Response ${response.status} ${response.config.url}`);
      }
      return response;
    },
    (error: AxiosError) => {
      // Tratamento de erros (baseado em api_error_handler.dart)
      const errorMessage = handleApiError(error);

      if (process.env.NODE_ENV === 'development') {
        console.error(`[API] Error: ${errorMessage}`, error);
      }

      // Se 401, limpar token e redirecionar para login
      if (error.response?.status === 401) {
        removeStorageItem(STORAGE_KEYS.TOKEN);
        if (typeof window !== 'undefined') {
          const tenant = TenantResolver.resolveTenantFromHost();
          const loginPath = tenant ? `/${tenant}/login` : '/login';
          window.location.href = loginPath;
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
};

/**
 * Trata erros da API (baseado em api_error_handler.dart)
 */
export function handleApiError(error: AxiosError): string {
  if (error.response) {
    // Erro com resposta do servidor
    const data = error.response.data as {
      errors?: Array<{ message: string; code?: string }>;
      message?: string;
    };

    if (data?.errors && data.errors.length > 0) {
      return data.errors[0].message;
    }

    if (data?.message) {
      return data.message;
    }

    // Mensagens padrão por status code
    switch (error.response.status) {
      case 400:
        return 'Bad Request';
      case 401:
        return 'Unauthorized';
      case 403:
        return 'Forbidden';
      case 404:
        return 'Not Found';
      case 500:
        return 'Internal Server Error';
      case 503:
        return 'Service Unavailable';
      default:
        return `Error ${error.response.status}`;
    }
  }

  if (error.code === 'ECONNABORTED') {
    return 'Connection timeout';
  }

  if (error.code === 'ERR_NETWORK') {
    return 'Network error - Please check your connection';
  }

  return error.message || 'An unexpected error occurred';
}

/**
 * Helper para obter item do localStorage com fallback para cookies
 */
function getStorageItem(key: string): string | null {
  if (typeof window === 'undefined') {
    return Cookies.get(key) || null;
  }

  try {
    return localStorage.getItem(key) || Cookies.get(key) || null;
  } catch {
    return Cookies.get(key) || null;
  }
}

/**
 * Helper para remover item do localStorage e cookies
 */
function removeStorageItem(key: string): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore
    }
  }
  Cookies.remove(key);
}

// Instância singleton do API client
let apiClientInstance: AxiosInstance | null = null;

export const getApiClient = (): AxiosInstance => {
  if (!apiClientInstance) {
    apiClientInstance = createApiClient();
  }
  return apiClientInstance;
};

// Export da instância padrão
export const apiClient = createApiClient();

// Métodos de conveniência
export const api = {
  get: <T>(url: string, config?: Parameters<AxiosInstance['get']>[1]) =>
    apiClient.get<T>(url, config),

  post: <T>(
    url: string,
    data?: unknown,
    config?: Parameters<AxiosInstance['post']>[2]
  ) => apiClient.post<T>(url, data, config),

  put: <T>(
    url: string,
    data?: unknown,
    config?: Parameters<AxiosInstance['put']>[2]
  ) => apiClient.put<T>(url, data, config),

  delete: <T>(url: string, config?: Parameters<AxiosInstance['delete']>[1]) =>
    apiClient.delete<T>(url, config),

  patch: <T>(
    url: string,
    data?: unknown,
    config?: Parameters<AxiosInstance['patch']>[2]
  ) => apiClient.patch<T>(url, data, config),
};

export default apiClient;
