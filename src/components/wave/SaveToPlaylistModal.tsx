'use client';

import { useState } from 'react';
import { X, Plus, Music } from 'lucide-react';

interface Playlist {
  id: string;
  title: string;
  tracks: any[];
}

interface SaveToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: any;
  playlists: Playlist[];
  onCreatePlaylist: (title: string) => void;
  onSaveToPlaylist: (playlistId: string, track: any) => void;
}

export default function SaveToPlaylistModal({ 
  isOpen, 
  onClose, 
  track, 
  playlists, 
  onCreatePlaylist, 
  onSaveToPlaylist 
}: SaveToPlaylistModalProps) {
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  if (!isOpen) return null;

  const handleCreatePlaylist = () => {
    if (newPlaylistTitle.trim()) {
      onCreatePlaylist(newPlaylistTitle.trim());
      setNewPlaylistTitle('');
      setShowCreateForm(false);
    }
  };

  const handleSaveToPlaylist = (playlistId: string) => {
    // 중복 방지: 동일 externalId 포함 시 경고
    const target = playlists.find(p=>p.id===playlistId);
    const duplicated = target?.tracks.some(t=> t.externalId === (track as any).externalId);
    if (duplicated) {
      alert('이미 해당 플레이리스트에 있는 트랙입니다');
      return;
    }
    onSaveToPlaylist(playlistId, track);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black bg-opacity-30" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-sk4-white rounded-t-lg shadow-lg border-t border-sk4-gray max-h-[80vh] flex flex-col animate-slide-up">
        <div className="flex items-center justify-between p-sk4-md border-b border-sk4-gray">
          <h3 className="sk4-text-lg font-medium text-sk4-charcoal">플레이리스트에 저장</h3>
          <button onClick={onClose} className="p-sk4-sm hover:bg-sk4-light-gray rounded transition-all duration-200">
            <X className="w-5 h-5 text-sk4-dark-gray" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-sk4-md">
          {/* Track Info */}
          <div className="flex items-center space-x-sk4-sm mb-sk4-md p-sk4-sm bg-sk4-light-gray rounded">
            <img src={track.thumbnailUrl} alt={track.title} className="w-12 h-12 rounded" />
            <div className="flex-1">
              <p className="sk4-text-sm font-medium text-sk4-charcoal">{track.title}</p>
              <p className="sk4-text-xs text-sk4-dark-gray">{track.artist}</p>
            </div>
          </div>

          {/* Playlists */}
          <div className="space-y-sk4-sm max-h-60 overflow-y-auto">
            {playlists.map((playlist) => (
              <button
                key={playlist.id}
                onClick={() => handleSaveToPlaylist(playlist.id)}
                className="w-full flex items-center space-x-sk4-sm p-sk4-sm hover:bg-sk4-light-gray rounded transition-all duration-200"
              >
                <div className="w-10 h-10 bg-sk4-orange bg-opacity-10 rounded flex items-center justify-center">
                  <Music className="w-5 h-5 text-sk4-orange" />
                </div>
                <div className="flex-1 text-left">
                  <p className="sk4-text-sm font-medium text-sk4-charcoal">{playlist.title}</p>
                  <p className="sk4-text-xs text-sk4-dark-gray">{playlist.tracks.length}곡</p>
                </div>
              </button>
            ))}
          </div>

          {/* Create New Playlist */}
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full flex items-center space-x-sk4-sm p-sk4-sm border-2 border-dashed border-sk4-gray rounded hover:border-sk4-orange hover:bg-sk4-orange hover:bg-opacity-5 transition-all duration-200 mt-sk4-md"
            >
              <div className="w-10 h-10 bg-sk4-light-gray rounded flex items-center justify-center">
                <Plus className="w-5 h-5 text-sk4-dark-gray" />
              </div>
              <div className="flex-1 text-left">
                <p className="sk4-text-sm font-medium text-sk4-charcoal">새 플레이리스트 만들기</p>
                <p className="sk4-text-xs text-sk4-dark-gray">이 곡으로 새 플레이리스트를 시작하세요</p>
              </div>
            </button>
          ) : (
            <div className="mt-sk4-md p-sk4-sm border border-sk4-gray rounded">
              <input
                value={newPlaylistTitle}
                onChange={(e) => setNewPlaylistTitle(e.target.value)}
                placeholder="플레이리스트 이름"
                className="w-full p-sk4-sm border border-sk4-gray rounded focus:outline-none focus:ring-2 focus:ring-sk4-orange mb-sk4-sm sk4-text-sm"
                maxLength={30}
              />
              <div className="flex space-x-sk4-sm">
                <button
                  onClick={handleCreatePlaylist}
                  disabled={!newPlaylistTitle.trim()}
                  className="flex-1 py-sk4-sm bg-sk4-orange text-sk4-white rounded hover:bg-opacity-90 transition-all duration-200 sk4-text-sm disabled:bg-sk4-light-gray"
                >
                  만들기
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-sk4-md py-sk4-sm border border-sk4-gray rounded hover:bg-sk4-light-gray transition-all duration-200 sk4-text-sm"
                >
                  취소
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}