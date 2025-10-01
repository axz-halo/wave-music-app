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
      {/* Mobile Bottom Navigation - Enhanced with glass morphism */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 sk4-safe-area">
        <div className="h-20 bg-white/80 backdrop-blur-xl border-t border-white/20 shadow-sk4-hard">
          <div className="h-full flex relative">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/50 to-transparent pointer-events-none" />
            
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <a
                  key={item.name}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative flex flex-col items-center justify-center flex-1 h-full group z-10 ${
                    isActive ? 'text-sk4-orange' : 'text-sk4-dark-gray'
                  }`}
                >
                  <div className={`p-2 rounded-2xl transition-all duration-300 transform ${
                    isActive 
                      ? 'bg-gradient-to-br from-sk4-orange to-sk4-orange-light shadow-sk4-glow scale-110' 
                      : 'group-hover:bg-sk4-light-gray group-hover:scale-105'
                  }`}>
                    <Icon className={`w-6 h-6 transition-all duration-300 ${isActive ? 'text-white' : 'group-hover:text-sk4-orange'}`} />
                  </div>
                  <span className={`sk4-text-xs font-semibold mt-1.5 transition-all duration-300 ${
                    isActive ? 'text-sk4-orange scale-105' : 'text-sk4-dark-gray group-hover:text-sk4-orange'
                  }`}>
                    {item.name}
                  </span>
                  {/* Enhanced indicator */}
                  <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-1 rounded-full transition-all duration-300 ${
                    isActive ? 'bg-sk4-orange w-12 opacity-100' : 'bg-transparent w-0 opacity-0'
                  }`} />
                </a>
              );
            })}
          </div>
        </div>

        {/* Floating CTA per tab - Enhanced with gradient and animations */}
        <div className="pointer-events-none">
          {pathname === '/feed' && onCreateWave && (
            <button
              onClick={onCreateWave}
              className="pointer-events-auto fixed bottom-24 right-4 w-16 h-16 rounded-full bg-gradient-to-br from-sk4-orange to-sk4-orange-light text-white flex items-center justify-center shadow-sk4-hard hover:shadow-sk4-glow-strong sk4-btn animate-sk4-float border-3 border-white/50 hover:scale-110 transition-all duration-300"
            >
              <Plus className="w-7 h-7" />
            </button>
          )}
          {pathname === '/station' && (
            <button
              onClick={() => (document.querySelector('[data-upload-trigger]') as HTMLElement)?.click()}
              className="pointer-events-auto fixed bottom-24 right-4 w-16 h-16 rounded-full bg-gradient-to-br from-sk4-orange to-sk4-orange-light text-white flex items-center justify-center shadow-sk4-hard hover:shadow-sk4-glow-strong sk4-btn animate-sk4-float border-3 border-white/50 hover:scale-110 transition-all duration-300"
            >
              <Plus className="w-7 h-7" />
            </button>
          )}
          {pathname === '/challenge' && (
            <a href="/challenge/create" className="pointer-events-auto fixed bottom-24 right-4 w-16 h-16 rounded-full bg-gradient-to-br from-sk4-orange to-sk4-orange-light text-white flex items-center justify-center shadow-sk4-hard hover:shadow-sk4-glow-strong sk4-btn animate-sk4-float border-3 border-white/50 hover:scale-110 transition-all duration-300">
              <Plus className="w-7 h-7" />
            </a>
          )}
          {pathname === '/profile' && (
            <a href="/profile/playlists" className="pointer-events-auto fixed bottom-24 right-4 w-16 h-16 rounded-full bg-gradient-to-br from-sk4-orange to-sk4-orange-light text-white flex items-center justify-center shadow-sk4-hard hover:shadow-sk4-glow-strong sk4-btn animate-sk4-float border-3 border-white/50 hover:scale-110 transition-all duration-300">
              <Plus className="w-7 h-7" />
            </a>
          )}
        </div>
      </nav>

      {/* Desktop Sidebar - Enhanced with glass morphism */}
      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-64 bg-white/80 backdrop-blur-xl border-r border-white/30 shadow-sk4-medium z-30">
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
                  className={`flex items-center space-x-sk4-md py-3 px-4 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                    isActive
                      ? 'bg-gradient-to-r from-sk4-orange/20 to-sk4-orange/10 text-sk4-orange shadow-sk4-soft'
                      : 'text-sk4-dark-gray hover:bg-gradient-to-r hover:from-sk4-light-gray hover:to-sk4-off-white hover:text-sk4-orange'
                  }`}
                >
                  {/* Active indicator bar */}
                  <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full transition-all duration-300 ${
                    isActive ? 'h-8 bg-sk4-orange' : 'h-0 bg-transparent'
                  }`} />
                  
                  <div className={`p-2 rounded-xl transition-all duration-300 ${
                    isActive 
                      ? 'bg-gradient-to-br from-sk4-orange to-sk4-orange-light shadow-sk4-glow' 
                      : 'bg-sk4-light-gray group-hover:bg-sk4-orange/20 group-hover:scale-110'
                  }`}>
                    <Icon className={`w-5 h-5 transition-all duration-300 ${
                      isActive ? 'text-white' : 'text-sk4-dark-gray group-hover:text-sk4-orange'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <span className={`sk4-text-base font-semibold block transition-all duration-300 ${
                      isActive ? 'text-sk4-orange' : 'group-hover:text-sk4-orange'
                    }`}>{item.name}</span>
                    <span className="sk4-text-xs text-sk4-medium-gray block group-hover:text-sk4-dark-gray transition-colors duration-300">{item.description}</span>
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
                className="w-full py-4 px-4 bg-gradient-to-br from-sk4-orange to-sk4-orange-light text-white sk4-text-base font-bold rounded-xl shadow-sk4-medium hover:shadow-sk4-glow-strong transform hover:scale-105 transition-all duration-300 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <div className="relative flex items-center justify-center">
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