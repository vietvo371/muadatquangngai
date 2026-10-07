/**
 * Biểu tượng Zalo cho nút "Liên hệ qua Zalo" (Notion 06/10 "Thẻ liên hệ Môi giới – Icon Zalo").
 *
 * Bản cũ vẽ tay cả khung chat lẫn chữ "Zalo" bên trong bằng path — ở cỡ 20px các nét chữ dính
 * vào nhau thành một vệt trắng, nhìn như icon lỗi. Bản này chỉ giữ khung chat bo tròn đặc, màu
 * xanh Zalo #0068FF, nền trong suốt; chữ "Zalo" để nút tự hiển thị bên cạnh nên luôn đọc được.
 *
 * Nếu khách gửi file logo Zalo chính thức thì thay thẳng vào đây.
 */
export function ZaloIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M12 3.2c-5 0-9 3.4-9 7.7 0 2.4 1.3 4.6 3.3 6-.2 1-.7 2.2-1.4 3.1-.2.3 0 .7.4.6 1.8-.4 3.2-1.2 4.1-1.8.8.2 1.7.3 2.6.3 5 0 9-3.4 9-7.7s-4-8.2-9-8.2Z"
        fill="#0068FF"
      />
      <circle cx="8.4" cy="10.8" r="1.05" fill="#fff" />
      <circle cx="12" cy="10.8" r="1.05" fill="#fff" />
      <circle cx="15.6" cy="10.8" r="1.05" fill="#fff" />
    </svg>
  );
}
