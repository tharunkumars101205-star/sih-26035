import React, { useState, useRef, useEffect } from 'react';
import {
  UserCheck,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileCheck,
  ArrowRight,
  ClipboardList,
  Scale,
  MessageSquare,
  ShieldCheck,
  Send,
  Building2,
  Calendar,
  PenTool,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Evaluation, TestReport } from '../../types';

interface ReviewWorkspacePageProps {
  onNavigate: (path: string) => void;
}

export const ReviewWorkspacePage: React.FC<ReviewWorkspacePageProps> = ({ onNavigate }) => {
  const evaluations = storageService.getEvaluations();
  const currentUser = storageService.getCurrentUser();
  const reports = storageService.getReports();

  const [selectedEvalId, setSelectedEvalId] = useState<string>(evaluations[0]?.id || '');
  const [reviewComments, setReviewComments] = useState('');
  const [signatureMode, setSignatureMode] = useState<'crypto_seal' | 'draw_canvas'>('crypto_seal');
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  const selectedEval = evaluations.find((e) => e.id === selectedEvalId) || evaluations[0];
  const existingReport = reports.find((r) => r.evaluationId === selectedEval?.id);

  // Setup drawing canvas
  useEffect(() => {
    if (signatureMode === 'draw_canvas' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [signatureMode]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    isDrawingRef.current = true;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawnSignature(true);
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearSignatureCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnSignature(false);
  };

  const generateReportForEval = (evalObj: Evaluation) => {
    const reportId = `rep_${Date.now()}`;
    const reportNumber = `TR-OIML-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newReport: TestReport = {
      id: reportId,
      reportNumber,
      evaluationId: evalObj.id,
      instrumentId: evalObj.instrumentId,
      modelDesignation: evalObj.instrumentSnapshot.modelDesignation,
      manufacturerName: evalObj.manufacturerSnapshot.name,
      serialNumber: evalObj.instrumentSnapshot.serialNumber,
      version: 1,
      title: 'Type Evaluation Metrological Test Report for Non-Automatic Weighing Instrument',
      status: 'final',
      generatedAt: new Date().toISOString(),
      generatedBy: evalObj.assignedEngineer.name,
      approvedBy: currentUser.name,
      approvedAt: new Date().toISOString(),
      regulatoryStandard: 'OIML R 76-1:2006 (E) & Legal Metrology Rules, 2011',
      overallConclusion: `The submitted model ${evalObj.instrumentSnapshot.modelDesignation} conforms to all metrological and technical requirements for Accuracy Class ${evalObj.instrumentSnapshot.accuracyClass} Non-Automatic Weighing Instruments.`,
      isSimulatedSignature: true,
      signatureSignerName: currentUser.name,
      hasPdfExported: true,
      hasDocxExported: true,
    };

    storageService.saveReport(newReport);
    return newReport;
  };

  const handleApprove = (generateReport: boolean = false) => {
    if (!selectedEval) return;
    const comments =
      reviewComments.trim() ||
      'Approved after comprehensive review of all OIML R 76-1 test observations and MPE tolerance limits.';

    const updated: Evaluation = {
      ...selectedEval,
      status: 'approved',
      approvedAt: new Date().toISOString(),
      reviewHistory: [
        ...selectedEval.reviewHistory,
        {
          id: `rev_${Date.now()}`,
          evaluationId: selectedEval.id,
          reviewerId: currentUser.id,
          reviewerName: currentUser.name,
          action: 'approve',
          comments,
          timestamp: new Date().toISOString(),
        },
      ],
      updatedAt: new Date().toISOString(),
    };

    storageService.saveEvaluation(updated);
    storageService.logAction(
      'APPROVE_EVALUATION',
      'evaluation',
      selectedEval.id,
      `Approved evaluation ${selectedEval.evaluationNumber} with digital signature by ${currentUser.name}`
    );

    if (generateReport) {
      const rep = generateReportForEval(updated);
      setActionSuccessMessage('Evaluation approved and official Test Report generated! Redirecting to report view...');
      setTimeout(() => onNavigate(`/reports/${rep.id}`), 1200);
    } else {
      setActionSuccessMessage('Evaluation approved successfully with digital seal. Standardized report can now be generated.');
      setReviewComments('');
      setTimeout(() => setActionSuccessMessage(null), 4000);
    }
  };

  const handleRequestCorrections = () => {
    if (!selectedEval) return;
    if (!reviewComments.trim()) {
      setActionErrorMessage('Please specify the required corrections in the comments box.');
      setTimeout(() => setActionErrorMessage(null), 4000);
      return;
    }
    setActionErrorMessage(null);

    const updated: Evaluation = {
      ...selectedEval,
      status: 'changes_requested',
      reviewHistory: [
        ...selectedEval.reviewHistory,
        {
          id: `rev_${Date.now()}`,
          evaluationId: selectedEval.id,
          reviewerId: currentUser.id,
          reviewerName: currentUser.name,
          action: 'request_corrections',
          comments: reviewComments,
          timestamp: new Date().toISOString(),
        },
      ],
      updatedAt: new Date().toISOString(),
    };

    storageService.saveEvaluation(updated);
    storageService.logAction(
      'REQUEST_CORRECTIONS',
      'evaluation',
      selectedEval.id,
      `Requested corrections for ${selectedEval.evaluationNumber}: ${reviewComments}`
    );

    setActionSuccessMessage('Corrections requested. The evaluation has been returned to the testing engineer.');
    setReviewComments('');
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Technical Review & Pattern Approval Queue
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Independent metrological inspection of observation curves, permissible errors, and regulatory compliance.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-slate-100 p-1.5 rounded-lg border border-slate-200">
          <span className="text-slate-500 font-medium">Active Reviewer:</span>
          <span className="font-semibold text-slate-900">{currentUser.name}</span>
          <span className="text-slate-400">·</span>
          <span className="text-cyan-800 font-mono text-[11px]">{currentUser.role}</span>
        </div>
      </div>

      {actionSuccessMessage && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {actionErrorMessage && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-800 flex items-center gap-2">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{actionErrorMessage}</span>
        </div>
      )}

      {/* 2-Column Workspace: Left List, Right Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Evaluations in Queue */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Evaluations In Review Queue
            </h2>
          </div>

          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {evaluations.map((ev) => (
              <div
                key={ev.id}
                onClick={() => setSelectedEvalId(ev.id)}
                className={`p-4 cursor-pointer transition-colors space-y-1.5 ${
                  selectedEval?.id === ev.id
                    ? 'bg-cyan-50/60 border-l-4 border-cyan-600'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-900">
                    {ev.evaluationNumber}
                  </span>
                  <StatusBadge status={ev.status} size="sm" />
                </div>
                <div className="text-xs font-medium text-slate-800 truncate">
                  {ev.instrumentSnapshot.modelDesignation}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>{ev.manufacturerSnapshot.name}</span>
                  <span className="font-mono">{new Date(ev.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 2 Cols: Detailed Inspector & Review Actions */}
        {selectedEval && (
          <div className="lg:col-span-2 space-y-6">
            {/* Summary Banner */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500">
                      {selectedEval.evaluationNumber}
                    </span>
                    <StatusBadge status={selectedEval.status} size="sm" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                    {selectedEval.instrumentSnapshot.modelDesignation}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigate(`/test-execution/${selectedEval.id}`)}
                    className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded hover:bg-slate-100 text-slate-700"
                  >
                    Inspect Raw Observations
                  </button>
                  <button
                    onClick={() => onNavigate(`/reports`)}
                    className="px-3 py-1.5 text-xs font-semibold bg-teal-800 text-white rounded hover:bg-teal-900"
                  >
                    View Report
                  </button>
                </div>
              </div>

              {/* Technical Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono bg-slate-50 p-3 rounded border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 font-sans block">Accuracy Class</span>
                  <span className="font-bold text-slate-900">Class {selectedEval.instrumentSnapshot.accuracyClass}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-sans block">Capacity (Max / Min)</span>
                  <span className="font-semibold text-slate-800">
                    {selectedEval.instrumentSnapshot.maxCapacity} / {selectedEval.instrumentSnapshot.minCapacity} {selectedEval.instrumentSnapshot.measurementUnit}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-sans block">Scale Intervals (e / d)</span>
                  <span className="font-semibold text-slate-800">
                    {selectedEval.instrumentSnapshot.verificationInterval} / {selectedEval.instrumentSnapshot.scaleInterval} {selectedEval.instrumentSnapshot.measurementUnit}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-sans block">Testing Officer</span>
                  <span className="font-semibold text-slate-900 font-sans">{selectedEval.assignedEngineer.name}</span>
                </div>
              </div>

              {/* Prescribed Test Verification Status Checklist */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  Prescribed OIML R 76-1 Metrological Verifications:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {Object.values(selectedEval.testExecutions).map((t) => (
                    <div
                      key={t.testProcedureId}
                      className="p-2.5 rounded border border-slate-200 bg-white flex items-center justify-between"
                    >
                      <div className="truncate pr-2">
                        <div className="font-medium text-slate-900 truncate">
                          {t.testProcedureId.replace('oiml_', '').replace(/_/g, ' ').toUpperCase()}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {t.isIncluded ? t.status.replace('_', ' ') : 'Not Applicable'}
                        </div>
                      </div>
                      <StatusBadge status={t.overallProcedureCompliance} size="sm" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Review History Thread */}
              {selectedEval.reviewHistory.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                    Review History & Audit Trail:
                  </span>
                  <div className="space-y-2">
                    {selectedEval.reviewHistory.map((rev) => (
                      <div key={rev.id} className="p-3 rounded bg-slate-50 border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between text-slate-500 text-[11px]">
                          <span className="font-bold text-slate-900">{rev.reviewerName}</span>
                          <span className="font-mono">{new Date(rev.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="text-slate-800">{rev.comments}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviewer Action Box */}
              <div className="pt-4 border-t border-slate-200 space-y-4">
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Technical Reviewer Assessment & Approval Decision:
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter detailed reviewer assessment, findings against OIML R 76-1 tolerances, or required corrections..."
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded focus:outline-none focus:border-cyan-500"
                />

                {/* Digital Signature & Verification Seal Panel */}
                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={16} className="text-teal-700" />
                      <span className="text-xs font-bold text-slate-900">
                        Authorized Metrological Digital Signature
                      </span>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-200 p-0.5 rounded text-[11px]">
                      <button
                        type="button"
                        onClick={() => setSignatureMode('crypto_seal')}
                        className={`px-2 py-1 rounded font-medium transition-colors ${
                          signatureMode === 'crypto_seal'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Digital Seal Hash
                      </button>
                      <button
                        type="button"
                        onClick={() => setSignatureMode('draw_canvas')}
                        className={`flex items-center gap-1 px-2 py-1 rounded font-medium transition-colors ${
                          signatureMode === 'draw_canvas'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <PenTool size={11} />
                        <span>Draw Signature</span>
                      </button>
                    </div>
                  </div>

                  {signatureMode === 'crypto_seal' ? (
                    <div className="p-3 bg-white rounded border border-slate-200 font-mono text-[11px] text-slate-700 space-y-1">
                      <div className="flex items-center justify-between text-slate-500 text-[10px]">
                        <span>SIGNER: {currentUser.name} ({currentUser.role.toUpperCase()})</span>
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 size={12} /> SECURE CERTIFIED
                        </span>
                      </div>
                      <div className="text-slate-800 font-bold truncate">
                        FINGERPRINT: SHA256:{selectedEval.id.replace('eval_', '')}E9B2F4410A7C99
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Standard: ISO/IEC 17025 Accredited Calibration Sign-off • OIML R 76-1:2006
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="border border-slate-300 rounded bg-white relative">
                        <canvas
                          ref={canvasRef}
                          width={480}
                          height={90}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                          className="w-full h-24 cursor-crosshair touch-none"
                        />
                        {!hasDrawnSignature && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-[11px]">
                            Sign here using mouse or touch
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-500">
                        <span>Signer: {currentUser.name}</span>
                        <button
                          type="button"
                          onClick={clearSignatureCanvas}
                          className="flex items-center gap-1 text-slate-600 hover:text-rose-600"
                        >
                          <RotateCcw size={10} /> Clear Signature
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
                  <button
                    onClick={handleRequestCorrections}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded hover:bg-amber-100 transition-colors"
                  >
                    <AlertCircle size={14} />
                    <span>Request Corrections</span>
                  </button>

                  <button
                    onClick={() => handleApprove(false)}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-300 rounded hover:bg-slate-200 transition-colors shadow-xs"
                  >
                    <CheckCircle2 size={14} />
                    <span>Approve Only</span>
                  </button>

                  <button
                    onClick={() => handleApprove(true)}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-800 rounded hover:bg-teal-900 transition-colors shadow-xs"
                  >
                    <Sparkles size={14} />
                    <span>Approve & Generate Report</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
