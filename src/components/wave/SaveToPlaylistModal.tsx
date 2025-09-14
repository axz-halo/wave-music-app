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
    onSaveToPlaylist(playlistId, track);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl w-[92%] max-w-md shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">플레이리스트에 저장</h3>
          <button onClick={onClose} className="p-2"><X className="w-5 h-5 text-gray-600" /></button>
        </div>

        <div className="p-4">
          {/* Track Info */}
          <div className="flex items-center space-x-3 mb-4 p-3 bg-gray-50 rounded-lg">
            <img src={track.thumbnailUrl} alt={track.title} className="w-12 h-12 rounded" />
            <div className="flex-1">
              <p className="font-medium text-gray-900 text-sm">{track.title}</p>
              <p className="text-xs text-gray-600">{track.artist}</p>
            </div>
          </div>

          {/* Playlists */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {playlists.map((playlist) => (
              <button
                key={playlist.id}
                onClick={() => handleSaveToPlaylist(playlist.id)}
                className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-all"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Music className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900 text-sm">{playlist.title}</p>
                  <p className="text-xs text-gray-600">{playlist.tracks.length}곡</p>
                </div>
              </button>
            ))}
          </div>

          {/* Create New Playlist */}
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full flex items-center space-x-3 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all mt-3"
            >
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Plus className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-700 text-sm">새 플레이리스트 만들기</p>
                <p className="text-xs text-gray-500">이 곡으로 새 플레이리스트를 시작하세요</p>
              </div>
            </button>
          ) : (
            <div className="mt-3 p-3 border border-gray-200 rounded-lg">
              <input
                value={newPlaylistTitle}
                onChange={(e) => setNewPlaylistTitle(e.target.value)}
                placeholder="플레이리스트 이름"
                className="w-full p-2 border border-gray-200 rounded-lg text-sm mb-2"
                maxLength={30}
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleCreatePlaylist}
                  disabled={!newPlaylistTitle.trim()}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:bg-gray-300"
                >
                  만들기
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm"
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