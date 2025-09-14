'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfileSetupPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const genres = ['K-Pop', 'Hip-Hop', 'Rock', 'Electronic', 'Jazz', 'Classical', 'Indie', 'R&B'];

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const handleSubmit = () => {
    if (!nickname.trim() || selectedGenres.length < 3) return;
    
    setIsLoading(true);
    // Mock profile setup
    setTimeout(() => {
      localStorage.setItem('profile', JSON.stringify({
        nickname: nickname.trim(),
        genres: selectedGenres
      }));
      router.push('/feed');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-white font-bold text-2xl">W</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">프로필 설정</h1>
          <p className="text-gray-600">음악 취향을 알려주세요</p>
        </div>

        {/* Nickname */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            닉네임 (2-20자)
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임을 입력하세요"
            maxLength={20}
            className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">{nickname.length}/20</p>
        </div>

        {/* Genres */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            선호 장르 (최소 3개 선택)
          </label>
          <div className="grid grid-cols-2 gap-3">
            {genres.map(genre => (
              <button
                key={genre}
                onClick={() => handleGenreToggle(genre)}
                className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                  selectedGenres.includes(genre)
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {selectedGenres.length}/8 선택됨 (최소 3개 필요)
          </p>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!nickname.trim() || selectedGenres.length < 3 || isLoading}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-all"
        >
          {isLoading ? '설정 중...' : '시작하기'}
        </button>
      </div>
    </div>
  );
}
