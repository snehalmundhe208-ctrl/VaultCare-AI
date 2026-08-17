import React from 'react';
import { 
  Heart, 
  Droplet, 
  Activity, 
  Sun, 
  FileText, 
  PieChart, 
  Scale, 
  Calendar,
  Upload,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import {
  getHealthScoreData,
  getHemoglobinData,
  getBloodSugarData,
  getCholesterolData,
  getVitaminDData,
  getKidneyFunctionData,
  getBloodPressureData,
  getHeartRateData,
  getWeightData,
  getMonthlyReportCounts,
  getReportsCategoryDistribution,
  getAppointmentOverviewData
} from '../utils/biomarkerExtractor';

// Helper: Calculate cubic bezier SVG path from points [{x, y}]
function getCubicBezierPath(points) {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x},${points[0].y} L ${points[0].x},${points[0].y}`;

  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

// Reusable Empty State Card Inside Chart
function EmptyChartState({ parameterName, categoryHint }) {
  return (
    <div className="h-36 w-full flex flex-col items-center justify-center text-center px-4 bg-[#FAF8F5]/70 rounded-xl border border-dashed border-[#E5E0D5] my-2 space-y-1.5">
      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-400 border border-[#E5E0D5] shadow-2xs">
        <Activity className="w-4 h-4 text-[#C9A574]" />
      </div>
      <p className="text-xs font-bold text-black">No {parameterName} data recorded yet</p>
      <p className="text-[11px] text-gray-500 max-w-xs font-medium leading-tight">
        Upload a <span className="font-bold text-[#916D41]">{categoryHint}</span> report to plot verified trends over time.
      </p>
    </div>
  );
}

// ==========================================
// 1. Health Score Trend (Area Chart)
// ==========================================
export function HealthScoreTrendChart({ reports: propReports }) {
  const { reports: contextReports } = useVault();
  const rawReports = propReports || contextReports || [];
  const { hasData, score, status, points, trend } = getHealthScoreData(rawReports);

  if (!hasData || points.length === 0) {
    return (
      <div className="bg-white p-5 rounded-2xl border border-[#E5E0D5] shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Heart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-black leading-tight">Health Score Trend</h3>
              <p className="text-[10px] font-bold text-gray-400">Area Chart</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-gray-500">Overall wellness</span>
        </div>
        <EmptyChartState parameterName="Health Score" categoryHint="Medical / Lab" />
      </div>
    );
  }

  const svgPoints = points.map((pt, idx) => {
    const total = Math.max(points.length, 2);
    const x = 45 + (idx / (total - 1)) * 225;
    const y = 100 - (pt.score / 100) * 80;
    return { x, y, val: pt.score, month: pt.shortDate || pt.month };
  });

  const lineD = getCubicBezierPath(svgPoints);
  const areaD = `${lineD} L ${svgPoints[svgPoints.length - 1].x},100 L ${svgPoints[0].x},100 Z`;

  return (
    <div className="bg-white p-5 rounded-2xl border border-[#E5E0D5] shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <Heart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-black leading-tight">Health Score Trend</h3>
            <p className="text-[10px] font-bold text-gray-400">Area Chart</p>
          </div>
        </div>
        <span className="text-[11px] font-semibold text-gray-500">Overall wellness</span>
      </div>

      <div className="absolute right-5 top-12 z-10">
        <div className="bg-emerald-50/90 border border-emerald-300 rounded-xl px-2.5 py-1 text-center shadow-xs">
          <div className="text-sm font-black text-emerald-700 leading-none">{score}</div>
          <div className="text-[9px] font-bold text-emerald-600 mt-0.5">{status}</div>
        </div>
      </div>

      <div className="w-full h-36 pt-2">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 320 130">
          <defs>
            <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          <text x="5" y="12" fill="#999999" fontSize="8" fontWeight="700">Score</text>
          
          {[
            { label: '100', y: 20 },
            { label: '75', y: 40 },
            { label: '50', y: 60 },
            { label: '25', y: 80 },
            { label: '0', y: 100 }
          ].map((tick, i) => (
            <g key={i}>
              <text x="24" y={tick.y + 3} textAnchor="end" fill="#A0AEC0" fontSize="8" fontWeight="600">{tick.label}</text>
              <line x1="28" y1={tick.y} x2="270" y2={tick.y} stroke="#F0EDE6" strokeDasharray="2 3" strokeWidth="1" />
            </g>
          ))}

          <path d={areaD} fill="url(#scoreGrad)" />
          <path d={lineD} fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />

          {svgPoints.map((pt, i) => (
            <g key={i}>
              <circle cx={pt.x} cy={pt.y} r="3.5" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5" />
              {i === svgPoints.length - 1 && (
                <circle cx={pt.x} cy={pt.y} r="5" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
              )}
            </g>
          ))}

          {svgPoints.map((pt, i) => (
            <text key={i} x={pt.x} y="118" textAnchor="middle" fill="#718096" fontSize="9" fontWeight="600">
              {pt.month}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

// ==========================================
// 2. Hemoglobin Trend (Line Chart)
// ==========================================
export function HemoglobinChart({ reports: propReports }) {
  const { reports: contextReports } = useVault();
  const rawReports = propReports || contextReports || [];
  const { hasData, latest, status, badgeColor, points, referenceRange } = getHemoglobinData(rawReports);

  if (!hasData || points.length === 0) {
    return (
      <div className="bg-white p-5 rounded-2xl border border-[#E5E0D5] shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <Droplet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-black leading-tight">Hemoglobin (g/dL)</h3>
              <p className="text-[10px] font-bold text-gray-400">Line Chart</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-gray-400">{referenceRange || 'Normal: 12.0–16.0 g/dL'}</span>
        </div>
        <EmptyChartState parameterName="Hemoglobin" categoryHint="CBC / Blood Test" />
      </div>
    );
  }

  const svgPoints = points.map((pt, idx) => {
    const total = Math.max(points.length, 2);
    const x = 45 + (idx / (total - 1)) * 225;
    // Map 10-18 g/dL to y: 100 to 20
    const clamped = Math.min(Math.max(pt.value, 10), 18);
    const y = 100 - ((clamped - 10) / 8) * 80;
    return { x, y, val: pt.value, month: pt.shortDate || pt.month };
  });

  const lineD = getCubicBezierPath(svgPoints);
  const isNormal = status === 'Normal';

  return (
    <div className="bg-white p-5 rounded-2xl border border-[#E5E0D5] shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <Droplet className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-black leading-tight">Hemoglobin (g/dL)</h3>
            <p className="text-[10px] font-bold text-gray-400">Line Chart</p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-gray-400">{referenceRange}</span>
      </div>

      <div className="absolute right-5 top-12 z-10">
        <div className={`border rounded-xl px-2.5 py-1 text-center shadow-xs ${
          isNormal ? 'bg-emerald-50/90 border-emerald-300 text-emerald-700' : 'bg-rose-50/90 border-rose-300 text-rose-700'
        }`}>
          <div className="text-sm font-black leading-none">{latest}</div>
          <div className="text-[9px] font-bold mt-0.5">{status}</div>
        </div>
      </div>

      <div className="w-full h-36 pt-2">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 320 130">
          <text x="5" y="12" fill="#999999" fontSize="8" fontWeight="700">g/dL</text>
          
          {[
            { label: '18', y: 20 },
            { label: '16', y: 40, isRef: true, refText: 'High' },
            { label: '14', y: 60 },
            { label: '12', y: 80, isRef: true, refText: 'Low' },
            { label: '10', y: 100 }
          ].map((tick, i) => (
            <g key={i}>
              <text x="24" y={tick.y + 3} textAnchor="end" fill="#A0AEC0" fontSize="8" fontWeight="600">{tick.label}</text>
              <line x1="28" y1={tick.y} x2="270" y2={tick.y} stroke={tick.isRef ? '#E2E8F0' : '#F0EDE6'} strokeDasharray={tick.isRef ? '4 3' : '2 3'} strokeWidth="1" />
              {tick.refText && (
                <text x="272" y={tick.y + 3} fill="#A0AEC0" fontSize="7" fontWeight="600">{tick.refText}</text>
              )}
            </g>
          ))}

          <path d={lineD} fill="none" stroke="#E11D48" strokeWidth="2.5" strokeLinecap="round" />

          {svgPoints.map((pt, i) => (
            <g key={i}>
              <circle cx={pt.x} cy={pt.y} r="3.5" fill="#E11D48" stroke="#FFFFFF" strokeWidth="1.5" />
              <text x={pt.x} y={pt.y - 7} textAnchor="middle" fill="#BE123C" fontSize="8" fontWeight="bold">
                {pt.val}
              </text>
            </g>
          ))}

          {svgPoints.map((pt, i) => (
            <text key={i} x={pt.x} y="118" textAnchor="middle" fill="#718096" fontSize="9" fontWeight="600">
              {pt.month}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

// ==========================================
// 3. Blood Sugar (Fasting) (Line Chart)
// ==========================================
export function BloodSugarChart({ reports: propReports }) {
  const { reports: contextReports } = useVault();
  const rawReports = propReports || contextReports || [];
  const { hasData, latest, status, badgeColor, points, referenceRange } = getBloodSugarData(rawReports);

  if (!hasData || points.length === 0) {
    return (
      <div className="bg-white p-5 rounded-2xl border border-[#E5E0D5] shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-black leading-tight">Blood Sugar (Fasting)</h3>
              <p className="text-[10px] font-bold text-gray-400">Line Chart</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-gray-400">{referenceRange || 'Normal: 70–99 mg/dL'}</span>
        </div>
        <EmptyChartState parameterName="Blood Sugar" categoryHint="Blood Sugar / Diabetic Panel" />
      </div>
    );
  }

  const svgPoints = points.map((pt, idx) => {
    const total = Math.max(points.length, 2);
    const x = 45 + (idx / (total - 1)) * 225;
    // Map 60-140 mg/dL to y: 100 to 20
    const clamped = Math.min(Math.max(pt.value, 60), 140);
    const y = 100 - ((clamped - 60) / 80) * 80;
    return { x, y, val: pt.value, month: pt.shortDate || pt.month };
  });

  const lineD = getCubicBezierPath(svgPoints);
  const isNormal = status === 'Normal';

  return (
    <div className="bg-white p-5 rounded-2xl border border-[#E5E0D5] shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-black leading-tight">Blood Sugar (Fasting)</h3>
            <p className="text-[10px] font-bold text-gray-400">Line Chart</p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-gray-400">{referenceRange}</span>
      </div>

      <div className="absolute right-5 top-12 z-10">
        <div className={`border rounded-xl px-2.5 py-1 text-center shadow-xs ${
          isNormal ? 'bg-emerald-50/90 border-emerald-300 text-emerald-700' : 'bg-amber-50/90 border-amber-300 text-amber-700'
        }`}>
          <div className="text-sm font-black leading-none">{latest}</div>
          <div className="text-[9px] font-bold mt-0.5">{status}</div>
        </div>
      </div>

      <div className="w-full h-36 pt-2">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 320 130">
          <text x="5" y="12" fill="#999999" fontSize="8" fontWeight="700">mg/dL</text>
          
          {[
            { label: '140', y: 20 },
            { label: '120', y: 40 },
            { label: '100', y: 60, isRef: true, refText: 'High' },
            { label: '80', y: 80 },
            { label: '60', y: 100, isRef: true, refText: 'Low' }
          ].map((tick, i) => (
            <g key={i}>
              <text x="24" y={tick.y + 3} textAnchor="end" fill="#A0AEC0" fontSize="8" fontWeight="600">{tick.label}</text>
              <line x1="28" y1={tick.y} x2="270" y2={tick.y} stroke={tick.isRef ? '#E2E8F0' : '#F0EDE6'} strokeDasharray={tick.isRef ? '4 3' : '2 3'} strokeWidth="1" />
              {tick.refText && (
                <text x="272" y={tick.y + 3} fill="#A0AEC0" fontSize="7" fontWeight="600">{tick.refText}</text>
              )}
            </g>
          ))}

          <path d={lineD} fill="none" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" />

          {svgPoints.map((pt, i) => (
            <g key={i}>
              <circle cx={pt.x} cy={pt.y} r="3.5" fill="#D97706" stroke="#FFFFFF" strokeWidth="1.5" />
              <text x={pt.x} y={pt.y - 7} textAnchor="middle" fill="#B45309" fontSize="8" fontWeight="bold">
                {pt.val}
              </text>
            </g>
          ))}

          {svgPoints.map((pt, i) => (
            <text key={i} x={pt.x} y="118" textAnchor="middle" fill="#718096" fontSize="9" fontWeight="600">
              {pt.month}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

// ==========================================
// 4. Cholesterol Profile (Multi-Line Chart)
// ==========================================
export function CholesterolProfileChart({ reports: propReports }) {
  const { reports: contextReports } = useVault();
  const rawReports = propReports || contextReports || [];
  const { hasData, latest, status, points, referenceRange } = getCholesterolData(rawReports);

  if (!hasData || points.length === 0) {
    return (
      <div className="bg-white p-5 rounded-2xl border border-[#E5E0D5] shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
              <Droplet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-black leading-tight">Cholesterol Profile</h3>
              <p className="text-[10px] font-bold text-gray-400">Multi-Line Chart</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-gray-400">{referenceRange || 'Optimal: < 200 mg/dL'}</span>
        </div>
        <EmptyChartState parameterName="Lipid Profile" categoryHint="Lipid / Cholesterol Panel" />
      </div>
    );
  }

  const svgPoints = points.map((pt, idx) => {
    const total = Math.max(points.length, 2);
    const x = 45 + (idx / (total - 1)) * 225;
    // Map 0-250 to y: 100 to 20
    const totalY = 100 - (Math.min(pt.total, 250) / 250) * 80;
    const ldlY = 100 - (Math.min(pt.ldl, 250) / 250) * 80;
    const hdlY = 100 - (Math.min(pt.hdl, 250) / 250) * 80;
    return { x, totalY, ldlY, hdlY, total: pt.total, ldl: pt.ldl, hdl: pt.hdl, month: pt.shortDate || pt.month };
  });

  const totalD = getCubicBezierPath(svgPoints.map(p => ({ x: p.x, y: p.totalY })));
  const ldlD = getCubicBezierPath(svgPoints.map(p => ({ x: p.x, y: p.ldlY })));
  const hdlD = getCubicBezierPath(svgPoints.map(p => ({ x: p.x, y: p.hdlY })));

  return (
    <div className="bg-white p-5 rounded-2xl border border-[#E5E0D5] shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
            <Droplet className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-black leading-tight">Cholesterol Profile</h3>
            <p className="text-[10px] font-bold text-gray-400">Multi-Line Chart</p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-gray-400">{referenceRange}</span>
      </div>

      <div className="absolute right-5 top-12 z-10">
        <div className="bg-purple-50/90 border border-purple-300 rounded-xl px-2.5 py-1 text-center shadow-xs">
          <div className="text-[11px] font-black text-purple-700 leading-tight">
            T:{latest?.total || 188} <span className="text-[9px] text-amber-600">L:{latest?.ldl || 112}</span> <span className="text-[9px] text-emerald-600">H:{latest?.hdl || 54}</span>
          </div>
          <div className="text-[9px] font-bold text-purple-600 mt-0.5">{status}</div>
        </div>
      </div>

      <div className="w-full h-36 pt-2">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 320 130">
          <text x="5" y="12" fill="#999999" fontSize="8" fontWeight="700">mg/dL</text>
          
          {[
            { label: '250', y: 20 },
            { label: '200', y: 36, isRef: true, refText: 'Max Desirable' },
            { label: '150', y: 52 },
            { label: '100', y: 68 },
            { label: '50', y: 84 },
            { label: '0', y: 100 }
          ].map((tick, i) => (
            <g key={i}>
              <text x="24" y={tick.y + 3} textAnchor="end" fill="#A0AEC0" fontSize="8" fontWeight="600">{tick.label}</text>
              <line x1="28" y1={tick.y} x2="270" y2={tick.y} stroke={tick.isRef ? '#E2E8F0' : '#F0EDE6'} strokeDasharray={tick.isRef ? '4 3' : '2 3'} strokeWidth="1" />
            </g>
          ))}

          {/* Lines */}
          <path d={totalD} fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" />
          <path d={ldlD} fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
          <path d={hdlD} fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />

          {svgPoints.map((pt, i) => (
            <g key={i}>
              <circle cx={pt.x} cy={pt.totalY} r="3" fill="#8B5CF6" stroke="#FFFFFF" strokeWidth="1.5" />
              <circle cx={pt.x} cy={pt.ldlY} r="2.5" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="1" />
              <circle cx={pt.x} cy={pt.hdlY} r="2.5" fill="#10B981" stroke="#FFFFFF" strokeWidth="1" />
            </g>
          ))}

          {svgPoints.map((pt, i) => (
            <text key={i} x={pt.x} y="118" textAnchor="middle" fill="#718096" fontSize="9" fontWeight="600">
              {pt.month}
            </text>
          ))}
        </svg>
      </div>

      {/* Legend Footer */}
      <div className="flex items-center justify-center gap-4 text-[10px] font-bold text-gray-500 pt-1 border-t border-[#F0EDE6]">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Total</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> LDL</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> HDL</span>
      </div>
    </div>
  );
}

// ==========================================
// 5. Vitamin D (25-OH) (Line Chart with Bands)
// ==========================================
export function VitaminDChart({ reports: propReports }) {
  const { reports: contextReports } = useVault();
  const rawReports = propReports || contextReports || [];
  const { hasData, latest, status, points, referenceRange } = getVitaminDData(rawReports);

  if (!hasData || points.length === 0) {
    return (
      <div className="bg-white p-5 rounded-2xl border border-[#E5E0D5] shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500">
              <Sun className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-black leading-tight">Vitamin D (25-OH)</h3>
              <p className="text-[10px] font-bold text-gray-400">Line Chart (with bands)</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-gray-400">{referenceRange || 'Sufficient: ≥ 30 ng/mL'}</span>
        </div>
        <EmptyChartState parameterName="Vitamin D" categoryHint="Vitamin D / Specialized Lab" />
      </div>
    );
  }

  const svgPoints = points.map((pt, idx) => {
    const total = Math.max(points.length, 2);
    const x = 45 + (idx / (total - 1)) * 225;
    const clamped = Math.min(Math.max(pt.value, 0), 60);
    const y = 100 - (clamped / 60) * 80;
    return { x, y, val: pt.value, month: pt.shortDate || pt.month };
  });

  const lineD = getCubicBezierPath(svgPoints);

  return (
    <div className="bg-white p-5 rounded-2xl border border-[#E5E0D5] shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500">
            <Sun className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-black leading-tight">Vitamin D (25-OH)</h3>
            <p className="text-[10px] font-bold text-gray-400">Line Chart (with bands)</p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-gray-400">{referenceRange}</span>
      </div>

      <div className="absolute right-5 top-12 z-10">
        <div className="bg-emerald-50/90 border border-emerald-300 rounded-xl px-2.5 py-1 text-center shadow-xs">
          <div className="text-sm font-black text-emerald-700 leading-none">{latest} <span className="text-[9px] font-medium">ng/mL</span></div>
          <div className="text-[9px] font-bold text-emerald-600 mt-0.5">{status}</div>
        </div>
      </div>

      <div className="w-full h-36 pt-2">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 320 130">
          <rect x="28" y="20" width="242" height="40" fill="#10B981" fillOpacity="0.08" />
          <rect x="28" y="60" width="242" height="13" fill="#F59E0B" fillOpacity="0.08" />
          <rect x="28" y="73" width="242" height="27" fill="#EF4444" fillOpacity="0.08" />

          <text x="272" y="32" fill="#10B981" fontSize="7" fontWeight="bold">Sufficient</text>
          <text x="272" y="68" fill="#F59E0B" fontSize="7" fontWeight="bold">Insufficient</text>
          <text x="272" y="85" fill="#EF4444" fontSize="7" fontWeight="bold">Deficient</text>

          <path d={lineD} fill="none" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" />

          {svgPoints.map((pt, i) => (
            <circle key={i} cx={pt.x} cy={pt.y} r="3.5" fill="#D97706" stroke="#FFFFFF" strokeWidth="1.5" />
          ))}

          {svgPoints.map((pt, i) => (
            <text key={i} x={pt.x} y="118" textAnchor="middle" fill="#718096" fontSize="9" fontWeight="600">
              {pt.month}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

// ==========================================
// 6. Kidney Function (eGFR) (Line Chart)
// ==========================================
export function KidneyFunctionChart({ reports: propReports }) {
  const { reports: contextReports } = useVault();
  const rawReports = propReports || contextReports || [];
  const { hasData, latest, status, points, referenceRange } = getKidneyFunctionData(rawReports);

  if (!hasData || points.length === 0) {
    return (
      <div className="bg-white p-5 rounded-2xl border border-[#E5E0D5] shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-black leading-tight">Kidney Function (eGFR)</h3>
              <p className="text-[10px] font-bold text-gray-400">Line Chart</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-gray-400">{referenceRange || 'Normal: ≥ 90 mL/min'}</span>
        </div>
        <EmptyChartState parameterName="Kidney Function (eGFR)" categoryHint="Renal / KFT Panel" />
      </div>
    );
  }

  const svgPoints = points.map((pt, idx) => {
    const total = Math.max(points.length, 2);
    const x = 45 + (idx / (total - 1)) * 225;
    const clamped = Math.min(Math.max(pt.value, 30), 120);
    const y = 100 - ((clamped - 30) / 90) * 80;
    return { x, y, val: pt.value, month: pt.shortDate || pt.month };
  });

  const lineD = getCubicBezierPath(svgPoints);

  return (
    <div className="bg-white p-5 rounded-2xl border border-[#E5E0D5] shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-black leading-tight">Kidney Function (eGFR)</h3>
            <p className="text-[10px] font-bold text-gray-400">Line Chart</p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-gray-400">{referenceRange}</span>
      </div>

      <div className="absolute right-5 top-12 z-10">
        <div className="bg-emerald-50/90 border border-emerald-300 rounded-xl px-2.5 py-1 text-center shadow-xs">
          <div className="text-sm font-black text-emerald-700 leading-none">{latest}</div>
          <div className="text-[9px] font-bold text-emerald-600 mt-0.5">{status}</div>
        </div>
      </div>

      <div className="w-full h-36 pt-2">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 320 130">
          <text x="5" y="12" fill="#999999" fontSize="8" fontWeight="700">mL/min</text>
          
          <line x1="28" y1="46" x2="270" y2="46" stroke="#10B981" strokeDasharray="3 3" strokeWidth="1" />
          <text x="272" y="49" fill="#10B981" fontSize="7" fontWeight="bold">Normal (90+)</text>

          <path d={lineD} fill="none" stroke="#0D9488" strokeWidth="2.5" strokeLinecap="round" />

          {svgPoints.map((pt, i) => (
            <circle key={i} cx={pt.x} cy={pt.y} r="3.5" fill="#0D9488" stroke="#FFFFFF" strokeWidth="1.5" />
          ))}

          {svgPoints.map((pt, i) => (
            <text key={i} x={pt.x} y="118" textAnchor="middle" fill="#718096" fontSize="9" fontWeight="600">
              {pt.month}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

// ==========================================
// 7. Report Count Over Time (Bar Chart)
// ==========================================
export function ReportCountBarChart({ reports: propReports }) {
  const { reports: contextReports } = useVault();
  const rawReports = propReports || contextReports || [];
  const { total, monthly } = getMonthlyReportCounts(rawReports);

  const maxVal = Math.max(...monthly.map(m => m.count), 4);

  return (
    <div className="bg-white p-5 rounded-2xl border border-[#E5E0D5] shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-black leading-tight">Report Count Over Time</h3>
            <p className="text-[10px] font-bold text-gray-400">Bar Chart</p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-gray-400">Total: {total} Uploads</span>
      </div>

      <div className="w-full h-36 pt-2">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 320 130">
          {[
            { label: `${maxVal}`, y: 20 },
            { label: `${Math.round(maxVal / 2)}`, y: 60 },
            { label: '0', y: 100 }
          ].map((tick, i) => (
            <g key={i}>
              <text x="24" y={tick.y + 3} textAnchor="end" fill="#A0AEC0" fontSize="8" fontWeight="600">{tick.label}</text>
              <line x1="28" y1={tick.y} x2="300" y2={tick.y} stroke="#F0EDE6" strokeDasharray="2 3" strokeWidth="1" />
            </g>
          ))}

          {monthly.map((m, i) => {
            const barHeight = (m.count / maxVal) * 80;
            const x = 50 + i * 42;
            const y = 100 - barHeight;
            return (
              <g key={i}>
                <rect x={x} y={y} width="22" height={barHeight} fill="#3B82F6" rx="4" opacity={m.count > 0 ? 0.9 : 0.2} />
                <text x={x + 11} y={y - 5} textAnchor="middle" fill="#1D4ED8" fontSize="9" fontWeight="bold">
                  {m.count}
                </text>
                <text x={x + 11} y="118" textAnchor="middle" fill="#718096" fontSize="9" fontWeight="600">
                  {m.month}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ==========================================
// 8. Reports by Type (Donut Chart)
// ==========================================
export function ReportsByTypeDonutChart({ reports: propReports }) {
  const { reports: contextReports } = useVault();
  const rawReports = propReports || contextReports || [];
  const { total, items } = getReportsCategoryDistribution(rawReports);

  return (
    <div className="bg-white p-5 rounded-2xl border border-[#E5E0D5] shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-black leading-tight">Reports by Type</h3>
            <p className="text-[10px] font-bold text-gray-400">Donut Chart</p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-gray-400">Total: {total} Records</span>
      </div>

      <div className="w-full h-36 flex items-center justify-between px-2 pt-2">
        <div className="relative w-28 h-28 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="38" fill="none" stroke="#FAF8F5" strokeWidth="14" />
            {total > 0 && items.map((item, idx) => {
              const dashArray = 2 * Math.PI * 38;
              let accumulatedPercent = items.slice(0, idx).reduce((sum, it) => sum + it.percentage, 0);
              const strokeDasharray = `${(item.percentage / 100) * dashArray} ${dashArray}`;
              const strokeDashoffset = -((accumulatedPercent / 100) * dashArray);

              return (
                <circle
                  key={idx}
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke={item.color}
                  strokeWidth="14"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                />
              );
            })}
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-lg font-black text-black leading-none">{total}</span>
            <span className="text-[8px] font-bold text-gray-400 mt-0.5">Total</span>
          </div>
        </div>

        <div className="flex-1 pl-4 space-y-1.5 max-h-32 overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-xs text-gray-400">No reports uploaded</p>
          ) : (
            items.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                  <span className="font-semibold text-gray-700 truncate">{item.label}</span>
                </div>
                <span className="font-extrabold text-black shrink-0 ml-2">{item.percentage}%</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 9. Weight Trend (Area Chart)
// ==========================================
export function WeightTrendChart({ reports: propReports }) {
  const { reports: contextReports } = useVault();
  const rawReports = propReports || contextReports || [];
  const { hasData, latest, status, points, referenceRange } = getWeightData(rawReports);

  if (!hasData || points.length === 0) {
    return (
      <div className="bg-white p-5 rounded-2xl border border-[#E5E0D5] shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-black leading-tight">Weight Trend (kg)</h3>
              <p className="text-[10px] font-bold text-gray-400">Area Chart</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-gray-400">{referenceRange}</span>
        </div>
        <EmptyChartState parameterName="Weight" categoryHint="Health Checkup / Vitals" />
      </div>
    );
  }

  const svgPoints = points.map((pt, idx) => {
    const total = Math.max(points.length, 2);
    const x = 45 + (idx / (total - 1)) * 225;
    const clamped = Math.min(Math.max(pt.value, 50), 100);
    const y = 100 - ((clamped - 50) / 50) * 80;
    return { x, y, val: pt.value, month: pt.shortDate || pt.month };
  });

  const lineD = getCubicBezierPath(svgPoints);
  const areaD = `${lineD} L ${svgPoints[svgPoints.length - 1].x},100 L ${svgPoints[0].x},100 Z`;

  return (
    <div className="bg-white p-5 rounded-2xl border border-[#E5E0D5] shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-black leading-tight">Weight Trend (kg)</h3>
            <p className="text-[10px] font-bold text-gray-400">Area Chart</p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-gray-400">{referenceRange}</span>
      </div>

      <div className="absolute right-5 top-12 z-10">
        <div className="bg-teal-50/90 border border-teal-300 rounded-xl px-2.5 py-1 text-center shadow-xs">
          <div className="text-sm font-black text-teal-700 leading-none">{latest} <span className="text-[9px]">kg</span></div>
          <div className="text-[9px] font-bold text-teal-600 mt-0.5">{status}</div>
        </div>
      </div>

      <div className="w-full h-36 pt-2">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 320 130">
          <path d={areaD} fill="#0D9488" fillOpacity="0.15" />
          <path d={lineD} fill="none" stroke="#0D9488" strokeWidth="2.5" strokeLinecap="round" />

          {svgPoints.map((pt, i) => (
            <circle key={i} cx={pt.x} cy={pt.y} r="3.5" fill="#0D9488" stroke="#FFFFFF" strokeWidth="1.5" />
          ))}

          {svgPoints.map((pt, i) => (
            <text key={i} x={pt.x} y="118" textAnchor="middle" fill="#718096" fontSize="9" fontWeight="600">
              {pt.month}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

// ==========================================
// 10. Blood Pressure Trend (Multi-Line)
// ==========================================
export function BloodPressureChart({ reports: propReports }) {
  const { reports: contextReports } = useVault();
  const rawReports = propReports || contextReports || [];
  const { hasData, latest, status, points, referenceRange } = getBloodPressureData(rawReports);

  if (!hasData || points.length === 0) {
    return (
      <div className="bg-white p-5 rounded-2xl border border-[#E5E0D5] shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-pink-50 border border-pink-200 flex items-center justify-center text-pink-600">
              <Heart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-black leading-tight">Blood Pressure (mmHg)</h3>
              <p className="text-[10px] font-bold text-gray-400">Multi-Line Chart</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-gray-400">{referenceRange}</span>
        </div>
        <EmptyChartState parameterName="Blood Pressure" categoryHint="Health Checkup / Vitals" />
      </div>
    );
  }

  const svgPoints = points.map((pt, idx) => {
    const total = Math.max(points.length, 2);
    const x = 45 + (idx / (total - 1)) * 225;
    const sysY = 100 - (pt.sys / 160) * 80;
    const diaY = 100 - (pt.dia / 160) * 80;
    return { x, sysY, diaY, sys: pt.sys, dia: pt.dia, month: pt.shortDate || pt.month };
  });

  const sysD = getCubicBezierPath(svgPoints.map(p => ({ x: p.x, y: p.sysY })));
  const diaD = getCubicBezierPath(svgPoints.map(p => ({ x: p.x, y: p.diaY })));

  return (
    <div className="bg-white p-5 rounded-2xl border border-[#E5E0D5] shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-pink-50 border border-pink-200 flex items-center justify-center text-pink-600">
            <Heart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-black leading-tight">Blood Pressure (mmHg)</h3>
            <p className="text-[10px] font-bold text-gray-400">Multi-Line Chart</p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-gray-400">{referenceRange}</span>
      </div>

      <div className="absolute right-5 top-12 z-10">
        <div className="bg-pink-50/90 border border-pink-300 rounded-xl px-2.5 py-1 text-center shadow-xs">
          <div className="text-sm font-black text-pink-700 leading-none">{latest?.sys}/{latest?.dia}</div>
          <div className="text-[9px] font-bold text-pink-600 mt-0.5">{status}</div>
        </div>
      </div>

      <div className="w-full h-36 pt-2">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 320 130">
          <path d={sysD} fill="none" stroke="#EC4899" strokeWidth="2.5" strokeLinecap="round" />
          <path d={diaD} fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />

          {svgPoints.map((pt, i) => (
            <g key={i}>
              <circle cx={pt.x} cy={pt.sysY} r="3" fill="#EC4899" stroke="#FFFFFF" strokeWidth="1.5" />
              <circle cx={pt.x} cy={pt.diaY} r="3" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="1.5" />
            </g>
          ))}

          {svgPoints.map((pt, i) => (
            <text key={i} x={pt.x} y="118" textAnchor="middle" fill="#718096" fontSize="9" fontWeight="600">
              {pt.month}
            </text>
          ))}
        </svg>
      </div>

      <div className="flex items-center justify-center gap-4 text-[10px] font-bold text-gray-500 pt-1 border-t border-[#F0EDE6]">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-pink-500"></span> Systolic</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Diastolic</span>
      </div>
    </div>
  );
}

// ==========================================
// 11. Heart Rate Trend (Line Chart)
// ==========================================
export function HeartRateChart({ reports: propReports }) {
  const { reports: contextReports } = useVault();
  const rawReports = propReports || contextReports || [];
  const { hasData, latest, status, points, referenceRange } = getHeartRateData(rawReports);

  if (!hasData || points.length === 0) {
    return (
      <div className="bg-white p-5 rounded-2xl border border-[#E5E0D5] shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <Heart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-black leading-tight">Heart Rate (BPM)</h3>
              <p className="text-[10px] font-bold text-gray-400">Line Chart</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-gray-400">{referenceRange}</span>
        </div>
        <EmptyChartState parameterName="Heart Rate" categoryHint="ECG / Vitals Report" />
      </div>
    );
  }

  const svgPoints = points.map((pt, idx) => {
    const total = Math.max(points.length, 2);
    const x = 45 + (idx / (total - 1)) * 225;
    const clamped = Math.min(Math.max(pt.value, 50), 120);
    const y = 100 - ((clamped - 50) / 70) * 80;
    return { x, y, val: pt.value, month: pt.shortDate || pt.month };
  });

  const lineD = getCubicBezierPath(svgPoints);

  return (
    <div className="bg-white p-5 rounded-2xl border border-[#E5E0D5] shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <Heart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-black leading-tight">Heart Rate (BPM)</h3>
            <p className="text-[10px] font-bold text-gray-400">Line Chart</p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-gray-400">{referenceRange}</span>
      </div>

      <div className="absolute right-5 top-12 z-10">
        <div className="bg-rose-50/90 border border-rose-300 rounded-xl px-2.5 py-1 text-center shadow-xs">
          <div className="text-sm font-black text-rose-700 leading-none">{latest} <span className="text-[9px]">bpm</span></div>
          <div className="text-[9px] font-bold text-rose-600 mt-0.5">{status}</div>
        </div>
      </div>

      <div className="w-full h-36 pt-2">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 320 130">
          <line x1="28" y1="36" x2="270" y2="36" stroke="#E2E8F0" strokeDasharray="3 3" />
          <line x1="28" y1="84" x2="270" y2="84" stroke="#E2E8F0" strokeDasharray="3 3" />

          <path d={lineD} fill="none" stroke="#E11D48" strokeWidth="2.5" strokeLinecap="round" />

          {svgPoints.map((pt, i) => (
            <circle key={i} cx={pt.x} cy={pt.y} r="3.5" fill="#E11D48" stroke="#FFFFFF" strokeWidth="1.5" />
          ))}

          {svgPoints.map((pt, i) => (
            <text key={i} x={pt.x} y="118" textAnchor="middle" fill="#718096" fontSize="9" fontWeight="600">
              {pt.month}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

// ==========================================
// 12. Appointment Overview (Bar Chart)
// ==========================================
export function AppointmentOverviewBarChart({ appointments: propAppointments }) {
  const { appointments: contextAppointments } = useVault();
  const rawAppointments = propAppointments || contextAppointments || [];
  const { total, items } = getAppointmentOverviewData(rawAppointments);

  const maxVal = Math.max(...items.map(it => it.count), 2);

  return (
    <div className="bg-white p-5 rounded-2xl border border-[#E5E0D5] shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-black leading-tight">Appointment Overview</h3>
            <p className="text-[10px] font-bold text-gray-400">Bar Chart</p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-gray-400">Total: {total} Appointments</span>
      </div>

      <div className="w-full h-36 pt-2">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 320 130">
          {items.map((item, i) => {
            const barHeight = (item.count / maxVal) * 75;
            const x = 45 + i * 65;
            const y = 100 - barHeight;
            return (
              <g key={i}>
                <rect x={x} y={y} width="32" height={barHeight} fill={item.color} rx="5" opacity={item.count > 0 ? 0.9 : 0.2} />
                <text x={x + 16} y={y - 5} textAnchor="middle" fill="#1A1A1A" fontSize="9" fontWeight="bold">
                  {item.count}
                </text>
                <text x={x + 16} y="118" textAnchor="middle" fill="#718096" fontSize="8" fontWeight="600">
                  {item.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ==========================================
// Master Suite Grid Layout
// ==========================================
export default function HealthGraphsSuite({ totalReports }) {
  const { reports, appointments } = useVault();

  return (
    <div className="space-y-6">
      {/* 4x3 Grid of 12 Reference Health Graphs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <HealthScoreTrendChart reports={reports} />
        <HemoglobinChart reports={reports} />
        <BloodSugarChart reports={reports} />

        <CholesterolProfileChart reports={reports} />
        <VitaminDChart reports={reports} />
        <KidneyFunctionChart reports={reports} />

        <ReportCountBarChart reports={reports} />
        <ReportsByTypeDonutChart reports={reports} />
        <WeightTrendChart reports={reports} />

        <BloodPressureChart reports={reports} />
        <HeartRateChart reports={reports} />
        <AppointmentOverviewBarChart appointments={appointments} />
      </div>

      {/*Footer System Insight Banner */}
      <div className="bg-[#FAF8F5] p-4 rounded -2xl border border-[#E5E0D5] flex items-center justify-between text-xs text-[#777777] font-medium">
        <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Clinical analytics auto-derived from verified patient lab reports and appointments.</span>
            </div>
            <span className="text-[11px] font-bold text-black bg-white px-3 py-1 rounded-full border border-[#E5E0D5]">
                Active Reports: {reports?.length || 0}
                </span>
            </div>
        </div>
  );
}
