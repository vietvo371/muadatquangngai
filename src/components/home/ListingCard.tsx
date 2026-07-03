import Image from 'next/image';
import Link from 'next/link';
import { MapPin } from 'lucide-react';

interface ListingCardProps {
  title: string;
  price: string;
  area: string;
  address: string;
  postedAt: string;
  image: string;
  href: string;
  category?: string;
}

export function ListingCard({
  title,
  price,
  area,
  address,
  postedAt,
  image,
  href,
  category,
}: ListingCardProps) {
  return (
    <Link
      href={href}
      className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 border border-gray-100 flex flex-col"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          referrerPolicy="no-referrer"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        {category && (
          <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium px-2 py-0.5 rounded-md shadow-sm">
            {category}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3.5 flex flex-col gap-1.5 flex-1">
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">
          {title}
        </h3>
        <p className="text-cta font-bold text-sm">
          {price} <span className="text-gray-400 font-normal">·</span> {area}
        </p>
        <div className="flex items-start gap-1 text-xs text-gray-500">
          <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
          <span className="line-clamp-1">{address}</span>
        </div>
        <p className="text-xs text-gray-400 mt-auto pt-2 border-t border-gray-50">
          {postedAt}
        </p>
      </div>
    </Link>
  );
}
