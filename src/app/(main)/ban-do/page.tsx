'use client';

import dynamic from 'next/dynamic';

const BanDoMapInner = dynamic(() => import('./BanDoMapInner'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col h-[calc(100vh-60px)]">
      <div className="bg-white border-b px-4 py-3">
        <div className="h-9 bg-gray-100 rounded animate-pulse" />
      </div>
      <div className="flex-1 bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Dang tai ban do...</p>
      </div>
    </div>
  ),
});

export default function BanDoPage() {
  return <BanDoMapInner />;
}
