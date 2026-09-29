import React from 'react';
import {
  FileText,
  Scale,
  ShieldCheck,
  CheckCircle2,
  BookOpen,
  Code2,
  Layers,
  Cpu,
  Database,
  ExternalLink,
} from 'lucide-react';

export const DocumentationPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5 space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
            SIH 2026 Problem Statement SIH26035
          </span>
          <span className="text-slate-400">·</span>
          <span className="text-xs font-mono text-slate-500 font-semibold">Team: Black Squad</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          METRALAB Technical Architecture & Metrology Manual
        </h1>
        <p className="text-sm text-slate-600">
          Standardized digital evaluation framework for Non-Automatic Weighing Instruments (NAWIs) under OIML R 76-1 / R 76-2 and the Legal Metrology Act, 2009.
        </p>
      </div>

      {/* 1. Problem Statement Context */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4 text-xs">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
          <Scale size={16} className="text-cyan-700" />
          <span>1. Official Problem Statement Background & Objectives</span>
        </h2>
        <p className="text-slate-700 leading-relaxed">
          Non-Automatic Weighing Instruments (NAWIs)—such as electronic counter scales, platform scales, precision balances, and road weighbridges—are critical for commercial transactions and consumer protection. Under Section 22 of the Legal Metrology Act, 2009 and the Legal Metrology (General) Rules, 2011, models must undergo rigorous type evaluation and verification before statutory stamping.
        </p>
        <p className="text-slate-700 leading-relaxed">
          Prior to METRALAB, designated testing laboratories prepared evaluation reports manually across ad-hoc spreadsheets and text documents, creating a high risk of calculation error, inconsistent permissible error application, and a lack of digital traceability. METRALAB automates test data capture, tolerance evaluation, compliance determination, and standardized report publishing as per international OIML R 76 requirements.
        </p>
      </div>

      {/* 2. System Architecture & Component Diagram */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4 text-xs">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
          <Layers size={16} className="text-cyan-700" />
          <span>2. Software Architecture & Clean Layer Separation</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-[11px]">
          <div className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block font-sans">1. Presentation Layer</span>
            <span className="text-cyan-800 font-semibold block">React SPA + Tailwind CSS</span>
            <p className="text-slate-600 font-sans text-xs">
              Interactive test execution workbench, dynamic MPE error visualizer, and role-aware navigation.
            </p>
          </div>

          <div className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block font-sans">2. Calculation Engine</span>
            <span className="text-cyan-800 font-semibold block">nawiEngine.ts (OIML R 76-1)</span>
            <p className="text-slate-600 font-sans text-xs">
              Pure, deterministic mathematical functions calculating continuous turning point error $P$, corrected error $E_c$, and Table 6 MPE limits.
            </p>
          </div>

          <div className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block font-sans">3. Document Publishing</span>
            <span className="text-cyan-800 font-semibold block">jsPDF + docx Packer</span>
            <p className="text-slate-600 font-sans text-xs">
              Direct client-side generation of vector PDF reports and genuine editable Microsoft Word (.docx) files conforming to OIML R 76-2.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Mathematical Foundations & Table 6 MPE */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4 text-xs">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
          <Cpu size={16} className="text-cyan-700" />
          <span>3. Mathematical Methodology & Permissible Error Tolerances</span>
        </h2>

        <div className="space-y-3 font-mono">
          <div className="p-3 rounded bg-slate-50 border border-slate-200">
            <div className="font-bold text-slate-900 font-sans">Verification Intervals Resolution (n)</div>
            <div className="text-cyan-900 mt-1">n = Max / e</div>
            <div className="text-slate-600 font-sans text-[11px] mt-1">
              Class I: n ≥ 50,000 | Class II: 100 ≤ n ≤ 100,000 | Class III: 100 ≤ n ≤ 10,000 | Class IIII: 100 ≤ n ≤ 1,000.
            </div>
          </div>

          <div className="p-3 rounded bg-slate-50 border border-slate-200">
            <div className="font-bold text-slate-900 font-sans">Changeover Turning Point Method (Annex A.4.4.3)</div>
            <div className="text-cyan-900 mt-1">
              P = I + 0.5e - ΔL<br />
              E = P - L<br />
              Ec = E - E0
            </div>
            <div className="text-slate-600 font-sans text-[11px] mt-1">
              Provides the continuous indication curve before digital rounding, ensuring high accuracy in pattern approval.
            </div>
          </div>

          <div className="p-3 rounded bg-slate-50 border border-slate-200">
            <div className="font-bold text-slate-900 font-sans">Maximum Permissible Errors (MPE Table 6 - Initial Verification)</div>
            <div className="text-slate-700 text-[11px] mt-1 space-y-1">
              <div>• <strong>Class III:</strong> 0 ≤ m ≤ 500e (±0.5e) · 500e &lt; m ≤ 2,000e (±1.0e) · 2,000e &lt; m ≤ 10,000e (±1.5e)</div>
              <div>• <strong>Class II:</strong> 0 ≤ m ≤ 5,000e (±0.5e) · 5,000e &lt; m ≤ 20,000e (±1.0e) · 20,000e &lt; m ≤ 100,000e (±1.5e)</div>
              <div>• <strong>Class I:</strong> 0 ≤ m ≤ 50,000e (±0.5e) · 50,000e &lt; m ≤ 200,000e (±1.0e) · m &gt; 200,000e (±1.5e)</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Production Security & Deployment */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4 text-xs">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
          <ShieldCheck size={16} className="text-emerald-600" />
          <span>4. Production Hardening & Deployment Blueprint</span>
        </h2>

        <div className="space-y-2 text-slate-700 leading-relaxed">
          <p>
            <strong>Role-Based Access Control (RBAC):</strong> Testing Engineers cannot approve their own submissions; approvals require an authenticated session from a verified Technical Reviewer or Laboratory Director.
          </p>
          <p>
            <strong>Digital Signatures:</strong> Built with integration hooks for PKI-based cryptographic tokens (e.g. Indian e-Sign / Aadhaar XML signatures) ensuring non-repudiation under the Information Technology Act, 2000.
          </p>
          <p>
            <strong>Traceability:</strong> Reference standard weights must maintain verifiable NPL India (National Physical Laboratory) or NABL calibration certificate references with active expiry checks.
          </p>
        </div>
      </div>
    </div>
  );
};
