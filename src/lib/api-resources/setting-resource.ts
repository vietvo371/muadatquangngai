/** Đối chiếu 1:1 backend/app/Http/Resources/SettingResource.php. */
export function mapSettingResource(setting: {
  id: bigint;
  key: string;
  group: string;
  type: string;
  label: string;
  value: string | null;
  options: string | null;
  description: string | null;
  sort_order: number;
}) {
  return {
    id: setting.id,
    key: setting.key,
    group: setting.group,
    type: setting.type,
    label: setting.label,
    value: setting.value,
    options: setting.options ? JSON.parse(setting.options) : null,
    description: setting.description,
    sort_order: setting.sort_order,
  };
}
