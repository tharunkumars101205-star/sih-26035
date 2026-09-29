import React, { useState } from 'react';
import {
  ArrowLeft,
  Download,
  FileText,
  Printer,
  FileCheck,
  Building2,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  Share2,
  Sliders,
  Eye,
  Check,
  Sparkles,
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { ReportExportService } from '../../services/reportExportService';
import { StatusBadge } from '../../components/ui/StatusBadge';

interface ReportDetailPageProps {
  id: string;
  onNavigate: (path: string) => void;
}

export const ReportDetailPage: React.FC<ReportDetailPageProps> = ({ id, onNavigate }) => {
  const report = storageService.getReportById(id);
  const evaluations = storageService.getEvaluations();
  const settings = storageService.getSettings();

  const [showWatermark, setShowWatermark] = useState(true);
  const [showEnvConditions, setShowEnvConditions] = useState(true);
  const [showTechnicalSpecs, setShowTechnicalSpecs] = useState(true);
  const [showDigitalSeal, setShowDigitalSeal] = useState(true);
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [conclusionText, setConclusionText] = useState(report?.overallConclusion || '');

  if (!report) {
    return (
      <div className="p-12 text-center text-slate-500">
        <h2 className="text-lg font-bold text-slate-800">Report Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">The requested test report could not be loaded.</p>
        <button
          onClick={() => onNavigate('/reports')}
          className="mt-4 px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded"
        >
          Return to Reports Archive
        </button>
      </div>
    );
  }

  const evaluation =
    evaluations.find((e) => e.id === report.evaluationId) || evaluations[0];
  const inst = evaluation.instrumentSnapshot;
  const mfr = evaluation.manufacturerSnapshot;
  const lab = evaluation.laboratoryConditions;

  const handleDownloadPdf = () => {
    const customizedReport = { ...report, overallConclusion: conclusionText };
    ReportExportService.generatePdfReport(customizedReport, evaluation, settings);
  };

  const handleDownloadDocx = async () => {
    const customizedReport = { ...report, overallConclusion: conclusionText };
    await ReportExportService.generateDocxReport(customizedReport, evaluation, settings);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/reports')}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-teal-900">
                {report.reportNumber}
              </span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-teal-50 text-teal-700 border border-teal-200">
                Revision {report.version}
              </span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 mt-0.5">
              Standardized Pattern Evaluation Report (OIML R 76-2)
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCustomizerOpen(!customizerOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Sliders size={13} />
            <span>Customize Report</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded hover:bg-rose-100 transition-colors shadow-xs"
          >
            <Download size={13} />
            <span>Download PDF</span>
          </button>

          <button
            onClick={handleDownloadDocx}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-800 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors shadow-xs"
          >
            <FileText size={13} />
            <span>Download Word (.docx)</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-300 rounded hover:bg-slate-100 transition-colors"
          >
            <Printer size={13} />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Interactive Report Customizer Panel */}
      {customizerOpen && (
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3 text-xs print:hidden animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders size={14} className="text-cyan-700" />
              <span>Report Publishing Customizer</span>
            </span>
            <span className="text-[11px] text-slate-500">Live preview updates automatically</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showWatermark}
                onChange={(e) => setShowWatermark(e.target.checked)}
                className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
              />
              <span className="text-slate-700 font-medium">Sample Notice Banner</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showTechnicalSpecs}
                onChange={(e) => setShowTechnicalSpecs(e.target.checked)}
                className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
              />
              <span className="text-slate-700 font-medium">Technical Specifications</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showEnvConditions}
                onChange={(e) => setShowEnvConditions(e.target.checked)}
                className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
              />
              <span className="text-slate-700 font-medium">Environmental Conditions</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showDigitalSeal}
                onChange={(e) => setShowDigitalSeal(e.target.checked)}
                className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
              />
              <span className="text-slate-700 font-medium">Digital Review Seal</span>
            </label>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">
              Custom Overall Determination / Conclusion Note:
            </label>
            <textarea
              rows={2}
              value={conclusionText}
              onChange={(e) => setConclusionText(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded font-sans text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      )}

      {/* Printable Sheet Presentation */}
      <div className="bg-white p-8 md:p-12 rounded-lg border border-slate-300 shadow-md text-slate-900 space-y-8 font-sans print:shadow-none print:border-none print:p-0">
        {/* Lab Header Banner */}
        <div className="border-b-2 border-slate-900 pb-5 space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-lg font-extrabold tracking-tight text-slate-900 uppercase">
                {settings.laboratoryName}
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                {settings.addressLine1}, {settings.cityStatePincode}
              </div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">
                Accreditation: {settings.accreditationNumber} · ISO/IEC 17025 Traceable
              </div>
            </div>

            <div className="text-right">
              <span className="font-mono text-xs font-bold text-slate-900 block">
                {report.reportNumber}
              </span>
              <span className="text-[11px] text-slate-500 font-mono block">
                Date: {new Date(report.generatedAt).toLocaleDateString()}
              </span>
              <span className="text-[11px] text-slate-500 block">
                Standard: OIML R 76-1: 2006
              </span>
            </div>
          </div>
        </div>

        {/* Prominent Sample Banner */}
        {showWatermark && (
          <div className="p-2.5 rounded bg-amber-50 border border-amber-300 text-center text-xs font-bold text-amber-900 tracking-wide uppercase">
            Sample — Demonstration Report as per OIML R 76-2 Format (Not an Official Statutory Certificate)
          </div>
        )}

        {/* Report Title */}
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            PATTERN EVALUATION TEST REPORT
          </h2>
          <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
            Non-Automatic Weighing Instruments (NAWIs)
          </div>
        </div>

        {/* 1. Administrative Information */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
            1. Administrative & Manufacturer Information
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded border border-slate-200">
            <div>
              <span className="text-slate-500 block">Manufacturer</span>
              <span className="font-bold text-slate-900">{mfr.name}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Manufacturer Ref / License</span>
              <span className="font-mono font-semibold text-slate-800">{mfr.licenseNumber || 'MFR-IND-2024'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Country of Origin</span>
              <span className="font-semibold text-slate-800">{mfr.country}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Evaluation Reference</span>
              <span className="font-mono font-bold text-slate-900">{evaluation.evaluationNumber}</span>
            </div>
          </div>
        </div>

        {/* 2. Technical & Metrological Specifications */}
        {showTechnicalSpecs && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
              2. Technical & Metrological Parameters
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded border border-slate-200 font-mono">
              <div>
                <span className="text-slate-500 block font-sans">Model Designation</span>
                <span className="font-bold text-slate-900">{inst.modelDesignation}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-sans">Serial Number</span>
                <span className="font-bold text-slate-900">{inst.serialNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-sans">Accuracy Class</span>
                <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 inline-block">
                  Class {inst.accuracyClass}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block font-sans">Instrument Category</span>
                <span className="font-semibold text-slate-800 uppercase text-[11px]">
                  {inst.type.replace(/_/g, ' ')}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block font-sans">Max Capacity (Max)</span>
                <span className="font-bold text-slate-900 text-sm">
                  {inst.maxCapacity} {inst.measurementUnit}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block font-sans">Min Capacity (Min)</span>
                <span className="font-semibold text-slate-800">
                  {inst.minCapacity} {inst.measurementUnit}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block font-sans">Verification Interval (e)</span>
                <span className="font-semibold text-slate-800">
                  {inst.verificationInterval} {inst.measurementUnit}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block font-sans">Resolution (n = Max/e)</span>
                <span className="font-bold text-cyan-800">
                  {inst.calculatedN.toLocaleString()} intervals
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 3. Environmental Conditions & Traceability */}
        {showEnvConditions && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
              3. Environmental Conditions & Reference Standards
            </h3>

            <div className="text-xs space-y-1.5 text-slate-700 bg-slate-50 p-4 rounded border border-slate-200 font-mono">
              <div className="flex justify-between">
                <span>Ambient Temperature:</span>
                <span className="font-bold text-slate-900">{lab.ambientTempStart}°C to {lab.ambientTempEnd}°C</span>
              </div>
              <div className="flex justify-between">
                <span>Relative Humidity:</span>
                <span className="font-bold text-slate-900">{lab.relativeHumidityStart}% to {lab.relativeHumidityEnd}%</span>
              </div>
              <div className="flex justify-between">
                <span>Barometric Pressure:</span>
                <span className="font-bold text-slate-900">{lab.barometricPressureStart} hPa to {lab.barometricPressureEnd} hPa</span>
              </div>
              <div className="flex justify-between">
                <span>Reference Standard Weights Set:</span>
                <span className="font-bold text-slate-900">{lab.weightsSetReference} (Class {lab.weightsClass})</span>
              </div>
              <div className="flex justify-between">
                <span>Calibration Certificate:</span>
                <span className="font-bold text-slate-900">{lab.weightsCalibrationCertNo} (Expiry: {lab.weightsCertExpiryDate})</span>
              </div>
              <div className="flex justify-between">
                <span>Local Acceleration of Gravity:</span>
                <span className="font-bold text-slate-900">{lab.localGravityMs2} m/s²</span>
              </div>
            </div>
          </div>
        )}

        {/* 4. Prescribed Test Results Summary */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
            4. Summary of Prescribed OIML R 76-1 Test Evaluations
          </h3>

          <table className="w-full text-left text-xs border-collapse border border-slate-200">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-2 px-3 border border-slate-200">Clause</th>
                <th className="py-2 px-3 border border-slate-200">Prescribed Test Procedure</th>
                <th className="py-2 px-3 border border-slate-200">Execution Status</th>
                <th className="py-2 px-3 border border-slate-200 text-center">Metrological Determination</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {Object.values(evaluation.testExecutions).map((t) => (
                <tr key={t.testProcedureId} className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-mono font-bold text-slate-700 border border-slate-200">
                    {t.testProcedureId === 'oiml_a441_weighing'
                      ? '3.5.1 / A.4.4.1'
                      : t.testProcedureId === 'oiml_a442_repeatability'
                      ? '3.6.1 / A.4.4.2'
                      : t.testProcedureId === 'oiml_a47_eccentricity'
                      ? '3.6.2 / A.4.7'
                      : t.testProcedureId === 'oiml_a45_discrimination'
                      ? '3.8 / A.4.5'
                      : t.testProcedureId === 'oiml_a48_zero_setting'
                      ? '3.9 / A.4.8'
                      : t.testProcedureId === 'oiml_clauses4_functional'
                      ? 'Clause 4'
                      : 'Annex A'}
                  </td>
                  <td className="py-2 px-3 font-medium text-slate-900 border border-slate-200 capitalize">
                    {t.testProcedureId.replace('oiml_', '').replace(/_/g, ' ')}
                  </td>
                  <td className="py-2 px-3 text-slate-600 border border-slate-200 uppercase font-mono text-[11px]">
                    {t.isIncluded ? t.status.replace('_', ' ') : 'NOT APPLICABLE'}
                  </td>
                  <td className="py-2 px-3 text-center border border-slate-200">
                    <StatusBadge status={t.overallProcedureCompliance} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 5. Determination & Conclusion */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
            5. Metrological Determination & Conclusion
          </h3>

          <div className="p-4 rounded bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans">
            {conclusionText || report.overallConclusion}
          </div>
        </div>

        {/* Signatures & Seal Block */}
        {showDigitalSeal && (
          <div className="pt-6 border-t-2 border-slate-200 grid grid-cols-2 gap-8 text-xs">
            <div className="space-y-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 block">
                Testing Officer:
              </span>
              <div className="font-bold text-slate-900">{evaluation.assignedEngineer.name}</div>
              <div className="text-[11px] text-slate-500">Senior Metrological Testing Officer</div>
              <div className="font-mono text-[10px] text-slate-400 mt-2">
                Digital Signature ID: METRA-TS-2026-ENG-01
              </div>
            </div>

            <div className="space-y-2 text-right">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 block">
                Technical Reviewer & Approver:
              </span>
              <div className="font-bold text-slate-900">{report.signatureSignerName || evaluation.assignedReviewer.name}</div>
              <div className="text-[11px] text-slate-500">Principal Metrologist & Directorate Approver</div>
              <div className="font-mono text-[10px] text-emerald-700 font-semibold mt-2">
                ✓ Digital Review Seal: IND-LM-REV-2026-88 (Verified)
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
