import { PropertyCard } from '@/components/property/PropertyCard';

interface SimilarListingsProps {
  properties: any[];
}

export function SimilarListings({ properties }: SimilarListingsProps) {
  if (!properties || properties.length === 0) return null;

  return (
    <div className="mt-12 pt-10 border-t border-gray-100">
      <h2 className="text-[20px] font-extrabold text-gray-900 mb-6 tracking-tight">Bất động sản tương tự</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {properties.slice(0, 3).map((prop, i) => (
          <PropertyCard key={i} property={prop} />
        ))}
      </div>
    </div>
  );
}
