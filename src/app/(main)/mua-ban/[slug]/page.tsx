'use client';

import { useState } from 'react';
import Link from 'next/link';
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
  X,
  User,
  Calendar,
  CheckCircle,
  Building2,
  Home
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatPrice, formatArea, formatDirection } from '@/lib/formatters';

// Mock property data
const property = {
  id: '1',
  uuid: 'abc-123',
  slug: 'can-ho-cao-cap-2pn-view-bien-my-khe',
  title: 'Căn hộ cao cấp 2PN view biển Mỹ Khê - Đầy đủ nội thất cao cấp',
  type: 'sale',
  status: 'active',
  isVip: 'vip',
  price: 2800000000,
  priceUnit: 'total',
  priceNegotiable: true,
  area: 75,
  areaFloor: 80,
  bedrooms: 2,
  bathrooms: 2,
  floors: 1,
  direction: 'dong_nam',
  furniture: 'full',
  legal: 'so_hong',
  legalNote: 'Sổ hồng chính chủ, đã có thế chấp ngân hàng',
  roadWidth: 20,
  description: `Căn hộ cao cấp 2 phòng ngủ view biển Mỹ Khê, vị trí đắc địa ngay trung tâm quận Sơn Trà.

**Đặc điểm:**
- Diện tích: 75m² (2PN, 2WC)
- Tầng cao, view biển thoáng mát
- Nội thất cao cấp: giường, tủ, bàn ghế, điều hòa, tivi
- Ban công rộng rãi, có máy giặt riêng

**Tiện ích:**
- Hồ bơi, phòng gym, spa
- Bảo vệ 24/7, camera an ninh
- Gần trường học, bệnh viện, siêu thị
- Cách bãi biển 5 phút đi bộ

**Pháp lý:**
- Sổ hồng chính chủ
- Không thế chấp ngân hàng
- Có thể sang tên ngay`,
  thumbnail: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=800&fit=crop',
  media: [
    { id: '1', url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=800&fit=crop', isPrimary: true },
    { id: '2', url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=800&fit=crop', isPrimary: false },
    { id: '3', url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&h=800&fit=crop', isPrimary: false },
    { id: '4', url: 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=1200&h=800&fit=crop', isPrimary: false },
    { id: '5', url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&h=800&fit=crop', isPrimary: false },
  ],
  address: '123 Đường Võ Nguyên Giáp, Phường Mỹ An, Quận Sơn Trà, Đà Nẵng',
  viewCount: 1234,
  contactCount: 45,
  publishedAt: '2024-01-15',
  category: { id: 1, name: 'Căn hộ', slug: 'can-ho' },
  province: { id: 1, name: 'Đà Nẵng' },
  district: { id: 1, name: 'Sơn Trà' },
  ward: { id: 1, name: 'Mỹ An' },
  user: {
    id: 1,
    name: 'Nguyễn Văn A',
    avatar: null,
    phone: '0901234567',
    email: 'nguyenvana@email.com',
    role: 'agent',
    totalListings: 45,
    rating: 4.8,
    reviewCount: 23,
    zalo: '0901234567',
    facebook: 'https://facebook.com/nguyenvana',
  },
  features: [
    { id: 1, name: 'Hồ bơi' },
    { id: 2, name: 'Gym' },
    { id: 3, name: 'Bảo vệ 24/7' },
    { id: 4, name: 'Camera' },
    { id: 5, name: 'Thang máy' },
    { id: 6, name: 'Điều hòa' },
  ],
};

const similarProperties = [
  {
    id: '2',
    title: 'Căn hộ 2PN Vincom Đà Nẵng',
    slug: 'can-ho-2pn-vincom-da-nang',
    price: 2200000000,
    priceUnit: 'total',
    area: 70,
    thumbnail: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop',
    location: 'Đà Nẵng, Sơn Trà',
    bedrooms: 2,
    bathrooms: 2,
    isVip: 'normal',
    user: { name: 'Trần Văn B', avatar: null },
  },
  {
    id: '3',
    title: 'Căn hộ cao cấp 3PN view biển',
    slug: 'can-ho-cao-cap-3pn-view-bien',
    price: 4500000000,
    priceUnit: 'total',
    area: 120,
    thumbnail: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop',
    location: 'Đà Nẵng, Mỹ An',
    bedrooms: 3,
    bathrooms: 2,
    isVip: 'vip',
    user: { name: 'Lê Thị C', avatar: null },
  },
  {
    id: '4',
    title: 'Căn hộ Goldmark City 2PN',
    slug: 'can-ho-goldmark-city-2pn',
    price: 1800000000,
    priceUnit: 'total',
    area: 68,
    thumbnail: 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=600&h=400&fit=crop',
    location: 'Đà Nẵng, Liên Chiểu',
    bedrooms: 2,
    bathrooms: 1,
    isVip: 'normal',
    user: { name: 'Phạm Văn D', avatar: null },
  },
];

export default function PropertyDetailPage({ params }: { params: { slug: string } }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', phone: '', email: '', message: '' });

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % property.media.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + property.media.length) % property.media.length);
  };

  const handleContact = () => {
    // TODO: Submit contact form
    console.log('Contact:', contactForm);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-primary">Trang chủ</Link>
            <span>/</span>
            <Link href="/mua-ban" className="hover:text-primary">Mua bán</Link>
            <span>/</span>
            <Link href={`/mua-ban/${property.category.slug}`} className="hover:text-primary">
              {property.category.name}
            </Link>
            <span>/</span>
            <span className="text-gray-900 truncate">{property.title}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gallery */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm">
              <div className="relative aspect-[16/10]">
                <img
                  src={property.media[currentImageIndex].url}
                  alt={property.title}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setIsGalleryOpen(true)}
                />
                
                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  {property.isVip !== 'normal' && (
                    <Badge className={
                      property.isVip === 'vip' ? 'bg-yellow-500' :
                      property.isVip === 'vip_plus' ? 'bg-orange-500' : 'bg-gradient-to-r from-blue-600 to-purple-600'
                    }>
                      {property.isVip === 'vip' && 'VIP'}
                      {property.isVip === 'vip_plus' && 'VIP+'}
                      {property.isVip === 'diamond' && '★ VIP'}
                    </Badge>
                  )}
                  <Badge className={property.type === 'sale' ? 'bg-primary' : 'bg-green-600'}>
                    {property.type === 'sale' ? 'Bán' : 'Cho thuê'}
                  </Badge>
                </div>

                {/* Navigation */}
                {property.media.length > 1 && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); prevImage(); }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); nextImage(); }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}

                {/* Image count */}
                <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/60 text-white text-sm rounded-lg">
                  {currentImageIndex + 1} / {property.media.length}
                </div>

                {/* Actions */}
                <div className="absolute bottom-4 left-4 flex gap-2">
                  <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className={`px-4 py-2 bg-white/90 hover:bg-white rounded-lg flex items-center gap-2 shadow-lg transition-colors ${
                      isFavorite ? 'text-red-500' : 'text-gray-600'
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                    <span className="text-sm">Lưu</span>
                  </button>
                  <button className="px-4 py-2 bg-white/90 hover:bg-white rounded-lg flex items-center gap-2 text-gray-600 shadow-lg">
                    <Share2 className="h-5 w-5" />
                    <span className="text-sm">Chia sẻ</span>
                  </button>
                </div>
              </div>

              {/* Thumbnails */}
              <div className="p-4">
                <div className="flex gap-2 overflow-x-auto">
                  {property.media.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                        index === currentImageIndex ? 'border-primary' : 'border-transparent'
                      }`}
                    >
                      <img src={image.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Property Info */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{property.title}</h1>
                    <div className="flex items-center gap-2 text-gray-500">
                      <MapPin className="h-4 w-4" />
                      <span>{property.address}</span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 text-sm text-gray-500 pb-4 border-b">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {property.viewCount} lượt xem
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {property.publishedAt}
                  </span>
                </div>

                {/* Price */}
                <div className="py-4 border-b">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-red-600">
                      {formatPrice(property.price, property.priceUnit)}
                    </span>
                    {property.priceNegotiable && (
                      <Badge variant="secondary">Có thể thương lượng</Badge>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-b">
                  <div className="flex items-center gap-2">
                    <Square className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Diện tích</p>
                      <p className="font-medium">{formatArea(property.area)}</p>
                    </div>
                  </div>
                  {property.bedrooms && (
                    <div className="flex items-center gap-2">
                      <Bed className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Phòng ngủ</p>
                        <p className="font-medium">{property.bedrooms}</p>
                      </div>
                    </div>
                  )}
                  {property.bathrooms && (
                    <div className="flex items-center gap-2">
                      <Bath className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Phòng tắm</p>
                        <p className="font-medium">{property.bathrooms}</p>
                      </div>
                    </div>
                  )}
                  {property.direction && (
                    <div className="flex items-center gap-2">
                      <Home className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Hướng</p>
                        <p className="font-medium">{formatDirection(property.direction)}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="py-4">
                  <h2 className="font-semibold text-gray-900 mb-3">Mô tả</h2>
                  <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-line">
                    {property.description}
                  </div>
                </div>

                {/* Features */}
                {property.features.length > 0 && (
                  <div className="py-4 border-t">
                    <h2 className="font-semibold text-gray-900 mb-3">Tiện ích</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {property.features.map((feature) => (
                        <div key={feature.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                          <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="text-sm">{feature.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Legal */}
                {property.legal && (
                  <div className="py-4 border-t">
                    <h2 className="font-semibold text-gray-900 mb-3">Pháp lý</h2>
                    <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-800">
                          {property.legal === 'so_do' ? 'Sổ đỏ' : 
                           property.legal === 'so_hong' ? 'Sổ hồng' : 
                           property.legal === 'contract' ? 'Hợp đồng' : 'Khác'}
                        </p>
                        {property.legalNote && (
                          <p className="text-sm text-green-700 mt-1">{property.legalNote}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Agent Card */}
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={property.user.avatar || undefined} />
                    <AvatarFallback>
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{property.user.name}</p>
                      {property.user.role === 'agent' && (
                        <Badge variant="secondary" className="text-xs">Môi giới</Badge>
                      )}
                    </div>
                    {property.user.rating && (
                      <div className="flex items-center gap-1 text-sm">
                        <span className="text-yellow-500">★</span>
                        <span className="font-medium">{property.user.rating}</span>
                        <span className="text-gray-500">({property.user.reviewCount} đánh giá)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Buttons */}
                <div className="space-y-3">
                  <a href={`tel:${property.user.phone}`}>
                    <Button className="w-full bg-primary hover:bg-primary-dark gap-2">
                      <Phone className="h-4 w-4" />
                      {property.user.phone}
                    </Button>
                  </a>
                  <Button 
                    variant="outline" 
                    className="w-full gap-2"
                    onClick={() => setShowContactForm(!showContactForm)}
                  >
                    <MessageSquare className="h-4 w-4" />
                    Gửi tin nhắn
                  </Button>
                  <a href={`https://zalo.me/${property.user.zalo}`} target="_blank">
                    <Button variant="outline" className="w-full gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Zalo
                    </Button>
                  </a>
                </div>

                {/* Contact Form */}
                {showContactForm && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <Input
                      placeholder="Họ tên"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                    />
                    <Input
                      placeholder="Số điện thoại"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
                    />
                    <textarea
                      placeholder="Tin nhắn..."
                      className="w-full p-3 border rounded-lg text-sm"
                      rows={3}
                      value={contactForm.message}
                      onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                    />
                    <Button className="w-full" onClick={handleContact}>
                      Gửi liên hệ
                    </Button>
                  </div>
                )}

                {/* Agent Stats */}
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{property.user.totalListings}</p>
                      <p className="text-sm text-gray-500">Tin đăng</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{property.user.rating}</p>
                      <p className="text-sm text-gray-500">Đánh giá</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Similar Properties */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Tin tương tự</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {similarProperties.map((p) => (
              <Link 
                key={p.id} 
                href={`/mua-ban/${p.slug}`}
                className="block bg-white rounded-xl overflow-hidden border hover:shadow-lg transition-shadow"
              >
                <div className="aspect-[4/3] relative">
                  <img src={p.thumbnail} alt={p.title} className="w-full h-full object-cover" />
                  {p.isVip !== 'normal' && (
                    <Badge className="absolute top-3 left-3 bg-yellow-500">
                      {p.isVip === 'vip' && 'VIP'}
                    </Badge>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-lg font-bold text-red-600">
                    {formatPrice(p.price, p.priceUnit)}
                  </p>
                  <p className="font-medium text-gray-900 line-clamp-2 mt-1">{p.title}</p>
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {p.location}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Gallery Modal */}
      {isGalleryOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          <button
            onClick={() => setIsGalleryOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center"
          >
            <X className="h-6 w-6 text-white" />
          </button>
          <button
            onClick={prevImage}
            className="absolute left-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center"
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>
          <img
            src={property.media[currentImageIndex].url}
            alt={property.title}
            className="max-w-[90vw] max-h-[90vh] object-contain"
          />
        </div>
      )}
    </div>
  );
}
