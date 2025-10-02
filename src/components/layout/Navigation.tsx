'use client';

import { usePathname } from 'next/navigation';
import { Home, Radio, Trophy, User, Plus } from 'lucide-react';

interface NavigationProps {
  onCreateWave?: () => void;
}

const navigationItems = [
  { name: '홈', href: '/feed', icon: Home, description: '친구들의 음악' },
  { name: '스테이션', href: '/station', icon: Radio, description: '플레이리스트' },
  { name: '챌린지', href: '/challenge', icon: Trophy, description: '음악 챌린지' },
  { name: '마이', href: '/profile', icon: User, description: '내 프로필' },
];

export default function Navigation({ onCreateWave }: NavigationProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Bottom Navigation - Spotify Style */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="mx-4 mb-4 bg-black/90 backdrop-blur-xl border border-gray-800/50 rounded-2xl shadow-2xl">
          <div className="h-16 flex items-center justify-around px-2 py-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <a
                  key={item.name}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className="flex-1 flex flex-col items-center justify-center"
                >
                  <div className={`p-2.5 rounded-lg transition-all duration-300 ${
                    isActive 
                      ? 'bg-white text-black shadow-lg' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-xs mt-1 transition-all duration-300 ${
                    isActive ? 'text-white font-semibold' : 'text-gray-400 font-medium'
                  }`}>
                    {item.name}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Desktop Sidebar - Spotify Style */}
      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-64 bg-black/90 backdrop-blur-xl border-r border-gray-800/50 shadow-2xl z-30">
        <div className="p-6 h-full flex flex-col">
          {/* Logo */}
          <div className="flex items-center space-x-3 mb-8 group">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg rounded-lg group-hover:scale-105 transition-all duration-300">
              <span className="text-white font-bold text-lg">W</span>
            </div>
            <div>
              <span className="text-white font-bold text-xl">WAVE</span>
              <span className="text-gray-400 text-xs block">Music Social</span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 py-3 px-3 rounded-lg transition-all duration-300 ${
                    isActive 
                      ? 'bg-white text-black' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <div className="flex-1">
                    <span className="font-medium text-sm">{item.name}</span>
                    <span className="text-xs opacity-70 block">{item.description}</span>
                  </div>
                </a>
              );
            })}
          </nav>

          {/* Create Wave Button */}
          {onCreateWave && (
            <div className="mt-auto">
              <button
                onClick={onCreateWave}
                className="w-full bg-white text-black py-3 px-4 rounded-full font-semibold hover:scale-105 transition-all duration-200 shadow-lg flex items-center justify-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                웨이브 만들기
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}