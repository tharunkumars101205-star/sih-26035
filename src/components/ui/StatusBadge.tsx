import React from 'react';
import { ComplianceVerdict, EvaluationStatus, InstrumentStatus } from '../../types';
import { CheckCircle2, XCircle, AlertCircle, Clock, FileCheck2, HelpCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: ComplianceVerdict | EvaluationStatus | InstrumentStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const textSize = size === 'sm' ? 'text-xs' : 'text-xs';
  const iconSize = size === 'sm' ? 12 : 14;

  switch (status) {
    case 'pass':
    case 'approved':
    case 'conforming':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/80 rounded px-2 py-0.5 ${textSize}`}>
          <CheckCircle2 size={iconSize} className="text-emerald-600 shrink-0" />
          <span>PASS / CONFORMS</span>
        </span>
      );

    case 'fail':
    case 'rejected':
    case 'non_conforming':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium text-rose-700 bg-rose-50 border border-rose-200/80 rounded px-2 py-0.5 ${textSize}`}>
          <XCircle size={iconSize} className="text-rose-600 shrink-0" />
          <span>FAIL / NON-CONFORMING</span>
        </span>
      );

    case 'requires_verification':
    case 'changes_requested':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium text-amber-800 bg-amber-50 border border-amber-200/80 rounded px-2 py-0.5 ${textSize}`}>
          <AlertCircle size={iconSize} className="text-amber-600 shrink-0" />
          <span>REQUIRES VERIFICATION</span>
        </span>
      );

    case 'unable_to_determine':
    case 'draft':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium text-slate-700 bg-slate-100 border border-slate-200/80 rounded px-2 py-0.5 ${textSize}`}>
          <HelpCircle size={iconSize} className="text-slate-500 shrink-0" />
          <span>{status === 'draft' ? 'DRAFT' : 'UNABLE TO DETERMINE'}</span>
        </span>
      );

    case 'in_progress':
    case 'under_evaluation':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium text-cyan-800 bg-cyan-50 border border-cyan-200/80 rounded px-2 py-0.5 ${textSize}`}>
          <Clock size={iconSize} className="text-cyan-600 animate-spin shrink-0" />
          <span>IN PROGRESS</span>
        </span>
      );

    case 'submitted':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium text-blue-700 bg-blue-50 border border-blue-200/80 rounded px-2 py-0.5 ${textSize}`}>
          <Clock size={iconSize} className="text-blue-600 shrink-0" />
          <span>SUBMITTED FOR REVIEW</span>
        </span>
      );

    case 'report_generated':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium text-teal-800 bg-teal-50 border border-teal-200/80 rounded px-2 py-0.5 ${textSize}`}>
          <FileCheck2 size={iconSize} className="text-teal-600 shrink-0" />
          <span>REPORT GENERATED</span>
        </span>
      );

    case 'not_applicable':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium text-slate-500 bg-slate-50 border border-slate-200 rounded px-2 py-0.5 ${textSize}`}>
          <span>NOT APPLICABLE</span>
        </span>
      );

    default:
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium text-slate-700 bg-slate-100 border border-slate-200 rounded px-2 py-0.5 ${textSize}`}>
          <span className="capitalize">{String(status).replace(/_/g, ' ')}</span>
        </span>
      );
  }
};
