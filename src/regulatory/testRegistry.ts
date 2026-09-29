/**
 * METRALAB - OIML R 76-1 (2006) Test Procedure Catalog
 * Aligned with Non-Automatic Weighing Instruments standards
 * and Legal Metrology Act, 2009 / Rules 2011.
 */

import { TestProcedureMeta, RegulatoryRule } from '../types';

export const OIML_R76_PROCEDURES: TestProcedureMeta[] = [
  {
    id: 'oiml_a441_weighing',
    code: 'OIML R 76-1: A.4.4.1',
    title: 'Weighing Performance Test',
    clause: 'Clause 3.5.1 & Annex A.4.4.1',
    description:
      'Evaluation of indication errors across the full measuring range (Zero → Max → Zero) with at least 5 to 10 test load steps, checking against Maximum Permissible Errors (MPE Table 6).',
    applicableClasses: ['I', 'II', 'III', 'IIII'],
    isMandatory: true,
    edition: 'OIML R 76-1 (2006) / LM Rules 2011',
  },
  {
    id: 'oiml_a442_repeatability',
    code: 'OIML R 76-1: A.4.4.2',
    title: 'Repeatability Test',
    clause: 'Clause 3.6.1 & Annex A.4.4.2',
    description:
      'Two series of weighings, one at approximately 0.5 Max and one at approximately 1.0 Max (or 0.8 Max). The difference between the results of several weighings of the same load shall not exceed |MPE|.',
    applicableClasses: ['I', 'II', 'III', 'IIII'],
    isMandatory: true,
    edition: 'OIML R 76-1 (2006)',
  },
  {
    id: 'oiml_a47_eccentricity',
    code: 'OIML R 76-1: A.4.7',
    title: 'Eccentricity (Corner Load) Test',
    clause: 'Clause 3.6.2 & Annex A.4.7',
    description:
      'Application of test load (typically 1/3 Max for instruments with 4 points of support) successively at center, front-left, back-left, back-right, and front-right of the load receptor. Errors shall not exceed MPE.',
    applicableClasses: ['I', 'II', 'III', 'IIII'],
    isMandatory: true,
    edition: 'OIML R 76-1 (2006)',
  },
  {
    id: 'oiml_a45_discrimination',
    code: 'OIML R 76-1: A.4.5',
    title: 'Discrimination / Sensitivity Test',
    clause: 'Clause 3.8 & Annex A.4.5',
    description:
      'Verification that an extra load equal to 1.4 d placed gently on the loaded instrument receptor (at Min, 0.5 Max, and Max) produces a definite change in indication of at least 1.0 d.',
    applicableClasses: ['I', 'II', 'III', 'IIII'],
    isMandatory: true,
    edition: 'OIML R 76-1 (2006)',
  },
  {
    id: 'oiml_a48_zero_setting',
    code: 'OIML R 76-1: A.4.8',
    title: 'Zero-Setting & Zero-Tracking Accuracy',
    clause: 'Clause 3.9 & Annex A.4.8',
    description:
      'Determination of residual error after zero-setting. The zero-setting device shall bring the indication to zero within ±0.25 e. Automatic zero-tracking speed and range verification.',
    applicableClasses: ['I', 'II', 'III', 'IIII'],
    isMandatory: true,
    edition: 'OIML R 76-1 (2006)',
  },
  {
    id: 'oiml_a443_tare',
    code: 'OIML R 76-1: A.4.4.3',
    title: 'Tare Balancing & Tare Weighing Test',
    clause: 'Clause 3.6.3 & Annex A.4.4.3',
    description:
      'Verification of tare device accuracy and tare balancing under combined tare and net load, ensuring errors comply with applicable MPE.',
    applicableClasses: ['I', 'II', 'III', 'IIII'],
    isMandatory: false,
    edition: 'OIML R 76-1 (2006)',
  },
  {
    id: 'oiml_a531_temperature',
    code: 'OIML R 76-1: A.5.3.1',
    title: 'Static Temperature Influence Factor Test',
    clause: 'Clause 3.9.2.2 & Annex A.5.3.1',
    description:
      'Climatic chamber evaluation across specified temperature limits (-10°C to +40°C or declared range). Verifies zero drift (max 1 e per 5°C) and span error within MPE.',
    applicableClasses: ['I', 'II', 'III'],
    isMandatory: false,
    edition: 'OIML R 76-1 (2006)',
  },
  {
    id: 'oiml_clauses4_functional',
    code: 'OIML R 76-1: Clause 4',
    title: 'Technical & Functional Requirements Inspection',
    clause: 'Clause 4 (Design & Construction)',
    description:
      'Visual and physical inspection of level-indicating device, leveling feet, security seals, descriptive markings, software version display, and warm-up time indication.',
    applicableClasses: ['I', 'II', 'III', 'IIII'],
    isMandatory: true,
    edition: 'OIML R 76-1 (2006)',
  },
];

export const REGULATORY_RULES_LIBRARY: RegulatoryRule[] = [
  {
    id: 'rule_oiml_r76_2006',
    code: 'OIML R 76-1: 2006 (E)',
    title: 'Non-automatic weighing instruments - Part 1: Metrological and technical requirements - Tests',
    issuingAuthority: 'International Organization of Legal Metrology (OIML)',
    edition: 'Edition 2006 (E)',
    effectiveDate: '2006-10-01',
    status: 'active_verified',
    clausesSummary:
      'Covers terminology, classification (Classes I, II, III, IIII), maximum permissible errors (Table 6), test procedures (Annex A), influence factors, and examination of electronic devices.',
    sourceDocUrl: 'https://www.oiml.org/en/files/pdf_r/r076-1-e06.pdf',
    mpeTablesDescription:
      'Class I (0-50ke: ±0.5e, 50k-200ke: ±1.0e, >200ke: ±1.5e); Class II (0-5ke: ±0.5e, 5k-20ke: ±1.0e, 20k-100ke: ±1.5e); Class III (0-500e: ±0.5e, 500-2000e: ±1.0e, 2000-10000e: ±1.5e); Class IIII (0-50e: ±0.5e, 50-200e: ±1.0e, 200-1000e: ±1.5e).',
  },
  {
    id: 'rule_oiml_r76_2_2007',
    code: 'OIML R 76-2: 2007 (E)',
    title: 'Non-automatic weighing instruments - Part 2: Pattern evaluation report format',
    issuingAuthority: 'International Organization of Legal Metrology (OIML)',
    edition: 'Edition 2007 (E)',
    effectiveDate: '2007-06-01',
    status: 'active_verified',
    clausesSummary:
      'Standardized reporting template and pattern evaluation report forms: administrative data, technical specifications, and structured observation tables for each test sequence.',
    sourceDocUrl: 'https://www.oiml.org/en/files/pdf_r/r076-2-e07.pdf',
    mpeTablesDescription: 'Report formats corresponding to Part 1 test protocols.',
  },
  {
    id: 'rule_in_lm_act_2009',
    code: 'Legal Metrology Act, 2009 (No. 1 of 2010)',
    title: 'The Legal Metrology Act, 2009',
    issuingAuthority: 'Ministry of Consumer Affairs, Food and Public Distribution, Government of India',
    edition: 'Act No. 1 of 2010 (Enacted 13 Jan 2010)',
    effectiveDate: '2011-04-01',
    status: 'active_verified',
    clausesSummary:
      'Section 22 (Approval of Model) mandates that every person manufacturing or importing weights or measures shall obtain model approval before manufacturing or importing.',
    mpeTablesDescription: 'Enforces Indian conformity with Seventh Schedule and OIML R 76 norms.',
  },
  {
    id: 'rule_in_lm_rules_2011',
    code: 'Legal Metrology (General) Rules, 2011 - Seventh Schedule',
    title: 'Non-Automatic Weighing Instruments - Specifications and Verification',
    issuingAuthority: 'Department of Consumer Affairs, Govt. of India',
    edition: 'G.S.R. 71(E) as amended',
    effectiveDate: '2011-04-01',
    status: 'active_verified',
    clausesSummary:
      'Part I: Electronic Weighing Instruments. Harmonized directly with OIML R 76. Prescribes test procedures for pattern approval and stamping.',
    mpeTablesDescription: 'Harmonized identical MPE tables for Class I, II, III and IIII with OIML R 76-1.',
  },
  {
    id: 'rule_iso_17025_2017',
    code: 'ISO/IEC 17025:2017',
    title: 'General requirements for the competence of testing and calibration laboratories',
    issuingAuthority: 'ISO/CASCO',
    edition: '3rd Edition 2017',
    effectiveDate: '2017-11-30',
    status: 'active_verified',
    clausesSummary:
      'Clause 7.8: Reporting of results, traceability of reference standards, validation of software tools, and digital records integrity.',
    mpeTablesDescription: 'Quality management and calibration traceability standard.',
  },
];
