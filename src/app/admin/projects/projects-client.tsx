'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useConfirm } from '@/components/providers/confirm-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  MoreVertical,
  Trash2,
  CheckCircle,
  Archive,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Building,
  DollarSign,
  Layers,
  MapPin,
  ExternalLink,
  PlusCircle,
  Edit2,
} from 'lucide-react';
import { formatPrice } from '@/lib/formatters';
import { projectApi, type Project } from '@/lib/admin-api';

// Dynamic client URL from env
const CLIENT_URL = process.env.NEXT_PUBLIC_CLIENT_URL || 'http://localhost:3000';

// Vòng đời chuẩn: draft → upcoming → selling → (paused) → completed → archived
// Đồng bộ với App\Enums\ProjectStatus ở backend.
type ProjectStatus = 'draft' | 'upcoming' | 'selling' | 'paused' | 'completed' | 'archived';



/**
 * getTypeLabel — Chuyển `type` thành nhãn hiển thị tiếng Việt.
 * Đồng bộ với các SelectItem trong form Thêm mới / Chỉnh sửa.
 * Thay cho trường `category` tự nhập trước đây.
 */
const TYPE_LABELS: Record<string, string> = {
  land:       'Đất nền',
  villa:      'Biệt thự',
  townhouse:  'Nhà phố / Shophouse',
  apartment:  'Chung cư / Căn hộ',
  commercial: 'Thương mại',
};

function getTypeLabel(type?: string): string {
  return TYPE_LABELS[type ?? ''] ?? 'Bất động sản';
}

/**
 * statusConfig — Cấu hình nhãn, màu badge và icon cho từng trạng thái dự án.
 * Đồng bộ với App\Enums\ProjectStatus::label() và ProjectStatus::color() ở backend.
 * Khi thêm/bỏ trạng thái: chỉnh ProjectStatus enum ở backend rồi cập nhật object này.
 */
const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  // Admin đang soạn thảo, chưa công bố ra ngoài
  draft: {
    label: 'Bản nháp',
    color: 'bg-gray-100 text-gray-700 hover:bg-gray-200/60 border-gray-200',
    icon: layersIcon,
  },
  // Đã công bố, sắp mở bán — nhận đặt chỗ ưu tiên
  upcoming: {
    label: 'Sắp mở bán',
    color: 'bg-amber-50 text-amber-700 hover:bg-amber-100/60 border-amber-200/50',
    icon: layersIcon,
  },
  // Đang mở bán chính thức — nhận đặt cọc & ký HĐMB
  selling: {
    label: 'Đang mở bán',
    color: 'bg-green-50 text-green-700 hover:bg-green-100/60 border-green-200/50',
    icon: CheckCircle,
  },
  // Tạm dừng giao dịch — vẫn hiển thị, không nhận đặt mới
  paused: {
    label: 'Tạm dừng',
    color: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100/60 border-yellow-200/50',
    icon: Archive,
  },
  // Đã bàn giao xong — vẫn hiển thị để tham khảo
  completed: {
    label: 'Đã bàn giao',
    color: 'bg-blue-50 text-blue-700 hover:bg-blue-100/60 border-blue-200/50',
    icon: CheckCircle,
  },
  // Lưu trữ — ẩn hoàn toàn khỏi client, chỉ admin thấy
  archived: {
    label: 'Đã lưu trữ',
    color: 'bg-red-50 text-red-700 hover:bg-red-100/60 border-red-200/50',
    icon: Archive,
  },
};

function layersIcon(props: React.ComponentProps<typeof Layers>) {
  return <Layers className="h-3.5 w-3.5" {...props} />;
}

// Pill tabs lọc trạng thái — theo đúng thứ tự vòng đời nghiệp vụ
const statusTabs = [
  { value: 'all',       label: 'Tất cả'       },
  { value: 'selling',   label: 'Đang mở bán'  },
  { value: 'upcoming',  label: 'Sắp mở bán'   },
  { value: 'paused',    label: 'Tạm dừng'     },
  { value: 'draft',     label: 'Bản nháp'     },
  { value: 'completed', label: 'Đã bàn giao'  },
  { value: 'archived',  label: 'Đã lưu trữ'  },
];

const PREDEFINED_UTILITIES = [
  'Hồ bơi',
  'Gym & Spa',
  'Bảo vệ 24/7',
  'Camera an ninh',
  'Thang máy',
  'Bãi đỗ xe',
  'Công viên',
  'Siêu thị nội khu',
  'Khu vui chơi trẻ em',
  'Trường mầm non',
];

export default function ProjectsClient() {
  const router = useRouter();
  const confirm = useConfirm();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  // useRealApi đã bỏ — luôn dùng real API, không có mock fallback

  // Filters state
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);

  const openEditDialog = (project: Project) => {
    router.push(`/admin/projects/${project.id}/edit`);
  };

  const openCreateDialog = () => {
    router.push('/admin/projects/create');
  };

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      // matching original API query parameters
      const params: Record<string, string | number | undefined> = {
        search: searchQuery.trim() || undefined,
      };
      
      const response = await projectApi.list(params);
      if (response && response.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped = response.data.map((apiProj: any) => ({
          id: apiProj.id,
          name: apiProj.name,
          slug: apiProj.slug,
          min_price: apiProj.price?.from ?? apiProj.price_from ?? apiProj.min_price ?? 0,
          max_price: apiProj.price?.to ?? apiProj.price_to ?? apiProj.max_price ?? 0,
          price_display: apiProj.price_display ?? null,
          status: apiProj.status || 'draft',
          location: apiProj.location?.address ?? apiProj.address ?? apiProj.location ?? 'Quảng Ngãi',
          // category không có trên API — derive từ type thông qua getTypeLabel()
          investor: apiProj.developer ?? apiProj.investor ?? 'Đang cập nhật',
          created_at: apiProj.created_at,
          type: apiProj.type || 'townhouse',
          description: apiProj.description || '',
          total_area: apiProj.scale?.total_area ?? apiProj.total_area ?? 0,
          total_units: apiProj.scale?.total_units ?? apiProj.total_units ?? 0,
          total_blocks: apiProj.scale?.total_blocks ?? apiProj.total_blocks ?? 0,
          total_floors: apiProj.scale?.total_floors ?? apiProj.total_floors ?? 0,
          legal: apiProj.legal ?? '',
          handover_date: apiProj.handover_date ?? '',
          construction_progress: apiProj.construction_progress ?? 0,
          utilities: apiProj.utilities ?? [],
        }));
        setProjects(mapped);
      } else {
        // API thành công nhưng không có dữ liệu — để empty state hiển thị
        setProjects([]);
      }
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      toast.error('Không tải được danh sách dự án. Vui lòng tải lại trang.');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Simulate premium micro-animation delay when page/filters change
  useEffect(() => {
    setIsFiltering(true);
    const timer = setTimeout(() => {
      setIsFiltering(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [statusFilter, searchQuery, page, perPage]);

  // Filter projects by status client-side
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchStatus = statusFilter === 'all' || project.status === statusFilter;
      const matchSearch = !searchQuery.trim() || 
        project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.investor?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [projects, statusFilter, searchQuery]);

  // Pagination calculation
  const totalCount = filteredProjects.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
  const pageIndex = Math.min(page, totalPages);
  const startIndex = (pageIndex - 1) * perPage;
  const endIndex = Math.min(startIndex + perPage, totalCount);

  const paginatedProjects = useMemo(() => {
    return filteredProjects.slice(startIndex, endIndex);
  }, [filteredProjects, startIndex, endIndex]);

  // Quick stats — đếm theo các trạng thái nghiệp vụ quan trọng nhất
  const sellingCount  = projects.filter((p) => p.status === 'selling').length;
  const draftCount    = projects.filter((p) => p.status === 'draft').length;
  const archivedCount = projects.filter((p) => p.status === 'archived').length;

  // Actions
  const handlePublish = async (id: number) => {
    try {
      await projectApi.publish(id);
      // Khi xuất bản, chuyển draft → selling (đang mở bán)
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'selling' } : p))
      );
      toast.success('Đã xuất bản dự án thành công!');
    } catch {
      toast.error('Có lỗi xảy ra khi xuất bản dự án.');
    }
  };

  const handleArchive = async (id: number) => {
    try {
      await projectApi.archive(id);
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'archived' } : p))
      );
      toast.success('Đã lưu trữ dự án thành công!');
    } catch {
      toast.error('Có lỗi xảy ra khi lưu trữ dự án.');
    }
  };

  const handleDelete = async (id: number) => {
    const isConfirmed = await confirm({
      title: 'Xóa dự án',
      description: 'Bạn có chắc chắn muốn xóa dự án này? Thao tác này không thể hoàn tác.',
      confirmText: 'Xóa dự án',
      cancelText: 'Hủy',
      variant: 'destructive'
    });
    if (!isConfirmed) return;
    try {
      await projectApi.delete(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      toast.success('Đã xóa dự án thành công.');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Không thể xóa dự án.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Quản lý dự án</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý các đại dự án, khu dân cư kiểu mẫu và dự án hạ tầng tại Quảng Ngãi</p>
        </div>
        <Button
          onClick={openCreateDialog}
          data-testid="create-project-btn"
          className="bg-primary hover:bg-primary-dark rounded-xl font-bold text-xs h-9.5 gap-1.5 shadow-sm text-white transition-all"
        >
          <PlusCircle className="h-4 w-4" />
          Thêm dự án mới
        </Button>
      </div>

      {/* Analytics Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl border border-green-100/50">
              <CheckCircle className="h-5.5 w-5.5" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{sellingCount}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">Đang mở bán</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-gray-50 text-gray-600 rounded-xl border border-gray-100/50">
              <Layers className="h-5.5 w-5.5" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{draftCount}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">Bản nháp</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl border border-yellow-100/50">
              <Archive className="h-5.5 w-5.5" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{archivedCount}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">Đã lưu trữ</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pill status filter & search controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        {/* Left: Pill Status Filters */}
        <div className="flex flex-wrap gap-1.5 bg-gray-50 p-1 rounded-full w-fit border border-gray-150">
          {statusTabs.map((tab) => {
            const isActive = statusFilter === tab.value;
            const count = tab.value === 'all'
              ? projects.length
              : projects.filter(p => p.status === tab.value).length;

            return (
              <button
                key={tab.value}
                onClick={() => {
                  setStatusFilter(tab.value);
                  setPage(1);
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/60'
                }`}
              >
                {tab.label}
                <span className={`inline-block px-1.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-gray-200/80 text-gray-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Search Input */}
        <div className="flex items-center gap-3 flex-1 md:max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm theo tên dự án, chủ đầu tư..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-10 rounded-xl border-gray-200 focus:ring-primary/20 focus:border-primary font-medium text-xs h-9.5"
            />
          </div>
        </div>
      </div>

      {/* Card Table View */}
      <Card className="border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] rounded-2xl overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow className="border-b border-gray-100">
                  <TableHead className="w-16 font-extrabold text-[10.5px] uppercase tracking-wider text-gray-400 py-3.5 pl-6">ID</TableHead>
                  <TableHead className="w-[300px] font-extrabold text-[10.5px] uppercase tracking-wider text-gray-400 py-3.5">Tên dự án / Vị trí</TableHead>
                  <TableHead className="font-extrabold text-[10.5px] uppercase tracking-wider text-gray-400 py-3.5">Thông tin / Chủ đầu tư</TableHead>
                  <TableHead className="font-extrabold text-[10.5px] uppercase tracking-wider text-gray-400 py-3.5">Khoảng giá</TableHead>
                  <TableHead className="font-extrabold text-[10.5px] uppercase tracking-wider text-gray-400 py-3.5">Trạng thái</TableHead>
                  <TableHead className="text-right font-extrabold text-[10.5px] uppercase tracking-wider text-gray-400 py-3.5 pr-6">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading || isFiltering ? (
                  [...Array(perPage)].map((_, idx) => (
                    <TableRow key={idx} className="border-b border-gray-100/60">
                      <TableCell className="pl-6"><div className="h-4 w-6 bg-gray-100 rounded animate-pulse" /></TableCell>
                      <TableCell>
                        <div className="space-y-1.5">
                          <div className="h-3.5 w-48 bg-gray-100 rounded animate-pulse" />
                          <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1.5">
                          <div className="h-3.5 w-24 bg-gray-100 rounded animate-pulse" />
                          <div className="h-3 w-36 bg-gray-100 rounded animate-pulse" />
                        </div>
                      </TableCell>
                      <TableCell><div className="h-4 w-28 bg-gray-100 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-5.5 w-20 bg-gray-100 rounded-full animate-pulse" /></TableCell>
                      <TableCell className="text-right pr-6"><div className="h-8 w-8 bg-gray-100 rounded-lg animate-pulse ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : paginatedProjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16 text-gray-400 font-medium">
                      Không tìm thấy dự án nào phù hợp.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedProjects.map((project) => {
                    const statusCfg = statusConfig[project.status as ProjectStatus] || statusConfig.draft;
                    const StatusIcon = statusCfg.icon;

                    return (
                      <TableRow key={project.id} className="hover:bg-gray-50/40 border-b border-gray-100 transition-colors">
                        {/* ID */}
                        <TableCell className="font-bold text-gray-400 text-xs pl-6">
                          #{project.id}
                        </TableCell>

                        {/* Project name & location */}
                        <TableCell className="py-3">
                          <div>
                            <p className="font-bold text-gray-900 text-[13px] leading-snug">{project.name}</p>
                            <p className="text-[11px] text-gray-500 font-semibold mt-1 flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
                              {project.location || 'Quảng Ngãi'}
                            </p>
                          </div>
                        </TableCell>

                        {/* Category & investor */}
                        <TableCell>
                          <div>
                            {/* Hiển thị loại hình dự án — derive từ `type` thay cho category tự nhập */}
                            <p className="font-semibold text-gray-800 text-[12px]">{getTypeLabel(project.type)}</p>
                            {project.investor && (
                              <p className="text-[10px] text-gray-400 font-bold mt-0.5 flex items-center gap-1">
                                <Building className="h-3 w-3 text-gray-400 shrink-0" />
                                CĐT: {project.investor}
                              </p>
                            )}
                          </div>
                        </TableCell>

                        {/* Price */}
                        <TableCell className="font-bold text-gray-800 text-xs">
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                            {project.price_display || (
                              project.min_price
                                ? `${formatPrice(project.min_price)} - ${formatPrice(project.max_price || project.min_price)}`
                                : 'Liên hệ'
                            )}
                          </span>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Badge className={`${statusCfg.color} border border-gray-100/50 shadow-none font-bold py-0.5 px-2.5 text-[10px] rounded-full tracking-wide flex items-center gap-1.5 w-fit`}>
                            <StatusIcon className="h-3.5 w-3.5 shrink-0" />
                            {statusCfg.label}
                          </Badge>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-end gap-1">
                            <a
                              href={`${CLIENT_URL}/du-an/${project.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-8 w-8 rounded-lg border border-gray-100 hover:border-primary/30 hover:bg-primary-light flex items-center justify-center transition-all group"
                              title="Xem dự án ngoài client"
                            >
                              <ExternalLink className="h-3.5 w-3.5 text-gray-400 group-hover:text-primary transition-colors" />
                            </a>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 rounded-lg hover:bg-gray-100 transition-all text-gray-500 hover:text-gray-800"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl w-40">
                                <DropdownMenuItem
                                  data-testid={`edit-project-btn-${project.id}`}
                                  onClick={() => {
                                    router.push(`/admin/projects/${project.id}/edit`);
                                  }}
                                  className="font-bold text-xs gap-2 rounded-lg cursor-pointer"
                                >
                                  <Edit2 className="h-4 w-4" />
                                  Chỉnh sửa
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {(project.status === 'draft' || project.status === 'upcoming') && (
                                  <DropdownMenuItem
                                    onClick={() => handlePublish(project.id)}
                                    className="text-green-600 font-bold text-xs gap-2 focus:text-green-700 focus:bg-green-50/50 rounded-lg cursor-pointer"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                    Mở bán ngay
                                  </DropdownMenuItem>
                                )}
                                {(project.status === 'selling' || project.status === 'paused') && (
                                  <DropdownMenuItem
                                    onClick={() => handleArchive(project.id)}
                                    className="text-yellow-600 font-bold text-xs gap-2 focus:text-yellow-700 focus:bg-yellow-50/50 rounded-lg cursor-pointer"
                                  >
                                    <Archive className="h-4 w-4" />
                                    Lưu trữ dự án
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDelete(project.id)}
                                  className="text-red-600 font-bold text-xs gap-2 focus:text-red-700 focus:bg-red-50/50 rounded-lg cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Xóa dự án
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Premium Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50 gap-4">
            {/* Left: Per page size selector & counts */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-bold">Số lượng hàng:</span>
              <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v || '5')); setPage(1); }}>
                <SelectTrigger className="h-8 w-24 rounded-xl border-gray-200 text-xs font-bold text-gray-700 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="5">5 hàng</SelectItem>
                  <SelectItem value="10">10 hàng</SelectItem>
                  <SelectItem value="15">15 hàng</SelectItem>
                  <SelectItem value="20">20 hàng</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs text-gray-500 font-bold ml-1.5">
                {totalCount > 0 ? `${startIndex + 1}-${endIndex}` : '0'} / {totalCount} dự án
              </span>
            </div>

            {/* Right: Numeric pagination triggers */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-150/80 shadow-sm w-fit">
              <Button
                variant="ghost"
                size="icon"
                className="h-7.5 w-7.5 rounded-lg text-gray-400 hover:text-gray-900 disabled:opacity-30"
                disabled={pageIndex === 1}
                onClick={() => setPage(1)}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7.5 w-7.5 rounded-lg text-gray-400 hover:text-gray-900 disabled:opacity-30"
                disabled={pageIndex === 1}
                onClick={() => setPage(pageIndex - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {/* Individual numeric pages */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                const isCurrent = p === pageIndex;
                return (
                  <Button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`h-7.5 w-7.5 rounded-lg font-extrabold text-[11px] transition-all p-0 ${
                      isCurrent
                        ? 'bg-gray-900 text-white shadow-sm border-0 hover:bg-gray-800'
                        : 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {p}
                  </Button>
                );
              })}

              <Button
                variant="ghost"
                size="icon"
                className="h-7.5 w-7.5 rounded-lg text-gray-400 hover:text-gray-900 disabled:opacity-30"
                disabled={pageIndex === totalPages}
                onClick={() => setPage(pageIndex + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7.5 w-7.5 rounded-lg text-gray-400 hover:text-gray-900 disabled:opacity-30"
                disabled={pageIndex === totalPages}
                onClick={() => setPage(totalPages)}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
