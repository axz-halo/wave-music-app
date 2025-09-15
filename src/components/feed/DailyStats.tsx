'use client';

import { Music, Heart, TrendingUp, TrendingDown } from 'lucide-react';

export default function DailyStats() {
  const stats = [
    {
      icon: Music,
      value: 24,
      label: '공유된 웨이브',
      change: 12,
      changeType: 'increase' as const,
    },
    {
      icon: Heart,
      value: 156,
      label: '저장된 트랙',
      change: 8,
      changeType: 'increase' as const,
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 text-center">오늘의 통계</h3>
        
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="text-center space-y-3">
                <div className="w-12 h-12 bg-primary-100 rounded-medium mx-auto flex items-center justify-center shadow-tactile">
                  <Icon className="w-6 h-6 text-primary-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <div className="flex items-center justify-center space-x-1">
                    {stat.changeType === 'increase' ? (
                      <TrendingUp className="w-3 h-3 text-green-500" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-500" />
                    )}
                    <p className={`text-xs font-medium ${
                      stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      +{stat.change}%
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
