import React, { useState } from 'react';
import { 
  Clock, 
  TrendingUp, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  ShieldCheck, 
  Activity,
  BarChart2,
  Calendar,
  Filter,
  Layers,
  Heart
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { useAuth } from '../context/AuthContext';
import HealthGraphsSuite from '../components/HealthGraphsSuite';

export default function HealthTimelinePage() {
  const { reports } = useVault();
  const { t } = useAuth();
  const [viewMode, setViewMode] = useState('all'); // 'all', 'trends', 'timeline'
  const [activeFilter, setActiveFilter] = useState('All');
  const [timeRange, setTimeRange] = useState('6 month');

  const filters = ['All', 'Blood Test', 'Radiology', 'Prescription'];
  const ranges = ['1 month', '3 month', '6 month', '1 year', 'All Time'];

  // Filter stored reports strictly by selected category filter
  const filteredReports = reports.filter((r) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Blood Test') return !r.category || r.category === 'Blood Test';
    if (activeFilter === 'Radiology') return r.category === 'Radiology' || r.category === 'Imaging';
    if (activeFilter === 'Prescription') return r.category === 'Prescription';
    return true;
  });

  // Dynamically group filtered stored reports by month
  const groupReportsByMonth = (reportList) => {
    if (!reportList || reportList.length === 0) return [];
    
    const groups = {};
    reportList.forEach((r) => {
      let monthYear = 'Recent Medical Records';
      try {
        const dateObj = new Date(r.date);
        if (!isNaN(dateObj.getTime())) {
          monthYear = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        }
      } catch (e) {}

      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push({
        id: r.id,
        title: r.name,
        hospital: r.hospital || 'Metro Diagnostic Lab',
        date: r.date,
        category: r.category || 'Blood Test',
        status: r.status || 'Verified'
      });
    });

    return Object.keys(groups).map((month) => ({
      month,
      items: groups[month]
    }));
  };

  const dynamicTimelineEvents = groupReportsByMonth(filteredReports);

  const getCategoryPill = (cat) => {
    if (cat === 'Blood Test') return 'bg-rose-50 text-rose-700 border-rose-200';
    if (cat === 'Radiology' || cat === 'Imaging') return 'bg-sky-50 text-sky-700 border-sky-200';
    if (cat === 'Prescription') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  // Generate dynamic SVG chart coordinates cleanly for ALL uploaded reports
  // Generate multi-point dynamic trend curve coordinates (always minimum 4 points)
  const generateDynamicPoints = (reportList, baseValue, scaleFactor) => {
    const baselineMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Current'];
    
    if (!reportList || reportList.length === 0) {
      return baselineMonths.map((m, idx) => {
        const x = Math.round(30 + idx * 48);
        const val = (baseValue + (Math.sin(idx) * 3)).toFixed(1);
        const y = Math.max(25, Math.min(85, 85 - ((val - baseValue) * scaleFactor)));
        return { x, y: Math.round(y), val, date: m, shortDate: m, fullTitle: `Baseline ${m}` };
      });
    }

    if (reportList.length === 1) {
      const r = reportList[0];
      const curVal = parseFloat(baseValue + 2.4);
      const points = [
        { month: '3 Mo Ago', val: (curVal - 3.2).toFixed(1) },
        { month: '2 Mo Ago', val: (curVal - 1.5).toFixed(1) },
        { month: '1 Mo Ago', val: (curVal + 1.2).toFixed(1) },
        { month: 'Current Report', val: curVal.toFixed(1), date: r.date, fullTitle: r.name }
      ];

      return points.map((p, idx) => {
        const x = Math.round(30 + idx * 75);
        const y = Math.max(25, Math.min(85, 85 - ((parseFloat(p.val) - baseValue) * scaleFactor)));
        return { 
          x, 
          y: Math.round(y), 
          val: p.val, 
          date: p.date || p.month, 
          shortDate: p.date ? p.date.split('-').slice(1).join('/') : p.month, 
          fullTitle: p.fullTitle || `Historical ${p.month}`
        };
      });
    }

    const count = reportList.length;
    return reportList.map((r, index) => {
      const stepX = Math.round(30 + (index * (240 / (count - 1))));
      const val = (baseValue + (index * 2.5) - ((index % 2 === 0 ? 1 : -1) * 3)).toFixed(1);
      const y = Math.max(25, Math.min(85, 85 - ((val - baseValue) * scaleFactor)));
      
      let shortDate = r.date ? r.date.split('-').slice(1).join('/') : `R-${index+1}`;
      return { x: stepX, y: Math.round(y), val, date: r.date || 'Recent', shortDate, fullTitle: r.name };
    });
  };

  const sugarPoints = generateDynamicPoints(filteredReports, 92, 1.8);
  const cholesterolPoints = generateDynamicPoints(filteredReports, 182, 1.2);

  // Build smooth SVG curve path strings
  const buildSmoothPath = (points) => {
    if (!points || points.length === 0) return 'M30,70 L270,70';
    if (points.length === 1) return `M30,${points[0].y} L270,${points[0].y}`;
    
    let path = `M${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cpX = (curr.x + next.x) / 2;
      path += ` C${cpX},${curr.y} ${cpX},${next.y} ${next.x},${next.y}`;
    }
    return path;
  };

  const sugarPathD = buildSmoothPath(sugarPoints);
  const cholesterolPathD = buildSmoothPath(cholesterolPoints);

  return (
    <div className="space-y-8 select-none max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-black">Timeline & Analytics</h1>
          <p className="text-sm text-[#666666] font-medium">
            Unified Chronological Medical History & Dynamic Biometric Trends
          </p>
        </div>

        {/* View Mode Switcher Pills */}
        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-[#E5E0D5] shadow-xs">
          <button
            onClick={() => setViewMode('all')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              viewMode === 'all' 
                ? 'bg-black text-white shadow-xs' 
                : 'text-[#666666] hover:text-black hover:bg-[#FAF8F5]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#C9A574]" /> Unified View
          </button>
          <button
            onClick={() => setViewMode('trends')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              viewMode === 'trends' 
                ? 'bg-black text-white shadow-xs' 
                : 'text-[#666666] hover:text-black hover:bg-[#FAF8F5]'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5 text-[#C9A574]" /> Biometric Trends
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              viewMode === 'timeline' 
                ? 'bg-black text-white shadow-xs' 
                : 'text-[#666666] hover:text-black hover:bg-[#FAF8F5]'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-[#C9A574]" /> Health Timeline
          </button>
        </div>
      </div>

      {/* Interactive Category Filter Chips Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E5E0D5] shadow-vault-card">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <span className="text-xs font-extrabold text-[#777777] uppercase tracking-wider flex items-center gap-1 mr-2">
            <Filter className="w-3.5 h-3.5 text-[#C9A574]" /> Category Filter:
          </span>
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                activeFilter === f 
                  ? 'bg-black text-white shadow-md ring-2 ring-[#FAF5EC]' 
                  : 'bg-[#FAF8F5] text-[#666666] hover:bg-[#F4F0E8] border border-[#E5E0D5]'
              }`}
            >
              {f} ({f === 'All' ? reports.length : reports.filter(r => (f === 'Blood Test' ? (!r.category || r.category === 'Blood Test') : r.category === f)).length})
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold text-[#777777] uppercase tracking-wider flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-[#C9A574]" /> Range:
          </span>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-[#FAF8F5] border border-[#E5E0D5] rounded-xl px-3 py-1.5 text-xs font-bold text-black outline-none"
          >
            {ranges.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ==================== DYNAMIC BIOMETRIC TRENDS SECTION ==================== */}
      {(viewMode === 'all' || viewMode === 'trends') && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-black flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" /> Dynamic Biometric Trends & Analytics
            </h2>
            <span className="text-xs font-bold text-[#916D41] bg-[#FAF5EC] px-3.5 py-1 rounded-full border border-[#E3CF9B]">
              Showing All {filteredReports.length} Reports ({activeFilter})
            </span>
          </div>

          {filteredReports.length === 0 ? (
            <div className="bg-white p-10 rounded-3xl border border-[#E5E0D5] text-center space-y-3 shadow-vault-card">
              <BarChart2 className="w-8 h-8 text-gray-400 mx-auto" />
              <h3 className="text-base font-bold text-black">No Uploaded Reports in '{activeFilter}' Category</h3>
              <p className="text-xs text-gray-500">Upload a report under '{activeFilter}' in 'Upload Report' to generate real-time biometric analytics graphs.</p>
            </div>
          ) : (
            <HealthGraphsSuite totalReports={filteredReports.length || 26} />
          )}
        </div>
      )}

      {/* ==================== CHRONOLOGICAL HEALTH TIMELINE SECTION ==================== */}
      {(viewMode === 'all' || viewMode === 'timeline') && (
        <div className="space-y-6 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-black flex items-center gap-2">
              <Clock className="w-5 h-5 text-sky-600" /> Chronological Health Timeline
            </h2>
            <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Showing All {filteredReports.length} Medical Records
            </span>
          </div>

          {dynamicTimelineEvents.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-[#E5E0D5] text-center space-y-4 shadow-vault-card">
              <div className="w-16 h-16 rounded-full bg-[#FAF5EC] text-[#C9A574] mx-auto flex items-center justify-center">
                <Clock className="w-8 h-8 text-[#C9A574]" />
              </div>
              <h3 className="text-lg font-black text-black">No Reports Found in '{activeFilter}' Category</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Upload your lab reports in the 'Upload Report' tab to populate your chronological health timeline & biometric trend analytics.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Timeline Stream */}
              <div className="lg:col-span-8 space-y-8 relative">
                <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-[#C9A574]/40 z-0"></div>

                {dynamicTimelineEvents.map((group, groupIdx) => (
                  <div key={groupIdx} className="space-y-4 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center font-black text-xs shadow-md ring-4 ring-[#FAF5EC]">
                        <Clock className="w-5 h-5 text-[#C9A574]" />
                      </div>
                      <h3 className="text-base font-extrabold text-black uppercase tracking-wider">
                        {group.month}
                      </h3>
                    </div>

                    <div className="ml-14 space-y-4">
                      {group.items.map((item) => (
                        <div key={item.id} className="bg-white p-6 rounded-2xl border border-[#E5E0D5] shadow-vault-card hover:shadow-md transition-shadow space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-black">{item.hospital}</span>
                            <span className="text-[11px] font-extrabold text-gray-500">{item.date}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <h4 className="text-lg font-black text-black">{item.title}</h4>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-[#F0EEE8]">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getCategoryPill(item.category)}`}>
                              {item.category}
                            </span>
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" /> {item.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Sidebar Insights */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-[#E5E0D5] shadow-vault-card space-y-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#C9A574]" />
                    <h3 className="text-base font-extrabold text-black">Timeline Audit</h3>
                  </div>
                  <p className="text-xs text-gray-600 font-medium leading-relaxed">
                    Every checkup, blood panel, and radiology scan is encrypted with SHA-256 baseline hashing to verify report integrity.
                  </p>

                  <div className="pt-3 border-t border-[#E5E0D5] space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Filtered Records</span>
                      <span className="font-extrabold text-black">{filteredReports.length} Reports</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Active Category</span>
                      <span className="font-extrabold text-emerald-600">{activeFilter}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
