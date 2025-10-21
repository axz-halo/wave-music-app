

'use client';

import { useEffect, useState } from 'react';
import { X, Send, Trash2 } from 'lucide-react';
import supabase from '@/lib/supabaseClient';
import { ensureSignedIn, getCurrentSession } from '@/lib/authSupa';
import { AnalyticsService } from '@/services/analyticsService';
import toast from 'react-hot-toast';

interface CommentDoc {
  id: string;
  wave_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_nickname?: string;
  user_image?: string;
}

interface CommentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  waveId: string;
  onAfterSubmit?: () => void;
}

export default function CommentSheet({ isOpen, onClose, waveId, onAfterSubmit }: CommentSheetProps) {
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<CommentDoc[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
    if (diffInSeconds < 60) return '방금 전';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
    return `${Math.floor(diffInSeconds / 86400)}일 전`;
  };

  // Get current user ID
  useEffect(() => {
    const getUserId = async () => {
      const user = await getCurrentSession();
      setCurrentUserId(user?.id || null);
    };
    getUserId();
  }, []);

  useEffect(() => {
    if (!isOpen || !waveId || !supabase) return;
    let isCancelled = false;
    const load = async () => {
      const { data, error } = await supabase!
        .from('wave_comments')
        .select('*')
        .eq('wave_id', waveId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Failed to load comments:', error);
        return;
      }
      
      if (!isCancelled && data) {
        // 각 댓글의 사용자 정보를 별도로 가져오기
        const commentsWithUser = await Promise.all(
          data.map(async (comment: any) => {
            const { data: profile } = await supabase!
              .from('profiles')
              .select('nickname, profile_image')
              .eq('id', comment.user_id)
              .single();
            
            return {
              ...comment,
              user_nickname: profile?.nickname || '사용자',
              user_image: profile?.profile_image || null,
            };
          })
        );
        setComments(commentsWithUser);
      }
    };
    load();
    // realtime subscribe
    const channel = (supabase as any)
      .channel(`comments-wave-${waveId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wave_comments', filter: `wave_id=eq.${waveId}` }, load)
      .subscribe();
    return () => {
      isCancelled = true;
      if (supabase) {
        try { (supabase as any).removeChannel(channel); } catch {}
      }
    };
  }, [isOpen, waveId]);

  const handleSubmit = async () => {
    const content = newComment.trim();
    if (!content) return;
    const u = await ensureSignedIn();
    if (!u || !supabase) return;
    
    try {
      await supabase!.from('wave_comments').insert({
        wave_id: waveId,
        user_id: u.id,
        content,
      });
      
      // 로그 기록
      await AnalyticsService.logComment(u.id, 'wave', waveId);
      
      setNewComment('');
      onAfterSubmit?.();
      toast.success('댓글이 등록되었습니다! 💬');
    } catch (error) {
      console.error('Failed to submit comment:', error);
      toast.error('댓글 등록에 실패했습니다.');
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!supabase || !currentUserId) return;
    
    setDeletingCommentId(commentId);
    try {
      const { error } = await supabase
        .from('wave_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', currentUserId); // 본인 댓글만 삭제 가능
      
      if (error) throw error;
      
      toast.success('댓글이 삭제되었습니다.');
    } catch (error) {
      console.error('Failed to delete comment:', error);
      toast.error('댓글 삭제에 실패했습니다.');
    } finally {
      setDeletingCommentId(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 sk4-modal-backdrop">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Bottom Sheet - Instagram/Threads Style */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col sk4-modal-slide-up overflow-hidden">
        {/* Header - Sleek */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-200/80">
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-semibold text-gray-900">댓글</h2>
            <div className="flex items-center justify-center min-w-[24px] h-5 px-2 bg-gray-100 rounded-full">
              <span className="text-xs font-medium text-gray-600">{comments.length}</span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Comments List - Clean Scroll */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">💬</span>
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">아직 댓글이 없어요</p>
              <p className="text-xs text-gray-500">첫 번째 댓글을 남겨보세요!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div 
                  key={comment.id} 
                  className="flex gap-3 group animate-sk4-fade-in"
                >
                  {/* Avatar */}
                  <img
                    src={comment.user_image || '/default-avatar.png'}
                    alt={comment.user_nickname}
                    className="w-9 h-9 rounded-full flex-shrink-0 object-cover ring-2 ring-white shadow-sm"
                  />
                  
                  {/* Comment Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-900 truncate">
                        {comment.user_nickname}
                      </span>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {formatTimeAgo(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed break-words">
                      {comment.content}
                    </p>
                  </div>
                  
                  {/* Delete Button - Show only for own comments */}
                  {currentUserId === comment.user_id && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      disabled={deletingCommentId === comment.id}
                      className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      title="댓글 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comment Input - Rounded Instagram/Threads Style */}
        <div className="px-5 py-3 bg-white border-t border-gray-200/80">
          <div className="flex items-end gap-3">
            {/* Input Container */}
            <div className="flex-1 relative">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="댓글 달기..."
                maxLength={500}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full resize-none text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sk4-orange focus:border-transparent focus:bg-white transition-all duration-200 min-h-[40px] max-h-[100px]"
                rows={1}
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#e5e7eb transparent'
                }}
              />
              {/* Character Count */}
              {newComment.length > 0 && (
                <div className="absolute -bottom-5 right-2">
                  <span className={`text-xs ${newComment.length > 450 ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                    {newComment.length}/500
                  </span>
                </div>
              )}
            </div>
            
            {/* Send Button */}
            <button
              onClick={handleSubmit}
              disabled={!newComment.trim()}
              className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-sk4-orange to-sk4-orange-light text-white rounded-full flex items-center justify-center disabled:from-gray-200 disabled:to-gray-200 disabled:cursor-not-allowed hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 disabled:hover:scale-100"
            >
              <Send className="w-4.5 h-4.5" fill="currentColor" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
