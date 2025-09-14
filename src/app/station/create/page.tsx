'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/layout/Navigation';
import { dummyPlaylists, dummyUsers, dummyTracks } from '@/lib/dummy-data';

export default function StationCreatePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState<'manual'|'youtube'>('manual');
  const [youtubeUrl, setYoutubeUrl] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) return;
    const newId = String(Date.now());
    const newPlaylist = {
      id: newId,
      title: title.trim(),
      description: description.trim() || '설명 없음',
      creator: dummyUsers[0],
      tracks: dummyTracks.slice(0, 3),
      isPublic: true,
      isCollaborative: false,
      likes: 0,
      saves: 0,
      plays: 0,
      thumbnailUrl: dummyTracks[0]?.thumbnailUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dummyPlaylists.unshift(newPlaylist);
    router.push(`/station/${newId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0 lg:ml-56">
      <header className="hidden lg:block bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">스테이션 만들기</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <label className={`px-3 py-1.5 rounded-lg border ${source==='manual'?'bg-blue-50 border-blue-200 text-blue-700':'border-gray-200'}`}>
                <input type="radio" name="src" className="mr-2" checked={source==='manual'} onChange={()=>setSource('manual')} /> 수동 생성
              </label>
              <label className={`px-3 py-1.5 rounded-lg border ${source==='youtube'?'bg-blue-50 border-blue-200 text-blue-700':'border-gray-200'}`}>
                <input type="radio" name="src" className="mr-2" checked={source==='youtube'} onChange={()=>setSource('youtube')} /> YouTube 가져오기(더미)
              </label>
            </div>
            <input value={title} onChange={(e)=>setTitle(e.target.value)} className="w-full p-3 border border-gray-200 rounded-lg" placeholder="제목" />
            <textarea value={description} onChange={(e)=>setDescription(e.target.value)} className="w-full p-3 border border-gray-200 rounded-lg h-28" placeholder="설명" />
            {source==='youtube' && (
              <input value={youtubeUrl} onChange={(e)=>setYoutubeUrl(e.target.value)} className="w-full p-3 border border-gray-200 rounded-lg" placeholder="YouTube 채널/플레이리스트 URL (더미)" />
            )}
            <button onClick={handleSubmit} className="w-full py-3 rounded-lg bg-blue-600 text-white">발행</button>
          </div>
        </div>
      </div>
      <Navigation onCreateWave={() => {}} />
    </div>
  );
}


