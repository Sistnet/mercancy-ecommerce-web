'use client';

/**
 * Hook to get tenant prefix for building URLs
 * AIDEV-NOTE: Extracts tenant from pathname to avoid hydration mismatch
 */

import { usePathname } from 'next/navigation';
import { useAppSelector } from '@/lib/store/hooks';

/**
 * Returns the tenant prefix for URL building (e.g., "/lojinhateste")
 * Falls back to pathname extraction if Redux state not yet populated
 */
export function useTenantPrefix(): string {
  const pathname = usePathname();
  const { currentTenant } = useAppSelector((state) => state.tenant);

  const tenantFromPath = pathname?.split('/')[1] || '';
  const resolvedTenant = currentTenant || tenantFromPath;

  return resolvedTenant ? `/${resolvedTenant}` : '';
}

/**
 * Returns the resolved tenant name (without leading slash)
 */
export function useTenant(): string {
  const pathname = usePathname();
  const { currentTenant } = useAppSelector((state) => state.tenant);

  const tenantFromPath = pathname?.split('/')[1] || '';
  return currentTenant || tenantFromPath;
}
