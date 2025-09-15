'use client';

import { useState } from 'react';
import { X, Send, Heart, MoreHorizontal } from 'lucide-react';

interface Comment {
  id: string;
  user: {
    nickname: string;
    profileImage?: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  isLiked: boolean;
}

interface CommentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  waveId: string;
  comments: Comment[];
  onAddComment: (content: string) => void;
  onLikeComment: (commentId: string) => void;
}

export default function CommentSheet({ 
  isOpen, 
  onClose, 
  waveId, 
  comments, 
  onAddComment, 
  onLikeComment 
}: CommentSheetProps) {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = () => {
    if (newComment.trim()) {
      onAddComment(newComment.trim());
      setNewComment('');
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
    
    if (diffInSeconds < 60) return '방금 전';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
    return `${Math.floor(diffInSeconds / 86400)}일 전`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-cream-100 rounded-medium shadow-minimal border border-cream-200 w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-cream-200">
          <div className="flex items-center space-x-3">
            <h2 className="text-hierarchy-lg font-semibold text-beige-800">댓글</h2>
            <span className="text-sm text-beige-600">({comments.length})</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-cream-200 rounded-medium transition-all duration-150">
            <X className="w-5 h-5 text-beige-600" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-cream-200 rounded-full mx-auto flex items-center justify-center mb-4 shadow-minimal">
                <span className="text-2xl">💬</span>
              </div>
              <p className="text-beige-600 text-sm">아직 댓글이 없습니다</p>
              <p className="text-beige-500 text-xs mt-1">첫 번째 댓글을 남겨보세요!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3">
                <img
                  src={comment.user.profileImage || '/default-avatar.png'}
                  alt={comment.user.nickname}
                  className="w-8 h-8 rounded-full flex-shrink-0"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900 text-sm">{comment.user.nickname}</span>
                    <span className="text-xs text-gray-500">{formatTimeAgo(comment.timestamp)}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => onLikeComment(comment.id)}
                      className={`flex items-center space-x-1 text-xs transition-all ${
                        comment.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`w-3 h-3 ${comment.isLiked ? 'fill-current' : ''}`} />
                      <span>{comment.likes}</span>
                    </button>
                    <button className="text-xs text-gray-500 hover:text-gray-700">
                      답글
                    </button>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Comment Input */}
        <div className="p-6 border-t border-cream-200">
          <div className="flex items-end space-x-3">
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="댓글을 입력하세요..."
                maxLength={100}
                className="w-full p-3 border border-cream-200 rounded-medium bg-cream-50 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none min-h-[40px] max-h-[120px] shadow-minimal"
                rows={1}
              />
              <div className="flex justify-between text-xs text-beige-500 mt-1">
                <span>이모지와 해시태그 사용 가능</span>
                <span>{newComment.length}/100</span>
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!newComment.trim()}
              className="w-10 h-10 bg-primary-500 text-white rounded-medium flex items-center justify-center disabled:bg-beige-300 disabled:cursor-not-allowed hover:bg-primary-600 transition-all duration-150 shadow-minimal"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
