/**
 * METRALAB - Automated Verification Suite for NAWI Calculations
 * Tests conform strictly to OIML R 76-1 (2006) Table 6 & Annex A.4
 */

import {
  calculateMPE,
  calculateWeighingError,
  evaluateRepeatabilitySeries,
  evaluateDiscrimination,
  evaluateZeroSetting,
  validateInstrumentParameters,
} from './nawiEngine';

export function runEngineSelfTest(): {
  allPassed: boolean;
  totalTests: number;
  passedCount: number;
  results: { testName: string; passed: boolean; message: string }[];
} {
  const testResults: { testName: string; passed: boolean; message: string }[] = [];

  function assert(condition: boolean, testName: string, detail: string) {
    testResults.push({
      testName,
      passed: condition,
      message: condition ? `Passed: ${detail}` : `FAILED: ${detail}`,
    });
  }

  // 1. Parameter validation
  const validInst = validateInstrumentParameters({
    maxCapacity: 15,
    minCapacity: 0.1,
    scaleInterval: 0.005,
    verificationInterval: 0.005,
    accuracyClass: 'III',
  });
  assert(validInst.isValid, 'Validation - Normal Class III NAWI', '15kg, e=5g should be valid');

  const invalidMin = validateInstrumentParameters({
    maxCapacity: 10,
    minCapacity: 12,
    scaleInterval: 0.01,
    verificationInterval: 0.01,
    accuracyClass: 'III',
  });
  assert(!invalidMin.isValid, 'Validation - Min > Max Detection', 'Min > Max must produce validation error');

  // 2. Class III MPE Brackets
  // Class III: 0-500e (±0.5e), 500-2000e (±1.0e), >2000e (±1.5e)
  // For e = 0.005 kg:
  // 500e = 2.5 kg -> MPE = 0.5e = 0.0025 kg
  // 1500e = 7.5 kg -> MPE = 1.0e = 0.005 kg
  // 3000e = 15.0 kg -> MPE = 1.5e = 0.0075 kg
  const mpeStep1 = calculateMPE(1.0, 'III', 0.005);
  assert(mpeStep1.mpeValueInE === 0.5, 'MPE Class III Step 1', '1.0 kg is 200e <= 500e, mpe must be 0.5e');

  const mpeStep2 = calculateMPE(7.5, 'III', 0.005);
  assert(mpeStep2.mpeValueInE === 1.0, 'MPE Class III Step 2', '7.5 kg is 1500e (500e-2000e), mpe must be 1.0e');

  const mpeStep3 = calculateMPE(15.0, 'III', 0.005);
  assert(mpeStep3.mpeValueInE === 1.5, 'MPE Class III Step 3', '15.0 kg is 3000e (>2000e), mpe must be 1.5e');

  // 3. Class I Analytical Balance MPE Brackets
  // Class I: 0-50,000e (±0.5e), 50,000-200,000e (±1.0e), >200,000e (±1.5e)
  const mpeClassI_Low = calculateMPE(40, 'I', 0.001); // 40,000 e
  assert(mpeClassI_Low.mpeValueInE === 0.5, 'MPE Class I Tier 1', '40k e <= 50k e must be 0.5e');

  const mpeClassI_Mid = calculateMPE(100, 'I', 0.001); // 100,000 e
  assert(mpeClassI_Mid.mpeValueInE === 1.0, 'MPE Class I Tier 2', '100k e must be 1.0e');

  const mpeClassI_High = calculateMPE(210, 'I', 0.001); // 210,000 e
  assert(mpeClassI_High.mpeValueInE === 1.5, 'MPE Class I Tier 3', '210k e must be 1.5e');

  // 4. Weighing Error calculation (Direct digital reading)
  const errDirect = calculateWeighingError(10.0, 10.005, 0.005, 'III');
  assert(errDirect.errorE === 0.005, 'Weighing Error Direct', '10.005 - 10.0 = 0.005');
  assert(errDirect.verdict === 'pass', 'Weighing Error MPE Check', 'Error 0.005 is within ±0.005 MPE');

  // 5. Weighing Error calculation with continuous changeover weights ΔL
  // P = I + 0.5e - ΔL = 10.0 + 0.0025 - 0.002 = 10.0005
  // E = P - L = 10.0005 - 10.0 = 0.0005
  const errTurning = calculateWeighingError(10.0, 10.0, 0.005, 'III', 0.002, 0.0);
  assert(Math.abs(errTurning.errorE - 0.0005) < 1e-6, 'Weighing Error Turning Point', 'Calculated P continuous error');

  // 6. Repeatability Evaluation
  const repPass = evaluateRepeatabilitySeries(7.5, [7.5, 7.5, 7.505], 'III', 0.005);
  assert(repPass.verdict === 'pass', 'Repeatability within MPE', 'Range 0.005 <= MPE 0.005');

  const repFail = evaluateRepeatabilitySeries(7.5, [7.5, 7.515], 'III', 0.005);
  assert(repFail.verdict === 'fail', 'Repeatability exceeds MPE', 'Range 0.015 > MPE 0.005');

  // 7. Discrimination Test
  const discPass = evaluateDiscrimination(7.5, 7.505, 0.005);
  assert(discPass.verdict === 'pass', 'Discrimination >= 1d', 'Observed change 0.005 >= 0.005 (1d)');

  const discFail = evaluateDiscrimination(7.5, 7.5, 0.005);
  assert(discFail.verdict === 'fail', 'Discrimination failed (no change)', 'Observed change 0 < 1d');

  // 8. Zero Setting Residual Error
  const zeroPass = evaluateZeroSetting(0.001, 0.005);
  assert(zeroPass.verdict === 'pass', 'Zero Setting within 0.25e', '0.001 <= 0.00125 (0.25 * 0.005)');

  const zeroFail = evaluateZeroSetting(0.002, 0.005);
  assert(zeroFail.verdict === 'fail', 'Zero Setting exceeds 0.25e', '0.002 > 0.00125');

  const passedCount = testResults.filter((r) => r.passed).length;
  return {
    allPassed: passedCount === testResults.length,
    totalTests: testResults.length,
    passedCount,
    results: testResults,
  };
}
