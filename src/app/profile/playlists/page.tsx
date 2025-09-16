'use client';

import Link from 'next/link';
import { dummyPlaylists } from '@/lib/dummy-data';

export default function MyPlaylistsPage() {
  return (
    <div className="min-h-screen bg-cream-50 pb-20 lg:pb-0 lg:ml-56">
      <header className="bg-cream-100 border-b border-cream-200 px-4 py-4 sticky top-0 z-30 shadow-minimal">
        <div className="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-hierarchy-xl font-semibold text-beige-800">내 플레이리스트</h1>
          <Link href="#" className="px-sk4-md py-sk4-sm bg-sk4-orange text-sk4-white rounded sk4-text-sm">새 플레이리스트</Link>
        </div>
      </header>

      <div className="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {dummyPlaylists.map(p => (
            <Link key={p.id} href={`/playlist/${p.id}`} className="bg-sk4-white border border-sk4-gray hover:border-sk4-medium-gray transition-all duration-200 rounded p-sk4-md h-40 flex">
              <img src={p.thumbnailUrl || '/default.jpg'} alt={p.title} className="w-24 h-24 rounded object-cover self-center" />
              <div className="ml-sk4-md min-w-0 self-center">
                <h3 className="sk4-text-lg font-medium text-sk4-charcoal truncate">{p.title}</h3>
                <p className="sk4-text-sm text-sk4-dark-gray truncate">{p.creator.nickname} • {p.tracks.length}곡</p>
                <p className="sk4-text-xs text-sk4-dark-gray mt-sk4-sm">업데이트 {new Date(p.updatedAt).toLocaleDateString()}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}


