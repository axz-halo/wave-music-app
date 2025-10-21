'use client';

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  icon?: LucideIcon;
  action?: ReactNode;
  mobileAction?: ReactNode;
}

export default function PageHeader({ title, icon: Icon, action, mobileAction }: PageHeaderProps) {
  return (
    <>
      {/* Desktop Header */}
      <header className="hidden lg:block bg-white/95 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {Icon && (
              <div className="w-10 h-10 bg-gradient-to-br from-sk4-orange to-sk4-orange-light rounded-xl flex items-center justify-center shadow-sk4-soft">
                <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
            )}
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          </div>
          {action && <div>{action}</div>}
        </div>
      </header>

      {/* Mobile Header */}
      <header className="lg:hidden bg-white/95 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-40">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            {Icon && (
              <div className="w-9 h-9 bg-gradient-to-br from-sk4-orange to-sk4-orange-light rounded-xl flex items-center justify-center shadow-sk4-soft">
                <Icon className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
              </div>
            )}
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          </div>
          {mobileAction && <div>{mobileAction}</div>}
        </div>
      </header>
    </>
  );
}




