import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import HealthGraphsSuite from '../components/HealthGraphsSuite';

export default function TrendsPage() {
  const [range, setRange] = useState('6 month');
  const ranges = ['1 month', '3 month', '6 month', '1 year', 'All Time'];

  return (
    <div className="space-y-8 select-none max-w-6xl mx-auto">
      {/* Header & Time Range Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-black">Trends & Analytics</h1>
          <p className="text-sm text-[#666666] font-medium">
            Visualize how your health biometrics and medical reports change over time
          </p>
        </div>

        {/* Time-range pill selector */}
        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-[#E5E0D5] shadow-vault-card">
          <span className="text-xs font-bold text-[#777777] px-2 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-[#C9A574]" /> Range:
          </span>
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                range === r
                  ? 'bg-black text-white shadow-xs'
                  : 'bg-[#FAF8F5] text-[#666666] hover:bg-[#F4F0E8] hover:text-black'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Recommended Health Graphs Grid */}
        <HealthGraphSuite totalReports={26}/>
    </div>
  );
}