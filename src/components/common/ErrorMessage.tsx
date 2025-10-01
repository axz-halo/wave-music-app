'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ 
  title = '오류가 발생했습니다',
  message,
  onRetry 
}: ErrorMessageProps) {
  return (
    <div className="flex justify-center items-center py-sk4-xl">
      <div className="max-w-md w-full bg-white rounded-lg border border-red-200 p-sk4-lg text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-sk4-md">
          <AlertCircle className="w-6 h-6 text-red-600" />
        </div>
        <h3 className="sk4-text-base font-semibold text-sk4-charcoal mb-sk4-sm">
          {title}
        </h3>
        <p className="sk4-text-sm text-sk4-medium-gray mb-sk4-md">
          {message}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="sk4-btn px-4 py-2 bg-sk4-orange text-white hover:bg-sk4-orange/90 transition-all duration-200 flex items-center justify-center mx-auto space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>다시 시도</span>
          </button>
        )}
      </div>
    </div>
  );
}

