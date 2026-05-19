'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
  ArrowRight,
  Star
} from 'lucide-react';
import { formatPrice } from '@/lib/formatters';

// Packages
const packages = [
  {
    id: 'vip_7',
    name: 'Gói VIP Thường',
    duration: 7,
    price: 50000,
    originalPrice: null,
    features: [
      'Nổi bật trên trang chủ 7 ngày',
      'Huy hiệu VIP vàng',
      'Đẩy tin 1 lần/ngày',
    ],
    popular: false,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200'
  },
  {
    id: 'vip_30',
    name: 'Gói VIP Plus',
    duration: 30,
    price: 150000,
    originalPrice: 200000,
    features: [
      'Nổi bật trên trang chủ 30 ngày',
      'Huy hiệu VIP+ cam',
      'Đẩy tin 3 lần/ngày',
      'Khung tin đăng nổi bật',
    ],
    popular: true,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200'
  },
  {
    id: 'diamond_30',
    name: 'Gói Diamond',
    duration: 30,
    price: 300000,
    originalPrice: 450000,
    features: [
      'Ghim vị trí số 1 trang chủ',
      'Huy hiệu Diamond đỏ kim cương',
      'Đẩy tin không giới hạn',
      'Tiếp cận khách hàng tối đa',
    ],
    popular: false,
    color: 'text-[#e03131]',
    bg: 'bg-red-50',
    border: 'border-red-200'
  },
];

// Payment methods
const paymentMethods = [
  { id: 'vnpay', name: 'VNPay', icon: CreditCard, description: 'Quét mã VNPay-QR' },
  { id: 'momo', name: 'MoMo', icon: Smartphone, description: 'Quét mã qua ứng dụng MoMo' },
  { id: 'banking', name: 'Chuyển khoản 24/7', icon: Wallet, description: 'Chuyển khoản liên ngân hàng' },
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
      <div className="max-w-md mx-auto text-center py-16 animate-in zoom-in duration-500">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">Thanh toán thành công!</h1>
        <p className="text-gray-500 mb-8 text-[15px]">
          Bạn đã mua gói <span className="font-bold text-gray-900">{currentPackage?.name}</span> thành công. Trải nghiệm dịch vụ ngay bây giờ.
        </p>
        
        <Card className="bg-white rounded-2xl shadow-sm border-gray-100 mb-8 overflow-hidden text-left">
          <div className="p-4 bg-gray-50 border-b border-gray-100">
            <p className="text-sm font-bold text-gray-700 uppercase tracking-wider text-center">Chi tiết giao dịch</p>
          </div>
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <span className="text-gray-500 font-medium">Gói dịch vụ</span>
              <span className={`font-bold ${currentPackage?.color}`}>{currentPackage?.name}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <span className="text-gray-500 font-medium">Thời gian áp dụng</span>
              <span className="font-bold text-gray-900">{currentPackage?.duration} ngày</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">Đã thanh toán</span>
              <span className="font-extrabold text-xl text-gray-900">{formatPrice(currentPackage?.price || 0)}</span>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3">
          <Button onClick={() => window.location.href = '/dashboard/quan-ly-tin'} className="w-full h-12 bg-primary hover:bg-primary-dark text-white font-bold text-[15px] rounded-xl shadow-md">
            Áp dụng gói VIP cho tin đăng ngay
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <Button variant="outline" onClick={() => setStep('select')} className="w-full h-12 font-bold text-gray-600 hover:text-gray-900 rounded-xl">
            Quay lại trang nạp tiền
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Mua gói VIP & Nạp tiền</h1>
        <p className="text-gray-500 mt-1">Chọn gói dịch vụ cao cấp để tăng gấp 10 lần hiệu quả hiển thị</p>
      </div>

      {/* Promotional Banner */}
      <Card className="bg-gradient-to-r from-orange-500 to-red-600 border-0 mb-8 rounded-2xl shadow-md overflow-hidden relative">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <CardContent className="p-6 sm:p-8 text-white relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 justify-between">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                <Gift className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-1">Khuyến mãi cực sốc tháng này!</h3>
                <p className="text-white/90 font-medium">Giảm ngay 25% cho Gói VIP Plus 30 ngày.</p>
              </div>
            </div>
            <div className="shrink-0">
              <Badge className="bg-white text-red-600 hover:bg-white border-0 font-bold px-4 py-1.5 text-sm uppercase tracking-wider">
                Chỉ còn 150k
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Packages Selection */}
        <div className="lg:col-span-7">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            1. Chọn gói dịch vụ
          </h2>
          <div className="space-y-4">
            {packages.map((pkg) => (
              <Card
                key={pkg.id}
                className={`cursor-pointer transition-all duration-300 rounded-2xl border-2 relative overflow-hidden ${
                  selectedPackage === pkg.id
                    ? `border-primary shadow-md`
                    : 'border-transparent bg-white shadow-sm hover:border-gray-300'
                }`}
                onClick={() => setSelectedPackage(pkg.id)}
              >
                {/* Active highlight background */}
                {selectedPackage === pkg.id && (
                  <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
                )}
                
                {pkg.popular && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-[#e03131] text-white text-[10px] uppercase font-bold tracking-wider py-1 px-4 rounded-bl-xl shadow-sm">
                      Khuyên dùng
                    </div>
                  </div>
                )}

                <CardContent className="p-5 sm:p-6 relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selectedPackage === pkg.id ? 'border-primary' : 'border-gray-300'
                      }`}>
                        {selectedPackage === pkg.id && <div className="w-3 h-3 rounded-full bg-primary" />}
                      </div>
                      <div>
                        <h3 className={`font-bold text-lg ${pkg.color}`}>{pkg.name}</h3>
                        <p className="text-sm font-medium text-gray-500 flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" /> Áp dụng {pkg.duration} ngày
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-extrabold text-gray-900">{formatPrice(pkg.price)}</p>
                      {pkg.originalPrice && (
                        <p className="text-sm font-medium text-gray-400 line-through mt-0.5">
                          {formatPrice(pkg.originalPrice)}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-xl ${pkg.bg} border ${pkg.border} mt-2`}>
                    <ul className="grid sm:grid-cols-2 gap-2.5">
                      {pkg.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-[13px] font-medium text-gray-700">
                          <CheckCircle className={`h-4 w-4 shrink-0 ${pkg.color}`} />
                          <span className="line-clamp-1">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Method Selection */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Wallet className="h-5 w-5 text-gray-500" />
              2. Chọn phương thức thanh toán
            </h2>
            <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <RadioGroup
                  value={selectedPayment}
                  onValueChange={setSelectedPayment}
                  className="gap-0 flex flex-col"
                >
                  {paymentMethods.map((method, idx) => {
                    const Icon = method.icon;
                    return (
                      <div key={method.id} className={idx !== paymentMethods.length - 1 ? 'border-b border-gray-100' : ''}>
                        <RadioGroupItem
                          value={method.id}
                          id={method.id}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={method.id}
                          className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 peer-data-[state=checked]:bg-primary-light/10 transition-colors m-0 relative"
                        >
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            selectedPayment === method.id ? 'border-primary' : 'border-gray-300'
                          }`}>
                            {selectedPayment === method.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                          </div>
                          
                          <div className="w-10 h-10 bg-white border border-gray-100 shadow-sm rounded-xl flex items-center justify-center shrink-0">
                            <Icon className={`h-5 w-5 ${selectedPayment === method.id ? 'text-primary' : 'text-gray-500'}`} />
                          </div>
                          
                          <div className="flex-1">
                            <p className="font-bold text-gray-900 text-[15px]">{method.name}</p>
                            <p className="text-[13px] text-gray-500 font-medium">{method.description}</p>
                          </div>
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          {/* Checkout Card */}
          <Card className="rounded-2xl border-gray-100 shadow-lg bg-gray-900 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <CardContent className="p-6 relative z-10">
              <h3 className="font-bold text-lg mb-4 text-white">Tổng thanh toán</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-medium text-sm">Gói đã chọn</span>
                  <span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded-md text-sm">{currentPackage?.name}</span>
                </div>
                {currentPackage?.originalPrice && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400 font-medium">Giá gốc</span>
                    <span className="line-through text-gray-500">
                      {formatPrice(currentPackage.originalPrice)}
                    </span>
                  </div>
                )}
                <div className="pt-3 border-t border-white/10 mt-3 flex justify-between items-end">
                  <span className="text-gray-300 font-medium text-sm">Thành tiền</span>
                  <span className="text-3xl font-extrabold text-white tracking-tight">
                    {formatPrice(currentPackage?.price || 0)}
                  </span>
                </div>
              </div>

              <Button
                onClick={handlePayment}
                className="w-full h-12 bg-primary hover:bg-[#0ea5e9] text-white font-bold text-base rounded-xl transition-colors shadow-md border-0"
              >
                <ShieldCheck className="h-5 w-5 mr-2" />
                Thanh toán an toàn
              </Button>

              <div className="mt-5 text-center flex items-center justify-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-400" />
                <p className="text-[11px] text-gray-400 font-medium">
                  Giao dịch được mã hóa và bảo mật 100%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
