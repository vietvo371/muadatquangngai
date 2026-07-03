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
  Search,
  MapPin,
  Home,
  X,
  List,
  ChevronLeft,
  SlidersHorizontal,
  Map as MapIcon
} from 'lucide-react';
import api from '@/lib/axios';
import { formatPrice } from '@/lib/formatters';
import { CONFIG } from '@/lib/config';

interface PropertyMapItem {
  id: number;
  slug: string;
  title: string;
  price: number;
  price_display?: string;
  area?: number;
  bedrooms?: number;
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
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: 'sale',
    price_min: 0,
    price_max: 0,
    category_id: undefined as number | undefined,
  });
  
  // Mobile view state (list vs map)
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map');

  const fetchProperties = useCallback(async (bounds?: MapBounds) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        limit: 50,
        type: filters.type,
      };
      // Chỉ gửi filter giá khi người dùng đã chọn — gửi price_max=0 sẽ lọc hết kết quả
      if (filters.price_min > 0) params.price_min = filters.price_min;
      if (filters.price_max > 0) params.price_max = filters.price_max;
      if (filters.category_id) params.category_id = filters.category_id;
      if (bounds) {
        params.north = bounds.north;
        params.south = bounds.south;
        params.east = bounds.east;
        params.west = bounds.west;
      }
      if (searchQuery) params.q = searchQuery;

      const res = await api.get('/api/properties', { params });
      const data = res.data?.data || [];
      setProperties(data);
    } catch (err) {
      console.error('Map fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, searchQuery]);

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (!isMounted || !mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [15.1212, 108.7922], // Quang Ngai
      zoom: 13,
      zoomControl: false, // We'll add it later or rely on default
    });
    
    L.control.zoom({
      position: 'bottomright'
    }).addTo(map);

    // Using a cleaner map tile style
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
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
      // Generate random lat/lng within bounds just for mock data if needed, 
      // but ideally use real lat/lng from property
      const lat = bounds.getSouth() + Math.random() * (bounds.getNorth() - bounds.getSouth());
      const lng = bounds.getWest() + Math.random() * (bounds.getEast() - bounds.getWest());
      
      const isVip = CONFIG.enableVip && property.is_vip && property.is_vip !== 'normal';
      
      // Modern Custom Marker
      const color = isVip ? '#e03131' : '#0ea5e9';
      const bgColor = isVip ? '#e03131' : '#0ea5e9';
      const priceText = property.price_display || formatPrice(property.price, 'total');
      
      const iconHtml = `
        <div class="relative group cursor-pointer">
          <div class="px-3 py-1.5 bg-[${bgColor}] text-white text-xs font-bold rounded-lg shadow-md whitespace-nowrap transition-transform transform group-hover:scale-110 flex items-center gap-1" style="background-color: ${bgColor};">
            ${isVip ? '<span class="text-[10px]">⭐</span>' : ''}
            ${priceText}
          </div>
          <div class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[${bgColor}] transform rotate-45 transition-transform group-hover:scale-110" style="background-color: ${bgColor}; z-index: -1;"></div>
        </div>
      `;

      const icon = L.divIcon({
        html: iconHtml,
        className: 'bg-transparent border-0',
        iconSize: [80, 40],
        iconAnchor: [40, 40],
      });

      const marker = L.marker([lat, lng], { icon })
        .addTo(map)
        .on('click', () => {
          setSelectedProperty(property);
          setMobileView('map');
        });

      markersRef.current.push(marker);
    });
  }, [properties]);

  const handlePropertyHover = (propId: number) => {
    // We could highlight the marker here
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-white overflow-hidden">
      {/* Top Search Bar */}
      <div className="h-16 border-b border-gray-100 flex items-center justify-between px-4 bg-white z-20 shrink-0 shadow-sm">
        <div className="flex items-center gap-4 flex-1">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 text-gray-500 hover:text-primary hover:bg-primary-light/10">
              <ChevronLeft className="h-6 w-6" />
            </Button>
          </Link>

          <div className="relative max-w-md w-full hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm khu vực, dự án..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-gray-50 border-transparent focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary rounded-full w-full"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex bg-gray-50 p-1 rounded-full border border-gray-100">
            <button
              onClick={() => setFilters((f) => ({ ...f, type: 'sale' }))}
              className={`px-4 py-1.5 text-[13px] font-bold rounded-full transition-all ${
                filters.type === 'sale' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Mua bán
            </button>
            <button
              onClick={() => setFilters((f) => ({ ...f, type: 'rent' }))}
              className={`px-4 py-1.5 text-[13px] font-bold rounded-full transition-all ${
                filters.type === 'rent' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Cho thuê
            </button>
          </div>

          <Button variant="outline" className="h-10 rounded-full font-bold gap-2 text-gray-600">
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Bộ lọc</span>
          </Button>
        </div>
      </div>

      {/* Main Content: Split Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Side: Property List */}
        <div className={`w-full lg:w-[450px] flex-shrink-0 bg-white flex flex-col h-full border-r border-gray-100 z-10 transition-transform duration-300 absolute lg:relative ${
          mobileView === 'list' ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
          <div className="p-4 border-b border-gray-50 shrink-0 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Kết quả bản đồ</h2>
              <p className="text-sm text-gray-500">{properties.length} bất động sản</p>
            </div>
            
            {/* Mobile View Toggle */}
            <Button 
              variant="outline" 
              size="sm" 
              className="lg:hidden rounded-full font-bold gap-2"
              onClick={() => setMobileView('map')}
            >
              <MapIcon className="h-4 w-4 text-primary" />
              Xem Bản Đồ
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
            {properties.map((property) => (
              <div 
                key={property.id} 
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer flex flex-row h-32 group"
                onClick={() => setSelectedProperty(property)}
                onMouseEnter={() => handlePropertyHover(property.id)}
              >
                <div className="w-32 h-full shrink-0 relative overflow-hidden bg-gray-100">
                  {property.thumbnail ? (
                    <img src={property.thumbnail} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px]">No Image</div>
                  )}
                  {CONFIG.enableVip && property.is_vip && property.is_vip !== 'normal' && (
                    <Badge className="absolute top-2 left-2 bg-cta text-white border-0 text-[9px] uppercase px-1.5 py-0 scale-90 origin-top-left font-bold shadow-sm">
                      {property.is_vip === 'diamond' ? '★ VIP' : 'VIP+'}
                    </Badge>
                  )}
                </div>
                
                <div className="p-3 flex flex-col justify-between flex-1 min-w-0">
                  <div>
                    <h3 className="font-bold text-gray-900 text-[13px] line-clamp-2 mb-1 group-hover:text-primary transition-colors leading-snug">
                      {property.title}
                    </h3>
                    {property.address && (
                      <p className="text-[11px] text-gray-500 truncate flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {property.address}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-end justify-between mt-1">
                    <p className="text-[15px] font-extrabold text-[#e03131]">
                      {property.price_display || formatPrice(property.price)}
                    </p>
                    <div className="flex gap-2 text-[11px] font-medium text-gray-500">
                      {property.area && <span>{property.area}m²</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {properties.length === 0 && !loading && (
              <div className="text-center py-12">
                <p className="text-gray-500">Không tìm thấy bất động sản nào trong khu vực này.</p>
              </div>
            )}
            
            {loading && (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Map */}
        <div className={`flex-1 relative transition-transform duration-300 ${
          mobileView === 'map' ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}>
          {isMounted ? (
            <div ref={mapRef} className="absolute inset-0 z-0" />
          ) : (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Mobile Map Top Controls */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 lg:hidden flex gap-2 w-[90%] justify-center">
            <Button 
              variant="default" 
              className="rounded-full shadow-lg font-bold bg-white text-gray-900 hover:bg-gray-50 border-2 border-primary"
              onClick={() => setMobileView('list')}
            >
              <List className="h-4 w-4 text-primary mr-2" />
              Xem Danh Sách
            </Button>
          </div>

          {/* Map Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
            {/* Custom map controls can go here */}
          </div>

          {/* Property Popup Card overlay on map */}
          {selectedProperty && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 lg:bottom-8 lg:left-8 lg:translate-x-0 z-[1000] w-[90%] sm:w-80">
              <Card className="shadow-2xl overflow-hidden rounded-2xl border-0 animate-in slide-in-from-bottom-4 duration-300">
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedProperty(null); }}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 z-10 backdrop-blur-sm transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
                
                {selectedProperty.thumbnail && (
                  <div className="relative h-40 w-full">
                    <img 
                      src={selectedProperty.thumbnail} 
                      alt={selectedProperty.title} 
                      className="w-full h-full object-cover" 
                    />
                    {CONFIG.enableVip && selectedProperty.is_vip && selectedProperty.is_vip !== 'normal' && (
                      <Badge className="absolute top-3 left-3 bg-cta text-white font-bold tracking-wide uppercase border-0 shadow-sm">
                        VIP
                      </Badge>
                    )}
                    <Badge className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white font-medium border-0">
                      {selectedProperty.type === 'sale' ? 'Bán' : 'Cho thuê'}
                    </Badge>
                  </div>
                )}
                
                <CardContent className="p-4">
                  <p className="font-bold text-gray-900 line-clamp-2 mb-1 leading-snug">
                    {selectedProperty.title}
                  </p>
                  <div className="flex items-end justify-between mt-2 mb-3">
                    <p className="text-[#e03131] font-extrabold text-lg">
                      {selectedProperty.price_display || formatPrice(selectedProperty.price)}
                    </p>
                    <p className="text-[13px] font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded">
                      {selectedProperty.area ? `${selectedProperty.area}m²` : '--'}
                    </p>
                  </div>
                  
                  <Link href={`/${selectedProperty.type === 'sale' ? 'mua-ban' : 'cho-thue'}/${selectedProperty.slug}`}>
                    <Button className="w-full bg-gray-900 hover:bg-black text-white font-bold h-10 rounded-xl">
                      Xem chi tiết
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
