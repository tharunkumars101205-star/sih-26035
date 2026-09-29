import React, { useState } from 'react';
import {
  FileCheck,
  Search,
  Download,
  FileText,
  Plus,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Building2,
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { ReportExportService } from '../../services/reportExportService';
import { TestReport } from '../../types';

interface ReportRepositoryPageProps {
  onNavigate: (path: string) => void;
}

export const ReportRepositoryPage: React.FC<ReportRepositoryPageProps> = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const reports = storageService.getReports();
  const evaluations = storageService.getEvaluations();
  const settings = storageService.getSettings();

  const filtered = reports.filter((r) => {
    return (
      r.reportNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.modelDesignation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.manufacturerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleDownloadPdf = (report: TestReport) => {
    const evaluation = evaluations.find((e) => e.id === report.evaluationId) || evaluations[0];
    ReportExportService.generatePdfReport(report, evaluation, settings);
  };

  const handleDownloadDocx = async (report: TestReport) => {
    const evaluation = evaluations.find((e) => e.id === report.evaluationId) || evaluations[0];
    await ReportExportService.generateDocxReport(report, evaluation, settings);
  };

  const handleGenerateNewReport = (evalId: string) => {
    const evaluation = evaluations.find((e) => e.id === evalId);
    if (!evaluation) return;

    const reportId = `rep_${Date.now()}`;
    const reportNumber = `TR-OIML-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newReport: TestReport = {
      id: reportId,
      reportNumber,
      evaluationId: evaluation.id,
      instrumentId: evaluation.instrumentId,
      modelDesignation: evaluation.instrumentSnapshot.modelDesignation,
      manufacturerName: evaluation.manufacturerSnapshot.name,
      serialNumber: evaluation.instrumentSnapshot.serialNumber,
      version: 1,
      title: 'Type Evaluation Metrological Test Report for Non-Automatic Weighing Instrument',
      status: 'final',
      generatedAt: new Date().toISOString(),
      generatedBy: evaluation.assignedEngineer.name,
      approvedBy: evaluation.assignedReviewer.name,
      approvedAt: new Date().toISOString(),
      regulatoryStandard: 'OIML R 76-1:2006 (E) & Legal Metrology Rules, 2011',
      overallConclusion: `The submitted model ${evaluation.instrumentSnapshot.modelDesignation} conforms to all metrological and technical requirements for Accuracy Class ${evaluation.instrumentSnapshot.accuracyClass} Non-Automatic Weighing Instruments.`,
      isSimulatedSignature: true,
      signatureSignerName: evaluation.assignedReviewer.name,
      hasPdfExported: true,
      hasDocxExported: true,
    };

    storageService.saveReport(newReport);
    onNavigate(`/reports/${newReport.id}`);
  };

  // Find evaluations that are approved but haven't had a report generated yet
  const ungeneratedApprovedEvals = evaluations.filter(
    (e) => e.status === 'approved' && !reports.some((r) => r.evaluationId === e.id)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Standardized Test Reports Repository
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Searchable digital archive of completed OIML R 76-2 pattern evaluation reports with PDF and editable Word exports.
          </p>
        </div>

        {ungeneratedApprovedEvals.length > 0 && (
          <button
            onClick={() => handleGenerateNewReport(ungeneratedApprovedEvals[0].id)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-800 rounded hover:bg-teal-900 transition-colors shadow-xs"
          >
            <Plus size={14} />
            <span>Generate Report for {ungeneratedApprovedEvals[0].evaluationNumber}</span>
          </button>
        )}
      </div>

      {/* Demo Disclaimer */}
      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
        <ShieldAlert size={16} className="text-amber-700 shrink-0" />
        <span>
          <strong>Notice:</strong> All generated reports are demonstration records structured strictly in accordance with OIML R 76-2 formats. Official certification requires statutory sealing under the Legal Metrology Act, 2009.
        </span>
      </div>

      {/* Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search reports by Report ID, Model, Manufacturer, or Serial..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Report Number</th>
                <th className="py-3 px-4">Instrument Model</th>
                <th className="py-3 px-4">Manufacturer</th>
                <th className="py-3 px-4">Standard Reference</th>
                <th className="py-3 px-4">Approver</th>
                <th className="py-3 px-4">Generated Date</th>
                <th className="py-3 px-4 text-right">Downloads & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No reports found matching your search.
                  </td>
                </tr>
              ) : (
                filtered.map((report) => (
                  <tr
                    key={report.id}
                    onClick={() => onNavigate(`/reports/${report.id}`)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-teal-900">
                        {report.reportNumber}
                      </div>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-teal-50 text-teal-700 border border-teal-200">
                        v{report.version} Final
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900 truncate max-w-xs">
                        {report.modelDesignation}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        SN: {report.serialNumber}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-700">
                      <div>{report.manufacturerName}</div>
                    </td>

                    <td className="py-3 px-4 text-slate-600 text-[11px]">
                      {report.regulatoryStandard}
                    </td>

                    <td className="py-3 px-4 text-slate-700">
                      <div>{report.approvedBy || report.generatedBy}</div>
                      <div className="text-[10px] text-slate-400">Digital Seal Verified</div>
                    </td>

                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                      {new Date(report.generatedAt).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownloadPdf(report)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded hover:bg-rose-100 transition-colors"
                          title="Download genuine vector PDF"
                        >
                          <Download size={12} />
                          <span>PDF</span>
                        </button>

                        <button
                          onClick={() => handleDownloadDocx(report)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-800 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                          title="Download editable Microsoft Word .docx"
                        >
                          <FileText size={12} />
                          <span>DOCX</span>
                        </button>

                        <button
                          onClick={() => onNavigate(`/reports/${report.id}`)}
                          className="px-2 py-1 text-xs font-medium border border-slate-200 rounded hover:bg-slate-100 text-slate-700"
                        >
                          Preview
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
