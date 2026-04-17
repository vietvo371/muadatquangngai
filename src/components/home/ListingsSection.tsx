'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SectionHeading } from '@/components/home/SectionHeading';
import { ListingCard } from '@/components/home/ListingCard';

const saleListings = [
  {
    id: 1,
    title: 'Chủ cần bán lô đất nền 800m2 full thổ cư gần thị trấn Mộ Đức',
    price: '7,5 tỷ',
    area: '800m²',
    address: '355 Phạm Văn Đồng, T.T Mộ Đức, Quảng Ngãi',
    postedAt: 'Đăng hôm nay',
    image: '/images/image_data/z7726781297102_3c7e87338d6cc244d8e51c392bd5ab3b.jpg',
    href: '/mua-ban/chu-can-ban-lo-dat-nen-800m2',
    category: 'Đất nền',
  },
  {
    id: 2,
    title: 'Chủ cần tiền bán nhanh lô đất hẻm Bà Triệu - P.Cẩm Thành',
    price: '750 triệu',
    area: '5×15m',
    address: 'Hẻm Bà Triệu, P.Cẩm Thành, Quảng Ngãi',
    postedAt: 'Đăng hôm nay',
    image: '/images/image_data/z7723058725891_eb469329731d26570478fa4f52e3c574.jpg',
    href: '/mua-ban/chu-can-tien-ban-nhanh-lo-dat-hem-ba-trieu',
    category: 'Đất nền',
  },
  {
    id: 3,
    title: 'Cần bán lô đất giá siêu rẻ KDC Nghĩa Giang',
    price: '3xx triệu',
    area: '120m²',
    address: 'KDC Nghĩa Giang, Quảng Ngãi (Nghĩa Thuận cũ)',
    postedAt: 'Đăng hôm nay',
    image: '/images/image_data/z7727089471705_b45383cbfb0c02dbb327ef0ea9fd2f7e.jpg',
    href: '/mua-ban/can-ban-lo-dat-gia-sieu-re-kdc-nghia-giang',
    category: 'Đất nền',
  },
  {
    id: 4,
    title: 'Đất hẻm ô tô 285 Phan Đình Phùng - trung tâm TP Quảng Ngãi',
    price: '1,39 tỷ',
    area: '72,6m²',
    address: '285 Phan Đình Phùng, TP Quảng Ngãi',
    postedAt: 'Đăng hôm nay',
    image: '/images/image_data/banner_hero.jpg',
    href: '/mua-ban/dat-hem-o-to-285-phan-dinh-phung',
    category: 'Đất ở',
  },
];

const rentListings = [
  {
    id: 5,
    title: 'Cho thuê nhà nguyên căn 3 phòng ngủ khu trung tâm TP Quảng Ngãi',
    price: '8 triệu/tháng',
    area: '90m²',
    address: 'Nguyễn Du, TP Quảng Ngãi',
    postedAt: 'Đăng hôm nay',
    image: '/images/image_data/nha-pho-de-palace-river.jpg',
    href: '/cho-thue/nha-nguyen-can-3pn-trung-tam',
    category: 'Nhà ở',
  },
  {
    id: 6,
    title: 'Cho thuê phòng trọ cao cấp có nội thất, gần trường đại học',
    price: '2,5 triệu/tháng',
    area: '25m²',
    address: 'Lê Lợi, TP Quảng Ngãi',
    postedAt: 'Hôm qua',
    image: '/images/image_data/Haus-Coastal.jpg',
    href: '/cho-thue/phong-tro-cao-cap-noi-that',
    category: 'Phòng trọ',
  },
  {
    id: 7,
    title: 'Cho thuê mặt bằng kinh doanh mặt tiền đường lớn',
    price: '15 triệu/tháng',
    area: '60m²',
    address: 'Quang Trung, TP Quảng Ngãi',
    postedAt: 'Hôm qua',
    image: '/images/image_data/IMG_5828 2.jpg',
    href: '/cho-thue/mat-bang-kinh-doanh-quang-trung',
    category: 'Mặt bằng',
  },
  {
    id: 8,
    title: 'Cho thuê văn phòng 50m² có thang máy, đầy đủ tiện nghi',
    price: '10 triệu/tháng',
    area: '50m²',
    address: 'Hùng Vương, TP Quảng Ngãi',
    postedAt: '2 ngày trước',
    image: '/images/image_data/thi_tran_9b705.jpg',
    href: '/cho-thue/van-phong-hung-vuong',
    category: 'Văn phòng',
  },
];

const tabs = [
  { label: 'Tin nhà đất bán mới nhất', data: saleListings, href: '/mua-ban' },
  { label: 'Tin nhà đất cho thuê mới nhất', data: rentListings, href: '/cho-thue' },
];

export function ListingsSection() {
  const [activeTab, setActiveTab] = useState(0);
  const current = tabs[activeTab];

  return (
    <section className="py-14 md:py-20 px-4 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        {/* Heading + tabs */}
        <div className="mb-6 md:mb-8">
          <div className="w-8 h-1 bg-primary rounded-full mb-3" />
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900">
              Bất động sản dành cho bạn
            </h2>
            {/* Tab switcher */}
            <div className="flex gap-0 border border-gray-200 rounded-lg overflow-hidden bg-white self-start">
              {tabs.map((tab, i) => (
                <button
                  key={tab.label}
                  onClick={() => setActiveTab(i)}
                  className={`px-4 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === i
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {current.data.map((listing) => (
            <ListingCard key={listing.id} {...listing} />
          ))}
        </div>

        {/* CTA */}
        <div className="flex justify-center mt-8">
          <Link href={current.href}>
            <button className="border-2 border-primary text-primary hover:bg-primary-light rounded-lg px-10 py-2.5 font-semibold text-sm transition-colors">
              Xem tất cả
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
