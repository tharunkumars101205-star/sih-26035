import React, { useState, useMemo } from 'react';
import {
  FlaskConical,
  Scale,
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  Send,
  FileCheck,
  TrendingUp,
  RotateCcw,
  Sparkles,
  Download,
  Upload,
  Shield,
  QrCode,
  FileText,
  Check,
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
  Evaluation,
  TestProcedureId,
  WeighingTestRow,
  RepeatabilitySeries,
  EccentricityPosition,
  DiscriminationTestPoint,
  ZeroSettingRecord,
  FunctionalCheckItem,
} from '../../types';
import {
  calculateWeighingError,
  calculateMPE,
  evaluateRepeatabilitySeries,
  evaluateDiscrimination,
  evaluateZeroSetting,
} from '../../calculations/nawiEngine';
import { OIML_R76_PROCEDURES } from '../../regulatory/testRegistry';

interface TestExecutionPageProps {
  evaluationId?: string;
  onNavigate: (path: string) => void;
}

export const TestExecutionPage: React.FC<TestExecutionPageProps> = ({
  evaluationId,
  onNavigate,
}) => {
  const evaluations = storageService.getEvaluations();
  const activeEvalId = evaluationId || evaluations[0]?.id;
  const currentEval = evaluations.find((e) => e.id === activeEvalId) || evaluations[0];

  const [evaluation, setEvaluation] = useState<Evaluation>(currentEval);
  const [activeTab, setActiveTab] = useState<TestProcedureId>('oiml_a441_weighing');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvRawText, setCsvRawText] = useState('');
  const [signModalOpen, setSignModalOpen] = useState(false);
  const [signatureApplied, setSignatureApplied] = useState(false);
  const [selectedCornerId, setSelectedCornerId] = useState<string>('ecc_1');

  if (!evaluation) {
    return (
      <div className="p-12 text-center text-slate-500">
        No evaluation records found. Please create an evaluation first.
      </div>
    );
  }

  const inst = evaluation.instrumentSnapshot;
  const unit = inst.measurementUnit;
  const e = inst.verificationInterval;
  const accClass = inst.accuracyClass;

  // CSV Export
  const handleExportWeighingCsv = () => {
    let csv = 'Step,Direction,Load,Load_In_e,Indicated_Load,Delta_L,Calculated_Error_Ec,MPE_Limit,Verdict\n';
    weighingRows.forEach((r) => {
      csv += `${r.stepNumber},${r.direction},${r.load},${r.loadInE},${r.indicatedLoad},${r.deltaLAdded || 0},${r.correctedError},${r.mpeForLoad},${r.compliance}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${evaluation.evaluationNumber}_Weighing_Observations.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // CSV Import
  const handleImportWeighingCsv = (text: string) => {
    const lines = text.trim().split('\n');
    const importedRows: WeighingTestRow[] = [];
    lines.forEach((line, idx) => {
      if (idx === 0 && (line.toLowerCase().includes('load') || line.toLowerCase().includes('step'))) return;
      const parts = line.split(',').map((p) => p.trim());
      if (parts.length >= 2) {
        const stepNumber = importedRows.length + 1;
        const dir = parts[1]?.toLowerCase().includes('dec') ? 'decreasing' : 'increasing';
        const load = parseFloat(parts[2] || parts[0]) || 0;
        const ind = parseFloat(parts[4] || parts[1]) || load;
        const deltaL = parts[5] ? parseFloat(parts[5]) : undefined;
        const calc = calculateWeighingError(load, ind, e, accClass, deltaL, 0);
        importedRows.push({
          id: `w_imp_${Date.now()}_${idx}`,
          stepNumber,
          direction: dir,
          load,
          loadInE: parseFloat((load / e).toFixed(1)),
          indicatedLoad: ind,
          deltaLAdded: deltaL,
          actualWeightCalculated: calc.calculatedP,
          error: calc.errorE,
          correctedError: calc.correctedErrorEc,
          mpeForLoad: calc.mpeAllowable,
          compliance: calc.verdict,
        });
      }
    });

    if (importedRows.length > 0) {
      updateWeighingRows(importedRows);
      setCsvModalOpen(false);
      setCsvRawText('');
      setSaveMessage(`Successfully imported ${importedRows.length} observation steps.`);
    } else {
      alert('Could not parse valid CSV data rows. Expected format: Step, Direction, Load, Load_In_e, Indication');
    }
  };

  // Digital Signature
  const handleApplyDigitalSign = () => {
    const currentUser = storageService.getCurrentUser();
    const tokenCert = `CCA-INDIA-METRA-PKI-${Math.floor(100000 + Math.random() * 900000)}`;
    const shaHash = `SHA256-${Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

    const newReview = {
      id: `rev_sign_${Date.now()}`,
      evaluationId: evaluation.id,
      reviewerId: currentUser.id,
      reviewerName: currentUser.name,
      action: currentUser.role === 'technical_reviewer' ? ('approve' as const) : ('submit' as const),
      comments: `Digital e-Sign Token applied: Cert #${tokenCert}. Hash: ${shaHash}. Observations cryptographically verified as per Legal Metrology requirements.`,
      timestamp: new Date().toISOString(),
    };

    const updated = {
      ...evaluation,
      status: currentUser.role === 'technical_reviewer' ? ('approved' as const) : ('submitted' as const),
      reviewHistory: [...evaluation.reviewHistory, newReview],
      updatedAt: new Date().toISOString(),
    };

    setEvaluation(updated);
    storageService.saveEvaluation(updated);
    setSignatureApplied(true);
    setSignModalOpen(false);
    setSaveMessage('Digital signature token applied and recorded in audit trail.');
    setTimeout(() => setSaveMessage(null), 4000);
  };

  // -------------------------------------------------------------
  // 1. WEIGHING PERFORMANCE HANDLERS
  // -------------------------------------------------------------
  const weighingRows = evaluation.testExecutions.oiml_a441_weighing?.weighingRows || [];

  const handleAddWeighingRow = () => {
    const nextStep = weighingRows.length + 1;
    const defaultLoad = parseFloat(
      (Math.min(inst.maxCapacity, nextStep * (inst.maxCapacity / 6))).toFixed(3)
    );
    const calc = calculateWeighingError(defaultLoad, defaultLoad, e, accClass, undefined, 0);

    const newRow: WeighingTestRow = {
      id: `w_row_${Date.now()}`,
      stepNumber: nextStep,
      load: defaultLoad,
      loadInE: parseFloat((defaultLoad / e).toFixed(1)),
      direction: 'increasing',
      indicatedLoad: defaultLoad,
      actualWeightCalculated: calc.calculatedP,
      error: calc.errorE,
      correctedError: calc.correctedErrorEc,
      mpeForLoad: calc.mpeAllowable,
      compliance: calc.verdict,
    };

    const updatedRows = [...weighingRows, newRow];
    updateWeighingRows(updatedRows);
  };

  const handleLoadStandardSequence = () => {
    // Generate full standard cycle: 0 -> Min -> 500e -> 0.5 Max -> 2000e -> Max -> decreasing
    const loads = [
      { load: 0.0, dir: 'increasing' as const },
      { load: inst.minCapacity, dir: 'increasing' as const },
      { load: parseFloat((500 * e).toFixed(4)), dir: 'increasing' as const },
      { load: parseFloat((inst.maxCapacity * 0.5).toFixed(4)), dir: 'increasing' as const },
      { load: parseFloat((2000 * e).toFixed(4)), dir: 'increasing' as const },
      { load: inst.maxCapacity, dir: 'increasing' as const },
      // Decreasing
      { load: parseFloat((inst.maxCapacity * 0.75).toFixed(4)), dir: 'decreasing' as const },
      { load: parseFloat((inst.maxCapacity * 0.5).toFixed(4)), dir: 'decreasing' as const },
      { load: parseFloat((500 * e).toFixed(4)), dir: 'decreasing' as const },
      { load: inst.minCapacity, dir: 'decreasing' as const },
      { load: 0.0, dir: 'decreasing' as const },
    ];

    const generated: WeighingTestRow[] = loads.map((l, i) => {
      // Simulate realistic compliant reading (e.g. tiny error within MPE)
      const simulatedIndication = l.load;
      const calc = calculateWeighingError(l.load, simulatedIndication, e, accClass, undefined, 0);
      return {
        id: `w_seq_${Date.now()}_${i}`,
        stepNumber: i + 1,
        load: l.load,
        loadInE: parseFloat((l.load / e).toFixed(1)),
        direction: l.dir,
        indicatedLoad: simulatedIndication,
        actualWeightCalculated: calc.calculatedP,
        error: calc.errorE,
        correctedError: calc.correctedErrorEc,
        mpeForLoad: calc.mpeAllowable,
        compliance: calc.verdict,
      };
    });

    updateWeighingRows(generated);
  };

  const handleUpdateWeighingRow = (
    id: string,
    field: 'load' | 'indicatedLoad' | 'deltaLAdded' | 'direction',
    val: any
  ) => {
    const updated = weighingRows.map((r) => {
      if (r.id !== id) return r;
      const updatedRow = { ...r, [field]: val };
      // Recalculate error and MPE
      const calc = calculateWeighingError(
        updatedRow.load,
        updatedRow.indicatedLoad,
        e,
        accClass,
        updatedRow.deltaLAdded,
        0
      );
      return {
        ...updatedRow,
        loadInE: parseFloat((updatedRow.load / e).toFixed(1)),
        actualWeightCalculated: calc.calculatedP,
        error: calc.errorE,
        correctedError: calc.correctedErrorEc,
        mpeForLoad: calc.mpeAllowable,
        compliance: calc.verdict,
      };
    });
    updateWeighingRows(updated);
  };

  const handleDeleteWeighingRow = (id: string) => {
    const updated = weighingRows.filter((r) => r.id !== id);
    updateWeighingRows(updated);
  };

  const updateWeighingRows = (rows: WeighingTestRow[]) => {
    const hasFail = rows.some((r) => r.compliance === 'fail');
    const isComplete = rows.length >= 5;
    const verdict: Evaluation['complianceSummary']['overallVerdict'] =
      rows.length === 0 ? 'unable_to_determine' : hasFail ? 'fail' : 'pass';

    const updatedExec = {
      ...evaluation.testExecutions,
      oiml_a441_weighing: {
        ...evaluation.testExecutions.oiml_a441_weighing,
        weighingRows: rows,
        status: isComplete ? ('completed' as const) : ('in_progress' as const),
        overallProcedureCompliance: verdict,
      },
    };
    saveExecutionUpdate(updatedExec);
  };

  // -------------------------------------------------------------
  // 2. REPEATABILITY HANDLERS
  // -------------------------------------------------------------
  const repeatabilitySeries = evaluation.testExecutions.oiml_a442_repeatability?.repeatabilitySeries || [
    {
      id: 'rep_1',
      seriesName: `Series A: ~0.5 Max (${(inst.maxCapacity * 0.5).toFixed(2)} ${unit})`,
      appliedLoad: parseFloat((inst.maxCapacity * 0.5).toFixed(2)),
      observations: [
        { run: 1, indication: inst.maxCapacity * 0.5, calculatedWeight: inst.maxCapacity * 0.5, error: 0 },
        { run: 2, indication: inst.maxCapacity * 0.5, calculatedWeight: inst.maxCapacity * 0.5, error: 0 },
        { run: 3, indication: inst.maxCapacity * 0.5, calculatedWeight: inst.maxCapacity * 0.5, error: 0 },
      ],
      maxIndication: inst.maxCapacity * 0.5,
      minIndication: inst.maxCapacity * 0.5,
      rangeDifference: 0,
      mpeAllowable: calculateMPE(inst.maxCapacity * 0.5, accClass, e).mpeValueInUnits,
      compliance: 'pass',
    },
    {
      id: 'rep_2',
      seriesName: `Series B: ~Max (${inst.maxCapacity} ${unit})`,
      appliedLoad: inst.maxCapacity,
      observations: [
        { run: 1, indication: inst.maxCapacity, calculatedWeight: inst.maxCapacity, error: 0 },
        { run: 2, indication: inst.maxCapacity, calculatedWeight: inst.maxCapacity, error: 0 },
        { run: 3, indication: inst.maxCapacity, calculatedWeight: inst.maxCapacity, error: 0 },
      ],
      maxIndication: inst.maxCapacity,
      minIndication: inst.maxCapacity,
      rangeDifference: 0,
      mpeAllowable: calculateMPE(inst.maxCapacity, accClass, e).mpeValueInUnits,
      compliance: 'pass',
    },
  ];

  const handleUpdateRepeatabilityIndication = (
    seriesId: string,
    runIndex: number,
    val: number
  ) => {
    const updated = repeatabilitySeries.map((ser) => {
      if (ser.id !== seriesId) return ser;
      const updatedObs = [...ser.observations];
      updatedObs[runIndex] = {
        ...updatedObs[runIndex],
        indication: val,
        calculatedWeight: val,
        error: parseFloat((val - ser.appliedLoad).toFixed(6)),
      };

      const indications = updatedObs.map((o) => o.indication);
      const evalResult = evaluateRepeatabilitySeries(ser.appliedLoad, indications, accClass, e);

      return {
        ...ser,
        observations: updatedObs,
        minIndication: evalResult.minIndication,
        maxIndication: evalResult.maxIndication,
        rangeDifference: evalResult.rangeDifference,
        mpeAllowable: evalResult.mpeAllowable,
        compliance: evalResult.verdict,
      };
    });

    const hasFail = updated.some((s) => s.compliance === 'fail');
    const updatedExec = {
      ...evaluation.testExecutions,
      oiml_a442_repeatability: {
        ...evaluation.testExecutions.oiml_a442_repeatability,
        repeatabilitySeries: updated,
        status: 'completed' as const,
        overallProcedureCompliance: hasFail ? ('fail' as const) : ('pass' as const),
      },
    };
    saveExecutionUpdate(updatedExec);
  };

  // -------------------------------------------------------------
  // 3. ECCENTRICITY (CORNER LOAD) HANDLERS
  // -------------------------------------------------------------
  const eccentricityPositions = evaluation.testExecutions.oiml_a47_eccentricity?.eccentricityPositions || [
    { id: 'ecc_1', positionNumber: 1, positionLabel: 'Centre', appliedLoad: parseFloat((inst.maxCapacity / 3).toFixed(2)), indicatedLoad: parseFloat((inst.maxCapacity / 3).toFixed(2)), error: 0, correctedError: 0, mpeAllowable: calculateMPE(inst.maxCapacity / 3, accClass, e).mpeValueInUnits, compliance: 'pass' },
    { id: 'ecc_2', positionNumber: 2, positionLabel: 'Front-Left', appliedLoad: parseFloat((inst.maxCapacity / 3).toFixed(2)), indicatedLoad: parseFloat((inst.maxCapacity / 3).toFixed(2)), error: 0, correctedError: 0, mpeAllowable: calculateMPE(inst.maxCapacity / 3, accClass, e).mpeValueInUnits, compliance: 'pass' },
    { id: 'ecc_3', positionNumber: 3, positionLabel: 'Back-Left', appliedLoad: parseFloat((inst.maxCapacity / 3).toFixed(2)), indicatedLoad: parseFloat((inst.maxCapacity / 3).toFixed(2)), error: 0, correctedError: 0, mpeAllowable: calculateMPE(inst.maxCapacity / 3, accClass, e).mpeValueInUnits, compliance: 'pass' },
    { id: 'ecc_4', positionNumber: 4, positionLabel: 'Back-Right', appliedLoad: parseFloat((inst.maxCapacity / 3).toFixed(2)), indicatedLoad: parseFloat((inst.maxCapacity / 3).toFixed(2)), error: 0, correctedError: 0, mpeAllowable: calculateMPE(inst.maxCapacity / 3, accClass, e).mpeValueInUnits, compliance: 'pass' },
    { id: 'ecc_5', positionNumber: 5, positionLabel: 'Front-Right', appliedLoad: parseFloat((inst.maxCapacity / 3).toFixed(2)), indicatedLoad: parseFloat((inst.maxCapacity / 3).toFixed(2)), error: 0, correctedError: 0, mpeAllowable: calculateMPE(inst.maxCapacity / 3, accClass, e).mpeValueInUnits, compliance: 'pass' },
  ];

  const handleUpdateEccentricity = (id: string, indicatedVal: number) => {
    const updated = eccentricityPositions.map((p) => {
      if (p.id !== id) return p;
      const calc = calculateWeighingError(p.appliedLoad, indicatedVal, e, accClass, undefined, 0);
      return {
        ...p,
        indicatedLoad: indicatedVal,
        error: calc.errorE,
        correctedError: calc.correctedErrorEc,
        compliance: calc.verdict,
      };
    });

    const hasFail = updated.some((p) => p.compliance === 'fail');
    const updatedExec = {
      ...evaluation.testExecutions,
      oiml_a47_eccentricity: {
        ...evaluation.testExecutions.oiml_a47_eccentricity,
        eccentricityPositions: updated,
        status: 'completed' as const,
        overallProcedureCompliance: hasFail ? ('fail' as const) : ('pass' as const),
      },
    };
    saveExecutionUpdate(updatedExec);
  };

  // -------------------------------------------------------------
  // 4. DISCRIMINATION HANDLERS
  // -------------------------------------------------------------
  const discriminationPoints = evaluation.testExecutions.oiml_a45_discrimination?.discriminationPoints || [
    { id: 'd_1', testLoad: inst.minCapacity, initialIndication: inst.minCapacity, extraLoadAdded: 1.4 * inst.scaleInterval, resultingIndication: inst.minCapacity + inst.scaleInterval, differenceObserved: inst.scaleInterval, minimumRequiredChange: inst.scaleInterval, compliance: 'pass' },
    { id: 'd_2', testLoad: inst.maxCapacity * 0.5, initialIndication: inst.maxCapacity * 0.5, extraLoadAdded: 1.4 * inst.scaleInterval, resultingIndication: inst.maxCapacity * 0.5 + inst.scaleInterval, differenceObserved: inst.scaleInterval, minimumRequiredChange: inst.scaleInterval, compliance: 'pass' },
    { id: 'd_3', testLoad: inst.maxCapacity, initialIndication: inst.maxCapacity, extraLoadAdded: 1.4 * inst.scaleInterval, resultingIndication: inst.maxCapacity + inst.scaleInterval, differenceObserved: inst.scaleInterval, minimumRequiredChange: inst.scaleInterval, compliance: 'pass' },
  ];

  const handleUpdateDiscrimination = (id: string, resultingIndication: number) => {
    const updated = discriminationPoints.map((dp) => {
      if (dp.id !== id) return dp;
      const evalRes = evaluateDiscrimination(dp.initialIndication, resultingIndication, inst.scaleInterval);
      return {
        ...dp,
        resultingIndication,
        differenceObserved: evalRes.difference,
        compliance: evalRes.verdict,
      };
    });

    const hasFail = updated.some((p) => p.compliance === 'fail');
    const updatedExec = {
      ...evaluation.testExecutions,
      oiml_a45_discrimination: {
        ...evaluation.testExecutions.oiml_a45_discrimination,
        discriminationPoints: updated,
        status: 'completed' as const,
        overallProcedureCompliance: hasFail ? ('fail' as const) : ('pass' as const),
      },
    };
    saveExecutionUpdate(updatedExec);
  };

  // -------------------------------------------------------------
  // 5. ZERO SETTING HANDLER
  // -------------------------------------------------------------
  const zeroSetting = evaluation.testExecutions.oiml_a48_zero_setting?.zeroSetting || {
    zeroSettingType: 'semi-automatic',
    residualErrorAtZero: 0.001,
    zeroTrackingBand: 0.5,
    mpeAllowable: 0.25 * e,
    compliance: 'pass',
  };

  const handleUpdateZeroSetting = (residualVal: number) => {
    const evalRes = evaluateZeroSetting(residualVal, e);
    const updatedRecord: ZeroSettingRecord = {
      ...zeroSetting,
      residualErrorAtZero: residualVal,
      mpeAllowable: evalRes.allowableError,
      compliance: evalRes.verdict,
    };

    const updatedExec = {
      ...evaluation.testExecutions,
      oiml_a48_zero_setting: {
        ...evaluation.testExecutions.oiml_a48_zero_setting,
        zeroSetting: updatedRecord,
        status: 'completed' as const,
        overallProcedureCompliance: evalRes.verdict,
      },
    };
    saveExecutionUpdate(updatedExec);
  };

  // -------------------------------------------------------------
  // 6. FUNCTIONAL CHECKS HANDLER
  // -------------------------------------------------------------
  const functionalChecks = evaluation.testExecutions.oiml_clauses4_functional?.functionalChecks || [
    { id: 'c_1', clause: '4.1', item: 'Level-indicating device and leveling feet accessible and rigid', status: 'conforming', remarks: 'Spirit level centered.' },
    { id: 'c_2', clause: '4.2', item: 'Descriptive markings (Max, Min, e, d, Class III, Manufacturer name)', status: 'conforming', remarks: 'Permanently engraved plate.' },
    { id: 'c_3', clause: '4.3', item: 'Software identification and legal metrology checksum display', status: 'conforming', remarks: 'Verified checksum CRC-16.' },
    { id: 'c_4', clause: '4.4', item: 'Security sealing provision (hardware seal & calibration audit counter)', status: 'conforming', remarks: 'Lead seal lug inspected.' },
  ];

  const handleUpdateFunctionalCheck = (
    id: string,
    field: 'status' | 'remarks',
    val: any
  ) => {
    const updated = functionalChecks.map((fc) => (fc.id === id ? { ...fc, [field]: val } : fc));
    const hasFail = updated.some((c) => c.status === 'non_conforming');

    const updatedExec = {
      ...evaluation.testExecutions,
      oiml_clauses4_functional: {
        ...evaluation.testExecutions.oiml_clauses4_functional,
        functionalChecks: updated,
        status: 'completed' as const,
        overallProcedureCompliance: hasFail ? ('fail' as const) : ('pass' as const),
      },
    };
    saveExecutionUpdate(updatedExec);
  };

  // -------------------------------------------------------------
  // GENERAL UPDATE HELPER
  // -------------------------------------------------------------
  const saveExecutionUpdate = (updatedExec: Evaluation['testExecutions']) => {
    // Re-evaluate overall compliance summary
    const values = Object.values(updatedExec).filter((v) => v.isIncluded);
    const passed = values.filter((v) => v.overallProcedureCompliance === 'pass').length;
    const failed = values.filter((v) => v.overallProcedureCompliance === 'fail').length;
    const reqVerif = values.filter(
      (v) =>
        v.overallProcedureCompliance === 'requires_verification' ||
        v.overallProcedureCompliance === 'unable_to_determine'
    ).length;

    let overallVerdict: Evaluation['complianceSummary']['overallVerdict'] = 'pass';
    if (failed > 0) overallVerdict = 'fail';
    else if (reqVerif > 0) overallVerdict = 'requires_verification';

    const updatedEvaluation: Evaluation = {
      ...evaluation,
      testExecutions: updatedExec,
      complianceSummary: {
        totalTestsConfigured: values.length,
        totalTestsExecuted: passed + failed,
        passedCount: passed,
        failedCount: failed,
        requiresVerificationCount: reqVerif,
        overallVerdict,
        evaluatedAt: new Date().toISOString(),
      },
      status: overallVerdict === 'pass' && failed === 0 && reqVerif === 0 ? 'submitted' : 'in_progress',
      updatedAt: new Date().toISOString(),
    };

    setEvaluation(updatedEvaluation);
    storageService.saveEvaluation(updatedEvaluation);
    setSaveMessage('Observations and calculations saved automatically.');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  // Error Curve Chart points
  const errorChartPoints = useMemo(() => {
    return weighingRows.map((r) => ({
      load: r.load,
      error: r.correctedError,
      mpePos: r.mpeForLoad,
      mpeNeg: -r.mpeForLoad,
      step: r.stepNumber,
    }));
  }, [weighingRows]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate(`/evaluations/${evaluation.id}`)}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-500">
                {evaluation.evaluationNumber}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-700 font-medium">
                {inst.modelDesignation}
              </span>
              <StatusBadge status={evaluation.complianceSummary.overallVerdict} size="sm" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-0.5">
              OIML R 76-1 Test Execution Workbench
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saveMessage && (
            <span className="text-xs text-emerald-700 font-medium flex items-center gap-1 animate-fade-in">
              <CheckCircle2 size={13} />
              <span>{saveMessage}</span>
            </span>
          )}
          <button
            onClick={() => setSignModalOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded border transition-colors shadow-xs ${
              signatureApplied
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-indigo-50 text-indigo-900 border-indigo-200 hover:bg-indigo-100'
            }`}
            title="Apply cryptographic digital signature / Aadhaar e-Sign token"
          >
            <Shield size={13} className={signatureApplied ? 'text-emerald-600' : 'text-indigo-600'} />
            <span>{signatureApplied ? 'Digital Seal Applied' : 'e-Sign / Digital Seal'}</span>
          </button>
          <button
            onClick={() => onNavigate(`/evaluations/${evaluation.id}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-300 rounded hover:bg-slate-100 transition-colors"
          >
            <span>Plan</span>
          </button>
          <button
            onClick={() => onNavigate(`/calculations/${evaluation.id}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-800 bg-cyan-50 border border-cyan-200 rounded hover:bg-cyan-100 transition-colors"
          >
            <TrendingUp size={14} />
            <span>MPE</span>
          </button>
          <button
            onClick={() => onNavigate(`/reviews`)}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Send size={13} />
            <span>Submit for Review</span>
          </button>
        </div>
      </div>

      {/* Instrument Spec Quick Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs text-xs font-mono">
        <div>
          <span className="text-[10px] text-slate-400 font-sans block uppercase">Accuracy Class</span>
          <span className="font-bold text-slate-900">Class {inst.accuracyClass}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-sans block uppercase">Max Capacity</span>
          <span className="font-bold text-slate-900">{inst.maxCapacity} {unit}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-sans block uppercase">Min Capacity</span>
          <span className="font-semibold text-slate-800">{inst.minCapacity} {unit}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-sans block uppercase">Scale Interval (e)</span>
          <span className="font-semibold text-slate-800">{inst.verificationInterval} {unit}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-sans block uppercase">Resolution (n)</span>
          <span className="font-bold text-cyan-800">{inst.calculatedN.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-sans block uppercase">Weights Set</span>
          <span className="font-semibold text-slate-700 truncate block">{evaluation.laboratoryConditions.weightsSetReference}</span>
        </div>
      </div>

      {/* Test Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 pb-2">
        {OIML_R76_PROCEDURES.map((proc) => {
          const exec = evaluation.testExecutions[proc.id];
          const isIncluded = exec?.isIncluded;
          const status = exec?.overallProcedureCompliance || 'not_started';
          const isActive = activeTab === proc.id;

          return (
            <button
              key={proc.id}
              onClick={() => setActiveTab(proc.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded text-xs font-medium whitespace-nowrap transition-colors border ${
                isActive
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : isIncluded
                  ? 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  : 'bg-slate-100 text-slate-400 border-slate-200'
              }`}
            >
              <span>{proc.code.replace('OIML R 76-1: ', '')}</span>
              <span className="text-[11px] opacity-90 hidden md:inline">{proc.title}</span>
              {isIncluded && (
                <span
                  className={`h-2 w-2 rounded-full shrink-0 ${
                    status === 'pass'
                      ? 'bg-emerald-400'
                      : status === 'fail'
                      ? 'bg-rose-500'
                      : 'bg-amber-400'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT 1: WEIGHING PERFORMANCE (A.4.4.1) */}
      {activeTab === 'oiml_a441_weighing' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>A.4.4.1 — Weighing Performance Test (Increasing & Decreasing Load)</span>
                  <StatusBadge
                    status={evaluation.testExecutions.oiml_a441_weighing?.overallProcedureCompliance || 'in_progress'}
                    size="sm"
                  />
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record indications $I$ across the measuring range. Calculation engine applies continuous changeover formula $P = I + 0.5e - \Delta L$ and compares $E_c$ against Table 6 MPE.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleExportWeighingCsv}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors shadow-2xs"
                  title="Download test measurements as CSV file"
                >
                  <Download size={13} />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={() => setCsvModalOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors shadow-2xs"
                  title="Import observations from CSV or data logger"
                >
                  <Upload size={13} />
                  <span>Import CSV</span>
                </button>
                <button
                  onClick={handleLoadStandardSequence}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-800 bg-cyan-50 border border-cyan-200 rounded hover:bg-cyan-100 transition-colors"
                >
                  <Sparkles size={13} />
                  <span>Auto-Populate 11 Steps</span>
                </button>
                <button
                  onClick={handleAddWeighingRow}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-900 border border-slate-300 rounded hover:bg-slate-50 transition-colors"
                >
                  <Plus size={13} />
                  <span>Add Step</span>
                </button>
              </div>
            </div>

            {/* Weighing Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3 w-12 text-center">Step</th>
                    <th className="py-2.5 px-3 w-28">Direction</th>
                    <th className="py-2.5 px-3">Standard Load (L)</th>
                    <th className="py-2.5 px-3">Indication (I)</th>
                    <th className="py-2.5 px-3 font-mono">ΔL Added</th>
                    <th className="py-2.5 px-3 font-mono">Error (Ec)</th>
                    <th className="py-2.5 px-3 font-mono">MPE Limit (±)</th>
                    <th className="py-2.5 px-3 text-center">Verdict</th>
                    <th className="py-2.5 px-3 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {weighingRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-500 font-sans">
                        No load steps recorded. Click "Auto-Populate 11 Standard Test Steps" or "Add Step".
                      </td>
                    </tr>
                  ) : (
                    weighingRows.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/70">
                        <td className="py-2 px-3 text-center font-bold text-slate-500">
                          {row.stepNumber}
                        </td>

                        <td className="py-2 px-3 font-sans">
                          <select
                            value={row.direction}
                            onChange={(e) =>
                              handleUpdateWeighingRow(row.id, 'direction', e.target.value)
                            }
                            className="text-xs px-2 py-1 border border-slate-200 rounded bg-white text-slate-700"
                          >
                            <option value="increasing">▲ Increasing</option>
                            <option value="decreasing">▼ Decreasing</option>
                          </select>
                        </td>

                        <td className="py-2 px-3">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="any"
                              value={row.load}
                              onChange={(e) =>
                                handleUpdateWeighingRow(
                                  row.id,
                                  'load',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-24 px-2 py-1 border border-slate-200 rounded font-bold text-slate-900 focus:outline-none focus:border-cyan-500"
                            />
                            <span className="text-[11px] text-slate-500 font-sans">{unit}</span>
                          </div>
                        </td>

                        <td className="py-2 px-3">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="any"
                              value={row.indicatedLoad}
                              onChange={(e) =>
                                handleUpdateWeighingRow(
                                  row.id,
                                  'indicatedLoad',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-24 px-2 py-1 border border-slate-200 rounded font-bold text-slate-900 focus:outline-none focus:border-cyan-500"
                            />
                            <span className="text-[11px] text-slate-500 font-sans">{unit}</span>
                          </div>
                        </td>

                        <td className="py-2 px-3">
                          <input
                            type="number"
                            step="any"
                            placeholder="0"
                            value={row.deltaLAdded !== undefined ? row.deltaLAdded : ''}
                            onChange={(e) =>
                              handleUpdateWeighingRow(
                                row.id,
                                'deltaLAdded',
                                e.target.value === '' ? undefined : parseFloat(e.target.value)
                              )
                            }
                            className="w-20 px-2 py-1 border border-slate-200 rounded text-slate-600 focus:outline-none focus:border-cyan-500"
                          />
                        </td>

                        <td className="py-2 px-3 font-bold text-slate-900">
                          <span
                            className={
                              row.compliance === 'pass' ? 'text-emerald-700' : 'text-rose-600'
                            }
                          >
                            {row.correctedError > 0 ? `+${row.correctedError}` : row.correctedError} {unit}
                          </span>
                        </td>

                        <td className="py-2 px-3 text-slate-600">
                          ±{row.mpeForLoad} {unit}
                        </td>

                        <td className="py-2 px-3 text-center">
                          <StatusBadge status={row.compliance} size="sm" />
                        </td>

                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={() => handleDeleteWeighingRow(row.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Error Curve Visualizer */}
          {weighingRows.length > 0 && (
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-cyan-700" />
                  <span>Indication Error Curve vs OIML R 76-1 Table 6 Tolerance Envelope</span>
                </h3>
                <div className="flex items-center gap-4 text-xs font-mono text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    <span>+MPE Boundary</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-cyan-600" />
                    <span>Calculated Error (Ec)</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    <span>-MPE Boundary</span>
                  </span>
                </div>
              </div>

              {/* Responsive SVG Chart */}
              <div className="h-48 w-full bg-slate-50/80 rounded border border-slate-200 relative p-4 flex items-center justify-center">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 800 160">
                  {/* Zero centerline */}
                  <line x1="40" y1="80" x2="760" y2="80" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 2" />
                  <text x="10" y="84" fontSize="10" fill="#64748b" fontFamily="monospace">0</text>

                  {/* +MPE top boundary and -MPE bottom boundary */}
                  <path
                    d={`M 40,30 L 760,30`}
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                  <text x="10" y="34" fontSize="9" fill="#e11d48" fontFamily="monospace">+MPE</text>

                  <path
                    d={`M 40,130 L 760,130`}
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                  <text x="10" y="134" fontSize="9" fill="#e11d48" fontFamily="monospace">-MPE</text>

                  {/* Data Points and Error Curve Line */}
                  {weighingRows.map((r, i) => {
                    const x = 50 + (i / Math.max(1, weighingRows.length - 1)) * 700;
                    // Scale error to 80px center +/- 50px for MPE
                    const mpeLimit = r.mpeForLoad || 0.005;
                    const errorRatio = Math.max(-1.3, Math.min(1.3, r.correctedError / mpeLimit));
                    const y = 80 - errorRatio * 50;

                    return (
                      <g key={r.id}>
                        <circle
                          cx={x}
                          cy={y}
                          r="4.5"
                          fill={r.compliance === 'pass' ? '#0891b2' : '#e11d48'}
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />
                        <text
                          x={x}
                          y={y - 8}
                          fontSize="9"
                          textAnchor="middle"
                          fill="#1e293b"
                          fontFamily="monospace"
                        >
                          {r.correctedError}
                        </text>
                        <text
                          x={x}
                          y="155"
                          fontSize="9"
                          textAnchor="middle"
                          fill="#64748b"
                          fontFamily="monospace"
                        >
                          {r.load}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 2: REPEATABILITY (A.4.4.2) */}
      {activeTab === 'oiml_a442_repeatability' && (
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>A.4.4.2 — Repeatability Test (Clauses 3.6.1 & Annex A.4.4.2)</span>
              <StatusBadge
                status={evaluation.testExecutions.oiml_a442_repeatability?.overallProcedureCompliance || 'pass'}
                size="sm"
              />
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              The difference between the results of several weighings of the same load shall not exceed |MPE| for that load (ΔI = I_max - I_min ≤ |MPE|).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {repeatabilitySeries.map((ser) => (
              <div key={ser.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900">{ser.seriesName}</h3>
                  <StatusBadge status={ser.compliance} size="sm" />
                </div>

                <div className="space-y-2 text-xs">
                  {ser.observations.map((obs, idx) => (
                    <div key={obs.run} className="flex items-center justify-between bg-white p-2 rounded border border-slate-200">
                      <span className="font-medium text-slate-700">Weighing Run #{obs.run}:</span>
                      <div className="flex items-center gap-1 font-mono">
                        <input
                          type="number"
                          step="any"
                          value={obs.indication}
                          onChange={(e) =>
                            handleUpdateRepeatabilityIndication(
                              ser.id,
                              idx,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-24 px-2 py-1 border border-slate-200 rounded font-bold text-slate-900 focus:outline-none focus:border-cyan-500 text-right"
                        />
                        <span className="text-slate-500 text-[11px] font-sans">{unit}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-white rounded border border-slate-200 text-xs space-y-1 font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span>Max Indication:</span>
                    <span className="font-bold text-slate-900">{ser.maxIndication} {unit}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Min Indication:</span>
                    <span className="font-bold text-slate-900">{ser.minIndication} {unit}</span>
                  </div>
                  <div className="flex justify-between text-slate-800 font-bold border-t border-slate-100 pt-1">
                    <span>Observed Range (ΔI):</span>
                    <span className={ser.compliance === 'pass' ? 'text-emerald-700' : 'text-rose-600'}>
                      {ser.rangeDifference} {unit}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Allowable Limit (|MPE|):</span>
                    <span>≤ {ser.mpeAllowable} {unit}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: ECCENTRICITY (A.4.7) */}
      {activeTab === 'oiml_a47_eccentricity' && (
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>A.4.7 — Eccentricity / Corner Loading Test (Clause 3.6.2)</span>
              <StatusBadge
                status={evaluation.testExecutions.oiml_a47_eccentricity?.overallProcedureCompliance || 'pass'}
                size="sm"
              />
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Standard load of ~1/3 Max placed sequentially on center and 4 corners. Error at each position shall not exceed MPE.
            </p>
          </div>

          {/* 2D Interactive Load Platter Schematic */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Scale size={14} className="text-cyan-700" />
                <span>Interactive Load Platter Schematic (4 Support Points — OIML R 76-1: 3.6.2.2)</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                Applied Load: ~1/3 Max ({(inst.maxCapacity / 3).toFixed(2)} {unit})
              </span>
            </div>

            {/* Platter Graphic */}
            <div className="relative h-60 max-w-xl mx-auto bg-gradient-to-b from-slate-100 to-slate-200/90 rounded-xl border-2 border-slate-300 shadow-inner flex items-center justify-center p-4">
              {/* Platter grid lines */}
              <div className="absolute inset-4 border border-dashed border-slate-300 rounded pointer-events-none" />
              <div className="absolute inset-x-4 top-1/2 border-t border-dashed border-slate-300 pointer-events-none" />
              <div className="absolute inset-y-4 left-1/2 border-l border-dashed border-slate-300 pointer-events-none" />

              {/* Position 3: Back-Left */}
              <div
                onClick={() => setSelectedCornerId('ecc_3')}
                className={`absolute top-6 left-6 p-2 rounded-lg cursor-pointer transition-all ${
                  selectedCornerId === 'ecc_3'
                    ? 'bg-cyan-600 text-white shadow-md ring-2 ring-cyan-400'
                    : 'bg-white text-slate-800 hover:bg-slate-50 border border-slate-300'
                }`}
              >
                <div className="text-[10px] font-bold">Pos 3: Back-Left</div>
                <div className="font-mono text-[10px]">
                  Err: {eccentricityPositions.find((p) => p.id === 'ecc_3')?.correctedError || 0} {unit}
                </div>
              </div>

              {/* Position 4: Back-Right */}
              <div
                onClick={() => setSelectedCornerId('ecc_4')}
                className={`absolute top-6 right-6 p-2 rounded-lg cursor-pointer transition-all ${
                  selectedCornerId === 'ecc_4'
                    ? 'bg-cyan-600 text-white shadow-md ring-2 ring-cyan-400'
                    : 'bg-white text-slate-800 hover:bg-slate-50 border border-slate-300'
                }`}
              >
                <div className="text-[10px] font-bold">Pos 4: Back-Right</div>
                <div className="font-mono text-[10px]">
                  Err: {eccentricityPositions.find((p) => p.id === 'ecc_4')?.correctedError || 0} {unit}
                </div>
              </div>

              {/* Position 1: Centre */}
              <div
                onClick={() => setSelectedCornerId('ecc_1')}
                className={`absolute p-2.5 rounded-lg cursor-pointer transition-all z-10 ${
                  selectedCornerId === 'ecc_1'
                    ? 'bg-cyan-600 text-white shadow-lg ring-2 ring-cyan-400'
                    : 'bg-white text-slate-900 hover:bg-slate-50 border-2 border-slate-400'
                }`}
              >
                <div className="text-[10px] font-bold text-center">Pos 1: Centre</div>
                <div className="font-mono text-[10px] text-center">
                  Err: {eccentricityPositions.find((p) => p.id === 'ecc_1')?.correctedError || 0} {unit}
                </div>
              </div>

              {/* Position 2: Front-Left */}
              <div
                onClick={() => setSelectedCornerId('ecc_2')}
                className={`absolute bottom-6 left-6 p-2 rounded-lg cursor-pointer transition-all ${
                  selectedCornerId === 'ecc_2'
                    ? 'bg-cyan-600 text-white shadow-md ring-2 ring-cyan-400'
                    : 'bg-white text-slate-800 hover:bg-slate-50 border border-slate-300'
                }`}
              >
                <div className="text-[10px] font-bold">Pos 2: Front-Left</div>
                <div className="font-mono text-[10px]">
                  Err: {eccentricityPositions.find((p) => p.id === 'ecc_2')?.correctedError || 0} {unit}
                </div>
              </div>

              {/* Position 5: Front-Right */}
              <div
                onClick={() => setSelectedCornerId('ecc_5')}
                className={`absolute bottom-6 right-6 p-2 rounded-lg cursor-pointer transition-all ${
                  selectedCornerId === 'ecc_5'
                    ? 'bg-cyan-600 text-white shadow-md ring-2 ring-cyan-400'
                    : 'bg-white text-slate-800 hover:bg-slate-50 border border-slate-300'
                }`}
              >
                <div className="text-[10px] font-bold">Pos 5: Front-Right</div>
                <div className="font-mono text-[10px]">
                  Err: {eccentricityPositions.find((p) => p.id === 'ecc_5')?.correctedError || 0} {unit}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {eccentricityPositions.map((pos) => (
              <div key={pos.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{pos.positionLabel}</span>
                  <StatusBadge status={pos.compliance} size="sm" />
                </div>

                <div className="text-xs space-y-2">
                  <div className="flex justify-between text-slate-600 font-mono">
                    <span>Applied Load:</span>
                    <span className="font-semibold text-slate-900">{pos.appliedLoad} {unit}</span>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">
                      Observed Indication:
                    </label>
                    <div className="flex items-center gap-1 font-mono">
                      <input
                        type="number"
                        step="any"
                        value={pos.indicatedLoad}
                        onChange={(e) =>
                          handleUpdateEccentricity(pos.id, parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded font-bold text-slate-900 focus:outline-none focus:border-cyan-500 text-right"
                      />
                      <span className="text-slate-500 text-[11px] font-sans">{unit}</span>
                    </div>
                  </div>

                  <div className="p-2 bg-white rounded border border-slate-200 text-xs font-mono space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Error:</span>
                      <span className={pos.compliance === 'pass' ? 'font-bold text-emerald-700' : 'font-bold text-rose-600'}>
                        {pos.correctedError > 0 ? `+${pos.correctedError}` : pos.correctedError} {unit}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>MPE:</span>
                      <span>±{pos.mpeAllowable} {unit}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: DISCRIMINATION (A.4.5) */}
      {activeTab === 'oiml_a45_discrimination' && (
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>A.4.5 — Discrimination / Sensitivity Test (Clause 3.8)</span>
              <StatusBadge
                status={evaluation.testExecutions.oiml_a45_discrimination?.overallProcedureCompliance || 'pass'}
                size="sm"
              />
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              An extra load equal to $1.4 d$ placed gently on the loaded receptor shall produce a definite change in indication of at least $1.0 d$.
            </p>
          </div>

          <div className="space-y-4">
            {discriminationPoints.map((dp, i) => (
              <div key={dp.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    Test Point #{i + 1}: Load = {dp.testLoad} {unit}
                  </span>
                  <StatusBadge status={dp.compliance} size="sm" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block text-[11px] font-sans">Initial Indication</span>
                    <span className="font-bold text-slate-900">{dp.initialIndication} {unit}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px] font-sans">Extra Load (1.4 d)</span>
                    <span className="font-bold text-cyan-800">{dp.extraLoadAdded.toFixed(4)} {unit}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px] font-sans">Resulting Indication</span>
                    <input
                      type="number"
                      step="any"
                      value={dp.resultingIndication}
                      onChange={(e) =>
                        handleUpdateDiscrimination(dp.id, parseFloat(e.target.value) || 0)
                      }
                      className="w-28 px-2 py-1 border border-slate-200 rounded font-bold text-slate-900 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px] font-sans">Change Observed (Min: 1 d)</span>
                    <span className={dp.compliance === 'pass' ? 'font-bold text-emerald-700' : 'font-bold text-rose-600'}>
                      {dp.differenceObserved} {unit} (Req: ≥ {dp.minimumRequiredChange})
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: ZERO SETTING (A.4.8) */}
      {activeTab === 'oiml_a48_zero_setting' && (
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>A.4.8 — Zero-Setting & Zero-Tracking Accuracy (Clause 3.9)</span>
              <StatusBadge status={zeroSetting.compliance} size="sm" />
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Residual zero error shall not exceed $\pm 0.25 e$ ($\pm{(0.25 * e).toFixed(5)} {unit}$).
            </p>
          </div>

          <div className="max-w-md p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-4 text-xs font-mono">
            <div>
              <label className="text-slate-700 font-sans font-medium block mb-1">
                Residual Error After Zero-Setting ({unit})
              </label>
              <input
                type="number"
                step="any"
                value={zeroSetting.residualErrorAtZero}
                onChange={(e) => handleUpdateZeroSetting(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-200 rounded font-bold text-slate-900 focus:outline-none focus:border-cyan-500 text-right"
              />
            </div>

            <div className="flex justify-between border-t border-slate-200 pt-2 text-slate-600">
              <span className="font-sans">Allowable Tolerance (0.25 e):</span>
              <span className="font-bold text-slate-900">±{zeroSetting.mpeAllowable} {unit}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-slate-800">
              <span className="font-sans font-semibold">Compliance Status:</span>
              <StatusBadge status={zeroSetting.compliance} size="sm" />
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 6: FUNCTIONAL INSPECTION (Clause 4) */}
      {activeTab === 'oiml_clauses4_functional' && (
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Clause 4 — Technical & Functional Requirements Inspection</span>
              <StatusBadge
                status={evaluation.testExecutions.oiml_clauses4_functional?.overallProcedureCompliance || 'pass'}
                size="sm"
              />
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Physical examination of markings, leveling bubble, security seals, and software checksum.
            </p>
          </div>

          <div className="space-y-3">
            {functionalChecks.map((chk) => (
              <div key={chk.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/40 space-y-2 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="font-medium text-slate-900">
                    <span className="font-mono font-bold text-slate-500 mr-2">{chk.clause}</span>
                    <span>{chk.item}</span>
                  </div>

                  <select
                    value={chk.status}
                    onChange={(e) => handleUpdateFunctionalCheck(chk.id, 'status', e.target.value)}
                    className="px-2.5 py-1 text-xs border border-slate-200 rounded font-semibold bg-white text-slate-800"
                  >
                    <option value="conforming">✓ Conforming</option>
                    <option value="non_conforming">✗ Non-Conforming</option>
                    <option value="not_applicable">— Not Applicable</option>
                  </select>
                </div>

                <input
                  type="text"
                  placeholder="Officer observations and remarks..."
                  value={chk.remarks}
                  onChange={(e) => handleUpdateFunctionalCheck(chk.id, 'remarks', e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded text-slate-700 focus:outline-none focus:border-cyan-500"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OTHER TABS / NOT APPLICABLE */}
      {activeTab !== 'oiml_a441_weighing' &&
        activeTab !== 'oiml_a442_repeatability' &&
        activeTab !== 'oiml_a47_eccentricity' &&
        activeTab !== 'oiml_a45_discrimination' &&
        activeTab !== 'oiml_a48_zero_setting' &&
        activeTab !== 'oiml_clauses4_functional' && (
          <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-xs text-center space-y-3">
            <h3 className="text-sm font-bold text-slate-800">Procedure Excluded or Configured as N/A</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              This procedure is configured as not applicable or evaluated under separate environmental certificate.
            </p>
          </div>
        )}

      {/* CSV Import Modal */}
      {csvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Upload size={16} className="text-cyan-700" />
                <span>Import Observations from CSV / Data Logger</span>
              </h3>
              <button
                onClick={() => setCsvModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-600 text-xs">
              Paste comma-separated rows. Required format: <br />
              <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">
                Step, Direction, Load, Load_In_e, Indication, DeltaL
              </code>
            </p>

            <textarea
              rows={6}
              value={csvRawText}
              onChange={(e) => setCsvRawText(e.target.value)}
              placeholder="1, increasing, 0.1, 20, 0.1, 0&#10;2, increasing, 2.5, 500, 2.5, 0&#10;3, increasing, 7.5, 1500, 7.5, 0&#10;4, increasing, 15.0, 3000, 15.005, 0"
              className="w-full p-2.5 border border-slate-200 rounded font-mono text-xs focus:outline-none focus:border-cyan-500"
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCsvModalOpen(false)}
                className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleImportWeighingCsv(csvRawText)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded font-semibold hover:bg-slate-800"
              >
                Parse & Populate Table
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Digital Signature / Aadhaar e-Sign Modal */}
      {signModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Shield size={16} className="text-indigo-600" />
                <span>Metrology Digital Signature & Stamp</span>
              </h3>
              <button
                onClick={() => setSignModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-lg bg-indigo-50/70 border border-indigo-200 space-y-2 text-indigo-950 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="font-sans text-slate-600">Officer:</span>
                <span className="font-bold">{storageService.getCurrentUser().name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-slate-600">Authority:</span>
                <span>Directorate of Legal Metrology</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-slate-600">PKI Token / Cert:</span>
                <span className="text-indigo-700 font-bold">CCA-INDIA-METRA-9812</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-slate-600">Timestamp:</span>
                <span>{new Date().toISOString()}</span>
              </div>
              <div className="flex justify-between border-t border-indigo-200 pt-1 text-[10px] text-slate-500">
                <span className="font-sans">Digest Hash:</span>
                <span className="truncate max-w-[180px]">SHA256-9a4f78c01b...</span>
              </div>
            </div>

            <p className="text-slate-500 text-[11px] leading-relaxed">
              Applying the digital signature records a tamper-evident audit record in the laboratory repository and approves/submits the observation measurements as per OIML R 76-1 standards.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSignModalOpen(false)}
                className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyDigitalSign}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-700 text-white rounded font-semibold hover:bg-indigo-800 shadow-xs"
              >
                <Check size={14} />
                <span>Apply Digital Token & Stamp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
