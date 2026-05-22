'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MoreVertical,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  PlusCircle,
  Search,
  Layers,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FolderOpen,
} from 'lucide-react';
import { categoryApi, type Category } from '@/lib/admin-api';
import { slugify } from '@/lib/formatters';

type CategoryStatus = 'active' | 'inactive';

// Mock categories for Quảng Ngãi market context
const MOCK_CATEGORIES = [
  {
    id: 1,
    name: 'Bán Đất Nền',
    slug: 'ban-dat-nen',
    description: 'Mua bán đất nền dự án, đất nền thổ cư, sổ đỏ trao tay tại các khu vực Quảng Ngãi.',
    icon: 'map',
    sort_order: 1,
    is_active: true,
    created_at: '2026-01-01T08:00:00Z',
  },
  {
    id: 2,
    name: 'Bán Nhà Riêng',
    slug: 'ban-nha-rieng',
    description: 'Bán nhà phố liền kề, nhà cấp 4, biệt thự phố chính chủ tại các quận huyện.',
    icon: 'home',
    sort_order: 2,
    is_active: true,
    created_at: '2026-01-02T09:00:00Z',
  },
  {
    id: 3,
    name: 'Bán Căn Hộ',
    slug: 'ban-can-ho',
    description: 'Mua bán căn hộ chung cư cao cấp, nhà ở xã hội đầy đủ tiện ích view sông view biển.',
    icon: 'building',
    sort_order: 3,
    is_active: true,
    created_at: '2026-01-05T10:00:00Z',
  },
  {
    id: 4,
    name: 'Bán Shophouse',
    slug: 'ban-shophouse',
    description: 'Nhà phố thương mại shophouse đắc địa kinh doanh sầm uất mặt tiền đại lộ lớn.',
    icon: 'store',
    sort_order: 4,
    is_active: true,
    created_at: '2026-01-10T14:30:00Z',
  },
  {
    id: 5,
    name: 'Đất Biệt Thự Nghỉ Dưỡng',
    slug: 'dat-biet-thu-nghi-duong',
    description: 'Biệt thự sinh thái ven sông Trà Khúc, ven biển Mỹ Khê nghỉ dưỡng cao cấp.',
    icon: 'palmtree',
    sort_order: 5,
    is_active: true,
    created_at: '2026-01-12T09:20:00Z',
  },
  {
    id: 6,
    name: 'Cho Thuê Nhà Nguyên Căn',
    slug: 'cho-thue-nha-nguyen-can',
    description: 'Cho thuê nhà nguyên căn mặt tiền rộng rãi kinh doanh tốt, nhà kiệt ô tô ở gia đình.',
    icon: 'key',
    sort_order: 6,
    is_active: true,
    created_at: '2026-02-15T11:10:00Z',
  },
  {
    id: 7,
    name: 'Cho Thuê Mặt Bằng',
    slug: 'cho-thue-mat-bang',
    description: 'Cho thuê mặt bằng thương mại, ki ốt sầm uất trung tâm thành phố Quảng Ngãi.',
    icon: 'warehouse',
    sort_order: 7,
    is_active: true,
    created_at: '2026-02-20T16:00:00Z',
  },
  {
    id: 8,
    name: 'Cho Thuê Phòng Trọ',
    slug: 'cho-thue-phong-tro',
    description: 'Phòng trọ sinh viên giá rẻ, nhà trọ công nhân gần các KCN VSIP, Dung Quất.',
    icon: 'bed',
    sort_order: 8,
    is_active: true,
    created_at: '2026-03-01T08:00:00Z',
  },
  {
    id: 9,
    name: 'Dự Án Quy Hoạch',
    slug: 'du-an-quy-hoach',
    description: 'Thông tin quy hoạch sử dụng đất mới nhất phục vụ nhà đầu tư trung và dài hạn.',
    icon: 'map-pin',
    sort_order: 9,
    is_active: false,
    created_at: '2026-03-05T10:20:00Z',
  },
  {
    id: 10,
    name: 'Mặt Bằng Văn Phòng',
    slug: 'mat-bang-van-phong',
    description: 'Cho thuê văn phòng làm việc trọn gói, chỗ ngồi chia sẻ chuyên nghiệp.',
    icon: 'briefcase',
    sort_order: 10,
    is_active: true,
    created_at: '2026-03-12T14:15:00Z',
  }
];

const statusConfig: Record<CategoryStatus, { label: string; color: string; icon: React.ElementType }> = {
  active: { label: 'Hoạt động', color: 'bg-green-50 text-green-700 hover:bg-green-100/60 border-green-200/50', icon: CheckCircle },
  inactive: { label: 'Đang tắt', color: 'bg-gray-150 text-gray-500 hover:bg-gray-200/60 border-gray-200', icon: XCircle },
};

const statusTabs = [
  { value: 'all', label: 'Tất cả danh mục' },
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'inactive', label: 'Tạm ẩn/Tắt' },
];

export default function CategoriesClient() {
  const confirm = useConfirm();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [useRealApi, setUseRealApi] = useState(true);

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination states
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);

  // Create / Edit Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isActionPending, setIsActionPending] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
    sort_order: 0,
    is_active: true,
  });

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await categoryApi.list({ parent_only: true });
      if (response && response.data) {
        setCategories(response.data);
        setUseRealApi(true);
      } else {
        setCategories(MOCK_CATEGORIES);
        setUseRealApi(false);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories(MOCK_CATEGORIES);
      setUseRealApi(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Simulate premium micro-animation delay when page/filters change
  useEffect(() => {
    setIsFiltering(true);
    const timer = setTimeout(() => {
      setIsFiltering(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [statusFilter, searchQuery, page, perPage]);

  // Client-side combined filtering
  const filteredCategories = useMemo(() => {
    return categories.filter((category) => {
      const matchStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && category.is_active) ||
        (statusFilter === 'inactive' && !category.is_active);

      const matchSearch = !searchQuery.trim() || 
        category.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchStatus && matchSearch;
    });
  }, [categories, statusFilter, searchQuery]);

  // Pagination calculation
  const totalCount = filteredCategories.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
  const pageIndex = Math.min(page, totalPages);
  const startIndex = (pageIndex - 1) * perPage;
  const endIndex = Math.min(startIndex + perPage, totalCount);

  const paginatedCategories = useMemo(() => {
    return filteredCategories.slice(startIndex, endIndex);
  }, [filteredCategories, startIndex, endIndex]);

  // Quick stats
  const activeCount = categories.filter((c) => c.is_active).length;
  const inactiveCount = categories.filter((c) => !c.is_active).length;

  // Actions
  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast.error('Vui lòng điền đầy đủ Tên và đường dẫn Slug danh mục.');
      return;
    }
    const isSlugDuplicate = categories.some(
      (c) => c.slug.toLowerCase().trim() === formData.slug.toLowerCase().trim() && c.id !== editingCategory?.id
    );
    if (isSlugDuplicate) {
      toast.error('Đường dẫn Slug này đã tồn tại trong hệ thống. Vui lòng nhập đường dẫn khác.');
      return;
    }
    try {
      setIsActionPending(true);
      if (editingCategory) {
        if (useRealApi) {
          await categoryApi.update(editingCategory.id, formData);
        }
        setCategories((prev) =>
          prev.map((c) => (c.id === editingCategory.id ? { ...c, ...formData } : c))
        );
        toast.success('Đã cập nhật danh mục thành công!');
      } else {
        let newId = categories.length + 1;
        if (useRealApi) {
          const res = await categoryApi.create(formData);
          if (res && res.id) newId = res.id;
        }
        const newCat = {
          id: newId,
          ...formData,
          created_at: new Date().toISOString(),
        };
        setCategories((prev) => [...prev, newCat]);
        toast.success('Đã tạo danh mục mới thành công!');
      }
      setIsDialogOpen(false);
    } catch {
      toast.error('Có lỗi xảy ra khi xử lý danh mục.');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleDelete = async (id: number) => {
    const isConfirmed = await confirm({
      title: 'Xóa danh mục?',
      description: 'Bạn có chắc chắn muốn xóa danh mục này? Thao tác có thể ảnh hưởng tới tin đăng liên quan.',
      confirmText: 'Xóa ngay',
      variant: 'destructive',
    });
    if (!isConfirmed) return;
    try {
      if (useRealApi) {
        await categoryApi.delete(id);
      }
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success('Đã xóa danh mục thành công.');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Không thể xóa danh mục.');
    }
  };

  const handleToggle = async (id: number) => {
    try {
      if (useRealApi) {
        await categoryApi.toggle(id);
      }
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_active: !c.is_active } : c))
      );
      toast.success('Đã thay đổi trạng thái hoạt động danh mục thành công!');
    } catch {
      toast.error('Có lỗi xảy ra khi thay đổi trạng thái.');
    }
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      icon: category.icon || '',
      sort_order: category.sort_order || 0,
      is_active: category.is_active,
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      icon: '',
      sort_order: categories.length + 1,
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Quản lý danh mục</h1>
          <p className="text-sm text-gray-500 mt-1">Cấu hình phân loại bất động sản bán, cho thuê, sơ đồ cấu trúc icon và thứ tự sắp xếp</p>
        </div>
        <Button
          onClick={openCreateDialog}
          data-testid="create-category-btn"
          className="bg-primary hover:bg-primary-dark rounded-xl font-bold text-xs h-9.5 gap-1.5 shadow-sm text-white transition-all"
        >
          <PlusCircle className="h-4 w-4" />
          Thêm danh mục mới
        </Button>
      </div>

      {/* Analytics Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-gray-50 text-gray-650 rounded-xl border border-gray-100/50">
              <FolderOpen className="h-5.5 w-5.5" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{categories.length}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">Tổng số danh mục</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl border border-green-100/50">
              <CheckCircle className="h-5.5 w-5.5" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{activeCount}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">Đang hoạt động</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100/50">
              <XCircle className="h-5.5 w-5.5" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{inactiveCount}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">Đã tạm ẩn/tắt</p>
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
            let count = 0;
            if (tab.value === 'all') count = categories.length;
            else if (tab.value === 'active') count = activeCount;
            else if (tab.value === 'inactive') count = inactiveCount;

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

        {/* Right: Search Box */}
        <div className="flex items-center gap-3 flex-1 md:max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm theo tên danh mục, slug..."
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
                  <TableHead className="w-[300px] font-extrabold text-[10.5px] uppercase tracking-wider text-gray-400 py-3.5">Tên danh mục / Mô tả</TableHead>
                  <TableHead className="font-extrabold text-[10.5px] uppercase tracking-wider text-gray-400 py-3.5">Slug định danh</TableHead>
                  <TableHead className="font-extrabold text-[10.5px] uppercase tracking-wider text-gray-400 py-3.5">Biểu tượng</TableHead>
                  <TableHead className="text-center font-extrabold text-[10.5px] uppercase tracking-wider text-gray-400 py-3.5">Thứ tự ưu tiên</TableHead>
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
                          <div className="h-3.5 w-40 bg-gray-100 rounded animate-pulse" />
                          <div className="h-3 w-56 bg-gray-100 rounded animate-pulse" />
                        </div>
                      </TableCell>
                      <TableCell><div className="h-4 w-28 bg-gray-100 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-5 w-10 bg-gray-100 rounded animate-pulse" /></TableCell>
                      <TableCell className="text-center"><div className="h-4 w-6 bg-gray-100 rounded animate-pulse mx-auto" /></TableCell>
                      <TableCell><div className="h-5.5 w-20 bg-gray-100 rounded-full animate-pulse" /></TableCell>
                      <TableCell className="text-right pr-6"><div className="h-8 w-8 bg-gray-100 rounded-lg animate-pulse ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : paginatedCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16 text-gray-400 font-medium">
                      Không tìm thấy danh mục nào phù hợp.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCategories.map((category) => {
                    const statusCfg = statusConfig[category.is_active ? 'active' : 'inactive'];
                    const StatusIcon = statusCfg.icon;

                    return (
                      <TableRow key={category.id} className="hover:bg-gray-50/40 border-b border-gray-100 transition-colors">
                        {/* ID */}
                        <TableCell className="font-bold text-gray-400 text-xs pl-6">
                          #{category.id}
                        </TableCell>

                        {/* Name & Description */}
                        <TableCell className="py-3">
                          <div>
                            <p className="font-bold text-gray-900 text-[13px] leading-snug">{category.name}</p>
                            {category.description && (
                              <p className="text-[11px] text-gray-500 font-semibold line-clamp-1 mt-1">
                                {category.description}
                              </p>
                            )}
                          </div>
                        </TableCell>

                        {/* Slug */}
                        <TableCell className="font-semibold text-gray-700 text-xs">
                          {category.slug}
                        </TableCell>

                        {/* Icon */}
                        <TableCell>
                          {category.icon ? (
                            <Badge variant="outline" className="border-gray-250 bg-white font-bold text-[10px] text-gray-600 rounded-lg py-0.5 px-2">
                              {category.icon}
                            </Badge>
                          ) : (
                            <span className="text-xs text-gray-400 font-semibold italic">—</span>
                          )}
                        </TableCell>

                        {/* Sort Order */}
                        <TableCell className="text-center font-bold text-gray-800 text-xs">
                          {category.sort_order || 0}
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
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleToggle(category.id)}
                              className={`h-8 px-2 rounded-lg font-bold text-xs flex items-center gap-1 transition-all ${
                                category.is_active
                                  ? 'text-gray-500 hover:text-gray-800'
                                  : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                              }`}
                              title={category.is_active ? 'Ẩn danh mục' : 'Hiện danh mục'}
                            >
                              {category.is_active ? (
                                <>
                                  <EyeOff className="h-3.5 w-3.5" />
                                  Ẩn
                                </>
                              ) : (
                                <>
                                  <Eye className="h-3.5 w-3.5" />
                                  Hiện
                                </>
                              )}
                            </Button>

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
                                  onClick={() => openEditDialog(category)}
                                  data-testid={`edit-category-btn-${category.id}`}
                                  className="font-bold text-xs gap-2 rounded-lg cursor-pointer"
                                >
                                  <Edit2 className="h-4 w-4" />
                                  Chỉnh sửa
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDelete(category.id)}
                                  className="text-red-600 font-bold text-xs gap-2 focus:text-red-700 focus:bg-red-50/50 rounded-lg cursor-pointer animate-pulse-subtle"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Xóa danh mục
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
                {totalCount > 0 ? `${startIndex + 1}-${endIndex}` : '0'} / {totalCount} danh mục
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

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && setIsDialogOpen(false)}>
        <DialogContent className="sm:max-w-[460px] rounded-2xl overflow-hidden border border-gray-100 p-0 shadow-lg bg-white">
          <div className="bg-gray-50 border-b border-gray-100 p-6 pb-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Layers className="h-5.5 w-5.5 text-primary" />
                {editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
              </DialogTitle>
              <DialogDescription className="text-gray-500 text-xs mt-1">
                Thiết lập thông tin phân loại bất động sản và các thông số hiển thị hệ thống.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tên danh mục</label>
              <Input
                value={formData.name}
                onChange={(e) => {
                  const newName = e.target.value;
                  const currentSlug = formData.slug;
                  const oldAutoSlug = slugify(formData.name);
                  const shouldAutoSlug = !editingCategory || !currentSlug || currentSlug === oldAutoSlug;
                  setFormData({
                    ...formData,
                    name: newName,
                    slug: shouldAutoSlug ? slugify(newName) : currentSlug
                  });
                }}
                placeholder="Ví dụ: Căn hộ cao cấp"
                data-testid="category-name-input"
                className="rounded-xl border-gray-200 text-xs font-semibold h-9.5 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Slug định danh (đường dẫn)</label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="Ví dụ: can-ho-cao-cap"
                data-testid="category-slug-input"
                className="rounded-xl border-gray-200 text-xs font-semibold h-9.5 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mô tả ngắn danh mục</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Nhập vài dòng mô tả giúp người dùng phân biệt rõ danh mục này..."
                rows={3}
                data-testid="category-desc-textarea"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none placeholder:text-gray-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Biểu tượng (Icon string)</label>
                <Input
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="Ví dụ: building, home"
                  data-testid="category-icon-input"
                  className="rounded-xl border-gray-200 text-xs font-semibold h-9.5 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Thứ tự ưu tiên hiển thị</label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  data-testid="category-sort-input"
                  className="rounded-xl border-gray-200 text-xs font-semibold h-9.5 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                data-testid="category-active-checkbox"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="is_active" className="text-xs font-bold text-gray-700 cursor-pointer">
                Cho phép hoạt động và hiển thị trên bộ lọc trang chủ
              </label>
            </div>

            <div className="flex gap-3 justify-end pt-3 border-t border-gray-100">
              <Button
                variant="ghost"
                onClick={() => setIsDialogOpen(false)}
                data-testid="category-cancel-btn"
                className="rounded-xl font-bold text-xs h-9.5 text-gray-500 hover:bg-gray-100"
                disabled={isActionPending}
              >
                Hủy bỏ
              </Button>
              <Button
                onClick={handleSubmit}
                data-testid="category-submit-btn"
                className="rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs h-9.5"
                disabled={isActionPending}
              >
                {isActionPending ? 'Đang lưu...' : (editingCategory ? 'Lưu chỉnh sửa' : 'Thêm mới danh mục')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
