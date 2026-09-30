import { PropertyCard, type PropertyCardProps } from '@/components/property/PropertyCard';

/**
 * "Bất động sản tương tự" — chạy hết chiều ngang, nằm dưới khối 2 cột
 * (Notion 30/09 "Bottom – Similar Properties", "Similar Properties – Grid").
 *
 * Trước đây là băng trượt ngang; khách chốt lưới 3–4 thẻ mỗi hàng trên máy tính. Dữ liệu và
 * thẻ tin giữ nguyên, chỉ đổi cách xếp.
 */
interface SimilarListingsProps {
  properties: PropertyCardProps['property'][];
}

export function SimilarListings({ properties }: SimilarListingsProps) {
  if (!properties || properties.length === 0) return null;

  return (
    <section className="mt-12 border-t border-gray-100 pt-10">
      <h2 className="mb-6 text-[20px] font-extrabold tracking-tight text-gray-900">
        Bất động sản tương tự
      </h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {properties.map((property) => (
          <PropertyCard key={property.slug ?? property.id} property={property} />
        ))}
      </div>
    </section>
  );
}
