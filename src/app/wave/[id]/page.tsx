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
    <div className="min-h-screen bg-cream-50 pb-20 lg:pb-0 lg:ml-56">
      {/* Desktop Header */}
      <header className="hidden lg:block bg-cream-100 border-b border-cream-200 px-6 py-4 sticky top-0 z-30 shadow-minimal">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button className="p-2 hover:bg-cream-200 rounded-medium transition-all duration-150">
            <ArrowLeft className="w-5 h-5 text-beige-600" />
          </button>
          <h1 className="text-hierarchy-lg font-semibold text-beige-800">{wave.user.nickname}의 웨이브</h1>
          <button className="p-2 hover:bg-cream-200 rounded-medium transition-all duration-150">
            <MoreHorizontal className="w-5 h-5 text-beige-600" />
          </button>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="lg:hidden bg-cream-100 border-b border-cream-200 px-4 py-4 sticky top-0 z-40 shadow-minimal">
        <div className="flex items-center justify-between">
          <button className="p-2 hover:bg-cream-200 rounded-medium transition-all duration-150">
            <ArrowLeft className="w-5 h-5 text-beige-600" />
          </button>
          <h1 className="text-hierarchy-lg font-semibold text-beige-800">{wave.user.nickname}의 웨이브</h1>
          <button className="p-2 hover:bg-cream-200 rounded-medium transition-all duration-150">
            <MoreHorizontal className="w-5 h-5 text-beige-600" />
          </button>
        </div>
      </header>

      {/* Wave Content */}
      <div className="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Wave Card */}
        <div className="bg-cream-100 rounded-medium shadow-minimal border border-cream-200 p-6">
          <div className="space-y-6">
            {/* User Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img 
                    src={wave.user.profileImage || '/default-avatar.png'} 
                    alt={wave.user.nickname}
                    className="w-12 h-12 rounded-full shadow-minimal"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-cream-100"></div>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-beige-800">{wave.user.nickname}</p>
                  <p className="text-sm text-beige-600">{formatTimeAgo(wave.timestamp)}</p>
                </div>
              </div>
              <button
                onClick={handleFollow}
                className={`px-4 py-2 rounded-medium text-sm font-medium transition-all duration-150 shadow-minimal ${
                  isFollowing
                    ? 'bg-cream-200 text-beige-700 hover:bg-cream-300'
                    : 'bg-primary-500 text-white hover:bg-primary-600'
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
                  className="w-24 h-24 rounded-medium shadow-minimal"
                />
                <button className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 rounded-medium opacity-0 group-hover:opacity-100 transition-all duration-150">
                  <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-minimal">
                    <Play className="w-6 h-6 text-beige-800 ml-1" />
                  </div>
                </button>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-hierarchy-xl text-beige-800">{wave.track.title}</h3>
                <p className="text-beige-600 font-medium">{wave.track.artist}</p>
                <p className="text-sm text-beige-500 mt-1">{Math.floor((wave.track.duration||0)/60)}:{String((wave.track.duration||0)%60).padStart(2,'0')}</p>
              </div>
            </div>

            {/* Comment */}
            <p className="text-beige-700 leading-relaxed text-base">{wave.comment}</p>

            {/* Mood */}
            <div className="flex items-center space-x-3">
              <span className="text-3xl">{wave.moodEmoji}</span>
              <span className="bg-cream-200 px-4 py-2 rounded-medium text-sm font-medium text-beige-700 shadow-minimal">
                {wave.moodText}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-8">
                <button 
                  onClick={handleLike}
                  className={`flex items-center space-x-2 transition-all duration-150 hover:scale-105 ${
                    isLiked ? 'text-red-500' : 'text-beige-500 hover:text-red-500'
                  }`}
                >
                  <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
                  <span className="text-sm font-medium">{wave.likes}</span>
                </button>
                
                <button className="flex items-center space-x-2 text-beige-500 hover:text-primary-500 hover:scale-105 transition-all duration-150">
                  <MessageCircle className="w-6 h-6" />
                  <span className="text-sm font-medium">{wave.comments}</span>
                </button>
                
                <button 
                  onClick={handleSave}
                  className={`flex items-center space-x-2 transition-all duration-150 hover:scale-105 ${
                    isSaved ? 'text-primary-500' : 'text-beige-500 hover:text-primary-500'
                  }`}
                >
                  <Bookmark className={`w-6 h-6 ${isSaved ? 'fill-current' : ''}`} />
                  <span className="text-sm font-medium">{wave.saves}</span>
                </button>
              </div>
              
              <button className="w-10 h-10 bg-cream-200 rounded-full flex items-center justify-center hover:bg-cream-300 transition-all duration-150 shadow-minimal">
                <Share className="w-5 h-5 text-beige-600" />
              </button>
            </div>
          </div>
        </div>

        {/* User Stats */}
        <div className="bg-cream-100 rounded-medium shadow-minimal border border-cream-200 p-6">
          <div className="flex items-center justify-around">
            <div className="text-center">
              <p className="text-hierarchy-xl font-bold text-beige-800">{wave.user.followers}</p>
              <p className="text-sm text-beige-600">팔로워</p>
            </div>
            <div className="text-center">
              <p className="text-hierarchy-xl font-bold text-beige-800">{wave.user.following}</p>
              <p className="text-sm text-beige-600">팔로잉</p>
            </div>
            <div className="text-center">
              <p className="text-hierarchy-xl font-bold text-beige-800">156</p>
              <p className="text-sm text-beige-600">웨이브</p>
            </div>
          </div>
        </div>

        {/* Related Waves */}
        <div className="bg-cream-100 rounded-medium shadow-minimal border border-cream-200 p-6">
          <h3 className="text-hierarchy-lg font-semibold text-beige-800 mb-4">다른 웨이브</h3>
          <div className="space-y-3">
            {dummyWaves.slice(1, 4).map((relatedWave) => (
              <div key={relatedWave.id} className="flex items-center space-x-3 p-3 bg-cream-50 rounded-medium shadow-minimal border border-cream-200">
                <img
                  src={relatedWave.track.thumbnailUrl}
                  alt={relatedWave.track.title}
                  className="w-12 h-12 rounded-medium shadow-minimal"
                />
                <div className="flex-1">
                  <p className="font-medium text-beige-800 text-sm">{relatedWave.track.title}</p>
                  <p className="text-xs text-beige-600">{relatedWave.track.artist}</p>
                  <p className="text-xs text-beige-500 mt-1">{relatedWave.comment}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{relatedWave.moodEmoji}</span>
                  <span className="text-xs text-beige-500">❤️ {relatedWave.likes}</span>
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
