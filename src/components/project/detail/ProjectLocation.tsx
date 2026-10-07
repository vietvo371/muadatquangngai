'use client';

import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';
import { projectAddress } from '@/lib/project/fields';
import type { Project } from '@/lib/project/types';

// Bản đồ chỉ nạp khi thực sự hiển thị (Notion 07/10 "Google Maps ... chỉ load khi cần").
const NearbyPlacesSection = dynamic(
  () => import('@/components/map/NearbyPlacesSection').then((m) => m.NearbyPlacesSection),
  { ssr: false, loading: () => <div className="h-[280px] w-full animate-pulse rounded-[var(--radius-card)] bg-gray-100" /> }
);
const GoogleMapEmbed = dynamic(() => import('@/components/map/GoogleMapEmbed').then((m) => m.GoogleMapEmbed), {
  ssr: false,
  loading: () => <div className="h-64 w-full animate-pulse rounded-[var(--radius-card)] bg-gray-100" />,
});

/**
 * Vị trí + tiện ích xung quanh. Dùng chung khối bản đồ ghim sẵn với trang chi tiết BĐS.
 *
 * Có toạ độ và có tiện ích → bản đồ ghim + 4 tab tiện ích. Có toạ độ mà chưa tra được tiện ích
 * → chỉ bản đồ. Không có toạ độ → không vẽ bản đồ đoán theo chữ như trước (dễ ghim sai chỗ),
 * chỉ hiện địa chỉ.
 */
export function ProjectLocation({ project }: { project: Project }) {
  const address = projectAddress(project);
  const { latitude, longitude } = project.location;
  const hasCoords = latitude !== null && longitude !== null;

  if (!address && !hasCoords) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-gray-900">Vị trí dự án</h2>
      {address && (
        <p className="flex items-center gap-1.5 text-sm text-gray-500">
          <MapPin className="h-4 w-4 shrink-0 text-primary" />
          <span>{address}</span>
        </p>
      )}

      {hasCoords && project.nearbyPlaces && (
        <NearbyPlacesSection
          latitude={latitude}
          longitude={longitude}
          centerLabel={project.name}
          places={project.nearbyPlaces}
        />
      )}
      {hasCoords && !project.nearbyPlaces && (
        <GoogleMapEmbed
          latitude={latitude}
          longitude={longitude}
          className="h-64 w-full overflow-hidden rounded-[var(--radius-card)] border border-gray-200"
        />
      )}
    </div>
  );
}
