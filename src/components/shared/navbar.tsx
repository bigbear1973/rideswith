'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Menu, Sun, Moon, MapPin, PlusCircle, Building2, User, Settings, LogOut, Shield, BarChart3 } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useTheme } from '@/components/providers/theme-provider';
import { useBrand } from '@/components/providers/brand-provider';
import { Button } from '@/components/ui/button';
import { UserMenu } from './user-menu';
import { UnitSelector } from './unit-selector';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navLinks = [
  { href: '/discover', label: 'Discover', icon: MapPin },
  { href: '/communities', label: 'Communities', icon: Building2 },
  { href: '/create', label: 'Create Ride', icon: PlusCircle },
];

export function Navbar() {
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();
  const { brand, isLoading } = useBrand();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-[1000]">
      <nav className="mx-auto max-w-6xl px-4 h-14 sm:h-16 flex items-center justify-between" aria-label="Main navigation">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          {brand?.logoUrl && !isLoading ? (
            <Image
              src={brand.logoUrl}
              alt={`${brand.name} logo`}
              width={32}
              height={32}
              className="rounded"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              RW
            </div>
          )}
          <span className="font-bold text-base sm:text-lg group-hover:text-primary transition-colors">
            {brand?.name || 'RidesWith'}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Button
                key={link.href}
                variant={isActive ? 'secondary' : 'ghost'}
                size="sm"
                asChild
              >
                <Link href={link.href} className="gap-2">
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              </Button>
            );
          })}

          {/* Unit Selector - show for guests */}
          {!session && <UnitSelector />}

          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-2">
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-[1100]">
              <DropdownMenuItem onClick={() => setTheme('light')}>
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <UserMenu />
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center gap-2">
          {/* Unit Selector - show for guests */}
          {!session && <UnitSelector />}

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px] z-[1200]">
              <SheetHeader>
                <SheetTitle className="text-left">Menu</SheetTitle>
              </SheetHeader>

              {/* User Info - shown when logged in */}
              {session?.user && (
                <div className="mt-4 flex items-center gap-3 px-2 py-3 bg-muted/50 rounded-lg">
                  <Avatar className="h-10 w-10">
                    {session.user.image && (
                      <AvatarImage src={session.user.image} alt={session.user.name || ''} />
                    )}
                    <AvatarFallback className="text-sm">
                      {session.user.name
                        ?.split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2) || session.user.email?.slice(0, 2).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{session.user.name || 'User'}</p>
                    <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                  </div>
                </div>
              )}

              <nav className="mt-4 flex flex-col gap-2">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Button
                      key={link.href}
                      variant={isActive ? 'secondary' : 'ghost'}
                      className="justify-start gap-3 h-12"
                      asChild
                    >
                      <Link href={link.href} onClick={closeMobileMenu}>
                        <Icon className="h-5 w-5" />
                        {link.label}
                      </Link>
                    </Button>
                  );
                })}

                {/* Account Section */}
                {session?.user ? (
                  <>
                    <Separator className="my-2" />
                    <Button
                      variant={pathname === '/profile' ? 'secondary' : 'ghost'}
                      className="justify-start gap-3 h-12"
                      asChild
                    >
                      <Link href="/profile" onClick={closeMobileMenu}>
                        <User className="h-5 w-5" />
                        Profile
                      </Link>
                    </Button>
                    <Button
                      variant={pathname === '/settings' ? 'secondary' : 'ghost'}
                      className="justify-start gap-3 h-12"
                      asChild
                    >
                      <Link href="/settings" onClick={closeMobileMenu}>
                        <Settings className="h-5 w-5" />
                        Settings
                      </Link>
                    </Button>
                    {session.user.role === 'PLATFORM_ADMIN' && (
                      <>
                        <Button
                          variant={pathname === '/admin/analytics' ? 'secondary' : 'ghost'}
                          className="justify-start gap-3 h-12"
                          asChild
                        >
                          <Link href="/admin/analytics" onClick={closeMobileMenu}>
                            <BarChart3 className="h-5 w-5" />
                            Admin: Analytics
                          </Link>
                        </Button>
                        <Button
                          variant={pathname === '/admin/communities' ? 'secondary' : 'ghost'}
                          className="justify-start gap-3 h-12"
                          asChild
                        >
                          <Link href="/admin/communities" onClick={closeMobileMenu}>
                            <Shield className="h-5 w-5" />
                            Admin: Communities
                          </Link>
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      className="justify-start gap-3 h-12 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        closeMobileMenu();
                        signOut({ callbackUrl: '/' });
                      }}
                    >
                      <LogOut className="h-5 w-5" />
                      Sign out
                    </Button>
                  </>
                ) : (
                  <>
                    <Separator className="my-2" />
                    <Button
                      className="justify-start gap-3 h-12"
                      asChild
                    >
                      <Link href="/auth/signin" onClick={closeMobileMenu}>
                        <User className="h-5 w-5" />
                        Sign In
                      </Link>
                    </Button>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
