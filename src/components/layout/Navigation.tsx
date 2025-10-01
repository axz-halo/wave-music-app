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
      {/* Mobile Bottom Navigation - Spotify UX Pattern */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="mx-4 mb-4 sk4-spotify-card">
          <div className="h-16 flex items-center justify-around px-2 py-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <a
                  key={item.name}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`sk4-spotify-nav-item flex-1 ${
                    isActive ? 'sk4-spotify-nav-item-active' : ''
                  }`}
                >
                  <div className={`p-2.5 rounded-sk4-soft transition-all duration-300 ${
                    isActive 
                      ? 'bg-sk4-orange text-white shadow-sk4-soft' 
                      : 'group-hover:bg-sk4-orange/10'
                  }`}>
                    <Icon className="sk4-spotify-nav-icon" />
                  </div>
                  <span className={`sk4-spotify-caption mt-1 transition-all duration-300 ${
                    isActive ? 'text-sk4-orange font-semibold' : 'font-medium'
                  }`}>
                    {item.name}
                  </span>
                </a>
              );
            })}
          </div>
        </div>

      </nav>

      {/* Desktop Sidebar - Spotify UX Pattern */}
      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-64 sk4-spotify-sidebar z-30">
        <div className="p-sk4-lg h-full flex flex-col relative">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-sk4-orange/5 pointer-events-none" />
          
          {/* Logo - Enhanced */}
          <div className="flex items-center space-x-sk4-md mb-sk4-xl relative z-10 group">
            <div className="w-12 h-12 bg-gradient-to-br from-sk4-orange to-sk4-orange-light flex items-center justify-center shadow-sk4-soft rounded-lg group-hover:shadow-sk4-glow transition-all duration-300 group-hover:scale-105">
              <span className="text-white font-bold text-xl">W</span>
            </div>
            <div>
              <span className="sk4-text-xl font-bold bg-gradient-to-r from-sk4-charcoal to-sk4-dark-gray bg-clip-text text-transparent block group-hover:from-sk4-orange group-hover:to-sk4-orange-light transition-all duration-300">WAVE</span>
              <span className="sk4-text-xs text-sk4-medium-gray group-hover:text-sk4-orange transition-colors duration-300">Music Social</span>
            </div>
          </div>

          {/* Navigation Items - Enhanced */}
          <nav className="flex-1 space-y-2 relative z-10">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`sk4-spotify-sidebar-item ${
                    isActive ? 'sk4-spotify-sidebar-item-active' : ''
                  }`}
                >
                  <div className={`p-2 rounded-sk4-soft transition-all duration-300 ${
                    isActive 
                      ? 'bg-sk4-orange text-white shadow-sk4-soft' 
                      : 'bg-sk4-light-gray group-hover:bg-sk4-orange/20'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <span className={`sk4-spotify-subtitle block transition-all duration-300 ${
                      isActive ? 'text-sk4-orange font-semibold' : 'font-medium'
                    }`}>{item.name}</span>
                    <span className="sk4-spotify-caption block transition-colors duration-300">{item.description}</span>
                  </div>
                </a>
              );
            })}
          </nav>

          {/* Create Wave Button - Enhanced */}
          {onCreateWave && (
            <div className="mt-auto relative z-10">
              <button
                onClick={onCreateWave}
                className="w-full sk4-spotify-btn relative overflow-hidden group"
              >
                <div className="flex items-center justify-center">
                  <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                  웨이브 만들기
                </div>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}