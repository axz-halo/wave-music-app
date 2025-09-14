'use client';

import { useState } from 'react';
import { X, SlidersHorizontal, Clock, Users, Heart } from 'lucide-react';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
}

interface FilterOptions {
  timeRange: string;
  mood: string[];
  genre: string[];
  userType: string;
  sortBy: string;
}

const timeRanges = [
  { value: 'all', label: '전체' },
  { value: 'today', label: '오늘' },
  { value: 'week', label: '이번 주' },
  { value: 'month', label: '이번 달' },
];

const moods = [
  { emoji: '🔥', label: '에너지' },
  { emoji: '😌', label: '휴식' },
  { emoji: '💪', label: '운동' },
  { emoji: '📚', label: '집중' },
  { emoji: '😭', label: '슬픔' },
  { emoji: '❤️', label: '사랑' },
];

const genres = [
  'K-Pop', 'Hip-Hop', 'Rock', 'Electronic', 'Jazz', 'Classical', 'Indie', 'R&B', 'Pop', 'Folk'
];

const userTypes = [
  { value: 'all', label: '전체' },
  { value: 'friends', label: '친구만' },
  { value: 'following', label: '팔로잉' },
  { value: 'popular', label: '인기 사용자' },
];

const sortOptions = [
  { value: 'latest', label: '최신순', icon: Clock },
  { value: 'popular', label: '인기순', icon: Heart },
  { value: 'friends', label: '친구순', icon: Users },
];

export default function FilterModal({ isOpen, onClose, onApplyFilters, currentFilters }: FilterModalProps) {
  const [filters, setFilters] = useState<FilterOptions>(currentFilters);

  const handleMoodToggle = (mood: string) => {
    setFilters(prev => ({
      ...prev,
      mood: prev.mood.includes(mood) 
        ? prev.mood.filter(m => m !== mood)
        : [...prev.mood, mood]
    }));
  };

  const handleGenreToggle = (genre: string) => {
    setFilters(prev => ({
      ...prev,
      genre: prev.genre.includes(genre) 
        ? prev.genre.filter(g => g !== genre)
        : [...prev.genre, genre]
    }));
  };

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: FilterOptions = {
      timeRange: 'all',
      mood: [],
      genre: [],
      userType: 'all',
      sortBy: 'latest',
    };
    setFilters(resetFilters);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end lg:items-center lg:justify-center">
      <div className="bg-white rounded-t-3xl lg:rounded-3xl w-full lg:w-full lg:max-w-3xl max-h-[80vh] lg:max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">필터</h2>
          </div>
          <button onClick={onClose} className="p-2">
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Time Range */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">시간 범위</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {timeRanges.map((range) => (
                <button
                  key={range.value}
                  onClick={() => setFilters(prev => ({ ...prev, timeRange: range.value }))}
                  className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                    filters.timeRange === range.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* User Type */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">사용자 유형</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {userTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setFilters(prev => ({ ...prev, userType: type.value }))}
                  className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                    filters.userType === type.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mood */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">무드</h3>
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
              {moods.map((mood) => (
                <button
                  key={mood.label}
                  onClick={() => handleMoodToggle(mood.label)}
                  className={`flex flex-col items-center space-y-1 p-3 rounded-lg border transition-all ${
                    filters.mood.includes(mood.label)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl">{mood.emoji}</span>
                  <span className="text-xs font-medium text-gray-700">{mood.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Genre */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">장르</h3>
            <div className="flex flex-wrap gap-2 lg:gap-3">
              {genres.map((genre) => (
                <button
                  key={genre}
                  onClick={() => handleGenreToggle(genre)}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                    filters.genre.includes(genre)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          {/* Sort By */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">정렬</h3>
            <div className="space-y-2">
              {sortOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setFilters(prev => ({ ...prev, sortBy: option.value }))}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                      filters.sortBy === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-3">
            <button
              onClick={handleReset}
              className="flex-1 py-3 px-4 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-all"
            >
              초기화
            </button>
            <button
              onClick={handleApply}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
            >
              적용하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
