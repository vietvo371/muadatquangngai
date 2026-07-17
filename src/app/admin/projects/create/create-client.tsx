'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  Building,
  DollarSign,
  MapPin,
  Calendar,
  Layers,
  Award,
  ShieldCheck,
  TrendingUp,
  Save,
  X,
  Plus,
  Image as ImageIcon
} from 'lucide-react';
import { projectApi, userAdminApi } from '@/lib/admin-api';
import { slugify } from '@/lib/formatters';
import ProjectLivePreview from '@/components/admin/ProjectLivePreview';
import { ImageUploader, UploadedFile } from '@/components/shared/ImageUploader';
import { RichTextEditor } from '@/components/shared/RichTextEditor';
import { FloorPlansEditor, type FloorPlanRow } from '@/components/admin/FloorPlansEditor';
import { toStoredFloorPlans } from '@/lib/floor-plans';
import { AddressAutocomplete } from '@/components/shared/AddressAutocomplete';
import { PriceInput } from '@/components/shared/PriceInput';
import { LocationSelect } from '@/components/shared/LocationSelect';
// PREDEFINED_UTILITIES được chia sẻ với edit form và ProjectPreview — Single Source of Truth
import { PREDEFINED_UTILITIES } from '@/lib/project-utilities';
import { PROJECT_TYPE_OPTIONS, DEFAULT_PROJECT_TYPE, isLandLikeProjectType } from '@/lib/project-type';
// ... [Lines 50 to 92 represent type definitions and initial data]
interface ProjectFormData {
  name: string;
  slug: string;
  investor: string;
  type: string;
  min_price: number;
  max_price: number;
  total_area: number;
  total_units: number;
  total_blocks: number;
  total_floors: number;
  legal: string;
  handover_date: string;
  construction_progress: number;
  construction_note: string;
  province_id?: number;
  district_id?: number;
  district_name?: string;
  province_name?: string;
  ward_id?: number;
  agent_id?: number;
  location: string;
  description: string;
  utilities: string[];
  status: string;
  thumbnail: string;
  floor_plans: FloorPlanRow[];
}

const initialFormData: ProjectFormData = {
  name: '',
  slug: '',
  investor: '',
  type: DEFAULT_PROJECT_TYPE,
  min_price: 0,
  max_price: 0,
  total_area: 0,
  total_units: 0,
  total_blocks: 0,
  total_floors: 0,
  legal: '',
  handover_date: '',
  construction_progress: 0,
  construction_note: '',
  province_id: 64, // Quảng Ngãi
  district_id: undefined,
  ward_id: undefined,
  agent_id: undefined,
  location: '',
  description: '',
  utilities: [],
  status: 'draft',
  thumbnail: '',
  floor_plans: [],
};

export default function CreateProjectClient() {
  const router = useRouter();
  const [formData, setFormData] = useState<ProjectFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [projectImages, setProjectImages] = useState<UploadedFile[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);

  // Load agents on mount
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setIsLoadingAgents(true);
        const res = await userAdminApi.list({ role: 'agent' });
        setAgents((prev) => {
          const loaded = res.data || [];
          const merged = [...prev];
          loaded.forEach((a: any) => {
            if (!merged.some((m) => m.id === a.id)) {
              merged.push(a);
            }
          });
          return merged;
        });
      } catch (err) {
        console.error('Failed to fetch agents:', err);
      } finally {
        setIsLoadingAgents(false);
      }
    };
    fetchAgents();
  }, []);

  const getLogicWarnings = () => {
    const warnings: string[] = [];
    if (formData.type === 'nha-o-xa-hoi' && formData.total_floors < 1) {
      warnings.push('Loại hình Nhà ở xã hội thường có ít nhất 1 tầng cao.');
    }
    if (isLandLikeProjectType(formData.type) && formData.total_floors > 1) {
      warnings.push('Khu đô thị mới / Khu dân cư thường không ghi nhận số tầng cao dự án.');
    }
    if (isLandLikeProjectType(formData.type) && formData.total_units < 1) {
      warnings.push('Khu đô thị mới / Khu dân cư nên ghi nhận tổng số lô đất (Tổng số căn).');
    }
    if ((formData.status === 'selling' || formData.status === 'upcoming') && formData.handover_date) {
      const handover = new Date(formData.handover_date);
      const today = new Date();
      handover.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      if (handover < today) {
        warnings.push('Ngày bàn giao dự kiến đang ở trong quá khứ đối với dự án sắp/đang mở bán.');
      }
    }
    return warnings;
  };
// ... [Lines 100 to 323 represent standard input changes and form layout]
  // Auto slug generation based on name
  useEffect(() => {
    if (!isSlugManual && formData.name) {
      setFormData((prev) => ({
        ...prev,
        slug: slugify(formData.name),
      }));
    }
  }, [formData.name, isSlugManual]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : Number(value)) : value,
    }));
  };

  const handleSelectChange = (name: string, value: string | null) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value || '',
    }));
  };

  const toggleUtility = (utility: string) => {
    setFormData((prev) => {
      const isSelected = prev.utilities.includes(utility);
      const updated = isSelected
        ? prev.utilities.filter((u) => u !== utility)
        : [...prev.utilities, utility];
      return {
        ...prev,
        utilities: updated,
      };
    });
  };

  // Nhập tiện ích tự do — type + Enter hoặc click nút +
  const [customUtilityInput, setCustomUtilityInput] = React.useState('');
  const addCustomUtility = () => {
    const val = customUtilityInput.trim();
    if (!val) return;
    if (!formData.utilities.includes(val)) {
      setFormData((prev) => ({ ...prev, utilities: [...prev.utilities, val] }));
    }
    setCustomUtilityInput('');
  };
  const handleCustomUtilityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomUtility();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên dự án.');
      return;
    }
    if (!formData.location.trim()) {
      toast.error('Vui lòng nhập địa chỉ dự án.');
      return;
    }

    // Nghiệp vụ Cảnh báo ngày bàn giao trong quá khứ
    if ((formData.status === 'selling' || formData.status === 'upcoming') && formData.handover_date) {
      const handover = new Date(formData.handover_date);
      const today = new Date();
      handover.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      if (handover < today) {
        toast.warning('Ngày bàn giao dự kiến đang ở trong quá khứ đối với dự án sắp/đang mở bán.');
      }
    }

    try {
      setIsSubmitting(true);
      // Clean and format payload to match API validation exactly
      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim() || undefined,
        min_price: formData.min_price || undefined,
        max_price: formData.max_price || undefined,
        investor: formData.investor.trim() || undefined,
        type: formData.type,
        location: formData.location.trim(),
        province_id: formData.province_id || undefined,
        district_id: formData.district_id || undefined,
        ward_id: formData.ward_id || undefined,
        agent_id: formData.agent_id ? Number(formData.agent_id) : undefined,
        description: formData.description.trim() || undefined,
        total_area: formData.total_area ? Number(formData.total_area) : undefined,
        total_units: formData.total_units ? Number(formData.total_units) : undefined,
        total_blocks: formData.total_blocks ? Number(formData.total_blocks) : undefined,
        total_floors: formData.total_floors ? Number(formData.total_floors) : undefined,
        legal: formData.legal.trim() || undefined,
        handover_date: formData.handover_date || undefined,
        construction_progress: formData.construction_progress || 0,
        construction_note: formData.construction_note.trim() || undefined,
        utilities: formData.utilities.length > 0 ? formData.utilities : undefined,
        status: formData.status as any,
        thumbnail: formData.thumbnail || undefined,
        floor_plans: toStoredFloorPlans(formData.floor_plans),
      };

      await projectApi.create(payload);
      toast.success('Thêm mới dự án thành công!');
      router.push('/admin/projects');
      router.refresh();
    } catch (error: any) {
      console.error('Error creating project:', error);
      const msg = error?.response?.data?.message || 'Có lỗi xảy ra khi tạo dự án.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/admin/projects')}
            className="h-9 w-9 rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
            data-testid="project-cancel-btn"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Thêm dự án mới</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Tạo dự án mới với các thông tin quy mô, vị trí, tiện ích và xem trước giao diện chi tiết.
            </p>
          </div>
        </div>
      </div>

      {/* Main Layout Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Form Column */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card 1: Thông tin chung */}
          <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white overflow-hidden hover:shadow-md transition-shadow duration-300">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4 px-6">
              <CardTitle className="text-[14px] font-bold text-gray-800 flex items-center gap-2">
                <Layers className="h-4.5 w-4.5 text-primary" />
                Thông tin chung
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tên dự án *</label>
                <Input
                  name="name"
                  placeholder="Nhập tên dự án (ví dụ: Khu đô thị VSIP Quảng Ngãi)"
                  value={formData.name}
                  onChange={handleChange}
                  data-testid="project-name-input"
                  className="h-10 text-sm rounded-xl border-gray-200 focus:border-primary focus:ring-primary/10"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Đường dẫn Slug *</label>
                <Input
                  name="slug"
                  placeholder="slug-du-an"
                  value={formData.slug}
                  onChange={(e) => {
                    setIsSlugManual(true);
                    handleChange(e);
                  }}
                  data-testid="project-slug-input"
                  className="h-10 text-sm rounded-xl border-gray-200 focus:border-primary focus:ring-primary/10 font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Chủ đầu tư</label>
                  <Input
                    name="investor"
                    placeholder="Tên chủ đầu tư"
                    value={formData.investor}
                    onChange={handleChange}
                    data-testid="project-investor-input"
                    className="h-10 text-sm rounded-xl border-gray-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Loại hình</label>
                  <Select
                    value={formData.type}
                    onValueChange={(val) => handleSelectChange('type', val)}
                  >
                    <SelectTrigger className="w-full h-10 text-sm rounded-xl border-gray-200 bg-white">
                      {/* Base UI Select.Value không tự resolve nhãn từ SelectItem như Radix —
                          phải tự map value -> label bằng children function. */}
                      <SelectValue placeholder="Chọn loại hình">
                        {(value: string) => PROJECT_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {PROJECT_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Giá tối thiểu (VND)</label>
                  <PriceInput
                    value={formData.min_price}
                    onChange={(val) => setFormData(prev => ({ ...prev, min_price: val }))}
                    placeholder="Nhập giá tối thiểu (ví dụ: 1.5 tỷ)"
                    className="h-10 text-sm rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Giá tối đa (VND)</label>
                  <PriceInput
                    value={formData.max_price}
                    onChange={(val) => setFormData(prev => ({ ...prev, max_price: val }))}
                    placeholder="Nhập giá tối đa (ví dụ: 3.5 tỷ)"
                    className="h-10 text-sm rounded-xl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 1.5: Hình ảnh dự án */}
          <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white overflow-hidden hover:shadow-md transition-shadow duration-300">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4 px-6">
              <CardTitle className="text-[14px] font-bold text-gray-800 flex items-center gap-2">
                <ImageIcon className="h-4.5 w-4.5 text-primary" />
                Hình ảnh dự án
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Ảnh đại diện dự án (Thumbnail) *
                </label>
                <ImageUploader
                  files={projectImages}
                  maxFiles={10}
                  onChange={(uploadedFiles) => {
                    setProjectImages(uploadedFiles);
                    const primaryFile = uploadedFiles.find((f) => f.isPrimary);
                    const otherFiles = uploadedFiles.filter((f) => !f.isPrimary);
                    const allFilesOrdered = primaryFile 
                      ? [primaryFile, ...otherFiles] 
                      : uploadedFiles;
                    const thumbnailValue = allFilesOrdered.map(f => f.url).join(',');
                    setFormData((prev) => ({
                      ...prev,
                      thumbnail: thumbnailValue,
                    }));
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Quy mô dự án */}
          <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white overflow-hidden hover:shadow-md transition-shadow duration-300">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4 px-6">
              <CardTitle className="text-[14px] font-bold text-gray-800 flex items-center gap-2">
                <Building className="h-4.5 w-4.5 text-primary" />
                Quy mô dự án
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Diện tích (ha)</label>
                <Input
                  type="number"
                  step="any"
                  name="total_area"
                  placeholder="0.0"
                  value={formData.total_area || ''}
                  onChange={handleChange}
                  className="h-10 text-sm rounded-xl border-gray-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tổng số căn</label>
                <Input
                  type="number"
                  name="total_units"
                  placeholder="0"
                  value={formData.total_units || ''}
                  onChange={handleChange}
                  className="h-10 text-sm rounded-xl border-gray-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Số Block / Phân khu</label>
                <Input
                  type="number"
                  name="total_blocks"
                  placeholder="0"
                  value={formData.total_blocks || ''}
                  onChange={handleChange}
                  className="h-10 text-sm rounded-xl border-gray-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Số tầng cao</label>
                <Input
                  type="number"
                  name="total_floors"
                  placeholder="0"
                  value={formData.total_floors || ''}
                  onChange={handleChange}
                  className="h-10 text-sm rounded-xl border-gray-200"
                />
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Mô tả chi tiết */}
          <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white overflow-hidden hover:shadow-md transition-shadow duration-300">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4 px-6">
              <CardTitle className="text-[14px] font-bold text-gray-800 flex items-center gap-2">
                <Layers className="h-4.5 w-4.5 text-primary" />
                Mô tả chi tiết
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Mô tả dự án</label>
                <RichTextEditor
                  value={formData.description}
                  onChange={(html) => setFormData((prev) => ({ ...prev, description: html }))}
                  placeholder="Nhập mô tả tổng quan về dự án, thông tin quy hoạch, hạ tầng kỹ thuật..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Pháp lý & Tiến độ */}
          <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white overflow-hidden hover:shadow-md transition-shadow duration-300">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4 px-6">
              <CardTitle className="text-[14px] font-bold text-gray-800 flex items-center gap-2">
                <ShieldCheck className="h-4.5 w-4.5 text-primary" />
                Pháp lý, Tiến độ & Môi giới
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tình trạng pháp lý</label>
                  <Select
                    value={formData.legal}
                    onValueChange={(val) => handleSelectChange('legal', val)}
                  >
                    <SelectTrigger className="w-full h-10 text-sm rounded-xl border-gray-200 bg-white">
                      <SelectValue placeholder="Chọn tình trạng pháp lý" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="Sổ đỏ / GCNQSD đất">Sổ đỏ / GCNQSD đất</SelectItem>
                      <SelectItem value="Sổ hồng / GCNQSH nhà ở">Sổ hồng / GCNQSH nhà ở</SelectItem>
                      <SelectItem value="Đang hoàn thiện pháp lý">Đang hoàn thiện pháp lý</SelectItem>
                      <SelectItem value="Hợp đồng mua bán (HĐMB)">Hợp đồng mua bán (HĐMB)</SelectItem>
                      <SelectItem value="Giấy phép xây dựng">Giấy phép xây dựng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Môi giới phụ trách</label>
                  <Select
                    value={formData.agent_id ? String(formData.agent_id) : 'none'}
                    onValueChange={(val) => handleSelectChange('agent_id', val === 'none' ? null : val)}
                  >
                    <SelectTrigger className="w-full h-10 text-sm rounded-xl border-gray-200 bg-white" disabled={isLoadingAgents}>
                      <SelectValue placeholder="Chọn môi giới phụ trách" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="none">Chưa liên kết / Không có</SelectItem>
                      {agents.map((agent) => (
                        <SelectItem key={agent.id} value={String(agent.id)}>
                          {agent.name} {agent.phone ? `(${agent.phone})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ngày bàn giao dự kiến</label>
                  <Input
                    type="date"
                    name="handover_date"
                    value={formData.handover_date}
                    onChange={handleChange}
                    className="h-10 text-sm rounded-xl border-gray-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Tiến độ thi công ({formData.construction_progress}%)
                  </label>
                  <div className="flex items-center gap-3 mt-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      name="construction_progress"
                      value={formData.construction_progress}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          construction_progress: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-primary h-2 bg-gray-150 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ghi chú tiến độ thi công</label>
                <Input
                  name="construction_note"
                  placeholder="Ví dụ: Đang thi công móng, Cất nóc..."
                  value={formData.construction_note}
                  onChange={handleChange}
                  className="h-10 text-sm rounded-xl border-gray-200"
                />
              </div>
            </CardContent>
          </Card>

          {/* Card 4b: Loại mặt bằng điển hình */}
          <FloorPlansEditor
            value={formData.floor_plans}
            onChange={(rows) => setFormData((prev) => ({ ...prev, floor_plans: rows }))}
          />

          {/* Card 5: Vị trí & Trạng thái */}
          <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white overflow-hidden hover:shadow-md transition-shadow duration-300">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4 px-6">
              <CardTitle className="text-[14px] font-bold text-gray-800 flex items-center gap-2">
                <MapPin className="h-4.5 w-4.5 text-primary" />
                Vị trí & Trạng thái
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-4 border-b border-gray-50 pb-4">
                <LocationSelect
                  value={{
                    province_id: formData.province_id,
                    district_id: formData.district_id,
                    ward_id: formData.ward_id,
                  }}
                  onChange={(val) => {
                    setFormData((prev) => ({
                      ...prev,
                      province_id: val.province_id,
                      district_id: val.district_id,
                      district_name: val.district_name,
                      province_name: val.province_name,
                      ward_id: val.ward_id,
                      location: prev.location || [val.ward_name, val.district_name, val.province_name].filter(Boolean).join(', ')
                    }));
                  }}
                  required
                />

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Địa chỉ chi tiết *</label>
                  <AddressAutocomplete
                    value={formData.location}
                    onChange={(address) => {
                      setFormData((prev) => ({ ...prev, location: address }));
                    }}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái dự án</label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => handleSelectChange('status', val)}
                >
                  <SelectTrigger className="w-full h-10 text-sm rounded-xl border-gray-200 bg-white" data-testid="project-status-select">
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                      {/* Vòng đời: draft → upcoming → selling → (paused) → completed → archived */}
                      <SelectItem value="draft">Bản nháp</SelectItem>
                      <SelectItem value="upcoming">Sắp mở bán</SelectItem>
                      <SelectItem value="selling">Đang mở bán</SelectItem>
                      <SelectItem value="paused">Tạm dừng</SelectItem>
                      <SelectItem value="completed">Đã bàn giao</SelectItem>
                      <SelectItem value="archived">Đã lưu trữ</SelectItem>
                    </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Tiện ích nổi bật</label>

                {/* Danh sách predefined — click để toggle */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                  {PREDEFINED_UTILITIES.map((util) => {
                    const isSelected = formData.utilities.includes(util);
                    return (
                      <button
                        type="button"
                        key={util}
                        onClick={() => toggleUtility(util)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left truncate flex items-center gap-1.5 select-none ${
                          isSelected
                            ? 'bg-primary/5 border-primary text-primary shadow-xs'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-primary' : 'bg-gray-300'}`} />
                        {util}
                      </button>
                    );
                  })}
                </div>

                {/* Tiện ích tự do — nhập vào + Enter hoặc nút + để thêm tag mới */}
                <div className="mt-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customUtilityInput}
                      onChange={(e) => setCustomUtilityInput(e.target.value)}
                      onKeyDown={handleCustomUtilityKeyDown}
                      placeholder="Nhập tiện ích khác... (Enter để thêm)"
                      className="flex-1 text-xs border border-dashed border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-white placeholder:text-gray-400 font-medium transition-all"
                    />
                    <button
                      type="button"
                      onClick={addCustomUtility}
                      disabled={!customUtilityInput.trim()}
                      className="px-3 py-2 rounded-xl bg-primary text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-dark transition-all"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Hiển thị các tiện ích tự do đã thêm (không có trong predefined list) */}
                  {formData.utilities.filter(u => !PREDEFINED_UTILITIES.includes(u)).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {formData.utilities
                        .filter(u => !PREDEFINED_UTILITIES.includes(u))
                        .map(util => (
                          <span
                            key={util}
                            className="flex items-center gap-1 text-[11px] font-bold bg-primary/5 text-primary border border-primary/20 px-2.5 py-1.5 rounded-lg"
                          >
                            {util}
                            <button
                              type="button"
                              onClick={() => toggleUtility(util)}
                              className="ml-0.5 hover:text-red-500 transition-colors font-black"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cảnh báo mâu thuẫn nghiệp vụ (nếu có) */}
          {getLogicWarnings().length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 select-none">
              <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5 uppercase tracking-wider">
                <ShieldCheck className="h-4.5 w-4.5 text-amber-600" />
                Lưu ý nghiệp vụ cần kiểm tra:
              </p>
              <ul className="list-disc list-inside text-xs text-amber-700 font-medium space-y-1">
                {getLogicWarnings().map((warn, i) => (
                  <li key={i}>{warn}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={isSubmitting}
              data-testid="project-submit-btn"
              className="bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs h-10 px-6 gap-1.5 shadow-sm transition-all flex-1"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? 'Đang lưu dự án...' : 'Lưu dự án'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/projects')}
              className="border-gray-200 text-gray-600 rounded-xl font-bold text-xs h-10 px-6 transition-all hover:bg-gray-50"
            >
              Hủy bỏ
            </Button>
          </div>
        </form>

        {/* Live Preview Column */}
        <div className="hidden lg:block lg:sticky lg:top-6">
          <ProjectLivePreview
            data={{
              ...formData,
              images: projectImages.map(img => img.url),
              agentName: agents.find(a => String(a.id) === String(formData.agent_id))?.name,
              agentTitle: formData.agent_id ? 'Môi giới phụ trách' : undefined,
              floor_plans: toStoredFloorPlans(formData.floor_plans),
            }}
          />
        </div>
      </div>
    </div>
  );
}
