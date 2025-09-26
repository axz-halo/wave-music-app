'use client';

import { usePathname } from 'next/navigation';
import { Home, Radio, Trophy, User } from 'lucide-react';

interface NavigationProps {
  onCreateWave?: () => void;
}

const navigationItems = [
  { name: '파도', href: '/feed', icon: Home },
  { name: '라디오', href: '/station', icon: Radio },
  { name: '챌린지', href: '/challenge', icon: Trophy },
  { name: '마이', href: '/profile', icon: User },
];

export default function Navigation({ onCreateWave }: NavigationProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Bottom Navigation - iOS 16+ style */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 sk4-safe-area">
        <div className="h-16 backdrop-blur-md bg-white/80 border-t border-sk4-gray flex">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <a
                key={item.name}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex flex-col items-center justify-center flex-1 h-full sk4-interactive ${
                  isActive ? 'text-sk4-orange' : 'text-sk4-dark-gray'
                }`}
              >
                <Icon className={`w-6 h-6 mb-0.5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                <span className="sk4-text-xs">{item.name}</span>
                <span className={`absolute bottom-1 w-8 h-[3px] rounded-full transition-all ${isActive ? 'bg-sk4-orange' : 'bg-transparent'}`} />
              </a>
            );
          })}
        </div>
        {/* Floating CTA per tab */}
        <div className="pointer-events-none">
          {pathname === '/feed' && null}
          {pathname === '/station' && null}
          {pathname === '/challenge' && (
            <a href="/challenge/create" className="pointer-events-auto fixed bottom-20 right-4 px-4 h-14 rounded-full bg-sk4-orange text-sk4-white flex items-center shadow-lg sk4-btn sk4-float">챌린지 만들기</a>
          )}
          {pathname === '/profile' && (
            <a href="/profile/playlists" className="pointer-events-auto fixed bottom-20 right-4 px-4 h-14 rounded-full bg-sk4-orange text-sk4-white flex items-center shadow-lg sk4-btn sk4-float">플레이리스트 만들기</a>
          )}
        </div>
      </nav>

      {/* Desktop Sidebar - SK4 Design */}
      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-56 bg-sk4-white border-r border-sk4-gray z-30">
        <div className="sk4-spacing-lg">
          {/* Logo */}
          <div className="flex items-center space-x-sk4-md mb-sk4-xl">
            <div className="w-8 h-8 bg-sk4-orange flex items-center justify-center">
              <span className="text-sk4-white font-medium text-sk4-sm">W</span>
            </div>
            <span className="sk4-text-large-title">WAVE</span>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-sk4-sm">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-sk4-md py-sk4-sm px-sk4-md sk4-interactive ${
                    isActive 
                      ? 'bg-sk4-light-gray text-sk4-orange' 
                      : 'text-sk4-dark-gray hover:bg-sk4-light-gray'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="sk4-text-base">{item.name}</span>
                </a>
              );
            })}
          </nav>

          {/* Create Wave Button */}
          {onCreateWave && (
            <button
              onClick={onCreateWave}
              className="w-full mt-sk4-lg py-sk4-md bg-sk4-orange text-sk4-white sk4-text-sm font-medium sk4-btn hover:bg-opacity-90"
            >
              웨이브 만들기
            </button>
          )}
        </div>
      </aside>
    </>
  );
}