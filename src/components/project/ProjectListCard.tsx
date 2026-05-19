'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Building, Calendar, Home, MapPin } from 'lucide-react';
import { formatPrice } from '@/lib/formatters';

interface ProjectListCardStatus {
  label: string;
  bg: string;
  text: string;
  dot: string;
}

interface ProjectListCardData {
  id: string;
  slug: string;
  name: string;
  developer: string;
  thumbnail: string;
  address: string;
  priceFrom: number;
  priceTo?: number;
  totalUnits: number;
  totalBlocks: number;
  totalFloors: number;
  handoverDate: string;
  description: string;
  area: string;
}

interface ProjectListCardProps {
  project: ProjectListCardData;
  status: ProjectListCardStatus;
  typeLabel: string;
}

export function ProjectListCard({
  project,
  status,
  typeLabel,
}: ProjectListCardProps) {
  return (
    <Link href={`/du-an/${project.slug}`}>
      <article className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all hover:border-primary/20 hover:-translate-y-0.5 hover:shadow-xl sm:flex-row">
        <div className="relative h-52 shrink-0 sm:h-auto sm:w-64 md:w-72 overflow-hidden">
          <Image
            src={project.thumbnail}
            alt={project.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, 288px"
          />
          <div className={`absolute top-3 left-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${status.bg} ${status.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-between gap-3 p-4 md:p-5">
          <div>
            <div className="mb-1 flex items-start justify-between gap-2">
              <h2 className="line-clamp-2 text-base font-bold leading-snug text-gray-900 transition-colors group-hover:text-primary md:text-lg">
                {project.name}
              </h2>
              <span className="mt-0.5 shrink-0 rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                {typeLabel}
              </span>
            </div>
            <div className="mb-2 flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="line-clamp-1">{project.address}</span>
            </div>
            <p className="line-clamp-2 text-sm leading-relaxed text-gray-500">
              {project.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-1.5 border-t border-gray-50 pt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Building className="h-3.5 w-3.5 text-gray-400" />
              {project.totalBlocks} block · {project.totalFloors} tầng
            </span>
            <span className="flex items-center gap-1">
              <Home className="h-3.5 w-3.5 text-gray-400" />
              {project.totalUnits} căn
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              Bàn giao {new Date(project.handoverDate).getFullYear()}
            </span>
            <span className="text-gray-400">Quy mô {project.area}</span>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-gray-400">Giá từ</p>
              <p className="text-base font-bold text-primary">
                {formatPrice(project.priceFrom)}
                {project.priceTo && (
                  <span className="ml-1 text-sm font-normal text-gray-400">
                    – {formatPrice(project.priceTo)}
                  </span>
                )}
              </p>
            </div>
            <p className="line-clamp-1 max-w-[160px] text-right text-xs text-gray-400">
              {project.developer}
            </p>
          </div>
        </div>
      </article>
    </Link>
  );
}
