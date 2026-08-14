'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ListingCard } from '@/components/home/ListingCard';

// Shape khớp ListingCardData (src/app/(main)/home-data.ts) — khai báo lại tại đây để tránh
// import module 'server-only' vào bundle client.
interface Listing {
  id: number;
  title: string;
  price: string;
  area: string;
  address: string;
  postedAt: string;
  image: string;
  href: string;
  category?: string;
}

interface ListingsSectionProps {
  sale: Listing[];
  rent: Listing[];
}

export function ListingsSection({ sale, rent }: ListingsSectionProps) {
  const tabs = [
    { label: 'Tin nhà đất bán mới nhất', data: sale, href: '/mua-ban' },
    { label: 'Tin nhà đất cho thuê mới nhất', data: rent, href: '/cho-thue' },
  ];

  const [activeTab, setActiveTab] = useState(0);
  const current = tabs[activeTab];

  return (
    <section className="py-14 md:py-20 px-4 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        {/* Heading + tabs */}
        <div className="mb-6 md:mb-8">
          <div className="w-8 h-1 bg-primary rounded-full mb-3" />
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900">
              Bất động sản dành cho bạn
            </h2>
            {/* Tab switcher */}
            <div className="flex gap-0 border border-gray-200 rounded-lg overflow-hidden bg-white self-start">
              {tabs.map((tab, i) => (
                <button
                  key={tab.label}
                  onClick={() => setActiveTab(i)}
                  className={`px-4 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === i
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cards */}
        {current.data.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {current.data.map((listing) => (
              <ListingCard key={listing.id} {...listing} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white py-14 text-center text-sm text-gray-400">
            Chưa có tin đăng nào trong mục này.
          </div>
        )}

        {/* CTA */}
        {current.data.length > 0 && (
          <div className="flex justify-center mt-8">
            <Link href={current.href}>
              <button className="border-2 border-primary text-primary hover:bg-primary-light rounded-lg px-10 py-2.5 font-semibold text-sm transition-colors">
                Xem tất cả
              </button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
