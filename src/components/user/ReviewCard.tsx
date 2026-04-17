'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, ThumbsUp, Flag } from 'lucide-react';
import Link from 'next/link';

interface Review {
  id: number;
  rating: number;
  content: string;
  createdAt: string;
  user: {
    id: number;
    name: string;
    avatar?: string | null;
  };
  property?: {
    id: number;
    title: string;
    slug: string;
  };
}

interface ReviewCardProps {
  review: Review;
  showProperty?: boolean;
  className?: string;
}

export function ReviewCard({
  review,
  showProperty = false,
  className = '',
}: ReviewCardProps) {
  const { rating, content, createdAt, user, property } = review;

  const timeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`;
    return `${Math.floor(diffDays / 365)} năm trước`;
  };

  return (
    <Card className={className}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar || undefined} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-gray-900">{user.name}</p>
              <p className="text-sm text-gray-500">{timeAgo(createdAt)}</p>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${
                  star <= rating
                    ? 'text-yellow-500 fill-yellow-500'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Property Link */}
        {showProperty && property && (
          <Link
            href={`/mua-ban/${property.slug}`}
            className="inline-block mb-3 text-sm text-blue-600 hover:text-blue-700 hover:underline"
          >
            {property.title}
          </Link>
        )}

        {/* Content */}
        <p className="text-gray-600">{content}</p>

        {/* Helpful */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t">
          <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <ThumbsUp className="h-4 w-4" />
            <span>Hữu ích</span>
          </button>
          <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <Flag className="h-4 w-4" />
            <span>Báo cáo</span>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

// Review Summary Component
interface ReviewSummaryProps {
  averageRating: number;
  totalReviews: number;
  ratingDistribution?: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  className?: string;
}

export function ReviewSummary({
  averageRating,
  totalReviews,
  ratingDistribution,
  className = '',
}: ReviewSummaryProps) {
  return (
    <div className={className}>
      {/* Overall Rating */}
      <div className="flex items-center gap-4 mb-4">
        <div className="text-center">
          <p className="text-4xl font-bold text-gray-900">{averageRating.toFixed(1)}</p>
          <div className="flex items-center gap-0.5 my-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${
                  star <= Math.round(averageRating)
                    ? 'text-yellow-500 fill-yellow-500'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-500">{totalReviews} đánh giá</p>
        </div>
      </div>

      {/* Rating Distribution */}
      {ratingDistribution && (
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratingDistribution[star as keyof typeof ratingDistribution];
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

            return (
              <div key={star} className="flex items-center gap-2">
                <span className="w-4 text-sm text-gray-600">{star}</span>
                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-10 text-sm text-gray-500 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Review Form Component
interface ReviewFormProps {
  onSubmit?: (rating: number, content: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function ReviewForm({
  onSubmit,
  isLoading = false,
  className = '',
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating > 0 && content.trim()) {
      onSubmit?.(rating, content);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <h3 className="font-semibold text-gray-900 mb-4">Viết đánh giá</h3>

      {/* Rating */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Đánh giá của bạn
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 hover:scale-110 transition-transform"
            >
              <Star
                className={`h-8 w-8 ${
                  star <= (hoverRating || rating)
                    ? 'text-yellow-500 fill-yellow-500'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nội dung đánh giá
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Chia sẻ trải nghiệm của bạn..."
          rows={4}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={rating === 0 || !content.trim() || isLoading}
        className="w-full"
      >
        {isLoading ? 'Đang gửi...' : 'Gửi đánh giá'}
      </Button>
    </form>
  );
}
