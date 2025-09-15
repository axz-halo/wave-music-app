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
      {/* Mobile Bottom Navigation - SK4 Design */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 sk4-safe-area">
        <div className="sk4-nav-tab">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <a
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 ${
                  isActive ? 'sk4-nav-tab active' : 'sk4-nav-tab'
                }`}
              >
                <Icon className={`w-5 h-5 mb-1 ${isActive ? 'scale-110' : ''}`} />
                <span className="sk4-text-xs">{item.name}</span>
              </a>
            );
          })}
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
                  className={`flex items-center space-x-sk4-md py-sk4-sm px-sk4-md transition-all duration-200 ${
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
              className="w-full mt-sk4-lg py-sk4-md bg-sk4-orange text-sk4-white sk4-text-sm font-medium transition-all duration-200 hover:bg-opacity-90"
            >
              웨이브 만들기
            </button>
          )}
        </div>
      </aside>
    </>
  );
}