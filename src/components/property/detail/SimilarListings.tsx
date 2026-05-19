import { PropertyCard } from '@/components/property/PropertyCard';

interface SimilarListingsProps {
  properties: any[];
}

export function SimilarListings({ properties }: SimilarListingsProps) {
  if (!properties || properties.length === 0) return null;

  return (
    <div className="mt-12 pt-10 border-t border-gray-100">
      <h2 className="text-[20px] font-extrabold text-gray-900 mb-6 tracking-tight">Bất động sản tương tự</h2>
      <div className="flex overflow-x-auto gap-5 pb-4 snap-x snap-mandatory hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {properties.map((prop, i) => (
          <div key={i} className="min-w-[280px] sm:min-w-[320px] max-w-[320px] snap-start shrink-0">
            <PropertyCard property={prop} />
          </div>
        ))}
      </div>
    </div>
  );
}
