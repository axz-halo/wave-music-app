'use client';

import Link from 'next/link';
import { Clock, Users, Trophy } from 'lucide-react';
import { Challenge } from '@/types';

interface ChallengeCardProps {
  challenge: Challenge;
  ctaText: string;
  countdownText: string;
  size?: 'sm' | 'md';
}

export default function ChallengeCard({ challenge, ctaText, countdownText, size = 'md' }: ChallengeCardProps) {
  const imageSize = size === 'sm' ? 'w-12 h-12' : 'w-16 h-16';

  return (
    <Link href={`/challenge/${challenge.id}`} className="block">
      <div className="card-neumorphic p-5 hover:shadow-soft transition-all duration-200 h-full fade-in">
        <div className="flex items-start space-x-4">
          <div className="relative flex-shrink-0">
            <img 
              src={challenge.thumbnailUrl || '/default-challenge.jpg'} 
              alt={challenge.title}
              className={`${imageSize} rounded-medium shadow-tactile object-cover`}
            />
            <span className="absolute -top-1 -left-1 px-2 py-1 rounded-medium text-[10px] font-medium text-white bg-neutral-600 shadow-tactile">
              {challenge.status === 'upcoming' ? '진행 예정' : challenge.status === 'active' ? '진행 중' : challenge.status === 'voting' ? '투표 중' : '완료됨'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-hierarchy font-semibold text-neutral-900 truncate">{challenge.title}</h3>
            <p className="text-muted truncate">{challenge.creator.nickname}</p>
            <p className="text-xs text-neutral-500 mt-2 line-clamp-2">{challenge.description}</p>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center space-x-4">
                <div className="hidden sm:flex items-center space-x-1">
                  <Users className="w-3 h-3 text-neutral-500" />
                  <span className="text-xs text-neutral-600">{challenge.participants}명</span>
                </div>
                <div className="hidden sm:flex items-center space-x-1">
                  <Trophy className="w-3 h-3 text-neutral-500" />
                  <span className="text-xs text-neutral-600">{challenge.currentTrackCount}/{challenge.targetTrackCount}곡</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-neutral-500" />
                  <span className="text-xs text-neutral-600">{countdownText}</span>
                </div>
              </div>
              <span className="px-3 py-1.5 bg-primary-500 text-white rounded-medium text-xs font-medium whitespace-nowrap shadow-tactile">{ctaText}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}


