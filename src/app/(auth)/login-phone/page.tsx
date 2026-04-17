'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

export default function LoginPhonePage() {
  const router = useRouter();
  
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  const handleSendOtp = async () => {
    if (phone.length < 10) {
      setError('Số điện thoại không hợp lệ');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // TODO: Call API to send OTP
      // await axios.post('/api/auth/otp/send', { phone, type: 'login' });
      
      // For demo, go to OTP step
      setStep('otp');
      setCountdown(60);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gửi mã OTP thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').slice(0, 6);
      const newOtp = [...otp];
      digits.split('').forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      
      // Auto submit if 6 digits
      if (digits.length === 6) {
        handleVerifyOtp(newOtp.join(''));
      }
      return;
    }

    if (!/^\d?$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerifyOtp = async (otpValue?: string) => {
    const code = otpValue || otp.join('');
    if (code.length !== 6) {
      setError('Vui lòng nhập đủ 6 chữ số');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // TODO: Call API to verify OTP
      // const response = await axios.post('/api/auth/otp/login', { phone, otp: code });
      
      // For demo, redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Mã OTP không chính xác');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    
    setCountdown(60);
    // TODO: Resend OTP
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto rounded-full bg-blue-50 flex items-center justify-center mb-4">
          <Phone className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          {step === 'phone' ? 'Đăng nhập bằng SMS' : 'Nhập mã xác thực'}
        </h1>
        <p className="text-gray-500 mt-2">
          {step === 'phone' 
            ? 'Nhập số điện thoại để đăng nhập'
            : `Mã xác thực đã được gửi đến ${phone}`
          }
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {step === 'phone' ? (
        <div className="space-y-4">
          <div>
            <Label htmlFor="phone">Số điện thoại</Label>
            <div className="relative mt-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">+84</span>
              <Input
                id="phone"
                type="tel"
                placeholder="Nhập số điện thoại"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                className="pl-14 h-12 text-lg"
                maxLength={11}
              />
            </div>
          </div>

          <Button 
            onClick={handleSendOtp} 
            className="w-full h-12 bg-blue-600 hover:bg-blue-700"
            disabled={isLoading || phone.length < 10}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang gửi...
              </>
            ) : (
              'Gửi mã xác thực'
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* OTP Input */}
          <div className="flex justify-center gap-2">
            {otp.map((digit, index) => (
              <Input
                key={index}
                id={`otp-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-xl font-semibold"
              />
            ))}
          </div>

          <Button 
            onClick={() => handleVerifyOtp()} 
            className="w-full h-12 bg-blue-600 hover:bg-blue-700"
            disabled={isLoading || otp.join('').length !== 6}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang xác thực...
              </>
            ) : (
              'Xác thực'
            )}
          </Button>

          {/* Resend */}
          <div className="text-center">
            {countdown > 0 ? (
              <p className="text-sm text-gray-500">
                Gửi lại mã sau <span className="font-semibold">{countdown}s</span>
              </p>
            ) : (
              <button
                onClick={handleResendOtp}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Gửi lại mã xác thực
              </button>
            )}
          </div>

          {/* Change phone */}
          <div className="text-center">
            <button
              onClick={() => setStep('phone')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Thay đổi số điện thoại
            </button>
          </div>
        </div>
      )}

      {/* Login with email */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">hoặc</span>
        </div>
      </div>

      <Link href="/login">
        <Button variant="outline" className="w-full h-12">
          Đăng nhập bằng email
        </Button>
      </Link>

      {/* Register Link */}
      <p className="text-center text-sm text-gray-500 mt-6">
        Chưa có tài khoản?{' '}
        <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
          Đăng ký ngay
        </Link>
      </p>
    </div>
  );
}
