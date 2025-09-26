'use client';

import Link from 'next/link';

type ChannelMeta = {
  id: string;
  title: string;
  handle?: string | null;
  thumb?: any;
  subscriber_count?: string;
  video_count?: string;
  view_count?: string;
  playlists_json?: any[];
};

export default function ChannelCard({ channel }: { channel: ChannelMeta }) {
  const thumbUrl = channel.thumb?.medium?.url || channel.thumb?.default?.url || '/default-avatar.png';
  const channelUrl = channel.handle ? `https://www.youtube.com/${channel.handle}` : `https://www.youtube.com/channel/${channel.id}`;
  const subscriberCount = parseInt(channel.subscriber_count || '0');
  const playlistCount = channel.playlists_json?.length || 0;
  
  return (
    <div className="bg-sk4-white border border-sk4-gray p-3 sk4-interactive flex flex-col sk4-slide-in">
      <div className="w-full aspect-square overflow-hidden mb-2 rounded-full">
        <img src={thumbUrl} alt={channel.title} className="w-full h-full object-cover rounded-full" />
      </div>
      <p className="sk4-text-sm text-sk4-charcoal font-medium truncate">{channel.title}</p>
      {channel.handle && <p className="sk4-text-xs text-sk4-dark-gray truncate">@{channel.handle}</p>}
      
      <div className="mt-2 space-y-1">
        <div className="flex justify-between sk4-text-xs text-sk4-dark-gray">
          <span>{subscriberCount.toLocaleString()} 구독자</span>
          <span>{playlistCount}개 플레이리스트</span>
        </div>
      </div>
      
      <div className="mt-2 flex items-center justify-between">
        <Link href={`/station/channel/${channel.id}`} className="sk4-text-xs text-sk4-dark-gray hover:text-sk4-charcoal">자세히</Link>
        <a href={channelUrl} target="_blank" rel="noopener noreferrer" className="sk4-text-xs text-sk4-orange">구독하기</a>
      </div>
    </div>
  );
}


