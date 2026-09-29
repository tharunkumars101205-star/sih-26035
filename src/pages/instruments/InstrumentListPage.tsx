import React, { useState } from 'react';
import {
  Scale,
  Plus,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Building2,
  Download,
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { AccuracyClass, InstrumentStatus } from '../../types';

interface InstrumentListPageProps {
  onNavigate: (path: string) => void;
}

export const InstrumentListPage: React.FC<InstrumentListPageProps> = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const instruments = storageService.getInstruments();

  const handleExportCsv = () => {
    let csv = 'Instrument_ID,Model_Designation,Manufacturer,Serial_Number,Class,Max_Capacity,Min_Capacity,e,d,n,Unit,Location,Status\n';
    filtered.forEach((i) => {
      csv += `"${i.instrumentId}","${i.modelDesignation}","${i.manufacturerName}","${i.serialNumber}","Class ${i.accuracyClass}",${i.maxCapacity},${i.minCapacity},${i.verificationInterval},${i.scaleInterval},${i.calculatedN},"${i.measurementUnit}","${i.laboratoryLocation}","${i.status}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `METRALAB_NAWI_Registry_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = instruments.filter((inst) => {
    const matchesSearch =
      inst.instrumentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.modelDesignation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.manufacturerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClass = classFilter === 'all' || inst.accuracyClass === classFilter;
    const matchesStatus = statusFilter === 'all' || inst.status === statusFilter;

    return matchesSearch && matchesClass && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Instrument & Model Registry
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Registered Non-Automatic Weighing Instruments (NAWIs) with verification parameters (Max, Min, e, d, n).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors shadow-2xs"
            title="Download NAWI Registry as CSV"
          >
            <Download size={13} />
            <span>Export Registry CSV</span>
          </button>

          <button
            onClick={() => onNavigate('/instruments/new')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Plus size={14} />
            <span>Register New NAWI</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Instrument ID, Model, Manufacturer, or Serial..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        {/* Accuracy Class Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Class:</span>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded bg-white text-slate-700 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Classes</option>
            <option value="I">Class I (Special)</option>
            <option value="II">Class II (High)</option>
            <option value="III">Class III (Medium)</option>
            <option value="IIII">Class IIII (Ordinary)</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded bg-white text-slate-700 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Statuses</option>
            <option value="registered">Registered</option>
            <option value="under_evaluation">Under Evaluation</option>
            <option value="approved">Approved</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Instrument ID & Model</th>
                <th className="py-3 px-4">Manufacturer</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Capacity (Max / Min)</th>
                <th className="py-3 px-4">Intervals (e / d)</th>
                <th className="py-3 px-4 font-mono">n = Max/e</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No instruments matching search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((inst) => (
                  <tr
                    key={inst.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    onClick={() => onNavigate(`/instruments/${inst.id}`)}
                  >
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900">
                        {inst.instrumentId}
                      </div>
                      <div className="text-slate-600 truncate max-w-xs mt-0.5">
                        {inst.modelDesignation}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        SN: {inst.serialNumber}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-700">
                      <div className="font-medium">{inst.manufacturerName}</div>
                      <div className="text-[11px] text-slate-400">{inst.laboratoryLocation}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                        Class {inst.accuracyClass}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-700">
                      <div>
                        Max: <span className="font-bold text-slate-900">{inst.maxCapacity}</span> {inst.measurementUnit}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Min: {inst.minCapacity} {inst.measurementUnit}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-700">
                      <div>
                        e = <span className="font-bold text-slate-900">{inst.verificationInterval}</span> {inst.measurementUnit}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        d = {inst.scaleInterval} {inst.measurementUnit}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono font-semibold text-slate-900 tabular-nums">
                      {inst.calculatedN.toLocaleString()}
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={inst.status} size="sm" />
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onNavigate(`/instruments/${inst.id}`)}
                          className="px-2.5 py-1 text-xs font-medium border border-slate-200 rounded hover:bg-slate-100 text-slate-700"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => onNavigate(`/evaluations/new?instrumentId=${inst.id}`)}
                          className="px-2.5 py-1 text-xs font-semibold bg-slate-900 text-white rounded hover:bg-slate-800"
                        >
                          Evaluate
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
