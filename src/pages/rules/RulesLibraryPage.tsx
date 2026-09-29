import React, { useState } from 'react';
import {
  BookOpen,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
} from 'lucide-react';
import { REGULATORY_RULES_LIBRARY } from '../../regulatory/testRegistry';

export const RulesLibraryPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRules = REGULATORY_RULES_LIBRARY.filter((rule) => {
    return (
      rule.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.issuingAuthority.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.clausesSummary.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Versioned Regulatory Rules Library
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Official metrological recommendations, national legal acts, and ISO/IEC 17025 quality references.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span>OIML R 76-1: 2006 Fully Verified</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
        <input
          type="text"
          placeholder="Search regulatory standards by code, title, or authority..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Rules Catalog */}
      <div className="space-y-4">
        {filteredRules.map((rule) => (
          <div
            key={rule.id}
            className="bg-white rounded-lg border border-slate-200 shadow-xs p-6 space-y-4 hover:border-cyan-500 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {rule.code}
                  </span>
                  <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                    ACTIVE VERIFIED
                  </span>
                </div>
                <h2 className="text-base font-bold text-slate-900 mt-1.5">{rule.title}</h2>
                <div className="text-xs text-slate-500 mt-0.5">
                  Issuing Authority: <span className="font-medium text-slate-700">{rule.issuingAuthority}</span> · Edition: {rule.edition}
                </div>
              </div>

              {rule.sourceDocUrl && (
                <a
                  href={rule.sourceDocUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-cyan-800 bg-cyan-50 border border-cyan-200 rounded hover:bg-cyan-100 transition-colors shrink-0"
                >
                  <span>Official PDF Document</span>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block mb-1">
                  Scope & Prescribed Clauses:
                </span>
                <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded border border-slate-100">
                  {rule.clausesSummary}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block mb-1">
                  Maximum Permissible Error & Technical Enforcement:
                </span>
                <p className="text-slate-600 font-mono text-[11px] bg-slate-50 p-3 rounded border border-slate-100">
                  {rule.mpeTablesDescription}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
