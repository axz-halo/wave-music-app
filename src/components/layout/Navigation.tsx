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
      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-50 safe-area-pb">
        <div className="flex items-center justify-around max-w-sm mx-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <a
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all min-w-0 flex-1 ${
                  isActive
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className={`w-6 h-6 mb-1 ${isActive ? 'scale-110' : ''}`} />
                <span className="text-xs font-medium truncate">{item.name}</span>
              </a>
            );
          })}
        </div>
      </nav>

      {/* Desktop Sidebar Navigation */}
      <nav className="hidden lg:flex fixed left-0 top-0 bottom-0 w-56 bg-white border-r border-gray-200 flex-col z-40">
        <div className="p-4">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <h1 className="text-lg font-bold text-gray-900">WAVE</h1>
          </div>
          
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium text-sm">{item.name}</span>
                </a>
              );
            })}
          </div>

          {/* Auth controls removed per request */}
        </div>
      </nav>

      {/* Mobile Floating Create Button */}
      <button 
        onClick={onCreateWave}
        className="lg:hidden fixed bottom-20 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all z-40 flex items-center justify-center"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Desktop Create Button */}
      <button 
        onClick={onCreateWave}
        className="hidden lg:flex fixed bottom-6 right-6 w-16 h-16 bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all z-40 flex items-center justify-center"
      >
        <Plus className="w-7 h-7" />
      </button>
    </>
  );
}
