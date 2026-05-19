'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface PhoneVerificationProps {
  phone: string;
  onVerified: (code: string) => void;
  onResend: (phone: string) => Promise<void>;
  onChangePhone: () => void;
  loading?: boolean;
  error?: string;
  expiresIn?: number; // seconds
  className?: string;
}

export function PhoneVerification({
  phone,
  onVerified,
  onResend,
  onChangePhone,
  loading = false,
  error,
  expiresIn = 60,
  className,
}: PhoneVerificationProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(expiresIn);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newCode.every((c) => c !== '')) {
      onVerified(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newCode = pasted.split('');
      setCode(newCode);
      onVerified(pasted);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setCanResend(false);
    setTimeLeft(expiresIn);
    setCode(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
    await onResend(phone);
  };

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <p className="text-sm text-gray-600 text-center">
        Nhập mã xác minh 6 số đã gửi đến <strong className="text-gray-900">{phone}</strong>
      </p>

      {/* OTP inputs */}
      <div className="flex justify-center gap-2" onPaste={handlePaste}>
        {code.map((digit, i) => (
          <Input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={cn(
              'w-11 h-12 text-center text-lg font-bold tracking-widest border-2 rounded-lg',
              'focus:border-primary focus:ring-2 focus:ring-primary/20',
              'transition-all',
              digit ? 'border-primary bg-primary/5' : 'border-gray-200',
              error && 'border-red-400 bg-red-50'
            )}
            disabled={loading}
          />
        ))}
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      {/* Timer + resend */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
        {timeLeft > 0 ? (
          <span>Mã hết hạn sau <strong className="text-gray-700">{formatTime(timeLeft)}</strong></span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={loading}
            className="text-primary hover:underline font-medium"
          >
            Gửi lại mã
          </button>
        )}
      </div>

      {/* Change phone */}
      <button
        type="button"
        onClick={onChangePhone}
        className="text-sm text-gray-500 hover:text-gray-700 underline text-center"
      >
        Đổi số điện thoại
      </button>
    </div>
  );
}
