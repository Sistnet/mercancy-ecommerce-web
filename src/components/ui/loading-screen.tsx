/**
 * LoadingScreen - Tela de carregamento com ícone Mercancy
 * AIDEV-NOTE: Exibe animação de pulse enquanto a página carrega
 */

import Image from 'next/image';

interface LoadingScreenProps {
  /** Tamanho do ícone em pixels */
  size?: number;
  /** Mostrar texto de carregando */
  showText?: boolean;
  /** Texto customizado */
  text?: string;
}

export function LoadingScreen({
  size = 80,
  showText = true,
  text = 'Carregando...',
}: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="relative">
        {/* Ícone com animação de pulse */}
        <div className="animate-pulse">
          <Image
            src="/images/icon_mercancy.png"
            alt="Mercancy"
            width={size}
            height={size}
            className="drop-shadow-lg"
            priority
          />
        </div>

        {/* Círculo de progresso animado */}
        <svg
          className="absolute -inset-4 animate-spin-slow"
          viewBox="0 0 100 100"
          style={{ width: size + 32, height: size + 32 }}
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="70 200"
            className="text-primary/30"
          />
        </svg>
      </div>

      {showText && (
        <p className="mt-6 text-sm text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}

export default LoadingScreen;
