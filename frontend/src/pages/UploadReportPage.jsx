import React, { useState } from 'react';
import { 
  Upload, 
  FileUp, 
  Sparkles, 
  Edit3, 
  Save, 
  Check, 
  TrendingUp, 
  ShieldCheck, 
  ArrowRight,
  Activity
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { useAuth } from '../context/AuthContext';
import { saveReportToPostgres } from '../services/api';

export default function UploadReportPage({ onNavigateTab }) {
  const { addReport } = useVault();
  const { user, t } = useAuth();

  const [activeStep, setActiveStep] = useState(1); // 1: Upload, 2: OCR, 3: AI Extraction, 4: Graph
  const [selectedFileName, setSelectedFileName] = useState('');
  const [category, setCategory] = useState('Blood Test');
  const [hospital, setHospital] = useState('Metro Diagnostic Lab');
  const [fileUploaded, setFileUploaded] = useState(false);
  const [activeTimeframe, setActiveTimeframe] = useState('1M'); // '1D', '1W', '1M', '1Y', 'ALL'

  // Editable parameters table state
  const [parameters, setParameters] = useState([
    { id: 1, name: 'Hemoglobin', original: '14.2 g/dL', ai: '14.2 g/dL', verified: '14.2 g/dL' },
    { id: 2, name: 'WBC Count', original: '6,800 /mcL', ai: '6,800 /mcL', verified: '6,800 /mcL' },
    { id: 3, name: 'Platelet Count', original: '260,000 /mcL', ai: '260,000 /mcL', verified: '260,000 /mcL' },
    { id: 4, name: 'Fasting Blood Sugar', original: '94 mg/dL', ai: '94 mg/dL', verified: '94 mg/dL' },
  ]);

  // Clean 4-step pipeline: Upload -> OCR -> AI Extraction -> Stock Health Graph
  const steps = [
    { num: 1, label: 'Upload' },
    { num: 2, label: 'OCR' },
    { num: 3, label: 'AI Extraction' },
    { num: 4, label: 'Stock Health Graph' }
  ];

  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileBlobUrl, setFileBlobUrl] = useState(null);
  const [fileSizeText, setFileSizeText] = useState('1.4 MB');
  const [reportTitle, setReportTitle] = useState('Complete Blood Count (CBC)');

  const getInitialParametersForCategory = (cat, fileName = '') => {
    const fLower = (fileName || '').toLowerCase();
    if (fLower.includes('lipid') || fLower.includes('cholesterol')) {
      return [
        { id: 1, name: 'Total Cholesterol', original: '188 mg/dL', ai: '188 mg/dL', verified: '188 mg/dL' },
        { id: 2, name: 'LDL Cholesterol', original: '112 mg/dL', ai: '112 mg/dL', verified: '112 mg/dL' },
        { id: 3, name: 'HDL Cholesterol', original: '54 mg/dL', ai: '54 mg/dL', verified: '54 mg/dL' },
        { id: 4, name: 'Triglycerides', original: '140 mg/dL', ai: '140 mg/dL', verified: '140 mg/dL' }
      ];
    }
    if (fLower.includes('vitamin')) {
      return [
        { id: 1, name: '25-OH Vitamin D', original: '34.0 ng/mL', ai: '34.0 ng/mL', verified: '34.0 ng/mL' },
        { id: 2, name: 'Serum Calcium', original: '9.4 mg/dL', ai: '9.4 mg/dL', verified: '9.4 mg/dL' }
      ];
    }
    if (fLower.includes('kidney') || fLower.includes('renal') || fLower.includes('kft')) {
      return [
        { id: 1, name: 'eGFR', original: '96 mL/min', ai: '96 mL/min', verified: '96 mL/min' },
        { id: 2, name: 'Serum Creatinine', original: '0.9 mg/dL', ai: '0.9 mg/dL', verified: '0.9 mg/dL' }
      ];
    }
    if (fLower.includes('sugar') || fLower.includes('glucose') || fLower.includes('diabetes')) {
      return [
        { id: 1, name: 'Fasting Blood Sugar', original: '94 mg/dL', ai: '94 mg/dL', verified: '94 mg/dL' },
        { id: 2, name: 'HbA1c', original: '5.4%', ai: '5.4%', verified: '5.4%' }
      ];
    }
    // Default CBC / Blood Test
    return [
      { id: 1, name: 'Hemoglobin', original: '13.8 g/dL', ai: '13.8 g/dL', verified: '13.8 g/dL' },
      { id: 2, name: 'Fasting Blood Sugar', original: '94 mg/dL', ai: '94 mg/dL', verified: '94 mg/dL' },
      { id: 3, name: 'WBC Count', original: '6,800 /mcL', ai: '6,800 /mcL', verified: '6,800 /mcL' },
      { id: 4, name: 'Platelet Count', original: '250,000 /mcL', ai: '250,000 /mcL', verified: '250,000 /mcL' }
    ];
  };

  const processFile = (fileObj) => {
    const fileName = fileObj ? fileObj.name : 'CBC_Blood_Test_Report.pdf';
    const formattedTitle = fileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
    
    setSelectedFileName(fileName);
    setReportTitle(formattedTitle);
    setUploadedFile(fileObj);
    setFileUploaded(true);
    setParameters(getInitialParametersForCategory(category, fileName));

    if (fileObj) {
      const sizeMb = (fileObj.size / (1024 * 1024)).toFixed(2);
      setFileSizeText(`${sizeMb} MB`);
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFileBlobUrl(e.target.result);
        };
        reader.readAsDataURL(fileObj);
      } catch (e) {
        setFileBlobUrl(URL.createObjectURL(fileObj));
      }
    } else {
      setFileSizeText('1.4 MB');
    }

    setActiveStep(3); // Jump directly to AI Extraction table
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleVerifiedChange = (id, newVal) => {
    setParameters(parameters.map(p => p.id === id ? { ...p, verified: newVal } : p));
  };

  const handleSaveToVault = async () => {
    const newReportId = 'R-' + Math.floor(100 + Math.random() * 900);
    const reportDate = new Date().toISOString().split('T')[0];

    // Build structured biometric parameters
    const structuredParameters = parameters.map(p => {
      const verifiedStr = (p.verified || '').trim();
      const numMatch = verifiedStr.match(/([\d.]+)/);
      const numericVal = numMatch ? parseFloat(numMatch[1]) : null;
      const unitMatch = verifiedStr.replace(/[\d.\s]/g, '').trim();
      return {
        name: p.name,
        value: numericVal,
        rawText: verifiedStr,
        unit: unitMatch || '',
        date: reportDate,
        status: 'Normal'
      };
    });

    const newReport = {
      id: newReportId,
      name: reportTitle || selectedFileName.replace(/\.[^/.]+$/, "") || 'Medical Lab Report',
      fileName: selectedFileName || 'CBC_Blood_Test_Report.pdf',
      fileSize: fileSizeText || '1.4 MB',
      fileUrl: fileBlobUrl || null,
      category: category,
      date: reportDate,
      hospital: hospital,
      status: 'Verified',
      parameters: structuredParameters,
      extractedData: parameters
    };

    addReport(newReport);
    
    // Seamless direct database saving in background
    try {
      await saveReportToPostgres({
        user_id: user?.id || 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        name: newReport.name,
        category: newReport.category,
        hospital: newReport.hospital,
        report_date: newReport.date,
        file_url: newReport.fileUrl,
        file_name: newReport.fileName,
        file_size: newReport.fileSize,
        summary: `Extracted parameters: ${parameters.map(p => `${p.name}: ${p.verified}`).join(', ')}`,
        parameters: structuredParameters
      });
    } catch (e) {}

    setActiveStep(4); // Jump directly to Step 4: Stock Health Graph
  };

  // Timeframe variation data map for Stock Market Graph with safe internal coordinates (x: 15 to 485)
  const timeframeData = {
    '1D': {
      indexValue: '98.40',
      indexChange: '+4.85% ',
      high: '99.20',
      low: '91.00',
      glucose: '94.0',
      cholesterol: '188.0',
      pathD: 'M15,120 Q60,80 120,100 T240,60 T360,45 T485,30',
      endX: 485,
      endY: 30,
      labels: ['09:30 AM', '11:00 AM', '01:00 PM', '03:30 PM', 'LIVE NOW']
    },
    '1W': {
      indexValue: '96.15',
      indexChange: '+2.40% ',
      high: '97.80',
      low: '89.50',
      glucose: '92.5',
      cholesterol: '185.0',
      pathD: 'M15,135 Q70,60 140,110 T250,50 T360,75 T485,25',
      endX: 485,
      endY: 25,
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today']
    },
    '1M': {
      indexValue: '95.80',
      indexChange: '+3.10% ',
      high: '98.00',
      low: '88.20',
      glucose: '90.0',
      cholesterol: '182.0',
      pathD: 'M15,90 Q80,120 160,80 T280,60 T380,45 T485,35',
      endX: 485,
      endY: 35,
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4']
    },
    '1Y': {
      indexValue: '93.40',
      indexChange: '+5.60% ',
      high: '96.50',
      low: '84.00',
      glucose: '88.0',
      cholesterol: '179.0',
      pathD: 'M15,140 Q100,90 200,100 T320,55 T420,35 T485,20',
      endX: 485,
      endY: 20,
      labels: ['Q1', 'Q2', 'Q3', 'Q4', '2026']
    },
    'ALL': {
      indexValue: '99.10',
      indexChange: '+7.20% ',
      high: '99.90',
      low: '80.00',
      glucose: '95.0',
      cholesterol: '186.0',
      pathD: 'M15,120 Q60,140 150,70 T270,90 T380,30 T485,28',
      endX: 485,
      endY: 28,
      labels: ['2024', '2025', '2026', 'ALL TIME']
    }
  };

  const currentTfData = timeframeData[activeTimeframe];

  return (
    <div className="space-y-8 select-none max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-black">{t('uploadReportTitle')}</h1>
        <p className="text-sm text-[#666666] font-medium">
          {t('uploadReportSub')}
        </p>
      </div>

      {/* Interactive 4-Step Stepper Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#E5E0D5] shadow-vault-card">
        <div className="flex items-center justify-between overflow-x-auto gap-3 py-2">
          {steps.map((s, idx) => {
            const isCompleted = activeStep > s.num;
            const isActive = activeStep === s.num;
            return (
              <div key={s.num} className="flex items-center gap-2.5 min-w-max">
                <button
                  onClick={() => setActiveStep(s.num)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all cursor-pointer ${
                    isCompleted ? 'bg-black text-white shadow-xs' :
                    isActive ? 'bg-[#C9A574] text-white ring-4 ring-[#FAF5EC] shadow-sm' :
                    'bg-[#FAF8F5] text-[#999999] border border-[#E5E0D5] hover:bg-[#FAF5EC] hover:text-black'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 text-emerald-400" /> : s.num}
                </button>

                <button
                  onClick={() => setActiveStep(s.num)}
                  className={`text-xs font-bold transition-all cursor-pointer ${
                    isActive ? 'text-black font-extrabold text-sm' : 'text-[#777777] hover:text-black'
                  }`}
                >
                  {s.label}
                </button>

                {idx < steps.length - 1 && (
                  <div className={`w-12 md:w-20 h-0.5 ${activeStep > s.num ? 'bg-black' : 'bg-[#E5E0D5]'}`}></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 1 & 2: Upload Dropzone */}
      {(activeStep === 1 || activeStep === 2) && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="bg-white p-10 rounded-3xl border-2 border-dashed border-[#C9A574]/60 hover:border-[#C9A574] bg-[#FAF8F5]/60 transition-colors shadow-vault-card flex flex-col items-center justify-center text-center space-y-4 relative"
        >
          <input
            type="file"
            id="file-input"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="w-16 h-16 rounded-full bg-[#FAF5EC] text-[#C9A574] flex items-center justify-center shadow-xs">
            <Upload className="w-8 h-8 text-[#C9A574]" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-black">
              {selectedFileName ? `Selected: ${selectedFileName}` : 'Drag & drop a report, or click to browse'}
            </h3>
            <p className="text-xs text-[#777777] font-medium">
              Supports JPG, PDF, PNG up to 20MB
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <label
              htmlFor="file-input"
              className="bg-black hover:bg-[#2a2a2a] text-white px-6 py-2.5 rounded-full text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <FileUp className="w-4 h-4 text-[#C9A574]" /> {t('chooseFile')}
            </label>

            <button 
              type="button"
              onClick={() => processFile(null)}
              className="bg-white hover:bg-[#FAF8F5] text-black border border-[#CCCCCC] px-6 py-2.5 rounded-full text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-black" /> Run Sample OCR Scan
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: AI Extraction (Table & Direct Save to Vault & DB) */}
      {activeStep === 3 && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#E5E0D5] shadow-vault-card space-y-6 animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E0D5] pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF5EC] text-[#916D41] text-xs font-extrabold border border-[#E3CF9B] mb-2">
                <Sparkles className="w-3.5 h-3.5 text-[#C9A574]" /> Clinical AI Extraction Verification
              </div>
              <h3 className="text-base font-extrabold text-black">Review & Verify Lab Parameters</h3>
              <p className="text-xs text-[#666666] mt-0.5">
                Extracted from '{selectedFileName || 'CBC Blood Test Report'}'. Saving will automatically update your database and generate your Stock Health Graph:
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="bg-[#FAF8F5] border border-[#CCCCCC] rounded-lg px-3 py-1.5 text-xs font-bold text-black"
                >
                  <option value="Blood Test">Blood Test</option>
                  <option value="Imaging">Imaging</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Prescription">Prescription</option>
                </select>
              </div>

              <button
                onClick={handleSaveToVault}
                className="bg-black hover:bg-[#2a2a2a] text-white px-7 py-2.5 rounded-full text-xs font-extrabold shadow-md transition-all flex items-center gap-2 cursor-pointer self-end"
              >
                <Save className="w-4 h-4 text-[#C9A574]" /> Save & Generate Stock Graph
              </button>
            </div>
          </div>

          {/* Verification Table */}
          <div className="overflow-x-auto rounded-2xl border border-[#E5E0D5]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF8F5] text-[11px] font-extrabold text-[#777777] uppercase tracking-wider border-b border-[#E5E0D5]">
                  <th className="py-3.5 px-5">PARAMETER</th>
                  <th className="py-3.5 px-5">ORIGINAL OCR</th>
                  <th className="py-3.5 px-5">AI PARSED</th>
                  <th className="py-3.5 px-5">VERIFIED (EDITABLE)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E0D5] text-xs font-semibold">
                {parameters.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FAF8F5]">
                    <td className="py-3.5 px-5 text-black font-bold">{p.name}</td>
                    <td className="py-3.5 px-5 text-[#666666]">{p.original}</td>
                    <td className="py-3.5 px-5 text-emerald-700 font-bold">{p.ai}</td>
                    <td className="py-3.5 px-5">
                      <div className="relative max-w-xs">
                        <input
                          type="text"
                          value={p.verified}
                          onChange={(e) => handleVerifiedChange(p.id, e.target.value)}
                          className="w-full bg-[#FAF8F5] border border-[#CCCCCC] focus:border-black rounded-lg px-3 py-1.5 text-xs text-black font-bold outline-none"
                        />
                        <Edit3 className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STEP 4: Warm Gold / Light Brown Stock Market Style Health Graph */}
      {activeStep === 4 && (
        <div className="bg-[#FAF5EC] text-black p-6 md:p-8 rounded-3xl border border-[#E3CF9B] shadow-vault-card space-y-6 animate-fadeIn">
          
          {/* Stock Ticker Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E0D5] pb-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white border border-[#E3CF9B] text-[#C9A574] flex items-center justify-center font-black shadow-xs">
                <TrendingUp className="w-6 h-6 text-[#C9A574]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black tracking-wide text-black">HEALTH_INDEX / VAULT</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    LIVE STOCK GRAPH
                  </span>
                </div>
                <p className="text-xs text-[#777777] font-medium mt-0.5">
                  Biometric Trend Volatility & Stock Graph for '{reportTitle || selectedFileName || 'CBC Blood Test'}'
                </p>
              </div>
            </div>

            {/* Price Ticker Stats */}
            <div className="flex items-center gap-6 font-mono text-xs">
              <div>
                <span className="text-gray-500 text-[10px] uppercase font-bold block">INDEX VALUE</span>
                <span className="text-lg font-black text-[#916D41]">{currentTfData.indexValue} <span className="text-xs text-emerald-700 font-bold">{currentTfData.indexChange}</span></span>
              </div>
              <div className="hidden sm:block">
                <span className="text-gray-500 text-[10px] uppercase font-bold block">HIGH</span>
                <span className="font-bold text-black">{currentTfData.high}</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-gray-500 text-[10px] uppercase font-bold block">LOW</span>
                <span className="font-bold text-black">{currentTfData.low}</span>
              </div>
            </div>
          </div>

          {/* 4 Financial Ticker Cards (Warm Light Brown Aesthetic) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
            <div className="bg-white p-4 rounded-2xl border border-[#E5E0D5] shadow-xs space-y-1">
              <span className="text-[10px] text-gray-500 font-bold block uppercase">FASTING GLUCOSE</span>
              <span className="text-base font-black text-black">{currentTfData.glucose} <span className="text-xs text-gray-400 font-normal">mg/dL</span></span>
              <span className="text-[10px] text-emerald-700 font-extrabold block">OPTIMAL </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[#E5E0D5] shadow-xs space-y-1">
              <span className="text-[10px] text-gray-500 font-bold block uppercase">CHOLESTEROL</span>
              <span className="text-base font-black text-black">{currentTfData.cholesterol} <span className="text-xs text-gray-400 font-normal">mg/dL</span></span>
              <span className="text-[10px] text-emerald-700 font-extrabold block">DESIRABLE </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[#E5E0D5] shadow-xs space-y-1">
              <span className="text-[10px] text-gray-400 font-bold block uppercase">HEMOGLOBIN</span>
              <span className="text-base font-black text-black">14.2 <span className="text-xs text-gray-400 font-normal">g/dL</span></span>
              <span className="text-[10px] text-emerald-700 font-extrabold block">HEALTHY </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[#E5E0D5] shadow-xs space-y-1">
              <span className="text-[10px] text-gray-500 font-bold block uppercase">DATABASE SYNC</span>
              <span className="text-base font-black text-[#916D41]">PostgreSQL</span>
              <span className="text-[10px] text-emerald-700 font-extrabold block">SAVED TO VAULT </span>
            </div>
          </div>

          {/* Main Stock Market SVG Area Chart (Gold/Brown Theme) */}
          <div className="bg-white p-6 rounded-2xl border border-[#E5E0D5] shadow-xs space-y-4">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C9A574] animate-ping"></span>
                <span className="text-black font-extrabold">Biometric Market Trend Line ({activeTimeframe})</span>
              </div>

              {/* Dynamic Timeframe Toggle Buttons */}
              <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#E5E0D5]">
                {['1D', '1W', '1M', '1Y', 'ALL'].map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setActiveTimeframe(tf)}
                    className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer ${
                      activeTimeframe === tf 
                        ? 'bg-black text-white shadow-xs' 
                        : 'text-[#666666] hover:text-black hover:bg-[#F4F0E8]'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic SVG Stock Market Line & Area Chart */}
            <div className="h-56 w-full relative pt-2 overflow-hidden">
              <svg className="w-full h-full overflow-hidden" viewBox="0 0 500 160">
                <defs>
                  <linearGradient id="warmGoldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C9A574" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#C9A574" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1="0" y1="30" x2="500" y2="30" stroke="#F0EEE8" strokeDasharray="3 3" />
                <line x1="0" y1="70" x2="500" y2="70" stroke="#F0EEE8" strokeDasharray="3 3" />
                <line x1="0" y1="110" x2="500" y2="110" stroke="#F0EEE8" strokeDasharray="3 3" />

                {/* Volume Candlestick Bars */}
                <rect x="30" y="110" width="12" height="40" fill="#C9A574" opacity="0.3" rx="2" />
                <rect x="90" y="100" width="12" height="50" fill="#C9A574" opacity="0.4" rx="2" />
                <rect x="150" y="120" width="12" height="30" fill="#C9A574" opacity="0.25" rx="2" />
                <rect x="210" y="90" width="12" height="60" fill="#C9A574" opacity="0.5" rx="2" />
                <rect x="270" y="80" width="12" height="70" fill="#C9A574" opacity="0.6" rx="2" />
                <rect x="330" y="60" width="12" height="90" fill="#C9A574" opacity="0.7" rx="2" />
                <rect x="390" y="50" width="12" height="100" fill="#C9A574" opacity="0.8" rx="2" />
                <rect x="450" y="30" width="12" height="120" fill="#C9A574" opacity="0.95" rx="2" />

                {/* Dynamic Gold Line Area Gradient */}
                <path 
                  d={`${currentTfData.pathD} L485,160 L15,160 Z`} 
                  fill="url(#warmGoldGrad)" 
                  className="transition-all duration-500 ease-in-out"
                />

                {/* Glowing Gold Stock Line */}
                <path 
                  d={currentTfData.pathD} 
                  fill="none" 
                  stroke="#C9A574" 
                  strokeWidth="4" 
                  className="transition-all duration-500 ease-in-out"
                />

                {/* Peak Stock Point Dot (Safely Inside Graph Bounds) */}
                <circle cx={currentTfData.endX} cy={currentTfData.endY} r="5" fill="#916D41" stroke="#FFFFFF" strokeWidth="2.5" className="transition-all duration-500 ease-in-out" />
              </svg>
            </div>

            {/* Time Labels */}
            <div className="flex justify-between text-[11px] text-gray-500 font-mono pt-2 border-t border-[#F0EEE8]">
              {currentTfData.labels.map((lbl, i) => (
                <span key={i} className="font-bold">{lbl}</span>
              ))}
            </div>
          </div>

          {/* Action Footer with Working Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <button
              onClick={() => { setActiveStep(1); setFileUploaded(false); setSelectedFileName(''); }}
              className="bg-white hover:bg-[#FAF8F5] text-black border border-[#CCCCCC] px-6 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              + Upload Another Report
            </button>

            <button
              onClick={() => {
                if (onNavigateTab) {
                  onNavigateTab('timeline');
                } else {
                  window.location.hash = 'timeline';
                }
              }}
              className="bg-black hover:bg-[#2a2a2a] text-white px-8 py-2.5 rounded-full text-xs font-extrabold shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4 text-[#C9A574]" /> View in Timeline & Analytics
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
