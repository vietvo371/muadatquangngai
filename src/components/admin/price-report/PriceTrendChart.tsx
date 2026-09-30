'use client';

import { useEffect, useRef, useState } from 'react';
import { formatMonth, formatPerM2, type AreaSeries, type MonthPoint } from '@/lib/price-report-api';

const HEIGHT = 280;
const PADDING = { top: 16, right: 16, bottom: 32, left: 64 };
const Y_TICKS = 4;
const MIN_LABEL_SPACING_PX = 56;

/** Nhãn trục Y ngắn: "53 tr", "1,2 tỷ". */
function axisLabel(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tỷ`;
  if (value >= 1_000_000) return `${Math.round(value / 1_000_000).toLocaleString('vi-VN')} tr`;
  return value.toLocaleString('vi-VN');
}

function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    // Đo ngay một lần: ResizeObserver chỉ báo ở bước vẽ khung hình, tab chạy nền sẽ để biểu đồ trống.
    setWidth(element.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}

/** Đường giá trung vị theo tháng, dải mờ là khoảng thấp nhất – cao nhất (đã bỏ tin bất thường). */
function buildPaths(points: MonthPoint[], x: (i: number) => number, y: (v: number) => number) {
  const segments: string[] = [];
  const bands: string[] = [];
  let line: string[] = [];
  let upper: [number, number][] = [];
  let lower: [number, number][] = [];

  const flush = () => {
    if (line.length > 0) segments.push(line.join(' '));
    if (upper.length > 1) {
      const top = upper.map(([px, py]) => `${px},${py}`).join(' L ');
      const bottom = [...lower].reverse().map(([px, py]) => `${px},${py}`).join(' L ');
      bands.push(`M ${top} L ${bottom} Z`);
    }
    line = []; upper = []; lower = [];
  };

  points.forEach((point, i) => {
    if (point.median === null) { flush(); return; }
    line.push(`${line.length === 0 ? 'M' : 'L'} ${x(i)} ${y(point.median)}`);
    if (point.min !== null && point.max !== null) {
      upper.push([x(i), y(point.max)]);
      lower.push([x(i), y(point.min)]);
    }
  });
  flush();
  return { segments, bands };
}

/**
 * Bảng màu cho biểu đồ so sánh nhiều khu vực (Notion "So sánh biểu đồ").
 *
 * Giữ đúng 2 màu thương hiệu: các sắc độ của #1075b1 cộng màu nhấn #e03131. Vì các sắc độ gần
 * nhau khó phân biệt, mỗi đường còn có kiểu nét riêng (liền, đứt, chấm...) để nhìn là ra ngay,
 * kể cả khi in đen trắng hoặc người xem khó phân biệt màu.
 */
const SERIES_STYLES = [
  { color: '#1075b1', dash: undefined },
  { color: '#e03131', dash: '6 4' },
  { color: '#0b4f78', dash: '2 3' },
  { color: '#5ba3cf', dash: '10 4' },
  { color: '#8a94a0', dash: '4 3 1 3' },
] as const;

interface PriceTrendChartProps {
  points: MonthPoint[];
  /** Có giá trị = chế độ so sánh nhiều khu vực: mỗi khu vực một đường, bỏ dải min–max. */
  series?: AreaSeries[];
}

export function PriceTrendChart({ points, series }: PriceTrendChartProps) {
  const { ref, width } = useElementWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);

  const comparing = (series?.length ?? 0) > 0;
  const values = (comparing
    ? series!.flatMap((line) => line.points.map((p) => p.median))
    : points.flatMap((p) => [p.median, p.min, p.max])
  ).filter((v): v is number => v !== null);
  const hasData = values.length > 0;
  const plotWidth = Math.max(width - PADDING.left - PADDING.right, 0);
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;

  const rawMax = hasData ? Math.max(...values) : 1;
  const rawMin = hasData ? Math.min(...values) : 0;
  const span = rawMax - rawMin || rawMax || 1;
  const yMax = rawMax + span * 0.1;
  const yMin = Math.max(rawMin - span * 0.1, 0);

  const step = points.length > 1 ? plotWidth / (points.length - 1) : 0;
  const x = (i: number) => PADDING.left + (points.length > 1 ? i * step : plotWidth / 2);
  const y = (v: number) => PADDING.top + plotHeight - ((v - yMin) / (yMax - yMin || 1)) * plotHeight;
  const labelEvery = Math.max(1, Math.ceil(MIN_LABEL_SPACING_PX / (step || MIN_LABEL_SPACING_PX)));
  const { segments, bands } = buildPaths(points, x, y);
  const activePoint = active !== null ? points[active] : null;

  return (
    <div ref={ref} className="relative w-full" style={{ height: HEIGHT }} onMouseLeave={() => setActive(null)}>
      {width > 0 && (
        <svg width={width} height={HEIGHT} role="img" aria-label="Diễn biến giá trung vị theo tháng">
          {Array.from({ length: Y_TICKS + 1 }, (_, i) => {
            const value = yMin + ((yMax - yMin) * i) / Y_TICKS;
            const py = y(value);
            return (
              <g key={i}>
                <line x1={PADDING.left} x2={width - PADDING.right} y1={py} y2={py} className="stroke-gray-100" />
                <text x={PADDING.left - 8} y={py} dy="0.32em" textAnchor="end" className="fill-gray-400 text-[11px]">
                  {hasData ? axisLabel(value) : ''}
                </text>
              </g>
            );
          })}

          {/* Đếm nhãn từ tháng mới nhất lùi lại để tháng hiện tại luôn có nhãn mà không dính nhãn kề bên. */}
          {points.map((point, i) => (points.length - 1 - i) % labelEvery === 0 && (
            <text key={point.month} x={x(i)} y={HEIGHT - 10} textAnchor="middle" className="fill-gray-400 text-[11px]">
              {formatMonth(point.month)}
            </text>
          ))}

          {comparing ? (
            series!.map((line, lineIndex) => {
              const style = SERIES_STYLES[lineIndex % SERIES_STYLES.length];
              return buildPaths(line.points, x, y).segments.map((d, i) => (
                <path key={`${line.id}-${i}`} d={d} fill="none" strokeWidth={2.5}
                  stroke={style.color} strokeDasharray={style.dash} strokeLinecap="round" />
              ));
            })
          ) : (
            <>
              {bands.map((d, i) => <path key={i} d={d} className="fill-primary/10" />)}
              {segments.map((d, i) => <path key={i} d={d} fill="none" strokeWidth={2.5} className="stroke-primary" />)}
            </>
          )}

          {active !== null && (
            <line x1={x(active)} x2={x(active)} y1={PADDING.top} y2={PADDING.top + plotHeight} className="stroke-gray-300" strokeDasharray="4 4" />
          )}
          {!comparing && points.map((point, i) => point.median !== null && (
            <circle key={point.month} cx={x(i)} cy={y(point.median)} r={active === i ? 5.5 : 3.5}
              className="fill-white stroke-primary" strokeWidth={2} />
          ))}

          {/* Vùng bắt chuột theo từng cột tháng — rê chuột hoặc chạm vào là hiện chi tiết. */}
          {points.map((point, i) => (
            <rect key={point.month} data-testid="chart-hit" x={x(i) - (step || plotWidth) / 2} y={PADDING.top}
              width={step || plotWidth} height={plotHeight} fill="transparent"
              onMouseEnter={() => setActive(i)} onClick={() => setActive(i)} />
          ))}
        </svg>
      )}

      {!hasData && (
        <p className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">
          Chưa có dữ liệu giá trong khoảng thời gian này.
        </p>
      )}

      {activePoint && active !== null && (
        <div data-testid="chart-tooltip"
          className="pointer-events-none absolute z-10 w-56 rounded-lg border border-gray-200 bg-white p-3 text-xs shadow-lg"
          style={{
            top: PADDING.top,
            left: Math.min(Math.max(x(active) - 112, 0), Math.max(width - 224, 0)),
          }}>
          <p className="mb-1.5 font-semibold text-gray-900">Tháng {formatMonth(activePoint.month)}</p>
          {comparing ? (
            <dl className="space-y-1">
              {series!.map((line, lineIndex) => (
                <TooltipRow key={line.id} label={line.name}
                  value={formatPerM2(line.points[active]?.median ?? null)}
                  color={SERIES_STYLES[lineIndex % SERIES_STYLES.length].color} />
              ))}
            </dl>
          ) : activePoint.count === 0 ? (
            <p className="text-gray-500">Không có tin ghi nhận.</p>
          ) : (
            <dl className="space-y-1">
              <TooltipRow label="Giá trung vị" value={formatPerM2(activePoint.median)} strong />
              <TooltipRow label="Thấp nhất" value={formatPerM2(activePoint.min)} />
              <TooltipRow label="Cao nhất" value={formatPerM2(activePoint.max)} />
              <TooltipRow label="Số tin" value={activePoint.count.toLocaleString('vi-VN')} />
            </dl>
          )}
        </div>
      )}
    </div>
  );
}

function TooltipRow({ label, value, strong, color }: { label: string; value: string; strong?: boolean; color?: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="flex min-w-0 items-center gap-1.5 text-gray-500">
        {color && <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />}
        <span className="truncate">{label}</span>
      </dt>
      <dd className={strong ? 'font-semibold text-primary' : 'text-gray-900'}>{value}</dd>
    </div>
  );
}

/** Chú giải các đường trên biểu đồ so sánh — dùng kèm dưới biểu đồ. */
export function ChartLegend({ series }: { series: AreaSeries[] }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
      {series.map((line, index) => {
        const style = SERIES_STYLES[index % SERIES_STYLES.length];
        return (
          <li key={line.id} className="flex items-center gap-2 text-xs text-gray-600">
            <svg width="22" height="8" aria-hidden className="shrink-0">
              <line x1="0" y1="4" x2="22" y2="4" stroke={style.color} strokeWidth={2.5}
                strokeDasharray={style.dash} strokeLinecap="round" />
            </svg>
            {line.name}
          </li>
        );
      })}
    </ul>
  );
}
