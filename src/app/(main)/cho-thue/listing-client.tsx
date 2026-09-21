'use client';

import { PropertyListingPage } from '@/components/listing/PropertyListingPage';

/** Giao diện /cho-thue — dùng chung với /mua-ban qua PropertyListingPage, chỉ khác `type`. */
export default function ChoThuePage() {
  return <PropertyListingPage type="rent" />;
}
