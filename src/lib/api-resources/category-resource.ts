/** Đối chiếu 1:1 backend/app/Http/Resources/CategoryResource.php. */
export function mapCategoryResource(category: {
  id: bigint;
  name: string;
  slug: string;
  type: string;
  icon: string | null;
  sort_order: number;
}) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    type: category.type,
    icon: category.icon,
    sort_order: category.sort_order,
  };
}
