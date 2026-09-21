'use client';

import { PropertyListingPage } from '@/components/listing/PropertyListingPage';

/** Giao diện /mua-ban — dùng chung với /cho-thue qua PropertyListingPage, chỉ khác `type`. */
export default function MuaBanPage() {
  return <PropertyListingPage type="sell" />;
}
