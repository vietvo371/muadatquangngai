'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, Mail, Lock, User, Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuthStore } from '@/stores/authStore';
import axios from '@/lib/axios';
import { PasswordStrength } from '@/components/ui/password-strength';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!acceptTerms) {
      setError('Bạn cần chấp nhận điều khoản sử dụng');
      return;
    }

    if (formData.password !== formData.password_confirmation) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post('/api/v2/auth/register', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });
      
      if (response.data.success) {
        login(response.data.data.user, response.data.data.access_token);
        router.push('/dashboard');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        setError(Object.values(errors).flat().join('\n'));
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthRegister = (provider: 'google' | 'facebook') => {
    console.log('OAuth register with', provider);
  };

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h1 className="text-[24px] font-extrabold text-gray-900 tracking-tight">Tạo tài khoản</h1>
        <p className="text-[14px] text-gray-500 mt-2 font-medium">Tham gia cộng đồng BatDongSan ngay hôm nay</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-[#e03131]/20 rounded-lg text-[13px] text-[#e03131] flex items-center gap-2 whitespace-pre-line">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-[13px] font-semibold text-gray-700">Họ và tên</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="name"
              type="text"
              placeholder="Nguyễn Văn A"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="pl-10 h-11 focus:ring-[3px] focus:ring-primary/15 focus:border-primary transition-all"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-[13px] font-semibold text-gray-700">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="pl-10 h-11 focus:ring-[3px] focus:ring-primary/15 focus:border-primary transition-all"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-[13px] font-semibold text-gray-700">Số điện thoại</Label>
          <div className="relative flex">
            <div className="flex items-center justify-center bg-gray-50 border border-gray-200 border-r-0 rounded-l-md px-3 text-[14px] text-gray-500 font-medium">
              +84
            </div>
            <Input
              id="phone"
              type="tel"
              placeholder="Nhập số điện thoại"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
              className="rounded-l-none h-11 focus:ring-[3px] focus:ring-primary/15 focus:border-primary transition-all"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-[13px] font-semibold text-gray-700">Mật khẩu</Label>
          <div className="relative mt-1">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={8}
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
          <PasswordStrength password={formData.password} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password_confirmation" className="text-[13px] font-semibold text-gray-700">Xác nhận mật khẩu</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="password_confirmation"
              type={showPassword ? 'text' : 'password'}
              placeholder="Nhập lại mật khẩu"
              value={formData.password_confirmation}
              onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
              required
              className="pl-10 h-11 focus:ring-[3px] focus:ring-primary/15 focus:border-primary transition-all"
            />
          </div>
        </div>

        <div className="flex items-start gap-2 pt-2">
          <Checkbox 
            id="terms" 
            checked={acceptTerms}
            onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary mt-0.5" 
          />
          <label htmlFor="terms" className="text-[13px] text-gray-600 font-medium leading-tight">
            Tôi đã đọc và đồng ý với{' '}
            <Link href="/dieu-khoan" className="text-primary hover:text-primary-dark font-semibold">
              Điều khoản dịch vụ
            </Link>{' '}
            và{' '}
            <Link href="/chinh-sach" className="text-primary hover:text-primary-dark font-semibold">
              Chính sách bảo mật
            </Link>
          </label>
        </div>

        <Button type="submit" className="w-full h-[48px] bg-primary hover:bg-primary-dark font-semibold text-[14px] mt-4" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Đang tạo...
            </>
          ) : (
            'Tạo tài khoản'
          )}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-[13px]">
          <span className="px-4 bg-white text-gray-500 font-medium">hoặc đăng ký với</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleOAuthRegister('google')}
          className="h-11 border-gray-200 hover:bg-gray-50 font-medium text-[14px] text-gray-700"
        >
          <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleOAuthRegister('facebook')}
          className="h-11 border-gray-200 hover:bg-gray-50 font-medium text-[14px] text-gray-700"
        >
          <svg className="h-5 w-5 mr-2 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          Facebook
        </Button>
      </div>

      <div className="text-center">
        <p className="text-[14px] text-gray-600 font-medium">
          Đã có tài khoản?{' '}
          <Link href="/login" className="text-primary hover:text-primary-dark font-semibold">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
