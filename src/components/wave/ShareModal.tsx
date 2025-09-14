'use client';

import { useState } from 'react';
import { X, Copy, MessageCircle, Mail, ExternalLink, Download } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  wave: {
    track: {
      title: string;
      artist: string;
      thumbnailUrl: string;
    };
    comment: string;
    moodEmoji: string;
    moodText: string;
  };
}

const shareOptions = [
  {
    id: 'copy',
    title: '링크 복사',
    icon: Copy,
    color: 'bg-gray-100 text-gray-700',
  },
  {
    id: 'kakao',
    title: '카카오톡',
    icon: MessageCircle,
    color: 'bg-yellow-400 text-white',
  },
  {
    id: 'instagram',
    title: '인스타그램',
    icon: ExternalLink,
    color: 'bg-pink-500 text-white',
  },
  {
    id: 'twitter',
    title: '트위터',
    icon: ExternalLink,
    color: 'bg-blue-400 text-white',
  },
  {
    id: 'email',
    title: '이메일',
    icon: Mail,
    color: 'bg-blue-600 text-white',
  },
  {
    id: 'download',
    title: '이미지 저장',
    icon: Download,
    color: 'bg-green-500 text-white',
  },
];

export default function ShareModal({ isOpen, onClose, wave }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async (optionId: string) => {
    const shareUrl = `${window.location.origin}/wave/123`; // 실제 웨이브 ID로 교체
    const shareText = `${wave.track.title} - ${wave.track.artist} ${wave.comment ? `"${wave.comment}"` : ''} ${wave.moodEmoji} ${wave.moodText}`;

    switch (optionId) {
      case 'copy':
        try {
          await navigator.clipboard.writeText(shareUrl);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (err) {
          console.error('Failed to copy:', err);
        }
        break;
      
      case 'kakao':
        // 카카오톡 공유 로직
        console.log('Share to KakaoTalk');
        break;
      
      case 'instagram':
        // 인스타그램 공유 로직
        window.open(`https://instagram.com`);
        break;
      
      case 'twitter':
        // 트위터 공유 로직
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`);
        break;
      
      case 'email':
        // 이메일 공유 로직
        window.open(`mailto:?subject=${encodeURIComponent(`WAVE에서 음악 공유`)}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`);
        break;
      
      case 'download':
        // 이미지 다운로드 로직
        console.log('Download image');
        break;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end lg:items-center lg:justify-center">
      <div className="bg-white rounded-t-3xl lg:rounded-3xl w-full lg:w-full lg:max-w-2xl max-h-[70vh] lg:max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">공유하기</h2>
          <button onClick={onClose} className="p-2">
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Wave Preview */}
        <div className="p-4 border-b border-gray-200">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <img
                src={wave.track.thumbnailUrl}
                alt={wave.track.title}
                className="w-12 h-12 rounded-lg"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm">{wave.track.title}</h3>
                <p className="text-xs text-gray-600">{wave.track.artist}</p>
                {wave.comment && (
                  <p className="text-xs text-gray-700 mt-1">"{wave.comment}"</p>
                )}
                <div className="flex items-center space-x-1 mt-1">
                  <span className="text-sm">{wave.moodEmoji}</span>
                  <span className="text-xs text-gray-500">{wave.moodText}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Share Options */}
        <div className="p-4">
          <div className="grid grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {shareOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={() => handleShare(option.id)}
                  className={`flex flex-col items-center space-y-2 p-4 rounded-xl transition-all hover:scale-105 ${option.color}`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-xs font-medium text-center">{option.title}</span>
                </button>
              );
            })}
          </div>

          {copied && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm text-center">링크가 클립보드에 복사되었습니다!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-blue-700 text-xs text-center">
              친구들에게 WAVE를 소개하고 함께 음악을 공유해보세요! 🎵
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
