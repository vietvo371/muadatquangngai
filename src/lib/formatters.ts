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
