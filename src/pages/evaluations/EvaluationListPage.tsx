import React, { useState } from 'react';
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  ArrowRight,
  FlaskConical,
  FileCheck,
  UserCheck,
  Download,
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { EvaluationStatus } from '../../types';

interface EvaluationListPageProps {
  onNavigate: (path: string) => void;
}

export const EvaluationListPage: React.FC<EvaluationListPageProps> = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const evaluations = storageService.getEvaluations();

  const handleExportCsv = () => {
    let csv = 'Evaluation_Number,Instrument_ID,Model_Designation,Manufacturer,Testing_Officer,Reviewer,Compliance_Verdict,Status,Created_Date\n';
    filtered.forEach((ev) => {
      csv += `"${ev.evaluationNumber}","${ev.instrumentSnapshot.instrumentId}","${ev.instrumentSnapshot.modelDesignation}","${ev.manufacturerSnapshot.name}","${ev.assignedEngineer.name}","${ev.assignedReviewer.name}","${ev.complianceSummary.overallVerdict}","${ev.status}","${new Date(ev.createdAt).toLocaleDateString()}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `METRALAB_Evaluations_Register_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = evaluations.filter((ev) => {
    const matchesSearch =
      ev.evaluationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.instrumentSnapshot.modelDesignation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.manufacturerSnapshot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.assignedEngineer.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || ev.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Evaluations Register
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Pattern evaluations, type approvals, and verification plans linked to OIML R 76-1 specifications.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors shadow-2xs"
            title="Download Evaluations Register as CSV"
          >
            <Download size={13} />
            <span>Export Register CSV</span>
          </button>

          <button
            onClick={() => onNavigate('/evaluations/new')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Plus size={14} />
            <span>New Evaluation Wizard</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Evaluation ID, Model, Manufacturer, or Testing Officer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded bg-white text-slate-700 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="in_progress">In Progress</option>
            <option value="submitted">Submitted for Review</option>
            <option value="changes_requested">Changes Requested</option>
            <option value="approved">Approved</option>
            <option value="report_generated">Report Generated</option>
          </select>
        </div>
      </div>

      {/* Evaluations Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Evaluation ID</th>
                <th className="py-3 px-4">Instrument & Model</th>
                <th className="py-3 px-4">Manufacturer</th>
                <th className="py-3 px-4">Testing Officer</th>
                <th className="py-3 px-4">Technical Reviewer</th>
                <th className="py-3 px-4">Compliance Verdict</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No evaluations found matching the search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((ev) => (
                  <tr
                    key={ev.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    onClick={() => onNavigate(`/evaluations/${ev.id}`)}
                  >
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900">
                        {ev.evaluationNumber}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(ev.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900 truncate max-w-xs">
                        {ev.instrumentSnapshot.modelDesignation}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Class {ev.instrumentSnapshot.accuracyClass} · Max {ev.instrumentSnapshot.maxCapacity} {ev.instrumentSnapshot.measurementUnit}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-700">
                      <div>{ev.manufacturerSnapshot.name}</div>
                    </td>

                    <td className="py-3 px-4 text-slate-700">
                      <div>{ev.assignedEngineer.name}</div>
                    </td>

                    <td className="py-3 px-4 text-slate-700">
                      <div>{ev.assignedReviewer.name}</div>
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={ev.complianceSummary.overallVerdict} size="sm" />
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={ev.status} size="sm" />
                    </td>

                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onNavigate(`/test-execution/${ev.id}`)}
                          className="px-2.5 py-1 text-xs font-semibold bg-cyan-700 text-white rounded hover:bg-cyan-800 transition-colors"
                          title="Open Test Observation Workbench"
                        >
                          Execute Tests
                        </button>
                        <button
                          onClick={() => onNavigate(`/evaluations/${ev.id}`)}
                          className="px-2 py-1 text-xs font-medium border border-slate-200 rounded hover:bg-slate-100 text-slate-700"
                        >
                          View
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
