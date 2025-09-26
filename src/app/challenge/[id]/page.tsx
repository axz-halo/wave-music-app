'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { dummyChallenges, dummyUsers, dummyTracks } from '@/lib/dummy-data';
import Navigation from '@/components/layout/Navigation';
import RecommendTrackModal from '@/components/challenge/RecommendTrackModal';
import supabase from '@/lib/supabaseClient';
import { ensureSignedIn } from '@/lib/authSupa';
import toast from 'react-hot-toast';

export default function ChallengeDetailPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string);
  const [challenge, setChallenge] = useState<any>(() => dummyChallenges.find(c => c.id === id) || dummyChallenges[0]);
  useEffect(() => {
    const load = async () => {
      if (!supabase) return;
      const { data } = await supabase.from('challenges').select('*').eq('id', id).maybeSingle();
      if (data) {
        setChallenge({
          id: data.id,
          title: data.title,
          description: data.description || '',
          creator: dummyUsers[0],
          status: data.status || 'upcoming',
          startDate: data.start_date,
          endDate: data.end_date,
          votingEndDate: data.voting_end_date || data.end_date,
          targetTrackCount: data.target_track_count || 20,
          currentTrackCount: data.current_track_count || 0,
          participants: data.participants || 0,
          rules: data.rules || { genres: [], moods: [], allowDuplicates: false, votingMethod: 'like' },
          thumbnailUrl: data.thumbnail_url || '/default-challenge.jpg',
          createdAt: data.created_at,
        });
      }
    };
    load();
  }, [id]);
  const [isParticipant, setIsParticipant] = useState(false);
  const [participants, setParticipants] = useState<number>(challenge.participants);
  const [votes, setVotes] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    (challenge as any).submissions?.forEach((s: any) => { map[s.track.id] = s.votes || 0; });
    // seed with some dummy tracks for demo
    dummyTracks.slice(0,3).forEach(t=>{ if (!(t.id in map)) map[t.id] = Math.floor(Math.random()*10); });
    return map;
  });

  const leaderTrackId = Object.keys(votes).sort((a,b)=>votes[b]-votes[a])[0];
  const leaderTrack = dummyTracks.find(t=>t.id===leaderTrackId) || dummyTracks[0];
  const [isRecommendOpen, setIsRecommendOpen] = useState(false);
  const [submissions, setSubmissions] = useState<Array<{ id: string; userId: string; externalId: string; reason: string; status?: string }>>([]);

  useEffect(() => {
    const loadSubs = async () => {
      if (!supabase || !id) return;
      const { data } = await supabase
        .from('submissions')
        .select('id,user_id,external_id,reason,status,created_at')
        .eq('challenge_id', id)
        .order('created_at', { ascending: false });
      if (data) {
        setSubmissions(data.map((s:any)=>({ id: s.id, userId: s.user_id, externalId: s.external_id, reason: s.reason || '', status: s.status })));
        setParticipants(data.length);
        setChallenge((prev:any)=> ({ ...prev, currentTrackCount: data.length }));
      }
    };
    loadSubs();
    const ch = (supabase as any)
      .channel(`subs-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions', filter: `challenge_id=eq.${id}` }, loadSubs)
      .subscribe();
    return () => { try { (supabase as any).removeChannel(ch); } catch {} };
  }, [id]);

  // countdown logic
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const targetTime = useMemo(() => {
    if (challenge.status === 'upcoming') return new Date(challenge.startDate);
    if (challenge.status === 'active') return new Date(challenge.votingEndDate || challenge.endDate);
    return null;
  }, [challenge]);

  const countdown = useMemo(() => {
    if (!targetTime) return { label: '완료됨', hh: '00', mm: '00', ss: '00' };
    const diff = Math.max(0, targetTime.getTime() - now.getTime());
    const totalSec = Math.floor(diff / 1000);
    const hh = String(Math.floor(totalSec / 3600)).padStart(2, '0');
    const mm = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
    const ss = String(totalSec % 60).padStart(2, '0');
    const label = challenge.status === 'upcoming' ? '시작까지' : '마감까지';
    return { label, hh, mm, ss };
  }, [now, targetTime, challenge.status]);

  const handleOpenSubmit = () => {
    if (challenge.status !== 'active') {
      toast.error('진행 중인 챌린지에서만 제출할 수 있습니다.');
      return;
    }
    setIsRecommendOpen(true);
  };

  const previewAvatars = [dummyUsers[0], dummyUsers[1], dummyUsers[2]].map(u=>u.profileImage || '/default-avatar.png');

  return (
    <div className="min-h-screen bg-cream-50 pb-20 lg:pb-0 lg:ml-56">
      {/* Desktop Header */}
      <header className="hidden lg:block bg-cream-100 border-b border-cream-200 px-6 py-4 sticky top-0 z-30 shadow-minimal">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-hierarchy-2xl font-semibold text-beige-800">{challenge.title}</h1>
          <button onClick={handleOpenSubmit} className="px-sk4-md py-sk4-sm rounded sk4-text-sm font-medium transition-all duration-200 bg-sk4-orange text-sk4-white hover:bg-opacity-90">트랙 제출하기</button>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="lg:hidden bg-cream-100 border-b border-cream-200 px-4 py-4 sticky top-0 z-40 shadow-minimal">
        <div className="flex items-center justify-between">
          <h1 className="text-hierarchy-xl font-semibold text-beige-800">{challenge.title}</h1>
          <button onClick={handleOpenSubmit} className="px-sk4-md py-sk4-sm rounded sk4-text-sm font-medium transition-all duration-200 bg-sk4-orange text-sk4-white hover:bg-opacity-90">제출</button>
        </div>
      </header>

      <div className="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Countdown header */}
        <section className="bg-sk4-white border border-sk4-gray p-4 font-sk4-mono">
          <div className="flex items-center justify-between">
            <div className="sk4-text-xs text-sk4-dark-gray">{countdown.label}</div>
            <div className="sk4-text-lg text-sk4-charcoal tracking-widest">{countdown.hh}:{countdown.mm}:{countdown.ss}</div>
          </div>
        </section>

        <section className="bg-cream-100 rounded-medium shadow-minimal border border-cream-200 p-6">
          <p className="text-sm text-beige-700 mb-4">{challenge.description}</p>
          <div className="text-xs text-beige-600 mb-2">상태: {challenge.status} • 목표 {challenge.targetTrackCount}곡 • 현재 {challenge.currentTrackCount}곡 • 참여자 {participants}명</div>
          <div className="text-xs text-beige-600 mb-2">기간: {new Date(challenge.startDate).toLocaleDateString()} ~ {new Date(challenge.endDate).toLocaleDateString()} / 투표 마감 {new Date(challenge.votingEndDate).toLocaleDateString()}</div>
          <div className="text-xs text-beige-600 mb-4">규칙: 장르 {challenge.rules.genres.join(', ')} / 무드 {challenge.rules.moods.join(', ')} / 투표 {challenge.rules.votingMethod}</div>

          {/* Creator */}
          <div className="flex items-center gap-2 mb-4">
            <img src={challenge.creator?.profileImage || '/default-avatar.png'} className="w-6 h-6 rounded-full border border-cream-200" alt={challenge.creator?.nickname || 'creator'} />
            <span className="text-xs text-beige-700">만든 사람: {challenge.creator?.nickname || '사용자'}</span>
          </div>

          <div className="flex items-center gap-2 mb-4">
            {participants > 0 ? (
              <>
                {previewAvatars.map((src, i)=> (
                  <img key={i} src={src} alt="participant" className="w-8 h-8 rounded-full border-2 border-cream-100 -ml-2 first:ml-0 shadow-minimal" />
                ))}
                <span className="text-xs text-beige-600">외 {Math.max(0, participants - previewAvatars.length)}명 참여중</span>
              </>
            ) : (
              <span className="text-xs text-beige-600">아직 참여하는 사람이 없음</span>
            )}
          </div>

          <button onClick={handleOpenSubmit} className="w-full py-sk4-md rounded sk4-text-sm font-medium transition-all duration-200 bg-sk4-orange text-sk4-white hover:bg-opacity-90">트랙 제출하기</button>
        </section>

        {/* Leader Preview */}
        <section className="bg-cream-100 rounded-medium shadow-minimal border border-cream-200 p-6">
          <h3 className="text-hierarchy-lg font-semibold text-beige-800 mb-4">대표곡(실시간 선두)</h3>
          <div className="flex items-center gap-4">
            <img src={leaderTrack.thumbnailUrl} alt={leaderTrack.title} className="w-20 h-20 rounded-medium shadow-minimal" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-beige-800 truncate">{leaderTrack.title}</p>
              <p className="text-sm text-beige-600 truncate">{leaderTrack.artist}</p>
              <p className="text-xs text-beige-500">득표수 {votes[leaderTrack.id] || 0}</p>
            </div>
          </div>
        </section>

        {/* Voting */}
        <section className="bg-cream-100 rounded-medium shadow-minimal border border-cream-200 p-6">
          <h3 className="text-hierarchy-lg font-semibold text-beige-800 mb-4">투표하기</h3>
          <div className="mb-sk4-md sk4-text-sm text-sk4-dark-gray">추천하고 싶은 곡이 있나요? <button onClick={handleOpenSubmit} className="ml-sk4-sm px-sk4-md py-sk4-sm bg-sk4-orange text-sk4-white rounded transition-all duration-200">트랙 제출하기</button></div>
          <ul className="space-y-3">
            {dummyTracks.slice(0,5).map(t=> (
              <li key={t.id} className="py-3 px-4 bg-cream-50 rounded-medium shadow-minimal border border-cream-200 flex items-center gap-3">
                <img src={t.thumbnailUrl} alt={t.title} className="w-12 h-12 rounded-medium shadow-minimal" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-beige-800 truncate">{t.title}</p>
                  <p className="text-xs text-beige-600 truncate">{t.artist}</p>
                </div>
                <div className="flex items-center gap-sk4-sm sk4-text-xs">
                  <button onClick={()=>setVotes(v=>({ ...v, [t.id]: (v[t.id]||0)+1 }))} className="px-sk4-sm py-sk4-sm rounded border border-sk4-gray bg-sk4-white hover:bg-sk4-light-gray transition-all duration-200">👍</button>
                  <button onClick={()=>setVotes(v=>({ ...v, [t.id]: Math.max(0,(v[t.id]||0)-1) }))} className="px-sk4-sm py-sk4-sm rounded border border-sk4-gray bg-sk4-white hover:bg-sk4-light-gray transition-all duration-200">👎</button>
                  <span className="text-sk4-dark-gray w-10 text-right font-medium">{votes[t.id]||0}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <Navigation onCreateWave={() => {}} />
      <RecommendTrackModal
        isOpen={isRecommendOpen}
        onClose={()=>setIsRecommendOpen(false)}
        onSubmit={async (youtubeId, reason)=>{
          if (challenge.status !== 'active') {
            toast.error('진행 중인 챌린지만 제출할 수 있습니다');
            return;
          }
          const u = await ensureSignedIn();
          if (!u || !supabase) return;
          // enforce 3 submissions per user
          const { count: myCount } = await supabase
            .from('submissions')
            .select('*', { count: 'exact', head: true })
            .eq('challenge_id', challenge.id)
            .eq('user_id', u.id);
          if ((myCount || 0) >= 3) {
            toast.error('최대 3곡까지 제출할 수 있습니다');
            return;
          }
          // prevent duplicate YouTube ID in challenge
          const { data: dup } = await supabase
            .from('submissions')
            .select('id')
            .eq('challenge_id', challenge.id)
            .eq('external_id', youtubeId)
            .maybeSingle();
          if (dup) {
            toast.error('이미 제출된 트랙입니다');
            return;
          }
          const { error } = await supabase.from('submissions').insert({
            challenge_id: challenge.id,
            user_id: u.id,
            platform: 'youtube',
            external_id: youtubeId,
            reason,
            status: 'pending',
          });
          if (error) {
            toast.error(error.message);
            return;
          }
          toast.success('제출이 접수되었습니다');
          setIsRecommendOpen(false);
        }}
      />
      {/* Submissions List */}
      <div className="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto px-4 pb-8">
        <section className="bg-cream-100 rounded-medium shadow-minimal border border-cream-200 p-6 mt-4">
          <h3 className="text-hierarchy-lg font-semibold text-beige-800 mb-4">제출 목록</h3>
          {submissions.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-beige-700">아직 제출된 트랙이 없습니다.</p>
              <button onClick={handleOpenSubmit} className="mt-3 px-sk4-md py-sk4-sm rounded bg-sk4-orange text-sk4-white">트랙을 제출해보세요</button>
            </div>
          ) : (
            <ul className="space-y-3">
              {submissions.map((s)=>{
                const user = dummyUsers[0];
                const thumb = `https://img.youtube.com/vi/${s.externalId}/mqdefault.jpg`;
                return (
                  <li key={s.id} className="flex items-start gap-3 p-3 bg-cream-50 rounded-medium border border-cream-200">
                    <img src={user.profileImage || '/default-avatar.png'} className="w-8 h-8 rounded-full" alt={user.nickname} />
                    <img src={thumb} className="w-12 h-12 rounded-medium" alt={s.externalId} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-beige-800 truncate">YouTube: {s.externalId}</p>
                      <p className="text-xs text-beige-600 truncate">{user.nickname}</p>
                      {s.reason && <p className="text-xs text-beige-500 mt-1 line-clamp-2">“{s.reason}”</p>}
                      <span className="inline-block mt-1 text-[10px] text-beige-600 bg-cream-200 px-2 py-0.5 rounded">{s.status==='approved'?'승인됨':'승인 대기'}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}


