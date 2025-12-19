'use client';

/**
 * Tenant Layout - Layout para rotas com tenant dinâmico
 * Usa TenantProvider para definir o tenant no Redux/localStorage
 * AIDEV-NOTE: MainLayout inclui header e footer compartilhados
 */

import { TenantProvider } from '@/components/providers/tenant-provider';
import { MainLayout } from '@/components/layouts/main-layout';

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TenantProvider>
      <MainLayout>{children}</MainLayout>
    </TenantProvider>
  );
}
