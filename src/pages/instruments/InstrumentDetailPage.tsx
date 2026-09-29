import React from 'react';
import {
  ArrowLeft,
  Scale,
  ClipboardList,
  FileCheck,
  FolderArchive,
  Plus,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Building2,
  AlertCircle,
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { calculateMPE } from '../../calculations/nawiEngine';

interface InstrumentDetailPageProps {
  id: string;
  onNavigate: (path: string) => void;
}

export const InstrumentDetailPage: React.FC<InstrumentDetailPageProps> = ({
  id,
  onNavigate,
}) => {
  const instrument = storageService.getInstrumentById(id);

  if (!instrument) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-800">Instrument Not Found</h2>
        <p className="text-xs text-slate-500">The requested NAWI record could not be loaded.</p>
        <button
          onClick={() => onNavigate('/instruments')}
          className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded"
        >
          Return to Registry
        </button>
      </div>
    );
  }

  // Associated evaluations and reports
  const allEvaluations = storageService.getEvaluations();
  const associatedEvaluations = allEvaluations.filter(
    (e) => e.instrumentId === instrument.id || e.instrumentSnapshot.id === instrument.id
  );

  const allReports = storageService.getReports();
  const associatedReports = allReports.filter(
    (r) => r.instrumentId === instrument.id
  );

  const allEvidence = storageService.getEvidence();
  const associatedEvidence = allEvidence.filter(
    (ev) => ev.associatedId === instrument.id || associatedEvaluations.some((ae) => ae.id === ev.associatedId)
  );

  // MPE sample steps for this instrument
  const sampleSteps = [
    { label: 'Minimum Capacity (Min)', load: instrument.minCapacity },
    { label: '25% of Max', load: instrument.maxCapacity * 0.25 },
    { label: '50% of Max (0.5 Max)', load: instrument.maxCapacity * 0.5 },
    { label: 'Maximum Capacity (Max)', load: instrument.maxCapacity },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/instruments')}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-500">
                {instrument.instrumentId}
              </span>
              <StatusBadge status={instrument.status} size="sm" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-0.5">
              {instrument.modelDesignation}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate(`/evaluations/new?instrumentId=${instrument.id}`)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Plus size={14} />
            <span>New Evaluation for this NAWI</span>
          </button>
        </div>
      </div>

      {/* Grid: Specifications & Tolerance Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Technical Details & Tolerances */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Specifications Card */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Technical & Metrological Specifications
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Manufacturer</span>
                <span className="font-semibold text-slate-900">{instrument.manufacturerName}</span>
              </div>

              <div>
                <span className="text-slate-500 block">Serial Number</span>
                <span className="font-mono font-bold text-slate-900">{instrument.serialNumber}</span>
              </div>

              <div>
                <span className="text-slate-500 block">Accuracy Class</span>
                <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block mt-0.5">
                  Class {instrument.accuracyClass}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Maximum Capacity (Max)</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {instrument.maxCapacity} {instrument.measurementUnit}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Minimum Capacity (Min)</span>
                <span className="font-mono font-semibold text-slate-900">
                  {instrument.minCapacity} {instrument.measurementUnit}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Scale Intervals (e / d)</span>
                <span className="font-mono font-semibold text-slate-900">
                  e = {instrument.verificationInterval} {instrument.measurementUnit}
                  <span className="text-slate-400 mx-1">/</span>
                  d = {instrument.scaleInterval} {instrument.measurementUnit}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Resolution (n = Max/e)</span>
                <span className="font-mono font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200 inline-block mt-0.5">
                  {instrument.calculatedN.toLocaleString()} intervals
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Temperature Range</span>
                <span className="font-mono text-slate-800">
                  {instrument.operatingTempMin}°C to +{instrument.operatingTempMax}°C
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Laboratory Location</span>
                <span className="text-slate-800">{instrument.laboratoryLocation}</span>
              </div>

              <div className="col-span-2 sm:col-span-3">
                <span className="text-slate-500 block">Power Supply & Construction</span>
                <span className="text-slate-800">{instrument.powerSupply}</span>
              </div>

              {instrument.notes && (
                <div className="col-span-2 sm:col-span-3 pt-2 border-t border-slate-100">
                  <span className="text-slate-500 block">Notes & Sealing Provisions</span>
                  <span className="text-slate-700">{instrument.notes}</span>
                </div>
              )}
            </div>
          </div>

          {/* OIML R 76 Table 6 Tolerances for this instrument */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Applicable OIML R 76-1 Table 6 Maximum Permissible Errors (MPE)
              </h2>
              <span className="text-[11px] text-slate-500 font-mono">
                Initial Verification Factor = 1.0
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <th className="py-2 px-3">Test Load Reference</th>
                    <th className="py-2 px-3">Applied Load (L)</th>
                    <th className="py-2 px-3">Load in e (m = L/e)</th>
                    <th className="py-2 px-3">MPE Bracket (Table 6)</th>
                    <th className="py-2 px-3 text-right">Allowable MPE (±)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {sampleSteps.map((s, idx) => {
                    const mpe = calculateMPE(s.load, instrument.accuracyClass, instrument.verificationInterval);
                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-sans font-medium text-slate-800">{s.label}</td>
                        <td className="py-2 px-3 font-bold text-slate-900">
                          {s.load} {instrument.measurementUnit}
                        </td>
                        <td className="py-2 px-3 text-slate-600">{mpe.loadInE.toLocaleString()} e</td>
                        <td className="py-2 px-3 text-slate-600 font-sans text-[11px]">{mpe.bracketDescription}</td>
                        <td className="py-2 px-3 text-right font-bold text-cyan-900">
                          ±{mpe.mpeValueInUnits} {instrument.measurementUnit}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: Evaluations & Reports History */}
        <div className="space-y-6">
          {/* Evaluations Section */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ClipboardList size={14} />
                <span>Evaluations History</span>
              </h2>
              <span className="font-mono text-xs text-slate-500">{associatedEvaluations.length}</span>
            </div>

            {associatedEvaluations.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">
                No evaluations recorded for this instrument yet.
              </div>
            ) : (
              <div className="space-y-3">
                {associatedEvaluations.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => onNavigate(`/evaluations/${ev.id}`)}
                    className="p-3 rounded border border-slate-200 hover:border-cyan-500 cursor-pointer transition-colors space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {ev.evaluationNumber}
                      </span>
                      <StatusBadge status={ev.status} size="sm" />
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Officer: {ev.assignedEngineer.name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Created: {new Date(ev.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Standardized Reports */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck size={14} />
                <span>Associated Reports</span>
              </h2>
              <span className="font-mono text-xs text-slate-500">{associatedReports.length}</span>
            </div>

            {associatedReports.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">
                No standardized reports finalized yet.
              </div>
            ) : (
              <div className="space-y-3">
                {associatedReports.map((rep) => (
                  <div
                    key={rep.id}
                    onClick={() => onNavigate(`/reports/${rep.id}`)}
                    className="p-3 rounded border border-slate-200 hover:border-teal-500 cursor-pointer transition-colors space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-teal-900">
                        {rep.reportNumber}
                      </span>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                        v{rep.version} Final
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 line-clamp-2">
                      {rep.title}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Generated: {new Date(rep.generatedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Supporting Evidence */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <FolderArchive size={14} />
                <span>Evidence & Photos</span>
              </h2>
              <span className="font-mono text-xs text-slate-500">{associatedEvidence.length}</span>
            </div>

            {associatedEvidence.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-500">
                No files attached.
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                {associatedEvidence.map((ev) => (
                  <div key={ev.id} className="p-2 rounded bg-slate-50 border border-slate-200">
                    <div className="font-medium text-slate-900 truncate">{ev.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{ev.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
