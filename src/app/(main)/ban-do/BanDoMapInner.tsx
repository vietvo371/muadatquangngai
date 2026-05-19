'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Search,
  MapPin,
  Home,
  X,
  List,
  ChevronLeft,
} from 'lucide-react';
import api from '@/lib/axios';
import { formatPrice } from '@/lib/formatters';

interface PropertyMapItem {
  id: number;
  slug: string;
  title: string;
  price: number;
  price_display?: string;
  address?: string;
  thumbnail?: string;
  is_vip?: string;
  type?: string;
  category?: { name: string };
}

interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export default function BanDoMapInner() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [properties, setProperties] = useState<PropertyMapItem[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<PropertyMapItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: 'sale',
    price_min: 0,
    price_max: 0,
    category_id: undefined as number | undefined,
  });

  const fetchProperties = useCallback(async (bounds?: MapBounds) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        limit: 50,
        page: currentPage,
        ...filters,
      };
      if (bounds) {
        params.north = bounds.north;
        params.south = bounds.south;
        params.east = bounds.east;
        params.west = bounds.west;
      }
      if (searchQuery) params.q = searchQuery;

      const res = await api.get('/properties', { params });
      const data = res.data?.data || [];
      setProperties(data);
    } catch (err) {
      console.error('Map fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, searchQuery]);

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (!isMounted || !mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [15.1212, 108.7922],
      zoom: 12,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    map.on('moveend', () => {
      const bounds = map.getBounds();
      fetchProperties({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      });
    });

    mapInstanceRef.current = map;
    fetchProperties();

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [isMounted, fetchProperties]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    properties.forEach((property) => {
      const map = mapInstanceRef.current!;
      const bounds = map.getBounds();
      const lat = bounds.getSouth() + Math.random() * (bounds.getNorth() - bounds.getSouth());
      const lng = bounds.getWest() + Math.random() * (bounds.getEast() - bounds.getWest());
      const isVip = property.is_vip && property.is_vip !== 'normal';
      const color = isVip ? '#e03131' : '#1075b1';

      const iconHtml = `<div style="background:${color};color:white;padding:4px 8px;border-radius:6px;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.2);position:relative">${property.price_display || formatPrice(property.price)}<div style="position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:6px solid ${color}"></div></div>`;

      const icon = L.divIcon({
        html: iconHtml,
        className: '',
        iconSize: [80, 30],
        iconAnchor: [40, 30],
      });

      const marker = L.marker([lat, lng], { icon })
        .addTo(map)
        .on('click', () => setSelectedProperty(property));

      markersRef.current.push(marker);
    });
  }, [properties]);

  return (
    <>
      {/* Top toolbar */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 z-10 relative">
        <Link href="/mua-ban">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Quay lai
          </Button>
        </Link>

        <div className="flex-1 flex gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tim kiem tren ban do..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          <div className="flex rounded-lg border overflow-hidden">
            <Link href="/mua-ban">
              <button
                onClick={() => setFilters((f) => ({ ...f, type: 'sale' }))}
                className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                  filters.type === 'sale' ? 'bg-primary text-white' : 'bg-white text-gray-600'
                }`}
              >
                Mua ban
              </button>
            </Link>
            <Link href="/cho-thue">
              <button
                onClick={() => setFilters((f) => ({ ...f, type: 'rent' }))}
                className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                  filters.type === 'rent' ? 'bg-primary text-white' : 'bg-white text-gray-600'
                }`}
              >
                Cho thue
              </button>
            </Link>
          </div>

          <Button variant="outline" size="sm" onClick={() => setFilterOpen(true)} className="gap-1.5">
            <List className="h-4 w-4" />
            Bo loc
          </Button>
        </div>

        <span className="text-sm text-gray-500 shrink-0">{properties.length} tin dang</span>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {isMounted ? (
          <div ref={mapRef} className="absolute inset-0" />
        ) : (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <p className="text-gray-500">Dang tai ban do...</p>
          </div>
        )}

        {/* Property popup */}
        {selectedProperty && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-80">
            <Card className="shadow-2xl overflow-hidden">
              <button
                onClick={() => setSelectedProperty(null)}
                className="absolute top-2 right-2 p-1 bg-white/80 rounded-full hover:bg-white z-10"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
              {selectedProperty.thumbnail && (
                <div className="relative h-36">
                  <Image src={selectedProperty.thumbnail} alt={selectedProperty.title} fill className="object-cover" />
                  {selectedProperty.is_vip && selectedProperty.is_vip !== 'normal' && (
                    <Badge className="absolute top-2 left-2 bg-cta text-white">VIP</Badge>
                  )}
                </div>
              )}
              <CardContent className="p-3">
                <p className="font-bold text-sm text-gray-900 line-clamp-2 mb-1">{selectedProperty.title}</p>
                <p className="text-cta font-bold text-base mb-1">
                  {selectedProperty.price_display || formatPrice(selectedProperty.price)}
                </p>
                {selectedProperty.address && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                    <MapPin className="h-3 w-3" />{selectedProperty.address}
                  </p>
                )}
                <Link href={`/${selectedProperty.type === 'sale' ? 'mua-ban' : 'cho-thue'}/${selectedProperty.slug}`}>
                  <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-white">
                    <Home className="h-3.5 w-3.5 mr-1" />Xem chi tiet
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}

        {loading && (
          <div className="absolute top-4 right-4 z-[1000]">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Filter Sheet */}
      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="right" className="w-80">
          <SheetHeader>
            <SheetTitle>Bo loc</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Loai bat dong san</p>
              <div className="flex gap-2">
                {(['sale', 'rent'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilters((f) => ({ ...f, type }))}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                      filters.type === type
                        ? 'bg-primary text-white border-primary'
                        : 'border-gray-200 text-gray-600 hover:border-primary'
                    }`}
                  >
                    {type === 'sale' ? 'Mua ban' : 'Cho thue'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={() => { setFilterOpen(false); fetchProperties(); }}>
                Ap dung
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
