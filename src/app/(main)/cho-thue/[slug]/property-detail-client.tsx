'use client';

import { use } from 'react';
import { PropertyDetailView } from '@/components/property/detail/PropertyDetailView';

/**
 * Vỏ mỏng: toàn bộ bố cục/khối nội dung nằm ở PropertyDetailView để trang mua bán và
 * cho thuê luôn đồng bộ (không copy-paste hai bản).
 */
export default function PropertyDetailClient({ params }: { params: Promise<{ slug: string }> }) {
  const unwrappedParams = use(params);
  return <PropertyDetailView slug={unwrappedParams?.slug} listingType="rent" />;
}
