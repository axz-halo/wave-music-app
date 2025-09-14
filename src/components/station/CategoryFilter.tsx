'use client';

const CATEGORIES = ['전체','K-Pop','Hip-Hop','Rock','Electronic','Jazz','Classical','Indie','R&B','Pop','Folk'];

export default function CategoryFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex overflow-x-auto gap-2 pb-1">
      {CATEGORIES.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={`px-3 py-2 rounded-full text-sm whitespace-nowrap transition ${
            value === c ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}


