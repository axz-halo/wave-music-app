'use client';

const CATEGORIES = ['전체','K-Pop','Hip-Hop','Rock','Electronic','Jazz','Classical','Indie','R&B','Pop','Folk'];

export default function CategoryFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide">
      {CATEGORIES.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={`px-sk4-sm py-sk4-sm rounded text-sm whitespace-nowrap transition ${
            value === c ? 'bg-sk4-orange text-sk4-white border border-sk4-orange' : 'bg-sk4-white border border-sk4-gray text-sk4-charcoal hover:bg-sk4-light-gray'
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}


