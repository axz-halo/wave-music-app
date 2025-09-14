'use client';

import Link from 'next/link';
import { User } from '@/types';

export default function ChannelCard({ channel }: { channel: User }) {
  return (
    <Link href={`/station/channel/${channel.id}`} className="block group">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition flex items-center space-x-3">
        <img src={channel.profileImage || '/default-avatar.png'} alt={channel.nickname} className="w-12 h-12 rounded-full" />
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">{channel.nickname}</p>
          <p className="text-xs text-gray-500 truncate">구독자 {channel.followers.toLocaleString()}명</p>
        </div>
      </div>
    </Link>
  );
}


