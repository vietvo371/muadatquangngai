'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, Building, Calendar, Users, Home, Phone, MessageSquare, 
  CheckCircle, Clock, Share2, Heart, ArrowLeft, ChevronRight
} from 'lucide-react';
import { formatPrice } from '@/lib/formatters';

// Mock project data
const project = {
  id: '1',
  slug: 'sea-garden-da-nang',
  name: 'Sea Garden Đà Nẵng',
  developer: 'Sun Group',
  thumbnail: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&h=600&fit=crop',
  gallery: [
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&h=600&fit=crop',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=600&fit=crop',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&h=600&fit=crop',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=600&fit=crop',
  ],
  status: 'selling',
  type: 'apartment',
  province: 'Đà Nẵng',
  district: 'Sơn Trà',
  address: 'Đường Võ Nguyên Giáp, Phường Mỹ An, Quận Sơn Trà',
  description: `
    Sea Garden Đà Nẵng là dự án căn hộ cao cấp view biển Mỹ Khê, được phát triển bởi Sun Group - một trong những tập đoàn bất động sản hàng đầu Việt Nam.

    **Vị trí đắc địa:**
    - Cách bãi biển Mỹ Khê 200m
    - Cách trung tâm thành phố 5 phút
    - Gần trường quốc tế, bệnh viện
    - Kết nối giao thông thuận tiện

    **Tiện ích nội khu:**
    - Hồ bơi vô cực view biển
    - Phòng gym cao cấp
    - Khu vui chơi trẻ em
    - Công viên cây xanh
    - Bảo vệ 24/7
    - Camera an ninh
    - Thang máy tốc độ cao
    - Bãi đỗ xe thông minh
  `,
  priceFrom: 3500000000,
  priceTo: 8000000000,
  totalArea: 50000,
  totalUnits: 500,
  totalBlocks: 3,
  totalFloors: 25,
  totalApartments: 480,
  constructionProgress: 80,
  handoverDate: '2024-12-31',
  legal: 'Đã có phép, sổ đỏ chính chủ',
  utilities: [
    { name: 'Hồ bơi', icon: '🏊' },
    { name: 'Gym', icon: '💪' },
    { name: 'Bảo vệ', icon: '🔒' },
    { name: 'Camera', icon: '📹' },
    { name: 'Thang máy', icon: '🛗' },
    { name: 'Bãi đỗ', icon: '🚗' },
    { name: 'Công viên', icon: '🌳' },
    { name: 'Siêu thị', icon: '🏪' },
  ],
  floorPlan: [
    { type: '2PN', area: 75, count: 200 },
    { type: '3PN', area: 95, count: 150 },
    { type: 'Penthouse', area: 200, count: 10 },
  ],
  contact: {
    name: 'Nguyễn Văn A',
    phone: '0901234567',
    zalo: '0901234567',
    avatar: null,
  },
  similarProjects: [
    {
      id: '2',
      name: 'Green Park Quảng Ngãi',
      slug: 'green-park-quang-ngai',
      thumbnail: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop',
      priceFrom: 1800000000,
    },
    {
      id: '3',
      name: 'Luxury Villa Hội An',
      slug: 'luxury-villa-hoi-an',
      thumbnail: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&h=300&fit=crop',
      priceFrom: 15000000000,
    },
  ],
};

const statusConfig = {
  upcoming: { label: 'Sắp mở bán', color: 'bg-blue-100 text-blue-700' },
  selling: { label: 'Đang bán', color: 'bg-green-100 text-green-700' },
  completed: { label: 'Đã bàn giao', color: 'bg-gray-100 text-gray-700' },
};

export default function ProjectDetailPage() {
  const [currentImage, setCurrentImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-blue-600">Trang chủ</Link>
            <span>/</span>
            <Link href="/du-an" className="hover:text-blue-600">Dự án</Link>
            <span>/</span>
            <span className="text-gray-900">{project.name}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gallery */}
            <Card>
              <div className="relative aspect-[16/9]">
                <img
                  src={project.gallery[currentImage]}
                  alt={project.name}
                  className="w-full h-full object-cover"
                />
                <Badge className={`absolute top-4 left-4 ${statusConfig[project.status as keyof typeof statusConfig].color}`}>
                  {statusConfig[project.status as keyof typeof statusConfig].label}
                </Badge>
              </div>
              
              {/* Thumbnails */}
              <div className="p-4">
                <div className="flex gap-2 overflow-x-auto">
                  {project.gallery.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImage(index)}
                      className={`w-20 h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-colors ${
                        index === currentImage ? 'border-blue-500' : 'border-transparent'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Info */}
            <Card>
              <CardContent className="p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">{project.name}</h1>
                
                <div className="flex items-center gap-2 text-gray-500 mb-6">
                  <MapPin className="h-4 w-4" />
                  <span>{project.address}</span>
                </div>

                {/* Quick Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-gray-900">{project.totalBlocks}</p>
                    <p className="text-sm text-gray-500">Block</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-gray-900">{project.totalFloors}</p>
                    <p className="text-sm text-gray-500">Tầng</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-gray-900">{project.totalUnits}</p>
                    <p className="text-sm text-gray-500">Căn hộ</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-gray-900">{project.constructionProgress}%</p>
                    <p className="text-sm text-gray-500">Hoàn thành</p>
                  </div>
                </div>

                {/* Price */}
                <div className="p-4 bg-red-50 rounded-lg mb-6">
                  <p className="text-sm text-gray-500 mb-1">Giá bán</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatPrice(project.priceFrom)} - {formatPrice(project.priceTo)}
                  </p>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="overview">
                  <TabsList>
                    <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                    <TabsTrigger value="utilities">Tiện ích</TabsTrigger>
                    <TabsTrigger value="floorplan">Mặt bằng</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="mt-4">
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-line">{project.description}</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="utilities" className="mt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {project.utilities.map((util, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                          <span className="text-2xl">{util.icon}</span>
                          <span className="font-medium">{util.name}</span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="floorplan" className="mt-4">
                    <div className="space-y-4">
                      {project.floorPlan.map((floor, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-semibold">{floor.type}</p>
                            <p className="text-sm text-gray-500">{floor.area}m²</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{floor.count}</p>
                            <p className="text-sm text-gray-500">căn</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Liên hệ tư vấn</h3>
                
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={project.contact.avatar || undefined} />
                    <AvatarFallback>{project.contact.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{project.contact.name}</p>
                    <p className="text-sm text-gray-500">Tư vấn dự án</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <a href={`tel:${project.contact.phone}`}>
                    <Button className="w-full gap-2">
                      <Phone className="h-4 w-4" />
                      {project.contact.phone}
                    </Button>
                  </a>
                  <a href={`https://zalo.me/${project.contact.zalo}`}>
                    <Button variant="outline" className="w-full gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Zalo
                    </Button>
                  </a>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500">Chủ đầu tư</span>
                    <span className="font-medium">{project.developer}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500">Quy mô</span>
                    <span className="font-medium">{project.totalArea.toLocaleString()}m²</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500">Bàn giao</span>
                    <span className="font-medium">
                      {new Date(project.handoverDate).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Pháp lý</span>
                    <span className="font-medium text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {project.legal}
                    </span>
                  </div>
                </div>

                {/* Progress */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500">Tiến độ</span>
                    <span className="font-medium">{project.constructionProgress}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${project.constructionProgress}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Similar Projects */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Dự án tương tự</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {project.similarProjects.map((p) => (
              <Link key={p.id} href={`/du-an/${p.slug}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
                  <div className="flex gap-4 p-4">
                    <img
                      src={p.thumbnail}
                      alt={p.name}
                      className="w-32 h-24 rounded-lg object-cover"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {p.name}
                      </h3>
                      <p className="text-sm text-red-600 font-bold mt-1">
                        Từ {formatPrice(p.priceFrom)}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
