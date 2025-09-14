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
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl w-[92%] max-w-lg shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">음악 추천하기</h3>
          <button onClick={onClose} className="p-2"><X className="w-5 h-5 text-gray-600" /></button>
        </div>

        <div className="p-4 space-y-3">
          <input value={url} onChange={(e)=>setUrl(e.target.value)} placeholder="YouTube 링크 또는 ID" className="w-full p-3 border border-gray-200 rounded-lg" />
          <textarea value={reason} onChange={(e)=>setReason(e.target.value)} placeholder="추천 이유 (선택)" className="w-full p-3 border border-gray-200 rounded-lg h-24" />
          {videoId && (
            <div className="aspect-video w-full rounded-lg overflow-hidden">
              <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${videoId}`} title="preview" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-end">
          <button onClick={handleSubmit} disabled={!videoId} className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:bg-gray-300 flex items-center gap-2"><Send className="w-4 h-4" /> 제출</button>
        </div>
      </div>
    </div>
  );
}


