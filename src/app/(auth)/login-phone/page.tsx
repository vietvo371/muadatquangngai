'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { OTPInput } from '@/components/ui/otp-input';

export default function LoginPhonePage() {
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  const handleSendOtp = async () => {
    if (phone.length < 9) {
      setError('Số điện thoại không hợp lệ');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // TODO: Call API to send OTP
      // await axios.post('/api/auth/otp/send', { phone, type: activeTab });
      
      // For demo, go to OTP step
      setStep('otp');
      setCountdown(59);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gửi mã OTP thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (code: string) => {
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
    
    setCountdown(59);
    // TODO: Resend OTP
  };

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h1 className="text-[24px] font-extrabold text-gray-900 tracking-tight">Đăng nhập bằng SĐT</h1>
        <p className="text-[14px] text-gray-500 mt-2 font-medium">Nhập số điện thoại để tiếp tục</p>
      </div>

      <div className="flex bg-gray-100 p-1 rounded-xl mb-8">
        <button
          className={`flex-1 text-[13px] font-semibold py-2 rounded-lg transition-colors ${
            activeTab === 'login' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => { setActiveTab('login'); setStep('phone'); setError(''); }}
        >
          Đăng nhập
        </button>
        <button
          className={`flex-1 text-[13px] font-semibold py-2 rounded-lg transition-colors ${
            activeTab === 'register' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => { setActiveTab('register'); setStep('phone'); setError(''); }}
        >
          Đăng ký
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-[#e03131]/20 rounded-lg text-[13px] text-[#e03131] flex items-center gap-2">
          {error}
        </div>
      )}

      {step === 'phone' ? (
        <div className="space-y-4">
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
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                className="rounded-l-none h-11 focus:ring-[3px] focus:ring-primary/15 focus:border-primary transition-all text-lg"
                maxLength={10}
              />
            </div>
          </div>

          <Button 
            onClick={handleSendOtp} 
            className="w-full h-11 bg-primary hover:bg-primary-dark font-semibold text-[14px]"
            disabled={isLoading || phone.length < 9}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Đang gửi...
              </>
            ) : (
              'Gửi mã OTP'
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-6 text-center">
          <p className="text-[14px] text-gray-500 font-medium">
            Mã OTP đã được gửi đến<br />
            <strong className="text-gray-900">+84 {phone}</strong>
          </p>

          <OTPInput 
            length={6} 
            value={otp} 
            onChange={(val) => {
              setOtp(val);
              if (val.length === 6) {
                handleVerifyOtp(val);
              }
            }} 
          />

          <Button 
            onClick={() => handleVerifyOtp(otp)} 
            className="w-full h-11 bg-primary hover:bg-primary-dark font-semibold text-[14px]"
            disabled={isLoading || otp.length !== 6}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Đang xác thực...
              </>
            ) : (
              'Xác nhận'
            )}
          </Button>

          <div className="text-center">
            {countdown > 0 ? (
              <p className="text-[13px] text-gray-400 font-medium">
                Gửi lại sau {countdown}s
              </p>
            ) : (
              <button
                onClick={handleResendOtp}
                className="text-[13px] text-primary hover:text-primary-dark font-semibold"
              >
                Gửi lại mã
              </button>
            )}
          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => setStep('phone')}
              className="text-[13px] text-gray-500 hover:text-gray-700 font-medium"
            >
              ← Thay đổi số điện thoại
            </button>
          </div>
        </div>
      )}

      <div className="text-center mt-8 pt-6 border-t border-gray-100">
        <Link href="/login" className="text-[14px] text-gray-500 hover:text-gray-900 font-medium transition-colors">
          Đăng nhập bằng Email
        </Link>
      </div>
    </div>
  );
}
