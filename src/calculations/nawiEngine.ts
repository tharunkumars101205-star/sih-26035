/**
 * METRALAB - Dedicated Metrology Calculation Engine for NAWIs
 * Conforms strictly to OIML R 76-1: 2006 (E) & Indian Legal Metrology Rules
 * 
 * Verifiable Formulas:
 * 1. Verification scale intervals count: n = Max / e
 * 2. Maximum Permissible Error (MPE) tiers (Table 6, Clause 3.5.1)
 * 3. Indication error with changeover weights (A.4.4.3): P = I + 0.5e - ΔL, E = P - L
 * 4. Corrected error: Ec = E - E0
 * 5. Repeatability range: ΔI = Imax - Imin <= |MPE|
 * 6. Eccentricity off-center error <= |MPE|
 * 7. Discrimination response: Extra load 1.4d causing >= 1d change
 * 8. Zero-setting residual error <= 0.25e
 */

import { AccuracyClass, ComplianceVerdict, WeighingInstrument } from '../types';

export interface MPECalculationResult {
  mpeValueInE: number; // in units of verification scale interval e (0.5, 1.0, 1.5)
  mpeValueInUnits: number; // in instrument units (kg, g, etc.)
  bracketDescription: string;
  loadInE: number;
  clauseReference: string;
}

export interface ErrorCalculationResult {
  indicatedLoad: number;
  actualLoad: number;
  deltaLAdded?: number;
  calculatedP: number;
  errorE: number;
  zeroErrorE0: number;
  correctedErrorEc: number;
  mpeAllowable: number;
  isWithinMpe: boolean;
  verdict: ComplianceVerdict;
  formulaUsed: string;
  stepExplanation: string;
}

/**
 * Validates basic NAWI instrument parameters according to OIML R 76-1 Clause 3.2 & 3.3
 */
export function validateInstrumentParameters(inst: Partial<WeighingInstrument>): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!inst.maxCapacity || inst.maxCapacity <= 0) {
    errors.push('Maximum capacity (Max) must be greater than zero.');
  }

  if (!inst.scaleInterval || inst.scaleInterval <= 0) {
    errors.push('Scale interval (d) must be greater than zero.');
  }

  if (!inst.verificationInterval || inst.verificationInterval <= 0) {
    errors.push('Verification scale interval (e) must be greater than zero.');
  }

  if (inst.maxCapacity && inst.verificationInterval) {
    const n = Math.round(inst.maxCapacity / inst.verificationInterval);
    if (inst.accuracyClass === 'I' && n < 50000) {
      warnings.push(`Class I instruments normally require n >= 50,000 (calculated n = ${n}).`);
    } else if (inst.accuracyClass === 'II') {
      if (n < 100) errors.push(`Class II requires n >= 100 (calculated n = ${n}).`);
      if (n > 100000) warnings.push(`Class II standard limit is n <= 100,000 (calculated n = ${n}).`);
    } else if (inst.accuracyClass === 'III') {
      if (n < 100) errors.push(`Class III requires n >= 100 (calculated n = ${n}).`);
      if (n > 10000) warnings.push(`Class III standard limit is n <= 10,000 (calculated n = ${n}).`);
    } else if (inst.accuracyClass === 'IIII') {
      if (n < 100) errors.push(`Class IIII requires n >= 100 (calculated n = ${n}).`);
      if (n > 1000) warnings.push(`Class IIII limit is n <= 1,000 (calculated n = ${n}).`);
    }
  }

  if (inst.minCapacity !== undefined && inst.maxCapacity !== undefined) {
    if (inst.minCapacity >= inst.maxCapacity) {
      errors.push('Minimum capacity (Min) must be strictly less than Maximum capacity (Max).');
    }
    if (inst.verificationInterval) {
      // OIML R 76-1 Table 3: Min capacity limits
      if (inst.accuracyClass === 'I' && inst.minCapacity < 100 * inst.verificationInterval) {
        warnings.push('Class I Min is usually >= 100 e.');
      } else if (inst.accuracyClass === 'II' && inst.minCapacity < 20 * inst.verificationInterval) {
        warnings.push('Class II Min is usually >= 20 e (for e >= 5mg).');
      } else if (inst.accuracyClass === 'III' && inst.minCapacity < 20 * inst.verificationInterval) {
        warnings.push('Class III Min is usually >= 20 e.');
      } else if (inst.accuracyClass === 'IIII' && inst.minCapacity < 10 * inst.verificationInterval) {
        warnings.push('Class IIII Min is usually >= 10 e.');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Calculates Maximum Permissible Error (MPE) for a given load m as per OIML R 76-1 Table 6
 * Initial verification tolerances (factor 1.0).
 */
export function calculateMPE(
  load: number,
  accuracyClass: AccuracyClass,
  e: number
): MPECalculationResult {
  if (e <= 0) {
    return {
      mpeValueInE: 0,
      mpeValueInUnits: 0,
      bracketDescription: 'Invalid verification interval e',
      loadInE: 0,
      clauseReference: 'OIML R 76-1: 3.5.1',
    };
  }

  const loadInE = Math.abs(load) / e;
  let mpeE = 0.5;
  let bracketDesc = '';

  switch (accuracyClass) {
    case 'I':
      if (loadInE <= 50000) {
        mpeE = 0.5;
        bracketDesc = '0 ≤ m ≤ 50,000 e (±0.5 e)';
      } else if (loadInE <= 200000) {
        mpeE = 1.0;
        bracketDesc = '50,000 e < m ≤ 200,000 e (±1.0 e)';
      } else {
        mpeE = 1.5;
        bracketDesc = 'm > 200,000 e (±1.5 e)';
      }
      break;

    case 'II':
      if (loadInE <= 5000) {
        mpeE = 0.5;
        bracketDesc = '0 ≤ m ≤ 5,000 e (±0.5 e)';
      } else if (loadInE <= 20000) {
        mpeE = 1.0;
        bracketDesc = '5,000 e < m ≤ 20,000 e (±1.0 e)';
      } else {
        mpeE = 1.5;
        bracketDesc = '20,000 e < m ≤ 100,000 e (±1.5 e)';
      }
      break;

    case 'III':
      if (loadInE <= 500) {
        mpeE = 0.5;
        bracketDesc = '0 ≤ m ≤ 500 e (±0.5 e)';
      } else if (loadInE <= 2000) {
        mpeE = 1.0;
        bracketDesc = '500 e < m ≤ 2,000 e (±1.0 e)';
      } else {
        mpeE = 1.5;
        bracketDesc = '2,000 e < m ≤ 10,000 e (±1.5 e)';
      }
      break;

    case 'IIII':
      if (loadInE <= 50) {
        mpeE = 0.5;
        bracketDesc = '0 ≤ m ≤ 50 e (±0.5 e)';
      } else if (loadInE <= 200) {
        mpeE = 1.0;
        bracketDesc = '50 e < m ≤ 200 e (±1.0 e)';
      } else {
        mpeE = 1.5;
        bracketDesc = '200 e < m ≤ 1,000 e (±1.5 e)';
      }
      break;

    default:
      mpeE = 1.0;
      bracketDesc = 'Standard general bracket (±1.0 e)';
  }

  // Rounding mpeValueInUnits to appropriate precision
  const mpeValueInUnits = parseFloat((mpeE * e).toFixed(6));

  return {
    mpeValueInE: mpeE,
    mpeValueInUnits,
    bracketDescription: bracketDesc,
    loadInE: parseFloat(loadInE.toFixed(2)),
    clauseReference: 'OIML R 76-1:2006, Section 3.5.1, Table 6',
  };
}

/**
 * Calculates Indication Error and Corrected Error as per OIML R 76-1 Clause A.4.4.3
 * 
 * If ΔL (changeover weights) is provided:
 *   P = I + 0.5e - ΔL
 *   E = P - L
 * If direct indication is used (no flashing weights):
 *   P = I
 *   E = I - L
 * Corrected Error:
 *   Ec = E - E0
 */
export function calculateWeighingError(
  load: number,
  indicatedLoad: number,
  e: number,
  accuracyClass: AccuracyClass,
  deltaL?: number,
  zeroErrorE0: number = 0
): ErrorCalculationResult {
  let calculatedP = indicatedLoad;
  let formulaUsed = 'Direct Digital Reading: E = I - L, Ec = E - E0';

  if (deltaL !== undefined && deltaL !== null && !isNaN(deltaL)) {
    // Turning point continuous approximation
    calculatedP = indicatedLoad + 0.5 * e - deltaL;
    formulaUsed = 'Changeover Turning Point (OIML A.4.4.3): P = I + 0.5e - ΔL, E = P - L, Ec = E - E0';
  }

  const errorE = parseFloat((calculatedP - load).toFixed(6));
  const correctedErrorEc = parseFloat((errorE - zeroErrorE0).toFixed(6));

  const mpeInfo = calculateMPE(load, accuracyClass, e);
  const mpeAllowable = mpeInfo.mpeValueInUnits;

  // Tolerant to floating point epsilon
  const isWithinMpe = Math.abs(correctedErrorEc) <= mpeAllowable + 1e-9;
  const verdict: ComplianceVerdict = isWithinMpe ? 'pass' : 'fail';

  const stepExplanation =
    deltaL !== undefined
      ? `Load L = ${load}, Indication I = ${indicatedLoad}, ΔL = ${deltaL}, e = ${e}. ` +
        `P = ${indicatedLoad} + (0.5 × ${e}) - ${deltaL} = ${calculatedP.toFixed(4)}. ` +
        `E = ${calculatedP.toFixed(4)} - ${load} = ${errorE.toFixed(4)}. ` +
        `Ec = ${errorE.toFixed(4)} - (${zeroErrorE0.toFixed(4)}) = ${correctedErrorEc.toFixed(4)}. ` +
        `Permissible |MPE| = ±${mpeAllowable} (${mpeInfo.bracketDescription}).`
      : `Load L = ${load}, Indication I = ${indicatedLoad}. ` +
        `E = ${indicatedLoad} - ${load} = ${errorE.toFixed(4)}. ` +
        `Ec = ${errorE.toFixed(4)} - (${zeroErrorE0.toFixed(4)}) = ${correctedErrorEc.toFixed(4)}. ` +
        `Permissible |MPE| = ±${mpeAllowable} (${mpeInfo.bracketDescription}).`;

  return {
    indicatedLoad,
    actualLoad: load,
    deltaLAdded: deltaL,
    calculatedP: parseFloat(calculatedP.toFixed(6)),
    errorE,
    zeroErrorE0,
    correctedErrorEc,
    mpeAllowable,
    isWithinMpe,
    verdict,
    formulaUsed,
    stepExplanation,
  };
}

/**
 * Repeatability Evaluation (OIML R 76-1: Clause 3.6.1 / A.4.4.2)
 * Max difference between indications of same load <= |MPE|
 */
export function evaluateRepeatabilitySeries(
  load: number,
  indications: number[],
  accuracyClass: AccuracyClass,
  e: number
): {
  minIndication: number;
  maxIndication: number;
  rangeDifference: number;
  mpeAllowable: number;
  verdict: ComplianceVerdict;
  details: string;
} {
  if (indications.length === 0) {
    return {
      minIndication: 0,
      maxIndication: 0,
      rangeDifference: 0,
      mpeAllowable: 0,
      verdict: 'unable_to_determine',
      details: 'No observations recorded.',
    };
  }

  const minIndication = Math.min(...indications);
  const maxIndication = Math.max(...indications);
  const rangeDifference = parseFloat((maxIndication - minIndication).toFixed(6));
  const mpeInfo = calculateMPE(load, accuracyClass, e);
  const mpeAllowable = mpeInfo.mpeValueInUnits;

  const isPass = rangeDifference <= mpeAllowable + 1e-9;

  return {
    minIndication,
    maxIndication,
    rangeDifference,
    mpeAllowable,
    verdict: isPass ? 'pass' : 'fail',
    details: `Observed range ΔI = ${rangeDifference} (Min: ${minIndication}, Max: ${maxIndication}). Allowable limit |MPE| = ${mpeAllowable} (${mpeInfo.bracketDescription}).`,
  };
}

/**
 * Discrimination Test Evaluation (OIML R 76-1: Clause 3.8 / A.4.5)
 * When 1.4 d load is added, indication must change by at least 1 d
 */
export function evaluateDiscrimination(
  initialIndication: number,
  resultingIndication: number,
  scaleIntervalD: number
): {
  difference: number;
  requiredChange: number;
  verdict: ComplianceVerdict;
  details: string;
} {
  const difference = parseFloat(Math.abs(resultingIndication - initialIndication).toFixed(6));
  const requiredChange = parseFloat((1.0 * scaleIntervalD).toFixed(6));
  const isPass = difference >= requiredChange - 1e-9;

  return {
    difference,
    requiredChange,
    verdict: isPass ? 'pass' : 'fail',
    details: `Observed change = ${difference}, Minimum required change = ${requiredChange} (1.0 d). Extra load applied = ${(
      1.4 * scaleIntervalD
    ).toFixed(4)} (1.4 d).`,
  };
}

/**
 * Zero-setting residual error evaluation (OIML R 76-1: Clause 3.9 / A.4.8)
 * Error shall not exceed ±0.25 e
 */
export function evaluateZeroSetting(
  residualError: number,
  e: number
): {
  allowableError: number;
  verdict: ComplianceVerdict;
  details: string;
} {
  const allowableError = parseFloat((0.25 * e).toFixed(6));
  const isPass = Math.abs(residualError) <= allowableError + 1e-9;

  return {
    allowableError,
    verdict: isPass ? 'pass' : 'fail',
    details: `Residual zero error = ${residualError}, Allowable tolerance = ±${allowableError} (±0.25 e).`,
  };
}
