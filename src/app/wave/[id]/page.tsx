'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Heart, MessageCircle, Bookmark, Share, Play, MoreHorizontal, UserPlus } from 'lucide-react';
import Navigation from '@/components/layout/Navigation';
import { dummyWaves, dummyUsers } from '@/lib/dummy-data';
import { Wave } from '@/types';

export default function WaveDetailPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string);
  const initial = useMemo(() => dummyWaves.find(w => w.id === id) || dummyWaves[0], [id]);
  const [wave] = useState<Wave>(initial);
  const [isLiked, setIsLiked] = useState(wave.isLiked || false);
  const [isSaved, setIsSaved] = useState(wave.isSaved || false);
  const [isFollowing, setIsFollowing] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
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

  return (
    <>
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <button className="p-2">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">{wave.user.nickname}의 웨이브</h1>
          <button className="p-2">
            <MoreHorizontal className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </header>

      {/* Wave Content */}
      <div className="max-w-md mx-auto">
        {/* Wave Card */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="space-y-4">
            {/* User Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img 
                    src={wave.user.profileImage || '/default-avatar.png'} 
                    alt={wave.user.nickname}
                    className="w-12 h-12 rounded-full"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{wave.user.nickname}</p>
                  <p className="text-sm text-gray-500">{formatTimeAgo(wave.timestamp)}</p>
                </div>
              </div>
              <button
                onClick={handleFollow}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isFollowing
                    ? 'bg-gray-100 text-gray-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isFollowing ? '팔로잉' : '팔로우'}
              </button>
            </div>

            {/* Music Info */}
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <img 
                  src={wave.track.thumbnailUrl} 
                  alt={wave.track.title}
                  className="w-24 h-24 rounded-xl shadow-md"
                />
                <button className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200">
                  <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                    <Play className="w-6 h-6 text-gray-800 ml-1" />
                  </div>
                </button>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-xl text-gray-900">{wave.track.title}</h3>
                <p className="text-gray-600 font-medium">{wave.track.artist}</p>
                <p className="text-sm text-gray-500 mt-1">{Math.floor((wave.track.duration||0)/60)}:{String((wave.track.duration||0)%60).padStart(2,'0')}</p>
              </div>
            </div>

            {/* Comment */}
            <p className="text-gray-700 leading-relaxed text-base">{wave.comment}</p>

            {/* Mood */}
            <div className="flex items-center space-x-3">
              <span className="text-3xl">{wave.moodEmoji}</span>
              <span className="bg-gray-100 px-4 py-2 rounded-full text-sm font-medium text-gray-700">
                {wave.moodText}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-8">
                <button 
                  onClick={handleLike}
                  className={`flex items-center space-x-2 transition-all hover:scale-105 ${
                    isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                  }`}
                >
                  <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
                  <span className="text-sm font-medium">{wave.likes}</span>
                </button>
                
                <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 hover:scale-105 transition-all">
                  <MessageCircle className="w-6 h-6" />
                  <span className="text-sm font-medium">{wave.comments}</span>
                </button>
                
                <button 
                  onClick={handleSave}
                  className={`flex items-center space-x-2 transition-all hover:scale-105 ${
                    isSaved ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'
                  }`}
                >
                  <Bookmark className={`w-6 h-6 ${isSaved ? 'fill-current' : ''}`} />
                  <span className="text-sm font-medium">{wave.saves}</span>
                </button>
              </div>
              
              <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-all">
                <Share className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* User Stats */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-around">
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">{wave.user.followers}</p>
              <p className="text-sm text-gray-600">팔로워</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">{wave.user.following}</p>
              <p className="text-sm text-gray-600">팔로잉</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">156</p>
              <p className="text-sm text-gray-600">웨이브</p>
            </div>
          </div>
        </div>

        {/* Related Waves */}
        <div className="bg-white p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">다른 웨이브</h3>
          <div className="space-y-3">
            {dummyWaves.slice(1, 4).map((relatedWave) => (
              <div key={relatedWave.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <img
                  src={relatedWave.track.thumbnailUrl}
                  alt={relatedWave.track.title}
                  className="w-12 h-12 rounded-lg"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{relatedWave.track.title}</p>
                  <p className="text-xs text-gray-600">{relatedWave.track.artist}</p>
                  <p className="text-xs text-gray-500 mt-1">{relatedWave.comment}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{relatedWave.moodEmoji}</span>
                  <span className="text-xs text-gray-500">❤️ {relatedWave.likes}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    <Navigation />
    </>
  );
}
