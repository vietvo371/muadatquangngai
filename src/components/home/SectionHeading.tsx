import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  centered?: boolean;
}

export function SectionHeading({
  title,
  subtitle,
  href,
  linkLabel = 'Xem thêm',
  centered = false,
}: SectionHeadingProps) {
  return (
    <div
      className={`flex items-end justify-between mb-6 md:mb-8 ${
        centered ? 'flex-col items-center text-center gap-2' : ''
      }`}
    >
      <div>
        <div className="w-8 h-1 bg-primary rounded-full mb-3" />
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 leading-snug">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="text-sm font-medium text-primary hover:text-primary-dark flex items-center gap-0.5 shrink-0 transition-colors"
        >
          {linkLabel}
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
