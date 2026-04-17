'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Star, MessageSquare, Home } from 'lucide-react';
import { formatDate } from '@/lib/formatters';

interface ReviewCardProps {
  review: {
    id: number;
    user: {
      name: string;
      avatar: string | null;
    };
    rating: number;
    content: string;
    created_at: string;
    property?: string;
  };
  showProperty?: boolean;
}

export function ReviewCard({ review, showProperty = false }: ReviewCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={review.user.avatar || undefined} />
            <AvatarFallback>{review.user.name.charAt(0)}</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{review.user.name}</span>
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i < review.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <span className="text-xs text-gray-400">
                {formatDate(review.created_at)}
              </span>
            </div>

            {showProperty && review.property && (
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                <Home className="h-3 w-3" />
                {review.property}
              </div>
            )}

            <p className="text-gray-600 text-sm">{review.content}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
