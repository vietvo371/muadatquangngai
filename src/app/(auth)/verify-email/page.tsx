'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Shield, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { OTPInput } from '@/components/ui/otp-input';
import axios from '@/lib/axios';
import { useAuth } from '@/hooks/useAuth';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const hasSentInitial = useRef(false);

  const email = user?.email ?? searchParams?.get('email') ?? '';

  // Đọc thẳng localStorage thay vì useAuth().isAuthenticated — store Zustand khởi tạo lại
  // isLoading=true sau mỗi lần load trang thật (không có AuthProvider nào gọi fetchUser() để
  // hạ isLoading về false), nên chờ isLoading resolve sẽ treo mãi. axios.ts cũng đọc trực
  // tiếp localStorage theo đúng cách này; interceptor 401 của nó tự lo việc redirect nếu
  // token đã hết hạn/không hợp lệ.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem('access_token')) {
      router.replace('/login');
      return;
    }
    if (!hasSentInitial.current) {
      hasSentInitial.current = true;
      handleResend();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setStatus('loading');
    setErrorMessage('');
    try {
      await axios.post('/api/v2/auth/email-verification/send');
      setStatus('sent');
      setResendCooldown(60);
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.response?.data?.message || 'Không gửi được mã. Vui lòng thử lại.');
      // 429 nghĩa là mã trước vẫn còn hiệu lực (đã gửi trong <60s) — vẫn đếm ngược ở client
      // để nút "Gửi lại mã" không mời bấm lại ngay vào đúng giới hạn vừa bị chặn.
      if (err.response?.status === 429) setResendCooldown(60);
    }
  };

  const handleVerify = async (code: string) => {
    if (code.length !== 6) return;

    setStatus('loading');
    setErrorMessage('');
    try {
      await axios.post('/api/v2/auth/email-verification/verify', { code });
      router.push('/verify-email?verified=true');
    } catch (err: any) {
      setStatus('error');
      setOtp('');
      setErrorMessage(err.response?.data?.message || 'Mã xác thực không đúng.');
    }
  };

  const isAlreadyVerified = searchParams?.get('verified') === 'true';

  if (isAlreadyVerified) {
    return (
      <div className="w-full text-center">
        <div className="w-16 h-16 bg-[#d1fae5] rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-8 w-8 text-[#10b981]" />
        </div>
        <h1 className="text-[24px] font-extrabold text-gray-900 tracking-tight mb-2">Xác thực thành công!</h1>
        <p className="text-[14px] text-gray-500 font-medium mb-8">
          Email của bạn đã được xác thực. Bây giờ bạn có thể đăng nhập để sử dụng tài khoản.
        </p>
        <Link href="/login">
          <Button className="w-full h-11 bg-primary hover:bg-primary-dark font-semibold text-[14px]">Đăng nhập ngay</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full text-center">
      <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-6">
        <Shield className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-[24px] font-extrabold text-gray-900 tracking-tight mb-2">Xác thực email</h1>
      <p className="text-[14px] text-gray-500 font-medium mb-8">
        Nhập mã 6 chữ số được gửi đến<br />
        <strong className="text-gray-900">{email || 'email của bạn'}</strong>
      </p>

      {status === 'error' && (
        <div className="mb-4 p-3 bg-red-50 text-[#e03131] text-[13px] rounded-lg border border-[#e03131]/20">
          {errorMessage || 'Đã xảy ra lỗi. Vui lòng thử lại.'}
        </div>
      )}

      <div className="space-y-6">
        <OTPInput 
          length={6} 
          value={otp} 
          onChange={(val) => {
            setOtp(val);
            if (val.length === 6) {
              handleVerify(val);
            }
          }} 
        />

        <Button
          onClick={() => handleVerify(otp)}
          disabled={otp.length !== 6 || status === 'loading'}
          className="w-full h-11 bg-primary hover:bg-primary-dark font-semibold text-[14px]"
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Đang xác thực...
            </>
          ) : (
            'Xác nhận'
          )}
        </Button>

        <div className="text-center">
          {resendCooldown > 0 ? (
            <p className="text-[13px] text-gray-400 font-medium">
              Gửi lại mã sau {resendCooldown}s
            </p>
          ) : (
            <button
              onClick={handleResend}
              className="text-[13px] text-primary hover:text-primary-dark font-semibold"
            >
              Gửi lại mã
            </button>
          )}
        </div>

        <div className="text-center pt-2">
          <Link href="/register" className="text-[13px] text-gray-500 hover:text-gray-700 font-medium">
            ← Đổi địa chỉ email
          </Link>
        </div>
      </div>
    </div>
  );
}

function VerifyEmailLoading() {
  return (
    <div className="w-full text-center py-12">
      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
      <p className="mt-4 text-[14px] text-gray-500 font-medium">Đang tải...</p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailLoading />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
