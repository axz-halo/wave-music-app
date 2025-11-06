'use client';

import { AlertCircle, RefreshCw, Home, ArrowLeft, WifiOff, ServerCrash, XCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export type ErrorType = 'network' | 'server' | 'notfound' | 'permission' | 'validation' | 'generic';

interface EnhancedErrorProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  details?: string;
  onRetry?: () => void;
  showHomeButton?: boolean;
  showBackButton?: boolean;
}

const errorConfig = {
  network: {
    icon: WifiOff,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
    defaultTitle: '네트워크 연결 오류',
    defaultMessage: '인터넷 연결을 확인하고 다시 시도해주세요.',
  },
  server: {
    icon: ServerCrash,
    iconColor: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200',
    defaultTitle: '서버 오류',
    defaultMessage: '서버에서 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
  },
  notfound: {
    icon: XCircle,
    iconColor: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
    defaultTitle: '페이지를 찾을 수 없습니다',
    defaultMessage: '요청하신 페이지가 존재하지 않거나 삭제되었습니다.',
  },
  permission: {
    icon: AlertTriangle,
    iconColor: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-200',
    defaultTitle: '권한이 필요합니다',
    defaultMessage: '이 기능을 사용하려면 로그인이 필요합니다.',
  },
  validation: {
    icon: AlertCircle,
    iconColor: 'text-orange-600',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-200',
    defaultTitle: '입력 오류',
    defaultMessage: '입력하신 정보를 확인해주세요.',
  },
  generic: {
    icon: AlertCircle,
    iconColor: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200',
    defaultTitle: '오류가 발생했습니다',
    defaultMessage: '예상치 못한 오류가 발생했습니다.',
  },
};

export default function EnhancedError({ 
  type = 'generic',
  title,
  message,
  details,
  onRetry,
  showHomeButton = true,
  showBackButton = false,
}: EnhancedErrorProps) {
  const config = errorConfig[type];
  const Icon = config.icon;
  const displayTitle = title || config.defaultTitle;
  const displayMessage = message || config.defaultMessage;

  return (
    <div className="flex justify-center items-center py-sk4-xl px-sk4-md">
      <div className="max-w-md w-full sk4-spotify-card p-sk4-xl text-center">
        {/* Icon */}
        <div className={`w-16 h-16 ${config.bgColor} rounded-full flex items-center justify-center mx-auto mb-sk4-lg shadow-sk4-soft`}>
          <Icon className={`w-8 h-8 ${config.iconColor}`} />
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-sk4-charcoal mb-sk4-sm">
          {displayTitle}
        </h3>

        {/* Message */}
        <p className="sk4-spotify-subtitle mb-sk4-md">
          {displayMessage}
        </p>

        {/* Details */}
        {details && (
          <div className="bg-sk4-light-gray rounded-lg p-sk4-md mb-sk4-lg">
            <p className="sk4-spotify-caption text-left font-mono">
              {details}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col space-y-sk4-sm">
          {onRetry && (
            <button
              onClick={onRetry}
              className="sk4-spotify-btn w-full flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-5 h-5" />
              <span>다시 시도</span>
            </button>
          )}

          <div className="flex space-x-sk4-sm">
            {showBackButton && (
              <button
                onClick={() => window.history.back()}
                className="sk4-spotify-btn-secondary flex-1 flex items-center justify-center space-x-2"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>뒤로</span>
              </button>
            )}

            {showHomeButton && (
              <Link
                href="/feed"
                className={`sk4-spotify-btn-secondary flex items-center justify-center space-x-2 ${
                  showBackButton ? 'flex-1' : 'w-full'
                }`}
              >
                <Home className="w-5 h-5" />
                <span>홈으로</span>
              </Link>
            )}
          </div>
        </div>

        {/* Help Text */}
        <p className="sk4-spotify-caption mt-sk4-lg">
          문제가 계속되면{' '}
          <a href="mailto:support@wave.com" className="text-sk4-orange hover:text-sk4-orange-light underline">
            고객센터
          </a>
          로 문의해주세요.
        </p>
      </div>
    </div>
  );
}

// Specific error components for common cases
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <EnhancedError
      type="network"
      onRetry={onRetry}
      showHomeButton={false}
    />
  );
}

export function ServerError({ onRetry }: { onRetry?: () => void }) {
  return (
    <EnhancedError
      type="server"
      onRetry={onRetry}
    />
  );
}

export function NotFoundError() {
  return (
    <EnhancedError
      type="notfound"
      showHomeButton={true}
      showBackButton={true}
    />
  );
}

export function PermissionError({ message }: { message?: string }) {
  return (
    <EnhancedError
      type="permission"
      message={message}
      showHomeButton={true}
    />
  );
}

export function ValidationError({ message, details }: { message?: string; details?: string }) {
  return (
    <EnhancedError
      type="validation"
      message={message}
      details={details}
      showHomeButton={false}
      showBackButton={true}
    />
  );
}







