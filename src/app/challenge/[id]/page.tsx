'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { dummyChallenges, dummyUsers, dummyTracks } from '@/lib/dummy-data';
import Navigation from '@/components/layout/Navigation';
import RecommendTrackModal from '@/components/challenge/RecommendTrackModal';

export default function ChallengeDetailPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string);
  const challenge = useMemo(() => dummyChallenges.find(c => c.id === id) || dummyChallenges[0], [id]);
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

  const handleToggleJoin = () => {
    setIsParticipant((prev)=>{
      const next = !prev;
      setParticipants(p => next ? p + 1 : Math.max(0, p - 1));
      challenge.participants = next ? challenge.participants + 1 : Math.max(0, challenge.participants - 1);
      return next;
    });
  };

  const previewAvatars = [dummyUsers[0], dummyUsers[1], dummyUsers[2]].map(u=>u.profileImage || '/default-avatar.png');

  return (
    <div className="min-h-screen bg-cream-50 pb-20 lg:pb-0 lg:ml-56">
      {/* Desktop Header */}
      <header className="hidden lg:block bg-cream-100 border-b border-cream-200 px-6 py-4 sticky top-0 z-30 shadow-minimal">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-hierarchy-2xl font-semibold text-beige-800">{challenge.title}</h1>
          <button onClick={handleToggleJoin} className={`px-4 py-2 rounded-medium text-sm font-medium transition-all duration-150 shadow-minimal ${isParticipant ? 'bg-cream-200 text-beige-700 hover:bg-cream-300' : 'bg-primary-500 text-white hover:bg-primary-600'}`}>{isParticipant ? '참여 취소' : '참여하기'}</button>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="lg:hidden bg-cream-100 border-b border-cream-200 px-4 py-4 sticky top-0 z-40 shadow-minimal">
        <div className="flex items-center justify-between">
          <h1 className="text-hierarchy-xl font-semibold text-beige-800">{challenge.title}</h1>
          <button onClick={handleToggleJoin} className={`px-3 py-2 rounded-medium text-sm font-medium transition-all duration-150 shadow-minimal ${isParticipant ? 'bg-cream-200 text-beige-700' : 'bg-primary-500 text-white'}`}>{isParticipant ? '취소' : '참여'}</button>
        </div>
      </header>

      <div className="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto px-4 py-6 space-y-6">
        <section className="bg-cream-100 rounded-medium shadow-minimal border border-cream-200 p-6">
          <p className="text-sm text-beige-700 mb-4">{challenge.description}</p>
          <div className="text-xs text-beige-600 mb-2">상태: {challenge.status} • 목표 {challenge.targetTrackCount}곡 • 현재 {challenge.currentTrackCount}곡 • 참여자 {participants}명</div>
          <div className="text-xs text-beige-600 mb-2">기간: {new Date(challenge.startDate).toLocaleDateString()} ~ {new Date(challenge.endDate).toLocaleDateString()} / 투표 마감 {new Date(challenge.votingEndDate).toLocaleDateString()}</div>
          <div className="text-xs text-beige-600 mb-4">규칙: 장르 {challenge.rules.genres.join(', ')} / 무드 {challenge.rules.moods.join(', ')} / 투표 {challenge.rules.votingMethod}</div>

          <div className="flex items-center gap-2 mb-4">
            {previewAvatars.map((src, i)=> (
              <img key={i} src={src} alt="participant" className="w-8 h-8 rounded-full border-2 border-cream-100 -ml-2 first:ml-0 shadow-minimal" />
            ))}
            <span className="text-xs text-beige-600">외 {Math.max(0, participants - previewAvatars.length)}명 참여중</span>
          </div>

          <button onClick={handleToggleJoin} className={`w-full py-3 rounded-medium text-sm font-medium transition-all duration-150 shadow-minimal ${isParticipant ? 'bg-cream-200 text-beige-700 hover:bg-cream-300' : 'bg-primary-500 text-white hover:bg-primary-600'}`}>{isParticipant ? '참여 취소' : '참여하기'}</button>
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
          <div className="mb-4 text-sm text-beige-600">추천하고 싶은 곡이 있나요? <button onClick={()=>setIsRecommendOpen(true)} className="ml-2 px-3 py-1.5 rounded-medium bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100 transition-all duration-150">곡 추천하기</button></div>
          <ul className="space-y-3">
            {dummyTracks.slice(0,5).map(t=> (
              <li key={t.id} className="py-3 px-4 bg-cream-50 rounded-medium shadow-minimal border border-cream-200 flex items-center gap-3">
                <img src={t.thumbnailUrl} alt={t.title} className="w-12 h-12 rounded-medium shadow-minimal" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-beige-800 truncate">{t.title}</p>
                  <p className="text-xs text-beige-600 truncate">{t.artist}</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <button onClick={()=>setVotes(v=>({ ...v, [t.id]: (v[t.id]||0)+1 }))} className="px-3 py-1.5 rounded-medium border border-cream-200 bg-cream-100 hover:bg-cream-200 transition-all duration-150 shadow-minimal">👍</button>
                  <button onClick={()=>setVotes(v=>({ ...v, [t.id]: Math.max(0,(v[t.id]||0)-1) }))} className="px-3 py-1.5 rounded-medium border border-cream-200 bg-cream-100 hover:bg-cream-200 transition-all duration-150 shadow-minimal">👎</button>
                  <span className="text-beige-600 w-10 text-right font-medium">{votes[t.id]||0}</span>
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
        onSubmit={(youtubeId, reason)=>{
          // 데모: 투표 리스트에 항목 추가
          const found = dummyTracks.find(t=>t.externalId===youtubeId || t.id===youtubeId);
          if (found) {
            setVotes(v=>({ ...v, [found.id]: (v[found.id]||0) }));
          } else {
            // fallback: 첫 트랙의 카피 생성 없이 단순 표 등록
            setVotes(v=>({ ...v, [youtubeId]: 0 }));
          }
          setIsRecommendOpen(false);
        }}
      />
    </div>
  );
}


