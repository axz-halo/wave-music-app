'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Music, Link as LinkIcon, Send, ClipboardPaste, SkipForward } from 'lucide-react';
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

  const urlInputRef = useRef<HTMLInputElement | null>(null);

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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end lg:items-center lg:justify-center" role="dialog" aria-modal="true">
      <div 
        className="bg-white rounded-t-3xl lg:rounded-3xl w-full lg:w-full lg:max-w-2xl max-h-[80vh] lg:max-h-[90vh] overflow-hidden flex flex-col"
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
        onDrop={(e) => {
          e.preventDefault();
          const text = e.dataTransfer.getData('text') || '';
          if (text) setWaveData(prev => ({ ...prev, youtubeUrl: text }));
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">지금 듣는 중</h2>
          <button onClick={onClose} className="p-2">
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
          {/* Music Detection */}
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-primary-100 rounded-full mx-auto flex items-center justify-center shadow-tactile">
                <Music className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">음악 추가하기</h3>
              <p className="text-sm text-gray-600">YouTube 링크를 입력하거나 건너뛸 수 있습니다</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-1 h-6 bg-primary-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900">YouTube 링크 (선택사항)</span>
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
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500">또는 음악 앱에서 직접 공유하기</p>

              {/* Quick actions */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="inline-flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <ClipboardPaste className="w-4 h-4" />
                  <span>클립보드에서 붙여넣기</span>
                </button>
                <button
                  type="button"
                  onClick={handleUseCurrentTrack}
                  disabled={!initialTrack}
                  className="inline-flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <LinkIcon className="w-4 h-4" />
                  <span>현재 트랙 사용</span>
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="inline-flex items-center space-x-2 px-3 py-2 rounded-medium bg-primary-50 text-primary-700 hover:bg-primary-100 text-sm shadow-tactile transition-all duration-200"
                >
                  <SkipForward className="w-4 h-4" />
                  <span>건너뛰고 발행</span>
                </button>
              </div>
            </div>

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
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl">{mood.emoji}</span>
                  <span className="text-xs font-medium text-gray-700">{mood.text}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="space-y-3">
            <button
              onClick={handleSubmit}
              className="w-full py-3 px-4 bg-primary-500 text-white rounded-medium font-medium hover:bg-primary-600 transition-all duration-200 flex items-center justify-center space-x-2 shadow-tactile"
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
