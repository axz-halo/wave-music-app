'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // You can log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 max-w-md w-full text-center">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">문제가 발생했어요</h2>
        <p className="text-sm text-gray-600 mb-4">페이지를 불러오는 중 오류가 발생했습니다. 다시 시도해 주세요.</p>
        <button onClick={() => reset()} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">다시 시도</button>
      </div>
    </div>
  );
}


