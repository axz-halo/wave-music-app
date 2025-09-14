'use client';

import { Music, Users, Search, Plus } from 'lucide-react';

interface EmptyStateProps {
  type: 'no-waves' | 'no-friends' | 'no-results' | 'no-playlists';
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export default function EmptyState({ 
  type, 
  title, 
  description, 
  actionText, 
  onAction 
}: EmptyStateProps) {
  const getEmptyStateContent = () => {
    switch (type) {
      case 'no-waves':
        return {
          icon: Music,
          iconColor: 'text-blue-500',
          iconBg: 'bg-blue-100',
          title: title || '아직 웨이브가 없어요',
          description: description || '첫 번째 웨이브를 만들어보세요!',
          actionText: actionText || '웨이브 만들기',
          emoji: '🎵'
        };
      
      case 'no-friends':
        return {
          icon: Users,
          iconColor: 'text-green-500',
          iconBg: 'bg-green-100',
          title: title || '친구를 찾아보세요',
          description: description || '친구들과 음악을 공유해보세요',
          actionText: actionText || '친구 찾기',
          emoji: '👥'
        };
      
      case 'no-results':
        return {
          icon: Search,
          iconColor: 'text-gray-500',
          iconBg: 'bg-gray-100',
          title: title || '검색 결과가 없어요',
          description: description || '다른 검색어를 시도해보세요',
          actionText: actionText || '다시 검색',
          emoji: '🔍'
        };
      
      case 'no-playlists':
        return {
          icon: Music,
          iconColor: 'text-purple-500',
          iconBg: 'bg-purple-100',
          title: title || '플레이리스트가 없어요',
          description: description || '첫 번째 플레이리스트를 만들어보세요',
          actionText: actionText || '플레이리스트 만들기',
          emoji: '📝'
        };
      
      default:
        return {
          icon: Music,
          iconColor: 'text-gray-500',
          iconBg: 'bg-gray-100',
          title: '앗, 여기는 비어있네요',
          description: '곧 새로운 콘텐츠가 나타날 거예요',
          actionText: '',
          emoji: '🤔'
        };
    }
  };

  const content = getEmptyStateContent();
  const Icon = content.icon;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {/* Icon */}
      <div className={`w-20 h-20 ${content.iconBg} rounded-full flex items-center justify-center mb-6`}>
        <Icon className={`w-10 h-10 ${content.iconColor}`} />
      </div>

      {/* Emoji */}
      <div className="text-4xl mb-4">{content.emoji}</div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {content.title}
      </h3>

      {/* Description */}
      <p className="text-gray-600 text-sm leading-relaxed mb-6 max-w-sm">
        {content.description}
      </p>

      {/* Action Button */}
      {content.actionText && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all shadow-sm"
        >
          {content.actionText}
        </button>
      )}

      {/* Additional Info */}
      {type === 'no-waves' && (
        <div className="mt-8 p-4 bg-blue-50 rounded-lg max-w-sm">
          <div className="flex items-center space-x-2 mb-2">
            <Plus className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">웨이브 만들기 팁</span>
          </div>
          <p className="text-xs text-blue-700 leading-relaxed">
            지금 듣고 있는 음악이나 마음에 드는 곡을 친구들과 공유해보세요. 
            무드와 코멘트로 당신의 감정을 표현할 수 있어요.
          </p>
        </div>
      )}

      {type === 'no-friends' && (
        <div className="mt-8 p-4 bg-green-50 rounded-lg max-w-sm">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-900">친구 찾기</span>
          </div>
          <p className="text-xs text-green-700 leading-relaxed">
            연락처에서 친구를 찾거나, 관심사가 비슷한 사용자를 팔로우해보세요. 
            함께 음악을 공유하며 더 즐거운 시간을 보낼 수 있어요.
          </p>
        </div>
      )}

      {type === 'no-results' && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg max-w-sm">
          <div className="flex items-center space-x-2 mb-2">
            <Search className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">검색 팁</span>
          </div>
          <p className="text-xs text-gray-700 leading-relaxed">
            • 곡명이나 아티스트명으로 검색해보세요<br/>
            • 장르나 무드로 검색해보세요<br/>
            • 더 간단한 키워드를 사용해보세요
          </p>
        </div>
      )}

      {type === 'no-playlists' && (
        <div className="mt-8 p-4 bg-purple-50 rounded-lg max-w-sm">
          <div className="flex items-center space-x-2 mb-2">
            <Music className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">플레이리스트 만들기</span>
          </div>
          <p className="text-xs text-purple-700 leading-relaxed">
            좋아하는 곡들을 모아서 나만의 플레이리스트를 만들어보세요. 
            친구들과 공유하거나 나중에 다시 들어볼 수 있어요.
          </p>
        </div>
      )}
    </div>
  );
}
