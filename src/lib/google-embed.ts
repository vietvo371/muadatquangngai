/**
 * Dựng URL nhúng Google Maps / Google Street View **không cần API key**.
 *
 * Vì sao không dùng Maps Embed API chính thức: project Google Cloud của dự án chưa bật API nào
 * (mọi lời gọi trả `This API is not activated on your API project`), và chủ dự án chưa muốn gắn
 * thẻ thanh toán để bật. Các URL dưới đây là kiểu nhúng cũ của Google, phục vụ công khai không
 * cần key — đã kiểm bằng trình duyệt ngày 22/09/2026: bản đồ hiện đúng vị trí kèm tên tiện ích
 * xung quanh, Street View hiện ảnh thật ở nơi Google đã chụp.
 *
 * ĐÁNH ĐỔI phải biết trước:
 * 1. Đây KHÔNG phải endpoint nằm trong tài liệu chính thức — Google có quyền đổi bất cứ lúc nào.
 *    Nếu một ngày khung nhúng trắng, việc cần làm là bật Maps Embed API (miễn phí vô hạn) và
 *    Street View Static API rồi chuyển sang URL chính thức; phần giao diện giữ nguyên.
 * 2. Nội dung nằm trong iframe của Google nên trang mình KHÔNG đọc được vào trong. Chỗ Google
 *    chưa có ảnh đường phố, chính Google hiện dòng "Không có sẵn Chế độ xem phố" trên nền đen;
 *    mình không thay được bằng câu chữ riêng. Muốn tự hiện thông báo thì phải bật Street View
 *    Static API để hỏi trước vùng phủ (hạn mức hỏi vùng phủ là miễn phí).
 */

/** Toạ độ đủ 6 số lẻ là chính xác tới ~11cm; cắt bớt cho URL gọn và tránh lộ số rác từ float. */
function coord(value: number): string {
  return Number(value).toFixed(6);
}

/**
 * Toạ độ có dùng được không. Chặn cả `0,0` vì tin đăng chưa ghim vị trí hay bị lưu về 0
 * — nhúng thẳng sẽ ra giữa vịnh Guinea thay vì báo thiếu dữ liệu.
 */
export function hasUsableCoords(lat?: number | null, lng?: number | null): lat is number {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

/** Bản đồ Google có ghim sẵn điểm, nhãn tiếng Việt. */
export function googleMapEmbedUrl(lat: number, lng: number, zoom = 16): string {
  return `https://maps.google.com/maps?q=${coord(lat)},${coord(lng)}&hl=vi&z=${zoom}&output=embed`;
}

/** Ảnh đường phố tại đúng toạ độ. `cbp` = hướng nhìn mặc định (ngang tầm mắt, không nghiêng). */
export function googleStreetViewEmbedUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=&layer=c&cbll=${coord(lat)},${coord(lng)}&cbp=11,0,0,0,0&hl=vi&output=svembed`;
}

/** Mở Google Maps ở tab mới — đây là link chính thức, có tài liệu, không phụ thuộc kiểu nhúng. */
export function googleMapsPlaceUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${coord(lat)},${coord(lng)}`;
}

/** Mở thẳng chế độ xem phố trên Google Maps — cũng là link chính thức. */
export function googleStreetViewPageUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${coord(lat)},${coord(lng)}`;
}
