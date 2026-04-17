'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Star,
  Phone,
  Mail,
  MessageSquare,
  ShieldCheck,
  MapPin,
  Verified,
} from 'lucide-react';

interface AgentProfileProps {
  user: {
    id: number;
    name: string;
    avatar: string | null;
    phone: string;
    is_agent?: boolean;
    rating?: number;
    total_listings?: number;
  };
  showContact?: boolean;
  compact?: boolean;
}

export function AgentProfile({ user, showContact = true, compact = false }: AgentProfileProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={user.avatar || undefined} />
          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium text-sm">{user.name}</p>
          {user.is_agent && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <ShieldCheck className="h-3 w-3 text-blue-500" />
              Môi giới
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatar || undefined} />
              <AvatarFallback className="text-2xl">{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            {user.is_agent && (
              <div className="absolute -bottom-2 -right-2 bg-blue-500 rounded-full p-1">
                <Verified className="h-3 w-3 text-white" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg">{user.name}</h3>
              {user.is_agent && (
                <Badge variant="secondary" className="text-xs">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  Đã xác thực
                </Badge>
              )}
            </div>

            {user.is_agent && user.rating && (
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(user.rating!)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-medium">{user.rating}</span>
                <span className="text-gray-500 text-sm">
                  ({user.total_listings} tin)
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Phone className="h-4 w-4" />
              {user.phone}
            </div>
          </div>
        </div>

        {showContact && (
          <>
            <Separator className="my-4" />
            <div className="flex gap-2">
              <Button className="flex-1 gap-2">
                <Phone className="h-4 w-4" />
                Gọi ngay
              </Button>
              <Button variant="outline" className="flex-1 gap-2">
                <MessageSquare className="h-4 w-4" />
                Nhắn tin
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
