import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Scale,
  CheckCircle2,
  Clock,
  FileCheck,
  Calendar,
  Users,
} from 'lucide-react';
import { storageService } from '../../services/storageService';

export const AnalyticsPage: React.FC = () => {
  const instruments = storageService.getInstruments();
  const evaluations = storageService.getEvaluations();
  const reports = storageService.getReports();

  // Class distributions
  const classCounts = {
    I: instruments.filter((i) => i.accuracyClass === 'I').length,
    II: instruments.filter((i) => i.accuracyClass === 'II').length,
    III: instruments.filter((i) => i.accuracyClass === 'III').length,
    IIII: instruments.filter((i) => i.accuracyClass === 'IIII').length,
  };

  // Status distributions
  const evalStatuses = {
    draft: evaluations.filter((e) => e.status === 'draft').length,
    in_progress: evaluations.filter((e) => e.status === 'in_progress').length,
    submitted: evaluations.filter((e) => e.status === 'submitted').length,
    approved: evaluations.filter((e) => e.status === 'approved').length,
    report_generated: evaluations.filter((e) => e.status === 'report_generated').length,
  };

  // Compliance outcomes
  const passCount = evaluations.filter((e) => e.complianceSummary.overallVerdict === 'pass').length;
  const reqVerifCount = evaluations.filter((e) => e.complianceSummary.overallVerdict === 'requires_verification').length;
  const failCount = evaluations.filter((e) => e.complianceSummary.overallVerdict === 'fail').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Laboratory Testing & Throughput Analytics
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Empirical metrics computed dynamically from active test records, instrument registrations, and evaluation approvals.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs">
          Evaluation Cohort: {evaluations.length} Active Workflows
        </div>
      </div>

      {/* Grid: Charts & KPI Distributions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chart 1: Accuracy Class Distribution */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Instruments By Accuracy Class (OIML R 76-1)
            </h2>
            <p className="text-[11px] text-slate-500">Distribution across precision tiers.</p>
          </div>

          <div className="space-y-3 pt-2">
            {Object.entries(classCounts).map(([cls, count]) => {
              const pct = instruments.length > 0 ? (count / instruments.length) * 100 : 0;
              return (
                <div key={cls} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-slate-700">
                    <span>Accuracy Class {cls}</span>
                    <span className="font-mono font-bold text-slate-900">
                      {count} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-600 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Evaluation Lifecycle Status */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Evaluation Pipeline Status Breakdown
            </h2>
            <p className="text-[11px] text-slate-500">Stages in the type evaluation workflow.</p>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { label: 'In Progress (Testing)', count: evalStatuses.in_progress, color: 'bg-cyan-500' },
              { label: 'Submitted (Review Queue)', count: evalStatuses.submitted, color: 'bg-amber-500' },
              { label: 'Approved by Reviewer', count: evalStatuses.approved, color: 'bg-blue-600' },
              { label: 'Report Generated & Archived', count: evalStatuses.report_generated, color: 'bg-teal-600' },
            ].map((item) => {
              const pct = evaluations.length > 0 ? (item.count / evaluations.length) * 100 : 0;
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-slate-700">
                    <span>{item.label}</span>
                    <span className="font-mono font-bold text-slate-900">
                      {item.count} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-300`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 3: Metrological Compliance Outcomes */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Metrological Compliance Rate
            </h2>
            <p className="text-[11px] text-slate-500">Based on verified Table 6 permissible error limits.</p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-4 rounded bg-emerald-50 border border-emerald-200">
              <span className="text-2xl font-bold font-mono text-emerald-800 tabular-nums">
                {passCount}
              </span>
              <span className="text-xs font-semibold text-emerald-900 block mt-1">Conforming</span>
            </div>

            <div className="p-4 rounded bg-amber-50 border border-amber-200">
              <span className="text-2xl font-bold font-mono text-amber-800 tabular-nums">
                {reqVerifCount}
              </span>
              <span className="text-xs font-semibold text-amber-900 block mt-1">In Progress</span>
            </div>

            <div className="p-4 rounded bg-rose-50 border border-rose-200">
              <span className="text-2xl font-bold font-mono text-rose-800 tabular-nums">
                {failCount}
              </span>
              <span className="text-xs font-semibold text-rose-900 block mt-1">Non-Conforming</span>
            </div>
          </div>
        </div>

        {/* Chart 4: Officer Workload Distribution */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Testing Officer & Reviewer Allocation
            </h2>
            <p className="text-[11px] text-slate-500">Active personnel workload.</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900">Rajesh V. Sharma</div>
                <div className="text-[11px] text-slate-500">Senior Metrological Testing Officer</div>
              </div>
              <span className="font-mono font-bold text-cyan-800 bg-white px-2.5 py-1 rounded border border-slate-200">
                {evaluations.length} Evaluations Assigned
              </span>
            </div>

            <div className="p-3 rounded bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900">Dr. Sunita Deshmukh</div>
                <div className="text-[11px] text-slate-500">Principal Metrologist & Lead Reviewer</div>
              </div>
              <span className="font-mono font-bold text-teal-800 bg-white px-2.5 py-1 rounded border border-slate-200">
                {reports.length} Reports Authorized
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
