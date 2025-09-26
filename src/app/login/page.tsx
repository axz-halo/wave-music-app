'use client';

import { signInWithGoogle, signOutUser } from '@/lib/authSupa';
import { useEffect, useState } from 'react';
import { onAuthStateChange } from '@/lib/authSupa';

export default function LoginPage() {
  const [isAuthed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<{ id: string; email?: string | null; name?: string } | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChange((u) => {
      setAuthed(!!u);
      setUserInfo(u ? { id: u.id, email: u.email, name: u.user_metadata?.full_name } : null);
      setLoading(false);
    });
    return () => unsub && unsub();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-sk4-off-white p-sk4-md">
      <div className="w-full max-w-sm bg-sk4-white border border-sk4-gray p-sk4-lg">
        <h1 className="sk4-text-lg font-medium text-sk4-charcoal mb-sk4-sm">로그인</h1>
        <p className="sk4-text-sm text-sk4-dark-gray mb-sk4-md">Google 계정으로 로그인하여 서비스를 이용하세요.</p>
        <button
          disabled={loading}
          onClick={() => signInWithGoogle()}
          className="w-full py-sk4-sm bg-sk4-orange text-sk4-white rounded disabled:bg-sk4-gray"
        >
          Google로 로그인
        </button>
        {isAuthed && (
          <>
            <div className="mt-sk4-md sk4-text-xs text-sk4-dark-gray">
              <div>UID: {userInfo?.id}</div>
              <div>Email: {userInfo?.email || '-'}</div>
              <div>Name: {userInfo?.name || '-'}</div>
            </div>
            <button onClick={() => signOutUser()} className="w-full py-sk4-sm mt-sk4-sm border border-sk4-gray rounded">로그아웃</button>
          </>
        )}
      </div>
    </div>
  );
}
