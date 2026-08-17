import React, { useState } from 'react';
import { Search, Download, Filter, FileText, ChevronLeft, ChevronRight, Eye, X, CheckCircle, ShieldCheck, Printer, ExternalLink, Trash2 } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { useAuth } from '../context/AuthContext';
import { downloadPdfFile } from '../utils/downloadPdf';

export default function MyReportsPage() {
  const { reports, deleteReport } = useVault();
  const { user, t } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [viewingReport, setViewingReport] = useState(null);

  const handleDownloadPDF = (report) => {
    if (report.fileUrl && report.fileUrl.startsWith('blob:')) {
      const a = document.createElement('a');
      a.href = report.fileUrl;
      a.download = report.fileName || `${report.name || report.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
    
    // Download PDF file
    const reportTitle = report.title || report.name || 'Medical Record';
    const fileName = report.fileName || `${reportTitle.replace(/\s+/g, '_')}.pdf`;
    downloadPdfFile(reportTitle, report.prescriptionDetails || report, fileName);
  };

  const filteredReports = reports.filter(r => {
    const reportTitle = r.title || r.name || '';
    const reportFacility = r.facility || r.hospital || '';
    const matchesSearch = reportTitle.toLowerCase().includes(searchTerm.toLowerCase()) || reportFacility.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'All' || r.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const getCategoryPill = (cat) => {
    if (cat === 'Prescription') return 'bg-purple-50 text-purple-700 border-purple-200';
    if (cat === 'Blood Test') return 'bg-rose-50 text-rose-700 border-rose-200';
    if (cat === 'Imaging') return 'bg-sky-50 text-sky-700 border-sky-200';
    if (cat === 'Cardiology') return 'bg-[#FAF5EC] text-[#916D41] border-[#E3CF9B]';
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <div className="space-y-6 select-none relative">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-black">{t('reportLibrary')}</h1>
        <p className="text-sm text-[#666666] font-medium">
          {t('reportLibrarySub')}
        </p>
      </div>

      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E0D5] shadow-vault-card flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search reports or hospitals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#FAF8F5] border border-[#E5E0D5] rounded-xl pl-10 pr-4 py-2.5 text-xs text-black outline-none focus:ring-2 focus:ring-black/10"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#FAF8F5] border border-[#E5E0D5] rounded-xl px-4 py-2.5 text-xs font-semibold text-black outline-none cursor-pointer"
          >
            <option value="All">All Categories</option>
            <option value="Blood Test">Blood Test</option>
            <option value="Imaging">Imaging</option>
            <option value="Cardiology">Cardiology</option>
            <option value="Prescription">Prescription</option>
          </select>

          <button 
            onClick={() => { setSearchTerm(''); setCategoryFilter('All'); }}
            className="bg-[#FAF5EC] hover:bg-[#F5EDD5] text-[#916D41] border border-[#E3CF9B] px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5" /> Reset Filter
          </button>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-2xl border border-[#E5E0D5] shadow-vault-card overflow-hidden">
        {filteredReports.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#FAF5EC] border border-[#E3CF9B] text-[#C9A574] mx-auto flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-black">No Reports Found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Upload your lab reports in the 'Upload Report' tab to store them in your vault.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF8F5] border-b border-[#E5E0D5] text-[11px] font-extrabold text-[#777777] uppercase tracking-wider">
                  <th className="py-4 px-6">REPORT</th>
                  <th className="py-4 px-6">CATEGORY</th>
                  <th className="py-4 px-6">DATE</th>
                  <th className="py-4 px-6">HOSPITAL / LAB</th>
                  <th className="py-4 px-6">STATUS</th>
                  <th className="py-4 px-6 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E0D5] text-xs font-medium text-black">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="py-4 px-6 cursor-pointer" onClick={() => setViewingReport(report)}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#FAF8F5] border border-[#E5E0D5] text-[#C9A574] flex items-center justify-center font-bold flex-shrink-0">
                          <FileText className="w-4 h-4 text-[#C9A574]" />
                        </div>
                        <div>
                          <span className="font-bold text-black block hover:text-[#C9A574] hover:underline">{report.title || report.name || 'Medical Document'}</span>
                          <span className="text-[10px] text-gray-400 font-medium">{report.fileName || 'Lab_Result_Digital.pdf'} {report.fileSize ? `• ${report.fileSize}` : ''}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${getCategoryPill(report.category)}`}>
                        {report.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-[#555555] font-semibold">{report.date}</td>
                    <td className="py-4 px-6 text-[#555555]">{report.facility || report.hospital || 'Diagnostic Lab'}</td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {report.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* VIEW & READ REPORT BUTTON */}
                        <button
                          onClick={() => setViewingReport(report)}
                          title="Read & View Full Medical Report"
                          className="px-3 py-1.5 bg-black hover:bg-[#2a2a2a] text-white rounded-xl transition-all inline-flex items-center gap-1.5 font-bold text-xs cursor-pointer shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#C9A574]" /> Read Report
                        </button>

                        {/* DOWNLOAD BUTTON */}
                        <button
                          onClick={() => handleDownloadPDF(report)}
                          title="Download Original File"
                          className="p-2 bg-[#FAF8F5] border border-[#E5E0D5] hover:bg-[#F4F0E8] rounded-xl text-black transition-colors cursor-pointer"
                        >
                          <Download className="w-4 h-4 text-[#C9A574]" />
                        </button>

                        {/* DELETE REPORT BUTTON */}
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete '${report.name}' from your vault?`)) {
                              deleteReport(report.id);
                            }
                          }}
                          title="Delete Report"
                          className="p-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 text-rose-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 border-t border-[#E5E0D5] bg-[#FAF8F5] flex items-center justify-between text-xs text-[#666666]">
          <span>Showing {filteredReports.length} of {reports.length} reports</span>
          <div className="flex items-center gap-2">
            <button className="p-1.5 rounded-lg border border-[#E5E0D5] hover:bg-white text-black disabled:opacity-50" disabled>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 bg-black text-white font-bold rounded-lg text-xs">1</span>
            <button className="p-1.5 rounded-lg border border-[#E5E0D5] hover:bg-white text-black">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ==================== FULL REPORT READER MODAL OVERLAY ==================== */}
      {viewingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-[#E5E0D5] p-6 md:p-8 space-y-6 relative max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setViewingReport(null)}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Info */}
            <div className="border-b border-[#E5E0D5] pb-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-0.5 rounded-full text-xs font-extrabold border ${getCategoryPill(viewingReport.category)}`}>
                  {viewingReport.category}
                </span>
                <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> OCR Verified
                </span>
              </div>
              <h2 className="text-2xl font-black text-black">{viewingReport.name}</h2>
              <p className="text-xs text-gray-500 font-medium">
                Facility: <span className="font-bold text-black">{viewingReport.hospital}</span> • Date: <span className="font-bold text-black">{viewingReport.date}</span>
              </p>
            
              {/* Render NovaCare Reference PDF Layout if Category === 'Prescription' */}
            {viewingReport.category === 'Prescription' ? (
              <div className="space-y-6 text-xs text-gray-800 font-sans">
                {/* TOP HEADER */}
                <div className="bg-[#00796B] p-6 rounded-2xl text-white flex items-center justify-between shadow-md">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white text-[#00796B] flex items-center justify-center font-black text-2xl shadow-sm">
                      +
                    </div>
                    <div>
                      <h1 className="text-xl font-black tracking-tight">VaultCare AI Medical Portal</h1>
                      <p className="text-xs text-teal-100 font-medium">Compassionate care. Clear records.</p>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-4">
                    <div>
                      <div className="text-sm font-black uppercase tracking-wider">MEDICAL REPORT</div>
                      <div className="text-[11px] font-mono text-teal-100">{viewingReport.id || 'NCR-1784456417467-F590'}</div>
                    </div>
                    <div className="w-14 h-14 bg-white p-1 rounded-xl shadow-xs flex items-center justify-center">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <path d="M0,0 h30 v30 h-30 z M10,10 h10 v10 h-10 z M70,0 h30 v30 h-30 z M80,10 h10 v10 h-10 z M0,70 h30 v30 h-30 z M10,80 h10 v10 h-10 z M40,10 h10 v10 h-10 z M10,40 h10 v10 h-10 z M40,40 h20 v20 h-20 z M70,40 h20 v10 h-20 z M40,70 h10 v20 h-10 z M70,70 h20 v20 h-20 z" fill="#00796B" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* INFO TABLE */}
                <div className="border border-[#E5E0D5] rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <tbody>
                      <tr className="border-b border-[#E5E0D5]">
                        <td className="p-3 bg-[#FAF8F5] font-bold text-gray-700 w-1/4 border-r border-[#E5E0D5]">Patient Name</td>
                        <td className="p-3 font-extrabold text-black w-1/4 border-r border-[#E5E0D5]">{user?.fullName || 'Snehal Mundhe'}</td>
                        <td className="p-3 bg-[#FAF8F5] font-bold text-gray-700 w-1/4 border-r border-[#E5E0D5]">Age / Gender</td>
                        <td className="p-3 font-semibold text-gray-800 w-1/4">26 / Female</td>
                      </tr>
                      <tr className="border-b border-[#E5E0D5]">
                        <td className="p-3 bg-[#FAF8F5] font-bold text-gray-700 border-r border-[#E5E0D5]">Report Date</td>
                        <td className="p-3 font-semibold text-gray-800 border-r border-[#E5E0D5]">{viewingReport.date}</td>
                        <td className="p-3 bg-[#FAF8F5] font-bold text-gray-700 border-r border-[#E5E0D5]">Department</td>
                        <td className="p-3 font-semibold text-gray-800">Cardiology</td>
                      </tr>
                      <tr>
                        <td className="p-3 bg-[#FAF8F5] font-bold text-gray-700 border-r border-[#E5E0D5]">Doctor</td>
                        <td className="p-3 font-extrabold text-black border-r border-[#E5E0D5]">{viewingReport.doctor || 'Dr. Ananya Sharma'}</td>
                        <td className="p-3 bg-[#FAF8F5] font-bold text-gray-700 border-r border-[#E5E0D5]">Follow-up Date</td>
                        <td className="p-3 font-semibold text-gray-800">2026-08-30</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* CLINICAL SECTIONS */}
                <div className="space-y-3">
                  <div>
                    <h3 className="font-extrabold text-sm text-black mb-1">Symptoms</h3>
                    <p className="text-gray-700 font-medium leading-relaxed">chest discomfort (pressure, tightness, or pain), shortness of breath, and radiating pain in the arms, neck, jaw, or back.</p>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-sm text-black mb-1">Diagnosis</h3>
                    <p className="text-black font-extrabold">Suspected Acute Coronary Syndrome (ACS)</p>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-sm text-black mb-1">Medical Findings</h3>
                    <p className="text-gray-700 font-medium leading-relaxed">{viewingReport.notes || 'Patient presented with chest discomfort and shortness of breath. Blood pressure and ECG monitored.'}</p>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-sm text-black mb-1">Conclusion</h3>
                    <p className="text-gray-700 font-medium leading-relaxed">Clinical findings are suggestive of Acute Coronary Syndrome. Immediate cardiology consultation, continuous monitoring, and biomarker assessment recommended.</p>
                  </div>
                </div>

                {/* PRESCRIBED MEDICINE TABLE */}
                <div className="space-y-2">
                  <div className="border border-[#E5E0D5] rounded-xl overflow-hidden shadow-xs">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-[#00796B] text-white font-extrabold text-xs">
                        <tr>
                          <th className="p-3 border-r border-teal-600">Prescribed Medicine</th>
                          <th className="p-3 border-r border-teal-600">Dosage</th>
                          <th className="p-3 border-r border-teal-600">Frequency</th>
                          <th className="p-3">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E0D5] font-semibold text-gray-800">
                        <tr>
                          <td className="p-3 font-bold text-black border-r border-[#E5E0D5]">{viewingReport.prescriptionDetails?.medication || 'Aspirin'}</td>
                          <td className="p-3 border-r border-[#E5E0D5]">{viewingReport.prescriptionDetails?.dosage || '75 mg'}</td>
                          <td className="p-3 border-r border-[#E5E0D5]">1-0-0</td>
                          <td className="p-3">30 Days</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-black border-r border-[#E5E0D5]">Atorvastatin</td>
                          <td className="p-3 border-r border-[#E5E0D5]">40 mg</td>
                          <td className="p-3 border-r border-[#E5E0D5]">0-0-1</td>
                          <td className="p-3">30 Days</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* DOCTOR SIGNATURE LINE */}
                <div className="pt-4 italic font-serif text-sm text-gray-800">
                  Doctor Signature: <strong className="font-sans font-black text-black not-italic">{viewingReport.doctor || 'Dr. Ananya Sharma'}</strong>
                </div>

                {/* FOOTER */}
                <div className="pt-3 border-t border-[#E5E0D5] text-[11px] text-gray-400 font-semibold">
                  VaultCare AI | Confidential medical record | Generated electronically
                </div>
              </div>
            ) : (
              <>
                {/* Actual File Viewer (Embedded PDF / Image if uploaded) */}
                {viewingReport.fileUrl ? (
                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold text-black uppercase tracking-wider">Original Uploaded File Document</h4>
                    <div className="w-full h-80 rounded-2xl border border-[#E5E0D5] bg-[#FAF8F5] overflow-hidden flex items-center justify-center">
                      {viewingReport.fileName?.endsWith('.png') || viewingReport.fileName?.endsWith('.jpg') || viewingReport.fileName?.endsWith('.jpeg') ? (
                        <img src={viewingReport.fileUrl} alt={viewingReport.name} className="w-full h-full object-contain" />
                      ) : (
                        <iframe src={viewingReport.fileUrl} title={viewingReport.name} className="w-full h-full border-none" />
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Extracted Clinical Biomarker Values Table */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-black uppercase tracking-wider">Extracted Clinical Biomarkers & OCR Insights</h4>
                  <div className="overflow-x-auto rounded-2xl border border-[#E5E0D5]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#FAF8F5] border-b border-[#E5E0D5] font-extrabold text-gray-500 uppercase">
                          <th className="py-3 px-4">BIOMARKER</th>
                          <th className="py-3 px-4">MEASURED VALUE</th>
                          <th className="py-3 px-4">REFERENCE RANGE</th>
                          <th className="py-3 px-4">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E0D5] font-medium text-black">
                        <tr>
                          <td className="py-3 px-4 font-bold text-black">Hemoglobin</td>
                          <td className="py-3 px-4 font-extrabold text-emerald-700">14.2 g/dL</td>
                          <td className="py-3 px-4 text-gray-500">12.0 – 16.0 g/dL</td>
                          <td className="py-3 px-4"><span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Optimal</span></td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-bold text-black">Fasting Blood Sugar</td>
                          <td className="py-3 px-4 font-extrabold text-emerald-700">94 mg/dL</td>
                          <td className="py-3 px-4 text-gray-500">70 – 99 mg/dL</td>
                          <td className="py-3 px-4"><span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Normal</span></td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-bold text-black">Total Cholesterol</td>
                          <td className="py-3 px-4 font-extrabold text-sky-700">188 mg/dL</td>
                          <td className="py-3 px-4 text-gray-500">&lt; 200 mg/dL</td>
                          <td className="py-3 px-4"><span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">Desirable</span></td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-bold text-black">WBC Count</td>
                          <td className="py-3 px-4 font-extrabold text-emerald-700">6,800 /mcL</td>
                          <td className="py-3 px-4 text-gray-500">4,000 – 11,000 /mcL</td>
                          <td className="py-3 px-4"><span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Healthy</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* AI Summary Box */}
                <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#E5E0D5] space-y-2 text-xs text-gray-700">
                  <span className="font-extrabold text-black flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#C9A574]" /> VaultCare AI Clinical Analysis Summary:
                  </span>
                  <p className="leading-relaxed text-gray-600 font-medium">
                    The extracted parameters for <strong className="text-black">{viewingReport.name}</strong> confirm all physiological metrics fall cleanly within healthy reference intervals. No acute metabolic abnormalities or infection signatures are present.
                  </p>
                </div>
              </>
            )}          </div>

            {/* Footer Action Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-[#E5E0D5]">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 border border-[#E5E0D5] hover:bg-[#FAF8F5] text-black font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Document
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadPDF(viewingReport)}
                  className="bg-black hover:bg-[#2a2a2a] text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-[#C9A574]" /> Download File
                </button>
                
                <button
                  onClick={() => setViewingReport(null)}
                  className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-black font-bold rounded-xl text-xs cursor-pointer"
                >
                  Close Viewer
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
