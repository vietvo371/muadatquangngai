'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Mail,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Loader2,
  RefreshCw,
} from 'lucide-react';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [email, setEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Get email from URL params or session
  useEffect(() => {
    if (searchParams) {
      const emailParam = searchParams.get('email');
      if (emailParam) {
        setEmail(emailParam);
      }
    }
  }, [searchParams]);

  // Countdown timer for resend
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStatus('sent');
      setResendCooldown(60); // 60 second cooldown
    } catch {
      setStatus('error');
    }
  };

  // Check if already verified (simulated)
  const isAlreadyVerified = searchParams?.get('verified') === 'true';

  if (isAlreadyVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Xác thực thành công!</h1>
            <p className="text-gray-500 mb-6">
              Email của bạn đã được xác thực. Bây giờ bạn có thể đăng nhập để sử dụng tài khoản.
            </p>
            <Link href="/login">
              <Button className="w-full">Đăng nhập ngay</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Xác thực email</CardTitle>
          <CardDescription>
            Chúng tôi đã gửi email xác thực đến địa chỉ của bạn
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email">Email đã đăng ký</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="nguyenvana@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Hướng dẫn:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Mở email từ BatDongSan</li>
              <li>Tìm email có tiêu đề "Xác thực email của bạn"</li>
              <li>Nhấp vào nút "Xác thực email"</li>
              <li>Bạn sẽ được chuyển đến trang xác thực thành công</li>
            </ol>
          </div>

          {status === 'error' && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              Đã xảy ra lỗi khi gửi email. Vui lòng thử lại.
            </div>
          )}

          {status === 'sent' && (
            <div className="p-3 bg-green-50 text-green-600 text-sm rounded-lg flex items-center gap-2">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              Email xác thực đã được gửi thành công!
            </div>
          )}

          {/* Resend Button */}
          <Button
            onClick={handleResend}
            disabled={!email || resendCooldown > 0 || status === 'loading'}
            className="w-full"
            variant={status === 'sent' ? 'outline' : 'default'}
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang gửi...
              </>
            ) : resendCooldown > 0 ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Gửi lại sau {resendCooldown}s
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Gửi lại email xác thực
              </>
            )}
          </Button>

          <Separator />

          {/* Help Links */}
          <div className="text-center text-sm text-gray-500 space-y-2">
            <p>
              Không nhận được email? Kiểm tra thư mục spam.
            </p>
            <p>
              Email sai?{' '}
              <Link href="/register" className="text-blue-600 hover:underline">
                Đăng ký lại
              </Link>
            </p>
          </div>

          <Link href="/login">
            <Button variant="outline" className="w-full gap-2">
              <ArrowLeft className="h-4 w-4" />
              Quay lại đăng nhập
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
