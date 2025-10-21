'use client';

import { useState } from 'react';
import { X, Music, Send } from 'lucide-react';
import { StationTrack } from '@/services/stationService';
import toast from 'react-hot-toast';

interface TrackToWaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: StationTrack | null;
  onSubmit: (waveData: {
    track: any;
    comment: string;
    moodEmoji: string;
    moodText: string;
  }) => Promise<void>;
}

const moodOptions = [
  { emoji: '🔥', text: '에너지' },
  { emoji: '😌', text: '휴식' },
  { emoji: '💪', text: '운동' },
  { emoji: '📚', text: '집중' },
  { emoji: '😭', text: '슬픔' },
  { emoji: '❤️', text: '사랑' },
];

export default function TrackToWaveModal({ isOpen, onClose, track, onSubmit }: TrackToWaveModalProps) {
  const [comment, setComment] = useState('');
  const [selectedMood, setSelectedMood] = useState<typeof moodOptions[0] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!track) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        track: {
          id: track.id,
          title: track.title,
          artist: track.artist,
          externalId: track.id,
          thumbnailUrl: track.thumbnail_url,
          duration: track.duration || 0,
        },
        comment: comment.trim(),
        moodEmoji: selectedMood?.emoji || '',
        moodText: selectedMood?.text || '',
      });

      toast.success('Wave가 생성되었습니다!');
      setComment('');
      setSelectedMood(null);
      onClose();
    } catch (error) {
      console.error('Failed to create wave:', error);
      toast.error('Wave 생성에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !track) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="absolute bottom-0 left-0 right-0 lg:inset-0 lg:flex lg:items-center lg:justify-center">
        <div className="bg-sk4-white rounded-t-xl lg:rounded-xl shadow-2xl max-h-[85vh] lg:max-h-[600px] w-full lg:max-w-2xl overflow-hidden flex flex-col animate-slide-up relative">
          
          {/* Header */}
          <div className="flex items-center justify-between p-sk4-lg border-b border-sk4-gray bg-gradient-to-r from-sk4-orange/10 to-transparent">
            <div className="flex items-center space-x-sk4-sm">
              <div className="w-10 h-10 bg-gradient-to-br from-sk4-orange to-sk4-orange-light rounded-lg flex items-center justify-center shadow-sk4-soft">
                <Music className="w-5 h-5 text-white" />
              </div>
              <h2 className="sk4-spotify-title">Wave로 공유하기</h2>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-sk4-light-gray hover:bg-sk4-gray flex items-center justify-center transition-all duration-200"
            >
              <X className="w-5 h-5 text-sk4-dark-gray" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-sk4-lg space-y-sk4-lg">
            
            {/* Track Preview */}
            <div className="sk4-spotify-card p-sk4-md">
              <div className="flex items-center space-x-sk4-md">
                <img
                  src={track.thumbnail_url || '/placeholder.png'}
                  alt={track.title}
                  className="w-16 h-16 rounded-lg object-cover shadow-sk4-soft"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="sk4-spotify-subtitle font-semibold truncate">{track.title}</h3>
                  <p className="sk4-spotify-caption truncate">{track.artist}</p>
                  {track.duration && (
                    <p className="sk4-spotify-caption text-sk4-orange mt-1">
                      {Math.floor(track.duration / 60)}:{String(track.duration % 60).padStart(2, '0')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Comment Input */}
            <div>
              <label className="block sk4-spotify-subtitle font-medium mb-sk4-sm">
                코멘트 (선택)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="이 곡에 대한 생각을 공유해보세요..."
                className="w-full p-sk4-md border border-sk4-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-sk4-orange sk4-spotify-subtitle bg-sk4-white resize-none"
                rows={3}
                maxLength={200}
              />
              <div className="text-right mt-1">
                <span className="sk4-spotify-caption text-sk4-dark-gray">
                  {comment.length}/200
                </span>
              </div>
            </div>

            {/* Mood Selection */}
            <div>
              <label className="block sk4-spotify-subtitle font-medium mb-sk4-sm">
                무드 선택 (선택)
              </label>
              <div className="grid grid-cols-3 gap-sk4-sm">
                {moodOptions.map((mood) => (
                  <button
                    key={mood.text}
                    onClick={() => setSelectedMood(selectedMood?.text === mood.text ? null : mood)}
                    className={`p-sk4-md rounded-lg border-2 transition-all duration-300 ${
                      selectedMood?.text === mood.text
                        ? 'border-sk4-orange bg-sk4-orange/10 shadow-sk4-soft'
                        : 'border-sk4-gray hover:border-sk4-orange/50 hover:bg-sk4-light-gray'
                    }`}
                  >
                    <div className="text-2xl mb-1">{mood.emoji}</div>
                    <div className="sk4-spotify-caption font-medium">{mood.text}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-sk4-lg border-t border-sk4-gray bg-sk4-off-white">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full sk4-spotify-btn disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  생성 중...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Wave 만들기
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



