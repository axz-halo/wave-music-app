'use client';

import Link from 'next/link';
import { Clock } from 'lucide-react';
import { Challenge } from '@/types';

interface ChallengeCardProps {
  challenge: Challenge;
  ctaText: string;
  countdownText: string;
  size?: 'sm' | 'md';
}

export default function ChallengeCard({ challenge, ctaText, countdownText, size = 'md' }: ChallengeCardProps) {
  const imageSize = size === 'sm' ? 'w-12 h-12' : 'w-16 h-16';
  const isPrimary = challenge.status === 'active' || challenge.status === 'voting';

  return (
    <Link href={`/challenge/${challenge.id}`} className="block h-full">
      <div className="bg-sk4-white border border-sk4-gray p-sk4-md hover:border-sk4-medium-gray transition-all duration-200 h-full">
        <div className="flex items-start gap-sk4-md">
          <div className="relative flex-shrink-0">
            <img
              src={challenge.thumbnailUrl || '/default-challenge.jpg'}
              alt={challenge.title}
              className={`${imageSize} object-cover border border-sk4-gray`}
            />
            <span className="absolute -top-1 -left-1 px-2 py-1 text-[10px] font-medium text-sk4-white bg-sk4-charcoal">
              {challenge.status === 'upcoming' ? '진행 예정' : challenge.status === 'active' ? '진행 중' : challenge.status === 'voting' ? '투표 중' : '완료됨'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="sk4-text-lg font-medium text-sk4-charcoal truncate">{challenge.title}</h3>
            <p className="sk4-text-base text-sk4-dark-gray truncate">{challenge.creator.nickname}</p>
            <p className="sk4-text-xs text-sk4-dark-gray mt-sk4-sm clamp-2">{challenge.description}</p>

            {/* Bottom bar - minimal, single CTA */}
            <div className="flex items-center justify-between pt-sk4-sm mt-sk4-sm border-t border-sk4-gray">
              <div className="flex items-center gap-1 sk4-text-xs text-sk4-dark-gray min-w-0">
                <Clock className="w-3 h-3" />
                <span className="truncate">{countdownText}</span>
              </div>
              <span className={`px-sk4-md py-sk4-sm sk4-text-xs font-medium whitespace-nowrap border ${isPrimary ? 'bg-sk4-orange text-sk4-white border-sk4-orange' : 'bg-sk4-white text-sk4-charcoal border-sk4-gray'}`}>{ctaText}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}


