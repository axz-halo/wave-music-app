'use client';

import Link from 'next/link';
import { Challenge } from '@/types';

interface FeaturedChallengeBannerProps {
  challenge: Challenge;
}

export default function FeaturedChallengeBanner({ challenge }: FeaturedChallengeBannerProps) {
  return (
    <Link href={`/challenge/${challenge.id}`} className="block">
      <div className="bg-sk4-white border border-sk4-gray hover:border-sk4-medium-gray transition-all duration-200 flex items-center h-40 sm:h-44 px-sk4-md gap-sk4-md">
        <img
          src={challenge.thumbnailUrl || '/default-challenge.jpg'}
          alt={challenge.title}
          className="w-28 h-28 sm:w-32 sm:h-32 object-cover rounded"
        />
        <div className="flex-1 min-w-0">
          <div className="sk4-text-sm text-sk4-dark-gray mb-1">{challenge.status === 'active' ? '진행 중' : challenge.status === 'upcoming' ? '진행 예정' : challenge.status === 'voting' ? '투표 중' : '완료됨'}</div>
          <h3 className="sk4-text-lg font-medium text-sk4-charcoal truncate">{challenge.title}</h3>
          <p className="sk4-text-sm text-sk4-dark-gray truncate">{challenge.description}</p>
          <div className="mt-sk4-sm sk4-text-xs text-sk4-dark-gray">
            참가 {challenge.participants}명 • {challenge.currentTrackCount}/{challenge.targetTrackCount}곡
          </div>
          <div className="mt-sk4-sm">
            <span className="inline-flex items-center justify-center px-sk4-md py-sk4-sm bg-sk4-orange text-sk4-white sk4-text-sm font-medium">
              참여하기
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}


