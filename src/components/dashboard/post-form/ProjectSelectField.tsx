'use client';

import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiGet, toApiError } from '@/lib/api-client';
import { adaptList, adaptProject } from '@/lib/project/adapters';
import type { Project } from '@/lib/project/types';

/**
 * Ô "Thuộc dự án" trên form đăng tin / sửa tin.
 *
 * Không bắt buộc. Chọn rồi thì tin hiện ở khối "Đang mở bán" của trang dự án đó. Trước đây
 * không có ô này nên cột properties.project_id chưa từng được ghi — khối "Đang mở bán" của mọi
 * dự án luôn trống.
 */

/** Giá trị đại diện cho "không thuộc dự án nào" — Select không nhận chuỗi rỗng làm một mục. */
const NONE = 'none';

interface ProjectSelectFieldProps {
  /** id dự án dạng chuỗi số, hoặc '' khi không thuộc dự án nào. */
  value: string;
  onChange: (projectId: string) => void;
}

export function ProjectSelectField({ value, onChange }: ProjectSelectFieldProps) {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    apiGet<{ data?: unknown }>('/api/v2/projects', { params: { per_page: 100 }, signal: controller.signal })
      .then((res) => {
        const list = adaptList(res?.data, adaptProject);
        setProjects(list.sort((a, b) => a.name.localeCompare(b.name, 'vi')));
      })
      .catch((error: unknown) => {
        const apiError = toApiError(error);
        if (apiError.code !== 'ABORTED') setLoadError(apiError.message);
      });
    return () => controller.abort();
  }, []);

  const selected = projects?.find((p) => p.id === value) ?? null;
  // Tin đang gắn với một dự án đã ngừng hiển thị: vẫn giữ lựa chọn cũ, chỉ ghi rõ cho người sửa.
  const selectedMissing = value !== '' && projects !== null && !selected;

  return (
    <div className="mb-6">
      <Label className="font-semibold text-gray-700">Thuộc dự án</Label>
      <p className="mt-1 text-[13px] text-gray-500">
        Không bắt buộc. Chọn nếu bất động sản nằm trong một dự án — tin sẽ hiện ở mục &quot;Đang mở bán&quot; của
        trang dự án đó.
      </p>
      <Select value={value || NONE} onValueChange={(next) => onChange(!next || next === NONE ? '' : String(next))}>
        <SelectTrigger className="mt-2 h-12 border-gray-200 bg-gray-50 focus:border-primary focus:ring-primary">
          <SelectValue>
            {(v: string) =>
              v === NONE
                ? 'Không thuộc dự án nào'
                : (projects?.find((p) => p.id === v)?.name ?? (projects ? 'Dự án không còn hiển thị' : 'Đang tải...'))
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>Không thuộc dự án nào</SelectItem>
          {projects === null && !loadError && (
            <SelectItem value="loading" disabled>
              Đang tải danh sách dự án...
            </SelectItem>
          )}
          {projects?.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
              {p.location.district ? ` — ${p.location.district}` : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {loadError && <p className="mt-1.5 text-[13px] text-gray-500">Không tải được danh sách dự án: {loadError}</p>}
      {selectedMissing && (
        <p className="mt-1.5 text-[13px] text-gray-500">
          Dự án đang gắn với tin này hiện không còn hiển thị công khai. Tin vẫn giữ liên kết cũ cho tới khi bạn chọn lại.
        </p>
      )}
    </div>
  );
}
