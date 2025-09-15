'use client';

import { useEffect, useState } from 'react';
import { X, Send } from 'lucide-react';
import { parseYouTubeId } from '@/lib/youtube';

interface RecommendTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (youtubeId: string, reason: string) => void;
}

export default function RecommendTrackModal({ isOpen, onClose, onSubmit }: RecommendTrackModalProps) {
  const [url, setUrl] = useState('');
  const [reason, setReason] = useState('');
  const [videoId, setVideoId] = useState<string | null>(null);

  useEffect(()=>{
    setVideoId(parseYouTubeId(url));
  }, [url]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const id = parseYouTubeId(url);
    if (!id) return;
    onSubmit(id, reason.trim());
    setUrl('');
    setReason('');
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      {/* Bottom Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-sk4-white rounded-t-lg border-t border-sk4-gray max-h-[90vh] overflow-y-auto">
        <div className="p-sk4-md space-y-sk4-md">
          <div className="text-center">
            <div className="w-10 h-1 bg-sk4-gray rounded mx-auto mb-sk4-sm" />
            <h3 className="sk4-text-lg font-medium text-sk4-charcoal">트랙 제출하기</h3>
            <p className="sk4-text-xs text-sk4-dark-gray">YouTube 링크 하나면 충분해요</p>
          </div>

          <div className="space-y-sk4-sm">
            <label className="sk4-text-sm text-sk4-charcoal">YouTube URL</label>
            <input value={url} onChange={(e)=>setUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="w-full p-sk4-sm border border-sk4-gray rounded focus:outline-none focus:ring-2 focus:ring-sk4-orange" />
          </div>

          <div className="space-y-sk4-sm">
            <label className="sk4-text-sm text-sk4-charcoal">추천 이유</label>
            <textarea value={reason} onChange={(e)=>setReason(e.target.value)} placeholder="왜 이 곡을 추천하나요? (20~200자)" maxLength={200} className="w-full p-sk4-sm border border-sk4-gray rounded h-24 focus:outline-none focus:ring-2 focus:ring-sk4-orange" />
            <div className="sk4-text-xs text-sk4-dark-gray text-right">{reason.length}/200</div>
          </div>

          {videoId && (
            <div className="aspect-video w-full rounded overflow-hidden border border-sk4-gray">
              <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${videoId}`} title="preview" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
            </div>
          )}

          <div className="sticky bottom-0 left-0 right-0 bg-sk4-white border-t border-sk4-gray p-sk4-md flex justify-end">
            <button onClick={handleSubmit} disabled={!videoId || reason.trim().length < 20} className="px-sk4-md py-sk4-sm bg-sk4-orange text-sk4-white rounded disabled:bg-sk4-gray">제출하기</button>
          </div>
        </div>
      </div>
    </div>
  );
}


