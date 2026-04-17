'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Phone, MessageSquare, ExternalLink } from 'lucide-react';

interface AgentProfileProps {
  agent: {
    id: number;
    name: string;
    avatar?: string | null;
    phone?: string;
    email?: string;
    role: string;
    bio?: string;
    rating?: number;
    reviewCount?: number;
    totalListings?: number;
    zalo?: string;
    facebook?: string;
    website?: string;
    licenseNumber?: string;
    agencyName?: string;
    joinedAt?: string;
  };
  variant?: 'card' | 'compact' | 'full';
  showContact?: boolean;
  className?: string;
}

export function AgentProfile({
  agent,
  variant = 'card',
  showContact = true,
  className = '',
}: AgentProfileProps) {
  const { id, name, avatar, phone, role, bio, rating, reviewCount, totalListings, zalo, facebook } = agent;

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <Avatar className="h-10 w-10">
          <AvatarImage src={avatar || undefined} alt={name} />
          <AvatarFallback>{name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{name}</p>
          {rating && (
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
              <span className="font-medium">{rating}</span>
              <span className="text-gray-500">({reviewCount} đánh giá)</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={className}>
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={avatar || undefined} alt={name} />
            <AvatarFallback className="text-xl">{name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-gray-900">{name}</h2>
              {role === 'agent' && (
                <Badge variant="secondary" className="text-xs">Môi giới</Badge>
              )}
              {agent.licenseNumber && (
                <Badge variant="outline" className="text-xs">Đã xác minh</Badge>
              )}
            </div>
            {rating && (
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= Math.round(rating)
                          ? 'text-yellow-500 fill-yellow-500'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-medium">{rating}</span>
                <span className="text-gray-500">({reviewCount} đánh giá)</span>
              </div>
            )}
            {agent.agencyName && (
              <p className="text-sm text-gray-500">{agent.agencyName}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{totalListings || 0}</p>
            <p className="text-sm text-gray-500">Tin đăng</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{rating || '0'}</p>
            <p className="text-sm text-gray-500">Đánh giá</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">
              {agent.joinedAt ? new Date(agent.joinedAt).getFullYear() : 'N/A'}
            </p>
            <p className="text-sm text-gray-500">Năm tham gia</p>
          </div>
        </div>

        {/* Bio */}
        {bio && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Giới thiệu</h3>
            <p className="text-gray-600">{bio}</p>
          </div>
        )}

        {/* Contact */}
        {showContact && (
          <div className="space-y-3">
            {phone && (
              <a href={`tel:${phone}`}>
                <Button className="w-full gap-2">
                  <Phone className="h-4 w-4" />
                  {phone}
                </Button>
              </a>
            )}
            <div className="grid grid-cols-2 gap-3">
              {zalo && (
                <a href={`https://zalo.me/${zalo}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Zalo
                  </Button>
                </a>
              )}
              {facebook && (
                <a href={facebook} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Facebook
                  </Button>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Links */}
        <div className="mt-6 pt-6 border-t">
          <Link href={`/moi-gioi/${id}`}>
            <Button variant="ghost" className="w-full">
              Xem hồ sơ đầy đủ
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Default: card variant
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={avatar || undefined} alt={name} />
            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900">{name}</p>
              {role === 'agent' && (
                <Badge variant="secondary" className="text-xs">Môi giới</Badge>
              )}
            </div>
            {rating && (
              <div className="flex items-center gap-1 text-sm">
                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                <span className="font-medium">{rating}</span>
                <span className="text-gray-500">({reviewCount} đánh giá)</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 py-3 border-y mb-4">
          <div className="flex-1 text-center">
            <p className="font-bold text-gray-900">{totalListings || 0}</p>
            <p className="text-xs text-gray-500">Tin đăng</p>
          </div>
          <div className="w-px bg-gray-200" />
          <div className="flex-1 text-center">
            <p className="font-bold text-gray-900">{rating || '0'}</p>
            <p className="text-xs text-gray-500">Đánh giá</p>
          </div>
        </div>

        {/* Bio */}
        {bio && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{bio}</p>
        )}

        {/* Contact */}
        {showContact && (
          <div className="space-y-2">
            {phone && (
              <a href={`tel:${phone}`}>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 gap-2">
                  <Phone className="h-4 w-4" />
                  {phone}
                </Button>
              </a>
            )}
            <div className="grid grid-cols-2 gap-2">
              {zalo && (
                <a href={`https://zalo.me/${zalo}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="w-full gap-1">
                    Zalo
                  </Button>
                </a>
              )}
              <Link href={`/moi-gioi/${id}`}>
                <Button variant="outline" size="sm" className="w-full">
                  Hồ sơ
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
