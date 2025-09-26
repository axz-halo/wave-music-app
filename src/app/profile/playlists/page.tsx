'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient';
import { ensureSignedIn } from '@/lib/authSupa';

interface PlaylistRow {
  id: string;
  title: string;
  thumb_url: string | null;
  created_at: string;
}

export default function MyPlaylistsPage() {
  const [items, setItems] = useState<PlaylistRow[]>([]);

  useEffect(() => {
    const load = async () => {
      const u = await ensureSignedIn();
      if (!u || !supabase) return;
      const { data } = await supabase
        .from('playlists')
        .select('id,title,thumb_url,created_at')
        .eq('user_id', u.id)
        .order('created_at', { ascending: false });
      setItems(data || []);
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-sk4-off-white pb-20 lg:pb-0 lg:ml-56">
      <header className="bg-sk4-white border-b border-sk4-gray px-4 py-4 sticky top-0 z-30">
        <div className="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="sk4-text-large-title">내 플레이리스트</h1>
          <Link href="#" className="px-sk4-md py-sk4-sm bg-sk4-orange text-sk4-white rounded sk4-text-sm">새 플레이리스트</Link>
        </div>
      </header>

      <div className="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map(p => (
            <Link key={p.id} href={`/playlist/${p.id}`} className="bg-sk4-white border border-sk4-gray hover:border-sk4-medium-gray transition-all duration-200 rounded p-sk4-md h-40 flex">
              <img src={p.thumb_url || '/default.jpg'} alt={p.title} className="w-24 h-24 rounded object-cover self-center" />
              <div className="ml-sk4-md min-w-0 self-center">
                <h3 className="sk4-text-lg font-medium text-sk4-charcoal truncate">{p.title}</h3>
                <p className="sk4-text-sm text-sk4-dark-gray truncate">내 플레이리스트</p>
                <p className="sk4-text-xs text-sk4-dark-gray mt-sk4-sm">생성 {new Date(p.created_at).toLocaleDateString()}</p>
              </div>
            </Link>
          ))}
          {items.length === 0 && (
            <div className="col-span-full text-center sk4-text-sm text-sk4-dark-gray">아직 플레이리스트가 없습니다</div>
          )}
        </div>
      </div>
    </div>
  );
}


