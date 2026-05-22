'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useConfirm } from '@/components/providers/confirm-provider';
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
  PlusCircle,
  CheckCircle,
  XCircle,
  Search,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
  Package as PackageIcon,
} from 'lucide-react';
import { packageApi, type Package } from '@/lib/admin-api';
import { formatPrice } from '@/lib/formatters';

const VIP_COLORS: Record<string, string> = {
  vip: 'bg-primary-light text-primary hover:bg-primary-light/80 border-primary-100/50',
  vip_plus: 'bg-red-50 text-red-700 hover:bg-red-100/60 border-red-200/50',
  diamond: 'bg-blue-50 text-blue-700 hover:bg-blue-100/60 border-blue-200/50',
};

const VIP_LABELS: Record<string, string> = {
  vip: 'VIP',
  vip_plus: 'VIP+',
  diamond: 'Diamond',
};

const MOCK_PACKAGES: Package[] = [
  {
    id: 1,
    name: 'Tin Thường Quảng Ngãi',
    type: 'vip',
    price: 0,
    duration_days: 30,
    highlight_color: '#94a3b8',
    features: ['Đăng tin hiển thị tiêu chuẩn', 'Hỗ trợ hiển thị 30 ngày', 'Tải lên tối đa 5 hình ảnh'],
    sort_order: 1,
    is_active: true,
  },
  {
    id: 2,
    name: 'Tin VIP Quảng Ngãi',
    type: 'vip',
    price: 150000,
    duration_days: 15,
    highlight_color: '#1075b1',
    features: ['Đứng đầu trên tin thường', 'Đánh dấu nhãn VIP xanh nổi bật', 'Hỗ trợ hiển thị 15 ngày', 'Tải lên tối đa 15 hình ảnh', 'Hỗ trợ chia sẻ mạng xã hội'],
    sort_order: 2,
    is_active: true,
  },
  {
    id: 3,
    name: 'Tin VIP+ Tiêu Điểm',
    type: 'vip_plus',
    price: 350000,
    duration_days: 10,
    highlight_color: '#e03131',
    features: ['Đứng đầu danh mục & trang chủ', 'Đánh dấu nhãn VIP+ đỏ thu hút', 'Đẩy tin tự động 1 lần/ngày', 'Hỗ trợ hiển thị 10 ngày', 'Tải lên tối đa 25 hình ảnh', 'Báo cáo lượt xem tin đăng'],
    sort_order: 3,
    is_active: true,
  },
  {
    id: 4,
    name: 'Tin Kim Cương (Diamond)',
    type: 'diamond',
    price: 800000,
    duration_days: 7,
    highlight_color: '#3b82f6',
    features: ['Vị trí độc quyền Banner đầu trang', 'Đánh dấu nhãn Diamond lấp lánh', 'Đẩy tin tự động 3 lần/ngày', 'Hỗ trợ hiển thị 7 ngày', 'Hỗ trợ chụp ảnh & quay flycam', 'Tải hình ảnh / video không giới hạn', 'Nhân viên hỗ trợ riêng 24/7'],
    sort_order: 4,
    is_active: true,
  },
];

const statusTabs = [
  { value: 'all', label: 'Tất cả gói' },
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'inactive', label: 'Tạm ẩn/Tắt' },
  { value: 'vip', label: 'VIP' },
  { value: 'vip_plus', label: 'VIP+' },
  { value: 'diamond', label: 'Diamond' },
];

export default function AdminPackagesPage() {
  const confirm = useConfirm();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [useRealApi, setUseRealApi] = useState(true);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(6);

  // Dialogs
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [isActionPending, setIsActionPending] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'vip' as 'vip' | 'vip_plus' | 'diamond',
    price: 0,
    duration_days: 30,
    highlight_color: '#1075b1',
    features: [] as string[],
    sort_order: 0,
    is_active: true,
  });
  const [newFeature, setNewFeature] = useState('');

  const loadPackages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await packageApi.list();
      if (response && response.data && response.data.length > 0) {
        setPackages(response.data);
        setUseRealApi(true);
      } else {
        setPackages(MOCK_PACKAGES);
        setUseRealApi(false);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
      setPackages(MOCK_PACKAGES);
      setUseRealApi(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  // Simulate premium micro-animation delay when page/filters change
  useEffect(() => {
    setIsFiltering(true);
    const timer = setTimeout(() => {
      setIsFiltering(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [statusFilter, searchQuery, page, perPage]);

  // Client-side filtering & search
  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      let matchStatus = true;
      if (statusFilter === 'active') matchStatus = pkg.is_active;
      else if (statusFilter === 'inactive') matchStatus = !pkg.is_active;
      else if (statusFilter === 'vip') matchStatus = pkg.type === 'vip';
      else if (statusFilter === 'vip_plus') matchStatus = pkg.type === 'vip_plus';
      else if (statusFilter === 'diamond') matchStatus = pkg.type === 'diamond';

      const matchSearch = !searchQuery.trim() ||
        pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (pkg.features && pkg.features.some(f => f.toLowerCase().includes(searchQuery.toLowerCase())));

      return matchStatus && matchSearch;
    });
  }, [packages, statusFilter, searchQuery]);

  // Pagination calculation
  const totalCount = filteredPackages.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
  const pageIndex = Math.min(page, totalPages);
  const startIndex = (pageIndex - 1) * perPage;
  const endIndex = Math.min(startIndex + perPage, totalCount);

  const paginatedPackages = useMemo(() => {
    return filteredPackages.slice(startIndex, endIndex);
  }, [filteredPackages, startIndex, endIndex]);

  // Quick stats
  const activeCount = packages.filter((p) => p.is_active).length;
  const inactiveCount = packages.filter((p) => !p.is_active).length;

  // Actions
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Vui lòng điền đầy đủ Tên gói dịch vụ.');
      return;
    }
    try {
      setIsActionPending(true);
      if (editingPackage) {
        if (useRealApi) {
          await packageApi.update(editingPackage.id, formData);
        }
        setPackages((prev) =>
          prev.map((p) => (p.id === editingPackage.id ? { ...p, ...formData } : p))
        );
        toast.success('Đã cập nhật gói dịch vụ thành công!');
      } else {
        let newId = packages.length + 1;
        if (useRealApi) {
          const res = await packageApi.create(formData);
          if (res && res.id) newId = res.id;
        }
        const newPkg = {
          id: newId,
          ...formData,
        };
        setPackages((prev) => [...prev, newPkg]);
        toast.success('Đã tạo gói dịch vụ mới thành công!');
      }
      setIsDialogOpen(false);
    } catch {
      toast.error('Có lỗi xảy ra khi lưu gói dịch vụ.');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleDelete = async (id: number) => {
    const isConfirmed = await confirm({
      title: 'Xóa gói dịch vụ?',
      description: 'Bạn có chắc chắn muốn xóa gói dịch vụ này? Thao tác có thể ảnh hưởng tới các tin đăng đang sử dụng.',
      confirmText: 'Xóa ngay',
      variant: 'destructive',
    });
    if (!isConfirmed) return;
    try {
      if (useRealApi) {
        await packageApi.delete(id);
      }
      setPackages((prev) => prev.filter((p) => p.id !== id));
      toast.success('Đã xóa gói dịch vụ thành công.');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Không thể xóa gói dịch vụ.');
    }
  };

  const handleToggle = async (id: number) => {
    try {
      if (useRealApi) {
        await packageApi.toggle(id);
      }
      setPackages((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_active: !p.is_active } : p))
      );
      toast.success('Đã cập nhật trạng thái hoạt động gói dịch vụ thành công!');
    } catch {
      toast.error('Có lỗi xảy ra khi cập nhật trạng thái.');
    }
  };

  const openEditDialog = (pkg: Package) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      type: pkg.type,
      price: pkg.price,
      duration_days: pkg.duration_days,
      highlight_color: pkg.highlight_color || '#1075b1',
      features: pkg.features || [],
      sort_order: pkg.sort_order,
      is_active: pkg.is_active,
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingPackage(null);
    setFormData({
      name: '',
      type: 'vip',
      price: 0,
      duration_days: 30,
      highlight_color: '#1075b1',
      features: [],
      sort_order: packages.length + 1,
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData((prev) => ({ ...prev, features: [...prev.features, newFeature.trim()] }));
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Quản lý gói dịch vụ</h1>
          <p className="text-sm text-gray-500 mt-1">Cấu hình các loại gói tin đăng VIP, VIP+, Diamond hỗ trợ kích hoạt và thúc đẩy giao dịch Quảng Ngãi.</p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="bg-primary hover:bg-primary-dark rounded-xl font-bold text-xs h-9.5 gap-1.5 shadow-sm text-white transition-all"
        >
          <PlusCircle className="h-4 w-4" />
          Thêm gói dịch vụ mới
        </Button>
      </div>

      {/* Analytics Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-gray-50 text-gray-655 rounded-xl border border-gray-100/50">
              <PackageIcon className="h-5.5 w-5.5" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{packages.length}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">Tổng số gói dịch vụ</p>
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
            <div className="p-3 bg-red-50 text-red-655 rounded-xl border border-red-100/50">
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
        <div className="flex flex-wrap gap-1.5 bg-gray-50 p-1 rounded-2xl w-fit border border-gray-150">
          {statusTabs.map((tab) => {
            const isActive = statusFilter === tab.value;
            let count = 0;
            if (tab.value === 'all') count = packages.length;
            else if (tab.value === 'active') count = activeCount;
            else if (tab.value === 'inactive') count = inactiveCount;
            else count = packages.filter((p) => p.type === tab.value).length;

            return (
              <button
                key={tab.value}
                onClick={() => {
                  setStatusFilter(tab.value);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
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
              placeholder="Tìm theo tên gói, tính năng..."
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

      {/* Grid Container */}
      <div className="relative">
        {loading || isFiltering ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(perPage)].map((_, idx) => (
              <Card key={idx} className="border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] rounded-2xl bg-white overflow-hidden">
                <div className="h-2 w-full bg-gray-100 animate-pulse" />
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
                      <div className="h-5 w-16 bg-gray-100 rounded-full animate-pulse" />
                    </div>
                    <div className="h-5 w-14 bg-gray-100 rounded-full animate-pulse" />
                  </div>
                  <div className="space-y-1 pt-2">
                    <div className="h-8 w-28 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                  </div>
                  <div className="space-y-2 pt-4 border-t">
                    {[...Array(4)].map((_, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-2">
                        <div className="h-4 w-4 bg-gray-100 rounded-full animate-pulse" />
                        <div className="h-3 w-44 bg-gray-100 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-6 border-t">
                    <div className="h-8 flex-1 bg-gray-100 rounded-lg animate-pulse" />
                    <div className="h-8 flex-1 bg-gray-100 rounded-lg animate-pulse" />
                    <div className="h-8 w-8 bg-gray-100 rounded-lg animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : paginatedPackages.length === 0 ? (
          <Card className="border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] rounded-2xl bg-white p-16 text-center">
            <PackageIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400 font-bold text-sm">Không tìm thấy gói dịch vụ nào phù hợp với bộ lọc hiện tại.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedPackages.map((pkg) => {
              const borderTopColor = pkg.highlight_color || '#1075b1';
              const statusCfg = pkg.is_active
                ? { label: 'Đang hoạt động', color: 'bg-green-50 text-green-700 border-green-200/50', icon: CheckCircle }
                : { label: 'Tạm ngưng/Tắt', color: 'bg-gray-150 text-gray-500 border-gray-200', icon: XCircle };

              const StatusIcon = statusCfg.icon;

              return (
                <Card
                  key={pkg.id}
                  className="border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)] rounded-2xl bg-white overflow-hidden transition-all flex flex-col justify-between"
                >
                  <div className="h-1.5 w-full" style={{ backgroundColor: borderTopColor }} />
                  <CardContent className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Name & Type Tag */}
                      <div className="flex justify-between items-start mb-4 gap-2">
                        <div>
                          <h3 className="font-extrabold text-gray-900 text-sm tracking-tight leading-snug line-clamp-1">{pkg.name}</h3>
                          <div className="flex gap-1.5 items-center mt-1">
                            <Badge className={`${VIP_COLORS[pkg.type]} border shadow-none font-bold py-0.5 px-2 text-[9px] rounded-md tracking-wide`}>
                              {VIP_LABELS[pkg.type]}
                            </Badge>
                            <span className="text-[10px] text-gray-400 font-bold"># {pkg.id}</span>
                          </div>
                        </div>

                        <Badge className={`${statusCfg.color} border shadow-none font-bold py-0.5 px-2 text-[9px] rounded-full tracking-wide flex items-center gap-1 shrink-0`}>
                          <StatusIcon className="h-3 w-3 shrink-0" />
                          {statusCfg.label}
                        </Badge>
                      </div>

                      {/* Pricing */}
                      <div className="mb-5 bg-gray-50/50 p-3 rounded-xl border border-gray-100 flex items-baseline gap-1">
                        <span className="text-xl font-black text-gray-900 tracking-tight">
                          {pkg.price === 0 ? 'Miễn phí' : formatPrice(pkg.price)}
                        </span>
                        {pkg.price > 0 && (
                          <span className="text-xs text-gray-400 font-extrabold"> / {pkg.duration_days} ngày</span>
                        )}
                      </div>

                      {/* Features */}
                      {pkg.features && pkg.features.length > 0 && (
                        <div className="space-y-2 mb-6">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tính năng đi kèm</p>
                          <ul className="space-y-2">
                            {pkg.features.map((feature, index) => (
                              <li key={index} className="flex items-start text-xs text-gray-600 font-semibold gap-2">
                                <span className="text-green-500 shrink-0 select-none mt-0.5">✓</span>
                                <span className="line-clamp-2">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t border-gray-100 mt-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggle(pkg.id)}
                        className={`flex-1 rounded-xl font-bold text-xs h-8.5 gap-1.5 transition-all border-gray-200 bg-white ${
                          pkg.is_active
                            ? 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                            : 'text-green-600 hover:text-green-700 hover:bg-green-50/50 hover:border-green-200'
                        }`}
                        title={pkg.is_active ? 'Ẩn gói dịch vụ' : 'Bật gói dịch vụ'}
                      >
                        {pkg.is_active ? (
                          <>
                            <EyeOff className="h-3.5 w-3.5" />
                            Ẩn gói
                          </>
                        ) : (
                          <>
                            <Eye className="h-3.5 w-3.5" />
                            Kích hoạt
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(pkg)}
                        className="flex-1 rounded-xl font-bold text-xs h-8.5 gap-1.5 transition-all text-gray-600 hover:text-gray-900 border-gray-200 bg-white"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        Chỉnh sửa
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(pkg.id)}
                        className="h-8.5 w-8.5 rounded-xl transition-all text-red-655 hover:text-red-700 hover:bg-red-50"
                        title="Xóa gói"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Premium Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border border-gray-100 bg-white rounded-2xl shadow-sm gap-4">
        {/* Left: Per page size selector & counts */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-bold">Số lượng hiển thị:</span>
          <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v)); setPage(1); }}>
            <SelectTrigger className="h-8 w-24 rounded-xl border-gray-200 text-xs font-bold text-gray-700 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="3">3 gói</SelectItem>
              <SelectItem value="6">6 gói</SelectItem>
              <SelectItem value="9">9 gói</SelectItem>
              <SelectItem value="12">12 gói</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-gray-500 font-bold ml-1.5">
            {totalCount > 0 ? `${startIndex + 1}-${endIndex}` : '0'} / {totalCount} gói dịch vụ
          </span>
        </div>

        {/* Right: Numeric pagination triggers */}
        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-150 shadow-none w-fit">
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

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && setIsDialogOpen(false)}>
        <DialogContent className="max-w-[480px] rounded-2xl overflow-hidden border border-gray-100 p-0 shadow-lg bg-white">
          <div className="bg-gray-50 border-b border-gray-100 p-6 pb-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="h-5.5 w-5.5 text-primary animate-pulse" />
                {editingPackage ? 'Chỉnh sửa gói dịch vụ' : 'Thêm gói dịch vụ mới'}
              </DialogTitle>
              <DialogDescription className="text-gray-500 text-xs mt-1">
                Tạo hoặc tinh chỉnh các chính sách tính phí, số ngày hoạt động và màu sắc phong cách hiển thị tin đăng.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-4 max-h-[380px] overflow-y-auto">
            {/* Tên gói */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tên gói dịch vụ</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ví dụ: VIP Vàng Quảng Ngãi"
                className="rounded-xl border-gray-200 text-xs font-semibold h-9.5 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* Loại & Số ngày */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Loại tin đăng</label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, type: v as 'vip' | 'vip_plus' | 'diamond' }))}
                >
                  <SelectTrigger className="rounded-xl border-gray-200 text-xs font-semibold h-9.5 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="vip">VIP</SelectItem>
                    <SelectItem value="vip_plus">VIP+</SelectItem>
                    <SelectItem value="diamond">Diamond (Kim Cương)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Thời hạn hiển thị (ngày)</label>
                <Input
                  type="number"
                  value={formData.duration_days}
                  onChange={(e) => setFormData((prev) => ({ ...prev, duration_days: parseInt(e.target.value) || 30 }))}
                  className="rounded-xl border-gray-200 text-xs font-semibold h-9.5 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            {/* Giá & Màu nổi bật */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mức giá nạp (VNĐ)</label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData((prev) => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                  className="rounded-xl border-gray-200 text-xs font-semibold h-9.5 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Màu thương hiệu / Highlight</label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="color"
                    value={formData.highlight_color}
                    onChange={(e) => setFormData((prev) => ({ ...prev, highlight_color: e.target.value }))}
                    className="h-9.5 w-14 p-1 rounded-xl border-gray-200 shrink-0 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={formData.highlight_color}
                    onChange={(e) => setFormData((prev) => ({ ...prev, highlight_color: e.target.value }))}
                    placeholder="#1075b1"
                    className="rounded-xl border-gray-200 text-xs font-semibold h-9.5 focus:ring-primary/20 focus:border-primary flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Thứ tự sắp xếp */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Thứ tự sắp xếp hiển thị</label>
              <Input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData((prev) => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                className="rounded-xl border-gray-200 text-xs font-semibold h-9.5 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* Tính năng */}
            <div className="space-y-2.5 pt-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tính năng đi kèm gói</label>
              <div className="flex gap-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Ví dụ: Đẩy tin miễn phí 1 lần/ngày"
                  className="rounded-xl border-gray-200 text-xs font-semibold h-9.5 focus:ring-primary/20 focus:border-primary"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                />
                <Button type="button" variant="outline" onClick={addFeature} className="rounded-xl font-bold text-xs h-9.5 border-gray-200 bg-white">
                  Thêm
                </Button>
              </div>

              <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 bg-gray-50 border border-gray-100/80 px-3 py-1.5 rounded-xl">
                    <span className="flex-1 text-xs text-gray-700 font-semibold">{feature}</span>
                    <button
                      type="button"
                      className="text-red-500 hover:text-red-750 font-bold text-sm px-1.5 py-0.5 rounded hover:bg-red-50"
                      onClick={() => removeFeature(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Hoạt động */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData((prev) => ({ ...prev, is_active: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="is_active" className="text-xs font-bold text-gray-700 cursor-pointer select-none">
                Cho phép gói dịch vụ hoạt động ngay sau khi lưu
              </label>
            </div>
          </div>

          <div className="flex gap-3 justify-end p-6 border-t border-gray-100 bg-gray-50/50">
            <Button
              variant="ghost"
              onClick={() => setIsDialogOpen(false)}
              className="rounded-xl font-bold text-xs h-9.5 text-gray-500 hover:bg-gray-100"
              disabled={isActionPending}
            >
              Hủy bỏ
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-primary hover:bg-primary-dark rounded-xl font-bold text-xs h-9.5 shadow-sm text-white transition-all"
              disabled={isActionPending}
            >
              {editingPackage ? 'Cập nhật' : 'Tạo mới gói'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
