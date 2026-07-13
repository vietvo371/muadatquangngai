// Danh mục con hiển thị trên menu header + đồng bộ với dropdown "Loại nhà đất" ở bộ lọc.
// Khớp đúng tên/slug với bảng categories trong DB (xem migrate_categories.sql) — sửa theo yêu cầu
// Notion "SỬA WEBSITE 13/07".

export interface CategoryMenuItem {
  id: number;
  name: string;
  slug: string;
}

// id khớp đúng với bảng categories sau migrate_categories.sql (id giữ nguyên, chỉ đổi tên/slug).
export const SELL_CATEGORIES: CategoryMenuItem[] = [
  { id: 2, name: 'Bán nhà riêng', slug: 'nha-rieng' },
  { id: 4, name: 'Bán nhà biệt thự, liền kề', slug: 'nha-biet-thu-lien-ke' },
  { id: 3, name: 'Bán nhà mặt phố', slug: 'nha-mat-pho' },
  { id: 7, name: 'Bán Shophouse, nhà phố thương mại', slug: 'shophouse-nha-pho-thuong-mai' },
  { id: 5, name: 'Bán đất nền dự án', slug: 'dat-nen-du-an' },
  { id: 6, name: 'Bán đất', slug: 'dat' },
  { id: 8, name: 'Bán trang trại, khu nghỉ dưỡng', slug: 'trang-trai-khu-nghi-duong' },
  { id: 19, name: 'Bán kho, nhà xưởng', slug: 'kho-nha-xuong' },
  { id: 20, name: 'Bán loại bất động sản khác', slug: 'loai-bat-dong-san-khac-ban' },
];

export const RENT_CATEGORIES: CategoryMenuItem[] = [
  { id: 9, name: 'Cho thuê căn hộ dịch vụ', slug: 'can-ho-dich-vu' },
  { id: 10, name: 'Cho thuê nhà riêng', slug: 'nha-rieng-cho-thue' },
  { id: 21, name: 'Cho thuê biệt thự, liền kề', slug: 'biet-thu-lien-ke-cho-thue' },
  { id: 22, name: 'Cho thuê nhà mặt phố', slug: 'nha-mat-pho-cho-thue' },
  { id: 23, name: 'Cho thuê shophouse, nhà phố thương mại', slug: 'shophouse-nha-pho-thuong-mai-cho-thue' },
  { id: 11, name: 'Cho thuê nhà trọ, phòng trọ', slug: 'nha-tro-phong-tro' },
  { id: 13, name: 'Cho thuê văn phòng', slug: 'van-phong-cho-thue' },
  { id: 12, name: 'Cho thuê sang nhượng cửa hàng, kiot', slug: 'sang-nhuong-cua-hang-kiot' },
  { id: 14, name: 'Cho thuê kho, nhà xưởng, đất', slug: 'kho-nha-xuong-dat-cho-thue' },
  { id: 24, name: 'Cho thuê loại bất động sản khác', slug: 'loai-bat-dong-san-khac-thue' },
];

export const PROJECT_CATEGORIES: CategoryMenuItem[] = [
  { id: 16, name: 'Khu đô thị mới', slug: 'khu-do-thi-moi' },
  { id: 17, name: 'Khu dân cư', slug: 'khu-dan-cu' },
  { id: 25, name: 'Nhà ở xã hội', slug: 'nha-o-xa-hoi' },
  { id: 18, name: 'Khu nghỉ dưỡng, sinh thái', slug: 'khu-nghi-duong-sinh-thai' },
  { id: 26, name: 'Biệt thự, liền kề', slug: 'biet-thu-lien-ke-du-an' },
  { id: 27, name: 'Shophouse', slug: 'shophouse-du-an' },
  { id: 28, name: 'Dự án khác', slug: 'du-an-khac' },
];

// 9 xã/phường/đặc khu ưu tiên hiển thị trước trong bộ chọn Khu vực (theo yêu cầu Notion),
// phần còn lại trong 96 đơn vị xem qua "Xem thêm". Khớp tên với cột districts.name sau migrate.
export const PRIORITY_REGIONS = [
  'Phường Cẩm Thành',
  'Phường Nghĩa Lộ',
  'Phường Trương Quang Trọng',
  'Xã Tư Nghĩa',
  'Xã An Phú',
  'Xã Vạn Tường',
  'Xã Vệ Giang',
  'Xã Mộ Đức',
  'Đặc khu Lý Sơn',
];
