import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function WelcomeBanner({ user }: { user: any }) {
  return (
    <div className="bg-primary rounded-2xl p-6 md:p-8 text-white mb-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-lg shadow-primary/20">
      {/* Decorative background circle */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-black/5 blur-3xl pointer-events-none"></div>
      
      <div className="flex items-center gap-4 z-10 w-full md:w-auto">
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/30 backdrop-blur-sm shrink-0">
          {user?.avatar ? (
             <img src={user.avatar} className="w-full h-full rounded-full object-cover" alt="Avatar" />
          ) : (
            <User className="w-8 h-8 text-white" />
          )}
        </div>
        <div>
          <h2 className="text-2xl font-extrabold mb-1 tracking-tight">Xin chào, {user?.name || 'Thành viên'}! 👋</h2>
          <p className="text-white/80 text-sm font-medium">Hôm nay là một ngày tuyệt vời để đăng tin bất động sản mới.</p>
        </div>
      </div>
      
      <div className="w-full md:w-auto z-10 shrink-0">
        <Link href="/dashboard/dang-tin">
          <Button className="w-full md:w-auto bg-white text-primary hover:bg-gray-50 font-bold px-6 h-11 shadow-sm">
            + Đăng tin ngay
          </Button>
        </Link>
      </div>
    </div>
  );
}
