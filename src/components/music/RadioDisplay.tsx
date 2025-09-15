'use client';

import { useMemo } from 'react';
import { dummyWaves } from '@/lib/dummy-data';

export default function RadioDisplay() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { todayWaves, todaySaves } = useMemo(() => {
    let waves = 0;
    let saves = 0;
    for (const w of dummyWaves) {
      const t = new Date(w.timestamp);
      if (t >= today) {
        waves += 1;
        saves += w.saves || 0;
      }
    }
    return { todayWaves: waves, todaySaves: saves };
  }, []);

  const dateStr = new Date().toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <div className="sk4-radio-display p-sk4-md">
      <div className="flex items-center justify-between mb-sk4-md">
        <h3 className="sk4-text-lg font-medium">WAVE RADIO</h3>
        <span className="sk4-text-sm text-sk4-radio-text">{dateStr}</span>
      </div>

      <div className="grid grid-cols-2 gap-sk4-md">
        <div className="bg-sk4-charcoal bg-opacity-30 rounded p-sk4-sm border border-sk4-dark-gray text-center">
          <div className="sk4-text-xs text-sk4-radio-text mb-sk4-sm">공유된 웨이브</div>
          <div className="sk4-text-lg font-medium text-sk4-white">{todayWaves}</div>
        </div>
        <div className="bg-sk4-charcoal bg-opacity-30 rounded p-sk4-sm border border-sk4-dark-gray text-center">
          <div className="sk4-text-xs text-sk4-radio-text mb-sk4-sm">저장된 트랙</div>
          <div className="sk4-text-lg font-medium text-sk4-white">{todaySaves}</div>
        </div>
      </div>
    </div>
  );
}