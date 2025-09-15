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
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-30"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-sk4-white rounded-t-lg shadow-lg border-t border-sk4-gray max-h-[80vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-sk4-md border-b border-sk4-gray">
          <div className="flex items-center space-x-sk4-sm">
            <h2 className="sk4-text-lg font-medium text-sk4-charcoal">댓글</h2>
            <span className="sk4-text-sm text-sk4-dark-gray">({comments.length})</span>
          </div>
          <button onClick={onClose} className="p-sk4-sm hover:bg-sk4-light-gray rounded transition-all duration-200">
            <X className="w-5 h-5 text-sk4-dark-gray" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-sk4-md space-y-sk4-md">
          {comments.length === 0 ? (
            <div className="text-center py-sk4-xl">
              <div className="w-16 h-16 bg-sk4-light-gray rounded-full mx-auto flex items-center justify-center mb-sk4-md">
                <span className="text-2xl">💬</span>
              </div>
              <p className="sk4-text-sm text-sk4-dark-gray">아직 댓글이 없습니다</p>
              <p className="sk4-text-xs text-sk4-dark-gray mt-sk4-sm">첫 번째 댓글을 남겨보세요!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex space-x-sk4-sm">
                <img
                  src={comment.user.profileImage || '/default-avatar.png'}
                  alt={comment.user.nickname}
                  className="w-8 h-8 rounded-full flex-shrink-0 border border-sk4-gray"
                />
                <div className="flex-1 space-y-sk4-sm">
                  <div className="flex items-center space-x-sk4-sm">
                    <span className="sk4-text-sm font-medium text-sk4-charcoal">{comment.user.nickname}</span>
                    <span className="sk4-text-xs text-sk4-dark-gray">•</span>
                    <span className="sk4-text-xs text-sk4-dark-gray">{formatTimeAgo(comment.timestamp)}</span>
                  </div>
                  <p className="sk4-text-sm text-sk4-charcoal leading-relaxed">{comment.content}</p>
                  <div className="flex items-center space-x-sk4-md">
                    <button
                      onClick={() => onLikeComment(comment.id)}
                      className={`flex items-center space-x-1 sk4-text-xs transition-all ${
                        comment.isLiked ? 'text-sk4-orange' : 'text-sk4-dark-gray hover:text-sk4-orange'
                      }`}
                    >
                      <Heart className={`w-3 h-3 ${comment.isLiked ? 'fill-current' : ''}`} />
                      <span>{comment.likes}</span>
                    </button>
                    <button className="sk4-text-xs text-sk4-dark-gray hover:text-sk4-charcoal">
                      답글
                    </button>
                  </div>
                </div>
                <button className="text-sk4-dark-gray hover:text-sk4-charcoal">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Comment Input */}
        <div className="p-sk4-md border-t border-sk4-gray bg-sk4-off-white">
          <div className="flex items-end space-x-sk4-sm">
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="댓글을 입력하세요..."
                maxLength={100}
                className="w-full p-sk4-sm border border-sk4-gray rounded bg-sk4-white focus:outline-none focus:ring-2 focus:ring-sk4-orange resize-none min-h-[40px] max-h-[120px] sk4-text-sm"
                rows={1}
              />
              <div className="flex justify-between sk4-text-xs text-sk4-dark-gray mt-sk4-sm">
                <span>이모지와 해시태그 사용 가능</span>
                <span>{newComment.length}/100</span>
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!newComment.trim()}
              className="w-10 h-10 bg-sk4-orange text-sk4-white rounded flex items-center justify-center disabled:bg-sk4-light-gray disabled:cursor-not-allowed hover:bg-opacity-90 transition-all duration-200"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
