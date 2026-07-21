'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, MapPin, Loader2 } from 'lucide-react';
import axios from '@/lib/axios';

interface Location {
  id: number;
  name: string;
  code?: string;
  latitude?: number;
  longitude?: number;
}

interface LocationValue {
  province_id?: number;
  district_id?: number;
  ward_id?: number;
  province_name?: string;
  district_name?: string;
  ward_name?: string;
  latitude?: number;
  longitude?: number;
}

interface LocationSelectProps {
  value?: {
    province_id?: number;
    district_id?: number;
    ward_id?: number;
  };
  onChange?: (value: LocationValue) => void;
  disabled?: boolean;
  className?: string;
  showWard?: boolean;
  required?: boolean;
}

export function LocationSelect({
  value = {},
  onChange,
  disabled = false,
  className = '',
  // Sau đợt sáp nhập 2025, tỉnh Quảng Ngãi chỉ còn 2 cấp (Tỉnh -> Xã/Phường/Đặc khu),
  // không còn cấp Phường/Xã con bên dưới -> mặc định ẩn bước ward.
  showWard = false,
  required = false,
}: LocationSelectProps) {
  const [provinces, setProvinces] = useState<Location[]>([]);
  const [districts, setDistricts] = useState<Location[]>([]);
  const [wards, setWards] = useState<Location[]>([]);
  const [districtSearch, setDistrictSearch] = useState('');

  const [selectedProvince, setSelectedProvince] = useState<number | undefined>(value.province_id);
  const [selectedDistrict, setSelectedDistrict] = useState<number | undefined>(value.district_id);
  const [selectedWard, setSelectedWard] = useState<number | undefined>(value.ward_id);

  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingWards, setIsLoadingWards] = useState(false);

  const [openProvince, setOpenProvince] = useState(false);
  const [openDistrict, setOpenDistrict] = useState(false);
  const [openWard, setOpenWard] = useState(false);

  const filteredDistricts = districtSearch
    ? districts.filter((d) => d.name.toLowerCase().includes(districtSearch.toLowerCase()))
    : districts;

  // Fetch provinces on mount
  useEffect(() => {
    const fetchProvinces = async () => {
      setIsLoadingProvinces(true);
      try {
        const response = await axios.get('/api/v2/locations/provinces');
        setProvinces(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch provinces:', error);
      } finally {
        setIsLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, []);

  // Fetch districts when province changes
  useEffect(() => {
    if (!selectedProvince) {
      setDistricts([]);
      setWards([]);
      return;
    }

    const fetchDistricts = async () => {
      setIsLoadingDistricts(true);
      // KHÔNG xoá xã/phường đang chọn ở đây. Việc xoá khi người dùng tự đổi tỉnh đã do
      // handleSelect làm rồi. Nếu xoá ở đây, luồng đặt tự động từ bản đồ sẽ hỏng: bản đồ
      // đặt tỉnh và xã cùng lúc, effect này chạy sau và xoá mất xã vừa đặt.
      setWards([]);

      try {
        const response = await axios.get(`/api/v2/locations/districts/${selectedProvince}`);
        setDistricts(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch districts:', error);
      } finally {
        setIsLoadingDistricts(false);
      }
    };
    fetchDistricts();
  }, [selectedProvince]);

  // Fetch wards when district changes
  useEffect(() => {
    if (!selectedDistrict) {
      setWards([]);
      return;
    }

    const fetchWards = async () => {
      setIsLoadingWards(true);
      // Cùng lý do như trên — handleSelect đã xoá ward khi người dùng đổi xã/phường.

      try {
        const response = await axios.get(`/api/v2/locations/wards/${selectedDistrict}`);
        setWards(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch wards:', error);
      } finally {
        setIsLoadingWards(false);
      }
    };
    fetchWards();
  }, [selectedDistrict]);

  // Sync prop changes to local state
  useEffect(() => {
    if (value.province_id !== undefined) setSelectedProvince(value.province_id);
    if (value.district_id !== undefined) setSelectedDistrict(value.district_id);
    if (value.ward_id !== undefined) setSelectedWard(value.ward_id);
  }, [value.province_id, value.district_id, value.ward_id]);

  const handleSelect = (type: 'province' | 'district' | 'ward', id: number, name: string) => {
    let nextProvince = selectedProvince;
    let nextDistrict = selectedDistrict;
    let nextWard = selectedWard;

    switch (type) {
      case 'province':
        nextProvince = id;
        nextDistrict = undefined;
        nextWard = undefined;
        setSelectedProvince(id);
        setSelectedDistrict(undefined);
        setSelectedWard(undefined);
        setOpenProvince(false);
        break;
      case 'district':
        nextDistrict = id;
        nextWard = undefined;
        setSelectedDistrict(id);
        setSelectedWard(undefined);
        setOpenDistrict(false);
        setDistrictSearch('');
        break;
      case 'ward':
        nextWard = id;
        setSelectedWard(id);
        setOpenWard(false);
        break;
    }

    const province = provinces.find(p => p.id === nextProvince);
    const district = districts.find(d => d.id === nextDistrict);
    const ward = wards.find(w => w.id === nextWard);

    onChange?.({
      province_id: nextProvince,
      district_id: nextDistrict,
      ward_id: nextWard,
      province_name: province?.name || (type === 'province' ? name : undefined),
      district_name: district?.name || (type === 'district' ? name : undefined),
      ward_name: ward?.name || (type === 'ward' ? name : undefined),
      latitude: province?.latitude ?? undefined,
      longitude: province?.longitude ?? undefined,
    });
  };

  const getSelectedName = (type: 'province' | 'district' | 'ward') => {
    switch (type) {
      case 'province':
        return provinces.find(p => p.id === selectedProvince)?.name;
      case 'district':
        return districts.find(d => d.id === selectedDistrict)?.name;
      case 'ward':
        return wards.find(w => w.id === selectedWard)?.name;
    }
  };

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {/* Province */}
      <div className="flex-1 min-w-[150px]">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tỉnh/Thành phố {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => !disabled && setOpenProvince(!openProvince)}
            disabled={disabled || isLoadingProvinces}
            className="w-full h-10 px-3 border rounded-lg bg-white text-left flex items-center justify-between disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <span className={selectedProvince ? 'text-gray-900' : 'text-gray-400'}>
              {isLoadingProvinces ? (
                <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
              ) : (
                <MapPin className="h-4 w-4 inline mr-2 text-gray-400" />
              )}
              {getSelectedName('province') || 'Chọn Tỉnh/TP'}
            </span>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>

          {openProvince && (
            <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
              {provinces.map((province) => (
                <button
                  key={province.id}
                  type="button"
                  onClick={() => handleSelect('province', province.id, province.name)}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-50 ${
                    province.id === selectedProvince ? 'bg-blue-50 text-blue-600' : ''
                  }`}
                >
                  {province.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* District (thực chất là Xã/Phường/Đặc khu theo cơ cấu 96 đơn vị mới) */}
      <div className="flex-1 min-w-[150px]">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Xã/Phường/Đặc khu {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => !disabled && setOpenDistrict(!openDistrict)}
            disabled={disabled || !selectedProvince || isLoadingDistricts}
            className="w-full h-10 px-3 border rounded-lg bg-white text-left flex items-center justify-between disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <span className={selectedDistrict ? 'text-gray-900' : 'text-gray-400'}>
              {isLoadingDistricts ? (
                <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
              ) : (
                <MapPin className="h-4 w-4 inline mr-2 text-gray-400" />
              )}
              {getSelectedName('district') || 'Chọn Xã/Phường/Đặc khu'}
            </span>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>

          {openDistrict && (
            <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-72 overflow-hidden flex flex-col">
              <input
                type="text"
                autoFocus
                value={districtSearch}
                onChange={(e) => setDistrictSearch(e.target.value)}
                placeholder="Tìm xã/phường..."
                className="w-full px-3 py-2 border-b text-sm focus:outline-none"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="overflow-auto">
                {filteredDistricts.length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-400">Không tìm thấy</div>
                )}
                {filteredDistricts.map((district) => (
                  <button
                    key={district.id}
                    type="button"
                    onClick={() => handleSelect('district', district.id, district.name)}
                    className={`w-full px-3 py-2 text-left hover:bg-gray-50 ${
                      district.id === selectedDistrict ? 'bg-blue-50 text-blue-600' : ''
                    }`}
                  >
                    {district.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ward */}
      {showWard && (
        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phường/Xã
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => !disabled && setOpenWard(!openWard)}
              disabled={disabled || !selectedDistrict || isLoadingWards}
              className="w-full h-10 px-3 border rounded-lg bg-white text-left flex items-center justify-between disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <span className={selectedWard ? 'text-gray-900' : 'text-gray-400'}>
                {isLoadingWards ? (
                  <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                ) : (
                  <MapPin className="h-4 w-4 inline mr-2 text-gray-400" />
                )}
                {getSelectedName('ward') || 'Chọn Phường/Xã'}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>

            {openWard && (
              <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                {wards.map((ward) => (
                  <button
                    key={ward.id}
                    type="button"
                    onClick={() => handleSelect('ward', ward.id, ward.name)}
                    className={`w-full px-3 py-2 text-left hover:bg-gray-50 ${
                      ward.id === selectedWard ? 'bg-blue-50 text-blue-600' : ''
                    }`}
                  >
                    {ward.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Click outside handler */}
      {(openProvince || openDistrict || openWard) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setOpenProvince(false);
            setOpenDistrict(false);
            setOpenWard(false);
            setDistrictSearch('');
          }}
        />
      )}
    </div>
  );
}
