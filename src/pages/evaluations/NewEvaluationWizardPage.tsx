import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Scale,
  FlaskConical,
  Building2,
  Calendar,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { OIML_R76_PROCEDURES } from '../../regulatory/testRegistry';
import { Evaluation, LaboratoryConditions, TestExecutionData, TestProcedureId, WeighingInstrument } from '../../types';

interface NewEvaluationWizardPageProps {
  initialInstrumentId?: string;
  onNavigate: (path: string) => void;
}

export const NewEvaluationWizardPage: React.FC<NewEvaluationWizardPageProps> = ({
  initialInstrumentId,
  onNavigate,
}) => {
  const instruments = storageService.getInstruments();
  const manufacturers = storageService.getManufacturers();
  const users = storageService.getUsers();
  const defaultSettings = storageService.getSettings();

  const [currentStep, setCurrentStep] = useState<number>(1);

  // Wizard State
  const [selectedInstrumentId, setSelectedInstrumentId] = useState<string>(
    initialInstrumentId || instruments[0]?.id || ''
  );
  const [evaluationType, setEvaluationType] = useState<Evaluation['evaluationType']>(
    'type_evaluation_model_approval'
  );
  const [regulatoryBasisId, setRegulatoryBasisId] = useState('rule_oiml_r76_2006');
  const [assignedEngineerId, setAssignedEngineerId] = useState(
    users.find((u) => u.role === 'testing_engineer')?.id || users[0].id
  );
  const [assignedReviewerId, setAssignedReviewerId] = useState(
    users.find((u) => u.role === 'technical_reviewer')?.id || users[1]?.id || users[0].id
  );

  // Environmental conditions
  const [labConditions, setLabConditions] = useState<LaboratoryConditions>({
    laboratoryName: defaultSettings.laboratoryName,
    roomIdentification: 'Chamber Bay #2 (Climate Regulated)',
    ambientTempStart: 21.0,
    ambientTempEnd: 21.8,
    relativeHumidityStart: 50.0,
    relativeHumidityEnd: 52.5,
    barometricPressureStart: 1013.2,
    barometricPressureEnd: 1012.9,
    weightsSetReference: 'NLM-STD-WGT-F1-08',
    weightsClass: 'F1',
    weightsCalibrationCertNo: 'CERT-NPLI-2025-W-4412',
    weightsCertExpiryDate: '2027-04-30',
    localGravityMs2: defaultSettings.defaultGravity || 9.7912,
  });

  // Selected test procedures
  const [selectedTests, setSelectedTests] = useState<Record<TestProcedureId, boolean>>({
    oiml_a441_weighing: true,
    oiml_a442_repeatability: true,
    oiml_a47_eccentricity: true,
    oiml_a45_discrimination: true,
    oiml_a48_zero_setting: true,
    oiml_a443_tare: true,
    oiml_a531_temperature: false,
    oiml_clauses4_functional: true,
  });

  const selectedInst = instruments.find((i) => i.id === selectedInstrumentId) || instruments[0];
  const selectedMfr = manufacturers.find((m) => m.id === selectedInst?.manufacturerId);
  const assignedEng = users.find((u) => u.id === assignedEngineerId) || users[0];
  const assignedRev = users.find((u) => u.id === assignedReviewerId) || users[1] || users[0];

  const handleTestToggle = (id: TestProcedureId) => {
    setSelectedTests((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCreateEvaluation = () => {
    const evalId = `eval_${Date.now()}`;
    const evaluationNumber = `EVAL-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const testExecutions: Record<TestProcedureId, TestExecutionData> = {} as any;
    let includedCount = 0;

    OIML_R76_PROCEDURES.forEach((proc) => {
      const isIncluded = !!selectedTests[proc.id];
      if (isIncluded) includedCount++;

      testExecutions[proc.id] = {
        testProcedureId: proc.id,
        isIncluded,
        status: isIncluded ? 'in_progress' : 'completed',
        isNotApplicableReason: isIncluded ? undefined : 'Excluded by testing plan during wizard initialization.',
        overallProcedureCompliance: isIncluded ? 'requires_verification' : 'not_applicable',
      };
    });

    const newEval: Evaluation = {
      id: evalId,
      evaluationNumber,
      instrumentId: selectedInst.id,
      instrumentSnapshot: selectedInst,
      manufacturerSnapshot: selectedMfr || {
        id: 'mfr_unknown',
        name: selectedInst.manufacturerName,
        referenceId: 'MFR-GEN',
        address: 'N/A',
        city: 'N/A',
        state: 'N/A',
        country: 'India',
        contactEmail: 'regulatory@nawi.gov.in',
        contactPhone: 'N/A',
        createdDate: new Date().toISOString(),
      },
      evaluationType,
      regulatoryBasisId,
      regulatoryBasisName: 'OIML R 76-1:2006 (E) & Legal Metrology Rules, 2011',
      assignedEngineer: {
        id: assignedEng.id,
        name: assignedEng.name,
        email: assignedEng.email,
      },
      assignedReviewer: {
        id: assignedRev.id,
        name: assignedRev.name,
        email: assignedRev.email,
      },
      laboratoryConditions: labConditions,
      testExecutions,
      complianceSummary: {
        totalTestsConfigured: includedCount,
        totalTestsExecuted: 0,
        passedCount: 0,
        failedCount: 0,
        requiresVerificationCount: includedCount,
        overallVerdict: 'requires_verification',
        evaluatedAt: new Date().toISOString(),
      },
      evidenceIds: [],
      status: 'in_progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reviewHistory: [
        {
          id: `rev_init_${Date.now()}`,
          evaluationId: evalId,
          reviewerId: assignedEng.id,
          reviewerName: assignedEng.name,
          action: 'submit',
          comments: `Evaluation plan initialized for ${selectedInst.modelDesignation}. ${includedCount} OIML R 76 procedures configured.`,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    storageService.saveEvaluation(newEval);
    // Navigate directly to test execution workbench for seamless workflow
    onNavigate(`/test-execution/${newEval.id}`);
  };

  const steps = [
    { num: 1, label: 'Instrument & Model' },
    { num: 2, label: 'Environmental Conditions' },
    { num: 3, label: 'Prescribed Test Plan' },
    { num: 4, label: 'Review & Initialize' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Wizard Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/evaluations')}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              New Type Evaluation Wizard
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-step configuration for OIML R 76-1 Non-Automatic Weighing Instrument verification.
            </p>
          </div>
        </div>
      </div>

      {/* Stepper Progress Bar */}
      <div className="grid grid-cols-4 gap-2 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
        {steps.map((s) => (
          <button
            key={s.num}
            onClick={() => setCurrentStep(s.num)}
            className={`flex items-center gap-2 p-2 rounded text-left transition-colors ${
              currentStep === s.num
                ? 'bg-slate-900 text-white'
                : currentStep > s.num
                ? 'bg-slate-100 text-slate-700'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <div
              className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                currentStep === s.num
                  ? 'bg-white text-slate-900'
                  : currentStep > s.num
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {currentStep > s.num ? '✓' : s.num}
            </div>
            <span className="text-xs font-semibold truncate hidden sm:inline">
              {s.label}
            </span>
          </button>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-6">
        {/* STEP 1: Instrument & Basis */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">
                Select Weighing Instrument & Evaluation Type
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Choose a registered NAWI from the laboratory registry to be evaluated.
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-medium text-slate-700">
                Target Weighing Instrument <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 gap-2.5">
                {instruments.map((inst) => (
                  <div
                    key={inst.id}
                    onClick={() => setSelectedInstrumentId(inst.id)}
                    className={`p-3.5 rounded-lg border text-left cursor-pointer transition-colors flex items-center justify-between gap-4 ${
                      selectedInstrumentId === inst.id
                        ? 'border-cyan-600 bg-cyan-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {inst.instrumentId}
                        </span>
                        <span className="font-semibold text-xs text-slate-800">
                          {inst.modelDesignation}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {inst.manufacturerName} · Class {inst.accuracyClass} · Max {inst.maxCapacity} {inst.measurementUnit} · e = {inst.verificationInterval} {inst.measurementUnit}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono text-xs font-bold text-slate-700">
                        n = {inst.calculatedN.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Evaluation Scope / Purpose
                </label>
                <select
                  value={evaluationType}
                  onChange={(e) => setEvaluationType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded bg-white text-slate-900 font-medium focus:outline-none focus:border-cyan-500"
                >
                  <option value="type_evaluation_model_approval">
                    Type Evaluation / Pattern Approval (Section 22, LM Act 2009)
                  </option>
                  <option value="initial_verification">
                    Initial Verification (Factory / Acceptance Verification)
                  </option>
                  <option value="subsequent_verification">
                    Subsequent / Periodic Reverification (Stamping)
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Regulatory Standard & Version
                </label>
                <select
                  value={regulatoryBasisId}
                  onChange={(e) => setRegulatoryBasisId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded bg-white text-slate-900 font-medium focus:outline-none focus:border-cyan-500"
                >
                  <option value="rule_oiml_r76_2006">
                    OIML R 76-1: 2006 (E) & Legal Metrology Rules, 2011
                  </option>
                  <option value="rule_in_lm_rules_2011">
                    Seventh Schedule (Indian LM General Rules 2011)
                  </option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Lab & Environmental Conditions */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">
                Record Laboratory & Environmental Testing Conditions
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Climatic parameters and reference standard weights traceability as required by OIML R 76-1 Clause A.1.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-medium text-slate-700 mb-1">
                  Testing Laboratory Name
                </label>
                <input
                  type="text"
                  value={labConditions.laboratoryName}
                  onChange={(e) => setLabConditions({ ...labConditions, laboratoryName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Chamber / Room ID
                </label>
                <input
                  type="text"
                  value={labConditions.roomIdentification}
                  onChange={(e) => setLabConditions({ ...labConditions, roomIdentification: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Ambient Temp Start (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={labConditions.ambientTempStart}
                  onChange={(e) => setLabConditions({ ...labConditions, ambientTempStart: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded font-mono text-slate-900 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Ambient Temp End (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={labConditions.ambientTempEnd}
                  onChange={(e) => setLabConditions({ ...labConditions, ambientTempEnd: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded font-mono text-slate-900 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Relative Humidity Start (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={labConditions.relativeHumidityStart}
                  onChange={(e) => setLabConditions({ ...labConditions, relativeHumidityStart: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded font-mono text-slate-900 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Relative Humidity End (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={labConditions.relativeHumidityEnd}
                  onChange={(e) => setLabConditions({ ...labConditions, relativeHumidityEnd: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded font-mono text-slate-900 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Barometric Pressure Start (hPa)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={labConditions.barometricPressureStart}
                  onChange={(e) => setLabConditions({ ...labConditions, barometricPressureStart: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded font-mono text-slate-900 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Barometric Pressure End (hPa)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={labConditions.barometricPressureEnd}
                  onChange={(e) => setLabConditions({ ...labConditions, barometricPressureEnd: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded font-mono text-slate-900 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="border-t border-slate-100 sm:col-span-2 md:col-span-3 pt-3">
                <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block mb-2">
                  Traceable Standard Weights Information (OIML R 111-1)
                </span>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Standard Weights Reference
                </label>
                <input
                  type="text"
                  value={labConditions.weightsSetReference}
                  onChange={(e) => setLabConditions({ ...labConditions, weightsSetReference: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Weights Accuracy Class
                </label>
                <select
                  value={labConditions.weightsClass}
                  onChange={(e) => setLabConditions({ ...labConditions, weightsClass: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-200 rounded bg-white text-slate-900 focus:outline-none focus:border-cyan-500"
                >
                  <option value="E1">Class E1 (Special Precision for Class I balances)</option>
                  <option value="E2">Class E2 (Precision for Class I / II balances)</option>
                  <option value="F1">Class F1 (Standard for Class II / III scales)</option>
                  <option value="F2">Class F2 (Working standard for Class III scales)</option>
                  <option value="M1">Class M1 (Heavy capacity platform / weighbridges)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Calibration Certificate No.
                </label>
                <input
                  type="text"
                  value={labConditions.weightsCalibrationCertNo}
                  onChange={(e) => setLabConditions({ ...labConditions, weightsCalibrationCertNo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Certificate Validity Date
                </label>
                <input
                  type="date"
                  value={labConditions.weightsCertExpiryDate}
                  onChange={(e) => setLabConditions({ ...labConditions, weightsCertExpiryDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Local Acceleration of Gravity (m/s²)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={labConditions.localGravityMs2}
                  onChange={(e) => setLabConditions({ ...labConditions, localGravityMs2: parseFloat(e.target.value) || 9.7912 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded font-mono text-slate-900 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Prescribed Test Plan Selection */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">
                Prescribed OIML R 76-1 Test Procedures Configuration
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Enable applicable metrological evaluation procedures for this NAWI category.
              </p>
            </div>

            <div className="space-y-3">
              {OIML_R76_PROCEDURES.map((proc) => {
                const isChecked = !!selectedTests[proc.id];
                return (
                  <div
                    key={proc.id}
                    onClick={() => handleTestToggle(proc.id)}
                    className={`p-3.5 rounded-lg border text-left cursor-pointer transition-colors flex items-start gap-3.5 ${
                      isChecked
                        ? 'border-cyan-600 bg-cyan-50/40 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="mt-1 h-4 w-4 text-cyan-600 rounded border-slate-300 focus:ring-cyan-500"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {proc.code}
                        </span>
                        <span className="font-semibold text-xs text-slate-800">
                          {proc.title}
                        </span>
                        {proc.isMandatory && (
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                            Prescribed Core
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-600">{proc.description}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Reference: {proc.clause}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: Assignment & Final Confirmation */}
        {currentStep === 4 && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">
                Evaluation Officers & Final Confirmation
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Assign testing personnel and review configuration before opening observation workbench.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Testing Officer / Engineer <span className="text-rose-500">*</span>
                </label>
                <select
                  value={assignedEngineerId}
                  onChange={(e) => setAssignedEngineerId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded bg-white text-slate-900 font-medium focus:outline-none focus:border-cyan-500"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Technical Reviewer / Approver <span className="text-rose-500">*</span>
                </label>
                <select
                  value={assignedReviewerId}
                  onChange={(e) => setAssignedReviewerId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded bg-white text-slate-900 font-medium focus:outline-none focus:border-cyan-500"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.designation})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Summary Review Panel */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2">
              <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block">
                Evaluation Configuration Summary
              </span>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>
                  <span className="font-medium text-slate-800">Instrument:</span> {selectedInst.instrumentId} ({selectedInst.modelDesignation})
                </div>
                <div>
                  <span className="font-medium text-slate-800">Manufacturer:</span> {selectedInst.manufacturerName}
                </div>
                <div>
                  <span className="font-medium text-slate-800">Capacity & Intervals:</span> Max {selectedInst.maxCapacity} {selectedInst.measurementUnit} (e={selectedInst.verificationInterval}, d={selectedInst.scaleInterval})
                </div>
                <div>
                  <span className="font-medium text-slate-800">Standard Weights:</span> {labConditions.weightsSetReference} (Class {labConditions.weightsClass})
                </div>
                <div className="col-span-2">
                  <span className="font-medium text-slate-800">Prescribed Procedures Included:</span>{' '}
                  {Object.entries(selectedTests).filter(([, inc]) => inc).length} tests selected
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step Navigation Controls */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <button
            type="button"
            disabled={currentStep === 1}
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            className="px-4 py-2 text-xs font-medium border border-slate-200 rounded text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            Previous
          </button>

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => Math.min(4, prev + 1))}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors shadow-xs"
            >
              <span>Next Step</span>
              <ChevronRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCreateEvaluation}
              className="flex items-center gap-1.5 px-6 py-2 text-xs font-semibold text-white bg-cyan-700 rounded hover:bg-cyan-800 transition-colors shadow-xs"
            >
              <span>Initialize & Start Testing</span>
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
