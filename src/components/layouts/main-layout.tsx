'use client';

/**
 * Main Layout - Layout principal para páginas autenticadas/públicas
 */

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Search,
  ShoppingCart,
  User,
  Menu,
  Heart,
  Bell,
  LogOut,
  Settings,
  Package,
  Wallet,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks';
import { logout } from '@/lib/store/slices/auth.slice';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();

  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { totalItems } = useAppSelector((state) => state.cart);
  const { config } = useAppSelector((state) => state.config);
  const { unreadCount } = useAppSelector((state) => state.notifications);

  const handleLogout = () => {
    dispatch(logout());
  };

  const navItems = [
    { href: '/', label: 'Início', icon: Home },
    { href: '/categories', label: 'Categorias', icon: Menu },
    { href: '/search', label: 'Buscar', icon: Search },
    { href: '/cart', label: 'Carrinho', icon: ShoppingCart, badge: totalItems },
  ];

  const userMenuItems = [
    { href: '/profile', label: 'Meu Perfil', icon: User },
    { href: '/orders', label: 'Meus Pedidos', icon: Package },
    { href: '/wishlist', label: 'Lista de Desejos', icon: Heart },
    { href: '/wallet', label: 'Carteira', icon: Wallet },
    { href: '/notifications', label: 'Notificações', icon: Bell },
    { href: '/chat', label: 'Mensagens', icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-primary">
              {config?.ecommerce_name || 'Mercado'}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-1 text-sm font-medium transition-colors hover:text-primary ${
                  pathname === item.href ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
                {item.badge ? (
                  <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                    {item.badge}
                  </Badge>
                ) : null}
              </Link>
            ))}
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            {isAuthenticated && (
              <Link href="/notifications" className="relative">
                <Bell className="h-5 w-5 text-muted-foreground hover:text-primary" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -right-2 -top-2 h-5 w-5 rounded-full p-0 text-xs"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Link>
            )}

            {/* User Menu */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.image} alt={user?.fName} />
                      <AvatarFallback>
                        {user?.fName?.[0]}
                        {user?.lName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">
                        {user?.fName} {user?.lName}
                      </p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  {userMenuItems.map((item) => (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link href={item.href} className="flex items-center">
                        <item.icon className="mr-2 h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link href="/login">Entrar</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Cadastrar</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <nav className="flex flex-col space-y-4 mt-8">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center space-x-3 text-lg font-medium ${
                        pathname === item.href ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                      {item.badge ? (
                        <Badge variant="destructive">{item.badge}</Badge>
                      ) : null}
                    </Link>
                  ))}
                  <div className="border-t pt-4 mt-4">
                    {isAuthenticated ? (
                      <>
                        {userMenuItems.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center space-x-3 py-2 text-muted-foreground hover:text-primary"
                          >
                            <item.icon className="h-5 w-5" />
                            <span>{item.label}</span>
                          </Link>
                        ))}
                        <button
                          onClick={handleLogout}
                          className="flex items-center space-x-3 py-2 text-destructive w-full"
                        >
                          <LogOut className="h-5 w-5" />
                          <span>Sair</span>
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col space-y-2">
                        <Button asChild>
                          <Link href="/login">Entrar</Link>
                        </Button>
                        <Button variant="outline" asChild>
                          <Link href="/register">Cadastrar</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-6 md:py-8">{children}</main>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container py-8 md:py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Sobre</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/about" className="hover:text-primary">
                    Quem Somos
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-primary">
                    Termos de Uso
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-primary">
                    Privacidade
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Ajuda</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/faq" className="hover:text-primary">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/support" className="hover:text-primary">
                    Suporte
                  </Link>
                </li>
                <li>
                  <Link href="/chat" className="hover:text-primary">
                    Contato
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Conta</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/profile" className="hover:text-primary">
                    Minha Conta
                  </Link>
                </li>
                <li>
                  <Link href="/orders" className="hover:text-primary">
                    Meus Pedidos
                  </Link>
                </li>
                <li>
                  <Link href="/wishlist" className="hover:text-primary">
                    Lista de Desejos
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contato</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {config?.ecommerce_phone && <li>{config.ecommerce_phone}</li>}
                {config?.ecommerce_email && <li>{config.ecommerce_email}</li>}
                {config?.ecommerce_address && <li>{config.ecommerce_address}</li>}
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>
              &copy; {new Date().getFullYear()} {config?.ecommerce_name || 'Mercado Cadatech'}. Todos
              os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
