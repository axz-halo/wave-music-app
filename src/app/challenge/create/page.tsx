'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/layout/Navigation';
import { dummyChallenges, dummyUsers } from '@/lib/dummy-data';

export default function ChallengeCreatePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [trackCount, setTrackCount] = useState(10);
  const [duration, setDuration] = useState(7);

  const genres = ['K-Pop', 'Hip-Hop', 'Rock', 'Electronic', 'Jazz', 'Classical', 'Indie', 'R&B'];
  const moods = ['흥분', '휴식', '운동', '집중', '슬픔', '사랑', '에너지', '감성'];

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const handleMoodToggle = (mood: string) => {
    setSelectedMoods(prev => 
      prev.includes(mood) 
        ? prev.filter(m => m !== mood)
        : [...prev, mood]
    );
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    const newId = String(Date.now());
    const newChallenge = {
      id: newId,
      title: title.trim(),
      description: description.trim() || '설명 없음',
      creator: dummyUsers[0],
      status: 'upcoming' as const,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString(),
      votingEndDate: new Date(Date.now() + (duration + 2) * 24 * 60 * 60 * 1000).toISOString(),
      targetTrackCount: trackCount,
      currentTrackCount: 0,
      participants: 1,
      rules: {
        genres: selectedGenres,
        moods: selectedMoods,
        allowDuplicates: false,
        votingMethod: 'like' as const,
      },
      thumbnailUrl: dummyChallenges[0]?.thumbnailUrl,
      createdAt: new Date().toISOString(),
    };
    dummyChallenges.unshift(newChallenge);
    router.push(`/challenge/${newId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0 lg:ml-56">
      <header className="hidden lg:block bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">챌린지 만들기</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">챌린지 제목</label>
              <input 
                value={title} 
                onChange={(e)=>setTitle(e.target.value)} 
                className="w-full p-3 border border-gray-200 rounded-lg" 
                placeholder="예: 스터디 플레이리스트 챌린지" 
                maxLength={50}
              />
              <p className="text-xs text-gray-500 mt-1">{title.length}/50</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">설명</label>
              <textarea 
                value={description} 
                onChange={(e)=>setDescription(e.target.value)} 
                className="w-full p-3 border border-gray-200 rounded-lg h-24" 
                placeholder="어떤 상황의 음악을 추천받고 싶은지 설명해주세요" 
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">{description.length}/200</p>
            </div>
          </div>
        </div>

        {/* Music Preferences */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">음악 설정</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">장르 (선택사항)</label>
              <div className="grid grid-cols-2 gap-2">
                {genres.map(genre => (
                  <button
                    key={genre}
                    onClick={() => handleGenreToggle(genre)}
                    className={`p-2 rounded-lg border text-sm font-medium transition-all ${
                      selectedGenres.includes(genre)
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">무드 (선택사항)</label>
              <div className="grid grid-cols-2 gap-2">
                {moods.map(mood => (
                  <button
                    key={mood}
                    onClick={() => handleMoodToggle(mood)}
                    className={`p-2 rounded-lg border text-sm font-medium transition-all ${
                      selectedMoods.includes(mood)
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Duration Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">기간 설정</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                추천 곡 수: {trackCount}곡 ({Math.floor(trackCount * 3.5)}분)
              </label>
              <input
                type="range"
                min="10"
                max="30"
                value={trackCount}
                onChange={(e) => setTrackCount(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>10곡 (30분)</span>
                <span>30곡 (90분)</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                챌린지 기간: {duration}일
              </label>
              <input
                type="range"
                min="3"
                max="14"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>3일</span>
                <span>14일</span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button 
          onClick={handleSubmit} 
          disabled={!title.trim()}
          className="w-full py-3 rounded-lg bg-blue-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-all"
        >
          챌린지 만들기
        </button>
      </div>
      <Navigation onCreateWave={() => {}} />
    </div>
  );
}


