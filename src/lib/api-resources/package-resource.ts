function phpNumberFormat(num: number): string {
  return num
    .toFixed(0)
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Đối chiếu 1:1 backend/app/Http/Resources/PackageResource.php. */
export function mapPackageResource(pkg: {
  id: bigint;
  name: string;
  type: string;
  price: unknown;
  duration_days: number;
  highlight_color: string | null;
  features: unknown;
}) {
  const price = typeof pkg.price === 'object' && pkg.price !== null ? Number(pkg.price.toString()) : Number(pkg.price);
  return {
    id: pkg.id,
    name: pkg.name,
    type: pkg.type,
    price,
    price_formatted: `${phpNumberFormat(price)} đ`,
    duration_days: pkg.duration_days,
    highlight_color: pkg.highlight_color,
    features: pkg.features ?? [],
  };
}
