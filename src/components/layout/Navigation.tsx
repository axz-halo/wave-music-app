'use client';

import { usePathname } from 'next/navigation';
import { Home, Radio, Trophy, User, Plus } from 'lucide-react';

const navigationItems = [
  { name: '파도', href: '/feed', icon: Home },
  { name: '스테이션', href: '/station', icon: Radio },
  { name: '챌린지', href: '/challenge', icon: Trophy },
  { name: '마이페이지', href: '/profile', icon: User },
];

interface NavigationProps {
  onCreateWave?: () => void;
}

export default function Navigation({ onCreateWave }: NavigationProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Bottom Navigation - Minimal Floating Design */}
      <nav className="lg:hidden fixed bottom-4 left-4 right-4 z-50 safe-area-pb">
        <div className="flex items-center justify-around max-w-sm mx-auto bg-cream-100/95 backdrop-blur-sm rounded-medium shadow-minimal border border-cream-200 p-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <a
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center py-2 px-3 rounded-medium transition-all duration-150 min-w-0 flex-1 ${
                  isActive
                    ? 'bg-primary-500 text-white shadow-minimal'
                    : 'text-beige-600 hover:text-primary-500 hover:bg-cream-200'
                }`}
              >
                <Icon className={`w-5 h-5 mb-1 ${isActive ? 'scale-110' : ''}`} />
                <span className="text-xs font-medium truncate">{item.name}</span>
              </a>
            );
          })}
        </div>
      </nav>

      {/* Desktop Sidebar Navigation */}
      <nav className="hidden lg:flex fixed left-0 top-0 bottom-0 w-56 bg-surface-100 border-r border-neutral-200/50 flex-col z-40 shadow-soft">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-primary-500 rounded-medium flex items-center justify-center shadow-tactile">
              <span className="text-white font-bold text-xl">W</span>
            </div>
            <h1 className="text-hierarchy-xl font-semibold text-neutral-900">WAVE</h1>
          </div>
          
          <div className="space-y-3">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-medium transition-all duration-200 shadow-tactile hover:shadow-soft ${
                    isActive
                      ? 'bg-primary-500 text-white'
                      : 'text-neutral-700 hover:bg-surface-200'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </a>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Floating Create Button - Only on Feed */}
      {pathname === '/feed' && (
        <button 
          onClick={onCreateWave}
          className="lg:hidden fixed bottom-20 right-4 w-14 h-14 bg-primary-500 text-white rounded-full shadow-tactile hover:shadow-soft hover:scale-105 transition-all duration-200 z-40 flex items-center justify-center"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Desktop Create Button - Only on Feed */}
      {pathname === '/feed' && (
        <button 
          onClick={onCreateWave}
          className="hidden lg:flex fixed bottom-6 right-6 w-16 h-16 bg-primary-500 text-white rounded-full shadow-tactile hover:shadow-soft hover:scale-105 transition-all duration-200 z-40 flex items-center justify-center"
        >
          <Plus className="w-7 h-7" />
        </button>
      )}
    </>
  );
}
