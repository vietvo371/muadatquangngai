import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function WelcomeBanner({ user }: { user: any }) {
  return (
    <div 
      className="rounded-2xl p-6 md:p-8 text-white mb-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-sm"
      style={{ background: 'linear-gradient(135deg, #1075b1, #2d5a87)' }}
    >
      <div className="flex items-center gap-4 w-full md:w-auto relative z-10">
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/30 backdrop-blur-sm shrink-0 overflow-hidden">
          {user?.avatar ? (
             <img src={user.avatar} className="w-full h-full object-cover" alt="Avatar" />
          ) : (
            <User className="w-8 h-8 text-white" />
          )}
        </div>
        <div>
          <h2 className="text-[22px] font-bold mb-1 tracking-tight">Chào buổi sáng, {user?.name || 'Thành viên'}!</h2>
          <p className="text-white/80 text-[14px] font-medium">Hôm nay là một ngày tuyệt vời để đăng tin bất động sản mới.</p>
        </div>
      </div>
      
      <div className="w-full md:w-auto relative z-10 shrink-0">
        <Link href="/dashboard/dang-tin">
          <Button className="w-full md:w-auto bg-white text-primary hover:bg-gray-50 font-bold px-6 h-11 shadow-sm transition-colors">
            Đăng tin mới
          </Button>
        </Link>
      </div>
    </div>
  );
}
