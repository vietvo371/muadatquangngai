'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  CreditCard,
  Wallet,
  Smartphone,
  CheckCircle,
  ShieldCheck,
  Clock,
  Gift,
} from 'lucide-react';
import { formatPrice } from '@/lib/formatters';

// Packages
const packages = [
  {
    id: 'vip_7',
    name: 'VIP 7 ngày',
    duration: 7,
    price: 500000,
    originalPrice: null,
    features: [
      'Tin đăng nổi bật trên trang chủ',
      'Đánh dấu VIP',
      'Thứ tự ưu tiên cao',
    ],
    popular: false,
  },
  {
    id: 'vip_30',
    name: 'VIP 30 ngày',
    duration: 30,
    price: 1500000,
    originalPrice: 2000000,
    features: [
      'Tất cả tính năng VIP 7 ngày',
      'Hiển thị ưu tiên hơn',
      'Báo cáo lượt xem',
      'Hỗ trợ ưu tiên',
    ],
    popular: true,
  },
  {
    id: 'vip_90',
    name: 'VIP 90 ngày',
    duration: 90,
    price: 3500000,
    originalPrice: 4500000,
    features: [
      'Tất cả tính năng VIP 30 ngày',
      'Ghim đầu danh sách',
      'Tối đa 5 tin VIP cùng lúc',
      'Tư vấn marketing miễn phí',
    ],
    popular: false,
  },
];

// Payment methods
const paymentMethods = [
  { id: 'vnpay', name: 'VNPay', icon: CreditCard, description: 'Thanh toán qua ví VNPay' },
  { id: 'momo', name: 'MoMo', icon: Smartphone, description: 'Thanh toán qua ví MoMo' },
  { id: 'banking', name: 'Chuyển khoản', icon: Wallet, description: 'Chuyển khoản ngân hàng' },
  { id: 'zalo', name: 'ZaloPay', icon: Smartphone, description: 'Thanh toán qua ZaloPay' },
];

export default function NapTienPage() {
  const [selectedPackage, setSelectedPackage] = useState('vip_30');
  const [selectedPayment, setSelectedPayment] = useState('vnpay');
  const [step, setStep] = useState<'select' | 'payment' | 'success'>('select');

  const currentPackage = packages.find(p => p.id === selectedPackage);
  const currentPayment = paymentMethods.find(p => p.id === selectedPayment);

  const handlePayment = () => {
    setStep('payment');
    // Simulate payment processing
    setTimeout(() => {
      setStep('success');
    }, 2000);
  };

  if (step === 'success') {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán thành công!</h1>
        <p className="text-gray-500 mb-6">
          Bạn đã mua gói {currentPackage?.name} thành công. Gói VIP đã được kích hoạt.
        </p>
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-gray-500">Gói dịch vụ</span>
            <span className="font-medium">{currentPackage?.name}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-500">Thời hạn</span>
            <span className="font-medium">{currentPackage?.duration} ngày</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Số tiền</span>
            <span className="font-bold text-red-600">{formatPrice(currentPackage?.price || 0)}</span>
          </div>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => setStep('select')} className="flex-1">
            Mua thêm
          </Button>
          <Button onClick={() => window.location.href = '/dashboard/quan-ly-tin'} className="flex-1">
            Xem tin đăng
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Nạp tiền / Mua gói VIP</h1>
        <p className="text-gray-500">Chọn gói dịch vụ phù hợp với nhu cầu của bạn</p>
      </div>

      {/* Promotional Banner */}
      <Card className="bg-gradient-to-r from-primary to-primary-dark border-0 mb-8">
        <CardContent className="p-6 text-white">
          <div className="flex items-center gap-4">
            <Gift className="h-12 w-12" />
            <div>
              <h3 className="text-xl font-bold">Giảm 25% gói VIP 30 ngày!</h3>
              <p className="text-white/80">Chỉ còn 1,500,000đ - Tiết kiệm 500,000đ</p>
            </div>
            <Badge className="ml-auto bg-white text-primary">Có hạn sử dụng</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Packages */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Chọn gói dịch vụ</h2>
          <div className="space-y-4">
            {packages.map((pkg) => (
              <Card
                key={pkg.id}
                className={`cursor-pointer transition-all ${
                  selectedPackage === pkg.id
                    ? 'border-primary ring-2 ring-primary'
                    : 'hover:border-gray-300'
                } ${pkg.popular ? 'relative' : ''}`}
                onClick={() => setSelectedPackage(pkg.id)}
              >
                {pkg.popular && (
                  <Badge className="absolute -top-3 left-4 bg-orange-500">Phổ biến</Badge>
                )}
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {pkg.duration} ngày
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-red-600">{formatPrice(pkg.price)}</p>
                      {pkg.originalPrice && (
                        <p className="text-sm text-gray-400 line-through">
                          {formatPrice(pkg.originalPrice)}
                        </p>
                      )}
                    </div>
                  </div>
                  <Separator className="my-3" />
                  <ul className="space-y-1">
                    {pkg.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Payment */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Phương thức thanh toán</h2>
          <Card>
            <CardContent className="p-4">
              <RadioGroup
                value={selectedPayment}
                onValueChange={setSelectedPayment}
                className="space-y-3"
              >
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <div key={method.id}>
                      <RadioGroupItem
                        value={method.id}
                        id={method.id}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={method.id}
                        className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary-light transition-colors"
                      >
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Icon className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{method.name}</p>
                          <p className="text-sm text-gray-500">{method.description}</p>
                        </div>
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Tổng cộng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Gói dịch vụ</span>
                  <span>{currentPackage?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Thời hạn</span>
                  <span>{currentPackage?.duration} ngày</span>
                </div>
                {currentPackage?.originalPrice && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Giá gốc</span>
                    <span className="line-through text-gray-400">
                      {formatPrice(currentPackage.originalPrice)}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-xl font-bold">
                  <span>Thanh toán</span>
                  <span className="text-red-600">{formatPrice(currentPackage?.price || 0)}</span>
                </div>
              </div>

              <Button
                onClick={handlePayment}
                className="w-full mt-6 bg-primary hover:bg-primary-dark"
                size="lg"
              >
                <ShieldCheck className="h-4 w-4 mr-2" />
                Thanh toán an toàn
              </Button>

              <p className="text-xs text-gray-500 text-center mt-4">
                Bằng việc thanh toán, bạn đồng ý với{' '}
                <a href="/terms" className="text-primary hover:underline">Điều khoản sử dụng</a>
                {' '}và{' '}
                <a href="/privacy" className="text-primary hover:underline">Chính sách bảo mật</a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
