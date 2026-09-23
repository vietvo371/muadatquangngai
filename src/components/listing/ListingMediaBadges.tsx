/**
 * Nhãn góc trên trái ảnh tin (thiết kế 23/09): "Video", "Virtual tour", "Promoted".
 * Chỉ hiện khi tin THẬT SỰ có video / tour 360 / gói nổi bật — không gắn nhãn trang trí.
 */
export function ListingMediaBadges({
  hasVideo,
  hasTour,
  promoted,
}: {
  hasVideo?: boolean;
  hasTour?: boolean;
  promoted?: boolean;
}) {
  const labels = [hasVideo && 'Video', hasTour && 'Virtual tour', promoted && 'Promoted'].filter(Boolean) as string[];
  if (labels.length === 0) return null;
  return (
    <div className="pointer-events-none absolute left-2.5 top-2.5 z-10 flex flex-wrap gap-1.5">
      {labels.map((label) => (
        <span key={label} className="rounded-md bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-gray-800 shadow-sm">
          {label}
        </span>
      ))}
    </div>
  );
}
