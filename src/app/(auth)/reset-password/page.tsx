'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, Lock, CheckCircle, ArrowLeft, ShieldAlert } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PasswordStrength } from '@/components/ui/password-strength';
import axios from '@/lib/axios';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const email = searchParams?.get('email') ?? '';
  const token = searchParams?.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState('');

  const isLinkInvalid = !email || !token;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== passwordConfirmation) {
      setError('Xác nhận mật khẩu không khớp.');
      return;
    }

    setIsLoading(true);
    try {
      await axios.post('/api/v2/auth/reset-password', {
        email,
        token,
        password,
        password_confirmation: passwordConfirmation,
      });
      setIsDone(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLinkInvalid) {
    return (
      <div className="w-full text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="h-8 w-8 text-[#e03131]" />
        </div>
        <h1 className="text-[24px] font-extrabold text-gray-900 tracking-tight mb-2">Liên kết không hợp lệ</h1>
        <p className="text-[14px] text-gray-500 font-medium mb-8">
          Liên kết đặt lại mật khẩu bị thiếu thông tin hoặc không hợp lệ.
        </p>
        <Link href="/forgot-password">
          <Button className="w-full h-11 bg-primary hover:bg-primary-dark font-semibold text-[14px]">
            Yêu cầu link mới
          </Button>
        </Link>
      </div>
    );
  }

  if (isDone) {
    return (
      <div className="w-full text-center">
        <div className="w-16 h-16 bg-[#d1fae5] rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-8 w-8 text-[#10b981]" />
        </div>
        <h1 className="text-[24px] font-extrabold text-gray-900 tracking-tight mb-2">Đặt lại mật khẩu thành công</h1>
        <p className="text-[14px] text-gray-500 font-medium mb-8">
          Bạn có thể đăng nhập bằng mật khẩu mới.
        </p>
        <Link href="/login">
          <Button className="w-full h-11 bg-primary hover:bg-primary-dark font-semibold text-[14px]">Đăng nhập ngay</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h1 className="text-[24px] font-extrabold text-gray-900 tracking-tight">Đặt lại mật khẩu</h1>
        <p className="text-[14px] text-gray-500 mt-2 font-medium">
          Nhập mật khẩu mới cho <strong className="text-gray-900">{email}</strong>
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-[#e03131]/20 rounded-lg text-[13px] text-[#e03131]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-[13px] font-semibold text-gray-700">Mật khẩu mới</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pl-10 pr-10 h-11 focus:ring-[3px] focus:ring-primary/15 focus:border-primary transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <PasswordStrength password={password} showChecklist />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password_confirmation" className="text-[13px] font-semibold text-gray-700">Xác nhận mật khẩu mới</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="password_confirmation"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              required
              className="pl-10 h-11 focus:ring-[3px] focus:ring-primary/15 focus:border-primary transition-all"
            />
          </div>
        </div>

        <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary-dark font-semibold text-[14px]" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Đang xử lý...
            </>
          ) : (
            'Đặt lại mật khẩu'
          )}
        </Button>
      </form>

      <div className="text-center mt-6">
        <Link href="/login" className="flex items-center justify-center gap-2 text-[14px] font-semibold text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Quay lại đăng nhập
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
