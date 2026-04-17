'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import axios from '@/lib/axios';

interface Location {
  id: number;
  name: string;
  code?: string;
}

interface LocationSelectProps {
  value?: {
    province_id?: number;
    district_id?: number;
    ward_id?: number;
  };
  onChange?: (value: {
    province_id?: number;
    district_id?: number;
    ward_id?: number;
    province_name?: string;
    district_name?: string;
    ward_name?: string;
  }) => void;
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
  showWard = true,
  required = false,
}: LocationSelectProps) {
  const [provinces, setProvinces] = useState<Location[]>([]);
  const [districts, setDistricts] = useState<Location[]>([]);
  const [wards, setWards] = useState<Location[]>([]);
  
  const [selectedProvince, setSelectedProvince] = useState<number | undefined>(value.province_id);
  const [selectedDistrict, setSelectedDistrict] = useState<number | undefined>(value.district_id);
  const [selectedWard, setSelectedWard] = useState<number | undefined>(value.ward_id);
  
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingWards, setIsLoadingWards] = useState(false);
  
  const [openProvince, setOpenProvince] = useState(false);
  const [openDistrict, setOpenDistrict] = useState(false);
  const [openWard, setOpenWard] = useState(false);

  // Fetch provinces on mount
  useEffect(() => {
    const fetchProvinces = async () => {
      setIsLoadingProvinces(true);
      try {
        const response = await axios.get('/api/locations/provinces');
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
      setSelectedDistrict(undefined);
      setSelectedWard(undefined);
      setWards([]);
      
      try {
        const response = await axios.get(`/api/locations/districts/${selectedProvince}`);
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
      setSelectedWard(undefined);
      
      try {
        const response = await axios.get(`/api/locations/wards/${selectedDistrict}`);
        setWards(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch wards:', error);
      } finally {
        setIsLoadingWards(false);
      }
    };
    fetchWards();
  }, [selectedDistrict]);

  // Notify parent of changes
  const notifyChange = useCallback(() => {
    const province = provinces.find(p => p.id === selectedProvince);
    const district = districts.find(d => d.id === selectedDistrict);
    const ward = wards.find(w => w.id === selectedWard);

    onChange?.({
      province_id: selectedProvince,
      district_id: selectedDistrict,
      ward_id: selectedWard,
      province_name: province?.name,
      district_name: district?.name,
      ward_name: ward?.name,
    });
  }, [selectedProvince, selectedDistrict, selectedWard, provinces, districts, wards, onChange]);

  useEffect(() => {
    notifyChange();
  }, [notifyChange]);

  const handleSelect = (type: 'province' | 'district' | 'ward', id: number, name: string) => {
    switch (type) {
      case 'province':
        setSelectedProvince(id);
        setOpenProvince(false);
        break;
      case 'district':
        setSelectedDistrict(id);
        setOpenDistrict(false);
        break;
      case 'ward':
        setSelectedWard(id);
        setOpenWard(false);
        break;
    }
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

      {/* District */}
      <div className="flex-1 min-w-[150px]">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Quận/Huyện {required && <span className="text-red-500">*</span>}
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
              {getSelectedName('district') || 'Chọn Quận/Huyện'}
            </span>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>

          {openDistrict && (
            <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
              {districts.map((district) => (
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
          }}
        />
      )}
    </div>
  );
}
