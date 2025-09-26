'use client';

import { useState } from 'react';
import { X, Send, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { parseYouTubeId, parseYouTubePlaylistId, parseYouTubeChannelId } from '@/lib/youtube';
import supabase from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function SmartUploadModal({ isOpen, onClose, onSuccess }: Props) {
  const [url, setUrl] = useState('');
  const [detectedType, setDetectedType] = useState<'video'|'playlist'|'channel'|'unknown'|null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const detectUrlType = (input: string): 'video'|'playlist'|'channel'|'unknown' => {
    if (!input.trim()) return 'unknown';
    
    const trimmed = input.trim();
    
    // 플레이리스트 감지
    if (parseYouTubePlaylistId(trimmed)) return 'playlist';
    
    // 채널 감지
    if (parseYouTubeChannelId(trimmed)) return 'channel';
    
    // 비디오 감지
    if (parseYouTubeId(trimmed)) return 'video';
    
    return 'unknown';
  };

  const getPreview = async (inputUrl: string, type: string) => {
    if (!inputUrl || type === 'unknown') {
      setPreview(null);
      return;
    }

    setLoading(true);
    try {
      let id: string | null = null;
      let apiType = type;
      
      if (type === 'playlist') {
        id = parseYouTubePlaylistId(inputUrl);
      } else if (type === 'channel') {
        id = parseYouTubeChannelId(inputUrl);
      } else if (type === 'video') {
        id = parseYouTubeId(inputUrl);
      }

      if (!id) {
        setPreview(null);
        return;
      }

      const response = await fetch(`/api/youtube/resolve?type=${apiType}&id=${id}`);
      const data = await response.json();
      
      if (data.ok) {
        setPreview({
          type,
          id,
          title: data.title,
          channelTitle: data.channelTitle || data.handle,
          thumbnails: data.thumbnails,
          duration: data.duration,
          itemCount: data.itemCount,
          subscriberCount: data.subscriberCount,
        });
      } else {
        setPreview(null);
      }
    } catch (error) {
      console.error('Preview error:', error);
      setPreview(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    const type = detectUrlType(newUrl);
    setDetectedType(type);
    getPreview(newUrl, type);
  };

  const handleUpload = async () => {
    if (!url || !detectedType || detectedType === 'unknown' || !preview) return;

    setProcessing(true);
    try {
      // Supabase 클라이언트 확인
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      // 현재 세션에서 JWT 토큰 가져오기
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/smart-upload', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ url, type: detectedType, preview })
      });

      const result = await response.json();
      
      if (result.success) {
        switch (result.type) {
          case 'video':
            toast.success('비디오가 웨이브로 추가되었습니다!');
            break;
          case 'playlist':
            toast.success(`플레이리스트가 처리되었습니다! (${result.tracksAdded}곡 추가)`);
            if (result.channelAdded) {
              toast.success('채널 정보도 함께 저장되었습니다!');
            }
            break;
          case 'channel':
            toast.success('채널이 구독되었습니다!');
            break;
        }
        
        setUrl('');
        setDetectedType(null);
        setPreview(null);
        onSuccess?.();
        onClose();
      } else {
        throw new Error(result.error || '업로드 실패');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(`업로드 실패: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'video': return '🎵 비디오';
      case 'playlist': return '📋 플레이리스트';
      case 'channel': return '📺 채널';
      default: return '❓ 알 수 없음';
    }
  };

  const getActionLabel = (type: string) => {
    switch (type) {
      case 'video': return '웨이브로 추가';
      case 'playlist': return '플레이리스트 업로드';
      case 'channel': return '채널 구독';
      default: return '업로드';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-sk4-white rounded-t-lg border-t border-sk4-gray p-sk4-md max-h-[85vh] animate-slide-up">
        <div className="flex items-center justify-between mb-sk4-sm">
          <h3 className="sk4-text-lg font-medium text-sk4-charcoal">Smart Upload</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-sk4-dark-gray"/></button>
        </div>

        <div className="space-y-sk4-md">
          {/* URL 입력 */}
          <div>
            <input 
              value={url} 
              onChange={(e) => handleUrlChange(e.target.value)} 
              placeholder="YouTube 링크를 붙여넣으세요 (비디오, 플레이리스트, 채널 모두 지원)" 
              className="w-full p-sk4-md border border-sk4-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-sk4-orange sk4-text-sm" 
            />
            
            {/* 타입 감지 표시 */}
            {detectedType && (
              <div className="mt-sk4-sm flex items-center space-x-sk4-sm">
                {detectedType === 'unknown' ? (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                <span className="sk4-text-sm text-sk4-dark-gray">
                  {getTypeLabel(detectedType)} 감지됨
                </span>
              </div>
            )}
          </div>

          {/* 미리보기 */}
          {loading && (
            <div className="flex items-center justify-center py-sk4-md">
              <Loader className="w-5 h-5 animate-spin text-sk4-orange" />
              <span className="ml-sk4-sm sk4-text-sm text-sk4-dark-gray">정보를 불러오는 중...</span>
            </div>
          )}

          {preview && !loading && (
            <div className="p-sk4-md border border-sk4-gray rounded-lg bg-sk4-light-gray">
              <div className="flex items-start space-x-sk4-md">
                {preview.thumbnails && (
                  <img 
                    src={preview.thumbnails.medium?.url || preview.thumbnails.default?.url} 
                    alt={preview.title}
                    className={`rounded ${preview.type === 'channel' ? 'w-12 h-12' : preview.type === 'video' ? 'w-16 h-12' : 'w-10 h-10'}`}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="sk4-text-sm font-medium text-sk4-charcoal truncate">{preview.title}</h4>
                  <p className="sk4-text-xs text-sk4-dark-gray truncate">{preview.channelTitle}</p>
                  
                  {/* 추가 정보 */}
                  {preview.type === 'video' && preview.duration && (
                    <p className="sk4-text-xs text-sk4-dark-gray">
                      {Math.floor(preview.duration / 60)}:{String(preview.duration % 60).padStart(2, '0')}
                    </p>
                  )}
                  
                  {preview.type === 'playlist' && preview.itemCount && (
                    <p className="sk4-text-xs text-sk4-dark-gray">{preview.itemCount}곡</p>
                  )}
                  
                  {preview.type === 'channel' && preview.subscriberCount && (
                    <p className="sk4-text-xs text-sk4-dark-gray">
                      {parseInt(preview.subscriberCount).toLocaleString()} 구독자
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 업로드 버튼 */}
          <div className="flex justify-end">
            <button 
              onClick={handleUpload}
              disabled={!url || !detectedType || detectedType === 'unknown' || !preview || processing}
              className="px-sk4-lg py-sk4-md bg-sk4-orange text-sk4-white rounded-lg disabled:bg-sk4-gray disabled:cursor-not-allowed flex items-center space-x-sk4-sm transition-all duration-200"
            >
              {processing ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>처리 중...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{getActionLabel(detectedType || '')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}