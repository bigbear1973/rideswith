'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Menu, Sun, Moon, User, Settings, LogOut, Shield, BarChart3 } from 'lucide-react';
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

const navLinks = [
  { href: '/discover', label: 'Discover' },
  { href: '/communities', label: 'Communities' },
  { href: '/create', label: 'Create Ride' },
];

export function Navbar() {
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();
  const { brand, isLoading } = useBrand();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="border-b border-border bg-background sticky top-0 z-[1000]">
      <nav className="mx-auto max-w-[1400px] px-6 md:px-[60px] h-16 md:h-20 flex items-center justify-between" aria-label="Main navigation">
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
          ) : null}
          <span className="font-bold text-sm uppercase tracking-wider">
            {brand?.name || 'RidesWith'}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs font-semibold uppercase tracking-wider transition-colors ${
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          {/* Unit Selector - show for guests */}
          {!session && <UnitSelector />}

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="relative text-muted-foreground hover:text-foreground transition-colors h-4 w-4"
            aria-label="Toggle theme"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0 absolute inset-0" />
            <Moon className="h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100 absolute inset-0" />
          </button>

          {/* User Menu / Sign In */}
          {session ? (
            <UserMenu />
          ) : (
            <Link
              href="/auth/signin"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              Log In
            </Link>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center gap-4">
          {/* Unit Selector - show for guests */}
          {!session && <UnitSelector />}

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="relative text-muted-foreground hover:text-foreground transition-colors h-4 w-4"
            aria-label="Toggle theme"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0 absolute inset-0" />
            <Moon className="h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100 absolute inset-0" />
          </button>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px] z-[1200]">
              <SheetHeader>
                <SheetTitle className="text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Menu
                </SheetTitle>
              </SheetHeader>

              {/* User Info - shown when logged in */}
              {session?.user && (
                <div className="mt-6 mx-4 flex items-center gap-3 pb-6 border-b border-border">
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

              <nav className="mt-6 flex flex-col gap-1 px-4">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={closeMobileMenu}
                      className={`py-3 text-sm uppercase tracking-wider transition-colors ${
                        isActive
                          ? 'text-foreground font-semibold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}

                {/* Account Section */}
                {session?.user ? (
                  <>
                    <Separator className="my-4" />
                    <Link
                      href="/profile"
                      onClick={closeMobileMenu}
                      className={`py-3 text-sm uppercase tracking-wider flex items-center gap-3 transition-colors ${
                        pathname === '/profile'
                          ? 'text-foreground font-semibold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                    <Link
                      href="/settings"
                      onClick={closeMobileMenu}
                      className={`py-3 text-sm uppercase tracking-wider flex items-center gap-3 transition-colors ${
                        pathname === '/settings'
                          ? 'text-foreground font-semibold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                    {session.user.role === 'PLATFORM_ADMIN' && (
                      <>
                        <Link
                          href="/admin/analytics"
                          onClick={closeMobileMenu}
                          className={`py-3 text-sm uppercase tracking-wider flex items-center gap-3 transition-colors ${
                            pathname === '/admin/analytics'
                              ? 'text-foreground font-semibold'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <BarChart3 className="h-4 w-4" />
                          Admin: Analytics
                        </Link>
                        <Link
                          href="/admin/communities"
                          onClick={closeMobileMenu}
                          className={`py-3 text-sm uppercase tracking-wider flex items-center gap-3 transition-colors ${
                            pathname === '/admin/communities'
                              ? 'text-foreground font-semibold'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Shield className="h-4 w-4" />
                          Admin: Communities
                        </Link>
                      </>
                    )}
                    <button
                      onClick={() => {
                        closeMobileMenu();
                        signOut({ callbackUrl: '/' });
                      }}
                      className="py-3 text-sm uppercase tracking-wider flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Separator className="my-4" />
                    <Link
                      href="/auth/signin"
                      onClick={closeMobileMenu}
                      className="py-3 text-sm uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Log In
                    </Link>
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
