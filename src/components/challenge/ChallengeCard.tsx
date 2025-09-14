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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition h-full">
        <div className="flex items-start space-x-3">
          <div className="relative flex-shrink-0">
            <img 
              src={challenge.thumbnailUrl || '/default-challenge.jpg'} 
              alt={challenge.title}
              className={`${imageSize} rounded-lg shadow-sm object-cover`}
            />
            <span className="absolute -top-1 -left-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium text-white bg-gray-500">
              {challenge.status === 'upcoming' ? '진행 예정' : challenge.status === 'active' ? '진행 중' : challenge.status === 'voting' ? '투표 중' : '완료됨'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm truncate">{challenge.title}</h3>
            <p className="text-xs text-gray-600 truncate">{challenge.creator.nickname}</p>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{challenge.description}</p>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex items-center space-x-1">
                  <Users className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-600">{challenge.participants}명</span>
                </div>
                <div className="hidden sm:flex items-center space-x-1">
                  <Trophy className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-600">{challenge.currentTrackCount}/{challenge.targetTrackCount}곡</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-600">{countdownText}</span>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-blue-600 text-white rounded text-xs font-medium whitespace-nowrap">{ctaText}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}


