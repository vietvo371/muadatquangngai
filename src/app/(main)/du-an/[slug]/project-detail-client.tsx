'use client';

import { Suspense, use, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Building } from 'lucide-react';
import { ContactDialog } from '@/components/shared/ContactDialog';
import { ErrorState } from '@/components/shared';
import { Skeleton } from '@/components/ui/skeleton';
import { useProjectDetail } from '@/hooks/useProjectDetail';
import { adaptProject } from '@/lib/project/adapters';
import type { Project } from '@/lib/project/types';
import { ProjectBreadcrumb, ProjectTitle } from '@/components/project/detail/ProjectHeader';
import { ProjectGallery } from '@/components/project/detail/ProjectGallery';
import {
  PROJECT_SECTION_IDS,
  ProjectSectionNav,
  type ProjectSectionTab,
} from '@/components/project/detail/ProjectSectionNav';
import { ProjectOverview, ProjectUnitTypes, ProjectUtilities } from '@/components/project/detail/ProjectOverview';
import { LoanCalculator } from '@/components/project/detail/LoanCalculator';
import { ProjectUnits } from '@/components/project/detail/ProjectUnits';
import { ProjectLocation } from '@/components/project/detail/ProjectLocation';
import { ProjectFaq } from '@/components/project/detail/ProjectFaq';
import { ProjectMobileCta, ProjectSidebar } from '@/components/project/detail/ProjectSidebar';

/**
 * Trang chi tiết dự án (Notion 07/10 — 8 mục nền tảng khu vực Dự án).
 *
 * Trang này chỉ GHÉP các khối trong components/project/detail. Dữ liệu đi một đường duy nhất:
 * slug → API Client → Adapter → khối. Khối nào không có dữ liệu thì tự ẩn — không còn giá,
 * số căn, tiện ích, người liên hệ hay ảnh bịa ra cho đủ chỗ như bản trước.
 */

const SECTION_TABS: ProjectSectionTab[] = [
  { key: 'overview', label: 'Tổng quan', sub: 'Thông tin dự án' },
  { key: 'units', label: 'Mở bán', sub: 'Căn đang rao' },
  { key: 'location', label: 'Vị trí', sub: 'Tiện ích xung quanh' },
  { key: 'faq', label: 'Hỏi đáp', sub: 'Câu hỏi thường gặp' },
];

function ProjectDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-[1152px] space-y-4 px-4 py-5">
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-8 w-2/3" />
        <div className="flex gap-6">
          <div className="flex-1 space-y-4">
            <Skeleton className="h-[360px] w-full rounded-[var(--radius-card)]" />
            <Skeleton className="h-48 w-full rounded-[var(--radius-card)]" />
          </div>
          <Skeleton className="hidden h-80 w-72 rounded-[var(--radius-card)] lg:block" />
        </div>
      </div>
    </div>
  );
}

function ProjectNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50 px-4 py-16">
      <div className="max-w-lg text-center">
        <Building className="mx-auto mb-4 h-12 w-12 text-gray-300" />
        <h1 className="mb-2 text-xl font-bold text-gray-900">Không tìm thấy dự án này</h1>
        <p className="mb-6 text-sm text-gray-500">Dự án có thể đã ngừng đăng, đổi tên hoặc đường dẫn không còn chính xác.</p>
        <Link
          href="/du-an"
          className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
        >
          Xem tất cả dự án
        </Link>
      </div>
    </div>
  );
}

function ProjectDetailView({ project }: { project: Project }) {
  const [contactOpen, setContactOpen] = useState(false);
  const openContact = () => setContactOpen(true);

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjectBreadcrumb project={project} />

      <div className="mx-auto max-w-[1152px] px-4 py-5">
        <ProjectTitle project={project} />

        <div className="flex gap-6">
          <div className="min-w-0 flex-1 space-y-5">
            <ProjectGallery project={project} />

            <div className="overflow-hidden rounded-[var(--radius-card)] border border-gray-100 bg-white">
              <ProjectSectionNav tabs={SECTION_TABS} />
              <div className="space-y-6 p-5">
                <section id={PROJECT_SECTION_IDS.overview} className="scroll-mt-24 space-y-6">
                  <ProjectOverview project={project} />
                  <ProjectUtilities utilities={project.utilities} />
                  <ProjectUnitTypes project={project} />
                  <LoanCalculator initialValue={project.priceFrom} />
                </section>
              </div>
            </div>

            <section id={PROJECT_SECTION_IDS.units} className="scroll-mt-24">
              <ProjectUnits project={project} />
            </section>

            <div className="overflow-hidden rounded-[var(--radius-card)] border border-gray-100 bg-white p-5">
              <section id={PROJECT_SECTION_IDS.location} className="scroll-mt-24">
                <ProjectLocation project={project} />
              </section>
              <section id={PROJECT_SECTION_IDS.faq} className="mt-10 scroll-mt-24 border-t border-gray-100 pt-10">
                <ProjectFaq project={project} onAsk={openContact} />
              </section>
            </div>
          </div>

          <ProjectSidebar project={project} onContact={openContact} />
        </div>
      </div>

      <ProjectMobileCta project={project} onContact={openContact} />
      <ContactDialog
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        projectName={project.name}
        projectSlug={/^\d+$/.test(project.id) ? project.slug : undefined}
      />
    </div>
  );
}

function ProjectDetailContent({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const isPreview = searchParams?.get('preview') === '1';
  const { state: loaded, reload } = useProjectDetail(slug, { enabled: !isPreview });
  // Bản nháp từ trang quản trị (chế độ xem trước) — giữ riêng, không trộn với dữ liệu tải về.
  const [previewProject, setPreviewProject] = useState<Project | null>(null);
  const state = isPreview
    ? previewProject
      ? ({ status: 'ready', project: previewProject } as const)
      : ({ status: 'loading' } as const)
    : loaded;

  // Chế độ xem trước (nhúng iframe trong trang quản trị): nhận bản nháp qua postMessage. Bản
  // nháp đi qua CÙNG Adapter với dữ liệu thật, nên xem trước hiện y hệt trang công khai.
  useEffect(() => {
    if (!isPreview) return;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type !== 'project-preview' || !e.data.payload) return;
      const project = adaptProject(e.data.payload);
      if (project) setPreviewProject(project);
    };
    window.addEventListener('message', onMessage);
    window.parent?.postMessage({ type: 'preview-ready' }, window.location.origin);
    return () => window.removeEventListener('message', onMessage);
  }, [isPreview]);

  if (state.status === 'not-found') return <ProjectNotFound />;
  if (state.status === 'error') {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <ErrorState error={state.error} onRetry={reload} />
      </div>
    );
  }
  if (state.status === 'loading') return <ProjectDetailSkeleton />;
  return <ProjectDetailView project={state.project} />;
}

export default function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  // useSearchParams/useUrlState bắt buộc nằm trong Suspense, nếu không build production hỏng.
  return (
    <Suspense fallback={<ProjectDetailSkeleton />}>
      <ProjectDetailContent slug={slug} />
    </Suspense>
  );
}
