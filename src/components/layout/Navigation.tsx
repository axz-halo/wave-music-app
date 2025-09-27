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
      {/* Mobile Bottom Navigation - Enhanced iOS style */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 sk4-safe-area">
        <div className="h-20 bg-white/95 backdrop-blur-lg border-t border-sk4-gray shadow-lg">
          <div className="h-full flex">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <a
                  key={item.name}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative flex flex-col items-center justify-center flex-1 h-full sk4-interactive group ${
                    isActive ? 'text-sk4-orange' : 'text-sk4-dark-gray'
                  }`}
                >
                  <div className={`p-1 rounded-xl transition-all duration-200 ${
                    isActive ? 'bg-sk4-orange/10' : 'group-hover:bg-sk4-light-gray'
                  }`}>
                    <Icon className={`w-6 h-6 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                  </div>
                  <span className={`sk4-text-xs font-medium mt-1 transition-all duration-200 ${
                    isActive ? 'text-sk4-orange' : 'text-sk4-dark-gray group-hover:text-sk4-charcoal'
                  }`}>
                    {item.name}
                  </span>
                  {/* Enhanced indicator */}
                  <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 rounded-full transition-all duration-300 ${
                    isActive ? 'bg-sk4-orange scale-100' : 'bg-transparent scale-0'
                  }`} />
                </a>
              );
            })}
          </div>
        </div>

        {/* Floating CTA per tab - Enhanced */}
        <div className="pointer-events-none">
          {pathname === '/feed' && onCreateWave && (
            <button
              onClick={onCreateWave}
              className="pointer-events-auto fixed bottom-24 right-4 w-14 h-14 rounded-full bg-sk4-orange text-white flex items-center justify-center shadow-xl hover:shadow-2xl sk4-btn sk4-float border-2 border-white"
            >
              <Plus className="w-6 h-6" />
            </button>
          )}
          {pathname === '/station' && (
            <button
              onClick={() => (document.querySelector('[data-upload-trigger]') as HTMLElement)?.click()}
              className="pointer-events-auto fixed bottom-24 right-4 w-14 h-14 rounded-full bg-sk4-orange text-white flex items-center justify-center shadow-xl hover:shadow-2xl sk4-btn sk4-float border-2 border-white"
            >
              <Plus className="w-6 h-6" />
            </button>
          )}
          {pathname === '/challenge' && (
            <a href="/challenge/create" className="pointer-events-auto fixed bottom-24 right-4 w-14 h-14 rounded-full bg-sk4-orange text-white flex items-center justify-center shadow-xl hover:shadow-2xl sk4-btn sk4-float border-2 border-white">
              <Plus className="w-6 h-6" />
            </a>
          )}
          {pathname === '/profile' && (
            <a href="/profile/playlists" className="pointer-events-auto fixed bottom-24 right-4 w-14 h-14 rounded-full bg-sk4-orange text-white flex items-center justify-center shadow-xl hover:shadow-2xl sk4-btn sk4-float border-2 border-white">
              <Plus className="w-6 h-6" />
            </a>
          )}
        </div>
      </nav>

      {/* Desktop Sidebar - Enhanced SK4 Design */}
      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-64 bg-white/95 backdrop-blur-sm border-r border-sk4-gray shadow-sm z-30">
        <div className="p-sk4-lg h-full flex flex-col">
          {/* Logo - Enhanced */}
          <div className="flex items-center space-x-sk4-md mb-sk4-xl">
            <div className="w-10 h-10 bg-gradient-to-br from-sk4-orange to-sk4-orange/80 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-lg">W</span>
            </div>
            <div>
              <span className="sk4-text-xl font-bold text-sk4-charcoal block">WAVE</span>
              <span className="sk4-text-xs text-sk4-medium-gray">Music Social</span>
            </div>
          </div>

          {/* Navigation Items - Enhanced */}
          <nav className="flex-1 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-sk4-md py-sk4-md px-sk4-md sk4-interactive group ${
                    isActive
                      ? 'bg-sk4-orange/10 text-sk4-orange border-l-2 border-sk4-orange'
                      : 'text-sk4-dark-gray hover:bg-sk4-light-gray hover:text-sk4-charcoal'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg transition-all duration-200 ${
                    isActive ? 'bg-sk4-orange/20' : 'group-hover:bg-sk4-light-gray'
                  }`}>
                    <Icon className={`w-5 h-5 transition-transform duration-200 ${
                      isActive ? 'scale-110' : 'group-hover:scale-105'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <span className="sk4-text-base font-medium">{item.name}</span>
                    <span className="sk4-text-xs text-sk4-medium-gray block">{item.description}</span>
                  </div>
                </a>
              );
            })}
          </nav>

          {/* Create Wave Button - Enhanced */}
          {onCreateWave && (
            <div className="mt-auto">
              <button
                onClick={onCreateWave}
                className="w-full py-sk4-md px-sk4-md bg-gradient-to-r from-sk4-orange to-sk4-orange/90 text-white sk4-text-base font-semibold sk4-btn hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200"
              >
                <Plus className="w-5 h-5 inline mr-2" />
                웨이브 만들기
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}