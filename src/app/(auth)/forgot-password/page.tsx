'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsSent(true);
    } catch {
      setError('Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <div className="w-full text-center">
        <div className="w-16 h-16 bg-[#d1fae5] rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-8 w-8 text-[#10b981]" />
        </div>
        <h1 className="text-[24px] font-extrabold text-gray-900 tracking-tight mb-2">Kiểm tra email của bạn</h1>
        <p className="text-[14px] text-gray-500 font-medium mb-6">
          Link đặt lại mật khẩu đã được gửi đến<br />
          <strong className="text-gray-900">{email}</strong>
        </p>
        <p className="text-[13px] text-gray-400 font-medium mb-8">
          Không thấy email? Kiểm tra thư mục Spam
        </p>
        
        <div className="space-y-4">
          <Button 
            variant="outline" 
            className="w-full h-11 font-semibold text-[14px] border-primary text-primary hover:bg-primary-light"
            onClick={() => setIsSent(false)}
          >
            Gửi lại
          </Button>
          <Link href="/login" className="flex items-center justify-center gap-2 text-[14px] font-semibold text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Quay lại đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full text-center">
      <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-6">
        <Mail className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-[24px] font-extrabold text-gray-900 tracking-tight mb-2">Quên mật khẩu?</h1>
      <p className="text-[14px] text-gray-500 font-medium mb-8">
        Nhập email để nhận link đặt lại mật khẩu
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 text-left mb-6">
        {error && (
          <div className="p-3 bg-red-50 text-[#e03131] text-[13px] rounded-lg border border-[#e03131]/20">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <div className="relative">
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-4 h-11 focus:ring-[3px] focus:ring-primary/15 focus:border-primary transition-all"
              required
            />
          </div>
        </div>

        <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary-dark font-semibold text-[14px]" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Đang gửi...
            </>
          ) : (
            'Gửi link đặt lại'
          )}
        </Button>
      </form>

      <Link href="/login" className="flex items-center justify-center gap-2 text-[14px] font-semibold text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Quay lại đăng nhập
      </Link>
    </div>
  );
}
