'use client';

import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { bannerApi, type Banner } from '@/lib/post-api';

interface BannerSectionProps {
  position?: string;
}

export function BannerSection({ position = 'homepage_hero' }: BannerSectionProps) {
  const { data } = useQuery({
    queryKey: ['banners', position],
    queryFn: () => bannerApi.list({ position, active_only: true }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const banners: Banner[] = data?.data || [];

  if (banners.length === 0) return null;

  if (banners.length === 1) {
    const banner = banners[0];
    return (
      <BannerItem banner={banner} />
    );
  }

  // Multiple banners: show as a simple carousel
  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="flex gap-3">
        {banners.slice(0, 2).map((banner) => (
          <div key={banner.id} className="flex-1">
            <BannerItem banner={banner} />
          </div>
        ))}
      </div>
    </div>
  );
}

function BannerItem({ banner }: { banner: Banner }) {
  if (banner.url) {
    return (
      <Link href={banner.url} className="block relative rounded-2xl overflow-hidden">
        <div className="relative w-full" style={{ aspectRatio: '3/1' }}>
          <Image
            src={banner.image}
            alt={banner.title}
            fill
            className="object-cover hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      </Link>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden">
      <div className="relative w-full" style={{ aspectRatio: '3/1' }}>
        <Image
          src={banner.image}
          alt={banner.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
    </div>
  );
}
