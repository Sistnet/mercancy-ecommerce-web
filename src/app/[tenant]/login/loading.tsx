/**
 * Loading - Tela de carregamento para página de login
 * AIDEV-NOTE: Next.js App Router automatically shows this during page transitions
 */

import { LoadingScreen } from '@/components/ui/loading-screen';

export default function Loading() {
  return <LoadingScreen text="Carregando login..." />;
}
