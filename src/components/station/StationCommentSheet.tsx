'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Send, Trash2 } from 'lucide-react';
import { StationService } from '@/services/stationService';
import toast from 'react-hot-toast';

interface StationCommentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  stationId: string;
  onAfterSubmit?: () => void;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user: {
    id: string;
    nickname: string;
    profileImage: string | null;
  };
}

export default function StationCommentSheet({ 
  isOpen, 
  onClose, 
  stationId,
  onAfterSubmit 
}: StationCommentSheetProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Get current user ID
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = (await import('@/lib/supabaseClient')).default;
        if (!supabase) return;
        const { data: { session } } = await supabase.auth.getSession();
        setCurrentUserId(session?.user?.id || null);
      } catch (error) {
        console.error('Failed to get user:', error);
      }
    };
    fetchUser();
  }, []);

  // Load comments
  const loadComments = useCallback(async () => {
    if (!stationId) return;
    
    setIsLoading(true);
    try {
      const data = await StationService.getComments(stationId);
      setComments(data);
    } catch (error) {
      console.error('Failed to load comments:', error);
      toast.error('댓글을 불러오는데 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  }, [stationId]);

  useEffect(() => {
    if (isOpen && stationId) {
      loadComments();
    }
  }, [isOpen, stationId, loadComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() || !currentUserId) return;

    setIsSubmitting(true);
    try {
      await StationService.addComment(stationId, currentUserId, newComment.trim());
      setNewComment('');
      await loadComments();
      toast.success('댓글이 작성되었습니다');
      onAfterSubmit?.();
    } catch (error) {
      console.error('Failed to submit comment:', error);
      toast.error('댓글 작성에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!currentUserId) return;
    
    try {
      await StationService.deleteComment(commentId, currentUserId);
      await loadComments();
      toast.success('댓글이 삭제되었습니다');
      onAfterSubmit?.();
    } catch (error) {
      console.error('Failed to delete comment:', error);
      toast.error('댓글 삭제에 실패했습니다');
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
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 sk4-fade-in"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-sk4-strong max-h-[80vh] flex flex-col sk4-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-sk4-lg border-b border-sk4-gray/20">
          <h2 className="sk4-spotify-title">댓글 {comments.length}개</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-sk4-light-gray transition-colors"
          >
            <X className="w-5 h-5 text-sk4-medium-gray" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-sk4-lg space-y-sk4-md">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sk4-orange"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12">
              <p className="sk4-spotify-subtitle text-sk4-medium-gray">
                첫 번째 댓글을 남겨보세요!
              </p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex space-x-sk4-sm group">
                <img
                  src={comment.user.profileImage || '/default-avatar.png'}
                  alt={comment.user.nickname}
                  className="w-8 h-8 rounded-full flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="sk4-spotify-subtitle font-semibold">
                      {comment.user.nickname}
                    </span>
                    <span className="sk4-spotify-caption text-sk4-medium-gray">
                      {formatTimeAgo(comment.created_at)}
                    </span>
                    {currentUserId === comment.user_id && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="ml-auto opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    )}
                  </div>
                  <p className="sk4-spotify-body text-sk4-charcoal break-words">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment Input */}
        <form onSubmit={handleSubmit} className="p-sk4-lg border-t border-sk4-gray/20">
          <div className="flex space-x-sk4-sm">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="댓글을 입력하세요..."
              className="flex-1 px-4 py-3 bg-sk4-light-gray rounded-full border-2 border-transparent focus:border-sk4-orange focus:outline-none transition-colors sk4-spotify-body"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="px-6 py-3 bg-sk4-orange text-white rounded-full font-semibold hover:bg-sk4-orange-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>전송</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

