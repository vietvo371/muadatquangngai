'use client';

import { useState } from 'react';
import { projectApi, Project } from '@/lib/admin-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
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
import { toast } from 'sonner';
import { formatPrice } from '@/lib/formatters';
import Link from 'next/link';


export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });
  const [search, setSearch] = useState('');

  const loadProjects = async (page = 1) => {
    try {
      setLoading(true);
      const response = await projectApi.list({
        search: search || undefined,
        page,
      });
      setProjects(response.data);
      setPagination({
        current_page: response.meta.current_page,
        last_page: response.meta.last_page,
        total: response.meta.total,
      });
    } catch (error) {
      toast.error('Không thể tải dự án');
    } finally {
      setLoading(false);
    }
  };

  useState(() => {
    loadProjects();
  });

  const handleSearch = () => {
    loadProjects(1);
  };

  const handlePageChange = (page: number) => {
    loadProjects(page);
  };

  const handlePublish = async (id: number) => {
    try {
      await projectApi.publish(id);
      toast.success('Đã xuất bản dự án');
      loadProjects(pagination.current_page);
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleArchive = async (id: number) => {
    try {
      await projectApi.archive(id);
      toast.success('Đã lưu trữ dự án');
      loadProjects(pagination.current_page);
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa dự án này?')) return;

    try {
      await projectApi.delete(id);
      toast.success('Đã xóa dự án');
      loadProjects(pagination.current_page);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Không thể xóa dự án');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý dự án</h1>
          <p className="text-gray-500">Tổng cộng {pagination.total} dự án</p>
        </div>
        <Button>
          <span className="mr-2">+</span>
          Thêm dự án
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <Input
          placeholder="Tìm kiếm dự án..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="max-w-md"
        />
        <Button variant="outline" onClick={handleSearch}>
          Tìm kiếm
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Tên dự án</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Giá</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Chưa có dự án nào
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="text-gray-500">#{project.id}</TableCell>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell className="text-gray-500">{project.slug}</TableCell>
                  <TableCell>
                    {project.price_display || (
                      project.min_price
                        ? `${formatPrice(project.min_price)} - ${formatPrice(project.max_price || project.min_price)}`
                        : '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={project.status as 'draft' | 'published' | 'archived'} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {project.status === 'draft' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePublish(project.id)}
                        >
                          Xuất bản
                        </Button>
                      )}
                      {project.status === 'published' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleArchive(project.id)}
                        >
                          Lưu trữ
                        </Button>
                      )}
                      <Link href={`/du-an/${project.slug}`}>
                        <Button variant="ghost" size="sm">
                          Xem
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(project.id)}
                      >
                        Xóa
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <p className="text-sm text-gray-500">
              Trang {pagination.current_page} / {pagination.last_page}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.current_page === 1}
                onClick={() => handlePageChange(pagination.current_page - 1)}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.current_page === pagination.last_page}
                onClick={() => handlePageChange(pagination.current_page + 1)}
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
