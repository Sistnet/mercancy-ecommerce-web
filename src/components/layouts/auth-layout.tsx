'use client';

/**
 * Auth Layout - Layout para páginas de autenticação (login, registro, etc.)
 */

import { ReactNode } from 'react';
import Link from 'next/link';
import { useAppSelector } from '@/lib/store/hooks';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const { config } = useAppSelector((state) => state.config);
  const { currentTenant } = useAppSelector((state) => state.tenant);

  // AIDEV-NOTE: Prefixo de tenant para todas as rotas internas
  const tenantPrefix = currentTenant ? `/${currentTenant}` : '';

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Side - Branding */}
      <div className="hidden md:flex md:w-1/2 bg-primary p-12 flex-col justify-between text-primary-foreground">
        <div>
          <Link href={`${tenantPrefix}/`} className="text-3xl font-bold">
            {config?.ecommerce_name || 'Mercado'}
          </Link>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            Bem-vindo à melhor experiência de compras online
          </h1>
          <p className="text-lg opacity-90">
            Encontre os melhores produtos com preços incríveis e entrega rápida.
          </p>
        </div>

        <div className="text-sm opacity-75">
          &copy; {new Date().getFullYear()} {config?.ecommerce_name || 'Mercado Cadatech'}
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="md:hidden text-center">
            <Link href={`${tenantPrefix}/`} className="text-2xl font-bold text-primary">
              {config?.ecommerce_name || 'Mercado'}
            </Link>
          </div>

          {/* Header */}
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
          </div>

          {/* Form Content */}
          {children}
        </div>
      </div>
    </div>
  );
}
