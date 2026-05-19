'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Shield, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { OTPInput } from '@/components/ui/otp-input';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(59);

  useEffect(() => {
    if (searchParams) {
      const emailParam = searchParams.get('email');
      if (emailParam) {
        setEmail(emailParam);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResend = async () => {
    if (!email || resendCooldown > 0) return;

    setStatus('loading');
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStatus('sent');
      setResendCooldown(59);
    } catch {
      setStatus('error');
    }
  };

  const handleVerify = async (code: string) => {
    if (code.length !== 6) return;

    setStatus('loading');
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      // redirect or set verified state
      router.push('/dashboard');
    } catch {
      setStatus('error');
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
          Đã xảy ra lỗi. Vui lòng thử lại.
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
