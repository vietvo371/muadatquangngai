'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { isValidPhone, isValidEmail } from '@/lib/property-form-config';

export interface ContactFieldsData {
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  contact_address: string;
}

interface ContactFieldsProps {
  data: ContactFieldsData;
  onChange: (updates: Partial<ContactFieldsData>) => void;
}

/**
 * Thông tin liên hệ (spec mục 4.5) — điền sẵn từ tài khoản, cho sửa. CHỈ dùng ở trang đăng
 * tin — trang sửa tin không có bước liên hệ.
 */
export function ContactFields({ data, onChange }: ContactFieldsProps) {
  return (
    <section>
      <h3 className="text-lg font-bold text-gray-900 mb-5 pb-2 border-b">Thông tin liên hệ</h3>
      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <Label className="font-semibold text-gray-700">Họ và tên <span className="text-red-500">*</span></Label>
          <Input
            value={data.contact_name}
            onChange={(e) => onChange({ contact_name: e.target.value })}
            placeholder="Tên người liên hệ"
            className="mt-2 h-11 bg-gray-50"
          />
        </div>
        <div>
          <Label className="font-semibold text-gray-700">Số điện thoại <span className="text-red-500">*</span></Label>
          <Input
            value={data.contact_phone}
            onChange={(e) => onChange({ contact_phone: e.target.value })}
            placeholder="VD: 0901234567"
            className="mt-2 h-11 bg-gray-50"
          />
          {data.contact_phone && !isValidPhone(data.contact_phone) && (
            <p className="text-xs text-red-500 mt-1.5">Vui lòng nhập đúng định dạng số điện thoại.</p>
          )}
        </div>
        <div>
          <Label className="font-semibold text-gray-700">Email</Label>
          <Input
            value={data.contact_email}
            onChange={(e) => onChange({ contact_email: e.target.value })}
            placeholder="Không bắt buộc"
            className="mt-2 h-11 bg-gray-50"
          />
          {data.contact_email && !isValidEmail(data.contact_email) && (
            <p className="text-xs text-red-500 mt-1.5">Vui lòng nhập đúng định dạng email.</p>
          )}
        </div>
        <div>
          <Label className="font-semibold text-gray-700">Địa chỉ liên hệ</Label>
          <Input
            value={data.contact_address}
            onChange={(e) => onChange({ contact_address: e.target.value })}
            placeholder="Không bắt buộc"
            className="mt-2 h-11 bg-gray-50"
          />
        </div>
      </div>
    </section>
  );
}
