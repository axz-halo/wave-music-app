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
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0 lg:ml-56">
      <header className="hidden lg:block bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{challenge.title}</h1>
          <button onClick={handleToggleJoin} className={`px-4 py-2 rounded-lg text-sm font-medium ${isParticipant ? 'bg-gray-100 text-gray-700' : 'bg-blue-600 text-white'}`}>{isParticipant ? '참여 취소' : '참여하기'}</button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-700 mb-2">{challenge.description}</p>
          <div className="text-xs text-gray-500">상태: {challenge.status} • 목표 {challenge.targetTrackCount}곡 • 현재 {challenge.currentTrackCount}곡 • 참여자 {participants}명</div>
          <div className="text-xs text-gray-500 mt-1">기간: {new Date(challenge.startDate).toLocaleDateString()} ~ {new Date(challenge.endDate).toLocaleDateString()} / 투표 마감 {new Date(challenge.votingEndDate).toLocaleDateString()}</div>
          <div className="mt-3 text-xs text-gray-600">규칙: 장르 {challenge.rules.genres.join(', ')} / 무드 {challenge.rules.moods.join(', ')} / 투표 {challenge.rules.votingMethod}</div>

          <div className="mt-4 flex items-center gap-2">
            {previewAvatars.map((src, i)=> (
              <img key={i} src={src} alt="participant" className="w-7 h-7 rounded-full border border-white -ml-2 first:ml-0" />
            ))}
            <span className="text-xs text-gray-500">외 {Math.max(0, participants - previewAvatars.length)}명 참여중</span>
          </div>

          <div className="mt-4">
            <button onClick={handleToggleJoin} className={`w-full py-3 rounded-lg text-sm font-medium ${isParticipant ? 'bg-gray-100 text-gray-700' : 'bg-blue-600 text-white'}`}>{isParticipant ? '참여 취소' : '참여하기'}</button>
          </div>
        </section>

        {/* Leader Preview */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">대표곡(실시간 선두)</h3>
          <div className="flex items-center gap-4">
            <img src={leaderTrack.thumbnailUrl} alt={leaderTrack.title} className="w-20 h-20 rounded-lg" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{leaderTrack.title}</p>
              <p className="text-sm text-gray-600 truncate">{leaderTrack.artist}</p>
              <p className="text-xs text-gray-500">득표수 {votes[leaderTrack.id] || 0}</p>
            </div>
          </div>
        </section>

        {/* Voting */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">투표하기</h3>
          <div className="mb-3 text-sm text-gray-600">추천하고 싶은 곡이 있나요? <button onClick={()=>setIsRecommendOpen(true)} className="ml-2 px-3 py-1.5 rounded bg-blue-50 text-blue-700 border border-blue-200">곡 추천하기</button></div>
          <ul className="divide-y divide-gray-100">
            {dummyTracks.slice(0,5).map(t=> (
              <li key={t.id} className="py-3 flex items-center gap-3">
                <img src={t.thumbnailUrl} alt={t.title} className="w-12 h-12 rounded" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 truncate">{t.title}</p>
                  <p className="text-xs text-gray-500 truncate">{t.artist}</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <button onClick={()=>setVotes(v=>({ ...v, [t.id]: (v[t.id]||0)+1 }))} className="px-3 py-1.5 rounded border border-gray-200 bg-white hover:bg-gray-50">Upvote</button>
                  <button onClick={()=>setVotes(v=>({ ...v, [t.id]: Math.max(0,(v[t.id]||0)-1) }))} className="px-3 py-1.5 rounded border border-gray-200 bg-white hover:bg-gray-50">Downvote</button>
                  <span className="text-gray-600 w-10 text-right">{votes[t.id]||0}</span>
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


