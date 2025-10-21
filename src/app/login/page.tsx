'use client';

import { signInWithGoogle, signOutUser } from '@/lib/authSupa';
import { useEffect, useState } from 'react';
import { onAuthStateChange } from '@/lib/authSupa';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [isAuthed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<{ id: string; email?: string | null; name?: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChange((u) => {
      setAuthed(!!u);
      setUserInfo(u ? { id: u.id, email: u.email, name: u.user_metadata?.full_name } : null);
      setLoading(false);
      
      // 로그인 성공 시 자동으로 Feed 페이지로 리다이렉트
      if (u) {
        console.log('✅ 로그인 성공, Feed 페이지로 리다이렉트');
        router.push('/feed');
      }
    });
    return () => unsub && unsub();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sk4-off-white via-sk4-white to-sk4-light-gray p-sk4-md">
      <div className="w-full max-w-md">
        {/* Logo & Branding */}
        <div className="text-center mb-sk4-xl">
          <div className="w-20 h-20 bg-gradient-to-br from-sk4-orange to-sk4-orange-light rounded-2xl flex items-center justify-center mx-auto mb-sk4-md shadow-sk4-medium animate-sk4-float">
            <span className="text-white font-bold text-4xl">W</span>
          </div>
          <h1 className="text-4xl font-bold text-sk4-charcoal mb-2">WAVE</h1>
          <p className="sk4-spotify-subtitle">음악으로 연결되는 새로운 세상</p>
        </div>

        {/* Login Card */}
        <div className="sk4-spotify-card p-sk4-xl">
          {!isAuthed ? (
            <>
              <h2 className="sk4-spotify-title text-center mb-sk4-sm">시작하기</h2>
              <p className="sk4-spotify-subtitle text-center mb-sk4-lg">
                Google 계정으로 간편하게 로그인하세요
              </p>
              
              <button
                disabled={loading}
                onClick={() => signInWithGoogle()}
                className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>로그인 중...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span>Google로 계속하기</span>
                  </>
                )}
              </button>

              <div className="mt-sk4-lg pt-sk4-lg border-t border-sk4-gray">
                <div className="grid grid-cols-3 gap-sk4-md text-center">
                  <div>
                    <div className="text-2xl mb-1">🎵</div>
                    <p className="sk4-spotify-caption">음악 공유</p>
                  </div>
                  <div>
                    <div className="text-2xl mb-1">🏆</div>
                    <p className="sk4-spotify-caption">챌린지</p>
                  </div>
                  <div>
                    <div className="text-2xl mb-1">👥</div>
                    <p className="sk4-spotify-caption">소셜 네트워크</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-sk4-lg">
                <div className="w-16 h-16 bg-gradient-to-br from-sk4-orange to-sk4-orange-light rounded-full flex items-center justify-center mx-auto mb-sk4-md">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="sk4-spotify-title mb-2">로그인 성공!</h2>
                <p className="sk4-spotify-subtitle">환영합니다, {userInfo?.name || '사용자'}님</p>
              </div>

              <div className="bg-sk4-light-gray rounded-lg p-sk4-md mb-sk4-lg space-y-2">
                <div className="flex justify-between">
                  <span className="sk4-spotify-caption">이메일</span>
                  <span className="sk4-spotify-subtitle">{userInfo?.email || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="sk4-spotify-caption">사용자 ID</span>
                  <span className="sk4-spotify-caption font-mono">{userInfo?.id.slice(0, 8)}...</span>
                </div>
              </div>

              <button 
                onClick={() => signOutUser()} 
                className="w-full btn-secondary"
              >
                로그아웃
              </button>

              <a 
                href="/feed" 
                className="block w-full btn-primary text-center mt-3"
              >
                피드로 이동 →
              </a>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-sk4-lg">
          <p className="sk4-spotify-caption">
            로그인하면 WAVE의{' '}
            <a href="#" className="text-sk4-orange hover:text-sk4-orange-light">이용약관</a>
            {' '}및{' '}
            <a href="#" className="text-sk4-orange hover:text-sk4-orange-light">개인정보처리방침</a>
            에 동의하게 됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
