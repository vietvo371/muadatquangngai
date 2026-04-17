import Image from 'next/image';
import Link from 'next/link';
import { MapPin, ArrowRight } from 'lucide-react';

interface ProjectCardProps {
  name: string;
  area: string;
  address: string;
  status: string;
  image: string;
  slug: string;
  developer?: string;
}

export function ProjectCard({
  name,
  area,
  address,
  status,
  image,
  slug,
  developer,
}: ProjectCardProps) {
  return (
    <Link
      href={`/du-an/${slug}`}
      className="group md:flex rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 bg-white border border-gray-100"
    >
      {/* Image */}
      <div className="relative h-60 md:h-auto md:w-2/5 shrink-0 overflow-hidden">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, 40vw"
        />
        {/* Status badge */}
        <span className="absolute top-3 left-3 flex items-center gap-1.5 bg-primary text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          {status}
        </span>
      </div>

      {/* Info */}
      <div className="p-5 md:p-6 flex flex-col justify-between bg-white flex-1">
        <div>
          <h3 className="text-lg font-bold text-gray-900 leading-snug mb-3 group-hover:text-primary transition-colors">
            {name}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <span className="bg-primary-light text-primary text-xs font-medium px-2 py-0.5 rounded-md">
              {area}
            </span>
          </div>
          <div className="flex items-start gap-1.5 text-sm text-gray-500">
            <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-gray-400" />
            <span>{address}</span>
          </div>
          {developer && (
            <p className="text-xs text-gray-400 mt-2">Chủ đầu tư: {developer}</p>
          )}
        </div>
        <div className="flex items-center gap-1 text-sm font-semibold text-primary mt-4 group-hover:gap-2 transition-all">
          Xem chi tiết <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  );
}
