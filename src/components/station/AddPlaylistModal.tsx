'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Send, Music, Loader } from 'lucide-react';
import { parseYouTubePlaylistId, parseYouTubeChannelId, parseYouTubeId } from '@/lib/youtube';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (playlistId: string) => void;
  onCreateStation?: () => void;
}

export default function AddPlaylistModal({ isOpen, onClose, onSubmit, onCreateStation }: Props) {
  const [url, setUrl] = useState('');
  const [pid, setPid] = useState<string | null>(null);
  const [mode, setMode] = useState<'station'|'playlist'|'channel'|'video'>('playlist');
  const router = useRouter();
  const [preview, setPreview] = useState<{title:string; meta?:string; thumb?:string}|null>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [channelInfo, setChannelInfo] = useState<any>(null);
  const [channelPlaylists, setChannelPlaylists] = useState<any[]>([]);
  const [loadingChannel, setLoadingChannel] = useState(false);
  const [videoInfo, setVideoInfo] = useState<any>(null);
  const [loadingVideo, setLoadingVideo] = useState(false);

  useEffect(()=>{
    let id: string | null = null;
    if (mode==='playlist') id = parseYouTubePlaylistId(url);
    else if (mode==='channel') id = parseYouTubeChannelId(url);
    else if (mode==='video') id = parseYouTubeId(url);
    
    console.log('URL parsing:', { url, mode, id });
    
    setPid(id);
    setPreview(null);
    setTracks([]);
    setChannelInfo(null);
    setChannelPlaylists([]);
    setVideoInfo(null);
    
    if (id) {
      const type = mode==='playlist' ? 'playlist' : mode==='channel' ? 'channel' : 'video';
      fetch(`/api/youtube/resolve?type=${type}&id=${id}`).then(r=>r.json()).then(d=>{
        console.log('API response:', d);
        if (d?.ok) {
          setPreview({ title: d.title, meta: d.channelTitle || d.handle, thumb: d.thumbnails?.default?.url || d.thumbnails?.medium?.url });
          
          // 플레이리스트인 경우 트랙들도 가져오기
          if (mode === 'playlist') {
            setLoadingTracks(true);
            fetch(`/api/youtube/playlist-items?playlistId=${id}&maxResults=20`).then(r=>r.json()).then(data=>{
              setTracks(data.items || []);
              setLoadingTracks(false);
            }).catch(()=>{
              setLoadingTracks(false);
            });
          }
          
          // 채널인 경우 채널 정보와 플레이리스트 가져오기
          if (mode === 'channel') {
            setLoadingChannel(true);
            setChannelInfo({
              title: d.title,
              handle: d.handle,
              subscriberCount: d.subscriberCount,
              videoCount: d.videoCount,
              viewCount: d.viewCount,
              thumbnails: d.thumbnails,
              channelId: d.channelId || id
            });
            
            // Use resolved channel ID for playlist fetching
            const resolvedChannelId = d.channelId || id;
            fetch(`/api/youtube/channel-playlists?channelId=${resolvedChannelId}&maxResults=5`).then(r=>r.json()).then(data=>{
              setChannelPlaylists(data.playlists || []);
              setLoadingChannel(false);
            }).catch(()=>{
              setLoadingChannel(false);
            });
          }
          
          // 비디오인 경우 비디오 정보 저장
          if (mode === 'video') {
            setLoadingVideo(true);
            setVideoInfo({
              id: id,
              title: d.title,
              channelTitle: d.channelTitle,
              thumbnails: d.thumbnails,
              duration: d.duration
            });
            setLoadingVideo(false);
          }
        } else {
          console.log('API error:', d);
        }
      }).catch(err=>{
        console.error('Fetch error:', err);
      });
    }
  }, [url, mode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 sk4-modal-backdrop" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-sk4-white rounded-t-lg border-t border-sk4-gray p-sk4-md max-h-[85vh] sk4-modal-slide-up">
        <div className="flex items-center justify-between mb-sk4-sm">
          <h3 className="sk4-text-lg font-medium text-sk4-charcoal">추가하기</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-sk4-dark-gray"/></button>
        </div>
        <div className="grid grid-cols-2 gap-sk4-sm mb-sk4-sm">
          <button onClick={()=>setMode('station')} className={`px-sk4-md py-sk4-sm rounded border ${mode==='station'?'bg-sk4-orange text-sk4-white border-sk4-orange':'bg-sk4-white border-sk4-gray text-sk4-charcoal'}`}>스테이션 만들기</button>
          <button onClick={()=>setMode('playlist')} className={`px-sk4-md py-sk4-sm rounded border ${mode==='playlist'?'bg-sk4-orange text-sk4-white border-sk4-orange':'bg-sk4-white border-sk4-gray text-sk4-charcoal'}`}>플레이리스트 추가</button>
          <button onClick={()=>setMode('channel')} className={`px-sk4-md py-sk4-sm rounded border ${mode==='channel'?'bg-sk4-orange text-sk4-white border-sk4-orange':'bg-sk4-white border-sk4-gray text-sk4-charcoal'}`}>채널 추가</button>
          <button onClick={()=>setMode('video')} className={`px-sk4-md py-sk4-sm rounded border ${mode==='video'?'bg-sk4-orange text-sk4-white border-sk4-orange':'bg-sk4-white border-sk4-gray text-sk4-charcoal'}`}>비디오 추가</button>
        </div>

        {mode==='station' ? (
          <div className="space-y-sk4-sm">
            <p className="sk4-text-sm text-sk4-dark-gray">사용자와 함께 듣는 협업 스테이션을 만들어보세요.</p>
            <div className="flex justify-end">
              <button onClick={()=>{ if (onCreateStation) onCreateStation(); else router.push('/station/create'); }} className="px-sk4-md py-sk4-sm bg-sk4-orange text-sk4-white rounded">스테이션 만들기</button>
            </div>
          </div>
        ) : mode==='playlist' ? (
          <>
            <input value={url} onChange={(e)=>setUrl(e.target.value)} placeholder="YouTube 플레이리스트 링크 붙여넣기" className="w-full p-sk4-sm border border-sk4-gray rounded" />
            <div className="mt-sk4-sm sk4-text-xs text-sk4-dark-gray">{pid ? '유효한 플레이리스트입니다' : '플레이리스트 ID를 인식하지 못했습니다'}</div>
            
            {preview && (
              <div className="mt-sk4-sm flex items-center gap-sk4-sm p-sk4-sm border border-sk4-gray rounded">
                {preview.thumb && <img src={preview.thumb} className="w-10 h-10" alt="preview" />}
                <div className="min-w-0">
                  <p className="sk4-text-sm text-sk4-charcoal truncate">{preview.title}</p>
                  {preview.meta && <p className="sk4-text-xs text-sk4-dark-gray truncate">{preview.meta}</p>}
                </div>
              </div>
            )}

            {/* 트랙 목록 표시 */}
            {loadingTracks && (
              <div className="mt-sk4-sm flex items-center justify-center py-sk4-md">
                <Loader className="w-5 h-5 animate-spin text-sk4-orange" />
                <span className="ml-sk4-sm sk4-text-sm text-sk4-dark-gray">트랙을 불러오는 중...</span>
              </div>
            )}

            {tracks.length > 0 && (
              <div className="mt-sk4-sm max-h-40 overflow-y-auto border border-sk4-gray rounded">
                <div className="p-sk4-sm bg-sk4-light-gray border-b border-sk4-gray">
                  <p className="sk4-text-xs text-sk4-dark-gray">플레이리스트 트랙 ({tracks.length}곡)</p>
                </div>
                {tracks.slice(0, 10).map((track, idx) => (
                  <div key={track.id} className="flex items-center gap-sk4-sm p-sk4-sm border-b border-sk4-gray last:border-b-0">
                    <span className="sk4-text-xs text-sk4-dark-gray w-6">{idx + 1}</span>
                    <img src={track.thumbnailUrl} className="w-8 h-8 rounded" alt={track.title} />
                    <div className="min-w-0 flex-1">
                      <p className="sk4-text-xs text-sk4-charcoal truncate">{track.title}</p>
                      <p className="sk4-text-xs text-sk4-dark-gray truncate">{track.artist}</p>
                    </div>
                    <Music className="w-3 h-3 text-sk4-dark-gray" />
                  </div>
                ))}
                {tracks.length > 10 && (
                  <div className="p-sk4-sm text-center">
                    <p className="sk4-text-xs text-sk4-dark-gray">... 외 {tracks.length - 10}곡 더</p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-sk4-md flex justify-end">
              <button 
                disabled={!pid || loadingTracks} 
                onClick={async ()=> {
                  if (!pid) return;
                  try {
                    await onSubmit(pid);
                    toast.success(`플레이리스트가 추가되었습니다 (${tracks.length}곡)`);
                  } catch (error) {
                    toast.error('플레이리스트 추가에 실패했습니다');
                  }
                }} 
                className="px-sk4-md py-sk4-sm bg-sk4-orange text-sk4-white rounded disabled:bg-sk4-gray flex items-center gap-sk4-sm"
              >
                <Send className="w-4 h-4"/>
                추가 ({tracks.length}곡)
              </button>
            </div>
          </>
        ) : mode==='channel' ? (
          <>
            <input value={url} onChange={(e)=>setUrl(e.target.value)} placeholder="YouTube 채널 링크(@handle 또는 /channel/UCxxxx)" className="w-full p-sk4-sm border border-sk4-gray rounded" />
            <div className="mt-sk4-sm sk4-text-xs text-sk4-dark-gray">{pid ? '유효한 채널입니다' : '채널 ID를 인식하지 못했습니다'}</div>
            
            {preview && (
              <div className="mt-sk4-sm flex items-center gap-sk4-sm p-sk4-sm border border-sk4-gray rounded">
                {preview.thumb && <img src={preview.thumb} className="w-10 h-10 rounded-full" alt="preview" />}
                <div className="min-w-0">
                  <p className="sk4-text-sm text-sk4-charcoal truncate">{preview.title}</p>
                  {preview.meta && <p className="sk4-text-xs text-sk4-dark-gray truncate">{preview.meta}</p>}
                </div>
              </div>
            )}

            {/* 채널 정보 표시 */}
            {channelInfo && (
              <div className="mt-sk4-sm p-sk4-sm border border-sk4-gray rounded bg-sk4-light-gray">
                <div className="flex items-center gap-sk4-sm mb-sk4-sm">
                  {channelInfo.thumbnails?.high?.url && (
                    <img src={channelInfo.thumbnails.high.url} className="w-12 h-12 rounded-full" alt={channelInfo.title} />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="sk4-text-sm font-medium text-sk4-charcoal">{channelInfo.title}</p>
                    {channelInfo.handle && <p className="sk4-text-xs text-sk4-dark-gray">@{channelInfo.handle}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-sk4-sm sk4-text-xs text-sk4-dark-gray">
                  <div className="text-center">
                    <p className="font-medium">{parseInt(channelInfo.subscriberCount || '0').toLocaleString()}</p>
                    <p>구독자</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{parseInt(channelInfo.videoCount || '0').toLocaleString()}</p>
                    <p>영상</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{parseInt(channelInfo.viewCount || '0').toLocaleString()}</p>
                    <p>조회수</p>
                  </div>
                </div>
              </div>
            )}

            {/* 채널 플레이리스트 로딩 */}
            {loadingChannel && (
              <div className="mt-sk4-sm flex items-center justify-center py-sk4-md">
                <Loader className="w-5 h-5 animate-spin text-sk4-orange" />
                <span className="ml-sk4-sm sk4-text-sm text-sk4-dark-gray">채널 플레이리스트를 불러오는 중...</span>
              </div>
            )}

            {/* 채널 플레이리스트 목록 */}
            {channelPlaylists.length > 0 && (
              <div className="mt-sk4-sm max-h-48 overflow-y-auto border border-sk4-gray rounded">
                <div className="p-sk4-sm bg-sk4-light-gray border-b border-sk4-gray">
                  <p className="sk4-text-xs text-sk4-dark-gray">대표 플레이리스트 ({channelPlaylists.length}개)</p>
                </div>
                {channelPlaylists.map((playlist, idx) => (
                  <div key={playlist.id} className="flex items-center gap-sk4-sm p-sk4-sm border-b border-sk4-gray last:border-b-0">
                    <span className="sk4-text-xs text-sk4-dark-gray w-6">{idx + 1}</span>
                    <img src={playlist.thumbnailUrl} className="w-8 h-8 rounded" alt={playlist.title} />
                    <div className="min-w-0 flex-1">
                      <p className="sk4-text-xs text-sk4-charcoal truncate">{playlist.title}</p>
                      <p className="sk4-text-xs text-sk4-dark-gray truncate">{playlist.itemCount}곡 • {playlist.viewCount.toLocaleString()} 조회</p>
                    </div>
                    <Music className="w-3 h-3 text-sk4-dark-gray" />
                  </div>
                ))}
              </div>
            )}

            <div className="mt-sk4-md flex justify-end">
              <button 
                disabled={!pid || loadingChannel} 
                onClick={async ()=>{ 
                  if (!pid) return; 
                  try {
                    const resolvedChannelId = channelInfo?.channelId || pid;
                    await fetch('/api/radio/channels', { 
                      method:'POST', 
                      headers:{'Content-Type':'application/json'}, 
                      body: JSON.stringify({ 
                        channelId: resolvedChannelId,
                        channelInfo: channelInfo,
                        playlists: channelPlaylists
                      })
                    }); 
                    toast.success(`채널이 추가되었습니다 (${channelPlaylists.length}개 플레이리스트)`);
                    onClose(); 
                  } catch (error) {
                    toast.error('채널 추가에 실패했습니다');
                  }
                }} 
                className="px-sk4-md py-sk4-sm bg-sk4-orange text-sk4-white rounded disabled:bg-sk4-gray flex items-center gap-sk4-sm"
              >
                <Send className="w-4 h-4"/>
                추가 ({channelPlaylists.length}개 플레이리스트)
              </button>
            </div>
          </>
        ) : (
          <>
            <input value={url} onChange={(e)=>setUrl(e.target.value)} placeholder="YouTube 비디오 링크 붙여넣기" className="w-full p-sk4-sm border border-sk4-gray rounded" />
            <div className="mt-sk4-sm sk4-text-xs text-sk4-dark-gray">{pid ? '유효한 비디오입니다' : '비디오 ID를 인식하지 못했습니다'}</div>
            
            {preview && (
              <div className="mt-sk4-sm flex items-center gap-sk4-sm p-sk4-sm border border-sk4-gray rounded">
                {preview.thumb && <img src={preview.thumb} className="w-16 h-12 rounded" alt="preview" />}
                <div className="min-w-0">
                  <p className="sk4-text-sm text-sk4-charcoal truncate">{preview.title}</p>
                  {preview.meta && <p className="sk4-text-xs text-sk4-dark-gray truncate">{preview.meta}</p>}
                  {videoInfo?.duration && (
                    <p className="sk4-text-xs text-sk4-dark-gray">
                      {Math.floor(videoInfo.duration / 60)}:{String(videoInfo.duration % 60).padStart(2, '0')}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 비디오 로딩 */}
            {loadingVideo && (
              <div className="mt-sk4-sm flex items-center justify-center py-sk4-md">
                <Loader className="w-5 h-5 animate-spin text-sk4-orange" />
                <span className="ml-sk4-sm sk4-text-sm text-sk4-dark-gray">비디오 정보를 불러오는 중...</span>
              </div>
            )}

            <div className="mt-sk4-md flex justify-end">
              <button 
                disabled={!pid || loadingVideo} 
                onClick={async ()=>{ 
                  if (!pid || !videoInfo) return; 
                  try {
                    // 비디오를 웨이브로 생성
                    const response = await fetch('/api/waves', { 
                      method:'POST', 
                      headers:{'Content-Type':'application/json'}, 
                      body: JSON.stringify({ 
                        youtubeUrl: url,
                        track: {
                          id: videoInfo.id,
                          title: videoInfo.title,
                          artist: videoInfo.channelTitle,
                          platform: 'youtube',
                          externalId: videoInfo.id,
                          thumbnailUrl: videoInfo.thumbnails?.medium?.url || videoInfo.thumbnails?.default?.url,
                          duration: videoInfo.duration || 0,
                        },
                        comment: '플레이리스트에서 추가된 비디오',
                        moodEmoji: '🎵',
                        moodText: '추가됨'
                      })
                    }); 
                    if (response.ok) {
                      toast.success('비디오가 웨이브로 추가되었습니다!');
                      onClose(); 
                    } else {
                      throw new Error('Failed to add video');
                    }
                  } catch (error) {
                    toast.error('비디오 추가에 실패했습니다');
                    console.error('Video add error:', error);
                  }
                }} 
                className="px-sk4-md py-sk4-sm bg-sk4-orange text-sk4-white rounded disabled:bg-sk4-gray flex items-center gap-sk4-sm"
              >
                <Send className="w-4 h-4"/>
                웨이브로 추가
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}