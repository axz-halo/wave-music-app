'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Music, Link as LinkIcon, Send, ClipboardPaste, SkipForward, Search, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { TrackInfo } from '@/types';
import { parseYouTubeId } from '@/lib/youtube';

interface CreateWaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (waveData: any) => void;
  initialTrack?: TrackInfo;
}

const moodOptions = [
  { emoji: '🔥', text: '에너지' },
  { emoji: '😌', text: '휴식' },
  { emoji: '💪', text: '운동' },
  { emoji: '📚', text: '집중' },
  { emoji: '😭', text: '슬픔' },
  { emoji: '❤️', text: '사랑' },
];

export default function CreateWaveModal({ isOpen, onClose, onSubmit, initialTrack }: CreateWaveModalProps) {
  const [waveData, setWaveData] = useState({
    track: null as TrackInfo | null,
    comment: '',
    moodEmoji: '',
    moodText: '',
    youtubeUrl: '',
  });

  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const urlInputRef = useRef<HTMLInputElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Prefill from current track if provided
      if (initialTrack) {
        setWaveData(prev => ({ ...prev, track: initialTrack }));
      }
      // Autofocus URL input after paint
      setTimeout(() => {
        urlInputRef.current?.focus();
      }, 50);
      const handleGlobalKey = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
          e.preventDefault();
          handleSubmit();
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        }
      };
      window.addEventListener('keydown', handleGlobalKey);
      return () => window.removeEventListener('keydown', handleGlobalKey);
    }
  }, [isOpen, initialTrack]);

  const handleMoodSelect = (mood: typeof moodOptions[0]) => {
    setWaveData(prev => ({
      ...prev,
      moodEmoji: mood.emoji,
      moodText: mood.text,
    }));
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setWaveData(prev => ({ ...prev, youtubeUrl: text }));
        urlInputRef.current?.focus();
      }
    } catch (err) {
      // Ignore permission errors silently
      console.error('Clipboard read failed', err);
    }
  };

  const handleUseCurrentTrack = () => {
    if (initialTrack) {
      setWaveData(prev => ({ ...prev, track: initialTrack }));
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('검색어를 입력해주세요');
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(searchQuery)}&maxResults=10`);
      const data = await response.json();

      if (data.success) {
        setSearchResults(data.results);
        if (data.results.length === 0) {
          toast('검색 결과가 없습니다');
        }
      } else {
        toast.error('검색에 실패했습니다');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('검색 중 오류가 발생했습니다');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result: any) => {
    setWaveData(prev => ({ ...prev, youtubeUrl: result.youtubeUrl }));
    setSearchMode(false);
    setSearchQuery('');
    setSearchResults([]);
    toast.success('음악이 선택되었습니다');
  };

  const handleSubmit = () => {
    try {
      onSubmit(waveData);
      toast.success('웨이브가 발행되었습니다');
      onClose();
      setWaveData({
        track: null,
        comment: '',
        moodEmoji: '',
        moodText: '',
        youtubeUrl: '',
      });
    } catch (e) {
      toast.error('발행 중 오류가 발생했습니다');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 sk4-modal-backdrop" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-30"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-sk4-white rounded-t-lg shadow-lg border-t border-sk4-gray max-h-[90vh] overflow-hidden flex flex-col sk4-modal-slide-up"
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
        onDrop={(e) => {
          e.preventDefault();
          const text = e.dataTransfer.getData('text') || '';
          if (text) setWaveData(prev => ({ ...prev, youtubeUrl: text }));
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-sk4-md border-b border-sk4-gray">
          <h2 className="sk4-text-lg font-medium text-sk4-charcoal">지금 듣는 중</h2>
          <button onClick={onClose} className="p-sk4-sm hover:bg-sk4-light-gray rounded transition-all duration-200">
            <X className="w-5 h-5 text-sk4-dark-gray" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
          {/* Music Detection */}
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-sk4-orange bg-opacity-10 rounded-full mx-auto flex items-center justify-center">
                <Music className="w-8 h-8 text-sk4-orange" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">음악 추가하기</h3>
              <p className="text-sm text-gray-600">YouTube에서 검색하거나 링크를 입력하세요</p>
            </div>

            {/* Mode Toggle */}
            <div className="flex gap-2 p-1 bg-sk4-light-gray rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setSearchMode(false);
                  setTimeout(() => urlInputRef.current?.focus(), 50);
                }}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  !searchMode
                    ? 'bg-white text-sk4-orange shadow-sk4-soft'
                    : 'text-sk4-dark-gray hover:text-sk4-charcoal'
                }`}
              >
                <LinkIcon className="w-4 h-4 inline mr-2" />
                링크 입력
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchMode(true);
                  setTimeout(() => searchInputRef.current?.focus(), 50);
                }}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  searchMode
                    ? 'bg-white text-sk4-orange shadow-sk4-soft'
                    : 'text-sk4-dark-gray hover:text-sk4-charcoal'
                }`}
              >
                <Search className="w-4 h-4 inline mr-2" />
                YouTube 검색
              </button>
            </div>

            {/* Link Input Mode */}
            {!searchMode && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-1 h-6 bg-sk4-orange rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900">YouTube 링크</span>
                </div>
                <input
                  type="url"
                  placeholder="YouTube 링크를 붙여넣어 주세요"
                  value={waveData.youtubeUrl}
                  onChange={(e) => setWaveData(prev => ({ ...prev, youtubeUrl: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  ref={urlInputRef}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sk4-orange"
                />

                {/* Quick actions */}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handlePasteFromClipboard}
                    className="inline-flex items-center space-x-2 px-3 py-2 rounded-lg border border-sk4-gray text-sm text-sk4-charcoal hover:bg-sk4-light-gray"
                  >
                    <ClipboardPaste className="w-4 h-4" />
                    <span>붙여넣기</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleUseCurrentTrack}
                    disabled={!initialTrack}
                    className="inline-flex items-center space-x-2 px-3 py-2 rounded-lg border border-sk4-gray text-sm text-sk4-charcoal disabled:opacity-50 disabled:cursor-not-allowed hover:bg-sk4-light-gray"
                  >
                    <LinkIcon className="w-4 h-4" />
                    <span>현재 트랙</span>
                  </button>
                </div>
              </div>
            )}

            {/* Search Mode */}
            {searchMode && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-1 h-6 bg-sk4-orange rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900">YouTube 검색</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="노래 제목, 아티스트 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearch();
                      }
                    }}
                    ref={searchInputRef}
                    className="flex-1 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sk4-orange"
                  />
                  <button
                    type="button"
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="px-4 py-3 bg-sk4-orange text-white rounded-lg hover:bg-sk4-orange-dark transition-colors disabled:opacity-50"
                  >
                    {isSearching ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Search className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="max-h-80 overflow-y-auto space-y-2 border border-sk4-gray rounded-lg p-2">
                    {searchResults.map((result, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSelectSearchResult(result)}
                        className="w-full flex items-center space-x-3 p-2 hover:bg-sk4-light-gray rounded-lg transition-colors text-left"
                      >
                        <img
                          src={result.thumbnailUrl}
                          alt={result.title}
                          className="w-20 h-14 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-sk4-charcoal truncate">
                            {result.title}
                          </p>
                          <p className="text-xs text-sk4-dark-gray truncate">
                            {result.artist}
                          </p>
                        </div>
                        <Music className="w-5 h-5 text-sk4-orange flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {waveData.youtubeUrl && (
              <div className={`rounded-lg p-3 border ${parseYouTubeId(waveData.youtubeUrl) ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${parseYouTubeId(waveData.youtubeUrl) ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <p className={`text-sm ${parseYouTubeId(waveData.youtubeUrl) ? 'text-green-700' : 'text-red-700'}`}>{parseYouTubeId(waveData.youtubeUrl) ? 'YouTube 링크가 유효합니다' : '유효하지 않은 YouTube 링크입니다'}</p>
                </div>
                {parseYouTubeId(waveData.youtubeUrl) && (
                  <div className="mt-3 flex items-center space-x-3">
                    <img className="w-16 h-12 rounded" src={`https://img.youtube.com/vi/${parseYouTubeId(waveData.youtubeUrl)}/mqdefault.jpg`} alt="preview" />
                    <span className="text-xs text-gray-600">썸네일 미리보기</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">이 음악에 대한 생각 (선택사항)</label>
            <textarea
              placeholder="이 음악에 대한 생각을 들려주세요..."
              value={waveData.comment}
              onChange={(e) => setWaveData(prev => ({ ...prev, comment: e.target.value }))}
              maxLength={100}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>이모지와 해시태그 사용 가능</span>
              <span>{waveData.comment.length}/100</span>
            </div>
          </div>

          {/* Mood */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">지금의 무드 (선택사항)</label>
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
              {moodOptions.map((mood, index) => (
                <button
                  key={index}
                  onClick={() => handleMoodSelect(mood)}
                  className={`flex flex-col items-center space-y-1 p-3 rounded-lg border transition-all ${
                    waveData.moodEmoji === mood.emoji
                      ? 'border-sk4-orange bg-sk4-orange/10'
                      : 'border-sk4-gray hover:border-sk4-medium-gray'
                  }`}
                >
                  <span className="text-2xl">{mood.emoji}</span>
                  <span className="text-xs font-medium text-sk4-charcoal">{mood.text}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-sk4-gray">
          <div className="space-y-3">
            <button
              onClick={handleSubmit}
              className="w-full btn-primary flex items-center justify-center space-x-2"
            >
              <Send className="w-5 h-5" />
              <span>웨이브 발행하기</span>
            </button>
            <p className="text-xs text-gray-500 text-center">
              YouTube 링크나 음악 정보가 없어도 웨이브를 발행할 수 있습니다
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
