/**
 * METRALAB - Digital NAWI Testing, Compliance & Report Generation Platform
 * Core Data Models & TypeScript Definitions
 * Aligned with OIML R 76-1 (2006) & Indian Legal Metrology Rules, 2011
 */

export type UserRole = 'testing_engineer' | 'technical_reviewer' | 'laboratory_admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  designation: string;
  organization: string;
  signaturePlaceholderText?: string;
  avatarInitials: string;
}

export type AccuracyClass = 'I' | 'II' | 'III' | 'IIII';

export type InstrumentType =
  | 'electronic_counter_scale'
  | 'bench_platform_scale'
  | 'heavy_platform_scale'
  | 'weighbridge_truck_scale'
  | 'precision_laboratory_balance'
  | 'crane_hanging_scale'
  | 'hopper_silo_scale';

export type InstrumentStatus = 'registered' | 'under_evaluation' | 'approved' | 'rejected' | 'archived';

export interface Manufacturer {
  id: string;
  name: string;
  referenceId: string;
  address: string;
  city: string;
  state: string;
  country: string;
  contactEmail: string;
  contactPhone: string;
  licenseNumber?: string;
  createdDate: string;
}

export interface WeighingInstrument {
  id: string;
  instrumentId: string; // e.g. NAWI-2026-0042
  manufacturerId: string;
  manufacturerName: string;
  modelDesignation: string;
  serialNumber: string;
  type: InstrumentType;
  accuracyClass: AccuracyClass;
  maxCapacity: number; // Max
  minCapacity: number; // Min
  scaleInterval: number; // d
  verificationInterval: number; // e
  calculatedN: number; // n = Max / e
  measurementUnit: 'g' | 'kg' | 't' | 'mg';
  tareCapacity?: number; // T
  operatingTempMin: number; // °C (default -10 or +10 depending on class)
  operatingTempMax: number; // °C (default +40)
  powerSupply: string; // e.g. 230V AC 50Hz / Internal Rechargeable 6V
  laboratoryLocation: string;
  modelApprovalRef?: string;
  registrationDate: string;
  status: InstrumentStatus;
  notes?: string;
}

export interface LaboratoryConditions {
  laboratoryName: string;
  roomIdentification: string;
  ambientTempStart: number; // °C
  ambientTempEnd: number; // °C
  relativeHumidityStart: number; // %
  relativeHumidityEnd: number; // %
  barometricPressureStart: number; // hPa
  barometricPressureEnd: number; // hPa
  weightsSetReference: string; // e.g. STD-WGT-E2-04
  weightsClass: 'E1' | 'E2' | 'F1' | 'F2' | 'M1';
  weightsCalibrationCertNo: string;
  weightsCertExpiryDate: string;
  localGravityMs2: number; // e.g. 9.791 m/s²
}

export type EvaluationStatus =
  | 'draft'
  | 'in_progress'
  | 'submitted'
  | 'changes_requested'
  | 'approved'
  | 'report_generated';

export type ComplianceVerdict =
  | 'pass'
  | 'fail'
  | 'requires_verification'
  | 'unable_to_determine'
  | 'not_applicable';

export interface MPEBracket {
  rangeDescription: string;
  minLoadE: number;
  maxLoadE: number;
  mpeUnitsE: number; // e.g. 0.5, 1.0, 1.5
}

// ---------------------------------------------------------------------------
// TEST PROCEDURE & OBSERVATION TYPES
// ---------------------------------------------------------------------------

export type TestProcedureId =
  | 'oiml_a441_weighing'
  | 'oiml_a442_repeatability'
  | 'oiml_a47_eccentricity'
  | 'oiml_a443_tare'
  | 'oiml_a45_discrimination'
  | 'oiml_a48_zero_setting'
  | 'oiml_a531_temperature'
  | 'oiml_clauses4_functional';

export interface TestProcedureMeta {
  id: TestProcedureId;
  code: string; // e.g. OIML R 76-1: A.4.4.1
  title: string;
  clause: string;
  description: string;
  applicableClasses: AccuracyClass[];
  isMandatory: boolean;
  edition: string;
}

// 1. Weighing Performance Observation Row (Increasing & Decreasing)
export interface WeighingTestRow {
  id: string;
  stepNumber: number;
  load: number; // standard load L in instrument unit
  loadInE: number; // L / e
  direction: 'increasing' | 'decreasing';
  indicatedLoad: number; // I
  deltaLAdded?: number; // ΔL (changeover weights, if flashing point method used)
  turningPointInterval?: number; // e.g. 0.1 e
  actualWeightCalculated?: number; // P = I + 0.5e - ΔL
  error: number; // E = P - L (or I - L if raw)
  correctedError: number; // Ec = E - E0
  mpeForLoad: number; // allowable ± MPE in instrument unit
  compliance: ComplianceVerdict;
}

// 2. Repeatability Observation Row (Series of 3 to 10 weighings at specific load)
export interface RepeatabilitySeries {
  id: string;
  seriesName: string; // e.g. "Series A: ~0.5 Max" or "Series B: ~Max"
  appliedLoad: number;
  observations: {
    run: number;
    indication: number;
    deltaL?: number;
    calculatedWeight: number;
    error: number;
  }[];
  maxIndication: number;
  minIndication: number;
  rangeDifference: number; // Max - Min
  mpeAllowable: number;
  compliance: ComplianceVerdict;
}

// 3. Eccentricity Observation Row (Different quadrant/off-centre positions)
export interface EccentricityPosition {
  id: string;
  positionNumber: number;
  positionLabel: string; // "Centre", "Front-Left", "Back-Left", "Back-Right", "Front-Right"
  appliedLoad: number; // usually 1/3 Max or 1/4 Max
  indicatedLoad: number;
  deltaLAdded?: number;
  error: number;
  correctedError: number;
  mpeAllowable: number;
  compliance: ComplianceVerdict;
}

// 4. Discrimination Observation
export interface DiscriminationTestPoint {
  id: string;
  testLoad: number; // e.g. Min, 0.5 Max, Max
  initialIndication: number;
  extraLoadAdded: number; // 1.4 d
  resultingIndication: number;
  differenceObserved: number; // resulting - initial
  minimumRequiredChange: number; // at least 1 d
  compliance: ComplianceVerdict;
}

// 5. Tare Weighing Observation
export interface TareTestRecord {
  id: string;
  tareApplied: number;
  grossLoad: number;
  netIndication: number;
  error: number;
  mpeAllowable: number;
  compliance: ComplianceVerdict;
}

// 6. Zero-Setting & Zero-Tracking Observation
export interface ZeroSettingRecord {
  zeroSettingType: 'semi-automatic' | 'automatic' | 'initial_zero';
  residualErrorAtZero: number; // must be within ± 0.25 e
  zeroTrackingBand?: number; // e.g. 0.5 d / second
  mpeAllowable: number; // 0.25 e
  compliance: ComplianceVerdict;
}

// 7. Static Temperature Test
export interface TemperatureTestRecord {
  temperatureC: number; // e.g. 20°C, 40°C, -10°C, 20°C
  durationHours: number;
  relativeHumidityPercent: number;
  zeroIndicationDrift: number; // drift per 5°C (max 1e/5°C for class III)
  spanErrorAtMax: number;
  mpeAllowable: number;
  compliance: ComplianceVerdict;
}

// Functional / Visual checklist
export interface FunctionalCheckItem {
  id: string;
  clause: string;
  item: string;
  status: 'conforming' | 'non_conforming' | 'not_applicable';
  remarks: string;
}

export interface TestExecutionData {
  testProcedureId: TestProcedureId;
  isIncluded: boolean;
  isNotApplicableReason?: string;
  status: 'not_started' | 'in_progress' | 'completed';
  completedAt?: string;
  notes?: string;

  // Specific payloads
  weighingRows?: WeighingTestRow[];
  repeatabilitySeries?: RepeatabilitySeries[];
  eccentricityPositions?: EccentricityPosition[];
  discriminationPoints?: DiscriminationTestPoint[];
  tareRecords?: TareTestRecord[];
  zeroSetting?: ZeroSettingRecord;
  temperatureRecords?: TemperatureTestRecord[];
  functionalChecks?: FunctionalCheckItem[];

  overallProcedureCompliance: ComplianceVerdict;
}

// ---------------------------------------------------------------------------
// EVALUATION MASTER RECORD
// ---------------------------------------------------------------------------

export interface Evaluation {
  id: string;
  evaluationNumber: string; // e.g. EVAL-2026-0089
  instrumentId: string;
  instrumentSnapshot: WeighingInstrument;
  manufacturerSnapshot: Manufacturer;
  evaluationType: 'type_evaluation_model_approval' | 'initial_verification' | 'subsequent_verification';
  regulatoryBasisId: string; // e.g. "OIML_R76_2006_IN_LM2011"
  regulatoryBasisName: string;
  assignedEngineer: {
    id: string;
    name: string;
    email: string;
  };
  assignedReviewer: {
    id: string;
    name: string;
    email: string;
  };
  laboratoryConditions: LaboratoryConditions;
  testExecutions: Record<TestProcedureId, TestExecutionData>;
  complianceSummary: {
    totalTestsConfigured: number;
    totalTestsExecuted: number;
    passedCount: number;
    failedCount: number;
    requiresVerificationCount: number;
    overallVerdict: ComplianceVerdict;
    evaluatedAt: string;
  };
  evidenceIds: string[];
  status: EvaluationStatus;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  approvedAt?: string;
  reportId?: string;
  reviewHistory: ReviewRecord[];
}

export interface ReviewRecord {
  id: string;
  evaluationId: string;
  reviewerId: string;
  reviewerName: string;
  action: 'submit' | 'request_corrections' | 'resubmit' | 'approve' | 'reject';
  comments: string;
  timestamp: string;
  requiredCorrections?: string[];
}

export interface EvidenceFile {
  id: string;
  name: string;
  fileType: 'image/jpeg' | 'image/png' | 'application/pdf' | 'document';
  sizeBytes: number;
  dataUrl?: string; // local base64 or mock preview
  description: string;
  associatedType: 'instrument' | 'evaluation' | 'test_procedure' | 'report';
  associatedId: string;
  uploaderName: string;
  uploadedAt: string;
}

export interface TestReport {
  id: string;
  reportNumber: string; // e.g. TR-OIML-2026-0042
  evaluationId: string;
  instrumentId: string;
  modelDesignation: string;
  manufacturerName: string;
  serialNumber: string;
  version: number;
  title: string;
  status: 'draft' | 'final' | 'superseded';
  generatedAt: string;
  generatedBy: string;
  approvedBy?: string;
  approvedAt?: string;
  regulatoryStandard: string;
  overallConclusion: string;
  isSimulatedSignature: boolean;
  signatureSignerName?: string;
  revisionNotes?: string;
  hasPdfExported?: boolean;
  hasDocxExported?: boolean;
}

export interface RegulatoryRule {
  id: string;
  code: string; // e.g. OIML R 76-1:2006
  title: string;
  issuingAuthority: string;
  edition: string;
  effectiveDate: string;
  status: 'active_verified' | 'draft' | 'superseded' | 'requires_verification';
  clausesSummary: string;
  sourceDocUrl?: string;
  mpeTablesDescription: string;
}

export interface AuditLogEvent {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  targetType: 'instrument' | 'evaluation' | 'test_record' | 'review' | 'report' | 'settings';
  targetId: string;
  details: string;
}

export interface LaboratorySettings {
  laboratoryName: string;
  accreditationNumber: string; // e.g. NABL / Legal Metrology Lab Ref
  addressLine1: string;
  addressLine2: string;
  cityStatePincode: string;
  phone: string;
  email: string;
  website: string;
  reportPrefix: string;
  evaluationPrefix: string;
  defaultGravity: number;
}
