'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, User, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuthStore } from '@/stores/authStore';

const mainNavLinks = [
  { href: '/mua-ban', label: 'Nhà đất bán' },
  { href: '/cho-thue', label: 'Nhà đất cho thuê' },
  { href: '/du-an', label: 'Dự án' },
  { href: '/tin-tuc', label: 'Tin tức' },
  { href: '/phan-tich', label: 'Phân tích đánh giá' },
];

export function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm">
<div className="max-w-7xl mx-auto px-4">
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
                (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-[18px] text-sm font-semibold transition-colors whitespace-nowrap group ${
                    isActive
                      ? 'text-primary'
                      : 'text-gray-700 hover:text-primary'
                  }`}
                >
                  {link.label}
                  <span className={`absolute bottom-0 left-0 right-0 h-[3px] bg-primary transition-transform origin-center ${
                    isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                  }`} />
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Notifications */}
            {isAuthenticated && (
              <Link href="/dashboard/thong-bao">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
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
              <Button className="bg-cta hover:bg-cta-dark text-white text-sm font-bold px-5 hidden sm:flex shadow-md">
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
              <SheetContent side="right" className="w-72">
                <div className="flex flex-col gap-1 mt-6">
                  {mainNavLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                      {link.label}
                    </Link>
                  ))}

                  <hr className="my-3" />

                  <Link
                    href={isAuthenticated ? '/dashboard/dang-tin' : '/login'}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 py-3 rounded-lg bg-red-600 text-white font-semibold text-sm"
                  >
                    Đăng tin
                  </Link>

                  {!isAuthenticated && (
                    <div className="flex gap-2 mt-2">
                      <Link href="/login" className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full text-sm">Đăng nhập</Button>
                      </Link>
                      <Link href="/register" className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button className="w-full bg-blue-600 text-sm">Đăng ký</Button>
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
