import { FilterState } from '@/components/search/FilterSidebar';
import { formatPrice } from '@/lib/formatters';

export interface FilterableProperty {
  id: string;
  title: string;
  price: number;
  area: number;
  category: string;
  location: string;
  bedrooms: number;
}

/** Extract district name from "TP Quảng Ngãi, Trần Phú" format */
export function extractDistrict(location: string): string {
  return location.split(',')[0]?.trim() ?? '';
}

/** Filter properties based on FilterState */
export function filterProperties<T extends FilterableProperty>(
  properties: T[],
  filters: FilterState
): T[] {
  return properties.filter(p => {
    // Types filter
    if (filters.types.length > 0 && !filters.types.includes(p.category)) {
      return false;
    }

    // District filter
    if (filters.district && extractDistrict(p.location) !== filters.district) {
      return false;
    }

    // Price filter
    if (filters.priceMin !== '' && p.price < filters.priceMin) return false;
    if (filters.priceMax !== '' && p.price > filters.priceMax) return false;

    // Area filter
    if (filters.areaMin !== '' && p.area < filters.areaMin) return false;
    if (filters.areaMax !== '' && p.area > filters.areaMax) return false;

    // Bedrooms filter
    if (filters.bedrooms !== 'any') {
      const bedCount = parseInt(filters.bedrooms, 10);
      if (filters.bedrooms === '4+') {
        if (p.bedrooms < 4) return false;
      } else if (p.bedrooms !== bedCount) {
        return false;
      }
    }

    return true;
  });
}

export interface FilterTag {
  id: string;
  label: string;
}

/** Build active filter tags from filter state */
export function buildFilterTags(filters: FilterState): FilterTag[] {
  const tags: FilterTag[] = [];

  filters.types.forEach(t => tags.push({ id: `type-${t}`, label: t }));

  if (filters.district) {
    tags.push({ id: 'district', label: `Khu vực: ${filters.district}` });
  }

  if (filters.priceMin !== '' || filters.priceMax !== '') {
    const minVal = filters.priceMin !== '' ? filters.priceMin : undefined;
    const maxVal = filters.priceMax !== '' ? filters.priceMax : undefined;
    const minLabel = minVal ? formatPrice(minVal) : '0';
    const maxLabel = maxVal ? formatPrice(maxVal) : '∞';
    tags.push({ id: 'price', label: `Giá: ${minLabel} - ${maxLabel}` });
  }

  if (filters.areaMin !== '' || filters.areaMax !== '') {
    const minStr = filters.areaMin !== '' ? `${filters.areaMin}m²` : '0';
    const maxStr = filters.areaMax !== '' ? `${filters.areaMax}m²` : '∞';
    tags.push({ id: 'area', label: `Diện tích: ${minStr} - ${maxStr}` });
  }

  if (filters.bedrooms !== 'any') {
    tags.push({ id: 'bedrooms', label: `${filters.bedrooms} PN` });
  }

  return tags;
}

/** Remove a specific filter tag by its ID, returning the partial update */
export function removeTag(
  filters: FilterState,
  tagId: string
): Partial<FilterState> {
  if (tagId.startsWith('type-')) {
    const typeName = tagId.replace('type-', '');
    return { types: filters.types.filter(t => t !== typeName) };
  }
  if (tagId === 'district') return { district: '' };
  if (tagId === 'price') return { priceMin: '', priceMax: '' };
  if (tagId === 'area') return { areaMin: '', areaMax: '' };
  if (tagId === 'bedrooms') return { bedrooms: 'any' };
  return {};
}
