'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PropertyCard } from '@/components/property/PropertyCard';
import { ReviewCard } from '@/components/property/ReviewCard';
import { ImageGallery } from '@/components/property/ImageGallery';
import { MapPreview } from '@/components/property/MapPreview';
import { AgentProfile } from '@/components/property/AgentProfile';
import {
  Heart,
  Share2,
  MapPin,
  Bed,
  Bath,
  Square,
  Clock,
  Eye,
  Phone,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Home,
  ArrowRight,
} from 'lucide-react';
import { formatPrice, formatDate, formatDistanceToNow } from '@/lib/formatters';

// Mock property data
const property = {
  id: 1,
  title: 'Căn hộ cho thuê 2PN full nội thất view thành phố',
  slug: 'can-ho-cho-thue-2pn-full-noi-that',
  price: 15000000,
  price_unit: 'month',
  area: 65,
  bedrooms: 2,
  bathrooms: 1,
  floor: 15,
  total_floors: 25,
  direction: 'east',
  legal_doc: 'so_hong_dong',
  address: 'Tầng 15, Chung cư Sunrise City, 23 Nguyễn Hữu Thọ',
  ward: 'Tân Hưng',
  district: 'Quận 7',
  province: 'TP. Hồ Chí Minh',
  description: `Cho thuê căn hộ cao cấp 2 phòng ngủ tại Sunrise City, Quận 7.

🏠 **Thông tin căn hộ:**
- Diện tích: 65m²
- 2 phòng ngủ, 1 phòng tắm
- Full nội thất cao cấp
- View thành phố đẹp
- Tầng 15/25 tầng

🛋️ **Nội thất bao gồm:**
- Sofa da cao cấp
- Tivi 55 inch
- Điều hòa 2 chiều
- Tủ lạnh, máy giặt
- Bếp từ, máy hút mùi
- Giường ngủ 1m6, tủ quần áo

🚗 **Tiện ích:**
- Hồ bơi, phòng gym miễn phí
- An ninh 24/7
- Bãi đỗ xe rộng rãi
- Gần trường học, bệnh viện

💰 **Giá thuê:** 15 triệu/tháng
⚠️ Chưa bao gồm: điện, nước, internet, phí quản lý 3.5 triệu/tháng

📞 Liên hệ để xem nhà!`,
  images: [
    { id: 1, url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200', is_primary: true },
    { id: 2, url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200', is_primary: false },
    { id: 3, url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200', is_primary: false },
    { id: 4, url: 'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=1200', is_primary: false },
    { id: 5, url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200', is_primary: false },
  ],
  features: [
    { id: 1, name: 'Có thang máy' },
    { id: 2, name: 'Có ban công' },
    { id: 3, name: 'Có nội thất' },
    { id: 4, name: 'An ninh 24/7' },
    { id: 5, name: 'Có bãi đỗ xe' },
    { id: 6, name: 'Có hồ bơi' },
    { id: 7, name: 'Có phòng gym' },
    { id: 8, name: 'Gần trường học' },
  ],
  user: {
    id: 101,
    name: 'Nguyễn Văn A',
    avatar: null,
    phone: '0901234567',
    is_agent: true,
    rating: 4.8,
    total_listings: 45,
    joined_at: '2022-01-01',
  },
  coordinates: {
    lat: 10.7291,
    lng: 106.7008,
  },
  status: 'active',
  views: 1234,
  created_at: '2024-01-15',
  updated_at: '2024-01-18',
};

// Mock similar properties
const similarProperties = [
  {
    id: 2,
    title: 'Căn hộ 2PN cho thuê Quận 7, nội thất đẹp',
    slug: 'can-ho-2pn-cho-thue-quan-7',
    price: 14000000,
    price_unit: 'month',
    area: 60,
    bedrooms: 2,
    bathrooms: 1,
    thumbnail: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop',
    address: 'Quận 7, TP. Hồ Chí Minh',
    type: 'apartment',
  },
  {
    id: 3,
    title: 'Căn hộ Studio cho thuê view sông',
    slug: 'can-ho-studio-view-song',
    price: 10000000,
    price_unit: 'month',
    area: 40,
    bedrooms: 1,
    bathrooms: 1,
    thumbnail: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
    address: 'Quận 4, TP. Hồ Chí Minh',
    type: 'apartment',
  },
  {
    id: 4,
    title: 'Cho thuê căn hộ 3PN full đồ, gần trung tâm',
    slug: 'cho-thue-can-ho-3pn-full-do',
    price: 22000000,
    price_unit: 'month',
    area: 95,
    bedrooms: 3,
    bathrooms: 2,
    thumbnail: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&h=300&fit=crop',
    address: 'Quận 7, TP. Hồ Chí Minh',
    type: 'apartment',
  },
];

// Mock reviews
const reviews = [
  {
    id: 1,
    user: { name: 'Khách hàng A', avatar: null },
    rating: 5,
    content: 'Căn hộ rất đẹp, view thoáng, chủ nhà thân thiện. Sẽ thuê lại lần sau!',
    created_at: '2024-01-10',
  },
  {
    id: 2,
    user: { name: 'Khách hàng B', avatar: null },
    rating: 4,
    content: 'Vị trí tốt, gần trung tâm. Nội thất đầy đủ như mô tả.',
    created_at: '2024-01-05',
  },
];

export default function RentDetailPage() {
  const params = useParams();
  const [isSaved, setIsSaved] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const toggleSave = () => setIsSaved(!isSaved);

  const shareProperty = async () => {
    if (navigator.share) {
      await navigator.share({
        title: property.title,
        text: property.description.slice(0, 100),
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Image Gallery Header */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/cho-thue" className="hover:text-blue-600">
              Cho thuê
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/cho-thue/can-ho" className="hover:text-blue-600">
              Căn hộ
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900 line-clamp-1">{property.title}</span>
          </div>

          {/* Main Image */}
          <div
            className="relative aspect-[16/9] rounded-xl overflow-hidden cursor-pointer"
            onClick={() => setShowGallery(true)}
          >
            <img
              src={property.images[0].url}
              alt={property.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 left-4">
              <Badge className="bg-black/70 text-white">
                1 / {property.images.length}
              </Badge>
            </div>
            <Button
              size="icon"
              variant="secondary"
              className="absolute top-4 right-4 bg-white/90"
              onClick={(e) => {
                e.stopPropagation();
                toggleSave();
              }}
            >
              <Heart className={`h-5 w-5 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
          </div>

          {/* Thumbnail Strip */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {property.images.slice(0, 5).map((image, index) => (
              <button
                key={image.id}
                className={`relative flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden ${
                  index === 0 ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => {
                  setCurrentImageIndex(index);
                  setShowGallery(true);
                }}
              >
                <img
                  src={image.url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Price */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <Badge variant="secondary" className="mb-2">
                      CHO THUÊ
                    </Badge>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      {property.title}
                    </h1>
                    <p className="text-gray-500 flex items-center gap-1">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      {property.address}, {property.ward}, {property.district}, {property.province}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={shareProperty}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={isSaved ? 'default' : 'outline'}
                      size="icon"
                      onClick={toggleSave}
                    >
                      <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                    </Button>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Price */}
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-red-600">
                    {formatPrice(property.price)}
                  </span>
                  <span className="text-gray-500">/tháng</span>
                </div>

                {/* Quick Info */}
                <div className="grid grid-cols-4 gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <Bed className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-semibold">{property.bedrooms}</p>
                      <p className="text-xs text-gray-500">Phòng ngủ</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bath className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-semibold">{property.bathrooms}</p>
                      <p className="text-xs text-gray-500">Phòng tắm</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Square className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-semibold">{property.area}m²</p>
                      <p className="text-xs text-gray-500">Diện tích</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Home className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-semibold">{property.floor}/{property.total_floors}</p>
                      <p className="text-xs text-gray-500">Tầng</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">Đặc điểm nổi bật</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {property.features.map((feature) => (
                    <div
                      key={feature.id}
                      className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                    >
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm">{feature.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">Mô tả chi tiết</h2>
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-gray-700">
                    {property.description}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Map */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">Vị trí trên bản đồ</h2>
                <MapPreview
                  lat={property.coordinates.lat}
                  lng={property.coordinates.lng}
                  address={property.address}
                />
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Đánh giá từ khách thuê</h2>
                  <Button variant="outline" size="sm">
                    Viết đánh giá
                  </Button>
                </div>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Agent Card */}
            <AgentProfile
              user={property.user}
              showContact
            />

            {/* Stats */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {property.views} lượt xem
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatDistanceToNow(new Date(property.created_at))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Similar Properties */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Tin tương tự</h3>
                  <Link href="/cho-thue" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                    Xem thêm
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="space-y-4">
                  {similarProperties.map((p) => (
                    <Link key={p.id} href={`/cho-thue/${p.slug}`}>
                      <div className="flex gap-3 hover:bg-gray-50 p-2 rounded-lg transition-colors">
                        <img
                          src={p.thumbnail}
                          alt=""
                          className="w-20 h-16 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm line-clamp-2">{p.title}</p>
                          <p className="text-red-600 font-semibold text-sm">
                            {formatPrice(p.price)}/tháng
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Image Gallery Modal */}
      {showGallery && (
        <ImageGallery
          images={property.images.map(i => i.url)}
          initialIndex={currentImageIndex}
          onClose={() => setShowGallery(false)}
        />
      )}
    </div>
  );
}
