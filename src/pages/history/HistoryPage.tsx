import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  ShieldCheck,
  Calendar,
  Clock,
  ArrowRight,
  Scale,
  ClipboardList,
  FileCheck,
} from 'lucide-react';
import { storageService } from '../../services/storageService';

interface HistoryPageProps {
  onNavigate: (path: string) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('all');

  const auditLogs = storageService.getAuditLogs();
  const instruments = storageService.getInstruments();

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actorName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = targetTypeFilter === 'all' || log.targetType === targetTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Instrument-Wise Traceability & Audit Trail
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Chronological, immutable event logging of all registrations, observation edits, technical reviews, and report generation events.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span>ISO/IEC 17025 Traceability Enabled</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search audit trail by actor, action type, or event details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Record Type:</span>
          <select
            value={targetTypeFilter}
            onChange={(e) => setTargetTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded bg-white text-slate-700 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Events</option>
            <option value="instrument">Instrument Registrations</option>
            <option value="evaluation">Evaluation Lifecycle</option>
            <option value="test_record">Observation Entries</option>
            <option value="review">Reviewer Approvals</option>
            <option value="report">Report Generation</option>
          </select>
        </div>
      </div>

      {/* Timeline View */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-6">
        <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-6">
          {filteredLogs.map((log) => (
            <div key={log.id} className="relative group">
              {/* Event Dot */}
              <div className="absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full bg-cyan-600 border-2 border-white ring-4 ring-cyan-50 group-hover:scale-110 transition-transform" />

              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {log.action}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      by {log.actorName}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 capitalize">
                      ({log.actorRole.replace('_', ' ')})
                    </span>
                  </div>

                  <span className="font-mono text-xs text-slate-400">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>

                <p className="text-xs text-slate-700 pt-1 leading-relaxed">
                  {log.details}
                </p>

                <div className="text-[11px] font-mono text-slate-400">
                  Target ID: <span className="text-slate-600">{log.targetId}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
