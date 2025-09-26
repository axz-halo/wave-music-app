'use client';import { useEffect, useMemo, useState } from 'react';
import { Radio } from 'lucide-react';
import supabase from '@/lib/supabaseClient';

export default function RadioDisplay() {
  const [now, setNow] = useState(new Date());
  const [todayWaves, setTodayWaves] = useState<number>(0);
  const [todayTracksSaved, setTodayTracksSaved] = useState<number>(0);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let isCancelled = false;
    const fetchStats = async () => {
      if (!supabase) return;
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const startIso = start.toISOString();
      const { count: wavesCount } = await supabase
        .from('waves')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startIso);
      const { count: savedCount } = await supabase
        .from('playlist_tracks')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startIso);
      if (!isCancelled) {
        setTodayWaves(wavesCount || 0);
        setTodayTracksSaved(savedCount || 0);
      }
    };
    fetchStats();
    // subscribe to realtime inserts for instant updates
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const channel = (supabase as any)
      .channel('radio-stats')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'waves' }, fetchStats)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'playlist_tracks' }, fetchStats)
      .subscribe();
    const poll = setInterval(fetchStats, 15000);
    return () => { isCancelled = true; clearInterval(poll); try { (supabase as any).removeChannel(channel); } catch {}
    };
  }, []);

  const dateStr = now.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' });
  const timeStr = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div className="sk4-radio-display p-sk4-md h-32 sm:h-36 md:h-40 relative overflow-hidden">
      {/* Dot matrix background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="grid grid-cols-20 grid-rows-8 h-full w-full">
          {Array.from({ length: 160 }).map((_, i) => (
            <div key={i} className="w-1 h-1 bg-sk4-radio-text" />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center h-full space-y-sk4-sm font-sk4-mono">
        {/* Row 1: Icon - Wave Playlist | Live */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-sk4-sm">
            <Radio className="w-4 h-4 sm:w-5 sm:h-5 text-sk4-radio-text" />
            <div className="sk4-text-xs sm:sk4-text-sm text-sk4-white">Wave Playlist</div>
          </div>
          <div className="flex items-center space-x-sk4-sm">
            <div className="flex space-x-1">
              <div className="w-1 h-1 rounded-full bg-sk4-orange animate-pulse" />
              <div className="w-1 h-1 rounded-full bg-sk4-orange animate-pulse" />
              <div className="w-1 h-1 rounded-full bg-sk4-orange animate-pulse" />
            </div>
            <div className="sk4-text-xs text-sk4-white">LIVE</div>
          </div>
        </div>

        {/* Row 2: Date & Time */}
        <div className="text-center">
          <div className="sk4-text-sm text-sk4-white">{dateStr}</div>
          <div className="sk4-text-xs text-sk4-radio-text">{timeStr}</div>
        </div>

        {/* Row 3: Today's Stats */}
        <div className="text-center">
          <div className="sk4-text-xs text-sk4-radio-text mb-1">Today's Stats</div>
          <div className="sk4-text-sm text-sk4-white">
            {todayWaves} waves | {todayTracksSaved} Tracks
          </div>
        </div>
      </div>
    </div>
  );
}