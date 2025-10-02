'use client';

import { useEffect, useState } from 'react';
import Navigation from '@/components/layout/Navigation';
import supabase from '@/lib/supabaseClient';
import { onAuthStateChange } from '@/lib/authSupa';

export default function MyWavesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChange(async (u) => {
      if (u && supabase) {
        const { data } = await supabase
          .from('waves')
          .select('*')
          .eq('user_id', u.id)
          .order('created_at', { ascending: false });
        setItems((data || []).map((w: any) => ({
          id: w.id,
          title: w.track_title,
          artist: w.track_artist,
          thumb: w.thumb_url,
          createdAt: w.created_at,
          likes: w.likes || 0,
          comments: w.comments || 0,
        })));
      } else {
        setItems([]);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-sk4-off-white pb-20 lg:pb-0 lg:ml-56">
      <header className="bg-sk4-white border-b border-sk4-gray px-4 py-4 sticky top-0 z-30">
        <div className="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="sk4-text-large-title">내 웨이브</h1>
        </div>
      </header>

      <div className="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center sk4-text-sm text-sk4-dark-gray">불러오는 중…</div>
        ) : items.length === 0 ? (
          <div className="bg-sk4-white border border-sk4-gray p-sk4-lg text-center">
            <p className="sk4-text-sm text-sk4-dark-gray">아직 웨이브가 없습니다</p>
          </div>
        ) : (
          <ul className="divide-y divide-sk4-gray bg-sk4-white border border-sk4-gray">
            {items.map((it) => (
              <li key={it.id} className="flex items-center gap-sk4-sm px-sk4-md py-sk4-sm">
                <img src={it.thumb} className="w-12 h-12 rounded" alt={it.title} />
                <div className="min-w-0 flex-1">
                  <p className="sk4-text-sm text-sk4-charcoal truncate">{it.title}</p>
                  <p className="sk4-text-xs text-sk4-dark-gray truncate">{it.artist}</p>
                </div>
                <div className="sk4-text-xs text-sk4-dark-gray whitespace-nowrap">❤️ {it.likes} · 💬 {it.comments}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Navigation />
    </div>
  );
}









