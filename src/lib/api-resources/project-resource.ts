import { projectStatusLabel, projectStatusVisible } from './project-status';
import { toVietnamIso8601 } from './carbon-format';

/**
 * Shape tối thiểu cần cho mapper — khớp với `select` dùng trong route handler,
 * không phụ thuộc kiểu payload tự sinh của Prisma (tránh rối khi Prisma đổi API nội bộ).
 */
export interface ProjectRow {
  id: bigint;
  uuid: string;
  slug: string;
  name: string;
  developer: string | null;
  description: string | null;
  thumbnail: string | null;
  status: string;
  type: string;
  province_id: bigint;
  district_id: bigint;
  ward_id: bigint | null;
  agent_id: bigint | null;
  construction_note: string | null;
  address: string;
  total_area: unknown; // Prisma.Decimal
  total_units: number | null;
  total_blocks: number | null;
  total_floors: number | null;
  price_from: unknown; // Prisma.Decimal
  price_to: unknown; // Prisma.Decimal
  legal: string | null;
  handover_date: Date | null;
  construction_progress: number | null;
  utilities: unknown;
  floor_plans: unknown;
  view_count: number;
  created_at: Date | null;
  provinces: { id: bigint; name: string };
  districts: { id: bigint; name: string };
  users_projects_user_idTousers: { id: bigint; name: string; avatar: string | null };
  users_projects_agent_idTousers: { id: bigint; name: string; avatar: string | null; phone: string | null } | null;
}

export interface WardRow {
  id: bigint;
  name: string;
}

function toFloatOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  return typeof value === 'object' ? Number(value.toString()) : Number(value);
}

/** Đối chiếu 1:1 với backend/app/Http/Resources/ProjectResource.php */
export function mapProjectResource(project: ProjectRow, ward: WardRow | null) {
  const images = project.thumbnail ? project.thumbnail.split(',') : [];

  return {
    id: project.id,
    uuid: project.uuid,
    slug: project.slug,
    name: project.name,
    developer: project.developer,
    description: project.description,
    thumbnail: images[0] ?? null,
    images,
    status: project.status,
    status_label: projectStatusLabel(project.status),
    status_visible: projectStatusVisible(project.status),
    type: project.type,

    province_id: project.province_id,
    district_id: project.district_id,
    ward_id: project.ward_id,
    agent_id: project.agent_id,
    construction_note: project.construction_note,

    location: {
      province: { id: project.provinces.id, name: project.provinces.name },
      district: { id: project.districts.id, name: project.districts.name },
      ward: ward ? { id: ward.id, name: ward.name } : null,
      address: project.address,
    },

    scale: {
      total_area: toFloatOrNull(project.total_area),
      total_units: project.total_units,
      total_blocks: project.total_blocks,
      total_floors: project.total_floors,
    },

    price: {
      from: toFloatOrNull(project.price_from),
      to: toFloatOrNull(project.price_to),
    },

    legal: project.legal,
    handover_date: project.handover_date ? project.handover_date.toISOString().slice(0, 10) : null,
    construction_progress: project.construction_progress,
    utilities: project.utilities ?? [],
    floor_plans: project.floor_plans || null,
    view_count: project.view_count,

    owner: {
      id: project.users_projects_user_idTousers.id,
      name: project.users_projects_user_idTousers.name,
      avatar: project.users_projects_user_idTousers.avatar,
    },

    agent: project.users_projects_agent_idTousers
      ? {
          id: project.users_projects_agent_idTousers.id,
          name: project.users_projects_agent_idTousers.name,
          avatar: project.users_projects_agent_idTousers.avatar,
          phone: project.users_projects_agent_idTousers.phone,
        }
      : null,

    created_at: toVietnamIso8601(project.created_at),
  };
}

/** Field scalar luôn có mặt trên Project — không phụ thuộc quan hệ nào được eager-load. */
export interface AdminProjectScalarRow {
  id: bigint;
  uuid: string;
  slug: string;
  name: string;
  developer: string | null;
  description: string | null;
  thumbnail: string | null;
  status: string;
  type: string;
  province_id: bigint;
  district_id: bigint;
  ward_id: bigint | null;
  agent_id: bigint | null;
  construction_note: string | null;
  address: string;
  total_area: unknown;
  total_units: number | null;
  total_blocks: number | null;
  total_floors: number | null;
  price_from: unknown;
  price_to: unknown;
  legal: string | null;
  handover_date: Date | null;
  construction_progress: number | null;
  utilities: unknown;
  floor_plans: unknown;
  view_count: number;
  created_at: Date | null;
}

interface AdminProjectRelations {
  provinces?: { id: bigint; name: string } | null;
  districts?: { id: bigint; name: string } | null;
  wards?: { id: bigint; name: string } | null;
  users_projects_user_idTousers?: { id: bigint; name: string; avatar: string | null } | null;
  users_projects_agent_idTousers?: { id: bigint; name: string; avatar: string | null; phone: string | null } | null;
}

/**
 * Port của ProjectResource.php dùng cho AdminProjectController — KHÁC mapProjectResource
 * ở trên (dành cho route public /projects vốn luôn eager-load đủ province/district/
 * ward/owner). Ở admin, mỗi action Laravel eager-load một tập quan hệ khác nhau
 * (index: province+district; show: province+district+ward+agent, KHÔNG có user/owner;
 * store/update/publish/archive: KHÔNG eager-load gì) — `whenLoaded()` OMIT hẳn key khi
 * quan hệ không được load (khác với loaded-nhưng-null → trả `null`). Object chỉ set field
 * quan hệ tương ứng khi caller thực sự đã include quan hệ đó trong Prisma query.
 */
export function mapAdminProjectResource(project: AdminProjectScalarRow & AdminProjectRelations) {
  const images = project.thumbnail ? project.thumbnail.split(',') : [];

  return {
    id: project.id,
    uuid: project.uuid,
    slug: project.slug,
    name: project.name,
    developer: project.developer,
    description: project.description,
    thumbnail: images[0] ?? null,
    images,
    status: project.status,
    status_label: projectStatusLabel(project.status),
    status_visible: projectStatusVisible(project.status),
    type: project.type,

    province_id: project.province_id,
    district_id: project.district_id,
    ward_id: project.ward_id,
    agent_id: project.agent_id,
    construction_note: project.construction_note,

    location: {
      ...('provinces' in project ? { province: project.provinces ? { id: project.provinces.id, name: project.provinces.name } : null } : {}),
      ...('districts' in project ? { district: project.districts ? { id: project.districts.id, name: project.districts.name } : null } : {}),
      ...('wards' in project ? { ward: project.wards ? { id: project.wards.id, name: project.wards.name } : null } : {}),
      address: project.address,
    },

    scale: {
      total_area: toFloatOrNull(project.total_area),
      total_units: project.total_units,
      total_blocks: project.total_blocks,
      total_floors: project.total_floors,
    },

    price: {
      from: toFloatOrNull(project.price_from),
      to: toFloatOrNull(project.price_to),
    },

    legal: project.legal,
    handover_date: project.handover_date ? project.handover_date.toISOString().slice(0, 10) : null,
    construction_progress: project.construction_progress,
    utilities: project.utilities ?? [],
    floor_plans: project.floor_plans || null,
    view_count: project.view_count,

    ...('users_projects_user_idTousers' in project
      ? {
          owner: project.users_projects_user_idTousers
            ? {
                id: project.users_projects_user_idTousers.id,
                name: project.users_projects_user_idTousers.name,
                avatar: project.users_projects_user_idTousers.avatar,
              }
            : null,
        }
      : {}),

    ...('users_projects_agent_idTousers' in project
      ? {
          agent: project.users_projects_agent_idTousers
            ? {
                id: project.users_projects_agent_idTousers.id,
                name: project.users_projects_agent_idTousers.name,
                avatar: project.users_projects_agent_idTousers.avatar,
                phone: project.users_projects_agent_idTousers.phone,
              }
            : null,
        }
      : {}),

    created_at: toVietnamIso8601(project.created_at),
  };
}
