/**
 * Đối chiếu ProvinceResource/DistrictResource/WardResource.php.
 * latitude/longitude của province là Decimal → Laravel serialize dạng STRING
 * ("15.121200"), giữ nguyên bằng cách format 6 chữ số thập phân.
 */
export function mapProvinceResource(p: {
  id: bigint;
  name: string;
  code: string;
  slug: string | null;
  latitude: unknown;
  longitude: unknown;
}) {
  return {
    id: p.id,
    name: p.name,
    code: p.code,
    slug: p.slug,
    latitude: p.latitude !== null && p.latitude !== undefined ? Number(p.latitude).toFixed(6) : null,
    longitude: p.longitude !== null && p.longitude !== undefined ? Number(p.longitude).toFixed(6) : null,
  };
}

export function mapDistrictResource(d: { id: bigint; province_id: bigint; name: string; code: string; slug: string }) {
  return { id: d.id, province_id: d.province_id, name: d.name, code: d.code, slug: d.slug };
}

export function mapWardResource(w: { id: bigint; district_id: bigint; name: string; code: string; slug: string }) {
  return { id: w.id, district_id: w.district_id, name: w.name, code: w.code, slug: w.slug };
}
