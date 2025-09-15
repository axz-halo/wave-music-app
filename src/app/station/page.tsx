'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import PlaylistCard from '@/components/station/PlaylistCard';
import ChannelCard from '@/components/station/ChannelCard';
import CategoryFilter from '@/components/station/CategoryFilter';
import { dummyPlaylists, dummyUsers } from '@/lib/dummy-data';
import { CardSkeleton } from '@/components/common/Skeleton';
import Navigation from '@/components/layout/Navigation';

function StationPageContent() {
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [period, setPeriod] = useState<'오늘'|'이번 주'|'이번 달'>( (search.get('period') as any) || '오늘');
  const [category, setCategory] = useState<string>(search.get('category') || '전체');
  const [sortBy, setSortBy] = useState<'인기순'|'최신순'>( (search.get('sort') as any) || '인기순');
  const [limit, setLimit] = useState(8);

  const filteredAll = useMemo(() => {
    let list = [...dummyPlaylists];
    if (category !== '전체') {
      // 간단 필터: 제목/설명에 카테고리 포함 여부(데모)
      list = list.filter(p => (p.title + ' ' + (p.description || '')).toLowerCase().includes(category.toLowerCase()));
    }
    if (sortBy === '인기순') {
      list.sort((a,b) => (b.likes + b.plays) - (a.likes + a.plays));
    } else {
      list.sort((a,b) => (new Date(b.updatedAt).getTime()) - (new Date(a.updatedAt).getTime()));
    }
    return list;
  }, [category, sortBy]);

  // sync to URL
  useEffect(() => {
    const params = new URLSearchParams(search.toString());
    params.set('period', period);
    params.set('category', category);
    params.set('sort', sortBy);
    router.replace(`${pathname}?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, category, sortBy]);

  return (
    <>
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0 lg:ml-56">
      {/* Header */}
      <header className="hidden lg:block bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">스테이션</h1>
          <a href="/station/create" className="px-3 py-2 rounded-medium bg-primary-500 text-white text-sm shadow-tactile hover:bg-primary-600 transition-all duration-200">스테이션 만들기</a>
        </div>
      </header>

      <div className="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto px-4 py-4 space-y-8">
        {/* Hot List Carousel (simple grid for now) */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Hot List</h2>
            <div className="flex items-center gap-2 text-xs">
              {(['오늘','이번 주','이번 달'] as const).map((p) => (
                <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-medium border transition-all duration-200 ${period===p? 'bg-primary-500 text-white border-primary-500 shadow-tactile':'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>{p}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {([...dummyPlaylists]
              .sort((a,b)=>{
                const scoreA = (a.likes + a.plays) * (period==='오늘'?1.5:period==='이번 주'?1.2:1.0);
                const scoreB = (b.likes + b.plays) * (period==='오늘'?1.5:period==='이번 주'?1.2:1.0);
                return scoreB - scoreA;
              })
              .slice(0,4)
            ).map((p) => (
              <PlaylistCard key={p.id} playlist={p} />
            ))}
            {!dummyPlaylists.length && Array.from({length:4}).map((_,i)=>(<CardSkeleton key={`sk${i}`} />))}
          </div>
        </section>

        {/* Channels */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">채널</h2>
            <a href="#" className="text-sm text-primary-500">모두 보기</a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {dummyUsers.slice(0, 6).map((u) => (
              <ChannelCard key={u.id} channel={u} />
            ))}
          </div>
        </section>

        {/* All Stations */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">전체 스테이션</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => setSortBy('인기순')} className={`text-xs px-3 py-1.5 rounded-medium border transition-all duration-200 ${sortBy==='인기순' ? 'bg-primary-500 text-white border-primary-500 shadow-tactile':'bg-white text-gray-700 border-gray-200'}`}>인기순</button>
              <button onClick={() => setSortBy('최신순')} className={`text-xs px-3 py-1.5 rounded-medium border transition-all duration-200 ${sortBy==='최신순' ? 'bg-primary-500 text-white border-primary-500 shadow-tactile':'bg-white text-gray-700 border-gray-200'}`}>최신순</button>
            </div>
          </div>
          <CategoryFilter value={category} onChange={setCategory} />
          <div className="h-2" />
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAll.slice(0, limit).map((p) => (
              <PlaylistCard key={`all-${p.id}`} playlist={p} />
            ))}
            {!filteredAll.length && Array.from({length:8}).map((_,i)=>(<CardSkeleton key={`sk2-${i}`} />))}
          </div>
          {limit < filteredAll.length && (
            <div className="flex justify-center mt-4">
              <button onClick={() => setLimit(l => l + 8)} className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm hover:bg-gray-50">더 보기</button>
            </div>
          )}
        </section>
      </div>
    </div>
    <Navigation />
    </>
  );
}

export default function StationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StationPageContent />
    </Suspense>
  );
}
