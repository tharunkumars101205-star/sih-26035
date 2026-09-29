import React, { useState } from 'react';
import {
  Scale,
  ClipboardList,
  FileCheck,
  AlertCircle,
  Clock,
  ArrowRight,
  Plus,
  TrendingUp,
  ShieldCheck,
  FileText,
  ExternalLink,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Building2,
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { StatusBadge } from '../../components/ui/StatusBadge';

interface DashboardPageProps {
  onNavigate: (path: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [dateFilter, setDateFilter] = useState<'all' | '30d' | '7d'>('all');

  const instruments = storageService.getInstruments();
  const evaluations = storageService.getEvaluations();
  const reports = storageService.getReports();
  const auditLogs = storageService.getAuditLogs();
  const currentUser = storageService.getCurrentUser();

  // Metrics
  const totalInstruments = instruments.length;
  const inProgressEvals = evaluations.filter(
    (e) => e.status === 'in_progress' || e.status === 'draft'
  ).length;
  const pendingReviews = evaluations.filter((e) => e.status === 'submitted').length;
  const completedReports = reports.length;
  const requiringCorrections = evaluations.filter((e) => e.status === 'changes_requested').length;

  // Outcome distribution across all evaluations
  const passedEvals = evaluations.filter(
    (e) => e.complianceSummary.overallVerdict === 'pass'
  ).length;
  const reqVerifEvals = evaluations.filter(
    (e) => e.complianceSummary.overallVerdict === 'requires_verification'
  ).length;
  const failedEvals = evaluations.filter(
    (e) => e.complianceSummary.overallVerdict === 'fail'
  ).length;

  return (
    <div className="space-y-8">
      {/* Welcome & Context Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Laboratory Operations Dashboard
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Automated OIML R 76 Type Evaluation, MPE Tolerance Verification & Traceable Report Repository.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Segmented Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg text-xs font-medium">
            <button
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1.5 rounded transition-colors ${
                dateFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Records
            </button>
            <button
              onClick={() => setDateFilter('30d')}
              className={`px-3 py-1.5 rounded transition-colors ${
                dateFilter === '30d'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last 30 Days
            </button>
          </div>

          <button
            onClick={() => onNavigate('/evaluations/new')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Plus size={14} />
            <span>New Evaluation</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1 */}
        <button
          onClick={() => onNavigate('/instruments')}
          className="text-left bg-white p-5 rounded-lg border border-slate-200 shadow-xs hover:border-cyan-500 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Registered NAWIs</span>
            <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-cyan-50 group-hover:text-cyan-700 transition-colors">
              <Scale size={16} />
            </div>
          </div>
          <div className="mt-3 text-3xl font-bold font-mono text-slate-900 tabular-nums">
            {totalInstruments}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <span>Classes I, II, III & IIII</span>
            <ArrowRight size={12} className="ml-auto text-slate-400 group-hover:text-cyan-600" />
          </div>
        </button>

        {/* KPI 2 */}
        <button
          onClick={() => onNavigate('/evaluations')}
          className="text-left bg-white p-5 rounded-lg border border-slate-200 shadow-xs hover:border-cyan-500 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">In Progress</span>
            <div className="h-8 w-8 rounded bg-cyan-50 flex items-center justify-center text-cyan-700">
              <Clock size={16} />
            </div>
          </div>
          <div className="mt-3 text-3xl font-bold font-mono text-cyan-900 tabular-nums">
            {inProgressEvals}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <span>Observation recording</span>
            <ArrowRight size={12} className="ml-auto text-slate-400 group-hover:text-cyan-600" />
          </div>
        </button>

        {/* KPI 3 */}
        <button
          onClick={() => onNavigate('/reviews')}
          className="text-left bg-white p-5 rounded-lg border border-slate-200 shadow-xs hover:border-amber-500 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pending Reviews</span>
            <div className="h-8 w-8 rounded bg-amber-50 flex items-center justify-center text-amber-700">
              <ClipboardList size={16} />
            </div>
          </div>
          <div className="mt-3 text-3xl font-bold font-mono text-amber-900 tabular-nums">
            {pendingReviews}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <span>Awaiting sign-off</span>
            <ArrowRight size={12} className="ml-auto text-slate-400 group-hover:text-amber-600" />
          </div>
        </button>

        {/* KPI 4 */}
        <button
          onClick={() => onNavigate('/reports')}
          className="text-left bg-white p-5 rounded-lg border border-slate-200 shadow-xs hover:border-teal-500 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Generated Reports</span>
            <div className="h-8 w-8 rounded bg-teal-50 flex items-center justify-center text-teal-700">
              <FileCheck size={16} />
            </div>
          </div>
          <div className="mt-3 text-3xl font-bold font-mono text-teal-900 tabular-nums">
            {completedReports}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <span>PDF & DOCX archived</span>
            <ArrowRight size={12} className="ml-auto text-slate-400 group-hover:text-teal-600" />
          </div>
        </button>

        {/* KPI 5 */}
        <button
          onClick={() => onNavigate('/evaluations')}
          className="text-left bg-white p-5 rounded-lg border border-slate-200 shadow-xs hover:border-rose-500 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Corrections Required</span>
            <div className="h-8 w-8 rounded bg-rose-50 flex items-center justify-center text-rose-700">
              <AlertCircle size={16} />
            </div>
          </div>
          <div className="mt-3 text-3xl font-bold font-mono text-rose-900 tabular-nums">
            {requiringCorrections}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <span>Returned by Reviewer</span>
            <ArrowRight size={12} className="ml-auto text-slate-400 group-hover:text-rose-600" />
          </div>
        </button>
      </div>

      {/* Main Grid: Pending Reviews & Evaluation Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Evaluation Pipeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Evaluations Register */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Recent Evaluation Activities
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Type evaluations conducted as per OIML R 76-1: 2006 protocols.
                </p>
              </div>
              <button
                onClick={() => onNavigate('/evaluations')}
                className="text-xs font-semibold text-cyan-700 hover:text-cyan-800 flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="divide-y divide-slate-100 overflow-x-auto">
              {evaluations.map((evalItem) => (
                <div
                  key={evalItem.id}
                  onClick={() => onNavigate(`/evaluations/${evalItem.id}`)}
                  className="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {evalItem.evaluationNumber}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs font-medium text-slate-700">
                        {evalItem.instrumentSnapshot.modelDesignation}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{evalItem.manufacturerSnapshot.name}</span>
                      <span>·</span>
                      <span>Class {evalItem.instrumentSnapshot.accuracyClass}</span>
                      <span>·</span>
                      <span>Max {evalItem.instrumentSnapshot.maxCapacity} {evalItem.instrumentSnapshot.measurementUnit}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={evalItem.status} />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate(`/test-execution/${evalItem.id}`);
                      }}
                      className="px-2.5 py-1 text-xs font-medium border border-slate-200 rounded hover:bg-slate-100 text-slate-700"
                    >
                      Open Test
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => onNavigate('/instruments/new')}
              className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs hover:border-slate-300 text-left transition-colors"
            >
              <div className="h-8 w-8 rounded bg-slate-100 text-slate-700 flex items-center justify-center mb-3">
                <Plus size={16} />
              </div>
              <div className="text-xs font-semibold text-slate-900">Register Instrument</div>
              <div className="text-[11px] text-slate-500 mt-1">
                Enter manufacturer specs, Max/Min, e, and d parameters.
              </div>
            </button>

            <button
              onClick={() => onNavigate('/calculations')}
              className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs hover:border-slate-300 text-left transition-colors"
            >
              <div className="h-8 w-8 rounded bg-cyan-50 text-cyan-700 flex items-center justify-center mb-3">
                <TrendingUp size={16} />
              </div>
              <div className="text-xs font-semibold text-slate-900">MPE Calculator</div>
              <div className="text-[11px] text-slate-500 mt-1">
                Interactive verification of OIML Table 6 error tolerances.
              </div>
            </button>

            <button
              onClick={() => onNavigate('/reports')}
              className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs hover:border-slate-300 text-left transition-colors"
            >
              <div className="h-8 w-8 rounded bg-teal-50 text-teal-700 flex items-center justify-center mb-3">
                <FileCheck size={16} />
              </div>
              <div className="text-xs font-semibold text-slate-900">Reports Archive</div>
              <div className="text-[11px] text-slate-500 mt-1">
                Search and export completed PDF and Word test reports.
              </div>
            </button>
          </div>
        </div>

        {/* Right Col: Compliance Breakdown & Activity Audit */}
        <div className="space-y-6">
          {/* Metrological Outcome Breakdown */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
            <h2 className="text-base font-semibold text-slate-900">
              Metrological Compliance Distribution
            </h2>
            <p className="text-xs text-slate-500">
              Evaluated outcomes strictly derived from verified OIML R 76 tolerances.
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    <span>Conforming (Pass)</span>
                  </span>
                  <span className="font-mono font-bold text-slate-900">{passedEvals}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${(passedEvals / (evaluations.length || 1)) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span className="flex items-center gap-1.5">
                    <HelpCircle size={13} className="text-amber-600" />
                    <span>Requires Verification</span>
                  </span>
                  <span className="font-mono font-bold text-slate-900">{reqVerifEvals}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${(reqVerifEvals / (evaluations.length || 1)) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span className="flex items-center gap-1.5">
                    <XCircle size={13} className="text-rose-600" />
                    <span>Non-Conforming (Fail)</span>
                  </span>
                  <span className="font-mono font-bold text-slate-900">{failedEvals}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{ width: `${(failedEvals / (evaluations.length || 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Standard: OIML R 76-1 (2006)</span>
              <button
                onClick={() => onNavigate('/rules')}
                className="text-cyan-700 hover:underline font-medium"
              >
                View Rules
              </button>
            </div>
          </div>

          {/* Traceable Audit Activity Log */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900">
                Recent Audit Trail
              </h2>
              <button
                onClick={() => onNavigate('/history')}
                className="text-xs font-medium text-cyan-700 hover:text-cyan-800"
              >
                Full Log
              </button>
            </div>

            <div className="space-y-4">
              {auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="relative pl-5 text-xs space-y-0.5">
                  <div className="absolute left-0 top-1 h-2 w-2 rounded-full bg-cyan-600 ring-4 ring-cyan-50" />
                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span className="font-medium text-slate-700">{log.actorName}</span>
                    <span className="font-mono">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="text-slate-800 font-normal">
                    {log.details}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
