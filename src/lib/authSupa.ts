import supabase from './supabaseClient';

export type SupaUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, any>;
};

export async function signInWithGoogle(): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined },
  });
}

export async function signOutUser(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export function onAuthStateChange(callback: (user: SupaUser | null) => void) {
  if (!supabase) return () => {};
  const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
  return () => sub.subscription.unsubscribe();
}

export function getCurrentUser(): SupaUser | null {
  if (!supabase) return null;
  // Synchronous access not available; callers should use onAuthStateChange
  return null;
}

export async function ensureSignedIn(): Promise<SupaUser | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  if (data?.session?.user) return data.session.user;
  
  // 클라이언트 사이드에서만 로그인 리다이렉트
  if (typeof window !== 'undefined') {
    await signInWithGoogle();
  }
  
  return null;
}

// 서버 사이드에서 사용할 함수
export async function getCurrentSession(): Promise<SupaUser | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session?.user || null;
}

// 서버 사이드용 인증된 사용자 가져오기 함수
export async function getAuthenticatedUser(req: { headers: { get: (name: string) => string | null } }): Promise<SupaUser | null> {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No valid auth header found');
      return null;
    }
    
    const token = authHeader.replace('Bearer ', '');
    if (!token || token === 'null' || token === 'undefined') {
      console.log('Invalid token');
      return null;
    }
    
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      }
    );
    
    const { data: { user }, error } = await supabaseAuth.auth.getUser(token);
    if (error || !user) {
      console.log('Auth error:', error?.message || 'No user found');
      return null;
    }
    
    return user as SupaUser;
  } catch (error) {
    console.log('getAuthenticatedUser error:', error);
    return null;
  }
}

export async function getOrCreateProfile(user: SupaUser) {
  if (!supabase || !user?.id) return null;
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (data) return data;
  const nickname = user.user_metadata?.full_name || '사용자';
  const profile_image = user.user_metadata?.avatar_url || null;
  const email = user.email || null;
  await supabase.from('profiles').insert({ id: user.id, nickname, profile_image, email });
  return { id: user.id, nickname, profile_image, email, followers: 0, following: 0, created_at: new Date().toISOString() };
}