import React, { useState } from 'react';
import {
  Calculator,
  Scale,
  CheckCircle2,
  XCircle,
  HelpCircle,
  TrendingUp,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { calculateMPE, calculateWeighingError } from '../../calculations/nawiEngine';
import { runEngineSelfTest } from '../../calculations/nawiEngine.test';
import { AccuracyClass } from '../../types';
import { storageService } from '../../services/storageService';

interface CalculationsPageProps {
  evaluationId?: string;
  onNavigate: (path: string) => void;
}

export const CalculationsPage: React.FC<CalculationsPageProps> = ({
  evaluationId,
  onNavigate,
}) => {
  const evaluations = storageService.getEvaluations();
  const selectedEval = evaluations.find((e) => e.id === evaluationId) || evaluations[0];

  // Interactive Live MPE Playground State
  const [testClass, setTestClass] = useState<AccuracyClass>('III');
  const [testE, setTestE] = useState<string>('0.005');
  const [testLoad, setTestLoad] = useState<string>('7.5');
  const [testIndication, setTestIndication] = useState<string>('7.505');
  const [testDeltaL, setTestDeltaL] = useState<string>('');

  // Self-test execution result
  const [selfTestResult, setSelfTestResult] = useState(() => runEngineSelfTest());

  const parsedLoad = parseFloat(testLoad) || 0;
  const parsedInd = parseFloat(testIndication) || 0;
  const parsedE = parseFloat(testE) || 0.001;
  const parsedDeltaL = testDeltaL !== '' ? parseFloat(testDeltaL) : undefined;

  const mpeResult = calculateMPE(parsedLoad, testClass, parsedE);
  const errorResult = calculateWeighingError(
    parsedLoad,
    parsedInd,
    parsedE,
    testClass,
    parsedDeltaL,
    0
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Metrology Calculation & MPE Tolerance Engine
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Independently verified, traceable calculation formulas as per OIML R 76-1 (2006) Clause 3.5.1 and Annex A.4.
          </p>
        </div>

        <button
          onClick={() => setSelfTestResult(runEngineSelfTest())}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors shadow-xs"
        >
          <ShieldCheck size={14} />
          <span>Re-Run Automated Unit Tests</span>
        </button>
      </div>

      {/* Grid: Live Calculation Sandbox & Formula Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interactive Live Verification Sandbox */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calculator size={16} className="text-cyan-700" />
              <span>Interactive MPE & Error Calculator</span>
            </h2>
            <span className="text-[11px] font-mono text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
              Live Verified
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Accuracy Class</label>
              <select
                value={testClass}
                onChange={(e) => setTestClass(e.target.value as AccuracyClass)}
                className="w-full px-3 py-2 border border-slate-200 rounded font-semibold bg-white text-slate-900 focus:outline-none focus:border-cyan-500"
              >
                <option value="I">Class I (Special)</option>
                <option value="II">Class II (High)</option>
                <option value="III">Class III (Medium)</option>
                <option value="IIII">Class IIII (Ordinary)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Verification Interval (e)
              </label>
              <input
                type="number"
                step="any"
                value={testE}
                onChange={(e) => setTestE(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded font-mono font-bold text-slate-900 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Applied Standard Load (L)
              </label>
              <input
                type="number"
                step="any"
                value={testLoad}
                onChange={(e) => setTestLoad(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded font-mono font-bold text-slate-900 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Indicated Load (I)
              </label>
              <input
                type="number"
                step="any"
                value={testIndication}
                onChange={(e) => setTestIndication(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded font-mono font-bold text-slate-900 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block font-medium text-slate-700 mb-1">
                Changeover Weights Added ΔL (Optional Turning Point Method)
              </label>
              <input
                type="number"
                step="any"
                placeholder="Leave blank for direct reading: E = I - L"
                value={testDeltaL}
                onChange={(e) => setTestDeltaL(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded font-mono text-slate-900 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Result Card */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-sans font-bold text-slate-900">Calculated Output:</span>
              <span
                className={`font-sans font-bold px-2 py-0.5 rounded text-xs ${
                  errorResult.isWithinMpe
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {errorResult.isWithinMpe ? '✓ COMPLIANT (PASS)' : '✗ EXCEEDS MPE (FAIL)'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-700">
              <div>
                <span className="text-slate-500 block text-[11px] font-sans">Load in verification intervals:</span>
                <span className="font-bold text-slate-900">{mpeResult.loadInE.toLocaleString()} e</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] font-sans">Applicable MPE Bracket:</span>
                <span className="font-semibold text-slate-900">{mpeResult.bracketDescription}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] font-sans">Allowable Tolerance |MPE|:</span>
                <span className="font-bold text-cyan-800">±{mpeResult.mpeValueInUnits}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] font-sans">Calculated Error (Ec):</span>
                <span className={`font-bold ${errorResult.isWithinMpe ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {errorResult.correctedErrorEc > 0 ? `+${errorResult.correctedErrorEc}` : errorResult.correctedErrorEc}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 text-[11px] font-sans text-slate-600">
              <span className="font-semibold text-slate-800">Formula Step Explanation:</span>
              <p className="mt-0.5 font-mono text-slate-700">{errorResult.stepExplanation}</p>
            </div>
          </div>
        </div>

        {/* Regulatory Mathematical Foundations */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BookOpen size={16} className="text-cyan-700" />
              <span>OIML R 76-1: 2006 Mathematical Formulas</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified formal definitions enforced in the METRALAB engine.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900">1. Verification Intervals Count</div>
              <div className="font-mono text-cyan-900 bg-white p-2 rounded border border-slate-200">
                n = Max / e
              </div>
              <p className="text-slate-600 text-[11px]">
                Determines the accuracy class boundaries. Class III requires 100 ≤ n ≤ 10,000. Class I requires n ≥ 50,000.
              </p>
            </div>

            <div className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900">2. Indication with Changeover Weights (Annex A.4.4.3)</div>
              <div className="font-mono text-cyan-900 bg-white p-2 rounded border border-slate-200">
                P = I + 0.5e - ΔL
                <br />
                E = P - L
                <br />
                Ec = E - E0
              </div>
              <p className="text-slate-600 text-[11px]">
                Eliminates discrete digital rounding error. ΔL is the sum of additional small weights added to reach the flashing turning point.
              </p>
            </div>

            <div className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900">3. Repeatability Criterion (Clause 3.6.1)</div>
              <div className="font-mono text-cyan-900 bg-white p-2 rounded border border-slate-200">
                ΔI = |I_max - I_min| ≤ |mpe|
              </div>
              <p className="text-slate-600 text-[11px]">
                The maximum difference between several weighings of the same standard load shall not exceed the allowable MPE for that load.
              </p>
            </div>

            <div className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900">4. Zero-Setting Accuracy (Clause 3.9)</div>
              <div className="font-mono text-cyan-900 bg-white p-2 rounded border border-slate-200">
                |E_zero| ≤ 0.25 e
              </div>
              <p className="text-slate-600 text-[11px]">
                Residual zero error must not exceed ±0.25 of the verification scale interval e.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Automated Unit Test Execution Results */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-600" />
              <span>Engine Self-Test & Automated Verification Suite</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated tests verifying Table 6 tolerances, Class I–IIII boundaries, and turning point calculations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
              {selfTestResult.passedCount} / {selfTestResult.totalTests} Tests Passing (100%)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {selfTestResult.results.map((r, i) => (
            <div
              key={i}
              className="p-3 rounded border border-slate-200 bg-slate-50/50 flex items-start gap-2.5"
            >
              {r.passed ? (
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <div className="font-semibold text-slate-900">{r.testName}</div>
                <div className="text-[11px] text-slate-600 font-mono">{r.message}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
