'use client';

import { useState, useEffect } from 'react';
import { packageApi, Package } from '@/lib/admin-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/formatters';

const VIP_COLORS = {
  vip: 'bg-primary-light text-primary',
  vip_plus: 'bg-red-100 text-red-700',
  diamond: 'bg-gray-100 text-gray-700',
};

const VIP_LABELS = {
  vip: 'VIP',
  vip_plus: 'VIP+',
  diamond: 'Diamond',
};

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
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

  const loadPackages = async () => {
    try {
      const response = await packageApi.list();
      setPackages(response.data);
    } catch (error) {
      toast.error('Không thể tải gói dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPackages();
  }, []);

  const handleSubmit = async () => {
    try {
      if (editingPackage) {
        await packageApi.update(editingPackage.id, formData);
        toast.success('Đã cập nhật gói dịch vụ');
      } else {
        await packageApi.create(formData);
        toast.success('Đã tạo gói dịch vụ');
      }
      setIsDialogOpen(false);
      loadPackages();
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa gói dịch vụ này?')) return;

    try {
      await packageApi.delete(id);
      toast.success('Đã xóa gói dịch vụ');
      loadPackages();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Không thể xóa gói dịch vụ');
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await packageApi.toggle(id);
      toast.success('Đã cập nhật trạng thái');
      loadPackages();
    } catch (error) {
      toast.error('Có lỗi xảy ra');
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
      sort_order: packages.length,
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData({ ...formData, features: [...formData.features, newFeature.trim()] });
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý gói dịch vụ</h1>
          <p className="text-gray-500">VIP, VIP+, Diamond packages</p>
        </div>
        <Button onClick={openCreateDialog}>
          <span className="mr-2">+</span>
          Thêm gói mới
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 text-center py-8">Đang tải...</div>
        ) : (
          packages.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-white rounded-xl shadow-sm p-6 border-t-4"
              style={{ borderTopColor: pkg.highlight_color || '#1075b1' }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg">{pkg.name}</h3>
                  <Badge className={VIP_COLORS[pkg.type]}>
                    {VIP_LABELS[pkg.type]}
                  </Badge>
                </div>
                <Badge variant={pkg.is_active ? 'default' : 'secondary'}>
                  {pkg.is_active ? 'Hoạt động' : 'Tắt'}
                </Badge>
              </div>

              <div className="mb-4">
                <span className="text-3xl font-bold text-gray-900">
                  {formatPrice(pkg.price)}
                </span>
                <span className="text-gray-500"> / {pkg.duration_days} ngày</span>
              </div>

              {pkg.features && pkg.features.length > 0 && (
                <ul className="space-y-2 mb-4">
                  {pkg.features.slice(0, 4).map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600">
                      <span className="mr-2 text-green-500">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleToggle(pkg.id)}
                >
                  {pkg.is_active ? 'Tắt' : 'Bật'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openEditDialog(pkg)}
                >
                  Sửa
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => handleDelete(pkg.id)}
                >
                  Xóa
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingPackage ? 'Sửa gói dịch vụ' : 'Thêm gói dịch vụ mới'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
            <div>
              <label className="text-sm font-medium">Tên gói</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: VIP 30 ngày"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Loại</label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData({ ...formData, type: v as typeof formData.type })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vip">VIP</SelectItem>
                    <SelectItem value="vip_plus">VIP+</SelectItem>
                    <SelectItem value="diamond">Diamond</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Số ngày</label>
                <Input
                  type="number"
                  value={formData.duration_days}
                  onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) || 30 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Giá (VNĐ)</label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Màu nổi bật</label>
                <Input
                  type="color"
                  value={formData.highlight_color}
                  onChange={(e) => setFormData({ ...formData, highlight_color: e.target.value })}
                  className="h-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Tính năng</label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="VD: Đăng tin không giới hạn"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                />
                <Button type="button" variant="outline" onClick={addFeature}>
                  Thêm
                </Button>
              </div>
              <div className="space-y-2">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded">
                    <span className="flex-1 text-sm">{feature}</span>
                    <button
                      type="button"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => removeFeature(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSubmit}>
              {editingPackage ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
