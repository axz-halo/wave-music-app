'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/layout/Navigation';
import toast from 'react-hot-toast';
import supabase from '@/lib/supabaseClient';
import { ensureSignedIn } from '@/lib/authSupa';
import { parseYouTubeId } from '@/lib/youtube';

export default function StationCreatePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState<'manual'|'youtube'>('youtube');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);
  const [youtubeMetadata, setYoutubeMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // YouTube 메타데이터 자동 가져오기
  useEffect(() => {
    const fetchMetadata = async () => {
      const videoId = parseYouTubeId(youtubeUrl);
      if (!videoId) {
        setYoutubeMetadata(null);
        return;
      }
      
      try {
        const res = await fetch(`/api/youtube/resolve?type=video&id=${videoId}`);
        const meta = await res.json();
        if (meta?.ok) {
          setYoutubeMetadata(meta);
          // 제목이 비어있으면 YouTube 제목으로 자동 채우기
          if (!title.trim()) {
            setTitle(meta.title || '');
          }
          // 썸네일 미리보기 설정
          if (!thumbPreview) {
            setThumbPreview(meta.thumbnails?.high?.url || meta.thumbnails?.medium?.url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
          }
        }
      } catch (error) {
        console.error('Failed to fetch YouTube metadata:', error);
      }
    };

    if (youtubeUrl.trim()) {
      fetchMetadata();
    } else {
      setYoutubeMetadata(null);
    }
  }, [youtubeUrl, title, thumbPreview]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('제목을 입력해주세요');
      return;
    }
    
    const u = await ensureSignedIn();
    if (!u) return;
    
    setLoading(true);
    
    try {
      if (!supabase) throw new Error('Supabase not configured');
      
      let finalThumbUrl = thumbPreview;
      let trackTitle = null;
      let trackArtist = null;
      
      if (source === 'youtube' && youtubeUrl.trim()) {
        const videoId = parseYouTubeId(youtubeUrl);
        if (!videoId) {
          toast.error('유효한 YouTube 링크를 입력하세요');
          setLoading(false);
          return;
        }
        
        // YouTube 메타데이터 사용
        if (youtubeMetadata) {
          trackTitle = youtubeMetadata.title;
          trackArtist = youtubeMetadata.channelTitle;
          finalThumbUrl = youtubeMetadata.thumbnails?.high?.url || youtubeMetadata.thumbnails?.medium?.url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        }
        
        await supabase.from('stations').insert({
          user_id: u.id,
          title: title.trim(),
          description: description.trim() || null,
          track_external_id: videoId,
          track_platform: 'youtube',
          track_title: trackTitle,
          track_artist: trackArtist,
          thumb_url: finalThumbUrl,
        });
      } else {
        // 수동 생성
        await supabase.from('stations').insert({
          user_id: u.id,
          title: title.trim(),
          description: description.trim() || null,
          track_external_id: null,
          track_platform: null,
          track_title: null,
          track_artist: null,
          thumb_url: finalThumbUrl,
        });
      }
      
      toast.success('스테이션이 생성되었습니다');
      router.push('/station');
    } catch (e: any) {
      toast.error(e?.message || '생성 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sk4-off-white pb-20 lg:pb-0 lg:ml-56">
      <header className="hidden lg:block bg-sk4-white border-b border-sk4-gray px-6 py-4 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto">
          <h1 className="sk4-text-large-title">스테이션 만들기</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="bg-sk4-white border border-sk4-gray p-4">
          <div className="space-y-4">
            {/* 생성 방식 선택 */}
            <div className="flex items-center gap-3 text-sm">
              <label className={`px-3 py-1.5 rounded border cursor-pointer ${source==='manual'?'bg-sk4-orange/10 border-sk4-orange text-sk4-charcoal':'border-sk4-gray hover:border-sk4-medium-gray'}`}>
                <input type="radio" name="src" className="mr-2" checked={source==='manual'} onChange={()=>setSource('manual')} /> 수동 생성
              </label>
              <label className={`px-3 py-1.5 rounded border cursor-pointer ${source==='youtube'?'bg-sk4-orange/10 border-sk4-orange text-sk4-charcoal':'border-sk4-gray hover:border-sk4-medium-gray'}`}>
                <input type="radio" name="src" className="mr-2" checked={source==='youtube'} onChange={()=>setSource('youtube')} /> YouTube 음원 가져오기
              </label>
            </div>

            {/* 제목 입력 */}
            <div>
              <label className="block sk4-text-sm font-medium text-sk4-charcoal mb-2">스테이션 제목 *</label>
              <input 
                value={title} 
                onChange={(e)=>setTitle(e.target.value)} 
                className="w-full p-3 border border-sk4-gray rounded focus:outline-none focus:ring-2 focus:ring-sk4-orange sk4-text-sm" 
                placeholder="스테이션 제목을 입력하세요" 
                maxLength={50}
              />
              <p className="sk4-text-xs text-sk4-dark-gray mt-1">{title.length}/50</p>
            </div>

            {/* 설명 입력 */}
            <div>
              <label className="block sk4-text-sm font-medium text-sk4-charcoal mb-2">설명 (선택사항)</label>
              <textarea 
                value={description} 
                onChange={(e)=>setDescription(e.target.value)} 
                className="w-full p-3 border border-sk4-gray rounded focus:outline-none focus:ring-2 focus:ring-sk4-orange resize-none h-24 sk4-text-sm" 
                placeholder="스테이션에 대한 설명을 입력하세요" 
                maxLength={200}
              />
              <p className="sk4-text-xs text-sk4-dark-gray mt-1">{description.length}/200</p>
            </div>

            {/* YouTube URL 입력 */}
            {source==='youtube' && (
              <div>
                <label className="block sk4-text-sm font-medium text-sk4-charcoal mb-2">YouTube 음원 링크 *</label>
                <input 
                  value={youtubeUrl} 
                  onChange={(e)=>setYoutubeUrl(e.target.value)} 
                  className="w-full p-3 border border-sk4-gray rounded focus:outline-none focus:ring-2 focus:ring-sk4-orange sk4-text-sm" 
                  placeholder="https://www.youtube.com/watch?v=..." 
                />
                {youtubeMetadata && (
                  <div className="mt-2 p-3 bg-sk4-light-gray rounded border border-sk4-gray">
                    <p className="sk4-text-sm font-medium text-sk4-charcoal">자동 감지된 정보:</p>
                    <p className="sk4-text-sm text-sk4-dark-gray">제목: {youtubeMetadata.title}</p>
                    <p className="sk4-text-sm text-sk4-dark-gray">채널: {youtubeMetadata.channelTitle}</p>
                  </div>
                )}
              </div>
            )}

            {/* 썸네일 업로드 */}
            <div>
              <label className="block sk4-text-sm font-medium text-sk4-charcoal mb-2">썸네일 이미지 (선택사항)</label>
              <div className="flex items-center gap-3">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e)=>{ 
                    const f=e.target.files?.[0]; 
                    if (f) {
                      setThumbPreview(URL.createObjectURL(f)); 
                    }
                  }} 
                  className="sk4-text-sm file:mr-sk4-sm file:py-sk4-sm file:px-sk4-md file:rounded file:border-0 file:text-sk4-white file:bg-sk4-orange file:cursor-pointer hover:file:bg-opacity-90"
                />
                {thumbPreview && (
                  <div className="relative">
                    <img src={thumbPreview} className="w-20 h-20 rounded object-cover border border-sk4-gray" alt="preview"/>
                    <button 
                      onClick={() => setThumbPreview(null)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-sk4-charcoal text-sk4-white rounded-full flex items-center justify-center sk4-text-xs hover:bg-opacity-80"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
              <p className="sk4-text-xs text-sk4-dark-gray mt-1">이미지를 업로드하지 않으면 YouTube 썸네일이 사용됩니다</p>
            </div>

            {/* 생성 버튼 */}
            <button 
              onClick={handleSubmit} 
              disabled={loading || !title.trim() || (source === 'youtube' && !youtubeUrl.trim())}
              className="w-full py-3 rounded bg-sk4-orange text-sk4-white hover:bg-opacity-90 transition-all duration-200 disabled:bg-sk4-light-gray disabled:text-sk4-dark-gray disabled:cursor-not-allowed sk4-text-sm font-medium"
            >
              {loading ? '생성 중...' : '스테이션 만들기'}
            </button>
          </div>
        </div>
      </div>
      <Navigation onCreateWave={() => {}} />
    </div>
  );
}


