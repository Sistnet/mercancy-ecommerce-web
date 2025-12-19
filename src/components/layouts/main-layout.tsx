'use client';

/**
 * Main Layout - Layout principal para páginas autenticadas/públicas
 */

import { ReactNode, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  ChevronDown,
  Grid3X3,
  X,
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
import { Input } from '@/components/ui/input';
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks';
import { logout } from '@/lib/store/slices/auth.slice';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();

  // AIDEV-NOTE: Estado para controlar a busca expansível
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { totalItems } = useAppSelector((state) => state.cart);
  const { config } = useAppSelector((state) => state.config);
  const { unreadCount } = useAppSelector((state) => state.notifications);
  const { currentTenant } = useAppSelector((state) => state.tenant);
  const { categories } = useAppSelector((state) => state.categories);

  // AIDEV-NOTE: Prefixo de tenant para todas as rotas internas
  const tenantPrefix = currentTenant ? `/${currentTenant}` : '';

  const handleLogout = () => {
    dispatch(logout());
  };

  // AIDEV-NOTE: Handlers para busca
  const handleSearchToggle = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      // Foca no input quando abre
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`${tenantPrefix}/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  // Fecha busca ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (isSearchOpen && !target.closest('[data-search-container]')) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isSearchOpen]);

  // AIDEV-NOTE: Itens de navegação simples (sem submenu) - usado no desktop após o dropdown de Categorias
  const simpleNavItems = [
    { href: `${tenantPrefix}/`, label: 'Início', icon: Home },
    { href: `${tenantPrefix}/search`, label: 'Buscar', icon: Search },
    { href: `${tenantPrefix}/cart`, label: 'Carrinho', icon: ShoppingCart, badge: totalItems },
  ];

  const userMenuItems = [
    { href: `${tenantPrefix}/profile`, label: 'Meu Perfil', icon: User },
    { href: `${tenantPrefix}/orders`, label: 'Meus Pedidos', icon: Package },
    { href: `${tenantPrefix}/wishlist`, label: 'Lista de Desejos', icon: Heart },
    { href: `${tenantPrefix}/wallet`, label: 'Carteira', icon: Wallet },
    { href: `${tenantPrefix}/notifications`, label: 'Notificações', icon: Bell },
    { href: `${tenantPrefix}/chat`, label: 'Mensagens', icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href={`${tenantPrefix}/`} className="flex items-center space-x-2">
            <span className="text-xl font-bold text-primary">
              {config?.ecommerce_name || 'Mercado'}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {/* Início */}
            <Link
              href={`${tenantPrefix}/`}
              className={`flex items-center space-x-1 text-sm font-medium transition-colors hover:text-primary ${
                pathname === `${tenantPrefix}/` ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Home className="h-4 w-4" />
              <span>Início</span>
            </Link>

            {/* Categorias Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`flex items-center space-x-1 text-sm font-medium transition-colors hover:text-primary ${
                    pathname?.startsWith(`${tenantPrefix}/categories`) ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <Grid3X3 className="h-4 w-4" />
                  <span>Categorias</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href={`${tenantPrefix}/categories`} className="flex items-center font-medium">
                    <Grid3X3 className="mr-2 h-4 w-4" />
                    Ver Todas
                  </Link>
                </DropdownMenuItem>
                {categories.length > 0 && <DropdownMenuSeparator />}
                {categories.slice(0, 8).map((category) => (
                  <DropdownMenuItem key={category.id} asChild>
                    <Link href={`${tenantPrefix}/categories/${category.id}`}>
                      {category.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
                {categories.length > 8 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`${tenantPrefix}/categories`} className="text-primary">
                        Ver mais {categories.length - 8} categorias...
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Buscar - Botão que abre barra abaixo */}
            <button
              onClick={handleSearchToggle}
              className={`flex items-center space-x-1 text-sm font-medium transition-colors hover:text-primary ${
                isSearchOpen ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Search className="h-4 w-4" />
              <span>Buscar</span>
            </button>

            {/* Carrinho */}
            <Link
              href={`${tenantPrefix}/cart`}
              className={`flex items-center space-x-1 text-sm font-medium transition-colors hover:text-primary ${
                pathname === `${tenantPrefix}/cart` ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Carrinho</span>
              {totalItems > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                  {totalItems}
                </Badge>
              )}
            </Link>
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            {isAuthenticated && (
              <Link href={`${tenantPrefix}/notifications`} className="relative">
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
                  <Link href={`${tenantPrefix}/login`}>Entrar</Link>
                </Button>
                <Button asChild>
                  <Link href={`${tenantPrefix}/register`}>Cadastrar</Link>
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
              <SheetContent side="right" className="w-80 overflow-y-auto">
                <nav className="flex flex-col space-y-4 mt-8">
                  {/* Início */}
                  <Link
                    href={`${tenantPrefix}/`}
                    className={`flex items-center space-x-3 text-lg font-medium ${
                      pathname === `${tenantPrefix}/` ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    <Home className="h-5 w-5" />
                    <span>Início</span>
                  </Link>

                  {/* Categorias Expandidas */}
                  <div className="space-y-2">
                    <Link
                      href={`${tenantPrefix}/categories`}
                      className={`flex items-center space-x-3 text-lg font-medium ${
                        pathname?.startsWith(`${tenantPrefix}/categories`) ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      <Grid3X3 className="h-5 w-5" />
                      <span>Categorias</span>
                    </Link>
                    {categories.length > 0 && (
                      <div className="ml-8 space-y-1 border-l-2 border-muted pl-4">
                        {categories.slice(0, 6).map((category) => (
                          <Link
                            key={category.id}
                            href={`${tenantPrefix}/categories/${category.id}`}
                            className="block py-1 text-sm text-muted-foreground hover:text-primary"
                          >
                            {category.name}
                          </Link>
                        ))}
                        {categories.length > 6 && (
                          <Link
                            href={`${tenantPrefix}/categories`}
                            className="block py-1 text-sm text-primary font-medium"
                          >
                            Ver todas ({categories.length})
                          </Link>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Buscar - Abre barra expansível */}
                  <button
                    onClick={() => {
                      handleSearchToggle();
                      // Fecha o menu mobile após clicar
                      const closeButton = document.querySelector('[data-radix-collection-item]');
                      if (closeButton instanceof HTMLElement) closeButton.click();
                    }}
                    className={`flex items-center space-x-3 text-lg font-medium ${
                      isSearchOpen ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    <Search className="h-5 w-5" />
                    <span>Buscar</span>
                  </button>

                  {/* Carrinho */}
                  <Link
                    href={`${tenantPrefix}/cart`}
                    className={`flex items-center space-x-3 text-lg font-medium ${
                      pathname === `${tenantPrefix}/cart` ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    <ShoppingCart className="h-5 w-5" />
                    <span>Carrinho</span>
                    {totalItems > 0 && <Badge variant="destructive">{totalItems}</Badge>}
                  </Link>

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
                          <Link href={`${tenantPrefix}/login`}>Entrar</Link>
                        </Button>
                        <Button variant="outline" asChild>
                          <Link href={`${tenantPrefix}/register`}>Cadastrar</Link>
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

      {/* Barra de Busca Expansível */}
      <div
        data-search-container
        className={`overflow-hidden transition-all duration-300 ease-in-out border-b bg-background ${
          isSearchOpen ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0 border-b-0'
        }`}
      >
        <div className="container py-3">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-3">
            <div className="relative flex-1 max-w-2xl mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="O que você está procurando?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="pl-10 pr-4 h-10"
              />
            </div>
            <Button type="submit" variant="default" size="sm">
              Buscar
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsSearchOpen(false);
                setSearchQuery('');
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>

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
                  <Link href={`${tenantPrefix}/about`} className="hover:text-primary">
                    Quem Somos
                  </Link>
                </li>
                <li>
                  <Link href={`${tenantPrefix}/terms`} className="hover:text-primary">
                    Termos de Uso
                  </Link>
                </li>
                <li>
                  <Link href={`${tenantPrefix}/privacy`} className="hover:text-primary">
                    Privacidade
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Ajuda</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href={`${tenantPrefix}/faq`} className="hover:text-primary">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href={`${tenantPrefix}/support`} className="hover:text-primary">
                    Suporte
                  </Link>
                </li>
                <li>
                  <Link href={`${tenantPrefix}/chat`} className="hover:text-primary">
                    Contato
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Conta</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href={`${tenantPrefix}/profile`} className="hover:text-primary">
                    Minha Conta
                  </Link>
                </li>
                <li>
                  <Link href={`${tenantPrefix}/orders`} className="hover:text-primary">
                    Meus Pedidos
                  </Link>
                </li>
                <li>
                  <Link href={`${tenantPrefix}/wishlist`} className="hover:text-primary">
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
