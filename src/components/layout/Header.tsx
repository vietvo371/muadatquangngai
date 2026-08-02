'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, User, Bell, Heart, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuthStore } from '@/stores/authStore';
import { useFavorite } from '@/hooks/useFavorite';
import { SELL_CATEGORIES, RENT_CATEGORIES, PROJECT_CATEGORIES, type CategoryMenuItem } from '@/lib/category-menu';

const mainNavLinks: Array<{
  href: string;
  label: string;
  submenu?: CategoryMenuItem[];
}> = [
  { href: '/mua-ban', label: 'Nhà đất bán', submenu: SELL_CATEGORIES },
  { href: '/cho-thue', label: 'Nhà đất cho thuê', submenu: RENT_CATEGORIES },
  { href: '/du-an', label: 'Dự án', submenu: PROJECT_CATEGORIES },
  // /moi-gioi tự có 2 tab Cá nhân/Công ty rồi — bấm thẳng vào trang, không cần dropdown.
  { href: '/moi-gioi', label: 'Danh bạ' },
  { href: '/tin-tuc', label: 'Tin tức' },
];

export function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
  const { savedCount } = useFavorite(undefined);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm">
<div className="mx-auto max-w-[1152px] px-4 sm:px-6">
        <div className="flex h-[60px] items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="shrink-0">
            <Image
              src="/images/logo_mai.png"
              alt="Muadatquangngai.com"
              width={220}
              height={60}
              className="object-contain h-14 w-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center flex-1 justify-center">
            {mainNavLinks.map((link) => {
              const isActive = pathname === link.href ||
                (pathname && link.href !== '/' && pathname.startsWith(link.href));
              return (
                <div
                  key={link.href}
                  className="relative"
                  onMouseEnter={() => link.submenu && setOpenSubmenu(link.href)}
                  onMouseLeave={() => setOpenSubmenu(null)}
                >
                  <Link
                    href={link.href}
                    className={`group relative inline-flex h-[60px] items-center gap-1 whitespace-nowrap rounded-t-md px-4 text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-primary-light text-primary'
                        : 'text-gray-700 hover:text-primary'
                    }`}
                  >
                    {link.label}
                    {link.submenu && (
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openSubmenu === link.href ? 'rotate-180' : ''}`} />
                    )}
                    <span className={`absolute bottom-0 left-0 right-0 h-[3px] bg-primary transition-transform origin-center ${
                      isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    }`} />
                  </Link>

                  {link.submenu && openSubmenu === link.href && (
                    <div className="absolute left-0 top-[60px] z-50 w-72 rounded-b-xl border border-gray-100 bg-white py-2 shadow-xl">
                      {link.submenu?.map((item) => (
                        <Link
                          key={item.id}
                          href={`${link.href}?category=${item.id}`}
                          className="block px-4 py-2 text-[13.5px] text-gray-700 hover:bg-primary-light hover:text-primary transition-colors"
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Tin yêu thích */}
            {isAuthenticated && (
              <Link href="/dashboard/tin-da-luu">
                <Button variant="ghost" size="icon" className="relative" aria-label="Tin yêu thích">
                  <Heart className="h-5 w-5" />
                  {savedCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#e03131] px-1 text-[10px] font-bold text-white">
                      {savedCount > 99 ? '99+' : savedCount}
                    </span>
                  )}
                </Button>
              </Link>
            )}

            {/* Notifications */}
            {isAuthenticated && (
              <Link href="/dashboard/thong-bao">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
                </Button>
              </Link>
            )}

            {/* Auth Buttons or User */}
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2 text-gray-700">
                  <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                  <span className="hidden sm:inline text-sm">{user?.name || 'Tài khoản'}</span>
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden sm:block">
                  <Button variant="ghost" size="sm" className="text-gray-700 text-sm font-medium hover:text-primary">
                    Đăng nhập
                  </Button>
                </Link>
                <Link href="/register" className="hidden sm:block">
                  <Button variant="outline" size="sm" className="text-primary border-primary hover:bg-primary-light text-sm font-semibold">
                    Đăng ký
                  </Button>
                </Link>
              </>
            )}

            {/* Post Button */}
            <Link href={isAuthenticated ? '/dashboard/dang-tin' : '/login'}>
              <Button variant="cta" size="lg" className="hidden px-5 text-sm font-bold shadow-md sm:flex">
                + Đăng tin
              </Button>
            </Link>

            {/* Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger
                className="lg:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="Mở menu"
              >
                <Menu className="h-5 w-5" />
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col gap-1 mt-6">
                  {mainNavLinks.map((link) => (
                    <div key={link.href}>
                      <div className="flex items-center">
                        <Link
                          href={link.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                        >
                          {link.label}
                        </Link>
                        {link.submenu && (
                          <button
                            type="button"
                            onClick={() => setMobileExpanded((v) => (v === link.href ? null : link.href))}
                            className="p-3 text-gray-400 hover:text-gray-700"
                            aria-label="Mở danh mục con"
                          >
                            <ChevronDown className={`h-4 w-4 transition-transform ${mobileExpanded === link.href ? 'rotate-180' : ''}`} />
                          </button>
                        )}
                      </div>
                      {link.submenu && mobileExpanded === link.href && (
                        <div className="ml-4 flex flex-col gap-0.5 border-l border-gray-100 pl-3 pb-1">
                          {link.submenu?.map((item) => (
                            <Link
                              key={item.id}
                              href={`${link.href}?category=${item.id}`}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="px-3 py-2 text-[13px] text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                              {item.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  <hr className="my-3" />

                  <Link
                    href={isAuthenticated ? '/dashboard/dang-tin' : '/login'}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-lg bg-cta px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-cta-dark"
                  >
                    Đăng tin
                  </Link>

                  {!isAuthenticated && (
                    <div className="flex gap-2 mt-2">
                      <Link href="/login" className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full text-sm">Đăng nhập</Button>
                      </Link>
                      <Link href="/register" className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full border-primary text-sm text-primary hover:bg-primary-light">Đăng ký</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>

        </div>
      </div>
    </header>
  );
}
