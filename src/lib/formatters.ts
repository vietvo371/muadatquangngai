export function formatPrice(
  price: number,
  unit?: string
): string {
  const billion = 1_000_000_000;
  const million = 1_000_000;

  let formatted = "";
  if (price >= billion) {
    formatted = `${(price / billion).toFixed(price % billion === 0 ? 0 : 1)} tỷ`;
  } else if (price >= million) {
    formatted = `${(price / million).toFixed(0)} triệu`;
  } else {
    formatted = price.toLocaleString("vi-VN") + " đ";
  }

  if (unit === "per_m2") return formatted + "/m²";
  if (unit === "per_month") return formatted + "/tháng";
  return formatted;
}

/**
 * Hiển thị giá theo lựa chọn của người đăng (feedback I.3) — KHÔNG sửa `formatPrice` ở trên
 * để tránh rủi ro cho các chỗ đang gọi nó; hàm này chỉ dùng ở nơi cần tôn trọng
 * `price_display_format` (card + trang chi tiết).
 *
 * - 'short'  : y hệt formatPrice hiện tại — "6.5 tỷ".
 * - 'million': luôn quy về triệu, không có dấu phân cách nghìn — "6500 triệu" (khớp ví dụ
 *   feedback nguyên văn).
 * - 'mixed'  : tách tỷ + triệu dư — "6 tỷ 500 triệu"; bỏ phần triệu nếu dư = 0, bỏ phần tỷ nếu
 *   giá dưới 1 tỷ (dùng lại dạng million cho phần dưới 1 tỷ).
 */
export function formatPriceByMode(
  price: number,
  mode: 'short' | 'million' | 'mixed' | undefined,
  unit?: string
): string {
  const billion = 1_000_000_000;
  const million = 1_000_000;
  const suffix = unit === 'per_m2' ? '/m²' : unit === 'per_month' ? '/tháng' : '';

  if (!mode || mode === 'short') return formatPrice(price, unit);

  if (mode === 'million') {
    return `${Math.round(price / million)} triệu${suffix}`;
  }

  // mode === 'mixed'
  if (price < billion) return `${Math.round(price / million)} triệu${suffix}`;
  const billions = Math.floor(price / billion);
  const remainderMillions = Math.round((price % billion) / million);
  const text = remainderMillions > 0 ? `${billions} tỷ ${remainderMillions} triệu` : `${billions} tỷ`;
  return text + suffix;
}

/**
 * Tiền dạng ngắn có giữ phần thập phân — "2 tỷ", "16,667 triệu".
 *
 * Khác `formatPrice` ở chỗ không làm tròn về đơn vị chẵn: giá mỗi m² làm tròn thành "17
 * triệu" thay vì "16,667 triệu" là sai lệch tới 2%, đủ để người bán thấy con số quy đổi
 * không khớp với số họ vừa nhập và mất tin tưởng vào phần tính toán.
 */
export function formatMoneyShort(value: number): string {
  const short = (n: number) => n.toLocaleString('vi-VN', { maximumFractionDigits: 3 });
  if (value >= 1_000_000_000) return `${short(value / 1_000_000_000)} tỷ`;
  if (value >= 1_000_000) return `${short(value / 1_000_000)} triệu`;
  return `${short(value)} đ`;
}

/**
 * Quy đổi giá của một tin đăng về cặp (tổng giá, giá mỗi m²).
 *
 * Cột `price` mang nghĩa KHÁC NHAU tuỳ `price_unit`: với `per_m2` thì nó chính là giá mỗi m²
 * chứ không phải tổng giá. Trước đây mọi chỗ hiển thị đều mặc định `price` là tổng rồi tự
 * chia cho diện tích, nên tin nhập theo giá/m² hiện sai cả hai con số (lệch đúng một lần
 * diện tích). Mọi nơi cần hiển thị giá phải đi qua hàm này thay vì tự tính.
 *
 * Trả `null` cho phần không suy ra được (thiếu diện tích, hoặc giá thoả thuận) — người gọi
 * tự quyết ẩn đi, tuyệt đối không hiển thị số 0 như một mức giá thật.
 */
export function derivePrices(
  price: number | null | undefined,
  priceUnit: string | null | undefined,
  area: number | null | undefined
): { total: number | null; perM2: number | null } {
  const p = Number(price) || 0;
  const a = Number(area) || 0;
  if (p <= 0) return { total: null, perM2: null };

  if (priceUnit === 'per_m2') {
    return { total: a > 0 ? Math.round(p * a) : null, perM2: p };
  }
  // 'total', 'per_month', 'negotiable' và mọi giá trị lạ đều coi price là con số đã nhập.
  return { total: p, perM2: a > 0 ? Math.round(p / a) : null };
}

export function formatArea(area: number): string {
  return `${area.toLocaleString("vi-VN")} m²`;
}

export function formatDirection(direction: string): string {
  const map: Record<string, string> = {
    dong: "Đông",
    tay: "Tây",
    nam: "Nam",
    bac: "Bắc",
    dong_bac: "Đông Bắc",
    dong_nam: "Đông Nam",
    tay_bac: "Tây Bắc",
    tay_nam: "Tây Nam",
  };
  return map[direction] || direction;
}

export function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return new Date(date).toLocaleDateString("vi-VN");
}

export function formatNumber(num: number): string {
  return num.toLocaleString("vi-VN");
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDistanceToNow(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diff = now.getTime() - then.getTime();

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds} giây trước`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} tuần trước`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} tháng trước`;

  const years = Math.floor(months / 12);
  return `${years} năm trước`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, (m) => (m === "đ" ? "d" : "D"))
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + "...";
}

export function getVipColor(vip: string): string {
  const map: Record<string, string> = {
    normal: "bg-gray-100 text-gray-600",
    vip: "bg-blue-100 text-blue-700",
    vip_plus: "bg-purple-100 text-purple-700",
    diamond: "bg-yellow-100 text-yellow-700",
  };
  return map[vip] || map.normal;
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    inactive: "bg-gray-100 text-gray-600",
    sold: "bg-blue-100 text-blue-700",
    rented: "bg-indigo-100 text-indigo-700",
    expired: "bg-red-100 text-red-700",
    rejected: "bg-red-100 text-red-700",
  };
  return map[status] || "bg-gray-100 text-gray-600";
}
